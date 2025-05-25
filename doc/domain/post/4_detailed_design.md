# 投稿ドメイン詳細設計

## 1. アーキテクチャ概要

投稿ドメインは、クリーンアーキテクチャに基づき以下の層に分けて実装します。

### プレゼンテーション層
- **画面（Screens）**
  - PostCreateScreen
  - PostDetailScreen
  - UserPostsScreen
  - CommentsScreen
  - LikesListScreen
  - HighlightsListScreen
  - TaggedPostsScreen

- **ビューモデル（ViewModels）**
  - PostViewModel
  - PostCreateViewModel
  - CommentsViewModel
  - LikesViewModel
  - HighlightsViewModel
  - TagsViewModel

- **ウィジェット（Widgets）**
  - PostCard
  - PostActions
  - CommentItem
  - MediaPlayer
  - TagChip
  - MediaUploader
  - LikeButton
  - HighlightButton

### ドメイン層
- **エンティティ（Entities）**
  - PostEntity
  - CommentEntity
  - LikeEntity
  - HighlightEntity
  - MediaEntity
  - TagEntity

- **リポジトリインターフェース（Repository Interfaces）**
  - IPostRepository
  - ICommentRepository
  - ILikeRepository
  - IHighlightRepository
  - IMediaRepository
  - ITagRepository
  - IContentReportRepository

- **ユースケース（Use Cases）**
  - CreatePostUseCase
  - GetPostUseCase
  - UpdatePostUseCase
  - DeletePostUseCase
  - GetUserPostsUseCase
  - AddCommentUseCase
  - GetCommentsUseCase
  - LikePostUseCase
  - UnlikePostUseCase
  - GetLikesUseCase
  - HighlightPostUseCase
  - UnhighlightPostUseCase
  - GetHighlightsUseCase
  - UploadMediaUseCase
  - GetTagsUseCase
  - GetTaggedPostsUseCase
  - ReportContentUseCase

### データ層
- **リポジトリ実装（Repository Implementations）**
  - PostRepository
  - CommentRepository
  - LikeRepository
  - HighlightRepository
  - MediaRepository
  - TagRepository
  - ContentReportRepository

- **データソース（Data Sources）**
  - PostRemoteDataSource
  - CommentRemoteDataSource
  - LikeRemoteDataSource
  - HighlightRemoteDataSource
  - MediaRemoteDataSource
  - TagRemoteDataSource
  - ContentReportRemoteDataSource
  - PostLocalDataSource

- **モデル（Models）**
  - PostModel
  - CommentModel
  - LikeModel
  - HighlightModel
  - MediaModel
  - TagModel
  - ContentReportModel

## 2. データモデル詳細

### PostModel
```dart
class PostModel extends PostEntity {
  final String id;
  final String userId;
  final ContentType contentType;
  final String? textContent;
  final String? mediaUrl;
  final String? thumbnailUrl;
  final String? eventId;
  final bool isPublic;
  final List<String> tags;
  final DateTime createdAt;
  final DateTime updatedAt;
  final UserModel user;
  final int likesCount;
  final int commentsCount;
  final int highlightsCount;
  final bool isLiked;
  final bool isHighlighted;
  
  PostModel({
    required this.id,
    required this.userId,
    required this.contentType,
    this.textContent,
    this.mediaUrl,
    this.thumbnailUrl,
    this.eventId,
    required this.isPublic,
    required this.tags,
    required this.createdAt,
    required this.updatedAt,
    required this.user,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.highlightsCount = 0,
    this.isLiked = false,
    this.isHighlighted = false,
  });
  
  factory PostModel.fromJson(Map<String, dynamic> json) { ... }
  Map<String, dynamic> toJson() { ... }
}

enum ContentType { text, image, video, audio }
```

### CommentModel
```dart
class CommentModel extends CommentEntity {
  final String id;
  final String postId;
  final String userId;
  final String? parentCommentId;
  final String body;
  final DateTime createdAt;
  final DateTime updatedAt;
  final UserModel user;
  final int replyCount;
  
  CommentModel({
    required this.id,
    required this.postId,
    required this.userId,
    this.parentCommentId,
    required this.body,
    required this.createdAt,
    required this.updatedAt,
    required this.user,
    this.replyCount = 0,
  });
  
  factory CommentModel.fromJson(Map<String, dynamic> json) { ... }
  Map<String, dynamic> toJson() { ... }
}
```

