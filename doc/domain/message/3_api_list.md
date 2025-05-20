# ダイレクトメッセージ機能のAPI一覧

このドキュメントでは、ダイレクトメッセージ機能に必要なAPIエンドポイントを詳細に記述します。各APIエンドポイントは、リクエストパラメータ、レスポンス形式、およびステータスコードを含みます。

## 基本情報

- ベースURL: `/api/messages`
- 認証: すべてのエンドポイントはJWTトークンによる認証が必要
- レスポンス形式: 標準的なAPIレスポンス形式（成功/エラー）

```json
// 成功レスポンス
{
  "success": true,
  "data": {
    // データ
  },
  "meta": {
    // メタデータ
  }
}

// エラーレスポンス
{
  "success": false,
  "error": {
    "message": "エラーメッセージ",
    "code": "ERROR_CODE",
    "details": {
      // 詳細情報
    }
  }
}
```

## 1. 会話（Conversation）API

### 1.1 会話一覧の取得

```
GET /api/messages/conversations
```

**クエリパラメータ:**
- `limit` (オプション): 取得する会話の最大数（デフォルト: 20）
- `offset` (オプション): ページネーションのためのオフセット（デフォルト: 0）
- `status` (オプション): フィルタリングするステータス（"active", "archived", "all"、デフォルト: "active"）

**レスポンス:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "グループ名またはユーザー名",
      "type": "DIRECT | GROUP",
      "status": "ACTIVE | ARCHIVED",
      "lastMessage": {
        "id": "uuid",
        "senderId": "uuid",
        "senderName": "名前",
        "content": "最後のメッセージ内容",
        "createdAt": "ISO8601日時",
        "hasMedia": true|false
      },
      "participants": [
        {
          "id": "uuid",
          "username": "ユーザー名",
          "displayName": "表示名",
          "profileImage": "URL",
          "awakeningLevel": 3
        }
      ],
      "unreadCount": 5,
      "createdAt": "ISO8601日時",
      "updatedAt": "ISO8601日時",
      "lastMessageAt": "ISO8601日時"
    }
  ],
  "meta": {
    "pagination": {
      "total": 100,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### 1.2 会話詳細の取得

```
GET /api/messages/conversations/:conversationId
```

**パスパラメータ:**
- `conversationId`: 会話のUUID

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "グループ名またはユーザー名",
    "type": "DIRECT | GROUP",
    "status": "ACTIVE | ARCHIVED",
    "participants": [
      {
        "id": "uuid",
        "username": "ユーザー名",
        "displayName": "表示名",
        "profileImage": "URL",
        "awakeningLevel": 3,
        "role": "OWNER | ADMIN | MEMBER",
        "joinedAt": "ISO8601日時"
      }
    ],
    "createdAt": "ISO8601日時",
    "updatedAt": "ISO8601日時",
    "lastMessageAt": "ISO8601日時"
  }
}
```

### 1.3 新規会話の作成

```
POST /api/messages/conversations
```

**リクエストボディ:**
```json
{
  "type": "DIRECT | GROUP",
  "title": "グループ名（グループの場合）",
  "participantIds": ["uuid", "uuid"]
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "グループ名またはユーザー名",
    "type": "DIRECT | GROUP",
    "participants": [
      {
        "id": "uuid",
        "username": "ユーザー名",
        "displayName": "表示名",
        "profileImage": "URL",
        "awakeningLevel": 3,
        "role": "OWNER | ADMIN | MEMBER",
        "joinedAt": "ISO8601日時"
      }
    ],
    "createdAt": "ISO8601日時"
  }
}
```

### 1.4 会話のアーカイブ/アクティブ化

```
PATCH /api/messages/conversations/:conversationId/status
```

**パスパラメータ:**
- `conversationId`: 会話のUUID

**リクエストボディ:**
```json
{
  "status": "ACTIVE | ARCHIVED"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "ACTIVE | ARCHIVED",
    "updatedAt": "ISO8601日時"
  }
}
```

### 1.5 会話の削除

```
DELETE /api/messages/conversations/:conversationId
```

**パスパラメータ:**
- `conversationId`: 会話のUUID

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "deletedAt": "ISO8601日時"
  }
}
```

## 2. メッセージ（Message）API

### 2.1 メッセージ一覧の取得

```
GET /api/messages/conversations/:conversationId/messages
```

**パスパラメータ:**
- `conversationId`: 会話のUUID

**クエリパラメータ:**
- `limit` (オプション): 取得するメッセージの最大数（デフォルト: 50）
- `before` (オプション): この日時より前のメッセージを取得（ISO8601形式）
- `after` (オプション): この日時より後のメッセージを取得（ISO8601形式）

**レスポンス:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "conversationId": "uuid",
      "senderId": "uuid",
      "sender": {
        "id": "uuid",
        "username": "ユーザー名",
        "displayName": "表示名",
        "profileImage": "URL",
        "awakeningLevel": 3
      },
      "content": "メッセージ内容",
      "quotedMessageId": "uuid", // 引用メッセージがある場合
      "quotedMessage": {
        "id": "uuid",
        "content": "引用メッセージ内容",
        "senderId": "uuid",
        "senderName": "引用元送信者名"
      },
      "mediaAttachments": [
        {
          "id": "uuid",
          "type": "IMAGE | VIDEO | AUDIO | FILE",
          "url": "URL",
          "thumbnailUrl": "URL",
          "size": 12345,
          "metadata": {
            "width": 800,
            "height": 600,
            "duration": 120,
            "filename": "file.jpg"
          }
        }
      ],
      "reactions": [
        {
          "reactionType": "LIKE | LOVE | LAUGH | SAD | ANGRY | WOW",
          "count": 3,
          "userIds": ["uuid", "uuid", "uuid"]
        }
      ],
      "status": "SENDING | SENT | DELIVERED | READ | FAILED",
      "readBy": [
        {
          "userId": "uuid",
          "readAt": "ISO8601日時"
        }
      ],
      "isEdited": true|false,
      "createdAt": "ISO8601日時",
      "updatedAt": "ISO8601日時"
    }
  ],
  "meta": {
    "pagination": {
      "hasMore": true,
      "oldestMessageId": "uuid",
      "newestMessageId": "uuid"
    }
  }
}
```

### 2.2 メッセージの送信

```
POST /api/messages/conversations/:conversationId/messages
```

**パスパラメータ:**
- `conversationId`: 会話のUUID

**リクエストボディ:**
```json
{
  "content": "メッセージ内容",
  "quotedMessageId": "uuid", // オプション
  "mediaAttachmentIds": ["uuid", "uuid"] // オプション（先にアップロードしたメディアのID）
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "conversationId": "uuid",
    "senderId": "uuid",
    "content": "メッセージ内容",
    "quotedMessageId": "uuid",
    "mediaAttachments": [
      {
        "id": "uuid",
        "type": "IMAGE | VIDEO | AUDIO | FILE",
        "url": "URL",
        "thumbnailUrl": "URL"
      }
    ],
    "status": "SENT",
    "createdAt": "ISO8601日時"
  }
}
```

### 2.3 メッセージの編集

```
PATCH /api/messages/conversations/:conversationId/messages/:messageId
```

**パスパラメータ:**
- `conversationId`: 会話のUUID
- `messageId`: メッセージのUUID

**リクエストボディ:**
```json
{
  "content": "更新されたメッセージ内容"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "更新されたメッセージ内容",
    "isEdited": true,
    "updatedAt": "ISO8601日時"
  }
}
```

### 2.4 メッセージの削除

```
DELETE /api/messages/conversations/:conversationId/messages/:messageId
```

**パスパラメータ:**
- `conversationId`: 会話のUUID
- `messageId`: メッセージのUUID

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isDeleted": true,
    "deletedAt": "ISO8601日時"
  }
}
```

### 2.5 メッセージの既読状態の更新

```
POST /api/messages/conversations/:conversationId/read
```

**パスパラメータ:**
- `conversationId`: 会話のUUID

