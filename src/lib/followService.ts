import { and, count, desc, eq } from 'drizzle-orm';
import {
  type DrizzleFollow,
  type FollowCreateInput,
  type FollowStatus,
  type FollowType,
  FollowUpdateInput,
  type MutualFollowInfo,
  type ServiceResult,
} from './data';
import { db } from './db/client';
import { follows } from './db/schema';
import { supabase } from './supabase';

export interface FollowService {
  createFollow(input: FollowCreateInput): Promise<ServiceResult<DrizzleFollow>>;
  unfollow(
    followId: string,
    userId: string,
    unfollowReason?: string
  ): Promise<ServiceResult<boolean>>;
  getFollowers(
    userId: string,
    limit?: number,
    cursor?: string
  ): Promise<ServiceResult<DrizzleFollow[]>>;
  getFollowing(userId: string, followType?: FollowType): Promise<ServiceResult<DrizzleFollow[]>>;
  checkMutualFollow(userId1: string, userId2: string): Promise<ServiceResult<MutualFollowInfo>>;
  getFollowStats(
    userId: string
  ): Promise<ServiceResult<{ followersCount: number; followingCount: number }>>;
  getFollowStatsByType(
    userId: string
  ): Promise<ServiceResult<{
    family: { followersCount: number; followingCount: number };
    watch: { followersCount: number; followingCount: number };
  }>>;
}

