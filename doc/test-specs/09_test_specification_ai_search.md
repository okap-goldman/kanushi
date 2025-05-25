# AIチャット・検索機能 テスト仕様書

## 概要
本ドキュメントは、AIチャット・検索機能のTDD実装のための詳細なテスト仕様書です。
Claude Codeによる実装時の品質保証と動作検証を目的としています。

## テスト環境

### 使用ライブラリ
- jest-expo@~53.0.0
- @testing-library/react-native@^13
- @testing-library/jest-native@^6
- react-native-reanimated/mock
- MSW (Mock Service Worker) for API mocking

### テスト方針
- ミニマルモッキング：必要最小限のモックのみ使用
- 実際の動作に近いテストを優先
- 非同期処理は適切にawaitする
- エラーケースを網羅的にテスト

## 1. API単体テスト

### 1.1 検索API (`searchService.test.ts`)

```typescript
describe('SearchService', () => {
  describe('searchAll', () => {
    it('should search users, posts, and hashtags with keyword', async () => {
      // Arrange
      const keyword = '目醒め';
      const expected = {
        users: [{ id: '1', username: 'awakened_one' }],
        posts: [{ id: '1', content: '目醒めの瞬間' }],
        hashtags: [{ name: '目醒め', count: 10 }]
      };

      // Act
      const result = await searchService.searchAll(keyword);

      // Assert
      expect(result).toEqual(expected);
    });

    it('should handle empty search results', async () => {
      const result = await searchService.searchAll('存在しないキーワード');
      expect(result.users).toHaveLength(0);
      expect(result.posts).toHaveLength(0);
      expect(result.hashtags).toHaveLength(0);
    });

    it('should validate search keyword length', async () => {
      await expect(searchService.searchAll('a')).rejects.toThrow('Search keyword must be at least 2 characters');
    });

    it('should save search history', async () => {
      const keyword = 'スピリチュアル';
      await searchService.searchAll(keyword);
      
      const history = await searchService.getSearchHistory();
      expect(history[0].keyword).toBe(keyword);
    });
  });

  describe('searchUsers', () => {
    it('should return paginated user results', async () => {
      const result = await searchService.searchUsers('user', { limit: 10 });
      expect(result.data).toHaveLength(10);
      expect(result.hasMore).toBeDefined();
      expect(result.cursor).toBeDefined();
    });

    it('should filter by location', async () => {
      const result = await searchService.searchUsers('user', { location: '東京' });
      result.data.forEach(user => {
        expect(user.location).toContain('東京');
      });
    });
  });

  describe('searchPosts', () => {
    it('should search posts by content', async () => {
      const result = await searchService.searchPosts('覚醒');
      result.data.forEach(post => {
        expect(post.content.toLowerCase()).toContain('覚醒');
      });
    });

    it('should filter by media type', async () => {
      const result = await searchService.searchPosts('音声', { mediaType: 'AUDIO' });
      result.data.forEach(post => {
        expect(post.media_type).toBe('AUDIO');
      });
    });

    it('should search within date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const result = await searchService.searchPosts('瞑想', { startDate, endDate });
      
      result.data.forEach(post => {
        const postDate = new Date(post.created_at);
        expect(postDate).toBeAfterOrEqual(startDate);
        expect(postDate).toBeBeforeOrEqual(endDate);
      });
    });
  });

  describe('searchHashtags', () => {
    it('should return hashtags with usage count', async () => {
      const result = await searchService.searchHashtags('スピ');
      result.forEach(tag => {
        expect(tag.name).toMatch(/^#スピ/);
        expect(tag.count).toBeGreaterThan(0);
      });
    });

    it('should sort by usage count', async () => {
      const result = await searchService.searchHashtags('');
      for (let i = 1; i < result.length; i++) {
        expect(result[i-1].count).toBeGreaterThanOrEqual(result[i].count);
      }
    });
  });
});
```

### 1.2 AIチャットAPI (`chatService.test.ts`)

