# 分析ドメインテスト仕様書

本ドキュメントでは、分析ドメインの機能を検証するためのテスト仕様を定義します。テストは単体テスト、統合テスト、UIテスト、パフォーマンステスト、AI/ML検証テスト、国際化テスト、長期的品質検証テストの7つのレベルで実施します。テスト優先度に基づき、効率的なテスト実行を行います。

# 改訂履歴
- 2025/05/03: テスト実装アプローチの改善

# 基本テスト方針

## テスト駆動開発アプローチ
本プロジェクトでは可能な限りテスト駆動開発(TDD)アプローチを採用します。テスト仕様に基づいた最小限のインターフェース定義を先に行うことで、実装とテストの整合性を高めます。

## 依存性注入とテスト
Riverpodを使用した依存性注入を活用してテスト可能な設計を実現します。特に以下の点に注意します：
- テスト時にはProviderのオーバーライドを使用して依存コンポーネントをモック化
- リポジトリ層とビジネスロジック層の明確な分離
- 状態管理における適切なテスト戦略（StateNotifierのテストなど）

## エラー処理とEitherパターン
Eitherパターン（Either<Failure, Success>）を使用したエラーハンドリングを採用し、詳細なテストを行います：
- 成功パスとエラーパスの両方を同等の重要度でテスト
- 様々なエラー種別（ネットワークエラー、サーバーエラー、バリデーションエラー）のカバレッジ確保
- エラーメッセージやエラー情報の適切な処理検証

## 非同期処理のテスト
Future/Streamを使用した非同期処理において以下の手法を採用：
- テスト用の時間操作（fakeTimeなど）を使用してタイミング依存テストの安定化
- 非同期処理の適切な完了待機（pumpAndSettle等）
- 非同期エラー処理のテスト

## 1. 単体テスト

### 1.1 エンティティテスト

#### 1.1.1 AwakeningLevelEntityテスト
- **テスト対象**: `AwakeningLevelEntity`クラス
- **テスト内容**:
  - 有効な数値（0〜100）でのインスタンス生成が成功すること
  - 範囲外の数値（<0, >100）でのインスタンス生成時に適切な例外が発生すること
  - 目醒め度レベルの分類（初級/中級/上級）が正しく判定されること
  - 特殊ケース（境界値、エッジケース）の適切な処理
  - `copyWith`機能が正しく動作すること
  - 等価性判定（`==`演算子、`hashCode`）が適切に機能すること

#### 1.1.2 InsightEntityテスト
- **テスト対象**: `InsightEntity`クラス
- **テスト内容**:
  - 必須フィールド（内容、種類、生成日時）を含むインスタンス生成が成功すること
  - インサイトの有効期限計算が正しく行われること
  - インサイトの関連コンテキスト情報が正しく設定されること
  - 異常な長さのテキストやエスケープが必要な特殊文字が含まれる場合の処理
  - `toJson()`/`fromJson()`メソッドの正確性と互換性
  - 不正なJSONからの復元処理が適切なエラーを投げること

#### 1.1.3 NextActionEntityテスト
- **テスト対象**: `NextActionEntity`クラス
- **テスト内容**:
  - アクションタイプ（アプリ内/実生活）に基づくインスタンス生成が成功すること
  - アクション完了ステータスの更新が正しく行われること
  - 期限日時の設定と有効期限チェックが正しく機能すること
  - タイムゾーン依存の日時計算が正しく行われること
  - アクション間の優先順位比較が正しく機能すること
  - 過去・現在・未来の日時に対する適切な期限判定

### 1.2 ユースケーステスト

#### 1.2.1 GetAwakeningLevelUseCaseテスト
- **テスト対象**: `GetAwakeningLevelUseCase`クラス
- **テスト実装アプローチ**:
  ```dart
  void main() {
    late MockAnalysisRepository mockRepository;
    late GetAwakeningLevelUseCase useCase;
    
    setUp(() {
      mockRepository = MockAnalysisRepository();
      useCase = GetAwakeningLevelUseCase(repository: mockRepository);
    });
    
    test('should return awakening level when repository call is successful', () async {
      // Arrange
      final expectedLevel = AwakeningLevelEntity(level: 65);
      when(mockRepository.getAwakeningLevel('user123'))
          .thenAnswer((_) async => Right(expectedLevel));
      
      // Act
      final result = await useCase(userId: 'user123');
      
      // Assert
      expect(result, Right(expectedLevel));
      verify(mockRepository.getAwakeningLevel('user123')).called(1);
    });
    
    test('should return NetworkFailure when repository returns NetworkException', () async {
      // Arrange
      when(mockRepository.getAwakeningLevel('user123'))
          .thenAnswer((_) async => Left(NetworkFailure()));
      
      // Act
      final result = await useCase(userId: 'user123');
      
      // Assert
      expect(result, Left(NetworkFailure()));
    });
  }
  ```
