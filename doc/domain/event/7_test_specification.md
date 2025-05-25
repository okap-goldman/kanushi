# イベントドメインテスト仕様書

## 1. テスト概要

イベントドメインのテストは、クリーンアーキテクチャの各層（プレゼンテーション層、ドメイン層、データ層）に対して包括的なテストを実施します。テストは単体テスト、統合テスト、UIテストの3つのレベルに分けて行います。

## 2. テスト環境

- **開発環境**: Flutter 3.x以上
- **テストフレームワーク**: flutter_test
- **モック・フェイクツール**: mocktail
- **UIテスト**: flutter_test + integration_test
- **カバレッジツール**: flutter_coverage

## 3. テスト対象コンポーネント

### 3.1 データ層

#### 3.1.1 モデル

- **EventModel**
  - fromJsonの正常系テスト
  - toJsonの正常系テスト
  - 特殊文字や長いテキストを含むJSONからの変換テスト
  - nullに対する安全性テスト
  - isFreeEvent、hasStarted、hasEnded、isUpcomingなどのプロパティゲッターテスト
  - formattedFeeメソッドテスト
  
- **EventParticipantModel**
  - fromJsonの正常系テスト
  - toJsonの正常系テスト
  - ParticipantStatusとPaymentStatusのenum処理テスト
  
- **EventCoHostModel**
  - fromJsonの正常系テスト
  - toJsonの正常系テスト
  
- **EventPaymentModel**
  - fromJsonの正常系テスト
  - toJsonの正常系テスト
  - PaymentStatusのenum処理テスト
  - メタデータのJSONオブジェクト処理テスト

#### 3.1.2 リモートデータソース

- **EventRemoteDataSource**
  - getEventsの成功テスト（フィルター条件付き）
  - getEventByIdの成功テスト
  - getEventByIdの失敗テスト（存在しないID）
  - createEventの成功テスト
  - updateEventの成功テスト
  - deleteEventの成功テスト
  - getUserEventsの成功テスト（作成・参加）
  - getEventPostsの成功テスト
  - 各種ネットワークエラーに対する挙動テスト
  
- **EventParticipantRemoteDataSource**
  - getEventParticipantsの成功テスト
  - joinEventの成功テスト
  - cancelParticipationの成功テスト
  - getUserEventParticipationの成功テスト
  - getEventCoHostsの成功テスト
  - addEventCoHostの成功テスト
  - removeEventCoHostの成功テスト
  
- **EventPaymentRemoteDataSource**
  - createEventPaymentIntentの成功テスト
  - confirmEventPaymentの成功テスト
  - getEventPaymentの成功テスト
  - processRefundの成功テスト

#### 3.1.3 ローカルデータソース

- **EventLocalDataSource**
  - cacheEventの成功テスト
  - getEventByIdの成功テスト
  - getEventByIdの失敗テスト（存在しないID）
  - deleteEventの成功テスト
  - getEventsの成功テスト（フィルター条件付き）
  - キャッシュの有効期限テスト
  
- **EventParticipantLocalDataSource**
  - cacheEventParticipantの成功テスト
  - getEventParticipantsの成功テスト
  - getUserEventParticipationの成功テスト
  - deleteEventParticipantの成功テスト

#### 3.1.4 リポジトリ実装

- **EventRepository**
  - getEventsのキャッシュヒットテスト
  - getEventsのキャッシュミス→リモート成功テスト
  - getEventByIdのキャッシュヒットテスト
  - getEventByIdのキャッシュミス→リモート成功テスト
  - createEventの成功テスト
  - updateEventの成功テスト
  - deleteEventの成功テスト
  - getUserEventsの成功テスト
  - getEventPostsの成功テスト
  - オフライン時の挙動テスト
  - エラーハンドリングテスト
  
- **EventParticipantRepository**
  - getEventParticipantsの成功テスト
  - joinEventの成功テスト
  - cancelParticipationの成功テスト
  - getUserEventParticipationの成功テスト
  - getEventCoHostsの成功テスト
  - addEventCoHostの成功テスト
  - removeEventCoHostの成功テスト
  - オフライン時の挙動テスト
  