### LikeModel
```dart
class LikeModel extends LikeEntity {
  final String id;
  final String postId;
  final String userId;
  final DateTime createdAt;
  final UserModel? user;
  
  LikeModel({
    required this.id,
    required this.postId,
    required this.userId,
    required this.createdAt,
    this.user,
  });
  
  factory LikeModel.fromJson(Map<String, dynamic> json) { ... }
  Map<String, dynamic> toJson() { ... }
}
```

### HighlightModel
```dart
class HighlightModel extends HighlightEntity {
  final String id;
  final String postId;
  final String userId;
  final String? reason;
  final DateTime createdAt;
  final UserModel? user;
  
  HighlightModel({
    required this.id,
    required this.postId,
    required this.userId,
    this.reason,
    required this.createdAt,
    this.user,
  });
  
  factory HighlightModel.fromJson(Map<String, dynamic> json) { ... }
  Map<String, dynamic> toJson() { ... }
}
```

### MediaModel
```dart
class MediaModel extends MediaEntity {
  final String id;
  final String userId;
  final MediaType mediaType;
  final String url;
  final String? thumbnailUrl;
  final Map<String, dynamic> metadata;
  final DateTime createdAt;
  
  MediaModel({
    required this.id,
    required this.userId,
    required this.mediaType,
    required this.url,
    this.thumbnailUrl,
    required this.metadata,
    required this.createdAt,
  });
  
  factory MediaModel.fromJson(Map<String, dynamic> json) { ... }
  Map<String, dynamic> toJson() { ... }
}

enum MediaType { image, video, audio }
```

### TagModel
```dart
class TagModel extends TagEntity {
  final String id;
  final String name;
  final int usageCount;
  final DateTime createdAt;
  
  TagModel({
    required this.id,
    required this.name,
    required this.usageCount,
    required this.createdAt,
  });
  
  factory TagModel.fromJson(Map<String, dynamic> json) { ... }
  Map<String, dynamic> toJson() { ... }
}
```

## 3. リポジトリ詳細

### PostRepository
```dart
class PostRepository implements IPostRepository {
  final PostRemoteDataSource remoteDataSource;
  final PostLocalDataSource localDataSource;
  
  PostRepository({
    required this.remoteDataSource,
    required this.localDataSource,
  });
  
  @override
  Future<Either<Failure, PostEntity>> createPost(PostCreateParams params) async {
    try {
      final post = await remoteDataSource.createPost(params);
      await localDataSource.savePost(post);
      return Right(post);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, PostEntity>> getPost(String postId) async {
    try {
      // キャッシュチェック
      final cachedPost = await localDataSource.getPost(postId);
      if (cachedPost != null) {
        return Right(cachedPost);
      }
      
      final post = await remoteDataSource.getPost(postId);
      await localDataSource.savePost(post);
      return Right(post);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, PostEntity>> updatePost(PostUpdateParams params) async {
    try {
      final post = await remoteDataSource.updatePost(params);
      await localDataSource.savePost(post);
      return Right(post);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, bool>> deletePost(String postId) async {
    try {
      final result = await remoteDataSource.deletePost(postId);
      if (result) {
        await localDataSource.deletePost(postId);
      }
      return Right(result);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, PaginatedPosts>> getUserPosts(
    String userId, 
    int limit, 
    String? cursor,
    ContentType? contentType
  ) async {
    try {
      final result = await remoteDataSource.getUserPosts(
        userId, 
        limit, 
        cursor,
        contentType
      );
      
      // キャッシュ更新
      for (var post in result.posts) {
        await localDataSource.savePost(post);
      }
      
      return Right(result);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
}
```

## 4. ユースケース詳細

