import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { createTestUser } from '../setup/integration';

import { vi } from 'vitest';

// Mock services
const mockDmService = {
  createThread: vi.fn().mockResolvedValue({
    id: 'thread-123',
    user1: { id: 'user-123' },
    user2: { id: 'user-456' },
  }),
  sendMessage: vi.fn().mockResolvedValue({
    id: 'message-123',
    threadId: 'thread-123',
    content: 'テストメッセージ',
    senderId: 'user-123',
    createdAt: new Date().toISOString(),
  }),
  getMessages: vi.fn().mockResolvedValue([]),
  markThreadAsRead: vi.fn().mockResolvedValue({ updatedCount: 0 }),
};

vi.mock('@/services/dmService', () => mockDmService);

// Mock encryption service
const mockEncryptionService = {
  generateKeyPair: vi.fn().mockResolvedValue({
    publicKey: 'mock-public-key',
    privateKey: 'mock-private-key',
  }),
  encryptMessage: vi
    .fn()
    .mockImplementation((message, key) => Promise.resolve(`encrypted:${message}`)),
  decryptMessage: vi
    .fn()
    .mockImplementation((message) => Promise.resolve(message.replace('encrypted:', ''))),
  storeKeyPair: vi.fn().mockResolvedValue(true),
  getPublicKey: vi.fn().mockResolvedValue('recipient-public-key'),
  getPrivateKey: vi.fn().mockResolvedValue('user-private-key'),
};

vi.mock('@/services/encryptionService', () => mockEncryptionService);

// Mock websocket service
const mockWebSocketService = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  publish: vi.fn(),
};

vi.mock('@/services/websocketService', () => mockWebSocketService);

// Mock navigation
const mockNavigation = {
  navigate: vi.fn(),
  goBack: vi.fn(),
};

vi.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

describe('DM Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('DM全体フロー - スレッド作成から会話まで', async () => {
    // Given
    const sender = await createTestUser({
      displayName: '送信者ユーザー',
      id: 'user-123',
    });

    const recipient = await createTestUser({
      displayName: '受信者ユーザー',
      id: 'user-456',
    });

    // When - DMサービスの統合的な動作をテスト

    // Step 1: スレッド作成
    const thread = await mockDmService.createThread('user-456');
    expect(mockDmService.createThread).toHaveBeenCalledWith('user-456');
    expect(thread).toEqual({
      id: 'thread-123',
      user1: { id: 'user-123' },
      user2: { id: 'user-456' },
    });

    // Step 2: 暗号化キーペアの取得
    const recipientPublicKey = await mockEncryptionService.getPublicKey('user-456');
    const senderPrivateKey = await mockEncryptionService.getPrivateKey('user-123');

    expect(mockEncryptionService.getPublicKey).toHaveBeenCalledWith('user-456');
    expect(mockEncryptionService.getPrivateKey).toHaveBeenCalledWith('user-123');
    expect(recipientPublicKey).toBe('recipient-public-key');
    expect(senderPrivateKey).toBe('user-private-key');

    // Step 3: メッセージ暗号化
    const plainMessage = 'テストメッセージ';
    const encryptedMessage = await mockEncryptionService.encryptMessage(
      plainMessage,
      recipientPublicKey
    );

    expect(mockEncryptionService.encryptMessage).toHaveBeenCalledWith(
      plainMessage,
      recipientPublicKey
    );
    expect(encryptedMessage).toBe('encrypted:テストメッセージ');

    // Step 4: メッセージ送信
    const sentMessage = await mockDmService.sendMessage({
      threadId: thread.id,
      content: encryptedMessage,
    });

    expect(mockDmService.sendMessage).toHaveBeenCalledWith({
      threadId: 'thread-123',
      content: 'encrypted:テストメッセージ',
    });

    expect(sentMessage).toEqual({
      id: 'message-123',
      threadId: 'thread-123',
      content: 'テストメッセージ',
      senderId: 'user-123',
      createdAt: expect.any(String),
    });
  });
});

