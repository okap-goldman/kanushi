# Kanushi アプリケーション用 Supabase インテグレーションガイド

このドキュメントは、Kanushiアプリケーションで使用されるSupabaseの設定とデータモデルについて説明します。

## セットアップ手順

1. Supabaseアカウントを作成し、新しいプロジェクトをセットアップします。
2. `.env`ファイルを作成し、以下の環境変数を設定します：
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. `supabase-schema-clean.sql`ファイルの内容をSupabaseのSQLエディターで実行します。これによりデータベースの構造が作成され、サンプルデータが挿入されます。

## データモデル

### プロファイル (profiles)
ユーザープロファイル情報を格納します。
- `id` (UUID): ユーザーID
- `name` (TEXT): 表示名
- `image` (TEXT): プロフィール画像のURL
- `username` (TEXT): ユニークなユーザー名
- `bio` (TEXT): 自己紹介
- `created_at` (TIMESTAMP): 作成日時
- `updated_at` (TIMESTAMP): 更新日時

### 投稿 (posts)
ユーザーの投稿を格納します。
- `id` (UUID): 投稿ID
- `user_id` (UUID): 作成者ID（profilesテーブルの外部キー）
- `content_type` (TEXT): コンテンツタイプ（'text', 'image', 'video', 'audio'のいずれか）
- `text_content` (TEXT): テキストコンテンツ
- `media_url` (TEXT): メディアのURL（画像、動画）
- `audio_url` (TEXT): 音声ファイルのURL
- `thumbnail_url` (TEXT): サムネイル画像のURL
- `likes_count` (INTEGER): いいねの数
- `comments_count` (INTEGER): コメントの数
- `timeline_type` (TEXT): タイムラインタイプ（'family', 'watch', 'all'のいずれか）
- `created_at` (TIMESTAMP): 作成日時

### タグ (tags)
投稿に関連付けられるタグを格納します。
- `id` (UUID): タグID
- `name` (TEXT): タグ名（ユニーク）
- `created_at` (TIMESTAMP): 作成日時

### 投稿タグ関連付け (post_tags)
投稿とタグの多対多の関連付けを格納します。
- `id` (UUID): 関連付けID
- `post_id` (UUID): 投稿ID（postsテーブルの外部キー）
- `tag_id` (UUID): タグID（tagsテーブルの外部キー）
- `created_at` (TIMESTAMP): 作成日時

### コメント (comments)
投稿に対するコメントを格納します。
- `id` (UUID): コメントID
- `post_id` (UUID): 投稿ID（postsテーブルの外部キー）
- `user_id` (UUID): コメント作成者ID（profilesテーブルの外部キー）
- `content` (TEXT): コメント内容
- `created_at` (TIMESTAMP): 作成日時

### いいね (likes)
投稿に対するいいねを格納します。
- `id` (UUID): いいねID
- `post_id` (UUID): 投稿ID（postsテーブルの外部キー）
- `user_id` (UUID): いいねをした人のID（profilesテーブルの外部キー）
- `created_at` (TIMESTAMP): 作成日時

## APIエンドポイント

アプリケーションとSupabaseの連携には、以下のAPIエンドポイントが実装されています：

### 投稿関連
- `getPosts(timeline_type?)`: 投稿一覧を取得する（オプションでタイムラインタイプでフィルタリング）
- `getPostById(id)`: 投稿をIDで取得する
- `createPost(post)`: 新しい投稿を作成する（タグの関連付けも含む）

### コメント関連
- `getComments(post_id)`: 投稿に対するコメントを取得する
- `createComment(comment)`: 新しいコメントを作成する

### いいね関連
- `toggleLike(post_id, user_id)`: いいねの切り替え
- `checkLiked(post_id, user_id)`: ユーザーがすでにいいねしているか確認する

## セキュリティ

Row Level Security (RLS) を使用して、データへのアクセス制御を実装しています：

- 全てのデータは誰でも**閲覧可能**
- ユーザーは自分自身のプロファイルのみ**更新・削除可能**
- ユーザーは自分の投稿、コメント、いいねのみ**削除可能**
- ユーザーは自分の投稿に関連するタグのみ**関連付け・削除可能**
- タグ自体の更新と削除は管理者のみ可能

## サンプルデータ

スキーマにはサンプルデータが含まれています：

- 4人のユーザープロファイル
- テキスト、画像、音声、動画の各メディアタイプの投稿
- 「ファミリー」と「ウォッチ」のタイムラインに分類された投稿
- 投稿に付けられたサンプルコメント
- タグ（「スピリチュアル」「瞑想」「自己啓発」など）
- 投稿とタグの関連付け

## アップロード機能

メディアファイルのアップロードには、以下の関数が実装されています：

- `uploadFile(file, bucket, folder)`: 一般的なファイルのアップロード
- `uploadAudioBlob(audioBlob, bucket, folder)`: 音声ファイルのアップロード