# 06. イベント機能のシーケンス図

## 概要
イベント機能は、オンライン・オフラインのイベント開催を支援する機能です。
特に音声ワークショップでは、ライブルームとの連携により、リアルタイム配信と
アーカイブ視聴の両方をサポートします。

## 6.1 イベント作成（音声ワークショップ含む）

### 6.1.1 通常イベント作成
```mermaid
sequenceDiagram
    participant U as User
    participant M as Mobile App
    participant EF as Edge Function
    participant DB as Supabase DB
    
    U->>M: イベント作成画面を開く
    M->>U: イベント作成フォーム表示
    
    U->>M: イベント情報入力
    Note over U,M: name, description,<br/>location, starts_at,<br/>ends_at, fee, currency,<br/>refund_policy
    
    U->>M: イベント作成ボタンタップ
    M->>EF: POST /events
    
    EF->>DB: BEGIN TRANSACTION
    
    EF->>DB: INSERT INTO event
    Note over DB: event_type = 'offline'<br/>live_room_id = NULL
    
    DB-->>EF: event_id
    
    EF->>DB: COMMIT
    
    EF-->>M: 201 Created<br/>{event}
    M-->>U: イベント作成完了
```

### 6.1.2 音声ワークショップ作成
```mermaid
sequenceDiagram
    participant U as User
    participant M as Mobile App
    participant EF as Edge Function
    participant DB as Supabase DB
    participant LK as LiveKit
    
    U->>M: 音声ワークショップ作成を選択
    M->>U: ワークショップ作成フォーム表示
    
    U->>M: ワークショップ情報入力
    Note over U,M: 通常のイベント情報+<br/>配信設定（録音有無）
    
    U->>M: ワークショップ作成ボタンタップ
    M->>EF: POST /events<br/>{eventType: 'audio_workshop'}
    
    EF->>DB: BEGIN TRANSACTION
    
    %% ライブルーム作成
    EF->>DB: INSERT INTO live_room
    Note over DB: status = 'preparing'<br/>is_recording = true<br/>max_speakers = 10
    
    DB-->>EF: room_id
    
    EF->>LK: Create Room API
    Note over LK: ルーム名生成<br/>録音設定ON
    
    LK-->>EF: room_name
    
    EF->>DB: UPDATE live_room<br/>SET livekit_room_name
    
    %% イベント作成
    EF->>DB: INSERT INTO event
    Note over DB: event_type = 'audio_workshop'<br/>live_room_id = room_id
    
    DB-->>EF: event_id
    
    EF->>DB: COMMIT
    
    EF-->>M: 201 Created<br/>{event, liveRoom}
    M-->>U: 音声ワークショップ作成完了
```

## 6.2 イベント参加・決済

### 6.2.1 無料イベント参加
```mermaid
sequenceDiagram
    participant U as User
    participant M as Mobile App
    participant EF as Edge Function
    participant DB as Supabase DB
    participant FCM as FCM
    
    U->>M: イベント詳細画面を開く
    M->>EF: GET /events/{eventId}
    EF->>DB: SELECT event with participants
    DB-->>EF: event data
    EF-->>M: event details
    
    M->>U: イベント詳細表示
    Note over M,U: fee = 0（無料）
    
    U->>M: 参加ボタンタップ
    M->>EF: POST /events/{eventId}/participate<br/>{status: 'going'}
    
    EF->>DB: BEGIN TRANSACTION
    
    EF->>DB: INSERT INTO event_participant
    Note over DB: payment_status = 'paid'<br/>(無料のため即座に完了)
    
    DB-->>EF: participant_id
    
    %% 主催者への通知
    EF->>DB: SELECT creator_user_id, fcm_token
    DB-->>EF: creator info
    
    EF->>FCM: Send notification
    Note over FCM: "新しい参加者が<br/>登録しました"
    
    EF->>DB: INSERT INTO notification
    
    EF->>DB: COMMIT
    
    EF-->>M: 201 Created<br/>{participant}
    M-->>U: 参加登録完了
```

