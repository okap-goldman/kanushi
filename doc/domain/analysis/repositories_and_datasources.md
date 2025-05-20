# 分析ドメイン - リポジトリとデータソース詳細

## 1. リポジトリ詳細

### 1.1 IAnalysisRepository インターフェース

```dart
abstract class IAnalysisRepository {
  /// ユーザーの現在の目醒め度を取得
  Future<Either<Failure, AwakeningLevelEntity>> getAwakeningLevel(String userId);
  
  /// ユーザーへの洞察リストを取得
  Future<Either<Failure, List<InsightEntity>>> getInsights(String userId);
  
  /// ユーザーへの次のステップ提案リストを取得
  Future<Either<Failure, List<NextActionEntity>>> getNextActions(String userId);
  
  /// 次のステップ提案を完了済みとしてマーク
  Future<Either<Failure, bool>> completeNextAction(String actionId, String userId);
  
  /// 分析に対するフィードバックを送信
  Future<Either<Failure, bool>> submitAnalysisFeedback(AnalysisFeedback feedback);
}
```

### 1.2 IUserActivityRepository インターフェース

```dart
abstract class IUserActivityRepository {
  /// ユーザーの活動データを指定期間で取得
  Future<Either<Failure, ActivityDataEntity>> getActivityData(String userId, {
    required DateTime startDate,
    required DateTime endDate,
  });
  
  /// 新しいユーザーアクティビティを記録
  Future<Either<Failure, bool>> logUserActivity(UserActivityLog activity);
}
```

### 1.3 AnalysisRepository 実装

```dart
class AnalysisRepository implements IAnalysisRepository {
  final AnalysisRemoteDataSource remoteDataSource;
  final AnalysisLocalDataSource localDataSource;
  final NetworkInfo networkInfo;
  
  AnalysisRepository({
    required this.remoteDataSource,
    required this.localDataSource,
    required this.networkInfo,
  });
  
  @override
  Future<Either<Failure, AwakeningLevelEntity>> getAwakeningLevel(String userId) async {
    if (await networkInfo.isConnected) {
      try {
        final remoteAwakeningLevel = await remoteDataSource.getAwakeningLevel(userId);
        await localDataSource.cacheAwakeningLevel(remoteAwakeningLevel);
        return Right(remoteAwakeningLevel);
      } on ServerException {
        return Left(ServerFailure());
      }
    } else {
      try {
        final localAwakeningLevel = await localDataSource.getLastAwakeningLevel();
        return Right(localAwakeningLevel);
      } on CacheException {
        return Left(CacheFailure());
      }
    }
  }
  
  @override
  Future<Either<Failure, List<InsightEntity>>> getInsights(String userId) async {
    if (await networkInfo.isConnected) {
      try {
        final remoteInsights = await remoteDataSource.getInsights(userId);
        await localDataSource.cacheInsights(remoteInsights);
        return Right(remoteInsights);
      } on ServerException {
        return Left(ServerFailure());
      }
    } else {
      try {
        final localInsights = await localDataSource.getLastInsights();
        return Right(localInsights);
      } on CacheException {
        return Left(CacheFailure());
      }
    }
  }
  
  @override
  Future<Either<Failure, List<NextActionEntity>>> getNextActions(String userId) async {
    if (await networkInfo.isConnected) {
      try {
        final remoteNextActions = await remoteDataSource.getNextActions(userId);
        await localDataSource.cacheNextActions(remoteNextActions);
        return Right(remoteNextActions);
      } on ServerException {
        return Left(ServerFailure());
      }
    } else {
      try {
        final localNextActions = await localDataSource.getLastNextActions();
        return Right(localNextActions);
      } on CacheException {
        return Left(CacheFailure());
      }
    }
  }
  
  @override
  Future<Either<Failure, bool>> completeNextAction(String actionId, String userId) async {
    if (await networkInfo.isConnected) {
      try {
        final result = await remoteDataSource.completeNextAction(actionId, userId);
        if (result) {
          // ローカルキャッシュも更新
          await localDataSource.updateNextActionStatus(actionId, ActionStatus.completed);
        }
        return Right(result);
      } on ServerException {
        return Left(ServerFailure());
      }
    } else {
      return Left(NetworkFailure());
    }
  }
  
  @override
  Future<Either<Failure, bool>> submitAnalysisFeedback(AnalysisFeedback feedback) async {
    if (await networkInfo.isConnected) {
      try {
        final result = await remoteDataSource.submitAnalysisFeedback(feedback);
        return Right(result);
      } on ServerException {
        return Left(ServerFailure());
      }
    } else {
      // オフライン時はキューに保存して後で送信
      await localDataSource.queueAnalysisFeedback(feedback);
      return const Right(true);
    }
  }
}
```

## 2. データソース詳細

### 2.1 AnalysisRemoteDataSource 実装

```dart
class AnalysisRemoteDataSource {
  final http.Client client;
  final String baseUrl;
  
  AnalysisRemoteDataSource({
    required this.client,
    required this.baseUrl,
  });
  
  Future<String> _getAuthToken() async {
    final secureStorage = FlutterSecureStorage();
    return await secureStorage.read(key: 'auth_token') ?? '';
  }
  
  Future<AwakeningLevelModel> getAwakeningLevel(String userId) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/analysis/awakening-level?userId=$userId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        return AwakeningLevelModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '目醒め度データの取得に失敗しました',
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
  
  Future<List<InsightModel>> getInsights(String userId) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/analysis/insights?userId=$userId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> insightsJson = json.decode(response.body);
        return insightsJson.map((json) => InsightModel.fromJson(json)).toList();
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '洞察データの取得に失敗しました',
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
}
```