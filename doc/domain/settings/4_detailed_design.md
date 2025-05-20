# 設定ドメイン詳細設計

## 1. アーキテクチャ概要

設定ドメインは、クリーンアーキテクチャに基づき以下の層に分けて実装します。

### プレゼンテーション層
- **画面（Screens）**
  - SettingsScreen
  - NotificationSettingsScreen
  - AccountSettingsScreen
  - PrivacySettingsScreen
  - DisplaySettingsScreen
  - BlockedUsersScreen
  - HelpScreen
  - FAQScreen
  - ContactFormScreen
  - TermsScreen
  - PrivacyPolicyScreen

- **ビューモデル（ViewModels）**
  - SettingsViewModel
  - NotificationSettingsViewModel
  - AccountSettingsViewModel
  - PrivacySettingsViewModel
  - DisplaySettingsViewModel
  - BlockedUsersViewModel
  - HelpViewModel
  - FAQViewModel
  - ContactFormViewModel

- **ウィジェット（Widgets）**
  - SettingsListTile
  - SettingsSection
  - SettingsSwitch
  - SettingsRadioOption
  - QuietHoursPicker
  - BlockedUserItem
  - FAQItem
  - FAQCategoryList
  - SettingsAppBar

### ドメイン層
- **エンティティ（Entities）**
  - NotificationSettingsEntity
  - AccountSettingsEntity
  - PrivacySettingsEntity
  - DisplaySettingsEntity
  - BlockedUserEntity
  - FAQCategoryEntity
  - FAQEntity
  - ContactFormEntity

- **リポジトリインターフェース（Repository Interfaces）**
  - ISettingsRepository
  - IBlockedUserRepository
  - IHelpRepository

- **ユースケース（Use Cases）**
  - GetNotificationSettingsUseCase
  - UpdateNotificationSettingsUseCase
  - GetAccountSettingsUseCase
  - UpdateAccountSettingsUseCase
  - GetPrivacySettingsUseCase
  - UpdatePrivacySettingsUseCase
  - GetDisplaySettingsUseCase
  - UpdateDisplaySettingsUseCase
  - GetBlockedUsersUseCase
  - BlockUserUseCase
  - UnblockUserUseCase
  - GetFAQsUseCase
  - SubmitContactFormUseCase
  - GetTermsUseCase
  - GetPrivacyPolicyUseCase
  - DeleteAccountUseCase

### データ層
- **リポジトリ実装（Repository Implementations）**
  - SettingsRepository
  - BlockedUserRepository
  - HelpRepository

- **データソース（Data Sources）**
  - SettingsRemoteDataSource
  - SettingsLocalDataSource
  - BlockedUserRemoteDataSource
  - HelpRemoteDataSource

- **モデル（Models）**
  - NotificationSettingsModel
  - AccountSettingsModel
  - PrivacySettingsModel
  - DisplaySettingsModel
  - BlockedUserModel
  - FAQCategoryModel
  - FAQModel
  - ContactFormModel

## 2. データモデル詳細

### NotificationSettingsModel
```dart
class NotificationSettingsModel extends NotificationSettingsEntity {
  final String userId;
  final bool commentEnabled;
  final bool highlightEnabled;
  final bool followEnabled;
  final bool eventEnabled;
  final bool aiAnalysisEnabled;
  final QuietHours? quietHours;
  final DateTime updatedAt;
  
  NotificationSettingsModel({
    required this.userId,
    required this.commentEnabled,
    required this.highlightEnabled,
    required this.followEnabled,
    required this.eventEnabled,
    required this.aiAnalysisEnabled,
    this.quietHours,
    required this.updatedAt,
  });
  
  factory NotificationSettingsModel.fromJson(Map<String, dynamic> json) {
    return NotificationSettingsModel(
      userId: json['user_id'],
      commentEnabled: json['comment_enabled'] ?? true,
      highlightEnabled: json['highlight_enabled'] ?? true,
      followEnabled: json['follow_enabled'] ?? true,
      eventEnabled: json['event_enabled'] ?? true,
      aiAnalysisEnabled: json['ai_analysis_enabled'] ?? true,
      quietHours: json['quiet_hours'] != null 
          ? QuietHours.fromJson(json['quiet_hours']) 
          : null,
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'comment_enabled': commentEnabled,
      'highlight_enabled': highlightEnabled,
      'follow_enabled': followEnabled,
      'event_enabled': eventEnabled,
      'ai_analysis_enabled': aiAnalysisEnabled,
      'quiet_hours': quietHours?.toJson(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
  
  NotificationSettingsModel copyWith({
    String? userId,
    bool? commentEnabled,
    bool? highlightEnabled,
    bool? followEnabled,
    bool? eventEnabled,
    bool? aiAnalysisEnabled,
    QuietHours? quietHours,
    DateTime? updatedAt,
  }) {
    return NotificationSettingsModel(
      userId: userId ?? this.userId,
      commentEnabled: commentEnabled ?? this.commentEnabled,
      highlightEnabled: highlightEnabled ?? this.highlightEnabled,
      followEnabled: followEnabled ?? this.followEnabled,
      eventEnabled: eventEnabled ?? this.eventEnabled,
      aiAnalysisEnabled: aiAnalysisEnabled ?? this.aiAnalysisEnabled,
      quietHours: quietHours ?? this.quietHours,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class QuietHours {
  final bool enabled;
  final String start;
  final String end;
  
  QuietHours({
    required this.enabled,
    required this.start,
    required this.end,
  });
  
  factory QuietHours.fromJson(Map<String, dynamic> json) {
    return QuietHours(
      enabled: json['enabled'] ?? false,
      start: json['start'] ?? '22:00',
      end: json['end'] ?? '07:00',
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'enabled': enabled,
      'start': start,
      'end': end,
    };
  }
}
```

### AccountSettingsModel
```dart
enum Language { ja, en }
enum AppTheme { light, dark, system }
enum DataUsage { low, medium, high }

class AccountSettingsModel extends AccountSettingsEntity {
  final String userId;
  final Language language;
  final AppTheme theme;
  final bool autoPlayMedia;
  final DataUsage dataUsage;
  final DateTime updatedAt;
  
  AccountSettingsModel({
    required this.userId,
    required this.language,
    required this.theme,
    required this.autoPlayMedia,
    required this.dataUsage,
    required this.updatedAt,
  });
  
  factory AccountSettingsModel.fromJson(Map<String, dynamic> json) {
    return AccountSettingsModel(
      userId: json['user_id'],
      language: Language.values.byName(json['language'] ?? 'ja'),
      theme: AppTheme.values.byName(json['theme'] ?? 'system'),
      autoPlayMedia: json['auto_play_media'] ?? true,
      dataUsage: DataUsage.values.byName(json['data_usage'] ?? 'medium'),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'language': language.name,
      'theme': theme.name,
      'auto_play_media': autoPlayMedia,
      'data_usage': dataUsage.name,
      'updated_at': updatedAt.toIso8601String(),
    };
  }
  
  AccountSettingsModel copyWith({
    String? userId,
    Language? language,
    AppTheme? theme,
    bool? autoPlayMedia,
    DataUsage? dataUsage,
    DateTime? updatedAt,
  }) {
    return AccountSettingsModel(
      userId: userId ?? this.userId,
      language: language ?? this.language,
      theme: theme ?? this.theme,
      autoPlayMedia: autoPlayMedia ?? this.autoPlayMedia,
      dataUsage: dataUsage ?? this.dataUsage,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
```

### PrivacySettingsModel
```dart
enum ContentVisibility { public, family, private }

class PrivacySettingsModel extends PrivacySettingsEntity {
  final String userId;
  final bool locationSharing;
  final ContentVisibility contentVisibility;
  final bool activityStatus;
  final bool dataCollection;
  final DateTime updatedAt;
  
  PrivacySettingsModel({
    required this.userId,
    required this.locationSharing,
    required this.contentVisibility,
    required this.activityStatus,
    required this.dataCollection,
    required this.updatedAt,
  });
  
  factory PrivacySettingsModel.fromJson(Map<String, dynamic> json) {
    return PrivacySettingsModel(
      userId: json['user_id'],
      locationSharing: json['location_sharing'] ?? false,
      contentVisibility: ContentVisibility.values.byName(json['content_visibility'] ?? 'public'),
      activityStatus: json['activity_status'] ?? true,
      dataCollection: json['data_collection'] ?? true,
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'location_sharing': locationSharing,
      'content_visibility': contentVisibility.name,
      'activity_status': activityStatus,
      'data_collection': dataCollection,
      'updated_at': updatedAt.toIso8601String(),
    };
  }
  
  PrivacySettingsModel copyWith({
    String? userId,
    bool? locationSharing,
    ContentVisibility? contentVisibility,
    bool? activityStatus,
    bool? dataCollection,
    DateTime? updatedAt,
  }) {
    return PrivacySettingsModel(
      userId: userId ?? this.userId,
      locationSharing: locationSharing ?? this.locationSharing,
      contentVisibility: contentVisibility ?? this.contentVisibility,
      activityStatus: activityStatus ?? this.activityStatus,
      dataCollection: dataCollection ?? this.dataCollection,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
```

### DisplaySettingsModel
```dart
enum FontSize { small, medium, large }
enum ContentDensity { compact, standard, comfortable }

class DisplaySettingsModel extends DisplaySettingsEntity {
  final String userId;
  final FontSize fontSize;
  final ContentDensity contentDensity;
  final bool reduceMotion;
  final bool highContrast;
  final DateTime updatedAt;
  
  DisplaySettingsModel({
    required this.userId,
    required this.fontSize,
    required this.contentDensity,
    required this.reduceMotion,
    required this.highContrast,
    required this.updatedAt,
  });
  
  factory DisplaySettingsModel.fromJson(Map<String, dynamic> json) {
    return DisplaySettingsModel(
      userId: json['user_id'],
      fontSize: FontSize.values.byName(json['font_size'] ?? 'medium'),
      contentDensity: ContentDensity.values.byName(json['content_density'] ?? 'standard'),
      reduceMotion: json['reduce_motion'] ?? false,
      highContrast: json['high_contrast'] ?? false,
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'font_size': fontSize.name,
      'content_density': contentDensity.name,
      'reduce_motion': reduceMotion,
      'high_contrast': highContrast,
      'updated_at': updatedAt.toIso8601String(),
    };
  }
  
  DisplaySettingsModel copyWith({
    String? userId,
    FontSize? fontSize,
    ContentDensity? contentDensity,
    bool? reduceMotion,
    bool? highContrast,
    DateTime? updatedAt,
  }) {
    return DisplaySettingsModel(
      userId: userId ?? this.userId,
      fontSize: fontSize ?? this.fontSize,
      contentDensity: contentDensity ?? this.contentDensity,
      reduceMotion: reduceMotion ?? this.reduceMotion,
      highContrast: highContrast ?? this.highContrast,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
```

### BlockedUserModel
```dart
class BlockedUserModel extends BlockedUserEntity {
  final String id;
  final String userId;
  final String blockedUserId;
  final UserModel? blockedUser;
  final String? reason;
  final DateTime createdAt;
  
  BlockedUserModel({
    required this.id,
    required this.userId,
    required this.blockedUserId,
    this.blockedUser,
    this.reason,
    required this.createdAt,
  });
  
  factory BlockedUserModel.fromJson(Map<String, dynamic> json) {
    return BlockedUserModel(
      id: json['id'],
      userId: json['user_id'],
      blockedUserId: json['blocked_user_id'],
      blockedUser: json['blocked_user'] != null 
          ? UserModel.fromJson(json['blocked_user']) 
          : null,
      reason: json['reason'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'blocked_user_id': blockedUserId,
      'blocked_user': blockedUser?.toJson(),
      'reason': reason,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
```

### FAQCategoryModel
```dart
class FAQCategoryModel extends FAQCategoryEntity {
  final String id;
  final String name;
  final int order;
  final List<FAQModel> faqs;
  
  FAQCategoryModel({
    required this.id,
    required this.name,
    required this.order,
    this.faqs = const [],
  });
  
  factory FAQCategoryModel.fromJson(Map<String, dynamic> json) {
    List<FAQModel> faqList = [];
    if (json['faqs'] != null) {
      faqList = (json['faqs'] as List)
          .map((faq) => FAQModel.fromJson(faq))
          .toList();
    }
    
    return FAQCategoryModel(
      id: json['id'],
      name: json['name'],
      order: json['order'] ?? 0,
      faqs: faqList,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'order': order,
      'faqs': faqs.map((faq) => faq.toJson()).toList(),
    };
  }
}
```

### FAQModel
```dart
class FAQModel extends FAQEntity {
  final String id;
  final String categoryId;
  final String question;
  final String answer;
  final int order;
  final DateTime updatedAt;
  
  FAQModel({
    required this.id,
    required this.categoryId,
    required this.question,
    required this.answer,
    required this.order,
    required this.updatedAt,
  });
  
  factory FAQModel.fromJson(Map<String, dynamic> json) {
    return FAQModel(
      id: json['id'],
      categoryId: json['category_id'],
      question: json['question'],
      answer: json['answer'],
      order: json['order'] ?? 0,
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'category_id': categoryId,
      'question': question,
      'answer': answer,
      'order': order,
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}
```

### ContactFormModel
```dart
enum ContactFormStatus { pending, processing, resolved }

class ContactFormModel extends ContactFormEntity {
  final String id;
  final String userId;
  final String email;
  final String subject;
  final String message;
  final ContactFormStatus status;
  final DateTime createdAt;
  final DateTime? updatedAt;
  
  ContactFormModel({
    required this.id,
    required this.userId,
    required this.email,
    required this.subject,
    required this.message,
    this.status = ContactFormStatus.pending,
    required this.createdAt,
    this.updatedAt,
  });
  
  factory ContactFormModel.fromJson(Map<String, dynamic> json) {
    return ContactFormModel(
      id: json['id'],
      userId: json['user_id'],
      email: json['email'],
      subject: json['subject'],
      message: json['message'],
      status: ContactFormStatus.values.byName(json['status'] ?? 'pending'),
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at']) 
          : null,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'email': email,
      'subject': subject,
      'message': message,
      'status': status.name,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }
}
```

## 3. リポジトリ詳細