### 6.2.2 有料イベント参加（Stores.jp決済）
```mermaid
sequenceDiagram
    participant U as User
    participant M as Mobile App
    participant EF as Edge Function
    participant DB as Supabase DB
    participant ST as Stores.jp
    participant WH as Webhook Handler
    
    U->>M: 有料イベント詳細を開く
    M->>EF: GET /events/{eventId}
    EF->>DB: SELECT event data
    DB-->>EF: event (fee > 0)
    EF-->>M: event details
    
    M->>U: イベント詳細表示
    Note over M,U: 参加費: ¥3,000
    
    U->>M: 参加ボタンタップ
    M->>EF: POST /events/{eventId}/participate<br/>{status: 'going'}
    
    EF->>DB: BEGIN TRANSACTION
    
    %% 参加者レコード作成（支払い待ち）
    EF->>DB: INSERT INTO event_participant
    Note over DB: payment_status = 'pending'
    
    DB-->>EF: participant_id
    
    %% Stores.jp決済URL生成
    EF->>ST: Create Payment Session
    Note over ST: amount = event.fee<br/>metadata = {<br/>  type: 'event',<br/>  event_id,<br/>  participant_id<br/>}
    
    ST-->>EF: payment_url, payment_id
    
    EF->>DB: UPDATE event_participant<br/>SET stores_payment_id
    
    EF->>DB: COMMIT
    
    EF-->>M: 200 OK<br/>{paymentUrl}
    M->>U: Stores.jp決済画面を開く
    
    %% 決済処理
    U->>ST: 決済情報入力・確定
    ST->>WH: POST /webhooks/stores<br/>{status: 'paid'}
    
    WH->>DB: BEGIN TRANSACTION
    
    WH->>DB: UPDATE event_participant<br/>SET payment_status = 'paid'
    
    %% 主催者への通知
    WH->>DB: SELECT creator fcm_token
    WH->>FCM: Send notification
    
    WH->>DB: INSERT INTO notification
    
    WH->>DB: COMMIT
    
    WH-->>ST: 200 OK
    
    %% アプリ側の更新
    M->>EF: GET /events/{eventId}/participants/me
    EF->>DB: SELECT participant status
    DB-->>EF: payment_status = 'paid'
    EF-->>M: participant details
    M-->>U: 参加登録完了
```

## 6.3 イベント投稿紐付け

```mermaid
sequenceDiagram
    participant U as User
    participant M as Mobile App
    participant EF as Edge Function
    participant DB as Supabase DB
    participant B2 as B2 Storage
    
    U->>M: イベント関連の投稿作成
    M->>U: 投稿作成画面表示
    Note over M,U: イベント選択UI表示
    
    U->>M: 紐付けるイベントを選択
    M->>EF: GET /events?filter=created
    EF->>DB: SELECT user's events
    DB-->>EF: events list
    EF-->>M: events
    
    M->>U: イベント選択リスト表示
    U->>M: イベントを選択
    
    U->>M: 投稿内容入力（音声録音）
    M->>B2: Upload audio file
    B2-->>M: media_url
    
    M->>EF: POST /posts
    Note over M,EF: {<br/>  contentType: 'audio',<br/>  eventId: selected_event_id,<br/>  mediaUrl: media_url<br/>}
    
    EF->>DB: BEGIN TRANSACTION
    
    EF->>DB: INSERT INTO post
    Note over DB: event_id = selected_event_id
    
    DB-->>EF: post_id
    
    %% イベント参加者への通知
    EF->>DB: SELECT participants
    DB-->>EF: participant list
    
    EF->>FCM: Batch notification
    Note over FCM: "イベントに関連する<br/>新しい投稿"
    
    EF->>DB: COMMIT
    
    EF-->>M: 201 Created<br/>{post}
    M-->>U: 投稿完了
    
    %% イベントページでの表示
    U->>M: イベント詳細を表示
    M->>EF: GET /events/{eventId}
    EF->>DB: SELECT event, related posts
    DB-->>EF: event with posts
    EF-->>M: event details
    M->>U: イベント詳細+関連投稿表示
```

