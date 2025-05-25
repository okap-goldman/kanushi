# 検索・AIドメインAPI一覧

## 検索関連API

### GET /search
コンテンツ検索を実行します。

**クエリパラメータ**
- `q`: 検索クエリ（必須）
- `type`: 検索対象タイプ（user | post | all、デフォルトはall）
- `limit`: 取得数の上限（デフォルト20、最大100）
- `cursor`: ページネーション用カーソル
- `filters`: 追加フィルター（任意）

**レスポンス**
```json
{
  "results": [
    {
      "type": "user",
      "id": "uuid",
      "displayName": "田中太郎",
      "handle": "@tanaka",
      "profileImageUrl": "string",
      "profileText": "string",
      "isFollowing": true,
      "followType": "family"
    },
    {
      "type": "post",
      "id": "uuid",
      "contentType": "text",
      "textContent": "検索にヒットしたテキスト部分...",
      "mediaUrl": "string",
      "createdAt": "datetime",
      "user": {
        "id": "uuid",
        "displayName": "山田花子",
        "profileImageUrl": "string"
      }
    }
  ],
  "nextCursor": "string",
  "totalCount": 42
}
```

### GET /search/suggestions
検索サジェストを取得します。

**クエリパラメータ**
- `q`: 検索クエリ（必須）
- `limit`: サジェスト数の上限（デフォルト5、最大10）

**レスポンス**
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

### GET /search/history
検索履歴を取得します。

**クエリパラメータ**
- `limit`: 取得数の上限（デフォルト10、最大50）
- `cursor`: ページネーション用カーソル

**レスポンス**
```json
{
  "history": [
    {
      "id": "uuid",
      "query": "目醒め 効果",
      "searchedAt": "datetime",
      "resultsCount": 42
    },
    {
      "id": "uuid",
      "query": "瞑想",
      "searchedAt": "datetime",
      "resultsCount": 156
    }
  ],
  "nextCursor": "string"
}
```

### DELETE /search/history/:id
指定された検索履歴を削除します。

**レスポンス**
```json
{
  "success": true
}
```

### DELETE /search/history
すべての検索履歴を削除します。

**レスポンス**
```json
{
  "success": true,
  "deletedCount": 25
}
```

## AIチャット関連API

### GET /chat/sessions
チャットセッション一覧を取得します。

**クエリパラメータ**
- `limit`: 取得数の上限（デフォルト10、最大50）
- `cursor`: ページネーション用カーソル

**レスポンス**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "title": "瞑想について",
      "lastMessage": "瞑想には様々な効果があります...",
      "messageCount": 12,
      "createdAt": "datetime",
      "updatedAt": "datetime"
    },
    {
      "id": "uuid",
      "title": "目醒めとは",
      "lastMessage": "目醒めとは、内なる意識の変化を...",
      "messageCount": 8,
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  ],
  "nextCursor": "string"
}
```

### POST /chat/sessions
新規チャットセッションを作成します。

**リクエスト**
```json
{
  "initialMessage": "目醒めについて教えてください"
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "title": "目醒めについて",
  "createdAt": "datetime",
  "firstMessage": {
    "id": "uuid",
    "role": "user",
    "content": "目醒めについて教えてください",
    "createdAt": "datetime"
  },
  "botResponse": {
    "id": "uuid",
    "role": "assistant",
    "content": "目醒めとは、自分自身の内なる気づきや意識の変容を...",
    "createdAt": "datetime"
  }
}
```

### DELETE /chat/sessions/:id
チャットセッションを削除します。

**レスポンス**
```json
{
  "success": true
}
```

### GET /chat/sessions/:id/messages
チャットメッセージ一覧を取得します。

**クエリパラメータ**
- `limit`: 取得数の上限（デフォルト50、最大100）
- `cursor`: ページネーション用カーソル

**レスポンス**
```json
{
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "目醒めについて教えてください",
      "createdAt": "datetime"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "目醒めとは、自分自身の内なる気づきや意識の変容を...",
      "createdAt": "datetime"
    }
  ],
  "nextCursor": "string"
}
```

### POST /chat/sessions/:id/messages
チャットメッセージを送信します。

**リクエスト**
```json
{
  "content": "目醒めを深めるためには何をすればいいですか？"
}
```

**レスポンス**
```json
{
  "userMessage": {
    "id": "uuid",
    "role": "user",
    "content": "目醒めを深めるためには何をすればいいですか？",
    "createdAt": "datetime"
  },
  "botResponse": {
    "id": "uuid",
    "role": "assistant",
    "content": "目醒めを深めるためには以下のような実践が役立ちます...",
    "createdAt": "datetime"
  }
}
```

### PUT /chat/sessions/:id/title
チャットセッションのタイトルを更新します。

**リクエスト**
```json
{
  "title": "目醒めと瞑想について"
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "title": "目醒めと瞑想について",
  "updatedAt": "datetime"
}
```

## 検索トレンドAPI

### GET /search/trends
検索トレンドを取得します。

**クエリパラメータ**
- `period`: 期間（day | week | month、デフォルトはday）
- `limit`: 取得数の上限（デフォルト10、最大20）

**レスポンス**
```json
{
  "trends": [
    {
      "query": "目醒め",
      "rank": 1,
      "searchCount": 1245,
      "changePercent": 15
    },
    {
      "query": "瞑想",
      "rank": 2,
      "searchCount": 987,
      "changePercent": -5
    },
    {
      "query": "自己探求",
      "rank": 3,
      "searchCount": 876,
      "changePercent": 30
    }
  ]
}
```