import { describe, expect, test, jest, beforeEach } from '@jest/globals';

// Mock Supabase
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis()
};

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}));

// Mock encryption service
const mockEncryptionService = {
  generateKeyPair: jest.fn(),
  encryptMessage: jest.fn(),
  decryptMessage: jest.fn(),
  storeKeyPair: jest.fn(),
  getPublicKey: jest.fn(),
  getPrivateKey: jest.fn()
};

jest.mock('@/services/encryptionService', () => mockEncryptionService);

// Mock file service
const mockFileService = {
  uploadFile: jest.fn(),
  getFileUrl: jest.fn()
};

jest.mock('@/services/fileService', () => mockFileService);

import { dmService } from '@/services/dmService';

describe('DM Service - Thread Creation', () => {
  const currentUser = {
    id: 'user-123',
    displayName: 'テストユーザー'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authentication
    jest.spyOn(global, 'getCurrentUser').mockReturnValue(currentUser);
  });

  test('新規DMスレッドを作成できる', async () => {
    // Arrange
    const recipientUserId = 'user-456';
    
    mockSupabase.select.mockResolvedValueOnce({
      data: null,
      error: null
    });
    
    mockSupabase.insert.mockResolvedValueOnce({
      data: {
        id: 'thread-123',
        user1_id: currentUser.id,
        user2_id: recipientUserId,
        created_at: new Date().toISOString()
      },
      error: null
    });
    
    // Act
    const result = await dmService.createThread(recipientUserId);
    
    // Assert
    expect(result.id).toBe('thread-123');
    expect(result.user1.id).toBe(currentUser.id);
    expect(result.user2.id).toBe(recipientUserId);
    expect(result.createdAt).toBeDefined();
  });

  test('既存スレッドが存在する場合は既存スレッドを返す', async () => {
    // Arrange
    const recipientUserId = 'user-456';
    const existingThread = {
      id: 'thread-123',
      user1_id: currentUser.id,
      user2_id: recipientUserId,
      created_at: new Date().toISOString()
    };
    
    mockSupabase.select.mockResolvedValueOnce({
      data: [existingThread],
      error: null
    });
    
    // Act
    const result = await dmService.createThread(recipientUserId);
    
    // Assert
    expect(result.id).toBe('thread-123');
    expect(mockSupabase.insert).not.toHaveBeenCalled();
  });

  test('自分自身とのスレッド作成でエラー', async () => {
    // Act & Assert
    await expect(dmService.createThread(currentUser.id))
      .rejects.toThrow('自分自身にDMを送ることはできません');
  });
});

describe('DM Service - Message Operations', () => {
  const currentUser = {
    id: 'user-123',
    displayName: 'テストユーザー'
  };
  
  const thread = {
    id: 'thread-123',
    user1_id: 'user-123',
    user2_id: 'user-456'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authentication
    jest.spyOn(global, 'getCurrentUser').mockReturnValue(currentUser);
    
    // Mock encryption
    mockEncryptionService.encryptMessage.mockResolvedValue('encrypted-content');
    mockEncryptionService.decryptMessage.mockImplementation(
      (content) => Promise.resolve(content.replace('encrypted-', ''))
    );
    mockEncryptionService.getPublicKey.mockResolvedValue('recipient-public-key');
  });

  test('E2E暗号化メッセージの送信', async () => {
    // Arrange
    const messageData = {
      content: 'こんにちは！',
      threadId: thread.id
    };
    
    mockSupabase.select.mockResolvedValueOnce({
      data: thread,
      error: null
    });
    
    mockSupabase.insert.mockResolvedValueOnce({
      data: {
        id: 'message-123',
        thread_id: thread.id,
        sender_id: currentUser.id,
        content: 'encrypted-content',
        created_at: new Date().toISOString()
      },
      error: null
    });
    
    // Act
    const result = await dmService.sendMessage(messageData);
    
    // Assert
    expect(result.id).toBe('message-123');
    expect(result.threadId).toBe(thread.id);
    expect(result.senderId).toBe(currentUser.id);
    expect(result.content).toBe('content'); // Decrypted content
    expect(mockEncryptionService.encryptMessage).toHaveBeenCalledWith(
      messageData.content,
      'recipient-public-key'
    );
  });

  test('画像添付メッセージの送信', async () => {
    // Arrange
    const messageData = {
      content: '写真を送ります',
      threadId: thread.id,
      image: {
        uri: 'file:///path/to/image.jpg',
        type: 'image/jpeg',
        name: 'image.jpg'
      }
    };
    
    mockSupabase.select.mockResolvedValueOnce({
      data: thread,
      error: null
    });
    
    mockFileService.uploadFile.mockResolvedValueOnce('image-url');
    
    mockSupabase.insert.mockResolvedValueOnce({
      data: {
        id: 'message-123',
        thread_id: thread.id,
        sender_id: currentUser.id,
        content: 'encrypted-content',
        image_url: 'image-url',
        created_at: new Date().toISOString()
      },
      error: null
    });
    
    // Act
    const result = await dmService.sendMessage(messageData);
    
    // Assert
    expect(result.id).toBe('message-123');
    expect(result.imageUrl).toBe('image-url');
    expect(mockFileService.uploadFile).toHaveBeenCalledWith(
      messageData.image,
      `dm/${thread.id}/${expect.any(String)}`
    );
  });

  test('スレッドの履歴取得と復号化', async () => {
    // Arrange
    const messages = [
      {
        id: 'message-1',
        thread_id: thread.id,
        sender_id: currentUser.id,
        content: 'encrypted-message 1',
        created_at: new Date(Date.now() - 2000).toISOString()
      },
      {
        id: 'message-2',
        thread_id: thread.id,
        sender_id: 'user-456',
        content: 'encrypted-message 2',
        created_at: new Date(Date.now() - 1000).toISOString()
      }
    ];
    
    mockSupabase.select.mockResolvedValueOnce({
      data: messages,
      error: null
    });
    
    // Act
    const result = await dmService.getMessages(thread.id);
    
    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].content).toBe('message 1');
    expect(result[1].content).toBe('message 2');
    expect(mockEncryptionService.decryptMessage).toHaveBeenCalledTimes(2);
  });

  test('メッセージの既読状態更新', async () => {
    // Arrange
    mockSupabase.update.mockResolvedValueOnce({
      data: { affected_rows: 3 },
      error: null
    });
    
    // Act
    const result = await dmService.markThreadAsRead(thread.id);
    
    // Assert
    expect(result.updatedCount).toBe(3);
    expect(mockSupabase.update).toHaveBeenCalledWith({
      read_at: expect.any(String)
    });
  });
});

