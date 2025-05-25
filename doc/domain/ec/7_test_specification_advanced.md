# ECドメイン高度なテスト仕様書

本ドメキュメントは基本テスト仕様書を補完し、より高度なテストシナリオ、エッジケース、同時実行テスト、および境界値テストを定義します。

## 1. 同時実行テスト

### 在庫競合テスト
| テストケース | テスト方法 | 期待される結果 |
|------------|----------|--------------|
| 同時購入競合 | 1. 在庫2個の商品を用意<br>2. 2人のユーザーが同時に3個ずつ購入を試みる<br>3. 購入処理を2つの別スレッドで実行 | 一方の購入は成功し2個購入、他方は在庫不足エラーを表示する。トランザクションが適切に処理される |
| 注文処理の排他制御 | 1. 特定の注文を作成<br>2. 同時に2つの別スレッドから注文ステータス更新を試みる | 一方の更新のみが成功し、最終的に一貫した状態となる |
| 同時在庫更新 | 1. 商品詳細の編集画面を2つのセッションで開く<br>2. 両方で在庫数を別の値に更新して保存 | 後に保存した方が最終的な値になり、楽観的ロックが機能する |
| 決済競合 | 1. 同一注文に対して2つの別セッションで決済処理を実行 | 一方のみが成功し、二重決済が防止される |

### 実装方法
```dart
void testConcurrentStockUpdate() async {
  // テスト用の商品を作成（在庫 = 10）
  final productId = await createTestProduct(stock: 10);
  
  // 同時実行用の完了通知
  final completer1 = Completer<Either<Failure, OrderEntity>>();
  final completer2 = Completer<Either<Failure, OrderEntity>>();
  
  // 並列実行
  // ユーザー1: 7個購入
  Future.delayed(Duration.zero, () async {
    final result = await createOrderUseCase(
      productId: productId,
      quantity: 7,
      buyerUserId: 'buyer1',
    );
    completer1.complete(result);
  });
  
  // ユーザー2: 5個購入
  Future.delayed(Duration.zero, () async {
    final result = await createOrderUseCase(
      productId: productId,
      quantity: 5,
      buyerUserId: 'buyer2',
    );
    completer2.complete(result);
  });
  
  // 両方の結果を待機
  final result1 = await completer1.future;
  final result2 = await completer2.future;
  
  // 検証: 一方は成功、一方は在庫不足エラーになること
  expect(
    result1.isRight() && result2.isLeft() || result1.isLeft() && result2.isRight(),
    isTrue,
  );
  
  // 商品の最終在庫を確認
  final productResult = await getProductByIdUseCase(productId);
  final finalStock = productResult.fold(
    (failure) => -1, 
    (product) => product.stock,
  );
  
  // 在庫が正しく減少していることを確認
  expect(finalStock, result1.isRight() ? 3 : 5);
  
  // エラーが適切な種類であることを確認
  final failedResult = result1.isLeft() ? result1 : result2;
  failedResult.fold(
    (failure) => expect(failure, isA<BusinessLogicFailure>()),
    (_) => fail('エラーが発生すべき'),
  );
}
```

## 2. ネットワークエラーと復旧テスト

### ネットワーク状態遷移テスト
| テストケース | テスト方法 | 期待される結果 |
|------------|----------|--------------|
| オフライン→オンライン復帰 | 1. アプリをオフラインモードに設定<br>2. 商品一覧をロード（キャッシュから表示）<br>3. ネットワークを有効化<br>4. 画面を引っ張って更新 | キャッシュから表示→その後最新データに更新される。エラー表示なくスムーズな遷移 |
| オンライン→オフライン遷移 | 1. 商品一覧を表示<br>2. データ読込中にネットワーク切断<br>3. エラー後にキャッシュ表示を確認 | エラーメッセージ表示後、キャッシュデータが表示される |
| 断続的ネットワーク | 1. 不安定なネットワーク環境をシミュレート<br>2. 商品一覧ロードとスクロール<br>3. 購入処理の実行 | 適切なリトライ処理が行われ、最終的に成功するか明確なエラーが表示される |
| 決済処理中の切断 | 1. 決済処理開始<br>2. 処理中にネットワーク切断<br>3. 復旧後の状態確認 | 適切なエラーメッセージが表示され、決済状態が不整合にならない |

