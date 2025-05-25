# フォロー機能テスト仕様書

## 概要
本ドキュメントは「目醒め人のためのSNS」のフォロー機能に関するテスト仕様書です。
TDD（テスト駆動開発）での実装を前提とし、APIユニットテスト、UIユニットテスト、結合テスト、E2Eテストの4種類のテストケースを定義します。

**更新日**: 2025-05-25
**対象機能**: フォロー機能（ファミリー/ウォッチフォロー、アンフォロー、フォロワー/フォロー中一覧）

## テスト環境

### 使用ライブラリ
- `jest-expo@~53.0.0`
- `@testing-library/react-native@^13`
- `@testing-library/jest-native@^6`
- `react-native-reanimated/mock`

### テスト方針
- モックの使用は最小限に抑制
- 実際のAPIレスポンスに近いデータでテスト
- ユーザーインタラクションを重視したテスト設計

---

# 1. APIユニットテスト

## 1.1 フォロー作成API (POST /follows)

### 1.1.1 ファミリーフォロー正常系

```typescript
describe('POST /follows - Family Follow', () => {
  test('should create family follow with required reason', async () => {
    // Given
    const followRequest = {
      followeeId: 'user-123',
      followType: 'family',
      followReason: '同じ価値観を持つ方だと感じたため'
    };

    // When
    const response = await followApi.createFollow(followRequest);

    // Then
    expect(response.status).toBe(201);
    expect(response.data).toMatchObject({
      id: expect.any(String),
      followType: 'family',
      followReason: '同じ価値観を持つ方だと感じたため',
      status: 'active',
      createdAt: expect.any(String)
    });
  });

  test('should reject family follow without reason', async () => {
    // Given
    const followRequest = {
      followeeId: 'user-123',
      followType: 'family'
      // followReason is missing
    };

    // When & Then
    await expect(followApi.createFollow(followRequest))
      .rejects.toMatchObject({
        status: 400,
        data: {
          type: 'VALIDATION_ERROR',
          errors: [
            {
              field: 'followReason',
              message: 'ファミリーフォローには理由の入力が必要です'
            }
          ]
        }
      });
  });
});
```

### 1.1.2 ウォッチフォロー正常系

```typescript
describe('POST /follows - Watch Follow', () => {
  test('should create watch follow without reason', async () => {
    // Given
    const followRequest = {
      followeeId: 'user-456',
      followType: 'watch'
      // followReason is optional
    };

    // When
    const response = await followApi.createFollow(followRequest);

    // Then
    expect(response.status).toBe(201);
    expect(response.data).toMatchObject({
      id: expect.any(String),
      followType: 'watch',
      followReason: null,
      status: 'active',
      createdAt: expect.any(String)
    });
  });

  test('should create watch follow with optional reason', async () => {
    // Given
    const followRequest = {
      followeeId: 'user-456',
      followType: 'watch',
      followReason: '投稿内容に興味があります'
    };

    // When
    const response = await followApi.createFollow(followRequest);

    // Then
    expect(response.status).toBe(201);
    expect(response.data.followReason).toBe('投稿内容に興味があります');
  });
});
```

### 1.1.3 フォロー作成異常系

```typescript
describe('POST /follows - Error Cases', () => {
  test('should reject duplicate follow', async () => {
    // Given
    const followRequest = {
      followeeId: 'user-123',
      followType: 'family',
      followReason: 'テスト理由'
    };

    // When
    await followApi.createFollow(followRequest); // First follow
    
    // Then
    await expect(followApi.createFollow(followRequest))
      .rejects.toMatchObject({
        status: 409,
        data: {
          type: 'FOLLOW_ALREADY_EXISTS',
          title: 'すでにフォローしています'
        }
      });
  });

  test('should reject self follow', async () => {
    // Given
    const followRequest = {
      followeeId: 'current-user-id',
      followType: 'watch'
    };

    // When & Then
    await expect(followApi.createFollow(followRequest))
      .rejects.toMatchObject({
        status: 400,
        data: {
          type: 'INVALID_FOLLOW_TARGET',
          title: '自分自身をフォローすることはできません'
        }
      });
  });

  test('should handle rate limiting', async () => {
    // Given
    const requests = Array.from({ length: 21 }, (_, i) => ({
      followeeId: `user-${i}`,
      followType: 'watch'
    }));

    // When
    for (let i = 0; i < 20; i++) {
      await followApi.createFollow(requests[i]);
    }

    // Then
    await expect(followApi.createFollow(requests[20]))
      .rejects.toMatchObject({
        status: 429,
        data: {
          type: 'RATE_LIMIT_EXCEEDED',
          retryAfter: expect.any(Number)
        }
      });
  });
});
```

## 1.2 アンフォローAPI (DELETE /follows/{followId})

### 1.2.1 アンフォロー正常系

