# 設定ドメインAPI一覧

## 全般設定API

### GET /settings
ユーザーの全設定情報を取得します。

**レスポンス**
```json
{
  "notification": {
    "commentEnabled": true,
    "highlightEnabled": true,
    "followEnabled": true,
    "eventEnabled": false,
    "aiAnalysisEnabled": false,
    "quietHours": {
      "enabled": true,
      "start": "22:00",
      "end": "07:00"
    }
  },
  "account": {
    "language": "ja",
    "theme": "system",
    "autoPlayMedia": true,
    "dataUsage": "medium"
  },
  "privacy": {
    "locationSharing": false,
    "contentVisibility": "public",
    "activityStatus": true,
    "dataCollection": true
  },
  "display": {
    "fontSize": "medium",
    "contentDensity": "standard",
    "reduceMotion": false,
    "highContrast": false
  }
}
```

## 通知設定API

### GET /settings/notifications
ユーザーの通知設定を取得します。

**レスポンス**
```json
{
  "commentEnabled": true,
  "highlightEnabled": true,
  "followEnabled": true,
  "eventEnabled": false,
  "aiAnalysisEnabled": false,
  "quietHours": {
    "enabled": true,
    "start": "22:00",
    "end": "07:00"
  }
}
```

### PATCH /settings/notifications
通知設定を更新します。

**リクエスト**
```json
{
  "commentEnabled": true,
  "highlightEnabled": false,
  "followEnabled": true,
  "eventEnabled": true,
  "aiAnalysisEnabled": false,
  "quietHours": {
    "enabled": true,
    "start": "23:00",
    "end": "06:00"
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

## アカウント設定API

### GET /settings/account
アカウント設定を取得します。

**レスポンス**
```json
{
  "language": "ja",
  "theme": "system",
  "autoPlayMedia": true,
  "dataUsage": "medium"
}
```

### PATCH /settings/account
アカウント設定を更新します。

**リクエスト**
```json
{
  "language": "en",
  "theme": "dark",
  "autoPlayMedia": false,
  "dataUsage": "low"
}
```

**レスポンス**
```json
{
  "success": true,
  "updatedAt": "datetime"
}
```

### DELETE /account
アカウントを削除します。

**リクエスト**
```json
{
  "reason": "別のアカウントに移行するため",
  "confirmedCode": "DELETE123"
}
```

**レスポンス**
```json
{
  "success": true,
  "deletedAt": "datetime"
}
```

## プライバシー設定API

### GET /settings/privacy
プライバシー設定を取得します。

**レスポンス**
```json
{
  "locationSharing": false,
  "contentVisibility": "public",
  "activityStatus": true,
  "dataCollection": true
}
```

### PATCH /settings/privacy
プライバシー設定を更新します。

**リクエスト**
```json
{
  "locationSharing": true,
  "contentVisibility": "family",
  "activityStatus": false,
  "dataCollection": true
}
```

**レスポンス**
```json
{
  "success": true,
  "updatedAt": "datetime"
}
```

## 表示設定API

### GET /settings/display
表示設定を取得します。

**レスポンス**
```json
{
  "fontSize": "medium",
  "contentDensity": "standard",
  "reduceMotion": false,
  "highContrast": false
}
```

### PATCH /settings/display
表示設定を更新します。

**リクエスト**
```json
{
  "fontSize": "large",
  "contentDensity": "comfortable",
  "reduceMotion": true,
  "highContrast": false
}
```

**レスポンス**
```json
{
  "success": true,
  "updatedAt": "datetime"
}
```

## ブロックユーザー管理API

### GET /settings/blocked-users
ブロックしているユーザー一覧を取得します。

**クエリパラメータ**
- `limit`: 取得数の上限（デフォルト20、最大100）
- `cursor`: ページネーション用カーソル

**レスポンス**
```json
{
  "blockedUsers": [
    {
      "id": "uuid",
      "blockedUserId": "uuid",
      "blockedUser": {
        "id": "uuid",
        "displayName": "山田太郎",
        "profileImageUrl": "string"
      },
      "reason": "スパムメッセージの送信",
      "createdAt": "datetime"
    }
  ],
  "nextCursor": "string"
}
```

### POST /settings/blocked-users
ユーザーをブロックします。

**リクエスト**
```json
{
  "blockedUserId": "uuid",
  "reason": "不適切なコメントの投稿"
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "blockedUserId": "uuid",
  "reason": "不適切なコメントの投稿",
  "createdAt": "datetime"
}
```

### DELETE /settings/blocked-users/:id
ブロックを解除します。

**レスポンス**
```json
{
  "success": true
}
```

## ヘルプ・サポートAPI

### GET /help/faq
FAQを取得します。

**クエリパラメータ**
- `category`: カテゴリでフィルタリング（任意）
- `query`: 検索クエリ（任意）

**レスポンス**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "アカウント設定",
      "faqs": [
        {
          "id": "uuid",
          "question": "パスワードの変更方法は？",
          "answer": "アカウント設定画面から「パスワードを変更」を選択し、指示に従ってください。",
          "updatedAt": "datetime"
        }
      ]
    },
    {
      "id": "uuid",
      "name": "アプリの使い方",
      "faqs": [
        {
          "id": "uuid",
          "question": "投稿の削除方法は？",
          "answer": "投稿詳細画面右上の「...」メニューから「削除」を選択できます。",
          "updatedAt": "datetime"
        }
      ]
    }
  ]
}
```

### POST /help/contact
お問い合わせを送信します。

**リクエスト**
```json
{
  "email": "user@example.com",
  "subject": "アプリの動作が遅い",
  "message": "最近アプリの動作が遅くなっています。特にタイムライン読み込み時に顕著です。"
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "subject": "アプリの動作が遅い",
  "status": "pending",
  "createdAt": "datetime",
  "message": "お問い合わせありがとうございます。通常2営業日以内に回答いたします。"
}
```

### GET /help/terms
利用規約を取得します。

**レスポンス**
```json
{
  "title": "利用規約",
  "content": "...",
  "version": "1.2",
  "updatedAt": "datetime"
}
```

### GET /help/privacy-policy
プライバシーポリシーを取得します。

**レスポンス**
```json
{
  "title": "プライバシーポリシー",
  "content": "...",
  "version": "1.3",
  "updatedAt": "datetime"
}
```

## アプリ情報API

### GET /app/info
アプリのバージョン情報を取得します。

**レスポンス**
```json
{
  "appName": "目醒めSNS",
  "version": "1.2.3",
  "buildNumber": "123",
  "environment": "production",
  "updateAvailable": true,
  "minimumRequiredVersion": "1.0.0"
}
```