# ECドメイン詳細設計

## 1. アーキテクチャ概要

ECドメインは、クリーンアーキテクチャに基づき以下の層に分けて実装します。

### プレゼンテーション層
- **画面（Screens）**
  - ShopScreen
  - ProductDetailScreen
  - ProductManagementScreen
  - ProductCreateScreen
  - ProductEditScreen
  - OrderListScreen
  - OrderDetailScreen
  - OrderCompletionScreen
  - SalesAnalysisScreen

- **ビューモデル（ViewModels）**
  - ShopViewModel
  - ProductDetailViewModel
  - ProductManagementViewModel
  - ProductCreateViewModel
  - ProductEditViewModel
  - OrderListViewModel
  - OrderDetailViewModel
  - SalesAnalysisViewModel

- **ウィジェット（Widgets）**
  - ProductCard
  - ProductGridItem
  - OrderItem
  - PriceDisplay
  - QuantitySelector
  - PaymentMethodSelector
  - OrderStatusBadge
  - StockIndicator
  - ShippingAddressCard
  - PaymentSummary

### ドメイン層
- **エンティティ（Entities）**
  - ProductEntity
  - OrderEntity
  - ShippingAddressEntity
  - PaymentHistoryEntity

- **リポジトリインターフェース（Repository Interfaces）**
  - IProductRepository
  - IOrderRepository
  - IShippingAddressRepository
  - IPaymentRepository

- **ユースケース（Use Cases）**
  - GetProductsUseCase
  - GetProductByIdUseCase
  - CreateProductUseCase
  - UpdateProductUseCase
  - DeleteProductUseCase
  - GetOrdersUseCase
  - GetOrderByIdUseCase
  - CreateOrderUseCase
  - UpdateOrderStatusUseCase
  - ProcessPaymentUseCase
  - RequestRefundUseCase
  - GetShippingAddressesUseCase
  - SaveShippingAddressUseCase
  - GetSalesAnalyticsUseCase

### データ層
- **リポジトリ実装（Repository Implementations）**
  - ProductRepository
  - OrderRepository
  - ShippingAddressRepository
  - PaymentRepository

- **データソース（Data Sources）**
  - ProductRemoteDataSource
  - OrderRemoteDataSource
  - ShippingAddressRemoteDataSource
  - PaymentRemoteDataSource
  - ProductLocalDataSource
  - OrderLocalDataSource
  - ShippingAddressLocalDataSource

- **モデル（Models）**
  - ProductModel
  - OrderModel
  - ShippingAddressModel
  - PaymentHistoryModel

## 2. データモデル詳細

### ProductModel
```dart
class ProductModel extends ProductEntity {
  final String id;
  final String sellerUserId;
  final String title;
  final String description;
  final double price;
  final String currency;
  final String imageUrl;
  final int stock;
  final DateTime createdAt;
  
  ProductModel({
    required this.id,
    required this.sellerUserId,
    required this.title,
    required this.description,
    required this.price,
    required this.currency,
    required this.imageUrl,
    required this.stock,
    required this.createdAt,
  });
  
  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['id'],
      sellerUserId: json['seller_user_id'],
      title: json['title'],
      description: json['description'],
      price: json['price'].toDouble(),
      currency: json['currency'],
      imageUrl: json['image_url'],
      stock: json['stock'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'seller_user_id': sellerUserId,
      'title': title,
      'description': description,
      'price': price,
      'currency': currency,
      'image_url': imageUrl,
      'stock': stock,
      'created_at': createdAt.toIso8601String(),
    };
  }
  
  ProductModel copyWith({
    String? id,
    String? sellerUserId,
    String? title,
    String? description,
    double? price,
    String? currency,
    String? imageUrl,
    int? stock,
    DateTime? createdAt,
  }) {
    return ProductModel(
      id: id ?? this.id,
      sellerUserId: sellerUserId ?? this.sellerUserId,
      title: title ?? this.title,
      description: description ?? this.description,
      price: price ?? this.price,
      currency: currency ?? this.currency,
      imageUrl: imageUrl ?? this.imageUrl,
      stock: stock ?? this.stock,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
```

### OrderModel
```dart
enum OrderStatus { pending, paid, shipped, refunded }

class OrderModel extends OrderEntity {
  final String id;
  final String buyerUserId;
  final String productId;
  final int quantity;
  final double amount;
  final String? stripePaymentId;
  final OrderStatus status;
  final DateTime createdAt;
  final ProductModel? product; // 関連する商品情報を含む場合
  
  OrderModel({
    required this.id,
    required this.buyerUserId,
    required this.productId,
    required this.quantity,
    required this.amount,
    this.stripePaymentId,
    required this.status,
    required this.createdAt,
    this.product,
  });
  
  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'],
      buyerUserId: json['buyer_user_id'],
      productId: json['product_id'],
      quantity: json['quantity'],
      amount: json['amount'].toDouble(),
      stripePaymentId: json['stripe_payment_id'],
      status: OrderStatus.values.byName(json['status']),
      createdAt: DateTime.parse(json['created_at']),
      product: json['product'] != null 
          ? ProductModel.fromJson(json['product']) 
          : null,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'buyer_user_id': buyerUserId,
      'product_id': productId,
      'quantity': quantity,
      'amount': amount,
      'stripe_payment_id': stripePaymentId,
      'status': status.name,
      'created_at': createdAt.toIso8601String(),
      'product': product?.toJson(),
    };
  }
  
  OrderModel copyWith({
    String? id,
    String? buyerUserId,
    String? productId,
    int? quantity,
    double? amount,
    String? stripePaymentId,
    OrderStatus? status,
    DateTime? createdAt,
    ProductModel? product,
  }) {
    return OrderModel(
      id: id ?? this.id,
      buyerUserId: buyerUserId ?? this.buyerUserId,
      productId: productId ?? this.productId,
      quantity: quantity ?? this.quantity,
      amount: amount ?? this.amount,
      stripePaymentId: stripePaymentId ?? this.stripePaymentId,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      product: product ?? this.product,
    );
  }
}
```

