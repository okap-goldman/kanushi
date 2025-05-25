# 投稿ドメインテスト仕様書

## 1. テスト概要

投稿ドメインのテストは、クリーンアーキテクチャの各層（プレゼンテーション層、ドメイン層、データ層）に対して包括的なテストを実施します。テストは単体テスト、統合テスト、UIテストの3つのレベルに分けて行います。

## 2. テスト環境

- **開発環境**: Flutter 3.x以上
- **テストフレームワーク**: flutter_test
- **モック・フェイクツール**: mocktail
- **UIテスト**: flutter_test + integration_test
- **カバレッジツール**: flutter_coverage

## 3. テスト対象コンポーネント

### 3.1 データ層

#### 3.1.1 モデル

- **PostModel**
  - fromJsonの正常系テスト
  - toJsonの正常系テスト
  - 特殊文字や長いテキストを含むJSONからの変換テスト
  - nullに対する安全性テスト
  
- **CommentModel**
  - fromJsonの正常系テスト
  - toJsonの正常系テスト
  - 親コメントと子コメントの関係性テスト
  
- **LikeModel**
  - fromJsonの正常系テスト
  - toJsonの正常系テスト
  
- **HighlightModel**
  - fromJsonの正常系テスト
  - toJsonの正常系テスト
  - 理由ありとなしの両パターンテスト

- **MediaModel**
  - fromJsonの正常系テスト
  - toJsonの正常系テスト
  - メタデータの複雑な構造に対するテスト

#### 3.1.2 リモートデータソース

- **PostRemoteDataSource**
  - createPostの成功テスト
  - createPostの失敗テスト（バリデーションエラー）
  - getPostの成功テスト
  - getPostの失敗テスト（存在しないID）
  - updatePostの成功テスト
  - deletePostの成功テスト
  - getUserPostsの成功テスト
  - 各種ネットワークエラーに対する挙動テスト
  
- **CommentRemoteDataSource**
  - getCommentsの成功テスト
  - addCommentの成功テスト
  - 文字数制限エラーテスト
  
- **LikeRemoteDataSource**
  - likePostの成功テスト
  - unlikePostの成功テスト
  - 既にいいね済みの場合のエラーテスト
  
- **HighlightRemoteDataSource**
  - highlightPostの成功テスト
  - unhighlightPostの成功テスト

- **MediaRemoteDataSource**
  - uploadMediaの成功テスト
  - 大きすぎるファイルのエラーテスト
  - サポート外フォーマットのエラーテスト

#### 3.1.3 ローカルデータソース

- **PostLocalDataSource**
  - savePostの成功テスト
  - getPostの成功テスト
  - getPostの失敗テスト（存在しないID）
  - deletePostの成功テスト
  - キャッシュの有効期限テスト

#### 3.1.4 リポジトリ実装

- **PostRepository**
  - createPostの成功テスト
  - createPostのリモート失敗テスト
  - getPostのキャッシュヒットテスト
  - getPostのキャッシュミス→リモート成功テスト
  - getPostの完全失敗テスト
  - updatePostの成功テスト
  - deletePostの成功テスト
  - deletePostの失敗テスト
  - getUserPostsの成功テスト
  
- **CommentRepository**
  - getCommentsの成功テスト
  - addCommentの成功テスト
  - addCommentの失敗テスト

- **LikeRepository**
  - likePostの成功テスト
  - unlikePostの成功テスト

- **HighlightRepository**
  - highlightPostの成功テスト
  - unhighlightPostの成功テスト

### 3.2 ドメイン層

#### 3.2.1 エンティティ

- **PostEntity**
  - コンストラクタテスト
  - copyWithメソッドテスト
  - equalsとhashCodeの実装テスト
  
- **CommentEntity**
  - コンストラクタテスト
  - 返信関係の正確性テスト

#### 3.2.2 ユースケース

