# ストーリーズ機能シーケンス図

## 1. ストーリーズ一覧取得

```mermaid
sequenceDiagram
    actor User
    participant App
    participant API as Supabase Edge Function
    participant DB as PostgreSQL
    participant Storage as B2 + CDN

    User->>App: ストーリーズタブを開く
    App->>API: GET /stories
    
    Note over API: JWT検証
    
    API->>DB: SELECT stories WITH users<br/>WHERE expires_at > NOW()<br/>ORDER BY created_at DESC
    
    DB-->>API: ストーリーズデータ
    
    loop 各ストーリー画像
        API->>Storage: 画像URLの署名付きURL生成
        Storage-->>API: CDN URL
    end
    
    API-->>App: ストーリーズ一覧<br/>(user情報、画像URL、編集データ含む)
    
    App->>App: ストーリーズサークル表示<br/>(24時間以内の投稿を表示)
    
    User->>App: ストーリーをタップ
    App->>App: ストーリービューアを開く
```

## 2. ストーリー投稿（画像編集付き）

```mermaid
sequenceDiagram
    actor User
    participant App
    participant API as Supabase Edge Function
    participant DB as PostgreSQL
    participant Storage as B2 + CDN
    participant Function as Edge Function

    User->>App: ストーリー作成ボタンタップ
    App->>App: カメラ/ギャラリーを開く
    User->>App: 画像を選択/撮影
    
    App->>App: 画像編集画面を表示
    User->>App: 編集を適用<br/>(テキスト、スタンプ、位置情報)
    
    App->>App: 編集データをJSON形式で生成<br/>{text: [], stickers: [], location: {}}
    
    App->>API: POST /uploads/presigned<br/>{fileType: "story", contentType: "image/jpeg"}
    API-->>App: プリサインドURL + objectKey
    
    App->>Storage: 画像アップロード (PUT)
    Storage-->>App: アップロード完了
    
    App->>API: POST /stories<br/>{imageUrl, editData, location}
    
    Note over API: JWT検証
    
    API->>DB: BEGIN TRANSACTION
    
    API->>DB: INSERT INTO stories<br/>(user_id, image_url, edit_data,<br/>expires_at = NOW() + 24h)
    
    DB-->>API: ストーリーID
    
    API->>DB: COMMIT
    
    API->>Function: 24時間後の自動削除をスケジュール
    
    API-->>App: 作成されたストーリー
    
    App->>App: ストーリーズ一覧を更新
    App->>User: 投稿完了通知
```

## 3. ストーリー再投稿

```mermaid
sequenceDiagram
    actor User
    participant App
    participant API as Supabase Edge Function
    participant DB as PostgreSQL
    participant Storage as B2 + CDN

    User->>App: 他ユーザーのストーリーを閲覧中
    User->>App: 再投稿ボタンをタップ
    
    App->>App: 再投稿確認ダイアログ表示
    User->>App: 確認
    
    App->>API: POST /stories/{storyId}/repost
    
    Note over API: JWT検証
    
    API->>DB: SELECT story FROM stories<br/>WHERE id = {storyId}
    DB-->>API: 元ストーリーデータ
    
    alt ストーリーが存在しない or 期限切れ
        API-->>App: 404 Not Found
        App->>User: エラー表示
    else ストーリーが有効
        API->>DB: BEGIN TRANSACTION
        
        API->>DB: INSERT INTO stories<br/>(user_id, image_url, edit_data,<br/>is_repost = true,<br/>original_story_id = {storyId},<br/>expires_at = NOW() + 24h)
        
        DB-->>API: 新しいストーリーID
        
        API->>DB: 通知作成（元の投稿者へ）<br/>INSERT INTO notifications
        
        API->>DB: COMMIT
        
        API-->>App: 再投稿されたストーリー
        
        App->>App: ストーリーズ一覧を更新
        App->>User: 再投稿完了通知
    end
```

## 4. ストーリー削除