- **テスト内容**:
  - 有効なユーザーIDで目醒め度を正しく取得できること
  - リポジトリからのエラー応答（様々なFailureタイプ）を適切に処理できること
  - モック化したリポジトリとの相互作用が期待通りであること
  - キャッシュ使用ロジックが正しく機能すること
  - ネットワーク状態に応じた適切な動作

#### 1.2.2 GenerateInsightsUseCaseテスト
- **テスト対象**: `GenerateInsightsUseCase`クラス
- **テスト内容**:
  - ユーザーのアクティビティデータに基づき、適切なインサイトが生成されること
  - 不十分なデータの場合、適切なフォールバック処理が行われること
  - インサイト生成のビジネスルール（肯定的、建設的、意味のある）に従った結果が返されること
  - フォーマットされていないデータに対する堅牢な処理
  - 入力データとインサイト生成結果の根拠関係が検証可能なこと
  - 生成されたインサイトの多様性確保

#### 1.2.3 SuggestNextActionsUseCaseテスト
- **テスト対象**: `SuggestNextActionsUseCase`クラス
- **テスト内容**:
  - ユーザーの目醒め度レベルに応じた適切なアクションが提案されること
  - 過去に提案/完了したアクションが適切に考慮されること
  - アクションの多様性（種類、難易度）が確保されていること
  - ユーザー入力がnullまたは無効な場合の適切なエラー処理
  - 同じ入力に対して一貫した結果が返されること（非決定的要素の制御）
  - アクションのスケジューリングロジックが正しく機能すること

#### 1.2.4 RecommendPersonalizedContentUseCaseテスト
- **テスト対象**: `RecommendPersonalizedContentUseCase`クラス
- **テスト内容**:
  - ユーザーの興味関心に合致したコンテンツが推奨されること
  - 成長に有益な新たな視点を含むコンテンツも推奨されること
  - 推奨理由が明確に説明されていること
  - 既読コンテンツのフィルタリングが正しく機能すること
  - 新規ユーザー（コールドスタート）に対する適切な推奨
  - 関連性スコアの計算ロジックが適切に機能すること

### 1.3 リポジトリテスト

#### 1.3.1 AnalysisRepositoryImplテスト
- **テスト対象**: `AnalysisRepositoryImpl`クラス
- **テスト実装アプローチ**:
  ```dart
  void main() {
    late AnalysisRepositoryImpl repository;
    late MockAnalysisRemoteDataSource mockRemoteDataSource;
    late MockAnalysisLocalDataSource mockLocalDataSource;
    
    setUp(() {
      mockRemoteDataSource = MockAnalysisRemoteDataSource();
      mockLocalDataSource = MockAnalysisLocalDataSource();
      repository = AnalysisRepositoryImpl(
        remoteDataSource: mockRemoteDataSource,
        localDataSource: mockLocalDataSource,
      );
    });
    
    group('getAwakeningLevel', () {
      final awakeningLevelModel = AwakeningLevelModel(level: 65);
      final awakeningLevelEntity = AwakeningLevelEntity(level: 65);
      
      test('should return remote data when remote call is successful', () async {
        // Arrange
        when(mockRemoteDataSource.getAwakeningLevel('user123'))
            .thenAnswer((_) async => awakeningLevelModel);
        
        // Act
        final result = await repository.getAwakeningLevel('user123');
        
        // Assert
        expect(result, Right(awakeningLevelEntity));
        verify(mockRemoteDataSource.getAwakeningLevel('user123'));
        verify(mockLocalDataSource.cacheAwakeningLevel(awakeningLevelModel));
      });
      
      test('should return NetworkFailure when remote call fails with NetworkException', () async {
        // Arrange
        when(mockRemoteDataSource.getAwakeningLevel('user123'))
            .thenThrow(NetworkException());
        when(mockLocalDataSource.getLastCachedAwakeningLevel('user123'))
            .thenThrow(CacheException());
        
        // Act
        final result = await repository.getAwakeningLevel('user123');
        
        // Assert
        expect(result, Left(NetworkFailure()));
      });
      
      test('should return cached data when remote call fails and cache is available', () async {
        // Arrange
        when(mockRemoteDataSource.getAwakeningLevel('user123'))
            .thenThrow(NetworkException());
        when(mockLocalDataSource.getLastCachedAwakeningLevel('user123'))
            .thenAnswer((_) async => awakeningLevelModel);
        
        // Act
        final result = await repository.getAwakeningLevel('user123');
        
        // Assert
        expect(result, Right(awakeningLevelEntity));
      });
    });
  }
  ```
