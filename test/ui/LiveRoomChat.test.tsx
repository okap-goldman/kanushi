import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LiveRoomChat } from '@/components/liveroom/LiveRoomChat';
import { liveRoomService } from '@/lib/liveRoomService';

jest.mock('@/lib/liveRoomService');

describe('LiveRoomChat', () => {
  const mockMessages = [
    {
      id: 'msg-1',
      content: 'こんにちは！',
      user_id: 'user-1',
      created_at: new Date().toISOString(),
      user: {
        display_name: 'ユーザー1'
      }
    },
    {
      id: 'msg-2',
      content: 'よろしくお願いします',
      user_id: 'user-2',
      created_at: new Date().toISOString(),
      user: {
        display_name: 'ユーザー2'
      }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('チャットの表示', async () => {
    (liveRoomService.getChatMessages as jest.Mock).mockResolvedValue(mockMessages);

    const { getByPlaceholderText, getByText, getByTestId } = render(
      <LiveRoomChat
        roomId="room-123"
        userId="user-1"
        userName="テストユーザー"
      />
    );

    await waitFor(() => {
      // メッセージリスト
      expect(getByText('こんにちは！')).toBeTruthy();
      expect(getByText('よろしくお願いします')).toBeTruthy();
      expect(getByText('ユーザー1')).toBeTruthy();
      expect(getByText('ユーザー2')).toBeTruthy();
    });

    // 入力フィールド
    expect(getByPlaceholderText('メッセージを入力...')).toBeTruthy();
    expect(getByTestId('send-button')).toBeTruthy();
  });

  test('メッセージの送信', async () => {
    (liveRoomService.getChatMessages as jest.Mock).mockResolvedValue([]);
    (liveRoomService.sendChatMessage as jest.Mock).mockResolvedValue({
      id: 'new-msg',
      content: '新しいメッセージ',
      userId: 'user-1',
      createdAt: new Date().toISOString()
    });

    const { getByPlaceholderText, getByTestId } = render(
      <LiveRoomChat
        roomId="room-123"
        userId="user-1"
        userName="テストユーザー"
      />
    );

    const input = getByPlaceholderText('メッセージを入力...');
    const sendButton = getByTestId('send-button');

    // メッセージ入力
    fireEvent.changeText(input, '新しいメッセージ');
    
    // 送信
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(liveRoomService.sendChatMessage).toHaveBeenCalledWith(
        'room-123',
        '新しいメッセージ',
        undefined
      );
      // 入力フィールドがクリアされる
      expect(input.props.value).toBe('');
    });
  });

  test('空メッセージの送信防止', () => {
    (liveRoomService.getChatMessages as jest.Mock).mockResolvedValue([]);

    const { getByPlaceholderText, getByTestId } = render(
      <LiveRoomChat
        roomId="room-123"
        userId="user-1"
        userName="テストユーザー"
      />
    );

    const input = getByPlaceholderText('メッセージを入力...');
    const sendButton = getByTestId('send-button');

    // 空の状態で送信
    fireEvent.press(sendButton);

    expect(liveRoomService.sendChatMessage).not.toHaveBeenCalled();
  });

  test('URL共有付きメッセージ', async () => {
    (liveRoomService.getChatMessages as jest.Mock).mockResolvedValue([]);
    (liveRoomService.sendChatMessage as jest.Mock).mockResolvedValue({
      id: 'url-msg',
      content: 'このリンクを見てください',
      userId: 'user-1',
      sharedUrl: 'https://example.com',
      urlPreview: {
        title: 'サンプルページ',
        description: 'サンプルの説明'
      },
      createdAt: new Date().toISOString()
    });

    const { getByPlaceholderText, getByTestId } = render(
      <LiveRoomChat
        roomId="room-123"
        userId="user-1"
        userName="テストユーザー"
      />
    );

    const input = getByPlaceholderText('メッセージを入力...');
    const sendButton = getByTestId('send-button');
    const urlButton = getByTestId('url-share-button');

    // URL共有ボタンをタップ
    fireEvent.press(urlButton);

    // URL入力ダイアログが表示される
    await waitFor(() => {
      const urlInput = getByPlaceholderText('URLを入力...');
      fireEvent.changeText(urlInput, 'https://example.com');
      fireEvent.press(getByTestId('url-confirm'));
    });

    // メッセージ入力
    fireEvent.changeText(input, 'このリンクを見てください');
    
    // 送信
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(liveRoomService.sendChatMessage).toHaveBeenCalledWith(
        'room-123',
        'このリンクを見てください',
        { sharedUrl: 'https://example.com' }
      );
    });
  });

  test('リアルタイム更新', async () => {
    (liveRoomService.getChatMessages as jest.Mock).mockResolvedValue([]);

    const { getByText, rerender } = render(
      <LiveRoomChat
        roomId="room-123"
        userId="user-1"
        userName="テストユーザー"
      />
    );

    // WebSocketメッセージを受信（シミュレート）
    const newMessage = {
      id: 'realtime-msg',
      content: 'リアルタイムメッセージ',
      user_id: 'user-2',
      created_at: new Date().toISOString(),
      user: {
        display_name: 'ユーザー2'
      }
    };

    // コンポーネントのonNewMessageコールバックを呼び出す
    // 実際の実装ではWebSocketイベントによって呼ばれる
    await waitFor(() => {
      rerender(
        <LiveRoomChat
          roomId="room-123"
          userId="user-1"
          userName="テストユーザー"
          newMessage={newMessage}
        />
      );
    });

    expect(getByText('リアルタイムメッセージ')).toBeTruthy();
  });

  test('エラーハンドリング', async () => {
    (liveRoomService.getChatMessages as jest.Mock).mockRejectedValue(
      new Error('メッセージ取得エラー')
    );

    const { getByText } = render(
      <LiveRoomChat
        roomId="room-123"
        userId="user-1"
        userName="テストユーザー"
      />
    );

    await waitFor(() => {
      expect(getByText('メッセージの読み込みに失敗しました')).toBeTruthy();
    });
  });
});
EOF < /dev/null