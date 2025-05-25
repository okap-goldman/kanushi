# タイムライン・投稿機能テスト仕様書

## 概要
本ドキュメントは「目醒め人のためのSNS」のタイムライン・投稿機能に関する詳細なテスト仕様書です。
TDD（テスト駆動開発）による実装を前提とし、APIユニットテスト、UIユニットテスト、結合テスト、E2Eテストの4種類のテストケースを定義します。

## テスト環境

### 使用フレームワーク
- jest-expo@~53.0.0
- @testing-library/react-native@^13
- @testing-library/jest-native@^6
- react-native-reanimated/mock

### テスト方針
- モックの使用は最小限に留め、実際のデータフローに近い形でテストを実施
- 非同期処理は適切にawaitし、タイムアウトを設定
- エラーケースも網羅的にテスト

## 1. APIユニットテスト

### 1.1 タイムライン取得

#### 1.1.1 ファミリータイムライン取得

```typescript
describe('GET /timeline?type=family', () => {
  it('ファミリーフォローの投稿を時系列順に取得できる', async () => {
    // Arrange
    const userId = 'test-user-id';
    const expectedPosts = [
      { id: 'post1', user_id: 'family-user1', created_at: '2024-01-02' },
      { id: 'post2', user_id: 'family-user2', created_at: '2024-01-01' }
    ];

    // Act
    const response = await request(app)
      .get('/timeline?type=family')
      .set('Authorization', `Bearer ${validToken}`);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items[0].id).toBe('post1');
    expect(response.body.nextCursor).toBeDefined();
  });

  it('カーソルベースのページネーションが動作する', async () => {
    // Arrange
    const firstPageCursor = 'cursor-1';

    // Act
    const response = await request(app)
      .get(`/timeline?type=family&cursor=${firstPageCursor}`)
      .set('Authorization', `Bearer ${validToken}`);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.items).toBeDefined();
    expect(response.body.items.length).toBeLessThanOrEqual(20);
  });

  it('認証なしでアクセスすると401エラーを返す', async () => {
    // Act
    const response = await request(app)
      .get('/timeline?type=family');

    // Assert
    expect(response.status).toBe(401);
    expect(response.body.type).toBe('MISSING_TOKEN');
  });
});
```

#### 1.1.2 ウォッチタイムライン取得

```typescript
describe('GET /timeline?type=watch', () => {
  it('ウォッチフォローの投稿を取得できる', async () => {
    // Act
    const response = await request(app)
      .get('/timeline?type=watch')
      .set('Authorization', `Bearer ${validToken}`);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.items).toBeDefined();
    expect(response.body.items.every(post => 
      post.user.followType === 'watch'
    )).toBe(true);
  });
});
```

### 1.2 投稿作成

#### 1.2.1 音声投稿作成

```typescript
describe('POST /posts - 音声投稿', () => {
  it('音声ファイルを含む投稿を作成できる', async () => {
    // Arrange
    const audioBuffer = await fs.readFile('test-audio.mp3');
    
    // Act
    const response = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .field('contentType', 'audio')
      .field('textContent', 'テスト音声投稿')
      .attach('file', audioBuffer, 'test.mp3');

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.contentType).toBe('audio');
    expect(response.body.mediaUrl).toMatch(/^https:\/\//);
    expect(response.body.waveformUrl).toBeDefined();
    expect(response.body.durationSeconds).toBeGreaterThan(0);
    expect(response.body.aiMetadata).toMatchObject({
      summary: expect.any(String),
      tags: expect.any(Array)
    });
  });

  it('音声投稿にイベントタグを付けられる', async () => {
    // Arrange
    const eventId = 'test-event-id';
    const audioBuffer = await fs.readFile('test-audio.mp3');

    // Act
    const response = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .field('contentType', 'audio')
      .field('textContent', 'イベント関連音声')
      .field('eventId', eventId)
      .attach('file', audioBuffer, 'test.mp3');

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.eventId).toBe(eventId);
  });

  it('音声ファイルサイズが制限を超える場合413エラーを返す', async () => {
    // Arrange
    const largeAudioBuffer = Buffer.alloc(100 * 1024 * 1024); // 100MB

    // Act
    const response = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .field('contentType', 'audio')
      .attach('file', largeAudioBuffer, 'large.mp3');

    // Assert
    expect(response.status).toBe(413);
    expect(response.body.type).toBe('PAYLOAD_TOO_LARGE');
  });
});
```

#### 1.2.2 画像投稿作成

```typescript
describe('POST /posts - 画像投稿', () => {
  it('画像ファイルを含む投稿を作成できる', async () => {
    // Arrange
    const imageBuffer = await fs.readFile('test-image.jpg');

    // Act
    const response = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .field('contentType', 'image')
      .field('textContent', 'テスト画像投稿')
      .attach('file', imageBuffer, 'test.jpg');

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.contentType).toBe('image');
    expect(response.body.mediaUrl).toMatch(/^https:\/\//);
    expect(response.body.previewUrl).toBeDefined();
  });

  it('GIF画像を投稿できる', async () => {
    // Arrange
    const gifBuffer = await fs.readFile('test-animation.gif');

    // Act
    const response = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .field('contentType', 'image')
      .attach('file', gifBuffer, 'test.gif');

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.mediaUrl).toMatch(/\.gif$/);
  });
});
```

#### 1.2.3 テキスト投稿作成

```typescript
describe('POST /posts - テキスト投稿', () => {
  it('テキストのみの投稿を作成できる', async () => {
    // Act
    const response = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        contentType: 'text',
        textContent: 'これはテスト投稿です。'
      });

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.contentType).toBe('text');
    expect(response.body.textContent).toBe('これはテスト投稿です。');
    expect(response.body.mediaUrl).toBeNull();
  });

  it('最大10,000文字のテキストを投稿できる', async () => {
    // Arrange
    const longText = 'あ'.repeat(10000);

    // Act
    const response = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        contentType: 'text',
        textContent: longText
      });

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.textContent.length).toBe(10000);
  });

  it('10,001文字以上のテキストは400エラーを返す', async () => {
    // Arrange
    const tooLongText = 'あ'.repeat(10001);

    // Act
    const response = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        contentType: 'text',
        textContent: tooLongText
      });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.type).toBe('VALIDATION_ERROR');
    expect(response.body.errors[0].field).toBe('textContent');
  });

  it('ハッシュタグを最大5個まで付けられる', async () => {
    // Arrange
    const hashtags = ['#目醒め', '#スピリチュアル', '#音声', '#瞑想', '#ヒーリング'];

    // Act
    const response = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        contentType: 'text',
        textContent: 'ハッシュタグテスト ' + hashtags.join(' ')
      });

    // Assert
    expect(response.status).toBe(201);
    // ハッシュタグが正しく保存されていることを確認
  });
});
```

