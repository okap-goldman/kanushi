# 通知ドメインテスト仕様書

## 1. 単体テスト

### モデルテスト

#### NotificationModelTest
- 通知モデルがJSON形式から正しく変換されることを確認
- 通知モデルがJSON形式に正しく変換されることを確認
- 必須フィールド（id, userId, title, body, notificationType, createdAt）が正しく設定されることを確認
- 通知タイプの列挙型が正しく変換されることを確認
- 通知データから正しくナビゲーション情報が取得できることを確認
- 時間表示ヘルパーメソッドが正しく機能することを確認

#### NotificationSettingsModelTest
- 通知設定モデルがJSON形式から正しく変換されることを確認
- 通知設定モデルがJSON形式に正しく変換されることを確認
- 通知タイプごとに設定の有効/無効状態が正しく取得できることを確認
- copyWithメソッドが正しく機能することを確認

#### NotificationDeviceModelTest
- デバイスモデルがJSON形式から正しく変換されることを確認
- デバイスモデルがJSON形式に正しく変換されることを確認
- DeviceTypeの列挙型が正しく変換されることを確認

### リポジトリテスト

#### NotificationRepositoryTest
- getNotificationsがフィルタリングパラメータに応じて適切に通知を返すことを確認
- オフライン時にgetNotificationsがローカルキャッシュから取得することを確認
- markAsReadが通知を既読に更新することを確認
- deleteNotificationが通知を削除することを確認
- getUnreadCountが未読通知数を正しく返すことを確認
- markAllAsReadがすべての通知を既読に更新することを確認
- 各メソッドがサーバーエラー時に適切なFailureオブジェクトを返すことを確認

#### NotificationSettingsRepositoryTest
- getNotificationSettingsが正しく通知設定を返すことを確認
- オフライン時にgetNotificationSettingsがローカルキャッシュから取得することを確認
- updateNotificationSettingsが設定を更新することを確認
- 各メソッドがサーバーエラー時に適切なFailureオブジェクトを返すことを確認

#### NotificationDeviceRepositoryTest
- registerDeviceTokenがデバイストークンを登録することを確認
- unregisterDeviceTokenがデバイストークンを無効化することを確認
- getUserDevicesがユーザーのデバイス一覧を返すことを確認
- 各メソッドがサーバーエラー時に適切なFailureオブジェクトを返すことを確認

### ユースケーステスト

#### GetNotificationsUseCaseTest
```dart
void main() {
  group('GetNotificationsUseCase Tests', () {
    late MockNotificationRepository mockRepository;
    late GetNotificationsUseCase useCase;

    setUp(() {
      mockRepository = MockNotificationRepository();
      useCase = GetNotificationsUseCase(repository: mockRepository);
    });

    test('リポジトリから通知リストが正常に取得できること', () async {
      // モックの通知リスト作成
      final notifications = [
        NotificationModel(
          id: '1',
          userId: 'user1',
          title: 'Test Title',
          body: 'Test Body',
          data: {'post_id': '123'},
          read: false,
          notificationType: NotificationType.comment,
          createdAt: DateTime.now(),
        ),
      ];
      
      // リポジトリのモック設定
      when(mockRepository.getNotifications(
        userId: anyNamed('userId'),
        read: anyNamed('read'),
        type: anyNamed('type'),
        limit: anyNamed('limit'),
        offset: anyNamed('offset'),
      )).thenAnswer((_) async => Right(notifications));
      
      // ユースケース実行
      final result = await useCase(
        userId: 'user1',
        read: false,
        type: NotificationType.comment,
      );
      
      // 結果検証
      expect(result.isRight(), true);
      result.fold(
        (failure) => fail('Expected success but got failure: $failure'),
        (data) {
          expect(data, notifications);
          expect(data.length, 1);
          expect(data[0].id, '1');
          expect(data[0].notificationType, NotificationType.comment);
        },
      );
      
      // リポジトリメソッドが正しく呼ばれたことを検証
      verify(mockRepository.getNotifications(
        userId: 'user1',
        read: false,
        type: NotificationType.comment,
        limit: 20,
        offset: 0,
      )).called(1);
    });

    test('リポジトリがエラーを返す場合、Failureを返すこと', () async {
      // リポジトリのモック設定
      when(mockRepository.getNotifications(
        userId: anyNamed('userId'),
        read: anyNamed('read'),
        type: anyNamed('type'),
        limit: anyNamed('limit'),
        offset: anyNamed('offset'),
      )).thenAnswer((_) async => Left(ServerFailure('通知の取得に失敗しました')));
      
      // ユースケース実行
      final result = await useCase(userId: 'user1');
      
      // 結果検証
      expect(result.isLeft(), true);
      result.fold(
        (failure) {
          expect(failure, isA<ServerFailure>());
          expect(failure.message, '通知の取得に失敗しました');
        },
        (_) => fail('Expected failure but got success'),
      );
    });
  });
}
```