- **EventPaymentRepository**
  - createEventPaymentIntentの成功テスト
  - confirmEventPaymentの成功テスト
  - getEventPaymentの成功テスト
  - processRefundの成功テスト
  - エラーハンドリングテスト

### 3.2 ドメイン層

#### 3.2.1 エンティティ

- **EventEntity**
  - コンストラクタテスト
  - copyWithメソッドテスト
  - equalsとhashCodeの実装テスト
  
- **EventParticipantEntity**
  - コンストラクタテスト
  - ParticipantStatusとPaymentStatusのenum動作テスト
  
- **EventCoHostEntity**
  - コンストラクタテスト

- **EventPaymentEntity**
  - コンストラクタテスト
  - PaymentStatusのenum動作テスト

#### 3.2.2 ユースケース

- **GetEventsUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  - フィルター条件による結果テスト
  
- **GetEventByIdUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  
- **CreateEventUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  - イベント作成時のバリデーションテスト
  
- **UpdateEventUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  
- **DeleteEventUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  
- **GetEventParticipantsUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  - フィルター条件による結果テスト
  
- **JoinEventUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  - 有料イベント参加時の支払いフローテスト
  - 無料イベント参加時のフローテスト
  
- **CancelEventParticipationUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  
- **GetUserEventParticipationUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  
- **AddEventCoHostUseCase/RemoveEventCoHostUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  
- **CreateEventPaymentUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  - 無料イベントへの支払い試行時のテスト
  
- **GetEventPaymentUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  
- **ProcessRefundUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト
  
- **GetEventTimelineUseCase**
  - 成功時のリポジトリ呼び出しと結果テスト
  - 失敗時のエラーハンドリングテスト

### 3.3 プレゼンテーション層

#### 3.3.1 ビューモデル

- **EventListViewModel**
  - loadEventsの状態遷移テスト（初期→ロード中→成功）
  - loadEventsの状態遷移テスト（初期→ロード中→エラー）
  - loadMoreの状態遷移テスト（追加読み込み）
  - フィルター適用時の状態遷移テスト
  
- **EventDetailViewModel**
  - loadEventの状態遷移テスト（初期→ロード中→成功）
  - loadEventの状態遷移テスト（初期→ロード中→エラー）
  - checkUserParticipationの状態遷移テスト
  - joinEventの状態遷移テスト（無料イベント）
  - joinEventの状態遷移テスト（有料イベント→決済準備）
  - cancelParticipationの状態遷移テスト
  
- **EventRegistrationViewModel**
  - joinEventの状態遷移テスト
  - processPaymentの状態遷移テスト
  - cancelRegistrationの状態遷移テスト
  
- **EventCreationViewModel**
  - createEventの状態遷移テスト（成功）
  - createEventの状態遷移テスト（失敗）
  - 入力バリデーションテスト
  
- **EventEditViewModel**
  - loadEventの状態遷移テスト
  - updateEventの状態遷移テスト
  - 入力バリデーションテスト
  
- **EventParticipantsViewModel**
  - loadParticipantsの状態遷移テスト
  - filterParticipantsの状態遷移テスト
  
- **EventPaymentViewModel**
  - initiatePaymentの状態遷移テスト
  - confirmPaymentの状態遷移テスト
  - requestRefundの状態遷移テスト

#### 3.3.2 ウィジェットテスト

- **EventCard**
  - イベント情報の表示テスト
  - 日時表示フォーマットテスト
  - 参加ボタン操作テスト
  - 有料/無料表示テスト
  
- **EventDetailHeader**
  - イベント基本情報表示テスト
  - 主催者情報表示テスト
  - 開催場所表示テスト
  
- **ParticipantAvatar**
  - 参加者アバター表示テスト
  - 参加ステータス表示テスト
  
- **ParticipantList**
  - 参加者リスト表示テスト
  - 参加ステータスフィルターテスト
  
- **EventDateTimePicker**
  - 日時選択操作テスト
  - 開始・終了時間の関係性バリデーションテスト
  
- **EventLocationSelector**
  - 場所入力テスト
  - 場所選択テスト
  
- **PaymentMethodSelector**
  - 支払い方法選択テスト
  - 支払い金額表示テスト
  