```typescript
describe('DELETE /follows/{followId}', () => {
  test('should unfollow with reason', async () => {
    // Given
    const followId = 'follow-123';
    const unfollowRequest = {
      unfollowReason: '価値観の違いを感じたため'
    };

    // When
    const response = await followApi.unfollowUser(followId, unfollowRequest);

    // Then
    expect(response.status).toBe(204);
  });

  test('should unfollow without reason', async () => {
    // Given
    const followId = 'follow-123';
    const unfollowRequest = {
      unfollowReason: ''
    };

    // When
    const response = await followApi.unfollowUser(followId, unfollowRequest);

    // Then
    expect(response.status).toBe(204);
  });
});
```

### 1.2.2 アンフォロー異常系

```typescript
describe('DELETE /follows/{followId} - Error Cases', () => {
  test('should reject unfollow of non-existent follow', async () => {
    // Given
    const nonExistentFollowId = 'non-existent-follow';
    const unfollowRequest = { unfollowReason: 'テスト' };

    // When & Then
    await expect(followApi.unfollowUser(nonExistentFollowId, unfollowRequest))
      .rejects.toMatchObject({
        status: 404,
        data: {
          type: 'RESOURCE_NOT_FOUND',
          resource: 'follow'
        }
      });
  });

  test('should reject unfollow of others follow', async () => {
    // Given
    const othersFollowId = 'others-follow-123';
    const unfollowRequest = { unfollowReason: 'テスト' };

    // When & Then
    await expect(followApi.unfollowUser(othersFollowId, unfollowRequest))
      .rejects.toMatchObject({
        status: 403,
        data: {
          type: 'UNAUTHORIZED_ACTION',
          title: '他のユーザーのフォロー関係は操作できません'
        }
      });
  });
});
```

## 1.3 フォロワー一覧取得API (GET /users/{userId}/followers)

### 1.3.1 フォロワー一覧正常系

```typescript
describe('GET /users/{userId}/followers', () => {
  test('should get followers list with pagination', async () => {
    // Given
    const userId = 'user-123';
    const queryParams = { limit: 20 };

    // When
    const response = await followApi.getFollowers(userId, queryParams);

    // Then
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      items: expect.arrayContaining([
        {
          user: {
            id: expect.any(String),
            displayName: expect.any(String),
            profileImageUrl: expect.any(String)
          },
          followType: expect.stringMatching(/^(family|watch)$/),
          followReason: expect.any(String),
          isFollowingBack: expect.any(Boolean),
          createdAt: expect.any(String)
        }
      ]),
      nextCursor: expect.any(String)
    });
  });

  test('should handle empty followers list', async () => {
    // Given
    const userWithNoFollowers = 'user-no-followers';

    // When
    const response = await followApi.getFollowers(userWithNoFollowers);

    // Then
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      items: [],
      nextCursor: null
    });
  });

  test('should get followers with cursor pagination', async () => {
    // Given
    const userId = 'user-with-many-followers';
    const firstPageParams = { limit: 10 };

    // When
    const firstPage = await followApi.getFollowers(userId, firstPageParams);
    const secondPage = await followApi.getFollowers(userId, {
      cursor: firstPage.data.nextCursor,
      limit: 10
    });

    // Then
    expect(firstPage.data.items).toHaveLength(10);
    expect(secondPage.data.items).toHaveLength(expect.any(Number));
    expect(firstPage.data.items[0].user.id)
      .not.toBe(secondPage.data.items[0].user.id);
  });
});
```

## 1.4 フォロー中一覧取得API (GET /users/{userId}/following)

### 1.4.1 フォロー中一覧正常系

```typescript
describe('GET /users/{userId}/following', () => {
  test('should get following list with latest posts', async () => {
    // Given
    const userId = 'user-123';

    // When
    const response = await followApi.getFollowing(userId);

    // Then
    expect(response.status).toBe(200);
    expect(response.data.items[0]).toMatchObject({
      user: expect.objectContaining({
        id: expect.any(String),
        displayName: expect.any(String)
      }),
      followType: expect.stringMatching(/^(family|watch)$/),
      latestPost: expect.objectContaining({
        id: expect.any(String),
        contentType: expect.stringMatching(/^(text|image|audio)$/),
        createdAt: expect.any(String)
      }),
      createdAt: expect.any(String)
    });
  });

  test('should filter following by type', async () => {
    // Given
    const userId = 'user-123';
    
    // When
    const familyFollowing = await followApi.getFollowing(userId, { type: 'family' });
    const watchFollowing = await followApi.getFollowing(userId, { type: 'watch' });

    // Then
    familyFollowing.data.items.forEach(item => {
      expect(item.followType).toBe('family');
    });
    watchFollowing.data.items.forEach(item => {
      expect(item.followType).toBe('watch');
    });
  });

  test('should handle users with no posts in following list', async () => {
    // Given
    const userId = 'user-following-new-users';

    // When
    const response = await followApi.getFollowing(userId);

    // Then
    const userWithNoPosts = response.data.items.find(item => 
      item.latestPost === null
    );
    expect(userWithNoPosts).toBeDefined();
    expect(userWithNoPosts.user).toBeDefined();
  });
});
```

