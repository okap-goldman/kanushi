#!/usr/bin/env tsx

/**
 * Drizzle ORM を使用したシーディングスクリプト
 * 
 * 日本語のスピリチュアル系モックデータを投入します。
 * 既存のSupabase認証ユーザーと連携させるため、事前にAuthユーザーの作成が必要です。
 */

import { createDrizzleClient } from '../src/lib/db/drizzle-client';
import { 
  profiles, 
  posts, 
  hashtags, 
  postHashtags,
  stories,
  follows,
  accounts
} from '../src/lib/db/schema';

// ⚠️ 注意: Drizzleスキーマでは 'profile' テーブル名を使用（単数形）
// コード内では 'profiles' 変数名を使用（複数形）
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// 環境変数を読み込み
config({ path: '.env.local' });

const db = createDrizzleClient();

// Supabase管理クライアント
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// モックユーザーデータ
const mockUsers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'akiko.light@example.com',
    password: 'spiritual123',
    display_name: '光の導き手 明子',
    profile_text: '魂の目醒めをサポートするライトワーカーです。瞑想指導歴15年。あなたの内なる光を見出すお手伝いをさせていただきます。',
    prefecture: '静岡県',
    city: '富士市'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'ryoma.cosmos@example.com',
    password: 'starseed123',
    display_name: '宇宙意識 龍馬',
    profile_text: 'プレアデス系スターシード。高次元とのチャネリングを通じて、地球のアセンションをサポートしています。音声による宇宙メッセージをお届け。',
    prefecture: '沖縄県', 
    city: '石垣市'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'sakura.healing@example.com',
    password: 'healing123',
    display_name: '癒しの音 さくら',
    profile_text: 'クリスタルボウルとライトランゲージによるヒーリングセッションを提供。あなたの波動を高める音の魔法をお届けします。',
    prefecture: '京都府',
    city: '京都市'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'kenta.awakening@example.com',
    password: 'energy123',
    display_name: '目醒めの案内人 健太',
    profile_text: 'エネルギーワーカー、レイキマスター。日々の瞑想実践と霊的成長のためのガイダンスを音声で配信中。',
    prefecture: '長野県',
    city: '軽井沢町'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    email: 'misaki.angel@example.com',
    password: 'angel123',
    display_name: '天使のメッセンジャー 美咲',
    profile_text: 'エンジェルカードリーダー。天使からのメッセージをあなたにお届けします。愛と光の中で生きる方法をシェア。',
    prefecture: '神奈川県',
    city: '鎌倉市'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    email: 'ren.akashic@example.com',
    password: 'akashic123',
    display_name: 'アカシックリーダー 蓮',
    profile_text: 'アカシックレコードへのアクセスを通じて、魂の記憶と使命を読み解きます。過去生リーディングも承ります。',
    prefecture: '奈良県',
    city: '奈良市'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    email: 'sho.energy@example.com',
    password: 'chakra123',
    display_name: 'エナジーヒーラー 翔',
    profile_text: 'チャクラバランシングとオーラクレンジングの専門家。あなたのエネルギーフィールドを整え、本来の輝きを取り戻すサポートをします。',
    prefecture: '東京都',
    city: '渋谷区'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    email: 'mariko.kundalini@example.com',
    password: 'awakening123',
    display_name: '覚醒のファシリテーター 真理子',
    profile_text: 'クンダリーニ覚醒の体験者。安全な覚醒プロセスのガイダンスと、統合のサポートを提供しています。',
    prefecture: '広島県',
    city: '広島市'
  }
];

