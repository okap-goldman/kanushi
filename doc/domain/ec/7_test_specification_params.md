# ECドメインテストパラメーターと期待結果

## 1. モデルテスト用パラメーター

### ProductModelTest パラメーター

| テストケース | 入力パラメーター | 期待される結果 |
|------------|-----------------|--------------|
| JSON変換テスト | `{"id": "123", "seller_user_id": "seller1", "title": "テスト商品", "description": "説明文", "price": 1000, "currency": "JPY", "image_url": "http://example.com/img.jpg", "stock": 10, "created_at": "2023-01-01T00:00:00Z"}` | `id`="123", `sellerUserId`="seller1", `title`="テスト商品", `price`=1000.0, `stock`=10 の ProductModel インスタンス |
| 必須フィールド欠損テスト | title が欠けた JSON | FormatException または同様の例外がスローされる |
| 数値型変換テスト | price が文字列 "1000" のJSON | 正しく 1000.0 (double型) に変換される |
| copyWithテスト | 既存の ProductModel に `title`="新しいタイトル" で copyWith を実行 | 元の値を保持しつつ title だけが変更された新しいインスタンス |

### OrderModelTest パラメーター

| テストケース | 入力パラメーター | 期待される結果 |
|------------|-----------------|--------------|
| JSON変換テスト | `{"id": "456", "buyer_user_id": "buyer1", "product_id": "123", "quantity": 2, "amount": 2000, "status": "paid", "created_at": "2023-01-01T00:00:00Z"}` | `id`="456", `buyerUserId`="buyer1", `status`=OrderStatus.paid の OrderModel インスタンス |
| 列挙型変換テスト | status が "pending", "paid", "shipped", "refunded" の各JSON | それぞれ OrderStatus.pending, OrderStatus.paid, OrderStatus.shipped, OrderStatus.refunded に正しく変換される |
| 不正ステータステスト | status が "invalid" のJSON | FormatException または同様の例外がスローされる |
| 関連オブジェクトテスト | product フィールドを含むJSON | product フィールドが ProductModel として適切に変換される |

### ShippingAddressModelTest パラメーター

| テストケース | 入力パラメーター | 期待される結果 |
|------------|-----------------|--------------|
| JSON変換テスト | `{"id": "789", "user_id": "user1", "recipient_name": "山田太郎", "postal_code": "123-4567", "prefecture": "東京都", "city": "渋谷区", "address_line": "1-2-3", "phone_number": "03-1234-5678", "is_default": true, "created_at": "2023-01-01T00:00:00Z", "updated_at": "2023-01-01T00:00:00Z"}` | `id`="789", `recipientName`="山田太郎", `prefecture`="東京都" の ShippingAddressModel インスタンス |
| formattedAddressテスト | 上記のモデルインスタンス | `formattedAddress` = "〒123-4567 東京都渋谷区1-2-3" |
| isDefaultフラグテスト | is_default が true/false の各JSON | `isDefault` プロパティが true/false に正しく変換される |

## 2. リポジトリテスト用パラメーター

### ProductRepositoryTest パラメーター

| テストケース | 入力パラメーター | 期待される結果 |
|------------|-----------------|--------------|
| getProducts (オンライン) | `sellerUserId` = "seller1", `limit` = 10, `offset` = 0 | 販売者IDが "seller1" の商品リストが返される (Right) |
| getProducts (オフライン) | ネットワーク接続なし, `sellerUserId` = "seller1" | ローカルキャッシュから取得した商品リストが返される (Right) |
| getProducts (キャッシュなし) | ネットワーク接続なし, キャッシュデータなし | CacheFailure が返される (Left) |
| getProductById (成功) | `productId` = "product1" | 対応する商品が返される (Right) |
| getProductById (存在しない) | `productId` = "nonexistent" | NotFoundFailure が返される (Left) |
| createProduct (成功) | 有効な商品データを含む ProductEntity | 作成された商品が返される (Right) |
| createProduct (サーバーエラー) | 正しいデータだがサーバーエラー発生 | ServerFailure が返される (Left) |
| updateProduct (成功) | 更新された商品データを含む ProductEntity | 更新された商品が返される (Right) |
| deleteProduct (成功) | `productId` = "product1" | true が返される (Right) |
| deleteProduct (失敗) | `productId` = "nonexistent" | false が返される (Right) |

