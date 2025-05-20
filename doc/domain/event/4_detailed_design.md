# イベントドメイン詳細設計

## 1. アーキテクチャ概要

イベントドメインは、クリーンアーキテクチャに基づき以下の層に分けて実装します。

### プレゼンテーション層
- **画面（Screens）**
  - EventScreen
  - EventDetailScreen
  - EventRegistrationScreen
  - EventCreationScreen
  - EventEditScreen
  - EventParticipantsScreen
  - MyEventsScreen
  - EventPaymentScreen
  - EventCompletionScreen

- **ビューモデル（ViewModels）**
  - EventListViewModel
  - EventDetailViewModel
  - EventRegistrationViewModel
  - EventCreationViewModel
  - EventEditViewModel
  - EventParticipantsViewModel
  - MyEventsViewModel
  - EventPaymentViewModel

- **ウィジェット（Widgets）**
  - EventCard
  - EventDetailHeader
  - ParticipantAvatar
  - ParticipantList
  - EventDateTimePicker
  - EventLocationSelector
  - PaymentMethodSelector
  - EventStatusBadge
  - EventTimeline
  - EventPostList

### ドメイン層
- **エンティティ（Entities）**
  - EventEntity
  - EventParticipantEntity
  - EventCoHostEntity
  - EventPaymentEntity

- **リポジトリインターフェース（Repository Interfaces）**
  - IEventRepository
  - IEventParticipantRepository
  - IEventPaymentRepository

- **ユースケース（Use Cases）**
  - GetEventsUseCase
  - GetEventByIdUseCase
  - CreateEventUseCase
  - UpdateEventUseCase
  - DeleteEventUseCase
  - GetEventParticipantsUseCase
  - JoinEventUseCase
  - CancelEventParticipationUseCase
  - AddEventCoHostUseCase
  - RemoveEventCoHostUseCase
  - CreateEventPaymentUseCase
  - GetEventPaymentUseCase
  - ProcessRefundUseCase
  - GetEventTimelineUseCase

### データ層
- **リポジトリ実装（Repository Implementations）**
  - EventRepository
  - EventParticipantRepository
  - EventPaymentRepository

- **データソース（Data Sources）**
  - EventRemoteDataSource
  - EventLocalDataSource
  - EventParticipantRemoteDataSource
  - EventParticipantLocalDataSource
  - EventPaymentRemoteDataSource

- **モデル（Models）**
  - EventModel
  - EventParticipantModel
  - EventCoHostModel
  - EventPaymentModel

## 2. データモデル詳細

### EventModel
```dart
class EventModel extends EventEntity {
  final String id;
  final String creatorUserId;
  final String name;
  final String description;
  final String location;
  final DateTime startsAt;
  final DateTime endsAt;
  final double? fee;
  final String? currency;
  final String? refundPolicy;
  final DateTime createdAt;
  final int participantCount;
  final int interestedCount;
  
  EventModel({
    required this.id,
    required this.creatorUserId,
    required this.name,
    required this.description,
    required this.location,
    required this.startsAt,
    required this.endsAt,
    this.fee,
    this.currency,
    this.refundPolicy,
    required this.createdAt,
    this.participantCount = 0,
    this.interestedCount = 0,
  });
  
  factory EventModel.fromJson(Map<String, dynamic> json) {
    return EventModel(
      id: json['id'],
      creatorUserId: json['creator_user_id'],
      name: json['name'],
      description: json['description'],
      location: json['location'],
      startsAt: DateTime.parse(json['starts_at']),
      endsAt: DateTime.parse(json['ends_at']),
      fee: json['fee']?.toDouble(),
      currency: json['currency'],
      refundPolicy: json['refund_policy'],
      createdAt: DateTime.parse(json['created_at']),
      participantCount: json['participant_count'] ?? 0,
      interestedCount: json['interested_count'] ?? 0,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'creator_user_id': creatorUserId,
      'name': name,
      'description': description,
      'location': location,
      'starts_at': startsAt.toIso8601String(),
      'ends_at': endsAt.toIso8601String(),
      'fee': fee,
      'currency': currency,
      'refund_policy': refundPolicy,
      'created_at': createdAt.toIso8601String(),
      'participant_count': participantCount,
      'interested_count': interestedCount,
    };
  }
  
  bool get isFreeEvent => fee == null || fee == 0;
  
  bool get hasStarted => DateTime.now().isAfter(startsAt);
  
  bool get hasEnded => DateTime.now().isAfter(endsAt);
  
  bool get isUpcoming => !hasStarted && !hasEnded;
  
  String get formattedFee {
    if (isFreeEvent) return '無料';
    return '${fee?.toStringAsFixed(0)} ${currency ?? 'JPY'}';
  }
  
  EventModel copyWith({
    String? id,
    String? creatorUserId,
    String? name,
    String? description,
    String? location,
    DateTime? startsAt,
    DateTime? endsAt,
    double? fee,
    String? currency,
    String? refundPolicy,
    DateTime? createdAt,
    int? participantCount,
    int? interestedCount,
  }) {
    return EventModel(
      id: id ?? this.id,
      creatorUserId: creatorUserId ?? this.creatorUserId,
      name: name ?? this.name,
      description: description ?? this.description,
      location: location ?? this.location,
      startsAt: startsAt ?? this.startsAt,
      endsAt: endsAt ?? this.endsAt,
      fee: fee ?? this.fee,
      currency: currency ?? this.currency,
      refundPolicy: refundPolicy ?? this.refundPolicy,
      createdAt: createdAt ?? this.createdAt,
      participantCount: participantCount ?? this.participantCount,
      interestedCount: interestedCount ?? this.interestedCount,
    );
  }
}
```