- **CreatePostUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  
- **GetPostUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  
- **UpdatePostUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  
- **DeletePostUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  
- **GetUserPostsUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  
- **AddCommentUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  
- **GetCommentsUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  
- **LikePostUseCase/UnlikePostUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  
- **HighlightPostUseCase/UnhighlightPostUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  
- **UploadMediaUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト

### 3.3 プレゼンテーション層

#### 3.3.1 ビューモデル

- **PostViewModel**
  - getPostの状態遷移テスト（初期→ロード中→成功）
  - getPostの状態遷移テスト（初期→ロード中→エラー）
  - deletePostの状態遷移テスト
  - likePostの楽観的更新と成功テスト
  - likePostの楽観的更新と失敗後のロールバックテスト
  - unlikePostの楽観的更新と成功テスト
  - highlightPostの楽観的更新と成功テスト
  - unhighlightPostの楽観的更新と成功テスト
  
- **PostCreateViewModel**
  - uploadMediaの状態遷移テスト
  - createPostの状態遷移テスト（成功）
  - createPostの状態遷移テスト（失敗）
  
- **CommentsViewModel**
  - getCommentsの状態遷移テスト
  - addCommentの状態遷移テスト
  - replyCommentの状態遷移テスト

#### 3.3.2 ウィジェットテスト

- **PostCard**
  - 画像投稿の表示テスト
  - 動画投稿の表示テスト
  - 音声投稿の表示テスト
  - テキスト投稿の表示テスト
  - いいねボタン操作テスト
  - ハイライトボタン操作テスト
  - コメントボタン操作テスト
  
- **PostActions**
  - 各アクション操作のコールバックテスト
  
- **CommentItem**
  - 親コメントの表示テスト
  - 子コメント（返信）の表示テスト
  - 返信ボタン操作テスト
  
- **MediaPlayer**
  - 画像表示テスト
  - 動画再生テスト
  - 音声再生テスト
  - メディア読み込み状態の表示テスト
  
- **TagChip**
  - タグの表示テスト
  - タグタップコールバックテスト

#### 3.3.3 画面テスト

- **PostCreateScreen**
  - テキスト投稿作成フローテスト
  - 画像投稿作成フローテスト
  - 動画投稿作成フローテスト
  - 音声投稿作成フローテスト
  - タグ追加操作テスト
  - 公開範囲設定テスト
  - バリデーションエラー表示テスト
  
- **PostDetailScreen**
  - 投稿内容の表示テスト
  - コメント一覧表示テスト
  - コメント追加テスト
  - いいね操作テスト
  - ハイライト操作テスト
  - 投稿者の場合の編集・削除メニュー表示テスト
  
- **UserPostsScreen**
  - 投稿一覧表示テスト
  - フィルター適用テスト
  - 無限スクロールテスト
  
- **CommentsScreen**
  - コメント一覧表示テスト
  - 返信表示テスト
  - コメント投稿テスト
  - 返信投稿テスト

## 4. 統合テスト

### 4.1 投稿作成から表示までのフロー
- テキスト投稿の作成→表示→いいね操作
- 画像投稿の作成→表示→コメント追加
- 動画投稿の作成→表示→ハイライト操作
- 音声投稿の作成→表示→タグ検索

### 4.2 コメントスレッド操作フロー
- 投稿表示→コメント追加→返信追加→表示確認

### 4.3 ハイライト機能フロー
- 投稿表示→ハイライト追加→理由入力→ハイライト一覧確認

### 4.4 タグ検索とフィルターフロー
- タグ検索→結果表示→フィルター適用→結果確認

## 5. UIテスト

### 5.1 投稿作成UI
- 各種メディア選択とプレビュー表示テスト
- テキスト入力と文字数カウンターテスト
- タグ入力と追加テスト
- 公開範囲設定操作テスト

### 5.2 投稿表示UI
- 各種メディア表示テスト
- 投稿アクション操作テスト
- 長文テキストの表示テスト
- タグ表示テスト

### 5.3 コメント操作UI
- コメント入力フォームテスト
- コメント一覧表示テスト
- 返信表示の階層テスト