### CreatePostUseCase
```dart
class CreatePostUseCase {
  final IPostRepository repository;
  
  CreatePostUseCase({required this.repository});
  
  Future<Either<Failure, PostEntity>> call(PostCreateParams params) async {
    return repository.createPost(params);
  }
}

class PostCreateParams {
  final ContentType contentType;
  final String? textContent;
  final String? mediaId;
  final String? eventId;
  final bool isPublic;
  final List<String> tags;
  
  PostCreateParams({
    required this.contentType,
    this.textContent,
    this.mediaId,
    this.eventId,
    required this.isPublic,
    required this.tags,
  });
}
```

### GetPostUseCase
```dart
class GetPostUseCase {
  final IPostRepository repository;
  
  GetPostUseCase({required this.repository});
  
  Future<Either<Failure, PostEntity>> call(String postId) async {
    return repository.getPost(postId);
  }
}
```

### LikePostUseCase
```dart
class LikePostUseCase {
  final ILikeRepository repository;
  
  LikePostUseCase({required this.repository});
  
  Future<Either<Failure, LikeEntity>> call(String postId) async {
    return repository.likePost(postId);
  }
}
```

### HighlightPostUseCase
```dart
class HighlightPostUseCase {
  final IHighlightRepository repository;
  
  HighlightPostUseCase({required this.repository});
  
  Future<Either<Failure, HighlightEntity>> call(HighlightParams params) async {
    return repository.highlightPost(params);
  }
}

class HighlightParams {
  final String postId;
  final String? reason;
  
  HighlightParams({
    required this.postId,
    this.reason,
  });
}
```

## 5. ビューモデル詳細

### PostViewModel
```dart
class PostViewModel extends StateNotifier<PostState> {
  final GetPostUseCase getPostUseCase;
  final DeletePostUseCase deletePostUseCase;
  final LikePostUseCase likePostUseCase;
  final UnlikePostUseCase unlikePostUseCase;
  final HighlightPostUseCase highlightPostUseCase;
  final UnhighlightPostUseCase unhighlightPostUseCase;
  
  PostViewModel({
    required this.getPostUseCase,
    required this.deletePostUseCase,
    required this.likePostUseCase,
    required this.unlikePostUseCase,
    required this.highlightPostUseCase,
    required this.unhighlightPostUseCase,
  }) : super(PostInitial());
  
  Future<void> getPost(String postId) async {
    state = PostLoading();
    
    final result = await getPostUseCase(postId);
    
    result.fold(
      (failure) => state = PostError(failure.message),
      (post) => state = PostLoaded(post)
    );
  }
  
  Future<void> deletePost(String postId) async {
    state = PostLoading();
    
    final result = await deletePostUseCase(postId);
    
    result.fold(
      (failure) => state = PostError(failure.message),
      (_) => state = PostDeleted()
    );
  }
  
  Future<void> likePost(String postId) async {
    if (state is PostLoaded) {
      final currentPost = (state as PostLoaded).post;
      
      // 楽観的更新
      state = PostLoaded(
        currentPost.copyWith(
          isLiked: true,
          likesCount: currentPost.likesCount + 1
        )
      );
      
      final result = await likePostUseCase(postId);
      
      result.fold(
        (failure) {
          // 失敗したら元に戻す
          state = PostLoaded(currentPost);
          state = PostError(failure.message);
        },
        (_) => {} // すでに楽観的に更新済み
      );
    }
  }
  
  Future<void> unlikePost(String postId) async {
    if (state is PostLoaded) {
      final currentPost = (state as PostLoaded).post;
      
      // 楽観的更新
      state = PostLoaded(
        currentPost.copyWith(
          isLiked: false,
          likesCount: currentPost.likesCount - 1
        )
      );
      
      final result = await unlikePostUseCase(postId);
      
      result.fold(
        (failure) {
          // 失敗したら元に戻す
          state = PostLoaded(currentPost);
          state = PostError(failure.message);
        },
        (_) => {} // すでに楽観的に更新済み
      );
    }
  }
  
  Future<void> highlightPost(String postId, String? reason) async {
    if (state is PostLoaded) {
      final currentPost = (state as PostLoaded).post;
      
      // 楽観的更新
      state = PostLoaded(
        currentPost.copyWith(
          isHighlighted: true,
          highlightsCount: currentPost.highlightsCount + 1
        )
      );
      
      final result = await highlightPostUseCase(HighlightParams(
        postId: postId,
        reason: reason
      ));
      
      result.fold(
        (failure) {
          // 失敗したら元に戻す
          state = PostLoaded(currentPost);
          state = PostError(failure.message);
        },
        (_) => {} // すでに楽観的に更新済み
      );
    }
  }
  
  Future<void> unhighlightPost(String postId) async {
    if (state is PostLoaded) {
      final currentPost = (state as PostLoaded).post;
      
      // 楽観的更新
      state = PostLoaded(
        currentPost.copyWith(
          isHighlighted: false,
          highlightsCount: currentPost.highlightsCount - 1
        )
      );
      
      final result = await unhighlightPostUseCase(postId);
      
      result.fold(
        (failure) {
          // 失敗したら元に戻す
          state = PostLoaded(currentPost);
          state = PostError(failure.message);
        },
        (_) => {} // すでに楽観的に更新済み
      );
    }
  }
}
```

