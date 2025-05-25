import { relations } from 'drizzle-orm';
import {
  profiles, accounts, follows,
  posts, stories, hashtags, postHashtags, comments, likes, highlights, bookmarks, offlineContents,
  dmThreads, directMessages,
  liveRooms, roomParticipants, roomChats, gifts,
  events, eventParticipants,
  products, carts, cartItems, orders, orderItems,
  groups, groupMembers, groupChats,
  aiPlaylists, aiPlaylistPosts, chatSessions, chatMessages, searchHistories,
  notifications, notificationSettings, schedulePolls, scheduleCandidates, scheduleVotes
} from './index';

// Profile relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  accounts: many(accounts),
  following: many(follows, { relationName: 'follower' }),
  followers: many(follows, { relationName: 'followee' }),
  posts: many(posts),
  stories: many(stories),
  comments: many(comments),
  likes: many(likes),
  highlights: many(highlights),
  bookmarks: many(bookmarks),
  offlineContents: many(offlineContents),
  sentMessages: many(directMessages),
  liveRooms: many(liveRooms),
  roomParticipations: many(roomParticipants),
  roomChats: many(roomChats),
  sentGifts: many(gifts, { relationName: 'sender' }),
  receivedGifts: many(gifts, { relationName: 'recipient' }),
  events: many(events),
  eventParticipations: many(eventParticipants),
  products: many(products),
  carts: many(carts),
  orders: many(orders),
  groups: many(groups),
  groupMemberships: many(groupMembers),
  groupChats: many(groupChats),
  aiPlaylists: many(aiPlaylists),
  chatSessions: many(chatSessions),
  searchHistories: many(searchHistories),
  notifications: many(notifications),
  notificationSettings: many(notificationSettings),
  schedulePolls: many(schedulePolls),
  scheduleVotes: many(scheduleVotes)
}));

// Account relations
export const accountsRelations = relations(accounts, ({ one }) => ({
  profile: one(profiles, {
    fields: [accounts.profileId],
    references: [profiles.id]
  })
}));

// Follow relations
export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(profiles, {
    fields: [follows.followerId],
    references: [profiles.id],
    relationName: 'follower'
  }),
  followee: one(profiles, {
    fields: [follows.followeeId],
    references: [profiles.id],
    relationName: 'followee'
  })
}));

// Post relations
export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(profiles, {
    fields: [posts.userId],
    references: [profiles.id]
  }),
  event: one(events, {
    fields: [posts.eventId],
    references: [events.id]
  }),
  group: one(groups, {
    fields: [posts.groupId],
    references: [groups.id]
  }),
  hashtags: many(postHashtags),
  comments: many(comments),
  likes: many(likes),
  highlights: many(highlights),
  bookmarks: many(bookmarks),
  offlineContents: many(offlineContents),
  gifts: many(gifts),
  products: many(products),
  aiPlaylistPosts: many(aiPlaylistPosts),
  liveRoom: one(liveRooms, {
    fields: [posts.id],
    references: [liveRooms.postId]
  })
}));

// Story relations
export const storiesRelations = relations(stories, ({ one }) => ({
  user: one(profiles, {
    fields: [stories.userId],
    references: [profiles.id]
  }),
  originalStory: one(stories, {
    fields: [stories.originalStoryId],
    references: [stories.id],
    relationName: 'repost'
  }),
  reposts: one(stories, {
    fields: [stories.id],
    references: [stories.originalStoryId],
    relationName: 'repost'
  })
}));

// Hashtag relations
export const hashtagsRelations = relations(hashtags, ({ many }) => ({
  posts: many(postHashtags)
}));

// Post hashtag relations
export const postHashtagsRelations = relations(postHashtags, ({ one }) => ({
  post: one(posts, {
    fields: [postHashtags.postId],
    references: [posts.id]
  }),
  hashtag: one(hashtags, {
    fields: [postHashtags.hashtagId],
    references: [hashtags.id]
  })
}));

// Comment relations
export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id]
  }),
  user: one(profiles, {
    fields: [comments.userId],
    references: [profiles.id]
  })
}));

