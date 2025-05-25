# 通知ドメインテストパラメータと期待結果

## 1. NotificationModelテスト

### fromJson変換テスト

| テストケース | 入力パラメータ | 期待結果 |
|------------|--------------|---------|
| 基本的なJSON変換 | ```{"id": "1", "user_id": "user1", "title": "Test", "body": "Test Body", "data": {"post_id": "123"}, "read": false, "notification_type": "comment", "created_at": "2023-01-01T12:00:00Z"}``` | id="1", userId="user1", title="Test", body="Test Body", data={"post_id": "123"}, read=false, notificationType=NotificationType.comment, createdAt=2023-01-01T12:00:00Z |
| nullデータフィールド | ```{"id": "1", "user_id": "user1", "title": "Test", "body": "Test Body", "data": null, "read": false, "notification_type": "comment", "created_at": "2023-01-01T12:00:00Z"}``` | id="1", userId="user1", title="Test", body="Test Body", data={}, read=false, notificationType=NotificationType.comment, createdAt=2023-01-01T12:00:00Z |
| nullの既読フラグ | ```{"id": "1", "user_id": "user1", "title": "Test", "body": "Test Body", "data": {}, "read": null, "notification_type": "comment", "created_at": "2023-01-01T12:00:00Z"}``` | id="1", userId="user1", title="Test", body="Test Body", data={}, read=false, notificationType=NotificationType.comment, createdAt=2023-01-01T12:00:00Z |
| 既読日時あり | ```{"id": "1", "user_id": "user1", "title": "Test", "body": "Test Body", "data": {}, "read": true, "notification_type": "comment", "created_at": "2023-01-01T12:00:00Z", "read_at": "2023-01-01T13:00:00Z"}``` | id="1", userId="user1", title="Test", body="Test Body", data={}, read=true, notificationType=NotificationType.comment, createdAt=2023-01-01T12:00:00Z, readAt=2023-01-01T13:00:00Z |
| すべての通知タイプ | comment, highlight, follower, followReason, system の各タイプで実施 | それぞれ対応するNotificationTypeの列挙値に変換されること |

### toJson変換テスト

| テストケース | 入力パラメータ | 期待結果 |
|------------|--------------|---------|
| 基本的なJSON変換 | NotificationModel(id="1", userId="user1", title="Test", body="Test Body", data={"post_id": "123"}, read=false, notificationType=NotificationType.comment, createdAt=2023-01-01T12:00:00Z) | ```{"id": "1", "user_id": "user1", "title": "Test", "body": "Test Body", "data": {"post_id": "123"}, "read": false, "notification_type": "comment", "created_at": "2023-01-01T12:00:00.000Z"}``` |
| 既読日時あり | NotificationModel(id="1", userId="user1", title="Test", body="Test Body", data={}, read=true, notificationType=NotificationType.comment, createdAt=2023-01-01T12:00:00Z, readAt=2023-01-01T13:00:00Z) | ```{"id": "1", "user_id": "user1", "title": "Test", "body": "Test Body", "data": {}, "read": true, "notification_type": "comment", "created_at": "2023-01-01T12:00:00.000Z", "read_at": "2023-01-01T13:00:00.000Z"}``` |

### navigationRouteゲッターテスト

| テストケース | 入力パラメータ | 期待結果 |
|------------|--------------|---------|
| routeキーあり | NotificationModel(data={"route": "/custom/route"}, notificationType=任意) | "/custom/route" |
| コメント通知 | NotificationModel(data={"post_id": "123"}, notificationType=NotificationType.comment) | "/posts/123" |
| ハイライト通知 | NotificationModel(data={"post_id": "123"}, notificationType=NotificationType.highlight) | "/posts/123" |
| フォロワー通知 | NotificationModel(data={"follower_id": "user2"}, notificationType=NotificationType.follower) | "/profile/user2" |
| フォロー理由通知 | NotificationModel(data={"follower_id": "user2"}, notificationType=NotificationType.followReason) | "/profile/user2" |
| システム通知 | NotificationModel(data={"action_url": "/settings"}, notificationType=NotificationType.system) | "/settings" |

