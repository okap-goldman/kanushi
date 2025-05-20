# ダイレクトメッセージ機能の詳細設計

## 1. アーキテクチャ概要

ダイレクトメッセージ機能は、クリーンアーキテクチャに基づいて設計されています。以下の層構造を持ちます：

1. **プレゼンテーション層**
   - 画面（MessageListScreen, ConversationDetailScreen）
   - ウィジェット（MessageBubble, ConversationItem）
   - ビューモデル（MessageViewModel, ConversationViewModel）

2. **ドメイン層**
   - エンティティ（MessageEntity, ConversationEntity）
   - リポジトリインターフェース（MessageRepository, ConversationRepository）
   - ユースケース（SendMessageUseCase, GetConversationsUseCase）

3. **データ層**
   - データソースインターフェース（MessageDataSource, ConversationDataSource）
   - リポジトリ実装（MessageRepositoryImpl, ConversationRepositoryImpl）
   - モデル（MessageModel, ConversationModel）
   - リモートデータソース実装（MessageRemoteDataSource, ConversationRemoteDataSource）
   - ローカルデータソース実装（MessageLocalDataSource, ConversationLocalDataSource）

## 2. データフロー

### 2.1 メッセージ送信フロー

1. ユーザーがメッセージを入力し、送信ボタンをタップする
2. ビューモデル（MessageViewModel）がユースケース（SendMessageUseCase）を呼び出す
3. ユースケースがリポジトリインターフェース（MessageRepository）を呼び出す
4. リポジトリ実装（MessageRepositoryImpl）がデータソース（MessageDataSource）を呼び出す
5. データソース実装（MessageRemoteDataSource）がAPIに対してメッセージを送信する
6. 成功すると、リアルタイムデータベースのコールバックが発火し、相手のデバイスにも通知される
7. 相手のデバイスのリアルタイムデータベースリスナーがメッセージを受信し、UIが更新される

### 2.2 会話一覧取得フロー

1. ユーザーがメッセージ一覧画面を開く
2. ビューモデル（ConversationViewModel）がユースケース（GetConversationsUseCase）を呼び出す
3. ユースケースがリポジトリインターフェース（ConversationRepository）を呼び出す
4. リポジトリ実装（ConversationRepositoryImpl）がデータソース（ConversationDataSource）を呼び出す
5. データソース実装（ConversationRemoteDataSource）がAPIから会話一覧を取得する
6. 取得したデータをモデル（ConversationModel）に変換し、エンティティ（ConversationEntity）に変換してビューモデルに返す
7. ビューモデルがUIを更新する

## 3. コンポーネント詳細

### 3.1 エンティティ

#### 3.1.1 MessageEntity

```dart
class MessageEntity extends Equatable {
  final String id;
  final String conversationId;
  final String senderId;
  final String content;
  final List<MediaEntity> mediaAttachments;
  final MessageEntity? quotedMessage;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final MessageStatus status;
  final List<ReactionEntity> reactions;
  final List<ReadStatusEntity> readStatuses;
  final bool isEdited;
  final bool isDeleted;

  // コンストラクタ
  // equals/hashCodeの実装
  // その他のメソッド
}

enum MessageStatus {
  sending,
  sent,
  delivered,
  read,
  failed
}
```

#### 3.1.2 ConversationEntity

```dart
class ConversationEntity extends Equatable {
  final String id;
  final String? title;
  final ConversationType type;
  final ConversationStatus status;
  final List<ParticipantEntity> participants;
  final MessageEntity? lastMessage;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? lastMessageAt;
  final int unreadCount;

  // コンストラクタ
  // equals/hashCodeの実装
  // その他のメソッド
}

enum ConversationType {
  direct,
  group
}

enum ConversationStatus {
  active,
  archived
}
```

#### 3.1.3 ParticipantEntity

```dart
class ParticipantEntity extends Equatable {
  final String id;
  final String conversationId;
  final String userId;
  final UserEntity user;
  final ParticipantRole role;
  final DateTime joinedAt;
  final DateTime? leftAt;
  final bool isActive;

  // コンストラクタ
  // equals/hashCodeの実装
}

enum ParticipantRole {
  owner,
  admin,
  member
}
```

#### 3.1.4 MediaAttachmentEntity

```dart
class MediaAttachmentEntity extends Equatable {
  final String id;
  final String messageId;
  final MediaType type;
  final String url;
  final String? thumbnailUrl;
  final int size;
  final Map<String, dynamic> metadata;
  final DateTime createdAt;

  // コンストラクタ
  // equals/hashCodeの実装
}

enum MediaType {
  image,
  video,
  audio,
  file
}
```

#### 3.1.5 ReactionEntity

