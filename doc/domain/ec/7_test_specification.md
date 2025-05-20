# ECドメインテスト仕様書

## 1. 単体テスト

### モデルテスト

#### ProductModelTest
- 商品モデルがJSON形式から正しく変換されることを確認
- 商品モデルがJSON形式に正しく変換されることを確認
- 必須フィールド（id, sellerUserId, title, description, price, currency, imageUrl, stock, createdAt）が正しく設定されることを確認
- `copyWith`メソッドが新しいインスタンスを適切に作成することを確認

#### OrderModelTest
- 注文モデルがJSON形式から正しく変換されることを確認
- 注文モデルがJSON形式に正しく変換されることを確認
- `OrderStatus`の列挙型が正しく変換されることを確認
- 関連する商品情報（ProductModel）が適切に変換されることを確認

#### ShippingAddressModelTest
- 配送先モデルがJSON形式から正しく変換されることを確認
- 配送先モデルがJSON形式に正しく変換されることを確認
- `formattedAddress`メソッドが正しい形式で住所を返すことを確認

#### PaymentHistoryModelTest
- 支払い履歴モデルがJSON形式から正しく変換されることを確認
- 支払い履歴モデルがJSON形式に正しく変換されることを確認
- `PaymentStatus`の列挙型が正しく変換されることを確認

### リポジトリテスト

#### ProductRepositoryTest
- オンライン時に`getProducts`がリモートデータソースから商品リストを取得することを確認
- オフライン時に`getProducts`がローカルキャッシュから商品リストを取得することを確認
- `getProductById`が正しく特定の商品を返すことを確認
- `createProduct`が成功した場合、作成された商品を返すことを確認
- `updateProduct`が成功した場合、更新された商品を返すことを確認
- `deleteProduct`が成功した場合、trueを返すことを確認
- サーバーエラー時に`ServerFailure`が返されることを確認
- キャッシュエラー時に`CacheFailure`が返されることを確認

#### OrderRepositoryTest
- `getOrders`が正しく注文リストを返すことを確認
- フィルタリング（ユーザーID、購入者/販売者、ステータス）が適切に動作することを確認
- `getOrderById`が正しく特定の注文を返すことを確認
- `createOrder`が成功した場合、作成された注文を返すことを確認
- `updateOrderStatus`が成功した場合、更新された注文を返すことを確認
- ネットワークエラー時の適切なエラーハンドリングを確認

#### PaymentRepositoryTest
- `createPaymentIntent`が成功した場合、クライアントシークレットを返すことを確認
- `confirmPayment`が成功した場合、trueを返すことを確認
- `requestRefund`が成功した場合、trueを返すことを確認
- `getPaymentHistory`が正しく支払い履歴を返すことを確認
- 決済処理中のエラーが適切にハンドリングされることを確認

#### ShippingAddressRepositoryTest
- `getShippingAddresses`が正しく配送先リストを返すことを確認
- `getDefaultShippingAddress`が正しくデフォルトの配送先を返すことを確認
- `saveShippingAddress`が成功した場合、保存された配送先を返すことを確認
- `deleteShippingAddress`が成功した場合、trueを返すことを確認

### データソーステスト

#### ProductRemoteDataSourceTest
- `getProducts`がAPIから正しく商品リストを取得することを確認
- `getProductById`がAPIから正しく特定の商品を取得することを確認
- `createProduct`、`updateProduct`、`deleteProduct`が正しいHTTPリクエストを送信することを確認
- 認証トークンが適切にリクエストヘッダーに含まれることを確認
- HTTPエラーが適切にServerExceptionとして処理されることを確認

#### ProductLocalDataSourceTest
- `cacheProducts`が商品リストを正しくキャッシュすることを確認
- `getProducts`がキャッシュから正しく商品リストを取得することを確認
- キャッシュされていない場合に`CacheException`が発生することを確認

#### OrderRemoteDataSourceTest / PaymentRemoteDataSourceTest
- 各メソッドが正しいエンドポイントにHTTPリクエストを送信することを確認
- リクエストボディが正しく構築されることを確認
- レスポンスが正しくパースされることを確認

### ユースケーステスト

#### GetProductsUseCaseTest
```dart
void main() {
  group('GetProductsUseCase Tests', () {
    late MockProductRepository mockRepository;
    late GetProductsUseCase useCase;

    setUp(() {
      mockRepository = MockProductRepository();
      useCase = GetProductsUseCase(repository: mockRepository);
    });

    test('リポジトリから商品リストを正しく取得できること', () async {
      // テスト用の商品リスト
      final products = [
        ProductModel(
          id: '1',
          sellerUserId: 'seller1',
          title: 'テスト商品1',
          description: '説明文1',
          price: 1000,
          currency: 'JPY',
          imageUrl: 'https://example.com/image1.jpg',
          stock: 10,
          createdAt: DateTime.now(),
        ),
        ProductModel(
          id: '2',
          sellerUserId: 'seller1',
          title: 'テスト商品2',
          description: '説明文2',
          price: 2000,
          currency: 'JPY',
          imageUrl: 'https://example.com/image2.jpg',
          stock: 5,
          createdAt: DateTime.now(),
        ),
      ];

      // モックの設定
      when(mockRepository.getProducts(
        sellerUserId: anyNamed('sellerUserId'),
        limit: anyNamed('limit'),
        offset: anyNamed('offset'),
      )).thenAnswer((_) async => Right(products));

      // テスト対象メソッドの実行
      final result = await useCase(
        sellerUserId: 'seller1',
        limit: 10,
        offset: 0,
      );

      // 結果の検証
      expect(result, isA<Right<Failure, List<ProductEntity>>>());
      expect((result as Right).value, products);
      expect(result.getOrElse(() => []).length, 2);

      // リポジトリメソッドが正しく呼ばれたことを確認
      verify(mockRepository.getProducts(
        sellerUserId: 'seller1',
        limit: 10,
        offset: 0,
      )).called(1);
    });

    test('リポジトリがエラーを返す場合、Failureが返されること', () async {
      // モックの設定
      when(mockRepository.getProducts(
        sellerUserId: anyNamed('sellerUserId'),
        limit: anyNamed('limit'),
        offset: anyNamed('offset'),
      )).thenAnswer((_) async => Left(ServerFailure('サーバーエラー')));

      // テスト対象メソッドの実行
      final result = await useCase(
        sellerUserId: 'seller1',
        limit: 10,
        offset: 0,
      );

      // 結果の検証
      expect(result, isA<Left<Failure, List<ProductEntity>>>());
      expect((result as Left).value, isA<ServerFailure>());
      expect(result.fold((l) => l.message, (r) => ''), 'サーバーエラー');
    });
  });
}
```

