# ライブルーム機能シーケンス図

## 概要
本ドキュメントは、ライブルーム機能の詳細なシーケンス図を定義します。
LiveKit（WebRTC）を活用した音声配信機能の実装フローを示します。

## 1. ルーム作成・開始

```mermaid
sequenceDiagram
    participant U as ユーザー（ホスト）
    participant C as クライアント
    participant A as API Server
    participant DB as PostgreSQL
    participant LK as LiveKit Server
    participant CF as Cloudflare TURN

    U->>C: ライブルーム作成画面を開く
    C->>C: タイトル、最大登壇者数を入力
    U->>C: 「ルーム作成」ボタンをタップ
    
    C->>A: POST /live-rooms
    Note over C,A: {title, maxSpeakers: 10, isRecording: false}
    
    A->>DB: ルーム情報をINSERT
    Note over DB: LIVE_ROOM テーブル
    
    A->>LK: ルーム作成API呼び出し
    LK-->>A: room_name返却
    
    A->>DB: livekit_room_nameを更新
    A-->>C: LiveRoom object (status: waiting)
    
    C->>C: ルーム待機画面を表示
    U->>C: 「配信開始」ボタンをタップ
    
    C->>A: POST /live-rooms/{roomId}/start
    A->>DB: statusをliveに更新
    A->>DB: started_atを記録
    
    A->>LK: ホスト用トークン生成
    Note over A,LK: canPublish: true, canSubscribe: true
    LK-->>A: JWT Token返却
    
    A-->>C: 200 OK
    C->>A: POST /live-rooms/{roomId}/join
    A-->>C: {token, url}
    
    C->>CF: TURN/STUN接続確立
    CF-->>C: ICE候補返却
    
    C->>LK: WebRTC接続（トークン付き）
    LK-->>C: 接続確立
    
    C->>C: マイク権限取得
    C->>LK: 音声ストリーム送信開始
    
    C->>C: ライブ配信画面表示
    Note over C: 登壇者リスト、チャット、ギフト表示
```

## 2. ルーム参加（リスナー）

```mermaid
sequenceDiagram
    participant U as ユーザー（リスナー）
    participant C as クライアント
    participant A as API Server
    participant DB as PostgreSQL
    participant LK as LiveKit Server
    participant P as プッシュ通知

    Note over U: Deep-Linkまたは一覧から参加
    U->>C: ルームに参加（kanushi://room/{id}）
    
    C->>A: GET /live-rooms/{roomId}
    A->>DB: ルーム情報取得
    A-->>C: LiveRoom object
    
    alt ルームがライブ中
        C->>A: POST /live-rooms/{roomId}/join
        
        A->>DB: ROOM_PARTICIPANTにINSERT
        Note over DB: role: listener
        
        A->>LK: リスナー用トークン生成
        Note over A,LK: canPublish: false, canSubscribe: true
        LK-->>A: JWT Token返却
        
        A-->>C: {token, url}
        
        C->>LK: WebRTC接続（トークン付き）
        LK-->>C: 接続確立
        
        C->>LK: 音声ストリーム受信開始
        LK-->>C: ホスト/スピーカーの音声
        
        C->>C: 再生開始
        
        par チャット履歴取得
            C->>A: GET /live-rooms/{roomId}/chat
            A->>DB: ROOM_CHATから取得
            A-->>C: チャット履歴
        and 参加者リスト取得
            C->>LK: 参加者リスト要求
            LK-->>C: 現在の参加者
        end
        
        C->>C: ライブ視聴画面表示
    else ルームが終了済み
        C->>C: 終了メッセージ表示
        
        opt アーカイブが存在
            C->>A: GET /posts?roomId={roomId}
            A-->>C: アーカイブ投稿
            C->>C: 投稿再生画面へ遷移
        end
    end
```

## 3. 登壇リクエスト・承認