```dart
class ReactionEntity extends Equatable {
  final String id;
  final String messageId;
  final String userId;
  final ReactionType type;
  final DateTime createdAt;

  // コンストラクタ
  // equals/hashCodeの実装
}

enum ReactionType {
  like,
  love,
  laugh,
  sad,
  angry,
  wow
}
```

#### 3.1.6 ReadStatusEntity

```dart
class ReadStatusEntity extends Equatable {
  final String id;
  final String messageId;
  final String userId;
  final DateTime readAt;

  // コンストラクタ
  // equals/hashCodeの実装
}
```

### 3.2 リポジトリインターフェース

#### 3.2.1 MessageRepository

```dart
abstract class MessageRepository {
  Future<Either<Failure, List<MessageEntity>>> getMessages(
    String conversationId, {
    int limit = 50,
    DateTime? before,
    DateTime? after
  });
  
  Future<Either<Failure, MessageEntity>> sendMessage(
    String conversationId,
    String content, {
    List<String>? mediaAttachmentIds,
    String? quotedMessageId
  });
  
  Future<Either<Failure, MessageEntity>> editMessage(
    String conversationId,
    String messageId,
    String newContent
  );
  
  Future<Either<Failure, bool>> deleteMessage(
    String conversationId,
    String messageId
  );
  
  Future<Either<Failure, bool>> markAsRead(
    String conversationId,
    String messageId
  );
  
  Future<Either<Failure, ReactionEntity>> addReaction(
    String conversationId,
    String messageId,
    ReactionType reactionType
  );
  
  Future<Either<Failure, bool>> removeReaction(
    String conversationId,
    String messageId,
    ReactionType reactionType
  );
  
  Stream<MessageEntity> listenToNewMessages(String conversationId);
  
  Stream<MessageEntity> listenToMessageUpdates(String conversationId);
  
  Stream<String> listenToMessageDeletions(String conversationId);
  
  Stream<ReadStatusEntity> listenToReadStatuses(String conversationId);
  
  Stream<ReactionEntity> listenToReactionChanges(String conversationId);
}
```

#### 3.2.2 ConversationRepository

```dart
abstract class ConversationRepository {
  Future<Either<Failure, List<ConversationEntity>>> getConversations({
    int limit = 20,
    int offset = 0,
    ConversationStatus status = ConversationStatus.active
  });
  
  Future<Either<Failure, ConversationEntity>> getConversationById(
    String conversationId
  );
  
  Future<Either<Failure, ConversationEntity>> createConversation(
    ConversationType type,
    List<String> participantIds,
    String? title
  );
  
  Future<Either<Failure, ConversationEntity>> updateConversationStatus(
    String conversationId,
    ConversationStatus status
  );
  
  Future<Either<Failure, bool>> deleteConversation(
    String conversationId
  );
  
  Stream<ConversationEntity> listenToConversationChanges();
}
```

#### 3.2.3 MediaRepository

```dart
abstract class MediaRepository {
  Future<Either<Failure, MediaAttachmentEntity>> uploadMedia(
    File file,
    MediaType type
  );
}
```

### 3.3 ユースケース

#### 3.3.1 GetMessagesUseCase

```dart
class GetMessagesUseCase implements UseCase<List<MessageEntity>, GetMessagesParams> {
  final MessageRepository repository;
  
  GetMessagesUseCase(this.repository);
  
  @override
  Future<Either<Failure, List<MessageEntity>>> call(GetMessagesParams params) {
    return repository.getMessages(
      params.conversationId,
      limit: params.limit,
      before: params.before,
      after: params.after
    );
  }
}

class GetMessagesParams extends Equatable {
  final String conversationId;
  final int limit;
  final DateTime? before;
  final DateTime? after;
  
  // コンストラクタ
  // equals/hashCodeの実装
}
```

#### 3.3.2 SendMessageUseCase

```dart
class SendMessageUseCase implements UseCase<MessageEntity, SendMessageParams> {
  final MessageRepository repository;
  
  SendMessageUseCase(this.repository);
  
  @override
  Future<Either<Failure, MessageEntity>> call(SendMessageParams params) {
    return repository.sendMessage(
      params.conversationId,
      params.content,
      mediaAttachmentIds: params.mediaAttachmentIds,
      quotedMessageId: params.quotedMessageId
    );
  }
}

class SendMessageParams extends Equatable {
  final String conversationId;
  final String content;
  final List<String>? mediaAttachmentIds;
  final String? quotedMessageId;
  
  // コンストラクタ
  // equals/hashCodeの実装
}
```

#### 3.3.3 GetConversationsUseCase

