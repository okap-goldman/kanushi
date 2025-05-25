# ダイレクトメッセージ機能シーケンス図

## 1. DM会話開始

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL
    participant KeyStore as 鍵ストア

    User->>App: メッセージボタンタップ
    App->>API: GET /dm/threads
    API->>DB: SELECT FROM dm_threads
    DB->>API: スレッド一覧
    API->>App: DM会話リスト
    App->>User: 会話一覧表示

    User->>App: 新規メッセージボタン
    App->>User: ユーザー検索画面
    User->>App: 宛先ユーザー選択
    
    App->>API: POST /dm/threads/{userId}
    API->>DB: スレッド存在確認
    note right of DB: SELECT * FROM dm_threads<br/>WHERE (user1_id = sender AND user2_id = recipient)<br/>OR (user1_id = recipient AND user2_id = sender)
    
    alt スレッドが存在しない
        API->>DB: INSERT INTO dm_threads
        DB->>API: 新規スレッドID
        
        API->>KeyStore: E2E暗号化キーペア生成
        KeyStore->>API: 公開鍵・秘密鍵
        API->>DB: 公開鍵保存
        
        API->>App: 201 Created (thread)
        App->>KeyStore: 秘密鍵をローカル保存
        App->>User: メッセージ入力画面表示
    else スレッドが既に存在
        API->>App: 200 OK (既存thread)
        App->>User: 既存会話画面表示
    end
```

## 2. テキストメッセージ送信

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL
    participant KeyStore as 鍵ストア
    participant WS as WebSocket
    participant Recipient as 受信者アプリ

    User->>App: テキスト入力
    User->>App: 送信ボタン
    
    App->>KeyStore: 受信者の公開鍵取得
    KeyStore->>App: 公開鍵
    App->>App: メッセージをE2E暗号化
    note right of App: 受信者の公開鍵で暗号化
    
    App->>API: POST /dm/threads/{threadId}/messages
    note right of API: {<br/>  messageType: "text",<br/>  textContent: "暗号化済みテキスト"<br/>}
    
    API->>DB: INSERT INTO direct_messages
    DB->>API: メッセージID
    
    API->>WS: リアルタイム通知
    WS->>Recipient: 新規メッセージ通知
    
    API->>App: 201 Created
    App->>App: 送信済みメッセージ表示
    
    Recipient->>API: GET /dm/threads/{threadId}/messages
    API->>DB: SELECT最新メッセージ
    DB->>API: 暗号化メッセージ
    API->>Recipient: メッセージデータ
    
    Recipient->>KeyStore: 自分の秘密鍵取得
    KeyStore->>Recipient: 秘密鍵
    Recipient->>Recipient: メッセージ復号化
    Recipient->>User: メッセージ表示
```

## 3. 画像メッセージ送信

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant Storage as B2 Storage
    participant DB as PostgreSQL
    participant KeyStore as 鍵ストア
    participant WS as WebSocket

    User->>App: 画像選択ボタン
    App->>User: カメラ/ギャラリー選択
    User->>App: 画像選択
    
    App->>App: 画像リサイズ・圧縮
    App->>App: プレビュー表示
    
    User->>App: 送信ボタン
    
    App->>KeyStore: AES暗号化キー生成
    KeyStore->>App: AESキー
    App->>App: 画像をAESで暗号化
    
    App->>API: POST /uploads/presigned
    API->>App: presignedUrl
    App->>Storage: PUT 暗号化画像
    Storage->>App: 画像URL
    
    App->>KeyStore: 受信者の公開鍵取得
    KeyStore->>App: 公開鍵
    App->>App: AESキーを公開鍵で暗号化
    
    App->>API: POST /dm/threads/{threadId}/messages
    note right of API: {<br/>  messageType: "image",<br/>  mediaUrl: "暗号化画像URL",<br/>  encryptedKey: "暗号化済みAESキー"<br/>}
    
    API->>DB: INSERT INTO direct_messages
    DB->>API: メッセージID
    
    API->>WS: リアルタイム通知
    API->>App: 201 Created
    App->>User: 送信完了表示
