import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createPost, getPosts, toggleLike, createComment, getComments, deletePost } from '@/lib/postService';
import { supabase } from '@/lib/supabase';

// モックの設定
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('Post Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createPost - 投稿作成', () => {
    describe('テキスト投稿', () => {
      it('テキストのみの投稿を作成できる', async () => {
        // Arrange
        const mockPost = {
          id: 'post-1',
          user_id: 'user-1',
          content_type: 'text',
          text_content: 'これはテスト投稿です。',
          media_url: null,
          audio_url: null,
          likes_count: 0,
          comments_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const mockSupabaseChain = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockPost, error: null }),
        };

        (supabase.from as any).mockReturnValue(mockSupabaseChain);

        // Act
        const result = await createPost({
          author_id: 'user-1',
          media_type: 'text',
          content: 'これはテスト投稿です。',
          tags: [],
        });

        // Assert
        expect(result.error).toBeNull();
        expect(result.data).toBeTruthy();
        expect(result.data?.media_type).toBe('text');
        expect(result.data?.content).toBe('これはテスト投稿です。');
        expect(supabase.from).toHaveBeenCalledWith('posts');
        expect(mockSupabaseChain.insert).toHaveBeenCalledWith({
          user_id: 'user-1',
          content_type: 'text',
          text_content: 'これはテスト投稿です。',
          media_url: null,
          audio_url: null,
          thumbnail_url: undefined,
          likes_count: 0,
          comments_count: 0,
        });
      });

      it('最大10,000文字のテキストを投稿できる', async () => {
        // Arrange
        const longText = 'あ'.repeat(10000);
        const mockPost = {
          id: 'post-2',
          user_id: 'user-1',
          content_type: 'text',
          text_content: longText,
          media_url: null,
          audio_url: null,
          likes_count: 0,
          comments_count: 0,
        };

        const mockSupabaseChain = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockPost, error: null }),
        };

        (supabase.from as any).mockReturnValue(mockSupabaseChain);

        // Act
        const result = await createPost({
          author_id: 'user-1',
          media_type: 'text',
          content: longText,
          tags: [],
        });

        // Assert
        expect(result.error).toBeNull();
        expect(result.data?.content.length).toBe(10000);
      });

      it('10,001文字以上のテキストはエラーになる', async () => {
        // Arrange
        const tooLongText = 'あ'.repeat(10001);

        // Act
        const result = await createPost({
          author_id: 'user-1',
          media_type: 'text',
          content: tooLongText,
          tags: [],
        });

        // Assert
        expect(result.error).toBeTruthy();
        expect(result.error?.message).toContain('exceeds maximum length');
      });

      it('ハッシュタグ付きの投稿を作成できる', async () => {
        // Arrange
        const mockPost = {
          id: 'post-3',
          user_id: 'user-1',
          content_type: 'text',
          text_content: 'ハッシュタグテスト',
        };

        const mockTags = [
          { id: 'tag-1', name: '目醒め' },
          { id: 'tag-2', name: 'スピリチュアル' },
        ];

        const mockSupabaseChain = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockPost, error: null }),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };

        (supabase.from as any).mockImplementation((table: string) => {
          if (table === 'tags') {
            return {
              ...mockSupabaseChain,
              select: vi.fn().mockReturnThis(),
              insert: vi.fn().mockReturnThis(),
              single: vi.fn().mockImplementation(() => {
                const tagIndex = (supabase.from as any).mock.calls.filter(
                  (call) => call[0] === 'tags'
                ).length - 1;
                return Promise.resolve({ data: mockTags[tagIndex % 2], error: null });
              }),
            };
          } else if (table === 'post_tags') {
            return {
              insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          return mockSupabaseChain;
        });

        // Act
        const result = await createPost({
          author_id: 'user-1',
          media_type: 'text',
          content: 'ハッシュタグテスト',
          tags: [{ name: '目醒め' }, { name: 'スピリチュアル' }],
        });

        // Assert
        expect(result.error).toBeNull();
        expect(supabase.from).toHaveBeenCalledWith('tags');
        expect(supabase.from).toHaveBeenCalledWith('post_tags');
      });
    });

    describe('音声投稿', () => {
      it('音声URLを含む投稿を作成できる', async () => {
        // Arrange
        const mockPost = {
          id: 'post-4',
          user_id: 'user-1',
          content_type: 'audio',
          text_content: 'テスト音声投稿',
          audio_url: 'https://storage.example.com/audio/test.mp3',
          media_url: null,
        };

        const mockSupabaseChain = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockPost, error: null }),
        };

        (supabase.from as any).mockReturnValue(mockSupabaseChain);

        // Act
        const result = await createPost({
          author_id: 'user-1',
          media_type: 'audio',
          content: 'https://storage.example.com/audio/test.mp3',
          caption: 'テスト音声投稿',
          tags: [],
        });

        // Assert
        expect(result.error).toBeNull();
        expect(result.data?.media_type).toBe('audio');
        expect(result.data?.content).toBe('https://storage.example.com/audio/test.mp3');
        expect(mockSupabaseChain.insert).toHaveBeenCalledWith({
          user_id: 'user-1',
          content_type: 'audio',
          text_content: 'テスト音声投稿',
          media_url: null,
          audio_url: 'https://storage.example.com/audio/test.mp3',
          thumbnail_url: undefined,
          likes_count: 0,
          comments_count: 0,
        });
      });
    });

    describe('画像投稿', () => {
      it('画像URLを含む投稿を作成できる', async () => {
        // Arrange
        const mockPost = {
          id: 'post-5',
          user_id: 'user-1',
          content_type: 'image',
          text_content: 'テスト画像投稿',
          media_url: 'https://storage.example.com/images/test.jpg',
          audio_url: null,
        };

        const mockSupabaseChain = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockPost, error: null }),
        };

        (supabase.from as any).mockReturnValue(mockSupabaseChain);

        // Act
        const result = await createPost({
          author_id: 'user-1',
          media_type: 'image',
          content: 'https://storage.example.com/images/test.jpg',
          caption: 'テスト画像投稿',
          tags: [],
        });

        // Assert
        expect(result.error).toBeNull();
        expect(result.data?.media_type).toBe('image');
        expect(result.data?.content).toBe('https://storage.example.com/images/test.jpg');
      });
    });

    describe('エラーハンドリング', () => {
      it('データベースエラーを適切に処理する', async () => {
        // Arrange
        const mockError = new Error('Database error');
        const mockSupabaseChain = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        };

        (supabase.from as any).mockReturnValue(mockSupabaseChain);

        // Act
        const result = await createPost({
          author_id: 'user-1',
          media_type: 'text',
          content: 'エラーテスト',
          tags: [],
        });

        // Assert
        expect(result.error).toBe(mockError);
        expect(result.data).toBeNull();
      });
    });
  });

  describe('toggleLike - いいね機能', () => {
    it('いいねを追加できる', async () => {
      // Arrange
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);
      (supabase.rpc as any).mockResolvedValue({ data: null, error: null });

      // Act
      const result = await toggleLike('post-1', 'user-1');

      // Assert
      expect(result.error).toBeNull();
      expect(result.data?.liked).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('likes');
      expect(supabase.rpc).toHaveBeenCalledWith('increment_like_count', { post_id: 'post-1' });
    });

    it('いいねを削除できる', async () => {
      // Arrange
      const mockLike = { id: 'like-1', post_id: 'post-1', user_id: 'user-1' };
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockLike, error: null }),
        delete: vi.fn().mockReturnThis(),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);
      (supabase.rpc as any).mockResolvedValue({ data: null, error: null });

      // Act
      const result = await toggleLike('post-1', 'user-1');

      // Assert
      expect(result.error).toBeNull();
      expect(result.data?.liked).toBe(false);
      expect(supabase.rpc).toHaveBeenCalledWith('decrement_like_count', { post_id: 'post-1' });
    });

    it('エラーを適切に処理する', async () => {
      // Arrange
      const mockError = new Error('Database error');
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      // Act
      const result = await toggleLike('post-1', 'user-1');

      // Assert
      expect(result.error).toBe(mockError);
      expect(result.data).toBeNull();
    });
  });

  describe('createComment - コメント機能', () => {
    it('コメントを作成できる', async () => {
      // Arrange
      const mockComment = {
        id: 'comment-1',
        post_id: 'post-1',
        user_id: 'user-1',
        content: 'テストコメント',
        created_at: new Date().toISOString(),
      };

      const mockSupabaseChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockComment, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);
      (supabase.rpc as any).mockResolvedValue({ data: null, error: null });

      // Act
      const result = await createComment({
        post_id: 'post-1',
        author_id: 'user-1',
        content: 'テストコメント',
      });

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(supabase.from).toHaveBeenCalledWith('comments');
      expect(supabase.rpc).toHaveBeenCalledWith('increment_comment_count', { post_id: 'post-1' });
    });

    it('空のコメントはエラーになる', async () => {
      // Arrange & Act
      const result = await createComment({
        post_id: 'post-1',
        author_id: 'user-1',
        content: '',
      });

      // Assert
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('Content cannot be empty');
    });
  });

  describe('deletePost - 投稿削除', () => {
    it('自分の投稿を削除できる', async () => {
      // Arrange
      const mockPost = {
        id: 'post-1',
        user_id: 'user-1',
      };

      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockPost, error: null }),
        update: vi.fn().mockReturnThis(),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      // Act
      const result = await deletePost('post-1', 'user-1');

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toBe(true);
      expect(mockSupabaseChain.update).toHaveBeenCalledWith({ 
        deleted_at: expect.any(String) 
      });
    });

    it('他人の投稿は削除できない', async () => {
      // Arrange
      const mockPost = {
        id: 'post-1',
        user_id: 'user-2', // 別のユーザー
      };

      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockPost, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      // Act
      const result = await deletePost('post-1', 'user-1');

      // Assert
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('permission');
    });

    it('存在しない投稿を削除しようとするとエラー', async () => {
      // Arrange
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      // Act
      const result = await deletePost('non-existent', 'user-1');

      // Assert
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('not found');
    });
  });
});