### 実装方法
```dart
void testNetworkRecovery() async {
  // モックネットワーク制御
  final mockConnectivity = MockConnectivity();
  final mockProductRepository = MockProductRepository();
  
  // 依存性の上書き
  getIt.registerSingleton<Connectivity>(mockConnectivity);
  getIt.registerSingleton<IProductRepository>(mockProductRepository);
  
  // 最初はオンライン状態
  when(mockConnectivity.checkConnectivity())
      .thenAnswer((_) async => ConnectivityResult.wifi);
  
  // ビューモデル初期化
  final viewModel = ShopViewModel(
    getProductsUseCase: GetProductsUseCase(
      repository: mockProductRepository,
    ),
  );
  
  // 商品読み込み
  final products = [createTestProduct(), createTestProduct()];
  when(mockProductRepository.getProducts(
    sellerUserId: anyNamed('sellerUserId'),
    limit: anyNamed('limit'),
    offset: anyNamed('offset'),
  )).thenAnswer((_) async => Right(products));
  
  await viewModel.loadProducts(sellerUserId: 'seller1');
  expect(viewModel.state, isA<ShopLoaded>());
  
  // オフラインに切り替え
  when(mockConnectivity.checkConnectivity())
      .thenAnswer((_) async => ConnectivityResult.none);
  when(mockProductRepository.getProducts(
    sellerUserId: anyNamed('sellerUserId'),
    limit: anyNamed('limit'),
    offset: anyNamed('offset'),
  )).thenAnswer((_) async => Left(NetworkFailure('ネットワーク接続エラー')));
  
  // オフライン状態で再読み込み
  await viewModel.loadProducts(sellerUserId: 'seller1');
  
  // キャッシュから読み込むので以前のデータが表示される
  expect(viewModel.state, isA<ShopLoaded>());
  expect((viewModel.state as ShopLoaded).products, products);
  
  // オンラインに復帰
  when(mockConnectivity.checkConnectivity())
      .thenAnswer((_) async => ConnectivityResult.wifi);
  final updatedProducts = [createTestProduct(), createTestProduct(), createTestProduct()];
  when(mockProductRepository.getProducts(
    sellerUserId: anyNamed('sellerUserId'),
    limit: anyNamed('limit'),
    offset: anyNamed('offset'),
  )).thenAnswer((_) async => Right(updatedProducts));
  
  // 再読み込み
  await viewModel.loadProducts(sellerUserId: 'seller1', isRefresh: true);
  
  // 新しいデータが表示される
  expect(viewModel.state, isA<ShopLoaded>());
  expect((viewModel.state as ShopLoaded).products, updatedProducts);
}
```

## 3. 境界値テスト

### 数値パラメーター境界値テスト
| テストケース | 入力パラメーター | 期待される結果 |
|------------|-----------------|--------------|
| 最小数量（1）での購入 | `quantity` = 1 | 購入が正常に処理される |
| 数量ゼロでの購入 | `quantity` = 0 | バリデーションエラー（「数量は1以上である必要があります」） |
| 負の数量での購入 | `quantity` = -1 | バリデーションエラー（「数量は1以上である必要があります」） |
| 極大数量での購入 | `quantity` = 10000 | バリデーションエラー（「一度に購入できる最大数量は100です」） |
| 価格ゼロの商品 | `price` = 0 | 特殊処理として受け入れられる（無料商品） |
| 負の価格の商品 | `price` = -100 | バリデーションエラー（「価格は0以上である必要があります」） |
| 極大価格の商品 | `price` = 100000000 | バリデーションエラー（「価格は10,000,000以下である必要があります」） |
| 在庫ゼロの商品表示 | `stock` = 0 | 「売り切れ」表示、購入ボタン無効化 |

### ページネーション境界値テスト
| テストケース | 入力パラメーター | 期待される結果 |
|------------|-----------------|--------------|
| 空の結果 | データなしの状態でページ読み込み | 適切な「データがありません」メッセージの表示 |
| 1件のみのデータ | 1件のみのデータでページング処理 | 1件表示され、次ページがないことが示される |
| 最大件数と同じ | `limit` = 20 で20件ちょうどの結果 | 全件表示され、次ページの有無が正しく判定される |
| 最大件数境界 | `limit` = 20 で21件のデータがある | 20件表示され、次ページがあることが示される |
| 最終ページ | 最後のページにアクセス | 残りのデータが表示され、次ページがないことが示される |
| オフセット超過 | データ総数を超えるオフセット | 空結果が適切に処理され、エラーにならない |

### 実装方法
```dart
void testQuantityBoundaryValues() async {
  // モック設定
  final mockCreateOrderUseCase = MockCreateOrderUseCase();
  final mockProduct = ProductModel(
    id: 'product1',
    sellerUserId: 'seller1',
    title: 'テスト商品',
    description: '説明文',
    price: 1000,
    currency: 'JPY',
    imageUrl: 'https://example.com/image.jpg',
    stock: 100,
    createdAt: DateTime.now(),
  );
  
  final viewModel = ProductDetailViewModel(
    getProductByIdUseCase: MockGetProductByIdUseCase(),
    createOrderUseCase: mockCreateOrderUseCase,
    processPaymentUseCase: MockProcessPaymentUseCase(),
  );
  
  // 最小有効値（1）
  when(mockCreateOrderUseCase(
    productId: anyNamed('productId'),
    quantity: 1,
    buyerUserId: anyNamed('buyerUserId'),
  )).thenAnswer((_) async => Right(createMockOrder(quantity: 1)));
  
  // 正常範囲内（1）
  await viewModel.purchaseProduct('product1', 1, 'buyer1');
  expect(viewModel.state, isA<ProductDetailPaymentReady>());
  
  // 無効値（0）- モックを設定しないで直接テスト
  await viewModel.purchaseProduct('product1', 0, 'buyer1');
  expect(viewModel.state, isA<ProductDetailError>());
  expect((viewModel.state as ProductDetailError).message, contains('1以上'));
  
  // 無効値（-1）- モックを設定しないで直接テスト
  await viewModel.purchaseProduct('product1', -1, 'buyer1');
  expect(viewModel.state, isA<ProductDetailError>());
  expect((viewModel.state as ProductDetailError).message, contains('1以上'));
  
  // 極大値
  await viewModel.purchaseProduct('product1', 10000, 'buyer1');
  expect(viewModel.state, isA<ProductDetailError>());
  expect((viewModel.state as ProductDetailError).message, contains('最大数量'));
}

void testPaginationBoundaryValues() async {
  // モック設定
  final mockGetProductsUseCase = MockGetProductsUseCase();
  
  final viewModel = ShopViewModel(
    getProductsUseCase: mockGetProductsUseCase,
  );
  
  // 空の結果
  when(mockGetProductsUseCase(
    sellerUserId: anyNamed('sellerUserId'),
    limit: anyNamed('limit'),
    offset: 0,
  )).thenAnswer((_) async => Right([]));
  
  await viewModel.loadProducts(sellerUserId: 'seller1');
  expect(viewModel.state, isA<ShopLoaded>());
  expect((viewModel.state as ShopLoaded).products, isEmpty);
  
  // 1件のみのデータ
  final singleProduct = [createTestProduct()];
  when(mockGetProductsUseCase(
    sellerUserId: anyNamed('sellerUserId'),
    limit: anyNamed('limit'),
    offset: 0,
  )).thenAnswer((_) async => Right(singleProduct));
  
  await viewModel.loadProducts(sellerUserId: 'seller1', isRefresh: true);
  expect(viewModel.state, isA<ShopLoaded>());
  expect((viewModel.state as ShopLoaded).products.length, 1);
  
  // limit境界（20件ちょうど）
  final exactLimitProducts = List.generate(20, (_) => createTestProduct());
  when(mockGetProductsUseCase(
    sellerUserId: anyNamed('sellerUserId'),
    limit: 20,
    offset: 0,
  )).thenAnswer((_) async => Right(exactLimitProducts));
  
  await viewModel.loadProducts(sellerUserId: 'seller1', isRefresh: true);
  expect(viewModel.state, isA<ShopLoaded>());
  expect((viewModel.state as ShopLoaded).products.length, 20);
  
  // 追加データなし（次ページなし）
  when(mockGetProductsUseCase(
    sellerUserId: anyNamed('sellerUserId'),
    limit: anyNamed('limit'),
    offset: 20,
  )).thenAnswer((_) async => Right([]));
  
  await viewModel.loadProducts(sellerUserId: 'seller1', isRefresh: false);
  // 結果は変わらない（追加データがないため）
  expect(viewModel.state, isA<ShopLoaded>());
  expect((viewModel.state as ShopLoaded).products.length, 20);
}
```

## 4. アプリライフサイクルテスト

### バックグラウンド遷移テスト
| テストケース | テスト方法 | 期待される結果 |
|------------|----------|--------------|
| 商品一覧表示中のバックグラウンド遷移 | 1. 商品一覧表示<br>2. アプリをバックグラウンド化<br>3. 一定時間後にフォアグラウンドに戻す | 状態が維持され、必要に応じて自動更新が行われる |
| 決済処理中のバックグラウンド遷移 | 1. 決済画面表示<br>2. 決済処理開始<br>3. 処理中にアプリをバックグラウンド化<br>4. フォアグラウンドに戻す | 決済状態が適切に維持され、処理が継続または適切に処理中断通知がされる |
| 商品編集中のバックグラウンド遷移 | 1. 商品編集画面で情報入力<br>2. 保存前にバックグラウンド化<br>3. 一定時間後にフォアグラウンドに戻す | 入力内容が維持され、自動保存または継続編集が可能 |
| 長時間バックグラウンド後の復帰 | 1. アプリ使用中<br>2. 長時間（1時間以上）バックグラウンド<br>3. フォアグラウンドに戻す | トークン再取得などが必要な場合は適切に処理され、状態が復元される |

### 実装方法
```dart
void testAppLifecycle() async {
  // アプリライフサイクル制御用
  final appLifecycleStateController = StreamController<AppLifecycleState>();
  
  // モックセットアップ
  final mockShopViewModel = MockShopViewModel();
  final mockProductRepository = MockProductRepository();
  
  // テスト対象ウィジェットを作成
  final widget = MaterialApp(
    home: AppLifecycleListener(
      onStateChange: (state) {
        appLifecycleStateController.add(state);
      },
      child: ProviderScope(
        overrides: [
          shopViewModelProvider.overrideWithValue(mockShopViewModel),
        ],
        child: ShopScreen(sellerUserId: 'seller1'),
      ),
    ),
  );
  
  // ウィジェットをレンダリング
  await tester.pumpWidget(widget);
  
  // 初期状態を設定
  when(mockShopViewModel.state).thenReturn(
    ShopLoaded([createTestProduct(), createTestProduct()]),
  );
  await tester.pump();
  
  // バックグラウンドに遷移
  appLifecycleStateController.add(AppLifecycleState.paused);
  await tester.pump();
  
  // 一定時間経過
  await tester.pump(Duration(minutes: 30));
  
  // フォアグラウンドに復帰
  appLifecycleStateController.add(AppLifecycleState.resumed);
  await tester.pump();
  
  // 状態チェックメソッドが呼ばれたことを検証
  verify(mockShopViewModel.checkAndRefreshDataIfNeeded()).called(1);
  
  // リソース解放
  appLifecycleStateController.close();
}
```

## 5. テストデータ管理

### テストデータセットアップと破棄
```dart
// テストデータセットアップ用基底クラス
abstract class ECTestBase {
  // テストで使用するエンティティのID
  late final String testProductId;
  late final String testOrderId;
  late final String testShippingAddressId;
  
  // セットアップ
  Future<void> setUp() async {
    // テスト用のインメモリデータベース初期化
    await initializeTestDatabase();
    
    // 基本テストデータ作成
    testProductId = await createTestProduct(
      title: 'テスト商品',
      price: 1000,
      stock: 10,
    );
    
    testOrderId = await createTestOrder(
      productId: testProductId,
      quantity: 1,
      status: OrderStatus.pending,
    );
    
    testShippingAddressId = await createTestShippingAddress();
  }
  
  // テスト後クリーンアップ
  Future<void> tearDown() async {
    // テストデータ削除
    await cleanupTestData();
    
    // テスト用データベースクローズ
    await closeTestDatabase();
  }
  
  // テスト用商品作成ヘルパー
  Future<String> createTestProduct({
    String? title,
    double? price,
    int? stock,
  }) async {
    final product = ProductModel(
      id: 'test_product_${DateTime.now().millisecondsSinceEpoch}',
      sellerUserId: 'test_seller',
      title: title ?? 'Default Test Product',
      description: 'テスト用商品説明',
      price: price ?? 1000,
      currency: 'JPY',
      imageUrl: 'https://example.com/test_image.jpg',
      stock: stock ?? 10,
      createdAt: DateTime.now(),
    );
    
    await testDatabase.products.insert(product.toJson());
    return product.id;
  }
  
  // テスト用注文作成ヘルパー
  Future<String> createTestOrder({
    required String productId,
    required int quantity,
    OrderStatus? status,
  }) async {
    final order = OrderModel(
      id: 'test_order_${DateTime.now().millisecondsSinceEpoch}',
      buyerUserId: 'test_buyer',
      productId: productId,
      quantity: quantity,
      amount: 1000 * quantity,
      status: status ?? OrderStatus.pending,
      createdAt: DateTime.now(),
    );
    
    await testDatabase.orders.insert(order.toJson());
    return order.id;
  }
  
  // テスト用配送先作成ヘルパー
  Future<String> createTestShippingAddress() async {
    final address = ShippingAddressModel(
      id: 'test_address_${DateTime.now().millisecondsSinceEpoch}',
      userId: 'test_user',
      recipientName: 'テスト太郎',
      postalCode: '123-4567',
      prefecture: '東京都',
      city: 'テスト市',
      addressLine: 'テスト町1-2-3',
      phoneNumber: '03-1234-5678',
      isDefault: true,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
    
    await testDatabase.shippingAddresses.insert(address.toJson());
    return address.id;
  }
  
  // テストデータクリーンアップ
  Future<void> cleanupTestData() async {
    await testDatabase.products.deleteAll();
    await testDatabase.orders.deleteAll();
    await testDatabase.shippingAddresses.deleteAll();
    await testDatabase.paymentHistories.deleteAll();
  }
}

// 統合テスト用の具体的なセットアップクラス
class ECIntegrationTest extends ECTestBase {
  // 統合テスト用に拡張されたセットアップ
  @override
  Future<void> setUp() async {
    await super.setUp();
    
    // リポジトリの依存性注入
    getIt.registerSingleton<IProductRepository>(
      ProductRepository(
        remoteDataSource: ProductRemoteDataSourceImpl(
          client: MockHttpClient(),
          baseUrl: 'http://localhost:8080/test_api',
        ),
        localDataSource: ProductLocalDataSourceImpl(
          box: await Hive.openBox('test_products'),
        ),
      ),
    );
    
    // その他の依存性も同様に登録
    
    // 認証状態設定
    await SecureStorage.instance.write(
      key: 'auth_token',
      value: 'test_auth_token',
    );
  }
  
  @override
  Future<void> tearDown() async {
    // 依存性の解除
    await getIt.reset();
    
    // 認証トークン削除
    await SecureStorage.instance.delete(key: 'auth_token');
    
    await super.tearDown();
  }
}
```

## 6. セキュリティ詳細テスト

### 入力検証とサニタイゼーションテスト
| テストケース | テスト方法 | 期待される結果 |
|------------|----------|--------------|
| SQLインジェクション試行 | 商品検索やフィルター条件に SQLインジェクションコード（`' OR 1=1 --`など）を含める | エスケープ処理され、インジェクションが防止される |
| XSS攻撃試行 | 商品説明などに `<script>alert('XSS')</script>` などのコードを含める | HTMLエスケープされ、スクリプトが実行されない |
| JSONインジェクション | APIリクエストボディのJSONに不正なデータを含める | 適切なバリデーションが行われ、脆弱性が露出しない |
| パス操作 | URLパスに `../` などのディレクトリトラバーサル文字列を含める | 適切に処理され、不正なファイルアクセスが防止される |

### 権限昇格テスト
| テストケース | テスト方法 | 期待される結果 |
|------------|----------|--------------|
| 他ユーザー商品編集試行 | 他ユーザーの商品IDを指定して更新APIを呼ぶ | 403 Forbidden エラーを返し、編集が拒否される |
| 他ユーザー注文閲覧試行 | 他ユーザーの注文IDを指定して詳細取得APIを呼ぶ | 403 Forbidden エラーを返し、閲覧が拒否される |
| 権限操作試行 | ユーザー権限フィールドを管理者に変更してAPIリクエスト | サーバー側で検証され、権限変更が無視される |
| トークン改ざん | JWTトークンを改ざんしてAPIリクエスト | 無効なトークンとして拒否される |

### セッション管理テスト
| テストケース | テスト方法 | 期待される結果 |
|------------|----------|--------------|
| トークン期限切れ | 期限切れトークンでのAPI呼び出し | 401エラーの後、リフレッシュトークンによる自動更新が行われる |
| 無効トークン | 無効なトークンでのAPI呼び出し | 401エラーが返され、適切なエラー処理が行われる |
| 多重ログイン | 同一アカウントで複数デバイスからログイン | セッション管理が適切に行われ、古いセッションは必要に応じて無効化される |
| ログアウト後アクセス | ログアウト後のトークンでのAPI呼び出し | 401エラーが返され、再ログインが要求される |

### 実装方法
```dart
void testSecurityInputSanitization() async {
  // モック設定
  final mockHttpClient = MockHttpClient();
  final dataSource = ProductRemoteDataSourceImpl(
    client: mockHttpClient,
    baseUrl: 'https://api.example.com',
  );
  
  // XSS攻撃文字列を含む商品データ
  final maliciousProduct = ProductModel(
    id: 'product1',
    sellerUserId: 'seller1',
    title: '<script>alert("XSS")</script>テスト商品',
    description: '説明文 <img src="x" onerror="alert(\'XSS\')">',
    price: 1000,
    currency: 'JPY',
    imageUrl: 'https://example.com/image.jpg',
    stock: 10,
    createdAt: DateTime.now(),
  );
  
  // リクエスト検証用モック
  when(mockHttpClient.post(
    any,
    headers: anyNamed('headers'),
    body: anyNamed('body'),
  )).thenAnswer((_) async => http.Response('{"id": "product1"}', 201));
  
  // 商品作成を実行
  await dataSource.createProduct(maliciousProduct);
  
  // リクエストボディがサニタイズされていることを検証
  final capturedRequest = verify(mockHttpClient.post(
    any,
    headers: anyNamed('headers'),
    body: captureAnyNamed('body'),
  )).captured.first as String;
  
  // JSON文字列をデコード
  final requestData = json.decode(capturedRequest);
  
  // XSSが防止されていることを確認（サニタイズまたはエスケープ）
  expect(requestData['title'], isNot(contains('<script>')));
  expect(requestData['description'], isNot(contains('onerror=')));
}

void testAuthorizationChecks() async {
  // モック設定
  final mockHttpClient = MockHttpClient();
  final dataSource = ProductRemoteDataSourceImpl(
    client: mockHttpClient,
    baseUrl: 'https://api.example.com',
  );
  
  // 他ユーザーの商品を更新しようとするケース
  final product = ProductModel(
    id: 'other_user_product',
    sellerUserId: 'other_seller',
    title: 'テスト商品',
    description: '説明文',
    price: 1000,
    currency: 'JPY',
    imageUrl: 'https://example.com/image.jpg',
    stock: 10,
    createdAt: DateTime.now(),
  );
  
  // 403 Forbidden レスポンスを設定
  when(mockHttpClient.put(
    any,
    headers: anyNamed('headers'),
    body: anyNamed('body'),
  )).thenAnswer((_) async => http.Response(
    '{"error": "Forbidden: You do not have permission to update this product"}',
    403,
  ));
  
  // 更新実行と例外検証
  expect(
    () => dataSource.updateProduct(product),
    throwsA(isA<ServerException>()),
  );
}
```

## 7. 効率的なCI/CD実行戦略

### 並列テスト実行設定
```yaml
name: EC Domain Parallel Tests

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'app/lib/domain/ec/**'
      - 'app/test/domain/ec/**'

jobs:
  unit_tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.5'
          channel: 'stable'
      - name: Install dependencies
        run: cd app && flutter pub get
      - name: Run model tests
        run: cd app && flutter test test/domain/ec/models/
        
  repository_tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.5'
          channel: 'stable'
      - name: Install dependencies
        run: cd app && flutter pub get
      - name: Run repository tests
        run: cd app && flutter test test/domain/ec/repositories/
        
  usecase_tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.5'
          channel: 'stable'
      - name: Install dependencies
        run: cd app && flutter pub get
      - name: Run usecase tests
        run: cd app && flutter test test/domain/ec/usecases/
        
  viewmodel_tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.5'
          channel: 'stable'
      - name: Install dependencies
        run: cd app && flutter pub get
      - name: Run viewmodel tests
        run: cd app && flutter test test/presentation/ec/viewmodels/

  ui_tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.5'
          channel: 'stable'
      - name: Install dependencies
        run: cd app && flutter pub get
      - name: Run UI tests
        run: cd app && flutter test test/presentation/ec/screens/
        
  integration_test:
    needs: [unit_tests, repository_tests, usecase_tests, viewmodel_tests, ui_tests]
    runs-on: macos-latest  # macOSを使用してiOSシミュレータを使う
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.5'
          channel: 'stable'
      - name: Install dependencies
        run: cd app && flutter pub get
      - name: Start iOS Simulator
        run: xcrun simctl boot "iPhone 13"
      - name: Run integration tests
        run: cd app && flutter test integration_test/ec/
```

### 増分テスト戦略
```yaml
name: EC Domain Incremental Tests

on:
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'app/lib/domain/ec/**'
      - 'app/lib/data/datasources/ec/**'
      - 'app/lib/data/repositories/ec/**'
      - 'app/lib/presentation/viewmodels/ec/**'
      - 'app/lib/presentation/screens/ec/**'
      - 'app/test/domain/ec/**'

jobs:
  determine_test_path:
    runs-on: ubuntu-latest
    outputs:
      test_paths: ${{ steps.filter.outputs.test_paths }}
    steps:
      - uses: actions/checkout@v3
      - id: filter
        name: Determine affected test paths
        run: |
          # 変更されたファイルからテストパスを特定
          changed_files=$(git diff --name-only ${{ github.event.pull_request.base.sha }} ${{ github.event.pull_request.head.sha }})
          
          # テストパス配列を初期化
          test_paths=()
          
          # モデル変更
          if echo "$changed_files" | grep -q "app/lib/domain/ec/models/" || echo "$changed_files" | grep -q "app/lib/data/models/ec/"; then
            test_paths+=("test/domain/ec/models/")
          fi
          
          # リポジトリ変更
          if echo "$changed_files" | grep -q "app/lib/domain/repositories/ec/" || echo "$changed_files" | grep -q "app/lib/data/repositories/ec/"; then
            test_paths+=("test/domain/ec/repositories/")
          fi
          
          # ユースケース変更
          if echo "$changed_files" | grep -q "app/lib/domain/usecases/ec/"; then
            test_paths+=("test/domain/ec/usecases/")
          fi
          
          # ビューモデル変更
          if echo "$changed_files" | grep -q "app/lib/presentation/viewmodels/ec/"; then
            test_paths+=("test/presentation/ec/viewmodels/")
          fi
          
          # UI変更
          if echo "$changed_files" | grep -q "app/lib/presentation/screens/ec/" || echo "$changed_files" | grep -q "app/lib/presentation/widgets/ec/"; then
            test_paths+=("test/presentation/ec/screens/")
          fi
          
          # 配列をJSON化
          test_paths_json=$(printf '%s\n' "${test_paths[@]}" | jq -R . | jq -s .)
          echo "test_paths=$test_paths_json" >> $GITHUB_OUTPUT
          
  run_affected_tests:
    needs: determine_test_path
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.5'
          channel: 'stable'
      - name: Install dependencies
        run: cd app && flutter pub get
      - name: Run affected tests
        run: |
          TEST_PATHS='${{ needs.determine_test_path.outputs.test_paths }}'
          cd app
          for path in $(echo $TEST_PATHS | jq -r '.[]'); do
            echo "Running tests in $path"
            flutter test $path
          done
```

## 8. 高度なエッジケーステスト

### メモリ制約テスト
| テストケース | テスト方法 | 期待される結果 |
|------------|----------|--------------|
| 大量商品ロード | 1000商品をロードし、メモリ使用を計測 | 定義されたメモリ制限内に収まり、リソースが適切に解放される |
| 大容量画像キャッシュ | 多数の大きな商品画像を連続表示してキャッシュ動作確認 | メモリ使用量が一定以上増加せず、古いキャッシュが適切に破棄される |
| 長時間スクロール | 大量データを含む画面で長時間スクロール操作 | メモリリークが発生せず、パフォーマンスが維持される |

### 表示崩れテスト
| テストケース | テスト方法 | 期待される結果 |
|------------|----------|--------------|
| 超長テキスト | 商品タイトルや説明に非常に長いテキストを設定 | テキストが適切に省略され、UI崩れが発生しない |
| 画像なし商品 | 画像URLが空または無効な商品を表示 | プレースホルダー画像が表示され、レイアウトが崩れない |
| 価格表示桁あふれ | 非常に大きな価格（9,999,999,999円など）の表示 | 通貨フォーマットが適切に処理され、表示が崩れない |
| 多言語文字 | 商品情報に日本語、英語、絵文字、特殊文字を混在 | 文字が適切に表示され、レイアウトが崩れない |

### 極端なネットワーク条件テスト
| テストケース | テスト方法 | 期待される結果 |
|------------|----------|--------------|
| 超低速接続 | 極端に低速なネットワーク（5kbps程度）での動作 | タイムアウトが適切に処理され、ユーザーに進捗が表示される |
| パケットロス | 高いパケットロス率（30%以上）でのネットワーク通信 | リトライメカニズムが機能し、最終的にデータが取得される |
| 接続断続 | 数秒ごとに接続/切断を繰り返す環境 | 回復可能なエラーとして処理され、データの整合性が維持される |