- **テスト内容**:
  - リモートデータソースからのデータ取得が正しく行われること
  - データソースからのエラーが適切に処理され、ドメインエラーに変換されること
  - データのキャッシュ機能が正しく動作すること
  - モデル⇔エンティティ変換が正しく行われること
  - キャッシュの有効期限と更新ロジックが適切に機能すること
  - ネットワーク接続がない場合のフォールバック処理
  - 再試行メカニズムの動作検証

#### 1.3.2 UserActivityRepositoryImplテスト
- **テスト対象**: `UserActivityRepositoryImpl`クラス
- **テスト内容**:
  - ユーザーアクティビティデータの取得が正しく行われること
  - アクティビティデータのフィルタリングが正しく機能すること
  - 複数データソース（ローカル/リモート）の統合が正しく行われること
  - データの同期と衝突解決ロジックが適切に機能すること
  - 異なるデータソースからのデータフォーマットの統一
  - 同期エラーが適切に処理されること

### 1.4 データソーステスト

#### 1.4.1 AnalysisRemoteDataSourceテスト
- **テスト対象**: `AnalysisRemoteDataSource`クラス
- **テスト内容**:
  - APIリクエストが正しいパラメータで行われること
  - API成功レスポンスが正しく解析されること
  - API失敗時（ネットワークエラー、サーバーエラー）の処理が適切であること
  - 認証トークンが正しくリクエストに含まれること
  - レスポンスのJSONデシリアライズが正しく行われること
  - APIタイムアウト設定と再試行ロジックが適切に機能すること

#### 1.4.2 UserActivityLocalDataSourceテスト
- **テスト対象**: `UserActivityLocalDataSource`クラス
- **テスト内容**:
  - ローカルDBからのアクティビティデータ取得が正しく行われること
  - データ保存・更新操作が正しく機能すること
  - データのクエリ条件（時間範囲、種類など）が正しく適用されること
  - データベーストランザクションが適切に処理されること
  - 古いデータの自動クリーンアップ機能
  - DB容量制限に達した場合の処理

### 1.5 ViewModel単体テスト

#### 1.5.1 AnalysisViewModelテスト
- **テスト対象**: `AnalysisViewModel`クラス（StateNotifier）
- **テスト実装アプローチ**:
  ```dart
  void main() {
    late AnalysisViewModel viewModel;
    late MockGetAwakeningLevelUseCase mockGetAwakeningLevelUseCase;
    late MockGenerateInsightsUseCase mockGenerateInsightsUseCase;
    
    setUp(() {
      mockGetAwakeningLevelUseCase = MockGetAwakeningLevelUseCase();
      mockGenerateInsightsUseCase = MockGenerateInsightsUseCase();
      viewModel = AnalysisViewModel(
        getAwakeningLevelUseCase: mockGetAwakeningLevelUseCase,
        generateInsightsUseCase: mockGenerateInsightsUseCase,
      );
    });
    
    test('initial state should be AnalysisInitial', () {
      expect(viewModel.state, const AnalysisInitial());
    });
    
    test('loadAnalysisData should emit correct states when successful', () async {
      // Arrange
      final awakeningLevel = AwakeningLevelEntity(level: 65);
      final insights = [InsightEntity(...)];
      
      when(mockGetAwakeningLevelUseCase(userId: 'user123'))
          .thenAnswer((_) async => Right(awakeningLevel));
      when(mockGenerateInsightsUseCase(userId: 'user123', limit: 5))
          .thenAnswer((_) async => Right(insights));
      
      // Act
      await viewModel.loadAnalysisData('user123');
      
      // Assert - verify state transitions
      verify(viewModel.state is AnalysisLoading).called(1);
      verify(viewModel.state is AnalysisLoaded).called(1);
      
      // Get final state
      final currentState = viewModel.state;
      expect(currentState, isA<AnalysisLoaded>());
      
      final loadedState = currentState as AnalysisLoaded;
      expect(loadedState.awakeningLevel, awakeningLevel);
      expect(loadedState.insights, insights);
    });
    
    test('loadAnalysisData should emit error state when awakening level fetch fails', () async {
      // Arrange
      when(mockGetAwakeningLevelUseCase(userId: 'user123'))
          .thenAnswer((_) async => Left(NetworkFailure()));
      
      // Act
      await viewModel.loadAnalysisData('user123');
      
      // Assert
      expect(viewModel.state, isA<AnalysisError>());
      expect((viewModel.state as AnalysisError).message, contains('ネットワーク'));
    });
  }
  ```
- **テスト内容**:
  - 初期状態が正しいこと
  - データ読み込み開始時に適切にLoadingステートに遷移すること
  - ユースケースからの成功レスポンスで適切にLoadedステートに遷移すること
  - ユースケースからのエラーレスポンスで適切にErrorステートに遷移すること
  - 連続呼び出しが正しく処理されること（レース条件がないこと）
  - メモリリークが発生しないこと（特にキャンセル処理）

#### 1.5.2 InsightsViewModelテスト
- **テスト対象**: `InsightsViewModel`クラス
- **テスト内容**:
  - インサイトフィルタリング機能が正しく動作すること
  - ソート機能が適切に機能すること
  - インサイトフィードバック送信機能が正しく動作すること
  - 更新中フラグのライフサイクル管理が適切であること
  - エラー状態からの回復処理が正しく機能すること

## 2. 統合テスト

### 2.1 リポジトリ統合テスト
- **テスト対象**: 実際のデータソース実装を使用したリポジトリ
- **テスト内容**:
  - 実際のAPIエンドポイントとの通信が正しく行われること
  - 実際のデータベースとの読み書きが正しく行われること
  - 異常系シナリオ（タイムアウト、サーバーエラー）の処理が適切であること
  - オフライン/オンライン状態の切り替え時の動作検証
  - 実際のAPIレスポンスフォーマットとのデシリアライズ互換性

### 2.2 ユースケース統合テスト
- **テスト対象**: 実際のリポジトリ実装を使用したユースケース
- **テスト内容**:
  - エンドツーエンドのデータフローが正しく機能すること
  - 複数のリポジトリを組み合わせた処理が正しく行われること
  - 依存関係注入を使用した実際の構成での動作確認
  - トランザクション整合性の検証（複合操作が全て成功するか全て失敗するか）
  - パフォーマンス測定（実際のネットワーク/DBアクセスを含む）

### 2.3 バックエンドAPI統合テスト
- **テスト対象**: 分析ドメインのバックエンドAPIエンドポイント
- **テスト内容**:
  - 各APIエンドポイントのリクエスト/レスポンス形式が仕様通りであること
  - 認証・認可が正しく機能すること
  - レート制限、キャッシュなどの横断的機能が正しく動作すること
  - スケーラビリティテスト（多数の並行リクエスト）
  - APIバージョニングの互換性確認

## 3. UIテスト

### 3.1 分析画面UI要素テスト
- **テスト対象**: `AnalysisScreen`ウィジェット
- **テスト実装アプローチ**:
  ```dart
  void main() {
    late MockAnalysisViewModel mockViewModel;
    
    setUp(() {
      mockViewModel = MockAnalysisViewModel();
    });
    
    Widget createTestableWidget() {
      return ProviderScope(
        overrides: [
          analysisViewModelProvider.overrideWithValue(mockViewModel),
        ],
        child: const MaterialApp(
          home: AnalysisScreen(),
        ),
      );
    }
    
    testWidgets('should show loading indicator when state is AnalysisLoading',
        (WidgetTester tester) async {
      // Arrange
      when(mockViewModel.state).thenReturn(const AnalysisLoading());
      
      // Act
      await tester.pumpWidget(createTestableWidget());
      
      // Assert
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });
    
    testWidgets('should show error message when state is AnalysisError',
        (WidgetTester tester) async {
      // Arrange
      when(mockViewModel.state).thenReturn(const AnalysisError('エラーが発生しました'));
      
      // Act
      await tester.pumpWidget(createTestableWidget());
      
      // Assert
      expect(find.text('エラーが発生しました'), findsOneWidget);
      expect(find.byType(ElevatedButton), findsOneWidget); // リトライボタン
    });
    
    testWidgets('should display analysis data when state is AnalysisLoaded',
        (WidgetTester tester) async {
      // Arrange
      final awakeningLevel = AwakeningLevelEntity(level: 65);
      final insights = [InsightEntity(...), InsightEntity(...)];
      
      when(mockViewModel.state).thenReturn(AnalysisLoaded(
        awakeningLevel: awakeningLevel,
        insights: insights,
      ));
      
      // Act
      await tester.pumpWidget(createTestableWidget());
      
      // Assert
      expect(find.text('目醒め度: 65'), findsOneWidget);
      expect(find.byType(InsightCard), findsNWidgets(2));
    });
  }
  ```
