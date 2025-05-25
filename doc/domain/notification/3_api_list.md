# 通知ドメインAPI一覧

## 通知取得API

### GET /notifications
ユーザーの通知一覧を取得します。

**クエリパラメータ**
- `limit`: 取得数の上限（デフォルト20、最大100）
- `cursor`: ページネーション用カーソル
- `read`: 既読ステータスでフィルタリング（true | false | null）

**レスポンス**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "title": "新しいコメント",
      "body": "あなたの投稿にコメントがつきました",
      "data": {
        "type": "comment",
        "postId": "uuid",
        "commentId": "uuid",
        "commenterUserId": "uuid",
        "commenterName": "山田太郎"
      },
      "read": false,
      "createdAt": "datetime"
    },
    {
      "id": "uuid",
      "title": "新しいフォロワー",
      "body": "山田花子があなたをファミリーに追加しました",
      "data": {
        "type": "follow",
        "followId": "uuid",
        "followerUserId": "uuid",
        "followerName": "山田花子",
        "followType": "family",
        "followReason": "興味深い投稿をされていたので"
      },
      "read": true,
      "createdAt": "datetime"
    }
  ],
  "unreadCount": 5,
  "nextCursor": "string"
}
```

### GET /notifications/unread-count
未読通知の数を取得します。

**レスポンス**
```json
{
  "unreadCount": 5
}
```

### PATCH /notifications/:id
指定された通知の既読状態を更新します。

**リクエスト**
```json
{
  "read": true
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "read": true,
  "updatedAt": "datetime"
}
```

### PATCH /notifications
複数の通知の既読状態を一括更新します。

**リクエスト**
```json
{
  "notificationIds": ["uuid1", "uuid2", "uuid3"],
  "read": true
}
```

**レスポンス**
```json
{
  "updatedCount": 3,
  "updatedAt": "datetime"
}
```

### PATCH /notifications/read-all
すべての通知を既読に設定します。

**レスポンス**
```json
{
  "updatedCount": 10,
  "updatedAt": "datetime"
}
```

## 通知設定API

### GET /notification-settings
通知設定を取得します。

**レスポンス**
```json
{
  "push": {
    "enabled": true,
    "quiet_hours": {
      "enabled": true,
      "start": "22:00",
      "end": "07:00"
    }
  },
  "types": {
    "comment": true,
    "highlight": true,
    "follow": {
      "family": true,
      "watch": false
    },
    "event": true,
    "message": true
  }
}
```

### PUT /notification-settings
通知設定を更新します。

**リクエスト**
```json
{
  "push": {
    "enabled": true,
    "quiet_hours": {
      "enabled": true,
      "start": "23:00",
      "end": "06:00"
    }
  },
  "types": {
    "comment": true,
    "highlight": false,
    "follow": {
      "family": true,
      "watch": false
    },
    "event": true,
    "message": true
  }
}
```

**レスポンス**
```json
{
  "success": true,
  "updatedAt": "datetime"
}
```

## デバイス登録API

### POST /notifications/devices
プッシュ通知用デバイスを登録します。

**リクエスト**
```json
{
  "deviceId": "string",
  "pushToken": "string",
  "platform": "ios",
  "model": "iPhone 13"
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "deviceId": "string",
  "createdAt": "datetime"
}
```

### DELETE /notifications/devices/:deviceId
デバイス登録を削除します。

**レスポンス**
```json
{
  "success": true
}
```