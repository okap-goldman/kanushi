# 外部サービス統合

## SoundCloud

プロフィール音声およびオーディオ投稿のストレージとして、SoundCloud APIを使用しています。

- 認証: OAuth 2.1 Client Credentials Flow
- エンドポイント: `/tracks` (アップロード用)
- 実装: `src/lib/soundcloud.ts`

### 音声アップロードフロー

1. ユーザーが音声を録音または選択
2. `uploadAudio` 関数を呼び出し
3. SoundCloud APIを使用して音声をアップロード
4. 返されたパーマリンクURLをデータベースに保存

### 音声再生

SoundCloudの埋め込みプレーヤーを使用して音声を再生します。
`SoundCloudPlayer` コンポーネント (`src/components/SoundCloudPlayer.tsx`) を使用して実装しています。

### 設定

SoundCloud APIを使用するには、以下の環境変数を設定する必要があります：

```
VITE_SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id
VITE_SOUNDCLOUD_CLIENT_SECRET=your_soundcloud_client_secret
```

## Firebase

認証およびストレージ機能として、Firebase Servicesを使用しています。

- 認証: Firebase Authentication (Google OAuth 2.0)
- ストレージ: Firebase Storage (画像ファイル用)
- 実装: `src/lib/firebase.ts`

## Box

画像ファイルのストレージとして、Box APIを使用する予定です（未実装）。

## YouTube

動画ファイルのストレージとして、YouTube APIを使用する予定です（未実装）。

## Stripe

決済処理として、Stripe APIを使用する予定です（未実装）。