// ハッシュタグデータ
const mockHashtags = [
  { id: '660e8400-e29b-41d4-a716-446655440001', name: '目醒め' },
  { id: '660e8400-e29b-41d4-a716-446655440002', name: 'アセンション' },
  { id: '660e8400-e29b-41d4-a716-446655440003', name: 'ライトワーカー' },
  { id: '660e8400-e29b-41d4-a716-446655440004', name: 'スターシード' },
  { id: '660e8400-e29b-41d4-a716-446655440005', name: '瞑想' },
  { id: '660e8400-e29b-41d4-a716-446655440006', name: 'エネルギーワーク' },
  { id: '660e8400-e29b-41d4-a716-446655440007', name: 'チャネリング' },
  { id: '660e8400-e29b-41d4-a716-446655440008', name: 'ヒーリング' },
  { id: '660e8400-e29b-41d4-a716-446655440009', name: 'ライトランゲージ' },
  { id: '660e8400-e29b-41d4-a716-446655440010', name: 'クリスタル' },
  { id: '660e8400-e29b-41d4-a716-446655440011', name: '高次元' },
  { id: '660e8400-e29b-41d4-a716-446655440012', name: 'ツインレイ' },
  { id: '660e8400-e29b-41d4-a716-446655440013', name: 'アカシックレコード' },
  { id: '660e8400-e29b-41d4-a716-446655440014', name: 'レイキ' },
  { id: '660e8400-e29b-41d4-a716-446655440015', name: 'オーラ' }
];

// 投稿データ
const mockPosts = [
  {
    id: '770e8400-e29b-41d4-a716-446655440001',
    userId: '550e8400-e29b-41d4-a716-446655440001',
    contentType: 'audio' as const,
    textContent: '今朝の瞑想で受け取った光のメッセージ。あなたの内なる平和を見つける誘導瞑想です。',
    hashtags: ['目醒め', '瞑想', 'ライトワーカー']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440002',
    userId: '550e8400-e29b-41d4-a716-446655440002',
    contentType: 'audio' as const,
    textContent: 'プレアデスからの緊急メッセージ：地球のアセンションが加速しています。今こそ光の柱となりましょう。',
    hashtags: ['アセンション', 'スターシード', 'チャネリング']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440003',
    userId: '550e8400-e29b-41d4-a716-446655440003',
    contentType: 'audio' as const,
    textContent: 'クリスタルボウルによる528Hzの愛の周波数ヒーリング。DNAの活性化をサポートします。',
    hashtags: ['ヒーリング', 'クリスタル', 'ライトランゲージ']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440004',
    userId: '550e8400-e29b-41d4-a716-446655440001',
    contentType: 'text' as const,
    textContent: '本日の気づき：私たちは皆、無限の可能性を秘めた光の存在です。今日も自分の内なる光を信じて、愛と感謝の中で過ごしましょう。✨',
    hashtags: ['目醒め', 'ライトワーカー']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440005',
    userId: '550e8400-e29b-41d4-a716-446655440004',
    contentType: 'audio' as const,
    textContent: '第3チャクラ活性化のためのエネルギーワーク実践ガイド。個人の力を取り戻しましょう。',
    hashtags: ['エネルギーワーク', 'レイキ']
  }
];

// ストーリーズデータ
const mockStories = [
  {
    id: 'BB0e8400-e29b-41d4-a716-446655440001',
    userId: '550e8400-e29b-41d4-a716-446655440001',
    imageUrl: 'https://example.com/stories/meditation-sunrise.jpg',
    editData: JSON.stringify({
      filters: ['warm'],
      stickers: [{ type: 'sparkle', x: 100, y: 200 }],
      caption: '朝日と共に瞑想の時間✨ 今日も光と共に歩みます',
      location: '富士山麓瞑想センター'
    }),
    isRepost: false,
    originalStoryId: null,
    expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000) // 20時間後
  },
  {
    id: 'BB0e8400-e29b-41d4-a716-446655440002',
    userId: '550e8400-e29b-41d4-a716-446655440002',
    imageUrl: 'https://example.com/stories/starlight-channeling.jpg',
    editData: JSON.stringify({
      filters: ['cosmic'],
      stickers: [{ type: 'stars', x: 150, y: 100 }],
      caption: '今夜のチャネリングセッション🌟 宇宙からの愛のメッセージ',
      location: '石垣島天体観測所'
    }),
    isRepost: false,
    originalStoryId: null,
    expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000) // 18時間後
  }
];

/**
 * Auth ユーザーを作成
 */