#### CreateOrderUseCaseTest
```dart
void main() {
  group('CreateOrderUseCase Tests', () {
    late MockOrderRepository mockOrderRepository;
    late MockProductRepository mockProductRepository;
    late CreateOrderUseCase useCase;

    setUp(() {
      mockOrderRepository = MockOrderRepository();
      mockProductRepository = MockProductRepository();
      useCase = CreateOrderUseCase(
        orderRepository: mockOrderRepository,
        productRepository: mockProductRepository,
      );
    });

    test('在庫が十分にある場合、注文が作成されること', () async {
      // テスト用のモックデータ
      final product = ProductModel(
        id: 'product1',
        sellerUserId: 'seller1',
        title: 'テスト商品',
        description: '説明文',
        price: 1000,
        currency: 'JPY',
        imageUrl: 'https://example.com/image.jpg',
        stock: 10, // 在庫十分
        createdAt: DateTime.now(),
      );

      final order = OrderModel(
        id: 'order1',
        buyerUserId: 'buyer1',
        productId: 'product1',
        quantity: 2,
        amount: 2000,
        status: OrderStatus.pending,
        createdAt: DateTime.now(),
      );

      // モックの設定
      when(mockProductRepository.getProductById(any))
          .thenAnswer((_) async => Right(product));
      when(mockOrderRepository.createOrder(any, any, any))
          .thenAnswer((_) async => Right(order));

      // テスト対象メソッドの実行
      final result = await useCase(
        productId: 'product1',
        quantity: 2,
        buyerUserId: 'buyer1',
      );

      // 結果の検証
      expect(result, isA<Right<Failure, OrderEntity>>());
      expect((result as Right).value, order);

      // リポジトリメソッドが正しく呼ばれたことを確認
      verify(mockProductRepository.getProductById('product1')).called(1);
      verify(mockOrderRepository.createOrder('product1', 2, 'buyer1')).called(1);
    });

    test('在庫が不足している場合、BusinessLogicFailureが返されること', () async {
      // テスト用のモックデータ（在庫不足）
      final product = ProductModel(
        id: 'product1',
        sellerUserId: 'seller1',
        title: 'テスト商品',
        description: '説明文',
        price: 1000,
        currency: 'JPY',
        imageUrl: 'https://example.com/image.jpg',
        stock: 1, // 在庫不足
        createdAt: DateTime.now(),
      );

      // モックの設定
      when(mockProductRepository.getProductById(any))
          .thenAnswer((_) async => Right(product));

      // テスト対象メソッドの実行（2個注文しようとする）
      final result = await useCase(
        productId: 'product1',
        quantity: 2,
        buyerUserId: 'buyer1',
      );

      // 結果の検証
      expect(result, isA<Left<Failure, OrderEntity>>());
      expect((result as Left).value, isA<BusinessLogicFailure>());
      expect(result.fold((l) => l.message, (r) => ''), contains('在庫が不足'));

      // 商品取得は呼ばれるが、注文作成は呼ばれないことを確認
      verify(mockProductRepository.getProductById('product1')).called(1);
      verifyNever(mockOrderRepository.createOrder(any, any, any));
    });
  });
}
```