```typescript
describe('ChatService', () => {
  describe('createSession', () => {
    it('should create a new chat session', async () => {
      const session = await chatService.createSession('AIアシスタントについて');
      
      expect(session.id).toBeDefined();
      expect(session.title).toBe('AIアシスタントについて');
      expect(session.created_at).toBeDefined();
    });

    it('should auto-generate title if not provided', async () => {
      const session = await chatService.createSession();
      expect(session.title).toMatch(/^新しいチャット/);
    });
  });

  describe('sendMessage', () => {
    it('should send message and receive AI response', async () => {
      const sessionId = 'test-session-id';
      const message = '目醒めとは何ですか？';
      
      const response = await chatService.sendMessage(sessionId, message);
      
      expect(response.role).toBe('assistant');
      expect(response.content).toBeDefined();
      expect(response.content.length).toBeGreaterThan(0);
    });

    it('should maintain conversation context', async () => {
      const sessionId = 'test-session-id';
      
      await chatService.sendMessage(sessionId, '私の名前は太郎です');
      const response = await chatService.sendMessage(sessionId, '私の名前を覚えていますか？');
      
      expect(response.content).toContain('太郎');
    });

    it('should handle search integration', async () => {
      const sessionId = 'test-session-id';
      const response = await chatService.sendMessage(
        sessionId, 
        '最近の瞑想に関する投稿を教えて'
      );
      
      expect(response.content).toContain('投稿');
      expect(response.metadata?.searchResults).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      // Mock Gemini API error
      const sessionId = 'test-session-id';
      await expect(
        chatService.sendMessage(sessionId, 'エラーを発生させる')
      ).rejects.toThrow('AI service temporarily unavailable');
    });

    it('should enforce message length limit', async () => {
      const longMessage = 'あ'.repeat(5001);
      await expect(
        chatService.sendMessage('session-id', longMessage)
      ).rejects.toThrow('Message exceeds maximum length');
    });
  });

  describe('getSessionHistory', () => {
    it('should retrieve all messages in session', async () => {
      const sessionId = 'test-session-id';
      const messages = await chatService.getSessionHistory(sessionId);
      
      expect(Array.isArray(messages)).toBe(true);
      messages.forEach(msg => {
        expect(msg.role).toMatch(/^(user|assistant)$/);
        expect(msg.content).toBeDefined();
      });
    });

    it('should return messages in chronological order', async () => {
      const messages = await chatService.getSessionHistory('session-id');
      
      for (let i = 1; i < messages.length; i++) {
        const prev = new Date(messages[i-1].created_at);
        const curr = new Date(messages[i].created_at);
        expect(curr).toBeAfterOrEqual(prev);
      }
    });
  });

  describe('deleteSession', () => {
    it('should delete session and all messages', async () => {
      const sessionId = 'test-session-id';
      await chatService.deleteSession(sessionId);
      
      await expect(
        chatService.getSessionHistory(sessionId)
      ).rejects.toThrow('Session not found');
    });
  });
});
```

### 1.3 AI キュレーター API (`aiCuratorService.test.ts`)

