import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { notificationTypeEnum, voteTypeEnum } from './enums';
import { events } from './event';
import { profiles } from './profile';

// Notification table
export const notifications = pgTable(
  'notification',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    body: text('body').notNull(),
    notificationType: notificationTypeEnum('notification_type').notNull(),
    data: jsonb('data'),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_notification_user_id').on(table.userId),
    notificationTypeIdx: index('idx_notification_notification_type').on(table.notificationType),
    isReadIdx: index('idx_notification_is_read').on(table.isRead),
    createdAtIdx: index('idx_notification_created_at').on(table.createdAt.desc()),
  })
);

// Notification setting table
export const notificationSettings = pgTable(
  'notification_setting',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    notificationType: notificationTypeEnum('notification_type').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_notification_setting_user_id').on(table.userId),
    uniqueUserType: unique().on(table.userId, table.notificationType),
  })
);

// Schedule poll table (Low priority feature)
export const schedulePolls = pgTable(
  'schedule_poll',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creatorUserId: uuid('creator_user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    relatedEventId: uuid('related_event_id').references(() => events.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deadlineAt: timestamp('deadline_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    creatorUserIdIdx: index('idx_schedule_poll_creator_user_id').on(table.creatorUserId),
    relatedEventIdIdx: index('idx_schedule_poll_related_event_id').on(table.relatedEventId),
    deadlineAtIdx: index('idx_schedule_poll_deadline_at').on(table.deadlineAt),
  })
);

// Schedule candidate table
export const scheduleCandidates = pgTable(
  'schedule_candidate',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pollId: uuid('poll_id')
      .notNull()
      .references(() => schedulePolls.id, { onDelete: 'cascade' }),
    candidateDatetime: timestamp('candidate_datetime', { withTimezone: true }).notNull(),
    orderIndex: integer('order_index').notNull(),
  },
  (table) => ({
    pollIdIdx: index('idx_schedule_candidate_poll_id').on(table.pollId),
    uniquePollOrder: unique().on(table.pollId, table.orderIndex),
  })
);

// Schedule vote table
export const scheduleVotes = pgTable(
  'schedule_vote',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pollId: uuid('poll_id')
      .notNull()
      .references(() => schedulePolls.id, { onDelete: 'cascade' }),
    candidateId: uuid('candidate_id')
      .notNull()
      .references(() => scheduleCandidates.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    voteType: voteTypeEnum('vote_type').notNull(),
    votedAt: timestamp('voted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pollIdIdx: index('idx_schedule_vote_poll_id').on(table.pollId),
    candidateIdIdx: index('idx_schedule_vote_candidate_id').on(table.candidateId),
    userIdIdx: index('idx_schedule_vote_user_id').on(table.userId),
    uniqueCandidateUser: unique().on(table.candidateId, table.userId),
  })
);
