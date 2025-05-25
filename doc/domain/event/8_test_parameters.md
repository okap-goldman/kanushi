# イベントドメインテストパラメータ一覧

このドキュメントではイベントドメインの各コンポーネントに対するテストパラメータと期待される結果のペアを提供します。テストの網羅性を確保するため、様々なケースを含めています。

## 1. モデルテストパラメータ

### 1.1 EventModel

#### fromJson テスト

| パラメータ | 値 | 期待される結果 |
|----------|-----|--------------|
| 標準的なイベント情報 | `{'id': '123', 'creator_user_id': 'user123', 'name': 'テストイベント', 'description': '説明', 'location': '東京', 'starts_at': '2023-01-01T10:00:00Z', 'ends_at': '2023-01-01T12:00:00Z', 'fee': 1000, 'currency': 'JPY', 'created_at': '2022-12-01T00:00:00Z', 'participant_count': 10, 'interested_count': 5}` | id='123', creatorUserId='user123', name='テストイベント', fee=1000, currency='JPY', participantCount=10 |
| 無料イベント | `{'id': '123', 'creator_user_id': 'user123', 'name': 'テストイベント', 'description': '説明', 'location': '東京', 'starts_at': '2023-01-01T10:00:00Z', 'ends_at': '2023-01-01T12:00:00Z', 'fee': 0, 'created_at': '2022-12-01T00:00:00Z'}` | id='123', fee=0, isFreeEvent=true |
| feeがnull | `{'id': '123', 'creator_user_id': 'user123', 'name': 'テストイベント', 'description': '説明', 'location': '東京', 'starts_at': '2023-01-01T10:00:00Z', 'ends_at': '2023-01-01T12:00:00Z', 'fee': null, 'created_at': '2022-12-01T00:00:00Z'}` | id='123', fee=null, isFreeEvent=true |
| 特殊文字含む | `{'id': '123', 'creator_user_id': 'user123', 'name': 'テスト\nイベント&<>"\'', 'description': '特殊文字：!@#$%^&*()', 'location': '東京都🗼', 'starts_at': '2023-01-01T10:00:00Z', 'ends_at': '2023-01-01T12:00:00Z', 'fee': 1000, 'created_at': '2022-12-01T00:00:00Z'}` | name='テスト\nイベント&<>"\'', location='東京都🗼' |
| 長いテキスト | `{'id': '123', 'creator_user_id': 'user123', 'name': 'x' * 100, 'description': 'y' * 1000, 'location': '東京', 'starts_at': '2023-01-01T10:00:00Z', 'ends_at': '2023-01-01T12:00:00Z', 'fee': 1000, 'created_at': '2022-12-01T00:00:00Z'}` | name='x' * 100, description='y' * 1000 |

#### toJson テスト

| パラメータ | 値 | 期待される結果 |
|----------|-----|--------------|
| 標準的なイベント情報 | id='123', creatorUserId='user123', name='テストイベント', description='説明', location='東京', startsAt=DateTime(2023,1,1,10), endsAt=DateTime(2023,1,1,12), fee=1000, currency='JPY', createdAt=DateTime(2022,12,1) | `{'id': '123', 'creator_user_id': 'user123', 'name': 'テストイベント', 'description': '説明', 'location': '東京', 'starts_at': '2023-01-01T10:00:00.000Z', 'ends_at': '2023-01-01T12:00:00.000Z', 'fee': 1000, 'currency': 'JPY', 'created_at': '2022-12-01T00:00:00.000Z'}` |
| 無料イベント | id='123', creatorUserId='user123', name='テストイベント', fee=0 | JSONに `'fee': 0` が含まれること |
| feeがnull | id='123', creatorUserId='user123', name='テストイベント', fee=null | JSONに `'fee': null` が含まれるか、feeキーが存在しないこと |

#### ゲッターメソッドテスト

| パラメータ | 値 | 期待される結果 |
|----------|-----|--------------|
| isFreeEvent - 無料 | fee=0 | true |
| isFreeEvent - 無料(null) | fee=null | true |
| isFreeEvent - 有料 | fee=1000 | false |
| hasStarted - 開始前 | startsAt=未来の日時 | false |
| hasStarted - 開始後 | startsAt=過去の日時 | true |
| hasEnded - 終了前 | endsAt=未来の日時 | false |
| hasEnded - 終了後 | endsAt=過去の日時 | true |
| isUpcoming - 開始前 | startsAt=未来の日時, endsAt=未来の日時 | true |
| isUpcoming - 開始後 | startsAt=過去の日時, endsAt=未来の日時 | false |
| isUpcoming - 終了後 | startsAt=過去の日時, endsAt=過去の日時 | false |
| formattedFee - 無料 | fee=0, currency=null | '無料' |
| formattedFee - 有料 | fee=1000, currency='JPY' | '1000 JPY' |