const createAuthUsers = async () => {
  console.log('👤 Supabase Auth ユーザーを作成中...');
  
  for (const user of mockUsers) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        id: user.id,
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { 
          display_name: user.display_name 
        }
      });
      
      if (error && !error.message.includes('already exists')) {
        console.error(`  ❌ ユーザー作成失敗 ${user.email}:`, error.message);
      } else {
        console.log(`  ✅ ユーザー作成成功: ${user.email}`);
      }
    } catch (error) {
      console.error(`  ❌ ユーザー作成エラー ${user.email}:`, error);
    }
  }
};

/**
 * プロフィールデータを投入
 */
const seedProfiles = async () => {
  console.log('👥 プロフィールデータを投入中...');
  
  // Drizzleスキーマのキャメルケースプロパティ名に合わせる
  const profileData = mockUsers.map(user => ({
    id: user.id,
    displayName: user.display_name,   // displayName (キャメルケース)
    profileText: user.profile_text,   // profileText (キャメルケース)
    prefecture: user.prefecture,
    city: user.city,
    createdAt: new Date(),           // createdAt (キャメルケース)
    updatedAt: new Date()            // updatedAt (キャメルケース)
  }));
  
  await db.insert(profiles).values(profileData).onConflictDoNothing();
  console.log(`  ✅ ${profileData.length} 件のプロフィールを投入`);
};

/**
 * アカウントデータを投入
 */
const seedAccounts = async () => {
  console.log('🔐 アカウントデータを投入中...');
  
  const accountData = mockUsers.map((user, index) => ({
    profileId: user.id,    // profileId (キャメルケース)
    isActive: index === 0, // isActive (キャメルケース)
    switchOrder: 1,        // switchOrder (キャメルケース)
    // account_type カラムは既存テーブルに存在しないため除外
    createdAt: new Date()  // createdAt (キャメルケース)
  }));
  
  await db.insert(accounts).values(accountData).onConflictDoNothing();
  console.log(`  ✅ ${accountData.length} 件のアカウントを投入`);
};

/**
 * ハッシュタグデータを投入
 */
const seedHashtags = async () => {
  console.log('🏷️ ハッシュタグデータを投入中...');
  
  const hashtagData = mockHashtags.map(tag => ({
    id: tag.id,
    name: tag.name,
    useCount: 1,               // useCount を追加
    createdAt: new Date()      // createdAt (キャメルケース)
  }));
  
  await db.insert(hashtags).values(hashtagData).onConflictDoNothing();
  console.log(`  ✅ ${hashtagData.length} 件のハッシュタグを投入`);
};

/**
 * 投稿データを投入
 */
const seedPosts = async () => {
  console.log('📝 投稿データを投入中...');
  
  // 投稿データを投入
  const postData = mockPosts.map((post, index) => ({
    id: post.id,
    userId: post.userId,           // userId (キャメルケース)
    contentType: post.contentType, // contentType (キャメルケース)
    textContent: post.textContent, // textContent (キャメルケース)
    createdAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000) // createdAt (キャメルケース)
  }));
  
  await db.insert(posts).values(postData).onConflictDoNothing();
  console.log(`  ✅ ${postData.length} 件の投稿を投入`);
  
  // 投稿とハッシュタグの関連を投入
  const postHashtagData: any[] = [];
  mockPosts.forEach(post => {
    post.hashtags.forEach(tagName => {
      const tag = mockHashtags.find(t => t.name === tagName);
      if (tag) {
        postHashtagData.push({
          postId: post.id,      // postId (キャメルケース)
          hashtagId: tag.id     // hashtagId (キャメルケース)
        });
      }
    });
  });
  
  if (postHashtagData.length > 0) {
    await db.insert(postHashtags).values(postHashtagData).onConflictDoNothing();
    console.log(`  ✅ ${postHashtagData.length} 件の投稿-ハッシュタグ関連を投入`);
  }
};

/**
 * ストーリーズデータを投入
 */
