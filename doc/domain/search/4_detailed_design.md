# 検索・AIドメイン詳細設計

## 1. アーキテクチャ概要

検索・AIドメインは、クリーンアーキテクチャに基づき以下の層に分けて実装します。

### プレゼンテーション層
- **画面（Screens）**
  - SearchScreen
  - SearchResultsScreen
  - SearchSuggestionsScreen
  - SearchHistoryScreen
  - AIChatScreen
  - ChatHistoryScreen

- **ビューモデル（ViewModels）**
  - SearchViewModel
  - SearchResultsViewModel
  - SearchSuggestionsViewModel
  - SearchHistoryViewModel
  - AIChatViewModel
  - ChatHistoryViewModel

- **ウィジェット（Widgets）**
  - SearchBar
  - SearchFilterChip
  - SearchResultItem
  - SearchHistoryItem
  - ChatMessageBubble
  - ChatInputField
  - ChatLoadingIndicator
  - ChatSessionItem

### ドメイン層
- **エンティティ（Entities）**
  - SearchQueryEntity
  - SearchResultEntity
  - SearchSuggestionEntity
  - SearchHistoryEntity
  - ChatSessionEntity
  - ChatMessageEntity

- **リポジトリインターフェース（Repository Interfaces）**
  - ISearchRepository
  - ISearchHistoryRepository
  - IChatRepository

- **ユースケース（Use Cases）**
  - SearchUseCase
  - GetSearchSuggestionsUseCase
  - GetSearchHistoryUseCase
  - DeleteSearchHistoryUseCase
  - CreateChatSessionUseCase
  - SendChatMessageUseCase
  - GetChatSessionsUseCase
  - GetChatMessagesUseCase
  - DeleteChatSessionUseCase

### データ層
- **リポジトリ実装（Repository Implementations）**
  - SearchRepository
  - SearchHistoryRepository
  - ChatRepository

- **データソース（Data Sources）**
  - SearchRemoteDataSource
  - SearchHistoryLocalDataSource
  - ChatRemoteDataSource
  - ChatLocalDataSource

- **モデル（Models）**
  - SearchQueryModel
  - SearchResultModel
  - SearchSuggestionModel
  - SearchHistoryModel
  - ChatSessionModel
  - ChatMessageModel

## 2. データモデル詳細

### SearchQueryModel
```dart
class SearchQueryModel extends SearchQueryEntity {
  final String query;
  final SearchType searchType;
  final Map<String, dynamic> filters;
  final int limit;
  final int offset;
  
  SearchQueryModel({
    required this.query,
    this.searchType = SearchType.all,
    this.filters = const {},
    this.limit = 20,
    this.offset = 0,
  });
  
  factory SearchQueryModel.fromJson(Map<String, dynamic> json) {
    return SearchQueryModel(
      query: json['query'],
      searchType: SearchType.values.byName(json['search_type'] ?? 'all'),
      filters: json['filters'] ?? {},
      limit: json['limit'] ?? 20,
      offset: json['offset'] ?? 0,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'query': query,
      'search_type': searchType.name,
      'filters': filters,
      'limit': limit,
      'offset': offset,
    };
  }
  
  SearchQueryModel copyWith({
    String? query,
    SearchType? searchType,
    Map<String, dynamic>? filters,
    int? limit,
    int? offset,
  }) {
    return SearchQueryModel(
      query: query ?? this.query,
      searchType: searchType ?? this.searchType,
      filters: filters ?? this.filters,
      limit: limit ?? this.limit,
      offset: offset ?? this.offset,
    );
  }
}

enum SearchType { user, post, all }
```

### SearchResultModel
```dart
class SearchResultModel extends SearchResultEntity {
  final String id;
  final SearchResultType resultType;
  final String title;
  final String? description;
  final String? imageUrl;
  final Map<String, dynamic> data;
  final double relevanceScore;
  
  SearchResultModel({
    required this.id,
    required this.resultType,
    required this.title,
    this.description,
    this.imageUrl,
    required this.data,
    required this.relevanceScore,
  });
  
  factory SearchResultModel.fromJson(Map<String, dynamic> json) {
    return SearchResultModel(
      id: json['id'],
      resultType: SearchResultType.values.byName(json['result_type']),
      title: json['title'],
      description: json['description'],
      imageUrl: json['image_url'],
      data: json['data'] ?? {},
      relevanceScore: json['relevance_score'].toDouble(),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'result_type': resultType.name,
      'title': title,
      'description': description,
      'image_url': imageUrl,
      'data': data,
      'relevance_score': relevanceScore,
    };
  }
}

class PaginatedSearchResults {
  final List<SearchResultModel> results;
  final int total;
  final int offset;
  final int limit;
  final bool hasMore;
  
  PaginatedSearchResults({
    required this.results,
    required this.total,
    required this.offset,
    required this.limit,
    required this.hasMore,
  });
  
  factory PaginatedSearchResults.fromJson(Map<String, dynamic> json) {
    return PaginatedSearchResults(
      results: (json['results'] as List)
          .map((item) => SearchResultModel.fromJson(item))
          .toList(),
      total: json['total'],
      offset: json['offset'],
      limit: json['limit'],
      hasMore: json['has_more'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'results': results.map((result) => result.toJson()).toList(),
      'total': total,
      'offset': offset,
      'limit': limit,
      'has_more': hasMore,
    };
  }
}

enum SearchResultType { user, post, tag }
```

### SearchSuggestionModel
```dart
class SearchSuggestionModel extends SearchSuggestionEntity {
  final String text;
  final SearchSuggestionType type;
  final double score;
  
  SearchSuggestionModel({
    required this.text,
    required this.type,
    required this.score,
  });
  
  factory SearchSuggestionModel.fromJson(Map<String, dynamic> json) {
    return SearchSuggestionModel(
      text: json['text'],
      type: SearchSuggestionType.values.byName(json['type']),
      score: json['score'].toDouble(),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'text': text,
      'type': type.name,
      'score': score,
    };
  }
}

enum SearchSuggestionType { history, popular, autocomplete }
```