- **EventStatusBadge**
  - ステータス表示テスト（upcoming, ongoing, past）
  - 参加ステータス表示テスト
  
- **EventTimeline**
  - イベント関連投稿表示テスト
  - 投稿時間順表示テスト

#### 3.3.3 画面テスト

- **EventScreen**
  - イベント一覧表示テスト
  - フィルター操作テスト
  - 無限スクロールテスト
  
- **EventDetailScreen**
  - イベント詳細表示テスト
  - 参加登録操作テスト
  - 参加者一覧表示テスト
  - 関連投稿表示テスト
  - 主催者メニュー表示テスト（主催者の場合）
  
- **EventRegistrationScreen**
  - 参加フォーム表示テスト
  - 参加ステータス選択テスト
  - 有料イベント決済フローテスト
  
- **EventCreationScreen**
  - イベント作成フォーム表示テスト
  - 必須項目バリデーションテスト
  - 日時選択テスト
  - 料金設定テスト
  - 場所設定テスト
  
- **EventEditScreen**
  - 既存イベント情報表示テスト
  - 編集操作テスト
  - バリデーションテスト
  
- **EventParticipantsScreen**
  - 参加者一覧表示テスト
  - 参加ステータスでのフィルターテスト
  - 参加者検索テスト
  
- **MyEventsScreen**
  - 作成イベント表示テスト
  - 参加イベント表示テスト
  - フィルター操作テスト
  
- **EventPaymentScreen**
  - 料金詳細表示テスト
  - 決済手続きフローテスト
  - 決済エラー表示テスト
  
- **EventCompletionScreen**
  - 決済完了表示テスト
  - イベント詳細リンクテスト

## 4. 統合テスト

### 4.1 イベント作成・参加フロー
- イベント作成→一覧表示→詳細表示→参加登録
- 有料イベント作成→参加登録→決済フロー
- イベント作成→編集→変更確認→削除

### 4.2 イベント参加管理フロー
- イベント参加→キャンセル→再参加フロー
- 「興味あり」から「参加」への変更フロー
- 参加キャンセルと返金リクエストフロー

### 4.3 共同ホスト機能フロー
- イベント作成→共同ホスト追加→権限確認
- 共同ホストによるイベント編集→権限確認

### 4.4 イベント検索・フィルターフロー
- 地域検索→結果表示→日付フィルター適用→結果確認
- 時間フィルター→有料/無料フィルター→結果確認

## 5. UIテスト

### 5.1 イベント一覧UI
- 画面レイアウトテスト
- イベントカード表示テスト
- フィルター操作テスト
- ソート操作テスト
- ページネーション/無限スクロールテスト

### 5.2 イベント詳細UI
- 基本情報表示テスト
- 参加者リスト表示テスト
- 地図表示テスト
- 参加/興味ありボタン操作テスト
- 主催者メニュー表示テスト（主催者の場合）

### 5.3 イベント作成UI
- フォーム入力テスト
- 日時選択テスト
- 場所選択テスト
- 料金設定テスト
- バリデーションエラー表示テスト

### 5.4 決済UI
- 料金詳細表示テスト
- 支払い方法選択テスト
- 決済処理進行表示テスト
- エラー表示テスト
- 完了表示テスト

## 6. パフォーマンステスト

### 6.1 イベント一覧表示パフォーマンス
- 大量（100件以上）のイベント読み込みテスト
- スクロール性能テスト
- フィルター適用速度テスト

### 6.2 参加者リスト表示パフォーマンス
- 大規模イベント（1000人以上）の参加者表示テスト
- 参加者リストのスクロール性能テスト
- 参加者フィルター適用速度テスト

### 6.3 決済処理パフォーマンス
- 決済開始から完了までの時間測定
- 同時複数決済処理の安定性テスト
- ネットワーク遅延時の挙動テスト

### 6.4 オフラインモード
- オフラインでのイベント一覧表示テスト
- オフラインでのイベント詳細表示テスト
- オンライン復帰時の同期テスト

## 7. エラーケーステスト

### 7.1 ネットワークエラー
- オフライン状態での操作テスト
- 接続不安定時の操作テスト
- タイムアウト発生時のリトライ機能テスト

