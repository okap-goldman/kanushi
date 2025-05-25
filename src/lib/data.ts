// Data models and types for the application

// Post types
export type ContentType = 'text' | 'image' | 'video' | 'audio';
export type MediaType = ContentType;
export type TimelineType = 'family' | 'watch' | 'all';

export interface Author {
  id: string;
  name: string;
  image: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Post {
  id: string;
  user_id: string; // DB field
  author_id?: string; // For API compatibility
  author: Author;
  content_type: ContentType; // DB field
  text_content: string; // DB field
  media_url?: string | null; // DB field
  audio_url?: string | null; // DB field
  thumbnail_url?: string | null; // DB field
  content?: string; // For API compatibility
  caption?: string; // For API compatibility
  media_type?: ContentType; // For API compatibility
  created_at: string;
  updated_at?: string;
  likes_count: number;
  comments_count: number;
  timeline_type?: 'family' | 'watch' | 'all'; // Virtual field for UI
  tags?: Tag[]; // Tags associated with the post
}

export interface Comment {
  id: string;
  post_id: string;
  user_id?: string; // Actual DB field
  author_id: string; // For API compatibility
  author: Author;
  content: string;
  created_at: string;
}

// New post creation types (Drizzle schema based)
export interface PostCreateInput {
  userId: string;
  contentType: MediaType;
  textContent?: string;
  mediaUrl?: string;
  previewUrl?: string;
  waveformUrl?: string;
  durationSeconds?: number;
  youtubeVideoId?: string;
  eventId?: string;
  groupId?: string;
  hashtags?: string[];
}

export interface PostUpdateInput {
  textContent?: string;
  mediaUrl?: string;
  previewUrl?: string;
  waveformUrl?: string;
  durationSeconds?: number;
}

export interface DrizzlePost {
  id: string;
  userId: string;
  contentType: MediaType;
  textContent?: string | null;
  mediaUrl?: string | null;
  previewUrl?: string | null;
  waveformUrl?: string | null;
  durationSeconds?: number | null;
  youtubeVideoId?: string | null;
  eventId?: string | null;
  groupId?: string | null;
  aiMetadata?: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface DrizzleComment {
  id: string;
  postId: string;
  userId: string;
  body: string;
  createdAt: Date;
}

export interface DrizzleLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}

export interface DrizzleHighlight {
  id: string;
  postId: string;
  userId: string;
  reason?: string | null;
  createdAt: Date;
}

export interface DrizzleBookmark {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}

export interface DrizzleHashtag {
  id: string;
  name: string;
  useCount: number;
  createdAt: Date;
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface ServiceResult<T> {
  success: boolean;
  data: T | null;
  error: Error | null;
}

// Follow related types
export type FollowType = 'family' | 'watch';
export type FollowStatus = 'active' | 'unfollowed' | 'blocked';

export interface FollowCreateInput {
  followerId: string;
  followeeId: string;
  followType: FollowType;
  followReason?: string;
}

export interface FollowUpdateInput {
  followReason?: string;
  unfollowReason?: string;
}

export interface DrizzleFollow {
  id: string;
  followerId: string;
  followeeId: string;
  followType: FollowType;
  status: FollowStatus;
  followReason?: string | null;
  createdAt: Date;
  unfollowedAt?: Date | null;
  unfollowReason?: string | null;
}

export interface MutualFollowInfo {
  isMutual: boolean;
  user1FollowsUser2: boolean;
  user2FollowsUser1: boolean;
}

// Timeline related types
export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface CachedTimeline {
  items: DrizzlePost[];
  hasMore: boolean;
  nextCursor: string | null;
  cachedAt: Date;
}

export interface TimelineCursor {
  createdAt: string;
  postId?: string;
}
