# タイムラインドメイン詳細設計

## 1. アーキテクチャ概要

タイムラインドメインは、クリーンアーキテクチャに基づき以下の層に分けて実装します。このドメインは投稿ドメインに依存しています。

### プレゼンテーション層
- **画面（Screens）**
  - TimelineScreen
  - WatchTimelineScreen
  - TimelineFilterScreen

- **ビューモデル（ViewModels）**
  - TimelineViewModel
  - WatchTimelineViewModel
  - TimelineFilterViewModel

- **ウィジェット（Widgets）**
  - TimelinePostCard
  - TimelineSwitcher
  - TimelineHeader
  - TimelineFooter
  - TimelineLoadingIndicator
  - WatchPlayerControls

### ドメイン層
- **エンティティ（Entities）**
  - TimelineEntity
  - TimelinePostEntity
  - TimelineFilterEntity

- **リポジトリインターフェース（Repository Interfaces）**
  - ITimelineRepository
  - ITimelineFilterRepository
  - ITimelineViewHistoryRepository
  - IRecommendationRepository

- **ユースケース（Use Cases）**
  - GetTimelineUseCase
  - GetWatchTimelineUseCase
  - UpdateTimelineFilterUseCase
  - RefreshTimelineUseCase
  - GetMoreTimelinePostsUseCase
  - RecordViewHistoryUseCase
  - GetRecommendationsUseCase

### データ層
- **リポジトリ実装（Repository Implementations）**
  - TimelineRepository
  - TimelineFilterRepository
  - TimelineViewHistoryRepository
  - RecommendationRepository

- **データソース（Data Sources）**
  - TimelineRemoteDataSource
  - TimelineLocalDataSource
  - TimelineFilterLocalDataSource
  - TimelineViewHistoryLocalDataSource
  - RecommendationRemoteDataSource

- **モデル（Models）**
  - TimelineModel
  - TimelinePostModel
  - TimelineFilterModel
  - TimelineViewHistoryModel
  - RecommendationModel

## 2. データモデル詳細

### TimelineModel
```dart
class TimelineModel extends TimelineEntity {
  final TimelineType type;
  final List<TimelinePostModel> posts;
  final String? nextCursor;
  final DateTime refreshedAt;

  TimelineModel({
    required this.type,
    required this.posts,
    this.nextCursor,
    required this.refreshedAt,
  });

  factory TimelineModel.fromJson(Map<String, dynamic> json) {
    return TimelineModel(
      type: TimelineType.values.byName(json['type']),
      posts: (json['posts'] as List)
          .map((post) => TimelinePostModel.fromJson(post))
          .toList(),
      nextCursor: json['next_cursor'],
      refreshedAt: DateTime.parse(json['refreshed_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type.name,
      'posts': posts.map((post) => post.toJson()).toList(),
      'next_cursor': nextCursor,
      'refreshed_at': refreshedAt.toIso8601String(),
    };
  }
}

enum TimelineType { family, watch }
```

### TimelinePostModel
```dart
class TimelinePostModel extends TimelinePostEntity {
  final String id;
  final String userId;
  final UserModel user;
  final ContentType contentType;
  final String? textContent;
  final String? mediaUrl;
  final String? thumbnailUrl;
  final DateTime createdAt;
  final int likesCount;
  final int commentsCount;
  final int highlightsCount;
  final bool isLiked;
  final bool isHighlighted;

  TimelinePostModel({
    required this.id,
    required this.userId,
    required this.user,
    required this.contentType,
    this.textContent,
    this.mediaUrl,
    this.thumbnailUrl,
    required this.createdAt,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.highlightsCount = 0,
    this.isLiked = false,
    this.isHighlighted = false,
  });

  factory TimelinePostModel.fromJson(Map<String, dynamic> json) {
    return TimelinePostModel(
      id: json['id'],
      userId: json['user_id'],
      user: UserModel.fromJson(json['user']),
      contentType: ContentType.values.byName(json['content_type']),
      textContent: json['text_content'],
      mediaUrl: json['media_url'],
      thumbnailUrl: json['thumbnail_url'],
      createdAt: DateTime.parse(json['created_at']),
      likesCount: json['likes_count'] ?? 0,
      commentsCount: json['comments_count'] ?? 0,
      highlightsCount: json['highlights_count'] ?? 0,
      isLiked: json['is_liked'] ?? false,
      isHighlighted: json['is_highlighted'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'user': user.toJson(),
      'content_type': contentType.name,
      'text_content': textContent,
      'media_url': mediaUrl,
      'thumbnail_url': thumbnailUrl,
      'created_at': createdAt.toIso8601String(),
      'likes_count': likesCount,
      'comments_count': commentsCount,
      'highlights_count': highlightsCount,
      'is_liked': isLiked,
      'is_highlighted': isHighlighted,
    };
  }
}
```