### ShippingAddressModel
```dart
class ShippingAddressModel extends ShippingAddressEntity {
  final String id;
  final String userId;
  final String recipientName;
  final String postalCode;
  final String prefecture;
  final String city;
  final String addressLine;
  final String phoneNumber;
  final bool isDefault;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  ShippingAddressModel({
    required this.id,
    required this.userId,
    required this.recipientName,
    required this.postalCode,
    required this.prefecture,
    required this.city,
    required this.addressLine,
    required this.phoneNumber,
    required this.isDefault,
    required this.createdAt,
    required this.updatedAt,
  });
  
  factory ShippingAddressModel.fromJson(Map<String, dynamic> json) {
    return ShippingAddressModel(
      id: json['id'],
      userId: json['user_id'],
      recipientName: json['recipient_name'],
      postalCode: json['postal_code'],
      prefecture: json['prefecture'],
      city: json['city'],
      addressLine: json['address_line'],
      phoneNumber: json['phone_number'],
      isDefault: json['is_default'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'recipient_name': recipientName,
      'postal_code': postalCode,
      'prefecture': prefecture,
      'city': city,
      'address_line': addressLine,
      'phone_number': phoneNumber,
      'is_default': isDefault,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
  
  String get formattedAddress {
    return '〒$postalCode $prefecture$city$addressLine';
  }
}
```

### PaymentHistoryModel
```dart
enum PaymentStatus { succeeded, failed, refunded }

class PaymentHistoryModel extends PaymentHistoryEntity {
  final String id;
  final String orderId;
  final String paymentMethod;
  final String transactionId;
  final double amount;
  final PaymentStatus status;
  final DateTime paymentDate;
  
  PaymentHistoryModel({
    required this.id,
    required this.orderId,
    required this.paymentMethod,
    required this.transactionId,
    required this.amount,
    required this.status,
    required this.paymentDate,
  });
  
  factory PaymentHistoryModel.fromJson(Map<String, dynamic> json) {
    return PaymentHistoryModel(
      id: json['id'],
      orderId: json['order_id'],
      paymentMethod: json['payment_method'],
      transactionId: json['transaction_id'],
      amount: json['amount'].toDouble(),
      status: PaymentStatus.values.byName(json['status']),
      paymentDate: DateTime.parse(json['payment_date']),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order_id': orderId,
      'payment_method': paymentMethod,
      'transaction_id': transactionId,
      'amount': amount,
      'status': status.name,
      'payment_date': paymentDate.toIso8601String(),
    };
  }
}
```

## 3. リポジトリ詳細

### ProductRepository
```dart
class ProductRepository implements IProductRepository {
  final ProductRemoteDataSource remoteDataSource;
  final ProductLocalDataSource localDataSource;
  
  ProductRepository({
    required this.remoteDataSource,
    required this.localDataSource,
  });
  
  @override
  Future<Either<Failure, List<ProductEntity>>> getProducts({
    String? sellerUserId,
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      // ネットワーク状態のチェック
      if (await _isOffline()) {
        // オフラインの場合はローカルキャッシュから取得
        return Right(await localDataSource.getProducts(
          sellerUserId: sellerUserId,
          limit: limit,
          offset: offset,
        ));
      }
      
      // オンラインの場合はリモートから取得
      final products = await remoteDataSource.getProducts(
        sellerUserId: sellerUserId,
        limit: limit,
        offset: offset,
      );
      
      // ローカルキャッシュの更新
      await localDataSource.cacheProducts(products);
      
      return Right(products);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, ProductEntity>> getProductById(String productId) async {
    try {
      // ネットワーク状態のチェック
      if (await _isOffline()) {
        // オフラインの場合はローカルキャッシュから取得
        final product = await localDataSource.getProductById(productId);
        if (product != null) {
          return Right(product);
        } else {
          return Left(CacheFailure('商品が見つかりません'));
        }
      }
      
      // オンラインの場合はリモートから取得
      final product = await remoteDataSource.getProductById(productId);
      
      // ローカルキャッシュの更新
      await localDataSource.cacheProduct(product);
      
      return Right(product);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, ProductEntity>> createProduct(ProductEntity product) async {
    try {
      final createdProduct = await remoteDataSource.createProduct(product as ProductModel);
      
      // ローカルキャッシュの更新
      await localDataSource.cacheProduct(createdProduct);
      
      return Right(createdProduct);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, ProductEntity>> updateProduct(ProductEntity product) async {
    try {
      final updatedProduct = await remoteDataSource.updateProduct(product as ProductModel);
      
      // ローカルキャッシュの更新
      await localDataSource.cacheProduct(updatedProduct);
      
      return Right(updatedProduct);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, bool>> deleteProduct(String productId) async {
    try {
      final success = await remoteDataSource.deleteProduct(productId);
      
      if (success) {
        // ローカルキャッシュからも削除
        await localDataSource.deleteProduct(productId);
      }
      
      return Right(success);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  // ネットワーク状態チェック
  Future<bool> _isOffline() async {
    try {
      final result = await InternetAddress.lookup('example.com');
      return result.isEmpty || result[0].rawAddress.isEmpty;
    } catch (_) {
      return true;
    }
  }
}
```