### 実装方法
```dart
void testExtremeLongText() async {
  // 非常に長いテキストを生成
  final veryLongTitle = 'テスト商品' * 100; // 500文字程度
  final veryLongDescription = '商品説明文' * 1000; // 5000文字程度
  
  // テスト用の商品
  final product = ProductModel(
    id: 'product1',
    sellerUserId: 'seller1',
    title: veryLongTitle,
    description: veryLongDescription,
    price: 1000,
    currency: 'JPY',
    imageUrl: 'https://example.com/image.jpg',
    stock: 10,
    createdAt: DateTime.now(),
  );
  
  // モック設定
  final mockGetProductByIdUseCase = MockGetProductByIdUseCase();
  when(mockGetProductByIdUseCase(any))
      .thenAnswer((_) async => Right(product));
  
  final mockProductDetailViewModel = ProductDetailViewModel(
    getProductByIdUseCase: mockGetProductByIdUseCase,
    createOrderUseCase: MockCreateOrderUseCase(),
    processPaymentUseCase: MockProcessPaymentUseCase(),
  );
  
  await mockProductDetailViewModel.loadProduct('product1');
  
  // UI表示テスト
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        productDetailViewModelProvider.overrideWithValue(mockProductDetailViewModel),
      ],
      child: MaterialApp(
        home: ProductDetailScreen(productId: 'product1'),
      ),
    ),
  );
  
  // 画面のバウンディングボックスを取得
  final screenSize = tester.getSize(find.byType(ProductDetailScreen));
  
  // タイトルが表示領域を超えていないことを確認
  final titleWidget = find.text(veryLongTitle, findRichText: true);
  expect(titleWidget, findsOneWidget);
  
  final titleSize = tester.getSize(titleWidget);
  expect(titleSize.width, lessThanOrEqualTo(screenSize.width));
  
  // 説明文が表示されていることを確認（スクロール可能）
  expect(find.text(veryLongDescription, findRichText: true), findsOneWidget);
  
  // スクロール操作で全文が見られることを確認
  final scrollable = find.byType(Scrollable).first;
  await tester.scrollUntilVisible(
    find.text(veryLongDescription.substring(veryLongDescription.length - 20), findRichText: true),
    500.0,
    scrollable: scrollable,
  );
}

// 極端なネットワーク条件テスト
void testExtremeNetworkConditions() async {
  // テスト用のHTTPオーバーライド
  final httpOverrides = SlowNetworkHttpOverrides(
    delayMs: 3000,  // 3秒の遅延
    packetLossRate: 0.3,  // 30%のパケットロス
  );
  
  // HTTPクライアントをオーバーライド
  HttpOverrides.global = httpOverrides;
  
  try {
    // モックリポジトリ設定
    final repository = ProductRepository(
      remoteDataSource: ProductRemoteDataSourceImpl(
        client: http.Client(),  // 実際のクライアントを使用（オーバーライドされる）
        baseUrl: 'https://api.example.com',
      ),
      localDataSource: MockProductLocalDataSource(),  // ローカルデータはモック
    );
    
    // タイムアウト設定付きでテスト実行
    final stopwatch = Stopwatch()..start();
    
    // リトライ機能が働くはずなので、最終的には成功するはず
    final result = await repository.getProducts(
      sellerUserId: 'seller1',
      limit: 10,
      offset: 0,
    );
    
    stopwatch.stop();
    
    // 結果の検証
    expect(result.isRight(), isTrue);
    
    // レイテンシー計測（リトライを含むため長くなるはず）
    print('Operation completed in ${stopwatch.elapsedMilliseconds}ms');
    expect(stopwatch.elapsedMilliseconds, greaterThan(3000));  // 少なくとも1回のリトライを含む
    
    // リトライ回数の検証
    expect(httpOverrides.requestCount, greaterThan(1));
  } finally {
    // オーバーライドを元に戻す
    HttpOverrides.global = null;
  }
}

// 低速ネットワークシミュレート用クラス
class SlowNetworkHttpOverrides extends HttpOverrides {
  final int delayMs;
  final double packetLossRate;
  int requestCount = 0;
  
  SlowNetworkHttpOverrides({
    this.delayMs = 1000,
    this.packetLossRate = 0.0,
  });
  
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return SlowNetworkHttpClient(
      delayMs: delayMs,
      packetLossRate: packetLossRate,
      onRequest: () {
        requestCount++;
      },
    );
  }
}

class SlowNetworkHttpClient implements HttpClient {
  final int delayMs;
  final double packetLossRate;
  final Function()? onRequest;
  final Random _random = Random();
  
  SlowNetworkHttpClient({
    this.delayMs = 1000,
    this.packetLossRate = 0.0,
    this.onRequest,
  });
  
  // 実装省略...
  
  @override
  Future<HttpClientRequest> getUrl(Uri url) async {
    onRequest?.call();
    
    // パケットロスをシミュレート
    if (_random.nextDouble() < packetLossRate) {
      throw SocketException('Connection reset by peer');
    }
    
    // 遅延をシミュレート
    await Future.delayed(Duration(milliseconds: delayMs));
    
    // 実際のリクエスト作成（省略）
    // ...
  }
  
  // 他のメソッドも同様に実装
}
```

## 9. パフォーマンスプロファイリングテスト