#### MarkNotificationAsReadUseCaseTest
```dart
void main() {
  group('MarkNotificationAsReadUseCase Tests', () {
    late MockNotificationRepository mockRepository;
    late MarkNotificationAsReadUseCase useCase;

    setUp(() {
      mockRepository = MockNotificationRepository();
      useCase = MarkNotificationAsReadUseCase(repository: mockRepository);
    });

    test('通知を既読にすることに成功した場合、更新された通知を返すこと', () async {
      // モックの通知作成
      final updatedNotification = NotificationModel(
        id: '1',
        userId: 'user1',
        title: 'Test Title',
        body: 'Test Body',
        data: {'post_id': '123'},
        read: true, // 既読に更新済み
        notificationType: NotificationType.comment,
        createdAt: DateTime.now(),
        readAt: DateTime.now(),
      );
      
      // リポジトリのモック設定
      when(mockRepository.markAsRead('1'))
          .thenAnswer((_) async => Right(updatedNotification));
      
      // ユースケース実行
      final result = await useCase('1');
      
      // 結果検証
      expect(result.isRight(), true);
      result.fold(
        (failure) => fail('Expected success but got failure: $failure'),
        (notification) {
          expect(notification, updatedNotification);
          expect(notification.read, true);
          expect(notification.readAt, isNotNull);
        },
      );
    });

    test('既読処理が失敗した場合、Failureを返すこと', () async {
      // リポジトリのモック設定
      when(mockRepository.markAsRead('1'))
          .thenAnswer((_) async => Left(ServerFailure('通知の既読処理に失敗しました')));
      
      // ユースケース実行
      final result = await useCase('1');
      
      // 結果検証
      expect(result.isLeft(), true);
      result.fold(
        (failure) {
          expect(failure, isA<ServerFailure>());
          expect(failure.message, '通知の既読処理に失敗しました');
        },
        (_) => fail('Expected failure but got success'),
      );
    });
  });
}
```

#### GetNotificationSettingsUseCaseTest
```dart
void main() {
  group('GetNotificationSettingsUseCase Tests', () {
    late MockNotificationSettingsRepository mockRepository;
    late GetNotificationSettingsUseCase useCase;

    setUp(() {
      mockRepository = MockNotificationSettingsRepository();
      useCase = GetNotificationSettingsUseCase(repository: mockRepository);
    });

    test('通知設定の取得に成功した場合、設定が返されること', () async {
      // モックの通知設定作成
      final settings = NotificationSettingsModel(
        id: '1',
        userId: 'user1',
        commentsEnabled: true,
        highlightsEnabled: true,
        followersEnabled: true,
        followReasonsEnabled: false,
        systemEnabled: true,
        updatedAt: DateTime.now(),
      );
      
      // リポジトリのモック設定
      when(mockRepository.getNotificationSettings('user1'))
          .thenAnswer((_) async => Right(settings));
      
      // ユースケース実行
      final result = await useCase('user1');
      
      // 結果検証
      expect(result.isRight(), true);
      result.fold(
        (failure) => fail('Expected success but got failure: $failure'),
        (data) {
          expect(data, settings);
          expect(data.commentsEnabled, true);
          expect(data.followReasonsEnabled, false);
        },
      );
    });

    test('通知設定の取得に失敗した場合、Failureを返すこと', () async {
      // リポジトリのモック設定
      when(mockRepository.getNotificationSettings('user1'))
          .thenAnswer((_) async => Left(CacheFailure('通知設定の取得に失敗しました')));
      
      // ユースケース実行
      final result = await useCase('user1');
      
      // 結果検証
      expect(result.isLeft(), true);
      result.fold(
        (failure) {
          expect(failure, isA<CacheFailure>());
          expect(failure.message, '通知設定の取得に失敗しました');
        },
        (_) => fail('Expected failure but got success'),
      );
    });
  });
}
```