### PostCreateViewModel
```dart
class PostCreateViewModel extends StateNotifier<PostCreateState> {
  final CreatePostUseCase createPostUseCase;
  final UploadMediaUseCase uploadMediaUseCase;
  
  PostCreateViewModel({
    required this.createPostUseCase,
    required this.uploadMediaUseCase,
  }) : super(PostCreateInitial());
  
  Future<void> uploadMedia(File file, MediaType mediaType) async {
    state = MediaUploading();
    
    final result = await uploadMediaUseCase(
      UploadMediaParams(
        file: file,
        mediaType: mediaType,
      ),
    );
    
    result.fold(
      (failure) => state = PostCreateError(failure.message),
      (media) => state = MediaUploaded(media),
    );
  }
  
  Future<void> createPost({
    required ContentType contentType,
    String? textContent,
    String? mediaId,
    String? eventId,
    required bool isPublic,
    required List<String> tags,
  }) async {
    state = PostCreating();
    
    final result = await createPostUseCase(
      PostCreateParams(
        contentType: contentType,
        textContent: textContent,
        mediaId: mediaId,
        eventId: eventId,
        isPublic: isPublic,
        tags: tags,
      ),
    );
    
    result.fold(
      (failure) => state = PostCreateError(failure.message),
      (post) => state = PostCreated(post),
    );
  }
}
```

## 6. 依存性注入設定

