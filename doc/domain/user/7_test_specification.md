# ユーザードメインテスト仕様書

## 1. 単体テスト

### モデルテスト

#### UserModelTest
- ユーザーモデルがJSON形式から正しく変換されることを確認
- ユーザーモデルがJSON形式に正しく変換されることを確認
- 必須フィールド（id, email, createdAt, lastLoginAt, isActive）が正しく設定されることを確認

#### ProfileModelTest
- プロフィールモデルがJSON形式から正しく変換されることを確認
- プロフィールモデルがJSON形式に正しく変換されることを確認
- 任意フィールド（profileText, profileImageUrl など）がnullの場合も適切に処理されることを確認

#### FollowModelTest
- フォローモデルがJSON形式から正しく変換されることを確認
- フォローモデルがJSON形式に正しく変換されることを確認
- FollowTypeとFollowStatusの列挙型が正しく変換されることを確認

### リポジトリテスト

#### AuthRepositoryTest
- loginWithGoogleが成功した場合、AuthTokenが返されることを確認
- loginWithAppleが成功した場合、AuthTokenが返されることを確認
- 認証に失敗した場合、AuthFailureが返されることを確認
- refreshTokenが成功した場合、新しいAuthTokenが返されることを確認
- logoutが成功した場合、trueが返されることを確認
- リポジトリが適切にSecureStorageにトークンを保存/削除することを確認

#### UserRepositoryTest
- キャッシュがある場合、getMyProfileがローカルキャッシュから取得することを確認
- キャッシュがない場合、getMyProfileがリモートから取得することを確認
- getUserProfileが正しくユーザーIDに対応するプロフィールを返すことを確認
- updateProfileが成功した場合、更新されたプロフィールを返すことを確認
- uploadProfileImageが成功した場合、画像URLを返すことを確認
- uploadIntroAudioが成功した場合、音声URLを返すことを確認
- updateFcmTokenが成功した場合、trueを返すことを確認
- deleteAccountが成功した場合、trueを返すことを確認

#### FollowRepositoryTest
- followUserが成功した場合、FollowEntityを返すことを確認
- updateFollowTypeが成功した場合、更新されたFollowEntityを返すことを確認
- unfollowUserが成功した場合、trueを返すことを確認
- getFollowersが正しくページネーションで結果を返すことを確認
- getFollowingが正しくページネーションで結果を返すことを確認
- フォロータイプでフィルタリングが適切に動作することを確認

### ユースケーステスト

#### LoginWithGoogleUseCaseTest
- リポジトリを使って認証が成功した場合、AuthTokenが返されることを確認
- リポジトリで認証が失敗した場合、FailureオブジェクトがRightで包まれて返されることを確認

#### GetProfileUseCaseTest
- 自分のプロフィール取得が成功した場合、ProfileEntityが返されることを確認
- プロフィール取得が失敗した場合、Failureが返されることを確認

#### FollowUserUseCaseTest
- フォロー操作が成功した場合、FollowEntityが返されることを確認
- フォロー操作が失敗した場合、Failureが返されることを確認

#### GetFollowersUseCaseTest / GetFollowingUseCaseTest
- フォロワー/フォロー中リストの取得が成功した場合、Paginatedモデルが返されることを確認
- カーソルによるページネーションが正しく動作することを確認

### ビューモデルテスト

