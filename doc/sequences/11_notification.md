# 通知機能シーケンス図

## 1. 通知設定管理

### 1.1 FCMトークン登録

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant OS as OS (iOS/Android)
    participant FCM as Firebase Cloud Messaging
    participant API as Supabase API
    participant DB as PostgreSQL

    User->>App: アプリ起動
    App->>OS: 通知許可状態確認
    
    alt 通知未許可
        App->>User: 通知許可ダイアログ表示
        User->>App: 通知を許可
        App->>OS: 通知許可リクエスト
        OS->>App: 許可完了
    end
    
    App->>FCM: FCMトークン取得リクエスト
    FCM->>App: FCMトークン返却
    App->>API: PUT /users/me/fcm-token
    note right of API: {fcmToken: "..."}
    API->>DB: UPDATE profiles SET fcm_token
    DB->>API: 更新完了
    API->>App: 200 OK
    App->>App: FCMトークン保存
```

### 1.2 通知設定更新

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL

    User->>App: 設定画面を開く
    App->>API: GET /users/me/notification-settings
    API->>DB: SELECT FROM notification_settings
    DB->>API: 現在の設定
    API->>App: 通知設定データ
    App->>User: 設定画面表示
    
    User->>App: 通知設定変更
    note right of User: コメント: ON<br/>ハイライト: ON<br/>フォロー: OFF<br/>ギフト: ON
    
    App->>API: PATCH /users/me/notification-settings
    note right of API: {<br/>  comment: true,<br/>  highlight: true,<br/>  follow: false,<br/>  gift: true<br/>}
    API->>DB: UPDATE notification_settings
    DB->>API: 更新完了
    API->>App: 200 OK
    App->>User: 設定保存完了表示
```

## 2. 通知配信フロー

### 2.1 コメント通知

```mermaid
sequenceDiagram
    participant UserA as ユーザーA（コメント投稿者）
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL
    participant EdgeFunc as Edge Function
    participant FCM as Firebase Cloud Messaging
    participant UserB as ユーザーB（投稿者）

    UserA->>App: コメント入力
    App->>API: POST /posts/{postId}/comments
    note right of API: {body: "素晴らしい投稿です！"}
    
    API->>DB: INSERT INTO comments
    DB->>API: コメントID
    
    API->>DB: SELECT post.user_id FROM posts
    DB->>API: 投稿者ID (UserB)
    
    API->>DB: SELECT notification_settings
    note right of DB: WHERE user_id = UserB
    DB->>API: 通知設定
    
    alt コメント通知がON
        API->>DB: INSERT INTO notifications
        note right of DB: type: 'comment'<br/>title: "新しいコメント"<br/>body: "UserAさんがコメントしました"<br/>data: {postId, commentId}
        DB->>API: 通知ID
        
        API->>EdgeFunc: 通知配信リクエスト
        EdgeFunc->>DB: SELECT fcm_token FROM profiles
        DB->>EdgeFunc: FCMトークン
        
        EdgeFunc->>FCM: プッシュ通知送信
        note right of FCM: {<br/>  token: "...",<br/>  notification: {<br/>    title: "新しいコメント",<br/>    body: "UserAさんがコメントしました"<br/>  },<br/>  data: {<br/>    type: "comment",<br/>    postId: "...",<br/>    commentId: "..."<br/>  }<br/>}
        
        FCM->>UserB: プッシュ通知表示
    end
    
    API->>App: 201 Created (コメント作成完了)
```

### 2.2 ハイライト通知

```mermaid
sequenceDiagram
    participant UserA as ユーザーA（ハイライト実行者）
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL
    participant EdgeFunc as Edge Function
    participant FCM as Firebase Cloud Messaging
    participant UserB as ユーザーB（投稿者）

    UserA->>App: ハイライトボタンタップ
    App->>UserA: 理由入力ダイアログ
    UserA->>App: 理由入力
    
    App->>API: POST /posts/{postId}/highlight
    note right of API: {reason: "深い洞察に感銘を受けました"}
    
    API->>DB: INSERT INTO highlights
    DB->>API: ハイライトID
    
    API->>DB: SELECT post.user_id FROM posts
    DB->>API: 投稿者ID (UserB)
    
    API->>DB: SELECT notification_settings
    DB->>API: 通知設定
    
    alt ハイライト通知がON
        API->>DB: INSERT INTO notifications
        note right of DB: type: 'highlight'<br/>title: "投稿がハイライトされました"<br/>body: "UserAさんがあなたの投稿をハイライトしました"<br/>data: {postId, highlightId, reason}
        
        API->>EdgeFunc: 通知配信リクエスト
        EdgeFunc->>FCM: プッシュ通知送信
        FCM->>UserB: プッシュ通知表示
    end
    
    API->>App: 201 Created
```