### ビューモデルテスト

#### NotificationListViewModelTest
```dart
void main() {
  group('NotificationListViewModel Tests', () {
    late MockGetNotificationsUseCase mockGetNotificationsUseCase;
    late MockMarkNotificationAsReadUseCase mockMarkNotificationAsReadUseCase;
    late MockDeleteNotificationUseCase mockDeleteNotificationUseCase;
    late MockGetUnreadCountUseCase mockGetUnreadCountUseCase;
    late MockMarkAllAsReadUseCase mockMarkAllAsReadUseCase;
    late NotificationListViewModel viewModel;

    setUp(() {
      mockGetNotificationsUseCase = MockGetNotificationsUseCase();
      mockMarkNotificationAsReadUseCase = MockMarkNotificationAsReadUseCase();
      mockDeleteNotificationUseCase = MockDeleteNotificationUseCase();
      mockGetUnreadCountUseCase = MockGetUnreadCountUseCase();
      mockMarkAllAsReadUseCase = MockMarkAllAsReadUseCase();
      
      viewModel = NotificationListViewModel(
        getNotificationsUseCase: mockGetNotificationsUseCase,
        markNotificationAsReadUseCase: mockMarkNotificationAsReadUseCase,
        deleteNotificationUseCase: mockDeleteNotificationUseCase,
        getUnreadCountUseCase: mockGetUnreadCountUseCase,
        markAllAsReadUseCase: mockMarkAllAsReadUseCase,
      );
    });

    test('初期状態がNotificationListInitialであること', () {
      expect(viewModel.state, isA<NotificationListInitial>());
    });

    test('loadNotificationsが成功した場合、状態がNotificationListLoadedになること', () async {
      // モックの通知リスト作成
      final notifications = [
        NotificationModel(
          id: '1',
          userId: 'user1',
          title: 'テスト通知',
          body: 'これはテスト通知です',
          data: {},
          read: false,
          notificationType: NotificationType.comment,
          createdAt: DateTime.now(),
        ),
      ];
      
      // モックの設定: 成功時の挙動
      when(mockGetNotificationsUseCase(
        userId: anyNamed('userId'),
        read: anyNamed('read'),
        type: anyNamed('type'),
        limit: anyNamed('limit'),
        offset: anyNamed('offset'),
      )).thenAnswer((_) async => Right(notifications));
      
      // テスト対象メソッドの実行
      await viewModel.loadNotifications(userId: 'user1');
      
      // 状態の検証
      expect(viewModel.state, isA<NotificationListLoaded>());
      expect((viewModel.state as NotificationListLoaded).notifications, notifications);
      expect((viewModel.state as NotificationListLoaded).notifications.length, 1);
    });

    test('loadNotificationsが失敗した場合、状態がNotificationListErrorになること', () async {
      // モックの設定: 失敗時の挙動
      when(mockGetNotificationsUseCase(
        userId: anyNamed('userId'),
        read: anyNamed('read'),
        type: anyNamed('type'),
        limit: anyNamed('limit'),
        offset: anyNamed('offset'),
      )).thenAnswer((_) async => Left(ServerFailure('通知の取得に失敗しました')));
      
      // テスト対象メソッドの実行
      await viewModel.loadNotifications(userId: 'user1');
      
      // 状態の検証
      expect(viewModel.state, isA<NotificationListError>());
      expect((viewModel.state as NotificationListError).message, '通知の取得に失敗しました');
    });

    test('markAsReadが成功した場合、該当の通知が既読状態になること', () async {
      // 初期状態として通知一覧を設定
      final notifications = [
        NotificationModel(
          id: '1',
          userId: 'user1',
          title: 'テスト通知1',
          body: 'これはテスト通知1です',
          data: {},
          read: false,
          notificationType: NotificationType.comment,
          createdAt: DateTime.now(),
        ),
        NotificationModel(
          id: '2',
          userId: 'user1',
          title: 'テスト通知2',
          body: 'これはテスト通知2です',
          data: {},
          read: false,
          notificationType: NotificationType.highlight,
          createdAt: DateTime.now(),
        ),
      ];

      when(mockGetNotificationsUseCase(
        userId: anyNamed('userId'),
        read: anyNamed('read'),
        type: anyNamed('type'),
        limit: anyNamed('limit'),
        offset: anyNamed('offset'),
      )).thenAnswer((_) async => Right(notifications));
      
      await viewModel.loadNotifications(userId: 'user1');
      
      // 既読に更新された通知
      final updatedNotification = NotificationModel(
        id: '1',
        userId: 'user1',
        title: 'テスト通知1',
        body: 'これはテスト通知1です',
        data: {},
        read: true,
        notificationType: NotificationType.comment,
        createdAt: (notifications[0] as NotificationModel).createdAt,
        readAt: DateTime.now(),
      );
      
      // モックの設定: 既読処理成功
      when(mockMarkNotificationAsReadUseCase('1'))
          .thenAnswer((_) async => Right(updatedNotification));
      
      // テスト対象メソッドの実行
      await viewModel.markAsRead('1');
      
      // 状態の検証
      expect(viewModel.state, isA<NotificationListLoaded>());
      final loadedState = viewModel.state as NotificationListLoaded;
      // 1番目の通知が既読になっていることを確認
      expect(loadedState.notifications[0].read, true);
      // 2番目の通知は未読のままであることを確認
      expect(loadedState.notifications[1].read, false);
    });

    test('deleteNotificationが成功した場合、該当の通知がリストから削除されること', () async {
      // 初期状態として通知一覧を設定
      final notifications = [
        NotificationModel(
          id: '1',
          userId: 'user1',
          title: 'テスト通知1',
          body: 'これはテスト通知1です',
          data: {},
          read: false,
          notificationType: NotificationType.comment,
          createdAt: DateTime.now(),
        ),
        NotificationModel(
          id: '2',
          userId: 'user1',
          title: 'テスト通知2',
          body: 'これはテスト通知2です',
          data: {},
          read: false,
          notificationType: NotificationType.highlight,
          createdAt: DateTime.now(),
        ),
      ];

      when(mockGetNotificationsUseCase(
        userId: anyNamed('userId'),
        read: anyNamed('read'),
        type: anyNamed('type'),
        limit: anyNamed('limit'),
        offset: anyNamed('offset'),
      )).thenAnswer((_) async => Right(notifications));
      
      await viewModel.loadNotifications(userId: 'user1');
      
      // モックの設定: 削除処理成功
      when(mockDeleteNotificationUseCase('1'))
          .thenAnswer((_) async => Right(true));
      
      // テスト対象メソッドの実行
      await viewModel.deleteNotification('1');
      
      // 状態の検証
      expect(viewModel.state, isA<NotificationListLoaded>());
      final loadedState = viewModel.state as NotificationListLoaded;
      // 通知が1つになっていることを確認
      expect(loadedState.notifications.length, 1);
      // 残っている通知のIDが'2'であることを確認
      expect(loadedState.notifications[0].id, '2');
    });
  });
}
```