### 1.2 EventParticipantModel

#### fromJson テスト

| パラメータ | 値 | 期待される結果 |
|----------|-----|--------------|
| 標準的な参加情報 | `{'id': '123', 'event_id': 'event123', 'user_id': 'user123', 'status': 'going', 'payment_status': 'paid', 'joined_at': '2022-12-01T00:00:00Z'}` | id='123', eventId='event123', userId='user123', status=ParticipantStatus.going, paymentStatus=PaymentStatus.paid |
| 興味あり状態 | `{'id': '123', 'event_id': 'event123', 'user_id': 'user123', 'status': 'interested', 'payment_status': null, 'joined_at': '2022-12-01T00:00:00Z'}` | status=ParticipantStatus.interested, paymentStatus=null |
| ユーザー情報あり | `{'id': '123', 'event_id': 'event123', 'user_id': 'user123', 'status': 'going', 'joined_at': '2022-12-01T00:00:00Z', 'user': {'id': 'user123', 'display_name': 'テストユーザー', 'profile_image_url': 'https://example.com/avatar.png'}}` | user.displayName='テストユーザー' |

#### toJson テスト

| パラメータ | 値 | 期待される結果 |
|----------|-----|--------------|
| 標準的な参加情報 | id='123', eventId='event123', userId='user123', status=ParticipantStatus.going, paymentStatus=PaymentStatus.paid, joinedAt=DateTime(2022,12,1) | `{'id': '123', 'event_id': 'event123', 'user_id': 'user123', 'status': 'going', 'payment_status': 'paid', 'joined_at': '2022-12-01T00:00:00.000Z'}` |
| 興味あり状態 | status=ParticipantStatus.interested, paymentStatus=null | JSONに `'status': 'interested'` が含まれ、`payment_status` が null または存在しないこと |
| ユーザー情報あり | user=UserModel(id: 'user123', displayName: 'テストユーザー') | JSONに `'user'` オブジェクトが含まれること |

### 1.3 EventCoHostModel

#### fromJson テスト

| パラメータ | 値 | 期待される結果 |
|----------|-----|--------------|
| 標準的な共同ホスト情報 | `{'id': '123', 'event_id': 'event123', 'user_id': 'user123', 'added_at': '2022-12-01T00:00:00Z'}` | id='123', eventId='event123', userId='user123', addedAt=DateTime(2022,12,1) |
| ユーザー情報あり | `{'id': '123', 'event_id': 'event123', 'user_id': 'user123', 'added_at': '2022-12-01T00:00:00Z', 'user': {'id': 'user123', 'display_name': 'テストユーザー'}}` | user.displayName='テストユーザー' |

### 1.4 EventPaymentModel

#### fromJson テスト

| パラメータ | 値 | 期待される結果 |
|----------|-----|--------------|
| 標準的な支払い情報 | `{'id': '123', 'participant_id': 'part123', 'event_id': 'event123', 'user_id': 'user123', 'amount': 1000, 'currency': 'JPY', 'fee_amount': 70, 'status': 'completed', 'payment_intent_id': 'pi_123', 'created_at': '2022-12-01T00:00:00Z'}` | id='123', participantId='part123', amount=1000.0, feeAmount=70.0, status=PaymentStatus.completed |
| 保留中の支払い | `{'id': '123', 'participant_id': 'part123', 'event_id': 'event123', 'user_id': 'user123', 'amount': 1000, 'currency': 'JPY', 'fee_amount': 70, 'status': 'pending', 'payment_intent_id': 'pi_123', 'created_at': '2022-12-01T00:00:00Z'}` | status=PaymentStatus.pending |
| 返金済みの支払い | `{'id': '123', 'participant_id': 'part123', 'event_id': 'event123', 'user_id': 'user123', 'amount': 1000, 'currency': 'JPY', 'fee_amount': 70, 'status': 'refunded', 'payment_intent_id': 'pi_123', 'created_at': '2022-12-01T00:00:00Z', 'updated_at': '2022-12-02T00:00:00Z'}` | status=PaymentStatus.refunded, updatedAt != null |
| メタデータあり | `{'id': '123', 'participant_id': 'part123', 'event_id': 'event123', 'user_id': 'user123', 'amount': 1000, 'currency': 'JPY', 'fee_amount': 70, 'status': 'completed', 'payment_intent_id': 'pi_123', 'metadata': {'receipt_url': 'https://example.com/receipt', 'card_last4': '4242'}, 'created_at': '2022-12-01T00:00:00Z'}` | metadata['receipt_url'] = 'https://example.com/receipt' |

## 2. リポジトリテストパラメータ

### 2.1 EventRepository

#### getEvents テスト