### OrderRepositoryTest パラメーター

| テストケース | 入力パラメーター | 期待される結果 |
|------------|-----------------|--------------|
| getOrders (購入者として) | `userId` = "buyer1", `isBuyer` = true, `limit` = 10, `offset` = 0 | 購入者IDが "buyer1" の注文リストが返される (Right) |
| getOrders (販売者として) | `userId` = "seller1", `isBuyer` = false, `limit` = 10, `offset` = 0 | 販売者IDが "seller1" の注文リストが返される (Right) |
| getOrders (ステータスフィルター) | `userId` = "buyer1", `status` = OrderStatus.paid | 支払い済みの注文だけが返される (Right) |
| getOrderById (成功) | `orderId` = "order1" | 対応する注文が返される (Right) |
| getOrderById (失敗) | `orderId` = "nonexistent" | NotFoundFailure が返される (Left) |
| createOrder (成功) | `productId` = "product1", `quantity` = 2, `buyerUserId` = "buyer1" | 作成された注文が返される (Right) |
| updateOrderStatus (成功) | `orderId` = "order1", `newStatus` = OrderStatus.shipped | 更新された注文が返される (Right) |
| updateOrderStatus (失敗) | `orderId` = "nonexistent", `newStatus` = OrderStatus.shipped | NotFoundFailure が返される (Left) |

### PaymentRepositoryTest パラメーター

| テストケース | 入力パラメーター | 期待される結果 |
|------------|-----------------|--------------|
| createPaymentIntent (成功) | `orderId` = "order1", `amount` = 2000, `currency` = "JPY" | クライアントシークレットが返される (Right) |
| createPaymentIntent (失敗) | `amount` = -1000 (不正な金額) | PaymentFailure が返される (Left) |
| confirmPayment (成功) | `orderId` = "order1", `paymentIntentId` = "pi_valid" | true が返される (Right) |
| confirmPayment (失敗) | `orderId` = "order1", `paymentIntentId` = "pi_invalid" | PaymentFailure が返される (Left) |
| requestRefund (成功) | `orderId` = "order1", `reason` = "商品に不備があるため" | true が返される (Right) |
| requestRefund (期限切れ) | 8日以上経過した注文の `orderId` | BusinessLogicFailure が返される (Left) |
| getPaymentHistory (成功) | `orderId` = "order1" | 対応する支払い履歴が返される (Right) |

## 3. ユースケーステスト用パラメーター

### GetProductsUseCaseTest パラメーター

| テストケース | 入力パラメーター | 期待される結果 |
|------------|-----------------|--------------|
| 正常ケース | `sellerUserId` = "seller1", `limit` = 10, `offset` = 0 | 販売者IDが "seller1" の商品リストが返される (Right) |
| リポジトリエラー | リポジトリがエラーを返すよう設定 | リポジトリからのFailureがそのまま返される (Left) |
| パラメーターなし | パラメーターなしでの呼び出し | デフォルトパラメーター（limit=20, offset=0）で処理される |

### CreateOrderUseCaseTest パラメーター

| テストケース | 入力パラメーター | モック設定 | 期待される結果 |
|------------|-----------------|----------|--------------|
| 在庫十分 | `productId` = "product1", `quantity` = 2, `buyerUserId` = "buyer1" | product.stock = 10 | 作成された注文が返される (Right) |
| 在庫不足 | `productId` = "product1", `quantity` = 5, `buyerUserId` = "buyer1" | product.stock = 3 | BusinessLogicFailure("在庫が不足しています") が返される (Left) |
| 商品取得エラー | `productId` = "nonexistent" | ProductRepository が NotFoundFailure を返す | NotFoundFailure が返される (Left) |
| 注文作成エラー | 有効なパラメーター | OrderRepository が ServerFailure を返す | ServerFailure が返される (Left) |

### ProcessPaymentUseCaseTest パラメーター

| テストケース | 入力パラメーター | モック設定 | 期待される結果 |
|------------|-----------------|----------|--------------|
| pending注文 | `orderId` = "order1" | order.status = OrderStatus.pending | クライアントシークレットが返される (Right) |
| 既に処理済み注文 | `orderId` = "order1" | order.status = OrderStatus.paid | BusinessLogicFailure("この注文は既に処理されています") が返される (Left) |
| 注文取得エラー | `orderId` = "nonexistent" | OrderRepository が NotFoundFailure を返す | NotFoundFailure が返される (Left) |
| 決済処理エラー | `orderId` = "order1" | PaymentRepository が PaymentFailure を返す | PaymentFailure が返される (Left) |

## 4. ビューモデルテスト用パラメーター

### ShopViewModelTest パラメーター

| テストケース | 入力パラメーター | モック設定 | 期待される結果 |
|------------|-----------------|----------|--------------|
| 初期状態 | なし | なし | state は ShopInitial 型 |
| 商品読み込み成功 | `sellerUserId` = "seller1" | GetProductsUseCase が商品リストを返す | state は ShopLoaded 型、products にはモックで用意した商品リストが含まれる |
| 商品読み込み失敗 | `sellerUserId` = "seller1" | GetProductsUseCase が ServerFailure を返す | state は ShopError 型、message は "サーバーエラー" |
| さらに読み込み | `isRefresh` = false | GetProductsUseCase が追加商品を返す | 既存の商品リストに新しい商品が追加される |
| 再読み込み | `isRefresh` = true | GetProductsUseCase が商品リストを返す | 既存のリストが新しい商品リストで置き換えられる |

### ProductDetailViewModelTest パラメーター

| テストケース | 入力パラメーター | モック設定 | 期待される結果 |
|------------|-----------------|----------|--------------|
| 初期状態 | なし | なし | state は ProductDetailInitial 型 |
| 商品読み込み成功 | `productId` = "product1" | GetProductByIdUseCase が商品を返す | state は ProductDetailLoaded 型、product はモックで用意した商品 |
| 商品読み込み失敗 | `productId` = "nonexistent" | GetProductByIdUseCase が NotFoundFailure を返す | state は ProductDetailError 型、message は "商品が見つかりません" |
| 購入フロー成功 | `productId` = "product1", `quantity` = 1, `buyerUserId` = "buyer1" | CreateOrderUseCase が注文を返し、ProcessPaymentUseCase がクライアントシークレットを返す | state は ProductDetailPaymentReady 型、order とクライアントシークレットが設定される |
| 在庫不足での購入 | `quantity` = 10 | product.stock = 5 | state は ProductDetailError 型、message は "在庫が不足しています" |
| 注文作成エラー | 有効なパラメーター | CreateOrderUseCase が ServerFailure を返す | state は ProductDetailError 型、message はエラーメッセージ |
| 決済処理エラー | 有効なパラメーター | ProcessPaymentUseCase が PaymentFailure を返す | state は ProductDetailError 型、message はエラーメッセージ |

## 5. UIテスト用パラメーター

### ShopScreenTest パラメーター