### OrderRepository
```dart
class OrderRepository implements IOrderRepository {
  final OrderRemoteDataSource remoteDataSource;
  final OrderLocalDataSource localDataSource;
  
  OrderRepository({
    required this.remoteDataSource,
    required this.localDataSource,
  });
  
  @override
  Future<Either<Failure, List<OrderEntity>>> getOrders({
    String? userId,
    bool isBuyer = true,
    OrderStatus? status,
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      // ネットワーク状態のチェック
      if (await _isOffline()) {
        // オフラインの場合はローカルキャッシュから取得
        return Right(await localDataSource.getOrders(
          userId: userId,
          isBuyer: isBuyer,
          status: status,
          limit: limit,
          offset: offset,
        ));
      }
      
      // オンラインの場合はリモートから取得
      final orders = await remoteDataSource.getOrders(
        userId: userId,
        isBuyer: isBuyer,
        status: status,
        limit: limit,
        offset: offset,
      );
      
      // ローカルキャッシュの更新
      await localDataSource.cacheOrders(orders);
      
      return Right(orders);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, OrderEntity>> getOrderById(String orderId) async {
    try {
      // ネットワーク状態のチェック
      if (await _isOffline()) {
        // オフラインの場合はローカルキャッシュから取得
        final order = await localDataSource.getOrderById(orderId);
        if (order != null) {
          return Right(order);
        } else {
          return Left(CacheFailure('注文が見つかりません'));
        }
      }
      
      // オンラインの場合はリモートから取得
      final order = await remoteDataSource.getOrderById(orderId);
      
      // ローカルキャッシュの更新
      await localDataSource.cacheOrder(order);
      
      return Right(order);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, OrderEntity>> createOrder(
    String productId, 
    int quantity, 
    String buyerUserId
  ) async {
    try {
      final order = await remoteDataSource.createOrder(
        productId, 
        quantity, 
        buyerUserId
      );
      
      // ローカルキャッシュの更新
      await localDataSource.cacheOrder(order);
      
      return Right(order);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, OrderEntity>> updateOrderStatus(
    String orderId, 
    OrderStatus newStatus
  ) async {
    try {
      final updatedOrder = await remoteDataSource.updateOrderStatus(
        orderId, 
        newStatus
      );
      
      // ローカルキャッシュの更新
      await localDataSource.cacheOrder(updatedOrder);
      
      return Right(updatedOrder);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  // ネットワーク状態チェック
  Future<bool> _isOffline() async {
    try {
      final result = await InternetAddress.lookup('example.com');
      return result.isEmpty || result[0].rawAddress.isEmpty;
    } catch (_) {
      return true;
    }
  }
}
```

### PaymentRepository
```dart
class PaymentRepository implements IPaymentRepository {
  final PaymentRemoteDataSource remoteDataSource;
  
  PaymentRepository({
    required this.remoteDataSource,
  });
  
  @override
  Future<Either<Failure, String>> createPaymentIntent(
    String orderId,
    double amount,
    String currency
  ) async {
    try {
      final clientSecret = await remoteDataSource.createPaymentIntent(
        orderId,
        amount,
        currency
      );
      
      return Right(clientSecret);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, bool>> confirmPayment(
    String orderId,
    String paymentIntentId
  ) async {
    try {
      final success = await remoteDataSource.confirmPayment(
        orderId,
        paymentIntentId
      );
      
      return Right(success);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, bool>> requestRefund(
    String orderId,
    String? reason
  ) async {
    try {
      final success = await remoteDataSource.requestRefund(
        orderId,
        reason
      );
      
      return Right(success);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, PaymentHistoryEntity>> getPaymentHistory(
    String orderId
  ) async {
    try {
      final paymentHistory = await remoteDataSource.getPaymentHistory(orderId);
      
      return Right(paymentHistory);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
}
```

## 4. データソース詳細

