// Main index file that exports all schemas
// This file also sets up foreign key constraints for circular dependencies

import { foreignKey } from 'drizzle-orm/pg-core';

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

// Import necessary tables for foreign key setup
import { posts } from './post';
import { events } from './event';
import { groups } from './group';

// Add foreign key constraints that couldn't be added directly due to circular dependencies
// These would be applied during migration setup

// Posts -> Events foreign key
export const postEventFk = foreignKey({
  columns: [posts.eventId],
  foreignColumns: [events.id],
  name: 'fk_post_event_id'
});

// Posts -> Groups foreign key  
export const postGroupFk = foreignKey({
  columns: [posts.groupId],
  foreignColumns: [groups.id],
  name: 'fk_post_group_id'
});

// Export all relations
export * from './relations';