#### AuthViewModelTest
```dart
void main() {
  group('AuthViewModel Tests', () {
    late MockLoginWithGoogleUseCase mockLoginWithGoogleUseCase;
    late MockLoginWithAppleUseCase mockLoginWithAppleUseCase;
    late MockLogoutUseCase mockLogoutUseCase;
    late AuthViewModel viewModel;

    setUp(() {
      mockLoginWithGoogleUseCase = MockLoginWithGoogleUseCase();
      mockLoginWithAppleUseCase = MockLoginWithAppleUseCase();
      mockLogoutUseCase = MockLogoutUseCase();
      
      viewModel = AuthViewModel(
        loginWithGoogleUseCase: mockLoginWithGoogleUseCase,
        loginWithAppleUseCase: mockLoginWithAppleUseCase,
        logoutUseCase: mockLogoutUseCase,
      );
    });

    test('初期状態がAuthInitialであること', () {
      expect(viewModel.state, isA<AuthInitial>());
    });

    test('Googleログインが成功した場合、状態がAuthSuccessになること', () async {
      // モックの設定: 成功時の挙動
      when(mockLoginWithGoogleUseCase()).thenAnswer((_) async => 
        Right(AuthToken(accessToken: 'token', refreshToken: 'refresh', expiresIn: 3600)));
      
      // テスト対象メソッドの実行
      await viewModel.loginWithGoogle();
      
      // 状態の検証
      expect(viewModel.state, isA<AuthSuccess>());
      expect((viewModel.state as AuthSuccess).token.accessToken, 'token');
    });

    test('Googleログインが失敗した場合、状態がAuthErrorになること', () async {
      // モックの設定: 失敗時の挙動
      when(mockLoginWithGoogleUseCase()).thenAnswer((_) async => 
        Left(AuthFailure('認証エラー')));
      
      // テスト対象メソッドの実行
      await viewModel.loginWithGoogle();
      
      // 状態の検証
      expect(viewModel.state, isA<AuthError>());
      expect((viewModel.state as AuthError).message, '認証エラー');
    });

    // Appleログインと同様のテストを記述

    test('ログアウトが成功した場合、状態がAuthInitialになること', () async {
      // 最初に成功状態に設定
      when(mockLoginWithGoogleUseCase()).thenAnswer((_) async => 
        Right(AuthToken(accessToken: 'token', refreshToken: 'refresh', expiresIn: 3600)));
      await viewModel.loginWithGoogle();
      
      // ログアウトのモック設定
      when(mockLogoutUseCase()).thenAnswer((_) async => Right(true));
      
      // ログアウト実行
      await viewModel.logout();
      
      // 初期状態に戻っていることを確認
      expect(viewModel.state, isA<AuthInitial>());
    });
  });
}
```

#### ProfileViewModelTest
```dart
void main() {
  group('ProfileViewModel Tests', () {
    late MockGetProfileUseCase mockGetProfileUseCase;
    late MockUpdateProfileUseCase mockUpdateProfileUseCase;
    late MockUploadProfileImageUseCase mockUploadProfileImageUseCase;
    late MockUploadAudioUseCase mockUploadAudioUseCase;
    late ProfileViewModel viewModel;

    setUp(() {
      mockGetProfileUseCase = MockGetProfileUseCase();
      mockUpdateProfileUseCase = MockUpdateProfileUseCase();
      mockUploadProfileImageUseCase = MockUploadProfileImageUseCase();
      mockUploadAudioUseCase = MockUploadAudioUseCase();
      
      viewModel = ProfileViewModel(
        getProfileUseCase: mockGetProfileUseCase,
        updateProfileUseCase: mockUpdateProfileUseCase,
        uploadProfileImageUseCase: mockUploadProfileImageUseCase,
        uploadAudioUseCase: mockUploadAudioUseCase,
      );
    });

    test('初期状態がProfileInitialであること', () {
      expect(viewModel.state, isA<ProfileInitial>());
    });

    test('getMyProfileが成功した場合、状態がProfileLoadedになること', () async {
      // モックプロフィールの作成
      final mockProfile = ProfileEntity(
        id: '123',
        userId: '456',
        displayName: 'テストユーザー',
        isPublic: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      
      // モックの設定
      when(mockGetProfileUseCase()).thenAnswer((_) async => Right(mockProfile));
      
      // テスト対象メソッドの実行
      await viewModel.getMyProfile();
      
      // 状態の検証
      expect(viewModel.state, isA<ProfileLoaded>());
      expect((viewModel.state as ProfileLoaded).profile, mockProfile);
    });

    test('updateProfileが成功した場合、状態がProfileUpdatedになること', () async {
      // モックプロフィールとパラメータの作成
      final mockProfile = ProfileEntity(
        id: '123',
        userId: '456',
        displayName: '更新後の名前',
        isPublic: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      
      final params = ProfileUpdateParams(displayName: '更新後の名前');
      
      // モックの設定
      when(mockUpdateProfileUseCase(params)).thenAnswer((_) async => Right(mockProfile));
      
      // テスト対象メソッドの実行
      await viewModel.updateProfile(params);
      
      // 状態の検証
      expect(viewModel.state, isA<ProfileUpdated>());
      expect((viewModel.state as ProfileUpdated).profile.displayName, '更新後の名前');
    });

    // その他のメソッドも同様にテスト
  });
}
```

