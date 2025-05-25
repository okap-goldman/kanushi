import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, unique, index } from 'drizzle-orm/pg-core';
import { contentTypeEnum } from './enums';
import { profiles } from './profile';

// Post table
export const posts = pgTable('post', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  contentType: contentTypeEnum('content_type').notNull(),
  textContent: text('text_content'),
  mediaUrl: text('media_url'),
  previewUrl: text('preview_url'),
  waveformUrl: text('waveform_url'),
  durationSeconds: integer('duration_seconds'),
  youtubeVideoId: text('youtube_video_id'),
  eventId: uuid('event_id'), // References events table - imported in index.ts to avoid circular dependency
  groupId: uuid('group_id'), // References groups table - imported in index.ts to avoid circular dependency
  aiMetadata: jsonb('ai_metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
}, (table) => ({
  userIdIdx: index('idx_post_user_id').on(table.userId),
  contentTypeIdx: index('idx_post_content_type').on(table.contentType),
  createdAtIdx: index('idx_post_created_at').on(table.createdAt.desc()),
  deletedAtIdx: index('idx_post_deleted_at').on(table.deletedAt),
  eventIdIdx: index('idx_post_event_id').on(table.eventId),
  groupIdIdx: index('idx_post_group_id').on(table.groupId)
}));

// Story table
export const stories = pgTable('story', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  editData: jsonb('edit_data'),
  isRepost: boolean('is_repost').notNull().default(false),
  originalStoryId: uuid('original_story_id').references(() => stories.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull().default(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  userIdIdx: index('idx_story_user_id').on(table.userId),
  expiresAtIdx: index('idx_story_expires_at').on(table.expiresAt),
  createdAtIdx: index('idx_story_created_at').on(table.createdAt.desc())
}));

// Hashtag table
export const hashtags = pgTable('hashtag', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  useCount: integer('use_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  nameIdx: index('idx_hashtag_name').on(table.name),
  useCountIdx: index('idx_hashtag_use_count').on(table.useCount.desc())
}));

// Post-hashtag junction table
export const postHashtags = pgTable('post_hashtag', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  hashtagId: uuid('hashtag_id').notNull().references(() => hashtags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  postIdIdx: index('idx_post_hashtag_post_id').on(table.postId),
  hashtagIdIdx: index('idx_post_hashtag_hashtag_id').on(table.hashtagId),
  uniquePostHashtag: unique().on(table.postId, table.hashtagId)
}));

// Comment table
export const comments = pgTable('comment', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  postIdIdx: index('idx_comment_post_id').on(table.postId),
  userIdIdx: index('idx_comment_user_id').on(table.userId),
  createdAtIdx: index('idx_comment_created_at').on(table.createdAt.desc())
}));

// Like table
export const likes = pgTable('like', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  postIdIdx: index('idx_like_post_id').on(table.postId),
  userIdIdx: index('idx_like_user_id').on(table.userId),
  uniqueLike: unique().on(table.postId, table.userId)
}));

// Highlight table
export const highlights = pgTable('highlight', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  postIdIdx: index('idx_highlight_post_id').on(table.postId),
  userIdIdx: index('idx_highlight_user_id').on(table.userId),
  uniqueHighlight: unique().on(table.postId, table.userId)
}));

// Bookmark table
export const bookmarks = pgTable('bookmark', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  postIdIdx: index('idx_bookmark_post_id').on(table.postId),
  userIdIdx: index('idx_bookmark_user_id').on(table.userId),
  uniqueBookmark: unique().on(table.postId, table.userId)
}));

// Offline content table
export const offlineContents = pgTable('offline_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  sizeBytes: integer('size_bytes').notNull(),
  cachedAt: timestamp('cached_at', { withTimezone: true }).notNull().defaultNow(),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull().default(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
}, (table) => ({
  userIdIdx: index('idx_offline_content_user_id').on(table.userId),
  expiresAtIdx: index('idx_offline_content_expires_at').on(table.expiresAt),
  uniqueUserPost: unique().on(table.userId, table.postId)
}));