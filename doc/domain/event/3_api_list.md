# イベントドメインAPI一覧

## イベント管理API

### GET /events
イベント一覧を取得します。

**クエリパラメータ**
- `limit`: 取得数の上限（デフォルト20、最大100）
- `cursor`: ページネーション用カーソル
- `filter`: フィルター（upcoming | past | created | participating）
- `search`: 検索キーワード（任意）
- `startAfter`: 開始日時（ISO8601形式、任意）
- `startBefore`: 開始日時（ISO8601形式、任意）

**レスポンス**
```json
{
  "events": [
    {
      "id": "uuid",
      "creatorUserId": "uuid",
      "name": "瞑想ワークショップ",
      "description": "初心者向けの瞑想ワークショップです。",
      "location": "東京都渋谷区",
      "startsAt": "datetime",
      "endsAt": "datetime",
      "fee": 1000,
      "currency": "JPY",
      "participantsCount": 15,
      "interestedCount": 30,
      "isParticipating": true,
      "participationStatus": "going",
      "createdAt": "datetime",
      "creator": {
        "id": "uuid",
        "displayName": "山田太郎",
        "profileImageUrl": "string"
      }
    }
  ],
  "nextCursor": "string"
}
```

### POST /events
新規イベントを作成します。

**リクエスト**
```json
{
  "name": "瞑想ワークショップ",
  "description": "初心者向けの瞑想ワークショップです。",
  "location": "東京都渋谷区",
  "locationVisibility": "all",
  "startsAt": "datetime",
  "endsAt": "datetime",
  "fee": 1000,
  "currency": "JPY",
  "refundPolicy": "イベント3日前までの取り消しは全額返金。以降は返金不可。",
  "capacity": 30,
  "registrationEndsAt": "datetime"
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "creatorUserId": "uuid",
  "name": "瞑想ワークショップ",
  "description": "初心者向けの瞑想ワークショップです。",
  "location": "東京都渋谷区",
  "locationVisibility": "all",
  "startsAt": "datetime",
  "endsAt": "datetime",
  "fee": 1000,
  "currency": "JPY",
  "refundPolicy": "イベント3日前までの取り消しは全額返金。以降は返金不可。",
  "capacity": 30,
  "registrationEndsAt": "datetime",
  "createdAt": "datetime"
}
```

### GET /events/:id
イベント詳細を取得します。

**レスポンス**
```json
{
  "id": "uuid",
  "creatorUserId": "uuid",
  "name": "瞑想ワークショップ",
  "description": "初心者向けの瞑想ワークショップです。",
  "location": "東京都渋谷区",
  "locationVisibility": "all",
  "startsAt": "datetime",
  "endsAt": "datetime",
  "fee": 1000,
  "currency": "JPY",
  "refundPolicy": "イベント3日前までの取り消しは全額返金。以降は返金不可。",
  "capacity": 30,
  "registrationEndsAt": "datetime",
  "participantsCount": 15,
  "interestedCount": 30,
  "isParticipating": true,
  "participationStatus": "going",
  "paymentStatus": "paid",
  "createdAt": "datetime",
  "creator": {
    "id": "uuid",
    "displayName": "山田太郎",
    "profileImageUrl": "string"
  }
}
```

### PUT /events/:id
イベント情報を更新します。イベントの作成者のみ実行可能です。

**リクエスト**
```json
{
  "name": "初心者向け瞑想ワークショップ",
  "description": "瞑想を初めて体験する方向けのワークショップです。",
  "location": "東京都渋谷区道玄坂1-2-3",
  "locationVisibility": "participants",
  "startsAt": "datetime",
  "endsAt": "datetime",
  "fee": 1500,
  "currency": "JPY",
  "refundPolicy": "イベント7日前までの取り消しは全額返金。以降は返金不可。",
  "capacity": 25,
  "registrationEndsAt": "datetime"
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "name": "初心者向け瞑想ワークショップ",
  "description": "瞑想を初めて体験する方向けのワークショップです。",
  "location": "東京都渋谷区道玄坂1-2-3",
  "locationVisibility": "participants",
  "startsAt": "datetime",
  "endsAt": "datetime",
  "fee": 1500,
  "currency": "JPY",
  "refundPolicy": "イベント7日前までの取り消しは全額返金。以降は返金不可。",
  "capacity": 25,
  "registrationEndsAt": "datetime",
  "updatedAt": "datetime"
}
```