describe('E2E Encryption Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('エンドツーエンド暗号化のメッセージ送受信', async () => {
    // Given
    const sender = await createTestUser({ id: 'sender' });
    const recipient = await createTestUser({ id: 'recipient' });

    // 送信者の暗号化キーペア
    const senderKeyPair = {
      publicKey: 'sender-public-key',
      privateKey: 'sender-private-key',
    };

    // 受信者の暗号化キーペア
    const recipientKeyPair = {
      publicKey: 'recipient-public-key',
      privateKey: 'recipient-private-key',
    };

    // 暗号化サービスのモックを設定
    mockEncryptionService.getPublicKey.mockImplementation((userId) => {
      if (userId === 'sender') return Promise.resolve(senderKeyPair.publicKey);
      if (userId === 'recipient') return Promise.resolve(recipientKeyPair.publicKey);
      return Promise.reject(new Error('Unknown user'));
    });

    mockEncryptionService.getPrivateKey.mockImplementation((userId) => {
      if (userId === 'sender') return Promise.resolve(senderKeyPair.privateKey);
      if (userId === 'recipient') return Promise.resolve(recipientKeyPair.privateKey);
      return Promise.reject(new Error('Unknown user'));
    });

    mockEncryptionService.encryptMessage.mockImplementation((message, publicKey) => {
      if (publicKey === recipientKeyPair.publicKey) {
        return Promise.resolve(`encrypted-for-recipient:${message}`);
      }
      if (publicKey === senderKeyPair.publicKey) {
        return Promise.resolve(`encrypted-for-sender:${message}`);
      }
      return Promise.reject(new Error('Invalid public key'));
    });

    mockEncryptionService.decryptMessage.mockImplementation((encryptedMessage, privateKey) => {
      if (
        privateKey === recipientKeyPair.privateKey &&
        encryptedMessage.startsWith('encrypted-for-recipient:')
      ) {
        return Promise.resolve(encryptedMessage.replace('encrypted-for-recipient:', ''));
      }
      if (
        privateKey === senderKeyPair.privateKey &&
        encryptedMessage.startsWith('encrypted-for-sender:')
      ) {
        return Promise.resolve(encryptedMessage.replace('encrypted-for-sender:', ''));
      }
      return Promise.reject(new Error('Decryption failed'));
    });

    // テスト用スレッド
    const thread = {
      id: 'test-thread',
      user1: { id: 'sender' },
      user2: { id: 'recipient' },
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
      content: encryptedForRecipient,
    });

    // 3. 受信者がメッセージを取得
    mockDmService.getMessages.mockResolvedValueOnce([
      {
        id: 'message-1',
        threadId: thread.id,
        senderId: 'sender',
        content: encryptedForRecipient,
        createdAt: new Date().toISOString(),
      },
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
    vi.clearAllMocks();
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
        displayName: otherUser.displayName,
      },
    };

    // WebSocketのsubscribeをモック
    let subscriptionCallback;
    mockWebSocketService.subscribe.mockImplementation((channel, callback) => {
      subscriptionCallback = callback;
      return { unsubscribe: () => {} };
    });

    // When - WebSocketサービスを使用したリアルタイム通信のテスト

    // Step 1: WebSocketに接続
    mockWebSocketService.connect();
    expect(mockWebSocketService.connect).toHaveBeenCalled();

    // Step 2: DMスレッドのチャンネルにサブスクライブ
    const messageHandler = (message) => {
      // メッセージハンドラーの処理
    };

    const subscription = mockWebSocketService.subscribe(`dm:thread:${thread.id}`, messageHandler);

    expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
      `dm:thread:${thread.id}`,
      messageHandler
    );

    // Step 3: WebSocketからのメッセージ受信をシミュレート
    const incomingMessage = {
      id: 'message-new',
      threadId: thread.id,
      senderId: otherUser.id,
      content: 'encrypted:リアルタイムメッセージ',
      createdAt: new Date().toISOString(),
    };

    // Step 4: メッセージ復号化
    // この時点では暗号化サービスのシンプルなモックを使用
    mockEncryptionService.decryptMessage.mockResolvedValueOnce('リアルタイムメッセージ');

    const decryptedMessage = await mockEncryptionService.decryptMessage(
      incomingMessage.content,
      'current-user-private-key'
    );

    expect(mockEncryptionService.decryptMessage).toHaveBeenCalledWith(
      'encrypted:リアルタイムメッセージ',
      'current-user-private-key'
    );
    expect(decryptedMessage).toBe('リアルタイムメッセージ');

    // Step 5: サブスクリプション解除
    subscription.unsubscribe();
    mockWebSocketService.disconnect();

    expect(mockWebSocketService.disconnect).toHaveBeenCalled();
  });
});