### SettingsRepository
```dart
class SettingsRepository implements ISettingsRepository {
  final SettingsRemoteDataSource remoteDataSource;
  final SettingsLocalDataSource localDataSource;
  
  SettingsRepository({
    required this.remoteDataSource,
    required this.localDataSource,
  });
  
  @override
  Future<Either<Failure, NotificationSettingsEntity>> getNotificationSettings() async {
    try {
      // キャッシュチェック
      final cachedSettings = await localDataSource.getNotificationSettings();
      if (cachedSettings != null) {
        return Right(cachedSettings);
      }
      
      final settings = await remoteDataSource.getNotificationSettings();
      await localDataSource.saveNotificationSettings(settings);
      return Right(settings);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, NotificationSettingsEntity>> updateNotificationSettings(
    NotificationSettingsParams params
  ) async {
    try {
      final settings = await remoteDataSource.updateNotificationSettings(params);
      await localDataSource.saveNotificationSettings(settings);
      return Right(settings);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, AccountSettingsEntity>> getAccountSettings() async {
    try {
      final cachedSettings = await localDataSource.getAccountSettings();
      if (cachedSettings != null) {
        return Right(cachedSettings);
      }
      
      final settings = await remoteDataSource.getAccountSettings();
      await localDataSource.saveAccountSettings(settings);
      return Right(settings);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, AccountSettingsEntity>> updateAccountSettings(
    AccountSettingsParams params
  ) async {
    try {
      final settings = await remoteDataSource.updateAccountSettings(params);
      await localDataSource.saveAccountSettings(settings);
      return Right(settings);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, PrivacySettingsEntity>> getPrivacySettings() async {
    try {
      final cachedSettings = await localDataSource.getPrivacySettings();
      if (cachedSettings != null) {
        return Right(cachedSettings);
      }
      
      final settings = await remoteDataSource.getPrivacySettings();
      await localDataSource.savePrivacySettings(settings);
      return Right(settings);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, PrivacySettingsEntity>> updatePrivacySettings(
    PrivacySettingsParams params
  ) async {
    try {
      final settings = await remoteDataSource.updatePrivacySettings(params);
      await localDataSource.savePrivacySettings(settings);
      return Right(settings);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, DisplaySettingsEntity>> getDisplaySettings() async {
    try {
      final cachedSettings = await localDataSource.getDisplaySettings();
      if (cachedSettings != null) {
        return Right(cachedSettings);
      }
      
      final settings = await remoteDataSource.getDisplaySettings();
      await localDataSource.saveDisplaySettings(settings);
      return Right(settings);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, DisplaySettingsEntity>> updateDisplaySettings(
    DisplaySettingsParams params
  ) async {
    try {
      final settings = await remoteDataSource.updateDisplaySettings(params);
      await localDataSource.saveDisplaySettings(settings);
      return Right(settings);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, bool>> deleteAccount(String reason) async {
    try {
      final result = await remoteDataSource.deleteAccount(reason);
      if (result) {
        await localDataSource.clearAllSettings();
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

### BlockedUserRepository
```dart
class BlockedUserRepository implements IBlockedUserRepository {
  final BlockedUserRemoteDataSource remoteDataSource;
  
  BlockedUserRepository({
    required this.remoteDataSource,
  });
  
