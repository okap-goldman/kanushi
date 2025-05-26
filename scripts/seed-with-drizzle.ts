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
  accounts,
  products,
  carts,
  cartItems,
  orders,
  orderItems,
  events,
  eventParticipants,
  eventVoiceWorkshops
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
    audioUrl: 'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
    hashtags: ['目醒め', '瞑想', 'ライトワーカー']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440002',
    userId: '550e8400-e29b-41d4-a716-446655440002',
    contentType: 'audio' as const,
    textContent: 'プレアデスからの緊急メッセージ：地球のアセンションが加速しています。今こそ光の柱となりましょう。',
    audioUrl: 'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
    hashtags: ['アセンション', 'スターシード', 'チャネリング']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440003',
    userId: '550e8400-e29b-41d4-a716-446655440003',
    contentType: 'audio' as const,
    textContent: 'クリスタルボウルによる528Hzの愛の周波数ヒーリング。DNAの活性化をサポートします。',
    audioUrl: 'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
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
    audioUrl: 'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
    hashtags: ['エネルギーワーク', 'レイキ']
  },
  // 追加の投稿データ
  {
    id: '770e8400-e29b-41d4-a716-446655440006',
    userId: '550e8400-e29b-41d4-a716-446655440005',
    contentType: 'audio' as const,
    textContent: '天使からの今日のメッセージ：あなたの願いは聞き届けられています。信じて歩み続けてください。',
    audioUrl: 'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
    hashtags: ['天使', 'メッセージ', '癒し']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440007',
    userId: '550e8400-e29b-41d4-a716-446655440006',
    contentType: 'audio' as const,
    textContent: 'アカシックレコードから読み取った前世のお話。あなたの魂の旅路について語ります。',
    audioUrl: 'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
    hashtags: ['アカシックレコード', '前世', '魂の旅']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440008',
    userId: '550e8400-e29b-41d4-a716-446655440007',
    contentType: 'text' as const,
    textContent: '今日のエネルギーレポート📊 太陽フレアの影響でアセンション症状が強まっています。水をたくさん飲んで、グラウンディングを心がけましょう。',
    hashtags: ['エネルギー', 'アセンション', 'グラウンディング']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440009',
    userId: '550e8400-e29b-41d4-a716-446655440008',
    contentType: 'audio' as const,
    textContent: 'クンダリーニ覚醒の体験談と注意点。安全な覚醒プロセスについてお話しします。',
    audioUrl: 'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
    hashtags: ['クンダリーニ', '覚醒', 'スピリチュアル']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440010',
    userId: '550e8400-e29b-41d4-a716-446655440003',
    contentType: 'text' as const,
    textContent: '新月の浄化リチュアル🌑 今夜は新月。古いエネルギーを手放し、新しい意図を宇宙に届けましょう。セージで空間を浄化してからスタートです。',
    hashtags: ['新月', 'リチュアル', '浄化']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440011',
    userId: '550e8400-e29b-41d4-a716-446655440002',
    contentType: 'audio' as const,
    textContent: '宇宙の法則について：引き寄せの法則と量子物理学の関係性を詳しく解説します。',
    audioUrl: 'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
    hashtags: ['宇宙の法則', '引き寄せ', '量子物理学']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440012',
    userId: '550e8400-e29b-41d4-a716-446655440004',
    contentType: 'text' as const,
    textContent: 'レイキ遠隔ヒーリングのご報告💫 昨日のセッションでは多くの方に光のエネルギーをお送りしました。皆様の癒しが進みますように。',
    hashtags: ['レイキ', '遠隔ヒーリング', '光のエネルギー']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440013',
    userId: '550e8400-e29b-41d4-a716-446655440001',
    contentType: 'audio' as const,
    textContent: '朝の光の瞑想（15分バージョン）。忙しい朝でも短時間で心を整えられます。',
    audioUrl: 'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
    hashtags: ['朝の瞑想', '短時間', '心を整える']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440014',
    userId: '550e8400-e29b-41d4-a716-446655440005',
    contentType: 'text' as const,
    textContent: 'エンジェルカードからのメッセージ🃏 今日のカードは「勇気」です。あなたには必要な強さが既に備わっています。信じて一歩踏み出しましょう。',
    hashtags: ['エンジェルカード', '勇気', '一歩踏み出す']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440015',
    userId: '550e8400-e29b-41d4-a716-446655440007',
    contentType: 'audio' as const,
    textContent: 'チャクラバランシング瞑想：7つのチャクラを順番に活性化していく誘導瞑想です。',
    audioUrl: 'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
    hashtags: ['チャクラ', 'バランシング', '7つのチャクラ']
  },
  // 画像投稿を追加
  {
    id: '770e8400-e29b-41d4-a716-446655440016',
    userId: '550e8400-e29b-41d4-a716-446655440001',
    contentType: 'image' as const,
    textContent: '富士山からのご来光🌅 神聖なエネルギーに満ちた朝です。今日も光と共に歩みましょう。',
    mediaUrl: 'https://images.unsplash.com/photo-1542659086-6507dc756cae?w=1200&h=800&fit=crop',
    hashtags: ['富士山', 'ご来光', '神聖なエネルギー']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440017',
    userId: '550e8400-e29b-41d4-a716-446655440003',
    contentType: 'image' as const,
    textContent: 'クリスタルボウルのセッティング完了✨ 今夜のセッションの準備が整いました。528Hzの愛の周波数でお待ちしています。',
    mediaUrl: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=1200&h=800&fit=crop',
    hashtags: ['クリスタルボウル', '528Hz', 'ヒーリング準備']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440018',
    userId: '550e8400-e29b-41d4-a716-446655440002',
    contentType: 'image' as const,
    textContent: '宇宙からのメッセージを受け取る聖地🌌 石垣島の星空は本当に美しく、高次元との繋がりを感じます。',
    mediaUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&h=800&fit=crop',
    hashtags: ['石垣島', '星空', '宇宙との繋がり']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440019',
    userId: '550e8400-e29b-41d4-a716-446655440005',
    contentType: 'image' as const,
    textContent: '天使の羽を発見しました👼 散歩中に見つけた純白の羽。天使たちからのサインですね。',
    mediaUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&h=800&fit=crop',
    hashtags: ['天使の羽', 'サイン', '天使からのメッセージ']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440020',
    userId: '550e8400-e29b-41d4-a716-446655440006',
    contentType: 'image' as const,
    textContent: 'アカシックレコードリーディングの神聖な空間🕯️ 古代の知恵と繋がる準備が整いました。',
    mediaUrl: 'https://images.unsplash.com/photo-1527685609591-44b0aef2400b?w=1200&h=800&fit=crop',
    hashtags: ['アカシック', '神聖な空間', 'リーディング']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440021',
    userId: '550e8400-e29b-41d4-a716-446655440007',
    contentType: 'image' as const,
    textContent: 'チャクラストーンのコレクション💎 各チャクラに対応する天然石たち。エネルギー調整に使用しています。',
    mediaUrl: 'https://images.unsplash.com/photo-1510218830377-2e994ea9087d?w=1200&h=800&fit=crop',
    hashtags: ['チャクラストーン', '天然石', 'エネルギー調整']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440022',
    userId: '550e8400-e29b-41d4-a716-446655440008',
    contentType: 'image' as const,
    textContent: 'クンダリーニエネルギーの視覚化🔥 瞑想中に見えた美しい光の螺旋。覚醒のプロセスは本当に神秘的です。',
    mediaUrl: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=1200&h=800&fit=crop',
    hashtags: ['クンダリーニ', '光の螺旋', '覚醒プロセス']
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440023',
    userId: '550e8400-e29b-41d4-a716-446655440004',
    contentType: 'image' as const,
    textContent: '軽井沢の朝の瞑想スポット🌲 自然のエネルギーに包まれて、深い瞑想状態に入れます。',
    mediaUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
    hashtags: ['軽井沢', '瞑想スポット', '自然のエネルギー']
  }
];

