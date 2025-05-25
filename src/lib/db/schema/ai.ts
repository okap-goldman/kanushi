import { pgTable, uuid, text, timestamp, jsonb, unique, index } from 'drizzle-orm/pg-core';
import { playlistTypeEnum, chatRoleEnum } from './enums';
import { profiles } from './profile';
import { posts } from './post';

// AI playlist table
export const aiPlaylists = pgTable('ai_playlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  playlistType: playlistTypeEnum('playlist_type').notNull(),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull().default(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
}, (table) => ({
  userIdIdx: index('idx_ai_playlist_user_id').on(table.userId),
  playlistTypeIdx: index('idx_ai_playlist_playlist_type').on(table.playlistType),
  generatedAtIdx: index('idx_ai_playlist_generated_at').on(table.generatedAt.desc()),
  expiresAtIdx: index('idx_ai_playlist_expires_at').on(table.expiresAt)
}));

// AI playlist post junction table
export const aiPlaylistPosts = pgTable('ai_playlist_post', {
  id: uuid('id').primaryKey().defaultRandom(),
  playlistId: uuid('playlist_id').notNull().references(() => aiPlaylists.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' })
}, (table) => ({
  playlistIdIdx: index('idx_ai_playlist_post_playlist_id').on(table.playlistId),
  postIdIdx: index('idx_ai_playlist_post_post_id').on(table.postId),
  uniquePlaylistPost: unique().on(table.playlistId, table.postId)
}));

// Chat session table
export const chatSessions = pgTable('chat_session', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true })
}, (table) => ({
  userIdIdx: index('idx_chat_session_user_id').on(table.userId),
  createdAtIdx: index('idx_chat_session_created_at').on(table.createdAt.desc())
}));

// Chat message table
export const chatMessages = pgTable('chat_message', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  role: chatRoleEnum('role').notNull(),
  content: text('content').notNull(),
  functionCalls: jsonb('function_calls'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  sessionIdIdx: index('idx_chat_message_session_id').on(table.sessionId),
  userIdIdx: index('idx_chat_message_user_id').on(table.userId),
  createdAtIdx: index('idx_chat_message_created_at').on(table.createdAt.desc())
}));

// Search history table
export const searchHistories = pgTable('search_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  query: text('query').notNull(),
  searchedAt: timestamp('searched_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  userIdIdx: index('idx_search_history_user_id').on(table.userId),
  searchedAtIdx: index('idx_search_history_searched_at').on(table.searchedAt.desc()),
  queryIdx: index('idx_search_history_query').on(table.query)
}));