### 1.3 投稿アクション

#### 1.3.1 いいね機能

```typescript
describe('POST /posts/{postId}/like', () => {
  it('投稿にいいねできる', async () => {
    // Arrange
    const postId = 'test-post-id';

    // Act
    const response = await request(app)
      .post(`/posts/${postId}/like`)
      .set('Authorization', `Bearer ${validToken}`);

    // Assert
    expect(response.status).toBe(204);
  });

  it('同じ投稿に2回いいねすると409エラーを返す', async () => {
    // Arrange
    const postId = 'test-post-id';
    await request(app)
      .post(`/posts/${postId}/like`)
      .set('Authorization', `Bearer ${validToken}`);

    // Act
    const response = await request(app)
      .post(`/posts/${postId}/like`)
      .set('Authorization', `Bearer ${validToken}`);

    // Assert
    expect(response.status).toBe(409);
    expect(response.body.type).toBe('ALREADY_LIKED');
  });

  it('存在しない投稿にいいねすると404エラーを返す', async () => {
    // Act
    const response = await request(app)
      .post('/posts/non-existent-id/like')
      .set('Authorization', `Bearer ${validToken}`);

    // Assert
    expect(response.status).toBe(404);
    expect(response.body.type).toBe('RESOURCE_NOT_FOUND');
  });
});

describe('DELETE /posts/{postId}/like', () => {
  it('いいねを取り消せる', async () => {
    // Arrange
    const postId = 'test-post-id';
    await request(app)
      .post(`/posts/${postId}/like`)
      .set('Authorization', `Bearer ${validToken}`);

    // Act
    const response = await request(app)
      .delete(`/posts/${postId}/like`)
      .set('Authorization', `Bearer ${validToken}`);

    // Assert
    expect(response.status).toBe(204);
  });
});
```

#### 1.3.2 ハイライト機能

```typescript
describe('POST /posts/{postId}/highlight', () => {
  it('理由付きでハイライトできる', async () => {
    // Arrange
    const postId = 'test-post-id';
    const reason = 'この投稿から深い気づきを得ました';

    // Act
    const response = await request(app)
      .post(`/posts/${postId}/highlight`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ reason });

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.reason).toBe(reason);
    expect(response.body.postId).toBe(postId);
  });

  it('理由なしでハイライトすると400エラーを返す', async () => {
    // Act
    const response = await request(app)
      .post('/posts/test-post-id/highlight')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.type).toBe('VALIDATION_ERROR');
    expect(response.body.errors[0].field).toBe('reason');
  });

  it('同じ投稿を2回ハイライトすると409エラーを返す', async () => {
    // Arrange
    const postId = 'test-post-id';
    await request(app)
      .post(`/posts/${postId}/highlight`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ reason: '初回の理由' });

    // Act
    const response = await request(app)
      .post(`/posts/${postId}/highlight`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ reason: '2回目の理由' });

    // Assert
    expect(response.status).toBe(409);
    expect(response.body.type).toBe('ALREADY_HIGHLIGHTED');
  });
});
```

#### 1.3.3 コメント機能

```typescript
describe('POST /posts/{postId}/comments', () => {
  it('投稿にコメントできる', async () => {
    // Arrange
    const postId = 'test-post-id';
    const comment = '素晴らしい投稿ですね！';

    // Act
    const response = await request(app)
      .post(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ body: comment });

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.body).toBe(comment);
    expect(response.body.user.id).toBeDefined();
    expect(response.body.createdAt).toBeDefined();
  });

  it('空のコメントは400エラーを返す', async () => {
    // Act
    const response = await request(app)
      .post('/posts/test-post-id/comments')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ body: '' });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.type).toBe('VALIDATION_ERROR');
  });
});

describe('GET /posts/{postId}/comments', () => {
  it('投稿のコメント一覧を取得できる', async () => {
    // Act
    const response = await request(app)
      .get('/posts/test-post-id/comments')
      .set('Authorization', `Bearer ${validToken}`);

    // Assert
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toMatchObject({
      id: expect.any(String),
      body: expect.any(String),
      user: expect.any(Object),
      createdAt: expect.any(String)
    });
  });
});
```

#### 1.3.4 ブックマーク機能

```typescript
describe('POST /posts/{postId}/bookmark', () => {
  it('投稿をブックマークできる', async () => {
    // Act
    const response = await request(app)
      .post('/posts/test-post-id/bookmark')
      .set('Authorization', `Bearer ${validToken}`);

    // Assert
    expect(response.status).toBe(201);
  });
});

describe('DELETE /posts/{postId}/bookmark', () => {
  it('ブックマークを解除できる', async () => {
    // Arrange
    await request(app)
      .post('/posts/test-post-id/bookmark')
      .set('Authorization', `Bearer ${validToken}`);

    // Act
    const response = await request(app)
      .delete('/posts/test-post-id/bookmark')
      .set('Authorization', `Bearer ${validToken}`);

    // Assert
    expect(response.status).toBe(204);
  });
});

describe('GET /bookmarks', () => {
  it('ブックマーク一覧を取得できる', async () => {
    // Act
    const response = await request(app)
      .get('/bookmarks')
      .set('Authorization', `Bearer ${validToken}`);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.items).toBeDefined();
    expect(response.body.nextCursor).toBeDefined();
  });
});
```

#### 1.3.5 投稿削除

