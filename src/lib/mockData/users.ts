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
    username: 'takashi_meditation',
    display_name: 'たかし | 瞑想マスター',
    avatar_url: 'https://picsum.photos/seed/user2/200',
    bio: '10年間の修行を経て悟りを開く。毎朝5時から瞑想音声ライブ配信。宇宙意識との繋がりを深めましょう。',
    email: 'takashi@example.com',
    followers_count: 8921,
    following_count: 234,
    posts_count: 567,
    is_verified: true,
    created_at: '2023-03-20T10:30:00Z'
  },
  {
    id: '3',
    username: 'yumi_healer',
    display_name: 'ゆみ♡エネルギーヒーラー',
    avatar_url: 'https://picsum.photos/seed/user3/200',
    bio: 'レイキマスター/クリスタルヒーリング/アカシックリーディング 💎 愛と光のメッセージをお届け',
    email: 'yumi@example.com',
    followers_count: 5234,
    following_count: 456,
    posts_count: 890,
    is_verified: false,
    created_at: '2023-06-10T14:20:00Z'
  },
  {
    id: '4',
    username: 'kenji_astrology',
    display_name: '賢治 | 西洋占星術師',
    avatar_url: 'https://picsum.photos/seed/user4/200',
    bio: '魂の設計図を読み解く占星術師🌟 個人鑑定受付中 | 新月満月の音声解説配信',
    email: 'kenji@example.com',
    followers_count: 12345,
    following_count: 678,
    posts_count: 432,
    is_verified: true,
    created_at: '2023-02-28T08:15:00Z'
  },
  {
    id: '5',
    username: 'sakura_channel',
    display_name: 'さくら🌸高次元チャネラー',
    avatar_url: 'https://picsum.photos/seed/user5/200',
    bio: 'アセンデッドマスターからのメッセージを音声でお届け | 次元上昇をサポート | 毎週金曜ライブセッション',
    email: 'sakura@example.com',
    followers_count: 7890,
    following_count: 321,
    posts_count: 765,
    is_verified: false,
    created_at: '2023-04-05T16:45:00Z'
  }
];

export const mockCurrentUser: MockUser = mockUsers[0];

export const getMockUser = (userId: string): MockUser | undefined => {
  return mockUsers.find(user => user.id === userId);
};