### UI描画性能測定
```dart
void testUIPerfomance() async {
  // パフォーマンスオーバーレイを有効化
  debugProfileBuildsEnabled = true;
  debugProfilePaintsEnabled = true;
  
  try {
    // 大量のテストデータを生成
    final products = List.generate(100, (index) => 
      ProductModel(
        id: 'product$index',
        sellerUserId: 'seller1',
        title: 'テスト商品 $index',
        description: '商品の説明文 $index',
        price: 1000 + index * 100,
        currency: 'JPY',
        imageUrl: 'https://example.com/image$index.jpg',
        stock: 10,
        createdAt: DateTime.now(),
      )
    );
    
    // モック設定
    final mockShopViewModel = MockShopViewModel();
    when(mockShopViewModel.state).thenReturn(ShopLoaded(products));
    
    // パフォーマンス計測のセットアップ
    final performanceTracker = PerformanceTracker();
    performanceTracker.startTracking();
    
    // UIをレンダリング
    await tester.pumpWidget(
      PerformanceOverlay(
        checkerboardRasterCacheImages: true,
        checkerboardOffscreenLayers: true,
        child: ProviderScope(
          overrides: [
            shopViewModelProvider.overrideWithValue(mockShopViewModel),
          ],
          child: MaterialApp(
            home: ShopScreen(sellerUserId: 'seller1'),
          ),
        ),
      ),
    );
    
    // 初期描画のフレーム時間を記録
    final initialFrameTime = performanceTracker.getLastFrameTime();
    print('Initial frame render time: ${initialFrameTime}ms');
    
    // スクロールテスト
    final scrollable = find.byType(Scrollable).first;
    for (int i = 0; i < 20; i++) {
      await tester.drag(scrollable, Offset(0, -300));
      await tester.pump(Duration(milliseconds: 16)); // 60fpsを想定
      
      // フレームドロップをチェック
      if (performanceTracker.getLastFrameTime() > 16.7) {
        print('Frame drop detected at scroll $i: ${performanceTracker.getLastFrameTime()}ms');
      }
    }
    
    // 全体のパフォーマンスサマリーを取得
    final summary = performanceTracker.getSummary();
    
    // 基準を満たしているか検証
    expect(summary.averageFrameTime, lessThan(16.7));  // 60fpsを維持
    expect(summary.jankFramesPercentage, lessThan(5.0));  // フレームドロップが5%未満
    
    performanceTracker.stopTracking();
  } finally {
    // デバッグフラグをリセット
    debugProfileBuildsEnabled = false;
    debugProfilePaintsEnabled = false;
  }
}

// パフォーマンス計測用ヘルパークラス
class PerformanceTracker {
  final List<double> _frameTimes = [];
  Stopwatch? _frameStopwatch;
  
  void startTracking() {
    _frameTimes.clear();
    _frameStopwatch = Stopwatch()..start();
    
    // フレームコールバックを登録
    SchedulerBinding.instance.addPostFrameCallback(_recordFrameTime);
  }
  
  void _recordFrameTime(Duration timeStamp) {
    if (_frameStopwatch == null) return;
    
    final frameTime = _frameStopwatch!.elapsedMilliseconds;
    _frameTimes.add(frameTime.toDouble());
    
    _frameStopwatch!.reset();
    
    // 次のフレームも計測
    SchedulerBinding.instance.addPostFrameCallback(_recordFrameTime);
  }
  
  double getLastFrameTime() {
    return _frameTimes.isNotEmpty ? _frameTimes.last : 0.0;
  }
  
  void stopTracking() {
    _frameStopwatch?.stop();
    _frameStopwatch = null;
  }
  
  PerformanceSummary getSummary() {
    if (_frameTimes.isEmpty) {
      return PerformanceSummary(0, 0, 0, 0);
    }
    
    final avg = _frameTimes.reduce((a, b) => a + b) / _frameTimes.length;
    final jankFrames = _frameTimes.where((time) => time > 16.7).length;
    final jankPercentage = (jankFrames / _frameTimes.length) * 100;
    
    return PerformanceSummary(
      avg,
      _frameTimes.reduce((a, b) => a > b ? a : b),
      _frameTimes.reduce((a, b) => a < b ? a : b),
      jankPercentage,
    );
  }
}

class PerformanceSummary {
  final double averageFrameTime;
  final double maxFrameTime;
  final double minFrameTime;
  final double jankFramesPercentage;
  
  PerformanceSummary(
    this.averageFrameTime,
    this.maxFrameTime,
    this.minFrameTime,
    this.jankFramesPercentage,
  );
}
```

## 10. 多言語・地域特性テスト

### 異なるロケールでのテスト
| テストケース | テスト方法 | 期待される結果 |
|------------|----------|--------------|
| 日本語環境 | 端末ロケール = ja_JP | 価格がサポートされた通貨形式（¥1,000）で表示される |
| 英語環境 | 端末ロケール = en_US | 価格が適切な通貨形式（JPY 1,000）で表示される |
| アラビア語環境 | 端末ロケール = ar_SA | RTL言語サポートが機能し、レイアウトが適切に反転する |
| 複数通貨サポート | 異なる通貨コードの商品の表示 | それぞれの通貨が適切なフォーマットで表示される |

### 実装方法
```dart
void testLocalization() async {
  // テスト用の商品
  final product = ProductModel(
    id: 'product1',
    sellerUserId: 'seller1',
    title: 'テスト商品',
    description: '商品の説明文',
    price: 1000,
    currency: 'JPY',
    imageUrl: 'https://example.com/image.jpg',
    stock: 10,
    createdAt: DateTime.now(),
  );
  
  // モック設定
  final mockGetProductByIdUseCase = MockGetProductByIdUseCase();
  when(mockGetProductByIdUseCase(any))
      .thenAnswer((_) async => Right(product));
  
  final mockProductDetailViewModel = ProductDetailViewModel(
    getProductByIdUseCase: mockGetProductByIdUseCase,
    createOrderUseCase: MockCreateOrderUseCase(),
    processPaymentUseCase: MockProcessPaymentUseCase(),
  );
  
  await mockProductDetailViewModel.loadProduct('product1');
  
  // 各ロケールでのテスト
  for (final locale in [
    Locale('ja', 'JP'),
    Locale('en', 'US'),
    Locale('ar', 'SA'),
  ]) {
    // UIをレンダリング
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          productDetailViewModelProvider.overrideWithValue(mockProductDetailViewModel),
        ],
        child: MaterialApp(
          locale: locale,
          localizationsDelegates: [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
            AppLocalizations.delegate,
          ],
          supportedLocales: [
            Locale('ja', 'JP'),
            Locale('en', 'US'),
            Locale('ar', 'SA'),
          ],
          home: ProductDetailScreen(productId: 'product1'),
        ),
      ),
    );
    
    // 日本語環境での価格表示
    if (locale.languageCode == 'ja') {
      expect(find.text('¥1,000'), findsOneWidget);
    }
    
    // 英語環境での価格表示
    if (locale.languageCode == 'en') {
      expect(find.text('JPY 1,000'), findsOneWidget);
    }
    
    // アラビア語環境でのRTLサポート
    if (locale.languageCode == 'ar') {
      final directionality = tester.widget<Directionality>(
        find.descendant(
          of: find.byType(MaterialApp),
          matching: find.byType(Directionality),
        ).first,
      );
      expect(directionality.textDirection, TextDirection.rtl);
    }
  }
}
```

これらの高度なテストを実装することで、アプリケーションの品質、安定性、セキュリティを大幅に向上させることができます。特に同時実行テスト、ネットワーク復旧テスト、境界値テスト、およびセキュリティテストは、実際の環境で発生する可能性のある問題を事前に発見するのに役立ちます。