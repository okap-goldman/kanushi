# グループ機能シーケンス図

## 概要
グループ機能は、最大100名までのメンバーで構成されるコミュニティ機能を提供します。
無料グループと有料（月額サブスクリプション）グループの2種類があり、
チャット、グループ専用タイムライン、メンバー管理機能を持ちます。

## 1. グループ作成

### 1.1 無料グループ作成

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Supabase
    participant DB as Database

    C->>S: POST /groups
    Note over C,S: {name, description, groupType: "free"}
    
    S->>S: JWT検証
    S->>S: バリデーション
    
    S->>DB: BEGIN TRANSACTION
    
    S->>DB: INSERT INTO GROUP
    Note over DB: ownerUserId, name, description<br/>groupType: "free", memberLimit: 100
    
    S->>DB: INSERT INTO GROUP_MEMBER
    Note over DB: groupId, userId (owner)<br/>role: "owner", status: "active"
    
    S->>DB: COMMIT
    
    S-->>C: 201 Created
    Note over C: グループ情報
```

### 1.2 有料グループ作成

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Supabase
    participant DB as Database
    participant ST as Stores.jp

    C->>S: POST /groups
    Note over C,S: {name, description, groupType: "subscription",<br/>subscriptionPrice: 1000}
    
    S->>S: JWT検証
    S->>S: バリデーション
    
    S->>ST: 商品作成API
    Note over ST: 月額サブスク商品を作成
    
    ST-->>S: storesPriceId
    
    S->>DB: BEGIN TRANSACTION
    
    S->>DB: INSERT INTO GROUP
    Note over DB: ownerUserId, name, description<br/>groupType: "subscription"<br/>subscriptionPrice: 1000<br/>storesPriceId
    
    S->>DB: INSERT INTO GROUP_MEMBER
    Note over DB: groupId, userId (owner)<br/>role: "owner", status: "active"
    
    S->>DB: COMMIT
    
    S-->>C: 201 Created
    Note over C: グループ情報
```

## 2. メンバー参加・退出

### 2.1 無料グループへの参加

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Supabase
    participant DB as Database
    participant N as Notification

    C->>S: POST /groups/{groupId}/join
    
    S->>S: JWT検証
    
    S->>DB: SELECT * FROM GROUP WHERE id = {groupId}
    DB-->>S: グループ情報
    
    S->>S: グループタイプ確認（free）
    
    S->>DB: SELECT COUNT(*) FROM GROUP_MEMBER<br/>WHERE group_id = {groupId} AND status = 'active'
    DB-->>S: 現在のメンバー数
    
    alt メンバー数 >= 100
        S-->>C: 400 Bad Request
        Note over C: メンバー数上限エラー
    else メンバー数 < 100
        S->>DB: INSERT INTO GROUP_MEMBER
        Note over DB: groupId, userId<br/>role: "member", status: "active"
        
        S->>N: 通知送信
        Note over N: グループオーナーへ<br/>新規メンバー参加通知
        
        S-->>C: 201 Created
        Note over C: メンバー情報
    end
```

### 2.2 有料グループへの参加（サブスク決済）

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Supabase
    participant DB as Database
    participant ST as Stores.jp
    participant W as Webhook<br/>Endpoint

    C->>S: POST /groups/{groupId}/join
    
    S->>S: JWT検証
    
    S->>DB: SELECT * FROM GROUP WHERE id = {groupId}
    DB-->>S: グループ情報（subscription, storesPriceId）
    
    S->>S: グループタイプ確認（subscription）
    
    S->>DB: SELECT COUNT(*) FROM GROUP_MEMBER<br/>WHERE group_id = {groupId} AND status = 'active'
    DB-->>S: 現在のメンバー数
    
    alt メンバー数 >= 100
        S-->>C: 400 Bad Request
        Note over C: メンバー数上限エラー
    else メンバー数 < 100
        S->>ST: サブスク決済URL生成
        Note over ST: storesPriceId使用
        
        ST-->>S: 決済URL
        
        S-->>C: 402 Payment Required
        Note over C: {paymentUrl: "https://stores.jp/..."}
        
        Note over C: ユーザーが決済画面へ遷移
        
        C->>ST: 決済実行
        
        ST->>W: Webhook通知
        Note over W: 決済完了通知
        
        W->>DB: INSERT INTO GROUP_MEMBER
        Note over DB: groupId, userId<br/>role: "member", status: "active"<br/>storesSubscriptionId
        
        W->>DB: 通知レコード作成
        Note over DB: グループオーナーへ<br/>新規有料メンバー参加通知
    end
```

