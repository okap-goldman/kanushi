# ユーザードメイン詳細設計

## 1. アーキテクチャ概要

ユーザードメインは、クリーンアーキテクチャに基づき以下の層に分けて実装します。認証にはSupabaseを使用します。

### プレゼンテーション層
- **画面（Screens）**
  - LoginScreen
  - ProfileScreen
  - ProfileEditScreen
  - FollowerListScreen
  - FollowingListScreen
  - SettingsScreen

- **ビューモデル（ViewModels）**
  - AuthViewModel
  - ProfileViewModel
  - FollowViewModel
  - SettingsViewModel

- **ウィジェット（Widgets）**
  - UserAvatar
  - FollowButton
  - UserListItem
  - ProfileHeader
  - AudioPlayer
  - SocialLoginButtons

### ドメイン層
- **エンティティ（Entities）**
  - UserEntity
  - ProfileEntity
  - FollowEntity

- **リポジトリインターフェース（Repository Interfaces）**
  - IAuthRepository
  - IUserRepository
  - IFollowRepository

- **ユースケース（Use Cases）**
  - LoginWithGoogleUseCase
  - LoginWithAppleUseCase
  - GetProfileUseCase
  - UpdateProfileUseCase
  - FollowUserUseCase
  - UnfollowUserUseCase
  - GetFollowersUseCase
  - GetFollowingUseCase
  - UploadProfileImageUseCase
  - UploadAudioUseCase

### データ層
- **リポジトリ実装（Repository Implementations）**
  - AuthRepository
  - UserRepository
  - FollowRepository

- **データソース（Data Sources）**
  - SupabaseAuthDataSource
  - UserRemoteDataSource
  - FollowRemoteDataSource
  - UserLocalDataSource

- **モデル（Models）**
  - UserModel
  - ProfileModel
  - FollowModel

## 2. データモデル詳細

### UserModel
```dart
class UserModel extends UserEntity {
  final String id;
  final String email;
  final DateTime createdAt;
  final DateTime lastLoginAt;
  final bool isActive;
  
  UserModel({
    required this.id,
    required this.email,
    required this.createdAt,
    required this.lastLoginAt,
    required this.isActive,
  });
  
  factory UserModel.fromJson(Map<String, dynamic> json) { ... }
  Map<String, dynamic> toJson() { ... }
}
```

### ProfileModel
```dart
class ProfileModel extends ProfileEntity {
  final String id;
  final String userId;
  final String displayName;
  final String? profileText;
  final String? profileImageUrl;
  final String? introAudioUrl;
  final String? externalLinkUrl;
  final String? prefecture;
  final String? city;
  final String? fcmToken;
  final bool isPublic;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  ProfileModel({
    required this.id,
    required this.userId,
    required this.displayName,
    this.profileText,
    this.profileImageUrl,
    this.introAudioUrl,
    this.externalLinkUrl,
    this.prefecture,
    this.city,
    this.fcmToken,
    required this.isPublic,
    required this.createdAt,
    required this.updatedAt,
  });
  
  factory ProfileModel.fromJson(Map<String, dynamic> json) { ... }
  Map<String, dynamic> toJson() { ... }
}
```

### FollowModel
```dart
enum FollowType { family, watch }
enum FollowStatus { active, unfollowed }

class FollowModel extends FollowEntity {
  final String id;
  final String followerId;
  final String followeeId;
  final FollowType followType;
  final FollowStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  FollowModel({
    required this.id,
    required this.followerId,
    required this.followeeId,
    required this.followType,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });
  
  factory FollowModel.fromJson(Map<String, dynamic> json) { ... }
  Map<String, dynamic> toJson() { ... }
}
```

## 3. リポジトリ詳細