### EventParticipantModel
```dart
enum ParticipantStatus { going, interested }
enum PaymentStatus { pending, paid, refunded }

class EventParticipantModel extends EventParticipantEntity {
  final String id;
  final String eventId;
  final String userId;
  final ParticipantStatus status;
  final PaymentStatus? paymentStatus;
  final DateTime joinedAt;
  final UserModel? user; // Userの情報を含む場合
  
  EventParticipantModel({
    required this.id,
    required this.eventId,
    required this.userId,
    required this.status,
    this.paymentStatus,
    required this.joinedAt,
    this.user,
  });
  
  factory EventParticipantModel.fromJson(Map<String, dynamic> json) {
    return EventParticipantModel(
      id: json['id'],
      eventId: json['event_id'],
      userId: json['user_id'],
      status: ParticipantStatus.values.byName(json['status']),
      paymentStatus: json['payment_status'] != null
          ? PaymentStatus.values.byName(json['payment_status'])
          : null,
      joinedAt: DateTime.parse(json['joined_at']),
      user: json['user'] != null ? UserModel.fromJson(json['user']) : null,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'event_id': eventId,
      'user_id': userId,
      'status': status.name,
      'payment_status': paymentStatus?.name,
      'joined_at': joinedAt.toIso8601String(),
      'user': user?.toJson(),
    };
  }
  
  EventParticipantModel copyWith({
    String? id,
    String? eventId,
    String? userId,
    ParticipantStatus? status,
    PaymentStatus? paymentStatus,
    DateTime? joinedAt,
    UserModel? user,
  }) {
    return EventParticipantModel(
      id: id ?? this.id,
      eventId: eventId ?? this.eventId,
      userId: userId ?? this.userId,
      status: status ?? this.status,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      joinedAt: joinedAt ?? this.joinedAt,
      user: user ?? this.user,
    );
  }
}
```

### EventCoHostModel
```dart
class EventCoHostModel extends EventCoHostEntity {
  final String id;
  final String eventId;
  final String userId;
  final DateTime addedAt;
  final UserModel? user; // Userの情報を含む場合
  
  EventCoHostModel({
    required this.id,
    required this.eventId,
    required this.userId,
    required this.addedAt,
    this.user,
  });
  
  factory EventCoHostModel.fromJson(Map<String, dynamic> json) {
    return EventCoHostModel(
      id: json['id'],
      eventId: json['event_id'],
      userId: json['user_id'],
      addedAt: DateTime.parse(json['added_at']),
      user: json['user'] != null ? UserModel.fromJson(json['user']) : null,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'event_id': eventId,
      'user_id': userId,
      'added_at': addedAt.toIso8601String(),
      'user': user?.toJson(),
    };
  }
}
```

### EventPaymentModel
```dart
enum PaymentStatus { pending, completed, failed, refunded }

class EventPaymentModel extends EventPaymentEntity {
  final String id;
  final String participantId;
  final String eventId;
  final String userId;
  final double amount;
  final String currency;
  final double feeAmount;
  final PaymentStatus status;
  final String? paymentIntentId;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;
  final DateTime? updatedAt;
  
  EventPaymentModel({
    required this.id,
    required this.participantId,
    required this.eventId,
    required this.userId,
    required this.amount,
    required this.currency,
    required this.feeAmount,
    required this.status,
    this.paymentIntentId,
    this.metadata,
    required this.createdAt,
    this.updatedAt,
  });
  
  factory EventPaymentModel.fromJson(Map<String, dynamic> json) {
    return EventPaymentModel(
      id: json['id'],
      participantId: json['participant_id'],
      eventId: json['event_id'],
      userId: json['user_id'],
      amount: json['amount'].toDouble(),
      currency: json['currency'],
      feeAmount: json['fee_amount'].toDouble(),
      status: PaymentStatus.values.byName(json['status']),
      paymentIntentId: json['payment_intent_id'],
      metadata: json['metadata'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'participant_id': participantId,
      'event_id': eventId,
      'user_id': userId,
      'amount': amount,
      'currency': currency,
      'fee_amount': feeAmount,
      'status': status.name,
      'payment_intent_id': paymentIntentId,
      'metadata': metadata,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }
}
```

## 3. リポジトリ詳細