- **テスト内容**:
  - すべてのUI要素（目醒め度表示、インサイトカード、次のステップ提案など）が正しくレンダリングされること
  - レスポンシブデザインが異なる画面サイズで正しく機能すること
  - アクセシビリティ要件（スクリーンリーダー対応、コントラスト比など）が満たされていること
  - 異なる状態（ローディング、エラー、データ表示）の適切な処理
  - UI表示とProviderの状態が正しく連動していること
  - 極端なデータ（特に長いテキスト、特殊文字）での表示崩れがないこと

### 3.2 ユーザーインタラクションテスト
- **テスト対象**: 分析関連画面での操作
- **テスト内容**:
  - インサイト詳細表示のタップ操作が正しく機能すること
  - 次のステップ完了マーキングが正しく処理されること
  - パーソナライズドコンテンツへのナビゲーションが正しく行われること
  - フィードバック提供機能が正しく動作すること
  - アクションのドラッグ＆ドロップ操作の正確性
  - 画面のスクロール、プル更新操作の動作確認
  - 複数の連続操作（タップ・スワイプの組み合わせ）の正確な処理

### 3.3 ビジュアル回帰テスト
- **テスト対象**: 分析ドメインのすべての画面
- **テスト実装アプローチ**:
  ```dart
  void main() {
    testWidgets('Analysis screen visual regression test', (WidgetTester tester) async {
      // Arrange - Setup widget with controlled test data
      await tester.pumpWidget(
        MaterialApp(
          home: ProviderScope(
            overrides: [
              analysisViewModelProvider.overrideWithValue(mockViewModel),
            ],
            child: const AnalysisScreen(),
          ),
        ),
      );
      
      // Let animations complete
      await tester.pumpAndSettle();
      
      // Assert - Compare with golden image
      await expectLater(
        find.byType(AnalysisScreen),
        matchesGoldenFile('golden/analysis_screen.png'),
      );
    });
    
    // Test for different device sizes
    testWidgets('Analysis screen on tablet visual regression test', 
        (WidgetTester tester) async {
      // Set tablet size
      tester.binding.window.physicalSizeTestValue = const Size(1024, 768);
      
      // ... (same setup as above)
      
      await expectLater(
        find.byType(AnalysisScreen),
        matchesGoldenFile('golden/analysis_screen_tablet.png'),
      );
    });
    
    // Test for dark mode
    testWidgets('Analysis screen dark mode visual regression test', 
        (WidgetTester tester) async {
      // Setup dark theme
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.dark(),
          home: ProviderScope(
            overrides: [
              analysisViewModelProvider.overrideWithValue(mockViewModel),
            ],
            child: const AnalysisScreen(),
          ),
        ),
      );
      
      // ... (same assertion as above with different golden file)
    });
  }
  ```
- **テスト内容**:
  - UIコンポーネントが期待通りに表示されること（スクリーンショット比較）
  - ダークモード/ライトモード切り替えが正しく機能すること
  - アニメーションとトランジションが滑らかに動作すること
  - 異なるデバイスサイズでのレイアウト検証
  - フォントサイズ設定変更時の表示検証
  - アクセシビリティ拡大機能有効時の表示検証

## 4. パフォーマンステスト