### iconゲッターテスト

| テストケース | 入力パラメータ | 期待結果 |
|------------|--------------|---------|
| コメント通知 | NotificationModel(notificationType=NotificationType.comment) | Icons.comment |
| ハイライト通知 | NotificationModel(notificationType=NotificationType.highlight) | Icons.star |
| フォロワー通知 | NotificationModel(notificationType=NotificationType.follower) | Icons.person_add |
| フォロー理由通知 | NotificationModel(notificationType=NotificationType.followReason) | Icons.favorite |
| システム通知 | NotificationModel(notificationType=NotificationType.system) | Icons.notifications |

### timeAgoゲッターテスト

| テストケース | 入力パラメータ | 期待結果 |
|------------|--------------|---------|
| たった今 | NotificationModel(createdAt=現在時刻) | "たった今" |
| 分単位 | NotificationModel(createdAt=現在時刻から30分前) | "30分前" |
| 時間単位 | NotificationModel(createdAt=現在時刻から3時間前) | "3時間前" |
| 日単位 | NotificationModel(createdAt=現在時刻から2日前) | "2日前" |
| 1週間超 | NotificationModel(createdAt=現在時刻から10日前) | DateFormat('yyyy/MM/dd').format(10日前の日付) |

## 2. NotificationSettingsModelテスト

### fromJson変換テスト

| テストケース | 入力パラメータ | 期待結果 |
|------------|--------------|---------|
| 基本的なJSON変換 | ```{"id": "1", "user_id": "user1", "comments_enabled": true, "highlights_enabled": true, "followers_enabled": true, "follow_reasons_enabled": false, "system_enabled": true, "updated_at": "2023-01-01T12:00:00Z"}``` | id="1", userId="user1", commentsEnabled=true, highlightsEnabled=true, followersEnabled=true, followReasonsEnabled=false, systemEnabled=true, updatedAt=2023-01-01T12:00:00Z |
| 一部nullの設定 | ```{"id": "1", "user_id": "user1", "comments_enabled": null, "highlights_enabled": true, "followers_enabled": null, "follow_reasons_enabled": false, "system_enabled": null, "updated_at": "2023-01-01T12:00:00Z"}``` | id="1", userId="user1", commentsEnabled=true, highlightsEnabled=true, followersEnabled=true, followReasonsEnabled=false, systemEnabled=true, updatedAt=2023-01-01T12:00:00Z |

### toJson変換テスト

| テストケース | 入力パラメータ | 期待結果 |
|------------|--------------|---------|
| 基本的なJSON変換 | NotificationSettingsModel(id="1", userId="user1", commentsEnabled=true, highlightsEnabled=true, followersEnabled=true, followReasonsEnabled=false, systemEnabled=true, updatedAt=2023-01-01T12:00:00Z) | ```{"id": "1", "user_id": "user1", "comments_enabled": true, "highlights_enabled": true, "followers_enabled": true, "follow_reasons_enabled": false, "system_enabled": true, "updated_at": "2023-01-01T12:00:00.000Z"}``` |

### copyWithテスト

| テストケース | 入力パラメータ | 期待結果 |
|------------|--------------|---------|
| 一部のフィールド更新 | 元:NotificationSettingsModel(commentsEnabled=true), 更新:copyWith(commentsEnabled=false) | commentsEnabled=false, その他のフィールドは元の値を維持 |
| 複数フィールド更新 | 元:NotificationSettingsModel(commentsEnabled=true, highlightsEnabled=true), 更新:copyWith(commentsEnabled=false, highlightsEnabled=false) | commentsEnabled=false, highlightsEnabled=false, その他のフィールドは元の値を維持 |
| 更新なし | 元:NotificationSettingsModel(すべてのフィールド設定済み), 更新:copyWith() | 元のインスタンスと同じ値を持つ新しいインスタンス |