### SearchHistoryModel
```dart
class SearchHistoryModel extends SearchHistoryEntity {
  final String id;
  final String query;
  final SearchType searchType;
  final Map<String, dynamic> filters;
  final DateTime searchedAt;
  
  SearchHistoryModel({
    required this.id,
    required this.query,
    required this.searchType,
    required this.filters,
    required this.searchedAt,
  });
  
  factory SearchHistoryModel.fromJson(Map<String, dynamic> json) {
    return SearchHistoryModel(
      id: json['id'],
      query: json['query'],
      searchType: SearchType.values.byName(json['search_type']),
      filters: json['filters'] ?? {},
      searchedAt: DateTime.parse(json['searched_at']),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'query': query,
      'search_type': searchType.name,
      'filters': filters,
      'searched_at': searchedAt.toIso8601String(),
    };
  }
}
```

### ChatSessionModel
```dart
class ChatSessionModel extends ChatSessionEntity {
  final String id;
  final String userId;
  final String title;
  final DateTime createdAt;
  final DateTime? endedAt;
  final int messageCount;
  final String? lastMessage;
  
  ChatSessionModel({
    required this.id,
    required this.userId,
    required this.title,
    required this.createdAt,
    this.endedAt,
    this.messageCount = 0,
    this.lastMessage,
  });
  
  factory ChatSessionModel.fromJson(Map<String, dynamic> json) {
    return ChatSessionModel(
      id: json['id'],
      userId: json['user_id'],
      title: json['title'],
      createdAt: DateTime.parse(json['created_at']),
      endedAt: json['ended_at'] != null ? DateTime.parse(json['ended_at']) : null,
      messageCount: json['message_count'] ?? 0,
      lastMessage: json['last_message'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'title': title,
      'created_at': createdAt.toIso8601String(),
      'ended_at': endedAt?.toIso8601String(),
      'message_count': messageCount,
      'last_message': lastMessage,
    };
  }
  
  ChatSessionModel copyWith({
    String? id,
    String? userId,
    String? title,
    DateTime? createdAt,
    DateTime? endedAt,
    int? messageCount,
    String? lastMessage,
  }) {
    return ChatSessionModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      createdAt: createdAt ?? this.createdAt,
      endedAt: endedAt ?? this.endedAt,
      messageCount: messageCount ?? this.messageCount,
      lastMessage: lastMessage ?? this.lastMessage,
    );
  }
}
```

### ChatMessageModel
```dart
class ChatMessageModel extends ChatMessageEntity {
  final String id;
  final String sessionId;
  final String userId;
  final ChatRole role;
  final String content;
  final DateTime createdAt;
  final Map<String, dynamic>? metadata;
  
  ChatMessageModel({
    required this.id,
    required this.sessionId,
    required this.userId,
    required this.role,
    required this.content,
    required this.createdAt,
    this.metadata,
  });
  
  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      id: json['id'],
      sessionId: json['session_id'],
      userId: json['user_id'],
      role: ChatRole.values.byName(json['role']),
      content: json['content'],
      createdAt: DateTime.parse(json['created_at']),
      metadata: json['metadata'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'session_id': sessionId,
      'user_id': userId,
      'role': role.name,
      'content': content,
      'created_at': createdAt.toIso8601String(),
      'metadata': metadata,
    };
  }
}

enum ChatRole { user, assistant }
```

## 3. リポジトリ詳細

### SearchRepository
```dart
class SearchRepository implements ISearchRepository {
  final SearchRemoteDataSource remoteDataSource;
  final SearchHistoryLocalDataSource historyDataSource;
  
  SearchRepository({
    required this.remoteDataSource,
    required this.historyDataSource,
  });
  
  @override
  Future<Either<Failure, PaginatedSearchResults>> search(SearchQueryEntity query) async {
    try {
      final searchQuery = query as SearchQueryModel;
      final results = await remoteDataSource.search(searchQuery);
      
      // 検索履歴に保存
      await _saveSearchHistory(searchQuery);
      
      return Right(results);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, List<SearchSuggestionEntity>>> getSuggestions(String query) async {
    try {
      if (query.isEmpty) {
        // クエリが空の場合は過去の検索履歴をサジェストとして返す
        final history = await historyDataSource.getRecentSearches(5);
        return Right(history
            .map((item) => SearchSuggestionModel(
                  text: item.query,
                  type: SearchSuggestionType.history,
                  score: 1.0,
                ))
            .toList());
      }
      
      // APIからサジェストを取得
      final suggestions = await remoteDataSource.getSuggestions(query);
      return Right(suggestions);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  // 検索履歴の保存
  Future<void> _saveSearchHistory(SearchQueryModel query) async {
    try {
      final history = SearchHistoryModel(
        id: Uuid().v4(),
        query: query.query,
        searchType: query.searchType,
        filters: query.filters,
        searchedAt: DateTime.now(),
      );
      
      await historyDataSource.saveSearchHistory(history);
    } catch (e) {
      // 履歴保存エラーはユーザー体験に影響しないので無視
      print('検索履歴の保存に失敗しました: ${e.toString()}');
    }
  }
}
```

### SearchHistoryRepository
```dart
class SearchHistoryRepository implements ISearchHistoryRepository {
  final SearchHistoryLocalDataSource localDataSource;
  
  SearchHistoryRepository({
    required this.localDataSource,
  });
  
  @override
  Future<Either<Failure, List<SearchHistoryEntity>>> getSearchHistory(int limit) async {
    try {
      final history = await localDataSource.getRecentSearches(limit);
      return Right(history);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, bool>> deleteSearchHistory(String historyId) async {
    try {
      final success = await localDataSource.deleteSearchHistory(historyId);
      return Right(success);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, bool>> clearAllSearchHistory() async {
    try {
      final success = await localDataSource.clearAllSearchHistory();
      return Right(success);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }
}
```

