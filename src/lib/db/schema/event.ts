import {
  boolean,
  check,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { eventParticipantStatusEnum, eventTypeEnum, paymentStatusEnum } from './enums';
import { liveRooms } from './liveRoom';
import { profiles } from './profile';

// Event table
export const events = pgTable(
  'event',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creatorUserId: uuid('creator_user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    eventType: eventTypeEnum('event_type').notNull(),
    location: text('location'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    fee: decimal('fee', { precision: 10, scale: 2 }),
    currency: text('currency').default('JPY'),
    refundPolicy: text('refund_policy'),
    liveRoomId: uuid('live_room_id').references(() => liveRooms.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    creatorUserIdIdx: index('idx_event_creator_user_id').on(table.creatorUserId),
    eventTypeIdx: index('idx_event_event_type').on(table.eventType),
    startsAtIdx: index('idx_event_starts_at').on(table.startsAt),
    endsAtIdx: index('idx_event_ends_at').on(table.endsAt),
    createdAtIdx: index('idx_event_created_at').on(table.createdAt.desc()),
    dateRangeCheck: check('date_range_check', 'ends_at > starts_at'),
  })
);

// Event participant table
export const eventParticipants = pgTable(
  'event_participant',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    status: eventParticipantStatusEnum('status').notNull(),
    paymentStatus: paymentStatusEnum('payment_status'),
    storesPaymentId: text('stores_payment_id'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    eventIdIdx: index('idx_event_participant_event_id').on(table.eventId),
    userIdIdx: index('idx_event_participant_user_id').on(table.userId),
    statusIdx: index('idx_event_participant_status').on(table.status),
    paymentStatusIdx: index('idx_event_participant_payment_status').on(table.paymentStatus),
    uniqueEventUser: unique().on(table.eventId, table.userId),
  })
);

// Voice workshop specific table
export const eventVoiceWorkshops = pgTable(
  'event_voice_workshop',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' })
      .unique(),
    maxParticipants: integer('max_participants').notNull().default(10),
    isRecorded: boolean('is_recorded').notNull().default(false),
    recordingUrl: text('recording_url'),
    archiveExpiresAt: timestamp('archive_expires_at', { withTimezone: true }),
  },
  (table) => ({
    eventIdIdx: index('idx_event_voice_workshop_event_id').on(table.eventId),
  })
);

// Event archive access table for tracking who can access recordings
export const eventArchiveAccess = pgTable(
  'event_archive_access',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    purchasedAt: timestamp('purchased_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (table) => ({
    eventIdIdx: index('idx_event_archive_access_event_id').on(table.eventId),
    userIdIdx: index('idx_event_archive_access_user_id').on(table.userId),
    uniqueEventUserArchive: unique().on(table.eventId, table.userId),
  })
);