| パラメータ | 値 | モックの振る舞い | 期待される結果 |
|----------|-----|--------------|--------------|
| キャッシュヒット | afterDate=null, limit=10 | localDataSource.getEvents()が非空配列を返す | 正常に結果を返し、remoteDataSourceは呼ばれない |
| キャッシュミス、リモート成功 | afterDate=null, limit=10 | localDataSource.getEvents()がnull、remoteDataSource.getEvents()が成功 | 正常に結果を返し、cacheEventsが呼ばれる |
| 日付フィルター | afterDate=2023-01-01, limit=10 | remoteDataSource.getEvents()が日付でフィルターされた結果を返す | 日付でフィルターされた結果を返す |
| ユーザーフィルター | creatorUserId='user123', limit=10 | remoteDataSource.getEvents()がユーザーでフィルターされた結果を返す | ユーザーでフィルターされた結果を返す |
| 参加者情報含む | includeParticipantInfo=true, limit=10 | remoteDataSource.getEvents()が参加者情報を含む結果を返す | 参加者情報を含む結果を返す |
| ネットワークエラー | limit=10 | localDataSource.getEvents()がnull、remoteDataSource.getEvents()がServerExceptionをスロー | Left(ServerFailure) |
| オフライン状態 | limit=10 | _isOffline()がtrueを返す | ローカルデータソースからの結果を返す |

#### getEventById テスト

| パラメータ | 値 | モックの振る舞い | 期待される結果 |
|----------|-----|--------------|--------------|
| キャッシュヒット | eventId='123' | localDataSource.getEventById()が非nullを返す | 正常に結果を返し、remoteDataSourceは呼ばれない |
| キャッシュミス、リモート成功 | eventId='123' | localDataSource.getEventById()がnull、remoteDataSource.getEventById()が成功 | 正常に結果を返し、cacheEventが呼ばれる |
| 存在しないID | eventId='999' | localDataSource.getEventById()がnull、remoteDataSource.getEventById()がServerExceptionをスロー | Left(ServerFailure) |
| ネットワークエラー | eventId='123' | localDataSource.getEventById()がnull、remoteDataSource.getEventById()がNetworkExceptionをスロー | Left(ServerFailure) |
| オフライン状態でキャッシュあり | eventId='123' | _isOffline()がtrue、localDataSource.getEventById()が非nullを返す | 正常に結果を返す |
| オフライン状態でキャッシュなし | eventId='123' | _isOffline()がtrue、localDataSource.getEventById()がnullを返す | Left(CacheFailure) |

#### createEvent テスト

| パラメータ | 値 | モックの振る舞い | 期待される結果 |
|----------|-----|--------------|--------------|
| 正常作成 | 有効なEventModelオブジェクト | remoteDataSource.createEvent()が成功 | 正常に結果を返し、cacheEventが呼ばれる |
| サーバーエラー | 有効なEventModelオブジェクト | remoteDataSource.createEvent()がServerExceptionをスロー | Left(ServerFailure) |
| ネットワークエラー | 有効なEventModelオブジェクト | remoteDataSource.createEvent()がNetworkExceptionをスロー | Left(ServerFailure) |

#### updateEvent テスト

| パラメータ | 値 | モックの振る舞い | 期待される結果 |
|----------|-----|--------------|--------------|
| 正常更新 | 有効なEventModelオブジェクト | remoteDataSource.updateEvent()が成功 | 正常に結果を返し、cacheEventが呼ばれる |
| サーバーエラー | 有効なEventModelオブジェクト | remoteDataSource.updateEvent()がServerExceptionをスロー | Left(ServerFailure) |
| 権限エラー | 有効なEventModelオブジェクト | remoteDataSource.updateEvent()が権限エラーをスロー | Left(ServerFailure) |

#### deleteEvent テスト

| パラメータ | 値 | モックの振る舞い | 期待される結果 |
|----------|-----|--------------|--------------|
| 正常削除 | eventId='123' | remoteDataSource.deleteEvent()がtrueを返す | Right(true)を返し、deleteEventがローカルで呼ばれる |
| 削除失敗 | eventId='123' | remoteDataSource.deleteEvent()がfalseを返す | Right(false)を返す |
| サーバーエラー | eventId='123' | remoteDataSource.deleteEvent()がServerExceptionをスロー | Left(ServerFailure) |

### 2.2 EventParticipantRepository

#### getEventParticipants テスト

