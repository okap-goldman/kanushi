/**
 * Real-time Service for Direct Messages
 *
 * This service handles real-time messaging using Supabase Realtime channels
 * for instant message delivery and presence tracking.
 */

import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Types
export interface RealtimeMessage {
  id: string;
  threadId: string;
  senderId: string;
  messageType: 'text' | 'image' | 'audio';
  content: string;
  mediaUrl?: string;
  createdAt: Date;
  isRead: boolean;
}

export interface PresenceState {
  userId: string;
  status: 'online' | 'typing' | 'away';
  lastSeen: Date;
}

export interface MessageHandler {
  onNewMessage: (message: RealtimeMessage) => void;
  onMessageRead: (messageId: string, readBy: string) => void;
  onTyping: (userId: string, isTyping: boolean) => void;
  onPresenceChange: (userId: string, presence: PresenceState) => void;
}

export class RealtimeService {
  private channels = new Map<string, RealtimeChannel>();
  private presenceStates = new Map<string, PresenceState>();

  /**
   * Subscribe to a DM thread for real-time updates
   */
  async subscribeToThread(
    threadId: string,
    userId: string,
    handlers: MessageHandler
  ): Promise<RealtimeChannel> {
    // Clean up existing subscription if any
    await this.unsubscribeFromThread(threadId);

    // Create a channel for this thread
    const channel = supabase.channel(`dm_thread:${threadId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    // Subscribe to new messages
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_message',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const newMessage = this.transformDatabaseMessage(payload.new);
          handlers.onNewMessage(newMessage);
        }
      )
      // Subscribe to message read status updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_message',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.new.is_read && !payload.old.is_read) {
            handlers.onMessageRead(payload.new.id, userId);
          }
        }
      )
      // Subscribe to presence updates
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        Object.entries(state).forEach(([userId, userStates]) => {
          if (Array.isArray(userStates) && userStates.length > 0) {
            const latestState = userStates[0] as any;
            const presence: PresenceState = {
              userId,
              status: latestState.status || 'online',
              lastSeen: new Date(latestState.lastSeen || Date.now()),
            };
            this.presenceStates.set(userId, presence);
            handlers.onPresenceChange(userId, presence);
          }
        });
      })
      // Subscribe to typing indicators
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        handlers.onTyping(payload.userId, payload.isTyping);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Send initial presence
          await channel.track({
            status: 'online',
            lastSeen: new Date().toISOString(),
          });
        }
      });

    // Store channel reference
    this.channels.set(threadId, channel);
    return channel;
  }

  /**
   * Unsubscribe from a DM thread
   */
  async unsubscribeFromThread(threadId: string): Promise<void> {
    const channel = this.channels.get(threadId);
    if (channel) {
      await channel.unsubscribe();
      this.channels.delete(threadId);
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(threadId: string, userId: string, isTyping: boolean): Promise<void> {
    const channel = this.channels.get(threadId);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping },
      });
    }
  }

  /**
   * Update user presence status
   */
  async updatePresence(
    threadId: string,
    userId: string,
    status: 'online' | 'typing' | 'away'
  ): Promise<void> {
    const channel = this.channels.get(threadId);
    if (channel) {
      await channel.track({
        status,
        lastSeen: new Date().toISOString(),
      });
    }
  }

  /**
   * Get current presence state for a user
   */
  getPresenceState(userId: string): PresenceState | undefined {
    return this.presenceStates.get(userId);
  }

  /**
   * Get all active presence states
   */
  getAllPresenceStates(): Map<string, PresenceState> {
    return new Map(this.presenceStates);
  }

  /**
   * Clean up all subscriptions
   */
  async cleanup(): Promise<void> {
    const unsubscribePromises = Array.from(this.channels.keys()).map((threadId) =>
      this.unsubscribeFromThread(threadId)
    );
    await Promise.all(unsubscribePromises);
    this.presenceStates.clear();
  }

  /**
   * Transform database message to RealtimeMessage type
   */
  private transformDatabaseMessage(dbMessage: any): RealtimeMessage {
    return {
      id: dbMessage.id,
      threadId: dbMessage.thread_id,
      senderId: dbMessage.sender_id,
      messageType: dbMessage.message_type,
      content: dbMessage.text_content || '',
      mediaUrl: dbMessage.media_url,
      createdAt: new Date(dbMessage.created_at),
      isRead: dbMessage.is_read,
    };
  }

  /**
   * Subscribe to user's message notifications across all threads
   */
  async subscribeToUserNotifications(
    userId: string,
    onNewMessage: (message: RealtimeMessage) => void
  ): Promise<RealtimeChannel> {
    const channel = supabase.channel(`user_notifications:${userId}`);

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_message',
          // This would need a more complex filter in production
          // to only get messages for threads the user is part of
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          // Verify user is part of this thread
          const threadId = payload.new.thread_id;
          const { data: thread } = await supabase
            .from('dm_thread')
            .select('*')
            .eq('id', threadId)
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
            .single();

          if (thread) {
            const newMessage = this.transformDatabaseMessage(payload.new);
            onNewMessage(newMessage);
          }
        }
      )
      .subscribe();

    return channel;
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
