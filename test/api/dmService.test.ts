import { db } from '@/lib/db/client';
import { directMessages, dmThreads } from '@/lib/db/schema/messaging';
import { profiles } from '@/lib/db/schema/profile';
import type { User } from '@supabase/supabase-js';
import { and, desc, eq, or } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock modules
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      dmThreads: {
        findFirst: vi.fn(),
      },
      directMessages: {
        findMany: vi.fn(),
      },
    },
    transaction: vi.fn(),
  },
}));

vi.mock('@/lib/b2Service', () => ({
  uploadToB2: vi.fn(),
}));

vi.mock('@/lib/cryptoService', () => ({
  cryptoService: {
    encryptMessage: vi.fn(),
    decryptMessage: vi.fn(),
    generateKeyPair: vi.fn(),
    storePublicKey: vi.fn(),
    getUserPublicKey: vi.fn(),
    storePrivateKey: vi.fn(),
    getPrivateKey: vi.fn(),
  },
}));

vi.mock('@/lib/realtimeService', () => ({
  realtimeService: {
    subscribeToThread: vi.fn(),
    unsubscribeFromThread: vi.fn(),
    sendTypingIndicator: vi.fn(),
    updatePresence: vi.fn(),
    getPresenceState: vi.fn(),
    getAllPresenceStates: vi.fn(),
    cleanup: vi.fn(),
    subscribeToUserNotifications: vi.fn(),
  },
}));

import { uploadToB2 } from '@/lib/b2Service';
import { cryptoService } from '@/lib/cryptoService';
// Import after mocks
import { DmService } from '@/lib/dmService';
import { realtimeService } from '@/lib/realtimeService';
import { supabase } from '@/lib/supabase';

describe('DM Service - Thread Creation', () => {
  let dmService: DmService;
  const mockUser: User = {
    id: 'user-123',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dmService = new DmService();

    // Mock authentication
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  it('新規DMスレッドを作成できる', async () => {
    // Arrange
    const recipientUserId = 'user-456';
    const newThreadId = 'thread-123';

    // Mock recipient profile check (first select)
    const mockRecipientCheck = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValueOnce([{ id: recipientUserId, displayName: '受信者' }]),
    };
    vi.mocked(db.select).mockReturnValueOnce(mockRecipientCheck as any);

    // Mock no existing thread
    vi.mocked(db.query.dmThreads.findFirst).mockResolvedValueOnce(undefined);

    // Mock thread creation
    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValueOnce([
        {
          id: newThreadId,
          user1Id: mockUser.id,
          user2Id: recipientUserId,
          createdAt: new Date(),
        },
      ]),
    };
    vi.mocked(db.insert).mockReturnValueOnce(mockInsert as any);

    // Mock user profiles for participants (second select)
    const mockParticipantsSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValueOnce([
        { id: mockUser.id, displayName: 'テストユーザー', profileImage: null },
        { id: recipientUserId, displayName: '受信者', profileImage: null },
      ]),
    };
    vi.mocked(db.select).mockReturnValueOnce(mockParticipantsSelect as any);

    // Act
    const result = await dmService.createThread(recipientUserId);

    // Assert
    expect(result).toMatchObject({
      id: newThreadId,
      participants: expect.arrayContaining([
        expect.objectContaining({ id: mockUser.id }),
        expect.objectContaining({ id: recipientUserId }),
      ]),
    });
  });

  it('既存スレッドが存在する場合は既存スレッドを返す', async () => {
    // Arrange
    const recipientUserId = 'user-456';
    const existingThread = {
      id: 'thread-123',
      user1Id: mockUser.id,
      user2Id: recipientUserId,
      createdAt: new Date(),
    };

    // Mock recipient profile check (first select)
    const mockRecipientCheck = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValueOnce([{ id: recipientUserId, displayName: '受信者' }]),
    };
    vi.mocked(db.select).mockReturnValueOnce(mockRecipientCheck as any);

    // Mock existing thread
    vi.mocked(db.query.dmThreads.findFirst).mockResolvedValueOnce(existingThread);

    // Mock user profiles for participants
    const mockParticipantsSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValueOnce([
        { id: mockUser.id, displayName: 'テストユーザー', profileImage: null },
        { id: recipientUserId, displayName: '受信者', profileImage: null },
      ]),
    };
    vi.mocked(db.select).mockReturnValueOnce(mockParticipantsSelect as any);

    // Act
    const result = await dmService.createThread(recipientUserId);

    // Assert
    expect(result.id).toBe('thread-123');
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('自分自身とのスレッド作成でエラー', async () => {
    // Act & Assert
    await expect(dmService.createThread(mockUser.id)).rejects.toThrow(
      '自分自身にDMを送ることはできません'
    );
  });

  it('存在しないユーザーへのスレッド作成でエラー', async () => {
    // Arrange
    const nonExistentUserId = 'user-999';

    // Mock user profile not found
    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValueOnce([]),
    };
    vi.mocked(db.select).mockReturnValueOnce(mockSelect as any);

    // Act & Assert
    await expect(dmService.createThread(nonExistentUserId)).rejects.toThrow(
      'ユーザーが見つかりません'
    );
  });
});