```dart
class GetConversationsUseCase implements UseCase<List<ConversationEntity>, GetConversationsParams> {
  final ConversationRepository repository;
  
  GetConversationsUseCase(this.repository);
  
  @override
  Future<Either<Failure, List<ConversationEntity>>> call(GetConversationsParams params) {
    return repository.getConversations(
      limit: params.limit,
      offset: params.offset,
      status: params.status
    );
  }
}

class GetConversationsParams extends Equatable {
  final int limit;
  final int offset;
  final ConversationStatus status;
  
  // コンストラクタ
  // equals/hashCodeの実装
}
```

#### 3.3.4 CreateConversationUseCase

```dart
class CreateConversationUseCase implements UseCase<ConversationEntity, CreateConversationParams> {
  final ConversationRepository repository;
  
  CreateConversationUseCase(this.repository);
  
  @override
  Future<Either<Failure, ConversationEntity>> call(CreateConversationParams params) {
    return repository.createConversation(
      params.type,
      params.participantIds,
      params.title
    );
  }
}

class CreateConversationParams extends Equatable {
  final ConversationType type;
  final List<String> participantIds;
  final String? title;
  
  // コンストラクタ
  // equals/hashCodeの実装
}
```

### 3.4 データソース

#### 3.4.1 MessageDataSource

```dart
abstract class MessageRemoteDataSource {
  Future<MessageModel> getMessages(
    String conversationId, {
    int limit = 50,
    DateTime? before,
    DateTime? after
  });
  
  Future<MessageModel> sendMessage(
    String conversationId,
    String content, {
    List<String>? mediaAttachmentIds,
    String? quotedMessageId
  });
  
  Future<MessageModel> editMessage(
    String conversationId,
    String messageId,
    String newContent
  );
  
  Future<bool> deleteMessage(
    String conversationId,
    String messageId
  );
  
  Future<bool> markAsRead(
    String conversationId,
    String messageId
  );
  
  Future<ReactionModel> addReaction(
    String conversationId,
    String messageId,
    String reactionType
  );
  
  Future<bool> removeReaction(
    String conversationId,
    String messageId,
    String reactionType
  );
  
  Stream<MessageModel> listenToNewMessages(String conversationId);
  
  Stream<MessageModel> listenToMessageUpdates(String conversationId);
  
  Stream<String> listenToMessageDeletions(String conversationId);
  
  Stream<ReadStatusModel> listenToReadStatuses(String conversationId);
  
  Stream<ReactionModel> listenToReactionChanges(String conversationId);
}

abstract class MessageLocalDataSource {
  Future<List<MessageModel>> getCachedMessages(
    String conversationId, {
    int limit = 50,
    DateTime? before,
    DateTime? after
  });
  
  Future<void> cacheMessages(
    String conversationId,
    List<MessageModel> messages
  );
  
  Future<void> saveMessage(MessageModel message);
  
  Future<void> updateMessage(MessageModel message);
  
  Future<void> deleteMessage(String messageId);
  
  Future<void> updateReadStatus(
    String messageId,
    String userId,
    DateTime readAt
  );
  
  Future<void> saveReaction(ReactionModel reaction);
  
  Future<void> deleteReaction(
    String messageId,
    String userId,
    String reactionType
  );
}
```

#### 3.4.2 ConversationDataSource

```dart
abstract class ConversationRemoteDataSource {
  Future<List<ConversationModel>> getConversations({
    int limit = 20,
    int offset = 0,
    String status = 'ACTIVE'
  });
  
  Future<ConversationModel> getConversationById(
    String conversationId
  );
  
  Future<ConversationModel> createConversation(
    String type,
    List<String> participantIds,
    String? title
  );
  
  Future<ConversationModel> updateConversationStatus(
    String conversationId,
    String status
  );
  
  Future<bool> deleteConversation(
    String conversationId
  );
  
  Stream<ConversationModel> listenToConversationChanges();
}

abstract class ConversationLocalDataSource {
  Future<List<ConversationModel>> getCachedConversations({
    int limit = 20,
    int offset = 0,
    String status = 'ACTIVE'
  });
  
  Future<ConversationModel?> getCachedConversationById(
    String conversationId
  );
  
  Future<void> cacheConversations(
    List<ConversationModel> conversations
  );
  
  Future<void> saveConversation(
    ConversationModel conversation
  );
  
  Future<void> updateConversation(
    ConversationModel conversation
  );
  
  Future<void> deleteConversation(
    String conversationId
  );
}
```

#### 3.4.3 MediaDataSource

```dart
abstract class MediaRemoteDataSource {
  Future<MediaAttachmentModel> uploadMedia(
    File file,
    String type
  );
}

abstract class MediaLocalDataSource {
  Future<void> cacheMedia(
    MediaAttachmentModel media
  );
  
  Future<MediaAttachmentModel?> getCachedMedia(
    String mediaId
  );
}
```

### 3.5 リポジトリ実装

#### 3.5.1 MessageRepositoryImpl

