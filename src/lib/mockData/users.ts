export interface MockUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  email: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_verified: boolean;
  created_at: string;
  public_key?: string;
  private_key?: string;
}

export const mockUsers: MockUser[] = [
  {
    id: '1',
    username: 'akiko_spirit',
    display_name: '明子☆スピリチュアルガイド',
    avatar_url: 'https://picsum.photos/seed/user1/200',
    bio: '魂の目醒めをサポートする光のワーカー✨ 毎日の瞑想音声を配信中🧘‍♀️ ヒーリング・チャネリング・タロット',
    email: 'akiko@example.com',
    followers_count: 15420,
    following_count: 892,
    posts_count: 1234,
    is_verified: true,
    created_at: '2023-01-15T09:00:00Z'
  },
  {
    id: '2',
    username: 'hiroshi_zen',
    display_name: 'ひろし🧘‍♂️禅マスター',
    avatar_url: 'https://picsum.photos/seed/zen-master/200',
    bio: '15年間の座禅修行 | 毎朝5時からライブ瞑想配信 | 心の平安を共に見つけましょう',
    email: 'hiroshi@example.com',
    followers_count: 23840,
    following_count: 145,
    posts_count: 2156,
    is_verified: true,
    created_at: '2022-08-10T05:00:00Z'
  },
  {
    id: '3',
    username: 'miho_crystal',
    display_name: 'みほ💎クリスタルセラピスト',
    avatar_url: 'https://picsum.photos/seed/crystal-healer/200',
    bio: 'クリスタルボウル奏者 | ヒーリング音声配信 | 石の声をお届けします✨',
    email: 'miho@example.com',
    followers_count: 8765,
    following_count: 342,
    posts_count: 987,
    is_verified: false,
    created_at: '2023-02-14T12:30:00Z'
  },
  {
    id: '4',
    username: 'taro_astro',
    display_name: '太郎🌟星読み師',
    avatar_url: 'https://picsum.photos/seed/astrologer/200',
    bio: '占星術で魂の地図を読み解きます | 新月満月の音声解説 | 個人鑑定受付中',
    email: 'taro@example.com',
    followers_count: 18293,
    following_count: 567,
    posts_count: 1543,
    is_verified: true,
    created_at: '2022-11-25T18:00:00Z'
  },
  {
    id: '5',
    username: 'yuki_channeler',
    display_name: 'ゆき❄️高次元メッセンジャー',
    avatar_url: 'https://picsum.photos/seed/channeler/200',
    bio: 'プレアデス星団とのコンタクト | 宇宙からのメッセージ音声配信 | 毎週金曜20時ライブ',
    email: 'yuki@example.com',
    followers_count: 12456,
    following_count: 234,
    posts_count: 876,
    is_verified: false,
    created_at: '2023-04-20T20:00:00Z'
  },
  {
    id: '6',
    username: 'hanako_reiki',
    display_name: 'はなこ🌸レイキティーチャー',
    avatar_url: 'https://picsum.photos/seed/reiki-teacher/200',
    bio: 'レイキマスター歴10年 | 遠隔ヒーリング音声 | 愛と光の波動をお送りします',
    email: 'hanako@example.com',
    followers_count: 6789,
    following_count: 445,
    posts_count: 1234,
    is_verified: false,
    created_at: '2023-01-08T10:15:00Z'
  },
  {
    id: '7',
    username: 'kenta_mindful',
    display_name: '健太🌿マインドフルネス講師',
    avatar_url: 'https://picsum.photos/seed/mindfulness/200',
    bio: '心理学博士 | マインドフルネス瞑想ガイド | 科学的アプローチで心の平穏を',
    email: 'kenta@example.com',
    followers_count: 15432,
    following_count: 289,
    posts_count: 1678,
    is_verified: true,
    created_at: '2022-09-15T14:30:00Z'
  },
  {
    id: '8',
    username: 'luna_tarot',
    display_name: 'ルナ🌙タロット占い師',
    avatar_url: 'https://picsum.photos/seed/tarot-reader/200',
    bio: 'タロット歴12年 | 月のリズムに合わせたリーディング | 音声鑑定も承ります',
    email: 'luna@example.com',
    followers_count: 9876,
    following_count: 378,
    posts_count: 2341,
    is_verified: false,
    created_at: '2023-03-12T21:45:00Z'
  }
];

export const mockCurrentUser: MockUser = mockUsers[0];

export const getMockUser = (userId: string): MockUser | undefined => {
  return mockUsers.find(user => user.id === userId);
};