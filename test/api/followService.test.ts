import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  DrizzleFollow,
  FollowCreateInput,
  FollowStatus,
  FollowType,
  FollowUpdateInput,
  ServiceResult,
} from '../../src/lib/data';
import { FollowService, createFollowService } from '../../src/lib/followService';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  storage: {
    from: vi.fn(),
  },
  auth: {
    getUser: vi.fn(),
  },
  rpc: vi.fn(),
};

// Mock database client
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  query: {
    follows: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    profiles: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
  transaction: vi.fn(),
};

describe('FollowService - フォロー作成機能', () => {
  let followService: FollowService;
  const mockFollowerId = 'user-123';
  const mockFolloweeId = 'user-456';

  beforeEach(() => {
    vi.clearAllMocks();
    followService = createFollowService(mockSupabaseClient as any, mockDb as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ファミリーフォロー', () => {
    it('理由ありの場合、正常にフォローが作成されること', async () => {
      const followInput: FollowCreateInput = {
        followerId: mockFollowerId,
        followeeId: mockFolloweeId,
        followType: 'family' as FollowType,
        followReason: 'とても価値のあるコンテンツを提供してくれるから',
      };

      const mockCreatedFollow = {
        id: 'follow-123',
        followerId: mockFollowerId,
        followeeId: mockFolloweeId,
        followType: 'family',
        status: 'active',
        followReason: followInput.followReason,
        createdAt: new Date(),
        unfollowedAt: null,
        unfollowReason: null,
      };

      // Mock existing follow check
      mockDb.query.follows.findFirst.mockResolvedValue(null);

      // Mock self-follow check (different users)
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockCreatedFollow]),
        }),
      });

      const result = await followService.createFollow(followInput);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          followerId: mockFollowerId,
          followeeId: mockFolloweeId,
          followType: 'family',
          followReason: followInput.followReason,
          status: 'active',
        })
      );
      expect(result.error).toBeNull();
    });

    it('理由なしの場合、エラーが発生すること', async () => {
      const followInput: FollowCreateInput = {
        followerId: mockFollowerId,
        followeeId: mockFolloweeId,
        followType: 'family' as FollowType,
        // followReason: なし
      };

      const result = await followService.createFollow(followInput);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Family follow requires a reason');
      expect(result.data).toBeNull();
    });
  });

  describe('ウォッチフォロー', () => {
    it('理由なしの場合、正常にフォローが作成されること', async () => {
      const followInput: FollowCreateInput = {
        followerId: mockFollowerId,
        followeeId: mockFolloweeId,
        followType: 'watch' as FollowType,
      };

      const mockCreatedFollow = {
        id: 'follow-456',
        followerId: mockFollowerId,
        followeeId: mockFolloweeId,
        followType: 'watch',
        status: 'active',
        followReason: null,
        createdAt: new Date(),
        unfollowedAt: null,
        unfollowReason: null,
      };

      mockDb.query.follows.findFirst.mockResolvedValue(null);
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockCreatedFollow]),
        }),
      });

      const result = await followService.createFollow(followInput);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          followerId: mockFollowerId,
          followeeId: mockFolloweeId,
          followType: 'watch',
          followReason: null,
          status: 'active',
        })
      );
      expect(result.error).toBeNull();
    });

    it('理由ありの場合でも正常にフォローが作成されること', async () => {
      const followInput: FollowCreateInput = {
        followerId: mockFollowerId,
        followeeId: mockFolloweeId,
        followType: 'watch' as FollowType,
        followReason: '興味深い内容が多いから',
      };

      const mockCreatedFollow = {
        id: 'follow-789',
        followerId: mockFollowerId,
        followeeId: mockFolloweeId,
        followType: 'watch',
        status: 'active',
        followReason: followInput.followReason,
        createdAt: new Date(),
        unfollowedAt: null,
        unfollowReason: null,
      };

      mockDb.query.follows.findFirst.mockResolvedValue(null);
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockCreatedFollow]),
        }),
      });

      const result = await followService.createFollow(followInput);

      expect(result.success).toBe(true);
      expect(result.data!.followReason).toBe(followInput.followReason);
      expect(result.error).toBeNull();
    });
  });

  describe('フォロー作成異常系', () => {
    it('重複フォローの場合、エラーが発生すること', async () => {
      const followInput: FollowCreateInput = {
        followerId: mockFollowerId,
        followeeId: mockFolloweeId,
        followType: 'watch' as FollowType,
      };

      const existingFollow = {
        id: 'existing-follow',
        followerId: mockFollowerId,
        followeeId: mockFolloweeId,
        followType: 'watch',
        status: 'active',
        followReason: null,
        createdAt: new Date(),
        unfollowedAt: null,
        unfollowReason: null,
      };

      mockDb.query.follows.findFirst.mockResolvedValue(existingFollow);

      const result = await followService.createFollow(followInput);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Already following this user');
      expect(result.data).toBeNull();
    });

    it('自分自身をフォローしようとした場合、エラーが発生すること', async () => {
      const selfFollowInput: FollowCreateInput = {
        followerId: mockFollowerId,
        followeeId: mockFollowerId, // 同じユーザーID
        followType: 'watch' as FollowType,
      };

      const result = await followService.createFollow(selfFollowInput);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Cannot follow yourself');
      expect(result.data).toBeNull();
    });
  });
});

