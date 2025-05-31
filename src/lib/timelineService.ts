import { and, desc, eq, inArray, isNull, lt } from 'drizzle-orm';
import type {
  ApiResponse,
  CachedTimeline,
  DrizzlePost,
  PaginatedResult,
  Post,
  ServiceResult,
  TimelineCursor,
  TimelineType,
} from './data';
import { db } from './db/client';
import { follows, posts } from './db/schema';
import { supabase } from './supabase';
import { mockConfig, mockDelay, mockPosts, paginate } from './mockData';

export interface TimelineService {
  getTimeline(
    userId: string,
    timelineType: TimelineType,
    limit?: number,
    cursor?: string
  ): Promise<ServiceResult<PaginatedResult<DrizzlePost>>>;
  refreshTimeline(
    userId: string,
    timelineType: TimelineType
  ): Promise<ServiceResult<PaginatedResult<DrizzlePost>>>;
  getCachedTimeline(
    userId: string,
    timelineType: TimelineType
  ): Promise<ServiceResult<CachedTimeline | null>>;
  getAllPosts(
    limit?: number,
    cursor?: string
  ): Promise<ServiceResult<PaginatedResult<DrizzlePost>>>;
}

// Simple in-memory cache for demonstration
// In production, use Redis or similar
export class SimpleCache {
  private cache = new Map<string, { data: any; expiresAt: number }>();

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: any, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }
}

