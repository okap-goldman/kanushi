export interface MockLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface MockBookmark {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface MockHighlight {
  id: string;
  post_id: string;
  user_id: string;
  reason: string;
  created_at: string;
}

// Mock likes data
export const mockLikes: MockLike[] = [
  { id: 'like-1', post_id: 'post-1', user_id: '1', created_at: '2024-01-20T06:35:00Z' },
  { id: 'like-2', post_id: 'post-3', user_id: '1', created_at: '2024-01-18T14:30:00Z' },
  { id: 'like-3', post_id: 'post-5', user_id: '1', created_at: '2024-01-16T19:00:00Z' },
];

// Mock bookmarks data
export const mockBookmarks: MockBookmark[] = [
  { id: 'bookmark-1', post_id: 'post-1', user_id: '1', created_at: '2024-01-20T08:00:00Z' },
  { id: 'bookmark-2', post_id: 'post-2', user_id: '1', created_at: '2024-01-19T22:00:00Z' },
  { id: 'bookmark-3', post_id: 'post-3', user_id: '1', created_at: '2024-01-18T15:30:00Z' },
  { id: 'bookmark-4', post_id: 'post-4', user_id: '1', created_at: '2024-01-17T09:15:00Z' },
  { id: 'bookmark-5', post_id: 'post-6', user_id: '1', created_at: '2024-01-15T07:00:00Z' },
  { id: 'bookmark-6', post_id: 'post-7', user_id: '1', created_at: '2024-01-14T23:45:00Z' },
];

// Mock highlights data
export const mockHighlights: MockHighlight[] = [
  { 
    id: 'highlight-1', 
    post_id: 'post-1', 
    user_id: '1', 
    reason: 'この瞑想メッセージは私の人生を変えました',
    created_at: '2024-01-20T07:00:00Z' 
  },
  { 
    id: 'highlight-2', 
    post_id: 'post-4', 
    user_id: '1', 
    reason: '2024年の指針として何度も聞き返したい内容です',
    created_at: '2024-01-17T10:30:00Z' 
  },
];

// Helper functions
export const getUserLikes = (userId: string): MockLike[] => {
  return mockLikes.filter(like => like.user_id === userId);
};

export const getUserBookmarks = (userId: string): MockBookmark[] => {
  return mockBookmarks.filter(bookmark => bookmark.user_id === userId);
};

export const getUserHighlights = (userId: string): MockHighlight[] => {
  return mockHighlights.filter(highlight => highlight.user_id === userId);
};

export const getPostLikes = (postId: string): MockLike[] => {
  return mockLikes.filter(like => like.post_id === postId);
};

export const getPostBookmarks = (postId: string): MockBookmark[] => {
  return mockBookmarks.filter(bookmark => bookmark.post_id === postId);
};

export const getPostHighlights = (postId: string): MockHighlight[] => {
  return mockHighlights.filter(highlight => highlight.post_id === postId);
};

export const isPostLikedByUser = (postId: string, userId: string): boolean => {
  return mockLikes.some(like => like.post_id === postId && like.user_id === userId);
};

export const isPostBookmarkedByUser = (postId: string, userId: string): boolean => {
  return mockBookmarks.some(bookmark => bookmark.post_id === postId && bookmark.user_id === userId);
};

export const isPostHighlightedByUser = (postId: string, userId: string): boolean => {
  return mockHighlights.some(highlight => highlight.post_id === postId && highlight.user_id === userId);
};