---

# 2. UIユニットテスト

## 2.1 フォローボタンコンポーネント

### 2.1.1 フォローボタン表示テスト

```typescript
describe('FollowButton Component', () => {
  test('should render follow button for unfollowed user', () => {
    // Given
    const props = {
      userId: 'user-123',
      followStatus: 'not_following',
      onFollow: jest.fn()
    };

    // When
    render(<FollowButton {...props} />);

    // Then
    expect(screen.getByText('フォロー')).toBeOnTheScreen();
    expect(screen.queryByText('フォロー中')).not.toBeOnTheScreen();
  });

  test('should render following button for followed user', () => {
    // Given
    const props = {
      userId: 'user-123',
      followStatus: 'following',
      followType: 'family',
      onUnfollow: jest.fn()
    };

    // When
    render(<FollowButton {...props} />);

    // Then
    expect(screen.getByText('フォロー中')).toBeOnTheScreen();
    expect(screen.getByTestId('follow-type-badge')).toHaveTextContent('ファミリー');
  });

  test('should show loading state during follow action', () => {
    // Given
    const props = {
      userId: 'user-123',
      followStatus: 'not_following',
      isLoading: true,
      onFollow: jest.fn()
    };

    // When
    render(<FollowButton {...props} />);

    // Then
    expect(screen.getByTestId('loading-spinner')).toBeOnTheScreen();
    expect(screen.getByText('フォロー')).toBeDisabled();
  });
});
```

### 2.1.2 フォローボタンインタラクション

```typescript
describe('FollowButton Interactions', () => {
  test('should open follow type selection modal on follow button press', async () => {
    // Given
    const mockOnFollow = jest.fn();
    const props = {
      userId: 'user-123',
      followStatus: 'not_following',
      onFollow: mockOnFollow
    };

    // When
    render(<FollowButton {...props} />);
    const followButton = screen.getByText('フォロー');
    
    await act(() => {
      fireEvent.press(followButton);
    });

    // Then
    expect(screen.getByText('フォローの種類を選択')).toBeOnTheScreen();
    expect(screen.getByText('ファミリーフォロー')).toBeOnTheScreen();
    expect(screen.getByText('ウォッチフォロー')).toBeOnTheScreen();
  });

  test('should open unfollow confirmation on long press', async () => {
    // Given
    const mockOnUnfollow = jest.fn();
    const props = {
      userId: 'user-123',
      followStatus: 'following',
      followType: 'watch',
      onUnfollow: mockOnUnfollow
    };

    // When
    render(<FollowButton {...props} />);
    const followingButton = screen.getByText('フォロー中');
    
    await act(() => {
      fireEvent(followingButton, 'longPress');
    });

    // Then
    expect(screen.getByText('アンフォロー')).toBeOnTheScreen();
    expect(screen.getByText('キャンセル')).toBeOnTheScreen();
  });
});
```

## 2.2 フォロー理由入力ダイアログ

### 2.2.1 ファミリーフォロー理由入力

```typescript
describe('FollowReasonDialog Component', () => {
  test('should render family follow reason input dialog', () => {
    // Given
    const props = {
      visible: true,
      followType: 'family',
      onSubmit: jest.fn(),
      onCancel: jest.fn()
    };

    // When
    render(<FollowReasonDialog {...props} />);

    // Then
    expect(screen.getByText('ファミリーフォローの理由')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('フォローする理由を入力してください'))
      .toBeOnTheScreen();
    expect(screen.getByText('フォロー')).toBeDisabled(); // 初期状態では無効
  });

  test('should enable submit button when reason is entered', async () => {
    // Given
    const mockOnSubmit = jest.fn();
    const props = {
      visible: true,
      followType: 'family',
      onSubmit: mockOnSubmit,
      onCancel: jest.fn()
    };

    // When
    render(<FollowReasonDialog {...props} />);
    const reasonInput = screen.getByPlaceholderText('フォローする理由を入力してください');
    
    await act(() => {
      fireEvent.changeText(reasonInput, '同じ価値観を持つ方だと感じたため');
    });

    // Then
    expect(screen.getByText('フォロー')).not.toBeDisabled();
  });

  test('should submit family follow with reason', async () => {
    // Given
    const mockOnSubmit = jest.fn();
    const props = {
      visible: true,
      followType: 'family',
      onSubmit: mockOnSubmit,
      onCancel: jest.fn()
    };

    // When
    render(<FollowReasonDialog {...props} />);
    const reasonInput = screen.getByPlaceholderText('フォローする理由を入力してください');
    
    await act(() => {
      fireEvent.changeText(reasonInput, 'テスト理由');
    });
    
    await act(() => {
      fireEvent.press(screen.getByText('フォロー'));
    });

    // Then
    expect(mockOnSubmit).toHaveBeenCalledWith({
      followType: 'family',
      followReason: 'テスト理由'
    });
  });
});
```