  @override
  Future<Either<Failure, PaginatedBlockedUsers>> getBlockedUsers(
    int limit, 
    String? cursor
  ) async {
    try {
      final result = await remoteDataSource.getBlockedUsers(limit, cursor);
      return Right(result);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, BlockedUserEntity>> blockUser(
    String blockedUserId, 
    String? reason
  ) async {
    try {
      final blockedUser = await remoteDataSource.blockUser(blockedUserId, reason);
      return Right(blockedUser);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, bool>> unblockUser(String blockedUserId) async {
    try {
      final result = await remoteDataSource.unblockUser(blockedUserId);
      return Right(result);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
}
```

### HelpRepository
```dart
class HelpRepository implements IHelpRepository {
  final HelpRemoteDataSource remoteDataSource;
  
  HelpRepository({
    required this.remoteDataSource,
  });
  
  @override
  Future<Either<Failure, List<FAQCategoryEntity>>> getFAQs({String? query, String? categoryId}) async {
    try {
      final faqs = await remoteDataSource.getFAQs(query: query, categoryId: categoryId);
      return Right(faqs);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, ContactFormEntity>> submitContactForm(ContactFormParams params) async {
    try {
      final result = await remoteDataSource.submitContactForm(params);
      return Right(result);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, String>> getTerms() async {
    try {
      final terms = await remoteDataSource.getTerms();
      return Right(terms);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, String>> getPrivacyPolicy() async {
    try {
      final privacyPolicy = await remoteDataSource.getPrivacyPolicy();
      return Right(privacyPolicy);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, AppInfo>> getAppInfo() async {
    try {
      final appInfo = await remoteDataSource.getAppInfo();
      return Right(appInfo);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(UnexpectedFailure(e.toString()));
    }
  }
}
```

## 4. データソース詳細

### SettingsRemoteDataSource
```dart
abstract class SettingsRemoteDataSource {
  Future<NotificationSettingsModel> getNotificationSettings();
  Future<NotificationSettingsModel> updateNotificationSettings(NotificationSettingsParams params);
  Future<AccountSettingsModel> getAccountSettings();
  Future<AccountSettingsModel> updateAccountSettings(AccountSettingsParams params);
  Future<PrivacySettingsModel> getPrivacySettings();
  Future<PrivacySettingsModel> updatePrivacySettings(PrivacySettingsParams params);
  Future<DisplaySettingsModel> getDisplaySettings();
  Future<DisplaySettingsModel> updateDisplaySettings(DisplaySettingsParams params);
  Future<bool> deleteAccount(String reason);
}

class SettingsRemoteDataSourceImpl implements SettingsRemoteDataSource {
  final http.Client client;
  final String baseUrl;
  
  SettingsRemoteDataSourceImpl({
    required this.client,
    this.baseUrl = 'https://api.kanushi.app/v1',
  });
  
  @override
  Future<NotificationSettingsModel> getNotificationSettings() async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/settings/notifications'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        return NotificationSettingsModel.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '通知設定の取得に失敗しました',
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
  Future<NotificationSettingsModel> updateNotificationSettings(NotificationSettingsParams params) async {
    try {
      final response = await client.patch(
        Uri.parse('$baseUrl/settings/notifications'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getAuthToken()}',
        },
        body: json.encode(params.toJson()),
      );
      
      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        if (responseData['success'] == true) {
          // 更新後の設定を取得
          return await getNotificationSettings();
        } else {
          throw ServerException('通知設定の更新に失敗しました');
        }
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? '通知設定の更新に失敗しました',
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

  // 他のメソッドも同様に実装
  
  // 認証トークン取得
  Future<String> _getAuthToken() async {
    final secureStorage = FlutterSecureStorage();
    return await secureStorage.read(key: 'auth_token') ?? '';
  }
}
```

### SettingsLocalDataSource
```dart
abstract class SettingsLocalDataSource {
  Future<NotificationSettingsModel?> getNotificationSettings();
  Future<void> saveNotificationSettings(NotificationSettingsModel settings);
  Future<AccountSettingsModel?> getAccountSettings();
  Future<void> saveAccountSettings(AccountSettingsModel settings);
  Future<PrivacySettingsModel?> getPrivacySettings();
  Future<void> savePrivacySettings(PrivacySettingsModel settings);
  Future<DisplaySettingsModel?> getDisplaySettings();
  Future<void> saveDisplaySettings(DisplaySettingsModel settings);
  Future<void> clearAllSettings();
}

class SettingsLocalDataSourceImpl implements SettingsLocalDataSource {
  final Box<dynamic> settingsBox;
  
  SettingsLocalDataSourceImpl({
    required this.settingsBox,
  });
  
  @override
  Future<NotificationSettingsModel?> getNotificationSettings() async {
    try {
      final json = settingsBox.get('notification_settings');
      if (json != null) {
        return NotificationSettingsModel.fromJson(jsonDecode(json));
      }
      return null;
    } catch (e) {
      throw CacheException('通知設定の取得に失敗しました: ${e.toString()}');
    }
  }
  
  @override
  Future<void> saveNotificationSettings(NotificationSettingsModel settings) async {
    try {
      await settingsBox.put(
        'notification_settings',
        jsonEncode(settings.toJson()),
      );
    } catch (e) {
      throw CacheException('通知設定の保存に失敗しました: ${e.toString()}');
    }
  }

  // 他のメソッドも同様に実装
  
  @override
  Future<void> clearAllSettings() async {
    try {
      await settingsBox.delete('notification_settings');
      await settingsBox.delete('account_settings');
      await settingsBox.delete('privacy_settings');
      await settingsBox.delete('display_settings');
    } catch (e) {
      throw CacheException('設定のクリアに失敗しました: ${e.toString()}');
    }
  }
}
```

### BlockedUserRemoteDataSource
```dart
abstract class BlockedUserRemoteDataSource {
  Future<PaginatedBlockedUsers> getBlockedUsers(int limit, String? cursor);
  Future<BlockedUserModel> blockUser(String blockedUserId, String? reason);
  Future<bool> unblockUser(String blockedUserId);
}

class BlockedUserRemoteDataSourceImpl implements BlockedUserRemoteDataSource {
  final http.Client client;
  final String baseUrl;
  
  BlockedUserRemoteDataSourceImpl({
    required this.client,
    this.baseUrl = 'https://api.kanushi.app/v1',
  });
  
  @override
  Future<PaginatedBlockedUsers> getBlockedUsers(int limit, String? cursor) async {
    try {
      final queryParams = {
        'limit': limit.toString(),
        if (cursor != null) 'cursor': cursor,
      };
      
      final uri = Uri.parse('$baseUrl/settings/blocked-users').replace(
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
        return PaginatedBlockedUsers.fromJson(json.decode(response.body));
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? 'ブロックユーザー一覧の取得に失敗しました',
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
  
  // 他のメソッドも同様に実装
  
  // 認証トークン取得
  Future<String> _getAuthToken() async {
    final secureStorage = FlutterSecureStorage();
    return await secureStorage.read(key: 'auth_token') ?? '';
  }
}

class PaginatedBlockedUsers {
  final List<BlockedUserModel> blockedUsers;
  final String? nextCursor;
  
  PaginatedBlockedUsers({
    required this.blockedUsers,
    this.nextCursor,
  });
  
  factory PaginatedBlockedUsers.fromJson(Map<String, dynamic> json) {
    return PaginatedBlockedUsers(
      blockedUsers: (json['blockedUsers'] as List)
          .map((user) => BlockedUserModel.fromJson(user))
          .toList(),
      nextCursor: json['nextCursor'],
    );
  }
}
```

### HelpRemoteDataSource
```dart
abstract class HelpRemoteDataSource {
  Future<List<FAQCategoryModel>> getFAQs({String? query, String? categoryId});
  Future<ContactFormModel> submitContactForm(ContactFormParams params);
  Future<String> getTerms();
  Future<String> getPrivacyPolicy();
  Future<AppInfo> getAppInfo();
}

class HelpRemoteDataSourceImpl implements HelpRemoteDataSource {
  final http.Client client;
  final String baseUrl;
  
  HelpRemoteDataSourceImpl({
    required this.client,
    this.baseUrl = 'https://api.kanushi.app/v1',
  });
  
  @override
  Future<List<FAQCategoryModel>> getFAQs({String? query, String? categoryId}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (query != null) queryParams['query'] = query;
      if (categoryId != null) queryParams['category'] = categoryId;
      
      final uri = Uri.parse('$baseUrl/help/faq').replace(
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
        final data = json.decode(response.body);
        return (data['categories'] as List)
            .map((category) => FAQCategoryModel.fromJson(category))
            .toList();
      } else {
        throw ServerException(
          json.decode(response.body)['message'] ?? 'FAQの取得に失敗しました',
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
  
  // 他のメソッドも同様に実装
  
  // 認証トークン取得
  Future<String> _getAuthToken() async {
    final secureStorage = FlutterSecureStorage();
    return await secureStorage.read(key: 'auth_token') ?? '';
  }
}

class AppInfo {
  final String appName;
  final String version;
  final String buildNumber;
  final String environment;
  final bool updateAvailable;
  final String minimumRequiredVersion;
  
  AppInfo({
    required this.appName,
    required this.version,
    required this.buildNumber,
    required this.environment,
    required this.updateAvailable,
    required this.minimumRequiredVersion,
  });
  
  factory AppInfo.fromJson(Map<String, dynamic> json) {
    return AppInfo(
      appName: json['appName'],
      version: json['version'],
      buildNumber: json['buildNumber'],
      environment: json['environment'],
      updateAvailable: json['updateAvailable'] ?? false,
      minimumRequiredVersion: json['minimumRequiredVersion'],
    );
  }
}
```

## 5. ユースケース詳細

### GetNotificationSettingsUseCase
```dart
class GetNotificationSettingsUseCase {
  final ISettingsRepository repository;
  
  GetNotificationSettingsUseCase({required this.repository});
  
  Future<Either<Failure, NotificationSettingsEntity>> call() async {
    return repository.getNotificationSettings();
  }
}
```

### UpdateNotificationSettingsUseCase
```dart
class NotificationSettingsParams {
  final bool? commentEnabled;
  final bool? highlightEnabled;
  final bool? followEnabled;
  final bool? eventEnabled;
  final bool? aiAnalysisEnabled;
  final QuietHours? quietHours;
  
  NotificationSettingsParams({
    this.commentEnabled,
    this.highlightEnabled,
    this.followEnabled,
    this.eventEnabled,
    this.aiAnalysisEnabled,
    this.quietHours,
  });
  
  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (commentEnabled != null) json['commentEnabled'] = commentEnabled;
    if (highlightEnabled != null) json['highlightEnabled'] = highlightEnabled;
    if (followEnabled != null) json['followEnabled'] = followEnabled;
    if (eventEnabled != null) json['eventEnabled'] = eventEnabled;
    if (aiAnalysisEnabled != null) json['aiAnalysisEnabled'] = aiAnalysisEnabled;
    if (quietHours != null) json['quietHours'] = quietHours!.toJson();
    return json;
  }
}

class UpdateNotificationSettingsUseCase {
  final ISettingsRepository repository;
  
  UpdateNotificationSettingsUseCase({required this.repository});
  
  Future<Either<Failure, NotificationSettingsEntity>> call(NotificationSettingsParams params) async {
    return repository.updateNotificationSettings(params);
  }
}
```

### GetBlockedUsersUseCase
```dart
class GetBlockedUsersUseCase {
  final IBlockedUserRepository repository;
  
  GetBlockedUsersUseCase({required this.repository});
  
  Future<Either<Failure, PaginatedBlockedUsers>> call({
    int limit = 20,
    String? cursor,
  }) async {
    return repository.getBlockedUsers(limit, cursor);
  }
}
```

### SubmitContactFormUseCase
```dart
class ContactFormParams {
  final String email;
  final String subject;
  final String message;
  
  ContactFormParams({
    required this.email,
    required this.subject,
    required this.message,
  });
  
  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'subject': subject,
      'message': message,
    };
  }
}

class SubmitContactFormUseCase {
  final IHelpRepository repository;
  
  SubmitContactFormUseCase({required this.repository});
  
  Future<Either<Failure, ContactFormEntity>> call(ContactFormParams params) async {
    return repository.submitContactForm(params);
  }
}
```

## 6. ビューモデル詳細

### NotificationSettingsViewModel
```dart
class NotificationSettingsViewModel extends StateNotifier<NotificationSettingsState> {
  final GetNotificationSettingsUseCase getNotificationSettingsUseCase;
  final UpdateNotificationSettingsUseCase updateNotificationSettingsUseCase;
  
  NotificationSettingsViewModel({
    required this.getNotificationSettingsUseCase,
    required this.updateNotificationSettingsUseCase,
  }) : super(NotificationSettingsInitial());
  
  Future<void> getNotificationSettings() async {
    state = NotificationSettingsLoading();
    
    final result = await getNotificationSettingsUseCase();
    
    result.fold(
      (failure) => state = NotificationSettingsError(failure.message),
      (settings) => state = NotificationSettingsLoaded(settings)
    );
  }
  
  Future<void> updateNotificationSettings({
    bool? commentEnabled,
    bool? highlightEnabled,
    bool? followEnabled,
    bool? eventEnabled,
    bool? aiAnalysisEnabled,
    QuietHours? quietHours,
  }) async {
    if (state is NotificationSettingsLoaded) {
      final currentSettings = (state as NotificationSettingsLoaded).settings;
      state = NotificationSettingsUpdating(currentSettings);
      
      final params = NotificationSettingsParams(
        commentEnabled: commentEnabled,
        highlightEnabled: highlightEnabled,
        followEnabled: followEnabled,
        eventEnabled: eventEnabled,
        aiAnalysisEnabled: aiAnalysisEnabled,
        quietHours: quietHours,
      );
      
      final result = await updateNotificationSettingsUseCase(params);
      
      result.fold(
        (failure) {
          state = NotificationSettingsLoaded(currentSettings);
          state = NotificationSettingsError(failure.message);
        },
        (updatedSettings) => state = NotificationSettingsLoaded(updatedSettings)
      );
    }
  }
}

// 状態定義
abstract class NotificationSettingsState {}

class NotificationSettingsInitial extends NotificationSettingsState {}

class NotificationSettingsLoading extends NotificationSettingsState {}

class NotificationSettingsUpdating extends NotificationSettingsState {
  final NotificationSettingsEntity settings;
  NotificationSettingsUpdating(this.settings);
}

class NotificationSettingsLoaded extends NotificationSettingsState {
  final NotificationSettingsEntity settings;
  NotificationSettingsLoaded(this.settings);
}

class NotificationSettingsError extends NotificationSettingsState {
  final String message;
  NotificationSettingsError(this.message);
}
```

### BlockedUsersViewModel
```dart
class BlockedUsersViewModel extends StateNotifier<BlockedUsersState> {
  final GetBlockedUsersUseCase getBlockedUsersUseCase;
  final BlockUserUseCase blockUserUseCase;
  final UnblockUserUseCase unblockUserUseCase;
  
  BlockedUsersViewModel({
    required this.getBlockedUsersUseCase,
    required this.blockUserUseCase,
    required this.unblockUserUseCase,
  }) : super(BlockedUsersInitial());
  
  Future<void> getBlockedUsers({int limit = 20, String? cursor}) async {
    // 初回ロードかページネーションかで状態を変える
    if (cursor == null) {
      state = BlockedUsersLoading();
    } else if (state is BlockedUsersLoaded) {
      state = BlockedUsersLoadingMore(
        (state as BlockedUsersLoaded).blockedUsers,
        (state as BlockedUsersLoaded).nextCursor,
      );
    }
    
    final result = await getBlockedUsersUseCase(limit: limit, cursor: cursor);
    
    result.fold(
      (failure) => state = BlockedUsersError(failure.message),
      (paginatedUsers) {
        if (cursor != null && state is BlockedUsersLoadingMore) {
          // 既存のリストに追加
          final currentUsers = (state as BlockedUsersLoadingMore).blockedUsers;
          state = BlockedUsersLoaded(
            [...currentUsers, ...paginatedUsers.blockedUsers],
            paginatedUsers.nextCursor,
          );
        } else {
          // 新しいリストをセット
          state = BlockedUsersLoaded(
            paginatedUsers.blockedUsers,
            paginatedUsers.nextCursor,
          );
        }
      },
    );
  }
  
  Future<void> blockUser(String userId, {String? reason}) async {
    state = BlockedUsersActionLoading();
    
    final result = await blockUserUseCase(userId, reason);
    
    result.fold(
      (failure) => state = BlockedUsersError(failure.message),
      (blockedUser) {
        // ブロック成功後、リストを再取得
        getBlockedUsers();
      },
    );
  }
  
  Future<void> unblockUser(String blockedUserId) async {
    if (state is BlockedUsersLoaded) {
      final currentUsers = (state as BlockedUsersLoaded).blockedUsers;
      final nextCursor = (state as BlockedUsersLoaded).nextCursor;
      
      // 楽観的更新（UI向け）
      final updatedUsers = currentUsers
          .where((user) => user.blockedUserId != blockedUserId)
          .toList();
      
      state = BlockedUsersLoaded(updatedUsers, nextCursor);
      
      // 実際の解除処理
      final result = await unblockUserUseCase(blockedUserId);
      
      result.fold(
        (failure) {
          // 失敗した場合は元の状態に戻す
          state = BlockedUsersLoaded(currentUsers, nextCursor);
          state = BlockedUsersError(failure.message);
        },
        (_) => {}, // 成功した場合は既に反映済み
      );
    }
  }
  
  Future<void> loadMore() async {
    if (state is BlockedUsersLoaded) {
      final loadedState = state as BlockedUsersLoaded;
      if (loadedState.nextCursor != null) {
        await getBlockedUsers(cursor: loadedState.nextCursor);
      }
    }
  }
}

// 状態定義
abstract class BlockedUsersState {}

class BlockedUsersInitial extends BlockedUsersState {}

class BlockedUsersLoading extends BlockedUsersState {}

class BlockedUsersLoadingMore extends BlockedUsersState {
  final List<BlockedUserEntity> blockedUsers;
  final String? nextCursor;
  BlockedUsersLoadingMore(this.blockedUsers, this.nextCursor);
}

class BlockedUsersActionLoading extends BlockedUsersState {}

class BlockedUsersLoaded extends BlockedUsersState {
  final List<BlockedUserEntity> blockedUsers;
  final String? nextCursor;
  BlockedUsersLoaded(this.blockedUsers, this.nextCursor);
}

class BlockedUsersError extends BlockedUsersState {
  final String message;
  BlockedUsersError(this.message);
}
```

## 7. 依存性注入設定

```dart
// 依存性注入の設定
final settingsDomainModule = [
  // データソース
  Provider<SettingsRemoteDataSource>(
    (ref) => SettingsRemoteDataSourceImpl(
      client: ref.watch(httpClientProvider),
    ),
  ),
  Provider<SettingsLocalDataSource>(
    (ref) => SettingsLocalDataSourceImpl(
      settingsBox: ref.watch(settingsBoxProvider),
    ),
  ),
  Provider<BlockedUserRemoteDataSource>(
    (ref) => BlockedUserRemoteDataSourceImpl(
      client: ref.watch(httpClientProvider),
    ),
  ),
  Provider<HelpRemoteDataSource>(
    (ref) => HelpRemoteDataSourceImpl(
      client: ref.watch(httpClientProvider),
    ),
  ),
  
  // リポジトリ
  Provider<ISettingsRepository>(
    (ref) => SettingsRepository(
      remoteDataSource: ref.watch(settingsRemoteDataSourceProvider),
      localDataSource: ref.watch(settingsLocalDataSourceProvider),
    ),
  ),
  Provider<IBlockedUserRepository>(
    (ref) => BlockedUserRepository(
      remoteDataSource: ref.watch(blockedUserRemoteDataSourceProvider),
    ),
  ),
  Provider<IHelpRepository>(
    (ref) => HelpRepository(
      remoteDataSource: ref.watch(helpRemoteDataSourceProvider),
    ),
  ),
  
  // ユースケース
  Provider<GetNotificationSettingsUseCase>(
    (ref) => GetNotificationSettingsUseCase(
      repository: ref.watch(settingsRepositoryProvider),
    ),
  ),
  Provider<UpdateNotificationSettingsUseCase>(
    (ref) => UpdateNotificationSettingsUseCase(
      repository: ref.watch(settingsRepositoryProvider),
    ),
  ),
  Provider<GetAccountSettingsUseCase>(
    (ref) => GetAccountSettingsUseCase(
      repository: ref.watch(settingsRepositoryProvider),
    ),
  ),
  Provider<UpdateAccountSettingsUseCase>(
    (ref) => UpdateAccountSettingsUseCase(
      repository: ref.watch(settingsRepositoryProvider),
    ),
  ),
  Provider<GetPrivacySettingsUseCase>(
    (ref) => GetPrivacySettingsUseCase(
      repository: ref.watch(settingsRepositoryProvider),
    ),
  ),
  Provider<UpdatePrivacySettingsUseCase>(
    (ref) => UpdatePrivacySettingsUseCase(
      repository: ref.watch(settingsRepositoryProvider),
    ),
  ),
  Provider<GetDisplaySettingsUseCase>(
    (ref) => GetDisplaySettingsUseCase(
      repository: ref.watch(settingsRepositoryProvider),
    ),
  ),
  Provider<UpdateDisplaySettingsUseCase>(
    (ref) => UpdateDisplaySettingsUseCase(
      repository: ref.watch(settingsRepositoryProvider),
    ),
  ),
  Provider<GetBlockedUsersUseCase>(
    (ref) => GetBlockedUsersUseCase(
      repository: ref.watch(blockedUserRepositoryProvider),
    ),
  ),
  Provider<BlockUserUseCase>(
    (ref) => BlockUserUseCase(
      repository: ref.watch(blockedUserRepositoryProvider),
    ),
  ),
  Provider<UnblockUserUseCase>(
    (ref) => UnblockUserUseCase(
      repository: ref.watch(blockedUserRepositoryProvider),
    ),
  ),
  Provider<GetFAQsUseCase>(
    (ref) => GetFAQsUseCase(
      repository: ref.watch(helpRepositoryProvider),
    ),
  ),
  Provider<SubmitContactFormUseCase>(
    (ref) => SubmitContactFormUseCase(
      repository: ref.watch(helpRepositoryProvider),
    ),
  ),
  Provider<GetTermsUseCase>(
    (ref) => GetTermsUseCase(
      repository: ref.watch(helpRepositoryProvider),
    ),
  ),
  Provider<GetPrivacyPolicyUseCase>(
    (ref) => GetPrivacyPolicyUseCase(
      repository: ref.watch(helpRepositoryProvider),
    ),
  ),
  Provider<GetAppInfoUseCase>(
    (ref) => GetAppInfoUseCase(
      repository: ref.watch(helpRepositoryProvider),
    ),
  ),
  Provider<DeleteAccountUseCase>(
    (ref) => DeleteAccountUseCase(
      repository: ref.watch(settingsRepositoryProvider),
    ),
  ),
  
  // ビューモデル
  StateNotifierProvider<NotificationSettingsViewModel, NotificationSettingsState>(
    (ref) => NotificationSettingsViewModel(
      getNotificationSettingsUseCase: ref.watch(getNotificationSettingsUseCaseProvider),
      updateNotificationSettingsUseCase: ref.watch(updateNotificationSettingsUseCaseProvider),
    ),
  ),
  StateNotifierProvider<AccountSettingsViewModel, AccountSettingsState>(
    (ref) => AccountSettingsViewModel(
      getAccountSettingsUseCase: ref.watch(getAccountSettingsUseCaseProvider),
      updateAccountSettingsUseCase: ref.watch(updateAccountSettingsUseCaseProvider),
      deleteAccountUseCase: ref.watch(deleteAccountUseCaseProvider),
    ),
  ),
  StateNotifierProvider<PrivacySettingsViewModel, PrivacySettingsState>(
    (ref) => PrivacySettingsViewModel(
      getPrivacySettingsUseCase: ref.watch(getPrivacySettingsUseCaseProvider),
      updatePrivacySettingsUseCase: ref.watch(updatePrivacySettingsUseCaseProvider),
    ),
  ),
  StateNotifierProvider<DisplaySettingsViewModel, DisplaySettingsState>(
    (ref) => DisplaySettingsViewModel(
      getDisplaySettingsUseCase: ref.watch(getDisplaySettingsUseCaseProvider),
      updateDisplaySettingsUseCase: ref.watch(updateDisplaySettingsUseCaseProvider),
    ),
  ),
  StateNotifierProvider<BlockedUsersViewModel, BlockedUsersState>(
    (ref) => BlockedUsersViewModel(
      getBlockedUsersUseCase: ref.watch(getBlockedUsersUseCaseProvider),
      blockUserUseCase: ref.watch(blockUserUseCaseProvider),
      unblockUserUseCase: ref.watch(unblockUserUseCaseProvider),
    ),
  ),
  StateNotifierProvider<FAQViewModel, FAQState>(
    (ref) => FAQViewModel(
      getFAQsUseCase: ref.watch(getFAQsUseCaseProvider),
    ),
  ),
  StateNotifierProvider<ContactFormViewModel, ContactFormState>(
    (ref) => ContactFormViewModel(
      submitContactFormUseCase: ref.watch(submitContactFormUseCaseProvider),
    ),
  ),
];
```

## 8. セキュリティ考慮事項

1. **設定変更の認証**
   - 重要な設定変更（アカウント削除など）時の追加認証
   - セッショントークン検証によるCSRF対策
   - 変更操作のログ記録と監査

2. **データ保護**
   - ユーザー設定情報の暗号化保存
   - 通信の SSL/TLS 暗号化
   - プライバシー設定の安全な保管

3. **変更検知**
   - 複数デバイスからの設定変更の同期と衝突解決
   - 不正な設定変更の検知と通知
   - 設定のバージョン管理と履歴追跡

4. **ユーザーアクセス制御**
   - 設定へのアクセス権限の適切な管理
   - ブロックユーザー情報の厳格なアクセス制限
   - API アクセスの適切な認証

## 9. パフォーマンス最適化

1. **キャッシュ戦略**
   - 設定情報のローカルキャッシュ
   - 頻繁に使用される設定の優先キャッシュ
   - 非同期的な設定更新と同期

2. **バッチ処理**
   - 複数設定の一括更新オプション
   - サーバー同期の最適化
   - バックグラウンド同期処理

3. **リソース使用の最適化**
   - 設定画面のレンダリング最適化
   - ブロックユーザーリストのページネーション
   - FAQ 検索の効率化

4. **デバイス間同期の最適化**
   - 差分更新によるデータ転送量削減
   - 設定変更の効率的な同期方法
   - コンフリクト解決戦略

## 10. エラーハンドリング戦略

```dart
// エラーハンドリング
void handleSettingsError(BuildContext context, String message) {
  // ネットワークエラーの場合
  if (message.contains('ネットワーク')) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('ネットワーク接続を確認してください。設定はオフラインでも確認できますが、変更はオンライン時に反映されます。'),
        duration: Duration(seconds: 5),
      ),
    );
    return;
  }
  
  // サーバーエラーの場合
  if (message.contains('サーバー')) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('サーバーとの通信に問題が発生しました。しばらく経ってから再度お試しください。'),
        duration: Duration(seconds: 3),
      ),
    );
    return;
  }
  
  // 認証エラーの場合
  if (message.contains('認証') || message.contains('権限')) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('認証情報に問題があります。再度ログインしてください。'),
        action: SnackBarAction(
          label: 'ログイン',
          onPressed: () {
            // ログイン画面へ遷移
            Navigator.of(context).pushReplacementNamed('/login');
          },
        ),
      ),
    );
    return;
  }
  
  // その他のエラー
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      duration: Duration(seconds: 3),
    ),
  );
}

// 設定更新失敗時のリカバリー
Future<void> recoverSettingsUpdate(BuildContext context, dynamic error) async {
  // ローカルキャッシュから設定を復旧
  final settingsLocalDataSource = GetIt.I<SettingsLocalDataSource>();
  
  try {
    // 該当する設定を再読み込み
    await settingsLocalDataSource.reloadSettings();
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('設定の更新に失敗しました。以前の設定に戻しました。'),
        duration: Duration(seconds: 3),
      ),
    );
  } catch (e) {
    // 復旧も失敗した場合
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('設定の復旧に失敗しました。アプリを再起動してください。'),
        duration: Duration(seconds: 5),
      ),
    );
  }
}
```

## 11. テスト戦略

### 単体テスト
- 設定モデルのシリアライズ/デシリアライズテスト
- リポジトリの各メソッドのテスト
- ユースケースのテスト
- ビューモデルの状態管理テスト

### 統合テスト
- 設定の取得から表示までのフロー
- 設定更新フロー
- デバイス間同期のテスト
- オフライン動作のテスト

### UIテスト
- 設定画面の表示と操作
- 設定変更の反映テスト
- ブロックユーザー管理のUIテスト
- アクセシビリティ設定の適用テスト

## 12. FAQ的な実装上の注意点

1. **設定の即時反映**
   - テーマ変更などの設定は即時反映する必要がある
   - アプリ再起動が不要となるよう、動的な適用メカニズムを実装
   - グローバル状態管理を活用した設定変更の伝播

2. **多言語対応**
   - 言語設定変更時のアプリ内テキストの即時更新
   - 言語設定と地域設定の連携
   - デバイス設定との整合性維持

3. **アクセシビリティ対応**
   - OSのアクセシビリティ設定との連携
   - 文字サイズ変更時のレイアウト調整
   - 高コントラストモードの適切な実装

4. **デバイス特性への対応**
   - 異なる画面サイズでの設定画面の最適化
   - タブレットとスマートフォンでの表示差異
   - 設定の階層構造の適切な設計

## 13. バックエンドAPIの実装（TypeScript）

設定ドメインのバックエンドAPIは、フィーチャファースト構成に基づき以下のような実装を行います。

### ディレクトリ構造
```
src/
└─ features/
   └─ settings/
       ├─ domain/
       │   ├─ entities/
       │   │   ├─ NotificationSettings.ts
       │   │   ├─ AccountSettings.ts
       │   │   ├─ PrivacySettings.ts
       │   │   ├─ DisplaySettings.ts
       │   │   └─ BlockedUser.ts
       │   ├─ valueObjects/
       │   │   └─ QuietHours.ts
       │   └─ repository.ts
       ├─ application/
       │   ├─ getNotificationSettings.ts
       │   ├─ updateNotificationSettings.ts
       │   ├─ getAccountSettings.ts
       │   ├─ updateAccountSettings.ts
       │   ├─ getBlockedUsers.ts
       │   ├─ blockUser.ts
       │   └─ unblockUser.ts
       ├─ infrastructure/
       │   └─ settingsPrismaRepo.ts
       └─ presentation/
           └─ settingsRoutes.ts
```

### ドメイン層の実装例

```typescript
// src/features/settings/domain/entities/NotificationSettings.ts
export class NotificationSettings {
  constructor(
    public readonly userId: string,
    public readonly commentEnabled: boolean,
    public readonly highlightEnabled: boolean, 
    public readonly followEnabled: boolean,
    public readonly eventEnabled: boolean,
    public readonly aiAnalysisEnabled: boolean,
    public readonly quietHours: QuietHours | null,
    public readonly updatedAt: Date = new Date()
  ) {}

  updateSettings(updates: Partial<NotificationSettings>): NotificationSettings {
    return new NotificationSettings(
      updates.userId ?? this.userId,
      updates.commentEnabled ?? this.commentEnabled,
      updates.highlightEnabled ?? this.highlightEnabled,
      updates.followEnabled ?? this.followEnabled,
      updates.eventEnabled ?? this.eventEnabled,
      updates.aiAnalysisEnabled ?? this.aiAnalysisEnabled,
      updates.quietHours ?? this.quietHours,
      new Date()
    );
  }
}

// src/features/settings/domain/valueObjects/QuietHours.ts
export class QuietHours {
  constructor(
    public readonly enabled: boolean,
    public readonly start: string,
    public readonly end: string
  ) {
    this.validateTimeFormat(start);
    this.validateTimeFormat(end);
  }

  private validateTimeFormat(time: string): void {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      throw new Error('Time must be in HH:MM format');
    }
  }
}

// src/features/settings/domain/repository.ts
import { NotificationSettings } from './entities/NotificationSettings';
import { AccountSettings } from './entities/AccountSettings';
import { PrivacySettings } from './entities/PrivacySettings';
import { DisplaySettings } from './entities/DisplaySettings';
import { BlockedUser } from './entities/BlockedUser';

export interface SettingsRepository {
  // 通知設定
  getNotificationSettings(userId: string): Promise<NotificationSettings | null>;
  saveNotificationSettings(settings: NotificationSettings): Promise<void>;
  
  // アカウント設定
  getAccountSettings(userId: string): Promise<AccountSettings | null>;
  saveAccountSettings(settings: AccountSettings): Promise<void>;
  
  // プライバシー設定
  getPrivacySettings(userId: string): Promise<PrivacySettings | null>;
  savePrivacySettings(settings: PrivacySettings): Promise<void>;
  
  // 表示設定
  getDisplaySettings(userId: string): Promise<DisplaySettings | null>;
  saveDisplaySettings(settings: DisplaySettings): Promise<void>;

  // アカウント削除
  deleteAccount(userId: string, reason?: string): Promise<boolean>;
}

export interface BlockedUserRepository {
  getBlockedUsers(userId: string, limit: number, cursor?: string): Promise<PaginatedBlockedUsers>;
  blockUser(userId: string, blockedUserId: string, reason?: string): Promise<BlockedUser>;
  unblockUser(userId: string, blockedUserId: string): Promise<boolean>;
}

export interface PaginatedBlockedUsers {
  blockedUsers: BlockedUser[];
  nextCursor?: string;
}
```

### アプリケーション層の実装例

```typescript
// src/features/settings/application/getNotificationSettings.ts
import { SettingsRepository } from '../domain/repository';
import { NotificationSettings } from '../domain/entities/NotificationSettings';

export class GetNotificationSettings {
  constructor(private readonly repo: SettingsRepository) {}

  async execute(userId: string): Promise<NotificationSettings | null> {
    return await this.repo.getNotificationSettings(userId);
  }
}

// src/features/settings/application/updateNotificationSettings.ts
import { SettingsRepository } from '../domain/repository';
import { NotificationSettings } from '../domain/entities/NotificationSettings';
import { QuietHours } from '../domain/valueObjects/QuietHours';

export interface UpdateNotificationSettingsInput {
  userId: string;
  commentEnabled?: boolean;
  highlightEnabled?: boolean;
  followEnabled?: boolean;
  eventEnabled?: boolean;
  aiAnalysisEnabled?: boolean;
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  } | null;
}

export class UpdateNotificationSettings {
  constructor(private readonly repo: SettingsRepository) {}

