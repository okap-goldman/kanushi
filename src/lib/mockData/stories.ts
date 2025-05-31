import { mockUsers } from './users';

export interface MockStory {
  id: string;
  user_id: string;
  user?: typeof mockUsers[0];
  content?: string;
  image_url: string; // 画像必須
  audio_url: string; // 音声必須
  audio_transcript?: string; // 音声の文字起こし
  media_url: string; // 下位互換のため残す
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
    image_url: 'https://picsum.photos/seed/story1/400/400', // 正方形画像
    audio_url: 'https://f002.backblazeb2.com/file/kanushi-media/stories/audio/user1/sunrise-energy-morning.mp3',
    audio_transcript: '皆さん、おはようございます。今朝の美しい日の出を見ながら、この素晴らしい一日の始まりに心からの感謝を込めて。太陽の光は私たちの魂に新しいエネルギーを注いでくれます。この神聖な瞬間に、私たちがすべてつながっていることを深く感じています。今日一日、愛と光の中で歩んでいきましょう。',
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
    image_url: 'https://picsum.photos/seed/story2/400/400', // 正方形画像
    audio_url: 'https://f002.backblazeb2.com/file/kanushi-media/stories/audio/user1/meditation-message-divine.mp3',
    audio_transcript: '今朝の瞑想中に、とても美しいメッセージが降りてきました。宇宙からの愛に満ちたメッセージを皆さんにシェアしたいと思います。私たちは今、大きな変容の時期を迎えています。愛と光の中で、私たちは本当の自分、神聖な存在としての真の姿を思い出していくのです。恐れを手放し、心を開いて、この素晴らしい旅路を共に歩んでまいりましょう。',
    media_url: 'https://f002.backblazeb2.com/file/kanushi-media/stories/audio/user1/meditation-message-divine.mp3',
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
    content: '瞑想スペースの準備完了✨',
    image_url: 'https://picsum.photos/seed/story3/400/400', // 正方形画像
    audio_url: 'https://f002.backblazeb2.com/file/kanushi-media/stories/audio/user2/sacred-space-creation.mp3',
    audio_transcript: '今日の瞑想のための神聖な空間が完成いたしました。美しいクリスタルたちと緑豊かな観葉植物に囲まれて、とても高い波動に満ちた聖なる空間となっています。このエネルギーの中で行う瞑想は、きっと深い気づきと癒しをもたらしてくれることでしょう。皆さんも、ご自身の神聖な空間を作ってみてくださいね。',
    media_url: 'https://picsum.photos/seed/story3/400/700',
    media_type: 'image',
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
    image_url: 'https://picsum.photos/seed/story4/400/400', // 正方形画像
    audio_url: 'https://f002.backblazeb2.com/file/kanushi-media/stories/audio/user3/amethyst-arrival.mp3',
    audio_transcript: '待ちに待った新しいクリスタルが手元に届きました。この美しいアメジストの原石からは、本当に素晴らしい高次元の波動を感じています。紫色の光が私の心と魂を癒してくれているようです。クリスタルは私たちの精神的な成長を助けてくれる素晴らしいパートナーですね。皆さんも、ご自身に共鳴するクリスタルと出会えますように。',
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
    image_url: 'https://picsum.photos/seed/story5/400/400', // 正方形画像
    audio_url: 'https://f002.backblazeb2.com/file/kanushi-media/stories/audio/user4/cosmic-message-tonight.mp3',
    audio_transcript: '今夜、美しい星空を見上げながら瞑想をしていたとき、宇宙からの深いメッセージを受け取りました。私たちは皆、この地球に生まれる前から星の世界にいた、光の存在なのです。今、この物質次元での体験を通して、魂の成長と進化を遂げています。夜空の星々を見るたびに、私たちの真の故郷を思い出し、宇宙との深いつながりを感じてください。私たちは決してひとりではありません。',
    media_url: 'https://example.com/video/story-astro.mp4',
    media_type: 'video',
    views_count: 456,
    likes_count: 234,
    is_viewed: true,
    is_liked: true,
    expires_at: '2024-01-21T22:00:00Z',
    created_at: '2024-01-20T22:00:00Z'
  },
  {
    id: '6',
    user_id: '5',
    user: mockUsers[4],
    content: 'エンジェルナンバー1111の意味について',
    image_url: 'https://picsum.photos/seed/story6/400/400', // 正方形画像
    audio_url: 'https://f002.backblazeb2.com/file/kanushi-media/stories/audio/user5/angel-number-1111.mp3',
    audio_transcript: '今日は11時11分にエンジェルナンバー1111を見ました。この数字には特別な意味があります。1111は新しい始まりとスピリチュアルな覚醒のサインです。天使たちが私たちに、今が人生の新しい章を始める時だと教えてくれています。皆さんも同じ数字を見かけたら、それは宇宙からの美しいメッセージなのです。',
    media_url: 'https://picsum.photos/seed/story6/400/700',
    media_type: 'image',
    views_count: 189,
    likes_count: 76,
    is_viewed: false,
    is_liked: false,
    expires_at: '2024-01-22T11:11:00Z',
    created_at: '2024-01-21T11:11:00Z'
  },
  {
    id: '7',
    user_id: '6',
    user: mockUsers[5],
    content: 'ヨガで感じた深い平安🧘‍♀️',
    image_url: 'https://picsum.photos/seed/story7/400/400', // 正方形画像
    audio_url: 'https://f002.backblazeb2.com/file/kanushi-media/stories/audio/user6/yoga-deep-peace.mp3',
    audio_transcript: '今朝のヨガセッションで、とても深い平安を感じることができました。呼吸に意識を向けながら、体と心と魂が一つになっていく感覚を味わいました。この静寂の中で、私たちの内なる光がより明るく輝いているのを感じます。ヨガは単なる運動ではなく、自分自身との神聖な対話なのですね。',
    media_url: 'https://picsum.photos/seed/story7/400/700',
    media_type: 'image',
    views_count: 298,
    likes_count: 145,
    is_viewed: true,
    is_liked: true,
    expires_at: '2024-01-22T07:30:00Z',
    created_at: '2024-01-21T07:30:00Z'
  },
  {
    id: '8',
    user_id: '2',
    user: mockUsers[1],
    content: 'フルムーンエネルギーワーク🌕',
    image_url: 'https://picsum.photos/seed/story8/400/400', // 正方形画像
    audio_url: 'https://f002.backblazeb2.com/file/kanushi-media/stories/audio/user2/fullmoon-energy-work.mp3',
    audio_transcript: '今夜はフルムーンですね。満月の強力なエネルギーを使って、心の中の不要なものを手放し、新しい意図を設定しました。月の光は私たちの潜在意識に深く働きかけて、内なる変容を促してくれます。この神聖な夜に、皆さんも自分自身と向き合い、魂の声に耳を傾けてみてください。',
    media_url: 'https://picsum.photos/seed/story8/400/700',
    media_type: 'image',
    views_count: 567,
    likes_count: 289,
    is_viewed: false,
    is_liked: false,
    expires_at: '2024-01-22T21:45:00Z',
    created_at: '2024-01-21T21:45:00Z'
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