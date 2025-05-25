import { supabase } from './supabase';
import { db } from './db/client';
import { dmThreads, directMessages } from './db/schema/messaging';
import { profiles } from './db/schema/profile';
import { eq, and, or, desc, gt, inArray } from 'drizzle-orm';
import { uploadToB2 } from './b2Service';
import type { User } from '@supabase/supabase-js';

// Types
export interface DmThread {
  id: string;
  participants: DmParticipant[];
  createdAt: Date;
  lastMessage?: DmMessage;
  unreadCount?: number;
}

export interface DmParticipant {
  id: string;
  displayName: string;
  profileImage: string | null;
}

export interface DmMessage {
  id: string;
  threadId: string;
  senderId: string;
  messageType: 'text' | 'image' | 'audio';
  content: string;
  mediaUrl?: string | null;
  isRead: boolean;
  createdAt: Date;
  encrypted?: boolean;
}

export interface SendMessageData {
  threadId: string;
  content: string;
  imageFile?: File;
  audioFile?: File;
  encrypted?: boolean;
}

export interface GetMessagesOptions {
  limit?: number;
  page?: number;
  since?: Date;
}

// Error messages
const ERROR_MESSAGES = {
  SELF_MESSAGE: '自分自身にDMを送ることはできません',
  USER_NOT_FOUND: 'ユーザーが見つかりません',
  THREAD_NOT_FOUND: 'スレッドが見つかりません',
  EMPTY_MESSAGE: 'メッセージ内容は必須です',
  UNAUTHORIZED: '認証が必要です',
  INVALID_THREAD: '無効なスレッドです'
};