  async execute(input: UpdateNotificationSettingsInput): Promise<NotificationSettings> {
    // 既存の設定を取得
    const existingSettings = await this.repo.getNotificationSettings(input.userId);
    
    if (!existingSettings) {
      // 設定が存在しない場合は新規作成（デフォルト値で）
      const quietHours = input.quietHours ? 
        new QuietHours(input.quietHours.enabled, input.quietHours.start, input.quietHours.end) :
        null;
        
      const newSettings = new NotificationSettings(
        input.userId,
        input.commentEnabled ?? true,
        input.highlightEnabled ?? true,
        input.followEnabled ?? true,
        input.eventEnabled ?? true,
        input.aiAnalysisEnabled ?? true,
        quietHours
      );
      
      await this.repo.saveNotificationSettings(newSettings);
      return newSettings;
    }
    
    // 既存設定を更新
    const quietHours = input.quietHours ? 
      new QuietHours(input.quietHours.enabled, input.quietHours.start, input.quietHours.end) :
      existingSettings.quietHours;
      
    const updatedSettings = existingSettings.updateSettings({
      commentEnabled: input.commentEnabled,
      highlightEnabled: input.highlightEnabled,
      followEnabled: input.followEnabled,
      eventEnabled: input.eventEnabled,
      aiAnalysisEnabled: input.aiAnalysisEnabled,
      quietHours
    });
    
    await this.repo.saveNotificationSettings(updatedSettings);
    return updatedSettings;
  }
}
```

### インフラストラクチャ層の実装例

```typescript
// src/features/settings/infrastructure/settingsPrismaRepo.ts
import { PrismaClient } from '@prisma/client';
import { SettingsRepository } from '../domain/repository';
import { NotificationSettings } from '../domain/entities/NotificationSettings';
import { AccountSettings } from '../domain/entities/AccountSettings';
import { PrivacySettings } from '../domain/entities/PrivacySettings';
import { DisplaySettings } from '../domain/entities/DisplaySettings';
import { QuietHours } from '../domain/valueObjects/QuietHours';

export class SettingsPrismaRepository implements SettingsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
    const settings = await this.prisma.notificationSettings.findUnique({
      where: { userId }
    });