export function createFollowService(supabaseClient = supabase, dbClient = db): FollowService {
  return {
    async createFollow(input: FollowCreateInput): Promise<ServiceResult<DrizzleFollow>> {
      try {
        // Validation: Cannot follow yourself
        if (input.followerId === input.followeeId) {
          return {
            success: false,
            data: null,
            error: new Error('自分自身をフォローすることはできません'),
          };
        }

        // Validation: Family follow requires a reason
        if (
          input.followType === 'family' &&
          (!input.followReason || input.followReason.trim() === '')
        ) {
          return {
            success: false,
            data: null,
            error: new Error('ファミリーフォローには理由が必要です'),
          };
        }

        // Check if already following
        const existingFollow = await dbClient.query.follows.findFirst({
          where: and(
            eq(follows.followerId, input.followerId),
            eq(follows.followeeId, input.followeeId),
            eq(follows.status, 'active')
          ),
        });

        if (existingFollow) {
          return {
            success: false,
            data: null,
            error: new Error('既にこのユーザーをフォローしています'),
          };
        }

        // Create follow relationship
        const [createdFollow] = await dbClient
          .insert(follows)
          .values({
            followerId: input.followerId,
            followeeId: input.followeeId,
            followType: input.followType,
            status: 'active' as FollowStatus,
            followReason: input.followReason?.trim() || null,
            createdAt: new Date(),
          })
          .returning();

        return {
          success: true,
          data: createdFollow,
          error: null,
        };
      } catch (error) {
        console.error('Error creating follow:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },

    async unfollow(
      followId: string,
      userId: string,
      unfollowReason?: string
    ): Promise<ServiceResult<boolean>> {
      try {
        // Check if follow exists and user owns it
        const existingFollow = await dbClient.query.follows.findFirst({
          where: and(eq(follows.id, followId), eq(follows.status, 'active')),
        });

        if (!existingFollow) {
          return {
            success: false,
            data: null,
            error: new Error('フォロー関係が見つかりません'),
          };
        }

        if (existingFollow.followerId !== userId) {
          return {
            success: false,
            data: null,
            error: new Error('自分のフォローのみ解除できます'),
          };
        }

        // Update follow status to unfollowed
        const result = await dbClient
          .update(follows)
          .set({
            status: 'unfollowed' as FollowStatus,
            unfollowedAt: new Date(),
            unfollowReason: unfollowReason?.trim() || null,
          })
          .where(eq(follows.id, followId));

        return {
          success: true,
          data: result.rowCount > 0,
          error: null,
        };
      } catch (error) {
        console.error('Error unfollowing:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },

    async getFollowers(
      userId: string,
      limit = 20,
      cursor?: string
    ): Promise<ServiceResult<DrizzleFollow[]>> {
      try {
        // モックデータを使用する場合
        if (process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true') {
          const mockFollowersData: DrizzleFollow[] = [
            {
              id: '3',
              followerId: '2',
              followeeId: userId,
              followType: 'watch',
              status: 'active',
              followReason: null,
              unfollowReason: null,
              createdAt: new Date('2024-01-03'),
              updatedAt: new Date('2024-01-03'),
            },
          ];

          return {
            success: true,
            data: mockFollowersData,
            error: null,
          };
        }

        const followersData = await dbClient.query.follows.findMany({
          where: and(eq(follows.followeeId, userId), eq(follows.status, 'active')),
          orderBy: [desc(follows.createdAt)],
          limit: limit,
        });

        return {
          success: true,
          data: followersData,
          error: null,
        };
      } catch (error) {
        console.error('Error getting followers:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },

    async getFollowing(
      userId: string,
      followType?: FollowType
    ): Promise<ServiceResult<DrizzleFollow[]>> {
      try {
        // モックデータを使用する場合
        if (process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true') {
          // モックフォローデータを返す
          const mockFollowData: DrizzleFollow[] = [
            {
              id: '1',
              followerId: userId,
              followeeId: '2',
              followType: followType || 'watch',
              status: 'active',
              followReason: null,
              unfollowReason: null,
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            },
            {
              id: '2',
              followerId: userId,
              followeeId: '3',
              followType: followType || 'watch',
              status: 'active',
              followReason: null,
              unfollowReason: null,
              createdAt: new Date('2024-01-02'),
              updatedAt: new Date('2024-01-02'),
            },
          ];

          return {
            success: true,
            data: mockFollowData,
            error: null,
          };
        }

        const conditions = [eq(follows.followerId, userId), eq(follows.status, 'active')];

        if (followType) {
          conditions.push(eq(follows.followType, followType));
        }

        const followingData = await dbClient.query.follows.findMany({
          where: and(...conditions),
          orderBy: [desc(follows.createdAt)],
        });

        return {
          success: true,
          data: followingData,
          error: null,
        };
      } catch (error) {
        console.error('Error getting following:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },

    async checkMutualFollow(
      userId1: string,
      userId2: string
    ): Promise<ServiceResult<MutualFollowInfo>> {
      try {
        // モックデータを使用する場合
        if (process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true') {
          const mutualInfo: MutualFollowInfo = {
            isMutual: false,
            user1FollowsUser2: true,
            user2FollowsUser1: false,
          };

          return {
            success: true,
            data: mutualInfo,
            error: null,
          };
        }

        // Check if user1 follows user2
        const user1FollowsUser2 = await dbClient.query.follows.findFirst({
          where: and(
            eq(follows.followerId, userId1),
            eq(follows.followeeId, userId2),
            eq(follows.status, 'active')
          ),
        });

        // Check if user2 follows user1
        const user2FollowsUser1 = await dbClient.query.follows.findFirst({
          where: and(
            eq(follows.followerId, userId2),
            eq(follows.followeeId, userId1),
            eq(follows.status, 'active')
          ),
        });

        const mutualInfo: MutualFollowInfo = {
          isMutual: !!user1FollowsUser2 && !!user2FollowsUser1,
          user1FollowsUser2: !!user1FollowsUser2,
          user2FollowsUser1: !!user2FollowsUser1,
        };

        return {
          success: true,
          data: mutualInfo,
          error: null,
        };
      } catch (error) {
        console.error('Error checking mutual follow:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },

    async getFollowStats(
      userId: string
    ): Promise<ServiceResult<{ followersCount: number; followingCount: number }>> {
      try {
        // モックデータを使用する場合
        if (process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true') {
          return {
            success: true,
            data: {
              followersCount: 42,
              followingCount: 17,
            },
            error: null,
          };
        }

        // Count followers
        const [followersCountResult] = await dbClient
          .select({ count: count() })
          .from(follows)
          .where(and(eq(follows.followeeId, userId), eq(follows.status, 'active')));

        // Count following
        const [followingCountResult] = await dbClient
          .select({ count: count() })
          .from(follows)
          .where(and(eq(follows.followerId, userId), eq(follows.status, 'active')));

        return {
          success: true,
          data: {
            followersCount: followersCountResult.count,
            followingCount: followingCountResult.count,
          },
          error: null,
        };
      } catch (error) {
        console.error('Error getting follow stats:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },

    async getFollowStatsByType(
      userId: string
    ): Promise<ServiceResult<{
      family: { followersCount: number; followingCount: number };
      watch: { followersCount: number; followingCount: number };
    }>> {
      try {
        // モックデータを使用する場合
        if (process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true') {
          return {
            success: true,
            data: {
              family: {
                followersCount: 15,
                followingCount: 8,
              },
              watch: {
                followersCount: 27,
                followingCount: 9,
              },
            },
            error: null,
          };
        }

        // Count family followers
        const [familyFollowersResult] = await dbClient
          .select({ count: count() })
          .from(follows)
          .where(and(
            eq(follows.followeeId, userId),
            eq(follows.status, 'active'),
            eq(follows.followType, 'family')
          ));

        // Count family following
        const [familyFollowingResult] = await dbClient
          .select({ count: count() })
          .from(follows)
          .where(and(
            eq(follows.followerId, userId),
            eq(follows.status, 'active'),
            eq(follows.followType, 'family')
          ));

        // Count watch followers
        const [watchFollowersResult] = await dbClient
          .select({ count: count() })
          .from(follows)
          .where(and(
            eq(follows.followeeId, userId),
            eq(follows.status, 'active'),
            eq(follows.followType, 'watch')
          ));

        // Count watch following
        const [watchFollowingResult] = await dbClient
          .select({ count: count() })
          .from(follows)
          .where(and(
            eq(follows.followerId, userId),
            eq(follows.status, 'active'),
            eq(follows.followType, 'watch')
          ));

        return {
          success: true,
          data: {
            family: {
              followersCount: familyFollowersResult.count,
              followingCount: familyFollowingResult.count,
            },
            watch: {
              followersCount: watchFollowersResult.count,
              followingCount: watchFollowingResult.count,
            },
          },
          error: null,
        };
      } catch (error) {
        console.error('Error getting follow stats by type:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },
  };
}

// Default export - service instance
export const followServiceInstance = createFollowService();

// Backward compatibility - export the old interface
export const followService = {
  async createFollow(params: {
    followerId: string;
    followeeId: string;
    followType: 'family' | 'watch';
    followReason?: string;
  }) {
    const result = await followServiceInstance.createFollow(params);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  },

  async unfollowUser(params: {
    followId: string;
    userId: string;
    unfollowReason?: string;
  }) {
    const result = await followServiceInstance.unfollow(
      params.followId,
      params.userId,
      params.unfollowReason
    );
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  },

  async getFollowers(params: {
    userId: string;
    limit?: number;
    cursor?: string;
  }) {
    const result = await followServiceInstance.getFollowers(
      params.userId,
      params.limit,
      params.cursor
    );
    if (!result.success) {
      throw result.error;
    }
    return {
      followers: result.data,
      nextCursor: null, // Legacy interface
    };
  },

  async getFollowing(params: {
    userId: string;
    type?: 'family' | 'watch';
    limit?: number;
    cursor?: string;
  }) {
    const result = await followServiceInstance.getFollowing(params.userId, params.type);
    if (!result.success) {
      throw result.error;
    }
    return {
      following: result.data,
      nextCursor: null, // Legacy interface
    };
  },
};
