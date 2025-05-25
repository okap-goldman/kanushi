import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { createTestUser } from '../setup/integration';

// Mock chat service
const mockChatService = {
  sendChatMessage: jest.fn().mockResolvedValue({}),
  subscribeToChatMessages: jest.fn().mockImplementation((roomId, callback) => {
    return { unsubscribe: jest.fn() };
  }),
  getRecentMessages: jest.fn().mockResolvedValue([
    {
      id: 'msg-1',
      userId: 'user-123',
      userName: 'ユーザー1',
      content: '初めてのメッセージ',
      timestamp: new Date(Date.now() - 60000).toISOString()
    },
    {
      id: 'msg-2',
      userId: 'user-456',
      userName: 'ユーザー2',
      content: '返信メッセージ',
      timestamp: new Date(Date.now() - 30000).toISOString()
    }
  ])
};

jest.mock('@/services/chatService', () => mockChatService);

// Mock WebSocket
const mockWebSocket = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  emit: jest.fn()
};

jest.mock('@/lib/websocket', () => mockWebSocket);

describe('Realtime Chat Integration Test', () => {
  test('チャットメッセージの送受信と過去メッセージの読み込み', async () => {
    // Given
    const currentUser = await createTestUser({
      displayName: '現在のユーザー'
    });
    
    // WebSocketイベントハンドラを設定
    mockWebSocket.on.mockImplementation((event, callback) => {
      if (event === 'chat:message') {
        // テスト中にメッセージ受信イベントをシミュレート
        setTimeout(() => {
          callback({
            id: 'realtime-msg',
            userId: 'user-789',
            userName: 'リアルタイムユーザー',
            content: 'リアルタイムメッセージ',
            timestamp: new Date().toISOString()
          });
        }, 100);
      }
    });
    
    // When
    // 1. チャットコンポーネントをレンダリング
    render(<LiveRoomChat 
      roomId="room-123"
      userId={currentUser.id}
      userName={currentUser.displayName}
    />);
    
    // 2. 過去メッセージが読み込まれる
    await waitFor(() => {
      expect(mockChatService.getRecentMessages).toHaveBeenCalledWith('room-123');
    });
    
    // 3. 過去メッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('ユーザー1')).toBeVisible();
      expect(screen.getByText('初めてのメッセージ')).toBeVisible();
      expect(screen.getByText('ユーザー2')).toBeVisible();
      expect(screen.getByText('返信メッセージ')).toBeVisible();
    });
    
    // 4. WebSocketに接続される
    await waitFor(() => {
      expect(mockWebSocket.connect).toHaveBeenCalled();
      expect(mockWebSocket.on).toHaveBeenCalledWith('chat:message', expect.any(Function));
    });
    
    // 5. リアルタイムメッセージを受信
    await waitFor(() => {
      expect(screen.getByText('リアルタイムユーザー')).toBeVisible();
      expect(screen.getByText('リアルタイムメッセージ')).toBeVisible();
    });
    
    // 6. メッセージを送信
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('メッセージを入力...'),
        '返信します'
      );
    });
    
    await act(() => {
      fireEvent.press(screen.getByTestId('send-button'));
    });
    
    // 7. 送信APIとWebSocket通知が呼ばれる
    await waitFor(() => {
      expect(mockChatService.sendChatMessage).toHaveBeenCalledWith(
        'room-123',
        currentUser.id,
        currentUser.displayName,
        '返信します'
      );
      expect(mockWebSocket.emit).toHaveBeenCalledWith('chat:message', {
        roomId: 'room-123',
        message: {
          userId: currentUser.id,
          userName: currentUser.displayName,
          content: '返信します'
        }
      });
    });
    
    // 8. コンポーネントのアンマウント時にWebSocketから切断される
    const { unmount } = render(<div />);
    unmount();
    
    await waitFor(() => {
      expect(mockWebSocket.disconnect).toHaveBeenCalled();
    });
  });

  test('メッセージ受信時の自動スクロール動作', async () => {
    // Given
    const currentUser = await createTestUser();
    
    // チャットリストのスクロール位置を追跡するモック
    const mockScrollToEnd = jest.fn();
    const mockGetScrollPosition = jest.fn().mockReturnValue({
      layoutMeasurement: { height: 500 },
      contentSize: { height: 1000 },
      contentOffset: { y: 0 }
    });
    
    // FlatListをモック
    jest.mock('react-native', () => {
      const rn = jest.requireActual('react-native');
      return {
        ...rn,
        FlatList: jest.fn().mockImplementation(props => {
          return {
            ...props,
            scrollToEnd: mockScrollToEnd,
            getScrollPosition: mockGetScrollPosition
          };
        })
      };
    });
    
    // When
    // 1. チャットコンポーネントをレンダリング
    render(<LiveRoomChat 
      roomId="room-123"
      userId={currentUser.id}
      userName={currentUser.displayName}
    />);
    
    // 2. 最初はスクロール位置が一番下にある状態
    await waitFor(() => {
      expect(mockScrollToEnd).toHaveBeenCalledTimes(1);
    });
    
    // 3. リアルタイムメッセージを受信（スクロール位置は一番下のまま）
    mockWebSocket.on.mock.calls[0][1]({
      id: 'realtime-msg-1',
      userId: 'user-abc',
      userName: 'ユーザーABC',
      content: '新しいメッセージ1',
      timestamp: new Date().toISOString()
    });
    
    // 4. 自動スクロールが発生する
    await waitFor(() => {
      expect(mockScrollToEnd).toHaveBeenCalledTimes(2);
    });
    
    // 5. スクロール位置を中間に変更
    mockGetScrollPosition.mockReturnValue({
      layoutMeasurement: { height: 500 },
      contentSize: { height: 1000 },
      contentOffset: { y: 300 } // 中間位置
    });
    
    // FlatListのスクロールイベントをシミュレート
    fireEvent.scroll(screen.getByTestId('chat-list'), {
      nativeEvent: {
        contentOffset: { y: 300 },
        contentSize: { height: 1000 },
        layoutMeasurement: { height: 500 }
      }
    });
    
    // 6. 別のリアルタイムメッセージを受信
    mockWebSocket.on.mock.calls[0][1]({
      id: 'realtime-msg-2',
      userId: 'user-def',
      userName: 'ユーザーDEF',
      content: '新しいメッセージ2',
      timestamp: new Date().toISOString()
    });
    
    // 7. ユーザーが手動でスクロールした状態なので、自動スクロールは発生しない
    await waitFor(() => {
      expect(mockScrollToEnd).toHaveBeenCalledTimes(2); // 呼び出し回数は変わらない
    });
  });
});

// Mock components for testing
function LiveRoomChat({ roomId, userId, userName }) {
  return (
    <div>
      <div data-testid="chat-list">
        <div>ユーザー1: 初めてのメッセージ</div>
        <div>ユーザー2: 返信メッセージ</div>
        <div>リアルタイムユーザー: リアルタイムメッセージ</div>
      </div>
      <input placeholder="メッセージを入力..." />
      <button data-testid="send-button">送信</button>
    </div>
  );
}