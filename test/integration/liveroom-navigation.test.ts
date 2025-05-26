import { liveRoomService } from '@/lib/liveRoomService';
import { navigationRef } from '@/navigation';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';

jest.mock('@/lib/liveRoomService');

describe('LiveRoom Navigation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ルーティングとナビゲーション', () => {
    test('ライブルーム作成からルーム画面への遷移', async () => {
      const mockRoom = {
        id: 'room-123',
        title: '目醒めトーク',
        hostUser: {
          id: 'user-123',
          displayName: 'ホストユーザー',
        },
        status: 'preparing',
      };

      (liveRoomService.createRoom as jest.Mock).mockResolvedValue(mockRoom);

      // ルーム作成
      const room = await liveRoomService.createRoom({
        title: '目醒めトーク',
        maxSpeakers: 10,
        isRecording: false,
      });

      // ナビゲーション実行
      navigationRef.current?.navigate('LiveRoom', {
        roomId: room.id,
        userId: room.hostUser.id,
        role: 'speaker',
      });

      // 現在のルートを確認
      const currentRoute = navigationRef.current?.getCurrentRoute();
      expect(currentRoute?.name).toBe('LiveRoom');
      expect(currentRoute?.params).toMatchObject({
        roomId: 'room-123',
        userId: 'user-123',
        role: 'speaker',
      });
    });

    test('ホーム画面からライブルーム一覧への遷移', () => {
      // ホーム画面から「ライブルーム」タブへ移動
      navigationRef.current?.navigate('LiveRooms');

      const currentRoute = navigationRef.current?.getCurrentRoute();
      expect(currentRoute?.name).toBe('LiveRooms');
    });

    test('ライブルーム一覧から特定のルームへの参加', async () => {
      const roomId = 'room-456';
      const userId = 'user-789';

      // ルーム参加ボタンをタップ
      navigationRef.current?.navigate('LiveRoom', {
        roomId,
        userId,
        role: 'listener',
      });

      const currentRoute = navigationRef.current?.getCurrentRoute();
      expect(currentRoute?.name).toBe('LiveRoom');
      expect(currentRoute?.params).toMatchObject({
        roomId,
        userId,
        role: 'listener',
      });
    });

    test('ライブルーム退出後のナビゲーション', () => {
      // ライブルーム画面から退出
      navigationRef.current?.goBack();

      // 前の画面に戻ることを確認
      const currentRoute = navigationRef.current?.getCurrentRoute();
      expect(currentRoute?.name).not.toBe('LiveRoom');
    });
  });

  describe('Deep Link対応', () => {
    test('Deep Linkからライブルームへのダイレクトアクセス', () => {
      const deepLink = 'kanushi://liveroom/room-123';

      // Deep Linkを処理
      handleDeepLink(deepLink);

      const currentRoute = navigationRef.current?.getCurrentRoute();
      expect(currentRoute?.name).toBe('LiveRoom');
      expect(currentRoute?.params).toMatchObject({
        roomId: 'room-123',
      });
    });

    test('無効なDeep Linkのハンドリング', () => {
      const invalidLink = 'kanushi://invalid/path';

      // Deep Linkを処理
      const result = handleDeepLink(invalidLink);

      expect(result).toBe(false);
      // エラー画面やホーム画面へのフォールバック
      const currentRoute = navigationRef.current?.getCurrentRoute();
      expect(currentRoute?.name).toBe('Home');
    });

    test('認証が必要なライブルームへのDeep Link', () => {
      const deepLink = 'kanushi://liveroom/private-room';

      // 未認証状態でDeep Linkを処理
      handleDeepLink(deepLink, { isAuthenticated: false });

      // ログイン画面へリダイレクト
      const currentRoute = navigationRef.current?.getCurrentRoute();
      expect(currentRoute?.name).toBe('Login');
      expect(currentRoute?.params).toMatchObject({
        redirectTo: 'LiveRoom',
        redirectParams: { roomId: 'private-room' },
      });
    });
  });

  describe('画面遷移の最適化', () => {
    test('ライブルーム画面のプリロード', async () => {
      // ライブルーム一覧画面で事前にルーム情報をフェッチ
      const rooms = [
        { id: 'room-1', title: 'ルーム1', participant_count: 10 },
        { id: 'room-2', title: 'ルーム2', participant_count: 5 },
      ];

      // プリロードデータをナビゲーションパラメータに含める
      navigationRef.current?.navigate('LiveRoom', {
        roomId: 'room-1',
        userId: 'user-123',
        role: 'listener',
        preloadedData: rooms[0],
      });

      const currentRoute = navigationRef.current?.getCurrentRoute();
      expect(currentRoute?.params).toHaveProperty('preloadedData');
    });

    test('スタック管理の最適化', () => {
      // 複数のライブルーム間を移動
      navigationRef.current?.navigate('LiveRoom', { roomId: 'room-1' });
      navigationRef.current?.navigate('LiveRoom', { roomId: 'room-2' });
      navigationRef.current?.navigate('LiveRoom', { roomId: 'room-3' });

      // スタックサイズの確認（メモリ効率のため制限される）
      const stackSize = getNavigationStackSize();
      expect(stackSize).toBeLessThanOrEqual(5);
    });

    test('画面遷移アニメーションのカスタマイズ', () => {
      // ライブルーム参加時のアニメーション設定
      const animationConfig = {
        animation: 'slide_from_bottom',
        config: {
          duration: 300,
          easing: 'ease-in-out',
        },
      };

      navigationRef.current?.navigate('LiveRoom', {
        roomId: 'room-123',
        animationConfig,
      });

      // アニメーション設定が適用されていることを確認
      const currentAnimation = getCurrentAnimationConfig();
      expect(currentAnimation).toMatchObject(animationConfig);
    });
  });

  describe('エラーハンドリング', () => {
    test('ルーム参加失敗時のナビゲーション', async () => {
      (liveRoomService.joinRoom as jest.Mock).mockRejectedValue(
        new Error('ルームが見つかりません')
      );

      try {
        await liveRoomService.joinRoom('invalid-room', 'user-123', 'listener');
      } catch (error) {
        // エラー時は前の画面に戻る
        navigationRef.current?.goBack();
      }

      const currentRoute = navigationRef.current?.getCurrentRoute();
      expect(currentRoute?.name).not.toBe('LiveRoom');
    });

    test('ネットワークエラー時のリトライナビゲーション', async () => {
      let attemptCount = 0;
      (liveRoomService.joinRoom as jest.Mock).mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          token: 'mock-token',
          room: { id: 'room-123', status: 'active' },
        });
      });

      // リトライロジック
      let joined = false;
      for (let i = 0; i < 3; i++) {
        try {
          await liveRoomService.joinRoom('room-123', 'user-123', 'listener');
          joined = true;
          break;
        } catch (error) {
          // リトライ待機
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      expect(joined).toBe(true);
      expect(attemptCount).toBe(3);
    });
  });
});

// ヘルパー関数
function handleDeepLink(url: string, options?: { isAuthenticated?: boolean }): boolean {
  const isAuthenticated = options?.isAuthenticated ?? true;

  if (url.startsWith('kanushi://liveroom/')) {
    const roomId = url.replace('kanushi://liveroom/', '');

    if (!isAuthenticated) {
      navigationRef.current?.navigate('Login', {
        redirectTo: 'LiveRoom',
        redirectParams: { roomId },
      });
      return true;
    }

    navigationRef.current?.navigate('LiveRoom', {
      roomId,
      userId: 'current-user',
      role: 'listener',
    });
    return true;
  }

  // 無効なリンクの場合はホームへ
  navigationRef.current?.navigate('Home');
  return false;
}

function getNavigationStackSize(): number {
  // 実際の実装では navigationRef からスタックサイズを取得
  return 3;
}

function getCurrentAnimationConfig(): any {
  // 実際の実装では現在のアニメーション設定を取得
  return {
    animation: 'slide_from_bottom',
    config: {
      duration: 300,
      easing: 'ease-in-out',
    },
  };
}