| パラメータ | 値 | モックの振る舞い | 期待される結果 |
|----------|-----|--------------|--------------|
| キャッシュヒット | eventId='123', status=null, limit=100 | localDataSource.getEventParticipants()が非空配列を返す | 正常に結果を返し、remoteDataSourceは呼ばれない |
| キャッシュミス、リモート成功 | eventId='123', status=null, limit=100 | localDataSource.getEventParticipants()が空配列、remoteDataSource.getEventParticipants()が成功 | 正常に結果を返し、cacheEventParticipantsが呼ばれる |
| ステータスフィルター | eventId='123', status=ParticipantStatus.going | remoteDataSource.getEventParticipants()がステータスでフィルターされた結果を返す | ステータスでフィルターされた結果を返す |
| リミット指定 | eventId='123', limit=10 | remoteDataSource.getEventParticipants()がリミットされた結果を返す | リミットされた結果を返す |
| ネットワークエラー | eventId='123' | localDataSource.getEventParticipants()が空配列、remoteDataSource.getEventParticipants()がNetworkExceptionをスロー | Left(ServerFailure) |

#### joinEvent テスト

| パラメータ | 値 | モックの振る舞い | 期待される結果 |
|----------|-----|--------------|--------------|
| 参加登録成功 | eventId='123', userId='user123', status=ParticipantStatus.going | remoteDataSource.joinEvent()が成功 | 正常に結果を返し、cacheEventParticipantが呼ばれる |
| 興味あり登録 | eventId='123', userId='user123', status=ParticipantStatus.interested | remoteDataSource.joinEvent()が成功 | 正常に結果を返す |
| 既に参加済み | eventId='123', userId='user123', status=ParticipantStatus.going | remoteDataSource.joinEvent()がServerExceptionをスロー | Left(ServerFailure) |

#### cancelParticipation テスト

| パラメータ | 値 | モックの振る舞い | 期待される結果 |
|----------|-----|--------------|--------------|
| キャンセル成功 | participantId='123' | remoteDataSource.cancelParticipation()がtrueを返す | Right(true)を返し、deleteEventParticipantがローカルで呼ばれる |
| キャンセル失敗 | participantId='123' | remoteDataSource.cancelParticipation()がfalseを返す | Right(false)を返す |
| サーバーエラー | participantId='123' | remoteDataSource.cancelParticipation()がServerExceptionをスロー | Left(ServerFailure) |

### 2.3 EventPaymentRepository

#### createEventPaymentIntent テスト

| パラメータ | 値 | モックの振る舞い | 期待される結果 |
|----------|-----|--------------|--------------|
| 決済意図作成成功 | participantId='123', amount=1000, currency='JPY' | remoteDataSource.createEventPaymentIntent()がclientSecretを返す | 正常にclientSecretを返す |
| サーバーエラー | participantId='123', amount=1000, currency='JPY' | remoteDataSource.createEventPaymentIntent()がServerExceptionをスロー | Left(ServerFailure) |
| 無効な金額 | participantId='123', amount=-100, currency='JPY' | remoteDataSource.createEventPaymentIntent()がServerExceptionをスロー | Left(ServerFailure) |

#### processRefund テスト

| パラメータ | 値 | モックの振る舞い | 期待される結果 |
|----------|-----|--------------|--------------|
| 返金処理成功 | paymentId='123', reason='日程変更' | remoteDataSource.processRefund()がtrueを返す | Right(true)を返す |
| 返金処理失敗 | paymentId='123', reason=null | remoteDataSource.processRefund()がfalseを返す | Right(false)を返す |
| 期限切れ | paymentId='123', reason='日程変更' | remoteDataSource.processRefund()がServerExceptionをスロー | Left(ServerFailure) |

## 3. ユースケーステストパラメータ

### 3.1 GetEventsUseCase

| パラメータ | 値 | モックの振る舞い | 期待される結果 |
|----------|-----|--------------|--------------|
| 標準的な取得 | afterDate=null, limit=20 | repository.getEvents()が成功 | 正常に結果を返す |
| 日付フィルター | afterDate=2023-01-01 | repository.getEvents()が日付でフィルターされた結果を返す | 日付でフィルターされた結果を返す |
| ユーザーフィルター | creatorUserId='user123' | repository.getEvents()がユーザーでフィルターされた結果を返す | ユーザーでフィルターされた結果を返す |
| リポジトリエラー | limit=20 | repository.getEvents()がLeft(Failure)を返す | Left(Failure)を返す |

### 3.2 JoinEventUseCase

| パラメータ | 値 | モックの振る舞い | 期待される結果 |
|----------|-----|--------------|--------------|
| 無料イベント参加 | eventId='123', userId='user123', status=ParticipantStatus.going | eventRepository.getEventById()が無料イベントを返す、participantRepository.joinEvent()が成功 | 正常に結果を返す |
| 有料イベント参加 | eventId='123', userId='user123', status=ParticipantStatus.going | eventRepository.getEventById()が有料イベントを返す、participantRepository.joinEvent()がpaymentStatusがpendingの結果を返す | paymentStatusがpendingの結果を返す |
| 興味あり登録 | eventId='123', userId='user123', status=ParticipantStatus.interested | eventRepository.getEventById()が成功、participantRepository.joinEvent()が成功 | 正常に結果を返す |
| イベント取得エラー | eventId='999', userId='user123', status=ParticipantStatus.going | eventRepository.getEventById()がLeft(Failure)を返す | Left(Failure)を返す |
| 参加登録エラー | eventId='123', userId='user123', status=ParticipantStatus.going | eventRepository.getEventById()が成功、participantRepository.joinEvent()がLeft(Failure)を返す | Left(Failure)を返す |