#### NotificationSettingsViewModelTest
```dart
void main() {
  group('NotificationSettingsViewModel Tests', () {
    late MockGetNotificationSettingsUseCase mockGetNotificationSettingsUseCase;
    late MockUpdateNotificationSettingsUseCase mockUpdateNotificationSettingsUseCase;
    late NotificationSettingsViewModel viewModel;

    setUp(() {
      mockGetNotificationSettingsUseCase = MockGetNotificationSettingsUseCase();
      mockUpdateNotificationSettingsUseCase = MockUpdateNotificationSettingsUseCase();
      
      viewModel = NotificationSettingsViewModel(
        getNotificationSettingsUseCase: mockGetNotificationSettingsUseCase,
        updateNotificationSettingsUseCase: mockUpdateNotificationSettingsUseCase,
      );
    });

    test('初期状態がNotificationSettingsInitialであること', () {
      expect(viewModel.state, isA<NotificationSettingsInitial>());
    });

    test('loadSettingsが成功した場合、状態がNotificationSettingsLoadedになること', () async {
      // モックの通知設定作成
      final settings = NotificationSettingsModel(
        id: '1',
        userId: 'user1',
        commentsEnabled: true,
        highlightsEnabled: true,
        followersEnabled: true,
        followReasonsEnabled: false,
        systemEnabled: true,
        updatedAt: DateTime.now(),
      );
      
      // モックの設定
      when(mockGetNotificationSettingsUseCase('user1'))
          .thenAnswer((_) async => Right(settings));
      
      // テスト対象メソッドの実行
      await viewModel.loadSettings('user1');
      
      // 状態の検証
      expect(viewModel.state, isA<NotificationSettingsLoaded>());
      expect((viewModel.state as NotificationSettingsLoaded).settings, settings);
    });

    test('toggleSettingが成功した場合、設定が更新されること', () async {
      // モックの初期設定
      final initialSettings = NotificationSettingsModel(
        id: '1',
        userId: 'user1',
        commentsEnabled: true,
        highlightsEnabled: true,
        followersEnabled: true,
        followReasonsEnabled: false,
        systemEnabled: true,
        updatedAt: DateTime.now(),
      );
      
      // 更新後の設定
      final updatedSettings = NotificationSettingsModel(
        id: '1',
        userId: 'user1',
        commentsEnabled: false, // ここが変更される
        highlightsEnabled: true,
        followersEnabled: true,
        followReasonsEnabled: false,
        systemEnabled: true,
        updatedAt: DateTime.now(),
      );
      
      // 初期状態の設定
      when(mockGetNotificationSettingsUseCase('user1'))
          .thenAnswer((_) async => Right(initialSettings));
      await viewModel.loadSettings('user1');
      
      // 更新処理のモック設定
      when(mockUpdateNotificationSettingsUseCase(any))
          .thenAnswer((_) async => Right(updatedSettings));
      
      // コメント通知を無効化
      await viewModel.toggleSetting(
        (viewModel.state as NotificationSettingsLoaded).settings,
        NotificationType.comment,
        false,
      );
      
      // 状態の検証
      expect(viewModel.state, isA<NotificationSettingsLoaded>());
      final loadedState = viewModel.state as NotificationSettingsLoaded;
      expect(loadedState.settings.commentsEnabled, false);
      expect(loadedState.settings.highlightsEnabled, true); // 他の設定は変更なし
    });
  });
}
```

