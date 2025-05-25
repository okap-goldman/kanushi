# CLAUDE.md

このファイルは、このリポジトリのコードを扱う際にClaude Code (claude.ai/code) にガイダンスを提供します。

## プロジェクト概要
Kanushi（かぬし）は「目醒め人のためのSNS」です。音声コンテンツを主軸とした、スピリチュアルな目醒めを求めるコミュニティ向けのReact Nativeモバイルアプリです。

## 主要コマンド

### 開発
```bash
# 開発サーバーを起動
npm run web          # Web版開発サーバー
npm run ios          # iOS Simulator
npm run android      # Android Emulator

# コード品質チェック
npm run check        # TypeScript型チェック + Biome lint/format

# テスト実行
npm test             # 全テスト実行
npm run test:ui      # Vitest UIモード
npm run test:api     # APIテスト（単体テスト）のみ実行
npm run test:integration # 結合テストのみ実行
npm run test:e2e     # E2Eテストのみ実行

# データベース操作
npm run db:generate  # スキーマ変更からマイグレーションを生成
npm run db:migrate   # データベースにマイグレーションを適用
npm run db:studio    # DB管理のためにDrizzle Studioを開く
```

## アーキテクチャ概要

### 技術スタック
- **フロントエンド**: React Native + Expo + TypeScript
- **バックエンド**: Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Function)
- **データベース**: Drizzle ORM + PostgreSQL
- **ストレージ**: Backblaze B2 + Cloudflare CDN (Edge Functions経由)
- **UIコンポーネント**: shadcn/uiパターンに基づいたカスタムコンポーネント
- **状態管理**: React Context API (AuthContext)

### 主要な設計決定
1. **音声ファーストのコンテンツ**: 主要なコンテンツタイプは音声（最大8時間）
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

## 関連ドキュメント

### 設計・仕様書
- `doc/requirements.yaml` - 要件定義書
- `doc/architecture.md` - システムアーキテクチャ
- `doc/er_diagram.md` - データベース設計
- `doc/screen_flow.md` - 画面遷移設計
- `doc/usecase.md` - ユースケース定義
- `doc/openapi.yaml` - API仕様書

### 実装計画・進捗
- `doc/implementation-plan.md` - 実装計画書（フェーズ別進捗状況）
- `doc/progress.md` - 詳細進捗記録

### シーケンス図
- `doc/sequences/01_auth_account.md` - 認証・アカウント管理
- `doc/sequences/02_timeline_post.md` - タイムライン・投稿機能
- `doc/sequences/03_follow.md` - フォロー機能
- `doc/sequences/04_liveroom.md` - ライブルーム機能
- `doc/sequences/05_direct_message.md` - ダイレクトメッセージ
- `doc/sequences/06_event.md` - イベント機能
- `doc/sequences/07_shop_ec.md` - ショップ・EC機能
- `doc/sequences/08_group.md` - グループ機能
- `doc/sequences/09_ai_search.md` - AIチャット・検索機能
- `doc/sequences/10_stories.md` - ストーリーズ機能
- `doc/sequences/11_notification.md` - 通知機能

### テスト仕様書
- `doc/test-specs/01_auth-account-test-spec.md` - 認証・アカウント管理テスト
- `doc/test-specs/02_timeline-post-test-spec.md` - タイムライン・投稿テスト
- `doc/test-specs/03_follow-function-test-spec.md` - フォロー機能テスト
- `doc/test-specs/04_liveroom_test_specification.md` - ライブルームテスト
- `doc/test-specs/05_test_specification_dm.md` - DMテスト
- `doc/test-specs/06_test-specification-event.md` - イベントテスト
- `doc/test-specs/07_test_specification_shop_ec.md` - ショップ・ECテスト
- `doc/test-specs/08_group_test_spec.md` - グループテスト
- `doc/test-specs/09_test_specification_ai_search.md` - AIチャット・検索テスト
- `doc/test-specs/10_stories_test_spec.md` - ストーリーズテスト
- `doc/test-specs/11_notification_test_spec.md` - 通知テスト

## 重要な注意事項
- 作業完了後は `doc/implementation-plan.md` を更新
- Biome設定: セミコロン必須、シングルクォート、インデント2スペース
- テスト実装時は対応するtest仕様書（`doc/test-specs/`）を参照
- データベーススキーマ変更時は必ず型生成とマイグレーション実行