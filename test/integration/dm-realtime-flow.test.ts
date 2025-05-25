import { dmService } from '@/lib/dmService';
import { realtimeService } from '@/lib/realtimeService';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock modules
vi.mock('@/lib/supabase');
vi.mock('@/lib/db/client');
vi.mock('@/lib/realtimeService');

describe('DM Realtime Flow Integration', () => {
  let mockUser1: User;
  let mockUser2: User;
  let mockChannel: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock users
    mockUser1 = {
      id: 'user-123',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    mockUser2 = {
      id: 'user-456',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    // Mock channel
    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
      send: vi.fn(),
      track: vi.fn(),
      presenceState: vi.fn().mockReturnValue({}),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('リアルタイムメッセージング', () => {
    it('メッセージ送信時にリアルタイム通知が送られる', async () => {
      // Arrange
      const threadId = 'thread-123';
      const messageHandlers = {
        onNewMessage: vi.fn(),
        onMessageRead: vi.fn(),
        onTyping: vi.fn(),
        onPresenceChange: vi.fn(),
      };

      // Mock auth
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser1 },
        error: null,
      });

      // Mock realtime subscription
      vi.mocked(realtimeService.subscribeToThread).mockResolvedValue(mockChannel);

      // Act
      await dmService.subscribeToThread(threadId, messageHandlers);

      // Verify subscription was created
      expect(realtimeService.subscribeToThread).toHaveBeenCalledWith(
        threadId,
        mockUser1.id,
        expect.objectContaining({
          onNewMessage: expect.any(Function),
          onMessageRead: expect.any(Function),
          onTyping: expect.any(Function),
          onPresenceChange: expect.any(Function),
        })
      );
    });

    it('タイピングインジケーターが正しく動作する', async () => {
      // Arrange
      const threadId = 'thread-123';

      // Mock auth
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser1 },
        error: null,
      });

      // Act
      await dmService.sendTypingIndicator(threadId, true);

      // Assert
      expect(realtimeService.sendTypingIndicator).toHaveBeenCalledWith(
        threadId,
        mockUser1.id,
        true
      );

      // Stop typing
      await dmService.sendTypingIndicator(threadId, false);

      expect(realtimeService.sendTypingIndicator).toHaveBeenCalledWith(
        threadId,
        mockUser1.id,
        false
      );
    });

    it('プレゼンス更新が正しく動作する', async () => {
      // Arrange
      const threadId = 'thread-123';

      // Mock auth
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser1 },
        error: null,
      });

      // Act - Update presence to online
      await dmService.updatePresence(threadId, 'online');

      // Assert
      expect(realtimeService.updatePresence).toHaveBeenCalledWith(threadId, mockUser1.id, 'online');

      // Act - Update presence to typing
      await dmService.updatePresence(threadId, 'typing');

      expect(realtimeService.updatePresence).toHaveBeenCalledWith(threadId, mockUser1.id, 'typing');

      // Act - Update presence to away
      await dmService.updatePresence(threadId, 'away');

      expect(realtimeService.updatePresence).toHaveBeenCalledWith(threadId, mockUser1.id, 'away');
    });

    it('購読解除が正しく動作する', async () => {
      // Arrange
      const threadId = 'thread-123';

      // Act
      await dmService.unsubscribeFromThread(threadId);

      // Assert
      expect(realtimeService.unsubscribeFromThread).toHaveBeenCalledWith(threadId);
    });
  });

  describe('メッセージの暗号化と復号化', () => {
    it('暗号化メッセージの送受信フロー', async () => {
      // This test would require more complex mocking of the encryption service
      // For now, we'll test that the encrypted flag is properly handled

      const threadId = 'thread-123';
      const messageContent = 'Secret message';

      // Mock auth
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser1 },
        error: null,
      });

      // Mock thread validation
      const mockDb = require('@/lib/db/client').db;
      mockDb.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([
          {
            id: threadId,
            user1Id: mockUser1.id,
            user2Id: mockUser2.id,
          },
        ]),
      });

      // Mock encryption service
      const { cryptoService } = require('@/lib/cryptoService');
      vi.mocked(cryptoService.encryptMessage).mockResolvedValue({
        encryptedContent: 'encrypted-content',
        encryptedKey: 'encrypted-key',
        iv: 'encryption-iv',
      });

      // Mock message insertion
      mockDb.insert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: 'msg-123',
            threadId,
            senderId: mockUser1.id,
            messageType: 'text',
            textContent: 'encrypted-content',
            isEncrypted: true,
            encryptedKey: 'encrypted-key',
            encryptionIv: 'encryption-iv',
            isRead: false,
            createdAt: new Date(),
          },
        ]),
      });

      // Act
      const result = await dmService.sendMessage({
        threadId,
        content: messageContent,
        encrypted: true,
      });

      // Assert
      expect(result.encrypted).toBe(true);
      expect(cryptoService.encryptMessage).toHaveBeenCalled();
    });
  });

  describe('メッセージ履歴と既読管理', () => {
    it('スレッドのメッセージを読み込み、既読状態を更新する', async () => {
      // Arrange
      const threadId = 'thread-123';
      const messages = [
        {
          id: 'msg-1',
          threadId,
          senderId: mockUser2.id,
          messageType: 'text',
          textContent: 'Hello',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'msg-2',
          threadId,
          senderId: mockUser1.id,
          messageType: 'text',
          textContent: 'Hi there',
          isRead: true,
          createdAt: new Date(),
        },
      ];

      // Mock auth
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser1 },
        error: null,
      });

      // Mock message fetch
      const mockDb = require('@/lib/db/client').db;
      mockDb.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(messages),
      });

      // Act
      const fetchedMessages = await dmService.getMessages(threadId);

      // Assert
      expect(fetchedMessages).toHaveLength(2);
      expect(fetchedMessages[0].isRead).toBe(false);
      expect(fetchedMessages[1].isRead).toBe(true);

      // Mock read status update
      mockDb.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ rowCount: 1 }),
      });

      // Mark thread as read
      const readResult = await dmService.markThreadAsRead(threadId);
      expect(readResult.updatedCount).toBe(1);
    });
  });

  describe('ユーザースレッド一覧', () => {
    it('ユーザーの全スレッドを最終メッセージ付きで取得する', async () => {
      // Arrange
      const threads = [
        {
          id: 'thread-1',
          user1Id: mockUser1.id,
          user2Id: 'user-789',
          createdAt: new Date(),
        },
        {
          id: 'thread-2',
          user1Id: 'user-999',
          user2Id: mockUser1.id,
          createdAt: new Date(),
        },
      ];

      // Mock auth
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser1 },
        error: null,
      });

      // Mock thread fetch
      const mockDb = require('@/lib/db/client').db;
      let callCount = 0;
      mockDb.select = vi.fn().mockImplementation(() => {
        const mock = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          execute: vi.fn(),
        };

        // First call returns threads
        if (callCount === 0) {
          mock.execute.mockResolvedValue(threads);
        }
        // Subsequent calls return participant profiles and messages
        else {
          mock.execute.mockResolvedValue([
            { id: mockUser1.id, displayName: 'Current User', profileImage: null },
            { id: 'user-789', displayName: 'Other User', profileImage: null },
          ]);
        }

        callCount++;
        return mock;
      });

      // Act
      const userThreads = await dmService.getUserThreads();

      // Assert
      expect(userThreads).toHaveLength(2);
      expect(userThreads[0].participants).toHaveLength(2);
    });
  });
});
