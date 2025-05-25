import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTimelinePosts } from '@/lib/timelineService';
import { supabase } from '@/lib/supabase';

// モックの設定
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('Timeline Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTimelinePosts - タイムライン取得', () => {
    it('ファミリータイムラインの投稿を時系列順に取得できる', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockFollows = [
        { followee_id: 'family-user1' },
        { followee_id: 'family-user2' },
      ];
      const mockPosts = [
        {
          id: 'post1',
          user_id: 'family-user1',
          content_type: 'text',
          text_content: '投稿1',
          created_at: '2024-01-02T00:00:00Z',
          likes_count: 5,
          comments_count: 2,
          author: [{ id: 'family-user1', name: 'ユーザー1', image: 'https://example.com/user1.jpg' }],
          tags: [],
        },
        {
          id: 'post2',
          user_id: 'family-user2',
          content_type: 'text',
          text_content: '投稿2',
          created_at: '2024-01-01T00:00:00Z',
          likes_count: 3,
          comments_count: 1,
          author: [{ id: 'family-user2', name: 'ユーザー2', image: 'https://example.com/user2.jpg' }],
          tags: [],
        },
      ];

      // フォロー関係のモック - 最後のeqでデータを返す
      const mockFollowsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation(function(this: any) {
          // 3回目のeq呼び出し（status チェック）でデータを返す
          if (this.eq.mock.calls.length === 3) {
            return { data: mockFollows, error: null };
          }
          return this;
        }),
      };

      // 投稿データのモック - limitでデータを返す  
      const mockPostsChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue({ data: mockPosts, error: null }),
      };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'follows') {
          return mockFollowsChain;
        } else if (table === 'posts') {
          return mockPostsChain;
        }
      });

      // Act
      const result = await getTimelinePosts(userId, 'family');

      // Assert
      expect(result.error).toBeNull();
      expect(result.data?.posts).toHaveLength(2);
      expect(result.data?.posts[0].id).toBe('post1');
      expect(result.data?.posts[0].created_at > result.data?.posts[1].created_at).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('follows');
      expect(mockFollowsChain.eq).toHaveBeenCalledWith('follower_id', userId);
      expect(mockFollowsChain.eq).toHaveBeenCalledWith('follow_type', 'family');
    });

    it('ページネーションが動作する', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockFollows = [{ followee_id: 'user1' }];
      const mockPosts = Array.from({ length: 20 }, (_, i) => ({
        id: `post${i}`,
        user_id: 'user1',
        content_type: 'text',
        text_content: `投稿${i}`,
        created_at: new Date(2024, 0, 20 - i).toISOString(),
        author: [{ id: 'user1', name: 'ユーザー1', image: 'https://example.com/user1.jpg' }],
        tags: [],
      }));

      const mockFollowsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation(function(this: any) {
          if (this.eq.mock.calls.length === 3) {
            return { data: mockFollows, error: null };
          }
          return this;
        }),
      };

      const mockPostsChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation(function(this: any) {
          // limit チェーンを作成して返す
          const limitChain = {
            ...this,
            lt: vi.fn().mockReturnValue({ data: mockPosts, error: null }),
          };
          // lt を呼ばない場合はそのままデータを返す
          Object.defineProperty(limitChain, 'data', { value: mockPosts });
          Object.defineProperty(limitChain, 'error', { value: null });
          return limitChain;
        }),
      };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'follows') {
          return mockFollowsChain;
        } else if (table === 'posts') {
          return mockPostsChain;
        }
      });

      // Act
      const result = await getTimelinePosts(userId, 'family', 20, '2024-01-21T00:00:00Z');

      // Assert
      expect(result.error).toBeNull();
      expect(result.data?.posts).toHaveLength(20);
      expect(result.data?.hasMore).toBeDefined();
      // limitが呼ばれていることを確認
      expect(mockPostsChain.limit).toHaveBeenCalledWith(21);
    });

    it('フォローしているユーザーがいない場合は空の配列を返す', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockFollowsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation(function(this: any) {
          if (this.eq.mock.calls.length === 3) {
            return { data: [], error: null }; // フォローなし
          }
          return this;
        }),
      };

      (supabase.from as any).mockReturnValue(mockFollowsChain);

      // Act
      const result = await getTimelinePosts(userId, 'family');

      // Assert
      expect(result.error).toBeNull();
      expect(result.data?.posts).toEqual([]);
    });
  });

  describe('ウォッチタイムライン', () => {
    it('ウォッチフォローの投稿を取得できる', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockFollows = [
        { followee_id: 'watch-user1' },
        { followee_id: 'watch-user2' },
      ];
      const mockPosts = [
        {
          id: 'post1',
          user_id: 'watch-user1',
          content_type: 'text',
          text_content: 'ウォッチ投稿1',
          created_at: '2024-01-02T00:00:00Z',
          author: [{ id: 'watch-user1', name: 'ウォッチユーザー1', image: 'https://example.com/watch1.jpg' }],
          tags: [],
        },
      ];

      const mockFollowsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation(function(this: any) {
          if (this.eq.mock.calls.length === 3) {
            return { data: mockFollows, error: null };
          }
          return this;
        }),
      };

      const mockPostsChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue({ data: mockPosts, error: null }),
      };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'follows') {
          return mockFollowsChain;
        } else if (table === 'posts') {
          return mockPostsChain;
        }
      });

      // Act
      const result = await getTimelinePosts(userId, 'watch');

      // Assert
      expect(result.error).toBeNull();
      expect(result.data?.posts).toHaveLength(1);
      expect(mockFollowsChain.eq).toHaveBeenCalledWith('follow_type', 'watch');
    });
  });

  describe('エラーハンドリング', () => {
    it('データベースエラーを適切に処理する', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockError = new Error('Database error');
      const mockFollowsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation(function(this: any) {
          if (this.eq.mock.calls.length === 3) {
            return { data: null, error: mockError };
          }
          return this;
        }),
      };

      (supabase.from as any).mockReturnValue(mockFollowsChain);

      // Act
      const result = await getTimelinePosts(userId, 'family');

      // Assert
      expect(result.error).toBe(mockError);
      expect(result.data).toBeNull();
    });
  });
});
