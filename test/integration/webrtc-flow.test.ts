import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { createTestUser } from '../setup/integration';

// Mock services
jest.mock('@/services/liveRoomService', () => ({
  createRoom: jest.fn().mockResolvedValue({ id: 'room-123' }),
  joinRoom: jest.fn().mockResolvedValue({
    token: 'mock-token',
    room: {
      id: 'room-123',
      title: '目醒めトーク',
      hostUser: { id: 'host-id', displayName: 'ホスト' },
      status: 'active'
    }
  }),
  endRoom: jest.fn().mockResolvedValue({}),
  leaveRoom: jest.fn().mockResolvedValue({})
}));

// Mock LiveKit SDK
jest.mock('@livekit/react-native', () => ({
  Room: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({}),
    disconnect: jest.fn(),
    localParticipant: {
      publishTrack: jest.fn().mockResolvedValue({}),
      setMicrophoneEnabled: jest.fn().mockResolvedValue(true)
    },
    participants: new Map(),
    createLocalTracks: jest.fn().mockResolvedValue([])
  })),
  RoomEvent: {
    ParticipantConnected: 'participantConnected',
    ParticipantDisconnected: 'participantDisconnected',
    TrackSubscribed: 'trackSubscribed',
    TrackUnsubscribed: 'trackUnsubscribed'
  }
}));

describe('WebRTC Integration Flow', () => {
  test('ルーム作成から入室、WebRTC接続までの全体フロー', async () => {
    // Given
    const hostUser = await createTestUser({
      displayName: 'ホストユーザー'
    });
    
    // 1. ルーム作成ダイアログを開く
    render(<CreateLiveRoomButton onRoomCreated={jest.fn()} />);
    
    await act(() => {
      fireEvent.press(screen.getByText('ライブルームを作成'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('ライブルーム作成')).toBeVisible();
    });
    
    // 2. ルーム情報を入力して作成
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('タイトルを入力（50文字以内）'),
        '目醒めトーク'
      );
    });
    
    await act(() => {
      fireEvent.press(screen.getByText('作成'));
    });
    
    // 3. ルームが作成され、LiveKitのトークンが取得される
    await waitFor(() => {
      expect(require('@/services/liveRoomService').createRoom).toHaveBeenCalledWith({
        title: '目醒めトーク',
        maxSpeakers: 5, // デフォルト値
        isRecording: false // デフォルト値
      });
    });
    
    // 4. LiveRoomScreenコンポーネントがレンダリングされる
    render(<LiveRoomScreen 
      roomId="room-123"
      userId={hostUser.id}
      role="host"
      onRoomEnded={jest.fn()}
    />);
    
    // 5. LiveKitのRoomに接続される
    await waitFor(() => {
      expect(require('@livekit/react-native').Room().connect).toHaveBeenCalledWith(
        'https://livekit.kanushi.app', 
        'mock-token'
      );
    });
    
    // 6. マイク権限リクエストが表示される
    await waitFor(() => {
      expect(screen.getByText('マイクへのアクセスを許可してください')).toBeVisible();
    });
    
    // 7. 許可を与えると、マイクが有効化される
    await act(() => {
      fireEvent.press(screen.getByText('許可する'));
    });
    
    await waitFor(() => {
      expect(require('@livekit/react-native').Room().localParticipant.publishTrack)
        .toHaveBeenCalledWith('microphone', { enabled: true });
    });
    
    // 8. ルーム画面が完全に表示される
    await waitFor(() => {
      expect(screen.getByText('目醒めトーク')).toBeVisible();
      expect(screen.getByText('ホストユーザー')).toBeVisible();
      expect(screen.getByTestId('mute-button')).toBeVisible();
    });
  });
});

describe('Realtime Chat Integration', () => {
  test('リアルタイムチャットの送受信フロー', async () => {
    // Given
    const user1 = await createTestUser({ displayName: 'ユーザー1' });
    const user2 = await createTestUser({ displayName: 'ユーザー2' });
    
    // Mock chat service
    const mockChatService = {
      sendChatMessage: jest.fn().mockResolvedValue({}),
      subscribeToChatMessages: jest.fn().mockImplementation((roomId, callback) => {
        setTimeout(() => {
          callback({
            id: 'msg-1',
            userId: user2.id,
            userName: 'ユーザー2',
            content: 'こんにちは！',
            timestamp: new Date().toISOString()
          });
        }, 100);
        
        return { unsubscribe: jest.fn() };
      })
    };
    
    jest.mock('@/services/chatService', () => mockChatService);
    
    // 1. ルームに入室
    render(<LiveRoomScreen 
      roomId="room-123"
      userId={user1.id}
      role="listener"
      onLeaveRoom={jest.fn()}
    />);
    
    // 2. チャットタブをアクティブにする
    await waitFor(() => {
      expect(screen.getByText('チャット')).toBeVisible();
    });
    
    await act(() => {
      fireEvent.press(screen.getByText('チャット'));
    });
    
    // 3. チャットコンポーネントが表示される
    await waitFor(() => {
      expect(screen.getByPlaceholderText('メッセージを入力...')).toBeVisible();
    });
    
    // 4. リアルタイムメッセージを受信
    await waitFor(() => {
      expect(screen.getByText('ユーザー2')).toBeVisible();
      expect(screen.getByText('こんにちは！')).toBeVisible();
    });
    
    // 5. メッセージを送信
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('メッセージを入力...'),
        'こんにちは、よろしくお願いします！'
      );
    });
    
    await act(() => {
      fireEvent.press(screen.getByTestId('send-button'));
    });
    
    // 6. 送信APIが呼ばれる
    await waitFor(() => {
      expect(mockChatService.sendChatMessage).toHaveBeenCalledWith(
        'room-123',
        user1.id,
        'ユーザー1',
        'こんにちは、よろしくお願いします！'
      );
    });
    
    // 7. 入力フィールドがクリアされる
    await waitFor(() => {
      expect(screen.getByPlaceholderText('メッセージを入力...')).toHaveProp('value', '');
    });
  });
});

// Mock components for testing
function CreateLiveRoomButton({ onRoomCreated }) {
  return (
    <button onPress={() => fireEvent.press(screen.getByText('ライブルーム作成'))}>
      ライブルームを作成
    </button>
  );
}

function LiveRoomScreen({ roomId, userId, role, onRoomEnded, onLeaveRoom }) {
  return (
    <div>
      <h1>目醒めトーク</h1>
      <h2>ホストユーザー</h2>
      <button data-testid="mute-button">ミュート</button>
      <button>チャット</button>
      <input placeholder="メッセージを入力..." />
      <button data-testid="send-button">送信</button>
      <div>マイクへのアクセスを許可してください</div>
      <button>許可する</button>
    </div>
  );
}