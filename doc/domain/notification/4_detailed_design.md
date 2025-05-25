# 通知ドメイン詳細設計

## 1. アーキテクチャ概要

通知ドメインは、クリーンアーキテクチャに基づき以下の層に分けて実装します。

### プレゼンテーション層
- **画面（Screens）**
  - NotificationListScreen
  - NotificationDetailScreen
  - NotificationSettingsScreen

- **ビューモデル（ViewModels）**
  - NotificationListViewModel
  - NotificationSettingsViewModel

- **ウィジェット（Widgets）**
  - NotificationItem
  - NotificationBadge
  - NotificationEmptyState
  - NotificationTypeFilterChip
  - NotificationSettingSwitch

### ドメイン層
- **エンティティ（Entities）**
  - NotificationEntity
  - NotificationSettingsEntity
  - NotificationDeviceEntity

- **リポジトリインターフェース（Repository Interfaces）**
  - INotificationRepository
  - INotificationSettingsRepository
  - INotificationDeviceRepository

- **ユースケース（Use Cases）**
  - GetNotificationsUseCase
  - MarkNotificationAsReadUseCase
  - DeleteNotificationUseCase
  - GetNotificationSettingsUseCase
  - UpdateNotificationSettingsUseCase
  - RegisterDeviceTokenUseCase
  - UnregisterDeviceTokenUseCase

### データ層
- **リポジトリ実装（Repository Implementations）**
  - NotificationRepository
  - NotificationSettingsRepository
  - NotificationDeviceRepository

- **データソース（Data Sources）**
  - NotificationRemoteDataSource
  - NotificationLocalDataSource
  - NotificationSettingsRemoteDataSource
  - NotificationSettingsLocalDataSource
  - NotificationDeviceRemoteDataSource

- **モデル（Models）**
  - NotificationModel
  - NotificationSettingsModel
  - NotificationDeviceModel

## 2. データモデル詳細

### NotificationModel
```dart
enum NotificationType {
  comment,
  highlight,
  follower,
  followReason,
  system
}

class NotificationModel extends NotificationEntity {
  final String id;
  final String userId;
  final String title;
  final String body;
  final Map<String, dynamic> data;
  final bool read;
  final NotificationType notificationType;
  final DateTime createdAt;
  final DateTime? readAt;
  
  NotificationModel({
    required this.id,
    required this.userId,
    required this.title,
    required this.body,
    required this.data,
    required this.read,
    required this.notificationType,
    required this.createdAt,
    this.readAt,
  });
  
  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'],
      userId: json['user_id'],
      title: json['title'],
      body: json['body'],
      data: json['data'] ?? {},
      read: json['read'] ?? false,
      notificationType: NotificationType.values.byName(json['notification_type']),
      createdAt: DateTime.parse(json['created_at']),
      readAt: json['read_at'] != null ? DateTime.parse(json['read_at']) : null,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'title': title,
      'body': body,
      'data': data,
      'read': read,
      'notification_type': notificationType.name,
      'created_at': createdAt.toIso8601String(),
      'read_at': readAt?.toIso8601String(),
    };
  }
  
  // 通知データからのナビゲーション情報の取得
  String? get navigationRoute {
    if (data.containsKey('route')) {
      return data['route'];
    }
    
    // 通知タイプごとのデフォルトルート
    switch (notificationType) {
      case NotificationType.comment:
        return '/posts/${data['post_id']}';
      case NotificationType.highlight:
        return '/posts/${data['post_id']}';
      case NotificationType.follower:
        return '/profile/${data['follower_id']}';
      case NotificationType.followReason:
        return '/profile/${data['follower_id']}';
      case NotificationType.system:
        return data['action_url'];
    }
  }
  
  // 通知に関連するアイコンの取得
  IconData get icon {
    switch (notificationType) {
      case NotificationType.comment:
        return Icons.comment;
      case NotificationType.highlight:
        return Icons.star;
      case NotificationType.follower:
        return Icons.person_add;
      case NotificationType.followReason:
        return Icons.favorite;
      case NotificationType.system:
        return Icons.notifications;
    }
  }
  
  // 時間表示のためのヘルパーメソッド
  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(createdAt);
    
    if (difference.inDays > 7) {
      return DateFormat('yyyy/MM/dd').format(createdAt);
    } else if (difference.inDays > 0) {
      return '${difference.inDays}日前';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}時間前';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}分前';
    } else {
      return 'たった今';
    }
  }
}
```

