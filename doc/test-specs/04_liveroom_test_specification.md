# ライブルーム機能テスト仕様書

## 概要
本ドキュメントは、ライブルーム機能のTDD実装のための詳細なテスト仕様書です。
API・UI・結合・E2Eの4つのテストレベルで包括的なテストケースを定義します。

## テスト環境

### 使用フレームワーク
- `jest-expo@~53.0.0`
- `@testing-library/react-native@^13`
- `@testing-library/jest-native@^6`
- `react-native-reanimated/mock`

### テスト原則
- 可能な限りモックを使用しない実装
- リアルなデータフローでのテスト
- LiveKit SDK は統合テスト用のテストサーバーを使用

## 1. APIユニットテスト

### 1.1 ライブルーム作成API

#### テストファイル: `src/lib/__tests__/liveRoomService.test.ts`

```typescript
describe('LiveRoom Service - Create Room', () => {
  const mockUser = {
    id: 'user-123',
    displayName: 'テストユーザー',
    profileImageUrl: 'https://example.com/avatar.jpg'
  };

  beforeEach(() => {
    // Supabase認証をセットアップ
    jest.clearAllMocks();
  });

  describe('createLiveRoom', () => {
    test('正常なルーム作成', async () => {
      const roomData = {
        title: '目醒めトーク',
        maxSpeakers: 10,
        isRecording: false
      };

      const result = await liveRoomService.createRoom(roomData);

      expect(result).toMatchObject({
        id: expect.any(String),
        hostUser: expect.objectContaining({
          id: mockUser.id,
          displayName: mockUser.displayName
        }),
        title: roomData.title,
        status: 'preparing',
        maxSpeakers: 10,
        isRecording: false,
        participantCount: 0,
        livekitRoomName: expect.any(String),
        createdAt: expect.any(String)
      });
    });

    test('必須フィールド不足でエラー', async () => {
      const invalidData = {
        maxSpeakers: 10
        // title がない
      };

      await expect(liveRoomService.createRoom(invalidData))
        .rejects.toThrow('タイトルは必須です');
    });

    test('タイトルが空文字でエラー', async () => {
      const invalidData = {
        title: '',
        maxSpeakers: 10
      };

      await expect(liveRoomService.createRoom(invalidData))
        .rejects.toThrow('タイトルは必須です');
    });

    test('最大登壇者数が範囲外でエラー', async () => {
      const invalidData = {
        title: 'テストルーム',
        maxSpeakers: 11 // 上限10を超過
      };

      await expect(liveRoomService.createRoom(invalidData))
        .rejects.toThrow('最大登壇者数は1-10の範囲で入力してください');
    });

    test('認証されていない場合はエラー', async () => {
      // 認証なしでのテスト
      supabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(liveRoomService.createRoom({
        title: 'テストルーム',
        maxSpeakers: 5
      })).rejects.toThrow('認証が必要です');
    });
  });
});
```

### 1.2 ライブ開始・終了API

```typescript
describe('LiveRoom Service - Start/End Room', () => {
  const mockRoom = {
    id: 'room-123',
    hostUserId: 'user-123',
    title: 'テストルーム',
    status: 'preparing'
  };

  describe('startLiveRoom', () => {
    test('正常なライブ開始', async () => {
      const result = await liveRoomService.startRoom(mockRoom.id);

      expect(result).toMatchObject({
        id: mockRoom.id,
        status: 'live',
        startedAt: expect.any(String)
      });

      // LiveKitルーム作成確認
      expect(liveKitService.createRoom).toHaveBeenCalledWith(
        expect.stringContaining('room-123')
      );
    });

    test('ホスト以外が開始しようとしてエラー', async () => {
      // 別ユーザーでテスト
      const otherUser = { id: 'user-456' };
      supabase.auth.getUser.mockResolvedValue({ data: { user: otherUser } });

      await expect(liveRoomService.startRoom(mockRoom.id))
        .rejects.toThrow('ホストのみがライブを開始できます');
    });

    test('存在しないルームでエラー', async () => {
      await expect(liveRoomService.startRoom('nonexistent-room'))
        .rejects.toThrow('ルームが見つかりません');
    });
  });

  describe('endLiveRoom', () => {
    const liveRoom = { ...mockRoom, status: 'live' };

    test('録音なしでライブ終了', async () => {
      const result = await liveRoomService.endRoom(liveRoom.id, {
        createPost: false
      });

      expect(result).toMatchObject({
        id: liveRoom.id,
        status: 'ended',
        endedAt: expect.any(String)
      });

      // 投稿が作成されていないことを確認
      expect(postService.createFromRecording).not.toHaveBeenCalled();
    });

    test('録音ありでライブ終了', async () => {
      const result = await liveRoomService.endRoom(liveRoom.id, {
        createPost: true
      });

      expect(result).toMatchObject({
        id: liveRoom.id,
        status: 'ended',
        endedAt: expect.any(String),
        postId: expect.any(String)
      });

      // 投稿作成確認
      expect(postService.createFromRecording).toHaveBeenCalledWith({
        roomId: liveRoom.id,
        title: liveRoom.title,
        audioUrl: expect.any(String),
        waveformUrl: expect.any(String),
        durationSeconds: expect.any(Number)
      });
    });
  });
});
```

### 1.3 ルーム参加・退出API

```typescript
describe('LiveRoom Service - Join/Leave', () => {
  const mockRoom = {
    id: 'room-123',
    status: 'live',
    maxSpeakers: 10
  };

  describe('joinRoom', () => {
    test('リスナーとして正常参加', async () => {
      const result = await liveRoomService.joinRoom(mockRoom.id);

      expect(result).toMatchObject({
        token: expect.any(String),
        url: expect.any(String)
      });

      // LiveKitトークン生成確認
      expect(liveKitService.generateToken).toHaveBeenCalledWith({
        roomName: expect.any(String),
        identity: expect.any(String),
        canPublish: false,
        canSubscribe: true
      });

      // 参加者記録確認
      expect(supabase.from('room_participants').insert).toHaveBeenCalledWith({
        room_id: mockRoom.id,
        user_id: expect.any(String),
        role: 'listener',
        joined_at: expect.any(String)
      });
    });

    test('終了済みルームに参加しようとしてエラー', async () => {
      const endedRoom = { ...mockRoom, status: 'ended' };

      await expect(liveRoomService.joinRoom(endedRoom.id))
        .rejects.toThrow('このルームは終了しています');
    });

    test('存在しないルームでエラー', async () => {
      await expect(liveRoomService.joinRoom('nonexistent-room'))
        .rejects.toThrow('ルームが見つかりません');
    });
  });

  describe('leaveRoom', () => {
    test('正常な退出', async () => {
      await liveRoomService.leaveRoom(mockRoom.id);

      // 参加者記録更新確認
      expect(supabase.from('room_participants').update).toHaveBeenCalledWith({
        left_at: expect.any(String)
      });
    });
  });
});
```