### 4.1 レスポンス時間テスト
- **テスト対象**: 分析データ取得処理
- **テスト内容**:
  - 目醒め度データ取得の応答時間（ベースラインからの相対値で測定）
  - インサイト生成の応答時間（ベースラインからの相対値で測定）
  - コンテンツ推奨の応答時間（ベースラインからの相対値で測定）
  - 異なるネットワーク条件（高速/低速/不安定）での動作確認
  - メインスレッドのブロッキングがないことの確認
  - CPU使用率のモニタリング

### 4.2 メモリ使用量テスト
- **テスト対象**: 分析画面および関連処理
- **テスト内容**:
  - 長時間の利用でもメモリリークが発生しないこと
  - 大量のデータ表示時でもメモリ使用量が許容範囲内であること
  - バックグラウンド分析処理のメモリ消費が適切であること
  - 画像キャッシュの適切な管理
  - メモリ警告時の適切なリソース解放
  - 低メモリデバイスでの動作検証

### 4.3 バッテリー消費テスト
- **テスト対象**: 分析機能のバックグラウンド処理
- **テスト内容**:
  - バックグラウンド分析処理のバッテリー消費の測定（ベースラインアプリとの比較）
  - データ同期頻度とバッテリー消費のバランス評価
  - バッテリー節約モードでの適切な動作確認
  - スリープモード中の処理挙動
  - ネットワーク接続の効率的な管理（ポーリング vs. プッシュ通知）
  - CPUとGPU使用率の最適化検証

## 5. セキュリティテスト

### 5.1 データ保護テスト
- **テスト対象**: 分析データの保存と送信
- **テスト内容**:
  - ローカルストレージの分析データが適切に暗号化されていること
  - API通信が安全なプロトコル（HTTPS）で行われていること
  - センシティブな分析データが適切に保護されていること
  - 暗号化鍵の安全な管理
  - バックアップデータの保護
  - デバイス間データ同期の安全性

### 5.2 プライバシー設定テスト
- **テスト対象**: データ収集オプトアウト機能
- **テスト内容**:
  - ユーザーのデータ収集オプトアウト設定が正しく適用されること
  - オプトアウト後の既存データ処理が適切に行われること
  - プライバシー設定変更の反映がリアルタイムで行われること
  - 第三者サービスとの連携におけるプライバシー設定の伝播
  - データアクセス監査ログの正確性
  - ユーザーデータエクスポート機能の完全性

## 6. 受け入れテスト基準

分析ドメインの受け入れテストには、以下の条件をすべて満たすことが必要です：

1. すべての単体テストが合格していること（コードカバレッジ80%以上）
2. すべての統合テストが合格していること
3. UIテストで重大な問題が検出されないこと
4. パフォーマンス要件（ベースラインから20%以上の低下がないこと）が満たされていること
5. セキュリティテストで重大な脆弱性が検出されないこと
6. 品質目標（洞察の85%が「役立つ」と評価されるなど）が達成されていること
7. すべてのプライバシー要件が満たされていること
8. アクセシビリティガイドラインに準拠していること

## 7. AI/ML検証テスト

### 7.1 目醒め度評価精度テスト
- **テスト対象**: 目醒め度評価AIアルゴリズム
- **測定手法と評価指標**:
  - ゴールドスタンダードとの比較：平均絶対誤差（MAE）、平均二乗誤差（MSE）
  - 一貫性評価：同一入力に対する変動係数、時間的安定性指標
  - 専門家パネルによるブラインド評価：コホートグループでの比較評価
- **テスト内容**:
  - ゴールドスタンダード（人間の専門家評価）との比較による評価精度の検証
  - 同一ユーザーデータに対する評価の一貫性検証（時間的安定性）
  - エッジケース（極端なデータパターン）に対する堅牢性評価
  - バイアス検出（特定の活動タイプや表現への偏り）とその補正効果の検証
  - 明示的なテストケースとテストデータセットの定義
  - モデルのバージョン間比較評価

### 7.2 インサイト生成品質テスト
- **テスト対象**: インサイト生成AIアルゴリズム
- **測定手法と評価指標**:
  - ROUGE/BLEUスコア：生成テキストの品質評価
  - Semantic Similarity：意味的類似度による多様性測定
  - Human Evaluation：専門家による5段階評価（明確さ、有用性、洞察度）
- **テスト内容**:
  - 生成されたインサイトの内容品質評価（専門家によるブラインドレビュー）
  - インサイトの多様性評価（類似度計算によるバリエーション分析）
  - ビジネスルール（肯定的、建設的、意味のある）の遵守率測定
  - 根拠追跡可能性（インサイトとソースデータの関連性）の検証
  - 異なるユーザープロファイルに対するパーソナライゼーション効果の検証
  - 生成テキストの文法的・意味的正確性評価