// ショップ商品データ
const mockProducts = [
  {
    id: 'cc0e8400-e29b-41d4-a716-446655440001',
    sellerUserId: '550e8400-e29b-41d4-a716-446655440001', // 光の導き手 明子
    title: '魂の覚醒瞑想ガイド音声（8時間）',
    description: '深い瞑想状態へと導く8時間の音声ガイドです。チャクラの活性化、高次元との繋がり、内なる平和の実現をサポートします。',
    productType: 'digital' as const,
    price: '3800',
    currency: 'JPY',
    imageUrl: 'https://example.com/products/meditation-guide.jpg',
    previewUrl: 'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
    previewDuration: 300, // 5分
    stock: null, // デジタル商品なので在庫なし
    sourcePostId: '770e8400-e29b-41d4-a716-446655440001',
    aiDescription: {
      keywords: ['瞑想', '覚醒', 'チャクラ', 'ヒーリング'],
      targetAudience: '深い霊的成長を求める方',
      benefits: ['内なる平和の実現', 'チャクラバランスの調整', '高次元意識との繋がり']
    }
  },
  {
    id: 'cc0e8400-e29b-41d4-a716-446655440002',
    sellerUserId: '550e8400-e29b-41d4-a716-446655440003', // 癒しの音 さくら
    title: 'クリスタルボウル音浴セッション（528Hz愛の周波数）',
    description: '愛の周波数528Hzで調整されたクリスタルボウルの音浴。DNAの修復と活性化、ハートチャクラの開放をサポートします。',
    productType: 'digital' as const,
    price: '2500',
    currency: 'JPY',
    imageUrl: 'https://example.com/products/crystal-bowl.jpg',
    previewUrl: 'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
    previewDuration: 180, // 3分
    stock: null,
    sourcePostId: '770e8400-e29b-41d4-a716-446655440003',
    aiDescription: {
      keywords: ['クリスタルボウル', '528Hz', '音浴', 'ヒーリング'],
      targetAudience: '心身の癒しを求める方',
      benefits: ['DNA活性化', 'ストレス解放', '愛の周波数による調和']
    }
  },
  {
    id: 'cc0e8400-e29b-41d4-a716-446655440003',
    sellerUserId: '550e8400-e29b-41d4-a716-446655440002', // 宇宙意識 龍馬
    title: 'プレアデス意識チャネリング講座（全12回）',
    description: '高次元存在プレアデスとの繋がり方を学ぶ全12回の音声講座。チャネリング能力の開発と宇宙意識の拡大をサポートします。',
    productType: 'digital' as const,
    price: '48000',
    currency: 'JPY',
    imageUrl: 'https://example.com/products/pleiades-course.jpg',
    previewUrl: null,
    previewDuration: null,
    stock: 50, // 限定50名
    sourcePostId: null,
    aiDescription: {
      keywords: ['チャネリング', 'プレアデス', 'スターシード', '宇宙意識'],
      targetAudience: 'スターシードや宇宙意識に興味がある方',
      benefits: ['チャネリング能力の開発', '高次元とのコンタクト', '宇宙的視点の獲得']
    }
  },
  {
    id: 'cc0e8400-e29b-41d4-a716-446655440004',
    sellerUserId: '550e8400-e29b-41d4-a716-446655440006', // アカシックリーダー 蓮
    title: 'アカシックレコードリーディング個人セッション（60分）',
    description: 'あなたの魂の記録にアクセスし、過去生、現在の使命、未来の可能性を読み解きます。人生の指針を見出すサポートをします。',
    productType: 'service' as const,
    price: '15000',
    currency: 'JPY',
    imageUrl: 'https://example.com/products/akashic-reading.jpg',
    previewUrl: null,
    previewDuration: null,
    stock: 10, // 月10枠限定
    sourcePostId: null,
    aiDescription: {
      keywords: ['アカシックレコード', '個人セッション', '魂の記録', 'リーディング'],
      targetAudience: '人生の目的や使命を知りたい方',
      benefits: ['魂の使命の理解', '過去生の癒し', '未来への指針']
    }
  },
  // 追加のショップアイテム
  {
    id: 'cc0e8400-e29b-41d4-a716-446655440005',
    sellerUserId: '550e8400-e29b-41d4-a716-446655440004', // 目醒めの案内人 健太
    title: 'レイキ遠隔ヒーリングセッション（30分）',
    description: '時間と空間を超えたレイキエネルギーによる遠隔ヒーリング。あなたの波動を高め、心身のバランスを整えます。',
    productType: 'service' as const,
    price: '6000',
    currency: 'JPY',
    imageUrl: 'https://example.com/products/remote-reiki.jpg',
    previewUrl: null,
    previewDuration: null,
    stock: 20, // 月20枠
    sourcePostId: null,
    aiDescription: {
      keywords: ['レイキ', '遠隔ヒーリング', 'エネルギーワーク', '波動調整'],
      targetAudience: '心身の不調を感じている方、波動を高めたい方',
      benefits: ['エネルギー調整', 'ストレス解放', '心身のバランス改善']
    }
  },
  {
    id: 'cc0e8400-e29b-41d4-a716-446655440006',
    sellerUserId: '550e8400-e29b-41d4-a716-446655440007', // エナジーヒーラー 翔
    title: 'オーラクレンジング＆チャクラ調整セット音声（90分）',
    description: '7つのチャクラを順番に浄化・活性化し、オーラフィールドを整える包括的な音声ガイド。',
    productType: 'digital' as const,
    price: '4800',
    currency: 'JPY',
    imageUrl: 'https://example.com/products/aura-chakra-set.jpg',
    previewUrl: 'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
    previewDuration: 600, // 10分
    stock: null,
    sourcePostId: null,
    aiDescription: {
      keywords: ['オーラクレンジング', 'チャクラ調整', 'エネルギー浄化', '音声ガイド'],
      targetAudience: 'エネルギー浄化に興味がある方、チャクラを整えたい方',
      benefits: ['オーラの浄化', 'チャクラバランス調整', 'エネルギーフィールド強化']
    }
  },
  {
    id: 'cc0e8400-e29b-41d4-a716-446655440007',
    sellerUserId: '550e8400-e29b-41d4-a716-446655440005', // 天使のメッセンジャー 美咲
    title: 'エンジェルオラクルカードリーディング（3枚引き）',
    description: '天使からのメッセージを3枚のカードで読み解きます。現在の状況、課題、アドバイスをお伝えします。',
    productType: 'service' as const,
    price: '3500',
    currency: 'JPY',
    imageUrl: 'https://example.com/products/angel-card-reading.jpg',
    previewUrl: null,
    previewDuration: null,
    stock: 15, // 月15枠
    sourcePostId: null,
    aiDescription: {
      keywords: ['エンジェルカード', 'オラクル', 'リーディング', '天使のメッセージ'],
      targetAudience: '人生の指針やメッセージを求めている方',
      benefits: ['天使からの導き', '現状把握', '今後の方向性']
    }
  },
  {
    id: 'cc0e8400-e29b-41d4-a716-446655440008',
    sellerUserId: '550e8400-e29b-41d4-a716-446655440001', // 光の導き手 明子
    title: '光の瞑想音声集（全12回シリーズ）',
    description: '季節や目的に応じた12種類の瞑想音声。1年を通して内なる光を育む包括的なコレクション。',
    productType: 'digital' as const,
    price: '18000',
    currency: 'JPY',
    imageUrl: 'https://example.com/products/meditation-collection.jpg',
    previewUrl: 'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
    previewDuration: 900, // 15分
    stock: null,
    sourcePostId: null,
    aiDescription: {
      keywords: ['瞑想', '光のワーク', '年間コース', '音声ガイド'],
      targetAudience: '継続的な瞑想実践を求める方',
      benefits: ['瞑想スキル向上', '内なる平和の深化', '1年間のガイダンス']
    }
  },
  {
    id: 'cc0e8400-e29b-41d4-a716-446655440009',
    sellerUserId: '550e8400-e29b-41d4-a716-446655440008', // 覚醒のファシリテーター 真理子
    title: 'クンダリーニ覚醒サポート個人セッション（2時間）',
    description: '安全なクンダリーニ覚醒プロセスの個人指導。覚醒体験者による丁寧なサポートとガイダンス。',
    productType: 'service' as const,
    price: '25000',
    currency: 'JPY',
    imageUrl: 'https://example.com/products/kundalini-session.jpg',
    previewUrl: null,
    previewDuration: null,
    stock: 5, // 月5枠限定
    sourcePostId: null,
    aiDescription: {
      keywords: ['クンダリーニ覚醒', '個人セッション', 'スピリチュアル覚醒', 'サポート'],
      targetAudience: 'クンダリーニ覚醒に興味がある方、体験中の方',
      benefits: ['安全な覚醒プロセス', '個別指導', '体験者によるサポート']
    }
  },
  {
    id: 'cc0e8400-e29b-41d4-a716-446655440010',
    sellerUserId: '550e8400-e29b-41d4-a716-446655440003', // 癒しの音 さくら
    title: 'ライトランゲージ活性化音声（45分）',
    description: '宇宙の言語ライトランゲージによる深いヒーリングとDNA活性化。高次元の愛のエネルギーを体験してください。',
    productType: 'digital' as const,
    price: '5500',
    currency: 'JPY',
    imageUrl: 'https://example.com/products/light-language.jpg',
    previewUrl: 'https://f004.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=4_za01f9bab90e30e6d997f091c_f1107d3a67562ef44_d20250526_m000952_c004_v0402009_t0045_u01748218192024',
    previewDuration: 300, // 5分
    stock: null,
    sourcePostId: null,
    aiDescription: {
      keywords: ['ライトランゲージ', 'DNA活性化', '高次元エネルギー', 'ヒーリング'],
      targetAudience: 'ライトランゲージに興味がある方、DNA活性化を求める方',
      benefits: ['DNA活性化', '高次元との繋がり', 'エネルギー上昇']
    }
  }
];