### 1.4 登壇リクエスト・承認API

```typescript
describe('LiveRoom Service - Speaker Management', () => {
  const mockRoom = {
    id: 'room-123',
    hostUserId: 'host-123',
    status: 'live'
  };

  describe('requestSpeaker', () => {
    test('正常な登壇リクエスト', async () => {
      await liveRoomService.requestSpeaker(mockRoom.id);

      // リクエスト記録確認
      expect(supabase.from('pending_speakers').insert).toHaveBeenCalledWith({
        room_id: mockRoom.id,
        user_id: expect.any(String),
        requested_at: expect.any(String)
      });

      // ホストへの通知確認
      expect(notificationService.send).toHaveBeenCalledWith({
        userId: mockRoom.hostUserId,
        title: '登壇リクエスト',
        body: expect.stringContaining('登壇リクエストがあります'),
        type: 'speaker_request'
      });
    });

    test('既にリクエスト済みでエラー', async () => {
      // 既存リクエストをモック
      supabase.from('pending_speakers').select.mockResolvedValue({
        data: [{ id: 'request-123' }]
      });

      await expect(liveRoomService.requestSpeaker(mockRoom.id))
        .rejects.toThrow('既に登壇リクエストを送信済みです');
    });
  });

  describe('approveSpeaker', () => {
    test('正常な登壇承認', async () => {
      const userId = 'user-456';
      const result = await liveRoomService.approveSpeaker(mockRoom.id, userId);

      // 参加者役割更新確認
      expect(supabase.from('room_participants').update).toHaveBeenCalledWith({
        role: 'speaker'
      });

      // 新しいトークン生成確認
      expect(liveKitService.generateToken).toHaveBeenCalledWith({
        roomName: expect.any(String),
        identity: userId,
        canPublish: true,
        canSubscribe: true
      });

      // 承認通知確認
      expect(notificationService.send).toHaveBeenCalledWith({
        userId,
        title: '登壇承認',
        body: '登壇が承認されました',
        type: 'speaker_approved'
      });
    });

    test('ホスト以外が承認しようとしてエラー', async () => {
      const otherUser = { id: 'user-789' };
      supabase.auth.getUser.mockResolvedValue({ data: { user: otherUser } });

      await expect(liveRoomService.approveSpeaker(mockRoom.id, 'user-456'))
        .rejects.toThrow('ホストのみが登壇を承認できます');
    });
  });
});
```

### 1.5 ルームチャットAPI

```typescript
describe('LiveRoom Service - Chat', () => {
  const mockRoom = { id: 'room-123', status: 'live' };

  describe('sendChatMessage', () => {
    test('正常なメッセージ送信', async () => {
      const messageData = {
        content: 'こんにちは！',
        sharedUrl: null
      };

      const result = await liveRoomService.sendChatMessage(mockRoom.id, messageData);

      expect(result).toMatchObject({
        id: expect.any(String),
        user: expect.objectContaining({
          id: expect.any(String),
          displayName: expect.any(String)
        }),
        content: messageData.content,
        isPinned: false,
        createdAt: expect.any(String)
      });

      // WebSocketブロードキャスト確認
      expect(websocketService.broadcast).toHaveBeenCalledWith(
        `room:${mockRoom.id}`,
        'chat_message',
        expect.objectContaining({
          content: messageData.content
        })
      );
    });

    test('URL共有付きメッセージ', async () => {
      const messageData = {
        content: 'これ見て！',
        sharedUrl: 'https://example.com/article'
      };

      const result = await liveRoomService.sendChatMessage(mockRoom.id, messageData);

      expect(result).toMatchObject({
        content: messageData.content,
        sharedUrl: messageData.sharedUrl
      });
    });

    test('空のメッセージでエラー', async () => {
      await expect(liveRoomService.sendChatMessage(mockRoom.id, {
        content: ''
      })).rejects.toThrow('メッセージ内容は必須です');
    });

    test('レート制限エラー', async () => {
      // 10件のメッセージを短時間で送信
      const promises = Array(11).fill(null).map((_, i) => 
        liveRoomService.sendChatMessage(mockRoom.id, {
          content: `メッセージ${i}`
        })
      );

      await expect(Promise.all(promises))
        .rejects.toThrow('送信頻度制限に達しました');
    });
  });

  describe('pinChatMessage', () => {
    test('ホストによる正常なピン留め', async () => {
      const chatId = 'chat-123';
      
      await liveRoomService.pinChatMessage(mockRoom.id, chatId);

      // ピン留め更新確認
      expect(supabase.from('room_chat').update).toHaveBeenCalledWith({
        is_pinned: true
      });

      // 既存ピン解除確認
      expect(supabase.from('room_chat').update).toHaveBeenCalledWith({
        is_pinned: false
      });

      // ブロードキャスト確認
      expect(websocketService.broadcast).toHaveBeenCalledWith(
        `room:${mockRoom.id}`,
        'message_pinned',
        expect.objectContaining({ chatId })
      );
    });

    test('ホスト以外がピン留めしようとしてエラー', async () => {
      const listenerUser = { id: 'user-456' };
      supabase.auth.getUser.mockResolvedValue({ data: { user: listenerUser } });

      await expect(liveRoomService.pinChatMessage(mockRoom.id, 'chat-123'))
        .rejects.toThrow('ホストのみがメッセージをピン留めできます');
    });
  });
});
```

### 1.6 ギフト送信API

