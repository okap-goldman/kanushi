import { supabase } from './supabase';
import { Post, ApiResponse, ContentType, Comment, Tag } from './data';

/**
 * Fetches all posts from Supabase
 * @param timeline_type Optional filter for UI segregation (will be handled in memory)
 */
export const getPosts = async (timeline_type?: 'family' | 'watch' | 'all'): Promise<ApiResponse<Post[]>> => {
  try {
    let query = supabase
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
        ? post.tags
            .filter(tag => tag.tag !== null)
            .map(tag => tag.tag as Tag)
        : [];

      return {
        ...post,
        author_id: post.user_id, // Mapping for API compatibility
        author: post.author[0] || {
          id: 'unknown',
          name: 'Unknown User',
          image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown'
        },
        media_type: post.content_type as ContentType,
        content: content,
        caption: caption,
        timeline_type: virtual_timeline_type,
        tags: tags
      };
    }) as Post[];

    // If timeline_type filter is provided, apply it in memory
    if (timeline_type && timeline_type !== 'all') {
      const filteredPosts = formattedPosts.filter(post => post.timeline_type === timeline_type);
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
      ? data.tags
          .filter(tag => tag.tag !== null)
          .map(tag => tag.tag as Tag)
      : [];

    const formattedPost = {
      ...data,
      author_id: data.user_id, // Mapping for API compatibility
      author: data.author[0] || {
        id: 'unknown',
        name: 'Unknown User',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown'
      },
      media_type: data.content_type as ContentType,
      content: content,
      caption: caption,
      tags: tags
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
export const createPost = async (post: Omit<Post, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Post>> => {
  try {
    // Determine content fields based on media_type
    const contentType = post.media_type || post.content_type;
    let mediaUrl = null;
    let audioUrl = null;
    let textContent = post.caption || post.text_content || '';
    
    if (contentType === 'text') {
      textContent = post.content || post.text_content || '';
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
        comments_count: 0
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
      const validTags = resolvedTags.filter(tag => tag !== null);
      
      // Associate tags with the post
      if (validTags.length > 0) {
        const postTagsData = validTags.map(tag => ({
          post_id: data.id,
          tag_id: tag.id
        }));
        
        const { error: linkError } = await supabase
          .from('post_tags')
          .insert(postTagsData);
          
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
        content: data.content_type === 'text' ? data.text_content : 
                (data.content_type === 'audio' ? (data.audio_url || data.media_url) : data.media_url),
        caption: data.content_type !== 'text' ? data.text_content : undefined,
        tags: post.tags || []
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

    const formattedComments = data.map(comment => ({
      ...comment,
      author_id: comment.user_id, // Mapping for API compatibility
      author: comment.author[0] || {
        id: 'unknown',
        name: 'Unknown User',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown'
      }
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
    // Begin a transaction
    const { data: newComment, error: commentError } = await supabase
      .from('comments')
      .insert({
        post_id: comment.post_id,
        user_id: comment.author_id, // Mapping for API compatibility
        content: comment.content
      })
      .select()
      .single();

    if (commentError) {
      throw commentError;
    }

    // Update comment count on the post
    const { error: updateError } = await supabase
      .rpc('increment_comment_count', { post_id: comment.post_id });

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
      const { error: decrementError } = await supabase
        .rpc('decrement_like_count', { post_id });

      if (decrementError) {
        throw decrementError;
      }
    } else {
      // Like: add the like
      const { error: likeError } = await supabase
        .from('likes')
        .insert({ post_id, user_id });

      if (likeError) {
        throw likeError;
      }

      // Increment like count
      const { error: incrementError } = await supabase
        .rpc('increment_like_count', { post_id });

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