const seedStories = async () => {
  console.log('📱 ストーリーズデータを投入中...');
  
  const storyData = mockStories.map((story, index) => ({
    id: story.id,
    userId: story.userId,         // userId (キャメルケース)
    imageUrl: story.imageUrl,     // imageUrl (キャメルケース)
    editData: story.editData,     // editData (キャメルケース) - JSONとして保存
    isRepost: story.isRepost,     // isRepost (キャメルケース)
    originalStoryId: story.originalStoryId, // originalStoryId (キャメルケース)
    expiresAt: story.expiresAt,   // expiresAt (キャメルケース)
    // text_content は story テーブルに存在しないため除外
    createdAt: new Date(Date.now() - (index + 1) * 4 * 60 * 60 * 1000) // createdAt
  }));
  
  await db.insert(stories).values(storyData).onConflictDoNothing();
  console.log(`  ✅ ${storyData.length} 件のストーリーズを投入`);
};

/**
 * フォロー関係データを投入
 */
const seedFollows = async () => {
  console.log('👥 フォロー関係データを投入中...');
  
  // サンプルフォロー関係を作成
  const followData = [
    {
      followerId: '550e8400-e29b-41d4-a716-446655440001',
      followeeId: '550e8400-e29b-41d4-a716-446655440002',
      followType: 'normal',        // 制約に合わせて 'normal' に変更
      status: 'active'
    },
    {
      followerId: '550e8400-e29b-41d4-a716-446655440001',
      followeeId: '550e8400-e29b-41d4-a716-446655440003',
      followType: 'close_friend',  // 制約に合わせて 'close_friend' に変更
      status: 'active'
    },
    {
      followerId: '550e8400-e29b-41d4-a716-446655440002',
      followeeId: '550e8400-e29b-41d4-a716-446655440001',
      followType: 'normal',        // 制約に合わせて 'normal' に変更
      status: 'active'
    }
  ].map(follow => ({
    followerId: follow.followerId,       // followerId (キャメルケース)
    followeeId: follow.followeeId,       // followeeId (実際のテーブルカラム名に合わせる)
    followType: follow.followType,       // followType (キャメルケース)
    status: follow.status,               // status (実際のテーブルカラム名に合わせる)
    createdAt: new Date()                // createdAt (キャメルケース)
    // updatedAt は follow テーブルに存在しないため除外
  }));
  
  await db.insert(follows).values(followData).onConflictDoNothing();
  console.log(`  ✅ ${followData.length} 件のフォロー関係を投入`);
};

/**
 * メイン実行関数
 */
const seedDatabase = async () => {
  console.log('🌱 Drizzle ORM を使用したデータベースシーディングを開始...');
  console.log('');
  
  try {
    // 1. Auth ユーザーを作成 (権限エラーが発生するため一時的にスキップ)
    // await createAuthUsers();
    console.log('ℹ️  Supabase Auth ユーザー作成をスキップ（権限制限のため）');
    console.log('');
    
    // 2. プロフィールデータを投入
    await seedProfiles();
    
    // 3. アカウントデータを投入 (スキーマ不整合のため一時的にスキップ)
    // await seedAccounts();
    
    // 4. ハッシュタグデータを投入
    await seedHashtags();
    
    // 5. 投稿データを投入
    await seedPosts();
    
    // 6. ストーリーズデータを投入 (スキーマ不整合のため一時的にスキップ)
    // await seedStories();
    
    // 7. フォロー関係データを投入
    await seedFollows();
    
    console.log('');
    console.log('✅ データベースシーディング完了！');
    console.log('');
    console.log('投入されたデータ:');
    console.log(`- プロフィール: ${mockUsers.length} 件`);
    console.log(`- ハッシュタグ: ${mockHashtags.length} 件`);
    console.log(`- 投稿: ${mockPosts.length} 件`);
    console.log(`- フォロー関係: 3 件`);
    console.log('');
    console.log('注意:');
    console.log('- Supabase Auth ユーザー作成: 権限制限によりスキップ');
    console.log('- アカウント・ストーリーズテーブル: スキーマ不整合によりスキップ');
    
  } catch (error) {
    console.error('❌ シーディング中にエラーが発生:', error);
    process.exit(1);
  }
};

// メイン実行
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };