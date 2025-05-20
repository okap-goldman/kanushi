# 検索・AIドメインテストパラメーター詳細

このドキュメントでは、検索・AIドメインのテストに使用するパラメーターとその期待値の詳細なリストを提供します。これらのパラメーターと期待値のペアは、テスト仕様書に記載された各テストケースの入力条件と出力条件を詳細に定義します。

## 1. 検索機能テストパラメーター

### 1.1 検索クエリパラメーター詳細

| テストID | パラメーター | 値 | 期待される結果 |
|----------|--------------|-----|----------------|
| S-01-1 | query | "目醒め" | 「目醒め」を含む投稿とユーザーのレコードが含まれる検索結果 |
| S-01-2 | type | "all" | 検索結果には"post"と"user"両方のタイプの項目が含まれる |
| S-01-3 | limit | 20 | 結果は最大20件まで返される |
| S-01-4 | offset | 0 | 最初のページから結果が返される |
| S-02-1 | query | "田中" | 「田中」を含むユーザー名のユーザーレコード |
| S-02-2 | type | "user" | 検索結果にはユーザーレコードのみが含まれる |
| S-03-1 | query | "瞑想" | 「瞑想」を含む投稿レコード |
| S-03-2 | type | "post" | 検索結果には投稿レコードのみが含まれる |
| S-04-1 | query | "" | 検索履歴の表示 |
| S-04-2 | type | "all" | 検索結果ではなく検索履歴が表示される |
| S-05-1 | query | "体験" | 「体験」を含む投稿レコード |
| S-05-2 | type | "post" | 検索結果には投稿レコードのみが含まれる |
| S-05-3 | filters | {"date": "last_week"} | 過去1週間の投稿のみが表示される |
| S-06-1 | query | "瞑想" | 「瞑想」を含む投稿レコード |
| S-06-2 | limit | 10 | 1ページあたり10件の結果 |
| S-06-3 | offset | 10 | 2ページ目（11-20件目）の結果 |
| S-07-1 | query | "目醒め!" | 特殊文字を含むクエリでもエラーなく処理される |
| S-08-1 | query | "これは50文字以上の非常に長い検索クエリです..." | 長いクエリでもエラーなく処理される |
| S-09-1 | query | "瞑想 目醒め" | 「瞑想」と「目醒め」の両方を含むコンテンツが返される |
| S-10-1 | query | "<script>alert('XSS')</script>" | XSSが無効化され、安全に検索が処理される |

### 1.2 検索サジェストパラメーター詳細

| テストID | パラメーター | 値 | 期待される結果 |
|----------|--------------|-----|----------------|
| SS-01-1 | query | "目" | 「目醒め」などのサジェストを含む配列 |
| SS-01-2 | limit | 5 | 最大5件のサジェスト |
| SS-02-1 | query | "" | 最近の検索履歴がサジェストとして返される |
| SS-02-2 | limit | 5 | 最大5件の履歴サジェスト |
| SS-03-1 | query | "存在しないであろうクエリ" | 空の配列 [] |
| SS-04-1 | query | "目" | 「目醒め」などのサジェスト |
| SS-04-2 | limit | 3 | 最大3件のサジェスト |
| SS-05-1 | query | "瞑" | 「瞑想」などの人気サジェストが含まれる |
| SS-05-2 | limit | 5 | 最大5件のサジェスト |

### 1.3 検索エラー処理パラメーター詳細

| テストID | 条件 | 期待されるエラー | 期待されるUI応答 |
|----------|------|------------------|------------------|
| SE-01-1 | オフライン状態で検索 | NetworkException("ネットワーク接続エラーが発生しました") | エラーメッセージ表示と再試行ボタン |
| SE-02-1 | 500エラーをモック | ServerException("サーバーエラーが発生しました") | エラーメッセージ表示 |
| SE-03-1 | 検索上限(5回/日)を超えた検索 | LimitException("本日の検索上限に達しました") | 上限メッセージと代替提案 |
| SE-04-1 | 無効なクエリパラメータ | ValidationException("検索クエリが無効です") | 入力フォームのエラー表示 |

