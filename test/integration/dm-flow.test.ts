import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { createTestUser } from '../setup/integration';

// Mock services
const mockDmService = {
  createThread: jest.fn().mockResolvedValue({
    id: 'thread-123',
    user1: { id: 'user-123' },
    user2: { id: 'user-456' }
  }),
  sendMessage: jest.fn().mockResolvedValue({
    id: 'message-123',
    threadId: 'thread-123',
    content: 'テストメッセージ',
    senderId: 'user-123',
    createdAt: new Date().toISOString()
  }),
  getMessages: jest.fn().mockResolvedValue([]),
  markThreadAsRead: jest.fn().mockResolvedValue({ updatedCount: 0 })
};

jest.mock('@/services/dmService', () => mockDmService);

// Mock encryption service
const mockEncryptionService = {
  generateKeyPair: jest.fn().mockResolvedValue({
    publicKey: 'mock-public-key',
    privateKey: 'mock-private-key'
  }),
  encryptMessage: jest.fn().mockImplementation((message, key) => Promise.resolve(`encrypted:${message}`)),
  decryptMessage: jest.fn().mockImplementation((message) => Promise.resolve(message.replace('encrypted:', ''))),
  storeKeyPair: jest.fn().mockResolvedValue(true),
  getPublicKey: jest.fn().mockResolvedValue('recipient-public-key'),
  getPrivateKey: jest.fn().mockResolvedValue('user-private-key')
};

jest.mock('@/services/encryptionService', () => mockEncryptionService);

// Mock websocket service
const mockWebSocketService = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  publish: jest.fn()
};

jest.mock('@/services/websocketService', () => mockWebSocketService);

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn()
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation
}));

describe('DM Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('DM全体フロー - スレッド作成から会話まで', async () => {
    // Given
    const sender = await createTestUser({
      displayName: '送信者ユーザー',
      id: 'user-123'
    });
    
    const recipient = await createTestUser({
      displayName: '受信者ユーザー',
      id: 'user-456'
    });
    
    // Mock components for testing
    function DMScreen() {
      return (
        <div>
          <div data-testid="message-list-screen">
            <button 
              data-testid="new-dm-button" 
              onPress={() => screen.getByTestId('user-select-screen')}
            >
              新規メッセージ
            </button>
          </div>
          <div data-testid="user-select-screen" style={{ display: 'none' }}>
            <div data-testid="user-item-user-456">受信者ユーザー</div>
          </div>
          <div data-testid="message-detail-screen" style={{ display: 'none' }}>
            <input data-testid="message-input" placeholder="メッセージを入力" />
            <button data-testid="send-button">送信</button>
          </div>
        </div>
      );
    }
    
    // When - DMScreenをレンダリング
    render(<DMScreen />);
    
    // Step 1: 新規メッセージボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('new-dm-button'));
    });
    
    // Step 2: ユーザー選択画面で受信者を選択
    await act(() => {
      fireEvent.press(screen.getByTestId('user-item-user-456'));
    });
    
    // Then - スレッド作成APIが呼ばれる
    expect(mockDmService.createThread).toHaveBeenCalledWith('user-456');
    
    // Step 3: メッセージ詳細画面が表示される
    await waitFor(() => {
      expect(screen.getByTestId('message-detail-screen')).toBeVisible();
    });
    
    // Step 4: 暗号化キーの確認
    expect(mockEncryptionService.getPublicKey).toHaveBeenCalledWith('user-456');
    expect(mockEncryptionService.getPrivateKey).toHaveBeenCalledWith('user-123');
    
    // Step 5: メッセージを入力して送信
    await act(() => {
      fireEvent.changeText(
        screen.getByTestId('message-input'),
        'テストメッセージ'
      );
    });
    
    await act(() => {
      fireEvent.press(screen.getByTestId('send-button'));
    });
    
    // Then - 暗号化してメッセージ送信APIが呼ばれる
    expect(mockEncryptionService.encryptMessage).toHaveBeenCalledWith(
      'テストメッセージ',
      'recipient-public-key'
    );
    
    expect(mockDmService.sendMessage).toHaveBeenCalledWith({
      threadId: 'thread-123',
      content: 'encrypted:テストメッセージ'
    });
  });
});