### 7.2 バリデーションエラー
- 不完全なイベント情報登録テスト
- 不正な日時設定テスト（過去の日付、開始>終了など）
- 無効な料金設定テスト

### 7.3 決済エラー
- 決済失敗ケース処理テスト
- 決済タイムアウトテスト
- 返金リクエスト失敗テスト

### 7.4 権限エラー
- 権限のないユーザーによるイベント編集試行テスト
- 権限のないユーザーによる共同ホスト追加試行テスト
- イベント参加キャンセル期限超過テスト

## 8. アクセシビリティテスト

### 8.1 スクリーンリーダー対応
- イベント情報の読み上げテスト
- フォーム操作のアクセシビリティテスト
- エラーメッセージの読み上げテスト

### 8.2 キーボード操作
- キーボードナビゲーションテスト
- フォーム入力のタブ順序テスト
- ショートカットキー操作テスト

## 9. テストデータ

### 9.1 テスト用モックデータ
- 各種イベントタイプのモックデータ
- 参加者プロフィールモックデータ
- 決済情報モックデータ

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
  group('EventModel', () {
    test('fromJson should correctly parse JSON', () {
      // 準備
      final json = {
        'id': '123',
        'creator_user_id': 'user123',
        'name': 'テストイベント',
        'description': 'これはテストイベントの説明です',
        'location': '東京都渋谷区',
        'starts_at': '2023-01-01T10:00:00.000Z',
        'ends_at': '2023-01-01T12:00:00.000Z',
        'fee': 1000,
        'currency': 'JPY',
        'refund_policy': '開催3日前までキャンセル可能',
        'created_at': '2022-12-01T00:00:00.000Z',
        'participant_count': 15,
        'interested_count': 30,
      };
      
      // 実行
      final result = EventModel.fromJson(json);
      
      // 検証
      expect(result.id, '123');
      expect(result.creatorUserId, 'user123');
      expect(result.name, 'テストイベント');
      expect(result.location, '東京都渋谷区');
      expect(result.startsAt, DateTime.parse('2023-01-01T10:00:00.000Z'));
      expect(result.fee, 1000);
      expect(result.participantCount, 15);
    });
    
    test('toJson should return correct JSON', () {
      // 準備
      final event = EventModel(
        id: '123',
        creatorUserId: 'user123',
        name: 'テストイベント',
        description: 'これはテストイベントの説明です',
        location: '東京都渋谷区',
        startsAt: DateTime.parse('2023-01-01T10:00:00.000Z'),
        endsAt: DateTime.parse('2023-01-01T12:00:00.000Z'),
        fee: 1000,
        currency: 'JPY',
        refundPolicy: '開催3日前までキャンセル可能',
        createdAt: DateTime.parse('2022-12-01T00:00:00.000Z'),
        participantCount: 15,
        interestedCount: 30,
      );
      
      // 実行
      final result = event.toJson();
      
      // 検証
      expect(result['id'], '123');
      expect(result['creator_user_id'], 'user123');
      expect(result['name'], 'テストイベント');
      expect(result['fee'], 1000);
      expect(result['starts_at'], '2023-01-01T10:00:00.000Z');
    });
    
    test('isFreeEvent should return true for free events', () {
      // 準備
      final freeEvent = EventModel(
        id: '123',
        creatorUserId: 'user123',
        name: 'テストイベント',
        description: 'これはテストイベントの説明です',
        location: '東京都渋谷区',
        startsAt: DateTime.parse('2023-01-01T10:00:00.000Z'),
        endsAt: DateTime.parse('2023-01-01T12:00:00.000Z'),
        fee: 0,
        createdAt: DateTime.now(),
      );
      
      final nullFeeEvent = EventModel(
        id: '123',
        creatorUserId: 'user123',
        name: 'テストイベント',
        description: 'これはテストイベントの説明です',
        location: '東京都渋谷区',
        startsAt: DateTime.parse('2023-01-01T10:00:00.000Z'),
        endsAt: DateTime.parse('2023-01-01T12:00:00.000Z'),
        fee: null,
        createdAt: DateTime.now(),
      );
      
      final paidEvent = EventModel(
        id: '123',
        creatorUserId: 'user123',
        name: 'テストイベント',
        description: 'これはテストイベントの説明です',
        location: '東京都渋谷区',
        startsAt: DateTime.parse('2023-01-01T10:00:00.000Z'),
        endsAt: DateTime.parse('2023-01-01T12:00:00.000Z'),
        fee: 1000,
        createdAt: DateTime.now(),
      );
      
      // 検証
      expect(freeEvent.isFreeEvent, true);
      expect(nullFeeEvent.isFreeEvent, true);
      expect(paidEvent.isFreeEvent, false);
    });
  });
}
```

### 11.2 リポジトリテスト例

```dart
class MockEventRemoteDataSource extends Mock implements EventRemoteDataSource {}
class MockEventLocalDataSource extends Mock implements EventLocalDataSource {}