### NotificationSettingsModel
```dart
class NotificationSettingsModel extends NotificationSettingsEntity {
  final String id;
  final String userId;
  final bool commentsEnabled;
  final bool highlightsEnabled;
  final bool followersEnabled;
  final bool followReasonsEnabled;
  final bool systemEnabled;
  final DateTime updatedAt;
  
  NotificationSettingsModel({
    required this.id,
    required this.userId,
    required this.commentsEnabled,
    required this.highlightsEnabled,
    required this.followersEnabled,
    required this.followReasonsEnabled,
    required this.systemEnabled,
    required this.updatedAt,
  });
  
  factory NotificationSettingsModel.fromJson(Map<String, dynamic> json) {
    return NotificationSettingsModel(
      id: json['id'],
      userId: json['user_id'],
      commentsEnabled: json['comments_enabled'] ?? true,
      highlightsEnabled: json['highlights_enabled'] ?? true,
      followersEnabled: json['followers_enabled'] ?? true,
      followReasonsEnabled: json['follow_reasons_enabled'] ?? true,
      systemEnabled: json['system_enabled'] ?? true,
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'comments_enabled': commentsEnabled,
      'highlights_enabled': highlightsEnabled,
      'followers_enabled': followersEnabled,
      'follow_reasons_enabled': followReasonsEnabled,
      'system_enabled': systemEnabled,
      'updated_at': updatedAt.toIso8601String(),
    };
  }
  
  NotificationSettingsModel copyWith({
    String? id,
    String? userId,
    bool? commentsEnabled,
    bool? highlightsEnabled,
    bool? followersEnabled,
    bool? followReasonsEnabled,
    bool? systemEnabled,
    DateTime? updatedAt,
  }) {
    return NotificationSettingsModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      commentsEnabled: commentsEnabled ?? this.commentsEnabled,
      highlightsEnabled: highlightsEnabled ?? this.highlightsEnabled,
      followersEnabled: followersEnabled ?? this.followersEnabled,
      followReasonsEnabled: followReasonsEnabled ?? this.followReasonsEnabled,
      systemEnabled: systemEnabled ?? this.systemEnabled,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
  
  // 特定の通知タイプが有効かどうかをチェック
  bool isEnabledForType(NotificationType type) {
    switch (type) {
      case NotificationType.comment:
        return commentsEnabled;
      case NotificationType.highlight:
        return highlightsEnabled;
      case NotificationType.follower:
        return followersEnabled;
      case NotificationType.followReason:
        return followReasonsEnabled;
      case NotificationType.system:
        return systemEnabled;
    }
  }
}
```

### NotificationDeviceModel
```dart
enum DeviceType { fcm, apns }

class NotificationDeviceModel extends NotificationDeviceEntity {
  final String id;
  final String userId;
  final String deviceToken;
  final DeviceType deviceType;
  final bool isActive;
  final DateTime createdAt;
  final DateTime? lastUsedAt;
  
  NotificationDeviceModel({
    required this.id,
    required this.userId,
    required this.deviceToken,
    required this.deviceType,
    required this.isActive,
    required this.createdAt,
    this.lastUsedAt,
  });
  
  factory NotificationDeviceModel.fromJson(Map<String, dynamic> json) {
    return NotificationDeviceModel(
      id: json['id'],
      userId: json['user_id'],
      deviceToken: json['device_token'],
      deviceType: DeviceType.values.byName(json['device_type']),
      isActive: json['is_active'] ?? true,
      createdAt: DateTime.parse(json['created_at']),
      lastUsedAt: json['last_used_at'] != null 
          ? DateTime.parse(json['last_used_at']) 
          : null,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'device_token': deviceToken,
      'device_type': deviceType.name,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
      'last_used_at': lastUsedAt?.toIso8601String(),
    };
  }
}
```

## 3. リポジトリ詳細

### NotificationRepository
```dart
class NotificationRepository implements INotificationRepository {
  final NotificationRemoteDataSource remoteDataSource;
  final NotificationLocalDataSource localDataSource;
  
  NotificationRepository({
    required this.remoteDataSource,
    required this.localDataSource,
  });
  
  @override
  Future<Either<Failure, List<NotificationEntity>>> getNotifications({
    String? userId,
    bool? read,
    NotificationType? type,
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      // ネットワーク状態のチェック
      if (await _isOffline()) {
        // オフラインの場合はローカルキャッシュから取得
        return Right(await localDataSource.getNotifications(
          userId: userId,
          read: read,
          type: type,
          limit: limit,
          offset: offset,
        ));
      }
      
      // オンラインの場合はリモートから取得
      final notifications = await remoteDataSource.getNotifications(
        userId: userId,
        read: read,
        type: type,
        limit: limit,
        offset: offset,
      );
      
      // ローカルキャッシュの更新
      await localDataSource.cacheNotifications(notifications);
      
      return Right(notifications);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, NotificationEntity>> markAsRead(String notificationId) async {
    try {
      // リモートで更新
      final updatedNotification = await remoteDataSource.markAsRead(notificationId);
      
      // ローカルキャッシュの更新
      await localDataSource.updateNotification(updatedNotification);
      
      return Right(updatedNotification);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, bool>> deleteNotification(String notificationId) async {
    try {
      // リモートで削除
      final success = await remoteDataSource.deleteNotification(notificationId);
      
      if (success) {
        // ローカルキャッシュからも削除
        await localDataSource.deleteNotification(notificationId);
      }
      
      return Right(success);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, int>> getUnreadCount(String userId) async {
    try {
      if (await _isOffline()) {
        // オフラインの場合はローカルキャッシュから取得
        return Right(await localDataSource.getUnreadCount(userId));
      }
      
      // オンラインの場合はリモートから取得
      final count = await remoteDataSource.getUnreadCount(userId);
      return Right(count);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, bool>> markAllAsRead(String userId) async {
    try {
      // リモートで一括更新
      final success = await remoteDataSource.markAllAsRead(userId);
      
      if (success) {
        // ローカルキャッシュの更新
        await localDataSource.markAllAsRead(userId);
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

### NotificationSettingsRepository
```dart
class NotificationSettingsRepository implements INotificationSettingsRepository {
  final NotificationSettingsRemoteDataSource remoteDataSource;
  final NotificationSettingsLocalDataSource localDataSource;
  