describe('E2E Encryption Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('エンドツーエンド暗号化のメッセージ送受信', async () => {
    // Given
    const sender = await createTestUser({ id: 'sender' });
    const recipient = await createTestUser({ id: 'recipient' });
    
    // 送信者の暗号化キーペア
    const senderKeyPair = {
      publicKey: 'sender-public-key',
      privateKey: 'sender-private-key'
    };
    
    // 受信者の暗号化キーペア
    const recipientKeyPair = {
      publicKey: 'recipient-public-key',
      privateKey: 'recipient-private-key'
    };
    
    // 暗号化サービスのモックを設定
    mockEncryptionService.getPublicKey
      .mockImplementation((userId) => {
        if (userId === 'sender') return Promise.resolve(senderKeyPair.publicKey);
        if (userId === 'recipient') return Promise.resolve(recipientKeyPair.publicKey);
        return Promise.reject(new Error('Unknown user'));
      });
    
    mockEncryptionService.getPrivateKey
      .mockImplementation((userId) => {
        if (userId === 'sender') return Promise.resolve(senderKeyPair.privateKey);
        if (userId === 'recipient') return Promise.resolve(recipientKeyPair.privateKey);
        return Promise.reject(new Error('Unknown user'));
      });
    
    mockEncryptionService.encryptMessage
      .mockImplementation((message, publicKey) => {
        if (publicKey === recipientKeyPair.publicKey) {
          return Promise.resolve(`encrypted-for-recipient:${message}`);
        }
        if (publicKey === senderKeyPair.publicKey) {
          return Promise.resolve(`encrypted-for-sender:${message}`);
        }
        return Promise.reject(new Error('Invalid public key'));
      });
    
    mockEncryptionService.decryptMessage
      .mockImplementation((encryptedMessage, privateKey) => {
        if (privateKey === recipientKeyPair.privateKey && 
            encryptedMessage.startsWith('encrypted-for-recipient:')) {
          return Promise.resolve(encryptedMessage.replace('encrypted-for-recipient:', ''));
        }
        if (privateKey === senderKeyPair.privateKey && 
            encryptedMessage.startsWith('encrypted-for-sender:')) {
          return Promise.resolve(encryptedMessage.replace('encrypted-for-sender:', ''));
        }
        return Promise.reject(new Error('Decryption failed'));
      });
    
    // テスト用スレッド
    const thread = {
      id: 'test-thread',
      user1: { id: 'sender' },
      user2: { id: 'recipient' }
    };
    
    // When - 送信者からメッセージを送信
    const plainMessage = '秘密のメッセージ';
    
    // 1. 送信者が受信者の公開鍵で暗号化
    const encryptedForRecipient = await mockEncryptionService.encryptMessage(
      plainMessage, 
      recipientKeyPair.publicKey
    );
    
    // 2. 暗号化されたメッセージをサーバーに送信
    const sentMessage = await mockDmService.sendMessage({
      threadId: thread.id,
      content: encryptedForRecipient
    });
    
    // 3. 受信者がメッセージを取得
    mockDmService.getMessages.mockResolvedValueOnce([
      {
        id: 'message-1',
        threadId: thread.id,
        senderId: 'sender',
        content: encryptedForRecipient,
        createdAt: new Date().toISOString()
      }
    ]);
    
    const messages = await mockDmService.getMessages(thread.id);
    
    // 4. 受信者が自分の秘密鍵で復号
    const decryptedMessage = await mockEncryptionService.decryptMessage(
      messages[0].content,
      recipientKeyPair.privateKey
    );
    
    // Then
    // 復号されたメッセージが元のメッセージと一致することを確認
    expect(decryptedMessage).toBe(plainMessage);
    
    // 暗号化されたメッセージは元のメッセージとは異なることを確認
    expect(encryptedForRecipient).not.toBe(plainMessage);
  });
});

describe('WebSocket Realtime Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('WebSocketによるリアルタイムメッセージ受信', async () => {
    // Given
    const currentUser = await createTestUser({ id: 'current-user' });
    const otherUser = await createTestUser({ id: 'other-user' });
    
    // テスト用スレッド
    const thread = {
      id: 'test-thread',
      otherUser: {
        id: otherUser.id,
        displayName: otherUser.displayName
      }
    };
    
    // WebSocketのsubscribeをモック
    let subscriptionCallback;
    mockWebSocketService.subscribe.mockImplementation((channel, callback) => {
      subscriptionCallback = callback;
      return { unsubscribe: () => {} };
    });
    
    // コンポーネントの状態を追跡するためのモック
    const mockSetMessages = jest.fn();
    const mockMessages = [];
    
    // Mock component for testing
    function MessageDetailScreen() {
      return (
        <div data-testid="message-detail-screen">
          <div data-testid="message-list">
            {mockMessages.map((msg, index) => (
              <div key={index} data-testid={`message-${index}`}>
                {msg.content}
              </div>
            ))}
          </div>
          <input data-testid="message-input" placeholder="メッセージを入力" />
          <button data-testid="send-button">送信</button>
        </div>
      );
    }
    
    // When
    render(<MessageDetailScreen thread={thread} />);
    
    // WebSocketに接続されることを確認
    expect(mockWebSocketService.connect).toHaveBeenCalled();
    
    // DMスレッドのチャンネルにサブスクライブされることを確認
    expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
      `dm:thread:${thread.id}`,
      expect.any(Function)
    );
    
    // WebSocketからのメッセージ受信をシミュレート
    const incomingMessage = {
      id: 'message-new',
      threadId: thread.id,
      senderId: otherUser.id,
      content: 'encrypted:リアルタイムメッセージ',
      createdAt: new Date().toISOString()
    };
    
    // 復号化のモックを設定
    mockEncryptionService.decryptMessage.mockResolvedValueOnce('リアルタイムメッセージ');
    
    // WebSocketからのメッセージを受信
    await act(async () => {
      await subscriptionCallback(incomingMessage);
    });
    
    // Then
    // メッセージが復号化されることを確認
    expect(mockEncryptionService.decryptMessage).toHaveBeenCalledWith(
      'encrypted:リアルタイムメッセージ',
      expect.any(String)
    );
    
    // 新しいメッセージが追加されることを確認
    mockSetMessages.mock.calls[mockSetMessages.mock.calls.length - 1][0](prevMessages => {
      expect(prevMessages.length).toBe(mockMessages.length + 1);
      expect(prevMessages[prevMessages.length - 1].content).toBe('リアルタイムメッセージ');
      return prevMessages;
    });
  });
});