## 2. 統合テスト

### 通知表示フロー統合テスト
- 通知一覧の取得から表示、既読処理までの一連のフローをテスト
- フィルタリングと更新が適切に動作することを確認
- 未読バッジの表示が正しく更新されることを確認

### 通知設定フロー統合テスト
- 通知設定の取得から表示、更新までの一連のフローをテスト
- 設定変更が適切に永続化されることを確認
- 設定変更後に通知フィルタリングが正しく動作することを確認

### デバイストークン管理フロー統合テスト
- アプリ起動時のデバイストークン登録フローをテスト
- トークン更新時の処理が正しく動作することを確認
- ログアウト時のトークン無効化処理が正しく動作することを確認

## 3. UIテスト

### NotificationListScreenTest
```dart
void main() {
  testWidgets('通知一覧画面が正しく表示されることをテスト', (WidgetTester tester) async {
    // モックデータとプロバイダーの設定
    final mockNotificationViewModel = MockNotificationListViewModel();
    final notifications = [
      NotificationModel(
        id: '1',
        userId: 'user1',
        title: 'コメント通知',
        body: '投稿にコメントがつきました',
        data: {'post_id': '123'},
        read: false,
        notificationType: NotificationType.comment,
        createdAt: DateTime.now().subtract(Duration(minutes: 5)),
      ),
      NotificationModel(
        id: '2',
        userId: 'user1',
        title: 'フォロー通知',
        body: '新しいフォロワーがいます',
        data: {'follower_id': '456'},
        read: true,
        notificationType: NotificationType.follower,
        createdAt: DateTime.now().subtract(Duration(hours: 1)),
        readAt: DateTime.now().subtract(Duration(minutes: 30)),
      ),
    ];
    
    // モックの状態を設定
    when(mockNotificationViewModel.state).thenReturn(NotificationListLoaded(notifications, unreadCount: 1));
    
    // テスト対象ウィジェットをレンダリング
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          notificationListViewModelProvider.overrideWithValue(mockNotificationViewModel),
        ],
        child: MaterialApp(
          home: NotificationListScreen(),
        ),
      ),
    );
    
    // UI要素の存在チェック
    expect(find.text('通知'), findsOneWidget); // 画面タイトル
    expect(find.text('コメント通知'), findsOneWidget); // 未読通知
    expect(find.text('フォロー通知'), findsOneWidget); // 既読通知
    expect(find.text('投稿にコメントがつきました'), findsOneWidget); // 通知本文
    expect(find.text('新しいフォロワーがいます'), findsOneWidget); // 通知本文
    expect(find.byType(CircleAvatar), findsNWidgets(2)); // 通知アイコン
    
    // 未読通知をタップ
    await tester.tap(find.text('コメント通知'));
    await tester.pumpAndSettle();
    
    // 既読処理が呼ばれることを確認
    verify(mockNotificationViewModel.markAsRead('1')).called(1);
  });
  
  testWidgets('通知がない場合の表示をテスト', (WidgetTester tester) async {
    // モックデータとプロバイダーの設定
    final mockNotificationViewModel = MockNotificationListViewModel();
    
    // モックの状態を設定
    when(mockNotificationViewModel.state).thenReturn(NotificationListLoaded([], unreadCount: 0));
    
    // テスト対象ウィジェットをレンダリング
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          notificationListViewModelProvider.overrideWithValue(mockNotificationViewModel),
        ],
        child: MaterialApp(
          home: NotificationListScreen(),
        ),
      ),
    );
    
    // UI要素の存在チェック
    expect(find.text('通知はありません'), findsOneWidget); // 空の状態メッセージ
    expect(find.byType(NotificationEmptyState), findsOneWidget); // 空の状態ウィジェット
  });
}
```