```typescript
describe('DELETE /posts/{postId}', () => {
  it('自分の投稿を削除できる', async () => {
    // Arrange
    const createResponse = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        contentType: 'text',
        textContent: '削除テスト投稿'
      });
    const postId = createResponse.body.id;

    // Act
    const response = await request(app)
      .delete(`/posts/${postId}`)
      .set('Authorization', `Bearer ${validToken}`);

    // Assert
    expect(response.status).toBe(204);
  });

  it('他人の投稿は削除できない', async () => {
    // Act
    const response = await request(app)
      .delete('/posts/other-user-post-id')
      .set('Authorization', `Bearer ${validToken}`);

    // Assert
    expect(response.status).toBe(403);
    expect(response.body.type).toBe('FORBIDDEN');
  });
});
```

### 1.4 オフライン機能

```typescript
describe('POST /offline-content/{postId}', () => {
  it('投稿をオフライン保存できる', async () => {
    // Act
    const response = await request(app)
      .post('/offline-content/test-post-id')
      .set('Authorization', `Bearer ${validToken}`);

    // Assert
    expect(response.status).toBe(201);
  });

  it('既に保存済みの投稿は409エラーを返す', async () => {
    // Arrange
    await request(app)
      .post('/offline-content/test-post-id')
      .set('Authorization', `Bearer ${validToken}`);

    // Act
    const response = await request(app)
      .post('/offline-content/test-post-id')
      .set('Authorization', `Bearer ${validToken}`);

    // Assert
    expect(response.status).toBe(409);
  });
});

describe('GET /offline-content', () => {
  it('オフライン保存したコンテンツ一覧を取得できる', async () => {
    // Act
    const response = await request(app)
      .get('/offline-content')
      .set('Authorization', `Bearer ${validToken}`);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      items: expect.any(Array),
      totalSizeBytes: expect.any(Number),
      maxSizeBytes: 524288000 // 500MB
    });
    expect(response.body.items[0]).toMatchObject({
      post: expect.any(Object),
      sizeBytes: expect.any(Number),
      cachedAt: expect.any(String),
      expiresAt: expect.any(String)
    });
  });
});
```

### 1.5 レート制限

```typescript
describe('Rate Limiting', () => {
  it('1分間に10件を超える投稿で429エラーを返す', async () => {
    // Arrange
    const promises = [];
    for (let i = 0; i < 11; i++) {
      promises.push(
        request(app)
          .post('/posts')
          .set('Authorization', `Bearer ${validToken}`)
          .send({
            contentType: 'text',
            textContent: `テスト投稿 ${i}`
          })
      );
    }

    // Act
    const responses = await Promise.all(promises);

    // Assert
    const successCount = responses.filter(r => r.status === 201).length;
    const rateLimitedCount = responses.filter(r => r.status === 429).length;
    
    expect(successCount).toBe(10);
    expect(rateLimitedCount).toBe(1);
    
    const rateLimitedResponse = responses.find(r => r.status === 429);
    expect(rateLimitedResponse.body).toMatchObject({
      type: 'RATE_LIMIT_EXCEEDED',
      retryAfter: expect.any(Number),
      limit: 10,
      window: '1 minute'
    });
  });
});
```

## 2. UIユニットテスト

### 2.1 タイムライン画面

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Timeline from '@/screens/Timeline';