### AuthRepository
```dart
class AuthRepository implements IAuthRepository {
  final SupabaseAuthDataSource supabaseAuthDataSource;
  final SecureStorage secureStorage;
  
  AuthRepository({
    required this.supabaseAuthDataSource,
    required this.secureStorage,
  });
  
  @override
  Future<Either<Failure, AuthToken>> loginWithGoogle() async {
    try {
      final authResponse = await supabaseAuthDataSource.signInWithGoogle();
      if (authResponse.session != null) {
        await secureStorage.saveAccessToken(authResponse.session!.accessToken);
        await secureStorage.saveRefreshToken(authResponse.session!.refreshToken!);
        return Right(AuthToken(
          accessToken: authResponse.session!.accessToken,
          refreshToken: authResponse.session!.refreshToken!,
          expiresIn: authResponse.session!.expiresIn,
        ));
      } else {
        return Left(AuthFailure('Googleログインに失敗しました'));
      }
    } on AuthException catch (e) {
      return Left(AuthFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, AuthToken>> loginWithApple() async {
    try {
      final authResponse = await supabaseAuthDataSource.signInWithApple();
      if (authResponse.session != null) {
        await secureStorage.saveAccessToken(authResponse.session!.accessToken);
        await secureStorage.saveRefreshToken(authResponse.session!.refreshToken!);
        return Right(AuthToken(
          accessToken: authResponse.session!.accessToken,
          refreshToken: authResponse.session!.refreshToken!,
          expiresIn: authResponse.session!.expiresIn,
        ));
      } else {
        return Left(AuthFailure('Appleログインに失敗しました'));
      }
    } on AuthException catch (e) {
      return Left(AuthFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, AuthToken>> refreshToken(String refreshToken) async {
    try {
      final authResponse = await supabaseAuthDataSource.refreshSession(refreshToken);
      if (authResponse.session != null) {
        await secureStorage.saveAccessToken(authResponse.session!.accessToken);
        await secureStorage.saveRefreshToken(authResponse.session!.refreshToken!);
        return Right(AuthToken(
          accessToken: authResponse.session!.accessToken,
          refreshToken: authResponse.session!.refreshToken!,
          expiresIn: authResponse.session!.expiresIn,
        ));
      } else {
        return Left(AuthFailure('セッションの更新に失敗しました'));
      }
    } on AuthException catch (e) {
      return Left(AuthFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, bool>> logout() async {
    try {
      await supabaseAuthDataSource.signOut();
      await secureStorage.deleteAccessToken();
      await secureStorage.deleteRefreshToken();
      return Right(true);
    } on AuthException catch (e) {
      return Left(AuthFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
}
```

### UserRepository
```dart
class UserRepository implements IUserRepository {
  final UserRemoteDataSource remoteDataSource;
  final UserLocalDataSource localDataSource;
  
  UserRepository({
    required this.remoteDataSource,
    required this.localDataSource,
  });
  
  @override
  Future<Either<Failure, ProfileEntity>> getMyProfile() async {
    try {
      // キャッシュチェック
      final cachedProfile = await localDataSource.getProfile();
      if (cachedProfile != null) {
        return Right(cachedProfile);
      }
      
      final profile = await remoteDataSource.getMyProfile();
      await localDataSource.saveProfile(profile);
      return Right(profile);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, ProfileEntity>> getUserProfile(String userId) async {
    // 実装詳細
  }
  
  @override
  Future<Either<Failure, ProfileEntity>> updateProfile(ProfileUpdateParams params) async {
    // 実装詳細
  }
  
  @override
  Future<Either<Failure, String>> uploadProfileImage(File imageFile) async {
    // 実装詳細
  }
  
  @override
  Future<Either<Failure, String>> uploadIntroAudio(File audioFile) async {
    // 実装詳細
  }
  
  @override
  Future<Either<Failure, bool>> updateFcmToken(String token, String deviceId) async {
    // 実装詳細
  }
  
  @override
  Future<Either<Failure, bool>> deleteAccount() async {
    // 実装詳細
  }
}
```

### FollowRepository
```dart
class FollowRepository implements IFollowRepository {
  final FollowRemoteDataSource remoteDataSource;
  
  FollowRepository({
    required this.remoteDataSource,
  });
  
  @override
  Future<Either<Failure, FollowEntity>> followUser(
    String followeeId, 
    FollowType followType
  ) async {
    try {
      final follow = await remoteDataSource.followUser(followeeId, followType);
      return Right(follow);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, FollowEntity>> updateFollowType(
    String followId, 
    FollowType followType
  ) async {
    // 実装詳細
  }
  
  @override
  Future<Either<Failure, bool>> unfollowUser(String followId) async {
    // 実装詳細
  }
  
  @override
  Future<Either<Failure, PaginatedFollowers>> getFollowers(
    String userId, 
    int limit, 
    String? cursor
  ) async {
    // 実装詳細
  }
  
  @override
  Future<Either<Failure, PaginatedFollowing>> getFollowing(
    String userId, 
    int limit, 
    String? cursor, 
    FollowType? followType
  ) async {
    // 実装詳細
  }
}
```

## 4. ビューモデル詳細

