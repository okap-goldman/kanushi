import { supabase } from './supabase';
import { Post, ApiResponse } from './data';

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
  limit: number = 20,
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
        author:profiles(id, name, image),
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
        ? post.tags
            .filter((tag: any) => tag.tag !== null)
            .map((tag: any) => tag.tag)
        : [];

      return {
        ...post,
        author_id: post.user_id,
        author: post.author[0] || {
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
    const nextCursor = hasMore && posts.length > 0 
      ? posts[posts.length - 1].created_at 
      : undefined;

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
  limit: number = 20,
  cursor?: string
): Promise<ApiResponse<TimelineResponse>> => {
  try {
    // Build the query for all posts
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:profiles(id, name, image),
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
        ? post.tags
            .filter((tag: any) => tag.tag !== null)
            .map((tag: any) => tag.tag)
        : [];

      return {
        ...post,
        author_id: post.user_id,
        author: post.author[0] || {
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

    const nextCursor = hasMore && posts.length > 0 
      ? posts[posts.length - 1].created_at 
      : undefined;

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