| テストケース | 入力パラメーター | モック設定 | 期待される結果 |
|------------|-----------------|----------|--------------|
| 商品一覧表示 | `sellerUserId` = "seller1" | ShopViewModel.state = ShopLoaded(商品リスト) | 商品タイトル、価格が表示される。商品カードタップで詳細画面に遷移 |
| 読み込み中表示 | `sellerUserId` = "seller1" | ShopViewModel.state = ShopLoading() | CircularProgressIndicator が表示される |
| エラー表示 | `sellerUserId` = "seller1" | ShopViewModel.state = ShopError("エラーメッセージ") | エラーメッセージと再試行ボタンが表示される |
| 商品なし表示 | `sellerUserId` = "seller1" | ShopViewModel.state = ShopLoaded([]) | "商品がありません" メッセージが表示される |
| ページング | スクロールして下端に到達 | ShopViewModel が loadProducts を呼び出す | モックの loadProducts メソッドが呼ばれる |

### ProductDetailScreenTest パラメーター

| テストケース | 入力パラメーター | モック設定 | 期待される結果 |
|------------|-----------------|----------|--------------|
| 商品詳細表示 | `productId` = "product1" | ProductDetailViewModel.state = ProductDetailLoaded(商品) | 商品タイトル、説明、価格、在庫数、画像が表示される |
| 読み込み中表示 | `productId` = "product1" | ProductDetailViewModel.state = ProductDetailLoading() | CircularProgressIndicator が表示される |
| エラー表示 | `productId` = "product1" | ProductDetailViewModel.state = ProductDetailError("エラーメッセージ") | エラーメッセージが表示される |
| 在庫切れ表示 | `productId` = "product1" | ProductDetailViewModel.state = ProductDetailLoaded(stock=0の商品) | "売り切れ" と表示され、購入ボタンが無効化される |
| 決済準備状態 | `productId` = "product1" | ProductDetailViewModel.state = ProductDetailPaymentReady(注文, クライアントシークレット) | 決済情報入力フォームと決済ボタンが表示される |
| 購入ボタンタップ | 購入ボタンをタップ | モックの purchaseProduct メソッド | 数量選択ダイアログが表示され、確定後 purchaseProduct が呼ばれる |

### OrderListScreenTest パラメーター

| テストケース | 入力パラメーター | モック設定 | 期待される結果 |
|------------|-----------------|----------|--------------|
| 注文一覧表示 | `userId` = "buyer1", `isBuyer` = true | OrderListViewModel.state = OrderListLoaded(注文リスト) | 注文商品名、数量、金額、ステータスが表示される |
| 読み込み中表示 | `userId` = "buyer1" | OrderListViewModel.state = OrderListLoading() | CircularProgressIndicator が表示される |
| エラー表示 | `userId` = "buyer1" | OrderListViewModel.state = OrderListError("エラーメッセージ") | エラーメッセージが表示される |
| 注文なし表示 | `userId` = "buyer1" | OrderListViewModel.state = OrderListLoaded([]) | "注文履歴がありません" メッセージが表示される |
| ステータスフィルター | フィルターボタンタップ後、"支払い完了" を選択 | モックの getOrders メソッド | ダイアログが表示され、選択後 status=OrderStatus.paid で getOrders が呼ばれる |

## 6. 統合テストパラメーター

### 商品管理フロー統合テスト

| テストケース | テストステップ | 期待される結果 |
|------------|--------------|--------------|
| 商品作成から削除まで | 1. 商品管理画面表示<br>2. 商品作成ボタンタップ<br>3. 商品情報入力<br>4. 保存ボタンタップ<br>5. 商品一覧で確認<br>6. 商品を選択して編集<br>7. 情報更新<br>8. 保存ボタンタップ<br>9. 商品を選択して削除<br>10. 削除確認ダイアログで確認 | 1. 商品管理画面表示<br>2. 商品作成画面表示<br>3. フォーム入力<br>4. 商品管理画面に戻る<br>5. 新商品が表示されている<br>6. 編集画面表示<br>7. フォーム更新<br>8. 商品管理画面に戻る<br>9. 削除確認ダイアログ表示<br>10. 商品が削除され一覧から消える |

### 購入フロー統合テスト