### AuthViewModel
```dart
class AuthViewModel extends StateNotifier<AuthState> {
  final LoginWithGoogleUseCase loginWithGoogleUseCase;
  final LoginWithAppleUseCase loginWithAppleUseCase;
  final LogoutUseCase logoutUseCase;
  
  AuthViewModel({
    required this.loginWithGoogleUseCase,
    required this.loginWithAppleUseCase,
    required this.logoutUseCase,
  }) : super(AuthInitial());
  
  Future<void> loginWithGoogle() async {
    state = AuthLoading();
    try {
      final result = await loginWithGoogleUseCase();
      
      result.fold(
        (failure) => state = AuthError(failure.message),
        (token) => state = AuthSuccess(token)
      );
    } catch (e) {
      state = AuthError(e.toString());
    }
  }
  
  Future<void> loginWithApple() async {
    state = AuthLoading();
    try {
      final result = await loginWithAppleUseCase();
      
      result.fold(
        (failure) => state = AuthError(failure.message),
        (token) => state = AuthSuccess(token)
      );
    } catch (e) {
      state = AuthError(e.toString());
    }
  }
  
  Future<void> logout() async {
    state = AuthLoading();
    final result = await logoutUseCase();
    
    result.fold(
      (failure) => state = AuthError(failure.message),
      (_) => state = AuthInitial()
    );
  }
}
```

### ProfileViewModel
```dart
class ProfileViewModel extends StateNotifier<ProfileState> {
  final GetProfileUseCase getProfileUseCase;
  final UpdateProfileUseCase updateProfileUseCase;
  final UploadProfileImageUseCase uploadProfileImageUseCase;
  final UploadAudioUseCase uploadAudioUseCase;
  
  ProfileViewModel({
    required this.getProfileUseCase,
    required this.updateProfileUseCase,
    required this.uploadProfileImageUseCase,
    required this.uploadAudioUseCase,
  }) : super(ProfileInitial());
  
  Future<void> getMyProfile() async {
    state = ProfileLoading();
    final result = await getProfileUseCase();
    
    result.fold(
      (failure) => state = ProfileError(failure.message),
      (profile) => state = ProfileLoaded(profile)
    );
  }
  
  Future<void> getUserProfile(String userId) async {
    // 実装詳細
  }
  
  Future<void> updateProfile(ProfileUpdateParams params) async {
    state = ProfileUpdating();
    final result = await updateProfileUseCase(params);
    
    result.fold(
      (failure) => state = ProfileError(failure.message),
      (profile) => state = ProfileUpdated(profile)
    );
  }
  
  Future<void> uploadProfileImage(File image) async {
    // 実装詳細
  }
  
  Future<void> uploadIntroAudio(File audio) async {
    // 実装詳細
  }
}
```

### FollowViewModel
```dart
class FollowViewModel extends StateNotifier<FollowState> {
  final FollowUserUseCase followUserUseCase;
  final UnfollowUserUseCase unfollowUserUseCase;
  final UpdateFollowTypeUseCase updateFollowTypeUseCase;
  final GetFollowersUseCase getFollowersUseCase;
  final GetFollowingUseCase getFollowingUseCase;
  
  FollowViewModel({
    required this.followUserUseCase,
    required this.unfollowUserUseCase,
    required this.updateFollowTypeUseCase,
    required this.getFollowersUseCase,
    required this.getFollowingUseCase,
  }) : super(FollowInitial());
  
  Future<void> followUser(String followeeId, FollowType followType) async {
    state = FollowLoading();
    final result = await followUserUseCase(FollowParams(
      followeeId: followeeId,
      followType: followType,
    ));
    
    result.fold(
      (failure) => state = FollowError(failure.message),
      (follow) => state = FollowSuccess(follow)
    );
  }
  
  Future<void> unfollowUser(String followId) async {
    // 実装詳細
  }
  
  Future<void> updateFollowType(String followId, FollowType followType) async {
    // 実装詳細
  }
  
  Future<void> getFollowers(String userId, {int limit = 20, String? cursor}) async {
    // 実装詳細
  }
  
  Future<void> getFollowing(
    String userId, 
    {int limit = 20, String? cursor, FollowType? followType}
  ) async {
    // 実装詳細
  }
}
```

## 5. 依存性注入設定

