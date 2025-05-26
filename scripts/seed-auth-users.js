#!/usr/bin/env node

/**
 * Supabase AuthにテストユーザーをセットアップするJavaScriptスクリプト
 * 
 * 使用方法:
 * 1. 環境変数を設定:
 *    - SUPABASE_URL: SupabaseプロジェクトのURL
 *    - SUPABASE_SERVICE_ROLE_KEY: サービスロールキー (Settings > API から取得)
 * 2. node scripts/seed-auth-users.js を実行
 */

const { createClient } = require('@supabase/supabase-js');

// 環境変数のマッピング（EXPO_PUBLIC_プレフィックスを考慮）
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 環境変数のチェック
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ エラー: 必要な環境変数が設定されていません。');
  console.error('以下の環境変数を設定してください:');
  console.error('- SUPABASE_URL: SupabaseプロジェクトのURL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY: サービスロールキー (Settings > API から取得)');
  process.exit(1);
}

// Supabaseクライアントの初期化（Service Roleキーを使用）
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// テストユーザーデータ
const testUsers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'akiko@kanushi-test.com',
    password: 'test-password-123',
    display_name: '光の導き手 明子'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'ryoma@kanushi-test.com',
    password: 'test-password-123',
    display_name: '宇宙意識 龍馬'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'sakura@kanushi-test.com',
    password: 'test-password-123',
    display_name: '癒しの音 さくら'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'kenta@kanushi-test.com',
    password: 'test-password-123',
    display_name: '目醒めの案内人 健太'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    email: 'misaki@kanushi-test.com',
    password: 'test-password-123',
    display_name: '天使のメッセンジャー 美咲'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    email: 'ren@kanushi-test.com',
    password: 'test-password-123',
    display_name: 'アカシックリーダー 蓮'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    email: 'sho@kanushi-test.com',
    password: 'test-password-123',
    display_name: 'エナジーヒーラー 翔'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    email: 'mariko@kanushi-test.com',
    password: 'test-password-123',
    display_name: '覚醒のファシリテーター 真理子'
  }
];

async function createAuthUsers() {
  console.log('🌟 Supabase Authにテストユーザーを作成します...');
  
  for (const user of testUsers) {
    try {
      // Admin APIを使用してユーザーを作成（特定のIDを指定）
      const { data, error } = await supabase.auth.admin.createUser({
        id: user.id,
        email: user.email,
        password: user.password,
        email_confirm: true, // メール確認をスキップ
        user_metadata: {
          display_name: user.display_name
        }
      });

      if (error) {
        // ユーザーが既に存在する場合はスキップ
        if (error.message.includes('already been registered')) {
          console.log(`⏩ ${user.display_name} (${user.email}) - 既に存在するためスキップ`);
        } else {
          throw error;
        }
      } else {
        console.log(`✅ ${user.display_name} (${user.email}) - 作成成功`);
      }
    } catch (error) {
      console.error(`❌ ${user.display_name} (${user.email}) - エラー:`, error.message);
    }
  }

  console.log('\n📊 ユーザー作成完了！');
  console.log('次のステップ:');
  console.log('1. supabase/migrations/014_seed_japanese_mock_data_current_schema.sql を実行');
  console.log('2. または node scripts/seed-mock-data.js を実行');
  
  console.log('\n🔐 テストアカウントの認証情報:');
  console.log('メールアドレス: [name]@kanushi-test.com');
  console.log('パスワード: test-password-123');
}

// 実行
createAuthUsers().catch(console.error);