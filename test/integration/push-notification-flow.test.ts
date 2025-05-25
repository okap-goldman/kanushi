import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as Notifications from 'expo-notifications';
import { 
  registerForPushNotifications,
  sendNotification,
  handleNotificationReceived,
  handleNotificationResponse,
  updateNotificationSettings
} from '@/lib/notificationService';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';

// モックの設定
vi.mock('expo-notifications', () => ({
  getPermissionsAsync: vi.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: vi.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: vi.fn(() => Promise.resolve({ data: 'ExponentPushToken[xxx]' })),
  setNotificationHandler: vi.fn(),
  addNotificationReceivedListener: vi.fn(),
  addNotificationResponseReceivedListener: vi.fn(),
  scheduleNotificationAsync: vi.fn(() => Promise.resolve('notification-id')),
  cancelScheduledNotificationAsync: vi.fn(() => Promise.resolve()),
  getPresentedNotificationsAsync: vi.fn(() => Promise.resolve([])),
  dismissNotificationAsync: vi.fn(() => Promise.resolve()),
  setNotificationChannelAsync: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'user-1' } },
        error: null,
      })),
    },
    from: vi.fn((table: string) => {
      switch (table) {
        case 'push_tokens':
          return {
            upsert: vi.fn(() => Promise.resolve({
              data: { user_id: 'user-1', token: 'ExponentPushToken[xxx]' },
              error: null,
            })),
            delete: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          };
        case 'notifications':
          return {
            insert: vi.fn(() => Promise.resolve({
              data: {
                id: 'notif-1',
                user_id: 'user-1',
                type: 'like',
                title: 'いいねされました',
                created_at: new Date().toISOString(),
              },
              error: null,
            })),
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({
                  data: [
                    {
                      id: 'notif-1',
                      type: 'like',
                      title: 'いいねされました',
                      body: 'ユーザーがあなたの投稿にいいねしました',
                      read: false,
                      created_at: '2024-01-01T10:00:00Z',
                    },
                  ],
                  error: null,
                })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          };
        case 'notification_settings':
          return {
            upsert: vi.fn(() => Promise.resolve({
              data: {
                user_id: 'user-1',
                likes_enabled: true,
                comments_enabled: true,
              },
              error: null,
            })),
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: {
                    likes_enabled: true,
                    comments_enabled: true,
                    highlights_enabled: true,
                    follows_enabled: true,
                  },
                  error: null,
                })),
              })),
            })),
          };
        default:
          return {};
      }
    }),
  },
}));

vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: vi.fn((options) => options.ios || options.default),
  },
  Linking: {
    openURL: vi.fn(),
    openSettings: vi.fn(),
  },
}));