```typescript
describe('AICuratorService', () => {
  describe('generatePlaylist', () => {
    it('should generate personalized playlist', async () => {
      const userId = 'test-user-id';
      const playlist = await aiCuratorService.generatePlaylist(userId);
      
      expect(playlist.id).toBeDefined();
      expect(playlist.title).toMatch(/今日のおすすめ/);
      expect(playlist.posts).toHaveLength(5); // 5-10件
      expect(playlist.generated_at).toBeDefined();
    });

    it('should include diverse content types', async () => {
      const playlist = await aiCuratorService.generatePlaylist('user-id');
      
      const mediaTypes = playlist.posts.map(p => p.media_type);
      expect(new Set(mediaTypes).size).toBeGreaterThan(1);
    });

    it('should consider user preferences', async () => {
      // Mock user with specific interests
      const userId = 'meditation-lover';
      const playlist = await aiCuratorService.generatePlaylist(userId);
      
      const meditationPosts = playlist.posts.filter(p => 
        p.content.includes('瞑想') || p.hashtags.includes('#瞑想')
      );
      expect(meditationPosts.length).toBeGreaterThan(0);
    });

    it('should not repeat recent recommendations', async () => {
      const userId = 'test-user';
      const playlist1 = await aiCuratorService.generatePlaylist(userId);
      const playlist2 = await aiCuratorService.generatePlaylist(userId);
      
      const ids1 = new Set(playlist1.posts.map(p => p.id));
      const ids2 = new Set(playlist2.posts.map(p => p.id));
      
      const overlap = [...ids1].filter(id => ids2.has(id));
      expect(overlap.length).toBe(0);
    });
  });

  describe('generateMyRadio', () => {
    it('should create audio-only playlist', async () => {
      const radio = await aiCuratorService.generateMyRadio('user-id');
      
      expect(radio.id).toBeDefined();
      expect(radio.title).toBe('MyRadio');
      radio.posts.forEach(post => {
        expect(post.media_type).toBe('AUDIO');
      });
    });

    it('should optimize for continuous listening', async () => {
      const radio = await aiCuratorService.generateMyRadio('user-id');
      
      // Check total duration is between 30-60 minutes
      const totalDuration = radio.posts.reduce((sum, p) => sum + p.duration, 0);
      expect(totalDuration).toBeGreaterThanOrEqual(1800); // 30 min
      expect(totalDuration).toBeLessThanOrEqual(3600); // 60 min
    });

    it('should include offline cache metadata', async () => {
      const radio = await aiCuratorService.generateMyRadio('user-id');
      
      expect(radio.metadata.offlineAvailable).toBe(true);
      expect(radio.metadata.cacheSize).toBeDefined();
    });
  });

  describe('CRON execution', () => {
    it('should execute at 5:00 JST', async () => {
      // Mock date to 5:00 JST
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-20T20:00:00Z')); // 5:00 JST
      
      const spy = jest.spyOn(aiCuratorService, 'executeDailyCuration');
      
      // Trigger CRON
      await aiCuratorService.checkAndExecuteCron();
      
      expect(spy).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('should process all active users', async () => {
      const processedUsers = await aiCuratorService.executeDailyCuration();
      
      expect(processedUsers.length).toBeGreaterThan(0);
      expect(processedUsers.every(u => u.success)).toBe(true);
    });

    it('should handle failures gracefully', async () => {
      // Mock some user failures
      const results = await aiCuratorService.executeDailyCuration();
      
      const failures = results.filter(r => !r.success);
      failures.forEach(f => {
        expect(f.error).toBeDefined();
        expect(f.retry_count).toBeLessThanOrEqual(3);
      });
    });
  });
});
```

### 1.4 ヒットチャート API (`hitChartService.test.ts`)

```typescript
describe('HitChartService', () => {
  describe('getOverallChart', () => {
    it('should return top 50 posts', async () => {
      const chart = await hitChartService.getOverallChart();
      
      expect(chart.posts).toHaveLength(50);
      expect(chart.period).toEqual({
        start: expect.any(String),
        end: expect.any(String)
      });
    });

    it('should calculate engagement score correctly', async () => {
      const chart = await hitChartService.getOverallChart();
      
      chart.posts.forEach(post => {
        const expectedScore = 
          post.likes_count + 
          post.comments_count * 2 + 
          post.highlights_count * 3;
        expect(post.engagement_score).toBe(expectedScore);
      });
    });

    it('should sort by engagement score', async () => {
      const chart = await hitChartService.getOverallChart();
      
      for (let i = 1; i < chart.posts.length; i++) {
        expect(chart.posts[i-1].engagement_score)
          .toBeGreaterThanOrEqual(chart.posts[i].engagement_score);
      }
    });
  });

  describe('getTrendingChart', () => {
    it('should return top 20 trending posts', async () => {
      const chart = await hitChartService.getTrendingChart();
      
      expect(chart.posts).toHaveLength(20);
      expect(chart.algorithm).toBe('velocity');
    });

    it('should calculate velocity correctly', async () => {
      const chart = await hitChartService.getTrendingChart();
      
      chart.posts.forEach(post => {
        expect(post.velocity_score).toBeGreaterThan(0);
        expect(post.hours_since_post).toBeLessThanOrEqual(24);
      });
    });

    it('should prioritize recent viral content', async () => {
      const chart = await hitChartService.getTrendingChart();
      const topPost = chart.posts[0];
      
      expect(topPost.hours_since_post).toBeLessThanOrEqual(12);
      expect(topPost.velocity_score).toBeGreaterThan(100);
    });
  });

  describe('AI summaries', () => {
    it('should include AI-generated summaries', async () => {
      const chart = await hitChartService.getOverallChart();
      
      chart.posts.forEach(post => {
        expect(post.ai_summary).toBeDefined();
        expect(post.ai_summary.length).toBeLessThanOrEqual(200);
      });
    });

    it('should generate appropriate tags', async () => {
      const chart = await hitChartService.getOverallChart();
      
      chart.posts.forEach(post => {
        expect(post.ai_tags).toBeDefined();
        expect(Array.isArray(post.ai_tags)).toBe(true);
        expect(post.ai_tags.length).toBeLessThanOrEqual(5);
      });
    });
  });
});
```

