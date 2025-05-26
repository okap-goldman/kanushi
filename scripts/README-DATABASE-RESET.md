# データベース完全リセット & セットアップガイド

このガイドでは、Supabase データベースを完全にリセットし、Drizzle ORM を使用して最新のスキーマでマイグレーションとシーディングを行う方法を説明します。

## 概要

新しく作成されたシステムにより、以下の処理を自動化できます：

1. **データベース完全リセット** - 既存のテーブル・データ・型をすべて削除
2. **Drizzle マイグレーション生成** - TypeScript スキーマから SQL マイグレーションを自動生成
3. **マイグレーション適用** - データベースにスキーマを適用
4. **モックデータシーディング** - 日本語のスピリチュアル系モックデータを投入

## 前提条件

### 必要な環境変数

`.env.local` ファイルに以下の環境変数が設定されている必要があります：

```bash
# Supabase データベース接続（Direct URL - Pooler ではない）
DATABASE_URL="postgresql://postgres.xyz:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"

# Supabase プロジェクト設定
NEXT_PUBLIC_SUPABASE_URL="https://xyz.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

⚠️ **重要**: `DATABASE_URL` は Pooler URL ではなく、Direct URL を使用してください。

### 依存関係

必要なパッケージは自動的にインストールされますが、手動でインストールする場合：

```bash
npm install postgres tsx
```

## 使用方法

### 🚀 ワンステップ実行（推奨）

すべてのプロセスを一括実行：

```bash
npm run db:reset-and-setup
```

このコマンドは以下をすべて実行します：
1. データベースリセット
2. マイグレーション生成
3. マイグレーション適用  
4. モックデータシーディング

### 📋 個別実行

段階的に実行したい場合：

```bash
# 1. データベースリセット
npm run db:reset

# 2. マイグレーション生成
npm run db:generate

# 3. マイグレーション適用
npm run db:migrate

# 4. モックデータシーディング
npm run db:seed-drizzle
```

### 🔍 データベース確認

セットアップ後の確認：

```bash
# Drizzle Studio でデータベースを確認
npm run db:studio

# アプリケーションを起動
npm run web
```

## 作成されるモックデータ

### プロフィール（8件）
- 光の導き手 明子（瞑想指導者）
- 宇宙意識 龍馬（スターシード）
- 癒しの音 さくら（ヒーラー）
- 目醒めの案内人 健太（エネルギーワーカー）
- 天使のメッセンジャー 美咲（カードリーダー）
- アカシックリーダー 蓮（リーディング専門）
- エナジーヒーラー 翔（チャクラ専門）
- 覚醒のファシリテーター 真理子（クンダリーニ専門）

### コンテンツ
- **ハッシュタグ**: 15件（#目醒め、#アセンション、#ライトワーカー等）
- **投稿**: 5件（音声・テキスト投稿）
- **ストーリーズ**: 2件（画像+編集データ）
- **フォロー関係**: 3件（サンプル関係）

## ファイル構成

### 新規作成されたファイル

```
scripts/
├── reset-database.ts       # データベース完全リセット
├── seed-with-drizzle.ts    # Drizzle ベースシーディング  
├── reset-and-setup.ts      # 統合実行スクリプト
└── README-DATABASE-RESET.md # このファイル

src/lib/db/
└── drizzle-client.ts       # Drizzle 専用 DB クライアント
```

### package.json 新規コマンド

```json
{
  "scripts": {
    "db:seed-drizzle": "npx tsx scripts/seed-with-drizzle.ts",
    "db:reset": "npx tsx scripts/reset-database.ts --confirm", 
    "db:reset-and-setup": "npx tsx scripts/reset-and-setup.ts --confirm"
  }
}
```

## トラブルシューティング

### ❌ データベース接続エラー

```bash
Error: getaddrinfo ENOTFOUND
```

**解決方法**:
- `.env.local` の `DATABASE_URL` を確認
- Supabase プロジェクトが起動していることを確認
- ネットワーク接続を確認

### ❌ 権限エラー

```bash
permission denied for schema public
```

**解決方法**:
- `SUPABASE_SERVICE_ROLE_KEY` が正しく設定されているか確認
- Service Role Key の権限を確認

### ❌ TSX実行エラー

```bash
command not found: tsx
```

**解決方法**:
```bash
npm install -D tsx
```

### ❌ Postgres パッケージエラー

```bash
Cannot find module 'postgres'
```

**解決方法**:
```bash
npm install postgres
```

## 安全に関する注意事項

⚠️ **警告**: これらのスクリプトは破壊的操作を行います。

- **本番環境では絶対に実行しないでください**
- 開発環境・テスト環境でのみ使用してください
- 実行前に重要なデータのバックアップを取ってください
- すべてのスクリプトは `--confirm` フラグが必要です

## 次のステップ

セットアップ完了後：

1. **Drizzle Studio** でデータ構造を確認
2. **アプリケーション起動** でモックデータを確認
3. **テスト実行** で機能をテスト

```bash
npm run db:studio    # データベース確認
npm run web         # アプリケーション起動
npm test           # テスト実行
```

---

**関連ドキュメント**:
- [CLAUDE.md](../CLAUDE.md) - プロジェクト概要
- [architecture.md](../doc/architecture.md) - システムアーキテクチャ
- [implementation-plan.md](../doc/implementation-plan.md) - 実装計画