#### ProcessPaymentUseCaseTest
```dart
void main() {
  group('ProcessPaymentUseCase Tests', () {
    late MockPaymentRepository mockPaymentRepository;
    late MockOrderRepository mockOrderRepository;
    late ProcessPaymentUseCase useCase;

    setUp(() {
      mockPaymentRepository = MockPaymentRepository();
      mockOrderRepository = MockOrderRepository();
      useCase = ProcessPaymentUseCase(
        paymentRepository: mockPaymentRepository,
        orderRepository: mockOrderRepository,
      );
    });

    test('注文がpending状態の場合、決済処理が開始されること', () async {
      // テスト用のモックデータ
      final order = OrderModel(
        id: 'order1',
        buyerUserId: 'buyer1',
        productId: 'product1',
        quantity: 1,
        amount: 1000,
        status: OrderStatus.pending,
        createdAt: DateTime.now(),
      );

      // モックの設定
      when(mockOrderRepository.getOrderById(any))
          .thenAnswer((_) async => Right(order));
      when(mockPaymentRepository.createPaymentIntent(any, any, any))
          .thenAnswer((_) async => Right('client_secret_123'));

      // テスト対象メソッドの実行
      final result = await useCase(orderId: 'order1');

      // 結果の検証
      expect(result, isA<Right<Failure, String>>());
      expect((result as Right).value, 'client_secret_123');

      // リポジトリメソッドが正しく呼ばれたことを確認
      verify(mockOrderRepository.getOrderById('order1')).called(1);
      verify(mockPaymentRepository.createPaymentIntent('order1', 1000, 'JPY')).called(1);
    });

    test('注文がpending状態でない場合、BusinessLogicFailureが返されること', () async {
      // テスト用のモックデータ（既に支払い済みの注文）
      final order = OrderModel(
        id: 'order1',
        buyerUserId: 'buyer1',
        productId: 'product1',
        quantity: 1,
        amount: 1000,
        status: OrderStatus.paid,
        createdAt: DateTime.now(),
      );

      // モックの設定
      when(mockOrderRepository.getOrderById(any))
          .thenAnswer((_) async => Right(order));

      // テスト対象メソッドの実行
      final result = await useCase(orderId: 'order1');

      // 結果の検証
      expect(result, isA<Left<Failure, String>>());
      expect((result as Left).value, isA<BusinessLogicFailure>());
      expect(result.fold((l) => l.message, (r) => ''), contains('既に処理されています'));

      // 注文取得は呼ばれるが、決済処理は呼ばれないことを確認
      verify(mockOrderRepository.getOrderById('order1')).called(1);
      verifyNever(mockPaymentRepository.createPaymentIntent(any, any, any));
    });
  });
}
```

### ビューモデルテスト

#### ShopViewModelTest
```dart
void main() {
  group('ShopViewModel Tests', () {
    late MockGetProductsUseCase mockGetProductsUseCase;
    late ShopViewModel viewModel;

    setUp(() {
      mockGetProductsUseCase = MockGetProductsUseCase();
      viewModel = ShopViewModel(
        getProductsUseCase: mockGetProductsUseCase,
      );
    });

    test('初期状態はShopInitialであること', () {
      expect(viewModel.state, isA<ShopInitial>());
    });

    test('loadProductsが成功した場合、状態がShopLoadedになること', () async {
      // テスト用の商品リスト
      final products = [
        ProductModel(
          id: '1',
          sellerUserId: 'seller1',
          title: 'テスト商品1',
          description: '説明文1',
          price: 1000,
          currency: 'JPY',
          imageUrl: 'https://example.com/image1.jpg',
          stock: 10,
          createdAt: DateTime.now(),
        ),
      ];

      // モックの設定
      when(mockGetProductsUseCase(
        sellerUserId: anyNamed('sellerUserId'),
        limit: anyNamed('limit'),
        offset: anyNamed('offset'),
      )).thenAnswer((_) async => Right(products));

      // テスト対象メソッドの実行
      await viewModel.loadProducts(sellerUserId: 'seller1');

      // 状態の検証
      expect(viewModel.state, isA<ShopLoaded>());
      expect((viewModel.state as ShopLoaded).products, products);
      expect((viewModel.state as ShopLoaded).products.length, 1);
    });

    test('loadProductsが失敗した場合、状態がShopErrorになること', () async {
      // モックの設定
      when(mockGetProductsUseCase(
        sellerUserId: anyNamed('sellerUserId'),
        limit: anyNamed('limit'),
        offset: anyNamed('offset'),
      )).thenAnswer((_) async => Left(ServerFailure('サーバーエラー')));

      // テスト対象メソッドの実行
      await viewModel.loadProducts(sellerUserId: 'seller1');

      // 状態の検証
      expect(viewModel.state, isA<ShopError>());
      expect((viewModel.state as ShopError).message, 'サーバーエラー');
    });

    test('追加読み込みで既存の商品リストに新しい商品が追加されること', () async {
      // 初期商品リスト
      final initialProducts = [
        ProductModel(
          id: '1',
          sellerUserId: 'seller1',
          title: 'テスト商品1',
          description: '説明文1',
          price: 1000,
          currency: 'JPY',
          imageUrl: 'https://example.com/image1.jpg',
          stock: 10,
          createdAt: DateTime.now(),
        ),
      ];

      // 追加商品リスト
      final additionalProducts = [
        ProductModel(
          id: '2',
          sellerUserId: 'seller1',
          title: 'テスト商品2',
          description: '説明文2',
          price: 2000,
          currency: 'JPY',
          imageUrl: 'https://example.com/image2.jpg',
          stock: 5,
          createdAt: DateTime.now(),
        ),
      ];

      // モックの設定（初回）
      when(mockGetProductsUseCase(
        sellerUserId: anyNamed('sellerUserId'),
        limit: anyNamed('limit'),
        offset: 0,
      )).thenAnswer((_) async => Right(initialProducts));

      // 初回読み込み
      await viewModel.loadProducts(sellerUserId: 'seller1');
      expect(viewModel.state, isA<ShopLoaded>());
      expect((viewModel.state as ShopLoaded).products.length, 1);

      // モックの設定（追加読み込み）
      when(mockGetProductsUseCase(
        sellerUserId: anyNamed('sellerUserId'),
        limit: anyNamed('limit'),
        offset: 1,
      )).thenAnswer((_) async => Right(additionalProducts));

      // 追加読み込み
      await viewModel.loadProducts(sellerUserId: 'seller1', isRefresh: false);

      // 状態の検証
      expect(viewModel.state, isA<ShopLoaded>());
      expect((viewModel.state as ShopLoaded).products.length, 2);
      expect((viewModel.state as ShopLoaded).products[0].id, '1');
      expect((viewModel.state as ShopLoaded).products[1].id, '2');
    });
  });
}
```

#### ProductDetailViewModelTest
```dart
void main() {
  group('ProductDetailViewModel Tests', () {
    late MockGetProductByIdUseCase mockGetProductByIdUseCase;
    late MockCreateOrderUseCase mockCreateOrderUseCase;
    late MockProcessPaymentUseCase mockProcessPaymentUseCase;
    late ProductDetailViewModel viewModel;

    setUp(() {
      mockGetProductByIdUseCase = MockGetProductByIdUseCase();
      mockCreateOrderUseCase = MockCreateOrderUseCase();
      mockProcessPaymentUseCase = MockProcessPaymentUseCase();
      
      viewModel = ProductDetailViewModel(
        getProductByIdUseCase: mockGetProductByIdUseCase,
        createOrderUseCase: mockCreateOrderUseCase,
        processPaymentUseCase: mockProcessPaymentUseCase,
      );
    });

    test('初期状態はProductDetailInitialであること', () {
      expect(viewModel.state, isA<ProductDetailInitial>());
    });

    test('loadProductが成功した場合、状態がProductDetailLoadedになること', () async {
      // テスト用の商品
      final product = ProductModel(
        id: 'product1',
        sellerUserId: 'seller1',
        title: 'テスト商品',
        description: '説明文',
        price: 1000,
        currency: 'JPY',
        imageUrl: 'https://example.com/image.jpg',
        stock: 10,
        createdAt: DateTime.now(),
      );

      // モックの設定
      when(mockGetProductByIdUseCase(any))
          .thenAnswer((_) async => Right(product));

      // テスト対象メソッドの実行
      await viewModel.loadProduct('product1');

      // 状態の検証
      expect(viewModel.state, isA<ProductDetailLoaded>());
      expect((viewModel.state as ProductDetailLoaded).product, product);
    });

    test('商品購入処理が成功した場合、状態がProductDetailPaymentReadyになること', () async {
      // 商品読み込み状態に設定
      final product = ProductModel(
        id: 'product1',
        sellerUserId: 'seller1',
        title: 'テスト商品',
        description: '説明文',
        price: 1000,
        currency: 'JPY',
        imageUrl: 'https://example.com/image.jpg',
        stock: 10,
        createdAt: DateTime.now(),
      );

      viewModel = ProductDetailViewModel(
        getProductByIdUseCase: mockGetProductByIdUseCase,
        createOrderUseCase: mockCreateOrderUseCase,
        processPaymentUseCase: mockProcessPaymentUseCase,
      );

      when(mockGetProductByIdUseCase(any))
          .thenAnswer((_) async => Right(product));
      await viewModel.loadProduct('product1');

      // 注文モック
      final order = OrderModel(
        id: 'order1',
        buyerUserId: 'buyer1',
        productId: 'product1',
        quantity: 1,
        amount: 1000,
        status: OrderStatus.pending,
        createdAt: DateTime.now(),
      );

      // 注文と決済処理のモック設定
      when(mockCreateOrderUseCase(
        productId: anyNamed('productId'),
        quantity: anyNamed('quantity'),
        buyerUserId: anyNamed('buyerUserId'),
      )).thenAnswer((_) async => Right(order));

      when(mockProcessPaymentUseCase(orderId: anyNamed('orderId')))
          .thenAnswer((_) async => Right('client_secret_123'));

      // テスト対象メソッドの実行
      await viewModel.purchaseProduct('product1', 1, 'buyer1');

      // 状態の検証
      expect(viewModel.state, isA<ProductDetailPaymentReady>());
      expect((viewModel.state as ProductDetailPaymentReady).order, order);
      expect((viewModel.state as ProductDetailPaymentReady).paymentClientSecret, 'client_secret_123');
    });

    test('在庫不足の場合、状態がProductDetailErrorになること', () async {
      // 商品読み込み状態に設定（在庫1個）
      final product = ProductModel(
        id: 'product1',
        sellerUserId: 'seller1',
        title: 'テスト商品',
        description: '説明文',
        price: 1000,
        currency: 'JPY',
        imageUrl: 'https://example.com/image.jpg',
        stock: 1,
        createdAt: DateTime.now(),
      );

      viewModel = ProductDetailViewModel(
        getProductByIdUseCase: mockGetProductByIdUseCase,
        createOrderUseCase: mockCreateOrderUseCase,
        processPaymentUseCase: mockProcessPaymentUseCase,
      );

      when(mockGetProductByIdUseCase(any))
          .thenAnswer((_) async => Right(product));
      await viewModel.loadProduct('product1');

      // テスト対象メソッドの実行（2個購入しようとする）
      await viewModel.purchaseProduct('product1', 2, 'buyer1');

      // 状態の検証
      expect(viewModel.state, isA<ProductDetailError>());
      expect((viewModel.state as ProductDetailError).message, contains('在庫が不足'));
    });
  });
}
```

## 2. 統合テスト

### 商品管理フロー統合テスト
- 商品の登録から詳細表示、編集、削除までの一連のフローをテスト
- 在庫数の更新が商品詳細画面に正しく反映されることを確認
- 商品画像のアップロードと表示のフローをテスト

### 購入フロー統合テスト
- 商品詳細表示から購入、決済までの一連のフローをテスト
- 決済処理後に注文履歴に正しく反映されることを確認
- 決済完了後に在庫数が正しく減少していることを確認
- 返金処理のフローをテスト

### 注文管理フロー統合テスト
- 注文一覧から詳細表示、ステータス更新までの一連のフローをテスト
- 販売者と購入者それぞれの視点での注文表示をテスト
- 注文ステータス更新が両方のユーザーに正しく反映されることを確認

## 3. UIテスト