## 2. AIチャット機能テストパラメーター

### 2.1 チャットセッション管理パラメーター詳細

| テストID | パラメーター | 値 | 期待される結果 |
|----------|--------------|-----|----------------|
| C-01-1 | title | "目醒めについて" | 正しいタイトルを持つ新しいセッションオブジェクト |
| C-01-2 | - | - | レスポンスには有効なUUID形式のidが含まれる |
| C-01-3 | - | - | レスポンスにはcreatedAtタイムスタンプが含まれる |
| C-02-1 | - | - | ユーザーの全セッションの配列 |
| C-02-2 | - | - | 各セッションには最終メッセージとメッセージ数が含まれる |
| C-03-1 | sessionId | 有効なUUID | {success: true}のレスポンス |
| C-03-2 | - | - | セッションとそのメッセージがDBから削除される |
| C-04-1 | sessionId | 有効なUUID | 更新されたセッションオブジェクト |
| C-04-2 | title | "目醒めと瞑想" | 更新されたタイトルを持つセッション |
| C-05-1 | オフライン状態 | - | ローカルストレージからのセッションデータ |
| C-05-2 | - | - | ネットワークエラーなしでUIが表示される |

### 2.2 チャットメッセージ管理パラメーター詳細

| テストID | パラメーター | 値 | 期待される結果 |
|----------|--------------|-----|----------------|
| CM-01-1 | sessionId | 有効なUUID | 成功レスポンス |
| CM-01-2 | content | "目醒めとは何ですか？" | ユーザーメッセージとAI応答の両方を含むオブジェクト |
| CM-02-1 | sessionId | 有効なUUID | セッション内のメッセージ配列 |
| CM-02-2 | limit | 50 | 最大50件のメッセージ |
| CM-02-3 | cursor | null | 最初のページから返される |
| CM-03-1 | sessionId | 有効なUUID | 成功レスポンス |
| CM-03-2 | content | 1000文字以上のテキスト | 切り捨てなしで全文が保存・表示される |
| CM-04-1 | オフライン状態 | - | ローカルストレージからのメッセージデータ |
| CM-05-1 | content | HTML/特殊文字を含むテキスト | エスケープされて安全に表示されるメッセージ |

### 2.3 AIレスポンステストパラメーター詳細

| テストID | 入力パラメーター | 値 | 期待される結果 |
|----------|-----------------|-----|----------------|
| AR-01-1 | メッセージ内容 | "目醒めとは何ですか？" | 目醒めの概念を説明するAI応答 |
| AR-02-1 | 前メッセージ | "目醒めとは何ですか？" | 前のコンテキストを理解しているAI応答 |
| AR-02-2 | メッセージ内容 | "それを深めるにはどうすればいいですか？" | 目醒めを深める方法についての具体的なアドバイス |
| AR-03-1 | AIサービス障害 | - | エラーメッセージと再試行オプション |
| AR-04-1 | メッセージ送信 | - | タイピングインジケーターが表示される |
| AR-04-2 | - | - | 応答受信時にインジケーターが消える |
| AR-05-1 | メッセージ内容 | 不適切な内容 | コンテンツポリシーに関する適切な応答 |

## 3. 検索履歴機能テストパラメーター

### 3.1 検索履歴管理パラメーター詳細

| テストID | パラメーター | 値 | 期待される結果 |
|----------|--------------|-----|----------------|
| SH-01-1 | query | "新しい検索クエリ" | 検索履歴DBに新しいレコードが追加される |
| SH-01-2 | - | - | 履歴にはタイムスタンプと検索タイプが含まれる |
| SH-02-1 | limit | 10 | 最新10件の検索履歴レコード |
| SH-02-2 | - | - | 履歴は新しい順にソートされている |
| SH-03-1 | historyId | 有効なUUID | {success: true}のレスポンス |
| SH-03-2 | - | - | 指定されたIDの履歴のみが削除される |
| SH-04-1 | - | - | {success: true, deletedCount: X}のレスポンス |
| SH-04-2 | - | - | すべての履歴レコードが削除される |
| SH-05-1 | 101件目の履歴追加 | - | 最も古い履歴が自動的に削除される |
| SH-05-2 | - | - | 履歴の総数は100件を超えない |