```dart
class MessageRepositoryImpl implements MessageRepository {
  final MessageRemoteDataSource remoteDataSource;
  final MessageLocalDataSource localDataSource;
  final NetworkInfo networkInfo;
  
  MessageRepositoryImpl({
    required this.remoteDataSource,
    required this.localDataSource,
    required this.networkInfo
  });
  
  @override
  Future<Either<Failure, List<MessageEntity>>> getMessages(
    String conversationId, {
    int limit = 50,
    DateTime? before,
    DateTime? after
  }) async {
    if (await networkInfo.isConnected) {
      try {
        final messageModels = await remoteDataSource.getMessages(
          conversationId,
          limit: limit,
          before: before,
          after: after
        );
        await localDataSource.cacheMessages(conversationId, messageModels);
        return Right(messageModels.map((model) => model.toEntity()).toList());
      } on ServerException {
        return Left(ServerFailure());
      }
    } else {
      try {
        final cachedMessages = await localDataSource.getCachedMessages(
          conversationId,
          limit: limit,
          before: before,
          after: after
        );
        return Right(cachedMessages.map((model) => model.toEntity()).toList());
      } on CacheException {
        return Left(CacheFailure());
      }
    }
  }
  
  // 他のメソッドも同様に実装
}
```

#### 3.5.2 ConversationRepositoryImpl

```dart
class ConversationRepositoryImpl implements ConversationRepository {
  final ConversationRemoteDataSource remoteDataSource;
  final ConversationLocalDataSource localDataSource;
  final NetworkInfo networkInfo;
  
  ConversationRepositoryImpl({
    required this.remoteDataSource,
    required this.localDataSource,
    required this.networkInfo
  });
  
  @override
  Future<Either<Failure, List<ConversationEntity>>> getConversations({
    int limit = 20,
    int offset = 0,
    ConversationStatus status = ConversationStatus.active
  }) async {
    if (await networkInfo.isConnected) {
      try {
        final conversationModels = await remoteDataSource.getConversations(
          limit: limit,
          offset: offset,
          status: status.toString().split('.').last.toUpperCase()
        );
        await localDataSource.cacheConversations(conversationModels);
        return Right(conversationModels.map((model) => model.toEntity()).toList());
      } on ServerException {
        return Left(ServerFailure());
      }
    } else {
      try {
        final cachedConversations = await localDataSource.getCachedConversations(
          limit: limit,
          offset: offset,
          status: status.toString().split('.').last.toUpperCase()
        );
        return Right(cachedConversations.map((model) => model.toEntity()).toList());
      } on CacheException {
        return Left(CacheFailure());
      }
    }
  }
  
  // 他のメソッドも同様に実装
}
```

#### 3.5.3 MediaRepositoryImpl

```dart
class MediaRepositoryImpl implements MediaRepository {
  final MediaRemoteDataSource remoteDataSource;
  final MediaLocalDataSource localDataSource;
  final NetworkInfo networkInfo;
  
  MediaRepositoryImpl({
    required this.remoteDataSource,
    required this.localDataSource,
    required this.networkInfo
  });
  
  @override
  Future<Either<Failure, MediaAttachmentEntity>> uploadMedia(
    File file,
    MediaType type
  ) async {
    if (await networkInfo.isConnected) {
      try {
        final mediaModel = await remoteDataSource.uploadMedia(
          file,
          type.toString().split('.').last.toUpperCase()
        );
        await localDataSource.cacheMedia(mediaModel);
        return Right(mediaModel.toEntity());
      } on ServerException {
        return Left(ServerFailure());
      }
    } else {
      return Left(NetworkFailure());
    }
  }
}
```

### 3.6 モデル

#### 3.6.1 MessageModel