// カートデータ
const mockCarts = [
  {
    id: 'dd0e8400-e29b-41d4-a716-446655440001',
    buyerUserId: '550e8400-e29b-41d4-a716-446655440004', // 目醒めの案内人 健太
    status: 'active' as const
  },
  {
    id: 'dd0e8400-e29b-41d4-a716-446655440002',
    buyerUserId: '550e8400-e29b-41d4-a716-446655440005', // 天使のメッセンジャー 美咲
    status: 'checked_out' as const
  }
];

// カートアイテムデータ
const mockCartItems = [
  {
    id: 'ee0e8400-e29b-41d4-a716-446655440001',
    cartId: 'dd0e8400-e29b-41d4-a716-446655440001',
    productId: 'cc0e8400-e29b-41d4-a716-446655440001', // 魂の覚醒瞑想ガイド
    quantity: 1
  },
  {
    id: 'ee0e8400-e29b-41d4-a716-446655440002',
    cartId: 'dd0e8400-e29b-41d4-a716-446655440001',
    productId: 'cc0e8400-e29b-41d4-a716-446655440002', // クリスタルボウル音浴
    quantity: 1
  }
];

// 注文データ
const mockOrders = [
  {
    id: 'ff0e8400-e29b-41d4-a716-446655440001',
    buyerUserId: '550e8400-e29b-41d4-a716-446655440005', // 天使のメッセンジャー 美咲
    amount: '48000',
    storesPaymentId: 'STR_TEST_001',
    status: 'delivered' as const,
    shippingInfo: {
      type: 'digital',
      email: 'misaki@kanushi-test.com'
    },
    trackingNumber: null
  },
  {
    id: 'ff0e8400-e29b-41d4-a716-446655440002',
    buyerUserId: '550e8400-e29b-41d4-a716-446655440007', // エナジーヒーラー 翔
    amount: '2500',
    storesPaymentId: 'STR_TEST_002',
    status: 'processing' as const,
    shippingInfo: {
      type: 'digital',
      email: 'sho@kanushi-test.com'
    },
    trackingNumber: null
  }
];