## 4. 検索結果の詳細期待値

### 4.1 検索結果オブジェクト期待構造

```json
{
  "results": [
    {
      "type": "user",
      "id": "uuid-string",
      "displayName": "ユーザー名",
      "handle": "@username",
      "profileImageUrl": "https://example.com/image.jpg",
      "profileText": "プロフィールテキスト",
      "isFollowing": true,
      "followType": "family"
    },
    {
      "type": "post",
      "id": "uuid-string",
      "contentType": "text",
      "textContent": "投稿テキスト内容...",
      "mediaUrl": "https://example.com/media.jpg",
      "createdAt": "2023-01-01T12:00:00Z",
      "user": {
        "id": "uuid-string",
        "displayName": "投稿者名",
        "profileImageUrl": "https://example.com/user.jpg"
      }
    }
  ],
  "nextCursor": "cursor-string",
  "totalCount": 42
}
```

### 4.2 検索サジェスト期待構造

```json
{
  "suggestions": [
    {
      "query": "目醒め",
      "type": "popular",
      "count": 1245
    },
    {
      "query": "目醒め 効果",
      "type": "completion",
      "count": 532
    },
    {
      "query": "目醒め イベント",
      "type": "trending",
      "count": 327
    }
  ]
}
```

## 5. AIチャット応答の詳細期待値

### 5.1 チャットセッション作成応答期待構造

```json
{
  "id": "uuid-string",
  "title": "目醒めについて",
  "createdAt": "2023-01-01T12:00:00Z",
  "firstMessage": {
    "id": "uuid-string",
    "role": "user",
    "content": "目醒めについて教えてください",
    "createdAt": "2023-01-01T12:00:00Z"
  },
  "botResponse": {
    "id": "uuid-string",
    "role": "assistant",
    "content": "目醒めとは、自分自身の内なる気づきや意識の変容を...",
    "createdAt": "2023-01-01T12:00:01Z"
  }
}
```

### 5.2 チャットメッセージ送信応答期待構造

```json
{
  "userMessage": {
    "id": "uuid-string",
    "role": "user",
    "content": "目醒めを深めるためには何をすればいいですか？",
    "createdAt": "2023-01-01T12:05:00Z"
  },
  "botResponse": {
    "id": "uuid-string",
    "role": "assistant",
    "content": "目醒めを深めるためには以下のような実践が役立ちます...",
    "createdAt": "2023-01-01T12:05:02Z"
  }
}
```

## 6. 異常系テストの期待エラーレスポンス

### 6.1 検索機能エラーレスポンス

#### 6.1.1 ネットワークエラー

```json
{
  "error": {
    "code": "network_error",
    "message": "ネットワーク接続エラーが発生しました",
    "details": "インターネット接続を確認して再試行してください"
  }
}
```

#### 6.1.2 検索上限エラー

```json
{
  "error": {
    "code": "search_limit_exceeded",
    "message": "本日の検索上限に達しました",
    "details": "1日あたり5回までの検索が可能です。明日またご利用ください",
    "limitResetTime": "2023-01-02T00:00:00Z"
  }
}
```

### 6.2 AIチャット機能エラーレスポンス

#### 6.2.1 AIサービスエラー

```json
{
  "error": {
    "code": "ai_service_error",
    "message": "AIサービスが一時的に利用できません",
    "details": "しばらく経ってから再試行してください",
    "retryAfter": 300
  }
}
```

#### 6.2.2 無効なセッションエラー

```json
{
  "error": {
    "code": "invalid_session",
    "message": "指定されたセッションが見つかりません",
    "details": "セッションが削除されたか、アクセス権がありません"
  }
}
```

## 7. モック応答データセット

テスト実施時に使用する標準的なモックデータを以下に定義します。これらのデータセットはテスト環境のセットアップに使用されます。

### 7.1 検索結果モックデータ

