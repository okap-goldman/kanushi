import { describe, expect, test, jest } from '@jest/globals';

// Mock followApi for testing
const followApi = {
  createFollow: jest.fn(),
  unfollowUser: jest.fn(),
  getFollowers: jest.fn(),
  getFollowing: jest.fn()
};

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