```mermaid
sequenceDiagram
    participant L as リスナー
    participant LC as リスナーClient
    participant A as API Server
    participant DB as PostgreSQL
    participant HC as ホストClient
    participant H as ホスト
    participant LK as LiveKit Server
    participant P as プッシュ通知

    L->>LC: 「登壇リクエスト」ボタンをタップ
    LC->>A: POST /live-rooms/{roomId}/request-speaker
    
    A->>DB: 登壇リクエストを記録
    Note over DB: pending_speakers テーブル
    
    A->>P: ホストへプッシュ通知
    P-->>HC: 「登壇リクエストがあります」
    
    A-->>LC: 200 OK
    LC->>LC: リクエスト送信済み表示
    
    HC->>HC: リクエスト通知を表示
    H->>HC: リクエストを確認
    
    alt 承認する場合
        H->>HC: 「承認」ボタンをタップ
        HC->>A: POST /live-rooms/{roomId}/approve-speaker
        Note over HC,A: {userId: リスナーID}
        
        A->>DB: ROOM_PARTICIPANTのroleを更新
        Note over DB: role: listener → speaker
        
        A->>LK: 新しいトークン生成
        Note over A,LK: canPublish: true, canSubscribe: true
        LK-->>A: JWT Token返却
        
        A->>P: リスナーへプッシュ通知
        P-->>LC: 「登壇が承認されました」
        
        A-->>HC: 200 OK
        
        LC->>A: POST /live-rooms/{roomId}/join
        Note over LC,A: 新しいトークンで再接続
        A-->>LC: {token, url}
        
        LC->>LK: WebRTC再接続（スピーカー権限）
        LK-->>LC: 接続確立
        
        LC->>LC: マイク権限取得
        LC->>LK: 音声ストリーム送信開始
        
        LC->>LC: スピーカー画面に切替
        
        LK->>HC: 参加者更新通知
        HC->>HC: スピーカーリスト更新
    else 拒否する場合
        H->>HC: 「拒否」ボタンをタップ
        HC->>A: DELETE /live-rooms/{roomId}/speaker-request/{userId}
        
        A->>DB: リクエスト削除
        A-->>HC: 200 OK
        
        Note over LC: リスナーのまま継続
    end
```

## 4. ルームチャット・URL共有・ピン留め

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant C as クライアント
    participant A as API Server
    participant DB as PostgreSQL
    participant WS as WebSocket
    participant AI as AI Service

    Note over U,C: チャット送信
    U->>C: メッセージを入力
    U->>C: 「送信」ボタンをタップ
    
    C->>A: POST /live-rooms/{roomId}/chat
    Note over C,A: {content: "メッセージ"}
    
    A->>DB: ROOM_CHATにINSERT
    A->>WS: ブロードキャスト
    Note over WS: room:{roomId}チャンネル
    
    A-->>C: RoomChat object
    WS-->>C: リアルタイム通知（全参加者）
    C->>C: チャットを表示
    
    Note over U,C: URL共有
    U->>C: URLを含むメッセージを入力
    C->>C: URLを自動検出
    C->>C: プレビューカード生成
    
    U->>C: 「送信」ボタンをタップ
    C->>A: POST /live-rooms/{roomId}/chat
    Note over C,A: {content: "これ見て", sharedUrl: "https://..."}
    
    A->>DB: ROOM_CHATにINSERT
    A->>WS: ブロードキャスト
    A-->>C: RoomChat object
    
    Note over U,C: ピン留め（ホストのみ）
    alt ホストの場合
        U->>C: チャットメッセージを長押し
        C->>C: メニュー表示
        U->>C: 「ピン留め」を選択
        
        C->>A: PUT /live-rooms/{roomId}/chat/{chatId}/pin
        
        A->>DB: is_pinnedをtrueに更新
        Note over DB: 既存のピンは解除
        
        A->>WS: ピン留め通知
        A-->>C: 200 OK
        
        WS-->>C: ピン留め更新（全参加者）
        C->>C: ピン留めメッセージを最上部表示
    end
    
    Note over U,C: ホスト固定メッセージ
    alt ホストの場合
        U->>C: 「お知らせ」ボタンをタップ
        C->>C: 固定メッセージ入力ダイアログ
        U->>C: メッセージ入力・確定
        
        C->>A: POST /live-rooms/{roomId}/announcement
        A->>DB: 固定メッセージ更新
        A->>WS: お知らせ更新通知
        
        WS-->>C: お知らせ表示（全参加者）
    end
