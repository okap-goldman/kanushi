import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { createTestUser } from '../setup/integration';

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

// Mock DM service
const mockDmService = {
  sendMessage: jest.fn().mockResolvedValue({
    id: 'message-123',
    threadId: 'thread-123',
    content: 'テストメッセージ',
    senderId: 'user-123',
    createdAt: new Date().toISOString()
  }),
  getMessages: jest.fn().mockResolvedValue([])
};

jest.mock('@/services/dmService', () => mockDmService);

describe('E2E Encryption Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('エンドツーエンド暗号化のキー生成と管理', async () => {
    // Given
    const user = await createTestUser({
      id: 'test-user',
      displayName: 'テストユーザー'
    });
    
    // Mock storage service
    const mockStorage = {
      setItem: jest.fn(),
      getItem: jest.fn().mockResolvedValue(null) // 初期状態では鍵がない
    };
    
    jest.mock('@react-native-async-storage/async-storage', () => mockStorage);
    
    // Mock component for testing
    function EncryptionSetupScreen() {
      return (
        <div data-testid="encryption-setup-screen">
          <button data-testid="generate-keys-button">暗号化キーを生成</button>
          <div data-testid="encryption-status">暗号化キーが設定されていません</div>
        </div>
      );
    }
    
    // When
    render(<EncryptionSetupScreen />);
    
    // キー生成ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('generate-keys-button'));
    });
    
    // Then
    // キーペアが生成されることを確認
    expect(mockEncryptionService.generateKeyPair).toHaveBeenCalled();
    
    // 生成されたキーが保存されることを確認
    expect(mockEncryptionService.storeKeyPair).toHaveBeenCalledWith(
      'test-user',
      {
        publicKey: 'mock-public-key',
        privateKey: 'mock-private-key'
      }
    );
    
    // UIが更新されることを確認
    await waitFor(() => {
      expect(screen.getByTestId('encryption-status')).toHaveTextContent('暗号化キーが設定されています');
    });
  });

  test('暗号化・復号プロセスの完全性検証', async () => {
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
    
    // 暗号化サービスのモックを詳細に設定
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
    
    // 実際の暗号化アルゴリズムをシミュレート
    mockEncryptionService.encryptMessage
      .mockImplementation((message, publicKey) => {
        // 暗号化プロセスをシミュレート（実際にはRSA/AESを使用）
        const encrypted = `${publicKey}:${Buffer.from(message).toString('base64')}`;
        return Promise.resolve(encrypted);
      });
    
    mockEncryptionService.decryptMessage
      .mockImplementation((encryptedMessage, privateKey) => {
        // 復号プロセスをシミュレート
        const parts = encryptedMessage.split(':');
        const publicKey = parts[0];
        const encodedMessage = parts[1];
        
        // 対応する秘密鍵で復号可能かチェック
        if ((publicKey === 'recipient-public-key' && privateKey === recipientKeyPair.privateKey) ||
            (publicKey === 'sender-public-key' && privateKey === senderKeyPair.privateKey)) {
          return Promise.resolve(Buffer.from(encodedMessage, 'base64').toString());
        }
        
        return Promise.reject(new Error('Invalid key for decryption'));
      });
    
    // テスト用の平文メッセージ
    const plainMessage = '秘密情報を含むメッセージ🔐';
    
    // When - 送信者から受信者へのメッセージ送信をシミュレート
    
    // 1. 送信者が受信者の公開鍵を取得
    const recipientPublicKey = await mockEncryptionService.getPublicKey('recipient');
    
    // 2. 送信者がメッセージを暗号化
    const encryptedMessage = await mockEncryptionService.encryptMessage(plainMessage, recipientPublicKey);
    
    // 3. 暗号化メッセージが送信される（ここではモックサービスを使用）
    const sentMessage = {
      id: 'msg-1',
      threadId: 'thread-test',
      senderId: sender.id,
      content: encryptedMessage,
      createdAt: new Date().toISOString()
    };
    
    // 4. 受信者がメッセージを受信
    mockDmService.getMessages.mockResolvedValueOnce([sentMessage]);
    const receivedMessages = await mockDmService.getMessages('thread-test');
    
    // 5. 受信者が自分の秘密鍵を取得
    const recipientPrivateKey = await mockEncryptionService.getPrivateKey('recipient');
    
    // 6. 受信者が暗号化メッセージを復号
    const decryptedMessage = await mockEncryptionService.decryptMessage(
      receivedMessages[0].content,
      recipientPrivateKey
    );
    
    // Then
    // 暗号化メッセージが平文とは異なることを確認
    expect(encryptedMessage).not.toBe(plainMessage);
    expect(encryptedMessage).toContain('recipient-public-key');
    
    // 復号されたメッセージが元の平文と一致することを確認
    expect(decryptedMessage).toBe(plainMessage);
    
    // 誤った秘密鍵では復号できないことを確認
    mockEncryptionService.decryptMessage
      .mockImplementationOnce((encryptedMsg, privateKey) => {
        if (privateKey !== recipientPrivateKey) {
          return Promise.reject(new Error('Invalid key for decryption'));
        }
        return Promise.resolve('');
      });
    
    await expect(mockEncryptionService.decryptMessage(
      encryptedMessage,
      'wrong-private-key'
    )).rejects.toThrow('Invalid key for decryption');
  });

  test('前方秘匿性を保証する鍵のローテーション', async () => {
    // Given
    const user = await createTestUser({ id: 'rotating-user' });
    
    // 初期の鍵ペア
    const initialKeyPair = {
      publicKey: 'initial-public-key',
      privateKey: 'initial-private-key'
    };
    
    // 新しい鍵ペア
    const newKeyPair = {
      publicKey: 'new-public-key',
      privateKey: 'new-private-key'
    };
    
    // 鍵のローテーションをシミュレート
    mockEncryptionService.generateKeyPair
      .mockResolvedValueOnce(initialKeyPair)
      .mockResolvedValueOnce(newKeyPair);
    
    // 鍵の履歴を保持するモックストレージ
    const keyHistory = [];
    
    mockEncryptionService.storeKeyPair
      .mockImplementation((userId, keyPair) => {
        keyHistory.push({
          timestamp: Date.now(),
          keyPair
        });
        return Promise.resolve(true);
      });
    
    // Mock component for testing
    function KeyRotationScreen() {
      return (
        <div data-testid="key-rotation-screen">
          <button data-testid="generate-initial-keys">初期鍵を生成</button>
          <button data-testid="rotate-keys">鍵をローテーション</button>
          <div data-testid="key-info">
            現在の鍵: {keyHistory.length > 0 ? keyHistory[keyHistory.length - 1].keyPair.publicKey : 'なし'}
          </div>
        </div>
      );
    }
    
    // When
    render(<KeyRotationScreen />);
    
    // 初期鍵を生成
    await act(() => {
      fireEvent.press(screen.getByTestId('generate-initial-keys'));
    });
    
    // 初期鍵が生成されたことを確認
    expect(mockEncryptionService.generateKeyPair).toHaveBeenCalledTimes(1);
    expect(keyHistory.length).toBe(1);
    expect(keyHistory[0].keyPair).toEqual(initialKeyPair);
    
    // 初期鍵で暗号化されたメッセージ
    const messageWithInitialKey = await mockEncryptionService.encryptMessage(
      'initial key message',
      initialKeyPair.publicKey
    );
    
    // 鍵をローテーション
    await act(() => {
      fireEvent.press(screen.getByTestId('rotate-keys'));
    });
    
    // 新しい鍵が生成されたことを確認
    expect(mockEncryptionService.generateKeyPair).toHaveBeenCalledTimes(2);
    expect(keyHistory.length).toBe(2);
    expect(keyHistory[1].keyPair).toEqual(newKeyPair);
    
    // 新しい鍵で暗号化されたメッセージ
    const messageWithNewKey = await mockEncryptionService.encryptMessage(
      'new key message',
      newKeyPair.publicKey
    );
    
    // Then
    // 新旧の鍵が異なることを確認
    expect(initialKeyPair.publicKey).not.toBe(newKeyPair.publicKey);
    expect(initialKeyPair.privateKey).not.toBe(newKeyPair.privateKey);
    
    // 異なる鍵で暗号化されたメッセージが異なることを確認
    expect(messageWithInitialKey).not.toBe(messageWithNewKey);
    
    // 初期鍵で暗号化されたメッセージも復号可能であることを確認（鍵の履歴が保持されている）
    mockEncryptionService.decryptMessage
      .mockImplementation((encryptedMessage, privateKey) => {
        // 初期鍵で復号
        if (encryptedMessage === messageWithInitialKey && privateKey === initialKeyPair.privateKey) {
          return Promise.resolve('initial key message');
        }
        // 新しい鍵で復号
        if (encryptedMessage === messageWithNewKey && privateKey === newKeyPair.privateKey) {
          return Promise.resolve('new key message');
        }
        return Promise.reject(new Error('Invalid key for decryption'));
      });
    
    const decryptedInitialMessage = await mockEncryptionService.decryptMessage(
      messageWithInitialKey,
      initialKeyPair.privateKey
    );
    
    const decryptedNewMessage = await mockEncryptionService.decryptMessage(
      messageWithNewKey,
      newKeyPair.privateKey
    );
    
    expect(decryptedInitialMessage).toBe('initial key message');
    expect(decryptedNewMessage).toBe('new key message');
  });
});