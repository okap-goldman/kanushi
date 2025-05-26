import { and, desc, eq, inArray } from 'drizzle-orm';
import {
  type ApiResponse,
  type Comment,
  type ContentType,
  type DrizzleBookmark,
  type DrizzleComment,
  DrizzleHashtag,
  DrizzleHighlight,
  DrizzleLike,
  type DrizzlePost,
  type MediaType,
  type Post,
  type PostCreateInput,
  PostUpdateInput,
  type ServiceResult,
  type Tag,
  TimelineType,
} from './data';
import { db } from './db/client';
import { bookmarks, comments, hashtags, highlights, likes, postHashtags, posts } from './db/schema';
import { supabase } from './supabase';

// Constants
const MAX_TEXT_LENGTH = 10000;
const MAX_HASHTAGS = 5;
const MAX_AUDIO_DURATION = 28800; // 8 hours in seconds

export interface PostService {
  createPost(input: PostCreateInput): Promise<ServiceResult<DrizzlePost>>;
  deletePost(postId: string, userId: string): Promise<ServiceResult<boolean>>;
  addLike(postId: string, userId: string): Promise<ServiceResult<boolean>>;
  removeLike(postId: string, userId: string): Promise<ServiceResult<boolean>>;
  addHighlight(postId: string, userId: string, reason: string): Promise<ServiceResult<boolean>>;
  addComment(postId: string, userId: string, body: string): Promise<ServiceResult<DrizzleComment>>;
  getComments(postId: string): Promise<ServiceResult<DrizzleComment[]>>;
  addBookmark(postId: string, userId: string): Promise<ServiceResult<boolean>>;
  removeBookmark(postId: string, userId: string): Promise<ServiceResult<boolean>>;
  getBookmarks(userId: string): Promise<ServiceResult<DrizzleBookmark[]>>;
}