### 3.3 CreateEventPaymentUseCase

| パラメータ | 値 | モックの振る舞い | 期待される結果 |
|----------|-----|--------------|--------------|
| 有料イベント決済 | participantId='123', eventId='123' | eventRepository.getEventById()が有料イベントを返す、paymentRepository.createEventPaymentIntent()が成功 | 正常にclientSecretを返す |
| 無料イベント決済 | participantId='123', eventId='123' | eventRepository.getEventById()が無料イベントを返す | Left(BusinessLogicFailure)を返す |
| イベント取得エラー | participantId='123', eventId='999' | eventRepository.getEventById()がLeft(Failure)を返す | Left(Failure)を返す |
| 決済作成エラー | participantId='123', eventId='123' | eventRepository.getEventById()が有料イベントを返す、paymentRepository.createEventPaymentIntent()がLeft(Failure)を返す | Left(Failure)を返す |

### 3.4 CancelEventParticipationUseCase

| パラメータ | 値 | モックの振る舞い | 期待される結果 |
|----------|-----|--------------|--------------|
| キャンセル成功 | participantId='123' | repository.cancelParticipation()がRight(true)を返す | Right(true)を返す |
| キャンセル失敗 | participantId='123' | repository.cancelParticipation()がRight(false)を返す | Right(false)を返す |
| リポジトリエラー | participantId='123' | repository.cancelParticipation()がLeft(Failure)を返す | Left(Failure)を返す |

## 4. ビューモデルテストパラメータ

### 4.1 EventListViewModel

#### loadEvents テスト

| パラメータ | 値 | モックの振る舞い | 初期状態 | 期待される状態遷移 |
|----------|-----|--------------|---------|-----------------|
| 初回読み込み | afterDate=null, isRefresh=false | getEventsUseCase()が成功 | EventListInitial | EventListInitial → EventListLoading → EventListLoaded |
| リフレッシュ | afterDate=null, isRefresh=true | getEventsUseCase()が成功 | EventListLoaded | EventListLoaded → EventListLoading → EventListLoaded |
| もっと読み込み | afterDate=null, isRefresh=false | getEventsUseCase()が成功 | EventListLoaded | EventListLoaded → EventListLoadingMore → EventListLoaded |
| エラー発生 | afterDate=null, isRefresh=false | getEventsUseCase()がLeft(Failure)を返す | EventListInitial | EventListInitial → EventListLoading → EventListError |
| 日付フィルター | afterDate=2023-01-01, isRefresh=true | getEventsUseCase()が日付でフィルターされた結果を返す | EventListLoaded | EventListLoaded → EventListLoading → EventListLoaded |

### 4.2 EventDetailViewModel

#### loadEvent テスト

| パラメータ | 値 | モックの振る舞い | 初期状態 | 期待される状態遷移 |
|----------|-----|--------------|---------|-----------------|
| 正常読み込み | eventId='123' | getEventByIdUseCase()が成功、getEventParticipantsUseCase()が成功 | EventDetailInitial | EventDetailInitial → EventDetailLoading → EventDetailLoaded |
| イベント取得エラー | eventId='999' | getEventByIdUseCase()がLeft(Failure)を返す | EventDetailInitial | EventDetailInitial → EventDetailLoading → EventDetailError |
| 参加者取得エラー | eventId='123' | getEventByIdUseCase()が成功、getEventParticipantsUseCase()がLeft(Failure)を返す | EventDetailInitial | EventDetailInitial → EventDetailLoading → EventDetailError |

#### joinEvent テスト

| パラメータ | 値 | モックの振る舞い | 初期状態 | 期待される状態遷移 |
|----------|-----|--------------|---------|-----------------|
| 無料イベント参加 | eventId='123', userId='user123', status=ParticipantStatus.going | joinEventUseCase()が無料イベント参加成功を返す、loadEvent()が成功 | EventDetailLoaded(無料イベント) | EventDetailLoaded → EventDetailProcessing → EventDetailLoaded |
| 有料イベント参加 | eventId='123', userId='user123', status=ParticipantStatus.going | joinEventUseCase()が有料イベント参加成功を返す、loadEvent()が成功、createEventPaymentUseCase()が成功 | EventDetailLoaded(有料イベント) | EventDetailLoaded → EventDetailProcessing → EventDetailLoaded → EventDetailPaymentReady |
| 参加エラー | eventId='123', userId='user123', status=ParticipantStatus.going | joinEventUseCase()がLeft(Failure)を返す | EventDetailLoaded | EventDetailLoaded → EventDetailProcessing → EventDetailError |
| 決済準備エラー | eventId='123', userId='user123', status=ParticipantStatus.going | joinEventUseCase()が成功、loadEvent()が成功、createEventPaymentUseCase()がLeft(Failure)を返す | EventDetailLoaded(有料イベント) | EventDetailLoaded → EventDetailProcessing → EventDetailLoaded → EventDetailError |