### 2.2.2 ウォッチフォロー即時実行

```typescript
describe('WatchFollowDialog Component', () => {
  test('should immediately execute watch follow', async () => {
    // Given
    const mockOnSubmit = jest.fn();
    const props = {
      visible: true,
      followType: 'watch',
      onSubmit: mockOnSubmit,
      onCancel: jest.fn()
    };

    // When
    render(<FollowReasonDialog {...props} />);
    
    await act(() => {
      fireEvent.press(screen.getByText('フォロー'));
    });

    // Then
    expect(mockOnSubmit).toHaveBeenCalledWith({
      followType: 'watch',
      followReason: null
    });
  });
});
```

## 2.3 フォロワー/フォロー中一覧コンポーネント

### 2.3.1 フォロワー一覧表示

```typescript
describe('FollowersList Component', () => {
  const mockFollowers = [
    {
      user: {
        id: 'user-1',
        displayName: 'ユーザー1',
        profileImageUrl: 'https://example.com/user1.jpg'
      },
      followType: 'family',
      followReason: 'テスト理由',
      isFollowingBack: true,
      createdAt: '2025-05-25T10:00:00Z'
    },
    {
      user: {
        id: 'user-2',
        displayName: 'ユーザー2',
        profileImageUrl: 'https://example.com/user2.jpg'
      },
      followType: 'watch',
      followReason: null,
      isFollowingBack: false,
      createdAt: '2025-05-25T11:00:00Z'
    }
  ];

  test('should render followers list', () => {
    // Given
    const props = {
      followers: mockFollowers,
      onLoadMore: jest.fn(),
      onUserPress: jest.fn()
    };

    // When
    render(<FollowersList {...props} />);

    // Then
    expect(screen.getByText('ユーザー1')).toBeOnTheScreen();
    expect(screen.getByText('ユーザー2')).toBeOnTheScreen();
    expect(screen.getByText('ファミリー')).toBeOnTheScreen();
    expect(screen.getByText('ウォッチ')).toBeOnTheScreen();
  });

  test('should show mutual follow indicator', () => {
    // Given
    const props = {
      followers: mockFollowers,
      onLoadMore: jest.fn(),
      onUserPress: jest.fn()
    };

    // When
    render(<FollowersList {...props} />);

    // Then
    expect(screen.getByTestId('mutual-follow-user-1')).toBeOnTheScreen();
    expect(screen.queryByTestId('mutual-follow-user-2')).not.toBeOnTheScreen();
  });

  test('should handle user press', async () => {
    // Given
    const mockOnUserPress = jest.fn();
    const props = {
      followers: mockFollowers,
      onLoadMore: jest.fn(),
      onUserPress: mockOnUserPress
    };

    // When
    render(<FollowersList {...props} />);
    
    await act(() => {
      fireEvent.press(screen.getByText('ユーザー1'));
    });

    // Then
    expect(mockOnUserPress).toHaveBeenCalledWith('user-1');
  });
});
```

### 2.3.2 フォロー中一覧表示

```typescript
describe('FollowingList Component', () => {
  const mockFollowing = [
    {
      user: {
        id: 'user-1',
        displayName: 'ユーザー1',
        profileImageUrl: 'https://example.com/user1.jpg'
      },
      followType: 'family',
      followReason: 'テスト理由',
      latestPost: {
        id: 'post-1',
        contentType: 'audio',
        textContent: '最新の音声投稿です',
        createdAt: '2025-05-25T12:00:00Z'
      },
      createdAt: '2025-05-25T10:00:00Z'
    }
  ];

  test('should render following list with latest posts', () => {
    // Given
    const props = {
      following: mockFollowing,
      onLoadMore: jest.fn(),
      onUserPress: jest.fn(),
      onPostPress: jest.fn()
    };

    // When
    render(<FollowingList {...props} />);

    // Then
    expect(screen.getByText('ユーザー1')).toBeOnTheScreen();
    expect(screen.getByText('最新の音声投稿です')).toBeOnTheScreen();
    expect(screen.getByTestId('post-type-audio')).toBeOnTheScreen();
  });

  test('should filter by follow type', async () => {
    // Given
    const mixedFollowing = [
      { ...mockFollowing[0], followType: 'family' },
      { ...mockFollowing[0], user: { ...mockFollowing[0].user, id: 'user-2' }, followType: 'watch' }
    ];
    const props = {
      following: mixedFollowing,
      selectedFilter: 'family',
      onFilterChange: jest.fn(),
      onLoadMore: jest.fn()
    };

    // When
    render(<FollowingList {...props} />);

    // Then
    expect(screen.getByTestId('follow-type-filter-family')).toHaveStyle({
      backgroundColor: expect.any(String) // アクティブな色
    });
  });
});
```

---

# 3. 結合テスト

## 3.1 フォロー処理の全体フロー

### 3.1.1 ファミリーフォロー完全フロー