// Like relations
export const likesRelations = relations(likes, ({ one }) => ({
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id]
  }),
  user: one(profiles, {
    fields: [likes.userId],
    references: [profiles.id]
  })
}));

// Highlight relations
export const highlightsRelations = relations(highlights, ({ one }) => ({
  post: one(posts, {
    fields: [highlights.postId],
    references: [posts.id]
  }),
  user: one(profiles, {
    fields: [highlights.userId],
    references: [profiles.id]
  })
}));

// Bookmark relations
export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  post: one(posts, {
    fields: [bookmarks.postId],
    references: [posts.id]
  }),
  user: one(profiles, {
    fields: [bookmarks.userId],
    references: [profiles.id]
  })
}));

// Offline content relations
export const offlineContentsRelations = relations(offlineContents, ({ one }) => ({
  post: one(posts, {
    fields: [offlineContents.postId],
    references: [posts.id]
  }),
  user: one(profiles, {
    fields: [offlineContents.userId],
    references: [profiles.id]
  })
}));

// DM thread relations
export const dmThreadsRelations = relations(dmThreads, ({ one, many }) => ({
  user1: one(profiles, {
    fields: [dmThreads.user1Id],
    references: [profiles.id],
    relationName: 'user1'
  }),
  user2: one(profiles, {
    fields: [dmThreads.user2Id],
    references: [profiles.id],
    relationName: 'user2'
  }),
  messages: many(directMessages)
}));

// Direct message relations
export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  thread: one(dmThreads, {
    fields: [directMessages.threadId],
    references: [dmThreads.id]
  }),
  sender: one(profiles, {
    fields: [directMessages.senderId],
    references: [profiles.id]
  })
}));

// Live room relations
export const liveRoomsRelations = relations(liveRooms, ({ one, many }) => ({
  host: one(profiles, {
    fields: [liveRooms.hostUserId],
    references: [profiles.id]
  }),
  post: one(posts, {
    fields: [liveRooms.postId],
    references: [posts.id]
  }),
  participants: many(roomParticipants),
  chats: many(roomChats),
  gifts: many(gifts),
  event: one(events, {
    fields: [liveRooms.id],
    references: [events.liveRoomId]
  })
}));

// Room participant relations
export const roomParticipantsRelations = relations(roomParticipants, ({ one }) => ({
  room: one(liveRooms, {
    fields: [roomParticipants.roomId],
    references: [liveRooms.id]
  }),
  user: one(profiles, {
    fields: [roomParticipants.userId],
    references: [profiles.id]
  })
}));

// Room chat relations
export const roomChatsRelations = relations(roomChats, ({ one }) => ({
  room: one(liveRooms, {
    fields: [roomChats.roomId],
    references: [liveRooms.id]
  }),
  user: one(profiles, {
    fields: [roomChats.userId],
    references: [profiles.id]
  })
}));

// Gift relations
export const giftsRelations = relations(gifts, ({ one }) => ({
  sender: one(profiles, {
    fields: [gifts.senderId],
    references: [profiles.id],
    relationName: 'sender'
  }),
  recipient: one(profiles, {
    fields: [gifts.recipientId],
    references: [profiles.id],
    relationName: 'recipient'
  }),
  post: one(posts, {
    fields: [gifts.postId],
    references: [posts.id]
  }),
  room: one(liveRooms, {
    fields: [gifts.roomId],
    references: [liveRooms.id]
  })
}));

// Event relations
export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [events.creatorUserId],
    references: [profiles.id]
  }),
  liveRoom: one(liveRooms, {
    fields: [events.liveRoomId],
    references: [liveRooms.id]
  }),
  participants: many(eventParticipants),
  posts: many(posts),
  schedulePolls: many(schedulePolls)
}));

// Event participant relations
export const eventParticipantsRelations = relations(eventParticipants, ({ one }) => ({
  event: one(events, {
    fields: [eventParticipants.eventId],
    references: [events.id]
  }),
  user: one(profiles, {
    fields: [eventParticipants.userId],
    references: [profiles.id]
  })
}));