#### cancelParticipation テスト

| パラメータ | 値 | モックの振る舞い | 初期状態 | 期待される状態遷移 |
|----------|-----|--------------|---------|-----------------|
| キャンセル成功 | participantId='123' | cancelEventParticipationUseCase()がRight(true)を返す、loadEvent()が成功 | EventDetailLoaded | EventDetailLoaded → EventDetailProcessing → EventDetailLoaded |
| キャンセル失敗 | participantId='123' | cancelEventParticipationUseCase()がRight(false)を返す | EventDetailLoaded | EventDetailLoaded → EventDetailProcessing → EventDetailError |
| キャンセルエラー | participantId='123' | cancelEventParticipationUseCase()がLeft(Failure)を返す | EventDetailLoaded | EventDetailLoaded → EventDetailProcessing → EventDetailError |

## 5. UIテストパラメータ

### 5.1 EventCard ウィジェットテスト

| テストケース | 入力パラメータ | 検証項目 |
|------------|--------------|---------|
| イベント情報表示 | event={id: '123', name: 'テストイベント', location: '東京', startsAt: 明日, fee: 1000, currency: 'JPY', participantCount: 15} | - 'テストイベント'テキストが表示される<br>- '東京'テキストが表示される<br>- '¥1,000'テキストが表示される<br>- '15人参加予定'テキストが表示される |
| 無料イベント表示 | event={id: '123', name: 'テストイベント', fee: 0} | - '無料'テキストが表示される |
| 終了済みイベント表示 | event={id: '123', name: 'テストイベント', startsAt: 昨日, endsAt: 昨日} | - '終了'または類似のステータス表示がある |
| 参加ボタン操作 | event={id: '123', name: 'テストイベント'}, onParticipate=モック関数 | - '参加する'ボタンをタップするとonParticipateが呼ばれる |
| 興味ありボタン操作 | event={id: '123', name: 'テストイベント'}, onInterested=モック関数 | - '興味あり'ボタンをタップするとonInterestedが呼ばれる |

### 5.2 EventDetailScreen 画面テスト

| テストケース | 初期状態・入力 | 検証項目 |
|------------|--------------|---------|
| イベント詳細表示 | viewModel.state = EventDetailLoaded(有効なイベント, 参加者リスト) | - イベント名が表示される<br>- 説明文が表示される<br>- 日時が表示される<br>- 場所が表示される<br>- 料金が表示される |
| 参加者一覧表示 | viewModel.state = EventDetailLoaded(有効なイベント, 複数人の参加者リスト) | - 参加者アバターが表示される<br>- 参加者数が正しく表示される |
| 参加ボタン表示 | viewModel.state = EventDetailLoaded(有効なイベント, 参加者リスト, userParticipation=null) | - '参加する'ボタンが表示される<br>- '興味あり'ボタンが表示される |
| 参加中表示 | viewModel.state = EventDetailLoaded(有効なイベント, 参加者リスト, userParticipation=going) | - '参加中'表示がある<br>- 'キャンセル'ボタンが表示される |
| 参加操作 | 未参加状態、'参加する'ボタンをタップ | - viewModel.joinEvent()が呼ばれる<br>- ローディング表示が表示される |
| キャンセル操作 | 参加中状態、'キャンセル'ボタンをタップ | - viewModel.cancelParticipation()が呼ばれる<br>- ローディング表示が表示される |
| 主催者メニュー表示 | viewModel.state = EventDetailLoaded(currentUserのイベント, 参加者リスト) | - 編集ボタンが表示される<br>- 削除ボタンが表示される |
| エラー表示 | viewModel.state = EventDetailError('エラーメッセージ') | - エラーメッセージが表示される<br>- 再試行ボタンが表示される |

### 5.3 EventCreationScreen 画面テスト