## 2. UI単体テスト

### 2.1 検索画面 (`Search.test.tsx`)

```typescript
describe('Search Screen', () => {
  it('should render search input and tabs', () => {
    const { getByPlaceholderText, getByText } = render(<Search />);
    
    expect(getByPlaceholderText('検索')).toBeTruthy();
    expect(getByText('すべて')).toBeTruthy();
    expect(getByText('ユーザー')).toBeTruthy();
    expect(getByText('投稿')).toBeTruthy();
    expect(getByText('タグ')).toBeTruthy();
  });

  it('should display search suggestions', async () => {
    const { getByPlaceholderText, findByText } = render(<Search />);
    
    const input = getByPlaceholderText('検索');
    fireEvent.changeText(input, '瞑想');
    
    await waitFor(() => {
      expect(findByText('#瞑想')).toBeTruthy();
      expect(findByText('#瞑想法')).toBeTruthy();
    });
  });

  it('should perform search on submit', async () => {
    const { getByPlaceholderText, getByTestId, findByText } = render(<Search />);
    
    const input = getByPlaceholderText('検索');
    fireEvent.changeText(input, 'スピリチュアル');
    fireEvent(input, 'submitEditing');
    
    await waitFor(() => {
      expect(findByText(/\d+件の結果/)).toBeTruthy();
    });
  });

  it('should switch between tabs', async () => {
    const { getByText, getByTestId } = render(<Search />);
    
    // Initial state - "すべて" tab
    expect(getByTestId('all-results')).toBeTruthy();
    
    // Switch to users tab
    fireEvent.press(getByText('ユーザー'));
    await waitFor(() => {
      expect(getByTestId('user-results')).toBeTruthy();
    });
  });

  it('should display loading state', async () => {
    const { getByPlaceholderText, getByTestId } = render(<Search />);
    
    const input = getByPlaceholderText('検索');
    fireEvent.changeText(input, 'test');
    fireEvent(input, 'submitEditing');
    
    expect(getByTestId('loading-spinner')).toBeTruthy();
  });

  it('should handle empty results', async () => {
    const { getByPlaceholderText, findByText } = render(<Search />);
    
    const input = getByPlaceholderText('検索');
    fireEvent.changeText(input, 'xyz123nonexistent');
    fireEvent(input, 'submitEditing');
    
    await waitFor(() => {
      expect(findByText('検索結果が見つかりませんでした')).toBeTruthy();
    });
  });

  it('should save search history', async () => {
    const { getByPlaceholderText, findByText } = render(<Search />);
    
    const input = getByPlaceholderText('検索');
    fireEvent.changeText(input, 'ヨガ');
    fireEvent(input, 'submitEditing');
    
    // Clear and focus input again
    fireEvent.changeText(input, '');
    fireEvent(input, 'focus');
    
    await waitFor(() => {
      expect(findByText('最近の検索')).toBeTruthy();
      expect(findByText('ヨガ')).toBeTruthy();
    });
  });
});
```

### 2.2 AIチャット画面 (`AIChat.test.tsx`)