### ChatRepository
```dart
class ChatRepository implements IChatRepository {
  final ChatRemoteDataSource remoteDataSource;
  final ChatLocalDataSource localDataSource;
  
  ChatRepository({
    required this.remoteDataSource,
    required this.localDataSource,
  });
  
  @override
  Future<Either<Failure, ChatSessionEntity>> createSession(String title) async {
    try {
      final session = await remoteDataSource.createSession(title);
      await localDataSource.saveSession(session);
      return Right(session);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, List<ChatSessionEntity>>> getSessions() async {
    try {
      // オフラインチェック
      if (await _isOffline()) {
        final localSessions = await localDataSource.getSessions();
        return Right(localSessions);
      }
      
      // リモートからセッション一覧を取得
      final sessions = await remoteDataSource.getSessions();
      
      // ローカルキャッシュを更新
      for (var session in sessions) {
        await localDataSource.saveSession(session);
      }
      
      return Right(sessions);
    } on ServerException catch (e) {
      // オフライン時はローカルキャッシュを利用
      if (e is NetworkException) {
        final localSessions = await localDataSource.getSessions();
        return Right(localSessions);
      }
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, List<ChatMessageEntity>>> getMessages(String sessionId) async {
    try {
      // オフラインチェック
      if (await _isOffline()) {
        final localMessages = await localDataSource.getMessages(sessionId);
        return Right(localMessages);
      }
      
      // リモートからメッセージ一覧を取得
      final messages = await remoteDataSource.getMessages(sessionId);
      
      // ローカルキャッシュを更新
      for (var message in messages) {
        await localDataSource.saveMessage(message);
      }
      
      return Right(messages);
    } on ServerException catch (e) {
      // オフライン時はローカルキャッシュを利用
      if (e is NetworkException) {
        final localMessages = await localDataSource.getMessages(sessionId);
        return Right(localMessages);
      }
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, ChatMessageEntity>> sendMessage(
    String sessionId, 
    String content
  ) async {
    try {
      // ユーザーメッセージをローカルに保存（楽観的更新）
      final userMessage = ChatMessageModel(
        id: Uuid().v4(),
        sessionId: sessionId,
        userId: await _getUserId(),
        role: ChatRole.user,
        content: content,
        createdAt: DateTime.now(),
      );
      
      await localDataSource.saveMessage(userMessage);
      
      // APIにメッセージを送信
      final response = await remoteDataSource.sendMessage(sessionId, content);
      
      // AIの応答をローカルに保存
      await localDataSource.saveMessage(response);
      
      // セッション情報を更新
      final session = await localDataSource.getSession(sessionId);
      if (session != null) {
        final updatedSession = (session as ChatSessionModel).copyWith(
          messageCount: session.messageCount + 2, // ユーザーとAIのメッセージ
          lastMessage: response.content,
        );
        await localDataSource.saveSession(updatedSession);
      }
      
      return Right(response);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, bool>> deleteSession(String sessionId) async {
    try {
      final success = await remoteDataSource.deleteSession(sessionId);
      if (success) {
        await localDataSource.deleteSession(sessionId);
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
  
  // ユーザーID取得
  Future<String> _getUserId() async {
    // 実際の実装ではAuthサービスからユーザーIDを取得
    final secureStorage = FlutterSecureStorage();
    return await secureStorage.read(key: 'user_id') ?? '';
  }
}
```

## 4. データソース詳細

### SearchRemoteDataSource
```dart
abstract class SearchRemoteDataSource {
  Future<PaginatedSearchResults> search(SearchQueryModel query);
  Future<List<SearchSuggestionModel>> getSuggestions(String query);
}

class SearchRemoteDataSourceImpl implements SearchRemoteDataSource {
  final http.Client client;
  final String baseUrl;
  
  SearchRemoteDataSourceImpl({
    required this.client,
    this.baseUrl = 'https://api.kanushi.app/v1',
  });
  
  @override
  Future<PaginatedSearchResults> search(SearchQueryModel query) async {
    try {
      // クエリパラメータの構築
      final queryParams = {
        'q': query.query,
        'type': query.searchType.name,
        'limit': query.limit.toString(),
        'offset': query.offset.toString(),
      };
      
      // フィルターパラメータの追加
      query.filters.forEach((key, value) {
        queryParams[key] = value.toString();
      });
      
      final uri = Uri.parse('$baseUrl/search').replace(
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
        return PaginatedSearchResults.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '検索に失敗しました',
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
  Future<List<SearchSuggestionModel>> getSuggestions(String query) async {
    try {
      final uri = Uri.parse('$baseUrl/search/suggestions').replace(
        queryParameters: {
          'q': query,
        },
      );
      
      final response = await client.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> suggestionsJson = json.decode(response.body);
        return suggestionsJson
            .map((json) => SearchSuggestionModel.fromJson(json))
            .toList();
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? 'サジェスト取得に失敗しました',
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

### SearchHistoryLocalDataSource
```dart
abstract class SearchHistoryLocalDataSource {
  Future<List<SearchHistoryModel>> getRecentSearches(int limit);
  Future<void> saveSearchHistory(SearchHistoryModel history);
  Future<bool> deleteSearchHistory(String historyId);
  Future<bool> clearAllSearchHistory();
}

class SearchHistoryLocalDataSourceImpl implements SearchHistoryLocalDataSource {
  final Box<dynamic> historyBox;
  
  SearchHistoryLocalDataSourceImpl({
    required this.historyBox,
  });
  
  @override
  Future<List<SearchHistoryModel>> getRecentSearches(int limit) async {
    try {
      // すべての履歴を取得
      final allHistory = historyBox.values
          .map((json) => SearchHistoryModel.fromJson(json))
          .toList();
      
      // 日付でソート（最新順）
      allHistory.sort((a, b) => b.searchedAt.compareTo(a.searchedAt));
      
      // 指定された数だけ返す
      return allHistory.take(limit).toList();
    } catch (e) {
      throw CacheException('検索履歴の取得に失敗しました: ${e.toString()}');
    }
  }
  