void main() {
  late EventRepository repository;
  late MockEventRemoteDataSource mockRemoteDataSource;
  late MockEventLocalDataSource mockLocalDataSource;
  
  setUp(() {
    mockRemoteDataSource = MockEventRemoteDataSource();
    mockLocalDataSource = MockEventLocalDataSource();
    repository = EventRepository(
      remoteDataSource: mockRemoteDataSource,
      localDataSource: mockLocalDataSource,
    );
  });
  
  group('getEventById', () {
    final tEventId = '123';
    final tEvent = EventModel(
      id: tEventId,
      creatorUserId: 'user123',
      name: 'テストイベント',
      description: 'これはテストイベントの説明です',
      location: '東京都渋谷区',
      startsAt: DateTime.parse('2023-01-01T10:00:00.000Z'),
      endsAt: DateTime.parse('2023-01-01T12:00:00.000Z'),
      fee: 1000,
      createdAt: DateTime.now(),
    );
    
    test('should return cached data when cache is available', () async {
      // 準備
      when(() => mockLocalDataSource.getEventById(tEventId))
          .thenAnswer((_) async => tEvent);
      
      // 実行
      final result = await repository.getEventById(tEventId);
      
      // 検証
      verify(() => mockLocalDataSource.getEventById(tEventId)).called(1);
      verifyNever(() => mockRemoteDataSource.getEventById(any()));
      expect(result, Right(tEvent));
    });
    
    test('should fetch from remote when cache is not available', () async {
      // 準備
      when(() => mockLocalDataSource.getEventById(tEventId))
          .thenAnswer((_) async => null);
      when(() => mockRemoteDataSource.getEventById(tEventId, includeParticipantInfo: false))
          .thenAnswer((_) async => tEvent);
      when(() => mockLocalDataSource.cacheEvent(tEvent))
          .thenAnswer((_) async => true);
      
      // 実行
      final result = await repository.getEventById(tEventId);
      
      // 検証
      verify(() => mockLocalDataSource.getEventById(tEventId)).called(1);
      verify(() => mockRemoteDataSource.getEventById(tEventId, includeParticipantInfo: false)).called(1);
      verify(() => mockLocalDataSource.cacheEvent(tEvent)).called(1);
      expect(result, Right(tEvent));
    });
    
    test('should return ServerFailure when remote data source throws ServerException', () async {
      // 準備
      when(() => mockLocalDataSource.getEventById(tEventId))
          .thenAnswer((_) async => null);
      when(() => mockRemoteDataSource.getEventById(tEventId, includeParticipantInfo: false))
          .thenThrow(ServerException('サーバーエラー'));
      
      // 実行
      final result = await repository.getEventById(tEventId);
      
      // 検証
      verify(() => mockLocalDataSource.getEventById(tEventId)).called(1);
      verify(() => mockRemoteDataSource.getEventById(tEventId, includeParticipantInfo: false)).called(1);
      expect(result, Left(ServerFailure('サーバーエラー')));
    });
  });
}
```

### 11.3 ユースケーステスト例

```dart
class MockEventRepository extends Mock implements IEventRepository {}
class MockEventParticipantRepository extends Mock implements IEventParticipantRepository {}