### 7.3 不確実性とランダム性の検証
- **テスト対象**: AI分析システム全体
- **テスト実装アプローチ**:
  ```python
  # 擬似コード：モンテカルロシミュレーション
  def monte_carlo_stability_test(model, input_data, n_iterations=1000):
      results = []
      for i in range(n_iterations):
          # 異なるシード値でモデルを実行
          set_random_seed(i)
          result = model.predict(input_data)
          results.append(result)
      
      # 結果の分布分析
      mean_result = np.mean(results, axis=0)
      std_dev = np.std(results, axis=0)
      variation_coef = std_dev / mean_result
      
      # 安定性評価
      return {
          'mean': mean_result,
          'std_dev': std_dev,
          'variation_coef': variation_coef,
          'is_stable': variation_coef < STABILITY_THRESHOLD
      }
  ```
- **テスト内容**:
  - 確率的アルゴリズムのばらつき範囲と許容限界の定義・検証
  - モンテカルロシミュレーションによる結果の分布分析
  - カオスエンジニアリング手法を用いたランダム入力テスト
  - 信頼度スコアの精度検証（自己評価と実際の品質の相関）
  - 乱数シード固定時の再現性検証
  - 様々な初期条件での収束性評価

### 7.4 フィードバックループ検証
- **テスト対象**: AI学習システム
- **テスト内容**:
  - ユーザーフィードバックの取り込みと効果測定
  - 継続的学習による精度改善率の測定
  - 過学習防止メカニズムの有効性検証
  - 新たなパターン識別能力の評価
  - A/Bテストフレームワークの有効性検証
  - モデル劣化検出の精度

## 8. 国際化・多言語対応テスト

### 8.1 多言語インサイト生成テスト
- **テスト対象**: 多言語対応インサイト生成機能
- **テスト内容**:
  - 主要言語（日本語、英語、中国語など）でのインサイト品質評価
  - 言語間での品質一貫性の検証
  - 文化的ニュアンスの適切な反映
  - 翻訳精度とネイティブ表現の自然さ評価
  - 特殊文字や非ASCII文字の適切な処理
  - 文字方向（LTR/RTL）の適切な処理

### 8.2 文化的配慮検証
- **テスト対象**: 分析アルゴリズムの文化適応性
- **テスト内容**:
  - 異なる文化背景を持つユーザーに対するインサイトの適切性評価
  - 文化的タブーや敏感なトピックの適切な取り扱い検証
  - 地域固有の文脈理解の正確性検証
  - 多様な文化的価値観に対する中立性の維持
  - 文化依存表現の適切な変換
  - 地域固有イベントや習慣の認識精度

### 8.3 国際化UI検証
- **テスト対象**: 多言語UI
- **テスト内容**:
  - 各言語でのテキスト表示と整列の適切性
  - 右から左への言語（アラビア語、ヘブライ語など）のレイアウト対応
  - フォントとサイズの適切性（特に非ラテン文字）
  - 日付、時間、数値の地域フォーマット対応
  - テキスト長の変動に対するレイアウト適応性
  - 地域設定の変更がアプリ全体に適切に反映されること

## 9. 長期的品質検証テスト

### 9.1 時間経過に伴う精度検証
- **テスト対象**: 長期運用における分析精度
- **テスト実装アプローチ**:
  ```dart
  // 擬似コード：時間経過シミュレーション
  class TemporalDriftSimulator {
    final testDataSets = {
      '初期': initialDataSet,
      '3ヶ月後': threeMonthDataSet,
      '6ヶ月後': sixMonthDataSet,
      '1年後': oneYearDataSet,
    };
    
    Future<Map<String, AnalysisResult>> simulateTemporalDrift(AnalysisModel model) async {
      final results = <String, AnalysisResult>{};
      
      for (final entry in testDataSets.entries) {
        final periodName = entry.key;
        final dataSet = entry.value;
        
        final result = await model.analyze(dataSet);
        results[periodName] = result;
      }
      
      return results;
    }
    
    double calculateDriftMetric(Map<String, AnalysisResult> results) {
      // ドリフト度合いの計算ロジック
      // 返値が小さいほど安定している
    }
  }
  ```