### 5.4 メディアプレイヤーUI
- 動画再生コントロールテスト
- 音声再生コントロールテスト
- フルスクリーン表示テスト

## 6. パフォーマンステスト

### 6.1 投稿リスト表示パフォーマンス
- 大量（100件以上）の投稿読み込みテスト
- スクロール性能テスト

### 6.2 メディア読み込みパフォーマンス
- 複数メディア同時表示テスト
- メディアキャッシュ効果検証

### 6.3 コメント読み込みパフォーマンス
- 大量（500件以上）のコメント読み込みテスト
- コメントスレッド表示パフォーマンス

## 7. エラーケーステスト

### 7.1 ネットワークエラー
- オフライン状態での操作テスト
- タイムアウト発生時のリトライ機能テスト

### 7.2 バリデーションエラー
- 文字数制限超過テスト
- 不正なメディア形式テスト
- タグ文字数・形式制限テスト

### 7.3 権限エラー
- 非公開投稿へのアクセス制限テスト
- 投稿編集・削除権限テスト

## 8. アクセシビリティテスト

### 8.1 スクリーンリーダー対応
- 投稿内容の読み上げテスト
- メディア操作のアクセシビリティテスト

### 8.2 キーボード操作
- キーボードナビゲーションテスト
- ショートカットキー操作テスト

## 9. テストデータ

### 9.1 テスト用モックデータ
- 各種投稿タイプのモックデータ
- ユーザープロフィールモックデータ
- コメントスレッドモックデータ

### 9.2 テストシナリオデータ
- ユーザーストーリーに基づくシナリオデータ
- エッジケース検証用データ

## 10. テスト実行計画

### 10.1 開発者ローカルテスト
- 単体テストは各機能実装時に必須
- UIテストは画面実装完了時に実施

### 10.2 CI環境テスト
- プルリクエスト時に全単体テスト実行
- デイリービルドで統合テスト実行
- ウィークリービルドでUIテスト実行

### 10.3 マニュアルテスト
- エラーケースの手動検証
- ユーザビリティテスト（実際のデバイスでの操作テスト）

## 11. テストコード例

### 11.1 モデルテスト例

```dart
void main() {
  group('PostModel', () {
    test('fromJson should correctly parse JSON', () {
      // 準備
      final json = {
        'id': '123',
        'userId': 'user123',
        'contentType': 'text',
        'textContent': 'テスト投稿です',
        'isPublic': true,
        'tags': ['test', 'sample'],
        'createdAt': '2023-01-01T00:00:00.000Z',
        'updatedAt': '2023-01-01T00:00:00.000Z',
        'user': {
          'id': 'user123',
          'username': 'testuser',
          'displayName': 'テストユーザー',
          'avatarUrl': 'https://example.com/avatar.png',
        },
        'likesCount': 5,
        'commentsCount': 2,
        'highlightsCount': 1,
        'isLiked': false,
        'isHighlighted': false,
      };
      
      // 実行
      final result = PostModel.fromJson(json);
      
      // 検証
      expect(result.id, '123');
      expect(result.userId, 'user123');
      expect(result.contentType, ContentType.text);
      expect(result.textContent, 'テスト投稿です');
      expect(result.isPublic, true);
      expect(result.tags, ['test', 'sample']);
      expect(result.createdAt, DateTime.parse('2023-01-01T00:00:00.000Z'));
      expect(result.likesCount, 5);
      expect(result.isLiked, false);
    });
    
    test('toJson should return correct JSON', () {
      // 準備
      final post = PostModel(
        id: '123',
        userId: 'user123',
        contentType: ContentType.text,
        textContent: 'テスト投稿です',
        isPublic: true,
        tags: ['test', 'sample'],
        createdAt: DateTime.parse('2023-01-01T00:00:00.000Z'),
        updatedAt: DateTime.parse('2023-01-01T00:00:00.000Z'),
        user: UserModel(
          id: 'user123',
          username: 'testuser',
          displayName: 'テストユーザー',
          avatarUrl: 'https://example.com/avatar.png',
        ),
        likesCount: 5,
        commentsCount: 2,
        highlightsCount: 1,
      );
      
      // 実行
      final result = post.toJson();
      
      // 検証
      expect(result['id'], '123');
      expect(result['userId'], 'user123');
      expect(result['contentType'], 'text');
      expect(result['textContent'], 'テスト投稿です');
      expect(result['isPublic'], true);
      expect(result['tags'], ['test', 'sample']);
    });
  });
}
```

