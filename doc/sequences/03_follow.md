# フォロー機能シーケンス図

## 1. ファミリーフォロー（理由入力必須）

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL
    participant Push as FCM

    User->>App: プロフィール画面表示
    App->>API: GET /users/{userId}
    API->>DB: ユーザー情報取得
    DB->>API: ユーザーデータ
    
    API->>DB: フォロー状態確認
    note right of DB: SELECT * FROM follows<br/>WHERE follower_id = current_user<br/>AND followee_id = target_user<br/>AND status = 'active'
    
    DB->>API: フォロー状態
    API->>App: ユーザー情報 + フォロー状態
    App->>User: プロフィール表示
    
    User->>App: ファミリーフォローボタンタップ
    App->>User: フォロー理由入力ダイアログ表示
    note right of User: ファミリーフォローは<br/>理由入力が必須
    
    User->>App: 理由テキスト入力
    App->>App: バリデーション
    note right of App: 理由が空でないか確認
    
    User->>App: フォローボタンタップ
    App->>API: POST /follows
    note right of API: {<br/>  followeeId: "xxx",<br/>  followType: "family",<br/>  followReason: "理由テキスト"<br/>}
    
    API->>DB: 既存フォロー確認
    DB->>API: フォロー状態
    
    alt 未フォロー
        API->>DB: INSERT INTO follows
        note right of DB: follow_type = 'family'<br/>status = 'active'<br/>follow_reason = '理由'
        
        DB->>API: フォローID
        
        API->>DB: フォロワー通知設定確認
        note right of DB: SELECT * FROM notification_settings<br/>WHERE user_id = followee_id<br/>AND notification_type = 'follow'
        
        DB->>API: 通知設定
        
        alt フォロー通知ON
            API->>DB: FCMトークン取得
            DB->>API: FCMトークン
            
            API->>Push: プッシュ通知送信
            note right of Push: "○○さんがあなたを<br/>ファミリーフォローしました"
            
            Push->>User: プッシュ通知
        end
        
        API->>DB: INSERT INTO notifications
        note right of DB: 通知履歴保存
        
        API->>App: 201 Created (Follow)
        App->>User: フォロー完了表示
        App->>App: UIを「フォロー中」に更新
        
    else 既にフォロー済み
        API->>App: 409 Conflict
        App->>User: エラー表示
    end
```

## 2. ウォッチフォロー（理由不要）

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL
    participant Push as FCM

    User->>App: プロフィール画面
    User->>App: ウォッチフォローボタンタップ
    note right of User: ウォッチフォローは<br/>理由入力不要
    
    App->>App: UI即時更新（楽観的更新）
    
    App->>API: POST /follows
    note right of API: {<br/>  followeeId: "xxx",<br/>  followType: "watch",<br/>  followReason: null<br/>}
    
    API->>DB: 既存フォロー確認
    DB->>API: フォロー状態
    
    alt 未フォロー
        API->>DB: INSERT INTO follows
        note right of DB: follow_type = 'watch'<br/>status = 'active'<br/>follow_reason = NULL
        
        DB->>API: フォローID
        
        API->>DB: フォロワー通知設定確認
        DB->>API: 通知設定
        
        alt フォロー通知ON
            API->>Push: プッシュ通知送信
            note right of Push: "○○さんがあなたを<br/>ウォッチフォローしました"
        end
        
        API->>DB: INSERT INTO notifications
        
        API->>App: 201 Created (Follow)
        App->>User: フォロー完了
        
    else 既にフォロー済み
        API->>App: 409 Conflict
        App->>App: UI元に戻す
        App->>User: エラー表示
    end
```