```

## 5. 録音・投稿化

```mermaid
sequenceDiagram
    participant H as ホスト
    participant HC as ホストClient
    participant A as API Server
    participant DB as PostgreSQL
    participant LK as LiveKit Server
    participant B2 as Backblaze B2
    participant EF as Edge Function

    Note over H,HC: ライブ配信中
    H->>HC: 「配信終了」ボタンをタップ
    HC->>HC: 終了確認ダイアログ表示
    
    alt 録音を投稿化する
        H->>HC: 「録音を投稿として保存」をチェック
        H->>HC: 「終了」を確定
        
        HC->>A: POST /live-rooms/{roomId}/end
        Note over HC,A: {createPost: true}
        
        A->>LK: 録音停止・取得API
        LK-->>A: 録音ファイルURL（一時）
        
        A->>EF: 音声処理Edge Function呼び出し
        Note over A,EF: 音質向上、波形生成
        
        EF->>B2: 処理済み音声アップロード
        B2-->>EF: 永続URL
        
        EF->>B2: 波形データアップロード
        B2-->>EF: 波形URL
        
        EF-->>A: {audioUrl, waveformUrl, duration}
        
        A->>DB: POSTテーブルにINSERT
        Note over DB: content_type: audio
        Note over DB: タイトル = ルームタイトル
        
        A->>DB: LIVE_ROOMを更新
        Note over DB: status: ended, post_id設定
        
        A->>DB: AI処理キューに追加
        Note over DB: 音声要約生成用
        
        A-->>HC: 200 OK + post_id
        
        HC->>HC: 投稿作成完了通知
        HC->>HC: 投稿編集画面へ遷移オプション
        
        par バックグラウンドAI処理
            A->>AI: 音声要約生成
            AI-->>A: 要約テキスト
            A->>DB: ai_metadataを更新
        end
    else 録音を破棄する
        H->>HC: 「終了」を確定（チェックなし）
        
        HC->>A: POST /live-rooms/{roomId}/end
        Note over HC,A: {createPost: false}
        
        A->>LK: ルーム終了通知
        A->>DB: LIVE_ROOMを更新
        Note over DB: status: ended
        
        A-->>HC: 200 OK
    end
    
    HC->>LK: WebRTC切断
    HC->>HC: ホーム画面へ遷移
```

## 6. Deep-Link生成・共有

```mermaid
sequenceDiagram
    participant H as ホスト
    participant HC as ホストClient
    participant A as API Server
    participant DB as PostgreSQL
    participant S as 共有システム
    participant G as ゲスト
    participant GC as ゲストClient

    Note over H,HC: ライブ配信中
    H->>HC: 「共有」ボタンをタップ
    
    HC->>A: GET /live-rooms/{roomId}/share-info
    A->>DB: ルーム情報取得
    
    A->>A: Deep-Link生成
    Note over A: kanushi://room/{roomId}
    Note over A: https://app.kanushi.tld/room/{roomId}
    
    A-->>HC: 共有情報
    Note over HC: {deepLink, universalLink, title, host}
    
    HC->>HC: 共有シート表示
    H->>HC: 共有方法を選択
    
    alt コピー
        HC->>HC: クリップボードにコピー
        HC->>HC: コピー完了通知
    else SNSシェア
        HC->>S: システム共有API
        Note over S: タイトル + URL + #kanushi
        S->>S: 各SNSアプリへ
    else QRコード
        HC->>HC: QRコード生成・表示
        Note over HC: Universal Link埋め込み
    end
    
    Note over G: リンクを受信
    G->>GC: リンクをタップ
    
    alt アプリインストール済み
        GC->>GC: Deep-Link処理
        GC->>GC: kanushi://room/{roomId}を解析
        
        GC->>A: GET /live-rooms/{roomId}
        A-->>GC: ルーム情報
        
        GC->>GC: ルーム参加画面表示
        Note over GC: シーケンス2へ
    else アプリ未インストール
        G->>GC: ブラウザで開く
        GC->>A: GET https://app.kanushi.tld/room/{roomId}
        
        A->>A: User-Agent判定
        alt iOS
            A-->>GC: App Storeへリダイレクト
        else Android
            A-->>GC: Google Playへリダイレクト
        else その他
            A-->>GC: Webプレビュー表示
            Note over GC: インストール促進バナー付き
        end
    end
