import { mockUsers } from './users';

export interface MockEvent {
  id: string;
  host_id: string;
  host?: typeof mockUsers[0];
  title: string;
  description: string;
  event_type: 'online' | 'offline' | 'hybrid';
  category: 'meditation' | 'healing' | 'workshop' | 'retreat' | 'other';
  start_date: string;
  end_date: string;
  location?: string;
  online_url?: string;
  capacity: number;
  current_participants: number;
  price: number;
  currency: string;
  cover_image: string;
  is_registered?: boolean;
  created_at: string;
}

export const mockEvents: MockEvent[] = [
  {
    id: '1',
    host_id: '1',
    host: mockUsers[0],
    title: '新月の浄化瞑想会',
    description: '新月のパワフルなエネルギーを使って、不要なものを手放し、新しい自分に生まれ変わる瞑想会です。\n\n【内容】\n・新月のエネルギーについての解説\n・浄化のための誘導瞑想\n・願いを叶えるアファメーション\n・参加者同士のシェアリング',
    event_type: 'online',
    category: 'meditation',
    start_date: '2024-02-09T19:00:00Z',
    end_date: '2024-02-09T21:00:00Z',
    online_url: 'https://zoom.us/j/123456789',
    capacity: 50,
    current_participants: 42,
    price: 3000,
    currency: 'JPY',
    cover_image: 'https://picsum.photos/seed/event1/600/400',
    is_registered: true,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    host_id: '2',
    host: mockUsers[1],
    title: '7日間瞑想リトリート in 高野山',
    description: '聖地・高野山で行う本格的な瞑想リトリート。\n日常から離れ、自分自身と深く向き合う7日間。\n\n【プログラム】\n・朝の座禅瞑想\n・マインドフルネスウォーキング\n・写経体験\n・精進料理\n・個人セッション',
    event_type: 'offline',
    category: 'retreat',
    start_date: '2024-03-20T14:00:00Z',
    end_date: '2024-03-27T12:00:00Z',
    location: '和歌山県高野山',
    capacity: 20,
    current_participants: 18,
    price: 180000,
    currency: 'JPY',
    cover_image: 'https://picsum.photos/seed/event2/600/400',
    is_registered: false,
    created_at: '2024-01-10T08:00:00Z'
  },
  {
    id: '3',
    host_id: '3',
    host: mockUsers[2],
    title: 'クリスタルヒーリング基礎講座',
    description: 'クリスタルの基本的な使い方から、ヒーリングの実践まで学べる講座です。\n\n【学べること】\n・クリスタルの選び方\n・浄化とチャージの方法\n・チャクラとクリスタルの対応\n・セルフヒーリングの実践\n・他者へのヒーリング方法',
    event_type: 'hybrid',
    category: 'workshop',
    start_date: '2024-02-24T10:00:00Z',
    end_date: '2024-02-24T17:00:00Z',
    location: '東京都渋谷区',
    online_url: 'https://zoom.us/j/987654321',
    capacity: 30,
    current_participants: 25,
    price: 15000,
    currency: 'JPY',
    cover_image: 'https://picsum.photos/seed/event3/600/400',
    is_registered: true,
    created_at: '2024-01-18T14:00:00Z'
  },
  {
    id: '4',
    host_id: '4',
    host: mockUsers[3],
    title: '2024年の星読みワークショップ',
    description: '2024年の天体の動きと、それが私たちに与える影響について学ぶワークショップ。\n\n個人の出生図を元に、2024年のあなたのテーマを読み解きます。',
    event_type: 'online',
    category: 'workshop',
    start_date: '2024-02-03T14:00:00Z',
    end_date: '2024-02-03T17:00:00Z',
    online_url: 'https://zoom.us/j/555666777',
    capacity: 100,
    current_participants: 67,
    price: 5000,
    currency: 'JPY',
    cover_image: 'https://picsum.photos/seed/event4/600/400',
    is_registered: false,
    created_at: '2024-01-12T09:00:00Z'
  },
  {
    id: '5',
    host_id: '5',
    host: mockUsers[4],
    title: '天使と繋がるチャネリング入門',
    description: '守護天使や大天使たちとコンタクトを取る方法を学ぶ入門講座。\n\n安全にチャネリングを行うための基礎知識と実践方法をお伝えします。',
    event_type: 'online',
    category: 'workshop',
    start_date: '2024-02-17T19:00:00Z',
    end_date: '2024-02-17T21:30:00Z',
    online_url: 'https://zoom.us/j/111222333',
    capacity: 40,
    current_participants: 38,
    price: 8000,
    currency: 'JPY',
    cover_image: 'https://picsum.photos/seed/event5/600/400',
    is_registered: true,
    created_at: '2024-01-20T16:00:00Z'
  }
];

export const getMockEvent = (eventId: string): MockEvent | undefined => {
  return mockEvents.find(event => event.id === eventId);
};

export const getMockUserEvents = (userId: string): MockEvent[] => {
  return mockEvents.filter(event => event.host_id === userId);
};