### ProductRemoteDataSource
```dart
abstract class ProductRemoteDataSource {
  Future<List<ProductModel>> getProducts({
    String? sellerUserId,
    int limit = 20,
    int offset = 0,
  });
  Future<ProductModel> getProductById(String productId);
  Future<ProductModel> createProduct(ProductModel product);
  Future<ProductModel> updateProduct(ProductModel product);
  Future<bool> deleteProduct(String productId);
}

class ProductRemoteDataSourceImpl implements ProductRemoteDataSource {
  final http.Client client;
  final String baseUrl;
  
  ProductRemoteDataSourceImpl({
    required this.client,
    this.baseUrl = 'https://api.kanushi.app/v1',
  });
  
  @override
  Future<List<ProductModel>> getProducts({
    String? sellerUserId,
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      final queryParams = <String, String>{
        'limit': limit.toString(),
        'offset': offset.toString(),
      };
      
      if (sellerUserId != null) {
        queryParams['seller_user_id'] = sellerUserId;
      }
      
      final uri = Uri.parse('$baseUrl/products').replace(
        queryParameters: queryParams,
      );
      
      final response = await client.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> productsJson = json.decode(response.body);
        return productsJson
            .map((json) => ProductModel.fromJson(json))
            .toList();
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '商品の取得に失敗しました',
        );
      }
    } on SocketException {
      throw NetworkException('ネットワーク接続エラーが発生しました');
    } catch (e) {
      if (e is ServerException || e is NetworkException) {
        rethrow;
      }
      throw ServerException(e.toString());
    }
  }
  
  @override
  Future<ProductModel> getProductById(String productId) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/products/$productId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        return ProductModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '商品の取得に失敗しました',
        );
      }
    } on SocketException {
      throw NetworkException('ネットワーク接続エラーが発生しました');
    } catch (e) {
      if (e is ServerException || e is NetworkException) {
        rethrow;
      }
      throw ServerException(e.toString());
    }
  }
  
  @override
  Future<ProductModel> createProduct(ProductModel product) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/products'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode(product.toJson()..remove('id')),
      );
      
      if (response.statusCode == 201) {
        return ProductModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '商品の作成に失敗しました',
        );
      }
    } on SocketException {
      throw NetworkException('ネットワーク接続エラーが発生しました');
    } catch (e) {
      if (e is ServerException || e is NetworkException) {
        rethrow;
      }
      throw ServerException(e.toString());
    }
  }
  
  @override
  Future<ProductModel> updateProduct(ProductModel product) async {
    try {
      final response = await client.put(
        Uri.parse('$baseUrl/products/${product.id}'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode(product.toJson()),
      );
      
      if (response.statusCode == 200) {
        return ProductModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '商品の更新に失敗しました',
        );
      }
    } on SocketException {
      throw NetworkException('ネットワーク接続エラーが発生しました');
    } catch (e) {
      if (e is ServerException || e is NetworkException) {
        rethrow;
      }
      throw ServerException(e.toString());
    }
  }
  
  @override
  Future<bool> deleteProduct(String productId) async {
    try {
      final response = await client.delete(
        Uri.parse('$baseUrl/products/$productId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      return response.statusCode == 200;
    } on SocketException {
      throw NetworkException('ネットワーク接続エラーが発生しました');
    } catch (e) {
      if (e is ServerException || e is NetworkException) {
        rethrow;
      }
      throw ServerException(e.toString());
    }
  }
  
  // 認証トークン取得
  Future<String> _getAuthToken() async {
    final secureStorage = FlutterSecureStorage();
    return await secureStorage.read(key: 'auth_token') ?? '';
  }
}
```