```dart
class MessageModel {
  final String id;
  final String conversationId;
  final String senderId;
  final String content;
  final List<MediaAttachmentModel> mediaAttachments;
  final MessageModel? quotedMessage;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final String status;
  final List<ReactionModel> reactions;
  final List<ReadStatusModel> readStatuses;
  final bool isEdited;
  final bool isDeleted;

  // コンストラクタ
  // JSONからの変換
  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['id'],
      conversationId: json['conversationId'],
      senderId: json['senderId'],
      content: json['content'],
      mediaAttachments: (json['mediaAttachments'] as List)
          .map((e) => MediaAttachmentModel.fromJson(e))
          .toList(),
      quotedMessage: json['quotedMessage'] != null
          ? MessageModel.fromJson(json['quotedMessage'])
          : null,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
      status: json['status'],
      reactions: (json['reactions'] as List)
          .map((e) => ReactionModel.fromJson(e))
          .toList(),
      readStatuses: (json['readBy'] as List)
          .map((e) => ReadStatusModel.fromJson(e))
          .toList(),
      isEdited: json['isEdited'] ?? false,
      isDeleted: json['isDeleted'] ?? false,
    );
  }

  // JSONへの変換
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversationId': conversationId,
      'senderId': senderId,
      'content': content,
      'mediaAttachments': mediaAttachments.map((e) => e.toJson()).toList(),
      'quotedMessage': quotedMessage?.toJson(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'status': status,
      'reactions': reactions.map((e) => e.toJson()).toList(),
      'readBy': readStatuses.map((e) => e.toJson()).toList(),
      'isEdited': isEdited,
      'isDeleted': isDeleted,
    };
  }

  // エンティティへの変換
  MessageEntity toEntity() {
    return MessageEntity(
      id: id,
      conversationId: conversationId,
      senderId: senderId,
      content: content,
      mediaAttachments: mediaAttachments.map((e) => e.toEntity()).toList(),
      quotedMessage: quotedMessage?.toEntity(),
      createdAt: createdAt,
      updatedAt: updatedAt,
      status: MessageStatus.values.firstWhere(
        (e) => e.toString().split('.').last.toUpperCase() == status,
        orElse: () => MessageStatus.sent
      ),
      reactions: reactions.map((e) => e.toEntity()).toList(),
      readStatuses: readStatuses.map((e) => e.toEntity()).toList(),
      isEdited: isEdited,
      isDeleted: isDeleted,
    );
  }
}
```

#### 3.6.2 ConversationModel

```dart
class ConversationModel {
  final String id;
  final String? title;
  final String type;
  final String status;
  final List<ParticipantModel> participants;
  final MessageModel? lastMessage;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? lastMessageAt;
  final int unreadCount;

  // コンストラクタ
  // JSONからの変換
  // JSONへの変換
  // エンティティへの変換
}
```

#### 3.6.3 MediaAttachmentModel

```dart
class MediaAttachmentModel {
  final String id;
  final String messageId;
  final String type;
  final String url;
  final String? thumbnailUrl;
  final int size;
  final Map<String, dynamic> metadata;
  final DateTime createdAt;

  // コンストラクタ
  // JSONからの変換
  // JSONへの変換
  // エンティティへの変換
}
```

### 3.7 ビューモデル

#### 3.7.1 MessageViewModel