describe('FollowService - アンフォロー機能', () => {
  let followService: FollowService;
  const mockFollowerId = 'user-123';
  const mockFollowId = 'follow-123';

  beforeEach(() => {
    vi.clearAllMocks();
    followService = createFollowService(mockSupabaseClient as any, mockDb as any);
  });

  describe('アンフォロー正常系', () => {
    it('理由ありアンフォローが正常に実行されること', async () => {
      const unfollowReason = '投稿内容が合わなくなったため';
      const existingFollow = {
        id: mockFollowId,
        followerId: mockFollowerId,
        followeeId: 'user-456',
        followType: 'family',
        status: 'active',
        followReason: '以前の理由',
        createdAt: new Date(),
        unfollowedAt: null,
        unfollowReason: null,
      };

      mockDb.query.follows.findFirst.mockResolvedValue(existingFollow);
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        }),
      });

      const result = await followService.unfollow(mockFollowId, mockFollowerId, unfollowReason);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it('理由なしアンフォローが正常に実行されること', async () => {
      const existingFollow = {
        id: mockFollowId,
        followerId: mockFollowerId,
        followeeId: 'user-456',
        followType: 'watch',
        status: 'active',
        followReason: null,
        createdAt: new Date(),
        unfollowedAt: null,
        unfollowReason: null,
      };

      mockDb.query.follows.findFirst.mockResolvedValue(existingFollow);
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        }),
      });

      const result = await followService.unfollow(mockFollowId, mockFollowerId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('アンフォロー異常系', () => {
    it('存在しないフォローのアンフォローでエラーが発生すること', async () => {
      mockDb.query.follows.findFirst.mockResolvedValue(null);

      const result = await followService.unfollow('non-existent-follow', mockFollowerId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Follow relationship not found');
      expect(result.data).toBeNull();
    });

    it('他ユーザーのフォロー関係のアンフォローでエラーが発生すること', async () => {
      const otherUserFollow = {
        id: mockFollowId,
        followerId: 'other-user-789', // 別のユーザー
        followeeId: 'user-456',
        followType: 'watch',
        status: 'active',
        followReason: null,
        createdAt: new Date(),
        unfollowedAt: null,
        unfollowReason: null,
      };

      mockDb.query.follows.findFirst.mockResolvedValue(otherUserFollow);

      const result = await followService.unfollow(mockFollowId, mockFollowerId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('You can only unfollow your own follows');
      expect(result.data).toBeNull();
    });
  });
});

describe('FollowService - フォロワー/フォロー中一覧', () => {
  let followService: FollowService;
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    followService = createFollowService(mockSupabaseClient as any, mockDb as any);
  });

  describe('フォロワー一覧取得', () => {
    it('ページネーション付きフォロワー一覧を正常に取得できること', async () => {
      const mockFollowers = [
        {
          id: 'follow-1',
          followerId: 'user-1',
          followeeId: mockUserId,
          followType: 'family',
          status: 'active',
          followReason: '理由1',
          createdAt: new Date('2024-01-01'),
          unfollowedAt: null,
          unfollowReason: null,
        },
        {
          id: 'follow-2',
          followerId: 'user-2',
          followeeId: mockUserId,
          followType: 'watch',
          status: 'active',
          followReason: null,
          createdAt: new Date('2024-01-02'),
          unfollowedAt: null,
          unfollowReason: null,
        },
      ];

      mockDb.query.follows.findMany.mockResolvedValue(mockFollowers);

      const result = await followService.getFollowers(mockUserId, 20);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].followType).toBe('family');
      expect(result.data![1].followType).toBe('watch');
      expect(result.error).toBeNull();
    });

    it('フォロワーがいないユーザーの一覧取得で空配列が返されること', async () => {
      mockDb.query.follows.findMany.mockResolvedValue([]);

      const result = await followService.getFollowers('user-no-followers', 20);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe('フォロー中一覧取得', () => {
    it('フォロー中一覧を正常に取得できること', async () => {
      const mockFollowing = [
        {
          id: 'follow-3',
          followerId: mockUserId,
          followeeId: 'user-3',
          followType: 'family',
          status: 'active',
          followReason: '素晴らしいコンテンツ',
          createdAt: new Date('2024-01-03'),
          unfollowedAt: null,
          unfollowReason: null,
        },
        {
          id: 'follow-4',
          followerId: mockUserId,
          followeeId: 'user-4',
          followType: 'watch',
          status: 'active',
          followReason: null,
          createdAt: new Date('2024-01-04'),
          unfollowedAt: null,
          unfollowReason: null,
        },
      ];

      mockDb.query.follows.findMany.mockResolvedValue(mockFollowing);

      const result = await followService.getFollowing(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].followeeId).toBe('user-3');
      expect(result.data![1].followeeId).toBe('user-4');
      expect(result.error).toBeNull();
    });

    it('フォロータイプでフィルタリングできること', async () => {
      const mockFamilyFollows = [
        {
          id: 'follow-5',
          followerId: mockUserId,
          followeeId: 'user-5',
          followType: 'family',
          status: 'active',
          followReason: 'ファミリー理由',
          createdAt: new Date('2024-01-05'),
          unfollowedAt: null,
          unfollowReason: null,
        },
      ];

      mockDb.query.follows.findMany.mockResolvedValue(mockFamilyFollows);

      const result = await followService.getFollowing(mockUserId, 'family');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].followType).toBe('family');
      expect(result.error).toBeNull();
    });
  });

  describe('相互フォロー確認', () => {
    it('相互フォロー状態を正常に確認できること', async () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';

      // user1 -> user2, user2 -> user1 の双方向フォロー
      mockDb.query.follows.findFirst
        .mockResolvedValueOnce({
          // user1 follows user2
          id: 'follow-a',
          followerId: userId1,
          followeeId: userId2,
          followType: 'family',
          status: 'active',
        })
        .mockResolvedValueOnce({
          // user2 follows user1
          id: 'follow-b',
          followerId: userId2,
          followeeId: userId1,
          followType: 'watch',
          status: 'active',
        });

      const result = await followService.checkMutualFollow(userId1, userId2);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        isMutual: true,
        user1FollowsUser2: true,
        user2FollowsUser1: true,
      });
      expect(result.error).toBeNull();
    });

    it('一方向フォローの場合、相互フォローでないことが確認できること', async () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';

      // user1 -> user2 のみ（user2 -> user1 なし）
      mockDb.query.follows.findFirst
        .mockResolvedValueOnce({
          // user1 follows user2
          id: 'follow-a',
          followerId: userId1,
          followeeId: userId2,
          followType: 'watch',
          status: 'active',
        })
        .mockResolvedValueOnce(null); // user2 does not follow user1

      const result = await followService.checkMutualFollow(userId1, userId2);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        isMutual: false,
        user1FollowsUser2: true,
        user2FollowsUser1: false,
      });
      expect(result.error).toBeNull();
    });
  });
});