void main() {
  late JoinEventUseCase useCase;
  late MockEventRepository mockEventRepository;
  late MockEventParticipantRepository mockParticipantRepository;
  
  setUp(() {
    mockEventRepository = MockEventRepository();
    mockParticipantRepository = MockEventParticipantRepository();
    useCase = JoinEventUseCase(
      eventRepository: mockEventRepository,
      participantRepository: mockParticipantRepository,
    );
  });
  
  final tEventId = '123';
  final tUserId = 'user123';
  final tFreeEvent = EventModel(
    id: tEventId,
    creatorUserId: 'creator123',
    name: 'テストイベント',
    description: 'これはテストイベントの説明です',
    location: '東京都渋谷区',
    startsAt: DateTime.parse('2023-01-01T10:00:00.000Z'),
    endsAt: DateTime.parse('2023-01-01T12:00:00.000Z'),
    fee: 0,
    createdAt: DateTime.now(),
  );
  
  final tPaidEvent = EventModel(
    id: tEventId,
    creatorUserId: 'creator123',
    name: 'テストイベント',
    description: 'これはテストイベントの説明です',
    location: '東京都渋谷区',
    startsAt: DateTime.parse('2023-01-01T10:00:00.000Z'),
    endsAt: DateTime.parse('2023-01-01T12:00:00.000Z'),
    fee: 1000,
    currency: 'JPY',
    createdAt: DateTime.now(),
  );
  
  final tParticipant = EventParticipantModel(
    id: 'participant123',
    eventId: tEventId,
    userId: tUserId,
    status: ParticipantStatus.going,
    paymentStatus: null,
    joinedAt: DateTime.now(),
  );
  
  final tPaidParticipant = EventParticipantModel(
    id: 'participant123',
    eventId: tEventId,
    userId: tUserId,
    status: ParticipantStatus.going,
    paymentStatus: PaymentStatus.pending,
    joinedAt: DateTime.now(),
  );
  
  test('should join free event successfully', () async {
    // 準備
    when(() => mockEventRepository.getEventById(tEventId))
        .thenAnswer((_) async => Right(tFreeEvent));
    when(() => mockParticipantRepository.joinEvent(
      tEventId, 
      tUserId, 
      ParticipantStatus.going
    )).thenAnswer((_) async => Right(tParticipant));
    
    // 実行
    final result = await useCase(
      eventId: tEventId,
      userId: tUserId,
      status: ParticipantStatus.going,
    );
    
    // 検証
    verify(() => mockEventRepository.getEventById(tEventId)).called(1);
    verify(() => mockParticipantRepository.joinEvent(
      tEventId, 
      tUserId, 
      ParticipantStatus.going
    )).called(1);
    expect(result, Right(tParticipant));
  });
  
  test('should handle paid event join process', () async {
    // 準備
    when(() => mockEventRepository.getEventById(tEventId))
        .thenAnswer((_) async => Right(tPaidEvent));
    when(() => mockParticipantRepository.joinEvent(
      tEventId, 
      tUserId, 
      ParticipantStatus.going
    )).thenAnswer((_) async => Right(tPaidParticipant));
    
    // 実行
    final result = await useCase(
      eventId: tEventId,
      userId: tUserId,
      status: ParticipantStatus.going,
    );
    
    // 検証
    verify(() => mockEventRepository.getEventById(tEventId)).called(1);
    verify(() => mockParticipantRepository.joinEvent(
      tEventId, 
      tUserId, 
      ParticipantStatus.going
    )).called(1);
    expect(result, Right(tPaidParticipant));
    expect((result as Right<Failure, EventParticipantEntity>).value.paymentStatus, PaymentStatus.pending);
  });
}
```

### 11.4 ビューモデルテスト例

```dart
class MockGetEventByIdUseCase extends Mock implements GetEventByIdUseCase {}
class MockGetEventParticipantsUseCase extends Mock implements GetEventParticipantsUseCase {}
class MockJoinEventUseCase extends Mock implements JoinEventUseCase {}
class MockCancelEventParticipationUseCase extends Mock implements CancelEventParticipationUseCase {}