#### FollowViewModelTest
```dart
void main() {
  group('FollowViewModel Tests', () {
    late MockFollowUserUseCase mockFollowUserUseCase;
    late MockUnfollowUserUseCase mockUnfollowUserUseCase;
    late MockUpdateFollowTypeUseCase mockUpdateFollowTypeUseCase;
    late MockGetFollowersUseCase mockGetFollowersUseCase;
    late MockGetFollowingUseCase mockGetFollowingUseCase;
    late FollowViewModel viewModel;

    setUp(() {
      mockFollowUserUseCase = MockFollowUserUseCase();
      mockUnfollowUserUseCase = MockUnfollowUserUseCase();
      mockUpdateFollowTypeUseCase = MockUpdateFollowTypeUseCase();
      mockGetFollowersUseCase = MockGetFollowersUseCase();
      mockGetFollowingUseCase = MockGetFollowingUseCase();
      
      viewModel = FollowViewModel(
        followUserUseCase: mockFollowUserUseCase,
        unfollowUserUseCase: mockUnfollowUserUseCase,
        updateFollowTypeUseCase: mockUpdateFollowTypeUseCase,
        getFollowersUseCase: mockGetFollowersUseCase,
        getFollowingUseCase: mockGetFollowingUseCase,
      );
    });

    test('初期状態がFollowInitialであること', () {
      expect(viewModel.state, isA<FollowInitial>());
    });

    test('followUserが成功した場合、状態がFollowSuccessになること', () async {
      // モックの設定
      final mockFollow = FollowEntity(
        id: '123',
        followerId: 'currentUser',
        followeeId: 'targetUser',
        followType: FollowType.family,
        status: FollowStatus.active,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      
      when(mockFollowUserUseCase(any)).thenAnswer((_) async => Right(mockFollow));
      
      // テスト対象メソッドの実行
      await viewModel.followUser('targetUser', FollowType.family);
      
      // 状態の検証
      expect(viewModel.state, isA<FollowSuccess>());
      expect((viewModel.state as FollowSuccess).follow.followType, FollowType.family);
    });

    // 他のメソッドも同様にテスト
  });
}
```

## 2. 統合テスト

### 認証フロー統合テスト
- Google認証からプロフィール取得までの一連のフローをテスト
- 認証からプロフィール更新までの一連のフローをテスト
- 認証からログアウトまでの一連のフローをテスト

### フォロー関係統合テスト
- ユーザー検索からフォロー操作までの一連のフローをテスト
- フォローからフォロータイプ変更までの一連のフローをテスト
- フォローからアンフォローまでの一連のフローをテスト

## 3. UIテスト

