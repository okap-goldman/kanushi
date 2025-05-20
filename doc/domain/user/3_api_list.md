# ユーザードメインAPI一覧

## 認証関連

### POST /auth/google
Google OAuthによるユーザー認証（登録またはログイン）を行います。

**リクエスト**
```json
{
  "idToken": "string",  // GoogleのIDトークン
  "clientType": "string"  // "ios", "android", "web"のいずれか
}
```

**レスポンス**
```json
{
  "accessToken": "string",  // JWTアクセストークン
  "refreshToken": "string",  // リフレッシュトークン
  "expiresIn": 3600,  // アクセストークンの有効期間（秒）
  "user": {
    "id": "uuid",
    "displayName": "string",
    "profileImageUrl": "string",
    "isNewUser": true  // 新規ユーザーかどうか
  }
}
```

### POST /auth/refresh
リフレッシュトークンを使用して新しいアクセストークンを取得します。

**リクエスト**
```json
{
  "refreshToken": "string"
}
```

**レスポンス**
```json
{
  "accessToken": "string",
  "expiresIn": 3600
}
```

### POST /auth/logout
ログアウト処理を行います。

**リクエスト**
```json
{
  "refreshToken": "string"  // 任意
}
```

**レスポンス**
```json
{
  "success": true
}
```

## プロフィール関連

### GET /users/me
現在認証されているユーザー自身のプロフィール情報を取得します。

**レスポンス**
```json
{
  "id": "uuid",
  "displayName": "string",
  "profileText": "string",
  "profileImageUrl": "string",
  "introAudioUrl": "string",
  "externalLinkUrl": "string",
  "prefecture": "string",
  "city": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### GET /users/:id
指定されたIDのユーザープロフィールを取得します。

**レスポンス**
```json
{
  "id": "uuid",
  "displayName": "string",
  "profileText": "string",
  "profileImageUrl": "string",
  "introAudioUrl": "string",
  "externalLinkUrl": "string",
  "prefecture": "string",
  "city": "string",
  "isFollowing": true,  // 現在のユーザーがフォローしているか
  "followType": "family",  // フォローしている場合のタイプ
  "createdAt": "datetime"
}
```

### PUT /users/me
自分のプロフィール情報を更新します。

**リクエスト**
```json
{
  "displayName": "string",  // 任意
  "profileText": "string",  // 任意
  "externalLinkUrl": "string",  // 任意
  "prefecture": "string",  // 任意
  "city": "string"  // 任意
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "displayName": "string",
  "profileText": "string",
  "profileImageUrl": "string",
  "introAudioUrl": "string",
  "externalLinkUrl": "string",
  "prefecture": "string",
  "city": "string",
  "updatedAt": "datetime"
}
```

### POST /users/me/profile-image
プロフィール画像をアップロードします。

**リクエスト**
```
multipart/form-data
image: ファイル（最大5MB）
```

**レスポンス**
```json
{
  "profileImageUrl": "string"
}
```

### POST /users/me/intro-audio
自己紹介音声をアップロードします。

**リクエスト**
```
multipart/form-data
audio: ファイル（最大2MB、最大30秒）
```

**レスポンス**
```json
{
  "introAudioUrl": "string"
}
```

### POST /users/me/fcm-token
FCMトークンを登録または更新します。

**リクエスト**
```json
{
  "fcmToken": "string",
  "deviceId": "string"
}
```

**レスポンス**
```json
{
  "success": true
}
```

### DELETE /users/me
自分のアカウントを削除します（ソフト削除）。

**レスポンス**
```json
{
  "success": true
}
```

## フォロー関連

### POST /follows
ユーザーをフォローします。

**リクエスト**
```json
{
  "followeeId": "uuid",
  "followType": "family"  // "family" または "watch"
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "followerId": "uuid",
  "followeeId": "uuid",
  "followType": "string",
  "status": "active",
  "createdAt": "datetime"
}
```

### PUT /follows/:id
フォロー関係を更新します（タイプの変更）。

**リクエスト**
```json
{
  "followType": "watch"  // "family" または "watch"
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "followerId": "uuid",
  "followeeId": "uuid",
  "followType": "string",
  "status": "active",
  "updatedAt": "datetime"
}
```

### DELETE /follows/:id
ユーザーのフォローを解除します。

**レスポンス**
```json
{
  "success": true
}
```

### GET /users/me/followers
自分のフォロワー一覧を取得します。

**クエリパラメータ**
- `limit`: 取得数の上限（デフォルト20、最大100）
- `cursor`: ページネーション用カーソル
- `followType`: フォロータイプでフィルタリング（任意）

**レスポンス**
```json
{
  "followers": [
    {
      "id": "uuid",
      "userId": "uuid",
      "displayName": "string",
      "profileImageUrl": "string",
      "followType": "string",
      "createdAt": "datetime",
      "isFollowingBack": true  // 現在のユーザーが相手をフォローしているか
    }
  ],
  "nextCursor": "string"  // 次ページのカーソル（次がない場合はnull）
}
```

### GET /users/me/following
自分がフォローしているユーザー一覧を取得します。

**クエリパラメータ**
- `limit`: 取得数の上限（デフォルト20、最大100）
- `cursor`: ページネーション用カーソル
- `followType`: フォロータイプでフィルタリング（任意）

**レスポンス**
```json
{
  "following": [
    {
      "id": "uuid",
      "userId": "uuid",
      "displayName": "string",
      "profileImageUrl": "string",
      "followType": "string",
      "createdAt": "datetime"
    }
  ],
  "nextCursor": "string"  // 次ページのカーソル（次がない場合はnull）
}
```

### GET /users/:id/followers
指定ユーザーのフォロワー一覧を取得します。

**クエリパラメータ**
- `limit`: 取得数の上限（デフォルト20、最大100）
- `cursor`: ページネーション用カーソル

**レスポンス**
```json
{
  "followers": [
    {
      "id": "uuid",
      "userId": "uuid",
      "displayName": "string",
      "profileImageUrl": "string",
      "followType": "string",
      "createdAt": "datetime",
      "isFollowing": true  // 現在のユーザーがこのユーザーをフォローしているか
    }
  ],
  "nextCursor": "string"
}
```

### GET /users/:id/following
指定ユーザーがフォローしているユーザー一覧を取得します。

**クエリパラメータ**
- `limit`: 取得数の上限（デフォルト20、最大100）
- `cursor`: ページネーション用カーソル

**レスポンス**
```json
{
  "following": [
    {
      "id": "uuid",
      "userId": "uuid",
      "displayName": "string",
      "profileImageUrl": "string",
      "followType": "string",
      "createdAt": "datetime",
      "isFollowing": true  // 現在のユーザーがこのユーザーをフォローしているか
    }
  ],
  "nextCursor": "string"
}
```