```typescript
describe('LiveRoom Service - Gift', () => {
  const mockRoom = { id: 'room-123', hostUserId: 'host-123' };

  describe('sendGift', () => {
    test('正常なギフト送信', async () => {
      const giftData = {
        amount: 600,
        message: '応援してます！'
      };

      const result = await liveRoomService.sendGift(mockRoom.id, giftData);

      expect(result).toMatchObject({
        id: expect.any(String),
        sender: expect.objectContaining({
          id: expect.any(String)
        }),
        amount: 600,
        message: '応援してます！',
        createdAt: expect.any(String)
      });

      // Stores.jp決済リクエスト確認
      expect(storesService.createPayment).toHaveBeenCalledWith({
        amount: 600,
        metadata: {
          giftId: expect.any(String),
          roomId: mockRoom.id
        }
      });
    });

    test('無効な金額でエラー', async () => {
      await expect(liveRoomService.sendGift(mockRoom.id, {
        amount: 500, // プリセット以外
        message: 'テスト'
      })).rejects.toThrow('金額は300、600、1200円のいずれかを選択してください');
    });

    test('自分自身にギフト送信でエラー', async () => {
      const hostUser = { id: 'host-123' };
      supabase.auth.getUser.mockResolvedValue({ data: { user: hostUser } });

      await expect(liveRoomService.sendGift(mockRoom.id, {
        amount: 300,
        message: 'テスト'
      })).rejects.toThrow('自分自身にギフトを送ることはできません');
    });
  });
});
```

## 2. UIユニットテスト

### 2.1 ライブルーム作成ダイアログ

#### テストファイル: `src/components/__tests__/CreateLiveRoomDialog.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { CreateLiveRoomDialog } from '../CreateLiveRoomDialog';
import { liveRoomService } from '../../lib/liveRoomService';

jest.mock('../../lib/liveRoomService');

