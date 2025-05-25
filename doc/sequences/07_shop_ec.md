# 7. ショップ・EC機能 - シーケンス図

## 7.1 商品出品フロー（物理商品/オンラインセッション/音声）

```mermaid
sequenceDiagram
    participant User as ユーザー（出品者）
    participant Client as クライアント
    participant API as API Server
    participant Storage as Storage (B2)
    participant DB as Database

    User->>Client: 商品出品画面を開く
    Client->>API: GET /profile
    API->>DB: ユーザー情報取得
    DB-->>API: ユーザー情報
    API-->>Client: 出品者プロフィール

    User->>Client: 商品情報入力
    Note over User,Client: タイトル、説明、商品タイプ<br/>価格、在庫数

    alt 画像アップロードの場合
        User->>Client: 商品画像選択
        Client->>Client: 画像リサイズ・最適化
    end

    User->>Client: 出品ボタンクリック
    Client->>API: POST /products (multipart/form-data)
    Note over API: {<br/>  title, description,<br/>  productType, price,<br/>  stock, image<br/>}

    API->>API: バリデーション
    
    alt 画像がある場合
        API->>Storage: 画像アップロード
        Storage-->>API: image_url
    end

    API->>DB: 商品情報保存
    Note over DB: PRODUCT テーブル
    DB-->>API: product_id

    API-->>Client: 201 Created (Product)
    Client-->>User: 出品完了通知
```

## 7.2 音声即時出品フロー（AI説明文生成）

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Client as クライアント
    participant API as API Server
    participant AI as AI Service (Gemini)
    participant Storage as Storage (B2)
    participant DB Database

    User->>Client: 音声投稿詳細画面
    User->>Client: 「出品」ボタンクリック
    
    Client->>Client: 価格入力ダイアログ表示
    User->>Client: 価格設定

    Client->>API: POST /products/from-post
    Note over API: {<br/>  postId,<br/>  price,<br/>  generateAiDescription: true<br/>}

    API->>DB: 投稿情報取得
    DB-->>API: 投稿詳細（音声URL、テキスト等）

    API->>AI: 商品説明文生成リクエスト
    Note over AI: 音声内容要約 +<br/>推奨視聴者タグ生成
    AI-->>API: AI生成説明文

    API->>Storage: プレビュー音声生成
    Note over Storage: 冒頭20-30秒切り出し<br/>音質向上処理
    Storage-->>API: preview_url

    API->>DB: 商品情報保存
    Note over DB: PRODUCT テーブル<br/>source_post_id紐付け
    DB-->>API: product_id

    API-->>Client: 201 Created (Product)
    Client->>Client: 商品詳細画面へ遷移
    Client-->>User: 出品完了（AI説明文付き）
```

## 7.3 カート機能フロー

```mermaid
sequenceDiagram
    participant User as ユーザー（購入者）
    participant Client as クライアント
    participant API as API Server
    participant DB as Database

    User->>Client: 商品詳細画面
    User->>Client: 「カートに追加」ボタン

    Client->>API: POST /cart/items
    Note over API: {<br/>  productId,<br/>  quantity<br/>}

    API->>DB: アクティブカート確認
    alt カートが存在しない場合
        API->>DB: 新規カート作成
        Note over DB: CART (status: active)
    end

    API->>DB: 在庫確認
    DB-->>API: 在庫数

    alt 在庫あり
        API->>DB: カートアイテム追加
        Note over DB: CART_ITEM テーブル
        DB-->>API: cart_item_id
        API-->>Client: 201 Created (CartItem)
        Client-->>User: カート追加成功通知
    else 在庫なし
        API-->>Client: 400 Bad Request
        Client-->>User: 在庫不足エラー
    end

    User->>Client: カート画面を開く
    Client->>API: GET /cart
    API->>DB: カート内容取得
    Note over DB: CART + CART_ITEM<br/>+ PRODUCT JOIN
    DB-->>API: カート詳細
    API-->>Client: カート内容（商品一覧、合計金額）
    Client-->>User: カート表示

    alt 数量変更
        User->>Client: 数量変更
        Client->>API: PUT /cart/items/{itemId}
        API->>DB: 在庫確認・更新
        DB-->>API: 更新結果
        API-->>Client: 200 OK
    end

    alt 商品削除
        User->>Client: カートから削除
        Client->>API: DELETE /cart/items/{itemId}
        API->>DB: カートアイテム削除
        DB-->>API: 削除完了
        API-->>Client: 204 No Content
    end
