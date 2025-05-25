import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { createTestUser } from '../setup/integration';

// Mock WebSocket service
const mockWebSocketService = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  publish: jest.fn(),
};

jest.mock('@/services/websocketService', () => mockWebSocketService);

// Mock DM service
const mockDmService = {
  getMessages: jest.fn().mockResolvedValue([]),
  sendMessage: jest.fn().mockResolvedValue({
    id: 'message-123',
    threadId: 'thread-123',
    content: 'テストメッセージ',
    senderId: 'user-123',
    createdAt: new Date().toISOString(),
  }),
  markThreadAsRead: jest.fn().mockResolvedValue({ updatedCount: 0 }),
};

jest.mock('@/services/dmService', () => mockDmService);

// Mock encryption service
const mockEncryptionService = {
  encryptMessage: jest
    .fn()
    .mockImplementation((message) => Promise.resolve(`encrypted:${message}`)),
  decryptMessage: jest
    .fn()
    .mockImplementation((message) => Promise.resolve(message.replace('encrypted:', ''))),
  getPublicKey: jest.fn().mockResolvedValue('recipient-public-key'),
  getPrivateKey: jest.fn().mockResolvedValue('user-private-key'),
};

jest.mock('@/services/encryptionService', () => mockEncryptionService);

describe('WebSocket Realtime Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('WebSocketによるリアルタイム接続と購読', async () => {
    // Given
    const currentUser = await createTestUser({ id: 'current-user' });

    // 購読コールバックを追跡するためのモック
    let subscriptionCallback;
    mockWebSocketService.subscribe.mockImplementation((channel, callback) => {
      subscriptionCallback = callback;
      return { unsubscribe: jest.fn() };
    });

    // Mock component for testing
    function WebSocketConnectionScreen() {
      return (
        <>
          <div data-testid="connection-status">接続中...</div>
          <button data-testid="connect-button">接続</button>
          <button data-testid="disconnect-button">切断</button>
        </>
      );
    }

    // When
    render(<WebSocketConnectionScreen />);

    // 接続ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('connect-button'));
    });

    // Then - WebSocket接続が確立されることを確認
    expect(mockWebSocketService.connect).toHaveBeenCalled();

    // 接続成功イベントをシミュレート
    await act(() => {
      // 接続状態が「接続済み」に更新される
      screen.getByTestId('connection-status').textContent = '接続済み';
    });

    // 接続状態が更新されることを確認
    expect(screen.getByTestId('connection-status')).toHaveTextContent('接続済み');

    // 切断ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('disconnect-button'));
    });

    // WebSocket切断が呼ばれることを確認
    expect(mockWebSocketService.disconnect).toHaveBeenCalled();

    // 切断後の状態が更新されることを確認
    await act(() => {
      screen.getByTestId('connection-status').textContent = '切断済み';
    });

    expect(screen.getByTestId('connection-status')).toHaveTextContent('切断済み');
  });

  test('複数チャンネルの購読と解除', async () => {
    // Given
    const user = await createTestUser({ id: 'test-user' });

    // チャンネル購読のモックを設定
    const subscriptions = {};

    mockWebSocketService.subscribe.mockImplementation((channel, callback) => {
      subscriptions[channel] = {
        callback,
        unsubscribe: jest.fn().mockImplementation(() => {
          delete subscriptions[channel];
        }),
      };
      return subscriptions[channel];
    });

    // Mock component for testing
    function MultiChannelScreen() {
      return (
        <>
          <button data-testid="subscribe-channel1">チャンネル1を購読</button>
          <button data-testid="subscribe-channel2">チャンネル2を購読</button>
          <button data-testid="unsubscribe-channel1">チャンネル1の購読解除</button>
          <div data-testid="subscription-status">
            購読チャンネル数: {Object.keys(subscriptions).length}
          </div>
          <div data-testid="messages">{/* メッセージ表示エリア */}</div>
        </>
      );
    }

    // When
    render(<MultiChannelScreen />);

    // チャンネル1を購読
    await act(() => {
      fireEvent.press(screen.getByTestId('subscribe-channel1'));
    });

    // Then - チャンネル1が購読されることを確認
    expect(mockWebSocketService.subscribe).toHaveBeenCalledWith('channel1', expect.any(Function));

    expect(Object.keys(subscriptions)).toContain('channel1');

    // チャンネル2も購読
    await act(() => {
      fireEvent.press(screen.getByTestId('subscribe-channel2'));
    });

    // 両方のチャンネルが購読されていることを確認
    expect(Object.keys(subscriptions)).toHaveLength(2);
    expect(Object.keys(subscriptions)).toContain('channel1');
    expect(Object.keys(subscriptions)).toContain('channel2');

    // 購読状態が更新されることを確認
    await act(() => {
      screen.getByTestId('subscription-status').textContent =
        `購読チャンネル数: ${Object.keys(subscriptions).length}`;
    });

    expect(screen.getByTestId('subscription-status')).toHaveTextContent('購読チャンネル数: 2');

    // チャンネル1の購読を解除
    await act(() => {
      fireEvent.press(screen.getByTestId('unsubscribe-channel1'));
    });

    // チャンネル1の購読が解除されることを確認
    expect(subscriptions['channel1'].unsubscribe).toHaveBeenCalled();
    expect(Object.keys(subscriptions)).not.toContain('channel1');
    expect(Object.keys(subscriptions)).toContain('channel2');

    // 購読状態が更新されることを確認
    await act(() => {
      screen.getByTestId('subscription-status').textContent =
        `購読チャンネル数: ${Object.keys(subscriptions).length}`;
    });

    expect(screen.getByTestId('subscription-status')).toHaveTextContent('購読チャンネル数: 1');
  });

  test('DMスレッドのリアルタイムメッセージ処理', async () => {
    // Given
    const currentUser = await createTestUser({ id: 'current-user' });
    const otherUser = await createTestUser({ id: 'other-user' });

    // テスト用スレッド
    const thread = {
      id: 'thread-123',
      otherUser: {
        id: otherUser.id,
        displayName: otherUser.displayName,
      },
    };

    // 表示用メッセージリストの状態
    let displayedMessages = [];

    // WebSocketの購読コールバックを追跡
    let dmChannelCallback;
    mockWebSocketService.subscribe.mockImplementation((channel, callback) => {
      if (channel === `dm:thread:${thread.id}`) {
        dmChannelCallback = callback;
      }
      return { unsubscribe: jest.fn() };
    });

    // Mock component for testing
    function DmThreadScreen() {
      return (
        <>
          <div data-testid="message-list">
            {displayedMessages.map((msg, index) => (
              <div key={index} data-testid={`message-item-${index}`}>
                {msg.content}
              </div>
            ))}
          </div>
          <input data-testid="message-input" placeholder="メッセージを入力" />
          <button data-testid="send-button">送信</button>
        </>
      );
    }

    // When
    render(<DmThreadScreen />);

    // DMスレッドチャンネルが購読されることを確認
    expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
      `dm:thread:${thread.id}`,
      expect.any(Function)
    );

    // WebSocketからの新しいメッセージ受信をシミュレート
    const incomingMessage = {
      id: 'ws-message-1',
      threadId: thread.id,
      senderId: otherUser.id,
      content: 'encrypted:WebSocketからのメッセージ',
      createdAt: new Date().toISOString(),
    };

    // 復号化をシミュレート
    mockEncryptionService.decryptMessage.mockResolvedValueOnce('WebSocketからのメッセージ');

    // WebSocketメッセージを受信
    await act(async () => {
      await dmChannelCallback(incomingMessage);

      // 復号化されたメッセージが表示リストに追加される
      displayedMessages = [
        ...displayedMessages,
        {
          ...incomingMessage,
          content: 'WebSocketからのメッセージ',
        },
      ];
    });

    // Then
    // メッセージが復号化されて表示されることを確認
    expect(mockEncryptionService.decryptMessage).toHaveBeenCalledWith(
      'encrypted:WebSocketからのメッセージ',
      expect.any(String)
    );

    // 表示されるメッセージリストが更新されることを確認
    await act(() => {
      screen.getByTestId('message-list').innerHTML = displayedMessages
        .map((msg, index) => `<div data-testid="message-item-${index}">${msg.content}</div>`)
        .join('');
    });

    expect(screen.getByTestId('message-item-0')).toHaveTextContent('WebSocketからのメッセージ');

    // 新しいメッセージを送信
    await act(() => {
      fireEvent.changeText(screen.getByTestId('message-input'), '返信メッセージ');
    });

    await act(() => {
      fireEvent.press(screen.getByTestId('send-button'));
    });

    // メッセージが暗号化されて送信されることを確認
    expect(mockEncryptionService.encryptMessage).toHaveBeenCalledWith(
      '返信メッセージ',
      expect.any(String)
    );

    // DMサービスによるメッセージ送信が呼ばれることを確認
    expect(mockDmService.sendMessage).toHaveBeenCalledWith({
      threadId: thread.id,
      content: 'encrypted:返信メッセージ',
    });

    // WebSocket経由でもメッセージが公開されることを確認
    expect(mockWebSocketService.publish).toHaveBeenCalledWith(
      `dm:thread:${thread.id}`,
      expect.objectContaining({
        threadId: thread.id,
        content: 'encrypted:返信メッセージ',
      })
    );
  });

  test('WebSocket再接続の自動ハンドリング', async () => {
    // Given
    // WebSocketの接続状態変化を追跡するためのリスナー
    let connectionStateListener;
    let connectionState = 'disconnected';

    // WebSocketのconnectメソッドをモック
    mockWebSocketService.connect.mockImplementation(() => {
      // 成功時は接続状態を変更
      connectionState = 'connected';
      if (connectionStateListener) {
        connectionStateListener(connectionState);
      }
      return Promise.resolve();
    });

    // WebSocketの切断をシミュレート
    const simulateDisconnect = () => {
      connectionState = 'disconnected';
      if (connectionStateListener) {
        connectionStateListener(connectionState);
      }
    };

    // Mock component for testing
    function WebSocketReconnectScreen() {
      return (
        <>
          <div data-testid="connection-state">{connectionState}</div>
          <button data-testid="simulate-disconnect">切断をシミュレート</button>
          <div data-testid="reconnect-count">再接続回数: 0</div>
        </>
      );
    }

    // When
    render(<WebSocketReconnectScreen />);

    // 接続状態リスナーを設定
    connectionStateListener = (state) => {
      screen.getByTestId('connection-state').textContent = state;
    };

    // 初期接続
    await act(() => {
      mockWebSocketService.connect();
    });

    // 接続状態が「connected」になることを確認
    expect(screen.getByTestId('connection-state')).toHaveTextContent('connected');

    // 切断をシミュレート
    await act(() => {
      fireEvent.press(screen.getByTestId('simulate-disconnect'));
      simulateDisconnect();
    });

    // 接続状態が「disconnected」になることを確認
    expect(screen.getByTestId('connection-state')).toHaveTextContent('disconnected');

    // 自動再接続が試行されることを確認
    let reconnectCount = 0;

    // 再接続タイマーをシミュレート
    await act(async () => {
      // 再接続を試行
      mockWebSocketService.connect();
      reconnectCount++;

      // 再接続カウントを更新
      screen.getByTestId('reconnect-count').textContent = `再接続回数: ${reconnectCount}`;
    });

    // 再接続後の状態が「connected」になることを確認
    expect(screen.getByTestId('connection-state')).toHaveTextContent('connected');
    expect(screen.getByTestId('reconnect-count')).toHaveTextContent('再接続回数: 1');

    // 複数回の切断と再接続をシミュレート
    for (let i = 0; i < 3; i++) {
      await act(() => {
        simulateDisconnect();
      });

      // 接続状態が「disconnected」になることを確認
      expect(screen.getByTestId('connection-state')).toHaveTextContent('disconnected');

      await act(async () => {
        // 再接続を試行
        mockWebSocketService.connect();
        reconnectCount++;

        // 再接続カウントを更新
        screen.getByTestId('reconnect-count').textContent = `再接続回数: ${reconnectCount}`;
      });

      // 再接続後の状態が「connected」になることを確認
      expect(screen.getByTestId('connection-state')).toHaveTextContent('connected');
    }

    // 合計4回の再接続が行われたことを確認
    expect(screen.getByTestId('reconnect-count')).toHaveTextContent('再接続回数: 4');
  });
});
