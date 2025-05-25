import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SearchService } from '../../src/lib/searchService';
import { supabase } from '../../src/lib/supabase';

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('SearchService', () => {
  let searchService: SearchService;

  beforeEach(() => {
    vi.clearAllMocks();
    searchService = new SearchService();
  });

  describe('search', () => {
    it('should search by keyword across users, posts, and hashtags', async () => {
      const mockUsers = [
        { id: '1', name: 'テストユーザー', username: 'testuser' },
      ];
      const mockPosts = [
        { id: '1', content: 'テスト投稿', author_id: '1' },
      ];
      const mockHashtags = [
        { tag: 'テスト', count: 5 },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
          } as any;
        }
        if (table === 'posts') {
          return {
            select: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: mockPosts, error: null }),
          } as any;
        }
        return {} as any;
      });

      vi.mocked(supabase.rpc).mockResolvedValue({ 
        data: mockHashtags, 
        error: null 
      });

      const result = await searchService.search('テスト');

      expect(result).toEqual({
        users: mockUsers,
        posts: mockPosts,
        hashtags: mockHashtags,
      });
    });

    it('should return empty results when no matches found', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any));

      vi.mocked(supabase.rpc).mockResolvedValue({ 
        data: [], 
        error: null 
      });

      const result = await searchService.search('存在しないキーワード');

      expect(result).toEqual({
        users: [],
        posts: [],
        hashtags: [],
      });
    });
  });

  describe('searchByCategory', () => {
    it('should search within a specific category', async () => {
      const mockUsers = [
        { id: '1', name: '詳細検索ユーザー', username: 'detailuser' },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
      } as any);

      const result = await searchService.searchByCategory('詳細', 'users');

      expect(result).toEqual({
        data: mockUsers,
        count: mockUsers.length,
      });
    });
  });

  describe('searchWithFilters', () => {
    it('should search with date range filter', async () => {
      const mockPosts = [
        { id: '1', content: 'フィルタ済み投稿', created_at: '2025-01-01' },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockPosts, error: null }),
      } as any);

      const filters = {
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
      };

      const result = await searchService.searchWithFilters('フィルタ', filters);

      expect(result.posts).toEqual(mockPosts);
    });
  });

  describe('searchWithPagination', () => {
    it('should search with pagination parameters', async () => {
      const mockData = {
        users: [],
        posts: [{ id: '1', content: 'ページ1投稿' }],
        hashtags: [],
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'posts') {
          callCount++;
          if (callCount === 1) {
            // First call is for count
            return {
              select: vi.fn().mockReturnThis(),
              or: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ 
                data: null, 
                error: null,
                count: 100,
              }),
            } as any;
          } else {
            // Second call is for data
            return {
              select: vi.fn().mockReturnThis(),
              or: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              range: vi.fn().mockResolvedValue({ 
                data: mockData.posts, 
                error: null,
              }),
            } as any;
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any;
      });

      vi.mocked(supabase.rpc).mockResolvedValue({ 
        data: [], 
        error: null 
      });

      const result = await searchService.searchWithPagination('ページ', 1, 10);

      expect(result).toEqual({
        data: mockData,
        page: 1,
        limit: 10,
        totalPages: 10,
      });
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: networkError }),
      } as any);

      await expect(searchService.search('エラーテスト')).rejects.toThrow('Search failed');
    });
  });
});