describe('DM Service - Message Sending', () => {
  let dmService: DmService;
  const mockUser: User = {
    id: 'user-123',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  const thread = {
    id: 'thread-123',
    user1Id: 'user-123',
    user2Id: 'user-456',
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dmService = new DmService();

    // Mock authentication
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  it('テキストメッセージの送信', async () => {
    // Arrange
    const messageData = {
      threadId: thread.id,
      content: 'こんにちは！',
    };

    // Mock thread validation
    const mockThreadSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValueOnce([thread]),
    };
    vi.mocked(db.select).mockReturnValueOnce(mockThreadSelect as any);

    // Mock message insertion
    const newMessage = {
      id: 'message-123',
      threadId: thread.id,
      senderId: mockUser.id,
      messageType: 'text' as const,
      textContent: messageData.content,
      mediaUrl: null,
      isRead: false,
      createdAt: new Date(),
    };

    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValueOnce([newMessage]),
    };
    vi.mocked(db.insert).mockReturnValueOnce(mockInsert as any);

    // Act
    const result = await dmService.sendMessage(messageData);

    // Assert
    expect(result).toMatchObject({
      id: 'message-123',
      threadId: thread.id,
      senderId: mockUser.id,
      content: messageData.content,
      messageType: 'text',
    });
  });

  it('画像添付メッセージの送信', async () => {
    // Arrange
    const messageData = {
      threadId: thread.id,
      content: '写真を送ります',
      imageFile: new File(['test'], 'image.jpg', { type: 'image/jpeg' }),
    };

    // Mock thread validation
    const mockThreadSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValueOnce([thread]),
    };
    vi.mocked(db.select).mockReturnValueOnce(mockThreadSelect as any);

    // Mock file upload (b2Service)
    vi.mocked(uploadToB2).mockResolvedValueOnce({
      success: true,
      url: 'https://cdn.example.com/image.jpg',
    });

    // Mock message insertion
    const newMessage = {
      id: 'message-123',
      threadId: thread.id,
      senderId: mockUser.id,
      messageType: 'image' as const,
      textContent: messageData.content,
      mediaUrl: 'https://cdn.example.com/image.jpg',
      isRead: false,
      createdAt: new Date(),
    };

    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValueOnce([newMessage]),
    };
    vi.mocked(db.insert).mockReturnValueOnce(mockInsert as any);

    // Act
    const result = await dmService.sendMessage(messageData);

    // Assert
    expect(result).toMatchObject({
      id: 'message-123',
      messageType: 'image',
      mediaUrl: 'https://cdn.example.com/image.jpg',
    });
  });

  it('E2E暗号化メッセージの送信', async () => {
    // Arrange
    const messageData = {
      threadId: thread.id,
      content: 'こんにちは！',
      encrypted: true,
    };

    // Mock thread validation
    const mockThreadSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValueOnce([thread]),
    };
    vi.mocked(db.select).mockReturnValueOnce(mockThreadSelect as any);

    // Mock recipient profile lookup for encryption
    const mockProfileSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValueOnce([
        {
          id: 'user-456',
          displayName: '受信者',
          publicKey: 'mock-public-key',
        },
      ]),
    };
    vi.mocked(db.select).mockReturnValueOnce(mockProfileSelect as any);

    // Mock encryption
    vi.mocked(cryptoService.encryptMessage).mockResolvedValueOnce({
      encryptedContent: 'encrypted-content',
      encryptedKey: 'encrypted-key',
      iv: 'encryption-iv',
    });

    // Mock message insertion
    const newMessage = {
      id: 'message-123',
      threadId: thread.id,
      senderId: mockUser.id,
      messageType: 'text' as const,
      textContent: 'encrypted-content',
      mediaUrl: null,
      isRead: false,
      isEncrypted: true,
      encryptedKey: 'encrypted-key',
      encryptionIv: 'encryption-iv',
      createdAt: new Date(),
    };

    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValueOnce([newMessage]),
    };
    vi.mocked(db.insert).mockReturnValueOnce(mockInsert as any);

    // Act
    const result = await dmService.sendMessage(messageData);

    // Assert
    expect(result).toMatchObject({
      id: 'message-123',
      encrypted: true,
    });
  });

  it('空のメッセージ送信でエラー', async () => {
    // Arrange
    const messageData = {
      threadId: thread.id,
      content: '',
    };

    // Act & Assert
    await expect(dmService.sendMessage(messageData)).rejects.toThrow('メッセージ内容は必須です');
  });
});