export function createTimelineService(
  supabaseClient = supabase,
  dbClient = db,
  cacheService = new SimpleCache()
): TimelineService {
  return {
    async getTimeline(
      userId: string,
      timelineType: TimelineType,
      limit = 20,
      cursor?: string
    ): Promise<ServiceResult<PaginatedResult<DrizzlePost>>> {
      try {
        // モックモードの場合
        if (mockConfig.enabled) {
          await mockDelay();
          
          // カーソルからページ番号を取得
          const page = cursor ? parseInt(cursor, 10) : 1;
          
          // モックの投稿データを変換
          const drizzlePosts: DrizzlePost[] = mockPosts.map(post => ({
            id: post.id,
            userId: post.user.id,
            contentType: post.contentType,
            textContent: post.textContent || null,
            mediaUrl: post.mediaUrl || null,
            previewUrl: post.mediaUrl || null,
            waveformUrl: post.waveformUrl || null,
            durationSeconds: post.durationSeconds || null,
            youtubeVideoId: null,
            eventId: null,
            groupId: null,
            likesCount: post.likes,
            commentsCount: post.comments,
            sharesCount: 0,
            highlightsCount: 0,
            retweetCount: 0,
            viewsCount: 0,
            aiMetadata: post.aiMetadata || null,
            lastActivityAt: new Date(post.createdAt),
            deletedAt: null,
            createdAt: new Date(post.createdAt),
            updatedAt: new Date(post.createdAt),
          }));
          
          const paginatedPosts = paginate(drizzlePosts, { page, limit });
          
          return {
            success: true,
            data: {
              data: paginatedPosts.data,
              totalCount: paginatedPosts.total,
              nextCursor: page < paginatedPosts.totalPages ? (page + 1).toString() : null,
            },
            error: null,
          };
        }
        // Get follows based on timeline type
        const followsData = await dbClient.query.follows.findMany({
          where: and(
            eq(follows.followerId, userId),
            eq(follows.followType, timelineType),
            eq(follows.status, 'active')
          ),
        });

        // If no follows, return empty timeline
        if (followsData.length === 0) {
          const emptyResult: PaginatedResult<DrizzlePost> = {
            items: [],
            hasMore: false,
            nextCursor: null,
          };

          return {
            success: true,
            data: emptyResult,
            error: null,
          };
        }

        // Extract followee IDs
        const followeeIds = followsData.map((f) => f.followeeId);

        // Build query conditions
        const conditions = [inArray(posts.userId, followeeIds), isNull(posts.deletedAt)];

        // Add cursor condition if provided
        if (cursor) {
          const cursorData = JSON.parse(Buffer.from(cursor, 'base64').toString()) as TimelineCursor;
          conditions.push(lt(posts.createdAt, new Date(cursorData.createdAt)));
        }

        // Fetch posts with limit + 1 to check for more
        const postsData = await dbClient.query.posts.findMany({
          where: and(...conditions),
          orderBy: [desc(posts.createdAt)],
          limit: limit + 1,
        });

        // Check if there are more posts
        const hasMore = postsData.length > limit;
        const items = hasMore ? postsData.slice(0, limit) : postsData;

        // Generate next cursor
        let nextCursor: string | null = null;
        if (hasMore && items.length > 0) {
          const lastPost = items[items.length - 1];
          const cursorData: TimelineCursor = {
            createdAt: lastPost.createdAt.toISOString(),
            postId: lastPost.id,
          };
          nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
        }

        const result: PaginatedResult<DrizzlePost> = {
          items,
          hasMore,
          nextCursor,
        };

        // Cache the result
        const cacheKey = `timeline:${userId}:${timelineType}`;
        const cacheData: CachedTimeline = {
          ...result,
          cachedAt: new Date(),
        };
        cacheService.set(cacheKey, cacheData, 300); // 5 minutes TTL

        return {
          success: true,
          data: result,
          error: null,
        };
      } catch (error) {
        console.error('Error getting timeline:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },

    async refreshTimeline(
      userId: string,
      timelineType: TimelineType
    ): Promise<ServiceResult<PaginatedResult<DrizzlePost>>> {
      // Clear cache and get fresh data
      const cacheKey = `timeline:${userId}:${timelineType}`;
      cacheService.set(cacheKey, null, 0); // Clear cache

      return this.getTimeline(userId, timelineType, 20);
    },

    async getCachedTimeline(
      userId: string,
      timelineType: TimelineType
    ): Promise<ServiceResult<CachedTimeline | null>> {
      try {
        const cacheKey = `timeline:${userId}:${timelineType}`;
        const cachedData = cacheService.get(cacheKey) as CachedTimeline | null;

        return {
          success: true,
          data: cachedData,
          error: null,
        };
      } catch (error) {
        console.error('Error getting cached timeline:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },

    async getAllPosts(
      limit = 20,
      cursor?: string
    ): Promise<ServiceResult<PaginatedResult<DrizzlePost>>> {
      try {
        // モックモードの場合
        if (mockConfig.enabled) {
          await mockDelay();
          
          // カーソルからページ番号を取得
          const page = cursor ? parseInt(cursor, 10) : 1;
          
          // モックの投稿データを変換
          const drizzlePosts: DrizzlePost[] = mockPosts.map(post => ({
            id: post.id,
            userId: post.user.id,
            contentType: post.contentType,
            textContent: post.textContent || null,
            mediaUrl: post.mediaUrl || null,
            previewUrl: post.mediaUrl || null,
            waveformUrl: post.waveformUrl || null,
            durationSeconds: post.durationSeconds || null,
            youtubeVideoId: null,
            eventId: null,
            groupId: null,
            likesCount: post.likes,
            commentsCount: post.comments,
            sharesCount: 0,
            highlightsCount: 0,
            retweetCount: 0,
            viewsCount: 0,
            aiMetadata: post.aiMetadata || null,
            lastActivityAt: new Date(post.createdAt),
            deletedAt: null,
            createdAt: new Date(post.createdAt),
            updatedAt: new Date(post.createdAt),
          }));
          
          const paginatedPosts = paginate(drizzlePosts, { page, limit });
          const hasMore = page < paginatedPosts.totalPages;
          const nextCursor = hasMore ? (page + 1).toString() : null;
          
          return {
            success: true,
            data: {
              items: paginatedPosts.data,
              hasMore,
              nextCursor,
            },
            error: null,
          };
        }
        // Build query conditions
        const conditions = [isNull(posts.deletedAt)];

        // Add cursor condition if provided
        if (cursor) {
          const cursorData = JSON.parse(Buffer.from(cursor, 'base64').toString()) as TimelineCursor;
          conditions.push(lt(posts.createdAt, new Date(cursorData.createdAt)));
        }

        // Fetch posts with limit + 1 to check for more
        const postsData = await dbClient.query.posts.findMany({
          where: and(...conditions),
          orderBy: [desc(posts.createdAt)],
          limit: limit + 1,
        });

        // Check if there are more posts
        const hasMore = postsData.length > limit;
        const items = hasMore ? postsData.slice(0, limit) : postsData;

        // Generate next cursor
        let nextCursor: string | null = null;
        if (hasMore && items.length > 0) {
          const lastPost = items[items.length - 1];
          const cursorData: TimelineCursor = {
            createdAt: lastPost.createdAt.toISOString(),
            postId: lastPost.id,
          };
          nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
        }

        const result: PaginatedResult<DrizzlePost> = {
          items,
          hasMore,
          nextCursor,
        };

        return {
          success: true,
          data: result,
          error: null,
        };
      } catch (error) {
        console.error('Error getting all posts:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },
  };
}

// Export service instance and make cacheService accessible for testing
const service = createTimelineService();
export const timelineServiceInstance = service;

// Add cache service to the instance for testing purposes
(timelineServiceInstance as any).cacheService = new SimpleCache();

// Legacy exports for backward compatibility
interface TimelineResponse {
  posts: Post[];
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Get timeline posts for a user
 * @param userId The user ID
 * @param type Timeline type (family or watch)
 * @param limit Number of posts to fetch (default: 20)
 * @param cursor Pagination cursor (created_at timestamp)
 */
export const getTimelinePosts = async (
  userId: string,
  type: 'family' | 'watch',
  limit = 20,
  cursor?: string
): Promise<ApiResponse<TimelineResponse>> => {
  try {
    // First, get the list of users this user follows
    const { data: follows, error: followsError } = await supabase
      .from('follows')
      .select('followee_id')
      .eq('follower_id', userId)
      .eq('follow_type', type)
      .eq('status', 'active');

    if (followsError) {
      throw followsError;
    }

    // If no follows, return empty array
    if (!follows || follows.length === 0) {
      return {
        data: {
          posts: [],
          hasMore: false,
        },
        error: null,
      };
    }

    // Extract followee IDs
    const followeeIds = follows.map((f) => f.followee_id);

    // Build the query for posts
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:profile(id, display_name, profile_image_url),
        tags:post_tags(
          tag:tags(id, name)
        )
      `)
      .in('user_id', followeeIds)
      .order('created_at', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check if there are more

    // Add cursor for pagination
    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Check if there are more posts
    const hasMore = data.length > limit;
    const posts = data.slice(0, limit);

    // Format posts to match Post interface
    const formattedPosts = posts.map((post) => {
      // Determine the content field based on content_type
      let content = post.text_content;
      if (post.content_type === 'image' || post.content_type === 'video') {
        content = post.media_url;
      } else if (post.content_type === 'audio') {
        content = post.audio_url || post.media_url;
      }

      // Create a caption from text_content for media posts
      let caption = undefined;
      if (post.content_type !== 'text' && post.text_content) {
        caption = post.text_content;
      }

      // Format tags array from the nested structure returned by Supabase
      const tags = post.tags
        ? post.tags.filter((tag: any) => tag.tag !== null).map((tag: any) => tag.tag)
        : [];

      return {
        ...post,
        author_id: post.user_id,
        author: post.author[0] ? {
          id: post.author[0].id,
          name: post.author[0].display_name,
          image: post.author[0].profile_image_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown',
        } : {
          id: 'unknown',
          name: 'Unknown User',
          image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown',
        },
        media_type: post.content_type,
        content: content,
        caption: caption,
        timeline_type: type,
        tags: tags,
      };
    }) as Post[];

    // Determine next cursor
    const nextCursor = hasMore && posts.length > 0 ? posts[posts.length - 1].created_at : undefined;

    return {
      data: {
        posts: formattedPosts,
        hasMore,
        nextCursor,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get all posts (for discover/explore)
 * @param limit Number of posts to fetch
 * @param cursor Pagination cursor
 */
export const getAllPosts = async (
  limit = 20,
  cursor?: string
): Promise<ApiResponse<TimelineResponse>> => {
  try {
    // Build the query for all posts
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:profile(id, display_name, profile_image_url),
        tags:post_tags(
          tag:tags(id, name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    // Add cursor for pagination
    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Check if there are more posts
    const hasMore = data.length > limit;
    const posts = data.slice(0, limit);

    // Format posts similar to getTimelinePosts
    const formattedPosts = posts.map((post) => {
      let content = post.text_content;
      if (post.content_type === 'image' || post.content_type === 'video') {
        content = post.media_url;
      } else if (post.content_type === 'audio') {
        content = post.audio_url || post.media_url;
      }

      let caption = undefined;
      if (post.content_type !== 'text' && post.text_content) {
        caption = post.text_content;
      }

      const tags = post.tags
        ? post.tags.filter((tag: any) => tag.tag !== null).map((tag: any) => tag.tag)
        : [];

      return {
        ...post,
        author_id: post.user_id,
        author: post.author[0] ? {
          id: post.author[0].id,
          name: post.author[0].display_name,
          image: post.author[0].profile_image_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown',
        } : {
          id: 'unknown',
          name: 'Unknown User',
          image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown',
        },
        media_type: post.content_type,
        content: content,
        caption: caption,
        tags: tags,
      };
    }) as Post[];

    const nextCursor = hasMore && posts.length > 0 ? posts[posts.length - 1].created_at : undefined;

    return {
      data: {
        posts: formattedPosts,
        hasMore,
        nextCursor,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching all posts:', error);
    return { data: null, error: error as Error };
  }
};
