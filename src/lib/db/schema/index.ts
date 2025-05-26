// Main index file that exports all schemas
// This file also sets up foreign key constraints for circular dependencies

// Export all enums
export * from './enums';

// Export all schemas
export * from './profile';
export * from './post';
export * from './messaging';
export * from './liveRoom';
export * from './event';
export * from './ecommerce';
export * from './group';
export * from './ai';
export * from './notification';

// TODO: 関係定義は後で追加
// 現在はマイグレーション生成時に循環参照エラーが発生するため一時的にコメントアウト
// export * from './relations';

// TODO: 外部キー制約は後で個別に追加
// 現在はマイグレーション生成時にエラーが発生するため一時的にコメントアウト
/*
import { foreignKey } from 'drizzle-orm/pg-core';
import { events } from './event';
import { groups } from './group';
import { posts } from './post';

export const postEventFk = foreignKey({
  columns: [posts.eventId],
  foreignColumns: [events.id],
  name: 'fk_post_event_id',
});

export const postGroupFk = foreignKey({
  columns: [posts.groupId],
  foreignColumns: [groups.id],
  name: 'fk_post_group_id',
});
*/