### 11.2 リポジトリテスト例

```dart
class MockPostRemoteDataSource extends Mock implements PostRemoteDataSource {}
class MockPostLocalDataSource extends Mock implements PostLocalDataSource {}

void main() {
  late PostRepository repository;
  late MockPostRemoteDataSource mockRemoteDataSource;
  late MockPostLocalDataSource mockLocalDataSource;
  
  setUp(() {
    mockRemoteDataSource = MockPostRemoteDataSource();
    mockLocalDataSource = MockPostLocalDataSource();
    repository = PostRepository(
      remoteDataSource: mockRemoteDataSource,
      localDataSource: mockLocalDataSource,
    );
  });
  
  group('getPost', () {
    final tPostId = '123';
    final tPost = PostModel(
      id: tPostId,
      userId: 'user123',
      contentType: ContentType.text,
      textContent: 'テスト投稿です',
      isPublic: true,
      tags: [],
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      user: UserModel(
        id: 'user123',
        username: 'testuser',
        displayName: 'テストユーザー',
        avatarUrl: null,
      ),
    );
    
    test('should return cached data when cache is available', () async {
      // 準備
      when(() => mockLocalDataSource.getPost(tPostId))
          .thenAnswer((_) async => tPost);
      
      // 実行
      final result = await repository.getPost(tPostId);
      
      // 検証
      verify(() => mockLocalDataSource.getPost(tPostId)).called(1);
      verifyNever(() => mockRemoteDataSource.getPost(any()));
      expect(result, Right(tPost));
    });
    
    test('should fetch from remote when cache is not available', () async {
      // 準備
      when(() => mockLocalDataSource.getPost(tPostId))
          .thenAnswer((_) async => null);
      when(() => mockRemoteDataSource.getPost(tPostId))
          .thenAnswer((_) async => tPost);
      when(() => mockLocalDataSource.savePost(tPost))
          .thenAnswer((_) async => true);
      
      // 実行
      final result = await repository.getPost(tPostId);
      
      // 検証
      verify(() => mockLocalDataSource.getPost(tPostId)).called(1);
      verify(() => mockRemoteDataSource.getPost(tPostId)).called(1);
      verify(() => mockLocalDataSource.savePost(tPost)).called(1);
      expect(result, Right(tPost));
    });
    
    test('should return ServerFailure when remote data source throws ServerException', () async {
      // 準備
      when(() => mockLocalDataSource.getPost(tPostId))
          .thenAnswer((_) async => null);
      when(() => mockRemoteDataSource.getPost(tPostId))
          .thenThrow(ServerException('サーバーエラー'));
      
      // 実行
      final result = await repository.getPost(tPostId);
      
      // 検証
      verify(() => mockLocalDataSource.getPost(tPostId)).called(1);
      verify(() => mockRemoteDataSource.getPost(tPostId)).called(1);
      expect(result, Left(ServerFailure('サーバーエラー')));
    });
  });
}
```

### 11.3 ユースケーステスト例

```dart
class MockPostRepository extends Mock implements IPostRepository {}

void main() {
  late GetPostUseCase useCase;
  late MockPostRepository mockRepository;
  
  setUp(() {
    mockRepository = MockPostRepository();
    useCase = GetPostUseCase(repository: mockRepository);
  });
  
  final tPostId = '123';
  final tPost = PostEntity(
    id: tPostId,
    userId: 'user123',
    contentType: ContentType.text,
    textContent: 'テスト投稿です',
    isPublic: true,
    tags: [],
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
    user: UserEntity(
      id: 'user123',
      username: 'testuser',
      displayName: 'テストユーザー',
      avatarUrl: null,
    ),
  );
  
  test('should get post from repository', () async {
    // 準備
    when(() => mockRepository.getPost(tPostId))
        .thenAnswer((_) async => Right(tPost));
    
    // 実行
    final result = await useCase(tPostId);
    
    // 検証
    expect(result, Right(tPost));
    verify(() => mockRepository.getPost(tPostId)).called(1);
    verifyNoMoreInteractions(mockRepository);
  });
}
```