```dart
// 依存性注入の設定
final postDomainModule = [
  // データソース
  Provider<PostRemoteDataSource>(
    (ref) => PostRemoteDataSourceImpl(client: ref.watch(httpClientProvider)),
  ),
  Provider<CommentRemoteDataSource>(
    (ref) => CommentRemoteDataSourceImpl(client: ref.watch(httpClientProvider)),
  ),
  Provider<LikeRemoteDataSource>(
    (ref) => LikeRemoteDataSourceImpl(client: ref.watch(httpClientProvider)),
  ),
  Provider<HighlightRemoteDataSource>(
    (ref) => HighlightRemoteDataSourceImpl(client: ref.watch(httpClientProvider)),
  ),
  Provider<MediaRemoteDataSource>(
    (ref) => MediaRemoteDataSourceImpl(client: ref.watch(httpClientProvider)),
  ),
  Provider<TagRemoteDataSource>(
    (ref) => TagRemoteDataSourceImpl(client: ref.watch(httpClientProvider)),
  ),
  Provider<ContentReportRemoteDataSource>(
    (ref) => ContentReportRemoteDataSourceImpl(client: ref.watch(httpClientProvider)),
  ),
  Provider<PostLocalDataSource>(
    (ref) => PostLocalDataSourceImpl(storage: ref.watch(hiveStorageProvider)),
  ),
  
  // リポジトリ
  Provider<IPostRepository>(
    (ref) => PostRepository(
      remoteDataSource: ref.watch(postRemoteDataSourceProvider),
      localDataSource: ref.watch(postLocalDataSourceProvider),
    ),
  ),
  Provider<ICommentRepository>(
    (ref) => CommentRepository(
      remoteDataSource: ref.watch(commentRemoteDataSourceProvider),
    ),
  ),
  Provider<ILikeRepository>(
    (ref) => LikeRepository(
      remoteDataSource: ref.watch(likeRemoteDataSourceProvider),
    ),
  ),
  Provider<IHighlightRepository>(
    (ref) => HighlightRepository(
      remoteDataSource: ref.watch(highlightRemoteDataSourceProvider),
    ),
  ),
  Provider<IMediaRepository>(
    (ref) => MediaRepository(
      remoteDataSource: ref.watch(mediaRemoteDataSourceProvider),
    ),
  ),
  Provider<ITagRepository>(
    (ref) => TagRepository(
      remoteDataSource: ref.watch(tagRemoteDataSourceProvider),
    ),
  ),
  Provider<IContentReportRepository>(
    (ref) => ContentReportRepository(
      remoteDataSource: ref.watch(contentReportRemoteDataSourceProvider),
    ),
  ),
  
  // ユースケース
  Provider<CreatePostUseCase>(
    (ref) => CreatePostUseCase(
      repository: ref.watch(postRepositoryProvider),
    ),
  ),
  Provider<GetPostUseCase>(
    (ref) => GetPostUseCase(
      repository: ref.watch(postRepositoryProvider),
    ),
  ),
  Provider<UpdatePostUseCase>(
    (ref) => UpdatePostUseCase(
      repository: ref.watch(postRepositoryProvider),
    ),
  ),
  Provider<DeletePostUseCase>(
    (ref) => DeletePostUseCase(
      repository: ref.watch(postRepositoryProvider),
    ),
  ),
  Provider<GetUserPostsUseCase>(
    (ref) => GetUserPostsUseCase(
      repository: ref.watch(postRepositoryProvider),
    ),
  ),
  // 他のユースケースも同様に登録
  
  // ビューモデル
  StateNotifierProvider<PostViewModel, PostState>(
    (ref) => PostViewModel(
      getPostUseCase: ref.watch(getPostUseCaseProvider),
      deletePostUseCase: ref.watch(deletePostUseCaseProvider),
      likePostUseCase: ref.watch(likePostUseCaseProvider),
      unlikePostUseCase: ref.watch(unlikePostUseCaseProvider),
      highlightPostUseCase: ref.watch(highlightPostUseCaseProvider),
      unhighlightPostUseCase: ref.watch(unhighlightPostUseCaseProvider),
    ),
  ),
  StateNotifierProvider<CommentsViewModel, CommentsState>(
    (ref) => CommentsViewModel(
      getCommentsUseCase: ref.watch(getCommentsUseCaseProvider),
      addCommentUseCase: ref.watch(addCommentUseCaseProvider),
      updateCommentUseCase: ref.watch(updateCommentUseCaseProvider),
      deleteCommentUseCase: ref.watch(deleteCommentUseCaseProvider),
    ),
  ),
  StateNotifierProvider<PostCreateViewModel, PostCreateState>(
    (ref) => PostCreateViewModel(
      createPostUseCase: ref.watch(createPostUseCaseProvider),
      uploadMediaUseCase: ref.watch(uploadMediaUseCaseProvider),
    ),
  ),
  // 他のビューモデルも同様に登録
];
```

## 7. タイムラインドメインとの連携

投稿ドメインは、タイムラインドメインに対して以下のインターフェースを公開します。これにより、タイムラインドメインは投稿の詳細情報を取得できますが、投稿ドメインの内部実装に依存しません。