### LoginScreenTest
```dart
void main() {
  testWidgets('ログイン画面の表示とGoogleログインボタンのタップをテスト', (WidgetTester tester) async {
    // モックプロバイダーを設定
    final mockAuthViewModel = MockAuthViewModel();
    
    // テスト対象ウィジェットをレンダリング
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authViewModelProvider.overrideWithValue(mockAuthViewModel),
        ],
        child: MaterialApp(
          home: LoginScreen(),
        ),
      ),
    );
    
    // UI要素の存在チェック
    expect(find.text('かぬし'), findsOneWidget); // アプリ名
    expect(find.byType(SvgPicture), findsOneWidget); // アプリロゴ
    expect(find.text('Googleでログイン'), findsOneWidget); // ログインボタン
    expect(find.text('続行することで、利用規約とプライバシーポリシーに同意したことになります'), findsOneWidget);
    
    // Googleログインボタンをタップ
    await tester.tap(find.text('Googleでログイン'));
    await tester.pump();
    
    // mockAuthViewModelのloginWithGoogleメソッドが呼ばれたことを確認
    verify(mockAuthViewModel.loginWithGoogle()).called(1);
  });
}
```

### ProfileScreenTest
```dart
void main() {
  testWidgets('プロフィール画面が正しく表示されることをテスト', (WidgetTester tester) async {
    // モックデータとプロバイダーの設定
    final mockProfileViewModel = MockProfileViewModel();
    final mockProfile = ProfileEntity(
      id: '123',
      userId: '456',
      displayName: 'テストユーザー',
      profileText: 'これはテスト用のプロフィールです',
      profileImageUrl: 'https://example.com/profile.jpg',
      prefecture: '東京都',
      city: '渋谷区',
      isPublic: true,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
    
    // モックの状態を設定
    when(mockProfileViewModel.state).thenReturn(ProfileLoaded(mockProfile));
    
    // テスト対象ウィジェットをレンダリング
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          profileViewModelProvider.overrideWithValue(mockProfileViewModel),
        ],
        child: MaterialApp(
          home: ProfileScreen(userId: '456', isCurrentUser: true),
        ),
      ),
    );
    
    // UI要素の存在チェック
    expect(find.text('テストユーザー'), findsOneWidget); // 表示名
    expect(find.text('これはテスト用のプロフィールです'), findsOneWidget); // 自己紹介文
    expect(find.text('東京都 渋谷区'), findsOneWidget); // 地域情報
    expect(find.byType(CircleAvatar), findsOneWidget); // プロフィール画像
    expect(find.text('プロフィールを編集'), findsOneWidget); // 編集ボタン
    
    // 編集ボタンをタップ
    await tester.tap(find.text('プロフィールを編集'));
    await tester.pumpAndSettle();
    
    // 編集画面に遷移したことを確認
    expect(find.byType(ProfileEditScreen), findsOneWidget);
  });
}
```

### FollowersFollowingScreenTest
```dart
void main() {
  testWidgets('フォロワー画面が正しく表示されることをテスト', (WidgetTester tester) async {
    // モックデータとプロバイダーの設定
    final mockFollowViewModel = MockFollowViewModel();
    final mockFollowers = PaginatedFollowers(
      followers: [
        FollowerViewModel(
          id: '1',
          userId: 'user1',
          displayName: 'フォロワー1',
          profileImageUrl: 'https://example.com/1.jpg',
          followType: FollowType.family,
          createdAt: DateTime.now(),
          isFollowingBack: true,
        ),
        FollowerViewModel(
          id: '2',
          userId: 'user2',
          displayName: 'フォロワー2',
          profileImageUrl: 'https://example.com/2.jpg',
          followType: FollowType.watch,
          createdAt: DateTime.now(),
          isFollowingBack: false,
        ),
      ],
      nextCursor: null,
    );
    
    // モックの状態を設定
    when(mockFollowViewModel.state).thenReturn(FollowersLoaded(mockFollowers));
    
    // テスト対象ウィジェットをレンダリング
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          followViewModelProvider.overrideWithValue(mockFollowViewModel),
        ],
        child: MaterialApp(
          home: FollowersFollowingScreen(
            userId: 'currentUser', 
            initialTab: FollowTabType.followers,
          ),
        ),
      ),
    );
    
    // UI要素の存在チェック
    expect(find.text('フォロワー'), findsOneWidget); // タブタイトル
    expect(find.text('フォロワー1'), findsOneWidget); // フォロワー名
    expect(find.text('フォロワー2'), findsOneWidget); // フォロワー名
    
    // フォロー中タブに切り替え
    await tester.tap(find.text('フォロー中'));
    await tester.pumpAndSettle();
    
    // フォロー中リストのロードが呼ばれることを確認
    verify(mockFollowViewModel.getFollowing('currentUser')).called(1);
  });
}
```