### NotificationSettingsScreenTest
```dart
void main() {
  testWidgets('通知設定画面が正しく表示されることをテスト', (WidgetTester tester) async {
    // モックデータとプロバイダーの設定
    final mockNotificationSettingsViewModel = MockNotificationSettingsViewModel();
    final settings = NotificationSettingsModel(
      id: '1',
      userId: 'user1',
      commentsEnabled: true,
      highlightsEnabled: true,
      followersEnabled: false,
      followReasonsEnabled: true,
      systemEnabled: true,
      updatedAt: DateTime.now(),
    );
    
    // モックの状態を設定
    when(mockNotificationSettingsViewModel.state).thenReturn(NotificationSettingsLoaded(settings));
    
    // テスト対象ウィジェットをレンダリング
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          notificationSettingsViewModelProvider.overrideWithValue(mockNotificationSettingsViewModel),
        ],
        child: MaterialApp(
          home: NotificationSettingsScreen(),
        ),
      ),
    );
    
    // UI要素の存在チェック
    expect(find.text('通知設定'), findsOneWidget); // 画面タイトル
    expect(find.text('コメント通知'), findsOneWidget);
    expect(find.text('ハイライト通知'), findsOneWidget);
    expect(find.text('フォロワー通知'), findsOneWidget);
    expect(find.text('フォロー理由通知'), findsOneWidget);
    expect(find.text('システム通知'), findsOneWidget);
    
    // スイッチの状態確認
    expect(tester.widget<Switch>(find.byType(Switch).at(0)).value, true); // コメント通知ON
    expect(tester.widget<Switch>(find.byType(Switch).at(1)).value, true); // ハイライト通知ON
    expect(tester.widget<Switch>(find.byType(Switch).at(2)).value, false); // フォロワー通知OFF
    expect(tester.widget<Switch>(find.byType(Switch).at(3)).value, true); // フォロー理由通知ON
    expect(tester.widget<Switch>(find.byType(Switch).at(4)).value, true); // システム通知ON
    
    // スイッチをタップして設定変更
    await tester.tap(find.byType(Switch).at(0)); // コメント通知をOFFに
    await tester.pumpAndSettle();
    
    // toggleSettingメソッドが呼ばれることを確認
    verify(mockNotificationSettingsViewModel.toggleSetting(
      settings,
      NotificationType.comment,
      false,
    )).called(1);
  });
}
```

