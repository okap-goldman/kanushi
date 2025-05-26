import {
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
import { groupRoleEnum, groupTypeEnum, memberStatusEnum, messageTypeEnum } from './enums';
import { profiles } from './profile';

// Group table
export const groups = pgTable(
  'group',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerUserId: uuid('owner_user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    groupType: groupTypeEnum('group_type').notNull(),
    subscriptionPrice: decimal('subscription_price', { precision: 10, scale: 2 }),
    storesPriceId: text('stores_price_id'),
    memberLimit: integer('member_limit'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ownerUserIdIdx: index('idx_group_owner_user_id').on(table.ownerUserId),
    groupTypeIdx: index('idx_group_group_type').on(table.groupType),
    createdAtIdx: index('idx_group_created_at').on(table.createdAt.desc()),
    memberLimitCheck: check('member_limit_check', 'member_limit > 0'),
    subscriptionCheck: check(
      'subscription_check',
      "(group_type = 'subscription' AND subscription_price IS NOT NULL AND stores_price_id IS NOT NULL) OR (group_type != 'subscription' AND subscription_price IS NULL AND stores_price_id IS NULL)"
    ),
  })
);

// Group member table
export const groupMembers = pgTable(
  'group_member',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    role: groupRoleEnum('role').notNull(),
    status: memberStatusEnum('status').notNull(),
    storesSubscriptionId: text('stores_subscription_id'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    leftAt: timestamp('left_at', { withTimezone: true }),
  },
  (table) => ({
    groupIdIdx: index('idx_group_member_group_id').on(table.groupId),
    userIdIdx: index('idx_group_member_user_id').on(table.userId),
    roleIdx: index('idx_group_member_role').on(table.role),
    statusIdx: index('idx_group_member_status').on(table.status),
    uniqueGroupUser: unique().on(table.groupId, table.userId),
  })
);

// Group chat table
export const groupChats = pgTable(
  'group_chat',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    messageType: messageTypeEnum('message_type').notNull(),
    textContent: text('text_content'),
    mediaUrl: text('media_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    groupIdIdx: index('idx_group_chat_group_id').on(table.groupId),
    userIdIdx: index('idx_group_chat_user_id').on(table.userId),
    createdAtIdx: index('idx_group_chat_created_at').on(table.createdAt.desc()),
  })
);