```dart
class MessageViewModel extends ChangeNotifier {
  final GetMessagesUseCase getMessagesUseCase;
  final SendMessageUseCase sendMessageUseCase;
  final EditMessageUseCase editMessageUseCase;
  final DeleteMessageUseCase deleteMessageUseCase;
  final MarkAsReadUseCase markAsReadUseCase;
  final AddReactionUseCase addReactionUseCase;
  final RemoveReactionUseCase removeReactionUseCase;
  final UploadMediaUseCase uploadMediaUseCase;
  
  MessageViewModel({
    required this.getMessagesUseCase,
    required this.sendMessageUseCase,
    required this.editMessageUseCase,
    required this.deleteMessageUseCase,
    required this.markAsReadUseCase,
    required this.addReactionUseCase,
    required this.removeReactionUseCase,
    required this.uploadMediaUseCase,
  });
  
  // 状態管理
  List<MessageEntity> _messages = [];
  bool _isLoading = false;
  bool _hasMore = true;
  Failure? _failure;
  StreamSubscription? _messageStreamSubscription;
  
  // ゲッター
  List<MessageEntity> get messages => _messages;
  bool get isLoading => _isLoading;
  bool get hasMore => _hasMore;
  Failure? get failure => _failure;
  
  // メソッド
  Future<void> getMessages(
    String conversationId, {
    bool refresh = false,
    int limit = 50
  }) async {
    if (refresh) {
      _messages = [];
      _hasMore = true;
      notifyListeners();
    }
    
    if (!_hasMore || _isLoading) return;
    
    _isLoading = true;
    _failure = null;
    notifyListeners();
    
    final params = GetMessagesParams(
      conversationId: conversationId,
      limit: limit,
      before: _messages.isNotEmpty ? _messages.last.createdAt : null
    );
    
    final result = await getMessagesUseCase(params);
    
    result.fold(
      (failure) {
        _failure = failure;
        _isLoading = false;
        notifyListeners();
      },
      (messages) {
        if (messages.isEmpty || messages.length < limit) {
          _hasMore = false;
        }
        
        if (refresh) {
          _messages = messages;
        } else {
          _messages.addAll(messages);
        }
        
        _isLoading = false;
        notifyListeners();
      }
    );
  }
  
  Future<void> sendMessage(
    String conversationId,
    String content, {
    List<File>? mediaFiles,
    String? quotedMessageId
  }) async {
    if (content.isEmpty && (mediaFiles == null || mediaFiles.isEmpty)) {
      return;
    }
    
    _failure = null;
    notifyListeners();
    
    List<String> mediaAttachmentIds = [];
    
    if (mediaFiles != null && mediaFiles.isNotEmpty) {
      for (final file in mediaFiles) {
        final result = await uploadMediaUseCase(
          UploadMediaParams(
            file: file,
            type: _getMediaTypeFromFile(file)
          )
        );
        
        final attachmentId = result.fold(
          (failure) {
            _failure = failure;
            notifyListeners();
            return null;
          },
          (media) => media.id
        );
        
        if (attachmentId != null) {
          mediaAttachmentIds.add(attachmentId);
        }
      }
    }
    
    final params = SendMessageParams(
      conversationId: conversationId,
      content: content,
      mediaAttachmentIds: mediaAttachmentIds.isNotEmpty ? mediaAttachmentIds : null,
      quotedMessageId: quotedMessageId
    );
    
    final result = await sendMessageUseCase(params);
    
    result.fold(
      (failure) {
        _failure = failure;
        notifyListeners();
      },
      (message) {
        // メッセージが送信されると、通常はリアルタイムデータベースを通じて
        // 新しいメッセージを受信するため、ここでは特に何もしない
      }
    );
  }
  
  MediaType _getMediaTypeFromFile(File file) {
    final extension = path.extension(file.path).toLowerCase();
    
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].contains(extension)) {
      return MediaType.image;
    } else if (['.mp4', '.mov', '.avi', '.webm'].contains(extension)) {
      return MediaType.video;
    } else if (['.mp3', '.wav', '.aac', '.m4a'].contains(extension)) {
      return MediaType.audio;
    } else {
      return MediaType.file;
    }
  }
  
  Future<void> editMessage(
    String conversationId,
    String messageId,
    String newContent
  ) async {
    _failure = null;
    notifyListeners();
    
    final params = EditMessageParams(
      conversationId: conversationId,
      messageId: messageId,
      newContent: newContent
    );
    
    final result = await editMessageUseCase(params);
    
    result.fold(
      (failure) {
        _failure = failure;
        notifyListeners();
      },
      (message) {
        // メッセージが更新されると、通常はリアルタイムデータベースを通じて
        // 更新されたメッセージを受信するため、ここでは特に何もしない
      }
    );
  }
  
  // 他のメソッドも同様に実装
  
  void startListeningToMessages(String conversationId) {
    // リアルタイムデータベースを使用して新しいメッセージを受信する
    // また、既存のメッセージの更新や削除も監視する
  }
  
  void dispose() {
    _messageStreamSubscription?.cancel();
    super.dispose();
  }
}
```

#### 3.7.2 ConversationViewModel

```dart
class ConversationViewModel extends ChangeNotifier {
  final GetConversationsUseCase getConversationsUseCase;
  final GetConversationByIdUseCase getConversationByIdUseCase;
  final CreateConversationUseCase createConversationUseCase;
  final UpdateConversationStatusUseCase updateConversationStatusUseCase;
  final DeleteConversationUseCase deleteConversationUseCase;
  
  ConversationViewModel({
    required this.getConversationsUseCase,
    required this.getConversationByIdUseCase,
    required this.createConversationUseCase,
    required this.updateConversationStatusUseCase,
    required this.deleteConversationUseCase,
  });
  
  // 状態管理
  List<ConversationEntity> _conversations = [];
  ConversationEntity? _selectedConversation;
  bool _isLoading = false;
  bool _hasMore = true;
  int _offset = 0;
  Failure? _failure;
  StreamSubscription? _conversationStreamSubscription;
  
  // ゲッター
  List<ConversationEntity> get conversations => _conversations;
  ConversationEntity? get selectedConversation => _selectedConversation;
  bool get isLoading => _isLoading;
  bool get hasMore => _hasMore;
  Failure? get failure => _failure;
  
  // メソッド
  Future<void> getConversations({
    bool refresh = false,
    int limit = 20,
    ConversationStatus status = ConversationStatus.active
  }) async {
    if (refresh) {
      _conversations = [];
      _offset = 0;
      _hasMore = true;
      notifyListeners();
    }
    
    if (!_hasMore || _isLoading) return;
    
    _isLoading = true;
    _failure = null;
    notifyListeners();
    
    final params = GetConversationsParams(
      limit: limit,
      offset: _offset,
      status: status
    );
    
    final result = await getConversationsUseCase(params);
    
    result.fold(
      (failure) {
        _failure = failure;
        _isLoading = false;
        notifyListeners();
      },
      (conversations) {
        if (conversations.isEmpty || conversations.length < limit) {
          _hasMore = false;
        }
        
        if (refresh) {
          _conversations = conversations;
        } else {
          _conversations.addAll(conversations);
        }
        
        _offset += conversations.length;
        _isLoading = false;
        notifyListeners();
      }
    );
  }
  
  // 他のメソッドも同様に実装
  
  void startListeningToConversations() {
    // リアルタイムデータベースを使用して会話の変更を監視する
  }
  
  void dispose() {
    _conversationStreamSubscription?.cancel();
    super.dispose();
  }
}
```