// 注文アイテムデータ
const mockOrderItems = [
  {
    id: 'aa0e8400-e29b-41d4-a716-446655440001',
    orderId: 'ff0e8400-e29b-41d4-a716-446655440001',
    productId: 'cc0e8400-e29b-41d4-a716-446655440003', // プレアデス意識チャネリング講座
    quantity: 1,
    price: '48000'
  },
  {
    id: 'aa0e8400-e29b-41d4-a716-446655440002',
    orderId: 'ff0e8400-e29b-41d4-a716-446655440002',
    productId: 'cc0e8400-e29b-41d4-a716-446655440002', // クリスタルボウル音浴
    quantity: 1,
    price: '2500'
  }
];

// ストーリーズデータ
const mockStories = [
  {
    id: 'bb0e8400-e29b-41d4-a716-446655440001',
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
    id: 'bb0e8400-e29b-41d4-a716-446655440002',
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

// イベントデータ
const mockEvents = [
  {
    id: '880e8400-e29b-41d4-a716-446655440001',
    creatorUserId: '550e8400-e29b-41d4-a716-446655440001', // 光の導き手 明子
    name: '新月の瞑想サークル',
    description: '新月のエネルギーを活用した集団瞑想です。内なる平和と新しい意図を設定しましょう。',
    eventType: 'workshop' as const,
    location: '富士山麓瞑想センター',
    startsAt: new Date('2025-06-01T19:00:00+09:00'),
    endsAt: new Date('2025-06-01T21:00:00+09:00'),
    fee: '3000',
    currency: 'JPY',
    refundPolicy: '開始24時間前までキャンセル可能（全額返金）',
    liveRoomId: null
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440002',
    creatorUserId: '550e8400-e29b-41d4-a716-446655440002', // 宇宙意識 龍馬
    name: 'プレアデス意識とのチャネリング実践講座',
    description: '高次元存在との繋がり方を学ぶ実践的なワークショップです。初心者歓迎。',
    eventType: 'lecture' as const,
    location: 'オンライン（Live配信）',
    startsAt: new Date('2025-06-05T20:00:00+09:00'),
    endsAt: new Date('2025-06-05T22:30:00+09:00'),
    fee: '5000',
    currency: 'JPY',
    refundPolicy: '開始6時間前までキャンセル可能（手数料500円を除き返金）',
    liveRoomId: null
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440003',
    creatorUserId: '550e8400-e29b-41d4-a716-446655440003', // 癒しの音 さくら
    name: 'クリスタルボウル音浴ヒーリングセッション',
    description: '528Hzの愛の周波数で調整されたクリスタルボウルによる深いヒーリング体験。',
    eventType: 'workshop' as const,
    location: '京都市内スタジオ',
    startsAt: new Date('2025-06-08T14:00:00+09:00'),
    endsAt: new Date('2025-06-08T16:00:00+09:00'),
    fee: '4500',
    currency: 'JPY',
    refundPolicy: '開始48時間前までキャンセル可能（全額返金）',
    liveRoomId: null
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440004',
    creatorUserId: '550e8400-e29b-41d4-a716-446655440004', // 目醒めの案内人 健太
    name: 'チャクラバランシング個人セッション',
    description: '7つのチャクラを整える個人セッション。レイキエネルギーワークも含みます。',
    eventType: 'session' as const,
    location: '軽井沢ヒーリングサロン',
    startsAt: new Date('2025-06-10T10:00:00+09:00'),
    endsAt: new Date('2025-06-10T11:30:00+09:00'),
    fee: '12000',
    currency: 'JPY',
    refundPolicy: '開始24時間前までキャンセル可能（全額返金）',
    liveRoomId: null
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440005',
    creatorUserId: '550e8400-e29b-41d4-a716-446655440005', // 天使のメッセンジャー 美咲
    name: 'エンジェルカードリーディング講座（初級）',
    description: '天使からのメッセージを受け取るためのカードリーディング基礎講座。',
    eventType: 'lecture' as const,
    location: '鎌倉エンジェルサロン',
    startsAt: new Date('2025-06-12T13:00:00+09:00'),
    endsAt: new Date('2025-06-12T17:00:00+09:00'),
    fee: '8000',
    currency: 'JPY',
    refundPolicy: '開始1週間前までキャンセル可能（手数料1000円を除き返金）',
    liveRoomId: null
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440006',
    creatorUserId: '550e8400-e29b-41d4-a716-446655440006', // アカシックリーダー 蓮
    name: 'アカシックレコード入門セミナー',
    description: 'アカシックレコードとは何か、どのようにアクセスするかを学ぶ入門セミナー。',
    eventType: 'seminar' as const,
    location: '奈良県文化会館',
    startsAt: new Date('2025-06-15T10:00:00+09:00'),
    endsAt: new Date('2025-06-15T16:00:00+09:00'),
    fee: '15000',
    currency: 'JPY',
    refundPolicy: '開始2週間前までキャンセル可能（手数料2000円を除き返金）',
    liveRoomId: null
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440007',
    creatorUserId: '550e8400-e29b-41d4-a716-446655440008', // 覚醒のファシリテーター 真理子
    name: 'クンダリーニ覚醒体験シェア会',
    description: '安全なクンダリーニ覚醒のための準備と体験談をシェアする会。無料参加。',
    eventType: 'meetup' as const,
    location: '広島市内コミュニティセンター',
    startsAt: new Date('2025-06-18T19:00:00+09:00'),
    endsAt: new Date('2025-06-18T21:00:00+09:00'),
    fee: '0',
    currency: 'JPY',
    refundPolicy: '無料イベントのためキャンセル規定なし',
    liveRoomId: null
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440008',
    creatorUserId: '550e8400-e29b-41d4-a716-446655440007', // エナジーヒーラー 翔
    name: 'オーラクレンジング・グループセッション',
    description: 'エネルギーフィールドの浄化とバランス調整をグループで行います。',
    eventType: 'workshop' as const,
    location: '東京都渋谷区スタジオ',
    startsAt: new Date('2025-06-20T15:00:00+09:00'),
    endsAt: new Date('2025-06-20T17:30:00+09:00'),
    fee: '6000',
    currency: 'JPY',
    refundPolicy: '開始24時間前までキャンセル可能（全額返金）',
    liveRoomId: null
  }
];

// イベント参加者データ
const mockEventParticipants = [
  {
    id: '990e8400-e29b-41d4-a716-446655440001',
    eventId: '880e8400-e29b-41d4-a716-446655440001', // 新月の瞑想サークル
    userId: '550e8400-e29b-41d4-a716-446655440004', // 目醒めの案内人 健太
    status: 'confirmed' as const,
    paymentStatus: 'completed' as const,
    storesPaymentId: 'EVT_001',
    joinedAt: new Date('2025-05-20T10:00:00+09:00')
  },
  {
    id: '990e8400-e29b-41d4-a716-446655440002',
    eventId: '880e8400-e29b-41d4-a716-446655440001', // 新月の瞑想サークル
    userId: '550e8400-e29b-41d4-a716-446655440005', // 天使のメッセンジャー 美咲
    status: 'confirmed' as const,
    paymentStatus: 'completed' as const,
    storesPaymentId: 'EVT_002',
    joinedAt: new Date('2025-05-21T14:30:00+09:00')
  },
  {
    id: '990e8400-e29b-41d4-a716-446655440003',
    eventId: '880e8400-e29b-41d4-a716-446655440002', // プレアデス意識とのチャネリング実践講座
    userId: '550e8400-e29b-41d4-a716-446655440003', // 癒しの音 さくら
    status: 'confirmed' as const,
    paymentStatus: 'completed' as const,
    storesPaymentId: 'EVT_003',
    joinedAt: new Date('2025-05-22T16:45:00+09:00')
  },
  {
    id: '990e8400-e29b-41d4-a716-446655440004',
    eventId: '880e8400-e29b-41d4-a716-446655440003', // クリスタルボウル音浴ヒーリングセッション
    userId: '550e8400-e29b-41d4-a716-446655440007', // エナジーヒーラー 翔
    status: 'pending' as const,
    paymentStatus: 'pending' as const,
    storesPaymentId: null,
    joinedAt: new Date('2025-05-24T09:15:00+09:00')
  },
  {
    id: '990e8400-e29b-41d4-a716-446655440005',
    eventId: '880e8400-e29b-41d4-a716-446655440007', // クンダリーニ覚醒体験シェア会
    userId: '550e8400-e29b-41d4-a716-446655440001', // 光の導き手 明子
    status: 'confirmed' as const,
    paymentStatus: null, // 無料イベント
    storesPaymentId: null,
    joinedAt: new Date('2025-05-25T20:00:00+09:00')
  }
];

// ボイスワークショップ詳細データ
const mockEventVoiceWorkshops = [
  {
    id: 'aa1e8400-e29b-41d4-a716-446655440001',
    eventId: '880e8400-e29b-41d4-a716-446655440002', // プレアデス意識とのチャネリング実践講座
    maxParticipants: 20,
    isRecorded: true,
    recordingUrl: null, // イベント後に設定
    archiveExpiresAt: new Date('2025-07-05T22:30:00+09:00') // 1ヶ月後
  },
  {
    id: 'aa1e8400-e29b-41d4-a716-446655440002',
    eventId: '880e8400-e29b-41d4-a716-446655440005', // エンジェルカードリーディング講座
    maxParticipants: 15,
    isRecorded: false,
    recordingUrl: null,
    archiveExpiresAt: null
  },
  {
    id: 'aa1e8400-e29b-41d4-a716-446655440003',
    eventId: '880e8400-e29b-41d4-a716-446655440006', // アカシックレコード入門セミナー
    maxParticipants: 30,
    isRecorded: true,
    recordingUrl: null,
    archiveExpiresAt: new Date('2025-09-15T16:00:00+09:00') // 3ヶ月後
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
    // publicKey フィールドは除外 (存在しない可能性があるため)
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
    accountType: 'google' as const, // accountType が必須
    isActive: index === 0, // isActive (キャメルケース)
    switchOrder: 1,        // switchOrder (キャメルケース)
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
    mediaUrl: post.contentType === 'audio' ? (post as any).audioUrl : (post as any).mediaUrl, // mediaUrl (音声またはメディアURL)
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
  
  const storyData = mockStories.map((story, index) => {
    const editDataObj = typeof story.editData === 'string' ? JSON.parse(story.editData) : story.editData;
    
    return {
      id: story.id,
      userId: story.userId,
      imageUrl: story.imageUrl,
      textContent: null, // textContent は別のフィールド
      backgroundColor: null,
      fontStyle: null,
      editData: editDataObj, // JSONオブジェクトとして保存
      caption: editDataObj.caption || null,
      location: editDataObj.location || null,
      isRepost: story.isRepost,
      originalStoryId: story.originalStoryId,
      expiresAt: story.expiresAt,
      createdAt: new Date(Date.now() - (index + 1) * 4 * 60 * 60 * 1000)
    };
  });
  
  await db.insert(stories).values(storyData).onConflictDoNothing();
  console.log(`  ✅ ${storyData.length} 件のストーリーズを投入`);
};

/**
 * ショップ商品データを投入
 */
const seedProducts = async () => {
  console.log('🛍️ ショップ商品データを投入中...');
  
  const productData = mockProducts.map((product) => ({
    id: product.id,
    sellerUserId: product.sellerUserId,
    title: product.title,
    description: product.description,
    productType: product.productType,
    price: product.price,
    currency: product.currency,
    imageUrl: product.imageUrl,
    previewUrl: product.previewUrl,
    previewDuration: product.previewDuration,
    stock: product.stock,
    sourcePostId: product.sourcePostId,
    aiDescription: product.aiDescription,
    createdAt: new Date()
  }));
  
  await db.insert(products).values(productData).onConflictDoNothing();
  console.log(`  ✅ ${productData.length} 件の商品を投入`);
};

/**
 * カートデータを投入
 */
const seedCarts = async () => {
  console.log('🛒 カートデータを投入中...');
  
  const cartData = mockCarts.map((cart) => ({
    id: cart.id,
    buyerUserId: cart.buyerUserId,
    status: cart.status,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  await db.insert(carts).values(cartData).onConflictDoNothing();
  console.log(`  ✅ ${cartData.length} 件のカートを投入`);
  
  // カートアイテムを投入
  const cartItemData = mockCartItems.map((item) => ({
    id: item.id,
    cartId: item.cartId,
    productId: item.productId,
    quantity: item.quantity,
    addedAt: new Date()
  }));
  
  await db.insert(cartItems).values(cartItemData).onConflictDoNothing();
  console.log(`  ✅ ${cartItemData.length} 件のカートアイテムを投入`);
};

/**
 * 注文データを投入
 */
const seedOrders = async () => {
  console.log('📦 注文データを投入中...');
  
  const orderData = mockOrders.map((order, index) => ({
    id: order.id,
    buyerUserId: order.buyerUserId,
    amount: order.amount,
    storesPaymentId: order.storesPaymentId,
    status: order.status,
    shippingInfo: order.shippingInfo,
    trackingNumber: order.trackingNumber,
    createdAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000)
  }));
  
  await db.insert(orders).values(orderData).onConflictDoNothing();
  console.log(`  ✅ ${orderData.length} 件の注文を投入`);
  
  // 注文アイテムを投入
  const orderItemData = mockOrderItems.map((item) => ({
    id: item.id,
    orderId: item.orderId,
    productId: item.productId,
    quantity: item.quantity,
    price: item.price
  }));
  
  await db.insert(orderItems).values(orderItemData).onConflictDoNothing();
  console.log(`  ✅ ${orderItemData.length} 件の注文アイテムを投入`);
};

/**
 * イベントデータを投入
 */
const seedEvents = async () => {
  console.log('📅 イベントデータを投入中...');
  
  const eventData = mockEvents.map((event) => ({
    id: event.id,
    creatorUserId: event.creatorUserId,
    name: event.name,
    description: event.description,
    eventType: event.eventType,
    location: event.location,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    fee: event.fee,
    currency: event.currency,
    refundPolicy: event.refundPolicy,
    liveRoomId: event.liveRoomId,
    createdAt: new Date()
  }));
  
  await db.insert(events).values(eventData).onConflictDoNothing();
  console.log(`  ✅ ${eventData.length} 件のイベントを投入`);
  
  // イベント参加者を投入
  const participantData = mockEventParticipants.map((participant) => ({
    id: participant.id,
    eventId: participant.eventId,
    userId: participant.userId,
    status: participant.status,
    paymentStatus: participant.paymentStatus,
    storesPaymentId: participant.storesPaymentId,
    joinedAt: participant.joinedAt
  }));
  
  await db.insert(eventParticipants).values(participantData).onConflictDoNothing();
  console.log(`  ✅ ${participantData.length} 件のイベント参加者を投入`);
  
  // ボイスワークショップ詳細を投入
  const workshopData = mockEventVoiceWorkshops.map((workshop) => ({
    id: workshop.id,
    eventId: workshop.eventId,
    maxParticipants: workshop.maxParticipants,
    isRecorded: workshop.isRecorded,
    recordingUrl: workshop.recordingUrl,
    archiveExpiresAt: workshop.archiveExpiresAt
  }));
  
  await db.insert(eventVoiceWorkshops).values(workshopData).onConflictDoNothing();
  console.log(`  ✅ ${workshopData.length} 件のボイスワークショップ詳細を投入`);
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
      followType: 'family' as const,    // Drizzleのfollow_type enumに合わせる
      status: 'active' as const
    },
    {
      followerId: '550e8400-e29b-41d4-a716-446655440001',
      followeeId: '550e8400-e29b-41d4-a716-446655440003',
      followType: 'watch' as const,     // Drizzleのfollow_type enumに合わせる
      status: 'active' as const
    },
    {
      followerId: '550e8400-e29b-41d4-a716-446655440002',
      followeeId: '550e8400-e29b-41d4-a716-446655440001',
      followType: 'family' as const,    // Drizzleのfollow_type enumに合わせる
      status: 'active' as const
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
    
    // 6. ストーリーズデータを投入
    await seedStories();
    
    // 7. フォロー関係データを投入
    await seedFollows();
    
    // 8. ショップ商品データを投入
    await seedProducts();
    
    // 9. カートデータを投入
    await seedCarts();
    
    // 10. 注文データを投入
    await seedOrders();
    
    // 11. イベントデータを投入
    await seedEvents();
    
    console.log('');
    console.log('✅ データベースシーディング完了！');
    console.log('');
    console.log('投入されたデータ:');
    console.log(`- プロフィール: ${mockUsers.length} 件`);
    console.log(`- ハッシュタグ: ${mockHashtags.length} 件`);
    console.log(`- 投稿: ${mockPosts.length} 件（音声: ${mockPosts.filter(p => p.contentType === 'audio').length}件、画像: ${mockPosts.filter(p => p.contentType === 'image').length}件、テキスト: ${mockPosts.filter(p => p.contentType === 'text').length}件）`);
    console.log(`- フォロー関係: 3 件`);
    console.log(`- 商品: ${mockProducts.length} 件`);
    console.log(`- カート: ${mockCarts.length} 件`);
    console.log(`- カートアイテム: ${mockCartItems.length} 件`);
    console.log(`- 注文: ${mockOrders.length} 件`);
    console.log(`- 注文アイテム: ${mockOrderItems.length} 件`);
    console.log(`- イベント: ${mockEvents.length} 件`);
    console.log(`- イベント参加者: ${mockEventParticipants.length} 件`);
    console.log(`- ボイスワークショップ: ${mockEventVoiceWorkshops.length} 件`);
    console.log(`- ストーリーズ: ${mockStories.length} 件`);
    console.log('');
    console.log('注意:');
    console.log('- Supabase Auth ユーザー作成: 権限制限によりスキップ');
    console.log('- アカウントテーブル: スキーマ不整合によりスキップ');
    
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