### 2.3 グループ退出

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Supabase
    participant DB as Database
    participant ST as Stores.jp

    C->>S: POST /groups/{groupId}/leave
    
    S->>S: JWT検証
    
    S->>DB: SELECT * FROM GROUP_MEMBER<br/>WHERE group_id = {groupId} AND user_id = {userId}
    DB-->>S: メンバー情報
    
    alt メンバーが存在しない
        S-->>C: 404 Not Found
    else メンバーが存在
        alt オーナーの場合
            S-->>C: 403 Forbidden
            Note over C: オーナーは退出不可
        else 一般メンバーの場合
            S->>DB: UPDATE GROUP_MEMBER<br/>SET status = 'left', left_at = NOW()
            
            alt 有料メンバーの場合
                S->>ST: サブスク解約API
                Note over ST: storesSubscriptionId使用
            end
            
            S-->>C: 200 OK
        end
    end
```

## 3. グループチャット

### 3.1 チャットメッセージ送信

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Supabase
    participant DB as Database
    participant B2 as Backblaze B2
    participant R as Realtime

    C->>S: POST /groups/{groupId}/messages
    Note over C,S: multipart/form-data<br/>{messageType, textContent?, file?}
    
    S->>S: JWT検証
    
    S->>DB: SELECT * FROM GROUP_MEMBER<br/>WHERE group_id = {groupId} AND user_id = {userId}
    DB-->>S: メンバー情報
    
    alt メンバーでない or status != 'active'
        S-->>C: 403 Forbidden
    else アクティブメンバー
        alt messageType = "text"
            S->>DB: INSERT INTO GROUP_CHAT
            Note over DB: groupId, userId<br/>messageType: "text"<br/>textContent
        else messageType = "image" or "audio"
            S->>B2: ファイルアップロード
            B2-->>S: mediaUrl
            
            S->>DB: INSERT INTO GROUP_CHAT
            Note over DB: groupId, userId<br/>messageType, mediaUrl
        end
        
        S->>R: Realtime通知
        Note over R: グループメンバー全員へ<br/>新規メッセージ通知
        
        S-->>C: 201 Created
        Note over C: メッセージ情報
    end
```

### 3.2 チャット履歴取得

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Supabase
    participant DB as Database

    C->>S: GET /groups/{groupId}/messages?cursor={cursor}
    
    S->>S: JWT検証
    
    S->>DB: SELECT * FROM GROUP_MEMBER<br/>WHERE group_id = {groupId} AND user_id = {userId}
    DB-->>S: メンバー情報
    
    alt メンバーでない
        S-->>C: 403 Forbidden
    else メンバー
        S->>DB: SELECT gc.*, p.display_name, p.profile_image_url<br/>FROM GROUP_CHAT gc<br/>JOIN PROFILE p ON gc.user_id = p.id<br/>WHERE gc.group_id = {groupId}<br/>ORDER BY gc.created_at DESC<br/>LIMIT 50
        DB-->>S: チャットメッセージ一覧
        
        S-->>C: 200 OK
        Note over C: {messages: [...], nextCursor}
    end
```

## 4. グループタイムライン

### 4.1 グループ投稿作成

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Supabase
    participant DB as Database
    participant B2 as Backblaze B2
    participant E as Edge Function

    C->>S: POST /groups/{groupId}/posts
    Note over C,S: multipart/form-data<br/>{contentType, textContent?, file?}
    
    S->>S: JWT検証
    
    S->>DB: SELECT * FROM GROUP_MEMBER<br/>WHERE group_id = {groupId} AND user_id = {userId}
    DB-->>S: メンバー情報
    
    alt メンバーでない or status != 'active'
        S-->>C: 403 Forbidden
    else アクティブメンバー
        alt contentType = "text"
            S->>DB: INSERT INTO POST
            Note over DB: userId, groupId<br/>contentType: "text"<br/>textContent
        else contentType = "image" or "audio"
            S->>B2: ファイルアップロード
            B2-->>S: mediaUrl
            
            alt contentType = "audio"
                S->>E: 音声処理
                Note over E: 波形生成、プレビュー作成
                E-->>S: waveformUrl, previewUrl
            end
            
            S->>DB: INSERT INTO POST
            Note over DB: userId, groupId<br/>contentType, mediaUrl<br/>waveformUrl?, previewUrl?
        end
        
        S->>DB: 通知レコード作成
        Note over DB: グループメンバー全員へ<br/>新規投稿通知
        
        S-->>C: 201 Created
        Note over C: 投稿情報
    end
```