| テストケース | 入力・操作 | 検証項目 |
|------------|----------|---------|
| フォーム表示 | 初期表示 | - イベント名入力欄が表示される<br>- 説明入力欄が表示される<br>- 場所入力欄が表示される<br>- 日時選択欄が表示される<br>- 料金設定欄が表示される |
| 必須項目バリデーション | イベント名を空欄で送信 | - エラーメッセージが表示される<br>- フォームは送信されない |
| 日付バリデーション | 開始日時 > 終了日時で設定 | - エラーメッセージが表示される<br>- フォームは送信されない |
| 有料イベント設定 | 料金を1000、通貨をJPYに設定 | - 料金と通貨が正しく表示される<br>- 返金ポリシー入力欄が表示される |
| イベント作成成功 | 有効な情報を入力して送信 | - ローディング表示が表示される<br>- 成功時に完了画面またはイベント詳細画面に遷移する |
| イベント作成エラー | 有効な情報を入力、viewModel.createEvent()がエラーを返す | - エラーメッセージが表示される<br>- 再試行オプションが提供される |

## 6. 統合テストパラメータ

### 6.1 イベント作成から参加までのフロー

| ステップ | 入力・操作 | 検証項目 |
|---------|----------|---------|
| 1. イベント作成画面表示 | EventCreationScreenを開く | - フォームが表示される |
| 2. イベント情報入力 | 有効なイベント情報を入力 | - 全フィールドが正しく入力される |
| 3. イベント作成 | '作成'ボタンをタップ | - APIリクエストが送信される<br>- 成功時にイベント詳細画面に遷移する |
| 4. イベント一覧確認 | イベント一覧画面に移動 | - 作成したイベントが一覧に表示される |
| 5. イベント詳細表示 | 作成したイベントをタップ | - 詳細画面に正しい情報が表示される |
| 6. イベント参加 | '参加する'ボタンをタップ | - APIリクエストが送信される<br>- 参加状態に更新される |
| 7. 参加者一覧確認 | '参加者'セクションを表示 | - 自分が参加者として表示される |

### 6.2 有料イベント参加と決済フロー

| ステップ | 入力・操作 | 検証項目 |
|---------|----------|---------|
| 1. 有料イベント詳細表示 | 有料イベントの詳細画面を開く | - 料金情報が表示される |
| 2. 参加ボタンタップ | '参加する'ボタンをタップ | - 参加登録APIリクエストが送信される<br>- 決済画面に遷移する |
| 3. 決済情報表示 | 決済画面の表示 | - 正しい金額が表示される<br>- 決済方法選択が表示される |
| 4. 決済情報入力 | 有効なカード情報を入力 | - 入力フィールドが正しく機能する |
| 5. 決済実行 | '支払う'ボタンをタップ | - 決済APIリクエストが送信される<br>- ローディング表示が表示される |
| 6. 決済完了 | 決済成功処理 | - 完了画面が表示される<br>- イベント詳細画面に戻ると参加状態が更新されている |
| 7. 参加キャンセル | 'キャンセル'ボタンをタップ | - キャンセルAPIリクエストが送信される<br>- 返金確認が表示される |
| 8. 返金処理 | 返金リクエスト送信 | - 返金APIリクエストが送信される<br>- 処理完了後に参加状態が更新される |

## 7. エラーケーステストパラメータ

### 7.1 ネットワークエラー

| テストケース | 条件設定 | 期待される結果 |
|------------|---------|--------------|
| 完全なオフライン | インターネット接続がない | - キャッシュがある場合は表示される<br>- オフライン通知が表示される<br>- オンラインになったときに自動更新される |
| イベント取得タイムアウト | イベント取得APIが時間内に応答しない | - タイムアウトエラーが表示される<br>- 再試行オプションが提供される |
| 参加登録中の接続切断 | 参加APIリクエスト送信中に接続が切断される | - エラーが表示される<br>- 再試行オプションが提供される<br>- 部分的に処理された場合は状態がロールバックされる |
| 決済処理中の接続切断 | 決済処理中に接続が切断される | - エラーが表示される<br>- 決済状態の確認オプションが提供される<br>- 別の支払い方法の選択オプションが提供される |

### 7.2 バリデーションエラー

| テストケース | 入力データ | 期待される結果 |
|------------|----------|--------------|
| 無効な日時設定 | 開始日時が終了日時より後 | - 明確なエラーメッセージが表示される<br>- フォームは送信されない |
| 過去の日時設定 | 開始日時が現在より前 | - 明確なエラーメッセージが表示される<br>- フォームは送信されない |
| 長すぎるイベント名 | 100文字を超えるイベント名 | - 文字数制限のエラーメッセージが表示される<br>- 入力が制限または切り詰められる |
| 無効な料金設定 | 負の数や非常に大きな数値 | - 明確なエラーメッセージが表示される<br>- 有効な範囲が示される |
| 必須フィールド未入力 | イベント名や開始日時を空欄 | - 必須フィールドのエラーメッセージが表示される<br>- 不足しているフィールドが強調表示される |

## 8. パフォーマンステストパラメータ

### 8.1 イベント一覧表示パフォーマンス