| テストケース | テストステップ | 期待される結果 |
|------------|--------------|--------------|
| 商品購入から決済まで | 1. 商品一覧表示<br>2. 商品を選択<br>3. 商品詳細表示<br>4. 購入ボタンタップ<br>5. 数量選択<br>6. 数量確定<br>7. 支払い情報入力<br>8. 決済ボタンタップ<br>9. 注文履歴確認 | 1. 商品一覧表示<br>2. タップ反応<br>3. 商品詳細表示<br>4. 数量選択ダイアログ表示<br>5. 数量選択可能<br>6. 決済画面表示<br>7. 支払い情報入力可能<br>8. 処理中表示後完了画面<br>9. 注文履歴に新しい注文が表示される |

## 7. テストカバレッジ目標

| コンポーネント | 行カバレッジ目標 | 分岐カバレッジ目標 |
|------------|--------------|--------------|
| モデル | 95% | 90% |
| リポジトリ | 90% | 85% |
| ユースケース | 90% | 85% |
| ビューモデル | 85% | 80% |
| UI | 75% | 70% |
| 全体 | 85% | 80% |

## 8. エッジケーステスト

| テストケース | 内容 | 期待される結果 |
|------------|------|--------------|
| 極端な量の商品購入 | 非常に大きな数（例: 9999）を購入数として指定 | 適切なバリデーションエラーが表示される |
| 同時購入競合 | 在庫1の商品を2人が同時に購入しようとする | 先に処理した購入は成功、後の購入は在庫不足エラーとなる |
| 価格ゼロの商品 | 価格が0円の商品の作成と購入を試みる | 商品作成時にバリデーションエラー、または特別処理として認識 |
| 決済処理タイムアウト | 決済処理中にタイムアウトが発生 | エラーメッセージが表示され、注文ステータスは適切に維持される |
| 在庫なし商品の表示 | 在庫0の商品の詳細表示と購入処理 | "売り切れ" と表示され、購入ボタンが無効化される |
| 支払いキャンセル | 支払い画面でキャンセルボタンを押す | 適切に前の画面に戻り、注文ステータスが更新される |
| 二重決済防止 | 同一注文に対して複数回決済を試みる | 2回目以降はエラーメッセージが表示され、二重決済が防止される |

## 9. パフォーマンステスト基準

| テスト項目 | 測定指標 | 合格基準 |
|----------|---------|---------|
| 商品一覧初期表示 | 画面表示完了時間 | 200ms以内 |
| 商品詳細表示 | 画面表示完了時間 | 300ms以内 |
| 商品一覧スクロール | フレームドロップ率 | 5%未満 |
| 決済処理完了通知 | 処理完了までの時間 | 3秒以内 |
| 在庫更新反映 | 更新から表示までの時間 | 500ms以内 |
| 商品検索フィルター適用 | 結果表示までの時間 | 200ms以内 |
| 大量データ読み込み | 100商品表示時のメモリ使用量 | 50MB未満 |
| アプリ起動時間 | コールドスタートから表示まで | 2秒以内 |

## 10. セキュリティテスト条件

| テスト項目 | テスト方法 | 合格基準 |
|----------|----------|---------|
| カード情報の非保存 | コード検査とアプリデータ検査 | アプリのストレージに決済情報が保存されていないこと |
| Stripe連携の安全性 | Stripe SDKの適切な使用確認 | Stripe推奨の実装パターンに従っていること |
| 価格改ざん防止 | クライアント側価格改ざん試行 | サーバー側で正しい価格が適用されること |
| 在庫整合性 | 同時購入シミュレーション | 在庫数が負にならず、適切にロックされること |
| 支払い状態整合性 | 支払い中断シミュレーション | 一貫した状態が維持されること |
| API認証 | 無効トークンでのAPI呼び出し | 適切な認証エラーが返されること |
| リクエスト検証 | 不正なリクエストパラメーター送信 | 適切なバリデーションエラーが返されること |
| 個人情報保護 | 配送先情報の安全な取り扱い | 適切に暗号化され、必要なアクセス制限があること |