### ShopScreenTest
```dart
void main() {
  testWidgets('商品一覧画面が正しく表示されることをテスト', (WidgetTester tester) async {
    // モックデータとプロバイダーの設定
    final mockShopViewModel = MockShopViewModel();
    final mockProducts = [
      ProductModel(
        id: '1',
        sellerUserId: 'seller1',
        title: 'テスト商品1',
        description: '説明文1',
        price: 1000,
        currency: 'JPY',
        imageUrl: 'https://example.com/image1.jpg',
        stock: 10,
        createdAt: DateTime.now(),
      ),
      ProductModel(
        id: '2',
        sellerUserId: 'seller1',
        title: 'テスト商品2',
        description: '説明文2',
        price: 2000,
        currency: 'JPY',
        imageUrl: 'https://example.com/image2.jpg',
        stock: 5,
        createdAt: DateTime.now(),
      ),
    ];
    
    // モックの状態を設定
    when(mockShopViewModel.state).thenReturn(ShopLoaded(mockProducts));
    
    // テスト対象ウィジェットをレンダリング
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          shopViewModelProvider.overrideWithValue(mockShopViewModel),
        ],
        child: MaterialApp(
          home: ShopScreen(sellerUserId: 'seller1'),
        ),
      ),
    );
    
    // UI要素の存在チェック
    expect(find.text('テスト商品1'), findsOneWidget);
    expect(find.text('テスト商品2'), findsOneWidget);
    expect(find.text('¥1,000'), findsOneWidget);
    expect(find.text('¥2,000'), findsOneWidget);
    
    // 商品カードをタップ
    await tester.tap(find.text('テスト商品1'));
    await tester.pumpAndSettle();
    
    // 商品詳細画面に遷移したことを確認
    expect(find.byType(ProductDetailScreen), findsOneWidget);
  });

  testWidgets('商品一覧の読み込み中状態が正しく表示されることをテスト', (WidgetTester tester) async {
    // モックの設定
    final mockShopViewModel = MockShopViewModel();
    when(mockShopViewModel.state).thenReturn(ShopLoading());
    
    // テスト対象ウィジェットをレンダリング
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          shopViewModelProvider.overrideWithValue(mockShopViewModel),
        ],
        child: MaterialApp(
          home: ShopScreen(sellerUserId: 'seller1'),
        ),
      ),
    );
    
    // ローディングインジケータが表示されることを確認
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('エラー状態が正しく表示されることをテスト', (WidgetTester tester) async {
    // モックの設定
    final mockShopViewModel = MockShopViewModel();
    when(mockShopViewModel.state).thenReturn(ShopError('商品の取得に失敗しました'));
    
    // テスト対象ウィジェットをレンダリング
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          shopViewModelProvider.overrideWithValue(mockShopViewModel),
        ],
        child: MaterialApp(
          home: ShopScreen(sellerUserId: 'seller1'),
        ),
      ),
    );
    
    // エラーメッセージが表示されることを確認
    expect(find.text('商品の取得に失敗しました'), findsOneWidget);
    expect(find.text('再試行'), findsOneWidget);
    
    // 再試行ボタンをタップ
    await tester.tap(find.text('再試行'));
    await tester.pump();
    
    // loadProductsメソッドが呼ばれたことを確認
    verify(mockShopViewModel.loadProducts(
      sellerUserId: 'seller1',
      isRefresh: true,
    )).called(1);
  });
}
```

### ProductDetailScreenTest
```dart
void main() {
  testWidgets('商品詳細画面が正しく表示されることをテスト', (WidgetTester tester) async {
    // モックデータとプロバイダーの設定
    final mockProductDetailViewModel = MockProductDetailViewModel();
    final mockProduct = ProductModel(
      id: 'product1',
      sellerUserId: 'seller1',
      title: 'テスト商品',
      description: '商品の詳細な説明文です。',
      price: 1500,
      currency: 'JPY',
      imageUrl: 'https://example.com/image.jpg',
      stock: 10,
      createdAt: DateTime.now(),
    );
    
    // モックの状態を設定
    when(mockProductDetailViewModel.state)
        .thenReturn(ProductDetailLoaded(mockProduct));
    
    // テスト対象ウィジェットをレンダリング
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
    
    // UI要素の存在チェック
    expect(find.text('テスト商品'), findsOneWidget);
    expect(find.text('商品の詳細な説明文です。'), findsOneWidget);
    expect(find.text('¥1,500'), findsOneWidget);
    expect(find.text('在庫: 10'), findsOneWidget);
    expect(find.byType(Image), findsOneWidget);
    expect(find.text('購入する'), findsOneWidget);
    
    // 購入ボタンをタップ
    await tester.tap(find.text('購入する'));
    await tester.pump();
    
    // 数量選択ダイアログが表示されることを確認
    expect(find.text('数量を選択'), findsOneWidget);
    expect(find.byType(QuantitySelector), findsOneWidget);
    
    // 数量を選択して確定
    await tester.tap(find.text('確定'));
    await tester.pump();
    
    // purchaseProductメソッドが呼ばれたことを確認
    verify(mockProductDetailViewModel.purchaseProduct(
      'product1',
      any,
      any,
    )).called(1);
  });

  testWidgets('決済準備ができた状態で決済画面が表示されることをテスト', (WidgetTester tester) async {
    // モックデータとプロバイダーの設定
    final mockProductDetailViewModel = MockProductDetailViewModel();
    final mockOrder = OrderModel(
      id: 'order1',
      buyerUserId: 'buyer1',
      productId: 'product1',
      quantity: 1,
      amount: 1500,
      status: OrderStatus.pending,
      createdAt: DateTime.now(),
    );
    
    // モックの状態を設定
    when(mockProductDetailViewModel.state).thenReturn(
      ProductDetailPaymentReady(mockOrder, 'client_secret_123'),
    );
    
    // テスト対象ウィジェットをレンダリング
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
    
    // 決済画面が表示されることを確認
    expect(find.text('お支払い'), findsOneWidget);
    expect(find.text('¥1,500をお支払いします'), findsOneWidget);
    expect(find.byType(CardField), findsOneWidget);
    expect(find.text('決済する'), findsOneWidget);
  });

  testWidgets('在庫切れの商品は購入ボタンが無効化されることをテスト', (WidgetTester tester) async {
    // モックデータとプロバイダーの設定（在庫0）
    final mockProductDetailViewModel = MockProductDetailViewModel();
    final mockProduct = ProductModel(
      id: 'product1',
      sellerUserId: 'seller1',
      title: 'テスト商品',
      description: '商品の詳細な説明文です。',
      price: 1500,
      currency: 'JPY',
      imageUrl: 'https://example.com/image.jpg',
      stock: 0,
      createdAt: DateTime.now(),
    );
    
    // モックの状態を設定
    when(mockProductDetailViewModel.state)
        .thenReturn(ProductDetailLoaded(mockProduct));
    
    // テスト対象ウィジェットをレンダリング
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
    
    // 在庫切れ表示と無効化された購入ボタンを確認
    expect(find.text('在庫: 0 (売り切れ)'), findsOneWidget);
    expect(tester.widget<ElevatedButton>(find.byType(ElevatedButton)).enabled, isFalse);
  });
}
```

