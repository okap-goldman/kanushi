import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { followStatusEnum, followTypeEnum } from './enums';

// Account type enum
export const accountTypeEnum = pgEnum('account_type', ['google', 'apple', 'passkey']);

// Profile table
export const profiles = pgTable(
  'profile',
  {
    id: uuid('id').primaryKey(), // This will reference auth.users in Supabase
    googleUid: text('google_uid').unique(),
    appleUid: text('apple_uid').unique(),
    displayName: text('display_name').notNull(),
    profileText: text('profile_text'),
    profileImageUrl: text('profile_image_url'),
    introAudioUrl: text('intro_audio_url'),
    externalLinkUrl: text('external_link_url'),
    prefecture: text('prefecture'),
    city: text('city'),
    fcmToken: text('fcm_token'),
    publicKey: text('public_key'),
    keyGeneratedAt: timestamp('key_generated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    googleUidIdx: index('idx_profile_google_uid').on(table.googleUid),
    appleUidIdx: index('idx_profile_apple_uid').on(table.appleUid),
    locationIdx: index('idx_profile_location').on(table.prefecture, table.city),
  })
);

// Account table for multi-account functionality
export const accounts = pgTable(
  'account',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    accountType: accountTypeEnum('account_type').notNull(),
    isActive: boolean('is_active').notNull().default(false),
    switchOrder: integer('switch_order').notNull(),
    lastSwitchedAt: timestamp('last_switched_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    profileIdIdx: index('idx_account_profile_id').on(table.profileId),
    isActiveIdx: index('idx_account_is_active').on(table.isActive),
    accountTypeIdx: index('idx_account_type').on(table.accountType),
    uniqueProfileOrder: unique().on(table.profileId, table.switchOrder),
    uniqueProfileType: unique().on(table.profileId, table.accountType),
    switchOrderCheck: check('switch_order_check', 'switch_order BETWEEN 1 AND 5'),
  })
);

// Passkey table for WebAuthn credentials
export const passkeys = pgTable(
  'passkey',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    credentialId: text('credential_id').notNull().unique(),
    publicKey: text('public_key').notNull(),
    counter: integer('counter').notNull().default(0),
    deviceName: text('device_name'),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    profileIdIdx: index('idx_passkey_profile_id').on(table.profileId),
    credentialIdIdx: index('idx_passkey_credential_id').on(table.credentialId),
  })
);

// Follow table
export const follows = pgTable(
  'follow',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    followerId: uuid('follower_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    followeeId: uuid('followee_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    followType: followTypeEnum('follow_type').notNull(),
    status: followStatusEnum('status').notNull(),
    followReason: text('follow_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    unfollowedAt: timestamp('unfollowed_at', { withTimezone: true }),
    unfollowReason: text('unfollow_reason'),
  },
  (table) => ({
    followerIdIdx: index('idx_follow_follower_id').on(table.followerId),
    followeeIdIdx: index('idx_follow_followee_id').on(table.followeeId),
    statusIdx: index('idx_follow_status').on(table.status),
    createdAtIdx: index('idx_follow_created_at').on(table.createdAt.desc()),
    uniqueFollow: unique().on(table.followerId, table.followeeId),
  })
);