describe('CreateLiveRoomDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('初期表示が正しい', () => {
    render(
      <CreateLiveRoomDialog
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('ライブルーム作成')).toBeTruthy();
    expect(screen.getByPlaceholderText('ルームタイトル')).toBeTruthy();
    expect(screen.getByText('最大登壇者数: 10')).toBeTruthy();
    expect(screen.getByText('録音する')).toBeTruthy();
  });

  test('タイトル入力でステートが更新される', () => {
    render(
      <CreateLiveRoomDialog
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const titleInput = screen.getByPlaceholderText('ルームタイトル');
    fireEvent.changeText(titleInput, '目醒めトーク');

    expect(titleInput.props.value).toBe('目醒めトーク');
  });

  test('最大登壇者数の調整', () => {
    render(
      <CreateLiveRoomDialog
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const slider = screen.getByTestId('max-speakers-slider');
    fireEvent(slider, 'onValueChange', 5);

    expect(screen.getByText('最大登壇者数: 5')).toBeTruthy();
  });

  test('録音設定の切り替え', () => {
    render(
      <CreateLiveRoomDialog
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const recordingSwitch = screen.getByTestId('recording-switch');
    fireEvent(recordingSwitch, 'onValueChange', true);

    expect(recordingSwitch.props.value).toBe(true);
  });

  test('正常なルーム作成', async () => {
    const mockRoom = {
      id: 'room-123',
      title: '目醒めトーク',
      status: 'preparing'
    };

    liveRoomService.createRoom.mockResolvedValue(mockRoom);

    render(
      <CreateLiveRoomDialog
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const titleInput = screen.getByPlaceholderText('ルームタイトル');
    fireEvent.changeText(titleInput, '目醒めトーク');

    const createButton = screen.getByText('作成');
    fireEvent.press(createButton);

    await waitFor(() => {
      expect(liveRoomService.createRoom).toHaveBeenCalledWith({
        title: '目醒めトーク',
        maxSpeakers: 10,
        isRecording: false
      });
    });

    expect(mockOnSuccess).toHaveBeenCalledWith(mockRoom);
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('タイトル未入力でエラー表示', async () => {
    render(
      <CreateLiveRoomDialog
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const createButton = screen.getByText('作成');
    fireEvent.press(createButton);

    expect(screen.getByText('タイトルを入力してください')).toBeTruthy();
    expect(liveRoomService.createRoom).not.toHaveBeenCalled();
  });

  test('作成中の読み込み状態', async () => {
    liveRoomService.createRoom.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(
      <CreateLiveRoomDialog
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const titleInput = screen.getByPlaceholderText('ルームタイトル');
    fireEvent.changeText(titleInput, '目醒めトーク');

    const createButton = screen.getByText('作成');
    fireEvent.press(createButton);

    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
    expect(createButton).toBeDisabled();
  });

  test('キャンセルボタン', () => {
    render(
      <CreateLiveRoomDialog
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByText('キャンセル');
    fireEvent.press(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
```

### 2.2 ライブルーム画面メイン

#### テストファイル: `src/screens/__tests__/LiveRoomScreen.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { LiveRoomScreen } from '../LiveRoomScreen';
import { liveRoomService } from '../../lib/liveRoomService';
import { useRoute } from '@react-navigation/native';

jest.mock('../../lib/liveRoomService');
jest.mock('@react-navigation/native');

describe('LiveRoomScreen', () => {
  const mockRoom = {
    id: 'room-123',
    hostUser: {
      id: 'host-123',
      displayName: 'ホストユーザー'
    },
    title: '目醒めトーク',
    status: 'live',
    participantCount: 5,
    maxSpeakers: 10
  };

  beforeEach(() => {
    useRoute.mockReturnValue({
      params: { roomId: mockRoom.id }
    });
    liveRoomService.getRoomDetails.mockResolvedValue(mockRoom);
    jest.clearAllMocks();
  });

  test('ルーム情報の初期表示', async () => {
    render(<LiveRoomScreen />);

    await waitFor(() => {
      expect(screen.getByText('目醒めトーク')).toBeTruthy();
      expect(screen.getByText('ホストユーザー')).toBeTruthy();
      expect(screen.getByText('5人が参加中')).toBeTruthy();
    });
  });

  test('参加ボタンでルーム参加', async () => {
    const mockJoinResult = {
      token: 'livekit-token',
      url: 'wss://livekit.example.com'
    };
    liveRoomService.joinRoom.mockResolvedValue(mockJoinResult);

    render(<LiveRoomScreen />);

    await waitFor(() => {
      expect(screen.getByText('参加')).toBeTruthy();
    });

    const joinButton = screen.getByText('参加');
    fireEvent.press(joinButton);

    await waitFor(() => {
      expect(liveRoomService.joinRoom).toHaveBeenCalledWith(mockRoom.id);
    });

    // 参加後の状態変化を確認
    expect(screen.getByText('退出')).toBeTruthy();
  });

  test('登壇リクエストボタン', async () => {
    render(<LiveRoomScreen />);

    // まず参加
    const joinButton = screen.getByText('参加');
    fireEvent.press(joinButton);

    await waitFor(() => {
      expect(screen.getByText('登壇リクエスト')).toBeTruthy();
    });

    const requestButton = screen.getByText('登壇リクエスト');
    fireEvent.press(requestButton);

    await waitFor(() => {
      expect(liveRoomService.requestSpeaker).toHaveBeenCalledWith(mockRoom.id);
    });

    expect(screen.getByText('リクエスト送信済み')).toBeTruthy();
  });

  test('ホストの場合は配信開始ボタン表示', async () => {
    const hostRoom = {
      ...mockRoom,
      hostUser: {
        id: 'current-user-id',
        displayName: '現在のユーザー'
      },
      status: 'preparing'
    };
    liveRoomService.getRoomDetails.mockResolvedValue(hostRoom);

    render(<LiveRoomScreen />);

    await waitFor(() => {
      expect(screen.getByText('配信開始')).toBeTruthy();
    });
  });

  test('配信開始ボタンの動作', async () => {
    const hostRoom = {
      ...mockRoom,
      hostUser: {
        id: 'current-user-id',
        displayName: '現在のユーザー'
      },
      status: 'preparing'
    };
    liveRoomService.getRoomDetails.mockResolvedValue(hostRoom);

    render(<LiveRoomScreen />);

    await waitFor(() => {
      expect(screen.getByText('配信開始')).toBeTruthy();
    });

    const startButton = screen.getByText('配信開始');
    fireEvent.press(startButton);

    await waitFor(() => {
      expect(liveRoomService.startRoom).toHaveBeenCalledWith(hostRoom.id);
    });
  });

  test('エラー状態の表示', async () => {
    liveRoomService.getRoomDetails.mockRejectedValue(
      new Error('ルームが見つかりません')
    );

    render(<LiveRoomScreen />);

    await waitFor(() => {
      expect(screen.getByText('ルームが見つかりません')).toBeTruthy();
    });
  });

  test('ローディング状態の表示', () => {
    liveRoomService.getRoomDetails.mockImplementation(
      () => new Promise(() => {}) // 永続的にpending
    );

    render(<LiveRoomScreen />);

    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
  });
});
```

### 2.3 チャットコンポーネント

#### テストファイル: `src/components/__tests__/LiveRoomChat.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { LiveRoomChat } from '../LiveRoomChat';
import { liveRoomService } from '../../lib/liveRoomService';

jest.mock('../../lib/liveRoomService');

describe('LiveRoomChat', () => {
  const mockMessages = [
    {
      id: 'msg-1',
      user: { id: 'user-1', displayName: 'ユーザー1' },
      content: 'こんにちは！',
      createdAt: '2024-01-01T10:00:00Z',
      isPinned: false
    },
    {
      id: 'msg-2',
      user: { id: 'user-2', displayName: 'ユーザー2' },
      content: 'よろしくお願いします',
      createdAt: '2024-01-01T10:01:00Z',
      isPinned: true
    }
  ];

  beforeEach(() => {
    liveRoomService.getChatMessages.mockResolvedValue(mockMessages);
    jest.clearAllMocks();
  });

  test('チャットメッセージの表示', async () => {
    render(<LiveRoomChat roomId="room-123" />);

    await waitFor(() => {
      expect(screen.getByText('こんにちは！')).toBeTruthy();
      expect(screen.getByText('よろしくお願いします')).toBeTruthy();
      expect(screen.getByText('ユーザー1')).toBeTruthy();
      expect(screen.getByText('ユーザー2')).toBeTruthy();
    });
  });

  test('ピン留めメッセージの表示', async () => {
    render(<LiveRoomChat roomId="room-123" />);

    await waitFor(() => {
      const pinnedMessage = screen.getByTestId('pinned-message');
      expect(pinnedMessage).toBeTruthy();
    });
  });

  test('メッセージ送信', async () => {
    render(<LiveRoomChat roomId="room-123" />);

    const input = screen.getByPlaceholderText('メッセージを入力...');
    const sendButton = screen.getByTestId('send-button');

    fireEvent.changeText(input, '新しいメッセージ');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(liveRoomService.sendChatMessage).toHaveBeenCalledWith(
        'room-123',
        { content: '新しいメッセージ' }
      );
    });

    // 入力フィールドがクリアされることを確認
    expect(input.props.value).toBe('');
  });

  test('空メッセージは送信されない', () => {
    render(<LiveRoomChat roomId="room-123" />);

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(liveRoomService.sendChatMessage).not.toHaveBeenCalled();
  });

  test('長いメッセージの折り返し表示', async () => {
    const longMessage = {
      id: 'msg-long',
      user: { id: 'user-1', displayName: 'ユーザー1' },
      content: 'これは非常に長いメッセージです。'.repeat(10),
      createdAt: '2024-01-01T10:00:00Z',
      isPinned: false
    };

    liveRoomService.getChatMessages.mockResolvedValue([longMessage]);

    render(<LiveRoomChat roomId="room-123" />);

    await waitFor(() => {
      const messageText = screen.getByText(longMessage.content);
      expect(messageText).toBeTruthy();
    });
  });

  test('URL自動検出とリンク化', async () => {
    const urlMessage = {
      id: 'msg-url',
      user: { id: 'user-1', displayName: 'ユーザー1' },
      content: 'チェックしてみて https://example.com',
      sharedUrl: 'https://example.com',
      createdAt: '2024-01-01T10:00:00Z',
      isPinned: false
    };

    liveRoomService.getChatMessages.mockResolvedValue([urlMessage]);

    render(<LiveRoomChat roomId="room-123" />);

    await waitFor(() => {
      expect(screen.getByText('https://example.com')).toBeTruthy();
    });
  });

  test('メッセージ長押しでメニュー表示（ホスト権限）', async () => {
    render(<LiveRoomChat roomId="room-123" isHost={true} />);

    await waitFor(() => {
      const message = screen.getByText('こんにちは！');
      fireEvent(message, 'onLongPress');
    });

    expect(screen.getByText('ピン留め')).toBeTruthy();
  });

  test('リアルタイムメッセージ受信', async () => {
    const { rerender } = render(<LiveRoomChat roomId="room-123" />);

    // 新しいメッセージを追加
    const newMessage = {
      id: 'msg-new',
      user: { id: 'user-3', displayName: 'ユーザー3' },
      content: 'リアルタイムメッセージ',
      createdAt: '2024-01-01T10:02:00Z',
      isPinned: false
    };

    // WebSocketメッセージをシミュレート
    const updatedMessages = [...mockMessages, newMessage];
    liveRoomService.getChatMessages.mockResolvedValue(updatedMessages);

    rerender(<LiveRoomChat roomId="room-123" />);

    await waitFor(() => {
      expect(screen.getByText('リアルタイムメッセージ')).toBeTruthy();
    });
  });
});
```

### 2.4 参加者リストコンポーネント

#### テストファイル: `src/components/__tests__/LiveRoomParticipants.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { LiveRoomParticipants } from '../LiveRoomParticipants';
import { liveRoomService } from '../../lib/liveRoomService';

jest.mock('../../lib/liveRoomService');

describe('LiveRoomParticipants', () => {
  const mockParticipants = [
    {
      id: 'part-1',
      user: {
        id: 'host-123',
        displayName: 'ホストユーザー',
        profileImageUrl: 'https://example.com/host.jpg'
      },
      role: 'host',
      joinedAt: '2024-01-01T10:00:00Z'
    },
    {
      id: 'part-2',
      user: {
        id: 'speaker-456',
        displayName: 'スピーカー1',
        profileImageUrl: 'https://example.com/speaker.jpg'
      },
      role: 'speaker',
      joinedAt: '2024-01-01T10:01:00Z'
    },
    {
      id: 'part-3',
      user: {
        id: 'listener-789',
        displayName: 'リスナー1'
      },
      role: 'listener',
      joinedAt: '2024-01-01T10:02:00Z'
    }
  ];

  beforeEach(() => {
    liveRoomService.getParticipants.mockResolvedValue(mockParticipants);
    jest.clearAllMocks();
  });

  test('参加者の表示', async () => {
    render(<LiveRoomParticipants roomId="room-123" />);

    await waitFor(() => {
      expect(screen.getByText('ホストユーザー')).toBeTruthy();
      expect(screen.getByText('スピーカー1')).toBeTruthy();
      expect(screen.getByText('リスナー1')).toBeTruthy();
    });
  });

  test('役割別の表示順序', async () => {
    render(<LiveRoomParticipants roomId="room-123" />);

    await waitFor(() => {
      const participants = screen.getAllByTestId('participant-item');
      
      // ホスト → スピーカー → リスナーの順番
      expect(participants[0]).toHaveTextContent('ホストユーザー');
      expect(participants[1]).toHaveTextContent('スピーカー1');
      expect(participants[2]).toHaveTextContent('リスナー1');
    });
  });

  test('役割アイコンの表示', async () => {
    render(<LiveRoomParticipants roomId="room-123" />);

    await waitFor(() => {
      expect(screen.getByTestId('host-icon')).toBeTruthy();
      expect(screen.getByTestId('speaker-icon')).toBeTruthy();
    });
  });

  test('プロフィール画像の表示', async () => {
    render(<LiveRoomParticipants roomId="room-123" />);

    await waitFor(() => {
      const hostAvatar = screen.getByTestId('avatar-host-123');
      const speakerAvatar = screen.getByTestId('avatar-speaker-456');
      
      expect(hostAvatar.props.source.uri).toBe('https://example.com/host.jpg');
      expect(speakerAvatar.props.source.uri).toBe('https://example.com/speaker.jpg');
    });
  });

  test('参加者数のカウント表示', async () => {
    render(<LiveRoomParticipants roomId="room-123" showCount={true} />);

    await waitFor(() => {
      expect(screen.getByText('3人が参加中')).toBeTruthy();
    });
  });

  test('空の参加者リスト', async () => {
    liveRoomService.getParticipants.mockResolvedValue([]);

    render(<LiveRoomParticipants roomId="room-123" />);

    await waitFor(() => {
      expect(screen.getByText('参加者がいません')).toBeTruthy();
    });
  });

  test('参加者タップでプロフィール表示', async () => {
    const mockOnUserPress = jest.fn();

    render(
      <LiveRoomParticipants 
        roomId="room-123" 
        onUserPress={mockOnUserPress}
      />
    );

    await waitFor(() => {
      const participant = screen.getByText('スピーカー1');
      fireEvent.press(participant);
    });

    expect(mockOnUserPress).toHaveBeenCalledWith({
      id: 'speaker-456',
      displayName: 'スピーカー1',
      profileImageUrl: 'https://example.com/speaker.jpg'
    });
  });

  test('リアルタイム参加者更新', async () => {
    const { rerender } = render(<LiveRoomParticipants roomId="room-123" />);

    // 新しい参加者を追加
    const newParticipant = {
      id: 'part-4',
      user: {
        id: 'listener-101',
        displayName: 'リスナー2'
      },
      role: 'listener',
      joinedAt: '2024-01-01T10:03:00Z'
    };

    const updatedParticipants = [...mockParticipants, newParticipant];
    liveRoomService.getParticipants.mockResolvedValue(updatedParticipants);

    rerender(<LiveRoomParticipants roomId="room-123" />);

    await waitFor(() => {
      expect(screen.getByText('リスナー2')).toBeTruthy();
    });
  });
});
```

## 3. 結合テスト

### 3.1 WebRTC接続フロー

#### テストファイル: `src/__tests__/integration/webrtc-flow.test.ts`

```typescript
import { liveRoomService } from '../../lib/liveRoomService';
import { liveKitService } from '../../lib/liveKitService';

describe('WebRTC Connection Flow Integration', () => {
  let testRoom: any;
  let hostUser: any;
  let listenerUser: any;

  beforeEach(async () => {
    // テスト環境のセットアップ
    hostUser = await setupTestUser('host');
    listenerUser = await setupTestUser('listener');
    
    // ホストでルーム作成
    testRoom = await liveRoomService.createRoom({
      title: 'WebRTC テストルーム',
      maxSpeakers: 10,
      isRecording: false
    });
  });

  afterEach(async () => {
    // テスト環境のクリーンアップ
    if (testRoom) {
      await liveRoomService.endRoom(testRoom.id, { createPost: false });
    }
    await cleanupTestUsers([hostUser, listenerUser]);
  });

  test('ホストの配信開始から接続確立まで', async () => {
    // 1. ライブ開始
    const startResult = await liveRoomService.startRoom(testRoom.id);
    expect(startResult.status).toBe('live');

    // 2. ホストの接続
    const hostJoin = await liveRoomService.joinRoom(testRoom.id);
    expect(hostJoin).toMatchObject({
      token: expect.any(String),
      url: expect.any(String)
    });

    // 3. LiveKit接続確立
    const hostConnection = await liveKitService.connect(
      hostJoin.url,
      hostJoin.token
    );
    expect(hostConnection.isConnected).toBe(true);

    // 4. 音声ストリーム開始
    await liveKitService.publishAudio(hostConnection);
    
    // 5. 接続状態確認
    const connectionState = await liveKitService.getConnectionState(hostConnection);
    expect(connectionState.canPublish).toBe(true);
    expect(connectionState.canSubscribe).toBe(true);
  }, 30000);

  test('リスナーの参加と音声受信', async () => {
    // 前提: ホストが配信開始済み
    await liveRoomService.startRoom(testRoom.id);
    const hostJoin = await liveRoomService.joinRoom(testRoom.id);
    const hostConnection = await liveKitService.connect(
      hostJoin.url,
      hostJoin.token
    );
    await liveKitService.publishAudio(hostConnection);

    // 1. リスナー参加
    const listenerJoin = await liveRoomService.joinRoom(testRoom.id);
    expect(listenerJoin).toMatchObject({
      token: expect.any(String),
      url: expect.any(String)
    });

    // 2. リスナー接続
    const listenerConnection = await liveKitService.connect(
      listenerJoin.url,
      listenerJoin.token
    );
    expect(listenerConnection.isConnected).toBe(true);

    // 3. 音声受信確認
    const audioTracks = await liveKitService.getAudioTracks(listenerConnection);
    expect(audioTracks.length).toBeGreaterThan(0);

    // 4. リスナー権限確認
    const listenerState = await liveKitService.getConnectionState(listenerConnection);
    expect(listenerState.canPublish).toBe(false);
    expect(listenerState.canSubscribe).toBe(true);
  }, 30000);

  test('登壇昇格フロー', async () => {
    // 前提: ホスト配信中、リスナー参加済み
    await liveRoomService.startRoom(testRoom.id);
    
    const hostJoin = await liveRoomService.joinRoom(testRoom.id);
    const hostConnection = await liveKitService.connect(hostJoin.url, hostJoin.token);
    
    const listenerJoin = await liveRoomService.joinRoom(testRoom.id);
    const listenerConnection = await liveKitService.connect(
      listenerJoin.url,
      listenerJoin.token
    );

    // 1. 登壇リクエスト
    await liveRoomService.requestSpeaker(testRoom.id);

    // 2. ホストが承認
    await liveRoomService.approveSpeaker(testRoom.id, listenerUser.id);

    // 3. 新しいトークンで再接続
    const speakerJoin = await liveRoomService.joinRoom(testRoom.id);
    await liveKitService.disconnect(listenerConnection);
    
    const speakerConnection = await liveKitService.connect(
      speakerJoin.url,
      speakerJoin.token
    );

    // 4. スピーカー権限確認
    const speakerState = await liveKitService.getConnectionState(speakerConnection);
    expect(speakerState.canPublish).toBe(true);
    expect(speakerState.canSubscribe).toBe(true);

    // 5. 音声送信開始
    await liveKitService.publishAudio(speakerConnection);
    
    // 6. ホスト側で新しい音声トラック受信確認
    const hostAudioTracks = await liveKitService.getAudioTracks(hostConnection);
    expect(hostAudioTracks.length).toBe(2); // ホスト自身 + スピーカー
  }, 45000);

  test('接続断線時の再接続', async () => {
    await liveRoomService.startRoom(testRoom.id);
    const hostJoin = await liveRoomService.joinRoom(testRoom.id);
    let hostConnection = await liveKitService.connect(hostJoin.url, hostJoin.token);

    // 1. 意図的に接続を切断
    await liveKitService.disconnect(hostConnection);
    expect(hostConnection.isConnected).toBe(false);

    // 2. 再接続試行
    hostConnection = await liveKitService.connect(hostJoin.url, hostJoin.token);
    expect(hostConnection.isConnected).toBe(true);

    // 3. 機能復旧確認
    await liveKitService.publishAudio(hostConnection);
    const connectionState = await liveKitService.getConnectionState(hostConnection);
    expect(connectionState.canPublish).toBe(true);
  }, 30000);
});
```

### 3.2 リアルタイムチャット統合

#### テストファイル: `src/__tests__/integration/realtime-chat.test.ts`

```typescript
import { liveRoomService } from '../../lib/liveRoomService';
import { websocketService } from '../../lib/websocketService';

describe('Realtime Chat Integration', () => {
  let testRoom: any;
  let hostUser: any;
  let listenerUser: any;

  beforeEach(async () => {
    hostUser = await setupTestUser('host');
    listenerUser = await setupTestUser('listener');
    
    testRoom = await liveRoomService.createRoom({
      title: 'チャットテストルーム',
      maxSpeakers: 10,
      isRecording: false
    });

    await liveRoomService.startRoom(testRoom.id);
  });

  afterEach(async () => {
    await liveRoomService.endRoom(testRoom.id, { createPost: false });
    await cleanupTestUsers([hostUser, listenerUser]);
  });

  test('リアルタイムメッセージ配信', async () => {
    const messages: any[] = [];
    
    // WebSocketリスナー設定
    const unsubscribe = websocketService.subscribe(
      `room:${testRoom.id}`,
      'chat_message',
      (message) => messages.push(message)
    );

    // 1. ホストがメッセージ送信
    const hostMessage = await liveRoomService.sendChatMessage(testRoom.id, {
      content: 'ホストからのメッセージ'
    });

    // 2. リアルタイム配信確認
    await waitFor(() => {
      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({
        content: 'ホストからのメッセージ',
        user: expect.objectContaining({
          id: hostUser.id
        })
      });
    });

    // 3. リスナーがメッセージ送信
    // 別ユーザーでの認証切り替え
    await authenticateAs(listenerUser);
    const listenerMessage = await liveRoomService.sendChatMessage(testRoom.id, {
      content: 'リスナーからの返信'
    });

    // 4. 2つ目のメッセージ配信確認
    await waitFor(() => {
      expect(messages).toHaveLength(2);
      expect(messages[1]).toMatchObject({
        content: 'リスナーからの返信',
        user: expect.objectContaining({
          id: listenerUser.id
        })
      });
    });

    unsubscribe();
  }, 15000);

  test('ピン留めメッセージのリアルタイム更新', async () => {
    const pinUpdates: any[] = [];
    
    const unsubscribe = websocketService.subscribe(
      `room:${testRoom.id}`,
      'message_pinned',
      (update) => pinUpdates.push(update)
    );

    // 1. メッセージ送信
    const message = await liveRoomService.sendChatMessage(testRoom.id, {
      content: 'ピン留め対象メッセージ'
    });

    // 2. ピン留め実行
    await liveRoomService.pinChatMessage(testRoom.id, message.id);

    // 3. ピン留め通知確認
    await waitFor(() => {
      expect(pinUpdates).toHaveLength(1);
      expect(pinUpdates[0]).toMatchObject({
        chatId: message.id,
        isPinned: true
      });
    });

    unsubscribe();
  }, 10000);

  test('URL共有時のプレビュー表示', async () => {
    const messageWithUrl = await liveRoomService.sendChatMessage(testRoom.id, {
      content: 'チェックしてください',
      sharedUrl: 'https://example.com/article'
    });

    expect(messageWithUrl).toMatchObject({
      content: 'チェックしてください',
      sharedUrl: 'https://example.com/article'
    });

    // URLプレビュー取得確認
    const chatHistory = await liveRoomService.getChatMessages(testRoom.id);
    const urlMessage = chatHistory.find(msg => msg.id === messageWithUrl.id);
    
    expect(urlMessage.sharedUrl).toBe('https://example.com/article');
  });

  test('チャットレート制限', async () => {
    const rapidMessages = Array(12).fill(null).map((_, i) => 
      liveRoomService.sendChatMessage(testRoom.id, {
        content: `メッセージ${i}`
      })
    );

    // 11件目でレート制限エラー
    await expect(Promise.all(rapidMessages))
      .rejects.toThrow('送信頻度制限に達しました');
  });
});
```

## 4. E2Eテスト

### 4.1 完全なライブルームジャーニー

#### テストファイル: `e2e/liveroom-full-journey.e2e.ts`

```typescript
import { by, device, element, expect, waitFor } from 'detox';

describe('LiveRoom Full Journey E2E', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { microphone: 'YES', camera: 'YES' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // テストユーザーでログイン
    await loginAsTestUser('host@example.com');
  });

  test('ホスト: ルーム作成から配信終了まで', async () => {
    // 1. ホーム画面からライブルーム一覧へ
    await element(by.id('tab-live-rooms')).tap();
    await expect(element(by.text('ライブルーム'))).toBeVisible();

    // 2. ルーム作成ボタン
    await element(by.id('create-room-button')).tap();
    await expect(element(by.text('ライブルーム作成'))).toBeVisible();

    // 3. ルーム情報入力
    await element(by.id('room-title-input')).typeText('E2Eテストルーム');
    await element(by.id('max-speakers-slider')).setSliderPosition(0.5); // 5人
    await element(by.id('recording-switch')).tap(); // 録音ON

    // 4. ルーム作成実行
    await element(by.text('作成')).tap();
    
    // 5. ルーム詳細画面への遷移確認
    await waitFor(element(by.text('E2Eテストルーム')))
      .toBeVisible()
      .withTimeout(5000);
    
    await expect(element(by.text('配信開始'))).toBeVisible();

    // 6. 配信開始
    await element(by.text('配信開始')).tap();
    
    // マイク権限ダイアログの処理
    await waitFor(element(by.text('許可')))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.text('許可')).tap();

    // 7. 配信中状態の確認
    await waitFor(element(by.text('配信中')))
      .toBeVisible()
      .withTimeout(10000);
    
    await expect(element(by.text('配信終了'))).toBeVisible();
    await expect(element(by.id('chat-input'))).toBeVisible();

    // 8. チャットメッセージ送信
    await element(by.id('chat-input')).typeText('こんにちは、みなさん！');
    await element(by.id('send-button')).tap();
    
    await expect(element(by.text('こんにちは、みなさん！'))).toBeVisible();

    // 9. 配信終了
    await element(by.text('配信終了')).tap();
    await expect(element(by.text('録音を投稿として保存'))).toBeVisible();
    
    // 10. 録音保存して終了
    await element(by.id('save-recording-checkbox')).tap();
    await element(by.text('終了')).tap();

    // 11. 投稿作成完了確認
    await waitFor(element(by.text('投稿が作成されました')))
      .toBeVisible()
      .withTimeout(15000);
  });

  test('リスナー: ルーム参加と相互作用', async () => {
    // 前提: ホストが配信中のルームが存在
    await setupLiveRoom('test-live-room');

    // 1. ライブルーム一覧から参加
    await element(by.id('tab-live-rooms')).tap();
    await expect(element(by.text('test-live-room'))).toBeVisible();
    await element(by.text('test-live-room')).tap();

    // 2. ルーム詳細表示
    await expect(element(by.text('参加'))).toBeVisible();
    await expect(element(by.text('配信中'))).toBeVisible();

    // 3. ルーム参加
    await element(by.text('参加')).tap();
    
    // 4. 参加完了確認
    await waitFor(element(by.text('退出')))
      .toBeVisible()
      .withTimeout(10000);
    
    await expect(element(by.text('登壇リクエスト'))).toBeVisible();

    // 5. チャット送信
    await element(by.id('chat-input')).typeText('リスナーです！');
    await element(by.id('send-button')).tap();
    await expect(element(by.text('リスナーです！'))).toBeVisible();

    // 6. 登壇リクエスト
    await element(by.text('登壇リクエスト')).tap();
    await expect(element(by.text('リクエスト送信済み'))).toBeVisible();

    // 7. 参加者リスト確認
    await element(by.id('participants-tab')).tap();
    await expect(element(by.text('ホストユーザー'))).toBeVisible();

    // 8. ギフト送信
    await element(by.id('gift-button')).tap();
    await expect(element(by.text('ギフトを送る'))).toBeVisible();
    
    await element(by.text('600円')).tap();
    await element(by.id('gift-message-input')).typeText('応援してます！');
    await element(by.text('送信')).tap();

    // 決済画面での処理（テスト環境）
    await waitFor(element(by.text('決済完了')))
      .toBeVisible()
      .withTimeout(15000);

    // 9. ギフトエフェクト確認
    await expect(element(by.id('gift-animation'))).toBeVisible();
  });

  test('複数ユーザーでの同時参加', async () => {
    // デバイス1: ホスト
    await setupLiveRoom('multi-user-room');

    // デバイス2シミュレーション用の別インスタンス
    const device2 = device; // 実際にはセカンドデバイスまたはシミュレーター

    // 1. リスナー1参加
    await loginAsTestUser('listener1@example.com');
    await joinLiveRoom('multi-user-room');

    // 2. リスナー2参加（並行）
    await loginAsTestUser('listener2@example.com');
    await joinLiveRoom('multi-user-room');

    // 3. 同時チャット送信
    await Promise.all([
      sendChatMessage('リスナー1からのメッセージ'),
      sendChatMessage('リスナー2からのメッセージ')
    ]);

    // 4. 両方のメッセージが表示されることを確認
    await expect(element(by.text('リスナー1からのメッセージ'))).toBeVisible();
    await expect(element(by.text('リスナー2からのメッセージ'))).toBeVisible();

    // 5. 参加者数の更新確認
    await expect(element(by.text('3人が参加中'))).toBeVisible();
  });

  test('ネットワーク切断時の復旧', async () => {
    await setupLiveRoom('network-test-room');
    await joinLiveRoom('network-test-room');

    // 1. 正常な接続状態確認
    await expect(element(by.text('接続中'))).toBeVisible();

    // 2. ネットワーク切断シミュレーション
    await device.setNetworkState('offline');
    
    // 3. 切断状態の表示確認
    await waitFor(element(by.text('接続が切断されました')))
      .toBeVisible()
      .withTimeout(10000);

    // 4. ネットワーク復旧
    await device.setNetworkState('online');

    // 5. 自動再接続確認
    await waitFor(element(by.text('接続中')))
      .toBeVisible()
      .withTimeout(15000);

    // 6. 機能復旧確認
    await element(by.id('chat-input')).typeText('復旧後のメッセージ');
    await element(by.id('send-button')).tap();
    await expect(element(by.text('復旧後のメッセージ'))).toBeVisible();
  });
});

// ヘルパー関数
async function loginAsTestUser(email: string) {
  await element(by.id('login-email')).typeText(email);
  await element(by.id('login-password')).typeText('testpassword');
  await element(by.text('ログイン')).tap();
  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(5000);
}

async function setupLiveRoom(title: string) {
  // APIを使用してライブルームを事前作成
  // テスト環境専用の処理
}

async function joinLiveRoom(roomTitle: string) {
  await element(by.id('tab-live-rooms')).tap();
  await element(by.text(roomTitle)).tap();
  await element(by.text('参加')).tap();
  await waitFor(element(by.text('退出')))
    .toBeVisible()
    .withTimeout(10000);
}

async function sendChatMessage(message: string) {
  await element(by.id('chat-input')).typeText(message);
  await element(by.id('send-button')).tap();
}
```

## テスト実行設定

### Jest設定 (`jest.config.js`)

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/src/__tests__/setup.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@react-native|react-native|expo|@expo|@unimodules)'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx|js|jsx)',
    '**/?(*.)+(spec|test).(ts|tsx|js|jsx)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### テストセットアップ (`src/__tests__/setup.ts`)

```typescript
import 'react-native-reanimated/mock';
import mockAsyncStorage from '@react-native-async-storage/async-storage/mock';

// AsyncStorage mock
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Supabase mock
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    }))
  }
}));