## 4. モック設定

### モックリポジトリクラス

```dart
// MockNotificationRepository
class MockNotificationRepository implements INotificationRepository {
  bool _shouldSucceed = true;
  List<NotificationModel> _notifications = [];
  
  void setSuccessMode(bool succeed) {
    _shouldSucceed = succeed;
  }
  
  void setMockNotifications(List<NotificationModel> notifications) {
    _notifications = notifications;
  }
  
  @override
  Future<Either<Failure, List<NotificationEntity>>> getNotifications({
    String? userId,
    bool? read,
    NotificationType? type,
    int limit = 20,
    int offset = 0,
  }) async {
    if (!_shouldSucceed) {
      return Left(ServerFailure('通知の取得に失敗しました'));
    }
    
    // フィルタリング
    var filteredNotifications = _notifications.where((notification) {
      if (userId != null && notification.userId != userId) return false;
      if (read != null && notification.read != read) return false;
      if (type != null && notification.notificationType != type) return false;
      return true;
    }).toList();
    
    // ページネーション
    final start = offset;
    final end = filteredNotifications.length > offset + limit
        ? offset + limit
        : filteredNotifications.length;
    
    if (start >= filteredNotifications.length) {
      return Right([]);
    }
    
    return Right(filteredNotifications.sublist(start, end));
  }
  
  // 他のメソッドも同様に実装
}

// MockNotificationSettingsRepository
class MockNotificationSettingsRepository implements INotificationSettingsRepository {
  bool _shouldSucceed = true;
  NotificationSettingsModel? _settings;
  
  void setSuccessMode(bool succeed) {
    _shouldSucceed = succeed;
  }
  
  void setMockSettings(NotificationSettingsModel settings) {
    _settings = settings;
  }
  
  @override
  Future<Either<Failure, NotificationSettingsEntity>> getNotificationSettings(
    String userId,
  ) async {
    if (!_shouldSucceed) {
      return Left(ServerFailure('通知設定の取得に失敗しました'));
    }
    
    if (_settings == null) {
      return Left(CacheFailure('通知設定が見つかりません'));
    }
    
    return Right(_settings!);
  }
  
  // 他のメソッドも同様に実装
}

// MockNotificationDeviceRepository
class MockNotificationDeviceRepository implements INotificationDeviceRepository {
  bool _shouldSucceed = true;
  List<NotificationDeviceModel> _devices = [];
  
  void setSuccessMode(bool succeed) {
    _shouldSucceed = succeed;
  }
  
  void setMockDevices(List<NotificationDeviceModel> devices) {
    _devices = devices;
  }
  
  @override
  Future<Either<Failure, NotificationDeviceEntity>> registerDeviceToken(
    String userId,
    String token,
    DeviceType type,
  ) async {
    if (!_shouldSucceed) {
      return Left(ServerFailure('デバイストークンの登録に失敗しました'));
    }
    
    final device = NotificationDeviceModel(
      id: 'device_${DateTime.now().millisecondsSinceEpoch}',
      userId: userId,
      deviceToken: token,
      deviceType: type,
      isActive: true,
      createdAt: DateTime.now(),
    );
    
    _devices.add(device);
    return Right(device);
  }
  
  // 他のメソッドも同様に実装
}
```

## 5. CI/CD設定

### GitHubワークフロー設定

```yaml
name: Notification Domain Tests

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'app/lib/domain/entities/notification_*.dart'
      - 'app/lib/domain/repositories/notification_*.dart'
      - 'app/lib/domain/usecases/notification/**'
      - 'app/lib/data/models/notification_*.dart'
      - 'app/lib/data/repositories/notification_*.dart'
      - 'app/lib/data/datasources/notification_*.dart'
      - 'app/lib/presentation/viewmodels/notification_*.dart'
      - 'app/lib/presentation/screens/notification_*.dart'
      - 'app/lib/presentation/widgets/notification_*.dart'
      - 'app/test/domain/notification/**'
      - 'app/test/data/notification/**'
      - 'app/test/presentation/notification/**'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'app/lib/domain/notification/**'
      - 'app/lib/data/notification/**'
      - 'app/lib/presentation/notification/**'
      - 'app/test/domain/notification/**'
      - 'app/test/data/notification/**'
      - 'app/test/presentation/notification/**'

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
        run: cd app && flutter test test/domain/notification/ test/data/notification/ test/presentation/notification/
```

