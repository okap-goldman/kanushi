import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  likePost, 
  unlikePost, 
  addComment, 
  deleteComment,
  highlightPost,
  getPostEngagement 
} from '@/lib/postService';
import { supabase } from '@/lib/supabase';

// Supabaseモックの設定
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'current-user-id' } },
        error: null,
      })),
    },
    from: vi.fn((table: string) => {
      switch (table) {
        case 'post_likes':
          return {
            insert: vi.fn(() => Promise.resolve({
              data: { post_id: 'post-1', user_id: 'current-user-id' },
              error: null,
            })),
            delete: vi.fn(() => ({
              match: vi.fn(() => Promise.resolve({
                error: null,
              })),
            })),
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: { post_id: 'post-1', user_id: 'current-user-id' },
                  error: null,
                })),
              })),
            })),
          };
        
        case 'comments':
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: {
                    id: 'comment-1',
                    post_id: 'post-1',
                    user_id: 'current-user-id',
                    content: 'Great post!',
                    created_at: new Date().toISOString(),
                  },
                  error: null,
                })),
              })),
            })),
            delete: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                error: null,
              })),
            })),
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({
                  data: [
                    {
                      id: 'comment-1',
                      content: 'Great post!',
                      user: { displayName: 'User 1' },
                      created_at: '2024-01-01T10:00:00Z',
                    },
                    {
                      id: 'comment-2',
                      content: 'Thanks for sharing',
                      user: { displayName: 'User 2' },
                      created_at: '2024-01-01T11:00:00Z',
                    },
                  ],
                  error: null,
                })),
              })),
            })),
          };
        
        case 'post_highlights':
          return {
            insert: vi.fn(() => Promise.resolve({
              data: {
                post_id: 'post-1',
                user_id: 'current-user-id',
                reason: '深い洞察を含んでいる',
              },
              error: null,
            })),
          };
        
        case 'posts':
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: {
                    id: 'post-1',
                    likes_count: 10,
                    comments_count: 5,
                    highlights_count: 2,
                  },
                  error: null,
                })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                data: { likes_count: 11 },
                error: null,
              })),
            })),
          };
        
        default:
          return {};
      }
    }),
    rpc: vi.fn((functionName: string) => {
      switch (functionName) {
        case 'increment_likes':
          return Promise.resolve({
            data: { likes_count: 11 },
            error: null,
          });
        case 'decrement_likes':
          return Promise.resolve({
            data: { likes_count: 9 },
            error: null,
          });
        default:
          return Promise.resolve({ data: null, error: null });
      }
    }),
  },
}));

