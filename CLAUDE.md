# CLAUDE.md

このファイルは、このリポジトリのコードを扱う際にClaude Code (claude.ai/code) にガイダンスを提供します。

## プロジェクト概要
Kanushi（かぬし）は「目醒め人のためのSNS」です。音声コンテンツを主軸とした、スピリチュアルな目醒めを求めるコミュニティ向けのReact Nativeモバイルアプリです。

## 主要コマンド

### 開発
```bash
# 開発サーバーを起動
npm start

# 型チェックとLintを実行
npm run check

# データベース操作
npm run db:generate  # スキーマ変更からマイグレーションを生成
npm run db:migrate   # データベースにマイグレーションを適用
npm run db:studio    # DB管理のためにDrizzle Studioを開く
```

### プラットフォーム固有のビルド
```bash
npm run ios      # iOSシミュレーターで実行
npm run android  # Androidエミュレーターで実行
npm run web      # Web版を実行
```

## アーキテクチャ概要

### 技術スタック
- **フロントエンド**: React Native + Expo + TypeScript
- **バックエンド**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **データベース**: Drizzle ORM + PostgreSQL
- **ストレージ**: Backblaze B2 + Cloudflare CDN (Edge Functions経由)
- **UIコンポーネント**: shadcn/uiパターンに基づいたカスタムコンポーネント
- **状態管理**: React Context API (AuthContext)

### 主要な設計決定
1. **音声ファーストのコンテンツ**: 主要なコンテンツタイプは音声（最大15分の録音）
2. **オフラインサポート**: 暗号化されたローカルキャッシュ（最大500MB、1ヶ月で自動削除）
3. **マルチアカウント**: デバイスごとに最大5つのアカウントをサポート
4. **リアルタイム**: チャットにはWebSocket、ライブルームにはWebRTC (LiveKit)
5. **E2E暗号化**: ユーザーの公開鍵を使用したダイレクトメッセージのE2E暗号化

### データベーススキーマ
`src/lib/db/schema/` に配置されています。主要モジュール:
- `profile.ts` - ユーザープロフィールとアカウント
- `post.ts` - 投稿、コメント、いいね
- `messaging.ts` - E2E暗号化されたDM
- `ecommerce.ts` - ショップ機能
- `liveRoom.ts` - ライブオーディオルーム
- `event.ts` - イベント管理

### プロジェクト構造
```
src/
├── components/     # 再利用可能なUIコンポーネント
├── screens/        # スクリーンコンポーネント
├── lib/           # ビジネスロジックとサービス
│   ├── db/        # データベーススキーマとクライアント
│   └── *Service.ts # サービスモジュール
├── context/       # Reactコンテキスト
└── hooks/         # カスタムReactフック

supabase/
├── functions/     # Edge Functions
└── migrations/    # SQLマイグレーション
```

## 開発ガイドライン

### データベースの操作
- スキーマの変更は `src/lib/db/schema/` に行います
- スキーマ変更後、`npm run db:generate` を実行し、その後 `npm run db:migrate` を実行します
- すべてのDB操作にはDrizzleの型安全なクエリビルダーを使用します

### 認証フロー
- Supabase AuthがOAuthおよびメール/パスキー認証を処理します
- JWTトークンはSupabaseクライアントによって自動的に管理されます
- マルチアカウント切り替えは、アクティブなアカウントを暗号化されたストレージに保存します

### メディア処理
- 音声アップロード: 品質向上のためEdge Functionを介して処理
- 画像: B2アップロード前にリサイズ/最適化
- すべてのメディアはCloudflare CDNを介して配信されます

### テストアプローチ
- サービスおよびユーティリティの単体テスト
- APIエンドポイントの結合テスト
- 重要なユーザーフローのエンドツーエンドテスト
- コードカバレッジ80%を目標

## 現在の実装状況
詳細なフェーズ状況については `doc/implementation-plan.md` を参照してください。現在フェーズ2（コア機能）です。

## 重要な注意事項
- 作業完了後は @doc/implementation-plan.md を更新