## 6.4 音声ワークショップのライブルーム連携

### 6.4.1 ワークショップ開始（ホスト）
```mermaid
sequenceDiagram
    participant H as Host
    participant M as Mobile App
    participant EF as Edge Function
    participant DB as Supabase DB
    participant LK as LiveKit
    
    H->>M: イベント管理画面を開く
    M->>EF: GET /events/{eventId}
    EF->>DB: SELECT event, live_room
    DB-->>EF: event with room data
    EF-->>M: event details
    
    M->>H: ワークショップ開始ボタン表示
    H->>M: 開始ボタンタップ
    
    M->>EF: POST /live-rooms/{roomId}/start
    
    EF->>DB: BEGIN TRANSACTION
    
    EF->>DB: UPDATE live_room<br/>SET status = 'live'
    
    %% ホスト用接続トークン生成
    EF->>LK: Generate Token (Host)
    Note over LK: permissions:<br/>- canPublish: true<br/>- canSubscribe: true<br/>- room admin
    
    LK-->>EF: connection_token
    
    %% 参加者への通知
    EF->>DB: SELECT paid participants
    DB-->>EF: participant list
    
    EF->>FCM: Batch notification
    Note over FCM: "ワークショップが<br/>開始されました"
    
    EF->>DB: COMMIT
    
    EF-->>M: 200 OK<br/>{token, url}
    
    M->>LK: Connect WebRTC
    LK-->>M: Connected
    M-->>H: ライブルーム接続完了
```

### 6.4.2 参加者の入室（購入者限定）
```mermaid
sequenceDiagram
    participant P as Participant
    participant M as Mobile App
    participant EF as Edge Function
    participant DB as Supabase DB
    participant LK as LiveKit
    
    P->>M: 通知からワークショップを開く
    M->>EF: GET /events/{eventId}
    EF->>DB: SELECT event, participant status
    DB-->>EF: event, payment_status
    
    alt 未購入の場合
        EF-->>M: 403 Forbidden
        M-->>P: 参加権限なしエラー表示
        M->>P: 参加申込画面へ誘導
    else 購入済みの場合
        EF-->>M: event with room info
        M->>P: 入室ボタン表示
        
        P->>M: 入室ボタンタップ
        M->>EF: POST /live-rooms/{roomId}/join
        
        EF->>DB: Verify payment status
        DB-->>EF: payment_status = 'paid'
        
        %% 参加者用トークン生成
        EF->>LK: Generate Token (Listener)
        Note over LK: permissions:<br/>- canPublish: false<br/>- canSubscribe: true
        
        LK-->>EF: connection_token
        
        EF->>DB: INSERT INTO room_participant
        Note over DB: role = 'listener'
        
        EF-->>M: 200 OK<br/>{token, url}
        
        M->>LK: Connect WebRTC
        LK-->>M: Connected
        M-->>P: ワークショップ視聴開始
    end
```

## 6.5 アーカイブ視聴（購入者限定）

### 6.5.1 ワークショップ終了とアーカイブ生成
```mermaid
sequenceDiagram
    participant H as Host
    participant M as Mobile App
    participant EF as Edge Function
    participant DB as Supabase DB
    participant LK as LiveKit
    participant B2 as B2 Storage
    
    H->>M: ワークショップ終了ボタン
    M->>EF: POST /live-rooms/{roomId}/end<br/>{createPost: true}
    
    EF->>DB: BEGIN TRANSACTION
    
    EF->>LK: Stop Recording
    LK-->>EF: recording_url
    
    %% 録音ファイルをB2へ転送
    EF->>B2: Upload recording
    B2-->>EF: archive_url
    
    %% アーカイブ投稿作成
    EF->>DB: INSERT INTO post
    Note over DB: content_type = 'audio'<br/>media_url = archive_url<br/>event_id = event_id
    
    DB-->>EF: post_id
    
    EF->>DB: UPDATE live_room
    Note over DB: status = 'ended'<br/>post_id = post_id
    
    %% 参加者への通知
    EF->>DB: SELECT participants
    DB-->>EF: participant list
    
    EF->>FCM: Batch notification
    Note over FCM: "アーカイブが<br/>視聴可能になりました"
    
    EF->>DB: COMMIT
    
    EF-->>M: 200 OK
    M-->>H: ワークショップ終了完了
```