```typescript
describe('Family Follow Integration', () => {
  test('should complete family follow flow with notification', async () => {
    // Given
    const targetUser = await createTestUser({
      displayName: 'テストユーザー',
      notificationSettings: { follow: true }
    });
    const currentUser = await createTestUser({
      displayName: '現在のユーザー'
    });

    // When
    render(<UserProfileScreen userId={targetUser.id} />);
    
    // Step 1: Press follow button
    await act(() => {
      fireEvent.press(screen.getByText('フォロー'));
    });

    // Step 2: Select family follow
    await act(() => {
      fireEvent.press(screen.getByText('ファミリーフォロー'));
    });

    // Step 3: Enter reason
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('フォローする理由を入力してください'),
        '素晴らしい投稿をされているため'
      );
    });

    // Step 4: Submit follow
    await act(() => {
      fireEvent.press(screen.getByText('フォロー'));
    });

    // Then
    await waitFor(() => {
      expect(screen.getByText('フォロー中')).toBeOnTheScreen();
    });

    // Verify notification was sent
    const notifications = await getNotificationsForUser(targetUser.id);
    expect(notifications).toContainEqual(
      expect.objectContaining({
        type: 'follow',
        data: expect.objectContaining({
          followType: 'family',
          followerName: '現在のユーザー'
        })
      })
    );
  });
});
```

### 3.1.2 アンフォロー完全フロー

```typescript
describe('Unfollow Integration', () => {
  test('should complete unfollow flow', async () => {
    // Given
    const targetUser = await createTestUser();
    const currentUser = await createTestUser();
    await createFollowRelation(currentUser.id, targetUser.id, 'watch');

    // When
    render(<UserProfileScreen userId={targetUser.id} />);
    
    // Step 1: Long press following button
    await act(() => {
      fireEvent(screen.getByText('フォロー中'), 'longPress');
    });

    // Step 2: Confirm unfollow
    await act(() => {
      fireEvent.press(screen.getByText('アンフォロー'));
    });

    // Step 3: Enter unfollow reason (optional)
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('理由を入力（任意）'),
        '投稿内容の方向性が変わったため'
      );
    });

    // Step 4: Confirm
    await act(() => {
      fireEvent.press(screen.getByText('確定'));
    });

    // Then
    await waitFor(() => {
      expect(screen.getByText('フォロー')).toBeOnTheScreen();
    });

    // Verify unfollow was recorded
    const followRecord = await getFollowRecord(currentUser.id, targetUser.id);
    expect(followRecord.status).toBe('unfollowed');
    expect(followRecord.unfollowReason).toBe('投稿内容の方向性が変わったため');
  });
});
```

## 3.2 リアルタイム更新テスト

### 3.2.1 フォロワー数のリアルタイム更新

```typescript
describe('Real-time Follow Updates', () => {
  test('should update follower count in real-time', async () => {
    // Given
    const targetUser = await createTestUser();
    const follower1 = await createTestUser();
    const follower2 = await createTestUser();

    // When
    render(<UserProfileScreen userId={targetUser.id} />);
    
    // Initially 0 followers
    expect(screen.getByText('フォロワー: 0')).toBeOnTheScreen();

    // Simulate real-time follow from another user
    await simulateFollowFromAnotherUser(follower1.id, targetUser.id, 'family');

    // Then
    await waitFor(() => {
      expect(screen.getByText('フォロワー: 1')).toBeOnTheScreen();
    });

    // Another follow
    await simulateFollowFromAnotherUser(follower2.id, targetUser.id, 'watch');

    await waitFor(() => {
      expect(screen.getByText('フォロワー: 2')).toBeOnTheScreen();
    });
  });
});
```

## 3.3 データ整合性テスト

### 3.3.1 フォロー状態の一貫性

```typescript
describe('Follow Data Consistency', () => {
  test('should maintain follow state consistency across screens', async () => {
    // Given
    const targetUser = await createTestUser();
    const currentUser = await createTestUser();

    // When
    // Screen 1: Profile screen follow
    const { unmount: unmountProfile } = render(
      <UserProfileScreen userId={targetUser.id} />
    );
    
    await act(() => {
      fireEvent.press(screen.getByText('フォロー'));
    });
    await act(() => {
      fireEvent.press(screen.getByText('ウォッチフォロー'));
    });

    await waitFor(() => {
      expect(screen.getByText('フォロー中')).toBeOnTheScreen();
    });

    unmountProfile();

    // Screen 2: Following list should show the user
    render(<FollowingListScreen />);
    
    await waitFor(() => {
      expect(screen.getByText(targetUser.displayName)).toBeOnTheScreen();
    });

    // Screen 3: Timeline should show posts from followed user
    render(<TimelineScreen type="watch" />);
    
    // Create a post from the followed user
    await createPostFromUser(targetUser.id, {
      contentType: 'text',
      textContent: 'テスト投稿'
    });

    await waitFor(() => {
      expect(screen.getByText('テスト投稿')).toBeOnTheScreen();
    });
  });
});
```