export function createPostService(supabaseClient = supabase, dbClient = db): PostService {
  return {
    async createPost(input: PostCreateInput): Promise<ServiceResult<DrizzlePost>> {
      try {
        // Validation
        if (
          input.contentType === 'text' &&
          input.textContent &&
          input.textContent.length > MAX_TEXT_LENGTH
        ) {
          return {
            success: false,
            data: null,
            error: new Error(`テキストの最大文字数（${MAX_TEXT_LENGTH}文字）を超えています`),
          };
        }

        if (
          input.contentType === 'audio' &&
          input.durationSeconds &&
          input.durationSeconds > MAX_AUDIO_DURATION
        ) {
          return {
            success: false,
            data: null,
            error: new Error(
              `音声の最大時間（${MAX_AUDIO_DURATION}秒）を超えています`
            ),
          };
        }

        if (input.hashtags && input.hashtags.length > MAX_HASHTAGS) {
          return {
            success: false,
            data: null,
            error: new Error(`ハッシュタグは最大${MAX_HASHTAGS}個までです`),
          };
        }

        const result = await dbClient.transaction(async (tx) => {
          // Create post
          const [createdPost] = await tx
            .insert(posts)
            .values({
              userId: input.userId,
              contentType: input.contentType,
              textContent: input.textContent || null,
              mediaUrl: input.mediaUrl || null,
              previewUrl: input.previewUrl || null,
              waveformUrl: input.waveformUrl || null,
              durationSeconds: input.durationSeconds || null,
              youtubeVideoId: input.youtubeVideoId || null,
              eventId: input.eventId || null,
              groupId: input.groupId || null,
              aiMetadata: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();

          // Handle hashtags if present
          if (input.hashtags && input.hashtags.length > 0) {
            const hashtagIds: string[] = [];

            for (const hashtagName of input.hashtags) {
              // Check if hashtag exists
              let existingHashtag = await tx.query.hashtags.findFirst({
                where: eq(hashtags.name, hashtagName),
              });

              if (!existingHashtag) {
                // Create new hashtag
                const [newHashtag] = await tx
                  .insert(hashtags)
                  .values({
                    name: hashtagName,
                    useCount: 1,
                    createdAt: new Date(),
                  })
                  .returning();
                existingHashtag = newHashtag;
              } else {
                // Increment use count
                await tx
                  .update(hashtags)
                  .set({ useCount: existingHashtag.useCount + 1 })
                  .where(eq(hashtags.id, existingHashtag.id));
              }

              hashtagIds.push(existingHashtag.id);
            }

            // Link hashtags to post
            const postHashtagData = hashtagIds.map((hashtagId) => ({
              postId: createdPost.id,
              hashtagId,
              createdAt: new Date(),
            }));

            await tx.insert(postHashtags).values(postHashtagData);
          }

          return createdPost;
        });

        return {
          success: true,
          data: result,
          error: null,
        };
      } catch (error) {
        console.error('Error creating post:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },

    async deletePost(postId: string, userId: string): Promise<ServiceResult<boolean>> {
      try {
        // Check if post exists and user owns it
        const existingPost = await dbClient.query.posts.findFirst({
          where: and(eq(posts.id, postId), eq(posts.deletedAt, null)),
        });

        if (!existingPost) {
          return {
            success: false,
            data: null,
            error: new Error('投稿が見つかりません'),
          };
        }

        if (existingPost.userId !== userId) {
          return {
            success: false,
            data: null,
            error: new Error('この投稿を削除する権限がありません'),
          };
        }

        // Soft delete
        const result = await dbClient
          .update(posts)
          .set({
            deletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(posts.id, postId));

        return {
          success: true,
          data: result.rowCount > 0,
          error: null,
        };
      } catch (error) {
        console.error('Error deleting post:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },

    async addLike(postId: string, userId: string): Promise<ServiceResult<boolean>> {
      try {
        // Check if already liked
        const existingLike = await dbClient.query.likes.findFirst({
          where: and(eq(likes.postId, postId), eq(likes.userId, userId)),
        });

        if (existingLike) {
          return {
            success: false,
            data: null,
            error: new Error('既にいいねしています'),
          };
        }

        await dbClient.insert(likes).values({
          postId,
          userId,
          createdAt: new Date(),
        });

        return {
          success: true,
          data: true,
          error: null,
        };
      } catch (error) {
        console.error('Error adding like:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },

    async removeLike(postId: string, userId: string): Promise<ServiceResult<boolean>> {
      try {
        // Check if like exists
        const existingLike = await dbClient.query.likes.findFirst({
          where: and(eq(likes.postId, postId), eq(likes.userId, userId)),
        });

        if (!existingLike) {
          return {
            success: false,
            data: null,
            error: new Error('いいねが見つかりません'),
          };
        }

        const result = await dbClient
          .delete(likes)
          .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));

        return {
          success: true,
          data: result.rowCount > 0,
          error: null,
        };
      } catch (error) {
        console.error('Error removing like:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },

    async addHighlight(
      postId: string,
      userId: string,
      reason: string
    ): Promise<ServiceResult<boolean>> {
      try {
        if (!reason || reason.trim() === '') {
          return {
            success: false,
            data: null,
            error: new Error('ハイライトには理由が必要です'),
          };
        }

        // Check if already highlighted
        const existingHighlight = await dbClient.query.highlights.findFirst({
          where: and(eq(highlights.postId, postId), eq(highlights.userId, userId)),
        });

        if (existingHighlight) {
          return {
            success: false,
            data: null,
            error: new Error('既にハイライトしています'),
          };
        }

        await dbClient.insert(highlights).values({
          postId,
          userId,
          reason: reason.trim(),
          createdAt: new Date(),
        });

        return {
          success: true,
          data: true,
          error: null,
        };
      } catch (error) {
        console.error('Error adding highlight:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },

    async addComment(
      postId: string,
      userId: string,
      body: string
    ): Promise<ServiceResult<DrizzleComment>> {
      try {
        if (!body || body.trim() === '') {
          return {
            success: false,
            data: null,
            error: new Error('コメントは空にできません'),
          };
        }

        const [comment] = await dbClient
          .insert(comments)
          .values({
            postId,
            userId,
            body: body.trim(),
            createdAt: new Date(),
          })
          .returning();

        return {
          success: true,
          data: comment,
          error: null,
        };
      } catch (error) {
        console.error('Error adding comment:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },

    async getComments(postId: string): Promise<ServiceResult<DrizzleComment[]>> {
      try {
        const commentsData = await dbClient.query.comments.findMany({
          where: eq(comments.postId, postId),
          orderBy: [desc(comments.createdAt)],
        });

        return {
          success: true,
          data: commentsData,
          error: null,
        };
      } catch (error) {
        console.error('Error getting comments:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },

    async addBookmark(postId: string, userId: string): Promise<ServiceResult<boolean>> {
      try {
        // Check if already bookmarked
        const existingBookmark = await dbClient.query.bookmarks.findFirst({
          where: and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)),
        });

        if (existingBookmark) {
          return {
            success: false,
            data: null,
            error: new Error('既にブックマークしています'),
          };
        }

        await dbClient.insert(bookmarks).values({
          postId,
          userId,
          createdAt: new Date(),
        });

        return {
          success: true,
          data: true,
          error: null,
        };
      } catch (error) {
        console.error('Error adding bookmark:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },

    async removeBookmark(postId: string, userId: string): Promise<ServiceResult<boolean>> {
      try {
        // Check if bookmark exists
        const existingBookmark = await dbClient.query.bookmarks.findFirst({
          where: and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)),
        });

        if (!existingBookmark) {
          return {
            success: false,
            data: null,
            error: new Error('ブックマークが見つかりません'),
          };
        }

        const result = await dbClient
          .delete(bookmarks)
          .where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)));

        return {
          success: true,
          data: result.rowCount > 0,
          error: null,
        };
      } catch (error) {
        console.error('Error removing bookmark:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },

    async getBookmarks(userId: string): Promise<ServiceResult<DrizzleBookmark[]>> {
      try {
        const bookmarksData = await dbClient.query.bookmarks.findMany({
          where: eq(bookmarks.userId, userId),
          orderBy: [desc(bookmarks.createdAt)],
        });

        return {
          success: true,
          data: bookmarksData,
          error: null,
        };
      } catch (error) {
        console.error('Error getting bookmarks:', error);
        return {
          success: false,
          data: null,
          error: error as Error,
        };
      }
    },
  };
}

// Default export - backward compatibility with existing code
export const postServiceInstance = createPostService();

// Get posts by IDs
export const getPostsByIds = async (ids: string[]): Promise<Post[]> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:profiles!posts_user_id_fkey(*),
        likes(user_id),
        comments(id)
      `)
      .in('id', ids);

    if (error) throw error;

    return (data || []).map((post: any) => ({
      id: post.id,
      user_id: post.user_id,
      content: post.content || '',
      media_type: post.media_type as MediaType,
      media_url: post.media_url,
      hashtags: post.hashtags || [],
      created_at: post.created_at,
      updated_at: post.updated_at,
      user: post.user,
      likes_count: post.likes?.length || 0,
      comments_count: post.comments?.length || 0,
      is_liked: false, // Will be set by the caller
    }));
  } catch (error) {
    console.error('Error fetching posts by IDs:', error);
    return [];
  }
};

/**
 * Fetches all posts from Supabase
 * @param timeline_type Optional filter for UI segregation (will be handled in memory)
 */
export const getPosts = async (
  timeline_type?: 'family' | 'watch' | 'all'
): Promise<ApiResponse<Post[]>> => {
  try {
    const query = supabase
      .from('posts')
      .select(`
        *,
        author:profiles(id, name, image),
        tags:post_tags(
          tag:tags(id, name)
        )
      `)
      .order('created_at', { ascending: false });

    // Timeline filtering will be handled client-side since the database doesn't have this field

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const formattedPosts = data.map((post) => {
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

      // Add virtual timeline_type field based on user and content
      // For demonstration, even user_ids are "family" and odd are "watch"
      const virtual_timeline_type =
        post.user_id.endsWith('1') || post.user_id.endsWith('3') ? 'watch' : 'family';

      // Format tags array from the nested structure returned by Supabase
      const tags = post.tags
        ? post.tags.filter((tag: any) => tag.tag !== null).map((tag: any) => tag.tag as Tag)
        : [];

      return {
        ...post,
        author_id: post.user_id, // Mapping for API compatibility
        author: post.author[0] || {
          id: 'unknown',
          name: '山田健太',
          image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yamada',
        },
        media_type: post.content_type as ContentType,
        content: content,
        caption: caption,
        timeline_type: virtual_timeline_type,
        tags: tags,
      };
    }) as Post[];

    // If timeline_type filter is provided, apply it in memory
    if (timeline_type && timeline_type !== 'all') {
      const filteredPosts = formattedPosts.filter((post) => post.timeline_type === timeline_type);
      return { data: filteredPosts, error: null };
    }

    return { data: formattedPosts, error: null };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Fetches a single post by ID
 * @param id The post ID
 */
export const getPostById = async (id: string): Promise<ApiResponse<Post>> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(id, name, image),
        tags:post_tags(
          tag:tags(id, name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    // Determine the content field based on content_type
    let content = data.text_content;
    if (data.content_type === 'image' || data.content_type === 'video') {
      content = data.media_url;
    } else if (data.content_type === 'audio') {
      content = data.audio_url || data.media_url;
    }

    // Create a caption from text_content for media posts
    let caption = undefined;
    if (data.content_type !== 'text' && data.text_content) {
      caption = data.text_content;
    }

    // Format tags array from the nested structure returned by Supabase
    const tags = data.tags
      ? data.tags.filter((tag: any) => tag.tag !== null).map((tag: any) => tag.tag as Tag)
      : [];

    const formattedPost = {
      ...data,
      author_id: data.user_id, // Mapping for API compatibility
      author: data.author[0] || {
        id: 'unknown',
        name: '山田健太',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yamada',
      },
      media_type: data.content_type as ContentType,
      content: content,
      caption: caption,
      tags: tags,
    } as Post;

    return { data: formattedPost, error: null };
  } catch (error) {
    console.error('Error fetching post:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Creates a new post
 * @param post Post data without ID
 */
export const createPost = async (
  post: Omit<Post, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<Post>> => {
  try {
    // Determine content fields based on media_type
    const contentType = post.media_type || post.content_type;
    let mediaUrl = null;
    let audioUrl = null;
    let textContent = post.caption || post.text_content || '';

    if (contentType === 'text') {
      textContent = post.content || post.text_content || '';
      // Validate text length for text posts
      if (textContent.length > 10000) {
        throw new Error('テキストの最大文字数（10,000文字）を超えています');
      }
    } else if (contentType === 'image' || contentType === 'video') {
      mediaUrl = post.content || post.media_url;
    } else if (contentType === 'audio') {
      audioUrl = post.content || post.audio_url || post.media_url;
    }

    // Insert the post data
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: post.author_id || post.user_id,
        content_type: contentType,
        text_content: textContent,
        media_url: mediaUrl,
        audio_url: audioUrl,
        thumbnail_url: post.thumbnail_url,
        likes_count: 0,
        comments_count: 0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Handle tags if they exist
    if (post.tags && post.tags.length > 0) {
      // First, find or create tags
      const tagPromises = post.tags.map(async (tag) => {
        // If tag has an ID, we assume it already exists
        if (tag.id) {
          return tag;
        }

        // Otherwise, try to find the tag by name or create a new one
        const { data: existingTag, error: findError } = await supabase
          .from('tags')
          .select('id, name')
          .eq('name', tag.name)
          .maybeSingle();

        if (findError) {
          console.error('Error finding tag:', findError);
          return null;
        }

        if (existingTag) {
          return existingTag;
        }

        // Create new tag
        const { data: newTag, error: insertError } = await supabase
          .from('tags')
          .insert({ name: tag.name })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating tag:', insertError);
          return null;
        }

        return newTag;
      });

      const resolvedTags = await Promise.all(tagPromises);
      const validTags = resolvedTags.filter((tag) => tag !== null);

      // Associate tags with the post
      if (validTags.length > 0) {
        const postTagsData = validTags.map((tag) => ({
          post_id: data.id,
          tag_id: tag.id,
        }));

        const { error: linkError } = await supabase.from('post_tags').insert(postTagsData);

        if (linkError) {
          console.error('Error linking tags to post:', linkError);
        }
      }
    }

    // Fetch the post with its tags to return the complete data
    const { data: completedPost, error: fetchError } = await getPostById(data.id);

    if (fetchError) {
      console.error('Error fetching completed post:', fetchError);

      // If we can't fetch the complete post, at least return what we have
      const formattedPost = {
        ...data,
        author_id: data.user_id,
        media_type: data.content_type as ContentType,
        content:
          data.content_type === 'text'
            ? data.text_content
            : data.content_type === 'audio'
              ? data.audio_url || data.media_url
              : data.media_url,
        caption: data.content_type !== 'text' ? data.text_content : undefined,
        tags: post.tags || [],
      } as unknown as Post;

      return { data: formattedPost, error: null };
    }

    return { data: completedPost, error: null };
  } catch (error) {
    console.error('Error creating post:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Fetches comments for a post
 * @param post_id The post ID
 */
export const getComments = async (post_id: string): Promise<ApiResponse<Comment[]>> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles(id, name, image)
      `)
      .eq('post_id', post_id)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    const formattedComments = data.map((comment) => ({
      ...comment,
      author_id: comment.user_id, // Mapping for API compatibility
      author: comment.author[0] || {
        id: 'unknown',
        name: '山田健太',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yamada',
      },
    })) as Comment[];

    return { data: formattedComments, error: null };
  } catch (error) {
    console.error('Error fetching comments:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Creates a new comment on a post
 * @param comment Comment data without ID
 */
export const createComment = async (
  comment: Omit<Comment, 'id' | 'created_at'>
): Promise<ApiResponse<Comment>> => {
  try {
    // Validate content
    if (!comment.content || comment.content.trim() === '') {
      throw new Error('コンテンツは空にできません');
    }

    // Begin a transaction
    const { data: newComment, error: commentError } = await supabase
      .from('comments')
      .insert({
        post_id: comment.post_id,
        user_id: comment.author_id, // Mapping for API compatibility
        content: comment.content,
      })
      .select()
      .single();

    if (commentError) {
      throw commentError;
    }

    // Update comment count on the post
    const { error: updateError } = await supabase.rpc('increment_comment_count', {
      post_id: comment.post_id,
    });

    if (updateError) {
      throw updateError;
    }

    return { data: newComment as unknown as Comment, error: null };
  } catch (error) {
    console.error('Error creating comment:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Toggles like status on a post
 * @param post_id The post ID
 * @param user_id The user ID
 */
export const toggleLike = async (
  post_id: string,
  user_id: string
): Promise<ApiResponse<{ liked: boolean }>> => {
  try {
    // Check if like exists
    const { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('*')
      .eq('post_id', post_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    let liked = false;

    if (existingLike) {
      // Unlike: remove the like
      const { error: unlikeError } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', post_id)
        .eq('user_id', user_id);

      if (unlikeError) {
        throw unlikeError;
      }

      // Decrement like count
      const { error: decrementError } = await supabase.rpc('decrement_like_count', { post_id });

      if (decrementError) {
        throw decrementError;
      }
    } else {
      // Like: add the like
      const { error: likeError } = await supabase.from('likes').insert({ post_id, user_id });

      if (likeError) {
        throw likeError;
      }

      // Increment like count
      const { error: incrementError } = await supabase.rpc('increment_like_count', { post_id });

      if (incrementError) {
        throw incrementError;
      }

      liked = true;
    }

    return { data: { liked }, error: null };
  } catch (error) {
    console.error('Error toggling like:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Checks if a user has liked a post
 * @param post_id The post ID
 * @param user_id The user ID
 */
export const checkLiked = async (
  post_id: string,
  user_id: string
): Promise<ApiResponse<boolean>> => {
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('*')
      .eq('post_id', post_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return { data: !!data, error: null };
  } catch (error) {
    console.error('Error checking like status:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Deletes a post (soft delete)
 * @param post_id The post ID
 * @param user_id The user ID requesting deletion
 */
export const deletePost = async (
  post_id: string,
  user_id: string
): Promise<ApiResponse<boolean>> => {
  try {
    // First, check if the post exists and belongs to the user
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', post_id)
      .single();

    if (fetchError || !post) {
      throw new Error('投稿が見つかりません');
    }

    // Check ownership
    if (post.user_id !== user_id) {
      throw new Error('この投稿を削除する権限がありません');
    }

    // Soft delete by setting deleted_at
    const { error: deleteError } = await supabase
      .from('posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', post_id);

    if (deleteError) {
      throw deleteError;
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { data: null, error: error as Error };
  }
};