// LiveKit mock
jest.mock('@livekit/react-native', () => ({
  Room: jest.fn(),
  connect: jest.fn(),
  LocalParticipant: jest.fn(),
  RemoteParticipant: jest.fn()
}));

// WebSocket mock
jest.mock('../lib/websocketService', () => ({
  websocketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    broadcast: jest.fn()
  }
}));

// Navigation mock
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn()
  }),
  useRoute: () => ({
    params: {}
  }),
  useFocusEffect: jest.fn()
}));

// テストユーザーヘルパー
global.setupTestUser = async (role: 'host' | 'listener' | 'speaker') => {
  return {
    id: `${role}-${Date.now()}`,
    displayName: `${role}ユーザー`,
    email: `${role}@test.com`
  };
};

global.cleanupTestUsers = async (users: any[]) => {
  // テストユーザーのクリーンアップ処理
};

global.authenticateAs = async (user: any) => {
  // テスト用認証切り替え
};
```

### パッケージスクリプト (`package.json`)

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=__tests__",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "detox test",
    "test:e2e:build": "detox build",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

## まとめ

このテスト仕様書により、ライブルーム機能の包括的なテストが可能になります：

1. **APIユニットテスト**: 各エンドポイントの正常系・異常系
2. **UIユニットテスト**: コンポーネントの表示・操作・状態管理
3. **結合テスト**: WebRTC接続、リアルタイム通信の統合フロー
4. **E2Eテスト**: ユーザージャーニー全体とマルチユーザー相互作用

これらのテストケースに従ってTDD実装を進めることで、高品質で信頼性の高いライブルーム機能が実現できます。