### isEnabledForTypeテスト

| テストケース | 入力パラメータ | 期待結果 |
|------------|--------------|---------|
| コメント通知有効 | NotificationSettingsModel(commentsEnabled=true), type=NotificationType.comment | true |
| コメント通知無効 | NotificationSettingsModel(commentsEnabled=false), type=NotificationType.comment | false |
| ハイライト通知有効 | NotificationSettingsModel(highlightsEnabled=true), type=NotificationType.highlight | true |
| ハイライト通知無効 | NotificationSettingsModel(highlightsEnabled=false), type=NotificationType.highlight | false |
| フォロワー通知有効 | NotificationSettingsModel(followersEnabled=true), type=NotificationType.follower | true |
| フォロワー通知無効 | NotificationSettingsModel(followersEnabled=false), type=NotificationType.follower | false |
| フォロー理由通知有効 | NotificationSettingsModel(followReasonsEnabled=true), type=NotificationType.followReason | true |
| フォロー理由通知無効 | NotificationSettingsModel(followReasonsEnabled=false), type=NotificationType.followReason | false |
| システム通知有効 | NotificationSettingsModel(systemEnabled=true), type=NotificationType.system | true |
| システム通知無効 | NotificationSettingsModel(systemEnabled=false), type=NotificationType.system | false |

## 3. NotificationDeviceModelテスト

### fromJson変換テスト

| テストケース | 入力パラメータ | 期待結果 |
|------------|--------------|---------|
| 基本的なJSON変換 | ```{"id": "1", "user_id": "user1", "device_token": "fcm-token-123", "device_type": "fcm", "is_active": true, "created_at": "2023-01-01T12:00:00Z"}``` | id="1", userId="user1", deviceToken="fcm-token-123", deviceType=DeviceType.fcm, isActive=true, createdAt=2023-01-01T12:00:00Z |
| lastUsedAtあり | ```{"id": "1", "user_id": "user1", "device_token": "fcm-token-123", "device_type": "fcm", "is_active": true, "created_at": "2023-01-01T12:00:00Z", "last_used_at": "2023-01-01T13:00:00Z"}``` | id="1", userId="user1", deviceToken="fcm-token-123", deviceType=DeviceType.fcm, isActive=true, createdAt=2023-01-01T12:00:00Z, lastUsedAt=2023-01-01T13:00:00Z |
| isActiveがnull | ```{"id": "1", "user_id": "user1", "device_token": "fcm-token-123", "device_type": "fcm", "is_active": null, "created_at": "2023-01-01T12:00:00Z"}``` | id="1", userId="user1", deviceToken="fcm-token-123", deviceType=DeviceType.fcm, isActive=true, createdAt=2023-01-01T12:00:00Z |
| APNS | ```{"id": "1", "user_id": "user1", "device_token": "apns-token-123", "device_type": "apns", "is_active": true, "created_at": "2023-01-01T12:00:00Z"}``` | id="1", userId="user1", deviceToken="apns-token-123", deviceType=DeviceType.apns, isActive=true, createdAt=2023-01-01T12:00:00Z |

### toJson変換テスト

| テストケース | 入力パラメータ | 期待結果 |
|------------|--------------|---------|
| 基本的なJSON変換 | NotificationDeviceModel(id="1", userId="user1", deviceToken="fcm-token-123", deviceType=DeviceType.fcm, isActive=true, createdAt=2023-01-01T12:00:00Z) | ```{"id": "1", "user_id": "user1", "device_token": "fcm-token-123", "device_type": "fcm", "is_active": true, "created_at": "2023-01-01T12:00:00.000Z"}``` |
| lastUsedAtあり | NotificationDeviceModel(id="1", userId="user1", deviceToken="fcm-token-123", deviceType=DeviceType.fcm, isActive=true, createdAt=2023-01-01T12:00:00Z, lastUsedAt=2023-01-01T13:00:00Z) | ```{"id": "1", "user_id": "user1", "device_token": "fcm-token-123", "device_type": "fcm", "is_active": true, "created_at": "2023-01-01T12:00:00.000Z", "last_used_at": "2023-01-01T13:00:00.000Z"}``` |