```typescript
describe('AIChat Screen', () => {
  it('should render chat interface', () => {
    const { getByPlaceholderText, getByText } = render(<AIChat />);
    
    expect(getByText('AIアシスタント')).toBeTruthy();
    expect(getByPlaceholderText('メッセージを入力...')).toBeTruthy();
  });

  it('should send and display messages', async () => {
    const { getByPlaceholderText, getByTestId, findByText } = render(<AIChat />);
    
    const input = getByPlaceholderText('メッセージを入力...');
    const sendButton = getByTestId('send-button');
    
    fireEvent.changeText(input, 'こんにちは');
    fireEvent.press(sendButton);
    
    // User message should appear
    await waitFor(() => {
      expect(findByText('こんにちは')).toBeTruthy();
    });
    
    // AI response should appear
    await waitFor(() => {
      expect(findByText(/こんにちは.*お手伝い/)).toBeTruthy();
    });
  });

  it('should show typing indicator', async () => {
    const { getByPlaceholderText, getByTestId, findByTestId } = render(<AIChat />);
    
    const input = getByPlaceholderText('メッセージを入力...');
    fireEvent.changeText(input, 'test');
    fireEvent(input, 'submitEditing');
    
    await waitFor(() => {
      expect(findByTestId('typing-indicator')).toBeTruthy();
    });
  });

  it('should handle quick actions', async () => {
    const { getByText, findByText } = render(<AIChat />);
    
    fireEvent.press(getByText('おすすめの投稿'));
    
    await waitFor(() => {
      expect(findByText(/最近の人気投稿/)).toBeTruthy();
    });
  });

  it('should create new chat session', async () => {
    const { getByTestId, queryByText } = render(<AIChat />);
    
    // Send first message
    const input = getByTestId('message-input');
    fireEvent.changeText(input, 'First message');
    fireEvent(input, 'submitEditing');
    
    // Create new session
    fireEvent.press(getByTestId('new-chat-button'));
    
    // Previous message should not be visible
    await waitFor(() => {
      expect(queryByText('First message')).toBeNull();
    });
  });

  it('should display session history', async () => {
    const { getByTestId, findByText } = render(<AIChat />);
    
    fireEvent.press(getByTestId('history-button'));
    
    await waitFor(() => {
      expect(findByText('チャット履歴')).toBeTruthy();
      expect(findByText(/今日/)).toBeTruthy();
    });
  });

  it('should handle errors gracefully', async () => {
    // Mock network error
    const { getByPlaceholderText, findByText } = render(<AIChat />);
    
    const input = getByPlaceholderText('メッセージを入力...');
    fireEvent.changeText(input, 'error trigger');
    fireEvent(input, 'submitEditing');
    
    await waitFor(() => {
      expect(findByText('エラーが発生しました')).toBeTruthy();
      expect(findByText('再試行')).toBeTruthy();
    });
  });
});
```

### 2.3 ディスカバー画面 (`Discover.test.tsx`)

```typescript
describe('Discover Screen', () => {
  it('should render all sections', () => {
    const { getByText } = render(<Discover />);
    
    expect(getByText('総合Top 50')).toBeTruthy();
    expect(getByText('急上昇Top 20')).toBeTruthy();
    expect(getByText('MyRadio')).toBeTruthy();
    expect(getByText('今日のおすすめ')).toBeTruthy();
  });

  it('should load hit charts', async () => {
    const { findByTestId } = render(<Discover />);
    
    await waitFor(() => {
      const overallChart = findByTestId('overall-chart');
      const trendingChart = findByTestId('trending-chart');
      
      expect(overallChart.children.length).toBe(50);
      expect(trendingChart.children.length).toBe(20);
    });
  });

  it('should play MyRadio', async () => {
    const { getByTestId, findByTestId } = render(<Discover />);
    
    const playButton = getByTestId('myradio-play');
    fireEvent.press(playButton);
    
    await waitFor(() => {
      expect(findByTestId('audio-player')).toBeTruthy();
      expect(findByTestId('now-playing')).toBeTruthy();
    });
  });

  it('should navigate to post detail', async () => {
    const navigation = { navigate: jest.fn() };
    const { getByTestId } = render(<Discover navigation={navigation} />);
    
    await waitFor(() => {
      const firstPost = getByTestId('chart-post-0');
      fireEvent.press(firstPost);
    });
    
    expect(navigation.navigate).toHaveBeenCalledWith('PostDetail', {
      postId: expect.any(String)
    });
  });

  it('should refresh on pull', async () => {
    const { getByTestId } = render(<Discover />);
    
    const scrollView = getByTestId('discover-scroll');
    fireEvent(scrollView, 'refresh');
    
    await waitFor(() => {
      expect(getByTestId('refreshing')).toBeTruthy();
    });
    
    await waitFor(() => {
      expect(queryByTestId('refreshing')).toBeNull();
    });
  });

  it('should handle offline mode', async () => {
    // Mock offline
    NetInfo.fetch.mockResolvedValueOnce({ isConnected: false });
    
    const { findByText } = render(<Discover />);
    
    await waitFor(() => {
      expect(findByText('オフラインモード')).toBeTruthy();
      expect(findByText('キャッシュされたコンテンツを表示')).toBeTruthy();
    });
  });
});
```

