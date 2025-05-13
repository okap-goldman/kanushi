-- Kanushiアプリテストユーザー用の認証データ

-- 注意: このスクリプトはSupabase Dashboardで実行してください。
-- SQL Editorを開き、このスクリプトを貼り付けて実行することで、
-- テストユーザーの認証情報が設定されます。

-- テストユーザーの認証設定
-- すべての共通パスワード: kanushi123

-- 既存のauth.usersテーブルへのテストユーザー追加
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  phone,
  phone_confirmed_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  reauthentication_token,
  reauthentication_sent_at,
  last_sign_in_at
)
VALUES
-- 田中さくら（一般ユーザー）
(
  'd0e8c69f-73e4-4f9a-80e3-363a0070159a',
  'sakura@example.com',
  -- kanushi123 のハッシュ（実際の環境では自動的に生成される）
  '$2a$10$7PGlz6NXI1zw9iKhJrfcpu/8KPcmww5FMfqNfhDSyQbV6hV3kJzLC',
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "田中さくら"}',
  false,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW()
),
-- 鈴木太郎（一般ユーザー）
(
  'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f',
  'taro@example.com',
  -- kanushi123 のハッシュ
  '$2a$10$7PGlz6NXI1zw9iKhJrfcpu/8KPcmww5FMfqNfhDSyQbV6hV3kJzLC',
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "鈴木太郎"}',
  false,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW()
),
-- 佐藤はるか（一般ユーザー）
(
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'haruka@example.com',
  -- kanushi123 のハッシュ
  '$2a$10$7PGlz6NXI1zw9iKhJrfcpu/8KPcmww5FMfqNfhDSyQbV6hV3kJzLC',
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "佐藤はるか"}',
  false,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW()
),
-- 管理者
(
  'f1e2d3c4-b5a6-7987-8765-4321abcdef98',
  'admin@example.com',
  -- kanushi123 のハッシュ
  '$2a$10$7PGlz6NXI1zw9iKhJrfcpu/8KPcmww5FMfqNfhDSyQbV6hV3kJzLC',
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "管理者"}',
  true,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW()
);

-- identities テーブルにも関連データを挿入
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES
-- 田中さくら
(
  'd0e8c69f-73e4-4f9a-80e3-363a0070159a',
  'd0e8c69f-73e4-4f9a-80e3-363a0070159a',
  '{"sub": "d0e8c69f-73e4-4f9a-80e3-363a0070159a", "email": "sakura@example.com"}',
  'email',
  NOW(),
  NOW(),
  NOW()
),
-- 鈴木太郎
(
  'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f',
  'c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f',
  '{"sub": "c2e8d7b6-5a4b-3c2d-1e0f-9a8b7c6d5e4f", "email": "taro@example.com"}',
  'email',
  NOW(),
  NOW(),
  NOW()
),
-- 佐藤はるか
(
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  '{"sub": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d", "email": "haruka@example.com"}',
  'email',
  NOW(),
  NOW(),
  NOW()
),
-- 管理者
(
  'f1e2d3c4-b5a6-7987-8765-4321abcdef98',
  'f1e2d3c4-b5a6-7987-8765-4321abcdef98',
  '{"sub": "f1e2d3c4-b5a6-7987-8765-4321abcdef98", "email": "admin@example.com"}',
  'email',
  NOW(),
  NOW(),
  NOW()
);

-- 注意事項：
-- 1. このスクリプトはSupabaseのダッシュボードのSQL Editorで実行してください
-- 2. パスワードの実際のハッシュ値はSupabaseのバージョンや設定によって異なる場合があります
-- 3. 本番環境では絶対にこのようなハードコードされたパスワードを使用しないでください

-- 以下のログイン情報でアプリケーションにサインインできます：
-- ユーザー1: sakura@example.com / kanushi123
-- ユーザー2: taro@example.com / kanushi123
-- ユーザー3: haruka@example.com / kanushi123
-- 管理者: admin@example.com / kanushi123