describe('DM Service - Message History', () => {
  let dmService: DmService;
  const mockUser: User = {
    id: 'user-123',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dmService = new DmService();

    // Mock authentication
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
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
        createdAt: new Date(Date.now() - 2000),
      },
      {
        id: 'message-2',
        threadId: threadId,
        senderId: 'user-456',
        messageType: 'text' as const,
        textContent: 'メッセージ 2',
        mediaUrl: null,
        isRead: false,
        createdAt: new Date(Date.now() - 1000),
      },
    ];

    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValueOnce(messages),
    };
    vi.mocked(db.select).mockReturnValueOnce(mockSelect as any);

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
      createdAt: new Date(Date.now() - (i + 20) * 1000),
    }));

    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValueOnce(messages),
    };
    vi.mocked(db.select).mockReturnValueOnce(mockSelect as any);

    // Act
    const result = await dmService.getMessages(threadId, { limit, page });

    // Assert
    expect(result).toHaveLength(limit);
    expect(mockSelect.offset).toHaveBeenCalledWith(20);
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
        createdAt: new Date('2024-01-02'),
      },
    ];

    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValueOnce(messages),
    };
    vi.mocked(db.select).mockReturnValueOnce(mockSelect as any);

    // Act
    const result = await dmService.getMessages(threadId, { since: sinceDate });

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('新しいメッセージ');
  });

  it('存在しないスレッドでエラー', async () => {
    // Arrange
    const nonExistentThreadId = 'thread-999';

    // Mock empty messages first
    const mockMessageSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValueOnce([]),
    };
    vi.mocked(db.select).mockReturnValueOnce(mockMessageSelect as any);

    // Mock thread not found
    const mockThreadSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValueOnce([]),
    };
    vi.mocked(db.select).mockReturnValueOnce(mockThreadSelect as any);

    // Act & Assert
    await expect(dmService.getMessages(nonExistentThreadId)).rejects.toThrow(
      'スレッドが見つかりません'
    );
  });
});

describe('DM Service - Read Status Management', () => {
  let dmService: DmService;
  const mockUser: User = {
    id: 'user-123',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dmService = new DmService();

    // Mock authentication
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  it('メッセージの既読状態更新', async () => {
    // Arrange
    const threadId = 'thread-123';
    const thread = {
      id: threadId,
      user1Id: 'user-123',
      user2Id: 'user-456',
      createdAt: new Date(),
    };

    // Mock thread exists
    const mockThreadSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValueOnce([thread]),
    };
    vi.mocked(db.select).mockReturnValueOnce(mockThreadSelect as any);

    const mockUpdate = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValueOnce({ rowCount: 3 }),
    };
    vi.mocked(db.update).mockReturnValueOnce(mockUpdate as any);

    // Act
    const result = await dmService.markThreadAsRead(threadId);

    // Assert
    expect(result.updatedCount).toBe(3);
    expect(db.update).toHaveBeenCalledWith(directMessages);
  });

  it('既読ステータスの一括更新', async () => {
    // Arrange
    const threadId = 'thread-123';

    // Mock unread messages
    const unreadMessages = [
      { id: 'msg-1', isRead: false },
      { id: 'msg-2', isRead: false },
      { id: 'msg-3', isRead: false },
    ];

    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValueOnce(unreadMessages),
    };
    vi.mocked(db.select).mockReturnValueOnce(mockSelect as any);

    const mockUpdate = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValueOnce({ rowCount: 3 }),
    };
    vi.mocked(db.update).mockReturnValueOnce(mockUpdate as any);

    // Act
    const result = await dmService.markAllAsRead(threadId);

    // Assert
    expect(result.updatedCount).toBe(3);
  });

  it('最終既読位置の更新', async () => {
    // Arrange
    const threadId = 'thread-123';
    const lastReadMessageId = 'message-456';

    // Mock transaction
    const mockTransaction = vi.fn().mockImplementation(async (fn) => {
      const tx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValueOnce([{ id: lastReadMessageId, createdAt: new Date() }]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
      };
      return fn(tx);
    });
    vi.mocked(db.transaction).mockImplementation(mockTransaction);

    // Act
    const result = await dmService.updateLastReadPosition(threadId, lastReadMessageId);

    // Assert
    expect(result.success).toBe(true);
  });

  it('存在しないスレッドでエラー', async () => {
    // Arrange
    const nonExistentThreadId = 'thread-999';

    // Mock thread not found
    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValueOnce([]),
    };
    vi.mocked(db.select).mockReturnValueOnce(mockSelect as any);

    // Act & Assert
    await expect(dmService.markThreadAsRead(nonExistentThreadId)).rejects.toThrow(
      'スレッドが見つかりません'
    );
  });
});