```json
{
  "results": [
    {
      "type": "user",
      "id": "user-uuid-1",
      "displayName": "田中太郎",
      "handle": "@tanaka",
      "profileImageUrl": "https://example.com/tanaka.jpg",
      "profileText": "目醒めと瞑想を実践中",
      "isFollowing": true,
      "followType": "family"
    },
    {
      "type": "user",
      "id": "user-uuid-2",
      "displayName": "鈴木目醒",
      "handle": "@suzuki",
      "profileImageUrl": "https://example.com/suzuki.jpg",
      "profileText": "自己探求の旅",
      "isFollowing": false,
      "followType": null
    },
    {
      "type": "post",
      "id": "post-uuid-1",
      "contentType": "text",
      "textContent": "今日は目醒めのワークショップに参加してきました。素晴らしい体験でした。",
      "mediaUrl": null,
      "createdAt": "2023-01-15T09:30:00Z",
      "user": {
        "id": "user-uuid-3",
        "displayName": "山田花子",
        "profileImageUrl": "https://example.com/yamada.jpg"
      }
    },
    {
      "type": "post",
      "id": "post-uuid-2",
      "contentType": "image",
      "textContent": "目醒めの瞬間を写真に収めました。この感覚を忘れないように。",
      "mediaUrl": "https://example.com/awakening.jpg",
      "createdAt": "2023-01-10T18:45:00Z",
      "user": {
        "id": "user-uuid-4",
        "displayName": "佐藤健",
        "profileImageUrl": "https://example.com/sato.jpg"
      }
    }
  ],
  "nextCursor": "next-page-cursor",
  "totalCount": 42
}
```

### 7.2 チャットセッションモックデータ

```json
[
  {
    "id": "session-uuid-1",
    "title": "目醒めについて",
    "lastMessage": "目醒めとは、自分自身の内なる気づきや意識の変容を...",
    "messageCount": 12,
    "createdAt": "2023-01-01T12:00:00Z",
    "updatedAt": "2023-01-02T15:30:00Z"
  },
  {
    "id": "session-uuid-2",
    "title": "瞑想の効果",
    "lastMessage": "瞑想の主な効果としては、ストレス軽減、集中力向上、自己理解の深化などが...",
    "messageCount": 8,
    "createdAt": "2023-01-05T09:15:00Z",
    "updatedAt": "2023-01-06T14:20:00Z"
  }
]
```

### 7.3 チャットメッセージモックデータ

```json
[
  {
    "id": "message-uuid-1",
    "role": "user",
    "content": "目醒めについて教えてください",
    "createdAt": "2023-01-01T12:00:00Z"
  },
  {
    "id": "message-uuid-2",
    "role": "assistant",
    "content": "目醒めとは、自分自身の内なる気づきや意識の変容を意味します。これは単なる物理的な目覚めとは異なり、精神的・感情的・霊的なレベルでの「気づき」を表します。\n\n目醒めのプロセスでは、自己の本質や人生の意味、周囲との関係性などについての深い理解が生まれることがあります。このプロセスは突然起こることもあれば、長い時間をかけて徐々に進行することもあります。\n\n目醒めの状態に至ると、以下のような変化を経験する方が多いです：\n\n1. 現在の瞬間への意識の高まり\n2. 自己と他者への共感の深化\n3. 判断や批判から解放された観察力\n4. 内なる平和と調和の感覚\n5. 恐れや執着からの自由\n\nご質問があれば、さらに詳しくお答えします。",
    "createdAt": "2023-01-01T12:00:05Z"
  },
  {
    "id": "message-uuid-3",
    "role": "user",
    "content": "目醒めを深めるためには何をすればいいですか？",
    "createdAt": "2023-01-01T12:05:00Z"
  },
  {
    "id": "message-uuid-4",
    "role": "assistant",
    "content": "目醒めを深めるためには、以下のような実践が役立ちます：\n\n1. **瞑想の習慣化**：\n   - 毎日10〜20分の静かな瞑想時間を設ける\n   - 呼吸に意識を向け、思考を観察する\n   - マインドフルネス瞑想や慈悲の瞑想などを試してみる\n\n2. **自己探求**：\n   - 日記を書いて自己の思考や感情を探求する\n   - 「私は誰か」という問いと共に過ごす\n   - 自己理解を深める書籍や教えに触れる\n\n3. **意識的な生活**：\n   - 日常の行動に意識を向ける（食事、歩行、会話など）\n   - 自動的な反応パターンに気づき、意識的な選択をする\n   - 自然との触れ合いの時間を増やす\n\n4. **コミュニティとの繋がり**：\n   - 同じ志を持つ人々との交流\n   - 気づきを深めるワークショップやリトリートへの参加\n   - 教師やメンターからの学び\n\n5. **体の実践**：\n   - ヨガや太極拳などの意識的な身体活動\n   - 呼吸法の実践\n   - 身体感覚への意識的な注意\n\n6. **奉仕と慈悲**：\n   - 他者への無条件の奉仕\n   - 慈悲の実践と思いやりの育成\n   - 感謝の気持ちを育む\n\n7. **情報摂取の意識化**：\n   - メディア消費を減らす\n   - 質の高い情報源を選ぶ\n   - 静寂の時間を大切にする\n\n重要なのは、これらを「達成すべき目標」ではなく、継続的なプロセスとして捉えることです。目醒めは目指すゴールではなく、日々の生活の中で深めていく意識の在り方です。\n\n何か特定の実践について詳しく知りたい点はありますか？",
    "createdAt": "2023-01-01T12:05:10Z"
  }
]
```