### 2.3 フォロー通知

```mermaid
sequenceDiagram
    participant UserA as ユーザーA（フォロワー）
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL
    participant EdgeFunc as Edge Function
    participant FCM as Firebase Cloud Messaging
    participant UserB as ユーザーB（フォロー対象）

    UserA->>App: フォローボタンタップ
    
    alt ファミリーフォロー
        App->>UserA: 理由入力ダイアログ
        UserA->>App: 理由入力
    end
    
    App->>API: POST /follows
    note right of API: {<br/>  followeeId: UserB,<br/>  followType: "family",<br/>  followReason: "音声配信が素晴らしいから"<br/>}
    
    API->>DB: INSERT INTO follows
    DB->>API: フォローID
    
    API->>DB: SELECT notification_settings
    note right of DB: WHERE user_id = UserB
    DB->>API: 通知設定
    
    alt フォロー通知がON
        API->>DB: INSERT INTO notifications
        note right of DB: type: 'follow'<br/>title: "新しいフォロワー"<br/>body: "UserAさんがあなたをフォローしました"<br/>data: {followId, followType, followReason}
        
        API->>EdgeFunc: 通知配信リクエスト
        EdgeFunc->>FCM: プッシュ通知送信
        FCM->>UserB: プッシュ通知表示
    end
    
    API->>App: 201 Created
```

### 2.4 ギフト通知

```mermaid
sequenceDiagram
    participant UserA as ユーザーA（送信者）
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL
    participant Stores as Stores.jp
    participant EdgeFunc as Edge Function
    participant FCM as Firebase Cloud Messaging
    participant UserB as ユーザーB（受信者）

    UserA->>App: ギフトボタンタップ
    App->>UserA: ギフト金額選択
    UserA->>App: 300円を選択
    
    App->>API: POST /posts/{postId}/gift
    note right of API: {amount: 300, message: "応援しています！"}
    
    API->>Stores: 決済URL生成
    Stores->>API: 決済URL
    API->>App: 決済URL
    App->>UserA: 決済画面表示
    UserA->>Stores: 決済完了
    
    Stores->>API: Webhook通知
    API->>DB: INSERT INTO gifts
    DB->>API: ギフトID
    
    API->>DB: SELECT notification_settings
    note right of DB: WHERE user_id = UserB
    DB->>API: 通知設定
    
    alt ギフト通知がON
        API->>DB: INSERT INTO notifications
        note right of DB: type: 'gift'<br/>title: "光ギフトを受け取りました"<br/>body: "UserAさんから300円のギフト"<br/>data: {giftId, amount, message}
        
        API->>EdgeFunc: 通知配信リクエスト
        EdgeFunc->>FCM: プッシュ通知送信
        FCM->>UserB: プッシュ通知表示
    end
```

## 3. 通知一覧取得と既読処理

### 3.1 通知一覧取得

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL

    User->>App: 通知アイコンタップ
    App->>API: GET /notifications?cursor=
    
    API->>DB: SELECT FROM notifications
    note right of DB: WHERE user_id = {userId}<br/>ORDER BY created_at DESC<br/>LIMIT 20
    
    DB->>API: 通知リスト
    
    loop 各通知に対して
        API->>DB: 関連データ取得
        note right of DB: 投稿、ユーザー情報など
        DB->>API: 関連データ
    end
    
    API->>App: 通知一覧 + nextCursor
    App->>User: 通知一覧表示
    
    alt 未読通知あり
        App->>App: 未読バッジ表示
    end
```

### 3.2 既読処理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL

    User->>App: 通知をタップ
    App->>App: 通知詳細表示
    
    App->>API: PATCH /notifications/{notificationId}
    note right of API: {read: true}
    
    API->>DB: UPDATE notifications
    note right of DB: SET is_read = true<br/>WHERE id = {notificationId}
    
    DB->>API: 更新完了
    API->>App: 200 OK
    App->>App: 未読バッジ更新
    
    alt 通知タイプに応じた画面遷移
        alt コメント通知
            App->>User: 投稿詳細画面へ遷移
        else ハイライト通知
            App->>User: 投稿詳細画面へ遷移
        else フォロー通知
            App->>User: フォロワーのプロフィール画面へ遷移
        else ギフト通知
            App->>User: ギフト詳細画面へ遷移
        end
    end
```