### EventRepository
```dart
class EventRepository implements IEventRepository {
  final EventRemoteDataSource remoteDataSource;
  final EventLocalDataSource localDataSource;
  
  EventRepository({
    required this.remoteDataSource,
    required this.localDataSource,
  });
  
  @override
  Future<Either<Failure, List<EventEntity>>> getEvents({
    DateTime? afterDate,
    String? creatorUserId,
    bool includeParticipantInfo = false,
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      // ネットワーク状態のチェック
      if (await _isOffline()) {
        // オフラインの場合はローカルキャッシュから取得
        return Right(await localDataSource.getEvents(
          afterDate: afterDate,
          creatorUserId: creatorUserId,
          limit: limit,
          offset: offset,
        ));
      }
      
      // オンラインの場合はリモートから取得
      final events = await remoteDataSource.getEvents(
        afterDate: afterDate,
        creatorUserId: creatorUserId,
        includeParticipantInfo: includeParticipantInfo,
        limit: limit,
        offset: offset,
      );
      
      // ローカルキャッシュの更新
      await localDataSource.cacheEvents(events);
      
      return Right(events);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, EventEntity>> getEventById(
    String eventId, {
    bool includeParticipantInfo = false,
  }) async {
    try {
      // ネットワーク状態のチェック
      if (await _isOffline()) {
        // オフラインの場合はローカルキャッシュから取得
        final event = await localDataSource.getEventById(eventId);
        if (event != null) {
          return Right(event);
        } else {
          return Left(CacheFailure('イベントが見つかりません'));
        }
      }
      
      // オンラインの場合はリモートから取得
      final event = await remoteDataSource.getEventById(
        eventId, 
        includeParticipantInfo: includeParticipantInfo,
      );
      
      // ローカルキャッシュの更新
      await localDataSource.cacheEvent(event);
      
      return Right(event);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, EventEntity>> createEvent(EventEntity event) async {
    try {
      final createdEvent = await remoteDataSource.createEvent(
        event as EventModel,
      );
      
      // ローカルキャッシュの更新
      await localDataSource.cacheEvent(createdEvent);
      
      return Right(createdEvent);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, EventEntity>> updateEvent(EventEntity event) async {
    try {
      final updatedEvent = await remoteDataSource.updateEvent(
        event as EventModel,
      );
      
      // ローカルキャッシュの更新
      await localDataSource.cacheEvent(updatedEvent);
      
      return Right(updatedEvent);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, bool>> deleteEvent(String eventId) async {
    try {
      final success = await remoteDataSource.deleteEvent(eventId);
      
      if (success) {
        // ローカルキャッシュからも削除
        await localDataSource.deleteEvent(eventId);
      }
      
      return Right(success);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, List<EventEntity>>> getUserEvents(
    String userId,
    bool asParticipant,
  ) async {
    try {
      if (await _isOffline()) {
        return Right(await localDataSource.getUserEvents(userId, asParticipant));
      }
      
      final events = await remoteDataSource.getUserEvents(userId, asParticipant);
      await localDataSource.cacheEvents(events);
      
      return Right(events);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, List<PostEntity>>> getEventPosts(String eventId) async {
    try {
      final posts = await remoteDataSource.getEventPosts(eventId);
      return Right(posts);
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

### EventParticipantRepository
```dart
class EventParticipantRepository implements IEventParticipantRepository {
  final EventParticipantRemoteDataSource remoteDataSource;
  final EventParticipantLocalDataSource localDataSource;
  
  EventParticipantRepository({
    required this.remoteDataSource,
    required this.localDataSource,
  });
  