describe('いいね・コメント連携統合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('いいね機能', () => {
    it('いいね数とコメント数のリアルタイム更新', async () => {
      const postId = 'post-1';

      // 1. 初期状態を取得
      const initialEngagement = await getPostEngagement(postId);
      expect(initialEngagement.likesCount).toBe(10);
      expect(initialEngagement.commentsCount).toBe(5);

      // 2. いいねを追加
      const likeResult = await likePost(postId);
      expect(likeResult.success).toBe(true);

      // 3. いいね数が更新されることを確認
      const updatedEngagement = await getPostEngagement(postId);
      expect(updatedEngagement.likesCount).toBe(11);

      // 4. Supabase RPCが呼ばれたことを確認
      expect(supabase.rpc).toHaveBeenCalledWith('increment_likes', {
        post_id: postId,
      });
    });

    it('同じユーザーが複数回いいねできない', async () => {
      const postId = 'post-1';

      // 1. 最初のいいね
      const firstLike = await likePost(postId);
      expect(firstLike.success).toBe(true);

      // 2. 同じユーザーが再度いいねしようとする
      const secondLike = await likePost(postId);
      expect(secondLike.success).toBe(false);
      expect(secondLike.error?.message).toContain('already liked');
    });

    it('いいねの取り消し', async () => {
      const postId = 'post-1';

      // 1. いいねする
      await likePost(postId);

      // 2. いいねを取り消す
      const unlikeResult = await unlikePost(postId);
      expect(unlikeResult.success).toBe(true);

      // 3. いいね数が減ることを確認
      expect(supabase.rpc).toHaveBeenCalledWith('decrement_likes', {
        post_id: postId,
      });
    });
  });

  describe('コメント機能', () => {
    it('コメントの追加と表示', async () => {
      const postId = 'post-1';
      const commentText = 'これは素晴らしい投稿です！';

      // 1. コメントを追加
      const commentResult = await addComment(postId, commentText);
      expect(commentResult.success).toBe(true);
      expect(commentResult.data).toMatchObject({
        content: 'Great post!',
        post_id: postId,
      });

      // 2. コメント一覧を取得
      const comments = await getComments(postId);
      expect(comments).toHaveLength(2);
      expect(comments[0].content).toBe('Great post!');
    });

    it('空のコメントは投稿できない', async () => {
      const postId = 'post-1';
      const emptyComment = '';

      const result = await addComment(postId, emptyComment);
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('empty');
    });

    it('自分のコメントのみ削除できる', async () => {
      const postId = 'post-1';
      const commentId = 'comment-1';

      // 1. 自分のコメントを削除
      const deleteResult = await deleteComment(commentId);
      expect(deleteResult.success).toBe(true);

      // 2. 他人のコメントを削除しようとする
      const otherCommentId = 'other-user-comment';
      const deleteOtherResult = await deleteComment(otherCommentId);
      expect(deleteOtherResult.success).toBe(false);
      expect(deleteOtherResult.error?.message).toContain('permission');
    });

    it('コメント数の自動更新', async () => {
      const postId = 'post-1';

      // 1. コメントを追加
      await addComment(postId, 'New comment');

      // 2. 投稿のコメント数が更新されることを確認
      const engagement = await getPostEngagement(postId);
      expect(engagement.commentsCount).toBe(6); // 5 + 1
    });
  });

  describe('ハイライト機能', () => {
    it('ハイライト機能の統合テスト', async () => {
      const postId = 'post-1';
      const reason = 'この投稿は非常に示唆に富んでいます';

      // 1. ハイライトを追加
      const highlightResult = await highlightPost(postId, reason);
      expect(highlightResult.success).toBe(true);

      // 2. ハイライトテーブルに挿入されることを確認
      expect(supabase.from).toHaveBeenCalledWith('post_highlights');
      const mockInsert = (supabase.from as any).mock.results.find(
        (r: any) => r.value.insert
      );
      expect(mockInsert).toBeDefined();

      // 3. 理由が保存されることを確認
      expect(highlightResult.data).toMatchObject({
        post_id: postId,
        reason: '深い洞察を含んでいる',
      });
    });

    it('理由なしではハイライトできない', async () => {
      const postId = 'post-1';
      const emptyReason = '';

      const result = await highlightPost(postId, emptyReason);
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('reason required');
    });

    it('同じ投稿を複数回ハイライトできない', async () => {
      const postId = 'post-1';
      const reason = 'Great insight';

      // 1. 最初のハイライト
      await highlightPost(postId, reason);

      // 2. 同じ投稿を再度ハイライト
      const secondHighlight = await highlightPost(postId, 'Another reason');
      expect(secondHighlight.success).toBe(false);
      expect(secondHighlight.error?.message).toContain('already highlighted');
    });
  });

  describe('通知連携', () => {
    it('いいね時に投稿者に通知が送信される', async () => {
      const postId = 'post-1';
      const mockNotification = vi.fn();

      // 通知サービスをモック
      vi.mock('@/lib/notificationService', () => ({
        sendNotification: mockNotification,
      }));

      // いいねを実行
      await likePost(postId);

      // 通知が送信されることを確認
      expect(mockNotification).toHaveBeenCalledWith({
        userId: 'post-owner-id',
        type: 'like',
        title: 'いいねされました',
        body: expect.stringContaining('あなたの投稿にいいねしました'),
        data: {
          postId,
          fromUserId: 'current-user-id',
        },
      });
    });

    it('コメント時に投稿者に通知が送信される', async () => {
      const postId = 'post-1';
      const mockNotification = vi.fn();

      vi.mock('@/lib/notificationService', () => ({
        sendNotification: mockNotification,
      }));

      // コメントを追加
      await addComment(postId, 'Great post!');

      // 通知が送信されることを確認
      expect(mockNotification).toHaveBeenCalledWith({
        userId: 'post-owner-id',
        type: 'comment',
        title: '新しいコメント',
        body: expect.stringContaining('コメントしました'),
        data: {
          postId,
          commentId: 'comment-1',
          fromUserId: 'current-user-id',
        },
      });
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量のいいね・コメントでもパフォーマンスが維持される', async () => {
      const postId = 'popular-post';
      const startTime = Date.now();

      // 100件のいいねをシミュレート
      const likePromises = Array.from({ length: 100 }, (_, i) => 
        likePost(postId, `user-${i}`)
      );

      await Promise.all(likePromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 100件のいいねが1秒以内に処理される
      expect(duration).toBeLessThan(1000);
    });
  });
});

// ヘルパー関数（実際のサービスに存在すると仮定）
async function getComments(postId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select('*, user:profiles(displayName)')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}