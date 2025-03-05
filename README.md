# Kanushi - 目醒め人のためのSNS

## プロジェクト概要
Kanushiは「目醒め」をテーマにした、共感・学び合い・自己表現ができるコミュニティSNSです。本当に深い繋がりを重視し、ユーザー同士の意味のある交流を促進します。

## 開発環境のセットアップ

### 必要条件
- Node.js (v18以上)
- npm (v9以上)
- Firebase CLI (`npm install -g firebase-tools`)

### インストール手順
```sh
# リポジトリをクローン
git clone https://github.com/okap-goldman/kanushi.git
cd kanushi

# 依存パッケージをインストール
npm install
```

### 環境変数の設定
`.env.example`ファイルを`.env`にコピーして、必要な環境変数を設定してください。

```sh
cp .env.example .env
```

主な環境変数：
- Firebase設定（API Key, Auth Domain, Project ID, Storage Bucket, Messaging Sender ID, App ID）
- テスト用Googleアカウント情報

### プロジェクトの起動方法
1. Firebaseエミュレーターを起動
```sh
firebase emulators:start
```

2. 別のターミナルタブで開発サーバーを起動
```sh
npm run dev
```

## プロジェクト構成

### 技術スタック
- フロントエンド: React, TypeScript, Vite
- UI: shadcn-ui, Tailwind CSS
- 状態管理: React Query, Context API
- ルーティング: React Router
- バックエンド: Firebase (Authentication, Firestore, Storage)
- テスト: Jest, React Testing Library

### ディレクトリ構造
```
src/
├── __tests__/     # テストファイル
├── components/    # UIコンポーネント
├── contexts/      # Reactコンテキスト
├── controllers/   # ビジネスロジック
├── hooks/         # カスタムフック
├── lib/           # ユーティリティ関数
├── pages/         # ページコンポーネント
├── tests/         # テストユーティリティ
└── types/         # TypeScript型定義
```

## Firebase情報
- 関連アカウント: kazuki.iztn993@gmail.com
- エミュレーターポート:
  - Auth: 9099
  - Firestore: 8088
  - Storage: 9199

## 主な機能
- ユーザー管理（Google認証）
- フォロー機能（ファミリー/ウォッチ）
- タイムライン機能
- プロフィール機能
- 検索・AIチャット機能
- イベント機能
- ショップ機能

## 開発ワークフロー
1. `develop`ブランチから新しいブランチを作成
2. 変更を実装
3. テストを実行 (`npm test`)
4. リントを実行 (`npm run lint`)
5. PRを作成して`develop`ブランチにマージ

## 詳細ドキュメント
詳細な仕様や実装状況については、`docs/`ディレクトリ内のドキュメントを参照してください：
- `requirements_definition.md`: 要件定義
- `implementation_status.md`: 実装状況
- `entity_relationship.md`: エンティティ関連図
- `screen_transition.md`: 画面遷移図
- `screen_user_interface.md`: 画面・ユーザーインターフェース
- `api_specifications.yaml`: API仕様
- `tests/profile_unit_test_spec.md`: プロフィール画面の単体テスト仕様書
