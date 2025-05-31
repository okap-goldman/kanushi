import { supabase } from './supabase';

export interface SearchResult {
  users: any[];
  posts: any[];
  hashtags: any[];
}

export interface SearchFilters {
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  hasMedia?: boolean;
}

export interface PaginatedSearchResult {
  data: SearchResult;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CategorySearchResult {
  data: any[];
  count: number;
}

class SearchService {
  async search(keyword: string): Promise<SearchResult> {
    try {
      const searchPattern = `%${keyword}%`;

      // Search users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url, bio')
        .or(
          `name.ilike.${searchPattern},username.ilike.${searchPattern},bio.ilike.${searchPattern}`
        )
        .limit(20);

      if (usersError) throw usersError;

      // Search posts
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          media_url,
          media_type,
          created_at,
          author_id,
          profiles:author_id(id, name, username, avatar_url)
        `)
        .or(`content.ilike.${searchPattern}`)
        .eq('is_draft', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      // Search hashtags
      const { data: hashtags, error: hashtagsError } = await supabase.rpc('search_hashtags', {
        search_term: keyword,
      });

      if (hashtagsError) throw hashtagsError;

      return {
        users: users || [],
        posts: posts || [],
        hashtags: hashtags || [],
      };
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Search failed');
    }
  }

  async searchByCategory(
    keyword: string,
    category: 'users' | 'posts' | 'hashtags',
    page = 0,
    limit = 20
  ): Promise<CategorySearchResult> {
    try {
      const searchPattern = `%${keyword}%`;
      const offset = page * limit;

      switch (category) {
        case 'users':
          const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, name, username, avatar_url, bio', { count: 'exact' })
            .or(
              `name.ilike.${searchPattern},username.ilike.${searchPattern},bio.ilike.${searchPattern}`
            )
            .range(offset, offset + limit - 1);

          if (usersError) throw usersError;

          return {
            data: users || [],
            count: users?.length || 0,
          };

        case 'posts':
          const { data: posts, error: postsError } = await supabase
            .from('posts')
            .select(
              `
              id,
              content,
              media_url,
              media_type,
              created_at,
              author_id,
              profiles:author_id(id, name, username, avatar_url)
            `,
              { count: 'exact' }
            )
            .or(`content.ilike.${searchPattern}`)
            .eq('is_draft', false)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

          if (postsError) throw postsError;

          return {
            data: posts || [],
            count: posts?.length || 0,
          };

        case 'hashtags':
          const { data: hashtags, error: hashtagsError } = await supabase.rpc(
            'search_hashtags_paginated',
            {
              search_term: keyword,
              limit_count: limit,
              offset_count: offset,
            }
          );

          if (hashtagsError) throw hashtagsError;

          return {
            data: hashtags || [],
            count: hashtags?.length || 0,
          };

        default:
          throw new Error('Invalid category');
      }
    } catch (error) {
      console.error('Category search error:', error);
      throw new Error('Category search failed');
    }
  }

  async searchWithFilters(keyword: string, filters: SearchFilters): Promise<SearchResult> {
    try {
      const searchPattern = `%${keyword}%`;

      // Build queries with filters
      const usersQuery = supabase
        .from('profiles')
        .select('id, name, username, avatar_url, bio')
        .or(
          `name.ilike.${searchPattern},username.ilike.${searchPattern},bio.ilike.${searchPattern}`
        );

      let postsQuery = supabase
        .from('posts')
        .select(`
          id,
          content,
          media_url,
          media_type,
          created_at,
          author_id,
          profiles:author_id(id, name, username, avatar_url)
        `)
        .or(`content.ilike.${searchPattern}`)
        .eq('is_draft', false);

      // Apply filters to posts
      if (filters.dateFrom) {
        postsQuery = postsQuery.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        postsQuery = postsQuery.lte('created_at', filters.dateTo);
      }
      if (filters.userId) {
        postsQuery = postsQuery.eq('author_id', filters.userId);
      }
      if (filters.hasMedia !== undefined) {
        if (filters.hasMedia) {
          postsQuery = postsQuery.not('media_url', 'is', null);
        } else {
          postsQuery = postsQuery.is('media_url', null);
        }
      }

      postsQuery = postsQuery.order('created_at', { ascending: false }).limit(20);

      const [usersResult, postsResult, hashtagsResult] = await Promise.all([
        usersQuery.limit(20),
        postsQuery,
        supabase.rpc('search_hashtags', { search_term: keyword }),
      ]);

      if (usersResult.error) throw usersResult.error;
      if (postsResult.error) throw postsResult.error;
      if (hashtagsResult.error) throw hashtagsResult.error;

      return {
        users: usersResult.data || [],
        posts: postsResult.data || [],
        hashtags: hashtagsResult.data || [],
      };
    } catch (error) {
      console.error('Filtered search error:', error);
      throw new Error('Filtered search failed');
    }
  }

  async searchWithPagination(
    keyword: string,
    page: number,
    limit: number
  ): Promise<PaginatedSearchResult> {
    try {
      const offset = (page - 1) * limit;
      const searchPattern = `%${keyword}%`;

      // Get counts for pagination
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .or(`content.ilike.${searchPattern}`)
        .eq('is_draft', false);

      // Search with pagination
      const [usersResult, postsResult, hashtagsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, name, username, avatar_url, bio')
          .or(
            `name.ilike.${searchPattern},username.ilike.${searchPattern},bio.ilike.${searchPattern}`
          )
          .range(offset, offset + limit - 1),

        supabase
          .from('posts')
          .select(`
            id,
            content,
            media_url,
            media_type,
            created_at,
            author_id,
            profiles:author_id(id, name, username, avatar_url)
          `)
          .or(`content.ilike.${searchPattern}`)
          .eq('is_draft', false)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),

        supabase.rpc('search_hashtags', { search_term: keyword }),
      ]);

      if (usersResult.error) throw usersResult.error;
      if (postsResult.error) throw postsResult.error;
      if (hashtagsResult.error) throw hashtagsResult.error;

      const totalPages = Math.ceil((postsCount || 0) / limit);

      return {
        data: {
          users: usersResult.data || [],
          posts: postsResult.data || [],
          hashtags: hashtagsResult.data || [],
        },
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error('Paginated search error:', error);
      throw new Error('Paginated search failed');
    }
  }

  async getRecommendedPosts(limit: number = 20): Promise<any[]> {
    try {
      // For development, use mock data
      if (__DEV__ || process.env.NODE_ENV === 'development') {
        return [];
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      // ログインしていない場合は人気の投稿を返す
      if (!user) {
        const { data: posts, error } = await supabase
          .from('post')
          .select(`
            id,
            text_content,
            media_url,
            content_type,
            created_at,
            user_id,
            profile!user_id(id, display_name, profile_image_url)
          `)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return posts || [];
      }

      // ログインしている場合は、フォローしているユーザーの投稿や興味のありそうな投稿を返す
      const { data: posts, error } = await supabase
        .from('post')
        .select(`
          id,
          text_content,
          media_url,
          content_type,
          created_at,
          user_id,
          profile!user_id(id, display_name, profile_image_url)
        `)
        .is('deleted_at', null)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // フォローしているユーザーの投稿を優先的に表示するロジックを追加できます
      return posts || [];
    } catch (error) {
      console.error('Get recommended posts error:', error);
      return [];
    }
  }

  async getDiscoverContent(type: 'posts' | 'users' | 'events' | 'items', limit: number = 20): Promise<any[]> {
    try {
      // For development, use mock data
      if (__DEV__ || process.env.NODE_ENV === 'development') {
        return [];
      }

      switch (type) {
        case 'posts':
          const { data: posts, error: postsError } = await supabase
            .from('posts')
            .select(`
              id,
              content,
              media_url,
              media_type,
              created_at,
              author_id,
              profiles:author_id(id, name, username, avatar_url)
            `)
            .eq('is_draft', false)
            .order('created_at', { ascending: false })
            .limit(limit);

          if (postsError) throw postsError;
          return posts || [];

        case 'users':
          const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, name, username, avatar_url, bio')
            .limit(limit);

          if (usersError) throw usersError;
          return users || [];

        case 'events':
          // TODO: イベントテーブルの実装後に追加
          return [];

        case 'items':
          // TODO: ショップアイテムテーブルの実装後に追加
          return [];

        default:
          return [];
      }
    } catch (error) {
      console.error('Get discover content error:', error);
      return [];
    }
  }
}

// 既存の関数も残しておく（互換性のため）

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
    const formattedPosts = data.map((post) => {
      const tags = post.post_tags
        ? post.post_tags.map((pt: any) => ({
            id: pt.tag.id,
            name: pt.tag.name,
          }))
        : [];

      return {
        ...post,
        tags,
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
    const tagsWithCount = data.map((tag) => ({
      id: tag.id,
      name: tag.name,
      post_count: tag.post_tags ? tag.post_tags.length : 0,
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

export const searchService = new SearchService();
