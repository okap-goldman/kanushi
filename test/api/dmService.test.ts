import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db/client';
import { dmThreads, directMessages } from '@/lib/db/schema/messaging';
import { profiles } from '@/lib/db/schema/profile';
import { eq, and, or, desc } from 'drizzle-orm';
import type { User } from '@supabase/supabase-js';

// Mock modules
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    }
  }
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      dmThreads: {
        findFirst: vi.fn()
      },
      directMessages: {
        findMany: vi.fn()
      }
    },
    transaction: vi.fn()
  }
}));

// Import after mocks
import { DmService } from '@/lib/dmService';
import { supabase } from '@/lib/supabase';

describe('DM Service - Thread Creation', () => {
  let dmService: DmService;
  const mockUser: User = {
    id: 'user-123',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dmService = new DmService();
    
    // Mock authentication
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
  });

  it('新規DMスレッドを作成できる', async () => {
    // Arrange
    const recipientUserId = 'user-456';
    const newThreadId = 'thread-123';
    
    // Mock no existing thread
    vi.mocked(db.query.dmThreads.findFirst).mockResolvedValueOnce(undefined);
    
    // Mock thread creation
    const mockInsert = vi.fn().mockResolvedValueOnce([{
      id: newThreadId,
      user1Id: mockUser.id,
      user2Id: recipientUserId,
      createdAt: new Date()
    }]);
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      execute: mockInsert
    } as any);
    
    // Mock user profiles
    const mockSelect = vi.fn().mockResolvedValueOnce([
      { id: mockUser.id, displayName: 'テストユーザー', profileImage: null },
      { id: recipientUserId, displayName: '受信者', profileImage: null }
    ]);
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: mockSelect
    } as any);
    
    // Act
    const result = await dmService.createThread(recipientUserId);
    
    // Assert
    expect(result).toMatchObject({
      id: newThreadId,
      participants: expect.arrayContaining([
        expect.objectContaining({ id: mockUser.id }),
        expect.objectContaining({ id: recipientUserId })
      ])
    });
  });

  it('既存スレッドが存在する場合は既存スレッドを返す', async () => {
    // Arrange
    const recipientUserId = 'user-456';
    const existingThread = {
      id: 'thread-123',
      user1Id: mockUser.id,
      user2Id: recipientUserId,
      createdAt: new Date()
    };
    
    // Mock existing thread
    vi.mocked(db.query.dmThreads.findFirst).mockResolvedValueOnce(existingThread);
    
    // Mock user profiles
    const mockSelect = vi.fn().mockResolvedValueOnce([
      { id: mockUser.id, displayName: 'テストユーザー', profileImage: null },
      { id: recipientUserId, displayName: '受信者', profileImage: null }
    ]);
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: mockSelect
    } as any);
    
    // Act
    const result = await dmService.createThread(recipientUserId);
    
    // Assert
    expect(result.id).toBe('thread-123');
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('自分自身とのスレッド作成でエラー', async () => {
    // Act & Assert
    await expect(dmService.createThread(mockUser.id))
      .rejects.toThrow('自分自身にDMを送ることはできません');
  });

  it('存在しないユーザーへのスレッド作成でエラー', async () => {
    // Arrange
    const nonExistentUserId = 'user-999';
    
    // Mock no existing thread
    vi.mocked(db.query.dmThreads.findFirst).mockResolvedValueOnce(undefined);
    
    // Mock user profile not found
    const mockSelect = vi.fn().mockResolvedValueOnce([]);
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: mockSelect
    } as any);
    
    // Act & Assert
    await expect(dmService.createThread(nonExistentUserId))
      .rejects.toThrow('ユーザーが見つかりません');
  });
});