## 4. NotificationRepositoryテスト

### getNotificationsテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| 通知一覧取得成功 | userId="user1", read=null, type=null, limit=20, offset=0 | モックリモートデータソース:成功応答 | Right(通知リスト) |
| ユーザーIDフィルタリング | userId="user1", read=null, type=null | モックリモートデータソース: "user1"の通知のみ返す | 返された通知すべてのuserIdが"user1"であること |
| 既読状態フィルタリング | userId=null, read=true | モックリモートデータソース: 既読済み通知のみ返す | 返された通知すべてのreadがtrueであること |
| 通知タイプフィルタリング | userId=null, read=null, type=NotificationType.comment | モックリモートデータソース: コメント通知のみ返す | 返された通知すべてのnotificationTypeがNotificationType.commentであること |
| ページネーション:limit | userId=null, limit=5 | モックリモートデータソース: 10件の通知を用意 | 返される通知が5件であること |
| ページネーション:offset | userId=null, limit=5, offset=5 | モックリモートデータソース: 10件の通知を用意 | 6〜10番目の通知が返されること |
| サーバーエラー | 任意 | モックリモートデータソース: エラー応答 | Left(ServerFailure) |
| オフライン | 任意 | isOffline = true, モックローカルデータソース: 成功応答 | Right(キャッシュされた通知リスト) |
| キャッシュエラー | 任意 | isOffline = true, モックローカルデータソース: エラー応答 | Left(CacheFailure) |

### markAsReadテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| 既読処理成功 | notificationId="1" | モックリモートデータソース: 更新された通知を返す | Right(更新された通知) |
| サーバーエラー | notificationId="1" | モックリモートデータソース: エラー応答 | Left(ServerFailure) |

### deleteNotificationテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| 通知削除成功 | notificationId="1" | モックリモートデータソース: true返却 | Right(true) |
| サーバーエラー | notificationId="1" | モックリモートデータソース: エラー応答 | Left(ServerFailure) |

### getUnreadCountテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| 未読カウント取得成功 | userId="user1" | モックリモートデータソース: 5を返す | Right(5) |
| サーバーエラー | userId="user1" | モックリモートデータソース: エラー応答 | Left(ServerFailure) |
| オフライン | userId="user1" | isOffline = true, モックローカルデータソース: 3を返す | Right(3) |

### markAllAsReadテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| 全件既読処理成功 | userId="user1" | モックリモートデータソース: true返却 | Right(true) |
| サーバーエラー | userId="user1" | モックリモートデータソース: エラー応答 | Left(ServerFailure) |

## 5. NotificationSettingsRepositoryテスト

### getNotificationSettingsテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| 設定取得成功 | userId="user1" | モックリモートデータソース: 設定オブジェクト返却 | Right(設定オブジェクト) |
| サーバーエラー | userId="user1" | モックリモートデータソース: エラー応答 | Left(ServerFailure) |
| オフライン:キャッシュあり | userId="user1" | isOffline = true, モックローカルデータソース: 設定オブジェクト返却 | Right(設定オブジェクト) |
| オフライン:キャッシュなし | userId="user1" | isOffline = true, モックローカルデータソース: null返却 | Left(CacheFailure) |

### updateNotificationSettingsテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| 設定更新成功 | NotificationSettingsEntity | モックリモートデータソース: 更新された設定オブジェクト返却 | Right(更新された設定オブジェクト) |
| サーバーエラー | NotificationSettingsEntity | モックリモートデータソース: エラー応答 | Left(ServerFailure) |

## 6. NotificationDeviceRepositoryテスト

### registerDeviceTokenテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| トークン登録成功:FCM | userId="user1", token="fcm-token-123", type=DeviceType.fcm | モックリモートデータソース: デバイスオブジェクト返却 | Right(デバイスオブジェクト) |
| トークン登録成功:APNS | userId="user1", token="apns-token-123", type=DeviceType.apns | モックリモートデータソース: デバイスオブジェクト返却 | Right(デバイスオブジェクト) |
| サーバーエラー | 任意 | モックリモートデータソース: エラー応答 | Left(ServerFailure) |

### unregisterDeviceTokenテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| トークン登録解除成功 | token="fcm-token-123" | モックリモートデータソース: true返却 | Right(true) |
| サーバーエラー | token="fcm-token-123" | モックリモートデータソース: エラー応答 | Left(ServerFailure) |

### getUserDevicesテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| デバイス一覧取得成功 | userId="user1" | モックリモートデータソース: デバイスリスト返却 | Right(デバイスリスト) |
| サーバーエラー | userId="user1" | モックリモートデータソース: エラー応答 | Left(ServerFailure) |

## 7. ユースケーステスト

### GetNotificationsUseCaseテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| 通知取得成功 | userId="user1", read=null, type=null | モックリポジトリ: Right(通知リスト)返却 | Right(通知リスト) |
| 通知取得失敗 | 任意 | モックリポジトリ: Left(Failure)返却 | Left(Failure) |

### MarkNotificationAsReadUseCaseテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| 既読処理成功 | notificationId="1" | モックリポジトリ: Right(更新された通知)返却 | Right(更新された通知) |
| 既読処理失敗 | notificationId="1" | モックリポジトリ: Left(Failure)返却 | Left(Failure) |

### DeleteNotificationUseCaseテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| 通知削除成功 | notificationId="1" | モックリポジトリ: Right(true)返却 | Right(true) |
| 通知削除失敗 | notificationId="1" | モックリポジトリ: Left(Failure)返却 | Left(Failure) |

### GetUnreadCountUseCaseテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| 未読カウント取得成功 | userId="user1" | モックリポジトリ: Right(5)返却 | Right(5) |
| 未読カウント取得失敗 | userId="user1" | モックリポジトリ: Left(Failure)返却 | Left(Failure) |

### MarkAllAsReadUseCaseテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| 全件既読処理成功 | userId="user1" | モックリポジトリ: Right(true)返却 | Right(true) |
| 全件既読処理失敗 | userId="user1" | モックリポジトリ: Left(Failure)返却 | Left(Failure) |

### GetNotificationSettingsUseCaseテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| 設定取得成功 | userId="user1" | モックリポジトリ: Right(設定オブジェクト)返却 | Right(設定オブジェクト) |
| 設定取得失敗 | userId="user1" | モックリポジトリ: Left(Failure)返却 | Left(Failure) |

### UpdateNotificationSettingsUseCaseテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| 設定更新成功 | NotificationSettingsEntity | モックリポジトリ: Right(更新された設定)返却 | Right(更新された設定) |
| 設定更新失敗 | NotificationSettingsEntity | モックリポジトリ: Left(Failure)返却 | Left(Failure) |

### RegisterDeviceTokenUseCaseテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| トークン登録成功 | userId="user1", token="fcm-token-123", type=DeviceType.fcm | モックリポジトリ: Right(デバイスオブジェクト)返却 | Right(デバイスオブジェクト) |
| トークン登録失敗 | 任意 | モックリポジトリ: Left(Failure)返却 | Left(Failure) |

### UnregisterDeviceTokenUseCaseテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| トークン登録解除成功 | token="fcm-token-123" | モックリポジトリ: Right(true)返却 | Right(true) |
| トークン登録解除失敗 | token="fcm-token-123" | モックリポジトリ: Left(Failure)返却 | Left(Failure) |

## 8. ビューモデルテスト

### NotificationListViewModelテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| 初期状態 | なし | - | state = NotificationListInitial |
| 通知一覧取得:ローディング | loadNotifications(userId="user1") | - | state = NotificationListLoading |
| 通知一覧取得:成功 | loadNotifications(userId="user1") | mockGetNotificationsUseCase: Right(通知リスト)返却 | state = NotificationListLoaded(通知リスト) |
| 通知一覧取得:失敗 | loadNotifications(userId="user1") | mockGetNotificationsUseCase: Left(Failure)返却 | state = NotificationListError(エラーメッセージ) |
| 通知一覧取得:空リスト | loadNotifications(userId="user1") | mockGetNotificationsUseCase: Right([])返却 | state = NotificationListLoaded([]) |
| 通知一覧フィルタリング:既読 | loadNotifications(userId="user1", read=true) | mockGetNotificationsUseCase: パラメータ確認 | getNotificationsUseCaseが正しいパラメータで呼ばれること |
| 通知一覧フィルタリング:タイプ | loadNotifications(userId="user1", type=NotificationType.comment) | mockGetNotificationsUseCase: パラメータ確認 | getNotificationsUseCaseが正しいパラメータで呼ばれること |
| もっと読み込み | loadNotifications(isRefresh=false) | 既存状態 = NotificationListLoaded(3件の通知), mockGetNotificationsUseCase: Right(追加3件の通知)返却 | state = NotificationListLoaded(6件の通知) |
| 通知を既読に:成功 | markAsRead("1") | 既存状態 = NotificationListLoaded(通知リスト), mockMarkNotificationAsReadUseCase: Right(更新通知)返却 | 対象の通知が既読状態になった通知リスト |
| 通知を既読に:失敗 | markAsRead("1") | 既存状態 = NotificationListLoaded(通知リスト), mockMarkNotificationAsReadUseCase: Left(Failure)返却 | state = NotificationListError(エラーメッセージ) |
| 通知を削除:成功 | deleteNotification("1") | 既存状態 = NotificationListLoaded(通知リスト), mockDeleteNotificationUseCase: Right(true)返却 | 対象の通知が削除された通知リスト |
| 通知を削除:失敗 | deleteNotification("1") | 既存状態 = NotificationListLoaded(通知リスト), mockDeleteNotificationUseCase: Left(Failure)返却 | state = NotificationListError(エラーメッセージ) |
| 未読カウント取得 | loadUnreadCount("user1") | mockGetUnreadCountUseCase: Right(5)返却 | state = NotificationListLoaded(通知リスト, unreadCount: 5) |
| 全件既読処理:成功 | markAllAsRead("user1") | 既存状態 = NotificationListLoaded(通知リスト), mockMarkAllAsReadUseCase: Right(true)返却 | 全通知が既読状態になった通知リスト, unreadCount: 0 |
| 全件既読処理:失敗 | markAllAsRead("user1") | 既存状態 = NotificationListLoaded(通知リスト), mockMarkAllAsReadUseCase: Left(Failure)返却 | state = NotificationListError(エラーメッセージ) |

### NotificationSettingsViewModelテスト

| テストケース | 入力パラメータ | モック設定 | 期待結果 |
|------------|--------------|---------|---------|
| 初期状態 | なし | - | state = NotificationSettingsInitial |
| 設定取得:ローディング | loadSettings("user1") | - | state = NotificationSettingsLoading |
| 設定取得:成功 | loadSettings("user1") | mockGetNotificationSettingsUseCase: Right(設定オブジェクト)返却 | state = NotificationSettingsLoaded(設定オブジェクト) |
| 設定取得:失敗 | loadSettings("user1") | mockGetNotificationSettingsUseCase: Left(Failure)返却 | state = NotificationSettingsError(エラーメッセージ) |
| 設定更新:成功 | updateSettings(設定オブジェクト) | 既存状態 = NotificationSettingsLoaded(元の設定), mockUpdateNotificationSettingsUseCase: Right(更新された設定)返却 | state = NotificationSettingsLoaded(更新された設定) |
| 設定更新:失敗 | updateSettings(設定オブジェクト) | 既存状態 = NotificationSettingsLoaded(元の設定), mockUpdateNotificationSettingsUseCase: Left(Failure)返却 | state = NotificationSettingsError(エラーメッセージ) |
| トグル設定:コメント有効化 | toggleSetting(設定, NotificationType.comment, true) | 既存設定のcommentsEnabled = false, mockUpdateNotificationSettingsUseCase: 更新成功 | commentsEnabled = true の更新された設定 |
| トグル設定:コメント無効化 | toggleSetting(設定, NotificationType.comment, false) | 既存設定のcommentsEnabled = true, mockUpdateNotificationSettingsUseCase: 更新成功 | commentsEnabled = false の更新された設定 |