---

# 4. E2Eテスト

## 4.1 ユーザーストーリーベーステスト

### 4.1.1 新規ユーザーの初回フォロー体験

```typescript
describe('E2E: First Follow Experience', () => {
  test('should guide new user through first follow', async () => {
    // Given
    const newUser = await createNewUser({
      displayName: '新規ユーザー',
      isFirstTime: true
    });
    const recommendedUser = await createTestUser({
      displayName: 'おすすめユーザー',
      hasPopularPosts: true
    });

    // When
    await loginAsUser(newUser);
    await navigateToDiscoverScreen();

    // Step 1: See recommended users
    await waitFor(() => {
      expect(screen.getByText('おすすめのユーザー')).toBeOnTheScreen();
    });

    // Step 2: Tap on recommended user
    await act(() => {
      fireEvent.press(screen.getByText('おすすめユーザー'));
    });

    // Step 3: View profile and decide to follow
    await waitFor(() => {
      expect(screen.getByText('おすすめユーザー')).toBeOnTheScreen();
      expect(screen.getByText('フォロー')).toBeOnTheScreen();
    });

    // Step 4: Choose family follow (first time tutorial)
    await act(() => {
      fireEvent.press(screen.getByText('フォロー'));
    });

    await waitFor(() => {
      expect(screen.getByText('フォローの種類について')).toBeOnTheScreen();
    });

    await act(() => {
      fireEvent.press(screen.getByText('ファミリーフォローを選ぶ'));
    });

    // Step 5: Enter meaningful reason
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('フォローする理由を入力してください'),
        'スピリチュアルな投稿に共感しました'
      );
    });

    await act(() => {
      fireEvent.press(screen.getByText('フォロー'));
    });

    // Then
    await waitFor(() => {
      expect(screen.getByText('フォロー中')).toBeOnTheScreen();
      expect(screen.getByText('ファミリー')).toBeOnTheScreen();
    });

    // Verify the experience enhanced timeline
    await navigateToTimeline();
    await waitFor(() => {
      expect(screen.getByText('ファミリータイムライン')).toBeOnTheScreen();
    });
  });
});
```

### 4.1.2 相互フォロー発見と深い繋がり構築

```typescript
describe('E2E: Mutual Follow Discovery', () => {
  test('should facilitate mutual follow relationship', async () => {
    // Given
    const user1 = await createTestUser({ displayName: 'ユーザー1' });
    const user2 = await createTestUser({ displayName: 'ユーザー2' });

    // When
    // User1 follows User2 first
    await loginAsUser(user1);
    await searchAndFollowUser(user2.displayName, 'watch', '投稿に興味があります');

    // User2 discovers User1 followed them
    await loginAsUser(user2);
    await navigateToNotifications();

    await waitFor(() => {
      expect(screen.getByText('ユーザー1さんがあなたをフォローしました')).toBeOnTheScreen();
    });

    // User2 checks User1's profile
    await act(() => {
      fireEvent.press(screen.getByText('ユーザー1さんがあなたをフォローしました'));
    });

    await waitFor(() => {
      expect(screen.getByText('ユーザー1')).toBeOnTheScreen();
      expect(screen.getByText('あなたをフォロー中')).toBeOnTheScreen();
    });

    // User2 decides to follow back as family
    await act(() => {
      fireEvent.press(screen.getByText('フォロー'));
    });

    await act(() => {
      fireEvent.press(screen.getByText('ファミリーフォロー'));
    });

    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('フォローする理由を入力してください'),
        '私の投稿にも興味を持ってくれたので、ぜひ交流したいです'
      );
    });

    await act(() => {
      fireEvent.press(screen.getByText('フォロー'));
    });

    // Then
    await waitFor(() => {
      expect(screen.getByText('相互フォロー')).toBeOnTheScreen();
    });

    // Verify both users see enhanced content
    await navigateToTimeline();
    await waitFor(() => {
      expect(screen.getByText('ファミリータイムライン')).toBeOnTheScreen();
    });

    // User1 also sees the mutual relationship
    await loginAsUser(user1);
    await navigateToNotifications();

    await waitFor(() => {
      expect(screen.getByText('ユーザー2さんがあなたをファミリーフォローしました')).toBeOnTheScreen();
    });
  });
});
```

## 4.2 複数ユーザーシナリオ

### 4.2.1 コミュニティ形成シナリオ