### 3.8 画面とウィジェット

#### 3.8.1 MessageListScreen

メッセージ一覧を表示する画面。

#### 3.8.2 ConversationDetailScreen

特定の会話の詳細とメッセージ履歴を表示する画面。

#### 3.8.3 MessageBubble

各メッセージを表示するためのカスタムウィジェット。

#### 3.8.4 MediaPreviewWidget

メディア添付（画像、動画など）を表示するためのカスタムウィジェット。

## 4. 依存性注入

```dart
void initMessageDependencies() {
  // データソース
  getIt.registerLazySingleton<MessageRemoteDataSource>(
    () => MessageRemoteDataSourceImpl(client: getIt<ApiClient>())
  );
  
  getIt.registerLazySingleton<MessageLocalDataSource>(
    () => MessageLocalDataSourceImpl(sharedPreferences: getIt<SharedPreferences>())
  );
  
  getIt.registerLazySingleton<ConversationRemoteDataSource>(
    () => ConversationRemoteDataSourceImpl(client: getIt<ApiClient>())
  );
  
  getIt.registerLazySingleton<ConversationLocalDataSource>(
    () => ConversationLocalDataSourceImpl(sharedPreferences: getIt<SharedPreferences>())
  );
  
  getIt.registerLazySingleton<MediaRemoteDataSource>(
    () => MediaRemoteDataSourceImpl(client: getIt<ApiClient>())
  );
  
  getIt.registerLazySingleton<MediaLocalDataSource>(
    () => MediaLocalDataSourceImpl(sharedPreferences: getIt<SharedPreferences>())
  );
  
  // リポジトリ
  getIt.registerLazySingleton<MessageRepository>(
    () => MessageRepositoryImpl(
      remoteDataSource: getIt<MessageRemoteDataSource>(),
      localDataSource: getIt<MessageLocalDataSource>(),
      networkInfo: getIt<NetworkInfo>()
    )
  );
  
  getIt.registerLazySingleton<ConversationRepository>(
    () => ConversationRepositoryImpl(
      remoteDataSource: getIt<ConversationRemoteDataSource>(),
      localDataSource: getIt<ConversationLocalDataSource>(),
      networkInfo: getIt<NetworkInfo>()
    )
  );
  
  getIt.registerLazySingleton<MediaRepository>(
    () => MediaRepositoryImpl(
      remoteDataSource: getIt<MediaRemoteDataSource>(),
      localDataSource: getIt<MediaLocalDataSource>(),
      networkInfo: getIt<NetworkInfo>()
    )
  );
  
  // ユースケース
  getIt.registerLazySingleton(() => GetMessagesUseCase(getIt<MessageRepository>()));
  getIt.registerLazySingleton(() => SendMessageUseCase(getIt<MessageRepository>()));
  getIt.registerLazySingleton(() => EditMessageUseCase(getIt<MessageRepository>()));
  getIt.registerLazySingleton(() => DeleteMessageUseCase(getIt<MessageRepository>()));
  getIt.registerLazySingleton(() => MarkAsReadUseCase(getIt<MessageRepository>()));
  getIt.registerLazySingleton(() => AddReactionUseCase(getIt<MessageRepository>()));
  getIt.registerLazySingleton(() => RemoveReactionUseCase(getIt<MessageRepository>()));
  
  getIt.registerLazySingleton(() => GetConversationsUseCase(getIt<ConversationRepository>()));
  getIt.registerLazySingleton(() => GetConversationByIdUseCase(getIt<ConversationRepository>()));
  getIt.registerLazySingleton(() => CreateConversationUseCase(getIt<ConversationRepository>()));
  getIt.registerLazySingleton(() => UpdateConversationStatusUseCase(getIt<ConversationRepository>()));
  getIt.registerLazySingleton(() => DeleteConversationUseCase(getIt<ConversationRepository>()));
  
  getIt.registerLazySingleton(() => UploadMediaUseCase(getIt<MediaRepository>()));
  
  // ビューモデル
  getIt.registerFactory<MessageViewModel>(
    () => MessageViewModel(
      getMessagesUseCase: getIt<GetMessagesUseCase>(),
      sendMessageUseCase: getIt<SendMessageUseCase>(),
      editMessageUseCase: getIt<EditMessageUseCase>(),
      deleteMessageUseCase: getIt<DeleteMessageUseCase>(),
      markAsReadUseCase: getIt<MarkAsReadUseCase>(),
      addReactionUseCase: getIt<AddReactionUseCase>(),
      removeReactionUseCase: getIt<RemoveReactionUseCase>(),
      uploadMediaUseCase: getIt<UploadMediaUseCase>()
    )
  );
  
  getIt.registerFactory<ConversationViewModel>(
    () => ConversationViewModel(
      getConversationsUseCase: getIt<GetConversationsUseCase>(),
      getConversationByIdUseCase: getIt<GetConversationByIdUseCase>(),
      createConversationUseCase: getIt<CreateConversationUseCase>(),
      updateConversationStatusUseCase: getIt<UpdateConversationStatusUseCase>(),
      deleteConversationUseCase: getIt<DeleteConversationUseCase>()
    )
  );
}
```