### OrderListScreenTest
```dart
void main() {
  testWidgets('注文一覧画面が正しく表示されることをテスト', (WidgetTester tester) async {
    // モックデータとプロバイダーの設定
    final mockOrderListViewModel = MockOrderListViewModel();
    final mockOrders = [
      OrderModel(
        id: 'order1',
        buyerUserId: 'buyer1',
        productId: 'product1',
        quantity: 1,
        amount: 1500,
        status: OrderStatus.paid,
        createdAt: DateTime.now().subtract(Duration(days: 1)),
        product: ProductModel(
          id: 'product1',
          sellerUserId: 'seller1',
          title: 'テスト商品1',
          description: '説明文1',
          price: 1500,
          currency: 'JPY',
          imageUrl: 'https://example.com/image1.jpg',
          stock: 10,
          createdAt: DateTime.now(),
        ),
      ),
      OrderModel(
        id: 'order2',
        buyerUserId: 'buyer1',
        productId: 'product2',
        quantity: 2,
        amount: 3000,
        status: OrderStatus.pending,
        createdAt: DateTime.now(),
        product: ProductModel(
          id: 'product2',
          sellerUserId: 'seller2',
          title: 'テスト商品2',
          description: '説明文2',
          price: 1500,
          currency: 'JPY',
          imageUrl: 'https://example.com/image2.jpg',
          stock: 5,
          createdAt: DateTime.now(),
        ),
      ),
    ];
    
    // モックの状態を設定
    when(mockOrderListViewModel.state).thenReturn(OrderListLoaded(mockOrders));
    
    // テスト対象ウィジェットをレンダリング
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          orderListViewModelProvider.overrideWithValue(mockOrderListViewModel),
        ],
        child: MaterialApp(
          home: OrderListScreen(userId: 'buyer1', isBuyer: true),
        ),
      ),
    );
    
    // UI要素の存在チェック
    expect(find.text('注文履歴'), findsOneWidget);
    expect(find.text('テスト商品1'), findsOneWidget);
    expect(find.text('テスト商品2'), findsOneWidget);
    expect(find.text('支払い完了'), findsOneWidget);
    expect(find.text('注文受付'), findsOneWidget);
    expect(find.text('¥1,500 × 1'), findsOneWidget);
    expect(find.text('¥1,500 × 2'), findsOneWidget);
    
    // 注文アイテムをタップ
    await tester.tap(find.text('テスト商品1'));
    await tester.pumpAndSettle();
    
    // 注文詳細画面に遷移したことを確認
    expect(find.byType(OrderDetailScreen), findsOneWidget);
  });

  testWidgets('注文リストのフィルタリングが正しく動作することをテスト', (WidgetTester tester) async {
    // モックデータとプロバイダーの設定
    final mockOrderListViewModel = MockOrderListViewModel();
    final mockOrders = [
      OrderModel(
        id: 'order1',
        buyerUserId: 'buyer1',
        productId: 'product1',
        quantity: 1,
        amount: 1500,
        status: OrderStatus.paid,
        createdAt: DateTime.now(),
        product: ProductModel(
          id: 'product1',
          sellerUserId: 'seller1',
          title: 'テスト商品1',
          description: '説明文1',
          price: 1500,
          currency: 'JPY',
          imageUrl: 'https://example.com/image1.jpg',
          stock: 10,
          createdAt: DateTime.now(),
        ),
      ),
    ];
    
    // モックの状態を設定
    when(mockOrderListViewModel.state).thenReturn(OrderListLoaded(mockOrders));
    
    // テスト対象ウィジェットをレンダリング
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          orderListViewModelProvider.overrideWithValue(mockOrderListViewModel),
        ],
        child: MaterialApp(
          home: OrderListScreen(userId: 'buyer1', isBuyer: true),
        ),
      ),
    );
    
    // フィルターボタンをタップ
    await tester.tap(find.byIcon(Icons.filter_list));
    await tester.pumpAndSettle();
    
    // フィルターダイアログが表示されることを確認
    expect(find.text('注文ステータスでフィルター'), findsOneWidget);
    expect(find.text('すべて'), findsOneWidget);
    expect(find.text('注文受付'), findsOneWidget);
    expect(find.text('支払い完了'), findsOneWidget);
    expect(find.text('発送済み'), findsOneWidget);
    expect(find.text('返金済み'), findsOneWidget);
    
    // 「支払い完了」フィルターを選択
    await tester.tap(find.text('支払い完了'));
    await tester.tap(find.text('適用'));
    await tester.pumpAndSettle();
    
    // getOrdersメソッドが適切なパラメータで呼ばれたことを確認
    verify(mockOrderListViewModel.getOrders(
      userId: 'buyer1',
      isBuyer: true,
      status: OrderStatus.paid,
    )).called(1);
  });
}
```