## 8. 環境依存値

以下は環境によって変化する可能性のある値です。テスト実行時にはこれらの値を適切に設定してください。

### 8.1 API エンドポイント

| 環境 | ベースURL |
|------|-----------|
| 開発環境 | https://dev-api.kanushi.app/v1 |
| テスト環境 | https://test-api.kanushi.app/v1 |
| 本番環境 | https://api.kanushi.app/v1 |

### 8.2 認証トークン

テスト実行時には以下のテストユーザートークンを使用します：

| ユーザータイプ | テストトークン |
|----------------|----------------|
| 通常ユーザー | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItdXVpZCIsIm5hbWUiOiJUZXN0IFVzZXIiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c |
| 検索制限ユーザー | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJsaW1pdGVkLXVzZXItdXVpZCIsIm5hbWUiOiJMaW1pdGVkIFVzZXIiLCJpYXQiOjE1MTYyMzkwMjJ9.qSyL-FeqHdCEFusiSJ6yHDUEBtAkvCHG4xoKYBKJUAB |

### 8.3 モックサーバー設定

モックサーバーはポート 3001 で実行し、以下の遅延設定を使用します：

| エンドポイント | 応答遅延 (ms) |
|----------------|---------------|
| /search | 300 |
| /search/suggestions | 100 |
| /chat/sessions | 500 |
| /chat/sessions/:id/messages | 2000 |

## 9. テストデータセットアップ・クリーンアップ手順

### 9.1 セットアップ手順

```dart
Future<void> setUpTestData() async {
  // テストユーザーの作成
  await testDatabase.createUser(TestUsers.normalUser);
  await testDatabase.createUser(TestUsers.limitedUser);
  
  // テスト検索履歴の挿入
  for (var history in TestData.searchHistories) {
    await testDatabase.insertSearchHistory(history);
  }
  
  // テストチャットセッションの挿入
  for (var session in TestData.chatSessions) {
    await testDatabase.insertChatSession(session);
    
    // セッションごとのメッセージ挿入
    for (var message in TestData.chatMessages.where((m) => m.sessionId == session.id)) {
      await testDatabase.insertChatMessage(message);
    }
  }
  
  // モックサーバーの起動
  mockServer = await startMockServer(port: 3001);
}
```

### 9.2 クリーンアップ手順

```dart
Future<void> cleanUpTestData() async {
  // テストデータベースのクリーンアップ
  await testDatabase.clearAllTestData();
  
  // モックサーバーの停止
  await mockServer.stop();
  
  // ローカルストレージのクリア
  await testStorageManager.clearAll();
}
```