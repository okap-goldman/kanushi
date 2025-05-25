import { RealtimeService } from '@/lib/realtimeService';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(),
    from: vi.fn(),
  },
}));

describe('Realtime Service', () => {
  let realtimeService: RealtimeService;
  let mockChannel: any;

  beforeEach(() => {
    vi.clearAllMocks();
    realtimeService = new RealtimeService();

    // Create a mock channel
    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockImplementation((callback) => {
        if (callback) {
          callback('SUBSCRIBED');
        }
        return mockChannel;
      }),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
      send: vi.fn().mockResolvedValue({ status: 'ok' }),
      track: vi.fn().mockResolvedValue({ status: 'ok' }),
      presenceState: vi.fn().mockReturnValue({}),
    };

    vi.mocked(supabase.channel).mockReturnValue(mockChannel);
  });

  afterEach(async () => {
    await realtimeService.cleanup();
  });

  describe('Thread Subscription', () => {
    it('DMスレッドに購読できる', async () => {
      // Arrange
      const threadId = 'thread-123';
      const userId = 'user-123';
      const handlers = {
        onNewMessage: vi.fn(),
        onMessageRead: vi.fn(),
        onTyping: vi.fn(),
        onPresenceChange: vi.fn(),
      };

      // Act
      const channel = await realtimeService.subscribeToThread(threadId, userId, handlers);

      // Assert
      expect(supabase.channel).toHaveBeenCalledWith(
        `dm_thread:${threadId}`,
        expect.objectContaining({
          config: {
            presence: {
              key: userId,
            },
          },
        })
      );
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'INSERT',
          schema: 'public',
          table: 'direct_message',
          filter: `thread_id=eq.${threadId}`,
        }),
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
      expect(channel).toBe(mockChannel);
    });

    it('既存の購読を置き換える', async () => {
      // Arrange
      const threadId = 'thread-123';
      const userId = 'user-123';
      const handlers = {
        onNewMessage: vi.fn(),
        onMessageRead: vi.fn(),
        onTyping: vi.fn(),
        onPresenceChange: vi.fn(),
      };

      // Subscribe twice
      await realtimeService.subscribeToThread(threadId, userId, handlers);
      await realtimeService.subscribeToThread(threadId, userId, handlers);

      // Assert
      expect(mockChannel.unsubscribe).toHaveBeenCalledTimes(1);
      expect(supabase.channel).toHaveBeenCalledTimes(2);
    });

    it('購読解除ができる', async () => {
      // Arrange
      const threadId = 'thread-123';
      const userId = 'user-123';
      const handlers = {
        onNewMessage: vi.fn(),
        onMessageRead: vi.fn(),
        onTyping: vi.fn(),
        onPresenceChange: vi.fn(),
      };

      await realtimeService.subscribeToThread(threadId, userId, handlers);

      // Act
      await realtimeService.unsubscribeFromThread(threadId);

      // Assert
      expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Message Handling', () => {
    it('新しいメッセージを受信できる', async () => {
      // Arrange
      const threadId = 'thread-123';
      const userId = 'user-123';
      const handlers = {
        onNewMessage: vi.fn(),
        onMessageRead: vi.fn(),
        onTyping: vi.fn(),
        onPresenceChange: vi.fn(),
      };

      await realtimeService.subscribeToThread(threadId, userId, handlers);

      // Get the INSERT handler
      const insertCall = mockChannel.on.mock.calls.find(
        (call) => call[0] === 'postgres_changes' && call[1].event === 'INSERT'
      );
      const insertHandler = insertCall[2];

      // Simulate new message
      const newMessage = {
        id: 'msg-123',
        thread_id: threadId,
        sender_id: 'user-456',
        message_type: 'text',
        text_content: 'Hello!',
        is_read: false,
        created_at: new Date().toISOString(),
      };

      // Act
      insertHandler({ new: newMessage, old: null });

      // Assert
      expect(handlers.onNewMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'msg-123',
          threadId: threadId,
          senderId: 'user-456',
          messageType: 'text',
          content: 'Hello!',
          isRead: false,
        })
      );
    });

    it('既読状態の更新を受信できる', async () => {
      // Arrange
      const threadId = 'thread-123';
      const userId = 'user-123';
      const handlers = {
        onNewMessage: vi.fn(),
        onMessageRead: vi.fn(),
        onTyping: vi.fn(),
        onPresenceChange: vi.fn(),
      };

      await realtimeService.subscribeToThread(threadId, userId, handlers);

      // Get the UPDATE handler
      const updateCall = mockChannel.on.mock.calls.find(
        (call) => call[0] === 'postgres_changes' && call[1].event === 'UPDATE'
      );
      const updateHandler = updateCall[2];

      // Simulate read status update
      const updatedMessage = {
        id: 'msg-123',
        is_read: true,
      };
      const oldMessage = {
        id: 'msg-123',
        is_read: false,
      };

      // Act
      updateHandler({ new: updatedMessage, old: oldMessage });

      // Assert
      expect(handlers.onMessageRead).toHaveBeenCalledWith('msg-123', userId);
    });
  });

  describe('Typing Indicators', () => {
    it('タイピングインジケーターを送信できる', async () => {
      // Arrange
      const threadId = 'thread-123';
      const userId = 'user-123';
      const handlers = {
        onNewMessage: vi.fn(),
        onMessageRead: vi.fn(),
        onTyping: vi.fn(),
        onPresenceChange: vi.fn(),
      };

      await realtimeService.subscribeToThread(threadId, userId, handlers);

      // Act
      await realtimeService.sendTypingIndicator(threadId, userId, true);

      // Assert
      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping: true },
      });
    });

    it('タイピングインジケーターを受信できる', async () => {
      // Arrange
      const threadId = 'thread-123';
      const userId = 'user-123';
      const handlers = {
        onNewMessage: vi.fn(),
        onMessageRead: vi.fn(),
        onTyping: vi.fn(),
        onPresenceChange: vi.fn(),
      };

      await realtimeService.subscribeToThread(threadId, userId, handlers);

      // Get the broadcast handler
      const broadcastCall = mockChannel.on.mock.calls.find((call) => call[0] === 'broadcast');
      const broadcastHandler = broadcastCall[2];

      // Act
      broadcastHandler({
        payload: { userId: 'user-456', isTyping: true },
      });

      // Assert
      expect(handlers.onTyping).toHaveBeenCalledWith('user-456', true);
    });
  });

  describe('Presence Management', () => {
    it('プレゼンス状態を更新できる', async () => {
      // Arrange
      const threadId = 'thread-123';
      const userId = 'user-123';
      const handlers = {
        onNewMessage: vi.fn(),
        onMessageRead: vi.fn(),
        onTyping: vi.fn(),
        onPresenceChange: vi.fn(),
      };

      await realtimeService.subscribeToThread(threadId, userId, handlers);

      // Act
      await realtimeService.updatePresence(threadId, userId, 'typing');

      // Assert
      expect(mockChannel.track).toHaveBeenCalledWith({
        status: 'typing',
        lastSeen: expect.any(String),
      });
    });

    it('プレゼンス同期イベントを処理できる', async () => {
      // Arrange
      const threadId = 'thread-123';
      const userId = 'user-123';
      const handlers = {
        onNewMessage: vi.fn(),
        onMessageRead: vi.fn(),
        onTyping: vi.fn(),
        onPresenceChange: vi.fn(),
      };

      await realtimeService.subscribeToThread(threadId, userId, handlers);

      // Get the presence handler
      const presenceCall = mockChannel.on.mock.calls.find((call) => call[0] === 'presence');
      const presenceHandler = presenceCall[2];

      // Mock presence state
      mockChannel.presenceState.mockReturnValue({
        'user-456': [
          {
            status: 'online',
            lastSeen: new Date().toISOString(),
          },
        ],
      });

      // Act
      presenceHandler();

      // Assert
      expect(handlers.onPresenceChange).toHaveBeenCalledWith(
        'user-456',
        expect.objectContaining({
          userId: 'user-456',
          status: 'online',
          lastSeen: expect.any(Date),
        })
      );

      // Verify state is stored
      const state = realtimeService.getPresenceState('user-456');
      expect(state).toBeDefined();
      expect(state?.status).toBe('online');
    });
  });

  describe('User Notifications', () => {
    it('ユーザーの全メッセージ通知を購読できる', async () => {
      // Arrange
      const userId = 'user-123';
      const onNewMessage = vi.fn();

      // Mock Supabase query for thread validation
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOr = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'thread-123', user1_id: userId, user2_id: 'user-456' },
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        or: mockOr,
        single: mockSingle,
      } as any);

      // Act
      const channel = await realtimeService.subscribeToUserNotifications(userId, onNewMessage);

      // Assert
      expect(supabase.channel).toHaveBeenCalledWith(`user_notifications:${userId}`);
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'INSERT',
          schema: 'public',
          table: 'direct_message',
        }),
        expect.any(Function)
      );
      expect(channel).toBe(mockChannel);
    });
  });

  describe('Cleanup', () => {
    it('全ての購読をクリーンアップできる', async () => {
      // Arrange
      const handlers = {
        onNewMessage: vi.fn(),
        onMessageRead: vi.fn(),
        onTyping: vi.fn(),
        onPresenceChange: vi.fn(),
      };

      // Subscribe to multiple threads
      await realtimeService.subscribeToThread('thread-1', 'user-123', handlers);
      await realtimeService.subscribeToThread('thread-2', 'user-123', handlers);
      await realtimeService.subscribeToThread('thread-3', 'user-123', handlers);

      // Act
      await realtimeService.cleanup();

      // Assert
      expect(mockChannel.unsubscribe).toHaveBeenCalledTimes(3);
      expect(realtimeService.getAllPresenceStates().size).toBe(0);
    });
  });
});