```dart
/// タイムラインドメインに公開するインターフェース
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

/// タイムラインドメインに公開する実装
class PostForTimelineRepository implements IPostForTimelineRepository {
  final IPostRepository postRepository;
  
  PostForTimelineRepository({required this.postRepository});
  
  @override
  Future<Either<Failure, List<PostEntity>>> getPostsByIds(List<String> postIds) async {
    // 投稿IDリストから投稿を取得する実装
    try {
      final posts = await Future.wait(
        postIds.map((id) => postRepository.getPost(id).then(
          (result) => result.fold(
            (failure) => throw ServerException(failure.message),
            (post) => post,
          ),
        )),
      );
      return Right(posts);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, PaginatedPosts>> getPostsByUserIds(
    List<String> userIds,
    int limit,
    String? cursor,
  ) async {
    // 実装...
    return Right(PaginatedPosts(posts: [], nextCursor: null));
  }
  
  @override
  Future<Either<Failure, PaginatedPosts>> getHighlightedPosts(
    int limit,
    String? cursor,
  ) async {
    // 実装...
    return Right(PaginatedPosts(posts: [], nextCursor: null));
  }
  
  @override
  Future<Either<Failure, PaginatedPosts>> getPopularPosts(
    int limit,
    String? cursor,
  ) async {
    // 実装...
    return Right(PaginatedPosts(posts: [], nextCursor: null));
  }
}
```

## 8. セキュリティ考慮事項

1. **コンテンツアクセス制御**
   - 公開/非公開投稿の厳格なアクセス制御
   - ユーザー認証に基づくコンテンツ編集権限確認
   - 不適切なコンテンツの自動検出と通報システム
   - 非公開投稿の適切なアクセス制御
   - クロスサイトスクリプティング対策

2. **メディアセキュリティ**
   - メディアファイルのウイルス/マルウェアスキャン
   - プレサインドURLによる安全なアップロード
   - CDNでのコンテンツ配信とアクセス制御

3. **コンテンツモデレーション**
   - ユーザー報告システムの実装
   - 不適切コンテンツの迅速な検出と処理
   - モデレーション履歴の管理と監査

4. **データプライバシー**
   - センシティブなユーザーデータのローカルストレージ暗号化
   - アクセス制御の厳格な実施

## 9. テスト戦略

### 単体テスト
- モデルのシリアライズ/デシリアライズ
- リポジトリの各メソッド
- ユースケース
- ビューモデルの状態管理

### 統合テスト
- 投稿作成から取得までのフロー
- コメント追加と取得のフロー
- いいね/ハイライト操作とカウント更新
- メディアアップロードと表示

### UIテスト
- 投稿作成フォーム
- 投稿詳細表示
- コメント表示と操作
- メディア表示とプレイヤー

## 10. エラーハンドリング

```dart
// エラー定義
abstract class Failure {
  final String message;
  const Failure(this.message);
}

class ServerFailure extends Failure {
  const ServerFailure(String message) : super(message);
}

class CacheFailure extends Failure {
  const CacheFailure(String message) : super(message);
}

class NetworkFailure extends Failure {
  const NetworkFailure(String message) : super(message);
}

class ValidationFailure extends Failure {
  const ValidationFailure(String message) : super(message);
}

class MediaFailure extends Failure {
  const MediaFailure(String message) : super(message);
}

class UnexpectedFailure extends Failure {
  const UnexpectedFailure(String message) : super(message);
}

// 例外からFailureへの変換
Failure mapExceptionToFailure(dynamic e) {
  if (e is ServerException) return ServerFailure(e.message);
  if (e is CacheException) return CacheFailure(e.message);
  if (e is SocketException) return NetworkFailure('ネットワーク接続エラー');
  if (e is TimeoutException) return NetworkFailure('接続がタイムアウトしました');
  if (e is FormatException) return ValidationFailure('データ形式が不正です');
  if (e is MediaException) return MediaFailure(e.message);
  return UnexpectedFailure(e.toString());
}
```

## 11. パフォーマンス最適化

1. **キャッシュ戦略**
   - 頻繁にアクセスされる投稿のローカルキャッシュ
   - メディアファイルのキャッシュとプリロード
   - ページネーションとデータロード最適化

2. **メディア最適化**
   - 画像の自動リサイズとフォーマット最適化
   - 動画/音声の適切なエンコーディング
   - サムネイル生成と遅延ロード
   - 画像のプログレッシブローディング

3. **リスト表示の最適化**
   - リサイクルウィジェットの活用
   - ページネーションによるデータ分割
   - スクロール位置の保持と復元

4. **バックグラウンド処理**
   - メディアアップロードの非同期処理
   - キャッシュクリーンアップの定期実行
   - データプリフェッチによる先読み