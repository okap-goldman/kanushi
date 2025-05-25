// Note: Install drizzle-orm and drizzle-kit packages:
// npm install drizzle-orm
// npm install -D drizzle-kit

import { pgEnum } from 'drizzle-orm/pg-core';

// Follow enums
export const followTypeEnum = pgEnum('follow_type', ['family', 'watch']);
export const followStatusEnum = pgEnum('follow_status', ['active', 'unfollowed', 'blocked']);

// Post enums
export const contentTypeEnum = pgEnum('content_type', ['text', 'image', 'audio', 'video']);

// Message enums
export const messageTypeEnum = pgEnum('message_type', [
  'text',
  'image',
  'audio',
  'video',
  'system',
]);

// Live room enums
export const roomStatusEnum = pgEnum('room_status', ['scheduled', 'live', 'ended', 'cancelled']);
export const participantRoleEnum = pgEnum('participant_role', [
  'host',
  'speaker',
  'listener',
  'moderator',
]);

// Event enums
export const eventTypeEnum = pgEnum('event_type', [
  'online',
  'offline',
  'hybrid',
  'voice_workshop',
]);
export const eventParticipantStatusEnum = pgEnum('event_participant_status', [
  'registered',
  'attended',
  'cancelled',
  'no_show',
]);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'refunded']);

// Product enums
export const productTypeEnum = pgEnum('product_type', ['digital', 'physical', 'service']);
export const cartStatusEnum = pgEnum('cart_status', ['active', 'checked_out']);
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]);

// Group enums
export const groupTypeEnum = pgEnum('group_type', ['public', 'private', 'subscription']);
export const groupRoleEnum = pgEnum('group_role', ['owner', 'admin', 'moderator', 'member']);
export const memberStatusEnum = pgEnum('member_status', ['active', 'pending', 'blocked', 'left']);

// AI/Chat enums
export const playlistTypeEnum = pgEnum('playlist_type', [
  'daily',
  'mood',
  'activity',
  'personalized',
]);
export const chatRoleEnum = pgEnum('chat_role', ['user', 'assistant', 'system']);

// Notification enums
export const notificationTypeEnum = pgEnum('notification_type', [
  'follow',
  'like',
  'comment',
  'mention',
  'dm',
  'event_reminder',
  'event_update',
  'gift_received',
  'order_update',
  'group_invite',
  'system',
]);

// Schedule poll enums
export const voteTypeEnum = pgEnum('vote_type', ['available', 'maybe', 'unavailable']);
