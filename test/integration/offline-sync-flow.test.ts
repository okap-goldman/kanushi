import {
  clearOldOfflineData,
  getOfflineContent,
  saveForLater,
  savePostOffline,
  syncOfflinePosts,
} from '@/lib/offlineService';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// モックの設定
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: vi.fn(() => Promise.resolve()),
    getItem: vi.fn(() => Promise.resolve(null)),
    removeItem: vi.fn(() => Promise.resolve()),
    getAllKeys: vi.fn(() => Promise.resolve([])),
    multiGet: vi.fn(() => Promise.resolve([])),
    multiRemove: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('@react-native-community/netinfo', () => ({
  default: {
    fetch: vi.fn(() => Promise.resolve({ isConnected: true })),
    addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  },
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: { id: 'user-1' } },
          error: null,
        })
      ),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { id: 'synced-post-1' },
              error: null,
            })
          ),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { id: 'post-1', content: 'Cached content' },
              error: null,
            })
          ),
        })),
      })),
    })),
  },
}));

describe('オフライン同期統合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('オフライン時の投稿', () => {
    it('オフライン時の投稿がオンライン復帰後に送信される', async () => {
      // 1. オフライン状態をシミュレート
      (NetInfo.fetch as any).mockResolvedValueOnce({ isConnected: false });

      const postData = {
        contentType: 'text' as const,
        textContent: 'オフライン投稿です',
        tags: ['offline', 'test'],
      };

      // 2. オフラインで投稿を保存
      const offlineResult = await savePostOffline(postData);
      expect(offlineResult.success).toBe(true);
      expect(offlineResult.data?.pendingSync).toBe(true);

      // 3. AsyncStorageに保存されることを確認
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('offline_post_'),
        expect.stringContaining('オフライン投稿です')
      );

      // 4. オンラインに復帰
      (NetInfo.fetch as any).mockResolvedValueOnce({ isConnected: true });

      // 5. 同期を実行
      const syncResult = await syncOfflinePosts();
      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedCount).toBe(1);

      // 6. Supabaseに投稿されることを確認
      expect(supabase.from).toHaveBeenCalledWith('posts');
    });

    it('複数のオフライン投稿が順番に同期される', async () => {
      // オフライン状態
      (NetInfo.fetch as any).mockResolvedValue({ isConnected: false });

      // 複数の投稿を作成
      const posts = [
        { contentType: 'text' as const, textContent: '投稿1' },
        { contentType: 'text' as const, textContent: '投稿2' },
        { contentType: 'text' as const, textContent: '投稿3' },
      ];

      for (const post of posts) {
        await savePostOffline(post);
      }

      // オンラインに復帰して同期
      (NetInfo.fetch as any).mockResolvedValue({ isConnected: true });
      const syncResult = await syncOfflinePosts();

      expect(syncResult.syncedCount).toBe(3);
      expect(supabase.from).toHaveBeenCalledTimes(3);
    });

    it('同期エラー時の再試行', async () => {
      // オフライン投稿を保存
      (NetInfo.fetch as any).mockResolvedValueOnce({ isConnected: false });
      await savePostOffline({ contentType: 'text', textContent: 'Error test' });

      // 同期時にエラーをシミュレート
      (NetInfo.fetch as any).mockResolvedValue({ isConnected: true });
      (supabase.from as any).mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: new Error('Network error'),
              })
            ),
          })),
        })),
      });

      // 最初の同期は失敗
      const firstSync = await syncOfflinePosts();
      expect(firstSync.success).toBe(false);
      expect(firstSync.failedCount).toBe(1);

      // 再試行で成功
      const retrySync = await syncOfflinePosts();
      expect(retrySync.success).toBe(true);
    });
  });

  describe('後で見る機能', () => {
    it('後で見る機能の保存と再生', async () => {
      const postId = 'post-123';
      const postData = {
        id: postId,
        contentType: 'audio' as const,
        mediaUrl: 'https://example.com/audio.mp3',
        textContent: '瞑想音声',
        user: {
          displayName: 'スピリチュアルティーチャー',
        },
      };

      // 1. 投稿を後で見るに保存
      const saveResult = await saveForLater(postData);
      expect(saveResult.success).toBe(true);

      // 2. 暗号化されて保存されることを確認
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('saved_post_'),
        expect.any(String) // 暗号化されたデータ
      );

      // 3. 保存した投稿を取得
      (AsyncStorage.getItem as any).mockResolvedValueOnce(
        JSON.stringify({
          ...postData,
          savedAt: new Date().toISOString(),
          encrypted: true,
        })
      );

      const savedPosts = await getOfflineContent('saved');
      expect(savedPosts).toHaveLength(1);
      expect(savedPosts[0].id).toBe(postId);
    });

    it('オフラインキャッシュ管理（最大100件/500MB）', async () => {
      // 大量のデータを保存
      const posts = Array.from({ length: 150 }, (_, i) => ({
        id: `post-${i}`,
        contentType: 'audio' as const,
        mediaUrl: `https://example.com/audio-${i}.mp3`,
        fileSize: 5 * 1024 * 1024, // 5MB per file
      }));

      // 保存を試みる
      let savedCount = 0;
      let totalSize = 0;

      for (const post of posts) {
        const result = await saveForLater(post);
        if (result.success) {
          savedCount++;
          totalSize += post.fileSize;
        } else {
          // 制限に達した
          break;
        }
      }

      // 100件または500MB以下であることを確認
      expect(savedCount).toBeLessThanOrEqual(100);
      expect(totalSize).toBeLessThanOrEqual(500 * 1024 * 1024);
    });

    it('自動削除（1ヶ月後）', async () => {
      // 古いデータをモック
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 2); // 2ヶ月前

      const oldPost = {
        id: 'old-post',
        savedAt: oldDate.toISOString(),
        content: 'Old content',
      };

      const recentPost = {
        id: 'recent-post',
        savedAt: new Date().toISOString(),
        content: 'Recent content',
      };

      // AsyncStorageに両方のデータを設定
      (AsyncStorage.getAllKeys as any).mockResolvedValueOnce([
        'saved_post_old-post',
        'saved_post_recent-post',
      ]);

      (AsyncStorage.multiGet as any).mockResolvedValueOnce([
        ['saved_post_old-post', JSON.stringify(oldPost)],
        ['saved_post_recent-post', JSON.stringify(recentPost)],
      ]);

      // 古いデータの削除を実行
      const cleanupResult = await clearOldOfflineData();
      expect(cleanupResult.deletedCount).toBe(1);

      // 古いデータのみ削除されることを確認
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['saved_post_old-post']);
    });
  });

  describe('ネットワーク状態の監視', () => {
    it('ネットワーク状態変化時の自動同期', async () => {
      let networkListener: any;

      // ネットワーク監視のリスナーを保存
      (NetInfo.addEventListener as any).mockImplementation((callback: any) => {
        networkListener = callback;
        return { remove: vi.fn() };
      });

      // オフライン同期サービスを初期化
      const offlineSync = initializeOfflineSync();

      // オフライン投稿を作成
      (NetInfo.fetch as any).mockResolvedValueOnce({ isConnected: false });
      await savePostOffline({ contentType: 'text', textContent: 'Auto sync test' });

      // ネットワークがオンラインに変化
      networkListener({ isConnected: true });

      // 自動同期が実行されることを確認
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(supabase.from).toHaveBeenCalled();
    });
  });

  describe('暗号化とセキュリティ', () => {
    it('保存データの暗号化', async () => {
      const sensitivePost = {
        id: 'private-post',
        textContent: '個人的な内容です',
        user: {
          email: 'user@example.com',
        },
      };

      await saveForLater(sensitivePost);

      // 暗号化されたデータが保存される
      const savedCall = (AsyncStorage.setItem as any).mock.calls[0];
      const savedData = savedCall[1];

      // 平文が含まれていないことを確認
      expect(savedData).not.toContain('個人的な内容です');
      expect(savedData).not.toContain('user@example.com');
    });

    it('暗号化キーの安全な管理', async () => {
      // 暗号化キーの生成と保存
      const encryptionKey = await generateEncryptionKey();
      expect(encryptionKey).toBeDefined();
      expect(encryptionKey.length).toBeGreaterThan(32);

      // キーストアへの保存を確認
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@secure_encryption_key',
        expect.any(String)
      );
    });
  });

  describe('エラーハンドリング', () => {
    it('ストレージフルエラーの処理', async () => {
      // ストレージフルエラーをシミュレート
      (AsyncStorage.setItem as any).mockRejectedValueOnce(new Error('QuotaExceededError'));

      const result = await saveForLater({
        id: 'large-post',
        contentType: 'video',
        mediaUrl: 'https://example.com/large-video.mp4',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('storage full');
    });

    it('破損データの処理', async () => {
      // 破損したデータをシミュレート
      (AsyncStorage.getItem as any).mockResolvedValueOnce('corrupted-data');

      const posts = await getOfflineContent('saved');
      expect(posts).toEqual([]);

      // エラーログが記録されることを確認
      const errorLogs = await getErrorLogs();
      expect(errorLogs).toContainEqual(
        expect.objectContaining({
          type: 'data_corruption',
        })
      );
    });
  });
});

// ヘルパー関数
function initializeOfflineSync() {
  // オフライン同期サービスの初期化
  return {
    startSync: vi.fn(),
    stopSync: vi.fn(),
  };
}

async function generateEncryptionKey() {
  // 暗号化キーの生成（実際の実装では crypto API を使用）
  return 'mock-encryption-key-' + Math.random().toString(36);
}

async function getErrorLogs() {
  // エラーログの取得
  const logs = await AsyncStorage.getItem('@error_logs');
  return logs ? JSON.parse(logs) : [];
}
