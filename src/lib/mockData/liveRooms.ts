import { mockUsers } from './users';

export interface MockLiveRoom {
  id: string;
  host_id: string;
  host?: typeof mockUsers[0];
  title: string;
  description: string;
  room_type: 'public' | 'private' | 'paid';
  category: 'meditation' | 'healing' | 'talk' | 'reading' | 'other';
  participant_count: number;
  max_participants: number;
  is_recording: boolean;
  scheduled_start?: string;
  started_at?: string;
  status: 'scheduled' | 'live' | 'ended';
  entry_fee?: number;
  currency?: string;
  cover_image?: string;
}

export interface MockLiveRoomParticipant {
  room_id: string;
  user_id: string;
  user?: typeof mockUsers[0];
  role: 'host' | 'speaker' | 'listener';
  joined_at: string;
  is_muted: boolean;
}

export const mockLiveRooms: MockLiveRoom[] = [
  {
    id: '1',
    host_id: '1',
    host: mockUsers[0],
    title: '朝の瞑想ルーム☀️',
    description: '一日の始まりを穏やかに。誘導瞑想で心を整えましょう。',
    room_type: 'public',
    category: 'meditation',
    participant_count: 23,
    max_participants: 100,
    is_recording: true,
    started_at: '2024-01-21T05:00:00Z',
    status: 'live',
    cover_image: 'https://picsum.photos/seed/live1/400/300'
  },
  {
    id: '2',
    host_id: '2',
    host: mockUsers[1],
    title: '満月のエネルギーワーク🌕',
    description: '満月の強力なエネルギーを使った浄化と願望実現のワーク',
    room_type: 'paid',
    category: 'healing',
    participant_count: 45,
    max_participants: 50,
    is_recording: false,
    scheduled_start: '2024-01-25T19:00:00Z',
    status: 'scheduled',
    entry_fee: 1500,
    currency: 'JPY',
    cover_image: 'https://picsum.photos/seed/live2/400/300'
  },
  {
    id: '3',
    host_id: '3',
    host: mockUsers[2],
    title: 'クリスタルヒーリング体験会💎',
    description: 'クリスタルの波動を音声で体感。チャクラの調整を行います。',
    room_type: 'public',
    category: 'healing',
    participant_count: 67,
    max_participants: 200,
    is_recording: true,
    started_at: '2024-01-21T14:00:00Z',
    status: 'live',
    cover_image: 'https://picsum.photos/seed/live3/400/300'
  },
  {
    id: '4',
    host_id: '4',
    host: mockUsers[3],
    title: '今週の星読み配信⭐',
    description: '今週の天体の動きと12星座別メッセージ',
    room_type: 'public',
    category: 'reading',
    participant_count: 89,
    max_participants: 300,
    is_recording: true,
    started_at: '2024-01-21T10:00:00Z',
    status: 'ended',
    cover_image: 'https://picsum.photos/seed/live4/400/300'
  },
  {
    id: '5',
    host_id: '5',
    host: mockUsers[4],
    title: '天使からのメッセージ👼',
    description: 'あなたの守護天使からのメッセージをチャネリングします',
    room_type: 'private',
    category: 'reading',
    participant_count: 12,
    max_participants: 20,
    is_recording: false,
    scheduled_start: '2024-01-22T20:00:00Z',
    status: 'scheduled',
    cover_image: 'https://picsum.photos/seed/live5/400/300'
  }
];

export const mockLiveRoomParticipants: MockLiveRoomParticipant[] = [
  {
    room_id: '1',
    user_id: '1',
    user: mockUsers[0],
    role: 'host',
    joined_at: '2024-01-21T05:00:00Z',
    is_muted: false
  },
  {
    room_id: '1',
    user_id: '2',
    user: mockUsers[1],
    role: 'speaker',
    joined_at: '2024-01-21T05:05:00Z',
    is_muted: false
  },
  {
    room_id: '1',
    user_id: '3',
    user: mockUsers[2],
    role: 'listener',
    joined_at: '2024-01-21T05:10:00Z',
    is_muted: true
  }
];

export const getMockLiveRoom = (roomId: string): MockLiveRoom | undefined => {
  return mockLiveRooms.find(room => room.id === roomId);
};

export const getMockLiveRoomParticipants = (roomId: string): MockLiveRoomParticipant[] => {
  return mockLiveRoomParticipants.filter(p => p.room_id === roomId);
};