  @override
  Future<void> saveSearchHistory(SearchHistoryModel history) async {
    try {
      await historyBox.put(
        history.id,
        history.toJson(),
      );
      
      // 履歴が100件を超えたら古いものから削除
      if (historyBox.length > 100) {
        final allHistory = historyBox.values
            .map((json) => SearchHistoryModel.fromJson(json))
            .toList();
        
        allHistory.sort((a, b) => a.searchedAt.compareTo(b.searchedAt));
        
        // 最も古い履歴を削除
        for (int i = 0; i < allHistory.length - 100; i++) {
          await historyBox.delete(allHistory[i].id);
        }
      }
    } catch (e) {
      throw CacheException('検索履歴の保存に失敗しました: ${e.toString()}');
    }
  }
  
  @override
  Future<bool> deleteSearchHistory(String historyId) async {
    try {
      await historyBox.delete(historyId);
      return true;
    } catch (e) {
      throw CacheException('検索履歴の削除に失敗しました: ${e.toString()}');
    }
  }
  
  @override
  Future<bool> clearAllSearchHistory() async {
    try {
      await historyBox.clear();
      return true;
    } catch (e) {
      throw CacheException('検索履歴のクリアに失敗しました: ${e.toString()}');
    }
  }
}
```

### ChatRemoteDataSource
```dart
abstract class ChatRemoteDataSource {
  Future<ChatSessionModel> createSession(String title);
  Future<List<ChatSessionModel>> getSessions();
  Future<List<ChatMessageModel>> getMessages(String sessionId);
  Future<ChatMessageModel> sendMessage(String sessionId, String content);
  Future<bool> deleteSession(String sessionId);
}

class ChatRemoteDataSourceImpl implements ChatRemoteDataSource {
  final http.Client client;
  final String baseUrl;
  
  ChatRemoteDataSourceImpl({
    required this.client,
    this.baseUrl = 'https://api.kanushi.app/v1',
  });
  
