import { mockUsers } from './users';

export interface MockConversation {
  id: string;
  user1_id: string;
  user2_id: string;
  other_user?: typeof mockUsers[0];
  last_message?: MockMessage;
  unread_count: number;
  updated_at: string;
}

export interface MockMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  audio_url?: string;
  audio_duration?: number;
  image_url?: string;
  is_read: boolean;
  is_encrypted: boolean;
  created_at: string;
}

export const mockConversations: MockConversation[] = [
  {
    id: '1',
    user1_id: '1',
    user2_id: '2',
    other_user: mockUsers[1],
    last_message: {
      id: 'msg1',
      conversation_id: '1',
      sender_id: '2',
      receiver_id: '1',
      content: '今朝の瞑想セッション、とても良かったです！',
      is_read: false,
      is_encrypted: true,
      created_at: '2024-01-20T10:30:00Z'
    },
    unread_count: 2,
    updated_at: '2024-01-20T10:30:00Z'
  },
  {
    id: '2',
    user1_id: '1',
    user2_id: '3',
    other_user: mockUsers[2],
    last_message: {
      id: 'msg2',
      conversation_id: '2',
      sender_id: '1',
      receiver_id: '3',
      content: 'ヒーリングセッションの予約について',
      is_read: true,
      is_encrypted: true,
      created_at: '2024-01-19T15:45:00Z'
    },
    unread_count: 0,
    updated_at: '2024-01-19T15:45:00Z'
  },
  {
    id: '3',
    user1_id: '1',
    user2_id: '4',
    other_user: mockUsers[3],
    last_message: {
      id: 'msg3',
      conversation_id: '3',
      sender_id: '4',
      receiver_id: '1',
      content: '音声メッセージを送りました',
      audio_url: 'https://example.com/audio/voice-msg.mp3',
      audio_duration: 180,
      is_read: false,
      is_encrypted: true,
      created_at: '2024-01-20T08:00:00Z'
    },
    unread_count: 1,
    updated_at: '2024-01-20T08:00:00Z'
  }
];

export const mockMessages: MockMessage[] = [
  // Conversation 1 messages
  {
    id: 'msg1-1',
    conversation_id: '1',
    sender_id: '1',
    receiver_id: '2',
    content: 'たかしさん、おはようございます！今朝の瞑想ライブ配信楽しみにしています✨',
    is_read: true,
    is_encrypted: true,
    created_at: '2024-01-20T04:30:00Z'
  },
  {
    id: 'msg1-2',
    conversation_id: '1',
    sender_id: '2',
    receiver_id: '1',
    content: '明子さん、おはようございます！今日は特別な満月のエネルギーワークを行います。',
    is_read: true,
    is_encrypted: true,
    created_at: '2024-01-20T04:45:00Z'
  },
  {
    id: 'msg1-3',
    conversation_id: '1',
    sender_id: '2',
    receiver_id: '1',
    content: '準備ができたら音声で詳細をお送りしますね',
    audio_url: 'https://example.com/audio/dm-voice1.mp3',
    audio_duration: 240,
    is_read: false,
    is_encrypted: true,
    created_at: '2024-01-20T05:00:00Z'
  },
  {
    id: 'msg1',
    conversation_id: '1',
    sender_id: '2',
    receiver_id: '1',
    content: '今朝の瞑想セッション、とても良かったです！',
    is_read: false,
    is_encrypted: true,
    created_at: '2024-01-20T10:30:00Z'
  },
  // Conversation 2 messages
  {
    id: 'msg2-1',
    conversation_id: '2',
    sender_id: '1',
    receiver_id: '3',
    content: 'ゆみさん、来週のヒーリングセッションの件でご相談があります。',
    is_read: true,
    is_encrypted: true,
    created_at: '2024-01-19T14:00:00Z'
  },
  {
    id: 'msg2-2',
    conversation_id: '2',
    sender_id: '3',
    receiver_id: '1',
    content: '明子さん、もちろんです！どのような内容でしょうか？',
    image_url: 'https://picsum.photos/seed/dm2/300/200',
    is_read: true,
    is_encrypted: true,
    created_at: '2024-01-19T14:30:00Z'
  },
  {
    id: 'msg2',
    conversation_id: '2',
    sender_id: '1',
    receiver_id: '3',
    content: 'ヒーリングセッションの予約について',
    is_read: true,
    is_encrypted: true,
    created_at: '2024-01-19T15:45:00Z'
  }
];

export const getMockConversation = (conversationId: string): MockConversation | undefined => {
  return mockConversations.find(conv => conv.id === conversationId);
};

export const getMockMessages = (conversationId: string): MockMessage[] => {
  return mockMessages.filter(msg => msg.conversation_id === conversationId);
};