```

## 4. 音声メッセージ送信

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant Storage as B2 Storage
    participant EdgeFunc as Edge Functions
    participant DB as PostgreSQL
    participant KeyStore as 鍵ストア
    participant WS as WebSocket

    User->>App: 音声録音ボタン
    App->>App: 録音開始
    User->>App: 録音停止
    
    App->>App: 音声データ生成
    App->>App: 波形生成（ローカル）
    App->>User: プレビュー表示
    
    User->>App: 送信ボタン
    
    App->>KeyStore: AES暗号化キー生成
    KeyStore->>App: AESキー
    App->>App: 音声をAESで暗号化
    
    App->>API: POST /uploads/presigned
    API->>App: presignedUrl
    App->>Storage: PUT 暗号化音声
    Storage->>App: 音声URL
    
    App->>EdgeFunc: 音声処理リクエスト
    note right of EdgeFunc: 暗号化状態で処理
    EdgeFunc->>EdgeFunc: 音質向上（暗号化維持）
    EdgeFunc->>Storage: 処理済み音声保存
    
    App->>KeyStore: 受信者の公開鍵取得
    KeyStore->>App: 公開鍵
    App->>App: AESキーを公開鍵で暗号化
    
    App->>API: POST /dm/threads/{threadId}/messages
    note right of API: {<br/>  messageType: "audio",<br/>  mediaUrl: "暗号化音声URL",<br/>  encryptedKey: "暗号化済みAESキー"<br/>}
    
    API->>DB: INSERT INTO direct_messages
    DB->>API: メッセージID
    
    API->>WS: リアルタイム通知
    API->>App: 201 Created
    App->>User: 送信完了表示
```

## 5. 既読処理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL
    participant WS as WebSocket
    participant Sender as 送信者アプリ

    User->>App: DM会話画面を開く
    App->>API: GET /dm/threads/{threadId}/messages
    API->>DB: SELECT未読メッセージ
    DB->>API: メッセージリスト
    API->>App: メッセージデータ
    
    App->>App: メッセージ復号化・表示
    
    loop 各未読メッセージ
        App->>API: PUT /dm/messages/{messageId}/read
        API->>DB: UPDATE is_read = true
        DB->>API: 更新完了
    end
    
    API->>WS: 既読通知送信
    WS->>Sender: 既読状態更新
    
    Sender->>Sender: 既読マーク表示
    note right of Sender: ✓✓
```

## 6. スレッド管理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL

    User->>App: メッセージ一覧画面
    App->>API: GET /dm/threads
    API->>DB: スレッド一覧取得
    note right of DB: SELECT dt.*, dm.* FROM dm_threads dt<br/>LEFT JOIN direct_messages dm<br/>ON dm.id = (<br/>  SELECT id FROM direct_messages<br/>  WHERE thread_id = dt.id<br/>  ORDER BY created_at DESC<br/>  LIMIT 1<br/>)
    
    DB->>API: スレッドと最新メッセージ
    API->>API: 未読数カウント
    API->>App: スレッド一覧データ
    
    App->>App: スレッドソート
    note right of App: 最新メッセージ順
    
    App->>User: スレッド一覧表示
    note right of User: - ユーザー名<br/>- 最新メッセージプレビュー<br/>- 未読バッジ<br/>- タイムスタンプ
    
    User->>App: スレッドを長押し
    App->>User: コンテキストメニュー表示
    
    alt スレッドをミュート
        User->>App: ミュートを選択
        App->>API: PATCH /dm/threads/{threadId}
        note right of API: {muted: true}
        API->>DB: スレッド設定更新
        DB->>API: 更新完了
        API->>App: 200 OK
        App->>User: ミュートアイコン表示
    else スレッドを削除
        User->>App: 削除を選択
        App->>User: 確認ダイアログ
        User->>App: 削除確認
        App->>API: DELETE /dm/threads/{threadId}
        API->>DB: 論理削除フラグ設定
        DB->>API: 削除完了
        API->>App: 204 No Content
        App->>User: スレッド非表示
    end
```

## 7. リアルタイム同期

```mermaid
sequenceDiagram
    participant UserA as ユーザーA
    participant AppA as アプリA
    participant WS as WebSocket Server
    participant API as Supabase API
    participant DB as PostgreSQL
    participant AppB as アプリB
    participant UserB as ユーザーB

    AppA->>WS: WebSocket接続確立
    note right of WS: wss://realtime.supabase.io
    WS->>AppA: 接続確認
    
    AppA->>WS: チャンネル購読
    note right of WS: channel: dm_thread_{threadId}
    
    AppB->>WS: WebSocket接続確立
    WS->>AppB: 接続確認
    AppB->>WS: 同チャンネル購読
    
    UserA->>AppA: メッセージ送信
    AppA->>API: POST /dm/threads/{threadId}/messages
    API->>DB: INSERT INTO direct_messages
    DB->>API: メッセージID
    
    API->>WS: Broadcast新規メッセージ
    note right of WS: {<br/>  type: "new_message",<br/>  threadId: "xxx",<br/>  message: {...}<br/>}
    
    WS->>AppB: リアルタイム通知
    AppB->>AppB: メッセージ復号化
    AppB->>UserB: 新規メッセージ表示
    AppB->>UserB: 通知音再生
    
    UserB->>AppB: メッセージ表示
    AppB->>API: PUT /dm/messages/{messageId}/read
    API->>DB: UPDATE is_read
    
    API->>WS: Broadcast既読状態
    WS->>AppA: 既読通知
    AppA->>UserA: 既読マーク表示
```