## 3. 統合テスト

### 3.1 検索フロー統合テスト

```typescript
describe('Search Flow Integration', () => {
  it('should complete full search flow', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<App />);
    
    // Navigate to search
    fireEvent.press(getByTestId('search-tab'));
    
    // Perform search
    const searchInput = getByPlaceholderText('検索');
    fireEvent.changeText(searchInput, 'awakening');
    fireEvent(searchInput, 'submitEditing');
    
    // Verify results appear
    await waitFor(() => {
      expect(findByText(/\d+件の結果/)).toBeTruthy();
    });
    
    // Switch to posts tab
    fireEvent.press(getByText('投稿'));
    
    // Select a post
    const firstPost = await findByTestId('post-0');
    fireEvent.press(firstPost);
    
    // Verify navigation to post detail
    await waitFor(() => {
      expect(findByTestId('post-detail')).toBeTruthy();
    });
  });

  it('should integrate search with AI chat', async () => {
    const { getByTestId, getByPlaceholderText, findByText } = render(<App />);
    
    // Navigate to AI chat
    fireEvent.press(getByTestId('ai-chat-button'));
    
    // Ask about recent posts
    const input = getByPlaceholderText('メッセージを入力...');
    fireEvent.changeText(input, '瞑想に関する最近の投稿を探して');
    fireEvent(input, 'submitEditing');
    
    // Verify search results in response
    await waitFor(() => {
      expect(findByText(/瞑想.*投稿.*見つかりました/)).toBeTruthy();
      expect(findByTestId('search-results')).toBeTruthy();
    });
  });
});
```

### 3.2 AIキュレーション統合テスト

```typescript
describe('AI Curation Integration', () => {
  it('should generate and display personalized content', async () => {
    const { getByTestId, findByText } = render(<App />);
    
    // Login user with preferences
    await loginUser({ interests: ['瞑想', 'ヨガ'] });
    
    // Navigate to discover
    fireEvent.press(getByTestId('discover-tab'));
    
    // Verify personalized playlist
    await waitFor(() => {
      const playlist = getByTestId('personal-playlist');
      expect(playlist).toBeTruthy();
      
      // Should contain content matching interests
      expect(findByText(/瞑想/)).toBeTruthy();
    });
  });

  it('should update recommendations based on interactions', async () => {
    const { getByTestId } = render(<App />);
    
    // Like several meditation posts
    const meditationPosts = await findAllByTestId(/meditation-post/);
    meditationPosts.slice(0, 3).forEach(post => {
      fireEvent.press(post.querySelector('[data-testid="like-button"]'));
    });
    
    // Wait for next curation cycle
    await waitFor(() => {
      // Next playlist should have more meditation content
      const playlist = getByTestId('personal-playlist');
      const meditationCount = playlist.querySelectorAll(/瞑想/).length;
      expect(meditationCount).toBeGreaterThan(3);
    });
  });
});
```

### 3.3 オフライン統合テスト