| テストケース | 設定 | 測定項目 | 合格基準 |
|------------|-----|---------|---------|
| 初期読み込み速度 | 20件のイベント | 表示完了までの時間 | 300ms以内 |
| 大量データ表示 | 100件以上のイベント | 表示完了までの時間 | 1秒以内 |
| スクロール性能 | 100件以上のイベント | スクロール中のフレームレート | 60fps以上 |
| フィルター適用速度 | 100件以上のデータに対するフィルター | フィルター適用から表示までの時間 | 500ms以内 |
| メモリ使用量 | 100件以上のイベント | 消費メモリ | 過度なメモリリークがないこと |

### 8.2 参加者リスト表示パフォーマンス

| テストケース | 設定 | 測定項目 | 合格基準 |
|------------|-----|---------|---------|
| 中規模イベント | 100人の参加者 | 表示完了までの時間 | 500ms以内 |
| 大規模イベント | 1000人以上の参加者 | 初期表示時間（最初の20人） | 500ms以内 |
| 大規模イベント | 1000人以上の参加者 | スクロール中のフレームレート | 60fps以上 |
| 参加者検索 | 1000人以上の参加者から検索 | 検索結果表示までの時間 | 300ms以内 |

### 8.3 決済処理パフォーマンス

| テストケース | 設定 | 測定項目 | 合格基準 |
|------------|-----|---------|---------|
| 決済意図作成 | 標準的な決済 | 決済画面表示までの時間 | 2秒以内 |
| カード処理 | 有効なカード情報入力 | 処理完了までの時間 | 5秒以内 |
| 決済確認 | 決済完了後の確認 | 確認完了までの時間 | 3秒以内 |
| 複数同時処理 | 10人が同時に決済処理 | 全処理の成功率 | 99%以上 |

## 9. 互換性テストパラメータ

### 9.1 デバイス互換性

| テストケース | デバイス・OSバージョン | テスト内容 | 合格基準 |
|------------|-------------------|---------|---------|
| iOSでの動作 | iPhone最新機種、最新iOS | 基本操作フロー | すべての機能が正常に動作する |
| iOSでの動作 | iPhone旧機種、iOS 13 | 基本操作フロー | すべての主要機能が正常に動作する |
| Androidでの動作 | 高性能Androidデバイス、最新Android | 基本操作フロー | すべての機能が正常に動作する |
| Androidでの動作 | 低性能Androidデバイス、Android 9 | 基本操作フロー | すべての主要機能が正常に動作する |
| タブレット表示 | iPad Pro、最新iPadOS | レイアウト確認 | レイアウトが適切に表示される |

### 9.2 ネットワーク互換性

| テストケース | ネットワーク条件 | テスト内容 | 合格基準 |
|------------|--------------|---------|---------|
| 高速接続 | Wi-Fi (50Mbps以上) | 全機能操作 | すべての機能がスムーズに動作する |
| 中速接続 | 4G (10Mbps程度) | 全機能操作 | すべての機能が許容可能な速度で動作する |
| 低速接続 | 3G (1-2Mbps) | 基本機能操作 | 基本機能が動作し、適切なローディング表示がある |
| 不安定接続 | パケットロス30%の接続 | 基本機能操作 | エラー処理が適切に機能し、再試行メカニズムが動作する |

## 10. セキュリティテストパラメータ

### 10.1 認証・認可テスト

| テストケース | 設定 | テスト内容 | 期待される結果 |
|------------|-----|---------|--------------|
| 非認証ユーザーアクセス | ログインしていない状態 | イベント詳細表示 | 閲覧は可能だが、参加などのアクションはログイン要求される |
| 非認証API呼び出し | 無効なトークン | イベント参加APIを呼び出す | 401エラーが返され、適切にハンドリングされる |
| 権限外操作 | 他ユーザーのイベント | 編集ボタン表示確認 | 編集ボタンが非表示または無効化されている |
| 権限外API呼び出し | 他ユーザーのイベント | 更新APIを直接呼び出す | 403エラーが返され、適切にハンドリングされる |

### 10.2 決済情報セキュリティ

| テストケース | 設定 | テスト内容 | 期待される結果 |
|------------|-----|---------|--------------|
| カード情報処理 | 有効なカード情報 | カード情報入力と送信 | カード情報はクライアント側でトークン化され、生のカード情報はサーバーに送信されない |
| 決済履歴表示 | 過去の決済情報 | 決済履歴表示 | カード番号は一部マスクされている |
| セッション有効期限 | 30分以上経過したセッション | 決済操作 | 再認証が要求される |
| クロスサイトリクエスト | 偽のフォーム送信 | CSRF攻撃シミュレーション | 適切なCSRFトークン検証により拒否される |

以上のテストパラメータと期待される結果を使用して、イベントドメインの各コンポーネントを網羅的にテストすることができます。これにより、機能の正確性、エラー処理、パフォーマンス、互換性、セキュリティを確保することができます。