describe('DM Service - Message Sending', () => {
  let dmService: DmService;
  const mockUser: User = {
    id: 'user-123',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
  };
  
  const thread = {
    id: 'thread-123',
    user1Id: 'user-123',
    user2Id: 'user-456',
    createdAt: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dmService = new DmService();
    
    // Mock authentication
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
  });

  it('テキストメッセージの送信', async () => {
    // Arrange
    const messageData = {
      threadId: thread.id,
      content: 'こんにちは！'
    };
    
    // Mock thread validation
    const mockThreadSelect = vi.fn().mockResolvedValueOnce([thread]);
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: mockThreadSelect
    } as any);
    
    // Mock message insertion
    const newMessage = {
      id: 'message-123',
      threadId: thread.id,
      senderId: mockUser.id,
      messageType: 'text' as const,
      textContent: messageData.content,
      mediaUrl: null,
      isRead: false,
      createdAt: new Date()
    };
    
    const mockInsert = vi.fn().mockResolvedValueOnce([newMessage]);
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      execute: mockInsert
    } as any);
    
    // Act
    const result = await dmService.sendMessage(messageData);
    
    // Assert
    expect(result).toMatchObject({
      id: 'message-123',
      threadId: thread.id,
      senderId: mockUser.id,
      content: messageData.content,
      messageType: 'text'
    });
  });

  it('画像添付メッセージの送信', async () => {
    // Arrange
    const messageData = {
      threadId: thread.id,
      content: '写真を送ります',
      imageFile: new File(['test'], 'image.jpg', { type: 'image/jpeg' })
    };
    
    // Mock thread validation
    const mockThreadSelect = vi.fn().mockResolvedValueOnce([thread]);
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: mockThreadSelect
    } as any);
    
    // Mock file upload (b2Service)
    const uploadToB2 = vi.fn().mockResolvedValueOnce('https://cdn.example.com/image.jpg');
    vi.mocked(dmService as any).uploadToB2 = uploadToB2;
    
    // Mock message insertion
    const newMessage = {
      id: 'message-123',
      threadId: thread.id,
      senderId: mockUser.id,
      messageType: 'image' as const,
      textContent: messageData.content,
      mediaUrl: 'https://cdn.example.com/image.jpg',
      isRead: false,
      createdAt: new Date()
    };
    
    const mockInsert = vi.fn().mockResolvedValueOnce([newMessage]);
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      execute: mockInsert
    } as any);
    
    // Act
    const result = await dmService.sendMessage(messageData);
    
    // Assert
    expect(result).toMatchObject({
      id: 'message-123',
      messageType: 'image',
      mediaUrl: 'https://cdn.example.com/image.jpg'
    });
  });

  it('E2E暗号化メッセージの送信', async () => {
    // Arrange
    const messageData = {
      threadId: thread.id,
      content: 'こんにちは！',
      encrypted: true
    };
    
    // Mock thread validation
    const mockThreadSelect = vi.fn().mockResolvedValueOnce([thread]);
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: mockThreadSelect
    } as any);
    
    // Mock encryption
    const mockEncrypt = vi.fn().mockResolvedValueOnce('encrypted-content');
    vi.mocked(dmService as any).encryptMessage = mockEncrypt;
    
    // Mock message insertion
    const newMessage = {
      id: 'message-123',
      threadId: thread.id,
      senderId: mockUser.id,
      messageType: 'text' as const,
      textContent: 'encrypted-content',
      mediaUrl: null,
      isRead: false,
      createdAt: new Date()
    };
    
    const mockInsert = vi.fn().mockResolvedValueOnce([newMessage]);
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      execute: mockInsert
    } as any);
    
    // Act
    const result = await dmService.sendMessage(messageData);
    
    // Assert
    expect(mockEncrypt).toHaveBeenCalledWith(messageData.content, 'user-456');
    expect(result).toMatchObject({
      id: 'message-123',
      encrypted: true
    });
  });

  it('空のメッセージ送信でエラー', async () => {
    // Arrange
    const messageData = {
      threadId: thread.id,
      content: ''
    };
    
    // Act & Assert
    await expect(dmService.sendMessage(messageData))
      .rejects.toThrow('メッセージ内容は必須です');
  });

});

describe('DM Service - Message History', () => {
  let dmService: DmService;
  const mockUser: User = {
    id: 'user-123',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dmService = new DmService();
    
    // Mock authentication
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
  });

  it('スレッドのメッセージ履歴取得', async () => {
    // Arrange
    const threadId = 'thread-123';
    const messages = [
      {
        id: 'message-1',
        threadId: threadId,
        senderId: mockUser.id,
        messageType: 'text' as const,
        textContent: 'メッセージ 1',
        mediaUrl: null,
        isRead: true,
        createdAt: new Date(Date.now() - 2000)
      },
      {
        id: 'message-2',
        threadId: threadId,
        senderId: 'user-456',
        messageType: 'text' as const,
        textContent: 'メッセージ 2',
        mediaUrl: null,
        isRead: false,
        createdAt: new Date(Date.now() - 1000)
      }
    ];
    
    const mockSelect = vi.fn().mockResolvedValueOnce(messages);
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      execute: mockSelect
    } as any);
    
    // Act
    const result = await dmService.getMessages(threadId);
    
    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].content).toBe('メッセージ 1');
    expect(result[1].content).toBe('メッセージ 2');
  });

  it('ページネーションを使った履歴取得', async () => {
    // Arrange
    const threadId = 'thread-123';
    const limit = 20;
    const page = 2;
    
    const messages = Array.from({ length: limit }, (_, i) => ({
      id: `message-${i + 20}`,
      threadId: threadId,
      senderId: 'user-456',
      messageType: 'text' as const,
      textContent: `メッセージ ${i + 20}`,
      mediaUrl: null,
      isRead: false,
      createdAt: new Date(Date.now() - (i + 20) * 1000)
    }));
    
    const mockSelect = vi.fn().mockResolvedValueOnce(messages);
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      execute: mockSelect
    } as any);
    
    // Act
    const result = await dmService.getMessages(threadId, { limit, page });
    
    // Assert
    expect(result).toHaveLength(limit);
    expect(db.select).toHaveBeenCalled();
    expect(vi.mocked(db.select).mock.results[0].value.offset).toHaveBeenCalledWith(20);
  });

  it('特定日付以降のメッセージのみ取得', async () => {
    // Arrange
    const threadId = 'thread-123';
    const sinceDate = new Date('2024-01-01');
    
    const messages = [
      {
        id: 'message-1',
        threadId: threadId,
        senderId: mockUser.id,
        messageType: 'text' as const,
        textContent: '新しいメッセージ',
        mediaUrl: null,
        isRead: true,
        createdAt: new Date('2024-01-02')
      }
    ];
    
    const mockSelect = vi.fn().mockResolvedValueOnce(messages);
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      execute: mockSelect
    } as any);
    
    // Act
    const result = await dmService.getMessages(threadId, { since: sinceDate });
    
    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('新しいメッセージ');
  });

  it('存在しないスレッドでエラー', async () => {
    // Arrange
    const nonExistentThreadId = 'thread-999';
    
    const mockSelect = vi.fn().mockResolvedValueOnce([]);
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      execute: mockSelect
    } as any);
    
    // Act & Assert
    await expect(dmService.getMessages(nonExistentThreadId))
      .rejects.toThrow('スレッドが見つかりません');
  });
});

describe('DM Service - Read Status Management', () => {
  let dmService: DmService;
  const mockUser: User = {
    id: 'user-123',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dmService = new DmService();
    
    // Mock authentication
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
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