### OrderRemoteDataSource
```dart
abstract class OrderRemoteDataSource {
  Future<List<OrderModel>> getOrders({
    String? userId,
    bool isBuyer = true,
    OrderStatus? status,
    int limit = 20,
    int offset = 0,
  });
  Future<OrderModel> getOrderById(String orderId);
  Future<OrderModel> createOrder(String productId, int quantity, String buyerUserId);
  Future<OrderModel> updateOrderStatus(String orderId, OrderStatus newStatus);
}

class OrderRemoteDataSourceImpl implements OrderRemoteDataSource {
  final http.Client client;
  final String baseUrl;
  
  OrderRemoteDataSourceImpl({
    required this.client,
    this.baseUrl = 'https://api.kanushi.app/v1',
  });
  
  @override
  Future<List<OrderModel>> getOrders({
    String? userId,
    bool isBuyer = true,
    OrderStatus? status,
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      final queryParams = <String, String>{
        'limit': limit.toString(),
        'offset': offset.toString(),
      };
      
      if (userId != null) {
        queryParams[isBuyer ? 'buyer_user_id' : 'seller_user_id'] = userId;
      }
      
      if (status != null) {
        queryParams['status'] = status.name;
      }
      
      final uri = Uri.parse('$baseUrl/orders').replace(
        queryParameters: queryParams,
      );
      
      final response = await client.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> ordersJson = json.decode(response.body);
        return ordersJson
            .map((json) => OrderModel.fromJson(json))
            .toList();
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '注文の取得に失敗しました',
        );
      }
    } on SocketException {
      throw NetworkException('ネットワーク接続エラーが発生しました');
    } catch (e) {
      if (e is ServerException || e is NetworkException) {
        rethrow;
      }
      throw ServerException(e.toString());
    }
  }
  
  @override
  Future<OrderModel> getOrderById(String orderId) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/orders/$orderId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        return OrderModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '注文の取得に失敗しました',
        );
      }
    } on SocketException {
      throw NetworkException('ネットワーク接続エラーが発生しました');
    } catch (e) {
      if (e is ServerException || e is NetworkException) {
        rethrow;
      }
      throw ServerException(e.toString());
    }
  }
  
  @override
  Future<OrderModel> createOrder(
    String productId, 
    int quantity, 
    String buyerUserId
  ) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/orders'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode({
          'product_id': productId,
          'quantity': quantity,
          'buyer_user_id': buyerUserId,
        }),
      );
      
      if (response.statusCode == 201) {
        return OrderModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '注文の作成に失敗しました',
        );
      }
    } on SocketException {
      throw NetworkException('ネットワーク接続エラーが発生しました');
    } catch (e) {
      if (e is ServerException || e is NetworkException) {
        rethrow;
      }
      throw ServerException(e.toString());
    }
  }
  
  @override
  Future<OrderModel> updateOrderStatus(
    String orderId, 
    OrderStatus newStatus
  ) async {
    try {
      final response = await client.patch(
        Uri.parse('$baseUrl/orders/$orderId/status'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode({
          'status': newStatus.name,
        }),
      );
      
      if (response.statusCode == 200) {
        return OrderModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '注文ステータスの更新に失敗しました',
        );
      }
    } on SocketException {
      throw NetworkException('ネットワーク接続エラーが発生しました');
    } catch (e) {
      if (e is ServerException || e is NetworkException) {
        rethrow;
      }
      throw ServerException(e.toString());
    }
  }
  
  // 認証トークン取得
  Future<String> _getAuthToken() async {
    final secureStorage = FlutterSecureStorage();
    return await secureStorage.read(key: 'auth_token') ?? '';
  }
}
```

### PaymentRemoteDataSource
```dart
abstract class PaymentRemoteDataSource {
  Future<String> createPaymentIntent(String orderId, double amount, String currency);
  Future<bool> confirmPayment(String orderId, String paymentIntentId);
  Future<bool> requestRefund(String orderId, String? reason);
  Future<PaymentHistoryModel> getPaymentHistory(String orderId);
}

class PaymentRemoteDataSourceImpl implements PaymentRemoteDataSource {
  final http.Client client;
  final String baseUrl;
  
  PaymentRemoteDataSourceImpl({
    required this.client,
    this.baseUrl = 'https://api.kanushi.app/v1',
  });
  
  @override
  Future<String> createPaymentIntent(
    String orderId, 
    double amount, 
    String currency
  ) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/payments/create-intent'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode({
          'order_id': orderId,
          'amount': amount,
          'currency': currency,
        }),
      );
      
      if (response.statusCode == 200) {
        return json.decode(response.body)['client_secret'];
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '決済の開始に失敗しました',
        );
      }
    } on SocketException {
      throw NetworkException('ネットワーク接続エラーが発生しました');
    } catch (e) {
      if (e is ServerException || e is NetworkException) {
        rethrow;
      }
      throw ServerException(e.toString());
    }
  }
  
  @override
  Future<bool> confirmPayment(
    String orderId, 
    String paymentIntentId
  ) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/payments/confirm'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode({
          'order_id': orderId,
          'payment_intent_id': paymentIntentId,
        }),
      );
      
      return response.statusCode == 200;
    } on SocketException {
      throw NetworkException('ネットワーク接続エラーが発生しました');
    } catch (e) {
      if (e is ServerException || e is NetworkException) {
        rethrow;
      }
      throw ServerException(e.toString());
    }
  }
  
  @override
  Future<bool> requestRefund(
    String orderId, 
    String? reason
  ) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/payments/refund'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode({
          'order_id': orderId,
          if (reason != null) 'reason': reason,
        }),
      );
      
      return response.statusCode == 200;
    } on SocketException {
      throw NetworkException('ネットワーク接続エラーが発生しました');
    } catch (e) {
      if (e is ServerException || e is NetworkException) {
        rethrow;
      }
      throw ServerException(e.toString());
    }
  }
  
  @override
  Future<PaymentHistoryModel> getPaymentHistory(String orderId) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/payments/history/$orderId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        return PaymentHistoryModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '決済履歴の取得に失敗しました',
        );
      }
    } on SocketException {
      throw NetworkException('ネットワーク接続エラーが発生しました');
    } catch (e) {
      if (e is ServerException || e is NetworkException) {
        rethrow;
      }
      throw ServerException(e.toString());
    }
  }
  
  // 認証トークン取得
  Future<String> _getAuthToken() async {
    final secureStorage = FlutterSecureStorage();
    return await secureStorage.read(key: 'auth_token') ?? '';
  }
}
```

## 5. ユースケース詳細

### GetProductsUseCase
```dart
class GetProductsUseCase {
  final IProductRepository repository;
  
  GetProductsUseCase({required this.repository});
  
  Future<Either<Failure, List<ProductEntity>>> call({
    String? sellerUserId,
    int limit = 20,
    int offset = 0,
  }) async {
    return repository.getProducts(
      sellerUserId: sellerUserId,
      limit: limit,
      offset: offset,
    );
  }
}
```