```typescript
describe('Offline Integration', () => {
  it('should cache MyRadio for offline playback', async () => {
    const { getByTestId, findByText } = render(<App />);
    
    // Generate MyRadio while online
    fireEvent.press(getByTestId('myradio-generate'));
    await waitFor(() => {
      expect(findByText('MyRadio生成完了')).toBeTruthy();
    });
    
    // Go offline
    await NetInfo.fetch.mockResolvedValueOnce({ isConnected: false });
    
    // Should still play
    fireEvent.press(getByTestId('myradio-play'));
    expect(getByTestId('audio-player')).toBeTruthy();
  });

  it('should sync search history when back online', async () => {
    const { getByPlaceholderText } = render(<App />);
    
    // Perform searches while offline
    await NetInfo.fetch.mockResolvedValueOnce({ isConnected: false });
    
    const input = getByPlaceholderText('検索');
    fireEvent.changeText(input, 'オフライン検索1');
    fireEvent(input, 'submitEditing');
    
    // Go back online
    await NetInfo.fetch.mockResolvedValueOnce({ isConnected: true });
    
    // Verify sync
    await waitFor(() => {
      const syncStatus = getByTestId('sync-status');
      expect(syncStatus).toHaveTextContent('同期完了');
    });
  });
});
```

## 4. E2Eテスト

### 4.1 検索からアクションまでのE2Eテスト