```typescript
describe('E2E: Community Formation', () => {
  test('should enable community building through follows', async () => {
    // Given
    const spiritual_teacher = await createTestUser({
      displayName: 'スピリチュアル先生',
      userType: 'teacher',
      hasVerifiedBadge: true
    });
    const student1 = await createTestUser({ displayName: '生徒1' });
    const student2 = await createTestUser({ displayName: '生徒2' });
    const student3 = await createTestUser({ displayName: '生徒3' });

    // When
    // Teacher posts valuable content
    await loginAsUser(spiritual_teacher);
    await createPost({
      contentType: 'audio',
      textContent: '今日の瞑想ガイダンス',
      audioContent: 'meditation_guide.mp3'
    });

    // Students discover and follow teacher
    for (const student of [student1, student2, student3]) {
      await loginAsUser(student);
      await searchUser('スピリチュアル先生');
      await followUser('family', `${student.displayName}として深く学びたいです`);
    }

    // Students discover each other through teacher's followers
    await loginAsUser(student1);
    await navigateToUserProfile('スピリチュアル先生');
    await openFollowersList();

    await waitFor(() => {
      expect(screen.getByText('生徒2')).toBeOnTheScreen();
      expect(screen.getByText('生徒3')).toBeOnTheScreen();
    });

    // Follow fellow students
    await followUserFromList('生徒2', 'watch', '同じ先生から学ぶ仲間として');
    await followUserFromList('生徒3', 'watch', '一緒に成長していきましょう');

    // Then
    // Verify community timeline shows diverse content
    await navigateToTimeline();
    await waitFor(() => {
      expect(screen.getByText('今日の瞑想ガイダンス')).toBeOnTheScreen();
      expect(screen.getAllByText(/生徒[23]/).length).toBeGreaterThan(0);
    });

    // Teacher can see growing community
    await loginAsUser(spiritual_teacher);
    await navigateToFollowersList();
    
    await waitFor(() => {
      expect(screen.getAllByText(/生徒[123]/).length).toBe(3);
      expect(screen.getAllByText('ファミリー').length).toBe(3);
    });
  });
});
```

### 4.2.2 フォロー関係の自然な発展

```typescript
describe('E2E: Natural Follow Relationship Evolution', () => {
  test('should support relationship progression from watch to family', async () => {
    // Given
    const content_creator = await createTestUser({
      displayName: 'クリエイター',
      hasRegularPosts: true
    });
    const follower = await createTestUser({ displayName: 'フォロワー' });

    // When
    // Initial watch follow
    await loginAsUser(follower);
    await followUser(content_creator.id, 'watch');

    // Engage with content over time
    for (let day = 1; day <= 7; day++) {
      await simulateDayPassing();
      
      const posts = await getRecentPosts(content_creator.id);
      for (const post of posts) {
        await likePost(post.id);
        if (day % 3 === 0) {
          await commentOnPost(post.id, '素晴らしい内容ですね！');
        }
      }
    }

    // Creator notices active engagement
    await loginAsUser(content_creator);
    await checkNotifications();
    
    // Decide to upgrade to family follow
    await loginAsUser(follower);
    await navigateToUserProfile(content_creator.id);
    
    await act(() => {
      fireEvent(screen.getByText('フォロー中'), 'longPress');
    });

    await act(() => {
      fireEvent.press(screen.getByText('ファミリーフォローに変更'));
    });

    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('変更理由を入力してください'),
        '一週間拝見して、本当に深い学びがあると感じました。より近くで学ばせていただきたいです。'
      );
    });

    await act(() => {
      fireEvent.press(screen.getByText('変更'));
    });

    // Then
    await waitFor(() => {
      expect(screen.getByText('ファミリー')).toBeOnTheScreen();
    });

    // Creator receives upgrade notification
    await loginAsUser(content_creator);
    await waitFor(() => {
      expect(screen.getByText('フォロワーさんがファミリーフォローに変更しました')).toBeOnTheScreen();
    });
  });
});
```

## 4.3 エラーシナリオと復旧テスト

### 4.3.1 ネットワーク断続時のフォロー操作

```typescript
describe('E2E: Network Resilience', () => {
  test('should handle follow actions during network interruption', async () => {
    // Given
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    // When
    await loginAsUser(user1);
    await navigateToUserProfile(user2.id);

    // Start follow action
    await act(() => {
      fireEvent.press(screen.getByText('フォロー'));
    });

    await act(() => {
      fireEvent.press(screen.getByText('ファミリーフォロー'));
    });

    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('フォローする理由を入力してください'),
        'ネットワークテスト用理由'
      );
    });

    // Simulate network disconnection
    await simulateNetworkDisconnection();

    await act(() => {
      fireEvent.press(screen.getByText('フォロー'));
    });

    // Should show offline indicator
    await waitFor(() => {
      expect(screen.getByText('オフライン状態です')).toBeOnTheScreen();
      expect(screen.getByText('接続復旧時に送信されます')).toBeOnTheScreen();
    });

    // Restore network
    await simulateNetworkReconnection();

    // Then
    await waitFor(() => {
      expect(screen.getByText('フォロー中')).toBeOnTheScreen();
    }, { timeout: 10000 });

    // Verify follow was actually created
    const followRecord = await getFollowRecord(user1.id, user2.id);
    expect(followRecord.followType).toBe('family');
    expect(followRecord.followReason).toBe('ネットワークテスト用理由');
  });
});
```