describe('DM Service - Thread Management', () => {
  const currentUser = {
    id: 'user-123',
    displayName: 'テストユーザー'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global, 'getCurrentUser').mockReturnValue(currentUser);
  });

  test('スレッド一覧取得', async () => {
    // Arrange
    const threads = [
      {
        id: 'thread-1',
        user1_id: currentUser.id,
        user2_id: 'user-456',
        user2: {
          display_name: 'ユーザー2',
          profile_image: 'image2.jpg'
        },
        last_message: {
          content: 'encrypted-こんにちは',
          created_at: new Date().toISOString()
        },
        unread_count: 2
      },
      {
        id: 'thread-2',
        user1_id: 'user-789',
        user2_id: currentUser.id,
        user1: {
          display_name: 'ユーザー3',
          profile_image: 'image3.jpg'
        },
        last_message: {
          content: 'encrypted-おはよう',
          created_at: new Date().toISOString()
        },
        unread_count: 0
      }
    ];
    
    mockSupabase.select.mockResolvedValueOnce({
      data: threads,
      error: null
    });
    
    mockEncryptionService.decryptMessage.mockImplementation(
      (content) => Promise.resolve(content.replace('encrypted-', ''))
    );
    
    // Act
    const result = await dmService.getThreads();
    
    // Assert
    expect(result).toHaveLength(2);
    
    // ユーザー表示名が正しく設定されているか
    expect(result[0].otherUser.displayName).toBe('ユーザー2');
    expect(result[1].otherUser.displayName).toBe('ユーザー3');
    
    // 最新メッセージが復号化されているか
    expect(result[0].lastMessage.content).toBe('こんにちは');
    expect(result[1].lastMessage.content).toBe('おはよう');
    
    // 未読カウントが正しいか
    expect(result[0].unreadCount).toBe(2);
    expect(result[1].unreadCount).toBe(0);
  });

  test('スレッドの検索', async () => {
    // Arrange
    mockSupabase.select.mockResolvedValueOnce({
      data: [
        {
          id: 'thread-1',
          user1_id: currentUser.id,
          user2_id: 'user-456',
          user2: {
            display_name: '検索対象ユーザー',
            profile_image: 'image.jpg'
          },
          last_message: {
            content: 'encrypted-こんにちは',
            created_at: new Date().toISOString()
          }
        }
      ],
      error: null
    });
    
    // Act
    const result = await dmService.searchThreads('検索');
    
    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].otherUser.displayName).toBe('検索対象ユーザー');
  });

  test('スレッドのアーカイブ', async () => {
    // Arrange
    const threadId = 'thread-123';
    
    mockSupabase.update.mockResolvedValueOnce({
      data: { archived_at: new Date().toISOString() },
      error: null
    });
    
    // Act
    const result = await dmService.archiveThread(threadId);
    
    // Assert
    expect(result.success).toBe(true);
    expect(mockSupabase.update).toHaveBeenCalledWith({
      archived_at: expect.any(String)
    });
  });
});