  @override
  Future<Either<Failure, List<EventParticipantEntity>>> getEventParticipants(
    String eventId, {
    ParticipantStatus? status,
    int limit = 100,
    int offset = 0,
  }) async {
    try {
      // ネットワーク状態のチェック
      if (await _isOffline()) {
        // オフラインの場合はローカルキャッシュから取得
        return Right(await localDataSource.getEventParticipants(
          eventId, 
          status: status,
          limit: limit,
          offset: offset,
        ));
      }
      
      // オンラインの場合はリモートから取得
      final participants = await remoteDataSource.getEventParticipants(
        eventId,
        status: status,
        limit: limit,
        offset: offset,
      );
      
      // ローカルキャッシュの更新
      await localDataSource.cacheEventParticipants(eventId, participants);
      
      return Right(participants);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on CacheException catch (e) {
      return Left(CacheFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, EventParticipantEntity>> joinEvent(
    String eventId,
    String userId,
    ParticipantStatus status,
  ) async {
    try {
      final participation = await remoteDataSource.joinEvent(
        eventId,
        userId,
        status,
      );
      
      // ローカルキャッシュの更新
      await localDataSource.cacheEventParticipant(participation);
      
      return Right(participation);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, bool>> cancelParticipation(
    String participantId,
  ) async {
    try {
      final success = await remoteDataSource.cancelParticipation(participantId);
      
      if (success) {
        // ローカルキャッシュからも削除
        await localDataSource.deleteEventParticipant(participantId);
      }
      
      return Right(success);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, EventParticipantEntity?>> getUserEventParticipation(
    String eventId,
    String userId,
  ) async {
    try {
      if (await _isOffline()) {
        final participation = await localDataSource.getUserEventParticipation(
          eventId, 
          userId,
        );
        return Right(participation);
      }
      
      final participation = await remoteDataSource.getUserEventParticipation(
        eventId,
        userId,
      );
      
      if (participation != null) {
        await localDataSource.cacheEventParticipant(participation);
      }
      
      return Right(participation);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, List<EventCoHostEntity>>> getEventCoHosts(
    String eventId,
  ) async {
    try {
      final coHosts = await remoteDataSource.getEventCoHosts(eventId);
      return Right(coHosts);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, EventCoHostEntity>> addEventCoHost(
    String eventId,
    String userId,
  ) async {
    try {
      final coHost = await remoteDataSource.addEventCoHost(eventId, userId);
      return Right(coHost);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, bool>> removeEventCoHost(
    String coHostId,
  ) async {
    try {
      final success = await remoteDataSource.removeEventCoHost(coHostId);
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

### EventPaymentRepository
```dart
class EventPaymentRepository implements IEventPaymentRepository {
  final EventPaymentRemoteDataSource remoteDataSource;
  
  EventPaymentRepository({
    required this.remoteDataSource,
  });
  
  @override
  Future<Either<Failure, String>> createEventPaymentIntent(
    String participantId,
    double amount,
    String currency,
  ) async {
    try {
      final clientSecret = await remoteDataSource.createEventPaymentIntent(
        participantId,
        amount,
        currency,
      );
      
      return Right(clientSecret);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, bool>> confirmEventPayment(
    String participantId,
    String paymentIntentId,
  ) async {
    try {
      final success = await remoteDataSource.confirmEventPayment(
        participantId,
        paymentIntentId,
      );
      
      return Right(success);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, EventPaymentEntity>> getEventPayment(
    String participantId,
  ) async {
    try {
      final payment = await remoteDataSource.getEventPayment(participantId);
      return Right(payment);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, bool>> processRefund(
    String paymentId,
    String? reason,
  ) async {
    try {
      final success = await remoteDataSource.processRefund(
        paymentId,
        reason,
      );
      
      return Right(success);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
}
```

## 4. データソース詳細

### EventRemoteDataSource
```dart
abstract class EventRemoteDataSource {
  Future<List<EventModel>> getEvents({
    DateTime? afterDate,
    String? creatorUserId,
    bool includeParticipantInfo = false,
    int limit = 20,
    int offset = 0,
  });
  Future<EventModel> getEventById(
    String eventId, {
    bool includeParticipantInfo = false,
  });
  Future<EventModel> createEvent(EventModel event);
  Future<EventModel> updateEvent(EventModel event);
  Future<bool> deleteEvent(String eventId);
  Future<List<EventModel>> getUserEvents(String userId, bool asParticipant);
  Future<List<PostModel>> getEventPosts(String eventId);
}

class EventRemoteDataSourceImpl implements EventRemoteDataSource {
  final http.Client client;
  final String baseUrl;
  
  EventRemoteDataSourceImpl({
    required this.client,
    this.baseUrl = 'https://api.kanushi.app/v1',
  });
  
  @override
  Future<List<EventModel>> getEvents({
    DateTime? afterDate,
    String? creatorUserId,
    bool includeParticipantInfo = false,
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      final queryParams = <String, String>{
        'limit': limit.toString(),
        'offset': offset.toString(),
        'include_participant_info': includeParticipantInfo.toString(),
      };
      
      if (afterDate != null) {
        queryParams['after_date'] = afterDate.toIso8601String();
      }
      
      if (creatorUserId != null) {
        queryParams['creator_user_id'] = creatorUserId;
      }
      
      final uri = Uri.parse('$baseUrl/events').replace(
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
        final List<dynamic> eventsJson = json.decode(response.body);
        return eventsJson
            .map((json) => EventModel.fromJson(json))
            .toList();
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? 'イベントの取得に失敗しました',
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
  Future<EventModel> getEventById(
    String eventId, {
    bool includeParticipantInfo = false,
  }) async {
    try {
      final queryParams = <String, String>{
        'include_participant_info': includeParticipantInfo.toString(),
      };
      
      final uri = Uri.parse('$baseUrl/events/$eventId').replace(
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
        return EventModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? 'イベントの取得に失敗しました',
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
  Future<EventModel> createEvent(EventModel event) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/events'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode(event.toJson()..remove('id')),
      );
      
      if (response.statusCode == 201) {
        return EventModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? 'イベントの作成に失敗しました',
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
  Future<EventModel> updateEvent(EventModel event) async {
    try {
      final response = await client.put(
        Uri.parse('$baseUrl/events/${event.id}'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode(event.toJson()),
      );
      
      if (response.statusCode == 200) {
        return EventModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? 'イベントの更新に失敗しました',
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
  Future<bool> deleteEvent(String eventId) async {
    try {
      final response = await client.delete(
        Uri.parse('$baseUrl/events/$eventId'),
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
  Future<List<EventModel>> getUserEvents(
    String userId,
    bool asParticipant,
  ) async {
    try {
      final endpoint = asParticipant 
          ? '/users/$userId/participating-events'
          : '/users/$userId/created-events';
      
      final response = await client.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> eventsJson = json.decode(response.body);
        return eventsJson
            .map((json) => EventModel.fromJson(json))
            .toList();
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? 'イベントの取得に失敗しました',
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
  Future<List<PostModel>> getEventPosts(String eventId) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/events/$eventId/posts'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> postsJson = json.decode(response.body);
        return postsJson
            .map((json) => PostModel.fromJson(json))
            .toList();
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? 'イベント投稿の取得に失敗しました',
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

### EventParticipantRemoteDataSource
```dart
abstract class EventParticipantRemoteDataSource {
  Future<List<EventParticipantModel>> getEventParticipants(
    String eventId, {
    ParticipantStatus? status,
    int limit = 100,
    int offset = 0,
  });
  Future<EventParticipantModel> joinEvent(
    String eventId,
    String userId,
    ParticipantStatus status,
  );
  Future<bool> cancelParticipation(String participantId);
  Future<EventParticipantModel?> getUserEventParticipation(
    String eventId,
    String userId,
  );
  Future<List<EventCoHostModel>> getEventCoHosts(String eventId);
  Future<EventCoHostModel> addEventCoHost(String eventId, String userId);
  Future<bool> removeEventCoHost(String coHostId);
}

class EventParticipantRemoteDataSourceImpl implements EventParticipantRemoteDataSource {
  final http.Client client;
  final String baseUrl;
  
  EventParticipantRemoteDataSourceImpl({
    required this.client,
    this.baseUrl = 'https://api.kanushi.app/v1',
  });
  
  @override
  Future<List<EventParticipantModel>> getEventParticipants(
    String eventId, {
    ParticipantStatus? status,
    int limit = 100,
    int offset = 0,
  }) async {
    try {
      final queryParams = <String, String>{
        'limit': limit.toString(),
        'offset': offset.toString(),
      };
      
      if (status != null) {
        queryParams['status'] = status.name;
      }
      
      final uri = Uri.parse('$baseUrl/events/$eventId/participants').replace(
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
        final List<dynamic> participantsJson = json.decode(response.body);
        return participantsJson
            .map((json) => EventParticipantModel.fromJson(json))
            .toList();
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '参加者の取得に失敗しました',
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
  Future<EventParticipantModel> joinEvent(
    String eventId,
    String userId,
    ParticipantStatus status,
  ) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/events/$eventId/participants'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode({
          'user_id': userId,
          'status': status.name,
        }),
      );
      
      if (response.statusCode == 201) {
        return EventParticipantModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? 'イベント参加登録に失敗しました',
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
  Future<bool> cancelParticipation(String participantId) async {
    try {
      final response = await client.delete(
        Uri.parse('$baseUrl/event-participants/$participantId'),
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
  Future<EventParticipantModel?> getUserEventParticipation(
    String eventId,
    String userId,
  ) async {
    try {
      final uri = Uri.parse('$baseUrl/events/$eventId/participants/user/$userId');
      
      final response = await client.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        return EventParticipantModel.fromJson(json.decode(response.body));
      } else if (response.statusCode == 404) {
        return null;
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '参加状況の取得に失敗しました',
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
  Future<List<EventCoHostModel>> getEventCoHosts(String eventId) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/events/$eventId/co-hosts'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> coHostsJson = json.decode(response.body);
        return coHostsJson
            .map((json) => EventCoHostModel.fromJson(json))
            .toList();
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '共同ホストの取得に失敗しました',
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
  Future<EventCoHostModel> addEventCoHost(
    String eventId,
    String userId,
  ) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/events/$eventId/co-hosts'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode({
          'user_id': userId,
        }),
      );
      
      if (response.statusCode == 201) {
        return EventCoHostModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '共同ホストの追加に失敗しました',
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
  Future<bool> removeEventCoHost(String coHostId) async {
    try {
      final response = await client.delete(
        Uri.parse('$baseUrl/event-co-hosts/$coHostId'),
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

### EventPaymentRemoteDataSource
```dart
abstract class EventPaymentRemoteDataSource {
  Future<String> createEventPaymentIntent(
    String participantId,
    double amount,
    String currency,
  );
  Future<bool> confirmEventPayment(
    String participantId,
    String paymentIntentId,
  );
  Future<EventPaymentModel> getEventPayment(String participantId);
  Future<bool> processRefund(String paymentId, String? reason);
}

class EventPaymentRemoteDataSourceImpl implements EventPaymentRemoteDataSource {
  final http.Client client;
  final String baseUrl;
  
  EventPaymentRemoteDataSourceImpl({
    required this.client,
    this.baseUrl = 'https://api.kanushi.app/v1',
  });
  
  @override
  Future<String> createEventPaymentIntent(
    String participantId,
    double amount,
    String currency,
  ) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/event-payments/create-intent'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode({
          'participant_id': participantId,
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
  Future<bool> confirmEventPayment(
    String participantId,
    String paymentIntentId,
  ) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/event-payments/confirm'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode({
          'participant_id': participantId,
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
  Future<EventPaymentModel> getEventPayment(String participantId) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/event-payments/participant/$participantId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        return EventPaymentModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '決済情報の取得に失敗しました',
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
  Future<bool> processRefund(String paymentId, String? reason) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/event-payments/$paymentId/refund'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode({
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
  
  // 認証トークン取得
  Future<String> _getAuthToken() async {
    final secureStorage = FlutterSecureStorage();
    return await secureStorage.read(key: 'auth_token') ?? '';
  }
}
```

## 5. ユースケース詳細

### GetEventsUseCase
```dart
class GetEventsUseCase {
  final IEventRepository repository;
  
  GetEventsUseCase({required this.repository});
  
  Future<Either<Failure, List<EventEntity>>> call({
    DateTime? afterDate,
    String? creatorUserId,
    bool includeParticipantInfo = false,
    int limit = 20,
    int offset = 0,
  }) async {
    return repository.getEvents(
      afterDate: afterDate,
      creatorUserId: creatorUserId,
      includeParticipantInfo: includeParticipantInfo,
      limit: limit,
      offset: offset,
    );
  }
}
```

### JoinEventUseCase
```dart
class JoinEventUseCase {
  final IEventRepository eventRepository;
  final IEventParticipantRepository participantRepository;
  
  JoinEventUseCase({
    required this.eventRepository,
    required this.participantRepository,
  });
  
  Future<Either<Failure, EventParticipantEntity>> call({
    required String eventId,
    required String userId,
    required ParticipantStatus status,
  }) async {
    // イベント情報の取得
    final eventResult = await eventRepository.getEventById(eventId);
    
    return eventResult.fold(
      (failure) => Left(failure),
      (event) async {
        // 有料イベントの場合、goingステータスのみ可能
        if (!event.isFreeEvent && status == ParticipantStatus.going) {
          // 支払いが必要なので一時的にstatusをpendingにする
          final result = await participantRepository.joinEvent(
            eventId,
            userId,
            status,
          );
          
          return result;
        } else {
          // 無料イベントまたは「興味あり」の場合はそのまま登録
          return participantRepository.joinEvent(
            eventId,
            userId,
            status,
          );
        }
      },
    );
  }
}
```

### CreateEventPaymentUseCase
```dart
class CreateEventPaymentUseCase {
  final IEventRepository eventRepository;
  final IEventParticipantRepository participantRepository;
  final IEventPaymentRepository paymentRepository;
  
  CreateEventPaymentUseCase({
    required this.eventRepository,
    required this.participantRepository,
    required this.paymentRepository,
  });
  
  Future<Either<Failure, String>> call({
    required String participantId,
    required String eventId,
  }) async {
    // イベント情報の取得
    final eventResult = await eventRepository.getEventById(eventId);
    
    return eventResult.fold(
      (failure) => Left(failure),
      (event) {
        if (event.isFreeEvent) {
          return Left(BusinessLogicFailure('無料イベントのため決済は不要です'));
        }
        
        if (event.fee == null) {
          return Left(BusinessLogicFailure('イベント料金が設定されていません'));
        }
        
        return paymentRepository.createEventPaymentIntent(
          participantId,
          event.fee!,
          event.currency ?? 'JPY',
        );
      },
    );
  }
}
```

## 6. ビューモデル詳細

### EventListViewModel
```dart
class EventListViewModel extends StateNotifier<EventListState> {
  final GetEventsUseCase getEventsUseCase;
  
  EventListViewModel({
    required this.getEventsUseCase,
  }) : super(EventListInitial());
  
  Future<void> loadEvents({
    DateTime? afterDate,
    String? creatorUserId,
    bool isRefresh = false,
  }) async {
    if (isRefresh) {
      state = EventListLoading();
    } else if (state is EventListLoaded) {
      state = EventListLoadingMore((state as EventListLoaded).events);
    } else {
      state = EventListLoading();
    }
    
    final result = await getEventsUseCase(
      afterDate: afterDate,
      creatorUserId: creatorUserId,
      limit: 10,
      offset: isRefresh || !(state is EventListLoadingMore) ? 0 
          : (state as EventListLoadingMore).events.length,
    );
    
    result.fold(
      (failure) => state = EventListError(failure.message),
      (events) {
        if (state is EventListLoadingMore) {
          final existingEvents = (state as EventListLoadingMore).events;
          state = EventListLoaded([...existingEvents, ...events]);
        } else {
          state = EventListLoaded(events);
        }
      },
    );
  }
}

// 状態定義
abstract class EventListState {}

class EventListInitial extends EventListState {}

class EventListLoading extends EventListState {}

class EventListLoadingMore extends EventListState {
  final List<EventEntity> events;
  EventListLoadingMore(this.events);
}

class EventListLoaded extends EventListState {
  final List<EventEntity> events;
  EventListLoaded(this.events);
}

class EventListError extends EventListState {
  final String message;
  EventListError(this.message);
}
```

### EventDetailViewModel
```dart
class EventDetailViewModel extends StateNotifier<EventDetailState> {
  final GetEventByIdUseCase getEventByIdUseCase;
  final GetEventParticipantsUseCase getEventParticipantsUseCase;
  final JoinEventUseCase joinEventUseCase;
  final CancelEventParticipationUseCase cancelEventParticipationUseCase;
  final GetUserEventParticipationUseCase getUserEventParticipationUseCase;
  final CreateEventPaymentUseCase createEventPaymentUseCase;
  
  EventDetailViewModel({
    required this.getEventByIdUseCase,
    required this.getEventParticipantsUseCase,
    required this.joinEventUseCase,
    required this.cancelEventParticipationUseCase,
    required this.getUserEventParticipationUseCase,
    required this.createEventPaymentUseCase,
  }) : super(EventDetailInitial());
  
  Future<void> loadEvent(String eventId) async {
    state = EventDetailLoading();
    
    final result = await getEventByIdUseCase(
      eventId,
      includeParticipantInfo: true,
    );
    
    result.fold(
      (failure) => state = EventDetailError(failure.message),
      (event) async {
        // 参加者情報も取得
        final participantsResult = await getEventParticipantsUseCase(
          eventId,
          status: ParticipantStatus.going,
          limit: 20,
        );
        
        participantsResult.fold(
          (failure) => state = EventDetailError(failure.message),
          (participants) => state = EventDetailLoaded(event, participants),
        );
      },
    );
  }
  
  Future<void> checkUserParticipation(
    String eventId,
    String userId,
  ) async {
    if (state is EventDetailLoaded) {
      final currentState = state as EventDetailLoaded;
      
      final result = await getUserEventParticipationUseCase(eventId, userId);
      
      result.fold(
        (failure) => state = EventDetailError(failure.message),
        (participation) {
          state = EventDetailLoaded(
            currentState.event,
            currentState.participants,
            userParticipation: participation,
          );
        },
      );
    }
  }
  
  Future<void> joinEvent(
    String eventId,
    String userId,
    ParticipantStatus status,
  ) async {
    if (state is EventDetailLoaded) {
      state = EventDetailProcessing();
      
      final result = await joinEventUseCase(
        eventId: eventId,
        userId: userId,
        status: status,
      );
      
      result.fold(
        (failure) => state = EventDetailError(failure.message),
        (participation) async {
          // イベント情報と参加者情報を再取得
          await loadEvent(eventId);
          
          // 参加登録が成功した場合、有料イベントで「参加」選択なら決済へ
          final event = (state as EventDetailLoaded).event;
          if (!event.isFreeEvent && status == ParticipantStatus.going) {
            // 決済処理開始
            final paymentResult = await createEventPaymentUseCase(
              participantId: participation.id,
              eventId: eventId,
            );
            
            paymentResult.fold(
              (failure) => state = EventDetailError(failure.message),
              (clientSecret) {
                final currentState = state as EventDetailLoaded;
                state = EventDetailPaymentReady(
                  currentState.event,
                  currentState.participants,
                  participation,
                  clientSecret,
                  userParticipation: participation,
                );
              },
            );
          }
        },
      );
    }
  }
  
  Future<void> cancelParticipation(String participantId) async {
    if (state is EventDetailLoaded) {
      final currentState = state as EventDetailLoaded;
      final eventId = currentState.event.id;
      
      state = EventDetailProcessing();
      
      final result = await cancelEventParticipationUseCase(participantId);
      
      result.fold(
        (failure) => state = EventDetailError(failure.message),
        (success) {
          if (success) {
            loadEvent(eventId);
          } else {
            state = EventDetailError('参加キャンセルに失敗しました');
          }
        },
      );
    }
  }
}

// 状態定義
abstract class EventDetailState {}

class EventDetailInitial extends EventDetailState {}

class EventDetailLoading extends EventDetailState {}

class EventDetailLoaded extends EventDetailState {
  final EventEntity event;
  final List<EventParticipantEntity> participants;
  final EventParticipantEntity? userParticipation;
  
  EventDetailLoaded(
    this.event, 
    this.participants, {
    this.userParticipation,
  });
}

class EventDetailProcessing extends EventDetailState {}

class EventDetailPaymentReady extends EventDetailState {
  final EventEntity event;
  final List<EventParticipantEntity> participants;
  final EventParticipantEntity participation;
  final String paymentClientSecret;
  final EventParticipantEntity? userParticipation;
  
  EventDetailPaymentReady(
    this.event,
    this.participants,
    this.participation,
    this.paymentClientSecret, {
    this.userParticipation,
  });
}

class EventDetailError extends EventDetailState {
  final String message;
  EventDetailError(this.message);
}
```

## 7. 依存性注入設定

```dart
// 依存性注入の設定
final eventDomainModule = [
  // データソース
  Provider<EventRemoteDataSource>(
    (ref) => EventRemoteDataSourceImpl(
      client: ref.watch(httpClientProvider),
    ),
  ),
  Provider<EventLocalDataSource>(
    (ref) => EventLocalDataSourceImpl(
      box: ref.watch(eventBoxProvider),
    ),
  ),
  Provider<EventParticipantRemoteDataSource>(
    (ref) => EventParticipantRemoteDataSourceImpl(
      client: ref.watch(httpClientProvider),
    ),
  ),
  Provider<EventParticipantLocalDataSource>(
    (ref) => EventParticipantLocalDataSourceImpl(
      box: ref.watch(eventParticipantBoxProvider),
    ),
  ),
  Provider<EventPaymentRemoteDataSource>(
    (ref) => EventPaymentRemoteDataSourceImpl(
      client: ref.watch(httpClientProvider),
    ),
  ),
  
  // リポジトリ
  Provider<IEventRepository>(
    (ref) => EventRepository(
      remoteDataSource: ref.watch(eventRemoteDataSourceProvider),
      localDataSource: ref.watch(eventLocalDataSourceProvider),
    ),
  ),
  Provider<IEventParticipantRepository>(
    (ref) => EventParticipantRepository(
      remoteDataSource: ref.watch(eventParticipantRemoteDataSourceProvider),
      localDataSource: ref.watch(eventParticipantLocalDataSourceProvider),
    ),
  ),
  Provider<IEventPaymentRepository>(
    (ref) => EventPaymentRepository(
      remoteDataSource: ref.watch(eventPaymentRemoteDataSourceProvider),
    ),
  ),
  
  // ユースケース
  Provider<GetEventsUseCase>(
    (ref) => GetEventsUseCase(
      repository: ref.watch(eventRepositoryProvider),
    ),
  ),
  Provider<GetEventByIdUseCase>(
    (ref) => GetEventByIdUseCase(
      repository: ref.watch(eventRepositoryProvider),
    ),
  ),
  Provider<CreateEventUseCase>(
    (ref) => CreateEventUseCase(
      repository: ref.watch(eventRepositoryProvider),
    ),
  ),
  Provider<JoinEventUseCase>(
    (ref) => JoinEventUseCase(
      eventRepository: ref.watch(eventRepositoryProvider),
      participantRepository: ref.watch(eventParticipantRepositoryProvider),
    ),
  ),
  Provider<GetEventParticipantsUseCase>(
    (ref) => GetEventParticipantsUseCase(
      repository: ref.watch(eventParticipantRepositoryProvider),
    ),
  ),
  Provider<CreateEventPaymentUseCase>(
    (ref) => CreateEventPaymentUseCase(
      eventRepository: ref.watch(eventRepositoryProvider),
      participantRepository: ref.watch(eventParticipantRepositoryProvider),
      paymentRepository: ref.watch(eventPaymentRepositoryProvider),
    ),
  ),
  
  // ビューモデル
  StateNotifierProvider<EventListViewModel, EventListState>(
    (ref) => EventListViewModel(
      getEventsUseCase: ref.watch(getEventsUseCaseProvider),
    ),
  ),
  StateNotifierProvider<EventDetailViewModel, EventDetailState>(
    (ref) => EventDetailViewModel(
      getEventByIdUseCase: ref.watch(getEventByIdUseCaseProvider),
      getEventParticipantsUseCase: ref.watch(getEventParticipantsUseCaseProvider),
      joinEventUseCase: ref.watch(joinEventUseCaseProvider),
      cancelEventParticipationUseCase: ref.watch(cancelEventParticipationUseCaseProvider),
      getUserEventParticipationUseCase: ref.watch(getUserEventParticipationUseCaseProvider),
      createEventPaymentUseCase: ref.watch(createEventPaymentUseCaseProvider),
    ),
  ),
];
```

## 8. セキュリティ考慮事項

1. **決済情報の安全な取り扱い**
   - Stripe SDKを使用し、カード情報はクライアント側で安全に取り扱う
   - カード情報は直接サーバーには送信せず、StripeのTokenization機能を使用
   - 決済情報はPCI DSS準拠の方法で処理
   - 決済関連データの暗号化保存

2. **イベント情報のアクセス制御**
   - イベント作成者と共同ホストのみがイベント情報を編集可能
   - 参加登録時のユーザー認証の厳格な実装
   - 参加者リスト表示時のプライバシー設定
   - 個人情報の適切な取り扱いと表示制限

3. **返金処理の制御**
   - 返金ポリシーに基づいた適切な権限チェック
   - 返金処理ログの監査履歴
   - 返金リクエストの検証とフロー制御
   - 不正な返金要求の防止メカニズム

4. **位置情報の取り扱い**
   - イベント場所情報の公開レベル制御
   - 位置情報共有の明示的な同意取得
   - センシティブな位置情報の適切な匿名化
   - 位置情報表示の精度制御（必要に応じて）

## 9. パフォーマンス最適化

1. **イベント一覧の表示最適化**
   - 画像のレイジーロード
   - ページングによるデータロードの最適化
   - 画像サイズとキャッシュの最適化
   - 不要なデータフェッチの最小化

2. **参加者リストの最適化**
   - 大規模イベントでの参加者リストの仮想スクロール実装
   - 参加者データの段階的ロード
   - アバター画像の効率的なキャッシュ
   - 参加者検索のインデックス最適化

3. **決済処理の最適化**
   - バックグラウンドでの決済処理
   - 決済処理中のユーザーフィードバック表示
   - タイムアウト処理の適切な実装
   - 非同期決済ステータス更新

4. **オフラインサポート**
   - イベント情報のローカルキャッシュ
   - オフライン時の限定的な閲覧機能
   - 接続回復時の自動同期
   - キャッシュの適切な更新戦略

## 10. エラーハンドリング戦略

```dart
// 汎用エラーハンドラー
void handleEventError(BuildContext context, String message) {
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
  
  // イベント参加エラー
  if (message.contains('参加')) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('イベント参加登録に失敗しました。後でもう一度お試しください'),
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
  
  // イベント作成エラー
  if (message.contains('作成')) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('イベント作成に失敗しました。入力内容を確認してください'),
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
- イベント一覧表示からイベント詳細へのフロー
- イベント参加登録から決済までのフロー
- イベント作成と管理のフロー
- イベント参加者管理のフロー

### UIテスト
- イベント一覧の表示とスクロール
- イベント詳細ページでの参加登録機能
- 決済フォームの入力と送信
- エラー状態の表示と回復

## 12. FAQ的な実装上の注意点

1. **イベント参加制限について**
   - イベント定員の設定と管理方法
   - 同時参加登録のコンフリクト解決
   - キャンセル待ちリストの実装方法
   - 参加登録締め切り処理

2. **決済処理について**
   - Stripeの推奨フローに従い実装
   - クライアントサイドでのカード情報収集と検証
   - サーバーサイドでの決済実行と確認
   - Webhookを使用した非同期決済イベント処理

3. **返金ポリシーの実装**
   - 返金可能期間の設定（イベント主催者が設定）
   - 返金手数料の計算方法
   - 部分返金と全額返金の処理の違い
   - 自動返金と手動承認の場合分け

4. **イベントタイムラインについて**
   - イベントタグ付けされた投稿の表示順
   - タイムラインの更新頻度
   - フィード表示と統合方法
   - ユーザー権限による表示制限