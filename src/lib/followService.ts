import { supabase } from './supabase';
import { db } from './db/client';
import { follows } from './db/schema';
import { 
  FollowCreateInput, FollowUpdateInput, FollowType, FollowStatus,
  DrizzleFollow, MutualFollowInfo, ServiceResult
} from './data';
import { eq, and, desc, count } from 'drizzle-orm';

export interface FollowService {
  createFollow(input: FollowCreateInput): Promise<ServiceResult<DrizzleFollow>>;
  unfollow(followId: string, userId: string, unfollowReason?: string): Promise<ServiceResult<boolean>>;
  getFollowers(userId: string, limit?: number, cursor?: string): Promise<ServiceResult<DrizzleFollow[]>>;
  getFollowing(userId: string, followType?: FollowType): Promise<ServiceResult<DrizzleFollow[]>>;
  checkMutualFollow(userId1: string, userId2: string): Promise<ServiceResult<MutualFollowInfo>>;
  getFollowStats(userId: string): Promise<ServiceResult<{ followersCount: number; followingCount: number }>>;
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
            error: new Error('Cannot follow yourself')
          };
        }

        // Validation: Family follow requires a reason
        if (input.followType === 'family' && (!input.followReason || input.followReason.trim() === '')) {
          return {
            success: false,
            data: null,
            error: new Error('Family follow requires a reason')
          };
        }

        // Check if already following
        const existingFollow = await dbClient.query.follows.findFirst({
          where: and(
            eq(follows.followerId, input.followerId),
            eq(follows.followeeId, input.followeeId),
            eq(follows.status, 'active')
          )
        });

        if (existingFollow) {
          return {
            success: false,
            data: null,
            error: new Error('Already following this user')
          };
        }

        // Create follow relationship
        const [createdFollow] = await dbClient.insert(follows).values({
          followerId: input.followerId,
          followeeId: input.followeeId,
          followType: input.followType,
          status: 'active' as FollowStatus,
          followReason: input.followReason?.trim() || null,
          createdAt: new Date()
        }).returning();

        return {
          success: true,
          data: createdFollow,
          error: null
        };

      } catch (error) {
        console.error('Error creating follow:', error);
        return {
          success: false,
          data: null,
          error: error as Error
        };
      }
    },

    async unfollow(followId: string, userId: string, unfollowReason?: string): Promise<ServiceResult<boolean>> {
      try {
        // Check if follow exists and user owns it
        const existingFollow = await dbClient.query.follows.findFirst({
          where: and(eq(follows.id, followId), eq(follows.status, 'active'))
        });

        if (!existingFollow) {
          return {
            success: false,
            data: null,
            error: new Error('Follow relationship not found')
          };
        }

        if (existingFollow.followerId !== userId) {
          return {
            success: false,
            data: null,
            error: new Error('You can only unfollow your own follows')
          };
        }

        // Update follow status to unfollowed
        const result = await dbClient.update(follows)
          .set({
            status: 'unfollowed' as FollowStatus,
            unfollowedAt: new Date(),
            unfollowReason: unfollowReason?.trim() || null
          })
          .where(eq(follows.id, followId));

        return {
          success: true,
          data: result.rowCount > 0,
          error: null
        };

      } catch (error) {
        console.error('Error unfollowing:', error);
        return {
          success: false,
          data: null,
          error: error as Error
        };
      }
    },

    async getFollowers(userId: string, limit = 20, cursor?: string): Promise<ServiceResult<DrizzleFollow[]>> {
      try {
        const followersData = await dbClient.query.follows.findMany({
          where: and(
            eq(follows.followeeId, userId),
            eq(follows.status, 'active')
          ),
          orderBy: [desc(follows.createdAt)],
          limit: limit
        });

        return {
          success: true,
          data: followersData,
          error: null
        };

      } catch (error) {
        console.error('Error getting followers:', error);
        return {
          success: false,
          data: null,
          error: error as Error
        };
      }
    },

    async getFollowing(userId: string, followType?: FollowType): Promise<ServiceResult<DrizzleFollow[]>> {
      try {
        const conditions = [
          eq(follows.followerId, userId),
          eq(follows.status, 'active')
        ];

        if (followType) {
          conditions.push(eq(follows.followType, followType));
        }

        const followingData = await dbClient.query.follows.findMany({
          where: and(...conditions),
          orderBy: [desc(follows.createdAt)]
        });

        return {
          success: true,
          data: followingData,
          error: null
        };

      } catch (error) {
        console.error('Error getting following:', error);
        return {
          success: false,
          data: null,
          error: error as Error
        };
      }
    },

    async checkMutualFollow(userId1: string, userId2: string): Promise<ServiceResult<MutualFollowInfo>> {
      try {
        // Check if user1 follows user2
        const user1FollowsUser2 = await dbClient.query.follows.findFirst({
          where: and(
            eq(follows.followerId, userId1),
            eq(follows.followeeId, userId2),
            eq(follows.status, 'active')
          )
        });

        // Check if user2 follows user1
        const user2FollowsUser1 = await dbClient.query.follows.findFirst({
          where: and(
            eq(follows.followerId, userId2),
            eq(follows.followeeId, userId1),
            eq(follows.status, 'active')
          )
        });

        const mutualInfo: MutualFollowInfo = {
          isMutual: !!user1FollowsUser2 && !!user2FollowsUser1,
          user1FollowsUser2: !!user1FollowsUser2,
          user2FollowsUser1: !!user2FollowsUser1
        };

        return {
          success: true,
          data: mutualInfo,
          error: null
        };

      } catch (error) {
        console.error('Error checking mutual follow:', error);
        return {
          success: false,
          data: null,
          error: error as Error
        };
      }
    },

    async getFollowStats(userId: string): Promise<ServiceResult<{ followersCount: number; followingCount: number }>> {
      try {
        // Count followers
        const [followersCountResult] = await dbClient
          .select({ count: count() })
          .from(follows)
          .where(and(
            eq(follows.followeeId, userId),
            eq(follows.status, 'active')
          ));

        // Count following
        const [followingCountResult] = await dbClient
          .select({ count: count() })
          .from(follows)
          .where(and(
            eq(follows.followerId, userId),
            eq(follows.status, 'active')
          ));

        return {
          success: true,
          data: {
            followersCount: followersCountResult.count,
            followingCount: followingCountResult.count
          },
          error: null
        };

      } catch (error) {
        console.error('Error getting follow stats:', error);
        return {
          success: false,
          data: null,
          error: error as Error
        };
      }
    }
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
    const result = await followServiceInstance.unfollow(params.followId, params.userId, params.unfollowReason);
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
    const result = await followServiceInstance.getFollowers(params.userId, params.limit, params.cursor);
    if (!result.success) {
      throw result.error;
    }
    return {
      followers: result.data,
      nextCursor: null // Legacy interface
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
      nextCursor: null // Legacy interface
    };
  }
};