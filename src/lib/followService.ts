import { db } from './db/client';
import { follows, profiles, posts } from './db/schema';
import { eq, and, desc, or } from 'drizzle-orm';

// Types
interface CreateFollowParams {
  followerId: string;
  followeeId: string;
  followType: 'family' | 'watch';
  followReason?: string;
}

interface UnfollowParams {
  followId: string;
  userId: string;
  unfollowReason?: string;
}

interface GetFollowersParams {
  userId: string;
  limit?: number;
  cursor?: string;
}

interface GetFollowingParams {
  userId: string;
  type?: 'family' | 'watch';
  limit?: number;
  cursor?: string;
}

// Rate limiting
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 20;

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  
  // Clean old requests
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX) {
    throw new Error('RATE_LIMIT_EXCEEDED');
  }
  
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
}

// Service methods
export const followService = {
  async createFollow(params: CreateFollowParams) {
    const { followerId, followeeId, followType, followReason } = params;

    // Validation
    if (followerId === followeeId) {
      throw new Error('自分自身をフォローすることはできません');
    }

    if (followType === 'family' && !followReason) {
      throw new Error('ファミリーフォローには理由の入力が必要です');
    }

    // Check if already following
    const existingFollow = await db.select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followeeId, followeeId),
          or(
            eq(follows.status, 'active'),
            eq(follows.status, 'blocked')
          )
        )
      );

    if (existingFollow.length > 0) {
      throw new Error('すでにフォローしています');
    }

    // Rate limit check
    checkRateLimit(followerId);

    // Create follow
    const [newFollow] = await db.insert(follows)
      .values({
        followerId,
        followeeId,
        followType,
        status: 'active',
        followReason: followReason || null
      })
      .returning();

    return newFollow;
  },

  async unfollowUser(params: UnfollowParams) {
    const { followId, userId, unfollowReason } = params;

    // Check if follow exists
    const [existingFollow] = await db.select()
      .from(follows)
      .where(eq(follows.id, followId));

    if (!existingFollow) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    // Check ownership
    if (existingFollow.followerId !== userId) {
      throw new Error('他のユーザーのフォロー関係は操作できません');
    }

    // Update to unfollowed
    const [updated] = await db.update(follows)
      .set({
        status: 'unfollowed',
        unfollowedAt: new Date(),
        unfollowReason: unfollowReason || null
      })
      .where(eq(follows.id, followId))
      .returning();

    return updated;
  },

  async getFollowers(params: GetFollowersParams) {
    const { userId, limit = 20, cursor } = params;

    // Build query
    let query = db.select({
      id: follows.id,
      followerId: follows.followerId,
      followeeId: follows.followeeId,
      followType: follows.followType,
      followReason: follows.followReason,
      createdAt: follows.createdAt,
      follower: {
        id: profiles.id,
        displayName: profiles.displayName,
        profileImageUrl: profiles.profileImageUrl
      }
    })
    .from(follows)
    .leftJoin(profiles, eq(follows.followerId, profiles.id))
    .where(
      and(
        eq(follows.followeeId, userId),
        eq(follows.status, 'active')
      )
    )
    .orderBy(desc(follows.createdAt))
    .limit(limit + 1); // Fetch one extra for cursor

    // Apply cursor if provided
    if (cursor) {
      // In a real implementation, decode cursor to get timestamp
      // For now, we'll skip cursor implementation
    }

    const results = await query;
    
    // Check if there's a next page
    const hasMore = results.length > limit;
    const followers = hasMore ? results.slice(0, -1) : results;
    
    // Generate next cursor
    const nextCursor = hasMore && followers.length > 0 
      ? Buffer.from(followers[followers.length - 1].createdAt.toISOString()).toString('base64')
      : null;

    return {
      followers,
      nextCursor
    };
  },

  async getFollowing(params: GetFollowingParams) {
    const { userId, type, limit = 20, cursor } = params;

    // Build query with latest post
    let whereConditions = [
      eq(follows.followerId, userId),
      eq(follows.status, 'active')
    ];

    if (type) {
      whereConditions.push(eq(follows.followType, type));
    }

    const results = await db.select({
      id: follows.id,
      followerId: follows.followerId,
      followeeId: follows.followeeId,
      followType: follows.followType,
      createdAt: follows.createdAt,
      followee: {
        id: profiles.id,
        displayName: profiles.displayName,
        profileImageUrl: profiles.profileImageUrl
      }
    })
    .from(follows)
    .leftJoin(profiles, eq(follows.followeeId, profiles.id))
    .where(and(...whereConditions))
    .orderBy(desc(follows.createdAt))
    .limit(limit + 1);

    // For simplicity, not implementing latest post join here
    // In production, would need a more complex query or separate fetch
    const following = results.map(f => ({
      ...f,
      latestPost: null // Placeholder
    }));

    // Check if there's a next page
    const hasMore = following.length > limit;
    const items = hasMore ? following.slice(0, -1) : following;
    
    // Generate next cursor
    const nextCursor = hasMore && items.length > 0 
      ? Buffer.from(items[items.length - 1].createdAt.toISOString()).toString('base64')
      : null;

    return {
      following: items,
      nextCursor
    };
  }
};