## 5. エラー処理

### 5.1 例外クラス

```dart
// 基本例外クラス
abstract class Exception implements Exception {}

// サーバー例外
class ServerException implements Exception {
  final String message;
  final String code;
  
  ServerException({
    required this.message,
    required this.code
  });
}

// キャッシュ例外
class CacheException implements Exception {
  final String message;
  
  CacheException({
    required this.message
  });
}

// 認証例外
class AuthenticationException implements Exception {
  final String message;
  
  AuthenticationException({
    required this.message
  });
}

// ネットワーク例外
class NetworkException implements Exception {
  final String message;
  
  NetworkException({
    required this.message
  });
}
```

### 5.2 失敗クラス

```dart
// 基本失敗クラス
abstract class Failure extends Equatable {
  final String message;
  
  Failure({
    required this.message
  });
  
  @override
  List<Object> get props => [message];
}

// サーバー失敗
class ServerFailure extends Failure {
  ServerFailure({
    String message = 'サーバーエラーが発生しました'
  }) : super(message: message);
}

// キャッシュ失敗
class CacheFailure extends Failure {
  CacheFailure({
    String message = 'データの取得に失敗しました'
  }) : super(message: message);
}

// 認証失敗
class AuthenticationFailure extends Failure {
  AuthenticationFailure({
    String message = '認証に失敗しました'
  }) : super(message: message);
}

// ネットワーク失敗
class NetworkFailure extends Failure {
  NetworkFailure({
    String message = 'ネットワーク接続を確認してください'
  }) : super(message: message);
}
```

## 6. パフォーマンス最適化

### 6.1 メッセージのページネーション

メッセージの取得は、効率化のために以下の方法で実装されます：

1. 初期読み込み時に最新の50件（またはlimitで指定された数）を取得
2. スクロールで過去のメッセージを追加読み込み
3. 新しいメッセージはリアルタイムデータベースを通じて自動的に追加

### 6.2 画像の遅延読み込み

1. サムネイルを先に表示し、ユーザーが表示領域にスクロールしたときに高解像度の画像をロード
2. ローカルキャッシュを利用して一度表示した画像を再利用

### 6.3 オフラインサポート

1. 最近の会話とメッセージをローカルキャッシュ
2. オフライン時に送信されたメッセージをキューイング
3. オンラインに戻ったときに自動的に送信処理

## 7. セキュリティ対策

### 7.1 データの暗号化

1. メッセージデータはサーバーサイドで暗号化して保存
2. 通信はHTTPS経由で暗号化
3. フェーズ2で実装予定のエンドツーエンド暗号化は、クライアントサイドでの暗号化鍵管理が必要

### 7.2 認証と認可

1. すべてのAPI呼び出しはJWTトークンによる認証が必要
2. メッセージと会話へのアクセスは、参加者のみに制限
3. グループ会話では、管理者権限を持つユーザーのみが特定の操作（参加者の追加/削除など）を実行可能

### 7.3 入力サニタイズ

1. ユーザー入力は常にサニタイズしてXSS攻撃を防止
2. メッセージ内のHTML要素はエスケープまたは削除

## 8. フェーズ別の実装計画

### 8.1 フェーズ1（MVP）

1. 基本的なエンティティとリポジトリの実装
2. 1対1の会話機能
3. テキストメッセージ送受信
4. 画像添付機能（基本的なもののみ）
5. 会話一覧と詳細表示
6. 基本的な通知機能
7. オフラインサポート（基本的なもののみ）

### 8.2 フェーズ2

1. 高度なメディア添付（音声、動画）
2. メッセージのリアクション機能
3. 引用返信機能
4. URLのプレビュー表示
5. 検索機能の強化
6. パフォーマンス最適化
7. エラー処理の強化

### 8.3 フェーズ3

1. グループメッセージング機能
2. エンドツーエンド暗号化
3. メッセージの自動削除機能
4. 高度なコンテンツ共有機能
5. 覚醒レベルに基づいた特別なメッセージングエクスペリエンス