**リクエストボディ:**
```json
{
  "messageId": "uuid" // どのメッセージまでを既読にするか
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid",
    "messageId": "uuid",
    "readAt": "ISO8601日時"
  }
}
```

### 2.6 メッセージへのリアクション追加

```
POST /api/messages/conversations/:conversationId/messages/:messageId/reactions
```

**パスパラメータ:**
- `conversationId`: 会話のUUID
- `messageId`: メッセージのUUID

**リクエストボディ:**
```json
{
  "reactionType": "LIKE | LOVE | LAUGH | SAD | ANGRY | WOW"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "messageId": "uuid",
    "userId": "uuid",
    "reactionType": "LIKE | LOVE | LAUGH | SAD | ANGRY | WOW",
    "createdAt": "ISO8601日時"
  }
}
```

### 2.7 メッセージからのリアクション削除

```
DELETE /api/messages/conversations/:conversationId/messages/:messageId/reactions/:reactionType
```

**パスパラメータ:**
- `conversationId`: 会話のUUID
- `messageId`: メッセージのUUID
- `reactionType`: リアクションタイプ

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "messageId": "uuid",
    "userId": "uuid",
    "reactionType": "LIKE | LOVE | LAUGH | SAD | ANGRY | WOW",
    "deletedAt": "ISO8601日時"
  }
}
```

## 3. メディア（Media）API

### 3.1 メディアのアップロード

```
POST /api/messages/media
```

**リクエストボディ:**
- `multipart/form-data` 形式
- `file`: アップロードするファイル
- `type`: "IMAGE", "VIDEO", "AUDIO", "FILE"のいずれか

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "IMAGE | VIDEO | AUDIO | FILE",
    "url": "URL",
    "thumbnailUrl": "URL", // 画像/動画の場合
    "size": 12345,
    "metadata": {
      "width": 800, // 画像/動画の場合
      "height": 600, // 画像/動画の場合
      "duration": 120, // 音声/動画の場合
      "filename": "file.jpg"
    },
    "createdAt": "ISO8601日時"
  }
}
```

## 4. 検索（Search）API

### 4.1 メッセージ内容の検索

```
GET /api/messages/search
```

**クエリパラメータ:**
- `query`: 検索キーワード（必須）
- `conversationId` (オプション): 特定の会話内でのみ検索
- `limit` (オプション): 取得する結果の最大数（デフォルト: 20）
- `offset` (オプション): ページネーションのためのオフセット（デフォルト: 0）

**レスポンス:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "conversationId": "uuid",
      "conversation": {
        "id": "uuid",
        "title": "会話名"
      },
      "senderId": "uuid",
      "senderName": "送信者名",
      "content": "検索キーワードを含むメッセージ内容",
      "highlightedContent": "検索キーワードを<em>ハイライト</em>したメッセージ内容",
      "createdAt": "ISO8601日時"
    }
  ],
  "meta": {
    "pagination": {
      "total": 100,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

## 5. 参加者（Participant）API（グループ会話用、フェーズ2）

### 5.1 グループ会話への参加者追加

```
POST /api/messages/conversations/:conversationId/participants
```

**パスパラメータ:**
- `conversationId`: 会話のUUID

**リクエストボディ:**
```json
{
  "userIds": ["uuid", "uuid"]
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid",
    "addedParticipants": [
      {
        "id": "uuid",
        "username": "ユーザー名",
        "displayName": "表示名",
        "role": "MEMBER",
        "joinedAt": "ISO8601日時"
      }
    ]
  }
}
```

### 5.2 グループ会話からの参加者削除

```
DELETE /api/messages/conversations/:conversationId/participants/:userId
```

**パスパラメータ:**
- `conversationId`: 会話のUUID
- `userId`: 削除するユーザーのUUID

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid",
    "userId": "uuid",
    "removedAt": "ISO8601日時"
  }
}
```

### 5.3 グループ会話の参加者の役割変更

```
PATCH /api/messages/conversations/:conversationId/participants/:userId/role
```

**パスパラメータ:**
- `conversationId`: 会話のUUID
- `userId`: 役割を変更するユーザーのUUID

**リクエストボディ:**
```json
{
  "role": "ADMIN | MEMBER"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid",
    "userId": "uuid",
    "role": "ADMIN | MEMBER",
    "updatedAt": "ISO8601日時"
  }
}
```

## 6. 通知設定（Notification Settings）API

### 6.1 会話の通知設定の取得

```
GET /api/messages/conversations/:conversationId/notification-settings
```

**パスパラメータ:**
- `conversationId`: 会話のUUID

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid",
    "muted": false,
    "mutedUntil": "ISO8601日時", // 一時的にミュートされている場合
    "notifyOnMention": true,
    "notifyOnAll": true
  }
}
```