describe('プッシュ通知連携統合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('通知の許可と登録', () => {
    it('いいね通知の受信と処理', async () => {
      // 1. プッシュ通知の許可を取得
      const permissionResult = await registerForPushNotifications();
      expect(permissionResult.success).toBe(true);
      expect(permissionResult.token).toBe('ExponentPushToken[xxx]');

      // 2. トークンがSupabaseに保存される
      expect(supabase.from).toHaveBeenCalledWith('push_tokens');

      // 3. いいね通知を送信
      const notificationData = {
        userId: 'user-1',
        type: 'like' as const,
        title: 'いいねされました',
        body: 'テストユーザーがあなたの投稿にいいねしました',
        data: {
          postId: 'post-123',
          fromUserId: 'user-2',
        },
      };

      const sendResult = await sendNotification(notificationData);
      expect(sendResult.success).toBe(true);

      // 4. 通知がスケジュールされる
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data,
          sound: true,
          badge: 1,
        },
        trigger: null,
      });
    });

    it('通知タップで該当投稿に遷移', async () => {
      const mockNavigation = {
        navigate: vi.fn(),
      };

      // 通知レスポンスをシミュレート
      const notificationResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'comment',
                postId: 'post-456',
                commentId: 'comment-789',
              },
            },
          },
        },
      };

      // 通知タップハンドラーを実行
      await handleNotificationResponse(notificationResponse, mockNavigation);

      // 正しい画面に遷移することを確認
      expect(mockNavigation.navigate).toHaveBeenCalledWith('PostDetail', {
        postId: 'post-456',
        scrollToCommentId: 'comment-789',
      });
    });

    it('通知許可が拒否された場合の処理', async () => {
      // 許可拒否をシミュレート
      (Notifications.getPermissionsAsync as any).mockResolvedValueOnce({
        status: 'denied',
      });

      const result = await registerForPushNotifications();
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('permission denied');

      // トークンが保存されないことを確認
      expect(supabase.from).not.toHaveBeenCalledWith('push_tokens');
    });
  });

  describe('通知設定の管理', () => {
    it('通知タイプ別の設定変更', async () => {
      const settings = {
        likesEnabled: false,
        commentsEnabled: true,
        highlightsEnabled: true,
        followsEnabled: false,
      };

      const result = await updateNotificationSettings(settings);
      expect(result.success).toBe(true);

      // Supabaseに設定が保存される
      expect(supabase.from).toHaveBeenCalledWith('notification_settings');
    });

    it('通知が無効な場合は送信されない', async () => {
      // いいね通知を無効に設定
      await updateNotificationSettings({ likesEnabled: false });

      // いいね通知を送信しようとする
      const notificationData = {
        userId: 'user-1',
        type: 'like' as const,
        title: 'いいねされました',
        body: 'テスト',
      };

      const result = await sendNotification(notificationData);
      
      // 通知が送信されないことを確認
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('disabled');
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('バッジ管理', () => {
    it('未読通知数のバッジ更新', async () => {
      // 複数の未読通知を作成
      const notifications = [
        { type: 'like', read: false },
        { type: 'comment', read: false },
        { type: 'follow', read: false },
      ];

      // バッジ数を更新
      await updateBadgeCount();

      // 正しいバッジ数が設定される
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        'default',
        expect.objectContaining({
          badge: 3,
        })
      );
    });

    it('通知を既読にするとバッジが減る', async () => {
      // 通知を既読にする
      await markNotificationAsRead('notif-1');

      // Supabaseの更新を確認
      expect(supabase.from).toHaveBeenCalledWith('notifications');
      
      // バッジ数が更新される
      await updateBadgeCount();
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        'default',
        expect.objectContaining({
          badge: 0,
        })
      );
    });
  });

  describe('チャンネル設定（Android）', () => {
    it('Android用の通知チャンネル設定', async () => {
      // AndroidプラットフォームをシミュレĻト
      (Platform.OS as any) = 'android';

      await setupNotificationChannels();

      // 各チャンネルが作成される
      const expectedChannels = [
        { id: 'likes', name: 'いいね', importance: 3 },
        { id: 'comments', name: 'コメント', importance: 4 },
        { id: 'messages', name: 'メッセージ', importance: 5 },
        { id: 'follows', name: 'フォロー', importance: 3 },
      ];

      for (const channel of expectedChannels) {
        expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
          channel.id,
          expect.objectContaining({
            name: channel.name,
            importance: channel.importance,
          })
        );
      }
    });
  });

  describe('リアルタイム通知', () => {
    it('リアルタイムイベントから通知を生成', async () => {
      // Supabaseリアルタイムイベントをシミュレート
      const realtimePayload = {
        eventType: 'INSERT',
        new: {
          type: 'like',
          post_id: 'post-789',
          from_user_id: 'user-3',
          to_user_id: 'user-1',
        },
      };

      // リアルタイムハンドラーを実行
      await handleRealtimeNotification(realtimePayload);

      // 通知が生成される
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });
  });

  describe('グループ通知', () => {
    it('同じタイプの通知をグループ化', async () => {
      // 複数のいいね通知
      const likeNotifications = [
        { fromUserId: 'user-2', postId: 'post-1' },
        { fromUserId: 'user-3', postId: 'post-1' },
        { fromUserId: 'user-4', postId: 'post-1' },
      ];

      // グループ化された通知を送信
      await sendGroupedNotification('like', likeNotifications);

      // 1つのグループ化された通知が送信される
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: '3件のいいね',
          body: 'user-2さん、user-3さん、他1名があなたの投稿にいいねしました',
          data: {
            type: 'grouped_like',
            postId: 'post-1',
            count: 3,
          },
          sound: true,
          badge: 1,
        },
        trigger: null,
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('通知送信エラーの処理', async () => {
      // 通知送信エラーをシミュレート
      (Notifications.scheduleNotificationAsync as any).mockRejectedValueOnce(
        new Error('Failed to send notification')
      );

      const result = await sendNotification({
        userId: 'user-1',
        type: 'like',
        title: 'Test',
        body: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // エラーログが記録される
      expect(supabase.from).toHaveBeenCalledWith('error_logs');
    });

    it('無効なプッシュトークンの処理', async () => {
      // 無効なトークンエラーをシミュレート
      (Notifications.getExpoPushTokenAsync as any).mockRejectedValueOnce(
        new Error('Invalid push token')
      );

      const result = await registerForPushNotifications();
      
      expect(result.success).toBe(false);
      
      // 古いトークンが削除される
      expect(supabase.from).toHaveBeenCalledWith('push_tokens');
    });
  });
});

// ヘルパー関数
async function updateBadgeCount() {
  // 未読通知数を取得してバッジを更新
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', 'user-1')
    .eq('read', false);

  const unreadCount = data?.length || 0;
  
  await Notifications.setNotificationChannelAsync('default', {
    name: 'デフォルト',
    badge: unreadCount,
  });
}

async function markNotificationAsRead(notificationId: string) {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
}

async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    const channels = [
      { id: 'likes', name: 'いいね', importance: 3 },
      { id: 'comments', name: 'コメント', importance: 4 },
      { id: 'messages', name: 'メッセージ', importance: 5 },
      { id: 'follows', name: 'フォロー', importance: 3 },
    ];

    for (const channel of channels) {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        importance: channel.importance as any,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }
}

async function handleRealtimeNotification(payload: any) {
  // リアルタイムイベントから通知を生成
  if (payload.eventType === 'INSERT' && payload.new.type === 'like') {
    await sendNotification({
      userId: payload.new.to_user_id,
      type: 'like',
      title: 'いいねされました',
      body: `ユーザーがあなたの投稿にいいねしました`,
      data: {
        postId: payload.new.post_id,
        fromUserId: payload.new.from_user_id,
      },
    });
  }
}

async function sendGroupedNotification(type: string, items: any[]) {
  const count = items.length;
  let title = '';
  let body = '';

  switch (type) {
    case 'like':
      title = `${count}件のいいね`;
      const userNames = items.slice(0, 2).map(item => `${item.fromUserId}さん`).join('、');
      const othersCount = count - 2;
      body = othersCount > 0
        ? `${userNames}、他${othersCount}名があなたの投稿にいいねしました`
        : `${userNames}があなたの投稿にいいねしました`;
      break;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: {
        type: `grouped_${type}`,
        postId: items[0].postId,
        count,
      },
      sound: true,
      badge: 1,
    },
    trigger: null,
  });
}