```

## 7.4 購入・決済フロー（Stripe統合）

```mermaid
sequenceDiagram
    participant User as ユーザー（購入者）
    participant Client as クライアント
    participant API as API Server
    participant Stripe as Stripe API
    participant DB as Database
    participant Webhook as Webhook Handler

    User->>Client: カート画面で「購入手続きへ」
    
    Client->>Client: 配送先情報入力画面
    User->>Client: 配送先情報入力
    Note over User,Client: 郵便番号、都道府県、市区町村<br/>住所、氏名、電話番号

    Client->>API: POST /cart/checkout
    Note over API: {<br/>  shippingInfo: {...}<br/>}

    API->>DB: カート内容確認
    DB-->>API: カート商品一覧

    API->>API: 合計金額計算
    Note over API: 商品代金 + 送料<br/>+ 手数料（7%）

    API->>Stripe: 決済セッション作成
    Note over Stripe: line_items,<br/>success_url,<br/>cancel_url
    Stripe-->>API: checkout_session

    API->>DB: 注文情報作成
    Note over DB: ORDER (status: pending)<br/>ORDER_ITEM
    DB-->>API: order_id

    API->>DB: カートステータス更新
    Note over DB: CART (status: checked_out)

    API-->>Client: payment_url
    Client->>Client: Stripe決済画面へリダイレクト

    User->>Stripe: 決済情報入力・確定
    Stripe->>Stripe: 決済処理

    alt 決済成功
        Stripe->>API: success_urlへリダイレクト
        Stripe->>Webhook: 決済完了通知
        
        Webhook->>DB: 注文ステータス更新
        Note over DB: ORDER (status: paid)
        
        Webhook->>DB: 在庫減算
        Note over DB: PRODUCT.stock更新
        
        API-->>Client: 注文完了画面
        Client-->>User: 購入完了通知
    else 決済失敗
        Stripe->>API: cancel_urlへリダイレクト
        API->>DB: 注文キャンセル
        Note over DB: ORDER (status: cancelled)
        API-->>Client: エラー画面
        Client-->>User: 決済失敗通知
    end
```

## 7.5 注文管理・配送フロー

```mermaid
sequenceDiagram
    participant Buyer as 購入者
    participant Seller as 出品者
    participant Client as クライアント
    participant API as API Server
    participant DB as Database
    participant Notif as 通知サービス

    Note over Seller: 注文通知受信後

    Seller->>Client: 出品者ダッシュボード
    Client->>API: GET /seller/orders
    API->>DB: 出品者の注文一覧取得
    Note over DB: ORDER + ORDER_ITEM<br/>WHERE product.seller = user
    DB-->>API: 注文一覧
    API-->>Client: 注文一覧（status別）
    Client-->>Seller: 新規注文表示

    Seller->>Client: 注文詳細確認
    Client->>API: GET /orders/{orderId}
    API->>DB: 注文詳細取得
    DB-->>API: 注文情報（配送先等）
    API-->>Client: 注文詳細
    Client-->>Seller: 配送先情報表示

    Seller->>Seller: 商品発送準備

    Seller->>Client: 発送完了登録
    Note over Client: 追跡番号入力
    Client->>API: PUT /orders/{orderId}/shipping
    Note over API: {<br/>  trackingNumber,<br/>  status: "shipped"<br/>}

    API->>DB: 注文ステータス更新
    Note over DB: ORDER (status: shipped)
    DB-->>API: 更新完了

    API->>Notif: 発送通知送信
    Notif->>Buyer: プッシュ通知
    Note over Buyer: 「商品が発送されました」

    API-->>Client: 200 OK
    Client-->>Seller: 発送登録完了

    Buyer->>Client: 注文履歴確認
    Client->>API: GET /orders
    API->>DB: 購入履歴取得
    DB-->>API: 注文一覧
    API-->>Client: 注文履歴
    Client-->>Buyer: 配送状況表示
    Note over Buyer: 追跡番号確認可能
```

## 7.6 光ギフト送信フロー

```mermaid
sequenceDiagram
    participant Sender as 送信者
    participant Client as クライアント
    participant API as API Server
    participant Stripe as Stripe API
    participant DB as Database
    participant Notif as 通知サービス
    participant Creator as クリエイター

    alt 投稿へのギフト
        Sender->>Client: 投稿詳細画面
        Sender->>Client: 「光ギフト」ボタン
        Client->>Client: ギフト金額選択
        Note over Client: 300円 / 600円 / 1200円
        
        Sender->>Client: 金額選択・メッセージ入力
        Client->>API: POST /posts/{postId}/gift
    else ライブルームでのギフト
        Sender->>Client: ライブルーム画面
        Sender->>Client: 「光ギフト」ボタン
        Client->>Client: ギフト金額選択
        
        Sender->>Client: 金額選択・メッセージ入力
        Client->>API: POST /live-rooms/{roomId}/gift
    end

    Note over API: {<br/>  amount: 600,<br/>  message: "素敵な投稿！"<br/>}

    API->>Stripe: 決済インテント作成
    Note over Stripe: amount,<br/>metadata
    Stripe-->>API: payment_intent

    API->>Client: 決済確認画面
    Client->>Sender: 決済確認
    Sender->>Client: 決済承認

    Client->>Stripe: 決済実行
    Stripe-->>Client: 決済完了

    Client->>API: 決済完了通知
    API->>DB: ギフト記録保存
    Note over DB: GIFT テーブル<br/>platform_fee_rate: 0.08
    DB-->>API: gift_id

    API->>API: 収益計算
    Note over API: クリエイター分: 92%<br/>プラットフォーム: 8%

    API->>DB: クリエイター収益更新
    DB-->>API: 更新完了

    API->>Notif: ギフト通知送信
    Notif->>Creator: プッシュ通知
    Note over Creator: 「光ギフトを受け取りました」

    API-->>Client: 201 Created (Gift)
    Client-->>Sender: ギフト送信完了

    alt ライブルームの場合
        API->>Client: ギフトエフェクト表示
        Client->>Client: リアルタイムエフェクト
        Note over Client: 全参加者に表示
    end
