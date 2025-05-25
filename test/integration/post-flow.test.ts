import { createPost, deletePost, getTimeline, likePost } from '@/lib/postService';
import { supabase } from '@/lib/supabase';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Supabaseモックの設定
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: { id: 'test-user-id' } },
          error: null,
        })
      ),
    },
    from: vi.fn((table: string) => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: {
                id: 'new-post-id',
                user_id: 'test-user-id',
                content_type: 'text',
                text_content: 'テスト投稿',
                created_at: new Date().toISOString(),
              },
              error: null,
            })
          ),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() =>
              Promise.resolve({
                data: [
                  {
                    id: 'post-1',
                    user_id: 'user-1',
                    content_type: 'text',
                    text_content: 'テスト投稿1',
                    likes: 5,
                    created_at: '2024-01-01T10:00:00Z',
                  },
                  {
                    id: 'post-2',
                    user_id: 'user-2',
                    content_type: 'audio',
                    media_url: 'https://example.com/audio.mp3',
                    likes: 10,
                    created_at: '2024-01-01T09:00:00Z',
                  },
                ],
                error: null,
              })
            ),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() =>
            Promise.resolve({
              data: { id: 'post-1', likes: 6 },
              error: null,
            })
          ),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({
            error: null,
          })
        ),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() =>
          Promise.resolve({
            data: { path: 'media/test-file.jpg' },
            error: null,
          })
        ),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://example.com/test-file.jpg' },
        })),
      })),
    },
  },
}));

describe('投稿フロー統合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('テキスト投稿の作成からタイムライン表示まで', async () => {
    // 1. 投稿を作成
    const postData = {
      contentType: 'text' as const,
      textContent: 'これは統合テストの投稿です',
      tags: ['test', 'integration'],
    };

    const result = await createPost(postData);

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      id: expect.any(String),
      content_type: 'text',
      text_content: 'これは統合テストの投稿です',
    });

    // 2. タイムラインから投稿を取得
    const timeline = await getTimeline('family');

    expect(timeline.success).toBe(true);
    expect(timeline.posts).toHaveLength(2);
    expect(timeline.posts[0]).toMatchObject({
      id: 'post-1',
      text_content: 'テスト投稿1',
    });
  });

  it('音声投稿の録音から投稿、再生まで', async () => {
    // 音声ファイルのアップロードをモック
    const audioFile = new File(['audio content'], 'test.m4a', { type: 'audio/m4a' });

    const postData = {
      contentType: 'audio' as const,
      audioFile,
      caption: '音声投稿のテスト',
      durationSeconds: 180,
    };

    // 1. 音声をアップロード
    const uploadResult = await supabase.storage
      .from('media')
      .upload(`audio/${Date.now()}.m4a`, audioFile);

    expect(uploadResult.error).toBeNull();

    // 2. 投稿を作成
    const result = await createPost({
      ...postData,
      mediaUrl: 'https://example.com/test-file.jpg',
    });

    expect(result.success).toBe(true);

    // 3. タイムラインで確認
    const timeline = await getTimeline('family');
    const audioPost = timeline.posts.find((p) => p.content_type === 'audio');

    expect(audioPost).toBeDefined();
    expect(audioPost?.media_url).toBe('https://example.com/audio.mp3');
  });

  it('画像投稿のギャラリー選択から投稿まで', async () => {
    // 画像ファイルのアップロードをモック
    const imageFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });

    const postData = {
      contentType: 'image' as const,
      imageFile,
      caption: '美しい風景です',
    };

    // 1. 画像をアップロード
    const uploadResult = await supabase.storage
      .from('media')
      .upload(`images/${Date.now()}.jpg`, imageFile);

    expect(uploadResult.error).toBeNull();

    // 2. 公開URLを取得
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(uploadResult.data!.path);

    // 3. 投稿を作成
    const result = await createPost({
      ...postData,
      mediaUrl: urlData.publicUrl,
    });

    expect(result.success).toBe(true);
    expect(result.data?.media_url).toBe(urlData.publicUrl);
  });

  it('投稿作成時のエラーハンドリング', async () => {
    // エラーをシミュレート
    const mockFrom = vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: new Error('Database error'),
            })
          ),
        })),
      })),
    }));

    (supabase.from as any) = mockFrom;

    const postData = {
      contentType: 'text' as const,
      textContent: 'エラーテスト',
    };

    const result = await createPost(postData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('投稿の削除フロー', async () => {
    // 1. 投稿を作成
    const postData = {
      contentType: 'text' as const,
      textContent: '削除予定の投稿',
    };

    const createResult = await createPost(postData);
    expect(createResult.success).toBe(true);

    // 2. 投稿を削除
    const deleteResult = await deletePost(createResult.data!.id);
    expect(deleteResult.success).toBe(true);

    // 3. タイムラインから削除されたことを確認
    const timeline = await getTimeline('family');
    const deletedPost = timeline.posts.find((p) => p.id === createResult.data!.id);

    expect(deletedPost).toBeUndefined();
  });

  it('タグ付き投稿の作成と検索', async () => {
    const postData = {
      contentType: 'text' as const,
      textContent: 'タグ付き投稿',
      tags: ['瞑想', 'ヨガ', '朝活'],
    };

    // 1. タグ付き投稿を作成
    const result = await createPost(postData);
    expect(result.success).toBe(true);

    // 2. タグテーブルへの挿入を確認
    expect(supabase.from).toHaveBeenCalledWith('tags');
    expect(supabase.from).toHaveBeenCalledWith('post_tags');
  });

  it('投稿への権限チェック', async () => {
    // 他人の投稿を削除しようとする
    const otherUserPostId = 'other-user-post';

    const deleteResult = await deletePost(otherUserPostId);

    // 権限エラーが返されることを期待
    expect(deleteResult.success).toBe(false);
    expect(deleteResult.error?.message).toContain('permission');
  });

  it('メディアファイルのサイズ制限チェック', async () => {
    // 大きすぎるファイルをシミュレート
    const largeFile = new File(
      [new ArrayBuffer(100 * 1024 * 1024)], // 100MB
      'large.jpg',
      { type: 'image/jpeg' }
    );

    const postData = {
      contentType: 'image' as const,
      imageFile: largeFile,
      caption: '大きな画像',
    };

    const result = await createPost(postData);

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('size');
  });

  it('投稿のリアルタイム更新', async () => {
    // リアルタイムサブスクリプションのモック
    const mockSubscription = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    };

    (supabase.from as any).mockReturnValue({
      on: mockSubscription.on,
      subscribe: mockSubscription.subscribe,
    });

    // タイムラインのリアルタイム更新を購読
    const { subscription } = await subscribeToTimeline('family', (payload) => {
      expect(payload.eventType).toBe('INSERT');
      expect(payload.new).toMatchObject({
        content_type: 'text',
        text_content: 'リアルタイム投稿',
      });
    });

    expect(mockSubscription.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.any(Object),
      expect.any(Function)
    );
  });
});

// ヘルパー関数（実際のサービスファイルに存在すると仮定）
async function subscribeToTimeline(type: 'family' | 'watch', callback: (payload: any) => void) {
  const subscription = supabase
    .from('posts')
    .on('postgres_changes', { event: '*', schema: 'public' }, callback)
    .subscribe();

  return { subscription };
}