### 6.2 会話の通知設定の更新

```
PATCH /api/messages/conversations/:conversationId/notification-settings
```

**パスパラメータ:**
- `conversationId`: 会話のUUID

**リクエストボディ:**
```json
{
  "muted": true,
  "mutedUntil": "ISO8601日時", // オプション、指定しない場合は恒久的にミュート
  "notifyOnMention": true,
  "notifyOnAll": false
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid",
    "muted": true,
    "mutedUntil": "ISO8601日時",
    "notifyOnMention": true,
    "notifyOnAll": false,
    "updatedAt": "ISO8601日時"
  }
}
```

## 7. エラーコード

| コード | 説明 |
|--------|------|
| `CONVERSATION_NOT_FOUND` | 指定されたIDの会話が見つかりません |
| `MESSAGE_NOT_FOUND` | 指定されたIDのメッセージが見つかりません |
| `INVALID_CONVERSATION_TYPE` | 無効な会話タイプが指定されました |
| `INVALID_PARTICIPANT_IDS` | 無効な参加者IDが指定されました |
| `INSUFFICIENT_PERMISSIONS` | 操作を実行する権限がありません |
| `MESSAGE_EDIT_TIMEOUT` | メッセージ編集のタイムアウトが過ぎました（編集期限は送信から24時間） |
| `INVALID_MEDIA_TYPE` | 無効なメディアタイプが指定されました |
| `MEDIA_UPLOAD_FAILED` | メディアのアップロードに失敗しました |
| `INVALID_REACTION_TYPE` | 無効なリアクションタイプが指定されました |
| `DUPLICATE_REACTION` | 同じメッセージに同じリアクションを追加しようとしました |
| `REACTION_NOT_FOUND` | 指定されたリアクションが見つかりません |
| `USER_BLOCKED` | ブロックされたユーザーとの通信はできません |
| `RATE_LIMIT_EXCEEDED` | リクエスト数が制限を超えました。しばらく待ってから再試行してください |

## 8. Websocketイベント

ダイレクトメッセージ機能はSupabaseのリアルタイムデータベースを使用しています。
以下のイベントが発生した際に、クライアントにリアルタイムに通知されます：

| イベント名 | 説明 | データ |
|------------|------|------|
| `message:new` | 新しいメッセージが送信されました | メッセージオブジェクト |
| `message:update` | メッセージが更新されました | 更新されたメッセージオブジェクト |
| `message:delete` | メッセージが削除されました | 削除されたメッセージのID |
| `message:read` | メッセージが既読になりました | メッセージID、ユーザーID、既読日時 |
| `reaction:add` | リアクションが追加されました | メッセージID、ユーザーID、リアクションタイプ |
| `reaction:remove` | リアクションが削除されました | メッセージID、ユーザーID、リアクションタイプ |
| `conversation:new` | 新しい会話が作成されました | 会話オブジェクト |
| `conversation:update` | 会話が更新されました | 更新された会話オブジェクト |
| `conversation:delete` | 会話が削除されました | 削除された会話のID |
| `participant:add` | 参加者が追加されました | 会話ID、追加された参加者リスト |
| `participant:remove` | 参加者が削除されました | 会話ID、削除された参加者ID |
| `participant:update` | 参加者の役割が更新されました | 会話ID、ユーザーID、更新された役割 |