### 3.3 一括既読

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL

    User->>App: すべて既読にするボタン
    App->>API: PATCH /notifications/read-all
    
    API->>DB: UPDATE notifications
    note right of DB: SET is_read = true<br/>WHERE user_id = {userId}<br/>AND is_read = false
    
    DB->>API: 更新件数
    API->>App: 200 OK
    App->>App: 未読バッジクリア
    App->>User: 既読完了表示
```

## 4. リアルタイム通知

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ（フォアグラウンド）
    participant RealtimeAPI as Supabase Realtime
    participant DB as PostgreSQL
    participant OtherUser as 他のユーザー

    App->>RealtimeAPI: WebSocket接続
    RealtimeAPI->>App: 接続確立
    
    App->>RealtimeAPI: Subscribe to notifications
    note right of App: channel: notifications:user_id={userId}
    
    OtherUser->>DB: 通知発生アクション（コメント等）
    DB->>DB: INSERT INTO notifications
    
    DB->>RealtimeAPI: 通知イベント
    RealtimeAPI->>App: 新着通知データ
    
    App->>App: 通知データをローカルに追加
    App->>User: アプリ内通知表示
    note right of User: トースト表示または<br/>通知ドロワー更新
```

## 5. エラーハンドリング

### 5.1 FCMトークン取得エラー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant FCM as Firebase Cloud Messaging
    participant API as Supabase API

    User->>App: アプリ起動
    App->>FCM: FCMトークン取得リクエスト
    FCM--xApp: エラー（ネットワーク等）
    
    App->>App: リトライ待機（exponential backoff）
    note right of App: 1秒 → 2秒 → 4秒 → 8秒
    
    loop 最大3回リトライ
        App->>FCM: FCMトークン取得リクエスト
        alt 成功
            FCM->>App: FCMトークン
            App->>API: PUT /users/me/fcm-token
            API->>App: 200 OK
        else 失敗
            FCM--xApp: エラー
        end
    end
    
    alt すべて失敗
        App->>App: 通知なしで続行
        App->>App: バックグラウンドで再試行予約
    end
```

### 5.2 通知配信エラー

```mermaid
sequenceDiagram
    participant EdgeFunc as Edge Function
    participant FCM as Firebase Cloud Messaging
    participant DB as PostgreSQL

    EdgeFunc->>FCM: プッシュ通知送信
    FCM--xEdgeFunc: エラー（無効なトークン等）
    
    alt 無効なトークンエラー
        EdgeFunc->>DB: UPDATE profiles
        note right of DB: SET fcm_token = NULL<br/>WHERE fcm_token = {invalid_token}
        DB->>EdgeFunc: 更新完了
        EdgeFunc->>EdgeFunc: ログ記録
    else レート制限エラー
        EdgeFunc->>EdgeFunc: キューに再登録
        note right of EdgeFunc: 遅延実行スケジュール
    else その他のエラー
        EdgeFunc->>EdgeFunc: エラーログ記録
        EdgeFunc->>DB: UPDATE notifications
        note right of DB: SET delivery_status = 'failed'<br/>error_message = '...'
    end
```

## 通知フォーマット仕様

### 通知データ構造

```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "string",
  "body": "string",
  "notificationType": "comment|highlight|follow|gift",
  "data": {
    // タイプに応じた追加データ
    "postId": "uuid",
    "commentId": "uuid",
    "followId": "uuid",
    "giftId": "uuid",
    "amount": 300,
    "reason": "string"
  },
  "isRead": false,
  "createdAt": "2024-05-25T10:00:00Z"
}
```

### FCMペイロード構造

```json
{
  "token": "FCMトークン",
  "notification": {
    "title": "通知タイトル",
    "body": "通知本文",
    "badge": 1,
    "sound": "default"
  },
  "data": {
    "type": "comment",
    "notificationId": "uuid",
    "deepLink": "kanushi://post/{postId}"
  },
  "apns": {
    "payload": {
      "aps": {
        "category": "COMMENT_CATEGORY",
        "thread-id": "post-{postId}"
      }
    }
  },
  "android": {
    "priority": "high",
    "notification": {
      "channel_id": "default"
    }
  }
}
```