    if (!settings) return null;

    let quietHours = null;
    if (settings.quietHoursEnabled) {
      quietHours = new QuietHours(
        settings.quietHoursEnabled,
        settings.quietHoursStart ?? "22:00",
        settings.quietHoursEnd ?? "07:00"
      );
    }

    return new NotificationSettings(
      settings.userId,
      settings.commentEnabled,
      settings.highlightEnabled,
      settings.followEnabled,
      settings.eventEnabled,
      settings.aiAnalysisEnabled,
      quietHours,
      settings.updatedAt
    );
  }

  async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    await this.prisma.notificationSettings.upsert({
      where: { userId: settings.userId },
      update: {
        commentEnabled: settings.commentEnabled,
        highlightEnabled: settings.highlightEnabled,
        followEnabled: settings.followEnabled,
        eventEnabled: settings.eventEnabled,
        aiAnalysisEnabled: settings.aiAnalysisEnabled,
        quietHoursEnabled: settings.quietHours?.enabled ?? false,
        quietHoursStart: settings.quietHours?.start,
        quietHoursEnd: settings.quietHours?.end,
        updatedAt: settings.updatedAt
      },
      create: {
        userId: settings.userId,
        commentEnabled: settings.commentEnabled,
        highlightEnabled: settings.highlightEnabled,
        followEnabled: settings.followEnabled,
        eventEnabled: settings.eventEnabled,
        aiAnalysisEnabled: settings.aiAnalysisEnabled,
        quietHoursEnabled: settings.quietHours?.enabled ?? false,
        quietHoursStart: settings.quietHours?.start,
        quietHoursEnd: settings.quietHours?.end,
        updatedAt: settings.updatedAt
      }
    });
  }

  // 他のメソッド実装（アカウント設定、プライバシー設定、表示設定など）

  async deleteAccount(userId: string, reason?: string): Promise<boolean> {
    try {
      // アカウント削除理由を記録
      if (reason) {
        await this.prisma.accountDeletionReason.create({
          data: {
            userId,
            reason,
            createdAt: new Date()
          }
        });
      }

      // ユーザー関連データを削除
      await this.prisma.$transaction([
        this.prisma.notificationSettings.delete({ where: { userId } }),
        this.prisma.accountSettings.delete({ where: { userId } }),
        this.prisma.privacySettings.delete({ where: { userId } }),
        this.prisma.displaySettings.delete({ where: { userId } }),
        this.prisma.blockedUser.deleteMany({ where: { userId } }),
        // 最後にユーザー自体を削除
        this.prisma.user.delete({ where: { id: userId } })
      ]);

      return true;
    } catch (error) {
      console.error('Account deletion failed:', error);
      return false;
    }
  }
}
```

### プレゼンテーション層の実装例

```typescript
// src/features/settings/presentation/settingsRoutes.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SettingsPrismaRepository } from '../infrastructure/settingsPrismaRepo';
import { GetNotificationSettings } from '../application/getNotificationSettings';
import { UpdateNotificationSettings } from '../application/updateNotificationSettings';
import { GetAccountSettings } from '../application/getAccountSettings';
import { UpdateAccountSettings } from '../application/updateAccountSettings';
import { authenticateUser } from '../../../middleware/auth';

