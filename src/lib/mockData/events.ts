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

export interface MockEventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  user?: typeof mockUsers[0];
  status: 'attending' | 'interested' | 'not_attending';
  joined_at: string;
}

export interface MockEventComment {
  id: string;
  event_id: string;
  user_id: string;
  user?: typeof mockUsers[0];
  content: string;
  audio_url?: string;
  audio_duration?: number;
  likes_count: number;
  is_liked?: boolean;
  created_at: string;
}

export interface MockEventPost {
  id: string;
  event_id: string;
  user_id: string;
  user?: typeof mockUsers[0];
  title: string;
  content: string;
  audio_url?: string;
  audio_duration?: number;
  image_urls?: string[];
  likes_count: number;
  comments_count: number;
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
    start_date: '2024-12-15T19:00:00Z',
    end_date: '2024-12-15T21:00:00Z',
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
    start_date: '2024-12-28T10:00:00Z',
    end_date: '2024-12-28T17:00:00Z',
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

// 参加者のモックデータ
export const mockEventParticipants: MockEventParticipant[] = [
  // 新月の浄化瞑想会の参加者（明子が主催）
  { id: 'p1', event_id: '1', user_id: '2', user: mockUsers[1], status: 'attending', joined_at: '2024-01-16T10:00:00Z' },
  { id: 'p2', event_id: '1', user_id: '3', user: mockUsers[2], status: 'attending', joined_at: '2024-01-17T14:30:00Z' },
  { id: 'p3', event_id: '1', user_id: '4', user: mockUsers[3], status: 'attending', joined_at: '2024-01-18T09:15:00Z' },
  { id: 'p4', event_id: '1', user_id: '5', user: mockUsers[4], status: 'attending', joined_at: '2024-01-19T16:45:00Z' },
  { id: 'p5', event_id: '1', user_id: '6', user: mockUsers[5], status: 'attending', joined_at: '2024-01-20T08:15:00Z' },
  { id: 'p6', event_id: '1', user_id: '7', user: mockUsers[6], status: 'interested', joined_at: '2024-01-21T12:30:00Z' },
  { id: 'p7', event_id: '1', user_id: '8', user: mockUsers[7], status: 'attending', joined_at: '2024-01-22T19:45:00Z' },
  
  // 7日間瞑想リトリートの参加者  
  { id: 'p8', event_id: '2', user_id: '1', user: mockUsers[0], status: 'interested', joined_at: '2024-01-12T11:00:00Z' },
  { id: 'p9', event_id: '2', user_id: '3', user: mockUsers[2], status: 'attending', joined_at: '2024-01-13T13:20:00Z' },
  { id: 'p10', event_id: '2', user_id: '5', user: mockUsers[4], status: 'attending', joined_at: '2024-01-14T08:30:00Z' },
  
  // クリスタルヒーリング基礎講座の参加者
  { id: 'p11', event_id: '3', user_id: '1', user: mockUsers[0], status: 'attending', joined_at: '2024-01-19T12:00:00Z' },
  { id: 'p12', event_id: '3', user_id: '2', user: mockUsers[1], status: 'attending', joined_at: '2024-01-20T15:30:00Z' },
  { id: 'p13', event_id: '3', user_id: '4', user: mockUsers[3], status: 'attending', joined_at: '2024-01-21T10:45:00Z' },
];

// イベントコメントのモックデータ
export const mockEventComments: MockEventComment[] = [
  // 新月の浄化瞑想会のコメント
  {
    id: 'ec1',
    event_id: '1',
    user_id: '2',
    user: mockUsers[1],
    content: 'とても楽しみにしています！前回の瞑想会でも素晴らしい体験ができました✨',
    likes_count: 8,
    is_liked: true,
    created_at: '2024-01-17T15:00:00Z'
  },
  {
    id: 'ec2', 
    event_id: '1',
    user_id: '3',
    user: mockUsers[2],
    content: '新月のエネルギーを一緒に感じられることに感謝します🌑 どんな気づきが得られるか楽しみです！',
    likes_count: 12,
    is_liked: false,
    created_at: '2024-01-18T09:30:00Z'
  },
  {
    id: 'ec3',
    event_id: '1', 
    user_id: '5',
    user: mockUsers[4],
    content: '明子さんの誘導瞑想はいつも深い癒しをもたらしてくれます。今回も参加させていただきます🙏',
    audio_url: 'https://example.com/audio/comment-ec3.mp3',
    audio_duration: 45,
    likes_count: 15,
    is_liked: true,
    created_at: '2024-01-19T18:15:00Z'
  },
  
  // クリスタルヒーリング基礎講座のコメント
  {
    id: 'ec4',
    event_id: '3',
    user_id: '1',
    user: mockUsers[0],
    content: 'クリスタルヒーリングについて学びたいと思っていました！ゆみさんの講座は分かりやすそうですね💎',
    likes_count: 6,
    is_liked: false,
    created_at: '2024-01-20T11:00:00Z'
  },
  {
    id: 'ec5',
    event_id: '3',
    user_id: '2',
    user: mockUsers[1],
    content: 'ハイブリッド開催なのが嬉しいです。遠方からでもオンラインで参加できるのが助かります！',
    likes_count: 9,
    is_liked: true,
    created_at: '2024-01-21T14:20:00Z'
  }
];

// イベント関連投稿のモックデータ
export const mockEventPosts: MockEventPost[] = [
  {
    id: 'ep1',
    event_id: '1',
    user_id: '1',
    user: mockUsers[0],
    title: '新月瞑想会の準備について',
    content: '明日の新月瞑想会に向けて、心と空間の準備をしましょう✨\n\n【準備していただくもの】\n・静かに座れる場所\n・リラックスできる服装\n・お水（浄化されたもの）\n・ノートとペン（気づきを記録用）\n\n皆さまとお会いできることを楽しみにしています🌑',
    audio_url: 'https://example.com/audio/event-prep-1.mp3',
    audio_duration: 180,
    image_urls: ['https://picsum.photos/seed/event-prep/400/300'],
    likes_count: 45,
    comments_count: 12,
    created_at: '2024-02-08T19:00:00Z'
  },
  {
    id: 'ep2',
    event_id: '3',
    user_id: '3',
    user: mockUsers[2],
    title: 'クリスタル講座で使用する石たち',
    content: '今度の講座で実際に触れていただく美しいクリスタルたちです💎\n\nローズクォーツ、アメジスト、クリアクォーツなど、初心者の方にも扱いやすい石を厳選しました。\n\nそれぞれの石が持つエネルギーを実際に感じていただけるようにセッティングしています✨',
    image_urls: [
      'https://picsum.photos/seed/crystal-set-1/400/300',
      'https://picsum.photos/seed/crystal-set-2/400/300'
    ],
    likes_count: 38,
    comments_count: 8,
    created_at: '2024-02-22T16:30:00Z'
  }
];

export const getMockEvent = (eventId: string): MockEvent | undefined => {
  return mockEvents.find(event => event.id === eventId);
};

export const getMockUserEvents = (userId: string): MockEvent[] => {
  return mockEvents.filter(event => event.host_id === userId);
};

export const getMockEventParticipants = (eventId: string): MockEventParticipant[] => {
  return mockEventParticipants.filter(participant => participant.event_id === eventId);
};

export const getMockEventComments = (eventId: string): MockEventComment[] => {
  return mockEventComments.filter(comment => comment.event_id === eventId);
};

export const getMockEventPosts = (eventId: string): MockEventPost[] => {
  return mockEventPosts.filter(post => post.event_id === eventId);
};