void main() {
  late EventDetailViewModel viewModel;
  late MockGetEventByIdUseCase mockGetEventByIdUseCase;
  late MockGetEventParticipantsUseCase mockGetEventParticipantsUseCase;
  late MockJoinEventUseCase mockJoinEventUseCase;
  late MockCancelEventParticipationUseCase mockCancelEventParticipationUseCase;
  
  setUp(() {
    mockGetEventByIdUseCase = MockGetEventByIdUseCase();
    mockGetEventParticipantsUseCase = MockGetEventParticipantsUseCase();
    mockJoinEventUseCase = MockJoinEventUseCase();
    mockCancelEventParticipationUseCase = MockCancelEventParticipationUseCase();
    
    viewModel = EventDetailViewModel(
      getEventByIdUseCase: mockGetEventByIdUseCase,
      getEventParticipantsUseCase: mockGetEventParticipantsUseCase,
      joinEventUseCase: mockJoinEventUseCase,
      cancelEventParticipationUseCase: mockCancelEventParticipationUseCase,
      // 他の必要なモック
    );
  });
  
  group('loadEvent', () {
    final tEventId = '123';
    final tEvent = EventEntity(
      id: tEventId,
      creatorUserId: 'creator123',
      name: 'テストイベント',
      description: 'これはテストイベントの説明です',
      location: '東京都渋谷区',
      startsAt: DateTime.now().add(Duration(days: 1)),
      endsAt: DateTime.now().add(Duration(days: 1, hours: 2)),
      fee: 1000,
      currency: 'JPY',
      createdAt: DateTime.now(),
    );
    
    final tParticipants = [
      EventParticipantEntity(
        id: 'participant1',
        eventId: tEventId,
        userId: 'user1',
        status: ParticipantStatus.going,
        joinedAt: DateTime.now(),
      ),
      EventParticipantEntity(
        id: 'participant2',
        eventId: tEventId,
        userId: 'user2',
        status: ParticipantStatus.interested,
        joinedAt: DateTime.now(),
      ),
    ];
    
    test('should emit [Loading, Loaded] when successful', () async {
      // 準備
      when(() => mockGetEventByIdUseCase(tEventId, includeParticipantInfo: true))
          .thenAnswer((_) async => Right(tEvent));
      when(() => mockGetEventParticipantsUseCase(
        tEventId,
        status: ParticipantStatus.going,
        limit: 20,
      )).thenAnswer((_) async => Right(tParticipants));
      
      // 状態検証のセットアップ
      final states = <EventDetailState>[];
      viewModel.addListener(() {
        states.add(viewModel.state);
      });
      
      // 実行
      await viewModel.loadEvent(tEventId);
      
      // 検証
      expect(states, [
        EventDetailLoading(),
        EventDetailLoaded(tEvent, tParticipants),
      ]);
    });
    
    test('should emit [Loading, Error] when failed', () async {
      // 準備
      when(() => mockGetEventByIdUseCase(tEventId, includeParticipantInfo: true))
          .thenAnswer((_) async => Left(ServerFailure('イベント取得に失敗しました')));
      
      // 状態検証のセットアップ
      final states = <EventDetailState>[];
      viewModel.addListener(() {
        states.add(viewModel.state);
      });
      
      // 実行
      await viewModel.loadEvent(tEventId);
      
      // 検証
      expect(states, [
        EventDetailLoading(),
        EventDetailError('イベント取得に失敗しました'),
      ]);
    });
  });
  
  group('joinEvent', () {
    final tEventId = '123';
    final tUserId = 'user123';
    final tEvent = EventEntity(
      id: tEventId,
      creatorUserId: 'creator123',
      name: 'テストイベント',
      description: 'これはテストイベントの説明です',
      location: '東京都渋谷区',
      startsAt: DateTime.now().add(Duration(days: 1)),
      endsAt: DateTime.now().add(Duration(days: 1, hours: 2)),
      fee: 0,
      createdAt: DateTime.now(),
    );
    
    final tParticipant = EventParticipantEntity(
      id: 'participant123',
      eventId: tEventId,
      userId: tUserId,
      status: ParticipantStatus.going,
      joinedAt: DateTime.now(),
    );
    
    final tParticipants = [tParticipant];
    
    test('should emit [Processing, Loaded] when joining free event successfully', () async {
      // 準備
      viewModel.state = EventDetailLoaded(tEvent, []);
      
      when(() => mockJoinEventUseCase(
        eventId: tEventId,
        userId: tUserId,
        status: ParticipantStatus.going,
      )).thenAnswer((_) async => Right(tParticipant));
      
      when(() => mockGetEventByIdUseCase(tEventId, includeParticipantInfo: true))
          .thenAnswer((_) async => Right(tEvent));
          
      when(() => mockGetEventParticipantsUseCase(
        tEventId,
        status: ParticipantStatus.going,
        limit: 20,
      )).thenAnswer((_) async => Right(tParticipants));
      
      // 状態検証のセットアップ
      final states = <EventDetailState>[];
      viewModel.addListener(() {
        states.add(viewModel.state);
      });
      
      // 実行
      await viewModel.joinEvent(
        tEventId,
        tUserId,
        ParticipantStatus.going,
      );
      
      // 検証
      expect(states, [
        EventDetailProcessing(),
        EventDetailLoaded(tEvent, tParticipants, userParticipation: null),
      ]);
    });
  });
}
```

### 11.5 ウィジェットテスト例

```dart
void main() {
  testWidgets('EventCard displays event information correctly', (WidgetTester tester) async {
    // テスト用のイベントを作成
    final event = EventModel(
      id: '123',
      creatorUserId: 'user123',
      name: 'テストイベント',
      description: 'これはテストイベントの説明です',
      location: '東京都渋谷区',
      startsAt: DateTime.now().add(Duration(days: 1)),
      endsAt: DateTime.now().add(Duration(days: 1, hours: 2)),
      fee: 1000,
      currency: 'JPY',
      createdAt: DateTime.now(),
      participantCount: 15,
      interestedCount: 30,
    );
    
    // ウィジェットのレンダリング
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: EventCard(
            event: event,
            onTap: () {},
            onParticipate: () {},
            onInterested: () {},
          ),
        ),
      ),
    );
    
    // 期待する表示の検証
    expect(find.text('テストイベント'), findsOneWidget);
    expect(find.text('東京都渋谷区'), findsOneWidget);
    
    // 料金表示の検証
    expect(find.text('¥1,000'), findsOneWidget);
    
    // 参加者数の検証
    expect(find.text('15人参加予定'), findsOneWidget);
    
    // ボタンの存在検証
    expect(find.text('参加する'), findsOneWidget);
    expect(find.text('興味あり'), findsOneWidget);
  });
  
  testWidgets('EventCard participation button calls callback on tap', (WidgetTester tester) async {
    // テスト用のイベントを作成
    final event = EventModel(
      id: '123',
      creatorUserId: 'user123',
      name: 'テストイベント',
      description: 'これはテストイベントの説明です',
      location: '東京都渋谷区',
      startsAt: DateTime.now().add(Duration(days: 1)),
      endsAt: DateTime.now().add(Duration(days: 1, hours: 2)),
      fee: 1000,
      currency: 'JPY',
      createdAt: DateTime.now(),
    );
    
    // コールバック検証用の変数
    bool participateCalled = false;
    
    // ウィジェットのレンダリング
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: EventCard(
            event: event,
            onTap: () {},
            onParticipate: () {
              participateCalled = true;
            },
            onInterested: () {},
          ),
        ),
      ),
    );
    
    // 参加するボタンをタップ
    await tester.tap(find.text('参加する'));
    await tester.pump();
    
    // コールバックが呼ばれたことを検証
    expect(participateCalled, true);
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
   - エラー処理の適切な実装検証

3. **UI表示テスト**
   - すべてのウィジェットが各種デバイスサイズで適切に表示されること
   - アクセシビリティテストが基準を満たすこと

4. **パフォーマンステスト**
   - イベント一覧表示: 300ms以内
   - 大規模イベントの参加者リスト表示: 500ms以内の初期表示
   - 決済処理: 5秒以内の完了
   - オフラインモードでの応答性: 200ms以内の表示

5. **エラーハンドリング**
   - すべてのエラーケースが適切に処理され、ユーザーに分かりやすく表示されること
   - ネットワークエラーからの回復機能の確認

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