## 4. モック設定

### モックリポジトリクラス

```dart
// MockProductRepository
class MockProductRepository implements IProductRepository {
  final Map<String, ProductEntity> _products = {};
  bool _isOnline = true;
  
  MockProductRepository() {
    // テスト用商品を初期化
    _products['product1'] = ProductModel(
      id: 'product1',
      sellerUserId: 'seller1',
      title: 'テスト商品1',
      description: '説明文1',
      price: 1000,
      currency: 'JPY',
      imageUrl: 'https://example.com/image1.jpg',
      stock: 10,
      createdAt: DateTime.now(),
    );
    
    _products['product2'] = ProductModel(
      id: 'product2',
      sellerUserId: 'seller1',
      title: 'テスト商品2',
      description: '説明文2',
      price: 2000,
      currency: 'JPY',
      imageUrl: 'https://example.com/image2.jpg',
      stock: 5,
      createdAt: DateTime.now(),
    );
  }
  
  void setOnlineMode(bool isOnline) {
    _isOnline = isOnline;
  }
  
  @override
  Future<Either<Failure, List<ProductEntity>>> getProducts({
    String? sellerUserId,
    int limit = 20,
    int offset = 0,
  }) async {
    if (!_isOnline) {
      return Left(NetworkFailure('ネットワーク接続エラー'));
    }
    
    final filteredProducts = _products.values
        .where((p) => sellerUserId == null || p.sellerUserId == sellerUserId)
        .skip(offset)
        .take(limit)
        .toList();
    
    return Right(filteredProducts);
  }
  
  @override
  Future<Either<Failure, ProductEntity>> getProductById(String productId) async {
    if (!_isOnline) {
      return Left(NetworkFailure('ネットワーク接続エラー'));
    }
    
    final product = _products[productId];
    if (product == null) {
      return Left(NotFoundFailure('商品が見つかりません'));
    }
    
    return Right(product);
  }
  
  // 他のメソッドも同様に実装
}

// MockOrderRepository
class MockOrderRepository implements IOrderRepository {
  final List<OrderEntity> _orders = [];
  
  MockOrderRepository() {
    // テスト用注文を初期化
  }
  
  @override
  Future<Either<Failure, List<OrderEntity>>> getOrders({
    String? userId,
    bool isBuyer = true,
    OrderStatus? status,
    int limit = 20,
    int offset = 0,
  }) async {
    final filteredOrders = _orders
        .where((o) => userId == null || 
            (isBuyer ? o.buyerUserId == userId : o.product?.sellerUserId == userId))
        .where((o) => status == null || o.status == status)
        .skip(offset)
        .take(limit)
        .toList();
    
    return Right(filteredOrders);
  }
  
  @override
  Future<Either<Failure, OrderEntity>> createOrder(
    String productId, 
    int quantity, 
    String buyerUserId
  ) async {
    final order = OrderModel(
      id: 'order_${DateTime.now().millisecondsSinceEpoch}',
      buyerUserId: buyerUserId,
      productId: productId,
      quantity: quantity,
      amount: 1000 * quantity, // テスト用固定価格
      status: OrderStatus.pending,
      createdAt: DateTime.now(),
    );
    
    _orders.add(order);
    return Right(order);
  }
  
  // 他のメソッドも同様に実装
}

// MockPaymentRepository
class MockPaymentRepository implements IPaymentRepository {
  bool _shouldSucceed = true;
  
  void setSuccessMode(bool succeed) {
    _shouldSucceed = succeed;
  }
  
  @override
  Future<Either<Failure, String>> createPaymentIntent(
    String orderId,
    double amount,
    String currency
  ) async {
    if (_shouldSucceed) {
      return Right('mock_client_secret_for_$orderId');
    } else {
      return Left(PaymentFailure('決済処理の初期化に失敗しました'));
    }
  }
  
  // 他のメソッドも同様に実装
}
```

## 5. CI/CD設定

### GitHubワークフロー設定

