import { supabase } from './supabase';

// ユーザー検索の型定義
export interface UserSearchResult {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

// 投稿検索の型定義
export interface PostSearchResult {
  id: string;
  text_content: string;
  media_url: string | null;
  audio_url: string | null;
  thumbnail_url: string | null;
  content_type: string;
  created_at: string;
  user_id: string;
  user: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  tags?: { id: string; name: string }[];
}

// タグ検索の型定義
export interface TagSearchResult {
  id: string;
  name: string;
  post_count: number;
}

// グループ検索の型定義
export interface GroupSearchResult {
  id: string;
  name: string;
  description: string;
  avatar_url: string;
  member_count: number;
}

// イベント検索の型定義
export interface EventSearchResult {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  image_url: string | null;
}

// 検索結果の型定義
export interface SearchResults {
  posts: PostSearchResult[];
  users: UserSearchResult[];
  tags: TagSearchResult[];
  groups: GroupSearchResult[];
  events: EventSearchResult[];
}

/**
 * 複合検索 - 複数のタイプの結果を一度に検索
 */
export const searchAll = async (query: string): Promise<SearchResults> => {
  try {
    // 並行して複数のクエリを実行
    const [postsResult, usersResult, tagsResult, groupsResult, eventsResult] = await Promise.all([
      searchPosts(query),
      searchUsers(query),
      searchTags(query),
      searchGroups(query),
      searchEvents(query),
    ]);

    return {
      posts: postsResult.data || [],
      users: usersResult.data || [],
      tags: tagsResult.data || [],
      groups: groupsResult.data || [],
      events: eventsResult.data || [],
    };
  } catch (error) {
    console.error('複合検索エラー:', error);
    return {
      posts: [],
      users: [],
      tags: [],
      groups: [],
      events: [],
    };
  }
};

/**
 * 投稿を検索
 */
export const searchPosts = async (query: string) => {
  try {
    // サニタイズされたクエリ（%はワイルドカード）
    const sanitizedQuery = `%${query.trim().toLowerCase()}%`;

    // 投稿テキスト検索
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:profiles(
          username,
          full_name,
          avatar_url
        ),
        post_tags (
          tag:tags (
            id,
            name
          )
        )
      `)
      .ilike('text_content', sanitizedQuery)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    // ネストされたタグデータを変換
    const formattedPosts = data.map(post => {
      const tags = post.post_tags ? post.post_tags.map((pt: any) => ({
        id: pt.tag.id,
        name: pt.tag.name
      })) : [];

      return {
        ...post,
        tags
      };
    });

    return { data: formattedPosts, error: null };
  } catch (error) {
    console.error('投稿検索エラー:', error);
    return { data: null, error };
  }
};

/**
 * ユーザーを検索
 */
export const searchUsers = async (query: string) => {
  try {
    const sanitizedQuery = `%${query.trim().toLowerCase()}%`;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .or(`username.ilike.${sanitizedQuery}`)
      .limit(20);

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('ユーザー検索エラー:', error);
    return { data: null, error };
  }
};

/**
 * タグを検索
 */
export const searchTags = async (query: string) => {
  try {
    const sanitizedQuery = `%${query.trim().toLowerCase()}%`;

    // タグを検索し、そのタグを持つ投稿数も取得
    const { data, error } = await supabase
      .from('tags')
      .select(`
        id, 
        name,
        post_tags (
          post_id
        )
      `)
      .ilike('name', sanitizedQuery)
      .limit(20);

    if (error) throw error;

    // 各タグの投稿数を計算
    const tagsWithCount = data.map(tag => ({
      id: tag.id,
      name: tag.name,
      post_count: tag.post_tags ? tag.post_tags.length : 0
    }));

    return { data: tagsWithCount, error: null };
  } catch (error) {
    console.error('タグ検索エラー:', error);
    return { data: null, error };
  }
};

/**
 * グループを検索 (グループテーブルがないため空の結果を返す)
 */
export const searchGroups = async (query: string) => {
  // グループテーブルが存在しないため、空の結果を返す
  console.log('グループ検索は実装されていません:', query);
  return { data: [], error: null };
};

/**
 * イベントを検索 (イベントテーブルがないため空の結果を返す)
 */
export const searchEvents = async (query: string) => {
  // イベントテーブルが存在しないため、空の結果を返す
  console.log('イベント検索は実装されていません:', query);
  return { data: [], error: null };
};