### CreateOrderUseCase
```dart
class CreateOrderUseCase {
  final IOrderRepository orderRepository;
  final IProductRepository productRepository;
  
  CreateOrderUseCase({
    required this.orderRepository,
    required this.productRepository,
  });
  
  Future<Either<Failure, OrderEntity>> call({
    required String productId,
    required int quantity,
    required String buyerUserId,
  }) async {
    // 在庫の確認
    final productResult = await productRepository.getProductById(productId);
    
    return productResult.fold(
      (failure) => Left(failure),
      (product) {
        if (product.stock < quantity) {
          return Left(BusinessLogicFailure('在庫が不足しています'));
        }
        
        return orderRepository.createOrder(
          productId,
          quantity,
          buyerUserId,
        );
      },
    );
  }
}
```

### ProcessPaymentUseCase
```dart
class ProcessPaymentUseCase {
  final IPaymentRepository paymentRepository;
  final IOrderRepository orderRepository;
  
  ProcessPaymentUseCase({
    required this.paymentRepository,
    required this.orderRepository,
  });
  
  Future<Either<Failure, String>> call({
    required String orderId,
  }) async {
    // 注文情報の取得
    final orderResult = await orderRepository.getOrderById(orderId);
    
    return orderResult.fold(
      (failure) => Left(failure),
      (order) {
        if (order.status != OrderStatus.pending) {
          return Left(BusinessLogicFailure('この注文は既に処理されています'));
        }
        
        return paymentRepository.createPaymentIntent(
          orderId,
          order.amount,
          order.currency ?? 'JPY',
        );
      },
    );
  }
}
```

## 6. ビューモデル詳細

### ShopViewModel
```dart
class ShopViewModel extends StateNotifier<ShopState> {
  final GetProductsUseCase getProductsUseCase;
  
  ShopViewModel({
    required this.getProductsUseCase,
  }) : super(ShopInitial());
  
  Future<void> loadProducts({
    String? sellerUserId,
    bool isRefresh = false,
  }) async {
    if (isRefresh) {
      state = ShopLoading();
    } else if (state is ShopLoaded) {
      state = ShopLoadingMore((state as ShopLoaded).products);
    } else {
      state = ShopLoading();
    }
    
    final result = await getProductsUseCase(
      sellerUserId: sellerUserId,
      limit: 10,
      offset: isRefresh || !(state is ShopLoadingMore) ? 0 
          : (state as ShopLoadingMore).products.length,
    );
    
    result.fold(
      (failure) => state = ShopError(failure.message),
      (products) {
        if (state is ShopLoadingMore) {
          final existingProducts = (state as ShopLoadingMore).products;
          state = ShopLoaded([...existingProducts, ...products]);
        } else {
          state = ShopLoaded(products);
        }
      },
    );
  }
}

// 状態定義
abstract class ShopState {}

class ShopInitial extends ShopState {}

class ShopLoading extends ShopState {}

class ShopLoadingMore extends ShopState {
  final List<ProductEntity> products;
  ShopLoadingMore(this.products);
}

class ShopLoaded extends ShopState {
  final List<ProductEntity> products;
  ShopLoaded(this.products);
}

class ShopError extends ShopState {
  final String message;
  ShopError(this.message);
}
```

### ProductDetailViewModel
```dart
class ProductDetailViewModel extends StateNotifier<ProductDetailState> {
  final GetProductByIdUseCase getProductByIdUseCase;
  final CreateOrderUseCase createOrderUseCase;
  final ProcessPaymentUseCase processPaymentUseCase;
  
  ProductDetailViewModel({
    required this.getProductByIdUseCase,
    required this.createOrderUseCase,
    required this.processPaymentUseCase,
  }) : super(ProductDetailInitial());
  
  Future<void> loadProduct(String productId) async {
    state = ProductDetailLoading();
    
    final result = await getProductByIdUseCase(productId);
    
    result.fold(
      (failure) => state = ProductDetailError(failure.message),
      (product) => state = ProductDetailLoaded(product),
    );
  }
  
  Future<void> purchaseProduct(
    String productId,
    int quantity,
    String buyerUserId,
  ) async {
    if (state is ProductDetailLoaded) {
      state = ProductDetailProcessing();
      
      final product = (state as ProductDetailLoaded).product;
      
      // 在庫確認
      if (product.stock < quantity) {
        state = ProductDetailError('在庫が不足しています');
        return;
      }
      
      // 注文作成
      final orderResult = await createOrderUseCase(
        productId: productId,
        quantity: quantity,
        buyerUserId: buyerUserId,
      );
      
      orderResult.fold(
        (failure) => state = ProductDetailError(failure.message),
        (order) async {
          // 決済処理開始
          final paymentResult = await processPaymentUseCase(
            orderId: order.id,
          );
          
          paymentResult.fold(
            (failure) => state = ProductDetailError(failure.message),
            (clientSecret) => state = ProductDetailPaymentReady(
              order,
              clientSecret,
            ),
          );
        },
      );
    }
  }
}

// 状態定義
abstract class ProductDetailState {}

class ProductDetailInitial extends ProductDetailState {}

class ProductDetailLoading extends ProductDetailState {}

class ProductDetailLoaded extends ProductDetailState {
  final ProductEntity product;
  ProductDetailLoaded(this.product);
}

class ProductDetailProcessing extends ProductDetailState {}

class ProductDetailPaymentReady extends ProductDetailState {
  final OrderEntity order;
  final String paymentClientSecret;
  ProductDetailPaymentReady(this.order, this.paymentClientSecret);
}

class ProductDetailError extends ProductDetailState {
  final String message;
  ProductDetailError(this.message);
}
```