### 11.4 ビューモデルテスト例

```dart
class MockGetPostUseCase extends Mock implements GetPostUseCase {}
class MockLikePostUseCase extends Mock implements LikePostUseCase {}
class MockUnlikePostUseCase extends Mock implements UnlikePostUseCase {}

void main() {
  late PostViewModel viewModel;
  late MockGetPostUseCase mockGetPostUseCase;
  late MockLikePostUseCase mockLikePostUseCase;
  late MockUnlikePostUseCase mockUnlikePostUseCase;
  
  setUp(() {
    mockGetPostUseCase = MockGetPostUseCase();
    mockLikePostUseCase = MockLikePostUseCase();
    mockUnlikePostUseCase = MockUnlikePostUseCase();
    
    viewModel = PostViewModel(
      getPostUseCase: mockGetPostUseCase,
      likePostUseCase: mockLikePostUseCase,
      unlikePostUseCase: mockUnlikePostUseCase,
      // その他必要なモック
    );
  });
  
  group('getPost', () {
    final tPostId = '123';
    final tPost = PostEntity(
      id: tPostId,
      userId: 'user123',
      contentType: ContentType.text,
      textContent: 'テスト投稿です',
      isPublic: true,
      tags: [],
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      user: UserEntity(
        id: 'user123',
        username: 'testuser',
        displayName: 'テストユーザー',
        avatarUrl: null,
      ),
      likesCount: 5,
      commentsCount: 2,
      highlightsCount: 0,
      isLiked: false,
      isHighlighted: false,
    );
    
    test('should emit [PostLoading, PostLoaded] when successful', () async {
      // 準備
      when(() => mockGetPostUseCase(tPostId))
          .thenAnswer((_) async => Right(tPost));
      
      // 状態検証のセットアップ
      final states = <PostState>[];
      viewModel.addListener(() {
        states.add(viewModel.state);
      });
      
      // 実行
      await viewModel.getPost(tPostId);
      
      // 検証
      expect(states, [
        PostLoading(),
        PostLoaded(tPost),
      ]);
    });
    
    test('should emit [PostLoading, PostError] when failed', () async {
      // 準備
      when(() => mockGetPostUseCase(tPostId))
          .thenAnswer((_) async => Left(ServerFailure('エラーが発生しました')));
      
      // 状態検証のセットアップ
      final states = <PostState>[];
      viewModel.addListener(() {
        states.add(viewModel.state);
      });
      
      // 実行
      await viewModel.getPost(tPostId);
      
      // 検証
      expect(states, [
        PostLoading(),
        PostError('エラーが発生しました'),
      ]);
    });
  });
  
  group('likePost', () {
    final tPostId = '123';
    final tPost = PostEntity(
      // ポストのプロパティ
      likesCount: 5,
      isLiked: false,
    );
    final tLike = LikeEntity(
      id: 'like123',
      postId: tPostId,
      userId: 'user123',
      createdAt: DateTime.now(),
    );
    
    test('should optimistically update state and call likePostUseCase', () async {
      // 準備
      viewModel = PostViewModel(
        // 必要なモック
      );
      viewModel.state = PostLoaded(tPost);
      
      when(() => mockLikePostUseCase(tPostId))
          .thenAnswer((_) async => Right(tLike));
      
      // 状態検証のセットアップ
      final states = <PostState>[];
      viewModel.addListener(() {
        states.add(viewModel.state);
      });
      
      // 実行
      await viewModel.likePost(tPostId);
      
      // 検証
      expect(states, [
        PostLoaded(tPost.copyWith(isLiked: true, likesCount: 6)),
      ]);
      verify(() => mockLikePostUseCase(tPostId)).called(1);
    });
  });
}
```