```yaml
name: EC Domain Tests

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'app/lib/domain/entities/product_*.dart'
      - 'app/lib/domain/entities/order_*.dart'
      - 'app/lib/domain/repositories/product_*.dart'
      - 'app/lib/domain/repositories/order_*.dart'
      - 'app/lib/domain/repositories/payment_*.dart'
      - 'app/lib/domain/usecases/**'
      - 'app/lib/data/models/product_*.dart'
      - 'app/lib/data/models/order_*.dart'
      - 'app/lib/data/repositories/**'
      - 'app/lib/presentation/viewmodels/shop_*.dart'
      - 'app/lib/presentation/viewmodels/product_*.dart'
      - 'app/lib/presentation/viewmodels/order_*.dart'
      - 'app/lib/presentation/screens/shop_*.dart'
      - 'app/lib/presentation/screens/product_*.dart'
      - 'app/lib/presentation/screens/order_*.dart'
      - 'app/test/domain/ec/**'
      - 'app/test/data/ec/**'
      - 'app/test/presentation/ec/**'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'app/lib/domain/ec/**'
      - 'app/lib/data/ec/**'
      - 'app/lib/presentation/ec/**'
      - 'app/test/domain/ec/**'
      - 'app/test/data/ec/**'
      - 'app/test/presentation/ec/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.5'
          channel: 'stable'
      - name: Install dependencies
        run: cd app && flutter pub get
      - name: Run tests
        run: cd app && flutter test test/domain/ec/ test/data/ec/ test/presentation/ec/
      - name: Run integration tests
        run: cd app && flutter test integration_test/ec/
```

## 6. テストのベストプラクティス

1. **テスト間の独立性を確保**
   - 各テストは他のテストの実行結果に依存しないようにする
   - `setUp`と`tearDown`を使って適切にテスト環境を初期化・クリーンアップする

2. **モックの適切な使用**
   - 外部依存（API、データベース、Stripe決済、ファイルシステム）はモック化する
   - Mockito/MockKを使用して依存性をモック化する
   - 様々なシナリオ（成功、失敗、タイムアウト、在庫切れなど）をテストできるようにする

3. **テストカバレッジの最適化**
   - すべてのビジネスロジックに対するテストを書く
   - 商品在庫、注文ステータス、決済状態などのエッジケースをテストする
   - 決済エラーと在庫管理の整合性の検証を含める

4. **見やすいテスト**
   - AAA（Arrange-Act-Assert）パターンを使用
   - テスト名は何をテストしているかを明確に示す
   - 各テストはできるだけ単一の機能や動作に焦点を当てる

5. **フレームワーク機能の活用**
   - Flutter の testWidgets を使用して UI をテスト
   - group を使ってテストを論理的にグループ化
   - 必要に応じて skip や timeout など特殊なフラグを使用

## 7. テスト環境設定

### テストデータの設定
```dart
// test/fixtures/ec/product.json
{
  "id": "123",
  "seller_user_id": "seller1",
  "title": "テスト商品",
  "description": "これはテスト用の商品です",
  "price": 1000,
  "currency": "JPY",
  "image_url": "https://example.com/image.jpg",
  "stock": 10,
  "created_at": "2023-01-01T12:00:00Z"
}

// test/fixtures/ec/order.json
{
  "id": "456",
  "buyer_user_id": "buyer1",
  "product_id": "123",
  "quantity": 2,
  "amount": 2000,
  "stripe_payment_id": "pi_123456",
  "status": "paid",
  "created_at": "2023-01-01T13:00:00Z",
  "product": {
    "id": "123",
    "seller_user_id": "seller1",
    "title": "テスト商品",
    "description": "これはテスト用の商品です",
    "price": 1000,
    "currency": "JPY",
    "image_url": "https://example.com/image.jpg",
    "stock": 10,
    "created_at": "2023-01-01T12:00:00Z"
  }
}

// FixtureReader
String fixture(String path) => File('test/fixtures/$path').readAsStringSync();
```

### テストヘルパー
```dart
// テストのセットアップを簡略化するヘルパー関数
Future<MockProductRepository> setupProductRepositoryTest() async {
  final repository = MockProductRepository();
  // 必要に応じて初期設定
  return repository;
}

// ウィジェットテスト用のアプリラッパー
Widget makeTestableWidget({
  required Widget child,
  required List<Override> overrides,
}) {
  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(
      home: child,
    ),
  );
}
```

## 8. スケジュールと優先順位

1. **第1フェーズ（基本的なモデルとリポジトリテスト）**
   - ProductModelTest, OrderModelTest
   - ProductRepositoryTest（基本機能）
   - OrderRepositoryTest（基本機能）

2. **第2フェーズ（ユースケースとビューモデルテスト）**
   - GetProductsUseCaseTest, GetProductByIdUseCaseTest
   - CreateOrderUseCaseTest, ProcessPaymentUseCaseTest
   - ShopViewModelTest, ProductDetailViewModelTest（基本機能）

3. **第3フェーズ（残りのリポジトリとユースケース）**
   - PaymentRepositoryTest, ShippingAddressRepositoryTest
   - 残りのユースケーステスト

4. **第4フェーズ（UIテスト）**
   - ShopScreenTest
   - ProductDetailScreenTest
   - OrderListScreenTest, OrderDetailScreenTest

5. **第5フェーズ（統合テスト）**
   - 商品管理フロー統合テスト
   - 購入フロー統合テスト
   - 注文管理フロー統合テスト

## 9. 性能テスト

### レスポンス時間テスト
- 商品一覧の初期表示が200ms以内であることを確認
- 商品詳細の表示が300ms以内であることを確認
- 決済処理の完了通知が3秒以内であることを確認
- 在庫更新のリアルタイム反映が500ms以内であることを確認

### メモリ使用量テスト
- 商品画像のキャッシュがメモリを過剰に使用しないことを確認
- 商品一覧の無限スクロールがメモリリークを起こさないことを確認
- 決済処理中のメモリ使用量が適切であることを確認

## 10. セキュリティテスト

- 支払い情報がアプリ内に保存されないことを確認
- カード情報がAPIクライアント経由で適切に処理されることを確認
- 決済処理は必ずサーバーサイドで最終確認されることを確認
- 価格や在庫の改ざんが適切に防止されることを確認
- 個人情報（配送先など）が適切に保護されることを確認