## 7. 依存性注入設定

```dart
// 依存性注入の設定
final ecDomainModule = [
  // データソース
  Provider<ProductRemoteDataSource>(
    (ref) => ProductRemoteDataSourceImpl(
      client: ref.watch(httpClientProvider),
    ),
  ),
  Provider<ProductLocalDataSource>(
    (ref) => ProductLocalDataSourceImpl(
      box: ref.watch(productBoxProvider),
    ),
  ),
  Provider<OrderRemoteDataSource>(
    (ref) => OrderRemoteDataSourceImpl(
      client: ref.watch(httpClientProvider),
    ),
  ),
  Provider<OrderLocalDataSource>(
    (ref) => OrderLocalDataSourceImpl(
      box: ref.watch(orderBoxProvider),
    ),
  ),
  Provider<PaymentRemoteDataSource>(
    (ref) => PaymentRemoteDataSourceImpl(
      client: ref.watch(httpClientProvider),
    ),
  ),
  Provider<ShippingAddressRemoteDataSource>(
    (ref) => ShippingAddressRemoteDataSourceImpl(
      client: ref.watch(httpClientProvider),
    ),
  ),
  
  // リポジトリ
  Provider<IProductRepository>(
    (ref) => ProductRepository(
      remoteDataSource: ref.watch(productRemoteDataSourceProvider),
      localDataSource: ref.watch(productLocalDataSourceProvider),
    ),
  ),
  Provider<IOrderRepository>(
    (ref) => OrderRepository(
      remoteDataSource: ref.watch(orderRemoteDataSourceProvider),
      localDataSource: ref.watch(orderLocalDataSourceProvider),
    ),
  ),
  Provider<IPaymentRepository>(
    (ref) => PaymentRepository(
      remoteDataSource: ref.watch(paymentRemoteDataSourceProvider),
    ),
  ),
  Provider<IShippingAddressRepository>(
    (ref) => ShippingAddressRepository(
      remoteDataSource: ref.watch(shippingAddressRemoteDataSourceProvider),
      localDataSource: ref.watch(shippingAddressLocalDataSourceProvider),
    ),
  ),
  
  // ユースケース
  Provider<GetProductsUseCase>(
    (ref) => GetProductsUseCase(
      repository: ref.watch(productRepositoryProvider),
    ),
  ),
  Provider<GetProductByIdUseCase>(
    (ref) => GetProductByIdUseCase(
      repository: ref.watch(productRepositoryProvider),
    ),
  ),
  Provider<CreateProductUseCase>(
    (ref) => CreateProductUseCase(
      repository: ref.watch(productRepositoryProvider),
    ),
  ),
  Provider<UpdateProductUseCase>(
    (ref) => UpdateProductUseCase(
      repository: ref.watch(productRepositoryProvider),
    ),
  ),
  Provider<DeleteProductUseCase>(
    (ref) => DeleteProductUseCase(
      repository: ref.watch(productRepositoryProvider),
    ),
  ),
  Provider<GetOrdersUseCase>(
    (ref) => GetOrdersUseCase(
      repository: ref.watch(orderRepositoryProvider),
    ),
  ),
  Provider<CreateOrderUseCase>(
    (ref) => CreateOrderUseCase(
      orderRepository: ref.watch(orderRepositoryProvider),
      productRepository: ref.watch(productRepositoryProvider),
    ),
  ),
  Provider<ProcessPaymentUseCase>(
    (ref) => ProcessPaymentUseCase(
      paymentRepository: ref.watch(paymentRepositoryProvider),
      orderRepository: ref.watch(orderRepositoryProvider),
    ),
  ),
  
  // ビューモデル
  StateNotifierProvider<ShopViewModel, ShopState>(
    (ref) => ShopViewModel(
      getProductsUseCase: ref.watch(getProductsUseCaseProvider),
    ),
  ),
  StateNotifierProvider<ProductDetailViewModel, ProductDetailState>(
    (ref) => ProductDetailViewModel(
      getProductByIdUseCase: ref.watch(getProductByIdUseCaseProvider),
      createOrderUseCase: ref.watch(createOrderUseCaseProvider),
      processPaymentUseCase: ref.watch(processPaymentUseCaseProvider),
    ),
  ),
  StateNotifierProvider<ProductManagementViewModel, ProductManagementState>(
    (ref) => ProductManagementViewModel(
      getProductsUseCase: ref.watch(getProductsUseCaseProvider),
      createProductUseCase: ref.watch(createProductUseCaseProvider),
      updateProductUseCase: ref.watch(updateProductUseCaseProvider),
      deleteProductUseCase: ref.watch(deleteProductUseCaseProvider),
    ),
  ),
  StateNotifierProvider<OrderListViewModel, OrderListState>(
    (ref) => OrderListViewModel(
      getOrdersUseCase: ref.watch(getOrdersUseCaseProvider),
    ),
  ),
];
```