```dart
// 依存性注入の設定
final userDomainModule = [
  // Supabase Client
  Provider<SupabaseClient>(
    (ref) => SupabaseClient(
      supabaseUrl,
      supabaseAnonKey,
    ),
  ),
  
  // データソース
  Provider<SupabaseAuthDataSource>(
    (ref) => SupabaseAuthDataSourceImpl(client: ref.watch(supabaseClientProvider)),
  ),
  Provider<UserRemoteDataSource>(
    (ref) => UserRemoteDataSourceImpl(client: ref.watch(httpClientProvider)),
  ),
  Provider<FollowRemoteDataSource>(
    (ref) => FollowRemoteDataSourceImpl(client: ref.watch(httpClientProvider)),
  ),
  Provider<UserLocalDataSource>(
    (ref) => UserLocalDataSourceImpl(storage: ref.watch(hiveStorageProvider)),
  ),
  
  // リポジトリ
  Provider<IAuthRepository>(
    (ref) => AuthRepository(
      supabaseAuthDataSource: ref.watch(supabaseAuthDataSourceProvider),
      secureStorage: ref.watch(secureStorageProvider),
    ),
  ),
  Provider<IUserRepository>(
    (ref) => UserRepository(
      remoteDataSource: ref.watch(userRemoteDataSourceProvider),
      localDataSource: ref.watch(userLocalDataSourceProvider),
    ),
  ),
  Provider<IFollowRepository>(
    (ref) => FollowRepository(
      remoteDataSource: ref.watch(followRemoteDataSourceProvider),
    ),
  ),
  
  // ユースケース
  Provider<LoginWithGoogleUseCase>(
    (ref) => LoginWithGoogleUseCase(
      repository: ref.watch(authRepositoryProvider),
    ),
  ),
  Provider<LoginWithAppleUseCase>(
    (ref) => LoginWithAppleUseCase(
      repository: ref.watch(authRepositoryProvider),
    ),
  ),
  Provider<GetProfileUseCase>(
    (ref) => GetProfileUseCase(
      repository: ref.watch(userRepositoryProvider),
    ),
  ),
  // 他のユースケースも同様に登録
  
  // ビューモデル
  StateNotifierProvider<AuthViewModel, AuthState>(
    (ref) => AuthViewModel(
      loginWithGoogleUseCase: ref.watch(loginWithGoogleUseCaseProvider),
      loginWithAppleUseCase: ref.watch(loginWithAppleUseCaseProvider),
      logoutUseCase: ref.watch(logoutUseCaseProvider),
    ),
  ),
  StateNotifierProvider<ProfileViewModel, ProfileState>(
    (ref) => ProfileViewModel(
      getProfileUseCase: ref.watch(getProfileUseCaseProvider),
      updateProfileUseCase: ref.watch(updateProfileUseCaseProvider),
      uploadProfileImageUseCase: ref.watch(uploadProfileImageUseCaseProvider),
      uploadAudioUseCase: ref.watch(uploadAudioUseCaseProvider),
    ),
  ),
  StateNotifierProvider<FollowViewModel, FollowState>(
    (ref) => FollowViewModel(
      followUserUseCase: ref.watch(followUserUseCaseProvider),
      unfollowUserUseCase: ref.watch(unfollowUserUseCaseProvider),
      updateFollowTypeUseCase: ref.watch(updateFollowTypeUseCaseProvider),
      getFollowersUseCase: ref.watch(getFollowersUseCaseProvider),
      getFollowingUseCase: ref.watch(getFollowingUseCaseProvider),
    ),
  ),
];
```

## 6. セキュリティ考慮事項

1. **認証トークン管理**
   - アクセストークンとリフレッシュトークンは SecureStorage に保存
   - トークン有効期限の厳密な検証
   - ログアウト時にトークンを確実に削除

2. **個人情報の取り扱い**
   - プロフィール情報の公開/非公開設定
   - ユーザー削除時のデータ匿名化（GDPR対応）
   - フォロー関係のプライバシー設定

3. **ネットワークセキュリティ**
   - SSL/TLS通信の強制
   - 認証ヘッダーのセキュアな取り扱い
   - APIリクエストの署名検証

## 7. テスト戦略

### 単体テスト
- モデルのシリアライズ/デシリアライズ
- リポジトリの各メソッド
- ユースケース
- ビューモデルの状態管理

### 統合テスト
- 認証フロー
- プロフィール更新フロー
- フォロー関係の操作

### UIテスト
- ログイン画面
- プロフィール表示/編集
- フォロワー/フォロー中一覧

## 8. エラーハンドリング

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

class AuthFailure extends Failure {
  const AuthFailure(String message) : super(message);
}

class ValidationFailure extends Failure {
  const ValidationFailure(String message) : super(message);
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
  return UnexpectedFailure(e.toString());
}
```

## 9. パフォーマンス最適化

1. **キャッシュ戦略**
   - プロフィール情報のローカルキャッシュ
   - フォロワー/フォロー中リストのページネーションとキャッシュ
   - 画像のキャッシュとプリロード

2. **バッチ処理**
   - フォロー/アンフォロー操作のバッチ処理
   - プロフィール更新時の部分更新サポート

3. **リソース最適化**
   - プロフィール画像の最適化（サイズ、フォーマット）
   - 音声ファイルの圧縮
   - APIレスポンスの最小化