### 4.2 グループ投稿取得

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Supabase
    participant DB as Database

    C->>S: GET /groups/{groupId}/posts?cursor={cursor}
    
    S->>S: JWT検証
    
    S->>DB: SELECT * FROM GROUP_MEMBER<br/>WHERE group_id = {groupId} AND user_id = {userId}
    DB-->>S: メンバー情報
    
    alt メンバーでない
        S-->>C: 403 Forbidden
    else メンバー
        S->>DB: SELECT p.*, pr.display_name, pr.profile_image_url,<br/>(SELECT COUNT(*) FROM LIKE WHERE post_id = p.id) as like_count,<br/>(SELECT COUNT(*) FROM COMMENT WHERE post_id = p.id) as comment_count<br/>FROM POST p<br/>JOIN PROFILE pr ON p.user_id = pr.id<br/>WHERE p.group_id = {groupId} AND p.deleted_at IS NULL<br/>ORDER BY p.created_at DESC<br/>LIMIT 20
        DB-->>S: 投稿一覧
        
        S-->>C: 200 OK
        Note over C: {posts: [...], nextCursor}
    end
```

## 5. メンバー管理

### 5.1 メンバー一覧取得

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Supabase
    participant DB as Database

    C->>S: GET /groups/{groupId}/members?cursor={cursor}
    
    S->>S: JWT検証
    
    S->>DB: SELECT * FROM GROUP_MEMBER<br/>WHERE group_id = {groupId} AND user_id = {userId}
    DB-->>S: メンバー情報
    
    alt メンバーでない
        S-->>C: 403 Forbidden
    else メンバー
        S->>DB: SELECT gm.*, p.display_name, p.profile_image_url<br/>FROM GROUP_MEMBER gm<br/>JOIN PROFILE p ON gm.user_id = p.id<br/>WHERE gm.group_id = {groupId} AND gm.status = 'active'<br/>ORDER BY gm.joined_at DESC<br/>LIMIT 50
        DB-->>S: メンバー一覧
        
        S-->>C: 200 OK
        Note over C: {members: [...], nextCursor}
    end
```

### 5.2 メンバー除名（オーナー権限）

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Supabase
    participant DB as Database
    participant ST as Stores.jp

    C->>S: DELETE /groups/{groupId}/members/{targetUserId}
    
    S->>S: JWT検証
    
    S->>DB: SELECT * FROM GROUP_MEMBER<br/>WHERE group_id = {groupId} AND user_id = {userId}
    DB-->>S: 操作者のメンバー情報
    
    alt 操作者がオーナーでない
        S-->>C: 403 Forbidden
    else 操作者がオーナー
        S->>DB: SELECT * FROM GROUP_MEMBER<br/>WHERE group_id = {groupId} AND user_id = {targetUserId}
        DB-->>S: 対象メンバー情報
        
        alt 対象がオーナー
            S-->>C: 403 Forbidden
            Note over C: オーナーは除名不可
        else 対象が一般メンバー
            S->>DB: UPDATE GROUP_MEMBER<br/>SET status = 'removed', left_at = NOW()
            
            alt 有料メンバーの場合
                S->>ST: サブスク解約API
                Note over ST: storesSubscriptionId使用
            end
            
            S->>DB: 通知レコード作成
            Note over DB: 除名されたユーザーへ通知
            
            S-->>C: 204 No Content
        end
    end
```

## 6. グループ情報更新

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Supabase
    participant DB as Database

    C->>S: PUT /groups/{groupId}
    Note over C,S: {name?, description?, memberLimit?}
    
    S->>S: JWT検証
    
    S->>DB: SELECT * FROM GROUP_MEMBER<br/>WHERE group_id = {groupId} AND user_id = {userId}
    DB-->>S: メンバー情報
    
    alt 操作者がオーナーでない
        S-->>C: 403 Forbidden
    else 操作者がオーナー
        S->>S: バリデーション
        Note over S: memberLimit: 1-100
        
        alt memberLimitが現在のメンバー数より少ない
            S-->>C: 400 Bad Request
            Note over C: メンバー数制限エラー
        else
            S->>DB: UPDATE GROUP<br/>SET name = ?, description = ?, member_limit = ?
            
            S-->>C: 200 OK
            Note over C: 更新後のグループ情報
        end
    end
```

## エラーケース

### 権限エラー
- グループメンバーでない場合の操作
- オーナー権限が必要な操作を一般メンバーが実行
- オーナーの退出・除名

### 制限エラー
- メンバー数上限（100名）超過
- 有料グループの決済失敗
- サブスクリプション解約失敗

### データ整合性
- 存在しないグループIDへのアクセス
- 削除済みメンバーの操作
- トランザクション失敗時のロールバック

## セキュリティ考慮事項

1. **アクセス制御**
   - グループメンバーのみがコンテンツにアクセス可能
   - オーナー権限の適切な管理

2. **決済セキュリティ**
   - Stores.jp Webhookの署名検証
   - 決済情報の暗号化

3. **データプライバシー**
   - グループチャットのE2E暗号化（将来実装）
   - 退出・除名後のデータアクセス制限

4. **レート制限**
   - メッセージ送信頻度の制限
   - グループ作成数の制限