## 8. E2E暗号化の鍵交換

```mermaid
sequenceDiagram
    participant UserA as ユーザーA
    participant AppA as アプリA
    participant API as Supabase API
    participant DB as PostgreSQL
    participant AppB as アプリB
    participant UserB as ユーザーB

    Note over AppA,AppB: 初回DM開始時の鍵交換
    
    AppA->>AppA: RSAキーペア生成
    note right of AppA: 2048bit RSA
    
    AppA->>API: POST /users/me/public-key
    note right of API: {publicKey: "RSA公開鍵"}
    API->>DB: ユーザー公開鍵保存
    DB->>API: 保存完了
    
    AppB->>AppB: RSAキーペア生成
    AppB->>API: POST /users/me/public-key
    API->>DB: ユーザー公開鍵保存
    
    Note over AppA,AppB: メッセージ送信時
    
    AppA->>API: GET /users/{userBId}/public-key
    API->>DB: SELECT公開鍵
    DB->>API: UserBの公開鍵
    API->>AppA: 公開鍵データ
    
    AppA->>AppA: セッションキー生成
    note right of AppA: AES-256
    
    AppA->>AppA: メッセージ暗号化
    note right of AppA: 1. メッセージをAESで暗号化<br/>2. AESキーをRSA公開鍵で暗号化
    
    AppA->>API: 暗号化メッセージ送信
    note right of API: {<br/>  encryptedContent: "...",<br/>  encryptedKey: "..."<br/>}
    
    API->>DB: 暗号化状態で保存
    DB->>API: 保存完了
    
    AppB->>API: メッセージ取得
    API->>AppB: 暗号化メッセージ
    
    AppB->>AppB: メッセージ復号化
    note right of AppB: 1. 自分の秘密鍵でAESキー復号<br/>2. AESキーでメッセージ復号
    
    AppB->>UserB: 平文メッセージ表示
```

## エラーハンドリング

### メッセージ送信失敗時

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant Queue as 送信キュー
    participant API as Supabase API

    User->>App: メッセージ送信
    App->>API: POST /dm/threads/{threadId}/messages
    API--xApp: Network Error
    
    App->>Queue: 失敗メッセージをキューに保存
    App->>User: 送信失敗マーク表示
    note right of User: ⚠️ 送信失敗
    
    App->>User: 再送信ボタン表示
    
    alt 手動再送信
        User->>App: 再送信ボタンタップ
        App->>API: POST /dm/threads/{threadId}/messages
        API->>App: 201 Created
        App->>Queue: キューから削除
        App->>User: 送信成功表示
    else 自動再送信
        loop 5分ごと
            App->>App: ネットワーク状態確認
            alt オンライン
                App->>Queue: 未送信メッセージ取得
                Queue->>App: メッセージデータ
                App->>API: POST /dm/threads/{threadId}/messages
                API->>App: 201 Created
                App->>Queue: 送信済みマーク
                App->>User: 送信完了通知
            end
        end
    end
```

### 暗号化エラー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant KeyStore as 鍵ストア

    User->>App: メッセージ送信
    App->>KeyStore: 受信者の公開鍵取得
    KeyStore->>App: 公開鍵なし/期限切れ
    
    App->>API: GET /users/{userId}/public-key
    API->>App: 404 Not Found
    
    App->>User: エラーダイアログ表示
    note right of User: "相手の暗号化キーが<br/>見つかりません"
    
    App->>API: POST /notifications/key-request
    note right of API: 相手に鍵生成を促す通知
    
    API->>App: 通知送信完了
    App->>User: 後で再試行するよう案内
```

### WebSocket接続エラー

```mermaid
sequenceDiagram
    participant App as モバイルアプリ
    participant WS as WebSocket Server
    participant User as ユーザー

    App->>WS: WebSocket接続試行
    WS--xApp: Connection Failed
    
    App->>User: オフラインインジケータ表示
    note right of User: 🔴 接続なし
    
    loop 指数バックオフ
        App->>App: 待機（1s, 2s, 4s...）
        App->>WS: 再接続試行
        alt 接続成功
            WS->>App: 接続確立
            App->>WS: チャンネル再購読
            App->>User: オンラインインジケータ
            note right of User: 🟢 接続中
        else 接続失敗継続
            App->>App: 次の再試行まで待機
        end
    end
```