describe('Timeline Screen', () => {
  it('初期表示でローディングインジケーターを表示する', () => {
    // Arrange & Act
    const { getByTestId } = render(<Timeline />);

    // Assert
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('タブ切り替えができる', async () => {
    // Arrange
    const { getByText, getByTestId } = render(<Timeline />);
    
    // Act
    await waitFor(() => {
      expect(getByTestId('timeline-content')).toBeTruthy();
    });
    
    fireEvent.press(getByText('ウォッチ'));

    // Assert
    await waitFor(() => {
      expect(getByTestId('watch-timeline')).toBeTruthy();
    });
  });

  it('プルトゥリフレッシュで更新できる', async () => {
    // Arrange
    const { getByTestId } = render(<Timeline />);
    await waitFor(() => {
      expect(getByTestId('timeline-list')).toBeTruthy();
    });

    // Act
    const list = getByTestId('timeline-list');
    fireEvent.scroll(list, {
      nativeEvent: {
        contentOffset: { y: -100 },
        contentSize: { height: 1000 },
        layoutMeasurement: { height: 800 }
      }
    });

    // Assert
    await waitFor(() => {
      expect(getByTestId('refresh-control')).toBeTruthy();
    });
  });

  it('無限スクロールが動作する', async () => {
    // Arrange
    const { getByTestId, getAllByTestId } = render(<Timeline />);
    await waitFor(() => {
      expect(getByTestId('timeline-list')).toBeTruthy();
    });

    // Act
    const list = getByTestId('timeline-list');
    const initialPostCount = getAllByTestId(/^post-/).length;
    
    fireEvent.scroll(list, {
      nativeEvent: {
        contentOffset: { y: 900 },
        contentSize: { height: 1000 },
        layoutMeasurement: { height: 800 }
      }
    });

    // Assert
    await waitFor(() => {
      const currentPostCount = getAllByTestId(/^post-/).length;
      expect(currentPostCount).toBeGreaterThan(initialPostCount);
    });
  });
});
```

### 2.2 投稿カードコンポーネント

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PostCard from '@/components/PostCard';

describe('PostCard Component', () => {
  const mockPost = {
    id: 'test-post-1',
    user: {
      id: 'user-1',
      displayName: 'テストユーザー',
      profileImageUrl: 'https://example.com/avatar.jpg'
    },
    contentType: 'text',
    textContent: 'これはテスト投稿です',
    createdAt: '2024-01-01T00:00:00Z',
    likes: 5,
    comments: 3,
    isLiked: false,
    isHighlighted: false,
    isBookmarked: false
  };

  it('投稿内容が正しく表示される', () => {
    // Arrange & Act
    const { getByText, getByTestId } = render(<PostCard post={mockPost} />);

    // Assert
    expect(getByText('テストユーザー')).toBeTruthy();
    expect(getByText('これはテスト投稿です')).toBeTruthy();
    expect(getByTestId('like-count')).toHaveTextContent('5');
    expect(getByTestId('comment-count')).toHaveTextContent('3');
  });

  it('いいねボタンが動作する', async () => {
    // Arrange
    const onLike = jest.fn();
    const { getByTestId } = render(
      <PostCard post={mockPost} onLike={onLike} />
    );

    // Act
    fireEvent.press(getByTestId('like-button'));

    // Assert
    expect(onLike).toHaveBeenCalledWith(mockPost.id);
    await waitFor(() => {
      expect(getByTestId('like-button')).toHaveStyle({ 
        backgroundColor: '#FF0000' 
      });
    });
  });

  it('ハイライトボタンで理由入力ダイアログが表示される', () => {
    // Arrange
    const { getByTestId, getByText } = render(<PostCard post={mockPost} />);

    // Act
    fireEvent.press(getByTestId('highlight-button'));

    // Assert
    expect(getByText('ハイライトの理由')).toBeTruthy();
    expect(getByTestId('highlight-reason-input')).toBeTruthy();
  });

  it('自分の投稿に削除ボタンが表示される', () => {
    // Arrange
    const myPost = { ...mockPost, user: { ...mockPost.user, id: 'current-user-id' } };
    const { getByTestId } = render(
      <PostCard post={myPost} currentUserId="current-user-id" />
    );

    // Assert
    expect(getByTestId('delete-button')).toBeTruthy();
  });

  it('他人の投稿に削除ボタンが表示されない', () => {
    // Arrange & Act
    const { queryByTestId } = render(
      <PostCard post={mockPost} currentUserId="current-user-id" />
    );

    // Assert
    expect(queryByTestId('delete-button')).toBeNull();
  });
});
```

### 2.3 音声プレーヤーコンポーネント

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AudioPlayer from '@/components/AudioPlayer';
import { Audio } from 'expo-av';

// react-native-reanimated/mockを使用
jest.mock('react-native-reanimated', () => 
  require('react-native-reanimated/mock')
);

describe('AudioPlayer Component', () => {
  const mockAudioPost = {
    id: 'audio-post-1',
    mediaUrl: 'https://example.com/audio.mp3',
    waveformUrl: 'https://example.com/waveform.png',
    durationSeconds: 180,
    aiMetadata: {
      summary: '瞑想に関する音声投稿'
    }
  };

  beforeEach(() => {
    // Audio APIのモックをリセット
    jest.clearAllMocks();
  });

  it('初期状態で再生ボタンが表示される', () => {
    // Arrange & Act
    const { getByTestId } = render(<AudioPlayer post={mockAudioPost} />);

    // Assert
    expect(getByTestId('play-button')).toBeTruthy();
    expect(getByTestId('audio-duration')).toHaveTextContent('3:00');
  });

  it('再生ボタンをタップすると音声が再生される', async () => {
    // Arrange
    const mockSoundObject = {
      playAsync: jest.fn().mockResolvedValue({}),
      pauseAsync: jest.fn().mockResolvedValue({}),
      getStatusAsync: jest.fn().mockResolvedValue({
        isLoaded: true,
        isPlaying: true,
        positionMillis: 0,
        durationMillis: 180000
      })
    };
    
    Audio.Sound.createAsync = jest.fn().mockResolvedValue({
      sound: mockSoundObject,
      status: { isLoaded: true }
    });

    const { getByTestId } = render(<AudioPlayer post={mockAudioPost} />);

    // Act
    fireEvent.press(getByTestId('play-button'));

    // Assert
    await waitFor(() => {
      expect(mockSoundObject.playAsync).toHaveBeenCalled();
      expect(getByTestId('pause-button')).toBeTruthy();
    });
  });

  it('シークバーで再生位置を変更できる', async () => {
    // Arrange
    const mockSoundObject = {
      setPositionAsync: jest.fn().mockResolvedValue({})
    };
    
    const { getByTestId } = render(
      <AudioPlayer post={mockAudioPost} sound={mockSoundObject} />
    );

    // Act
    const seekBar = getByTestId('seek-bar');
    fireEvent(seekBar, 'onValueChange', 90); // 90秒の位置

    // Assert
    await waitFor(() => {
      expect(mockSoundObject.setPositionAsync).toHaveBeenCalledWith(90000);
    });
  });

  it('波形が表示される', () => {
    // Arrange & Act
    const { getByTestId } = render(<AudioPlayer post={mockAudioPost} />);

    // Assert
    expect(getByTestId('waveform-image')).toHaveProp('source', {
      uri: mockAudioPost.waveformUrl
    });
  });

  it('AI要約が表示される', () => {
    // Arrange & Act
    const { getByText } = render(<AudioPlayer post={mockAudioPost} />);

    // Assert
    expect(getByText('瞑想に関する音声投稿')).toBeTruthy();
  });
});
```

### 2.4 投稿作成画面

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreatePost from '@/screens/CreatePost';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

describe('CreatePost Screen', () => {
  it('メディアタイプ選択が表示される', () => {
    // Arrange & Act
    const { getByText } = render(<CreatePost />);

    // Assert
    expect(getByText('音声投稿')).toBeTruthy();
    expect(getByText('画像投稿')).toBeTruthy();
    expect(getByText('テキスト投稿')).toBeTruthy();
  });

  describe('音声投稿', () => {
    it('録音を開始・停止できる', async () => {
      // Arrange
      const mockRecording = {
        startAsync: jest.fn(),
        stopAndUnloadAsync: jest.fn().mockResolvedValue({
          uri: 'file://audio.m4a'
        }),
        getStatusAsync: jest.fn().mockResolvedValue({
          durationMillis: 5000
        })
      };
      
      Audio.Recording.createAsync = jest.fn().mockResolvedValue({
        recording: mockRecording
      });

      const { getByText, getByTestId } = render(<CreatePost />);
      fireEvent.press(getByText('音声投稿'));

      // Act
      fireEvent.press(getByTestId('record-button'));
      
      // Assert
      await waitFor(() => {
        expect(getByTestId('recording-indicator')).toBeTruthy();
      });

      // Act
      fireEvent.press(getByTestId('stop-button'));

      // Assert
      await waitFor(() => {
        expect(mockRecording.stopAndUnloadAsync).toHaveBeenCalled();
        expect(getByTestId('audio-preview')).toBeTruthy();
      });
    });

    it('ファイル選択ができる', async () => {
      // Arrange
      ImagePicker.launchImageLibraryAsync = jest.fn().mockResolvedValue({
        cancelled: false,
        assets: [{
          uri: 'file://audio.mp3',
          type: 'audio'
        }]
      });

      const { getByText, getByTestId } = render(<CreatePost />);
      fireEvent.press(getByText('音声投稿'));

      // Act
      fireEvent.press(getByTestId('file-select-button'));

      // Assert
      await waitFor(() => {
        expect(getByTestId('audio-preview')).toBeTruthy();
      });
    });
  });

  describe('画像投稿', () => {
    it('カメラで撮影できる', async () => {
      // Arrange
      ImagePicker.requestCameraPermissionsAsync = jest.fn().mockResolvedValue({
        granted: true
      });
      
      ImagePicker.launchCameraAsync = jest.fn().mockResolvedValue({
        cancelled: false,
        assets: [{
          uri: 'file://photo.jpg',
          width: 1920,
          height: 1080
        }]
      });

      const { getByText, getByTestId } = render(<CreatePost />);
      fireEvent.press(getByText('画像投稿'));

      // Act
      fireEvent.press(getByTestId('camera-button'));

      // Assert
      await waitFor(() => {
        expect(getByTestId('image-preview')).toBeTruthy();
        expect(getByTestId('image-preview')).toHaveProp('source', {
          uri: 'file://photo.jpg'
        });
      });
    });

    it('ギャラリーから選択できる', async () => {
      // Arrange
      ImagePicker.launchImageLibraryAsync = jest.fn().mockResolvedValue({
        cancelled: false,
        assets: [{
          uri: 'file://gallery.jpg',
          width: 1920,
          height: 1080
        }]
      });

      const { getByText, getByTestId } = render(<CreatePost />);
      fireEvent.press(getByText('画像投稿'));

      // Act
      fireEvent.press(getByTestId('gallery-button'));

      // Assert
      await waitFor(() => {
        expect(getByTestId('image-preview')).toBeTruthy();
      });
    });
  });

  describe('テキスト投稿', () => {
    it('文字数カウントが表示される', () => {
      // Arrange
      const { getByText, getByTestId } = render(<CreatePost />);
      fireEvent.press(getByText('テキスト投稿'));

      // Act
      const textInput = getByTestId('text-input');
      fireEvent.changeText(textInput, 'テスト投稿です');

      // Assert
      expect(getByTestId('char-count')).toHaveTextContent('7 / 10000');
    });

    it('10,000文字を超えると警告が表示される', () => {
      // Arrange
      const { getByText, getByTestId } = render(<CreatePost />);
      fireEvent.press(getByText('テキスト投稿'));

      // Act
      const longText = 'あ'.repeat(10001);
      const textInput = getByTestId('text-input');
      fireEvent.changeText(textInput, longText);

      // Assert
      expect(getByTestId('char-count')).toHaveStyle({ color: 'red' });
      expect(getByTestId('submit-button')).toBeDisabled();
    });
  });

  it('ハッシュタグを追加できる', () => {
    // Arrange
    const { getByText, getByTestId, getAllByTestId } = render(<CreatePost />);
    fireEvent.press(getByText('テキスト投稿'));

    // Act
    const hashtagInput = getByTestId('hashtag-input');
    fireEvent.changeText(hashtagInput, '目醒め');
    fireEvent.press(getByTestId('add-hashtag-button'));

    // Assert
    expect(getAllByTestId(/^hashtag-chip-/)).toHaveLength(1);
    expect(getByText('#目醒め')).toBeTruthy();
  });

  it('最大5個までハッシュタグを追加できる', () => {
    // Arrange
    const { getByText, getByTestId, getAllByTestId } = render(<CreatePost />);
    fireEvent.press(getByText('テキスト投稿'));

    // Act
    const hashtags = ['タグ1', 'タグ2', 'タグ3', 'タグ4', 'タグ5', 'タグ6'];
    const hashtagInput = getByTestId('hashtag-input');
    
    hashtags.forEach(tag => {
      fireEvent.changeText(hashtagInput, tag);
      fireEvent.press(getByTestId('add-hashtag-button'));
    });

    // Assert
    expect(getAllByTestId(/^hashtag-chip-/)).toHaveLength(5);
    expect(getByTestId('hashtag-limit-warning')).toBeTruthy();
  });
});
```

### 2.5 削除確認ダイアログ

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

describe('DeleteConfirmDialog Component', () => {
  it('削除確認メッセージが表示される', () => {
    // Arrange & Act
    const { getByText } = render(
      <DeleteConfirmDialog visible={true} onConfirm={jest.fn()} onCancel={jest.fn()} />
    );

    // Assert
    expect(getByText('投稿を削除しますか？')).toBeTruthy();
    expect(getByText('この操作は取り消せません。')).toBeTruthy();
  });

  it('削除ボタンでonConfirmが呼ばれる', () => {
    // Arrange
    const onConfirm = jest.fn();
    const { getByText } = render(
      <DeleteConfirmDialog visible={true} onConfirm={onConfirm} onCancel={jest.fn()} />
    );

    // Act
    fireEvent.press(getByText('削除'));

    // Assert
    expect(onConfirm).toHaveBeenCalled();
  });

  it('キャンセルボタンでonCancelが呼ばれる', () => {
    // Arrange
    const onCancel = jest.fn();
    const { getByText } = render(
      <DeleteConfirmDialog visible={true} onConfirm={jest.fn()} onCancel={onCancel} />
    );

    // Act
    fireEvent.press(getByText('キャンセル'));

    // Assert
    expect(onCancel).toHaveBeenCalled();
  });
});
```

## 3. 結合テスト

### 3.1 投稿フロー全体

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from '@/navigation/AppNavigator';
import { AuthProvider } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

describe('投稿作成フロー結合テスト', () => {
  beforeEach(() => {
    // Supabaseクライアントの初期化
    jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'test-user-id' } }
    });
  });

  it('テキスト投稿の作成から表示まで', async () => {
    // Arrange
    const { getByTestId, getByText } = render(
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    );

    // Act - タイムライン画面で投稿作成ボタンをタップ
    await waitFor(() => {
      expect(getByTestId('create-post-button')).toBeTruthy();
    });
    fireEvent.press(getByTestId('create-post-button'));

    // Act - テキスト投稿を選択
    await waitFor(() => {
      expect(getByText('テキスト投稿')).toBeTruthy();
    });
    fireEvent.press(getByText('テキスト投稿'));

    // Act - テキストを入力
    const textInput = getByTestId('text-input');
    fireEvent.changeText(textInput, 'テスト投稿です #テスト');

    // Act - 投稿ボタンをタップ
    fireEvent.press(getByTestId('submit-button'));

    // Assert - タイムラインに戻り、投稿が表示される
    await waitFor(() => {
      expect(getByText('テスト投稿です #テスト')).toBeTruthy();
    }, { timeout: 5000 });
  });

  it('音声投稿の作成から再生まで', async () => {
    // Arrange
    const mockAudioUri = 'file://test-audio.m4a';
    const mockRecording = {
      startAsync: jest.fn(),
      stopAndUnloadAsync: jest.fn().mockResolvedValue({ uri: mockAudioUri }),
      getStatusAsync: jest.fn().mockResolvedValue({ durationMillis: 5000 })
    };
    
    Audio.Recording.createAsync = jest.fn().mockResolvedValue({
      recording: mockRecording
    });

    const { getByTestId, getByText } = render(
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    );

    // Act - 投稿作成画面へ
    fireEvent.press(getByTestId('create-post-button'));
    await waitFor(() => {
      expect(getByText('音声投稿')).toBeTruthy();
    });
    fireEvent.press(getByText('音声投稿'));

    // Act - 録音
    fireEvent.press(getByTestId('record-button'));
    await waitFor(() => {
      expect(getByTestId('stop-button')).toBeTruthy();
    });
    fireEvent.press(getByTestId('stop-button'));

    // Act - 投稿本文入力
    await waitFor(() => {
      expect(getByTestId('post-text-input')).toBeTruthy();
    });
    fireEvent.changeText(getByTestId('post-text-input'), '音声テスト投稿');

    // Act - 投稿
    fireEvent.press(getByTestId('submit-button'));

    // Assert - タイムラインで音声プレーヤーが表示される
    await waitFor(() => {
      expect(getByTestId('audio-player-post')).toBeTruthy();
      expect(getByText('音声テスト投稿')).toBeTruthy();
    }, { timeout: 5000 });
  });
});
```

### 3.2 いいね・コメント連携

```typescript
describe('いいね・コメント機能の連携テスト', () => {
  it('いいねとコメントが同期的に更新される', async () => {
    // Arrange
    const { getByTestId, getByText, getAllByTestId } = render(
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getAllByTestId(/^post-/).length).toBeGreaterThan(0);
    });

    const firstPost = getAllByTestId(/^post-/)[0];

    // Act - いいね
    const likeButton = within(firstPost).getByTestId('like-button');
    fireEvent.press(likeButton);

    // Assert - いいね数が増える
    await waitFor(() => {
      const likeCount = within(firstPost).getByTestId('like-count');
      expect(parseInt(likeCount.props.children)).toBeGreaterThan(0);
    });

    // Act - コメント
    const commentButton = within(firstPost).getByTestId('comment-button');
    fireEvent.press(commentButton);

    await waitFor(() => {
      expect(getByTestId('comment-input')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('comment-input'), 'テストコメント');
    fireEvent.press(getByTestId('send-comment-button'));

    // Assert - コメントが追加される
    await waitFor(() => {
      expect(getByText('テストコメント')).toBeTruthy();
      const commentCount = within(firstPost).getByTestId('comment-count');
      expect(parseInt(commentCount.props.children)).toBeGreaterThan(0);
    });
  });
});
```

### 3.3 オフライン→オンライン同期

```typescript
describe('オフライン→オンライン同期テスト', () => {
  it('オフライン時の投稿がオンライン復帰後に送信される', async () => {
    // Arrange
    const { getByTestId, getByText } = render(
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    );

    // オフラインモードをシミュレート
    jest.spyOn(NetInfo, 'fetch').mockResolvedValue({
      isConnected: false,
      isInternetReachable: false
    });

    // Act - オフラインで投稿作成
    fireEvent.press(getByTestId('create-post-button'));
    fireEvent.press(getByText('テキスト投稿'));
    fireEvent.changeText(getByTestId('text-input'), 'オフライン投稿');
    fireEvent.press(getByTestId('submit-button'));

    // Assert - オフライン投稿として保存
    await waitFor(() => {
      expect(getByText('オフラインで保存されました')).toBeTruthy();
    });

    // Act - オンライン復帰
    jest.spyOn(NetInfo, 'fetch').mockResolvedValue({
      isConnected: true,
      isInternetReachable: true
    });

    // オンライン復帰イベントを発火
    NetInfo.eventEmitter.emit('connectionChange', {
      isConnected: true,
      isInternetReachable: true
    });

    // Assert - 投稿が送信される
    await waitFor(() => {
      expect(getByText('オフライン投稿')).toBeTruthy();
      expect(getByTestId('sync-indicator')).not.toBeTruthy();
    }, { timeout: 10000 });
  });
});
```

### 3.4 プッシュ通知連携

```typescript
import * as Notifications from 'expo-notifications';

describe('プッシュ通知連携テスト', () => {
  beforeEach(() => {
    // プッシュ通知の権限をモック
    jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
      status: 'granted'
    });
  });

  it('いいね通知が正しく処理される', async () => {
    // Arrange
    const mockNotification = {
      request: {
        content: {
          title: '新しいいいね',
          body: 'テストユーザーがあなたの投稿にいいねしました',
          data: {
            type: 'like',
            postId: 'test-post-id'
          }
        }
      }
    };

    const { getByTestId } = render(
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    );

    // Act - 通知を受信
    const notificationListener = Notifications.addNotificationReceivedListener.mock.calls[0][0];
    notificationListener(mockNotification);

    // Assert - 通知バッジが表示される
    await waitFor(() => {
      expect(getByTestId('notification-badge')).toBeTruthy();
      expect(getByTestId('notification-badge')).toHaveTextContent('1');
    });

    // Act - 通知をタップ
    const responseListener = Notifications.addNotificationResponseReceivedListener.mock.calls[0][0];
    responseListener({
      notification: mockNotification,
      actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER
    });

    // Assert - 該当の投稿画面に遷移
    await waitFor(() => {
      expect(getByTestId('post-detail-screen')).toBeTruthy();
      expect(getByTestId('post-id')).toHaveTextContent('test-post-id');
    });
  });
});
```

## 4. E2Eテスト

### 4.1 完全な投稿作成フロー

```typescript
import { device, element, by, expect as e2eExpect } from 'detox';

describe('投稿作成E2Eテスト', () => {
  beforeAll(async () => {
    await device.launchApp({ 
      permissions: { notifications: 'YES', camera: 'YES', microphone: 'YES' }
    });
    await device.reloadReactNative();
  });

  beforeEach(async () => {
    // ログイン状態にする
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('testpassword');
    await element(by.id('login-button')).tap();
    await e2eExpect(element(by.id('timeline-screen'))).toBeVisible();
  });

  it('テキスト投稿の完全なフロー', async () => {
    // 投稿作成画面へ
    await element(by.id('create-post-button')).tap();
    await e2eExpect(element(by.text('メディアタイプを選択'))).toBeVisible();

    // テキスト投稿を選択
    await element(by.text('テキスト投稿')).tap();
    
    // テキスト入力
    await element(by.id('text-input')).typeText('E2Eテスト投稿です\n改行も含みます');
    
    // ハッシュタグ追加
    await element(by.id('hashtag-input')).typeText('E2Eテスト');
    await element(by.id('add-hashtag-button')).tap();
    
    // 投稿
    await element(by.id('submit-button')).tap();
    
    // タイムラインに表示確認
    await e2eExpect(element(by.text('E2Eテスト投稿です'))).toBeVisible();
    await e2eExpect(element(by.text('#E2Eテスト'))).toBeVisible();
    
    // いいね
    await element(by.id('like-button').withAncestor(by.id('post-test-e2e'))).tap();
    await e2eExpect(element(by.id('like-count').withAncestor(by.id('post-test-e2e')))).toHaveText('1');
    
    // コメント
    await element(by.id('comment-button').withAncestor(by.id('post-test-e2e'))).tap();
    await element(by.id('comment-input')).typeText('E2Eコメント');
    await element(by.id('send-comment-button')).tap();
    await e2eExpect(element(by.text('E2Eコメント'))).toBeVisible();
  });

  it('音声投稿の録音と再生', async () => {
    // 投稿作成画面へ
    await element(by.id('create-post-button')).tap();
    await element(by.text('音声投稿')).tap();
    
    // 録音開始
    await element(by.id('record-button')).tap();
    await e2eExpect(element(by.id('recording-indicator'))).toBeVisible();
    
    // 5秒待機
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 録音停止
    await element(by.id('stop-button')).tap();
    await e2eExpect(element(by.id('audio-preview'))).toBeVisible();
    
    // プレビュー再生
    await element(by.id('preview-play-button')).tap();
    await e2eExpect(element(by.id('preview-pause-button'))).toBeVisible();
    
    // 投稿本文入力
    await element(by.id('post-text-input')).typeText('E2E音声投稿');
    
    // 投稿
    await element(by.id('submit-button')).tap();
    
    // タイムラインで再生
    await e2eExpect(element(by.id('audio-player').withAncestor(by.text('E2E音声投稿')))).toBeVisible();
    await element(by.id('play-button').withAncestor(by.text('E2E音声投稿'))).tap();
    await e2eExpect(element(by.id('pause-button').withAncestor(by.text('E2E音声投稿')))).toBeVisible();
  });

  it('画像投稿（ギャラリー選択）', async () => {
    // 投稿作成画面へ
    await element(by.id('create-post-button')).tap();
    await element(by.text('画像投稿')).tap();
    
    // ギャラリーから選択
    await element(by.id('gallery-button')).tap();
    
    // 最初の画像を選択（Detoxでは実際の画像選択をシミュレート）
    await element(by.id('gallery-image-0')).tap();
    
    // プレビュー確認
    await e2eExpect(element(by.id('image-preview'))).toBeVisible();
    
    // 投稿本文
    await element(by.id('post-text-input')).typeText('E2E画像投稿');
    
    // 投稿
    await element(by.id('submit-button')).tap();
    
    // タイムラインに表示確認
    await e2eExpect(element(by.id('post-image').withAncestor(by.text('E2E画像投稿')))).toBeVisible();
  });
});
```

### 4.2 オフライン機能E2E

```typescript
describe('オフライン機能E2Eテスト', () => {
  it('投稿を後で見るに保存し、オフラインで閲覧', async () => {
    // オンライン状態で投稿を保存
    await e2eExpect(element(by.id('timeline-screen'))).toBeVisible();
    
    // 最初の投稿を後で見るに追加
    await element(by.id('more-button').atIndex(0)).tap();
    await element(by.text('後で見る')).tap();
    await e2eExpect(element(by.text('保存しました'))).toBeVisible();
    
    // 機内モードON（オフライン状態）
    await device.setAirplaneMode(true);
    
    // 後で見るリストへ
    await element(by.id('menu-button')).tap();
    await element(by.text('後で見る')).tap();
    
    // 保存した投稿が表示される
    await e2eExpect(element(by.id('offline-content-list'))).toBeVisible();
    await e2eExpect(element(by.id('offline-post-0'))).toBeVisible();
    
    // オフラインで投稿を開く
    await element(by.id('offline-post-0')).tap();
    await e2eExpect(element(by.id('post-detail-screen'))).toBeVisible();
    
    // 音声再生（オフライン）
    await element(by.id('play-button')).tap();
    await e2eExpect(element(by.id('audio-playing-indicator'))).toBeVisible();
    
    // 機内モードOFF
    await device.setAirplaneMode(false);
  });
});
```

### 4.3 複数アカウント切り替えE2E

```typescript
describe('複数アカウント切り替えE2Eテスト', () => {
  it('アカウント切り替えでタイムラインが更新される', async () => {
    // メインアカウントでログイン済み
    await e2eExpect(element(by.text('メインアカウント'))).toBeVisible();
    
    // プロフィールアイコン長押し
    await element(by.id('profile-icon')).longPress();
    await e2eExpect(element(by.id('account-switcher'))).toBeVisible();
    
    // サブアカウントに切り替え
    await element(by.text('サブアカウント')).tap();
    
    // ローディング
    await e2eExpect(element(by.id('loading-indicator'))).toBeVisible();
    await waitFor(element(by.id('loading-indicator'))).toBeNotVisible().withTimeout(5000);
    
    // サブアカウントのタイムラインが表示
    await e2eExpect(element(by.text('サブアカウント'))).toBeVisible();
    await e2eExpect(element(by.id('timeline-screen'))).toBeVisible();
    
    // タイムラインの内容が切り替わっている
    await e2eExpect(element(by.text('サブアカウントの投稿'))).toBeVisible();
    await e2eExpect(element(by.text('メインアカウントの投稿'))).toBeNotVisible();
  });
});
```

### 4.4 パフォーマンステスト

```typescript
describe('パフォーマンスE2Eテスト', () => {
  it('大量投稿のスクロールパフォーマンス', async () => {
    // タイムライン表示
    await e2eExpect(element(by.id('timeline-screen'))).toBeVisible();
    
    // 100件の投稿を高速スクロール
    const startTime = Date.now();
    
    for (let i = 0; i < 20; i++) {
      await element(by.id('timeline-list')).scroll(500, 'down');
    }
    
    const endTime = Date.now();
    const scrollDuration = endTime - startTime;
    
    // スクロールが10秒以内に完了
    expect(scrollDuration).toBeLessThan(10000);
    
    // 最後の投稿が表示されている
    await e2eExpect(element(by.text('100件目の投稿'))).toBeVisible();
    
    // メモリリークがないことを確認（新しい投稿が追加されても古い投稿がアンマウントされる）
    await e2eExpect(element(by.text('1件目の投稿'))).toBeNotVisible();
  });

  it('音声投稿の連続再生パフォーマンス', async () => {
    // 5つの音声投稿を連続再生
    for (let i = 0; i < 5; i++) {
      await element(by.id(`play-button-${i}`)).tap();
      await waitFor(element(by.id(`pause-button-${i}`))).toBeVisible().withTimeout(1000);
      await element(by.id(`pause-button-${i}`)).tap();
    }
    
    // メモリ使用量が適切（Detoxではメモリ計測は限定的）
    // 実際のメモリ計測はXcodeのInstrumentsやAndroid Profilerで行う
  });
});
```

### 4.5 エラーケースE2E

```typescript
describe('エラーケースE2Eテスト', () => {
  it('ネットワークエラー時の投稿', async () => {
    // 投稿作成画面
    await element(by.id('create-post-button')).tap();
    await element(by.text('テキスト投稿')).tap();
    await element(by.id('text-input')).typeText('ネットワークエラーテスト');
    
    // ネットワークを切断
    await device.setAirplaneMode(true);
    
    // 投稿試行
    await element(by.id('submit-button')).tap();
    
    // エラー表示
    await e2eExpect(element(by.text('ネットワークエラー'))).toBeVisible();
    await e2eExpect(element(by.text('オフラインで保存されました'))).toBeVisible();
    
    // ネットワーク復帰
    await device.setAirplaneMode(false);
    
    // 自動再送信の確認
    await waitFor(element(by.text('投稿を送信中...'))).toBeVisible().withTimeout(5000);
    await waitFor(element(by.text('投稿が完了しました'))).toBeVisible().withTimeout(10000);
  });

  it('レート制限エラー', async () => {
    // 11回連続投稿
    for (let i = 0; i < 11; i++) {
      await element(by.id('create-post-button')).tap();
      await element(by.text('テキスト投稿')).tap();
      await element(by.id('text-input')).typeText(`連続投稿 ${i + 1}`);
      await element(by.id('submit-button')).tap();
      
      if (i < 10) {
        // 最初の10回は成功
        await waitFor(element(by.id('timeline-screen'))).toBeVisible().withTimeout(3000);
      }
    }
    
    // 11回目でレート制限エラー
    await e2eExpect(element(by.text('レート制限'))).toBeVisible();
    await e2eExpect(element(by.text('1分間に10件まで'))).toBeVisible();
    
    // カウントダウン表示
    await e2eExpect(element(by.id('retry-countdown'))).toBeVisible();
  });
});
```

## テスト実行設定

### package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "detox test --configuration ios.release",
    "test:e2e:android": "detox test --configuration android.release"
  }
}
```

### jest.config.js

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    './jest.setup.js'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### jest.setup.js

```javascript
import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';

// react-native-reanimated mock
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// expo-av mock
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(),
    },
    Recording: {
      createAsync: jest.fn(),
    },
    setAudioModeAsync: jest.fn(),
  },
}));

// NetInfo mock
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn(),
  eventEmitter: {
    emit: jest.fn(),
  },
}));

// AsyncStorage mock
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
```

## まとめ

このテスト仕様書では、タイムライン・投稿機能の包括的なテストケースを定義しました。

### カバレッジ目標
- APIユニットテスト: 90%以上
- UIユニットテスト: 85%以上
- 結合テスト: 主要フローの80%以上
- E2Eテスト: クリティカルパスの100%

### テスト実行時間目標
- ユニットテスト: 5分以内
- 結合テスト: 10分以内
- E2Eテスト: 20分以内

### 継続的改善
- テストケースは機能追加に応じて更新
- パフォーマンステストの閾値は実測値に基づいて調整
- E2Eテストは安定性を重視し、不安定なテストは改善または削除