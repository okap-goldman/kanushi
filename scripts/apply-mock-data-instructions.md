# 日本語モックデータの適用手順

Supabase SQL Editorを使用してモックデータを適用する手順です。

## 重要: 前提条件

モックデータを適用する前に、Supabase Authにテストユーザーを作成する必要があります。

## 手順

### ステップ1: Authユーザーの作成

```bash
# 環境変数を設定
export SUPABASE_URL="https://dpmrgzjvljaacdwggnaf.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="[Settings > API から取得したサービスロールキー]"

# Authユーザーを作成
node scripts/seed-auth-users.js
```

### ステップ2: モックデータの適用

1. **Supabaseダッシュボードにアクセス**
   - https://app.supabase.com/project/dpmrgzjvljaacdwggnaf にアクセス
   - 左メニューから「SQL Editor」を選択

2. **SQLを実行**
   - 以下のファイルの内容をコピー＆ペースト：
   - `/supabase/migrations/014_seed_japanese_mock_data_current_schema.sql`

3. **実行結果を確認**
   - 「Run」ボタンをクリックして実行
   - エラーがないことを確認

## 代替方法：ローカルでSupabase CLIを使用

```bash
# 1. Supabaseにログイン（ブラウザが開きます）
supabase login

# 2. プロジェクトをリンク
supabase link --project-ref dpmrgzjvljaacdwggnaf

# 3. マイグレーションを実行
supabase db push

# または直接SQLファイルを実行
supabase db execute -f supabase/migrations/014_seed_japanese_mock_data_current_schema.sql
```

## データベース直接接続での実行

```bash
# 環境変数を設定（Supabaseダッシュボードの Settings > Database から取得）
export DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

# psqlで実行
psql "$DATABASE_URL" -f supabase/migrations/014_seed_japanese_mock_data_current_schema.sql
```

## 確認方法

モックデータが正しく挿入されたか確認：

```sql
-- プロフィール数を確認
SELECT COUNT(*) FROM profiles;

-- 日本語プロフィールを確認
SELECT display_name, bio FROM profiles WHERE display_name LIKE '%光の導き手%';

-- 投稿数を確認
SELECT COUNT(*) FROM posts;

-- タグを確認
SELECT name FROM tags WHERE name IN ('目醒め', 'アセンション', '瞑想');
```