---

# 5. テスト実行計画

## 5.1 CI/CDパイプラインでの実行順序

```typescript
// Jest configuration for different test types
module.exports = {
  projects: [
    {
      displayName: 'API Unit Tests',
      testMatch: ['<rootDir>/src/**/*.api.test.{js,ts}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/test/setup/api.ts']
    },
    {
      displayName: 'UI Unit Tests',
      testMatch: ['<rootDir>/src/**/*.component.test.{js,ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/test/setup/ui.ts']
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/test/integration/**/*.test.{js,ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/test/setup/integration.ts']
    },
    {
      displayName: 'E2E Tests',
      testMatch: ['<rootDir>/test/e2e/**/*.test.{js,ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/test/setup/e2e.ts']
    }
  ]
};
```

## 5.2 テストデータ管理

### 5.2.1 テスト用ユーザー作成ヘルパー

```typescript
// test/helpers/userHelpers.ts
export const createTestUser = async (options: Partial<User> = {}): Promise<User> => {
  const defaultUser: Partial<User> = {
    displayName: `テストユーザー${Date.now()}`,
    profileText: 'テストプロフィール',
    notificationSettings: {
      comment: true,
      highlight: true,
      follow: true,
      gift: true
    }
  };

  return await userApi.createUser({ ...defaultUser, ...options });
};

export const createFollowRelation = async (
  followerId: string,
  followeeId: string,
  followType: 'family' | 'watch',
  reason?: string
): Promise<Follow> => {
  return await followApi.createFollow({
    followeeId,
    followType,
    followReason: reason || (followType === 'family' ? 'テスト理由' : null)
  });
};
```

### 5.2.2 モックサービス設定

```typescript
// test/setup/mocks.ts
export const setupMocks = () => {
  // Notification service mock
  jest.mock('@/services/notificationService', () => ({
    sendPushNotification: jest.fn().mockResolvedValue(true),
    createNotification: jest.fn().mockResolvedValue({ id: 'notification-id' })
  }));

  // Real-time service mock
  jest.mock('@/services/realtimeService', () => ({
    subscribe: jest.fn(),
    broadcast: jest.fn(),
    unsubscribe: jest.fn()
  }));

  // Storage service mock (use real implementation for integration tests)
  if (process.env.TEST_TYPE !== 'integration') {
    jest.mock('@/services/storageService', () => ({
      uploadImage: jest.fn().mockResolvedValue('https://test.com/image.jpg'),
      uploadAudio: jest.fn().mockResolvedValue('https://test.com/audio.mp3')
    }));
  }
};
```

## 5.3 カバレッジ目標

| テストタイプ | 目標カバレッジ | 重要ファイル |
|-------------|---------------|--------------|
| APIユニット | 95%+ | followApi.ts, followService.ts |
| UIユニット | 90%+ | FollowButton.tsx, FollowDialog.tsx |
| 結合テスト | 85%+ | フォロー関連コンポーネント群 |
| E2Eテスト | 主要ユーザーフロー100% | 全体的なフロー |

---

# 6. テスト実装時の注意事項

## 6.1 非同期処理のテスト

```typescript
// ❌ Bad: タイムアウトなしの待機
test('should update follow status', async () => {
  await followUser();
  expect(screen.getByText('フォロー中')).toBeOnTheScreen();
});

// ✅ Good: 適切なタイムアウトと条件指定
test('should update follow status', async () => {
  await followUser();
  await waitFor(() => {
    expect(screen.getByText('フォロー中')).toBeOnTheScreen();
  }, { timeout: 5000 });
});
```

## 6.2 状態管理のテスト

```typescript
// フォロー状態の変更が他のコンポーネントに正しく反映されることを確認
test('should update follow state across components', async () => {
  const { rerender } = render(<FollowButton userId="user-123" />);
  
  await followUser('user-123');
  
  rerender(<FollowButton userId="user-123" />);
  
  await waitFor(() => {
    expect(screen.getByText('フォロー中')).toBeOnTheScreen();
  });
});
```

## 6.3 エラーハンドリングのテスト

```typescript
// すべてのエラーケースを網羅的にテスト
describe('Error Handling', () => {
  test.each([
    [400, 'VALIDATION_ERROR', 'バリデーションエラー'],
    [401, 'UNAUTHORIZED', '認証エラー'],
    [403, 'FORBIDDEN', '権限エラー'],
    [429, 'RATE_LIMIT_EXCEEDED', 'レート制限エラー'],
    [500, 'INTERNAL_ERROR', 'サーバーエラー']
  ])('should handle %i error correctly', async (status, type, expectedMessage) => {
    mockApiError(status, type);
    
    await followUser();
    
    await waitFor(() => {
      expect(screen.getByText(expectedMessage)).toBeOnTheScreen();
    });
  });
});
```

このテスト仕様書により、フォロー機能の全ての側面を包括的にテストし、高品質で信頼性の高い実装を保証することができます。