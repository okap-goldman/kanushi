import { supabase } from './supabase';
import { ApiResponse } from './data';
import { mockConfig, mockDelay, mockBookmarks, MockBookmark } from './mockData';
import { mockPosts } from './mockData/posts';

/**
 * ブックマークのデータ型定義
 */
export interface Bookmark {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
  post?: {
    id: string;
    content_type: string;
    text_content?: string;
    media_url?: string;
    user?: {
      id: string;
      name: string;
      image: string;
    };
  };
}

/**
 * 投稿をブックマークに追加する
 * @param post_id ブックマークする投稿のID
 * @param user_id ユーザーID
 * @returns ブックマーク情報またはエラー
 */
export const addBookmark = async (
  post_id: string,
  user_id: string
): Promise<ApiResponse<Bookmark>> => {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        post_id,
        user_id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('You have already bookmarked this post');
      }
      throw error;
    }

    return { data: data as Bookmark, error: null };
  } catch (error) {
    console.error('Error adding bookmark:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * ブックマークを削除する
 * @param post_id 削除する投稿のID
 * @param user_id ユーザーID
 * @returns 成功したかどうかの結果
 */
export const removeBookmark = async (
  post_id: string,
  user_id: string
): Promise<ApiResponse<boolean>> => {
  if (mockConfig.enabled) {
    await mockDelay();
    
    try {
      // モックデータから該当のブックマークを削除
      const bookmarkIndex = mockBookmarks.findIndex(
        bookmark => bookmark.post_id === post_id && bookmark.user_id === user_id
      );
      
      if (bookmarkIndex === -1) {
        return { data: null, error: new Error('Bookmark not found') };
      }
      
      mockBookmarks.splice(bookmarkIndex, 1);
      return { data: true, error: null };
    } catch (error) {
      console.error('Error removing mock bookmark:', error);
      return { data: null, error: error as Error };
    }
  }

  try {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('post_id', post_id)
      .eq('user_id', user_id);

    if (error) {
      throw error;
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * ユーザーのブックマーク一覧を取得する
 * @param user_id ユーザーID
 * @returns ブックマークの配列
 */
export const getBookmarks = async (
  user_id: string
): Promise<ApiResponse<Bookmark[]>> => {
  if (mockConfig.enabled) {
    await mockDelay();
    
    try {
      // モックデータからユーザーのブックマークを取得
      const userBookmarks = mockBookmarks
        .filter(bookmark => bookmark.user_id === user_id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // 各ブックマークに対応する投稿データを取得
      const bookmarksWithPosts: Bookmark[] = userBookmarks.map(bookmark => {
        const post = mockPosts.find(p => p.id === bookmark.post_id);
        
        return {
          id: bookmark.id,
          post_id: bookmark.post_id,
          user_id: bookmark.user_id,
          created_at: bookmark.created_at,
          post: post ? {
            id: post.id,
            content_type: post.contentType,
            text_content: post.textContent,
            media_url: post.mediaUrl,
            user: {
              id: post.user.id,
              name: post.user.displayName,
              image: post.user.profileImageUrl,
            },
          } : undefined,
        };
      }).filter(bookmark => bookmark.post); // 投稿が見つからないブックマークは除外
      
      return { data: bookmarksWithPosts, error: null };
    } catch (error) {
      console.error('Error fetching mock bookmarks:', error);
      return { data: null, error: error as Error };
    }
  }

  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        *,
        post:post(
          id, 
          content_type, 
          text_content, 
          media_url,
          user:profiles(
            id, 
            name, 
            image
          )
        )
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const formattedBookmarks = (data || []).map((bookmark) => ({
      ...bookmark,
      post: bookmark.post && {
        ...bookmark.post,
        user: bookmark.post.user && bookmark.post.user[0] ? bookmark.post.user[0] : undefined,
      },
    })) as Bookmark[];

    return { data: formattedBookmarks, error: null };
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * 投稿がブックマークされているかを確認する
 * @param post_id 確認する投稿のID
 * @param user_id ユーザーID
 * @returns ブックマークされていればtrue
 */
export const checkBookmarked = async (
  post_id: string,
  user_id: string
): Promise<ApiResponse<boolean>> => {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('post_id', post_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return { data: !!data, error: null };
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return { data: null, error: error as Error };
  }
};