## 3. アンフォロー処理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL

    User->>App: プロフィール画面
    note right of User: フォロー中のユーザー
    
    User->>App: フォロー中ボタン長押し
    App->>User: アクションメニュー表示
    User->>App: アンフォローを選択
    
    App->>User: アンフォロー理由入力ダイアログ
    note right of User: アンフォロー理由は任意
    
    alt 理由入力あり
        User->>App: 理由入力
    else 理由入力なし
        User->>App: スキップ
    end
    
    User->>App: アンフォロー確定
    
    App->>API: GET /follows?followeeId={userId}
    note right of API: 現在のフォロー情報取得
    
    API->>DB: SELECT フォロー情報
    DB->>API: フォローデータ
    API->>App: フォロー情報（followId含む）
    
    App->>API: DELETE /follows/{followId}
    note right of API: {<br/>  unfollowReason: "理由" or null<br/>}
    
    API->>DB: フォロー所有者確認
    note right of DB: follower_id = current_user
    
    alt 所有者一致
        API->>DB: UPDATE follows
        note right of DB: status = 'unfollowed'<br/>unfollowed_at = NOW()<br/>unfollow_reason = '理由'
        
        DB->>API: 更新完了
        
        note right of DB: 論理削除として<br/>履歴を保持
        
        API->>App: 204 No Content
        App->>App: UIを「フォローする」に更新
        App->>User: アンフォロー完了
        
    else 所有者不一致
        API->>App: 403 Forbidden
        App->>User: エラー表示
    end
```

## 4. フォロワー一覧取得

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL

    User->>App: フォロワータブタップ
    App->>API: GET /users/{userId}/followers
    note right of API: ページネーション対応<br/>?cursor=xxx&limit=20
    
    API->>DB: フォロワー取得
    note right of DB: SELECT * FROM follows f<br/>JOIN profiles p ON f.follower_id = p.id<br/>WHERE f.followee_id = user_id<br/>AND f.status = 'active'<br/>ORDER BY f.created_at DESC
    
    DB->>API: フォロワーリスト
    
    API->>DB: 各フォロワーとの相互フォロー確認
    note right of DB: 現在のユーザーが<br/>各フォロワーをフォローしているか
    
    DB->>API: 相互フォロー状態
    
    API->>App: フォロワー一覧
    note right of API: {<br/>  items: [{<br/>    user: {...},<br/>    followType: "family/watch",<br/>    followReason: "...",<br/>    isFollowingBack: true/false,<br/>    createdAt: "..."<br/>  }],<br/>  nextCursor: "xxx"<br/>}
    
    App->>User: フォロワー一覧表示
    note right of User: ・ファミリー/ウォッチ区別<br/>・相互フォロー表示<br/>・フォロー理由表示
    
    User->>App: 下スクロール
    App->>API: GET /users/{userId}/followers?cursor=xxx
    API->>DB: 次のページ取得
    DB->>API: 追加フォロワー
    API->>App: 追加データ
    App->>User: 無限スクロール表示
```

## 5. フォロー中一覧取得

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL

    User->>App: フォロー中タブタップ
    
    alt ファミリータブ
        App->>API: GET /users/{userId}/following?type=family
    else ウォッチタブ
        App->>API: GET /users/{userId}/following?type=watch
    else 全体タブ
        App->>API: GET /users/{userId}/following
    end
    
    API->>DB: フォロー中ユーザー取得
    note right of DB: SELECT * FROM follows f<br/>JOIN profiles p ON f.followee_id = p.id<br/>WHERE f.follower_id = user_id<br/>AND f.status = 'active'<br/>AND f.follow_type = type(指定時)<br/>ORDER BY f.created_at DESC
    
    DB->>API: フォロー中リスト
    
    API->>DB: 各ユーザーの最新投稿取得
    note right of DB: 最新投稿1件を<br/>結合して取得
    
    DB->>API: 最新投稿データ
    
    API->>App: フォロー中一覧
    note right of API: {<br/>  items: [{<br/>    user: {...},<br/>    followType: "family/watch",<br/>    followReason: "...",<br/>    latestPost: {...},<br/>    createdAt: "..."<br/>  }],<br/>  nextCursor: "xxx"<br/>}
    
    App->>User: フォロー中一覧表示
    note right of User: ・フォロー理由表示<br/>・最新投稿プレビュー<br/>・タイプ別フィルタ