## 4. モック設定

### モックリポジトリクラス

```dart
// MockAuthRepository
class MockAuthRepository implements IAuthRepository {
  bool _shouldSucceed = true;
  
  void setSuccessMode(bool succeed) {
    _shouldSucceed = succeed;
  }
  
  @override
  Future<Either<Failure, AuthToken>> loginWithGoogle() async {
    if (_shouldSucceed) {
      return Right(AuthToken(
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        expiresIn: 3600,
      ));
    } else {
      return Left(AuthFailure('認証に失敗しました'));
    }
  }
  
  // 他のメソッドも同様に実装
}

// MockUserRepository
class MockUserRepository implements IUserRepository {
  final Map<String, ProfileEntity> _profiles = {};
  
  MockUserRepository() {
    // テスト用プロフィールを初期化
    _profiles['currentUser'] = ProfileEntity(
      id: 'profile1',
      userId: 'currentUser',
      displayName: 'テストユーザー',
      isPublic: true,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }
  
  @override
  Future<Either<Failure, ProfileEntity>> getMyProfile() async {
    return Right(_profiles['currentUser']!);
  }
  
  // 他のメソッドも同様に実装
}

// MockFollowRepository
class MockFollowRepository implements IFollowRepository {
  final List<FollowEntity> _follows = [];
  
  MockFollowRepository() {
    // テスト用フォロー関係を初期化
  }
  
  @override
  Future<Either<Failure, FollowEntity>> followUser(String followeeId, FollowType followType) async {
    final follow = FollowEntity(
      id: 'follow_${DateTime.now().millisecondsSinceEpoch}',
      followerId: 'currentUser',
      followeeId: followeeId,
      followType: followType,
      status: FollowStatus.active,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
    
    _follows.add(follow);
    return Right(follow);
  }
  
  // 他のメソッドも同様に実装
}
```

## 5. CI/CD設定

### GitHubワークフロー設定

```yaml
name: User Domain Tests

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'app/lib/domain/entities/user_*.dart'
      - 'app/lib/domain/repositories/auth_*.dart'
      - 'app/lib/domain/repositories/user_*.dart'
      - 'app/lib/domain/repositories/follow_*.dart'
      - 'app/lib/domain/usecases/**'
      - 'app/lib/data/models/user_*.dart'
      - 'app/lib/data/repositories/**'
      - 'app/lib/presentation/viewmodels/auth_*.dart'
      - 'app/lib/presentation/viewmodels/profile_*.dart'
      - 'app/lib/presentation/viewmodels/follow_*.dart'
      - 'app/lib/presentation/screens/login_*.dart'
      - 'app/lib/presentation/screens/profile_*.dart'
      - 'app/lib/presentation/screens/followers_*.dart'
      - 'app/test/domain/user/**'
      - 'app/test/data/user/**'
      - 'app/test/presentation/user/**'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'app/lib/domain/user/**'
      - 'app/lib/data/user/**'
      - 'app/lib/presentation/user/**'
      - 'app/test/domain/user/**'
      - 'app/test/data/user/**'
      - 'app/test/presentation/user/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.5'
          channel: 'stable'
      - name: Install dependencies
        run: cd app && flutter pub get
      - name: Run tests
        run: cd app && flutter test test/domain/user/ test/data/user/ test/presentation/user/
```

## 6. テストのベストプラクティス

1. **テスト間の独立性を確保**
   - 各テストは他のテストの実行結果に依存しないようにする
   - `setUp`と`tearDown`を使って適切にテスト環境を初期化・クリーンアップする

