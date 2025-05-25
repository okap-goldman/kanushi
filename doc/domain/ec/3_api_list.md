# ECドメインAPI一覧

## 商品関連API

### GET /products
商品一覧を取得します。

**クエリパラメータ**
- `limit`: 取得数の上限（デフォルト20、最大100）
- `cursor`: ページネーション用カーソル
- `sellerId`: 販売者のユーザーID（任意）
- `search`: 検索キーワード（任意）
- `minPrice`: 最低価格（任意）
- `maxPrice`: 最高価格（任意）

**レスポンス**
```json
{
  "products": [
    {
      "id": "uuid",
      "title": "目醒めガイドブック",
      "description": "目醒めのプロセスを解説した初心者向けガイドブックです。",
      "price": 2500,
      "currency": "JPY",
      "imageUrl": "string",
      "stock": 10,
      "createdAt": "datetime",
      "seller": {
        "id": "uuid",
        "displayName": "山田太郎",
        "profileImageUrl": "string"
      }
    }
  ],
  "nextCursor": "string"
}
```

### POST /products
新規商品を登録します。

**リクエスト**
```json
{
  "title": "目醒めガイドブック",
  "description": "目醒めのプロセスを解説した初心者向けガイドブックです。",
  "price": 2500,
  "currency": "JPY",
  "stock": 10,
  "imageId": "uuid"  // 事前にアップロードした画像のID
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "sellerUserId": "uuid",
  "title": "目醒めガイドブック",
  "description": "目醒めのプロセスを解説した初心者向けガイドブックです。",
  "price": 2500,
  "currency": "JPY",
  "imageUrl": "string",
  "stock": 10,
  "createdAt": "datetime"
}
```

### GET /products/:id
商品詳細を取得します。

**レスポンス**
```json
{
  "id": "uuid",
  "title": "目醒めガイドブック",
  "description": "目醒めのプロセスを解説した初心者向けガイドブックです。",
  "price": 2500,
  "currency": "JPY",
  "imageUrl": "string",
  "stock": 10,
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "seller": {
    "id": "uuid",
    "displayName": "山田太郎",
    "profileImageUrl": "string",
    "isFollowing": true,
    "followType": "family"
  },
  "isOwner": false
}
```

### PUT /products/:id
商品情報を更新します。商品の販売者のみ実行可能です。

**リクエスト**
```json
{
  "title": "目醒め完全ガイドブック",
  "description": "目醒めのプロセスを詳細に解説した完全ガイドブックです。",
  "price": 3000,
  "currency": "JPY",
  "stock": 15,
  "imageId": "uuid"  // 任意、変更する場合のみ
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "title": "目醒め完全ガイドブック",
  "description": "目醒めのプロセスを詳細に解説した完全ガイドブックです。",
  "price": 3000,
  "currency": "JPY",
  "imageUrl": "string",
  "stock": 15,
  "updatedAt": "datetime"
}
```

### DELETE /products/:id
商品を削除します。商品の販売者のみ実行可能です。

**レスポンス**
```json
{
  "success": true
}
```

### POST /products/images
商品画像をアップロードします。

**リクエスト**
```
multipart/form-data
image: ファイル（最大5MB、JPEG/PNGのみ）
```

**レスポンス**
```json
{
  "id": "uuid",
  "imageUrl": "string",
  "thumbnailUrl": "string",
  "createdAt": "datetime"
}
```

## 注文関連API

### POST /orders
商品を注文します。

**リクエスト**
```json
{
  "productId": "uuid",
  "quantity": 1,
  "shippingAddress": {
    "name": "山田花子",
    "postalCode": "123-4567",
    "prefecture": "東京都",
    "city": "渋谷区",
    "addressLine1": "道玄坂1-2-3",
    "addressLine2": "渋谷ビル101",
    "phoneNumber": "090-1234-5678"
  }
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "productId": "uuid",
  "quantity": 1,
  "amount": 2500,
  "currency": "JPY",
  "status": "pending",
  "paymentUrl": "https://checkout.stripe.com/...",
  "paymentDue": "datetime",
  "createdAt": "datetime",
  "product": {
    "id": "uuid",
    "title": "目醒めガイドブック",
    "imageUrl": "string"
  },
  "seller": {
    "id": "uuid",
    "displayName": "山田太郎"
  }
}
```