```

## 6. フォロー状態変更の通知処理

```mermaid
sequenceDiagram
    participant Follower as フォロワー
    participant App1 as フォロワーアプリ
    participant API as Supabase API
    participant DB as PostgreSQL
    participant Push as FCM
    participant App2 as 被フォローアプリ
    participant Followee as 被フォロー者

    Follower->>App1: フォローアクション
    App1->>API: POST /follows
    
    API->>DB: フォロー作成
    DB->>API: 成功
    
    par 通知処理
        API->>DB: 通知作成
        note right of DB: INSERT INTO notifications<br/>type = 'follow'<br/>data = {followerInfo, followType}
        
        API->>DB: FCMトークン取得
        DB->>API: FCMトークン
        
        API->>Push: プッシュ通知送信
        Push->>Followee: プッシュ通知受信
        
    and リアルタイム更新
        API->>DB: Realtime broadcast
        note right of DB: NOTIFY follow_change
        
        DB->>App2: Realtime event
        note right of App2: Supabase Realtime<br/>でサブスクライブ中
        
        App2->>App2: フォロワー数更新
        App2->>Followee: UIリアルタイム更新
    end
    
    Followee->>App2: 通知タップ
    App2->>API: GET /users/{followerId}
    API->>DB: フォロワー情報取得
    DB->>API: ユーザーデータ
    API->>App2: フォロワープロフィール
    App2->>Followee: プロフィール画面表示
```

## 7. フォロー推薦（将来拡張）

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL
    participant AI as AI分析

    User->>App: 発見タブ
    App->>API: GET /users/recommendations
    
    API->>DB: ユーザーの興味取得
    note right of DB: ・フォロー履歴<br/>・投稿内容<br/>・いいね/ハイライト履歴
    
    DB->>API: 興味データ
    
    API->>AI: 推薦リクエスト
    note right of AI: ・類似ユーザー分析<br/>・コンテンツ親和性<br/>・エンゲージメント予測
    
    AI->>API: 推薦ユーザーリスト
    
    API->>DB: 推薦ユーザー情報取得
    DB->>API: ユーザーデータ
    
    API->>App: 推薦一覧
    note right of API: {<br/>  items: [{<br/>    user: {...},<br/>    reason: "推薦理由",<br/>    score: 0.85,<br/>    commonFollowers: 3<br/>  }]<br/>}
    
    App->>User: おすすめユーザー表示
```

## エラーハンドリング

### フォロー制限

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL

    User->>App: 連続フォロー
    App->>API: POST /follows
    
    API->>DB: レート制限確認
    note right of DB: 1分間のフォロー数確認
    
    alt レート制限超過
        DB->>API: フォロー数超過
        API->>App: 429 Too Many Requests
        note right of API: {<br/>  title: "Rate Limit Exceeded",<br/>  detail: "1分間に20人まで",<br/>  retryAfter: 45<br/>}
        
        App->>User: 制限エラー表示
        App->>App: クールダウンタイマー
    else 制限内
        API->>DB: フォロー作成
        DB->>API: 成功
        API->>App: 201 Created
    end
```

### 相互フォロー制限（将来実装）

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL

    User->>App: フォローボタン
    App->>API: POST /follows
    
    API->>DB: ブロック状態確認
    note right of DB: 相手からブロック<br/>されていないか確認
    
    alt ブロックされている
        DB->>API: ブロック状態
        API->>App: 403 Forbidden
        note right of API: {<br/>  title: "Follow Restricted",<br/>  detail: "このユーザーをフォローできません"<br/>}
        
        App->>User: エラー表示
    else ブロックされていない
        API->>DB: フォロー作成
        DB->>API: 成功
        API->>App: 201 Created
    end
```