  NotificationSettingsRepository({
    required this.remoteDataSource,
    required this.localDataSource,
  });
  
  @override
  Future<Either<Failure, NotificationSettingsEntity>> getNotificationSettings(
    String userId,
  ) async {
    try {
      // ネットワーク状態のチェック
      if (await _isOffline()) {
        // オフラインの場合はローカルキャッシュから取得
        final settings = await localDataSource.getNotificationSettings(userId);
        if (settings != null) {
          return Right(settings);
        } else {
          return Left(CacheFailure('通知設定が見つかりません'));
        }
      }
      
      // オンラインの場合はリモートから取得
      final settings = await remoteDataSource.getNotificationSettings(userId);
      
      // ローカルキャッシュの更新
      await localDataSource.cacheNotificationSettings(settings);
      
      return Right(settings);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, NotificationSettingsEntity>> updateNotificationSettings(
    NotificationSettingsEntity settings,
  ) async {
    try {
      // リモートで更新
      final updatedSettings = await remoteDataSource.updateNotificationSettings(
        settings as NotificationSettingsModel,
      );
      
      // ローカルキャッシュの更新
      await localDataSource.cacheNotificationSettings(updatedSettings);
      
      return Right(updatedSettings);
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

### NotificationDeviceRepository
```dart
class NotificationDeviceRepository implements INotificationDeviceRepository {
  final NotificationDeviceRemoteDataSource remoteDataSource;
  
  NotificationDeviceRepository({
    required this.remoteDataSource,
  });
  
  @override
  Future<Either<Failure, NotificationDeviceEntity>> registerDeviceToken(
    String userId,
    String token,
    DeviceType type,
  ) async {
    try {
      final device = await remoteDataSource.registerDeviceToken(
        userId,
        token,
        type,
      );
      
      return Right(device);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, bool>> unregisterDeviceToken(String token) async {
    try {
      final success = await remoteDataSource.unregisterDeviceToken(token);
      return Right(success);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, List<NotificationDeviceEntity>>> getUserDevices(
    String userId,
  ) async {
    try {
      final devices = await remoteDataSource.getUserDevices(userId);
      return Right(devices);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
}
```

## 4. データソース詳細

### NotificationRemoteDataSource
```dart
abstract class NotificationRemoteDataSource {
  Future<List<NotificationModel>> getNotifications({
    String? userId,
    bool? read,
    NotificationType? type,
    int limit = 20,
    int offset = 0,
  });
  Future<NotificationModel> markAsRead(String notificationId);
  Future<bool> deleteNotification(String notificationId);
  Future<int> getUnreadCount(String userId);
  Future<bool> markAllAsRead(String userId);
}

class NotificationRemoteDataSourceImpl implements NotificationRemoteDataSource {
  final http.Client client;
  final String baseUrl;
  
  NotificationRemoteDataSourceImpl({
    required this.client,
    this.baseUrl = 'https://api.kanushi.app/v1',
  });
  
  @override
  Future<List<NotificationModel>> getNotifications({
    String? userId,
    bool? read,
    NotificationType? type,
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      final queryParams = <String, String>{
        'limit': limit.toString(),
        'offset': offset.toString(),
      };
      
      if (userId != null) {
        queryParams['user_id'] = userId;
      }
      
      if (read != null) {
        queryParams['read'] = read.toString();
      }
      
      if (type != null) {
        queryParams['notification_type'] = type.name;
      }
      
      final uri = Uri.parse('$baseUrl/notifications').replace(
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
        final List<dynamic> notificationsJson = json.decode(response.body);
        return notificationsJson
            .map((json) => NotificationModel.fromJson(json))
            .toList();
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '通知の取得に失敗しました',
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
  Future<NotificationModel> markAsRead(String notificationId) async {
    try {
      final response = await client.patch(
        Uri.parse('$baseUrl/notifications/$notificationId/read'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        return NotificationModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '通知の既読状態の更新に失敗しました',
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
  Future<bool> deleteNotification(String notificationId) async {
    try {
      final response = await client.delete(
        Uri.parse('$baseUrl/notifications/$notificationId'),
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
  
  @override
  Future<int> getUnreadCount(String userId) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/notifications/unread-count?user_id=$userId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        return json.decode(response.body)['count'];
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '未読件数の取得に失敗しました',
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
  Future<bool> markAllAsRead(String userId) async {
    try {
      final response = await client.patch(
        Uri.parse('$baseUrl/notifications/mark-all-read'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode({
          'user_id': userId,
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
  
  // 認証トークン取得
  Future<String> _getAuthToken() async {
    final secureStorage = FlutterSecureStorage();
    return await secureStorage.read(key: 'auth_token') ?? '';
  }
}
```

### NotificationSettingsRemoteDataSource
```dart
abstract class NotificationSettingsRemoteDataSource {
  Future<NotificationSettingsModel> getNotificationSettings(String userId);
  Future<NotificationSettingsModel> updateNotificationSettings(
    NotificationSettingsModel settings,
  );
}

class NotificationSettingsRemoteDataSourceImpl implements NotificationSettingsRemoteDataSource {
  final http.Client client;
  final String baseUrl;
  
  NotificationSettingsRemoteDataSourceImpl({
    required this.client,
    this.baseUrl = 'https://api.kanushi.app/v1',
  });
  
  @override
  Future<NotificationSettingsModel> getNotificationSettings(String userId) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/notification-settings?user_id=$userId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        return NotificationSettingsModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '通知設定の取得に失敗しました',
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
  Future<NotificationSettingsModel> updateNotificationSettings(
    NotificationSettingsModel settings,
  ) async {
    try {
      final response = await client.put(
        Uri.parse('$baseUrl/notification-settings/${settings.id}'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode(settings.toJson()),
      );
      
      if (response.statusCode == 200) {
        return NotificationSettingsModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '通知設定の更新に失敗しました',
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

### NotificationDeviceRemoteDataSource
```dart
abstract class NotificationDeviceRemoteDataSource {
  Future<NotificationDeviceModel> registerDeviceToken(
    String userId,
    String token,
    DeviceType type,
  );
  Future<bool> unregisterDeviceToken(String token);
  Future<List<NotificationDeviceModel>> getUserDevices(String userId);
}

class NotificationDeviceRemoteDataSourceImpl implements NotificationDeviceRemoteDataSource {
  final http.Client client;
  final String baseUrl;
  
  NotificationDeviceRemoteDataSourceImpl({
    required this.client,
    this.baseUrl = 'https://api.kanushi.app/v1',
  });
  
  @override
  Future<NotificationDeviceModel> registerDeviceToken(
    String userId,
    String token,
    DeviceType type,
  ) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/notification-devices'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode({
          'user_id': userId,
          'device_token': token,
          'device_type': type.name,
        }),
      );
      
      if (response.statusCode == 201) {
        return NotificationDeviceModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? 'デバイストークンの登録に失敗しました',
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
  Future<bool> unregisterDeviceToken(String token) async {
    try {
      final response = await client.delete(
        Uri.parse('$baseUrl/notification-devices/token/$token'),
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
  
  @override
  Future<List<NotificationDeviceModel>> getUserDevices(String userId) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/notification-devices?user_id=$userId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> devicesJson = json.decode(response.body);
        return devicesJson
            .map((json) => NotificationDeviceModel.fromJson(json))
            .toList();
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? 'デバイス一覧の取得に失敗しました',
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

### NotificationLocalDataSource
```dart
abstract class NotificationLocalDataSource {
  Future<List<NotificationModel>> getNotifications({
    String? userId,
    bool? read,
    NotificationType? type,
    int limit = 20,
    int offset = 0,
  });
  Future<void> cacheNotifications(List<NotificationModel> notifications);
  Future<void> updateNotification(NotificationModel notification);
  Future<void> deleteNotification(String notificationId);
  Future<int> getUnreadCount(String userId);
  Future<void> markAllAsRead(String userId);
}

class NotificationLocalDataSourceImpl implements NotificationLocalDataSource {
  final Box<dynamic> notificationsBox;
  
  NotificationLocalDataSourceImpl({
    required this.notificationsBox,
  });
  
  @override
  Future<List<NotificationModel>> getNotifications({
    String? userId,
    bool? read,
    NotificationType? type,
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      final allNotifications = notificationsBox.values
          .map((json) => NotificationModel.fromJson(json))
          .where((notification) {
            if (userId != null && notification.userId != userId) {
              return false;
            }
            
            if (read != null && notification.read != read) {
              return false;
            }
            
            if (type != null && notification.notificationType != type) {
              return false;
            }
            
            return true;
          })
          .toList();
      
      // 新しい順に並べ替え
      allNotifications.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      
      // ページネーション
      final end = offset + limit > allNotifications.length
          ? allNotifications.length
          : offset + limit;
      
      if (offset >= allNotifications.length) {
        return [];
      }
      
      return allNotifications.sublist(offset, end);
    } catch (e) {
      throw CacheException('通知の取得に失敗しました: ${e.toString()}');
    }
  }
  
  @override
  Future<void> cacheNotifications(List<NotificationModel> notifications) async {
    try {
      for (var notification in notifications) {
        await notificationsBox.put(
          notification.id,
          notification.toJson(),
        );
      }
    } catch (e) {
      throw CacheException('通知のキャッシュに失敗しました: ${e.toString()}');
    }
  }
  
  @override
  Future<void> updateNotification(NotificationModel notification) async {
    try {
      await notificationsBox.put(
        notification.id,
        notification.toJson(),
      );
    } catch (e) {
      throw CacheException('通知の更新に失敗しました: ${e.toString()}');
    }
  }
  
  @override
  Future<void> deleteNotification(String notificationId) async {
    try {
      await notificationsBox.delete(notificationId);
    } catch (e) {
      throw CacheException('通知の削除に失敗しました: ${e.toString()}');
    }
  }
  
  @override
  Future<int> getUnreadCount(String userId) async {
    try {
      final count = notificationsBox.values
          .map((json) => NotificationModel.fromJson(json))
          .where((notification) => 
              notification.userId == userId && !notification.read)
          .length;
      
      return count;
    } catch (e) {
      throw CacheException('未読件数の取得に失敗しました: ${e.toString()}');
    }
  }
  
  @override
  Future<void> markAllAsRead(String userId) async {
    try {
      final notifications = notificationsBox.values
          .map((json) => NotificationModel.fromJson(json))
          .where((notification) => 
              notification.userId == userId && !notification.read)
          .toList();
      
      for (var notification in notifications) {
        final updatedNotification = NotificationModel(
          id: notification.id,
          userId: notification.userId,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          read: true,
          notificationType: notification.notificationType,
          createdAt: notification.createdAt,
          readAt: DateTime.now(),
        );
        
        await notificationsBox.put(
          notification.id,
          updatedNotification.toJson(),
        );
      }
    } catch (e) {
      throw CacheException('全件既読処理に失敗しました: ${e.toString()}');
    }
  }
}
```

## 5. ユースケース詳細

### GetNotificationsUseCase
```dart
class GetNotificationsUseCase {
  final INotificationRepository repository;
  
  GetNotificationsUseCase({required this.repository});
  
  Future<Either<Failure, List<NotificationEntity>>> call({
    String? userId,
    bool? read,
    NotificationType? type,
    int limit = 20,
    int offset = 0,
  }) async {
    return repository.getNotifications(
      userId: userId,
      read: read,
      type: type,
      limit: limit,
      offset: offset,
    );
  }
}
```

### MarkNotificationAsReadUseCase
```dart
class MarkNotificationAsReadUseCase {
  final INotificationRepository repository;
  
  MarkNotificationAsReadUseCase({required this.repository});
  
  Future<Either<Failure, NotificationEntity>> call(String notificationId) async {
    return repository.markAsRead(notificationId);
  }
}
```

### UpdateNotificationSettingsUseCase
```dart
class UpdateNotificationSettingsUseCase {
  final INotificationSettingsRepository repository;
  
  UpdateNotificationSettingsUseCase({required this.repository});
  
  Future<Either<Failure, NotificationSettingsEntity>> call(
    NotificationSettingsEntity settings,
  ) async {
    return repository.updateNotificationSettings(settings);
  }
}
```

### RegisterDeviceTokenUseCase
```dart
class RegisterDeviceTokenUseCase {
  final INotificationDeviceRepository repository;
  
  RegisterDeviceTokenUseCase({required this.repository});
  
  Future<Either<Failure, NotificationDeviceEntity>> call(
    String userId,
    String token,
    DeviceType type,
  ) async {
    return repository.registerDeviceToken(userId, token, type);
  }
}
```

## 6. ビューモデル詳細

### NotificationListViewModel
```dart
class NotificationListViewModel extends StateNotifier<NotificationListState> {
  final GetNotificationsUseCase getNotificationsUseCase;
  final MarkNotificationAsReadUseCase markNotificationAsReadUseCase;
  final DeleteNotificationUseCase deleteNotificationUseCase;
  final GetUnreadCountUseCase getUnreadCountUseCase;
  final MarkAllAsReadUseCase markAllAsReadUseCase;
  
  NotificationListViewModel({
    required this.getNotificationsUseCase,
    required this.markNotificationAsReadUseCase,
    required this.deleteNotificationUseCase,
    required this.getUnreadCountUseCase,
    required this.markAllAsReadUseCase,
  }) : super(NotificationListInitial());
  
  Future<void> loadNotifications({
    String? userId,
    bool? read,
    NotificationType? type,
    bool isRefresh = false,
  }) async {
    if (isRefresh) {
      state = NotificationListLoading();
    } else if (state is NotificationListLoaded) {
      state = NotificationListLoadingMore((state as NotificationListLoaded).notifications);
    } else {
      state = NotificationListLoading();
    }
    
    final result = await getNotificationsUseCase(
      userId: userId,
      read: read,
      type: type,
      limit: 20,
      offset: isRefresh || !(state is NotificationListLoadingMore) ? 0 
          : (state as NotificationListLoadingMore).notifications.length,
    );
    
    result.fold(
      (failure) => state = NotificationListError(failure.message),
      (notifications) {
        if (state is NotificationListLoadingMore) {
          final existingNotifications = (state as NotificationListLoadingMore).notifications;
          state = NotificationListLoaded([...existingNotifications, ...notifications]);
        } else {
          state = NotificationListLoaded(notifications);
        }
      },
    );
  }
  
  Future<void> markAsRead(String notificationId) async {
    if (state is NotificationListLoaded) {
      final currentNotifications = (state as NotificationListLoaded).notifications;
      
      // 楽観的更新
      final updatedNotifications = currentNotifications.map((notification) {
        if (notification.id == notificationId) {
          return NotificationModel(
            id: notification.id,
            userId: notification.userId,
            title: notification.title,
            body: notification.body,
            data: (notification as NotificationModel).data,
            read: true,
            notificationType: (notification as NotificationModel).notificationType,
            createdAt: notification.createdAt,
            readAt: DateTime.now(),
          );
        }
        return notification;
      }).toList();
      
      state = NotificationListLoaded(updatedNotifications);
      
      // リポジトリ更新
      final result = await markNotificationAsReadUseCase(notificationId);
      
      result.fold(
        (failure) {
          // 失敗時は元に戻す
          state = NotificationListLoaded(currentNotifications);
          state = NotificationListError(failure.message);
        },
        (_) => {}, // 成功時は既に楽観的に更新済み
      );
    }
  }
  
  Future<void> deleteNotification(String notificationId) async {
    if (state is NotificationListLoaded) {
      final currentNotifications = (state as NotificationListLoaded).notifications;
      
      // 楽観的更新
      final updatedNotifications = currentNotifications
          .where((notification) => notification.id != notificationId)
          .toList();
      
      state = NotificationListLoaded(updatedNotifications);
      
      // リポジトリ更新
      final result = await deleteNotificationUseCase(notificationId);
      
      result.fold(
        (failure) {
          // 失敗時は元に戻す
          state = NotificationListLoaded(currentNotifications);
          state = NotificationListError(failure.message);
        },
        (_) => {}, // 成功時は既に楽観的に更新済み
      );
    }
  }
  
  Future<void> loadUnreadCount(String userId) async {
    final result = await getUnreadCountUseCase(userId);
    
    result.fold(
      (failure) => {}, // エラーは無視
      (count) {
        if (state is NotificationListLoaded) {
          state = (state as NotificationListLoaded).copyWith(unreadCount: count);
        } else {
          state = NotificationListLoaded([], unreadCount: count);
        }
      },
    );
  }
  
  Future<void> markAllAsRead(String userId) async {
    if (state is NotificationListLoaded) {
      final currentNotifications = (state as NotificationListLoaded).notifications;
      
      // 楽観的更新
      final updatedNotifications = currentNotifications.map((notification) {
        if (!notification.read) {
          return NotificationModel(
            id: notification.id,
            userId: notification.userId,
            title: notification.title,
            body: notification.body,
            data: (notification as NotificationModel).data,
            read: true,
            notificationType: (notification as NotificationModel).notificationType,
            createdAt: notification.createdAt,
            readAt: DateTime.now(),
          );
        }
        return notification;
      }).toList();
      
      state = NotificationListLoaded(updatedNotifications, unreadCount: 0);
      
      // リポジトリ更新
      final result = await markAllAsReadUseCase(userId);
      
      result.fold(
        (failure) {
          // 失敗時は元に戻す
          state = NotificationListLoaded(currentNotifications);
          state = NotificationListError(failure.message);
        },
        (_) => {}, // 成功時は既に楽観的に更新済み
      );
    }
  }
}

// 状態定義
abstract class NotificationListState {}

class NotificationListInitial extends NotificationListState {}

class NotificationListLoading extends NotificationListState {}

class NotificationListLoadingMore extends NotificationListState {
  final List<NotificationEntity> notifications;
  NotificationListLoadingMore(this.notifications);
}

class NotificationListLoaded extends NotificationListState {
  final List<NotificationEntity> notifications;
  final int unreadCount;
  
  NotificationListLoaded(this.notifications, {this.unreadCount = 0});
  
  NotificationListLoaded copyWith({
    List<NotificationEntity>? notifications,
    int? unreadCount,
  }) {
    return NotificationListLoaded(
      notifications ?? this.notifications,
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }
}

class NotificationListError extends NotificationListState {
  final String message;
  NotificationListError(this.message);
}
```

### NotificationSettingsViewModel
```dart
class NotificationSettingsViewModel extends StateNotifier<NotificationSettingsState> {
  final GetNotificationSettingsUseCase getNotificationSettingsUseCase;
  final UpdateNotificationSettingsUseCase updateNotificationSettingsUseCase;
  
  NotificationSettingsViewModel({
    required this.getNotificationSettingsUseCase,
    required this.updateNotificationSettingsUseCase,
  }) : super(NotificationSettingsInitial());
  
  Future<void> loadSettings(String userId) async {
    state = NotificationSettingsLoading();
    
    final result = await getNotificationSettingsUseCase(userId);
    
    result.fold(
      (failure) => state = NotificationSettingsError(failure.message),
      (settings) => state = NotificationSettingsLoaded(settings),
    );
  }
  
  Future<void> updateSettings(NotificationSettingsEntity settings) async {
    if (state is NotificationSettingsLoaded) {
      final currentSettings = (state as NotificationSettingsLoaded).settings;
      
      // 楽観的更新
      state = NotificationSettingsLoaded(settings);
      
      // リポジトリ更新
      final result = await updateNotificationSettingsUseCase(settings);
      
      result.fold(
        (failure) {
          // 失敗時は元に戻す
          state = NotificationSettingsLoaded(currentSettings);
          state = NotificationSettingsError(failure.message);
        },
        (updatedSettings) => state = NotificationSettingsLoaded(updatedSettings),
      );
    }
  }
  
  Future<void> toggleSetting(
    NotificationSettingsEntity settings,
    NotificationType type,
    bool enabled,
  ) async {
    final settingsModel = settings as NotificationSettingsModel;
    NotificationSettingsModel updatedSettings;
    
    switch (type) {
      case NotificationType.comment:
        updatedSettings = settingsModel.copyWith(commentsEnabled: enabled);
        break;
      case NotificationType.highlight:
        updatedSettings = settingsModel.copyWith(highlightsEnabled: enabled);
        break;
      case NotificationType.follower:
        updatedSettings = settingsModel.copyWith(followersEnabled: enabled);
        break;
      case NotificationType.followReason:
        updatedSettings = settingsModel.copyWith(followReasonsEnabled: enabled);
        break;
      case NotificationType.system:
        updatedSettings = settingsModel.copyWith(systemEnabled: enabled);
        break;
    }
    
    await updateSettings(updatedSettings);
  }
}

// 状態定義
abstract class NotificationSettingsState {}

class NotificationSettingsInitial extends NotificationSettingsState {}

class NotificationSettingsLoading extends NotificationSettingsState {}

class NotificationSettingsLoaded extends NotificationSettingsState {
  final NotificationSettingsEntity settings;
  NotificationSettingsLoaded(this.settings);
}

class NotificationSettingsError extends NotificationSettingsState {
  final String message;
  NotificationSettingsError(this.message);
}
```

## 7. 依存性注入設定

```dart
// 依存性注入の設定
final notificationDomainModule = [
  // データソース
  Provider<NotificationRemoteDataSource>(
    (ref) => NotificationRemoteDataSourceImpl(
      client: ref.watch(httpClientProvider),
    ),
  ),
  Provider<NotificationLocalDataSource>(
    (ref) => NotificationLocalDataSourceImpl(
      notificationsBox: ref.watch(notificationsBoxProvider),
    ),
  ),
  Provider<NotificationSettingsRemoteDataSource>(
    (ref) => NotificationSettingsRemoteDataSourceImpl(
      client: ref.watch(httpClientProvider),
    ),
  ),
  Provider<NotificationSettingsLocalDataSource>(
    (ref) => NotificationSettingsLocalDataSourceImpl(
      settingsBox: ref.watch(notificationSettingsBoxProvider),
    ),
  ),
  Provider<NotificationDeviceRemoteDataSource>(
    (ref) => NotificationDeviceRemoteDataSourceImpl(
      client: ref.watch(httpClientProvider),
    ),
  ),
  
  // リポジトリ
  Provider<INotificationRepository>(
    (ref) => NotificationRepository(
      remoteDataSource: ref.watch(notificationRemoteDataSourceProvider),
      localDataSource: ref.watch(notificationLocalDataSourceProvider),
    ),
  ),
  Provider<INotificationSettingsRepository>(
    (ref) => NotificationSettingsRepository(
      remoteDataSource: ref.watch(notificationSettingsRemoteDataSourceProvider),
      localDataSource: ref.watch(notificationSettingsLocalDataSourceProvider),
    ),
  ),
  Provider<INotificationDeviceRepository>(
    (ref) => NotificationDeviceRepository(
      remoteDataSource: ref.watch(notificationDeviceRemoteDataSourceProvider),
    ),
  ),
  
  // ユースケース
  Provider<GetNotificationsUseCase>(
    (ref) => GetNotificationsUseCase(
      repository: ref.watch(notificationRepositoryProvider),
    ),
  ),
  Provider<MarkNotificationAsReadUseCase>(
    (ref) => MarkNotificationAsReadUseCase(
      repository: ref.watch(notificationRepositoryProvider),
    ),
  ),
  Provider<DeleteNotificationUseCase>(
    (ref) => DeleteNotificationUseCase(
      repository: ref.watch(notificationRepositoryProvider),
    ),
  ),
  Provider<GetUnreadCountUseCase>(
    (ref) => GetUnreadCountUseCase(
      repository: ref.watch(notificationRepositoryProvider),
    ),
  ),
  Provider<MarkAllAsReadUseCase>(
    (ref) => MarkAllAsReadUseCase(
      repository: ref.watch(notificationRepositoryProvider),
    ),
  ),
  Provider<GetNotificationSettingsUseCase>(
    (ref) => GetNotificationSettingsUseCase(
      repository: ref.watch(notificationSettingsRepositoryProvider),
    ),
  ),
  Provider<UpdateNotificationSettingsUseCase>(
    (ref) => UpdateNotificationSettingsUseCase(
      repository: ref.watch(notificationSettingsRepositoryProvider),
    ),
  ),
  Provider<RegisterDeviceTokenUseCase>(
    (ref) => RegisterDeviceTokenUseCase(
      repository: ref.watch(notificationDeviceRepositoryProvider),
    ),
  ),
  Provider<UnregisterDeviceTokenUseCase>(
    (ref) => UnregisterDeviceTokenUseCase(
      repository: ref.watch(notificationDeviceRepositoryProvider),
    ),
  ),
  
  // ビューモデル
  StateNotifierProvider<NotificationListViewModel, NotificationListState>(
    (ref) => NotificationListViewModel(
      getNotificationsUseCase: ref.watch(getNotificationsUseCaseProvider),
      markNotificationAsReadUseCase: ref.watch(markNotificationAsReadUseCaseProvider),
      deleteNotificationUseCase: ref.watch(deleteNotificationUseCaseProvider),
      getUnreadCountUseCase: ref.watch(getUnreadCountUseCaseProvider),
      markAllAsReadUseCase: ref.watch(markAllAsReadUseCaseProvider),
    ),
  ),
  StateNotifierProvider<NotificationSettingsViewModel, NotificationSettingsState>(
    (ref) => NotificationSettingsViewModel(
      getNotificationSettingsUseCase: ref.watch(getNotificationSettingsUseCaseProvider),
      updateNotificationSettingsUseCase: ref.watch(updateNotificationSettingsUseCaseProvider),
    ),
  ),
];
```

## 8. セキュリティ考慮事項

1. **FCMトークンの安全な管理**
   - トークンの保管と送信は暗号化して実施
   - 不正なトークン登録の防止策
   - トークンのアクセス権限を厳格に管理
   - トークン失効時の適切な処理

2. **通知内容のプライバシー保護**
   - 通知に機密情報を含めない設計方針
   - 通知プッシュ内容は最小限の情報のみ含める
   - 詳細情報はアプリ内での認証後に表示
   - 通知内容の暗号化と安全な保存

3. **通知のアクセス制御**
   - 通知はユーザー自身のみ閲覧可能
   - 通知設定は認証後のみ変更可能
   - 不正なアクセス試行の監視と防止
   - API通信時の適切な認証処理

4. **デバイストークンの管理**
   - 古いトークンやインアクティブなトークンの定期的なクリーンアップ
   - トークンあたりの通知頻度制限
   - デバイス識別情報の暗号化保存
   - 複数デバイスの同時登録管理

## 9. パフォーマンス最適化

1. **通知一覧の最適化**
   - 通知リストの無限スクロール実装
   - 通知データのプリフェッチ
   - 画像リソースのキャッシュ
   - 効率的なリスト更新（差分更新）

2. **バッチ処理の最適化**
   - 既読処理のバッチ化
   - 削除操作のバッチ化
   - 低優先度処理のバックグラウンド実行
   - データ同期の効率化

3. **オフラインサポート**
   - 通知のローカルキャッシュ
   - 既読状態のオフライン管理
   - 接続回復時の同期処理
   - オフラインモードの適切な表示

4. **プッシュ通知の最適化**
   - 通知バッジ数の正確な管理
   - 同一イベントの通知重複防止
   - 通知設定に基づくフィルタリング
   - サイレント通知の活用による効率化

## 10. エラーハンドリング戦略

```dart
// 汎用エラーハンドラー
void handleNotificationError(BuildContext context, String message) {
  // ネットワークエラー
  if (message.contains('ネットワーク')) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('通知の更新に失敗しました。ネットワーク接続を確認してください'),
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
  
  // 設定エラー
  if (message.contains('設定')) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('通知設定の更新に失敗しました。後でもう一度お試しください'),
      ),
    );
    return;
  }
  
  // デバイス登録エラー
  if (message.contains('デバイス') || message.contains('トークン')) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('通知の登録に失敗しました。アプリを再起動してください'),
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
- 通知一覧取得と表示のフロー
- 通知既読・削除のフロー
- 通知設定の更新フロー
- デバイストークン登録・削除のフロー

### UIテスト
- 通知リストの表示とスクロール
- 通知アクションの実行と遷移
- 通知設定画面の操作
- エラー状態の表示と回復

## 12. FAQ的な実装上の注意点

1. **プッシュ通知のアクセス権**
   - iOS/Androidでの通知権限リクエストのタイミング
   - 権限拒否時のフォールバック処理
   - 通知権限変更の検出と対応
   - バックグラウンド通知とフォアグラウンド通知の違い

2. **Expo Push Serviceの制約**
   - 通知ペイロードのサイズ制限
   - 送信レート制限と対策
   - エラーレスポンスのハンドリング
   - 失敗時のリトライ戦略

3. **通知設計のベストプラクティス**
   - 通知を送るべきイベントの選定基準
   - 通知メッセージの作成ガイドライン
   - ユーザー時間帯を考慮した送信制御
   - 通知のグループ化とバッチ処理

4. **トラブルシューティング**
   - 通知が届かない場合のデバッグ手順
   - トークン更新失敗時の対応
   - FCM/APNs連携エラーの解決策
   - プッシュ通知のテスト方法