### TimelineFilterModel
```dart
class TimelineFilterModel extends TimelineFilterEntity {
  final List<String>? userIds;
  final List<ContentType>? contentTypes;
  final DateTime? startDate;
  final DateTime? endDate;
  final bool showLikedOnly;
  final bool showHighlightedOnly;

  TimelineFilterModel({
    this.userIds,
    this.contentTypes,
    this.startDate,
    this.endDate,
    this.showLikedOnly = false,
    this.showHighlightedOnly = false,
  });

  factory TimelineFilterModel.fromJson(Map<String, dynamic> json) {
    return TimelineFilterModel(
      userIds: json['user_ids'] != null
          ? List<String>.from(json['user_ids'])
          : null,
      contentTypes: json['content_types'] != null
          ? (json['content_types'] as List)
              .map((type) => ContentType.values.byName(type))
              .toList()
          : null,
      startDate: json['start_date'] != null
          ? DateTime.parse(json['start_date'])
          : null,
      endDate:
          json['end_date'] != null ? DateTime.parse(json['end_date']) : null,
      showLikedOnly: json['show_liked_only'] ?? false,
      showHighlightedOnly: json['show_highlighted_only'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_ids': userIds,
      'content_types': contentTypes?.map((type) => type.name).toList(),
      'start_date': startDate?.toIso8601String(),
      'end_date': endDate?.toIso8601String(),
      'show_liked_only': showLikedOnly,
      'show_highlighted_only': showHighlightedOnly,
    };
  }

  TimelineFilterModel copyWith({
    List<String>? userIds,
    List<ContentType>? contentTypes,
    DateTime? startDate,
    DateTime? endDate,
    bool? showLikedOnly,
    bool? showHighlightedOnly,
  }) {
    return TimelineFilterModel(
      userIds: userIds ?? this.userIds,
      contentTypes: contentTypes ?? this.contentTypes,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      showLikedOnly: showLikedOnly ?? this.showLikedOnly,
      showHighlightedOnly: showHighlightedOnly ?? this.showHighlightedOnly,
    );
  }
}
```

### TimelineViewHistoryModel
```dart
class TimelineViewHistoryModel extends TimelineViewHistoryEntity {
  final String id;
  final String userId;
  final String postId;
  final DateTime viewedAt;
  final int viewDuration;
  final bool completed;
  final Map<String, dynamic>? deviceInfo;

  TimelineViewHistoryModel({
    required this.id,
    required this.userId,
    required this.postId,
    required this.viewedAt,
    required this.viewDuration,
    required this.completed,
    this.deviceInfo,
  });

  factory TimelineViewHistoryModel.fromJson(Map<String, dynamic> json) {
    return TimelineViewHistoryModel(
      id: json['id'],
      userId: json['user_id'],
      postId: json['post_id'],
      viewedAt: DateTime.parse(json['viewed_at']),
      viewDuration: json['view_duration'],
      completed: json['completed'],
      deviceInfo: json['device_info'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'post_id': postId,
      'viewed_at': viewedAt.toIso8601String(),
      'view_duration': viewDuration,
      'completed': completed,
      'device_info': deviceInfo,
    };
  }
}
```

### RecommendationModel
```dart
class RecommendationModel extends RecommendationEntity {
  final String id;
  final String userId;
  final RecommendationType type;
  final String targetId;
  final double score;
  final Map<String, dynamic>? reason;
  final bool isShown;
  final DateTime createdAt;
  final DateTime? expiresAt;

  RecommendationModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.targetId,
    required this.score,
    this.reason,
    required this.isShown,
    required this.createdAt,
    this.expiresAt,
  });

  factory RecommendationModel.fromJson(Map<String, dynamic> json) {
    return RecommendationModel(
      id: json['id'],
      userId: json['user_id'],
      type: RecommendationType.values.byName(json['type']),
      targetId: json['target_id'],
      score: json['score'],
      reason: json['reason'],
      isShown: json['is_shown'],
      createdAt: DateTime.parse(json['created_at']),
      expiresAt: json['expires_at'] != null
          ? DateTime.parse(json['expires_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'type': type.name,
      'target_id': targetId,
      'score': score,
      'reason': reason,
      'is_shown': isShown,
      'created_at': createdAt.toIso8601String(),
      'expires_at': expiresAt?.toIso8601String(),
    };
  }
}

enum RecommendationType { post, event, user }
```

## 3. リポジトリ詳細

### TimelineRepository
```dart
class TimelineRepository implements ITimelineRepository {
  final TimelineRemoteDataSource remoteDataSource;
  final TimelineLocalDataSource localDataSource;
  final IPostForTimelineRepository postRepository; // 投稿ドメインからの依存

  TimelineRepository({
    required this.remoteDataSource,
    required this.localDataSource,
    required this.postRepository,
  });

  @override
  Future<Either<Failure, TimelineEntity>> getTimeline(
    TimelineType type,
    int limit,
    String? cursor,
    TimelineFilterEntity? filter,
  ) async {
    try {
      // オフライン時はローカルキャッシュを優先
      if (await _isOffline()) {
        final cachedTimeline = await localDataSource.getTimeline(type);
        if (cachedTimeline != null) {
          return Right(cachedTimeline);
        }
      }

      // APIからタイムラインを取得
      final timeline = await remoteDataSource.getTimeline(
        type,
        limit,
        cursor,
        filter,
      );

      // 取得したタイムラインをローカルに保存
      await localDataSource.saveTimeline(timeline);

      return Right(timeline);
    } on ServerException catch (e) {
      // オフライン時はローカルキャッシュを確認
      if (e is NetworkException) {
        final cachedTimeline = await localDataSource.getTimeline(type);
        if (cachedTimeline != null) {
          return Right(cachedTimeline);
        }
      }
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, TimelineEntity>> refreshTimeline(
    TimelineType type,
    int limit,
    TimelineFilterEntity? filter,
  ) async {
    try {
      // 常に最新データを取得
      final timeline = await remoteDataSource.getTimeline(
        type,
        limit,
        null, // カーソルはnullでリフレッシュ
        filter,
      );

      // 取得したタイムラインをローカルに保存
      await localDataSource.saveTimeline(timeline);

      return Right(timeline);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, List<TimelinePostEntity>>> getTimelinePostsByIds(
    List<String> postIds
  ) async {
    // 投稿ドメインのリポジトリを使用して詳細情報を取得
    final result = await postRepository.getPostsByIds(postIds);
    
    return result.fold(
      (failure) => Left(failure),
      (posts) {
        // 投稿エンティティをタイムライン投稿エンティティに変換
        final timelinePosts = posts.map((post) => 
          TimelinePostModel.fromPostEntity(post as dynamic)
        ).toList();
        
        return Right(timelinePosts);
      },
    );
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

### TimelineFilterRepository
```dart
class TimelineFilterRepository implements ITimelineFilterRepository {
  final TimelineFilterLocalDataSource localDataSource;