```

## 7. ギフト送信（ライブルーム）

```mermaid
sequenceDiagram
    participant U as ユーザー（送信者）
    participant C as クライアント
    participant A as API Server
    participant DB as PostgreSQL
    participant ST as Stores.jp(Payge)
    participant WS as WebSocket
    participant HC as ホストClient
    participant H as ホスト

    U->>C: ギフトボタンをタップ
    C->>C: ギフト選択UI表示
    Note over C: 300円、600円、1200円
    
    U->>C: 金額を選択
    U->>C: メッセージ入力（任意）
    U->>C: 「送信」をタップ
    
    C->>A: POST /live-rooms/{roomId}/gift
    Note over C,A: {amount: 600, message: "応援してます！"}
    
    A->>DB: GIFTテーブルに仮INSERT
    Note over DB: status: pending
    
    A->>ST: 決済リクエスト作成
    Note over A,ST: amount, metadata: {giftId, roomId}
    ST-->>A: 決済URL
    
    A-->>C: {paymentUrl, giftId}
    C->>C: 決済画面表示（WebView）
    
    U->>C: 決済情報入力・確定
    C->>ST: 決済実行
    ST->>ST: カード決済処理
    
    ST->>A: Webhook通知
    Note over ST,A: payment_intent.succeeded
    
    A->>DB: GIFT更新
    Note over DB: status: completed
    Note over DB: stores_payment_id記録
    
    A->>DB: 手数料計算
    Note over DB: platform_fee: 8%
    Note over DB: creator_amount: 92%
    
    A->>WS: ギフト通知
    Note over WS: room:{roomId}チャンネル
    
    WS-->>C: ギフトアニメーション
    C->>C: ギフトエフェクト表示
    
    WS-->>HC: ギフト受信通知
    HC->>HC: ギフト通知表示
    Note over HC: 送信者名、金額、メッセージ
    
    H->>HC: 通知を確認
    HC->>HC: お礼メッセージ送信UI
    
    opt お礼を送る
        H->>HC: お礼メッセージ入力
        HC->>A: POST /live-rooms/{roomId}/chat
        Note over HC,A: {content: "@{username} ギフトありがとう！"}
        
        A->>WS: チャットブロードキャスト
        WS-->>C: お礼メッセージ表示
    end
```

## エラーハンドリング

```mermaid
sequenceDiagram
    participant C as クライアント
    participant A as API Server
    participant LK as LiveKit Server

    Note over C,A: 接続エラー
    C->>LK: WebRTC接続試行
    LK-->>C: 接続失敗
    
    C->>C: 再接続試行（3回まで）
    alt 再接続成功
        C->>LK: 接続確立
        C->>C: 通常フローへ
    else 再接続失敗
        C->>C: エラーメッセージ表示
        C->>A: POST /live-rooms/{roomId}/leave
        C->>C: ルーム一覧へ戻る
    end
    
    Note over C,A: 権限エラー
    C->>A: POST /live-rooms/{roomId}/approve-speaker
    A-->>C: 403 Forbidden
    C->>C: 権限エラー表示
    
    Note over C,A: ルーム満員
    C->>A: POST /live-rooms/{roomId}/request-speaker
    A-->>C: 400 Bad Request
    Note over C: "登壇者数が上限に達しています"
    C->>C: エラーメッセージ表示
```

## セキュリティ考慮事項

1. **JWT トークン**
   - 有効期限: 6時間
   - ルームID、ユーザーID、権限を含む
   - サーバーサイドで生成

2. **権限管理**
   - ホストのみ: 登壇承認、ピン留め、配信終了
   - スピーカー: 音声送信、チャット
   - リスナー: 音声受信、チャット、登壇リクエスト

3. **レート制限**
   - チャット送信: 10メッセージ/分
   - 登壇リクエスト: 1回/ルーム
   - ギフト送信: 決済完了後のみ

4. **録音データ**
   - 暗号化してB2に保存
   - ホストのみダウンロード可能
   - 投稿化しない場合は7日後に自動削除