```mermaid
sequenceDiagram
    actor User
    participant App
    participant API as Supabase Edge Function
    participant DB as PostgreSQL
    participant Storage as B2 + CDN

    User->>App: 自分のストーリーを長押し
    App->>App: アクションメニュー表示
    User->>App: 削除を選択
    
    App->>App: 削除確認ダイアログ表示
    User->>App: 確認
    
    App->>API: DELETE /stories/{storyId}
    
    Note over API: JWT検証 & 所有者確認
    
    API->>DB: SELECT user_id FROM stories<br/>WHERE id = {storyId}
    DB-->>API: ストーリー情報
    
    alt 所有者でない場合
        API-->>App: 403 Forbidden
        App->>User: エラー表示
    else 所有者の場合
        API->>DB: BEGIN TRANSACTION
        
        API->>DB: DELETE FROM stories<br/>WHERE id = {storyId}
        
        API->>Storage: 画像削除リクエスト
        Storage-->>API: 削除完了
        
        API->>DB: COMMIT
        
        API-->>App: 204 No Content
        
        App->>App: ストーリーズ一覧から削除
        App->>User: 削除完了通知
    end
```

## 5. ストーリー閲覧・進行

```mermaid
sequenceDiagram
    actor User
    participant App
    participant API as Supabase Edge Function
    participant DB as PostgreSQL
    participant Analytics as Analytics

    User->>App: ストーリーサークルをタップ
    App->>App: ストーリービューア起動
    
    App->>App: 最初のストーリーを表示<br/>(プログレスバー開始)
    
    App->>Analytics: 閲覧イベント送信<br/>(story_id, viewer_id)
    
    Note over App: 5秒タイマー or タップで次へ
    
    alt ユーザーが画面をタップ
        User->>App: 画面右側をタップ
        App->>App: 次のストーリーへ進む
    else ユーザーが左側をタップ
        User->>App: 画面左側をタップ
        App->>App: 前のストーリーへ戻る
    else 5秒経過
        App->>App: 自動で次のストーリーへ
    end
    
    loop 各ストーリー表示時
        App->>App: プログレスバー更新
        App->>App: 画像と編集データを合成表示
        
        opt 位置情報がある場合
            App->>App: 位置情報を表示
        end
        
        opt 再投稿の場合
            App->>App: 元の投稿者情報を表示
        end
    end
    
    alt 最後のストーリーまで見た
        App->>App: 次のユーザーのストーリーへ
    else ユーザーが閉じる
        User->>App: 下にスワイプ or Xボタン
        App->>App: ビューアを閉じる
    end
```

## 6. 24時間自動削除

```mermaid
sequenceDiagram
    participant Cron as Cron Job
    participant Function as Edge Function
    participant DB as PostgreSQL
    participant Storage as B2 + CDN

    Note over Cron: 毎時実行
    
    Cron->>Function: トリガー実行
    
    Function->>DB: SELECT * FROM stories<br/>WHERE expires_at <= NOW()
    
    DB-->>Function: 期限切れストーリー一覧
    
    loop 各期限切れストーリー
        Function->>DB: BEGIN TRANSACTION
        
        Function->>DB: DELETE FROM stories<br/>WHERE id = {storyId}
        
        Function->>Storage: 画像削除リクエスト
        Storage-->>Function: 削除完了
        
        Function->>DB: COMMIT
        
        Function->>Function: ログ記録
    end
    
    Function-->>Cron: 処理完了<br/>(削除件数: N件)
```

## エラーハンドリング

### 画像アップロードエラー
- ネットワークエラー時はリトライ（最大3回）
- ファイルサイズ制限（10MB）を超えた場合はクライアント側でリサイズ
- サポートされない画像形式の場合はエラー表示

### 編集データの保存
- 編集中のデータは一時的にローカルストレージに保存
- アプリがクラッシュしても編集内容を復元可能

### 再投稿の制限
- 同じストーリーを同一ユーザーが複数回再投稿することを防止
- プライベートアカウントのストーリーは再投稿不可

## パフォーマンス最適化

### 画像の最適化
- アップロード前にクライアント側で画像をリサイズ（最大1920x1920）
- WebP形式への変換（サポートされている場合）
- CDNでの画像配信

### プリロード
- ストーリー閲覧中、次の2-3枚の画像を先読み
- スムーズな閲覧体験を提供

### キャッシュ戦略
- 閲覧したストーリーは一時的にメモリキャッシュ
- 24時間後に自動クリア