### 6.5.2 アーカイブ視聴アクセス制御
```mermaid
sequenceDiagram
    participant U as User
    participant M as Mobile App
    participant EF as Edge Function
    participant DB as Supabase DB
    participant B2 as B2/CDN
    
    U->>M: イベント詳細画面を開く
    M->>EF: GET /events/{eventId}
    
    EF->>DB: SELECT event, room, post
    DB-->>EF: event with archive
    
    EF->>DB: SELECT participant status
    DB-->>EF: payment_status
    
    alt 購入済みユーザー
        EF-->>M: 200 OK<br/>{event, archivePost}
        M->>U: アーカイブ再生ボタン表示
        
        U->>M: 再生ボタンタップ
        M->>EF: GET /posts/{postId}
        
        EF->>DB: Verify access rights
        Note over DB: event_participant<br/>payment_status = 'paid'
        
        DB-->>EF: Access granted
        
        %% 署名付きURL生成（期限付き）
        EF->>B2: Generate signed URL
        Note over B2: expires_in = 1 hour
        
        B2-->>EF: signed_media_url
        
        EF-->>M: 200 OK<br/>{post, signedUrl}
        
        M->>B2: Stream audio
        B2-->>M: Audio data
        M-->>U: アーカイブ再生開始
        
    else 未購入ユーザー
        EF-->>M: 200 OK<br/>{event, archivePostPreview}
        Note over M: media_url = null<br/>preview_url のみ
        
        M->>U: 購入促進UI表示
        Note over U,M: "アーカイブ視聴には<br/>参加登録が必要です"
        
        U->>M: 今すぐ購入ボタン
        M->>EF: POST /events/{eventId}/participate
        Note over M,EF: 決済フローへ
    end
```

## 6.6 エラーハンドリング

```mermaid
sequenceDiagram
    participant U as User
    participant M as Mobile App
    participant EF as Edge Function
    participant DB as Supabase DB
    
    %% 定員オーバー
    U->>M: イベント参加申込
    M->>EF: POST /events/{eventId}/participate
    
    EF->>DB: SELECT COUNT(*) participants
    DB-->>EF: count >= max_participants
    
    EF-->>M: 409 Conflict<br/>"定員に達しています"
    M-->>U: エラー表示
    
    %% 決済エラー
    U->>M: 決済処理中
    M->>ST: Payment process
    ST-->>M: Payment failed
    
    M->>EF: POST /events/{eventId}/cancel
    EF->>DB: DELETE FROM event_participant
    DB-->>EF: Deleted
    EF-->>M: 200 OK
    M-->>U: 決済エラー表示
    
    %% ライブルーム接続エラー
    U->>M: ワークショップ参加
    M->>LK: Connect WebRTC
    LK-->>M: Connection failed
    
    M->>U: 接続エラー表示
    M->>U: 再接続ボタン表示
```

## まとめ

イベント機能のシーケンス図では、以下の主要な機能フローを定義しました：

1. **イベント作成**
   - 通常イベントと音声ワークショップの作成フロー
   - 音声WSではライブルームを同時作成

2. **イベント参加・決済**
   - 無料イベントの即時参加
   - 有料イベントのStores.jp決済連携
   - Webhook経由での支払い確認

3. **イベント投稿紐付け**
   - 投稿作成時のイベント選択
   - 参加者への自動通知

4. **ライブルーム連携**
   - 購入者限定のアクセス制御
   - ホストと参加者の権限管理
   - WebRTC接続フロー

5. **アーカイブ視聴**
   - 自動アーカイブ生成
   - 購入者限定の視聴制御
   - 署名付きURLによるセキュアな配信

これらのフローにより、音声を中心としたワークショップやイベントの
開催から収益化までを一貫してサポートします。