import { mockUsers } from './users';

export interface MockStory {
  id: string;
  user_id: string;
  user?: typeof mockUsers[0];
  content?: string;
  media_url: string;
  media_type: 'image' | 'video' | 'audio';
  audio_duration?: number;
  views_count: number;
  likes_count: number;
  is_viewed?: boolean;
  is_liked?: boolean;
  expires_at: string;
  created_at: string;
}

export interface MockStoryGroup {
  user_id: string;
  user: typeof mockUsers[0];
  stories: MockStory[];
  has_unviewed: boolean;
  latest_story_at: string;
}

export const mockStories: MockStory[] = [
  {
    id: '1',
    user_id: '1',
    user: mockUsers[0],
    content: '今朝の日の出エネルギー🌅',
    media_url: 'https://picsum.photos/seed/story1/400/700',
    media_type: 'image',
    views_count: 234,
    likes_count: 89,
    is_viewed: false,
    is_liked: false,
    expires_at: '2024-01-22T06:00:00Z',
    created_at: '2024-01-21T06:00:00Z'
  },
  {
    id: '2',
    user_id: '1',
    user: mockUsers[0],
    content: '瞑想中に降りてきたメッセージをシェア',
    media_url: 'https://example.com/audio/story-voice.mp3',
    media_type: 'audio',
    audio_duration: 180,
    views_count: 156,
    likes_count: 67,
    is_viewed: false,
    is_liked: true,
    expires_at: '2024-01-22T10:00:00Z',
    created_at: '2024-01-21T10:00:00Z'
  },
  {
    id: '3',
    user_id: '2',
    user: mockUsers[1],
    media_url: 'https://picsum.photos/seed/story3/400/700',
    media_type: 'image',
    content: '瞑想スペースの準備完了✨',
    views_count: 345,
    likes_count: 123,
    is_viewed: true,
    is_liked: false,
    expires_at: '2024-01-22T04:30:00Z',
    created_at: '2024-01-21T04:30:00Z'
  },
  {
    id: '4',
    user_id: '3',
    user: mockUsers[2],
    content: '新しいクリスタルが届きました💎',
    media_url: 'https://picsum.photos/seed/story4/400/700',
    media_type: 'image',
    views_count: 267,
    likes_count: 98,
    is_viewed: false,
    is_liked: false,
    expires_at: '2024-01-22T14:00:00Z',
    created_at: '2024-01-21T14:00:00Z'
  },
  {
    id: '5',
    user_id: '4',
    user: mockUsers[3],
    content: '今夜の星空からのメッセージ',
    media_url: 'https://example.com/video/story-astro.mp4',
    media_type: 'video',
    views_count: 456,
    likes_count: 234,
    is_viewed: true,
    is_liked: true,
    expires_at: '2024-01-21T22:00:00Z',
    created_at: '2024-01-20T22:00:00Z'
  }
];

export const getMockStoryGroups = (): MockStoryGroup[] => {
  const storyGroups: MockStoryGroup[] = [];
  
  mockUsers.forEach(user => {
    const userStories = mockStories.filter(story => story.user_id === user.id);
    if (userStories.length > 0) {
      storyGroups.push({
        user_id: user.id,
        user: user,
        stories: userStories,
        has_unviewed: userStories.some(story => !story.is_viewed),
        latest_story_at: userStories[0].created_at
      });
    }
  });
  
  return storyGroups.sort((a, b) => 
    new Date(b.latest_story_at).getTime() - new Date(a.latest_story_at).getTime()
  );
};

export const getUserStories = (userId: string): MockStory[] => {
  return mockStories.filter(story => story.user_id === userId);
};