import { pgTable, uuid, text, timestamp, boolean, integer, decimal, unique, index, check } from 'drizzle-orm/pg-core';
import { roomStatusEnum, participantRoleEnum } from './enums';
import { profiles } from './profile';
import { posts } from './post';

// Live room table
export const liveRooms = pgTable('live_room', {
  id: uuid('id').primaryKey().defaultRandom(),
  hostUserId: uuid('host_user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  status: roomStatusEnum('status').notNull(),
  livekitRoomName: text('livekit_room_name').unique(),
  maxSpeakers: integer('max_speakers').notNull().default(8),
  isRecording: boolean('is_recording').notNull().default(false),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'set null' }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  hostUserIdIdx: index('idx_live_room_host_user_id').on(table.hostUserId),
  statusIdx: index('idx_live_room_status').on(table.status),
  startedAtIdx: index('idx_live_room_started_at').on(table.startedAt.desc()),
  createdAtIdx: index('idx_live_room_created_at').on(table.createdAt.desc())
}));

// Room participant table
export const roomParticipants = pgTable('room_participant', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull().references(() => liveRooms.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  role: participantRoleEnum('role').notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  leftAt: timestamp('left_at', { withTimezone: true })
}, (table) => ({
  roomIdIdx: index('idx_room_participant_room_id').on(table.roomId),
  userIdIdx: index('idx_room_participant_user_id').on(table.userId),
  roleIdx: index('idx_room_participant_role').on(table.role),
  uniqueRoomUser: unique().on(table.roomId, table.userId)
}));

// Room chat table
export const roomChats = pgTable('room_chat', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull().references(() => liveRooms.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  sharedUrl: text('shared_url'),
  isPinned: boolean('is_pinned').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  roomIdIdx: index('idx_room_chat_room_id').on(table.roomId),
  userIdIdx: index('idx_room_chat_user_id').on(table.userId),
  createdAtIdx: index('idx_room_chat_created_at').on(table.createdAt.desc()),
  isPinnedIdx: index('idx_room_chat_is_pinned').on(table.isPinned)
}));

// Gift table
export const gifts = pgTable('gift', {
  id: uuid('id').primaryKey().defaultRandom(),
  senderId: uuid('sender_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  recipientId: uuid('recipient_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'set null' }),
  roomId: uuid('room_id').references(() => liveRooms.id, { onDelete: 'set null' }),
  amount: integer('amount').notNull(),
  platformFeeRate: decimal('platform_fee_rate', { precision: 5, scale: 4 }).notNull().default('0.3'),
  storesPaymentId: text('stores_payment_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  senderIdIdx: index('idx_gift_sender_id').on(table.senderId),
  recipientIdIdx: index('idx_gift_recipient_id').on(table.recipientId),
  postIdIdx: index('idx_gift_post_id').on(table.postId),
  roomIdIdx: index('idx_gift_room_id').on(table.roomId),
  createdAtIdx: index('idx_gift_created_at').on(table.createdAt.desc()),
  amountCheck: check('amount_check', 'amount > 0'),
  giftTargetCheck: check('gift_target_check', 'post_id IS NOT NULL OR room_id IS NOT NULL')
}));