### GET /orders
自分の注文履歴を取得します。

**クエリパラメータ**
- `limit`: 取得数の上限（デフォルト20、最大100）
- `cursor`: ページネーション用カーソル
- `status`: 注文ステータスでフィルタリング（pending | paid | shipped | refunded | all、デフォルトはall）

**レスポンス**
```json
{
  "orders": [
    {
      "id": "uuid",
      "productId": "uuid",
      "quantity": 1,
      "amount": 2500,
      "currency": "JPY",
      "status": "paid",
      "createdAt": "datetime",
      "paidAt": "datetime",
      "product": {
        "id": "uuid",
        "title": "目醒めガイドブック",
        "imageUrl": "string"
      },
      "seller": {
        "id": "uuid",
        "displayName": "山田太郎",
        "profileImageUrl": "string"
      }
    }
  ],
  "nextCursor": "string"
}
```

### GET /orders/:id
注文詳細を取得します。注文の購入者または販売者のみ実行可能です。

**レスポンス**
```json
{
  "id": "uuid",
  "productId": "uuid",
  "quantity": 1,
  "amount": 2500,
  "currency": "JPY",
  "status": "paid",
  "shippingAddress": {
    "name": "山田花子",
    "postalCode": "123-4567",
    "prefecture": "東京都",
    "city": "渋谷区",
    "addressLine1": "道玄坂1-2-3",
    "addressLine2": "渋谷ビル101",
    "phoneNumber": "090-1234-5678"
  },
  "trackingNumber": "123456789",
  "shippingCarrier": "ヤマト運輸",
  "createdAt": "datetime",
  "paidAt": "datetime",
  "shippedAt": "datetime",
  "product": {
    "id": "uuid",
    "title": "目醒めガイドブック",
    "description": "目醒めのプロセスを解説した初心者向けガイドブックです。",
    "imageUrl": "string"
  },
  "seller": {
    "id": "uuid",
    "displayName": "山田太郎",
    "profileImageUrl": "string"
  },
  "buyer": {
    "id": "uuid",
    "displayName": "山田花子",
    "profileImageUrl": "string"
  }
}
```

### PUT /orders/:id/status
注文ステータスを更新します。商品の販売者のみ実行可能です。

**リクエスト**
```json
{
  "status": "shipped",
  "trackingNumber": "123456789",
  "shippingCarrier": "ヤマト運輸"
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "status": "shipped",
  "trackingNumber": "123456789",
  "shippingCarrier": "ヤマト運輸",
  "shippedAt": "datetime",
  "updatedAt": "datetime"
}
```

### POST /orders/:id/refund
注文の返金をリクエストします。注文の購入者のみ実行可能です。

**リクエスト**
```json
{
  "reason": "商品が届きません"
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "refundRequestId": "uuid",
  "status": "refund_requested",
  "refundReason": "商品が届きません",
  "requestedAt": "datetime"
}
```

## 販売関連API

### GET /sales
自分の販売履歴を取得します。

**クエリパラメータ**
- `limit`: 取得数の上限（デフォルト20、最大100）
- `cursor`: ページネーション用カーソル
- `status`: 注文ステータスでフィルタリング（pending | paid | shipped | refunded | all、デフォルトはall）

**レスポンス**
```json
{
  "sales": [
    {
      "id": "uuid",
      "orderId": "uuid",
      "productId": "uuid",
      "quantity": 1,
      "amount": 2500,
      "fee": 175,
      "netAmount": 2325,
      "currency": "JPY",
      "status": "shipped",
      "createdAt": "datetime",
      "paidAt": "datetime",
      "shippedAt": "datetime",
      "product": {
        "id": "uuid",
        "title": "目醒めガイドブック",
        "imageUrl": "string"
      },
      "buyer": {
        "id": "uuid",
        "displayName": "山田花子",
        "profileImageUrl": "string"
      }
    }
  ],
  "nextCursor": "string",
  "summary": {
    "totalSales": 15000,
    "totalFees": 1050,
    "netAmount": 13950,
    "currency": "JPY",
    "ordersCount": 6
  }
}
```