export class DmService {
  private async getCurrentUser(): Promise<User> {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
    }
    return data.user;
  }

  /**
   * Create or get a DM thread between two users
   */
  async createThread(recipientUserId: string): Promise<DmThread> {
    const currentUser = await this.getCurrentUser();
    
    // Validate not sending to self
    if (currentUser.id === recipientUserId) {
      throw new Error(ERROR_MESSAGES.SELF_MESSAGE);
    }

    // Check if recipient exists
    const recipientProfile = await db.select()
      .from(profiles)
      .where(eq(profiles.id, recipientUserId))
      .execute();

    if (!recipientProfile.length) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Ensure consistent ordering for unique constraint
    const [user1Id, user2Id] = [currentUser.id, recipientUserId].sort();

    // Check for existing thread
    const existingThread = await db.query.dmThreads.findFirst({
      where: and(
        eq(dmThreads.user1Id, user1Id),
        eq(dmThreads.user2Id, user2Id)
      )
    });

    let thread;
    if (existingThread) {
      thread = existingThread;
    } else {
      // Create new thread
      const [newThread] = await db.insert(dmThreads)
        .values({
          user1Id,
          user2Id
        })
        .returning();
      thread = newThread;
    }

    // Get participant profiles
    const participantProfiles = await db.select()
      .from(profiles)
      .where(
        or(
          eq(profiles.id, currentUser.id),
          eq(profiles.id, recipientUserId)
        )
      )
      .execute();

    const participants: DmParticipant[] = participantProfiles.map(p => ({
      id: p.id,
      displayName: p.displayName || 'Unknown User',
      profileImage: p.profileImage
    }));

    return {
      id: thread.id,
      participants,
      createdAt: thread.createdAt
    };
  }

  /**
   * Send a message in a DM thread
   */
  async sendMessage(data: SendMessageData): Promise<DmMessage> {
    const currentUser = await this.getCurrentUser();
    
    // Validate message content
    if (!data.content.trim() && !data.imageFile && !data.audioFile) {
      throw new Error(ERROR_MESSAGES.EMPTY_MESSAGE);
    }

    // Validate thread exists and user is participant
    const thread = await db.select()
      .from(dmThreads)
      .where(eq(dmThreads.id, data.threadId))
      .execute();

    if (!thread.length) {
      throw new Error(ERROR_MESSAGES.THREAD_NOT_FOUND);
    }

    const threadData = thread[0];
    if (threadData.user1Id !== currentUser.id && threadData.user2Id !== currentUser.id) {
      throw new Error(ERROR_MESSAGES.INVALID_THREAD);
    }

    let messageType: 'text' | 'image' | 'audio' = 'text';
    let mediaUrl: string | null = null;
    let textContent = data.content;

    // Handle image upload
    if (data.imageFile) {
      messageType = 'image';
      const fileName = `dm/${data.threadId}/${Date.now()}-${data.imageFile.name}`;
      const uploadResult = await uploadToB2(data.imageFile, fileName);
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Failed to upload image');
      }
      mediaUrl = uploadResult.url;
    }

    // Handle audio upload
    if (data.audioFile) {
      messageType = 'audio';
      const fileName = `dm/${data.threadId}/${Date.now()}-${data.audioFile.name}`;
      const uploadResult = await uploadToB2(data.audioFile, fileName);
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Failed to upload audio');
      }
      mediaUrl = uploadResult.url;
    }

    // Handle encryption if requested
    if (data.encrypted) {
      const recipientId = threadData.user1Id === currentUser.id 
        ? threadData.user2Id 
        : threadData.user1Id;
      textContent = await this.encryptMessage(textContent, recipientId);
    }

    // Insert message
    const [newMessage] = await db.insert(directMessages)
      .values({
        threadId: data.threadId,
        senderId: currentUser.id,
        messageType,
        textContent,
        mediaUrl,
        isRead: false
      })
      .returning();

    return {
      id: newMessage.id,
      threadId: newMessage.threadId,
      senderId: newMessage.senderId,
      messageType: newMessage.messageType,
      content: data.encrypted ? textContent : newMessage.textContent || '',
      mediaUrl: newMessage.mediaUrl,
      isRead: newMessage.isRead,
      createdAt: newMessage.createdAt,
      encrypted: data.encrypted
    };
  }

  /**
   * Get messages from a thread
   */
  async getMessages(
    threadId: string, 
    options: GetMessagesOptions = {}
  ): Promise<DmMessage[]> {
    const { limit = 50, page = 1, since } = options;
    const offset = (page - 1) * limit;

    // Build base conditions
    const conditions = [eq(directMessages.threadId, threadId)];
    if (since) {
      conditions.push(gt(directMessages.createdAt, since));
    }

    // Execute query with pagination
    const messages = await db.select()
      .from(directMessages)
      .where(and(...conditions))
      .orderBy(desc(directMessages.createdAt))
      .limit(limit)
      .offset(offset)
      .execute();

    if (!messages.length && page === 1) {
      // Verify thread exists
      const thread = await db.select()
        .from(dmThreads)
        .where(eq(dmThreads.id, threadId))
        .execute();
      
      if (!thread.length) {
        throw new Error(ERROR_MESSAGES.THREAD_NOT_FOUND);
      }
    }

    // Transform to DmMessage format
    return messages.map(msg => ({
      id: msg.id,
      threadId: msg.threadId,
      senderId: msg.senderId,
      messageType: msg.messageType,
      content: msg.textContent || '',
      mediaUrl: msg.mediaUrl,
      isRead: msg.isRead,
      createdAt: msg.createdAt
    }));
  }

  /**
   * Mark messages in a thread as read
   */
  async markThreadAsRead(threadId: string): Promise<{ updatedCount: number }> {
    const currentUser = await this.getCurrentUser();

    // Verify thread exists
    const thread = await db.select()
      .from(dmThreads)
      .where(eq(dmThreads.id, threadId))
      .execute();
    
    if (!thread.length) {
      throw new Error(ERROR_MESSAGES.THREAD_NOT_FOUND);
    }

    // Update unread messages
    const result = await db.update(directMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(directMessages.threadId, threadId),
          eq(directMessages.isRead, false),
          eq(directMessages.senderId, currentUser.id)
        )
      )
      .execute();

    return { updatedCount: result.rowCount || 0 };
  }

  /**
   * Mark all messages as read
   */
  async markAllAsRead(threadId: string): Promise<{ updatedCount: number }> {
    const currentUser = await this.getCurrentUser();

    // Get all unread messages
    const unreadMessages = await db.select()
      .from(directMessages)
      .where(
        and(
          eq(directMessages.threadId, threadId),
          eq(directMessages.isRead, false),
          eq(directMessages.senderId, currentUser.id)
        )
      )
      .execute();

    if (!unreadMessages.length) {
      return { updatedCount: 0 };
    }

    // Update all at once
    const result = await db.update(directMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(directMessages.threadId, threadId),
          inArray(directMessages.id, unreadMessages.map(m => m.id))
        )
      )
      .execute();

    return { updatedCount: result.rowCount || 0 };
  }

  /**
   * Update last read position
   */
  async updateLastReadPosition(
    threadId: string, 
    lastReadMessageId: string
  ): Promise<{ success: boolean }> {
    const currentUser = await this.getCurrentUser();

    await db.transaction(async (tx) => {
      // Get the timestamp of the last read message
      const lastReadMessages = await tx.select()
        .from(directMessages)
        .where(eq(directMessages.id, lastReadMessageId))
        .execute();
        
      const lastReadMessage = lastReadMessages[0];

      if (!lastReadMessage) {
        throw new Error('Message not found');
      }

      // Update all messages before this timestamp as read
      await tx.update(directMessages)
        .set({ isRead: true })
        .where(
          and(
            eq(directMessages.threadId, threadId),
            eq(directMessages.senderId, currentUser.id),
            gt(lastReadMessage.createdAt, directMessages.createdAt)
          )
        );
    });

    return { success: true };
  }

  /**
   * Encrypt message (placeholder - implement actual E2E encryption)
   */
  private async encryptMessage(content: string, recipientId: string): Promise<string> {
    // TODO: Implement actual E2E encryption
    // This is a placeholder that should be replaced with real encryption
    return `encrypted:${content}`;
  }

  /**
   * Decrypt message (placeholder - implement actual E2E decryption)
   */
  private async decryptMessage(encryptedContent: string): Promise<string> {
    // TODO: Implement actual E2E decryption
    // This is a placeholder that should be replaced with real decryption
    return encryptedContent.replace('encrypted:', '');
  }
}

// Export singleton instance
export const dmService = new DmService();