const prisma = new PrismaClient();
const settingsRepo = new SettingsPrismaRepository(prisma);

// ユースケースのインスタンス作成
const getNotificationSettings = new GetNotificationSettings(settingsRepo);
const updateNotificationSettings = new UpdateNotificationSettings(settingsRepo);
const getAccountSettings = new GetAccountSettings(settingsRepo);
const updateAccountSettings = new UpdateAccountSettings(settingsRepo);
// 他のユースケースも同様にインスタンス化

export const settingsRoutes = Router();

// 認証ミドルウェアを適用
settingsRoutes.use(authenticateUser);

// 通知設定のルート
settingsRoutes.get('/notifications', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id; // 認証ミドルウェアからユーザーIDを取得
    const settings = await getNotificationSettings.execute(userId);
    
    if (!settings) {
      return res.status(404).json({ message: '設定が見つかりません' });
    }
    
    return res.status(200).json(settings);
  } catch (error) {
    console.error('通知設定取得エラー:', error);
    return res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
});

settingsRoutes.patch('/notifications', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const input = {
      userId,
      ...req.body
    };
    
    const updatedSettings = await updateNotificationSettings.execute(input);
    return res.status(200).json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error('通知設定更新エラー:', error);
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
});

// アカウント設定のルート
settingsRoutes.get('/account', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const settings = await getAccountSettings.execute(userId);
    
    if (!settings) {
      return res.status(404).json({ message: '設定が見つかりません' });
    }
    
    return res.status(200).json(settings);
  } catch (error) {
    console.error('アカウント設定取得エラー:', error);
    return res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
});