  @override
  Future<ChatSessionModel> createSession(String title) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/chat/sessions'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode({
          'title': title,
        }),
      );
      
      if (response.statusCode == 201) {
        return ChatSessionModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? 'チャットセッションの作成に失敗しました',
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
  Future<List<ChatSessionModel>> getSessions() async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/chat/sessions'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> sessionsJson = json.decode(response.body);
        return sessionsJson
            .map((json) => ChatSessionModel.fromJson(json))
            .toList();
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? 'チャットセッション一覧の取得に失敗しました',
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
  Future<List<ChatMessageModel>> getMessages(String sessionId) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/chat/sessions/$sessionId/messages'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> messagesJson = json.decode(response.body);
        return messagesJson
            .map((json) => ChatMessageModel.fromJson(json))
            .toList();
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? 'チャットメッセージの取得に失敗しました',
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
  Future<ChatMessageModel> sendMessage(String sessionId, String content) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/chat/sessions/$sessionId/messages'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode({
          'content': content,
        }),
      );
      
      if (response.statusCode == 201) {
        return ChatMessageModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? 'メッセージの送信に失敗しました',
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
  Future<bool> deleteSession(String sessionId) async {
    try {
      final response = await client.delete(
        Uri.parse('$baseUrl/chat/sessions/$sessionId'),
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

### ChatLocalDataSource
```dart
abstract class ChatLocalDataSource {
  Future<ChatSessionModel?> getSession(String sessionId);
  Future<List<ChatSessionModel>> getSessions();
  Future<void> saveSession(ChatSessionModel session);
  Future<bool> deleteSession(String sessionId);
  
  Future<List<ChatMessageModel>> getMessages(String sessionId);
  Future<void> saveMessage(ChatMessageModel message);
}

class ChatLocalDataSourceImpl implements ChatLocalDataSource {
  final Box<dynamic> sessionsBox;
  final Box<dynamic> messagesBox;
  
  ChatLocalDataSourceImpl({
    required this.sessionsBox,
    required this.messagesBox,
  });
  
  @override
  Future<ChatSessionModel?> getSession(String sessionId) async {
    try {
      final json = sessionsBox.get(sessionId);
      if (json != null) {
        return ChatSessionModel.fromJson(json);
      }
      return null;
    } catch (e) {
      throw CacheException('チャットセッションの取得に失敗しました: ${e.toString()}');
    }
  }
  
  @override
  Future<List<ChatSessionModel>> getSessions() async {
    try {
      return sessionsBox.values
          .map((json) => ChatSessionModel.fromJson(json))
          .toList();
    } catch (e) {
      throw CacheException('チャットセッション一覧の取得に失敗しました: ${e.toString()}');
    }
  }
  
  @override
  Future<void> saveSession(ChatSessionModel session) async {
    try {
      await sessionsBox.put(
        session.id,
        session.toJson(),
      );
    } catch (e) {
      throw CacheException('チャットセッションの保存に失敗しました: ${e.toString()}');
    }
  }
  
  @override
  Future<bool> deleteSession(String sessionId) async {
    try {
      await sessionsBox.delete(sessionId);
      
      // セッションに関連するメッセージも削除
      final messages = await getMessages(sessionId);
      for (var message in messages) {
        await messagesBox.delete(message.id);
      }
      
      return true;
    } catch (e) {
      throw CacheException('チャットセッションの削除に失敗しました: ${e.toString()}');
    }
  }
  
  @override
  Future<List<ChatMessageModel>> getMessages(String sessionId) async {
    try {
      final messages = messagesBox.values
          .map((json) => ChatMessageModel.fromJson(json))
          .where((message) => message.sessionId == sessionId)
          .toList();
      
      // 作成日時でソート
      messages.sort((a, b) => a.createdAt.compareTo(b.createdAt));
      
      return messages;
    } catch (e) {
      throw CacheException('チャットメッセージの取得に失敗しました: ${e.toString()}');
    }
  }
  
  @override
  Future<void> saveMessage(ChatMessageModel message) async {
    try {
      await messagesBox.put(
        message.id,
        message.toJson(),
      );
    } catch (e) {
      throw CacheException('チャットメッセージの保存に失敗しました: ${e.toString()}');
    }
  }
}
```

## 5. ユースケース詳細

### SearchUseCase
```dart
class SearchUseCase {
  final ISearchRepository repository;
  
  SearchUseCase({required this.repository});
  
  Future<Either<Failure, PaginatedSearchResults>> call(SearchQueryEntity query) async {
    return repository.search(query);
  }
}
```

### GetSearchSuggestionsUseCase
```dart
class GetSearchSuggestionsUseCase {
  final ISearchRepository repository;
  
  GetSearchSuggestionsUseCase({required this.repository});
  
  Future<Either<Failure, List<SearchSuggestionEntity>>> call(String query) async {
    return repository.getSuggestions(query);
  }
}
```

### GetSearchHistoryUseCase
```dart
class GetSearchHistoryUseCase {
  final ISearchHistoryRepository repository;
  
  GetSearchHistoryUseCase({required this.repository});
  
  Future<Either<Failure, List<SearchHistoryEntity>>> call(int limit) async {
    return repository.getSearchHistory(limit);
  }
}
```

### DeleteSearchHistoryUseCase
```dart
class DeleteSearchHistoryUseCase {
  final ISearchHistoryRepository repository;
  
  DeleteSearchHistoryUseCase({required this.repository});
  
  Future<Either<Failure, bool>> call(String historyId) async {
    return repository.deleteSearchHistory(historyId);
  }
}
```

### CreateChatSessionUseCase
```dart
class CreateChatSessionUseCase {
  final IChatRepository repository;
  
  CreateChatSessionUseCase({required this.repository});
  
  Future<Either<Failure, ChatSessionEntity>> call(String title) async {
    return repository.createSession(title);
  }
}
```

### SendChatMessageUseCase
```dart
class SendChatMessageUseCase {
  final IChatRepository repository;
  
  SendChatMessageUseCase({required this.repository});
  
  Future<Either<Failure, ChatMessageEntity>> call(
    String sessionId, 
    String content
  ) async {
    return repository.sendMessage(sessionId, content);
  }
}
```

### GetChatSessionsUseCase
```dart
class GetChatSessionsUseCase {
  final IChatRepository repository;
  
  GetChatSessionsUseCase({required this.repository});
  
  Future<Either<Failure, List<ChatSessionEntity>>> call() async {
    return repository.getSessions();
  }
}
```

### GetChatMessagesUseCase
```dart
class GetChatMessagesUseCase {
  final IChatRepository repository;
  
  GetChatMessagesUseCase({required this.repository});
  
  Future<Either<Failure, List<ChatMessageEntity>>> call(String sessionId) async {
    return repository.getMessages(sessionId);
  }
}
```

### DeleteChatSessionUseCase
```dart
class DeleteChatSessionUseCase {
  final IChatRepository repository;
  
  DeleteChatSessionUseCase({required this.repository});
  
  Future<Either<Failure, bool>> call(String sessionId) async {
    return repository.deleteSession(sessionId);
  }
}
```

## 6. ビューモデル詳細

### SearchViewModel
```dart
class SearchViewModel extends StateNotifier<SearchState> {
  final SearchUseCase searchUseCase;
  final GetSearchSuggestionsUseCase getSuggestionsUseCase;
  final GetSearchHistoryUseCase getHistoryUseCase;
  
  SearchViewModel({
    required this.searchUseCase,
    required this.getSuggestionsUseCase,
    required this.getHistoryUseCase,
  }) : super(SearchInitial());
  
  // 現在の検索クエリ
  SearchQueryModel _currentQuery = SearchQueryModel(query: '');
  
  SearchQueryModel get currentQuery => _currentQuery;
  
  // 検索実行
  Future<void> search({
    String? query,
    SearchType? searchType,
    Map<String, dynamic>? filters,
    int limit = 20,
    int offset = 0,
    bool isLoadMore = false,
  }) async {
    // クエリ更新
    if (query != null || searchType != null || filters != null) {
      _currentQuery = _currentQuery.copyWith(
        query: query,
        searchType: searchType,
        filters: filters,
        limit: limit,
        offset: offset,
      );
    }
    
    // クエリが空の場合は履歴表示
    if (_currentQuery.query.isEmpty) {
      await _loadSearchHistory();
      return;
    }
    
    // 読み込み状態に更新
    if (isLoadMore) {
      state = SearchLoadingMore((state as SearchResultsLoaded).results);
    } else {
      state = SearchLoading();
    }
    
    // 検索実行
    final result = await searchUseCase(_currentQuery);
    
    result.fold(
      (failure) => state = SearchError(failure.message),
      (results) {
        if (isLoadMore && state is SearchLoadingMore) {
          // 既存の結果に追加
          final currentResults = (state as SearchLoadingMore).results;
          
          state = SearchResultsLoaded(
            PaginatedSearchResults(
              results: [...currentResults.results, ...results.results],
              total: results.total,
              offset: results.offset,
              limit: results.limit,
              hasMore: results.hasMore,
            ),
          );
        } else {
          // 新しい結果をセット
          state = SearchResultsLoaded(results);
        }
      },
    );
  }
  
  // サジェスト取得
  Future<void> getSuggestions(String query) async {
    if (query.isEmpty) {
      await _loadSearchHistory();
      return;
    }
    
    state = SearchSuggestionsLoading();
    
    final result = await getSuggestionsUseCase(query);
    
    result.fold(
      (failure) => state = SearchError(failure.message),
      (suggestions) => state = SearchSuggestionsLoaded(suggestions),
    );
  }
  
  // 検索履歴読み込み
  Future<void> _loadSearchHistory() async {
    state = SearchHistoryLoading();
    
    final result = await getHistoryUseCase(10);
    
    result.fold(
      (failure) => state = SearchError(failure.message),
      (history) => state = SearchHistoryLoaded(history),
    );
  }
  
  // 検索タイプ変更
  void setSearchType(SearchType type) {
    if (_currentQuery.searchType != type) {
      _currentQuery = _currentQuery.copyWith(searchType: type);
      if (_currentQuery.query.isNotEmpty) {
        search();
      }
    }
  }
  
  // フィルター適用
  void applyFilters(Map<String, dynamic> filters) {
    _currentQuery = _currentQuery.copyWith(
      filters: {..._currentQuery.filters, ...filters},
      offset: 0, // フィルター変更時はオフセットをリセット
    );
    
    if (_currentQuery.query.isNotEmpty) {
      search();
    }
  }
  
  // 次のページ読み込み
  Future<void> loadMore() async {
    if (state is SearchResultsLoaded) {
      final results = (state as SearchResultsLoaded).results;
      
      if (results.hasMore) {
        final newOffset = results.offset + results.limit;
        
        await search(
          offset: newOffset,
          isLoadMore: true,
        );
      }
    }
  }
}

// 状態定義
abstract class SearchState {}

class SearchInitial extends SearchState {}

class SearchLoading extends SearchState {}

class SearchLoadingMore extends SearchState {
  final PaginatedSearchResults results;
  SearchLoadingMore(this.results);
}

class SearchResultsLoaded extends SearchState {
  final PaginatedSearchResults results;
  SearchResultsLoaded(this.results);
}

class SearchSuggestionsLoading extends SearchState {}

class SearchSuggestionsLoaded extends SearchState {
  final List<SearchSuggestionEntity> suggestions;
  SearchSuggestionsLoaded(this.suggestions);
}

class SearchHistoryLoading extends SearchState {}

class SearchHistoryLoaded extends SearchState {
  final List<SearchHistoryEntity> history;
  SearchHistoryLoaded(this.history);
}

class SearchError extends SearchState {
  final String message;
  SearchError(this.message);
}
```

### SearchHistoryViewModel
```dart
class SearchHistoryViewModel extends StateNotifier<SearchHistoryState> {
  final GetSearchHistoryUseCase getHistoryUseCase;
  final DeleteSearchHistoryUseCase deleteHistoryUseCase;
  final ISearchHistoryRepository historyRepository;
  
  SearchHistoryViewModel({
    required this.getHistoryUseCase,
    required this.deleteHistoryUseCase,
    required this.historyRepository,
  }) : super(SearchHistoryInitial());
  
  Future<void> getSearchHistory({int limit = 20}) async {
    state = SearchHistoryLoading();
    
    final result = await getHistoryUseCase(limit);
    
    result.fold(
      (failure) => state = SearchHistoryError(failure.message),
      (history) => state = SearchHistoryLoaded(history),
    );
  }
  
  Future<void> deleteSearchHistory(String historyId) async {
    if (state is SearchHistoryLoaded) {
      final currentHistory = (state as SearchHistoryLoaded).history;
      
      // 楽観的更新（UI向け）
      final updatedHistory = currentHistory
          .where((item) => item.id != historyId)
          .toList();
      
      state = SearchHistoryLoaded(updatedHistory);
      
      // 実際の削除処理
      final result = await deleteHistoryUseCase(historyId);
      
      result.fold(
        (failure) {
          // 失敗した場合は元の状態に戻す
          state = SearchHistoryLoaded(currentHistory);
          state = SearchHistoryError(failure.message);
        },
        (_) => {}, // 成功した場合は既に反映済み
      );
    }
  }
  
  Future<void> clearAllSearchHistory() async {
    state = SearchHistoryClearing();
    
    final result = await historyRepository.clearAllSearchHistory();
    
    result.fold(
      (failure) => state = SearchHistoryError(failure.message),
      (_) {
        state = SearchHistoryLoaded([]);
      },
    );
  }
}

// 状態定義
abstract class SearchHistoryState {}

class SearchHistoryInitial extends SearchHistoryState {}

class SearchHistoryLoading extends SearchHistoryState {}

class SearchHistoryClearing extends SearchHistoryState {}

class SearchHistoryLoaded extends SearchHistoryState {
  final List<SearchHistoryEntity> history;
  SearchHistoryLoaded(this.history);
}

class SearchHistoryError extends SearchHistoryState {
  final String message;
  SearchHistoryError(this.message);
}
```

### AIChatViewModel
```dart
class AIChatViewModel extends StateNotifier<AIChatState> {
  final CreateChatSessionUseCase createSessionUseCase;
  final SendChatMessageUseCase sendMessageUseCase;
  final GetChatMessagesUseCase getMessagesUseCase;
  
  AIChatViewModel({
    required this.createSessionUseCase,
    required this.sendMessageUseCase,
    required this.getMessagesUseCase,
  }) : super(AIChatInitial());
  
  // 現在のセッションID
  String? _currentSessionId;
  
  String? get currentSessionId => _currentSessionId;
  
  // 新しいセッション作成
  Future<void> createSession(String title) async {
    state = AIChatLoading();
    
    final result = await createSessionUseCase(title);
    
    result.fold(
      (failure) => state = AIChatError(failure.message),
      (session) {
        _currentSessionId = session.id;
        state = AIChatReady(session, []);
      },
    );
  }
  
  // 既存セッションの読み込み
  Future<void> loadSession(String sessionId) async {
    state = AIChatLoading();
    
    _currentSessionId = sessionId;
    
    final result = await getMessagesUseCase(sessionId);
    
    result.fold(
      (failure) => state = AIChatError(failure.message),
      (messages) {
        final session = ChatSessionModel(
          id: sessionId,
          userId: '', // セッション詳細は別途取得する必要あり
          title: 'チャットセッション',
          createdAt: DateTime.now(),
          messageCount: messages.length,
        );
        
        state = AIChatReady(session, messages);
      },
    );
  }
  
  // メッセージ送信
  Future<void> sendMessage(String content) async {
    if (_currentSessionId == null) {
      state = AIChatError('アクティブなセッションがありません');
      return;
    }
    
    if (state is AIChatReady) {
      final currentState = state as AIChatReady;
      final session = currentState.session;
      final currentMessages = currentState.messages;
      
      // ユーザーメッセージを追加（UI更新用）
      final userMessage = ChatMessageModel(
        id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
        sessionId: _currentSessionId!,
        userId: '',
        role: ChatRole.user,
        content: content,
        createdAt: DateTime.now(),
      );
      
      state = AIChatTyping(
        session,
        [...currentMessages, userMessage],
      );
      
      // メッセージ送信
      final result = await sendMessageUseCase(_currentSessionId!, content);
      
      result.fold(
        (failure) {
          // 送信失敗
          state = AIChatReady(session, currentMessages);
          state = AIChatError(failure.message);
        },
        (aiMessage) {
          // AIの応答を追加
          final updatedMessages = [
            ...currentMessages,
            userMessage,
            aiMessage,
          ];
          
          state = AIChatReady(session, updatedMessages);
        },
      );
    }
  }
}

// 状態定義
abstract class AIChatState {}

class AIChatInitial extends AIChatState {}

class AIChatLoading extends AIChatState {}

class AIChatReady extends AIChatState {
  final ChatSessionEntity session;
  final List<ChatMessageEntity> messages;
  AIChatReady(this.session, this.messages);
}

class AIChatTyping extends AIChatState {
  final ChatSessionEntity session;
  final List<ChatMessageEntity> messages;
  AIChatTyping(this.session, this.messages);
}

class AIChatError extends AIChatState {
  final String message;
  AIChatError(this.message);
}
```

### ChatHistoryViewModel
```dart
class ChatHistoryViewModel extends StateNotifier<ChatHistoryState> {
  final GetChatSessionsUseCase getSessionsUseCase;
  final DeleteChatSessionUseCase deleteSessionUseCase;
  
  ChatHistoryViewModel({
    required this.getSessionsUseCase,
    required this.deleteSessionUseCase,
  }) : super(ChatHistoryInitial());
  
  Future<void> getSessions() async {
    state = ChatHistoryLoading();
    
    final result = await getSessionsUseCase();
    
    result.fold(
      (failure) => state = ChatHistoryError(failure.message),
      (sessions) => state = ChatHistoryLoaded(sessions),
    );
  }
  
  Future<void> deleteSession(String sessionId) async {
    if (state is ChatHistoryLoaded) {
      final currentSessions = (state as ChatHistoryLoaded).sessions;
      
      // 楽観的更新
      final updatedSessions = currentSessions
          .where((session) => session.id != sessionId)
          .toList();
      
      state = ChatHistoryLoaded(updatedSessions);
      
      // 実際の削除処理
      final result = await deleteSessionUseCase(sessionId);
      
      result.fold(
        (failure) {
          // 失敗した場合は元の状態に戻す
          state = ChatHistoryLoaded(currentSessions);
          state = ChatHistoryError(failure.message);
        },
        (_) => {}, // 成功した場合は既に反映済み
      );
    }
  }
}

// 状態定義
abstract class ChatHistoryState {}

class ChatHistoryInitial extends ChatHistoryState {}

class ChatHistoryLoading extends ChatHistoryState {}

class ChatHistoryLoaded extends ChatHistoryState {
  final List<ChatSessionEntity> sessions;
  ChatHistoryLoaded(this.sessions);
}

class ChatHistoryError extends ChatHistoryState {
  final String message;
  ChatHistoryError(this.message);
}
```

## 7. 依存性注入設定

```dart
// 依存性注入の設定
final searchDomainModule = [
  // データソース
  Provider<SearchRemoteDataSource>(
    (ref) => SearchRemoteDataSourceImpl(
      client: ref.watch(httpClientProvider),
    ),
  ),
  Provider<SearchHistoryLocalDataSource>(
    (ref) => SearchHistoryLocalDataSourceImpl(
      historyBox: ref.watch(searchHistoryBoxProvider),
    ),
  ),
  Provider<ChatRemoteDataSource>(
    (ref) => ChatRemoteDataSourceImpl(
      client: ref.watch(httpClientProvider),
    ),
  ),
  Provider<ChatLocalDataSource>(
    (ref) => ChatLocalDataSourceImpl(
      sessionsBox: ref.watch(chatSessionsBoxProvider),
      messagesBox: ref.watch(chatMessagesBoxProvider),
    ),
  ),
  
  // リポジトリ
  Provider<ISearchRepository>(
    (ref) => SearchRepository(
      remoteDataSource: ref.watch(searchRemoteDataSourceProvider),
      historyDataSource: ref.watch(searchHistoryLocalDataSourceProvider),
    ),
  ),
  Provider<ISearchHistoryRepository>(
    (ref) => SearchHistoryRepository(
      localDataSource: ref.watch(searchHistoryLocalDataSourceProvider),
    ),
  ),
  Provider<IChatRepository>(
    (ref) => ChatRepository(
      remoteDataSource: ref.watch(chatRemoteDataSourceProvider),
      localDataSource: ref.watch(chatLocalDataSourceProvider),
    ),
  ),
  
  // ユースケース
  Provider<SearchUseCase>(
    (ref) => SearchUseCase(
      repository: ref.watch(searchRepositoryProvider),
    ),
  ),
  Provider<GetSearchSuggestionsUseCase>(
    (ref) => GetSearchSuggestionsUseCase(
      repository: ref.watch(searchRepositoryProvider),
    ),
  ),
  Provider<GetSearchHistoryUseCase>(
    (ref) => GetSearchHistoryUseCase(
      repository: ref.watch(searchHistoryRepositoryProvider),
    ),
  ),
  Provider<DeleteSearchHistoryUseCase>(
    (ref) => DeleteSearchHistoryUseCase(
      repository: ref.watch(searchHistoryRepositoryProvider),
    ),
  ),
  Provider<CreateChatSessionUseCase>(
    (ref) => CreateChatSessionUseCase(
      repository: ref.watch(chatRepositoryProvider),
    ),
  ),
  Provider<SendChatMessageUseCase>(
    (ref) => SendChatMessageUseCase(
      repository: ref.watch(chatRepositoryProvider),
    ),
  ),
  Provider<GetChatSessionsUseCase>(
    (ref) => GetChatSessionsUseCase(
      repository: ref.watch(chatRepositoryProvider),
    ),
  ),
  Provider<GetChatMessagesUseCase>(
    (ref) => GetChatMessagesUseCase(
      repository: ref.watch(chatRepositoryProvider),
    ),
  ),
  Provider<DeleteChatSessionUseCase>(
    (ref) => DeleteChatSessionUseCase(
      repository: ref.watch(chatRepositoryProvider),
    ),
  ),
  
  // ビューモデル
  StateNotifierProvider<SearchViewModel, SearchState>(
    (ref) => SearchViewModel(
      searchUseCase: ref.watch(searchUseCaseProvider),
      getSuggestionsUseCase: ref.watch(getSearchSuggestionsUseCaseProvider),
      getHistoryUseCase: ref.watch(getSearchHistoryUseCaseProvider),
    ),
  ),
  StateNotifierProvider<SearchHistoryViewModel, SearchHistoryState>(
    (ref) => SearchHistoryViewModel(
      getHistoryUseCase: ref.watch(getSearchHistoryUseCaseProvider),
      deleteHistoryUseCase: ref.watch(deleteSearchHistoryUseCaseProvider),
      historyRepository: ref.watch(searchHistoryRepositoryProvider),
    ),
  ),
  StateNotifierProvider<AIChatViewModel, AIChatState>(
    (ref) => AIChatViewModel(
      createSessionUseCase: ref.watch(createChatSessionUseCaseProvider),
      sendMessageUseCase: ref.watch(sendChatMessageUseCaseProvider),
      getMessagesUseCase: ref.watch(getChatMessagesUseCaseProvider),
    ),
  ),
  StateNotifierProvider<ChatHistoryViewModel, ChatHistoryState>(
    (ref) => ChatHistoryViewModel(
      getSessionsUseCase: ref.watch(getChatSessionsUseCaseProvider),
      deleteSessionUseCase: ref.watch(deleteChatSessionUseCaseProvider),
    ),
  ),
];
```

## 8. セキュリティ考慮事項

1. **検索クエリのセキュリティ**
   - インジェクション攻撃の防止
   - 検索クエリのサニタイズ処理
   - レート制限による検索DoS攻撃の防止
   - 検索履歴の暗号化保存

2. **チャットセキュリティ**
   - ユーザー間のチャットデータの分離
   - AIモデルへの入力のバリデーション
   - プロンプトインジェクション対策
   - チャット履歴の適切な暗号化

3. **API通信のセキュリティ**
   - すべての通信でのTLS/SSL暗号化
   - APIキーの安全な管理
   - トークンベースの認証
   - JWTの適切な有効期限設定

4. **プライバシー保護**
   - ユーザーの検索履歴削除機能
   - チャットセッションの削除機能
   - センシティブ情報の適切な扱い
   - データアクセスの監査ログ

## 9. パフォーマンス最適化

1. **検索パフォーマンス**
   - サジェスト機能のデバウンス処理
   - ページネーションによるデータロード最適化
   - 検索結果のキャッシュ
   - 検索インデックスの最適化（サーバーサイド）

2. **オフライン対応**
   - チャット履歴のローカル保存
   - オフライン時の基本機能提供
   - バックグラウンド同期機能

3. **AI応答の最適化**
   - ストリーミングレスポンスの実装
   - タイピングインジケーターの表示
   - レスポンス時間の最適化

4. **リソース使用の最適化**
   - 画像のレイジーロード
   - チャットログの効率的なストレージ
   - 古いチャットデータの圧縮保存

## 10. エラーハンドリング戦略

```dart
// 汎用エラーハンドラー
void handleSearchError(BuildContext context, String message) {
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
  
  // サーバーエラー
  if (message.contains('サーバー')) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('サーバーエラーが発生しました。しばらく経ってから再試行してください'),
      ),
    );
    return;
  }
  
  // AIエラー
  if (message.contains('AI') || message.contains('モデル')) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('AIサービスが一時的に利用できません。しばらく経ってから再試行してください'),
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

// AI応答エラーの特殊ハンドリング
Widget buildAIErrorMessage(BuildContext context, String errorMessage) {
  return Container(
    padding: EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.red.withOpacity(0.1),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'AIの応答中にエラーが発生しました',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Colors.red,
          ),
        ),
        SizedBox(height: 8),
        Text(errorMessage),
        SizedBox(height: 12),
        OutlinedButton(
          onPressed: () {
            // 再送信ロジック
          },
          child: Text('メッセージを再送信'),
        ),
      ],
    ),
  );
}
```

## 11. テスト戦略

### 単体テスト
- 検索クエリ構築ロジックのテスト
- 検索結果解析ロジックのテスト
- リポジトリの各メソッドのテスト
- モデルのシリアライズ/デシリアライズのテスト
- ビューモデルの状態管理テスト

### 統合テスト
- 検索からフィルタリングまでのフロー
- チャットセッション作成から応答までのフロー
- 検索履歴の保存と取得のフロー
- オフライン対応のエラーハンドリングとフォールバック

### UIテスト
- 検索バーの表示と操作
- 検索結果の表示と無限スクロール
- チャットUIの表示と入力
- エラー状態からの回復
- チャットタイピングインジケーターの動作

## 12. FAQ的な実装上の注意点

1. **検索機能の使用制限について**
   - 1日あたりの検索上限は5回に設定
   - 制限は一般検索とAI検索で別々にカウント
   - 制限到達時はユーザーに通知と代替手段を提示

2. **AIモデルの制約**
   - Gemini 2.5 Proの特性（トークン数制限など）
   - コンテキスト保持の範囲と制限
   - API応答速度とUI表示の調整方法

3. **検索結果の表示優先度**
   - 最新のコンテンツに高い優先度を付与
   - ユーザーのフォロー関係に基づく優先順位付け
   - 「いいね」や「ハイライト」数に基づく関連性スコア調整

4. **オフライン状態の考慮**
   - オフライン時に検索履歴のみ表示
   - チャットはオフライン時に制限付きで利用可能
   - 同期状態の明示的な表示でユーザー混乱を防止