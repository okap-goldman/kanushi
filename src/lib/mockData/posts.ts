import { mockUsers } from './users';

export interface MockPost {
  id: string;
  user_id: string;
  user?: typeof mockUsers[0];
  content: string;
  audio_url?: string;
  audio_duration?: number;
  image_urls?: string[];
  video_url?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  highlights_count: number;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  is_highlighted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockComment {
  id: string;
  post_id: string;
  user_id: string;
  user?: typeof mockUsers[0];
  content: string;
  audio_url?: string;
  audio_duration?: number;
  likes_count: number;
  is_liked?: boolean;
  created_at: string;
}

export const mockPosts: MockPost[] = [
  {
    id: 'post-1',
    user_id: '1',
    user: mockUsers[0],
    content: '今朝の瞑想で素晴らしい気づきがありました✨\n宇宙からのメッセージを音声でシェアします。\n\n#瞑想 #スピリチュアル #目醒め',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    audio_duration: 1200, // 20分
    likes_count: 234,
    comments_count: 45,
    shares_count: 12,
    highlights_count: 89,
    is_liked: true,
    is_bookmarked: false,
    is_highlighted: true,
    created_at: '2024-01-20T06:30:00Z',
    updated_at: '2024-01-20T06:30:00Z'
  },
  {
    id: 'post-2',
    user_id: '2',
    user: mockUsers[1],
    content: '【満月のエネルギーワーク】\n今夜は特別な満月です🌕\n一緒に浄化と解放の瞑想を行いましょう。\n\n音声ガイドは8時間の長時間バージョンです。',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    audio_duration: 28800, // 8時間
    image_urls: ['https://picsum.photos/seed/post2/400/300'],
    likes_count: 567,
    comments_count: 123,
    shares_count: 89,
    highlights_count: 234,
    is_liked: false,
    is_bookmarked: true,
    is_highlighted: false,
    created_at: '2024-01-19T20:00:00Z',
    updated_at: '2024-01-19T20:00:00Z'
  },
  {
    id: 'post-3',
    user_id: '3',
    user: mockUsers[2],
    content: 'クリスタルボウルの音色で心身を整える💎\n\n第3チャクラの活性化に特化した音声セッションです。\n自信と行動力を高めたい方におすすめ！',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    audio_duration: 3600, // 1時間
    likes_count: 123,
    comments_count: 34,
    shares_count: 23,
    highlights_count: 56,
    is_liked: true,
    is_bookmarked: true,
    is_highlighted: false,
    created_at: '2024-01-18T14:00:00Z',
    updated_at: '2024-01-18T14:00:00Z'
  },
  {
    id: 'post-4',
    user_id: '4',
    user: mockUsers[3],
    content: '2024年の星の動きについて解説します🌟\n\n特に水瓶座の時代への移行期における\n私たちの魂の使命について語りました。',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    audio_duration: 5400, // 1.5時間
    image_urls: [
      'https://picsum.photos/seed/post4-1/400/300',
      'https://picsum.photos/seed/post4-2/400/300'
    ],
    likes_count: 890,
    comments_count: 156,
    shares_count: 234,
    highlights_count: 345,
    is_liked: false,
    is_bookmarked: false,
    is_highlighted: true,
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z'
  },
  {
    id: 'post-5',
    user_id: '5',
    user: mockUsers[4],
    content: '大天使ミカエルからの緊急メッセージ⚔️\n\n今、地球に降り注ぐ光のエネルギーについて\n重要なお知らせがあります。',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    audio_duration: 2700, // 45分
    likes_count: 456,
    comments_count: 89,
    shares_count: 123,
    highlights_count: 167,
    is_liked: true,
    is_bookmarked: false,
    is_highlighted: false,
    created_at: '2024-01-16T18:30:00Z',
    updated_at: '2024-01-16T18:30:00Z'
  },
  {
    id: 'post-6',
    user_id: '1',
    user: mockUsers[0],
    content: '朝の瞑想場所🌅\n\n自然の中で心を静める時間。\n木々のささやきと鳥のさえずりが\n私たちを本来の自分へと導いてくれます。\n\n#自然瞑想 #朝活 #マインドフルネス',
    image_urls: [
      'https://picsum.photos/seed/meditation-spot/400/400',
      'https://picsum.photos/seed/nature-morning/400/400',
      'https://picsum.photos/seed/peaceful-forest/400/400'
    ],
    likes_count: 342,
    comments_count: 67,
    shares_count: 45,
    highlights_count: 123,
    is_liked: false,
    is_bookmarked: true,
    is_highlighted: false,
    created_at: '2024-01-15T05:30:00Z',
    updated_at: '2024-01-15T05:30:00Z'
  },
  {
    id: 'post-7',
    user_id: '3',
    user: mockUsers[2],
    content: 'クリスタルコレクション✨\n\n新しく迎えた仲間たち。\nそれぞれが持つ波動とエネルギーを感じながら\n浄化と調整を行っています。\n\n特にローズクォーツの優しいエネルギーが\n今の私にぴったりです💗',
    image_urls: ['https://picsum.photos/seed/crystals/400/500'],
    likes_count: 234,
    comments_count: 45,
    shares_count: 23,
    highlights_count: 89,
    is_liked: true,
    is_bookmarked: false,
    is_highlighted: true,
    created_at: '2024-01-14T14:00:00Z',
    updated_at: '2024-01-14T14:00:00Z'
  },
  {
    id: 'post-8',
    user_id: '2',
    user: mockUsers[1],
    content: '今朝のオラクルカード💫\n\n「新しい始まり」のメッセージ。\n変化を恐れず、流れに身を任せて\n進んでいくタイミングが来ています。\n\n皆さんにも素晴らしい一日を🙏',
    image_urls: ['https://picsum.photos/seed/oracle-cards/400/300'],
    likes_count: 567,
    comments_count: 123,
    shares_count: 89,
    highlights_count: 234,
    is_liked: false,
    is_bookmarked: false,
    is_highlighted: false,
    created_at: '2024-01-13T07:00:00Z',
    updated_at: '2024-01-13T07:00:00Z'
  }
];

export const mockComments: MockComment[] = [
  {
    id: '1',
    post_id: 'post-1',
    user_id: '2',
    user: mockUsers[1],
    content: '素晴らしい気づきをシェアしてくださりありがとうございます！私も同じような体験をしました。',
    likes_count: 12,
    is_liked: false,
    created_at: '2024-01-20T07:00:00Z'
  },
  {
    id: '2',
    post_id: 'post-1',
    user_id: '3',
    user: mockUsers[2],
    content: 'この音声を聞いて涙が止まりませんでした😭✨',
    audio_url: 'https://example.com/audio/comment2.mp3',
    audio_duration: 120,
    likes_count: 34,
    is_liked: true,
    created_at: '2024-01-20T08:30:00Z'
  },
  {
    id: '3',
    post_id: 'post-2',
    user_id: '1',
    user: mockUsers[0],
    content: '満月のエネルギー、本当に強力でしたね！一緒に瞑想できて嬉しいです🙏',
    likes_count: 45,
    is_liked: false,
    created_at: '2024-01-19T21:00:00Z'
  }
];

export const getMockPost = (postId: string): MockPost | undefined => {
  return mockPosts.find(post => post.id === postId);
};

export const getMockPostComments = (postId: string): MockComment[] => {
  return mockComments.filter(comment => comment.post_id === postId);
};