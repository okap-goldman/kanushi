# 日本語モックデータの適用方法

Kanushiアプリに日本語のスピリチュアル系モックデータを適用する方法を説明します。

## モックデータの内容

以下の日本語データが含まれています：

- **プロフィール（8人）**: 光の導き手、スターシード、ヒーラーなど
- **投稿（10件）**: 瞑想ガイド、チャネリングメッセージ、ヒーリング音声など
- **ハッシュタグ（15個）**: #目醒め、#アセンション、#瞑想など
- **イベント（4件）**: 満月瞑想会、ワークショップなど
- **その他**: コメント、いいね、フォロー関係、ストーリーズ

## 適用方法

### 方法1: Node.jsスクリプトを使用

```bash
# 環境変数を設定
export DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# スクリプトを実行
npm run db:seed
```

### 方法2: Supabase CLIを使用（推奨）

```bash
# Supabase CLIをインストール（未インストールの場合）
npm install -g supabase

# ログイン
supabase login

# プロジェクトをリンク
supabase link --project-ref [your-project-ref]

# モックデータを適用
./scripts/seed-with-supabase-cli.sh
```

## 注意事項

- 既存のデータがある場合、IDの重複によりエラーが発生する可能性があります
- 本番環境では実行しないでください（開発環境専用）
- データベースのバックアップを取ることをお勧めします

## トラブルシューティング

### エラー: duplicate key value violates unique constraint

既にモックデータが挿入されています。データをリセットしたい場合は、該当するテーブルのデータを削除してから再実行してください。

### エラー: psql command not found

PostgreSQLクライアントをインストールしてください：
- Mac: `brew install postgresql`
- Ubuntu: `sudo apt-get install postgresql-client`

### エラー: permission denied

データベースへの接続権限を確認してください。DATABASE_URLが正しいことを確認してください。