2. **モックの適切な使用**
   - 外部依存（API、データベース、外部サービス）はモック化する
   - Mockito/MockKを使用して依存性をモック化する
   - 複雑なシナリオをテストするために様々な応答をシミュレートする

3. **テストカバレッジの最適化**
   - すべてのビジネスロジックに対するテストを書く
   - 境界値と一般的なケースの両方をテストする
   - 失敗ケースとエラー処理のテストを含める

4. **見やすいテスト**
   - AAA（Arrange-Act-Assert）パターンを使用
   - テスト名は何をテストしているかを明確に示す
   - 各テストはできるだけ単一の機能や動作に焦点を当てる

5. **フレームワーク機能の活用**
   - Flutter の testWidgets を使用して UI をテスト
   - group を使ってテストを論理的にグループ化
   - 必要に応じて skip や timeout など特殊なフラグを使用

## 7. テスト環境設定

### テストデータの設定
```dart
// test/fixtures/user/auth_token.json
{
  "accessToken": "test_access_token",
  "refreshToken": "test_refresh_token",
  "expiresIn": 3600
}

// test/fixtures/user/profile.json
{
  "id": "123",
  "userId": "456",
  "displayName": "テストユーザー",
  "profileText": "これはテスト用のプロフィールです",
  "profileImageUrl": "https://example.com/profile.jpg",
  "introAudioUrl": "https://example.com/intro.mp3",
  "externalLinkUrl": "https://example.com/link",
  "prefecture": "東京都",
  "city": "渋谷区",
  "isPublic": true,
  "createdAt": "2023-01-01T12:00:00Z",
  "updatedAt": "2023-01-01T12:00:00Z"
}

// FixtureReader
String fixture(String path) => File('test/fixtures/$path').readAsStringSync();
```

### テストヘルパー
```dart
// テストのセットアップを簡略化するヘルパー関数
Future<MockAuthRepository> setupAuthRepositoryTest() async {
  final repository = MockAuthRepository();
  // 必要に応じて初期設定
  return repository;
}

// ウィジェットテスト用のアプリラッパー
Widget makeTestableWidget({
  required Widget child,
  required List<Override> overrides,
}) {
  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(
      home: child,
    ),
  );
}
```

## 8. スケジュールと優先順位

1. **第1フェーズ（基本的なモデルとリポジトリテスト）**
   - UserModelTest, ProfileModelTest, FollowModelTest
   - AuthRepositoryTest, UserRepositoryTest（基本機能）

2. **第2フェーズ（ユースケースとビューモデルテスト）**
   - LoginWithGoogleUseCaseTest, GetProfileUseCaseTest
   - AuthViewModelTest, ProfileViewModelTest（基本機能）

3. **第3フェーズ（残りのリポジトリとユースケース）**
   - FollowRepositoryTest
   - フォロー関連のユースケーステスト

4. **第4フェーズ（UIテスト）**
   - LoginScreenTest
   - ProfileScreenTest
   - FollowersFollowingScreenTest

5. **第5フェーズ（統合テスト）**
   - 認証フロー統合テスト
   - フォロー関係統合テスト

## 9. 性能テスト

### レスポンス時間テスト
- プロフィール情報の表示速度が1秒以内であることを確認
- フォロワー/フォロー中一覧の初期表示が1秒以内であることを確認
- フォロー操作のレスポンスが1秒以内であることを確認

### メモリ使用量テスト
- プロフィール画像のキャッシュがメモリを過剰に使用しないことを確認
- フォロワー/フォロー中リストの表示がメモリリークを起こさないことを確認

## 10. セキュリティテスト

- JWT認証トークンがSecureStorageに安全に保存されることを確認
- アプリがバックグラウンドに移行したときに機密情報が保護されることを確認
- トークンが期限切れになった場合のリフレッシュ処理が正しく動作することを確認