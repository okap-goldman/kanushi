import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addBookmark, removeBookmark, getBookmarks, checkBookmarked } from '../../src/lib/bookmarkService';
import { supabase } from '../../src/lib/supabase';

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('Bookmark Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addBookmark - ブックマーク追加', () => {
    it('投稿をブックマークできる', async () => {
      const mockBookmark = {
        id: 'bookmark-1',
        post_id: 'post-1',
        user_id: 'user-1',
        created_at: new Date().toISOString(),
      };

      const mockSupabaseChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockBookmark, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const result = await addBookmark('post-1', 'user-1');

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(result.data?.post_id).toBe('post-1');
      expect(result.data?.user_id).toBe('user-1');
      expect(supabase.from).toHaveBeenCalledWith('bookmarks');
      expect(mockSupabaseChain.insert).toHaveBeenCalledWith({
        post_id: 'post-1',
        user_id: 'user-1',
      });
    });

    it('既にブックマーク済みの場合はエラーになる', async () => {
      const mockError = {
        code: '23505', // PostgreSQL unique violation
        message: 'duplicate key value violates unique constraint',
      };

      const mockSupabaseChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const result = await addBookmark('post-1', 'user-1');

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('already bookmarked');
    });
  });

  describe('removeBookmark - ブックマーク削除', () => {
    it('ブックマークを削除できる', async () => {
      const mockSupabaseChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      mockSupabaseChain.eq.mockImplementation(function(this: any) {
        if (this.eq.mock.calls.length === 2) {
          return { error: null };
        }
        return this;
      });

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const result = await removeBookmark('post-1', 'user-1');

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('bookmarks');
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('post_id', 'post-1');
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('存在しないブックマークの削除はエラーになる', async () => {
      const mockError = new Error('Bookmark not found');
      const mockSupabaseChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      mockSupabaseChain.eq.mockImplementation(function(this: any) {
        if (this.eq.mock.calls.length === 2) {
          return { error: mockError };
        }
        return this;
      });

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const result = await removeBookmark('post-1', 'user-1');

      expect(result.error).toBe(mockError);
      expect(result.data).toBeNull();
    });
  });

  describe('getBookmarks - ブックマーク一覧取得', () => {
    it('ユーザーのブックマーク一覧を取得できる', async () => {
      const mockBookmarks = [
        {
          id: 'bookmark-1',
          post_id: 'post-1',
          user_id: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          post: {
            id: 'post-1',
            content_type: 'text',
            text_content: '投稿1',
            user: {
              id: 'author-1',
              name: '投稿者1',
              image: 'https://example.com/user1.jpg'
            }
          }
        },
        {
          id: 'bookmark-2',
          post_id: 'post-2',
          user_id: 'user-1',
          created_at: '2024-01-02T00:00:00Z',
          post: {
            id: 'post-2',
            content_type: 'image',
            media_url: 'https://example.com/image.jpg',
            user: {
              id: 'author-2',
              name: '投稿者2',
              image: 'https://example.com/user2.jpg'
            }
          }
        }
      ];

      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnValue({ data: mockBookmarks, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const result = await getBookmarks('user-1');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].post_id).toBe('post-1');
      expect(result.data?.[1].post_id).toBe('post-2');
      expect(supabase.from).toHaveBeenCalledWith('bookmarks');
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockSupabaseChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('ブックマークがない場合は空の配列を返す', async () => {
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnValue({ data: [], error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const result = await getBookmarks('user-1');

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe('checkBookmarked - ブックマーク状態確認', () => {
    it('ブックマーク済みの投稿で真を返す', async () => {
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'bookmark-1' }, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const result = await checkBookmarked('post-1', 'user-1');

      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('bookmarks');
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('post_id', 'post-1');
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('ブックマークしていない投稿で偽を返す', async () => {
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const result = await checkBookmarked('post-1', 'user-1');

      expect(result.error).toBeNull();
      expect(result.data).toBe(false);
    });
  });
});