```typescript
describe('Search to Action E2E', () => {
  it('should search, find user, follow, and see in timeline', async () => {
    // Start from home
    await device.launchApp();
    
    // Navigate to search
    await element(by.id('search-tab')).tap();
    
    // Search for specific user
    await element(by.id('search-input')).typeText('目醒め太郎');
    await element(by.id('search-button')).tap();
    
    // Switch to users tab
    await element(by.text('ユーザー')).tap();
    
    // Tap on user
    await waitFor(element(by.text('目醒め太郎')))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.text('目醒め太郎')).tap();
    
    // Follow user
    await element(by.id('follow-button')).tap();
    await element(by.id('follow-reason')).typeText('素晴らしい投稿が多いから');
    await element(by.text('フォロー')).tap();
    
    // Go back to timeline
    await element(by.id('home-tab')).tap();
    
    // Verify user's posts appear
    await waitFor(element(by.text('目醒め太郎')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

### 4.2 AIチャット活用E2Eテスト

```typescript
describe('AI Chat Usage E2E', () => {
  it('should get recommendations and interact with content', async () => {
    await device.launchApp();
    
    // Open AI chat
    await element(by.id('ai-chat-button')).tap();
    
    // Ask for recommendations
    await element(by.id('chat-input')).typeText('今日のおすすめ投稿を教えて');
    await element(by.id('send-button')).tap();
    
    // Wait for response with links
    await waitFor(element(by.text('おすすめの投稿')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Tap on recommended post
    await element(by.id('recommended-post-0')).tap();
    
    // Verify post detail
    await expect(element(by.id('post-detail'))).toBeVisible();
    
    // Like the post
    await element(by.id('like-button')).tap();
    
    // Go back and verify in chat
    await device.pressBack();
    await expect(element(by.text('いいねしました'))).toBeVisible();
  });
});
```

### 4.3 毎日のキュレーションE2Eテスト

```typescript
describe('Daily Curation E2E', () => {
  it('should receive and interact with daily playlist', async () => {
    // Mock time to 5:00 AM JST
    await device.setTime('2025-01-20T20:00:00Z');
    
    await device.launchApp();
    
    // Should show notification
    await waitFor(element(by.text('今日のプレイリストが届きました')))
      .toBeVisible()
      .withTimeout(10000);
    
    // Tap notification
    await element(by.text('今日のプレイリストが届きました')).tap();
    
    // Verify playlist screen
    await expect(element(by.text('今日のおすすめ'))).toBeVisible();
    await expect(element(by.id('playlist-items'))).toHaveLabel('5 items');
    
    // Play all
    await element(by.id('play-all-button')).tap();
    
    // Verify player
    await expect(element(by.id('mini-player'))).toBeVisible();
    await expect(element(by.id('now-playing-title'))).toBeVisible();
  });
});
```

## テストデータ

### モックデータ生成

```typescript
// test/fixtures/mockData.ts
export const mockUsers = [
  {
    id: '1',
    username: 'awakened_one',
    display_name: '目醒めし者',
    bio: 'スピリチュアルな気づきをシェアしています',
    avatar_url: 'https://example.com/avatar1.jpg',
    location: '東京',
    followers_count: 1234,
    following_count: 567
  },
  // ... more users
];

export const mockPosts = [
  {
    id: '1',
    user_id: '1',
    content: '今朝の瞑想で深い気づきがありました',
    media_type: 'AUDIO',
    media_url: 'https://example.com/audio1.mp3',
    duration: 180,
    likes_count: 45,
    comments_count: 12,
    highlights_count: 3,
    created_at: '2025-01-20T09:00:00Z'
  },
  // ... more posts
];

export const mockChatSessions = [
  {
    id: 'session-1',
    user_id: '1',
    title: 'スピリチュアルについて',
    created_at: '2025-01-19T10:00:00Z',
    updated_at: '2025-01-19T10:30:00Z'
  }
];
```

### テストヘルパー

```typescript
// test/helpers/testUtils.ts
export const loginUser = async (userData = {}) => {
  const user = {
    id: 'test-user',
    email: 'test@example.com',
    ...userData
  };
  
  await AsyncStorage.setItem('user', JSON.stringify(user));
  await AsyncStorage.setItem('token', 'test-jwt-token');
  
  return user;
};

export const mockSupabaseResponse = (data: any, error: any = null) => {
  return {
    data,
    error,
    count: data?.length || 0
  };
};

export const waitForLoadingToFinish = async () => {
  await waitFor(() => {
    expect(screen.queryByTestId('loading-spinner')).toBeNull();
  });
};
```

## パフォーマンステスト

```typescript
describe('Performance Tests', () => {
  it('should load search results within 2 seconds', async () => {
    const startTime = Date.now();
    
    const { getByPlaceholderText } = render(<Search />);
    const input = getByPlaceholderText('検索');
    
    fireEvent.changeText(input, 'test');
    fireEvent(input, 'submitEditing');
    
    await waitFor(() => {
      expect(screen.getByTestId('search-results')).toBeTruthy();
    });
    
    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(2000);
  });
  
  it('should handle 1000+ search results efficiently', async () => {
    const largeResultSet = Array(1000).fill(null).map((_, i) => ({
      id: `${i}`,
      content: `Post ${i}`
    }));
    
    // Mock large result
    searchService.searchPosts = jest.fn().mockResolvedValue({
      data: largeResultSet,
      hasMore: true
    });
    
    const { getByTestId } = render(<Search />);
    
    // Should virtualize list
    const list = getByTestId('search-results-list');
    expect(list.props.windowSize).toBeLessThanOrEqual(10);
  });
});
```

## セキュリティテスト

```typescript
describe('Security Tests', () => {
  it('should sanitize search input', async () => {
    const { getByPlaceholderText } = render(<Search />);
    const input = getByPlaceholderText('検索');
    
    const maliciousInput = '<script>alert("XSS")</script>';
    fireEvent.changeText(input, maliciousInput);
    fireEvent(input, 'submitEditing');
    
    // Should escape HTML
    await waitFor(() => {
      const searchQuery = searchService.searchAll.mock.calls[0][0];
      expect(searchQuery).not.toContain('<script>');
      expect(searchQuery).toContain('&lt;script&gt;');
    });
  });
  
  it('should validate chat message length', async () => {
    const { getByPlaceholderText, getByText } = render(<AIChat />);
    const input = getByPlaceholderText('メッセージを入力...');
    
    const longMessage = 'あ'.repeat(5001);
    fireEvent.changeText(input, longMessage);
    
    await waitFor(() => {
      expect(getByText('メッセージが長すぎます')).toBeTruthy();
    });
  });
});
```

## まとめ

本テスト仕様書は、AIチャット・検索機能の包括的なテストケースを提供します。

### カバレッジ目標
- 単体テスト: 90%以上
- 統合テスト: 80%以上
- E2Eテスト: 主要フロー100%

### 実行方法
```bash
# 全テスト実行
npm test

# 特定のテストスイート実行
npm test -- Search.test.tsx

# カバレッジレポート生成
npm test -- --coverage

# E2Eテスト実行
npm run e2e:test
```

### CI/CD統合
- プルリクエスト時に全テスト実行
- マージ前にカバレッジ基準をクリア
- E2Eテストは夜間に定期実行

この仕様書に基づいてTDD開発を進めることで、高品質なAIチャット・検索機能を実装できます。