// Product relations
export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(profiles, {
    fields: [products.sellerUserId],
    references: [profiles.id]
  }),
  sourcePost: one(posts, {
    fields: [products.sourcePostId],
    references: [posts.id]
  }),
  cartItems: many(cartItems),
  orderItems: many(orderItems)
}));

// Cart relations
export const cartsRelations = relations(carts, ({ one, many }) => ({
  buyer: one(profiles, {
    fields: [carts.buyerUserId],
    references: [profiles.id]
  }),
  items: many(cartItems)
}));

// Cart item relations
export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id]
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id]
  })
}));

// Order relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(profiles, {
    fields: [orders.buyerUserId],
    references: [profiles.id]
  }),
  items: many(orderItems)
}));

// Order item relations
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  })
}));

// Group relations
export const groupsRelations = relations(groups, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [groups.ownerUserId],
    references: [profiles.id]
  }),
  members: many(groupMembers),
  chats: many(groupChats),
  posts: many(posts)
}));

// Group member relations
export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id]
  }),
  user: one(profiles, {
    fields: [groupMembers.userId],
    references: [profiles.id]
  })
}));

// Group chat relations
export const groupChatsRelations = relations(groupChats, ({ one }) => ({
  group: one(groups, {
    fields: [groupChats.groupId],
    references: [groups.id]
  }),
  user: one(profiles, {
    fields: [groupChats.userId],
    references: [profiles.id]
  })
}));

// AI playlist relations
export const aiPlaylistsRelations = relations(aiPlaylists, ({ one, many }) => ({
  user: one(profiles, {
    fields: [aiPlaylists.userId],
    references: [profiles.id]
  }),
  posts: many(aiPlaylistPosts)
}));

// AI playlist post relations
export const aiPlaylistPostsRelations = relations(aiPlaylistPosts, ({ one }) => ({
  playlist: one(aiPlaylists, {
    fields: [aiPlaylistPosts.playlistId],
    references: [aiPlaylists.id]
  }),
  post: one(posts, {
    fields: [aiPlaylistPosts.postId],
    references: [posts.id]
  })
}));

// Chat session relations
export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(profiles, {
    fields: [chatSessions.userId],
    references: [profiles.id]
  }),
  messages: many(chatMessages)
}));

// Chat message relations
export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id]
  }),
  user: one(profiles, {
    fields: [chatMessages.userId],
    references: [profiles.id]
  })
}));

// Search history relations
export const searchHistoriesRelations = relations(searchHistories, ({ one }) => ({
  user: one(profiles, {
    fields: [searchHistories.userId],
    references: [profiles.id]
  })
}));

// Notification relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.userId],
    references: [profiles.id]
  })
}));

// Notification setting relations
export const notificationSettingsRelations = relations(notificationSettings, ({ one }) => ({
  user: one(profiles, {
    fields: [notificationSettings.userId],
    references: [profiles.id]
  })
}));

// Schedule poll relations
export const schedulePollsRelations = relations(schedulePolls, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [schedulePolls.creatorUserId],
    references: [profiles.id]
  }),
  relatedEvent: one(events, {
    fields: [schedulePolls.relatedEventId],
    references: [events.id]
  }),
  candidates: many(scheduleCandidates),
  votes: many(scheduleVotes)
}));

// Schedule candidate relations
export const scheduleCandidatesRelations = relations(scheduleCandidates, ({ one, many }) => ({
  poll: one(schedulePolls, {
    fields: [scheduleCandidates.pollId],
    references: [schedulePolls.id]
  }),
  votes: many(scheduleVotes)
}));

// Schedule vote relations
export const scheduleVotesRelations = relations(scheduleVotes, ({ one }) => ({
  poll: one(schedulePolls, {
    fields: [scheduleVotes.pollId],
    references: [schedulePolls.id]
  }),
  candidate: one(scheduleCandidates, {
    fields: [scheduleVotes.candidateId],
    references: [scheduleCandidates.id]
  }),
  user: one(profiles, {
    fields: [scheduleVotes.userId],
    references: [profiles.id]
  })
}));