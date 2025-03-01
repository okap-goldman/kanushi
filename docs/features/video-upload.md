# 動画投稿機能

## 概要
動画投稿機能は、ユーザーがアプリケーション内で動画を投稿できるようにする機能です。動画はYouTube APIを使用してアップロードされ、YouTubeの埋め込みプレーヤーを使用して表示されます。

## 機能
- デバイスからの動画選択
- アプリ内での動画録画
- YouTube APIを使用した動画アップロード
- 公開設定（公開/限定公開）の選択
- 説明文の追加
- YouTubeの埋め込みプレーヤーを使用した動画表示

## 技術的な詳細
### 動画アップロード
1. ユーザーがデバイスから動画を選択するか、アプリ内で録画します
2. YouTube APIを使用して動画をアップロードします
3. アップロードされた動画のYouTube埋め込みURLを取得します
4. 投稿データをFirestoreに保存します

### 認証
- Firebase Authenticationを使用してYouTubeアカウントと連携します
- YouTube APIのスコープ: `https://www.googleapis.com/auth/youtube.upload`

### データモデル
```typescript
{
  userId: string;
  content: string; // YouTube埋め込みURL
  caption: string; // 説明文
  mediaType: 'video';
  visibility: 'public' | 'unlisted';
  created_at: string;
  updated_at: string;
}
```

## 使用方法
1. 投稿ページから「動画」を選択します
2. 「録画を開始」ボタンをクリックするか、「動画を選択」ボタンをクリックしてデバイスから動画を選択します
3. 公開設定（公開/限定公開）を選択します
4. 説明文を入力します（任意）
5. 「投稿する」ボタンをクリックします

## エラーハンドリング
- 動画アップロード中のエラー処理
- YouTube API認証エラーの処理
- ネットワークエラーの処理

## 制限事項
- 動画のサイズや長さに制限がある場合があります（YouTubeの制限に準拠）
- YouTubeアカウントとの連携が必要です

## 今後の改善点
- 動画のトリミングや編集機能の追加
- アップロード進捗状況の表示
- 複数動画の同時アップロード