## 8. セキュリティ考慮事項

1. **支払い情報のセキュリティ**
   - Stripe SDKを使用し、カード情報はクライアント側で安全に取り扱う
   - カード情報は直接サーバーには送信せず、StripeのTokenization機能を使用
   - PCI DSS準拠の支払いフローを実装
   - 決済情報は暗号化して保存

2. **在庫・価格の整合性**
   - 注文処理は必ずサーバーサイドで最終確認
   - クライアントから送信された価格は信用せず、DB上の価格を使用
   - 在庫数の同時更新による競合を防ぐための排他制御の実装
   - 決済成功時のみ在庫を減算

3. **個人情報保護**
   - 配送先住所などの個人情報は最小限のみ収集
   - 個人情報へのアクセスは権限を持つユーザーのみに制限
   - セキュアな保存と適切な暗号化の実施
   - 不要になった情報の自動削除ポリシー

4. **不正購入防止**
   - 同一商品の大量購入に対する制限
   - 不審な購入パターンを検出する仕組み
   - 地域に基づく購入制限（必要に応じて）
   - 異常な購入活動の監視と警告

## 9. パフォーマンス最適化

1. **商品一覧の表示最適化**
   - 画像のレイジーロード
   - ページングによるデータロードの最適化
   - 画像のプレロードによるスムーズなスクロール体験
   - 適切なキャッシュ期間の設定

2. **決済処理の最適化**
   - バックグラウンドでの決済処理
   - 決済処理中のユーザーフィードバック表示
   - タイムアウト処理の適切な実装
   - 決済エラー時の適切なリトライ戦略

3. **オフラインサポート**
   - 商品情報のローカルキャッシュ
   - オフライン時の限定的な閲覧機能
   - 接続回復時の自動同期
   - キャッシュの適切な更新戦略

4. **データベースアクセスの最適化**
   - インデックスの適切な設定
   - 必要なデータのみを取得するクエリの最適化
   - デノーマライゼーションによる読み取り性能の向上
   - キャッシュ層の実装

## 10. エラーハンドリング戦略

```dart
// 汎用エラーハンドラー
void handleECError(BuildContext context, String message) {
  // ネットワークエラー
  if (message.contains('ネットワーク')) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('ネットワーク接続を確認してください'),
        action: SnackBarAction(
          label: '再試行',
          onPressed: () {
            // 再試行ロジック
          },
        ),
      ),
    );
    return;
  }
  
  // 在庫エラー
  if (message.contains('在庫')) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('在庫が不足しています。後でもう一度お試しください'),
      ),
    );
    return;
  }
  
  // 決済エラー
  if (message.contains('決済') || message.contains('支払い')) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('決済処理中にエラーが発生しました。カード情報を確認してください'),
        duration: Duration(seconds: 5),
        action: SnackBarAction(
          label: '詳細',
          onPressed: () {
            // 詳細エラー表示
            showDialog(
              context: context,
              builder: (context) => AlertDialog(
                title: Text('決済エラー'),
                content: Text(message),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text('閉じる'),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
    return;
  }
  
  // その他のエラー
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
    ),
  );
}
```

## 11. テスト戦略

### 単体テスト
- リポジトリの各メソッドのテスト
- ユースケースの正常系・異常系テスト
- ビューモデルの状態管理テスト
- モデルのシリアライズ/デシリアライズテスト

### 統合テスト
- 商品一覧表示から商品詳細へのフロー
- 商品購入から決済までのフロー
- 商品管理（作成・編集・削除）のフロー
- 注文履歴表示と詳細表示のフロー

### UIテスト
- 商品一覧の表示とスクロール
- 商品詳細ページでの数量選択と購入ボタン
- 決済フォームの入力と送信
- エラー状態の表示と回復

## 12. FAQ的な実装上の注意点

1. **在庫管理について**
   - 在庫数は売り切れを防ぐために決済処理開始時に予約
   - 決済失敗時は在庫を自動的に戻す
   - 長時間決済が完了しない場合は在庫予約を解除

2. **決済処理について**
   - Stripeの推奨フローに従い実装
   - クライアントサイドでのカード情報収集と検証
   - サーバーサイドでの決済実行と確認
   - Webhookを使用した非同期決済イベント処理

3. **返金ポリシーの実装**
   - 返金可能期間を明示（通常、購入から7日以内）
   - 返金理由の収集と保存
   - 返金処理のステータス追跡
   - 自動返金と手動承認の場合分け

4. **オフライン対応の制限**
   - オフライン時は閲覧のみ可能で購入不可
   - オフライン時のデータは最終同期時点のもの
   - 接続回復時に自動的にデータを更新
   - オフライン状態の明示的な表示