### 11.5 ウィジェットテスト例

```dart
void main() {
  testWidgets('PostCard displays post content correctly', (WidgetTester tester) async {
    // テスト用のポストを作成
    final post = PostModel(
      id: '123',
      userId: 'user123',
      contentType: ContentType.text,
      textContent: 'テスト投稿です',
      isPublic: true,
      tags: ['テスト', 'サンプル'],
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      user: UserModel(
        id: 'user123',
        username: 'testuser',
        displayName: 'テストユーザー',
        avatarUrl: 'https://example.com/avatar.png',
      ),
      likesCount: 5,
      commentsCount: 2,
      highlightsCount: 1,
      isLiked: false,
      isHighlighted: false,
    );
    
    // ウィジェットのレンダリング
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: PostCard(
            post: post,
            onLike: () {},
            onComment: () {},
            onHighlight: () {},
            onTap: () {},
          ),
        ),
      ),
    );
    
    // 期待する表示の検証
    expect(find.text('テスト投稿です'), findsOneWidget);
    expect(find.text('テストユーザー'), findsOneWidget);
    expect(find.text('@testuser'), findsOneWidget);
    
    // タグの検証
    expect(find.text('#テスト'), findsOneWidget);
    expect(find.text('#サンプル'), findsOneWidget);
    
    // いいねカウントの検証
    expect(find.text('5'), findsOneWidget);
    
    // コメントカウントの検証
    expect(find.text('2'), findsOneWidget);
    
    // ボタンの存在検証
    expect(find.byIcon(Icons.favorite_border), findsOneWidget);
    expect(find.byIcon(Icons.comment), findsOneWidget);
    expect(find.byIcon(Icons.star_border), findsOneWidget);
  });
  
  testWidgets('PostCard like button changes state on tap', (WidgetTester tester) async {
    // テスト用のポストを作成
    bool liked = false;
    
    final post = PostModel(
      // プロパティ設定
      isLiked: liked,
    );
    
    // ウィジェットのレンダリング
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: PostCard(
            post: post,
            onLike: () {
              liked = !liked;
            },
            onComment: () {},
            onHighlight: () {},
            onTap: () {},
          ),
        ),
      ),
    );
    
    // いいねボタンをタップ
    await tester.tap(find.byIcon(Icons.favorite_border));
    
    // 期待する状態の検証
    expect(liked, true);
  });
}
```

## 12. テスト成功基準

1. **単体テストカバレッジ目標**
   - モデル: 100%
   - リポジトリ: 90%以上
   - ユースケース: 90%以上
   - ビューモデル: 85%以上

2. **状態テスト**
   - すべてのビューモデルの状態遷移テストが成功すること

3. **UI表示テスト**
   - すべてのウィジェットが各種デバイスサイズで適切に表示されること
   - アクセシビリティテストが基準を満たすこと

4. **パフォーマンステスト**
   - 画面表示: 300ms以内
   - リスト表示のスクロール: 60fps維持
   - メディア読み込み: 1秒以内に表示開始

5. **エラーハンドリング**
   - すべてのエラーケースが適切に処理され、ユーザーに分かりやすく表示されること

## 13. テスト実施および報告プロセス

1. 開発者は機能実装と併せて単体テストを実装
2. PRレビュー時にはテスト結果とカバレッジを確認
3. 統合テストは機能が完成した時点で実施
4. テスト結果はCI/CDパイプラインで自動集計
5. 不具合発見時は修正→テスト→再修正のサイクルを実施
6. リリース前に全テストの最終実行とレポート作成

## 14. メンテナンス計画

1. 新機能追加時には対応するテストも必須
2. 既存テストは3ヶ月ごとにレビューし、必要に応じて更新
3. テストの実行時間と効率性を3ヶ月ごとに評価
4. モックデータと依存ライブラリは定期的に更新