import { mockUsers } from './users';

export interface MockPost {
  id: string;
  user: {
    id: string;
    displayName: string;
    profileImageUrl?: string;
  };
  contentType: 'text' | 'image' | 'audio' | 'video';
  textContent?: string;
  mediaUrl?: string;
  waveformUrl?: string;
  durationSeconds?: number;
  aiMetadata?: {
    summary?: string;
  };
  createdAt: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isHighlighted: boolean;
  isBookmarked: boolean;
}

export interface MockComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  is_liked?: boolean;
  created_at: string;
}

export const mockPosts: MockPost[] = [
  // 音声投稿
  {
    id: 'post-1',
    user: {
      id: '1',
      displayName: '明子☆スピリチュアルガイド',
      profileImageUrl: 'https://picsum.photos/seed/user1/200',
    },
    contentType: 'audio',
    textContent: '【朝の瞑想ガイド】\n今朝受け取った宇宙からの愛のメッセージをお届けします✨\n\n心を静めて、魂の声に耳を傾けてみてください。新しい扉が開かれるのを感じるでしょう🚪',
    mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    durationSeconds: 1800, // 30分
    aiMetadata: {
      summary: '愛と平和のエネルギーを込めた朝の瞑想ガイダンス。内なる光の目醒めをサポートします。',
    },
    createdAt: '2024-01-20T06:30:00Z',
    likes: 1245,
    comments: 89,
    isLiked: true,
    isHighlighted: true,
    isBookmarked: true,
  },
  // テキスト投稿
  {
    id: 'post-2',
    user: {
      id: '7',
      displayName: '健太🌿マインドフルネス講師',
      profileImageUrl: 'https://picsum.photos/seed/mindfulness/200',
    },
    contentType: 'text',
    textContent: '【今日の気づき】\n\n呼吸に意識を向けるとき、私たちは「今この瞬間」という贈り物を受け取っています🎁\n\n過去への後悔や未来への不安から解放され、純粋な存在そのものになれる瞬間。\n\nこの瞬間こそが、私たちが求めていた平安なのかもしれません。\n\n#マインドフルネス #呼吸瞑想 #今を生きる',
    createdAt: '2024-01-19T21:15:00Z',
    likes: 567,
    comments: 123,
    isLiked: false,
    isHighlighted: false,
    isBookmarked: true,
  },
  // 音声投稿
  {
    id: 'post-3',
    user: {
      id: '3',
      displayName: 'みほ💎クリスタルセラピスト',
      profileImageUrl: 'https://picsum.photos/seed/crystal-healer/200',
    },
    contentType: 'audio',
    textContent: '【432Hz クリスタルボウル瞑想】\n\n心を癒す水晶の音色🔮\nDNAレベルでの浄化と調和をサポートする周波数で奏でています。深いリラクゼーションをお楽しみください。',
    mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    waveformUrl: 'https://picsum.photos/seed/waveform1/400/60',
    durationSeconds: 3600, // 1時間
    aiMetadata: {
      summary: '432Hz周波数のクリスタルボウル演奏。深い癒しと内なる平安をもたらします。',
    },
    createdAt: '2024-01-18T14:30:00Z',
    likes: 892,
    comments: 156,
    isLiked: true,
    isHighlighted: false,
    isBookmarked: true,
  },
  // 画像投稿
  {
    id: 'post-4',
    user: {
      id: '8',
      displayName: 'ルナ🌙タロット占い師',
      profileImageUrl: 'https://picsum.photos/seed/tarot-reader/200',
    },
    contentType: 'image',
    textContent: '【今日のオラクルカード】\n\n「新しい章の始まり」📖✨\n\n古いパターンを手放し、魂が本当に望む道へ一歩踏み出すとき。\n宇宙があなたを全力でサポートしています🌟\n\n#オラクルカード #新しい始まり #魂の導き',
    mediaUrl: 'https://picsum.photos/seed/oracle-cards-today/500/600',
    createdAt: '2024-01-17T08:00:00Z',
    likes: 634,
    comments: 78,
    isLiked: false,
    isHighlighted: true,
    isBookmarked: true,
  },
  // 音声投稿
  {
    id: 'post-5',
    user: {
      id: '5',
      displayName: 'ゆき❄️高次元メッセンジャー',
      profileImageUrl: 'https://picsum.photos/seed/channeler/200',
    },
    contentType: 'audio',
    textContent: '【緊急チャネリング】プレアデス評議会からのメッセージ🛸\n\n地球のアセンション期における重要な導きを受け取りました。今、私たちに必要な光のコードをお伝えします。',
    mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    waveformUrl: 'https://picsum.photos/seed/waveform2/400/60',
    durationSeconds: 2700, // 45分
    aiMetadata: {
      summary: '高次元存在からの愛のメッセージ。地球の変革期における魂の使命についてのガイダンス。',
    },
    createdAt: '2024-01-16T19:00:00Z',
    likes: 1456,
    comments: 234,
    isLiked: true,
    isHighlighted: false,
    isBookmarked: false,
  },
  // 画像投稿
  {
    id: 'post-6',
    user: {
      id: '1',
      displayName: '明子☆スピリチュアルガイド',
      profileImageUrl: 'https://picsum.photos/seed/user1/200',
    },
    contentType: 'image',
    textContent: '【神聖な朝の儀式】🌅\n\n太陽と共に目醒める時間。\n自然の中で行う瞑想は、宇宙との繋がりを深めてくれます。\n\n皆さんも朝日を浴びながら、感謝の気持ちを込めて一日をスタートしてみてください💛',
    mediaUrl: 'https://picsum.photos/seed/sunrise-meditation/600/400',
    createdAt: '2024-01-15T05:45:00Z',
    likes: 423,
    comments: 67,
    isLiked: false,
    isHighlighted: false,
    isBookmarked: true,
  },
  // テキスト投稿
  {
    id: 'post-7',
    user: {
      id: '4',
      displayName: '太郎🌟星読み師',
      profileImageUrl: 'https://picsum.photos/seed/astrologer/200',
    },
    contentType: 'text',
    textContent: '【2024年 水瓶座新月のメッセージ】🌑\n\n今回の新月は特別なエネルギーを帯びています。\n\n✨ 古い価値観の解放\n✨ 真の自分との再会\n✨ 魂の使命の覚醒\n\nこの機会に、本当の自分らしい生き方にシフトしていきましょう。\n\n宇宙があなたの変化を全力でサポートしています🙏\n\n#新月 #水瓶座 #占星術 #魂の使命',
    createdAt: '2024-01-14T22:30:00Z',
    likes: 789,
    comments: 145,
    isLiked: false,
    isHighlighted: true,
    isBookmarked: false,
  },
  // 画像投稿
  {
    id: 'post-8',
    user: {
      id: '6',
      displayName: 'はなこ🌸レイキティーチャー',
      profileImageUrl: 'https://picsum.photos/seed/reiki-teacher/200',
    },
    contentType: 'image',
    textContent: '【レイキヒーリングセッション後の浄化】🌸\n\n今日もたくさんの愛を込めて遠隔ヒーリングをお送りしました💕\n\nセッション後のクリスタル浄化。石たちも疲れを癒し、再び美しく光っています✨\n\n受け取ってくださった皆様、ありがとうございました🙏',
    mediaUrl: 'https://picsum.photos/seed/healing-crystals/500/500',
    createdAt: '2024-01-13T18:20:00Z',
    likes: 345,
    comments: 56,
    isLiked: true,
    isHighlighted: false,
    isBookmarked: false,
  }
];

export const mockComments: MockComment[] = [
  {
    id: '1',
    post_id: 'post-1',
    user_id: '2',
    content: '素晴らしい気づきをシェアしてくださりありがとうございます！✨',
    likes_count: 12,
    is_liked: false,
    created_at: '2024-01-20T07:00:00Z'
  },
  {
    id: '2',
    post_id: 'post-3',
    user_id: '1',
    content: 'クリスタルボウルの音色、本当に心が癒されました🔮',
    likes_count: 34,
    is_liked: true,
    created_at: '2024-01-18T15:30:00Z'
  }
];

export const getMockPost = (postId: string): MockPost | undefined => {
  return mockPosts.find(post => post.id === postId);
};

export const getMockPostComments = (postId: string): MockComment[] => {
  return mockComments.filter(comment => comment.post_id === postId);
};