## 9. UIテスト

### NotificationListScreenのテスト

| テストケース | 入力状態 | 操作 | 期待結果 |
|------------|---------|------|---------|
| 通知一覧表示 | NotificationListLoaded(通知リスト) | 画面レンダリング | 通知リストが表示される、各通知に対応するアイコン/タイトル/本文が表示される |
| 空の通知一覧 | NotificationListLoaded([]) | 画面レンダリング | 「通知はありません」メッセージが表示される |
| ローディング表示 | NotificationListLoading | 画面レンダリング | ローディングインジケーターが表示される |
| エラー表示 | NotificationListError(エラーメッセージ) | 画面レンダリング | エラーメッセージが表示される、再試行ボタンが表示される |
| 通知タップ | NotificationListLoaded(通知リスト) | 通知アイテムをタップ | 1) markAsReadが呼ばれる 2) 通知のnavigationRouteに移動する |
| 通知スワイプ削除 | NotificationListLoaded(通知リスト) | 通知アイテムを左にスワイプ | deleteNotificationが呼ばれる |
| 全件既読ボタン | NotificationListLoaded(通知リスト) | 「すべて既読」ボタンをタップ | markAllAsReadが呼ばれる |
| プルトゥリフレッシュ | NotificationListLoaded(通知リスト) | 画面を下にプル | loadNotifications(isRefresh=true)が呼ばれる |
| スクロールして追加読み込み | NotificationListLoaded(通知リスト) | リストの最下部までスクロール | loadNotifications(isRefresh=false)が呼ばれる |

### NotificationSettingsScreenのテスト

| テストケース | 入力状態 | 操作 | 期待結果 |
|------------|---------|------|---------|
| 設定一覧表示 | NotificationSettingsLoaded(設定) | 画面レンダリング | 5種類の通知設定スイッチが表示される、各設定の現在の状態が反映される |
| ローディング表示 | NotificationSettingsLoading | 画面レンダリング | ローディングインジケーターが表示される |
| エラー表示 | NotificationSettingsError(エラーメッセージ) | 画面レンダリング | エラーメッセージが表示される、再試行ボタンが表示される |
| コメント通知切替 | NotificationSettingsLoaded(設定) | コメント通知スイッチをタップ | toggleSetting(設定, NotificationType.comment, !現在値)が呼ばれる |
| ハイライト通知切替 | NotificationSettingsLoaded(設定) | ハイライト通知スイッチをタップ | toggleSetting(設定, NotificationType.highlight, !現在値)が呼ばれる |
| フォロワー通知切替 | NotificationSettingsLoaded(設定) | フォロワー通知スイッチをタップ | toggleSetting(設定, NotificationType.follower, !現在値)が呼ばれる |
| フォロー理由通知切替 | NotificationSettingsLoaded(設定) | フォロー理由通知スイッチをタップ | toggleSetting(設定, NotificationType.followReason, !現在値)が呼ばれる |
| システム通知切替 | NotificationSettingsLoaded(設定) | システム通知スイッチをタップ | toggleSetting(設定, NotificationType.system, !現在値)が呼ばれる |