settingsRoutes.patch('/account', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const input = {
      userId,
      ...req.body
    };
    
    const updatedSettings = await updateAccountSettings.execute(input);
    return res.status(200).json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error('アカウント設定更新エラー:', error);
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
});

// アカウント削除のルート
settingsRoutes.delete('/account', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { reason } = req.body;
    
    // アカウント削除前に追加の認証を要求することも考慮
    const success = await deleteAccount.execute(userId, reason);
    
    if (!success) {
      return res.status(400).json({ message: 'アカウントの削除に失敗しました' });
    }
    
    return res.status(200).json({ success: true, message: 'アカウントが正常に削除されました' });
  } catch (error) {
    console.error('アカウント削除エラー:', error);
    return res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
});

// その他のルート（プライバシー設定、表示設定、ブロックユーザー管理など）も同様に実装
```

### メインアプリケーションでのルート設定

```typescript
// src/app.ts
import express from 'express';
import { settingsRoutes } from './features/settings/presentation/settingsRoutes';

const app = express();
app.use(express.json());

// API ルートの設定
app.use('/api/v1/settings', settingsRoutes);

// その他のルート設定

export default app;
```

この実装では、フィーチャファースト構成を活用し、設定ドメイン内の機能を層ごとに分離しています。ドメイン層ではビジネスルールを定義し、アプリケーション層ではユースケースを実装し、インフラストラクチャ層ではデータベースアクセスを担当し、プレゼンテーション層ではAPIエンドポイントを提供しています。