```

## 7.7 売上ダッシュボードフロー

```mermaid
sequenceDiagram
    participant Seller as 出品者/クリエイター
    participant Client as クライアント
    participant API as API Server
    participant DB as Database
    participant Analytics as 分析エンジン

    Seller->>Client: ダッシュボード画面
    Client->>API: GET /seller/dashboard?period=monthly

    API->>DB: 売上データ取得
    Note over DB: ORDER (completed)<br/>+ GIFT データ集計
    DB-->>API: 売上生データ

    API->>Analytics: データ集計・分析
    Note over Analytics: 期間別集計<br/>商品別売上<br/>ギフト収益

    Analytics->>Analytics: 指標計算
    Note over Analytics: - 総売上<br/>- 注文数<br/>- 平均注文単価<br/>- 手数料控除後収益

    Analytics-->>API: 分析結果

    API->>API: グラフデータ生成
    Note over API: 日別/週別/月別<br/>売上推移

    API-->>Client: ダッシュボードデータ
    Note over Client: {<br/>  totalRevenue: 150000,<br/>  totalOrders: 23,<br/>  averageOrderValue: 6521,<br/>  revenueChart: [...],<br/>  topProducts: [...],<br/>  giftRevenue: 12000<br/>}

    Client->>Client: グラフ描画
    Client-->>Seller: ダッシュボード表示

    alt 詳細分析
        Seller->>Client: 商品別詳細クリック
        Client->>API: GET /products/{productId}/analytics
        API->>DB: 商品別売上詳細
        DB-->>API: 詳細データ
        API-->>Client: 商品分析データ
        Client-->>Seller: 商品別レポート表示
    end

    alt 売上金振込申請
        Seller->>Client: 振込申請ボタン
        Client->>API: POST /seller/withdrawal-request
        API->>DB: 振込申請記録
        DB-->>API: request_id
        API-->>Client: 申請受付完了
        Client-->>Seller: 振込予定日通知
    end
```

## 7.8 データフロー概要

```mermaid
graph TB
    subgraph "商品管理"
        A[商品出品] --> B[PRODUCT]
        C[音声投稿] --> D[AI説明文生成]
        D --> B
    end

    subgraph "カート・注文"
        E[カート追加] --> F[CART/CART_ITEM]
        F --> G[チェックアウト]
        G --> H[ORDER/ORDER_ITEM]
    end

    subgraph "決済"
        H --> I[Stripe決済]
        I --> J[Webhook]
        J --> K[注文ステータス更新]
    end

    subgraph "配送"
        K --> L[発送処理]
        L --> M[追跡番号登録]
        M --> N[配送完了]
    end

    subgraph "収益"
        O[光ギフト] --> P[GIFT]
        N --> Q[売上計上]
        P --> Q
        Q --> R[ダッシュボード]
    end

    style A fill:#f9f,stroke:#333
    style C fill:#f9f,stroke:#333
    style O fill:#f9f,stroke:#333
```

## エラー処理とセキュリティ考慮事項

### 1. 在庫管理
- 同時購入による在庫不整合を防ぐため、楽観的ロック実装
- カート追加時と決済時の2段階在庫確認

### 2. 決済セキュリティ
- Stripe Webhookの署名検証
- 決済金額の改ざん防止（サーバー側計算）
- PCI DSS準拠（カード情報非保持）

### 3. 出品者保護
- 商品情報の編集権限チェック
- 注文情報の適切なマスキング
- 振込申請の本人確認

### 4. 購入者保護
- SSL/TLS通信
- 配送先情報の暗号化保存
- 返金・キャンセルポリシーの明示

### 5. パフォーマンス
- 商品画像のCDN配信
- ダッシュボードデータのキャッシュ
- 大量注文時のページネーション