- **テスト内容**:
  - 時間経過による分析精度の変化トラッキング（定期的な再評価）
  - ユーザー行動パターン変化に対する適応能力評価
  - 長期的なデータ蓄積による目醒め度評価精度の向上測定
  - データドリフト（時間経過による入力データ分布の変化）の検出と対応評価
  - 時系列ユーザーデータのシミュレーション
  - トレンド分析の時間的安定性評価

### 9.2 持続的フィードバックループテスト
- **テスト対象**: フィードバックベースの継続的改善
- **テスト内容**:
  - ユーザーフィードバックの集約と傾向分析の検証
  - フィードバックに基づくモデル調整の効果測定
  - 継続的なA/Bテストフレームワークの有効性検証
  - ユーザー満足度の長期的トレンド分析
  - フィードバックの自動分類精度
  - ネガティブフィードバックへの応答速度

### 9.3 大規模データ処理の長期安定性
- **テスト対象**: データ処理パイプライン
- **テスト内容**:
  - 大量のユーザーデータ蓄積時のパフォーマンス検証
  - データアーカイブと取得プロセスの効率性評価
  - 長期運用での異常検出と自動復旧能力の検証
  - スケーラビリティの継続的な評価（ユーザー数増加に対する対応）
  - データベースインデックスの最適化維持
  - 古いデータの適切なアーカイブ処理

## 10. テスト自動化とCI/CD統合

### 10.1 自動化テストパイプライン
- **テスト内容**:
  - GitHub Actionsを使用した自動テスト実行
  - テスト結果の自動レポート生成と通知
  - テストカバレッジの自動計測と監視
  - 失敗テストの再試行メカニズム
  - テスト実行時間の最適化（並列実行など）

### 10.2 継続的インテグレーションワークフロー
- **テスト内容**:
  - プルリクエスト時の自動テスト実行
  - フェイルファースト原則の適用
  - デプロイゲートとしてのテスト基準
  - 夜間テスト実行の設定
  - パフォーマンス回帰テストの自動化

### 10.3 環境間テスト戦略
- **テスト内容**:
  - 開発、ステージング、本番環境でのテスト差異
  - テスト環境の自動セットアップ
  - テストデータの適切な管理
  - マルチプラットフォームテスト（iOS/Android/Web）

## 11. テスト優先度と実行戦略

### 11.1 クリティカル機能テスト（最優先）
- **対象機能**:
  - 目醒め度評価コアアルゴリズム
  - インサイト生成の基本精度
  - プライバシー保護メカニズム
  - 基本的なUIレンダリングと操作

### 11.2 高優先度テスト（第2優先）
- **対象機能**:
  - パーソナライゼーション機能
  - フィードバックループ
  - エラー処理と復旧
  - パフォーマンス要件
  - 多言語対応コア機能

### 11.3 標準優先度テスト（第3優先）
- **対象機能**:
  - UIの高度な機能
  - 二次的なデータ処理
  - 拡張機能と追加オプション
  - 最適化機能

### 11.4 リスクベーステスト戦略
- 複雑性、影響度、障害可能性に基づく優先度付け
- エッジケースのカバレッジ計画
- テスト依存関係の管理と並行実行の最適化
- 継続的インテグレーション環境でのリグレッション戦略

## 12. テスト環境設定

### 12.1 テストデータセット
- ユーザープロファイルと目醒め度の異なる複数のテストユーザーアカウント
- 多様なユーザーアクティビティパターンを含むテストデータ
- 各タイプのインサイトとアクション提案のサンプルデータ
- 多言語・多文化テストデータセット
- エッジケース検証用の極端なデータパターン
- 時間経過シミュレーション用の時系列データセット

### 12.2 モック設定
- バックエンドAPIモック（テスト用レスポンス）
- ユーザーアクティビティデータソースモック
- AI分析エンジンモック（予測可能な結果を返すもの）
- 確率的振る舞いシミュレーター
- 国際化テスト用言語環境エミュレーター
- 負荷テスト用大規模データジェネレーター

### 12.3 テストカバレッジ目標
- コードカバレッジ: 80%以上
- ユースケースカバレッジ: 100%
- UI要素カバレッジ: 95%以上
- エッジケース（異常系）カバレッジ: 90%以上
- 多言語対応カバレッジ: 主要言語100%
- AI検証メトリクスカバレッジ: 85%以上