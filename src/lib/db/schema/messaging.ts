import { boolean, check, index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { messageTypeEnum } from './enums';
import { profiles } from './profile';

// DM thread table
export const dmThreads = pgTable(
  'dm_thread',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user1Id: uuid('user1_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    user2Id: uuid('user2_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    user1IdIdx: index('idx_dm_thread_user1_id').on(table.user1Id),
    user2IdIdx: index('idx_dm_thread_user2_id').on(table.user2Id),
    createdAtIdx: index('idx_dm_thread_created_at').on(table.createdAt.desc()),
    uniqueUsers: unique().on(table.user1Id, table.user2Id),
    userOrderCheck: check('user_order_check', 'user1_id < user2_id'),
  })
);

// Direct message table
export const directMessages = pgTable(
  'direct_message',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => dmThreads.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    messageType: messageTypeEnum('message_type').notNull(),
    textContent: text('text_content'),
    mediaUrl: text('media_url'),
    isRead: boolean('is_read').notNull().default(false),
    isEncrypted: boolean('is_encrypted').notNull().default(false),
    encryptedKey: text('encrypted_key'),
    encryptionIv: text('encryption_iv'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    threadIdIdx: index('idx_direct_message_thread_id').on(table.threadId),
    senderIdIdx: index('idx_direct_message_sender_id').on(table.senderId),
    createdAtIdx: index('idx_direct_message_created_at').on(table.createdAt.desc()),
    isReadIdx: index('idx_direct_message_is_read').on(table.isRead),
  })
);