## 6. テストのベストプラクティス

1. **テスト間の独立性を確保**
   - 各テストは他のテストの実行結果に依存しないようにする
   - `setUp`と`tearDown`を使って適切にテスト環境を初期化・クリーンアップする

2. **モックの適切な使用**
   - 外部依存（API、データベース、通知サービス）はモック化する
   - Mockito/MockKを使用して依存性をモック化する
   - 複雑なシナリオをテストするために様々な応答をシミュレートする

3. **テストカバレッジの最適化**
   - すべてのビジネスロジックに対するテストを書く
   - 通知タイプ、既読/未読、オンライン/オフラインなど境界条件をテストする
   - 失敗ケースとエラーハンドリングのテストを含める

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
// test/fixtures/notification/notification.json
{
  "id": "123",
  "user_id": "456",
  "title": "テスト通知",
  "body": "これはテスト通知です",
  "data": {
    "post_id": "789",
    "route": "/posts/789"
  },
  "read": false,
  "notification_type": "comment",
  "created_at": "2023-01-01T12:00:00Z",
  "read_at": null
}

// test/fixtures/notification/notification_settings.json
{
  "id": "123",
  "user_id": "456",
  "comments_enabled": true,
  "highlights_enabled": true,
  "followers_enabled": true,
  "follow_reasons_enabled": false,
  "system_enabled": true,
  "updated_at": "2023-01-01T12:00:00Z"
}

// test/fixtures/notification/device.json
{
  "id": "123",
  "user_id": "456",
  "device_token": "fcm-token-123",
  "device_type": "fcm",
  "is_active": true,
  "created_at": "2023-01-01T12:00:00Z",
  "last_used_at": "2023-01-01T12:00:00Z"
}

// FixtureReader
String fixture(String path) => File('test/fixtures/$path').readAsStringSync();
```

### テストヘルパー
```dart
// テストのセットアップを簡略化するヘルパー関数
Future<MockNotificationRepository> setupNotificationRepositoryTest() async {
  final repository = MockNotificationRepository();
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
   - NotificationModelTest, NotificationSettingsModelTest, NotificationDeviceModelTest
   - NotificationRepositoryTest（基本機能）

2. **第2フェーズ（ユースケースとビューモデルテスト）**
   - GetNotificationsUseCaseTest, MarkNotificationAsReadUseCaseTest
   - NotificationListViewModelTest（基本機能）

3. **第3フェーズ（残りのリポジトリとユースケース）**
   - NotificationSettingsRepositoryTest, NotificationDeviceRepositoryTest
   - GetNotificationSettingsUseCaseTest, UpdateNotificationSettingsUseCaseTest

4. **第4フェーズ（UIテスト）**
   - NotificationListScreenTest
   - NotificationSettingsScreenTest
   - NotificationItemTest

5. **第5フェーズ（統合テスト）**
   - 通知表示フロー統合テスト
   - 通知設定フロー統合テスト
   - デバイストークン管理フロー統合テスト

## 9. 性能テスト

### レスポンス時間テスト
- 通知一覧の表示速度が200ms以内であることを確認
- 通知設定の読み込みと表示が200ms以内であることを確認
- 通知の既読処理が500ms以内に完了することを確認

### メモリ使用量テスト
- 大量の通知一覧表示時のメモリ使用量が許容範囲内であることを確認
- 通知アイコンのキャッシュがメモリを過剰に使用しないことを確認

## 10. セキュリティテスト

- デバイストークンがSecureStorageに安全に保存されることを確認
- 認証トークンなしでAPIリクエストが適切に拒否されることを確認
- 通知データのプライバシー保護（機密情報を含まない）が適切に実装されていることを確認
- 他のユーザーの通知へのアクセスが制限されていることを確認