import { createHighlight, getHighlights, removeHighlight } from '@/lib/highlightService';
import { supabase } from '@/lib/supabase';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// モックの設定
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('Highlight Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createHighlight - ハイライト作成', () => {
    it('理由付きでハイライトを作成できる', async () => {
      // Arrange
      const mockHighlight = {
        id: 'highlight-1',
        post_id: 'post-1',
        user_id: 'user-1',
        reason: 'このポストから大きな気づきを得ました',
        created_at: new Date().toISOString(),
      };

      const mockSupabaseChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockHighlight, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      // Act
      const result = await createHighlight({
        post_id: 'post-1',
        user_id: 'user-1',
        reason: 'このポストから大きな気づきを得ました',
      });

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(result.data?.reason).toBe('このポストから大きな気づきを得ました');
      expect(supabase.from).toHaveBeenCalledWith('highlights');
      expect(mockSupabaseChain.insert).toHaveBeenCalledWith({
        post_id: 'post-1',
        user_id: 'user-1',
        reason: 'このポストから大きな気づきを得ました',
      });
    });

    it('理由が空の場合はエラーになる', async () => {
      // Act
      const result = await createHighlight({
        post_id: 'post-1',
        user_id: 'user-1',
        reason: '',
      });

      // Assert
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('Reason is required');
    });

    it('理由が短すぎる場合はエラーになる', async () => {
      // Act
      const result = await createHighlight({
        post_id: 'post-1',
        user_id: 'user-1',
        reason: '短い',
      });

      // Assert
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('at least 5 characters');
    });

    it('既にハイライト済みの場合はエラーになる', async () => {
      // Arrange
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

      // Act
      const result = await createHighlight({
        post_id: 'post-1',
        user_id: 'user-1',
        reason: '素晴らしい投稿です',
      });

      // Assert
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('already highlighted');
    });
  });

  describe('removeHighlight - ハイライト削除', () => {
    it('ハイライトを削除できる', async () => {
      // Arrange
      const mockSupabaseChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      // 最後のeqでerrorを返す
      mockSupabaseChain.eq.mockImplementation(function (this: any) {
        if (this.eq.mock.calls.length === 2) {
          return { error: null };
        }
        return this;
      });

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      // Act
      const result = await removeHighlight('post-1', 'user-1');

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('highlights');
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('post_id', 'post-1');
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('削除時のエラーを適切に処理する', async () => {
      // Arrange
      const mockError = new Error('Database error');
      const mockSupabaseChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      mockSupabaseChain.eq.mockImplementation(function (this: any) {
        if (this.eq.mock.calls.length === 2) {
          return { error: mockError };
        }
        return this;
      });

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      // Act
      const result = await removeHighlight('post-1', 'user-1');

      // Assert
      expect(result.error).toBe(mockError);
      expect(result.data).toBeNull();
    });
  });

  describe('getHighlights - ハイライト取得', () => {
    it('投稿のハイライト一覧を取得できる', async () => {
      // Arrange
      const mockHighlights = [
        {
          id: 'highlight-1',
          post_id: 'post-1',
          user_id: 'user-1',
          reason: '素晴らしい気づきがありました',
          created_at: '2024-01-01T00:00:00Z',
          user: [{ id: 'user-1', name: 'ユーザー1', image: 'https://example.com/user1.jpg' }],
        },
        {
          id: 'highlight-2',
          post_id: 'post-1',
          user_id: 'user-2',
          reason: '心に響きました',
          created_at: '2024-01-02T00:00:00Z',
          user: [{ id: 'user-2', name: 'ユーザー2', image: 'https://example.com/user2.jpg' }],
        },
      ];

      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnValue({ data: mockHighlights, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      // Act
      const result = await getHighlights('post-1');

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].reason).toBe('素晴らしい気づきがありました');
      expect(supabase.from).toHaveBeenCalledWith('highlights');
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('post_id', 'post-1');
      expect(mockSupabaseChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('ハイライトがない場合は空の配列を返す', async () => {
      // Arrange
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnValue({ data: [], error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      // Act
      const result = await getHighlights('post-1');

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });

    it('取得時のエラーを適切に処理する', async () => {
      // Arrange
      const mockError = new Error('Database error');
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnValue({ data: null, error: mockError }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      // Act
      const result = await getHighlights('post-1');

      // Assert
      expect(result.error).toBe(mockError);
      expect(result.data).toBeNull();
    });
  });
});
