# Supabase Integration Guide for Kanushi

このドキュメントでは、KanushiプロジェクトにおけるSupabaseの設定と使用方法について説明します。

## セットアップ手順

1. Supabaseアカウントを作成し、新しいプロジェクトを開始します。
2. `.env`ファイルに必要な環境変数を追加します（`.env.example`を参照）。
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. `supabase-schema.sql`ファイル内のSQLをSupabaseのSQLエディタで実行し、データベースのスキーマとサンプルデータを設定します。

## データベース構造

Supabaseには以下のテーブルが設定されています：

### profiles
ユーザープロファイル情報を保存します。
- `id`: ユーザーID (UUID)
- `name`: 表示名
- `image`: プロフィール画像URL
- `username`: ユニークなユーザー名
- `bio`: 自己紹介
- `created_at`: 作成日時
- `updated_at`: 更新日時

### posts
投稿データを保存します。
- `id`: 投稿ID (UUID)
- `author_id`: 投稿者ID (profiles.idへの参照)
- `content`: 投稿内容（テキストまたはメディアURL）
- `caption`: 投稿の説明 (オプション)
- `media_type`: メディアタイプ ('text', 'image', 'video', 'audio')
- `likes_count`: いいね数
- `comments_count`: コメント数
- `timeline_type`: タイムラインタイプ ('family', 'watch', 'all')
- `created_at`: 作成日時
- `updated_at`: 更新日時

### comments
投稿へのコメントを保存します。
- `id`: コメントID (UUID)
- `post_id`: 投稿ID (posts.idへの参照)
- `author_id`: コメント投稿者ID (profiles.idへの参照)
- `content`: コメント内容
- `created_at`: 作成日時

### likes
投稿へのいいねを追跡します。
- `id`: いいねID (UUID)
- `post_id`: 投稿ID (posts.idへの参照)
- `user_id`: ユーザーID (profiles.idへの参照)
- `created_at`: 作成日時

## サンプルデータ

Supabaseには以下のサンプルデータが含まれています：

1. 4人のユーザープロファイル
2. 7つの投稿（テキスト、画像、音声、動画）
3. サンプルコメント
4. サンプルのいいね

## セキュリティ設定

Row Level Security (RLS)が全テーブルに対して有効になっており、以下のポリシーが設定されています：

- 全テーブルは誰でも閲覧可能
- 認証済みユーザーのみが自分のプロファイル・投稿・コメント・いいねを作成可能
- ユーザーは自分のデータのみを更新・削除可能

## Supabase API利用法

プロジェクトでは、以下のモジュールを使用してSupabaseと連携しています：

- `src/lib/supabase.ts`: Supabaseクライアントとファイルアップロード機能
- `src/lib/postService.ts`: 投稿データの取得・作成・操作用関数

### 主要な関数

- `getPosts(timeline_type?)`: 投稿一覧の取得
- `getPostById(id)`: 特定の投稿の取得
- `createPost(post)`: 新規投稿の作成
- `getComments(post_id)`: 投稿のコメント取得
- `createComment(comment)`: コメントの投稿
- `toggleLike(post_id, user_id)`: いいねの切り替え

## ストレージの使用方法

Supabaseには`media`バケットが設定されており、以下のフォルダで管理されています：

- `uploads/`: アップロードされたメディアファイル
- `audio/`: 音声ファイル

ファイルのアップロードには、`supabase.ts`の`uploadFile`および`uploadAudioBlob`関数を使用します。