  TimelineFilterRepository({
    required this.localDataSource,
  });

  @override
  Future<Either<Failure, TimelineFilterEntity>> getFilter() async {
    try {
      final filter = await localDataSource.getFilter();
      return Right(filter ?? TimelineFilterModel());
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, TimelineFilterEntity>> updateFilter(
    TimelineFilterEntity filter,
  ) async {
    try {
      await localDataSource.saveFilter(filter as TimelineFilterModel);
      return Right(filter);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }
}
```

### TimelineViewHistoryRepository
```dart
class TimelineViewHistoryRepository implements ITimelineViewHistoryRepository {
  final TimelineViewHistoryLocalDataSource localDataSource;
  final TimelineRemoteDataSource remoteDataSource;

  TimelineViewHistoryRepository({
    required this.localDataSource,
    required this.remoteDataSource,
  });

  @override
  Future<Either<Failure, TimelineViewHistoryEntity>> recordViewHistory(
    TimelineViewHistoryParams params,
  ) async {
    try {
      // ローカルに記録
      final history = TimelineViewHistoryModel(
        id: const Uuid().v4(),
        userId: params.userId,
        postId: params.postId,
        viewedAt: DateTime.now(),
        viewDuration: params.viewDuration,
        completed: params.completed,
        deviceInfo: params.deviceInfo,
      );
      
      await localDataSource.saveViewHistory(history);
      
      // オンライン時は同期も試みる
      if (!await _isOffline()) {
        await remoteDataSource.recordViewHistory(history);
      }
      
      return Right(history);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<TimelineViewHistoryEntity>>> getViewHistory(
    String userId,
    int limit,
    {DateTime? startDate, DateTime? endDate}
  ) async {
    try {
      final history = await localDataSource.getViewHistory(
        userId,
        limit,
        startDate: startDate,
        endDate: endDate,
      );
      return Right(history);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
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

## 4. ユースケース詳細

### GetTimelineUseCase
```dart
class GetTimelineUseCase {
  final ITimelineRepository repository;

  GetTimelineUseCase({required this.repository});

  Future<Either<Failure, TimelineEntity>> call(
    TimelineType type,
    int limit,
    String? cursor,
    TimelineFilterEntity? filter,
  ) async {
    return repository.getTimeline(type, limit, cursor, filter);
  }
}
```

### RefreshTimelineUseCase
```dart
class RefreshTimelineUseCase {
  final ITimelineRepository repository;

  RefreshTimelineUseCase({required this.repository});

  Future<Either<Failure, TimelineEntity>> call(
    TimelineType type,
    int limit,
    TimelineFilterEntity? filter,
  ) async {
    return repository.refreshTimeline(type, limit, filter);
  }
}
```

### UpdateTimelineFilterUseCase
```dart
class UpdateTimelineFilterUseCase {
  final ITimelineFilterRepository repository;

  UpdateTimelineFilterUseCase({required this.repository});

  Future<Either<Failure, TimelineFilterEntity>> call(
    TimelineFilterEntity filter,
  ) async {
    return repository.updateFilter(filter);
  }
}
```

### RecordViewHistoryUseCase
```dart
class RecordViewHistoryUseCase {
  final ITimelineViewHistoryRepository repository;

  RecordViewHistoryUseCase({required this.repository});

  Future<Either<Failure, TimelineViewHistoryEntity>> call(
    TimelineViewHistoryParams params,
  ) async {
    return repository.recordViewHistory(params);
  }
}

class TimelineViewHistoryParams {
  final String userId;
  final String postId;
  final int viewDuration;
  final bool completed;
  final Map<String, dynamic>? deviceInfo;

  TimelineViewHistoryParams({
    required this.userId,
    required this.postId,
    required this.viewDuration,
    required this.completed,
    this.deviceInfo,
  });
}
```

## 5. ビューモデル詳細

### TimelineViewModel
```dart
class TimelineViewModel extends StateNotifier<TimelineState> {
  final GetTimelineUseCase getTimelineUseCase;
  final RefreshTimelineUseCase refreshTimelineUseCase;
  final UpdateTimelineFilterUseCase updateTimelineFilterUseCase;
  final GetPostUseCase getPostUseCase; // 投稿ドメインから依存
  final RecordViewHistoryUseCase recordViewHistoryUseCase;

  TimelineViewModel({
    required this.getTimelineUseCase,
    required this.refreshTimelineUseCase,
    required this.updateTimelineFilterUseCase,
    required this.getPostUseCase,
    required this.recordViewHistoryUseCase,
  }) : super(TimelineInitial());

  // 現在のタイムラインタイプ
  TimelineType _currentType = TimelineType.family;
  // 現在のフィルター
  TimelineFilterEntity _filter = TimelineFilterModel();
  // 投稿取得数制限
  static const int _defaultLimit = 20;

  TimelineType get currentType => _currentType;
  TimelineFilterEntity get filter => _filter;

  // タイムライン取得
  Future<void> getTimeline({
    TimelineType? type,
    bool refresh = false,
    String? cursor,
  }) async {
    if (type != null) {
      _currentType = type;
    }

    if (refresh || cursor == null) {
      state = TimelineLoading();
    } else {
      state = TimelineLoadingMore((state as TimelineLoaded).timeline);
    }

    final result = refresh
        ? await refreshTimelineUseCase(
            _currentType,
            _defaultLimit,
            _filter,
          )
        : await getTimelineUseCase(
            _currentType,
            _defaultLimit,
            cursor,
            _filter,
          );

    result.fold(
      (failure) => state = TimelineError(failure.message),
      (timeline) {
        if (cursor != null && state is TimelineLoadingMore) {
          // 既存のタイムラインに追加
          final currentTimeline = (state as TimelineLoadingMore).timeline;
          final currentPosts = (currentTimeline as TimelineModel).posts;
          final newTimeline = (timeline as TimelineModel);
          
          final updatedTimeline = TimelineModel(
            type: newTimeline.type,
            posts: [...currentPosts, ...newTimeline.posts],
            nextCursor: newTimeline.nextCursor,
            refreshedAt: newTimeline.refreshedAt,
          );
          
          state = TimelineLoaded(updatedTimeline);
        } else {
          // 新しいタイムラインをセット
          state = TimelineLoaded(timeline);
        }
      },
    );
  }

  // タイムラインタイプ切り替え
  Future<void> switchTimelineType(TimelineType type) async {
    if (_currentType != type) {
      _currentType = type;
      await getTimeline(refresh: true);
    }
  }

  // フィルター更新
  Future<void> updateFilter(TimelineFilterEntity filter) async {
    final result = await updateTimelineFilterUseCase(filter);
    
    result.fold(
      (failure) => state = TimelineError(failure.message),
      (updatedFilter) {
        _filter = updatedFilter;
        getTimeline(refresh: true);
      },
    );
  }

  // 投稿閲覧記録
  Future<void> recordPostView(
    String postId,
    int viewDuration,
    bool completed,
  ) async {
    final currentUser = await _getCurrentUser();
    if (currentUser == null) return;
    
    await recordViewHistoryUseCase(
      TimelineViewHistoryParams(
        userId: currentUser.id,
        postId: postId,
        viewDuration: viewDuration,
        completed: completed,
        deviceInfo: {
          'platform': Platform.operatingSystem,
          'version': '1.0.0',
        },
      ),
    );
  }

  // 投稿詳細取得
  Future<Either<Failure, PostEntity>> getPostDetail(String postId) async {
    return getPostUseCase(postId);
  }

  // 次のページ取得
  Future<void> loadMore() async {
    if (state is TimelineLoaded) {
      final timeline = (state as TimelineLoaded).timeline as TimelineModel;
      if (timeline.nextCursor != null) {
        await getTimeline(cursor: timeline.nextCursor);
      }
    }
  }

  // タイムラインリフレッシュ
  Future<void> refresh() async {
    await getTimeline(refresh: true);
  }
  
  // 現在のユーザー取得（認証ドメインからの依存）
  Future<UserEntity?> _getCurrentUser() async {
    // 実装は認証ドメインに依存
    return null; // ダミー実装
  }
}

// 状態定義
abstract class TimelineState {}

class TimelineInitial extends TimelineState {}

class TimelineLoading extends TimelineState {}

class TimelineLoadingMore extends TimelineState {
  final TimelineEntity timeline;
  TimelineLoadingMore(this.timeline);
}

class TimelineLoaded extends TimelineState {
  final TimelineEntity timeline;
  TimelineLoaded(this.timeline);
}

class TimelineError extends TimelineState {
  final String message;
  TimelineError(this.message);
}
```

### WatchTimelineViewModel
```dart
class WatchTimelineViewModel extends StateNotifier<WatchTimelineState> {
  final GetTimelineUseCase getTimelineUseCase;
  final RefreshTimelineUseCase refreshTimelineUseCase;
  final RecordViewHistoryUseCase recordViewHistoryUseCase;

  WatchTimelineViewModel({
    required this.getTimelineUseCase,
    required this.refreshTimelineUseCase,
    required this.recordViewHistoryUseCase,
  }) : super(WatchTimelineInitial());

  // 現在のフィルター
  TimelineFilterEntity _filter = TimelineFilterModel();
  // 投稿取得数制限
  static const int _defaultLimit = 10;
  // 現在再生中の投稿インデックス
  int _currentIndex = 0;

  int get currentIndex => _currentIndex;
  TimelineFilterEntity get filter => _filter;

  // ウォッチタイムライン取得
  Future<void> getWatchTimeline({
    bool refresh = false,
    String? cursor,
  }) async {
    if (refresh || cursor == null) {
      state = WatchTimelineLoading();
    } else {
      state = WatchTimelineLoadingMore((state as WatchTimelineLoaded).timeline);
    }

    final result = refresh
        ? await refreshTimelineUseCase(
            TimelineType.watch,
            _defaultLimit,
            _filter,
          )
        : await getTimelineUseCase(
            TimelineType.watch,
            _defaultLimit,
            cursor,
            _filter,
          );

    result.fold(
      (failure) => state = WatchTimelineError(failure.message),
      (timeline) {
        if (cursor != null && state is WatchTimelineLoadingMore) {
          // 既存のタイムラインに追加
          final currentTimeline = (state as WatchTimelineLoadingMore).timeline;
          final currentPosts = (currentTimeline as TimelineModel).posts;
          final newTimeline = (timeline as TimelineModel);
          
          final updatedTimeline = TimelineModel(
            type: newTimeline.type,
            posts: [...currentPosts, ...newTimeline.posts],
            nextCursor: newTimeline.nextCursor,
            refreshedAt: newTimeline.refreshedAt,
          );
          
          state = WatchTimelineLoaded(updatedTimeline);
        } else {
          // 新しいタイムラインをセット
          _currentIndex = 0; // インデックスをリセット
          state = WatchTimelineLoaded(timeline);
        }
      },
    );
  }

  // 現在の投稿の閲覧記録
  Future<void> recordCurrentPostView(int viewDuration, bool completed) async {
    if (state is WatchTimelineLoaded) {
      final timeline = (state as WatchTimelineLoaded).timeline as TimelineModel;
      if (timeline.posts.isNotEmpty && _currentIndex < timeline.posts.length) {
        final currentPost = timeline.posts[_currentIndex];
        final currentUser = await _getCurrentUser();
        if (currentUser == null) return;
        
        await recordViewHistoryUseCase(
          TimelineViewHistoryParams(
            userId: currentUser.id,
            postId: currentPost.id,
            viewDuration: viewDuration,
            completed: completed,
            deviceInfo: {
              'platform': Platform.operatingSystem,
              'version': '1.0.0',
            },
          ),
        );
      }
    }
  }

  // 次の投稿に移動
  Future<void> nextPost() async {
    if (state is WatchTimelineLoaded) {
      final timeline = (state as WatchTimelineLoaded).timeline as TimelineModel;
      
      if (_currentIndex < timeline.posts.length - 1) {
        // まだ表示する投稿がある場合
        _currentIndex++;
        state = WatchTimelineLoaded(timeline);
      } else {
        // 次のページがある場合は読み込む
        if (timeline.nextCursor != null) {
          await getWatchTimeline(cursor: timeline.nextCursor);
        }
      }
    }
  }

  // 前の投稿に移動
  void previousPost() {
    if (state is WatchTimelineLoaded) {
      final timeline = (state as WatchTimelineLoaded).timeline;
      
      if (_currentIndex > 0) {
        _currentIndex--;
        state = WatchTimelineLoaded(timeline);
      }
    }
  }

  // タイムラインリフレッシュ
  Future<void> refresh() async {
    await getWatchTimeline(refresh: true);
  }

  // フィルター更新
  void updateFilter(TimelineFilterEntity filter) {
    _filter = filter;
    getWatchTimeline(refresh: true);
  }
  
  // 現在のユーザー取得（認証ドメインからの依存）
  Future<UserEntity?> _getCurrentUser() async {
    // 実装は認証ドメインに依存
    return null; // ダミー実装
  }
}

// 状態定義
abstract class WatchTimelineState {}

class WatchTimelineInitial extends WatchTimelineState {}

class WatchTimelineLoading extends WatchTimelineState {}

class WatchTimelineLoadingMore extends WatchTimelineState {
  final TimelineEntity timeline;
  WatchTimelineLoadingMore(this.timeline);
}

class WatchTimelineLoaded extends WatchTimelineState {
  final TimelineEntity timeline;
  WatchTimelineLoaded(this.timeline);
}

class WatchTimelineError extends WatchTimelineState {
  final String message;
  WatchTimelineError(this.message);
}
```

## 6. 依存性注入設定

```dart
// 依存性注入の設定
final timelineDomainModule = [
  // 投稿ドメインからの依存
  Provider<IPostForTimelineRepository>(
    (ref) => ref.watch(postForTimelineRepositoryProvider),
  ),
  
  // データソース
  Provider<TimelineRemoteDataSource>(
    (ref) => TimelineRemoteDataSourceImpl(
      client: ref.watch(httpClientProvider),
    ),
  ),
  Provider<TimelineLocalDataSource>(
    (ref) => TimelineLocalDataSourceImpl(
      timelineBox: ref.watch(timelineBoxProvider),
    ),
  ),
  Provider<TimelineFilterLocalDataSource>(
    (ref) => TimelineFilterLocalDataSourceImpl(
      filterBox: ref.watch(filterBoxProvider),
    ),
  ),
  Provider<TimelineViewHistoryLocalDataSource>(
    (ref) => TimelineViewHistoryLocalDataSourceImpl(
      historyBox: ref.watch(historyBoxProvider),
    ),
  ),
  Provider<RecommendationRemoteDataSource>(
    (ref) => RecommendationRemoteDataSourceImpl(
      client: ref.watch(httpClientProvider),
    ),
  ),

  // リポジトリ
  Provider<ITimelineRepository>(
    (ref) => TimelineRepository(
      remoteDataSource: ref.watch(timelineRemoteDataSourceProvider),
      localDataSource: ref.watch(timelineLocalDataSourceProvider),
      postRepository: ref.watch(postForTimelineRepositoryProvider),
    ),
  ),
  Provider<ITimelineFilterRepository>(
    (ref) => TimelineFilterRepository(
      localDataSource: ref.watch(timelineFilterLocalDataSourceProvider),
    ),
  ),
  Provider<ITimelineViewHistoryRepository>(
    (ref) => TimelineViewHistoryRepository(
      localDataSource: ref.watch(timelineViewHistoryLocalDataSourceProvider),
      remoteDataSource: ref.watch(timelineRemoteDataSourceProvider),
    ),
  ),
  Provider<IRecommendationRepository>(
    (ref) => RecommendationRepository(
      remoteDataSource: ref.watch(recommendationRemoteDataSourceProvider),
    ),
  ),

  // ユースケース
  Provider<GetTimelineUseCase>(
    (ref) => GetTimelineUseCase(
      repository: ref.watch(timelineRepositoryProvider),
    ),
  ),
  Provider<RefreshTimelineUseCase>(
    (ref) => RefreshTimelineUseCase(
      repository: ref.watch(timelineRepositoryProvider),
    ),
  ),
  Provider<UpdateTimelineFilterUseCase>(
    (ref) => UpdateTimelineFilterUseCase(
      repository: ref.watch(timelineFilterRepositoryProvider),
    ),
  ),
  Provider<RecordViewHistoryUseCase>(
    (ref) => RecordViewHistoryUseCase(
      repository: ref.watch(timelineViewHistoryRepositoryProvider),
    ),
  ),
  Provider<GetRecommendationsUseCase>(
    (ref) => GetRecommendationsUseCase(
      repository: ref.watch(recommendationRepositoryProvider),
    ),
  ),

  // ビューモデル
  StateNotifierProvider<TimelineViewModel, TimelineState>(
    (ref) => TimelineViewModel(
      getTimelineUseCase: ref.watch(getTimelineUseCaseProvider),
      refreshTimelineUseCase: ref.watch(refreshTimelineUseCaseProvider),
      updateTimelineFilterUseCase: ref.watch(updateTimelineFilterUseCaseProvider),
      getPostUseCase: ref.watch(getPostUseCaseProvider), // 投稿ドメインからの依存
      recordViewHistoryUseCase: ref.watch(recordViewHistoryUseCaseProvider),
    ),
  ),
  StateNotifierProvider<WatchTimelineViewModel, WatchTimelineState>(
    (ref) => WatchTimelineViewModel(
      getTimelineUseCase: ref.watch(getTimelineUseCaseProvider),
      refreshTimelineUseCase: ref.watch(refreshTimelineUseCaseProvider),
      recordViewHistoryUseCase: ref.watch(recordViewHistoryUseCaseProvider),
    ),
  ),
  StateNotifierProvider<TimelineFilterViewModel, TimelineFilterState>(
    (ref) => TimelineFilterViewModel(
      updateTimelineFilterUseCase: ref.watch(updateTimelineFilterUseCaseProvider),
    ),
  ),
];
```

## 7. 投稿ドメインとの連携

タイムラインドメインは投稿ドメインに依存しています。以下のインターフェースを通じて投稿ドメインと連携します。

```dart
/// 投稿ドメインから提供されるインターフェース
abstract class IPostForTimelineRepository {
  /// 投稿IDリストから投稿詳細を取得
  Future<Either<Failure, List<PostEntity>>> getPostsByIds(List<String> postIds);
  
  /// ユーザーIDリストに基づく投稿取得
  Future<Either<Failure, PaginatedPosts>> getPostsByUserIds(
    List<String> userIds,
    int limit,
    String? cursor,
  );
  
  /// ハイライトされた投稿の取得
  Future<Either<Failure, PaginatedPosts>> getHighlightedPosts(
    int limit,
    String? cursor,
  );
  
  /// 人気の投稿の取得
  Future<Either<Failure, PaginatedPosts>> getPopularPosts(
    int limit,
    String? cursor,
  );
}

/// タイムライン投稿モデルへの変換拡張メソッド
extension TimelinePostModelExtension on TimelinePostModel {
  /// 投稿エンティティからタイムライン投稿モデルを作成
  static TimelinePostModel fromPostEntity(PostEntity post) {
    return TimelinePostModel(
      id: post.id,
      userId: post.userId,
      user: post.user,
      contentType: post.contentType,
      textContent: post.textContent,
      mediaUrl: post.mediaUrl,
      thumbnailUrl: post.thumbnailUrl,
      createdAt: post.createdAt,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      highlightsCount: post.highlightsCount,
      isLiked: post.isLiked,
      isHighlighted: post.isHighlighted,
    );
  }
}
```

## 8. セキュリティ考慮事項

1. **アクセス制御**
   - タイムラインはユーザー固有のデータであり、認証済みユーザーのみアクセス可能
   - 非公開投稿は権限のあるユーザーのみタイムラインに表示
   - ブロック設定の厳密な適用

2. **データ保護**
   - 閲覧履歴などのプライバシーデータの適切な保護
   - ローカルデータの暗号化保存
   - データの最小限の収集（必要なデータのみ保存）

3. **プライバシー配慮**
   - ユーザーがタイムライン履歴を削除できる機能
   - フィルタリング設定のプライバシー対応
   - 閲覧履歴の適切な保持期間設定

## 9. パフォーマンス最適化

1. **タイムライン表示の最適化**
   - リサイクルウィジェットを使ったリスト表示
   - 画像のレイジーロード実装
   - 動画サムネイルの事前読み込み

2. **キャッシュ戦略**
   - タイムラインデータのローカルキャッシュ
   - キャッシュの適切な有効期限設定
   - バックグラウンドでのデータプリフェッチ

3. **ネットワーク通信の最適化**
   - 差分データの取得によるトラフィック削減
   - 圧縮通信の活用
   - リクエスト数の最少化（バッチ処理）

4. **UX向上のための最適化**
   - スケルトンローディング表示
   - プログレッシブ画像読み込み
   - スクロール位置の記憶と復元

## 10. エラーハンドリング戦略

```dart
// エラーハンドリング例
void handleTimelineError(BuildContext context, TimelineError error) {
  // オフラインエラーの場合
  if (error.message.contains('ネットワーク') || error.message.contains('接続')) {
    showOfflineErrorDialog(context, error.message);
    return;
  }
  
  // サーバーエラーの場合
  if (error.message.contains('サーバー')) {
    showServerErrorDialog(context, error.message);
    return;
  }
  
  // タイムライン生成エラーの場合
  if (error.message.contains('タイムライン生成')) {
    showTimelineGenerationErrorDialog(context, error.message);
    return;
  }
  
  // その他のエラー
  showGeneralErrorDialog(context, error.message);
}

// オフライン時のフォールバック対応
Widget buildTimelineContent(TimelineState state) {
  if (state is TimelineLoading) {
    return TimelineLoadingIndicator();
  } else if (state is TimelineLoaded) {
    return TimelineContent(timeline: state.timeline);
  } else if (state is TimelineError) {
    // オフラインエラーの場合はキャッシュから表示を試みる
    if (state.message.contains('ネットワーク')) {
      return CachedTimelineContent(
        fallbackMessage: 'オフラインモードで表示中'
      );
    }
    return TimelineErrorView(
      error: state.message,
      onRetry: () => retryTimelineLoad(),
    );
  }
  return const SizedBox();
}
```

## 11. テスト戦略

### 単体テスト
- ビューモデルのロジックテスト
- リポジトリのローカル/リモートデータ取得ロジックテスト
- データモデルのシリアライズ/デシリアライズテスト

### 統合テスト
- タイムライン取得から表示までのフロー
- オフライン時のフォールバックロジック
- フィルタリングとソートのテスト
- 投稿ドメインからの依存インターフェースのモック

### UIテスト
- タイムライン表示の正確性
- タイムラインタイプ切替のUI操作
- 無限スクロールの動作検証
- エラー表示とリカバリー機能

## 12. ドメイン間の連携における考慮事項

1. **クリーンな依存性**
   - タイムラインドメインは投稿ドメインに依存するが、逆の依存性はなし
   - 依存はインターフェースを通じて行い、実装の詳細には依存しない
   - ```dart
     // PostForTimelineRepository の実装例
     class PostForTimelineRepository implements IPostForTimelineRepository {
       final IPostRepository postRepository;
       
       PostForTimelineRepository({required this.postRepository});
       
       @override
       Future<Either<Failure, List<PostEntity>>> getPostsByIds(List<String> postIds) {
         return postRepository.getPostsByIds(postIds);
       }
       
       // 他のインターフェースメソッド実装...
     }
     ```

2. **独立したデプロイ可能性**
   - 投稿ドメインの変更がタイムラインドメインに影響を与えないようインターフェースを安定させる
   - インターフェースの変更は後方互換性を確保
   - バージョニングを利用した段階的な移行戦略
     ```dart
     // 後方互換性のあるインターフェース拡張例
     abstract class IPostForTimelineRepositoryV2 extends IPostForTimelineRepository {
       // 既存メソッドはそのまま継承
       
       // 新しい機能を追加
       Future<Either<Failure, List<PostEntity>>> getPostsByTag(String tag, int limit, String? cursor);
     }
     ```

3. **効率的なデータ共有**
   - 必要最小限のデータのみを共有
   - 不必要な重複を避ける
   - キャッシュ戦略の調整（両ドメイン間でのキャッシュ整合性）
   - 共有データのメモリ効率を考慮した設計
     ```dart
     // 投稿データの効率的な共有例
     class SharedPostCache {
       static final Map<String, PostEntity> _cache = {};
       
       static Future<PostEntity?> getPost(String id) async {
         return _cache[id];
       }
       
       static void cachePost(PostEntity post) {
         _cache[post.id] = post;
         
         // キャッシュサイズ制限と有効期限の管理
         _enforceMaxCacheSize();
       }
       
       static void _enforceMaxCacheSize() {
         if (_cache.length > 1000) {
           // LRU (Least Recently Used) 戦略でキャッシュをクリーンアップ
           // ...実装省略...
         }
       }
     }
     ```

## 13. メモリ管理と最適化

1. **イメージキャッシング**
   ```dart
   // CachedNetworkImage パッケージを活用した画像最適化
   Widget buildPostImage(String? imageUrl) {
     if (imageUrl == null) return const SizedBox();
     
     return CachedNetworkImage(
       imageUrl: imageUrl,
       placeholder: (context, url) => TimelineImagePlaceholder(),
       errorWidget: (context, url, error) => TimelineImageErrorWidget(),
       fadeInDuration: const Duration(milliseconds: 300),
       fit: BoxFit.cover,
       memCacheWidth: 800, // メモリキャッシュサイズの最適化
       memCacheHeight: 600,
     );
   }
   ```

2. **ページネーションの効率的実装**
   ```dart
   // より効率的なページネーション実装
   class OptimizedTimelineController {
     // スクロール位置監視
     final ScrollController scrollController = ScrollController();
     // データ取得中フラグ
     bool _isLoading = false;
     // データ枯渇フラグ
     bool _hasReachedEnd = false;
     
     void initialize(TimelineViewModel viewModel) {
       scrollController.addListener(() {
         // スクロールが下端に近づいたら次のページをロード
         if (scrollController.position.pixels > 
             scrollController.position.maxScrollExtent - 500) {
           _loadMoreIfNeeded(viewModel);
         }
       });
     }
     
     Future<void> _loadMoreIfNeeded(TimelineViewModel viewModel) async {
       if (!_isLoading && !_hasReachedEnd) {
         _isLoading = true;
         await viewModel.loadMore();
         _isLoading = false;
         
         // データが取得されなかった場合は終端に達したとみなす
         if (viewModel.state is TimelineLoaded) {
           final timeline = (viewModel.state as TimelineLoaded).timeline as TimelineModel;
           if (timeline.nextCursor == null) {
             _hasReachedEnd = true;
           }
         }
       }
     }
     
     void dispose() {
       scrollController.dispose();
     }
   }
   ```

3. **投稿リスト表示の最適化**
   ```dart
   Widget buildTimelineList(List<TimelinePostModel> posts) {
     return ListView.builder(
       // キーによるウィジェットの効率的な再利用
       itemBuilder: (context, index) {
         final post = posts[index];
         return TimelinePostCard(
           key: ValueKey('post_${post.id}'),
           post: post,
           // コールバックをキャッシュして再構築を防止
           onLikePressed: _cachedLikeCallbacks[post.id] ?? 
             (_cachedLikeCallbacks[post.id] = () => _onLikePressed(post.id)),
         );
       },
       itemCount: posts.length,
       // ビューポート外のアイテム破棄により使用メモリを削減
       cacheExtent: 1000, // 画面外でキャッシュする高さを制限
     );
   }
   
   // コールバックキャッシュ
   final Map<String, VoidCallback> _cachedLikeCallbacks = {};
   ```

## 14. スケーラビリティ設計

1. **サーバーサイドとの負荷分散**
   - 投稿取得の分散化
   ```dart
   // サーバーサイドの負荷を考慮したデータ取得戦略
   Future<List<TimelinePostModel>> getOptimizedTimeline(TimelineParams params) async {
     // 1. 最小限のデータを含むタイムラインエントリを取得
     final timelineEntries = await _getTimelineEntries(params);
     
     // 2. バッチでポストデータを効率的に取得
     final List<String> postIds = timelineEntries.map((e) => e.postId).toList();
     final posts = await _fetchPostsInBatches(postIds, batchSize: 20);
     
     // 3. クライアントサイドでエンリッチメント
     return _enrichTimelinePosts(timelineEntries, posts);
   }
   
   // バッチ処理による効率的なデータ取得
   Future<Map<String, PostModel>> _fetchPostsInBatches(
     List<String> postIds, 
     {required int batchSize}
   ) async {
     final Map<String, PostModel> results = {};
     
     for (int i = 0; i < postIds.length; i += batchSize) {
       final end = (i + batchSize < postIds.length) ? i + batchSize : postIds.length;
       final batchIds = postIds.sublist(i, end);
       
       final batchResults = await remoteDataSource.getPostsByIds(batchIds);
       results.addAll(batchResults);
     }
     
     return results;
   }
   ```

2. **ユーザーベース拡大に対応した設計**
   ```dart
   // ユーザー数拡大に対応したスケーラブルな構造
   class TimelineService {
     // リージョン別のデータソース選択
     final Map<String, RemoteDataSource> _regionalDataSources = {
       'asia-northeast1': AsiaTimelineDataSource(),
       'us-central1': USTimelineDataSource(),
       'europe-west1': EuropeTimelineDataSource(),
     };
     
     // ユーザーの地域に最適なデータソースを選択
     RemoteDataSource getOptimalDataSource(UserEntity user) {
       final userRegion = _getUserRegion(user);
       return _regionalDataSources[userRegion] ?? _regionalDataSources.values.first;
     }
     
     String _getUserRegion(UserEntity user) {
       // ユーザーの地域情報に基づいて最適なリージョンを決定
       if (user.country == 'Japan' || user.country == 'Korea') {
         return 'asia-northeast1';
       } else if (user.continent == 'Europe') {
         return 'europe-west1';
       }
       return 'us-central1'; // デフォルト
     }
   }
   ```