### DELETE /events/:id
イベントを削除します。イベントの作成者のみ実行可能です。

**レスポンス**
```json
{
  "success": true
}
```

## イベント参加API

### POST /events/:id/participate
イベントに参加登録します。

**リクエスト**
```json
{
  "status": "going",
  "note": "楽しみにしています！"
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "eventId": "uuid",
  "userId": "uuid",
  "status": "going",
  "note": "楽しみにしています！",
  "paymentStatus": "pending",
  "paymentUrl": "https://checkout.stripe.com/...",
  "paymentDue": "datetime",
  "joinedAt": "datetime"
}
```

### PUT /events/:id/participate
イベント参加情報を更新します。

**リクエスト**
```json
{
  "status": "interested",
  "note": "日程を確認中です"
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "eventId": "uuid",
  "userId": "uuid",
  "status": "interested",
  "note": "日程を確認中です",
  "paymentStatus": null,
  "updatedAt": "datetime"
}
```

### DELETE /events/:id/participate
イベント参加をキャンセルします。

**レスポンス**
```json
{
  "success": true,
  "refundStatus": "processing",
  "refundAmount": 1500
}
```

### GET /events/:id/participants
イベント参加者一覧を取得します。

**クエリパラメータ**
- `limit`: 取得数の上限（デフォルト20、最大100）
- `cursor`: ページネーション用カーソル
- `status`: 参加ステータスでフィルタリング（going | interested | all、デフォルトはall）

**レスポンス**
```json
{
  "participants": [
    {
      "id": "uuid",
      "status": "going",
      "joinedAt": "datetime",
      "user": {
        "id": "uuid",
        "displayName": "山田花子",
        "profileImageUrl": "string",
        "isFollowing": true,
        "followType": "family"
      }
    },
    {
      "id": "uuid",
      "status": "interested",
      "joinedAt": "datetime",
      "user": {
        "id": "uuid",
        "displayName": "田中太郎",
        "profileImageUrl": "string",
        "isFollowing": false
      }
    }
  ],
  "nextCursor": "string",
  "goingCount": 15,
  "interestedCount": 30
}
```

## 決済関連API

### GET /events/:id/payment
イベント参加費の支払い情報を取得します。

**レスポンス**
```json
{
  "eventId": "uuid",
  "fee": 1500,
  "currency": "JPY",
  "paymentStatus": "pending",
  "paymentUrl": "https://checkout.stripe.com/...",
  "paymentDue": "datetime",
  "stripePaymentId": "pi_xxxxx"
}
```

### POST /events/:id/payment
イベント参加費の支払いを開始します。

**レスポンス**
```json
{
  "paymentUrl": "https://checkout.stripe.com/...",
  "paymentDue": "datetime",
  "stripePaymentId": "pi_xxxxx"
}
```

### POST /events/:id/refund
イベント参加費の返金をリクエストします。

**リクエスト**
```json
{
  "reason": "予定が変更になりました"
}
```

**レスポンス**
```json
{
  "success": true,
  "refundStatus": "processing",
  "refundAmount": 1500,
  "estimatedCompletionDate": "datetime"
}
```

## イベント投稿API

### GET /events/:id/posts
イベントに関連する投稿一覧を取得します。

**クエリパラメータ**
- `limit`: 取得数の上限（デフォルト20、最大100）
- `cursor`: ページネーション用カーソル

**レスポンス**
```json
{
  "posts": [
    {
      "id": "uuid",
      "userId": "uuid",
      "contentType": "text",
      "textContent": "イベントに参加してきました！",
      "mediaUrl": "string",
      "createdAt": "datetime",
      "likesCount": 10,
      "commentsCount": 5,
      "highlightsCount": 2,
      "isLiked": true,
      "isHighlighted": false,
      "user": {
        "id": "uuid",
        "displayName": "山田花子",
        "profileImageUrl": "string"
      }
    }
  ],
  "nextCursor": "string"
}
```