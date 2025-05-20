# タイムラインドメイン テストパラメーター一覧

このドキュメントではタイムラインドメインのテストに使用するパラメーターとその期待される結果の一覧を提供します。これらのパラメーターは様々なシナリオをカバーし、テストケースの網羅性を確保します。

## 1. TimelineRepository テスト用パラメーター

### 1.1 getTimeline メソッド

| ID | パラメーター | 期待される結果 |
|----|--------------|----------------|
| T1 | timelineType: TimelineType.family<br>limit: 20<br>cursor: null<br>filter: null<br>isOnline: true | Result: Right(TimelineEntity)<br>・20件の家族タイムライン投稿を含む<br>・次のページのカーソル情報を含む<br>・データがローカルにキャッシュされる |
| T2 | timelineType: TimelineType.watch<br>limit: 20<br>cursor: null<br>filter: null<br>isOnline: true | Result: Right(TimelineEntity)<br>・20件のウォッチタイムライン投稿を含む<br>・次のページのカーソル情報を含む<br>・データがローカルにキャッシュされる |
| T3 | timelineType: TimelineType.family<br>limit: 10<br>cursor: "cursor123"<br>filter: null<br>isOnline: true | Result: Right(TimelineEntity)<br>・指定カーソル以降の10件の投稿を含む<br>・次のページのカーソル情報を含む |
| T4 | timelineType: TimelineType.family<br>limit: 20<br>cursor: null<br>filter: (contentTypes: [ContentType.image])<br>isOnline: true | Result: Right(TimelineEntity)<br>・画像投稿のみフィルタリングされた20件の投稿を含む |
| T5 | timelineType: TimelineType.family<br>limit: 20<br>cursor: null<br>filter: null<br>isOnline: false<br>(キャッシュあり) | Result: Right(TimelineEntity)<br>・キャッシュから取得された家族タイムラインデータ |
| T6 | timelineType: TimelineType.family<br>limit: 20<br>cursor: null<br>filter: null<br>isOnline: false<br>(キャッシュなし) | Result: Left(ServerFailure)<br>・「ネットワーク接続エラー」メッセージを含む |
| T7 | timelineType: TimelineType.family<br>limit: 20<br>cursor: null<br>filter: null<br>isOnline: true<br>(サーバーエラー) | Result: Left(ServerFailure)<br>・「サーバーエラー」メッセージを含む |

### 1.2 refreshTimeline メソッド

| ID | パラメーター | 期待される結果 |
|----|--------------|----------------|
| R1 | timelineType: TimelineType.family<br>limit: 20<br>filter: null<br>isOnline: true | Result: Right(TimelineEntity)<br>・最新の20件の家族タイムライン投稿を含む<br>・データがローカルにキャッシュされる |
| R2 | timelineType: TimelineType.watch<br>limit: 20<br>filter: null<br>isOnline: true | Result: Right(TimelineEntity)<br>・最新の20件のウォッチタイムライン投稿を含む<br>・データがローカルにキャッシュされる |
| R3 | timelineType: TimelineType.family<br>limit: 20<br>filter: (contentTypes: [ContentType.video])<br>isOnline: true | Result: Right(TimelineEntity)<br>・動画投稿のみフィルタリングされた最新の20件の投稿を含む |
| R4 | timelineType: TimelineType.family<br>limit: 20<br>filter: null<br>isOnline: false | Result: Left(ServerFailure)<br>・「ネットワーク接続エラー」メッセージを含む |

### 1.3 getTimelinePostsByIds メソッド

| ID | パラメーター | 期待される結果 |
|----|--------------|----------------|
| P1 | postIds: ["post1", "post2", "post3"]<br>(すべて有効なID) | Result: Right(List\<TimelinePostEntity\>)<br>・3件の投稿データを含む |
| P2 | postIds: ["post1", "invalid", "post3"]<br>(一部無効なID) | Result: Right(List\<TimelinePostEntity\>)<br>・2件の有効な投稿データのみを含む |
| P3 | postIds: []<br>(空のリスト) | Result: Right(List\<TimelinePostEntity\>)<br>・空のリストを返す |
| P4 | postIds: ["post1", "post2", "post3"]<br>(リポジトリエラー) | Result: Left(ServerFailure)<br>・エラーメッセージを含む |

## 2. TimelineFilterRepository テスト用パラメーター

### 2.1 getFilter メソッド

| ID | パラメーター | 期待される結果 |
|----|--------------|----------------|
| F1 | (保存済みフィルターあり) | Result: Right(TimelineFilterEntity)<br>・保存されているフィルター設定を返す |
| F2 | (保存済みフィルターなし) | Result: Right(TimelineFilterEntity)<br>・デフォルトのフィルター設定を返す |
| F3 | (ストレージエラー) | Result: Left(CacheFailure)<br>・「フィルター取得エラー」メッセージを含む |

### 2.2 updateFilter メソッド

| ID | パラメーター | 期待される結果 |
|----|--------------|----------------|
| UF1 | filter: (contentTypes: [ContentType.image, ContentType.video]<br>showLikedOnly: false<br>showHighlightedOnly: false) | Result: Right(TimelineFilterEntity)<br>・更新されたフィルター設定を返す<br>・フィルターがローカルに保存される |
| UF2 | filter: (contentTypes: null<br>showLikedOnly: true<br>showHighlightedOnly: false) | Result: Right(TimelineFilterEntity)<br>・更新されたフィルター設定を返す<br>・フィルターがローカルに保存される |
| UF3 | filter: (contentTypes: [ContentType.audio]<br>showLikedOnly: false<br>showHighlightedOnly: true) | Result: Right(TimelineFilterEntity)<br>・更新されたフィルター設定を返す<br>・フィルターがローカルに保存される |
| UF4 | (ストレージエラー) | Result: Left(CacheFailure)<br>・「フィルター更新エラー」メッセージを含む |

## 3. TimelineViewHistoryRepository テスト用パラメーター

### 3.1 recordViewHistory メソッド

| ID | パラメーター | 期待される結果 |
|----|--------------|----------------|
| VH1 | params: (userId: "user1"<br>postId: "post1"<br>viewDuration: 30<br>completed: true<br>deviceInfo: {device_type: "mobile"})<br>isOnline: true | Result: Right(TimelineViewHistoryEntity)<br>・記録された閲覧履歴を返す<br>・履歴がローカルに保存される<br>・履歴がサーバーに同期される |
| VH2 | params: (userId: "user1"<br>postId: "post2"<br>viewDuration: 15<br>completed: false<br>deviceInfo: {device_type: "mobile"})<br>isOnline: true | Result: Right(TimelineViewHistoryEntity)<br>・記録された閲覧履歴を返す<br>・履歴がローカルに保存される<br>・履歴がサーバーに同期される |
| VH3 | params: (userId: "user1"<br>postId: "post3"<br>viewDuration: 60<br>completed: true<br>deviceInfo: {device_type: "desktop"})<br>isOnline: false | Result: Right(TimelineViewHistoryEntity)<br>・記録された閲覧履歴を返す<br>・履歴がローカルに保存される<br>・サーバー同期は行われない |
| VH4 | (ストレージエラー) | Result: Left(CacheFailure)<br>・「履歴記録エラー」メッセージを含む |

### 3.2 getViewHistory メソッド

| ID | パラメーター | 期待される結果 |
|----|--------------|----------------|
| GVH1 | userId: "user1"<br>limit: 20<br>startDate: null<br>endDate: null | Result: Right(List\<TimelineViewHistoryEntity\>)<br>・ユーザーの最新20件の閲覧履歴を返す |
| GVH2 | userId: "user1"<br>limit: 10<br>startDate: "2023-01-01"<br>endDate: "2023-01-31" | Result: Right(List\<TimelineViewHistoryEntity\>)<br>・指定期間内のユーザーの閲覧履歴（最大10件）を返す |
| GVH3 | userId: "newUser"<br>limit: 20<br>startDate: null<br>endDate: null | Result: Right(List\<TimelineViewHistoryEntity\>)<br>・空のリストを返す（履歴なし） |
| GVH4 | (ストレージエラー) | Result: Left(CacheFailure)<br>・「履歴取得エラー」メッセージを含む |

## 4. ユースケースレイヤー テスト用パラメーター

### 4.1 GetTimelineUseCase

| ID | パラメーター | 期待される結果 |
|----|--------------|----------------|
| GUC1 | timelineType: TimelineType.family<br>limit: 20<br>cursor: null<br>filter: null<br>(リポジトリ成功) | Result: Right(TimelineEntity)<br>・リポジトリから返されたデータをそのまま返す |
| GUC2 | timelineType: TimelineType.family<br>limit: 20<br>cursor: null<br>filter: null<br>(リポジトリエラー) | Result: Left(Failure)<br>・リポジトリから返されたエラーをそのまま返す |

### 4.2 RefreshTimelineUseCase

| ID | パラメーター | 期待される結果 |
|----|--------------|----------------|
| RUC1 | timelineType: TimelineType.family<br>limit: 20<br>filter: null<br>(リポジトリ成功) | Result: Right(TimelineEntity)<br>・リポジトリから返された最新データをそのまま返す |
| RUC2 | timelineType: TimelineType.family<br>limit: 20<br>filter: null<br>(リポジトリエラー) | Result: Left(Failure)<br>・リポジトリから返されたエラーをそのまま返す |

### 4.3 UpdateTimelineFilterUseCase

| ID | パラメーター | 期待される結果 |
|----|--------------|----------------|
| UFUC1 | filter: (contentTypes: [ContentType.image])<br>(リポジトリ成功) | Result: Right(TimelineFilterEntity)<br>・リポジトリから返された更新済みフィルターをそのまま返す |
| UFUC2 | filter: (contentTypes: [ContentType.image])<br>(リポジトリエラー) | Result: Left(Failure)<br>・リポジトリから返されたエラーをそのまま返す |

### 4.4 RecordViewHistoryUseCase

| ID | パラメーター | 期待される結果 |
|----|--------------|----------------|
| RVHUC1 | params: (userId: "user1"<br>postId: "post1"<br>viewDuration: 30<br>completed: true)<br>(リポジトリ成功) | Result: Right(TimelineViewHistoryEntity)<br>・リポジトリから返された記録済み履歴をそのまま返す |
| RVHUC2 | params: (userId: "user1"<br>postId: "post1"<br>viewDuration: 30<br>completed: true)<br>(リポジトリエラー) | Result: Left(Failure)<br>・リポジトリから返されたエラーをそのまま返す |

## 5. TimelineViewModel テスト用パラメーター

### 5.1 getTimeline メソッド

| ID | パラメーター | 初期状態 | ユースケース結果 | 期待される最終状態 |
|----|--------------|---------|-------------------|-------------------|
| VM1 | type: null<br>refresh: false<br>cursor: null | TimelineInitial<br>currentType: TimelineType.family | Right(TimelineEntity) | TimelineLoaded(timeline)<br>currentType: TimelineType.family |
| VM2 | type: TimelineType.watch<br>refresh: false<br>cursor: null | TimelineInitial<br>currentType: TimelineType.family | Right(TimelineEntity) | TimelineLoaded(timeline)<br>currentType: TimelineType.watch |
| VM3 | type: null<br>refresh: true<br>cursor: null | TimelineLoaded<br>currentType: TimelineType.family | Right(TimelineEntity) | TimelineLoaded(timeline)<br>currentType: TimelineType.family |
| VM4 | type: null<br>refresh: false<br>cursor: "cursor123" | TimelineLoaded<br>currentType: TimelineType.family | Right(TimelineEntity) | TimelineLoaded(combinedTimeline)<br>currentType: TimelineType.family |
| VM5 | type: null<br>refresh: false<br>cursor: null | TimelineInitial<br>currentType: TimelineType.family | Left(ServerFailure) | TimelineError(message)<br>currentType: TimelineType.family |

### 5.2 switchTimelineType メソッド

| ID | パラメーター | 初期状態 | ユースケース結果 | 期待される最終状態 |
|----|--------------|---------|-------------------|-------------------|
| VMST1 | type: TimelineType.watch | TimelineLoaded<br>currentType: TimelineType.family | Right(TimelineEntity) | TimelineLoaded(timeline)<br>currentType: TimelineType.watch |
| VMST2 | type: TimelineType.family | TimelineLoaded<br>currentType: TimelineType.family | - | TimelineLoaded<br>currentType: TimelineType.family<br>(変化なし) |
| VMST3 | type: TimelineType.watch | TimelineLoaded<br>currentType: TimelineType.family | Left(ServerFailure) | TimelineError(message)<br>currentType: TimelineType.watch |

### 5.3 updateFilter メソッド

| ID | パラメーター | 初期状態 | ユースケース結果 | 期待される最終状態 |
|----|--------------|---------|-------------------|-------------------|
| VMUF1 | filter: (contentTypes: [ContentType.image]) | TimelineLoaded<br>filter: (contentTypes: null) | Right(TimelineFilterEntity) | TimelineLoaded(timeline)<br>filter: (contentTypes: [ContentType.image]) |
| VMUF2 | filter: (showLikedOnly: true) | TimelineLoaded<br>filter: (showLikedOnly: false) | Left(CacheFailure) | TimelineError(message)<br>filter: (showLikedOnly: false)<br>(フィルター更新なし) |

### 5.4 loadMore メソッド

| ID | パラメーター | 初期状態 | ユースケース結果 | 期待される最終状態 |
|----|--------------|---------|-------------------|-------------------|
| VMLM1 | - | TimelineLoaded(timeline with nextCursor) | Right(TimelineEntity) | TimelineLoaded(combinedTimeline)<br>(既存と新規データの統合) |
| VMLM2 | - | TimelineLoaded(timeline without nextCursor) | - | TimelineLoaded<br>(変化なし) |
| VMLM3 | - | TimelineLoaded(timeline with nextCursor) | Left(ServerFailure) | TimelineError(message) |
| VMLM4 | - | TimelineInitial | - | TimelineInitial<br>(変化なし) |

## 6. WatchTimelineViewModel テスト用パラメーター

### 6.1 getWatchTimeline メソッド

| ID | パラメーター | 初期状態 | ユースケース結果 | 期待される最終状態 |
|----|--------------|---------|-------------------|-------------------|
| WVM1 | refresh: false<br>cursor: null | WatchTimelineInitial<br>currentIndex: 0 | Right(TimelineEntity) | WatchTimelineLoaded(timeline)<br>currentIndex: 0 |
| WVM2 | refresh: true<br>cursor: null | WatchTimelineLoaded<br>currentIndex: 2 | Right(TimelineEntity) | WatchTimelineLoaded(timeline)<br>currentIndex: 0<br>(インデックスリセット) |
| WVM3 | refresh: false<br>cursor: "cursor123" | WatchTimelineLoaded<br>currentIndex: 5 | Right(TimelineEntity) | WatchTimelineLoaded(combinedTimeline)<br>currentIndex: 5<br>(インデックス保持) |
| WVM4 | refresh: false<br>cursor: null | WatchTimelineInitial<br>currentIndex: 0 | Left(ServerFailure) | WatchTimelineError(message)<br>currentIndex: 0 |

### 6.2 nextPost メソッド

| ID | パラメーター | 初期状態 | ユースケース結果 | 期待される最終状態 |
|----|--------------|---------|-------------------|-------------------|
| WVMNP1 | - | WatchTimelineLoaded<br>currentIndex: 0<br>(posts.length: 3) | - | WatchTimelineLoaded<br>currentIndex: 1 |
| WVMNP2 | - | WatchTimelineLoaded<br>currentIndex: 2<br>(posts.length: 3)<br>(nextCursor: null) | - | WatchTimelineLoaded<br>currentIndex: 2<br>(変化なし) |
| WVMNP3 | - | WatchTimelineLoaded<br>currentIndex: 2<br>(posts.length: 3)<br>(nextCursor: "cursor123") | Right(TimelineEntity) | WatchTimelineLoaded(combinedTimeline)<br>currentIndex: 3 |
| WVMNP4 | - | WatchTimelineInitial<br>currentIndex: 0 | - | WatchTimelineInitial<br>currentIndex: 0<br>(変化なし) |

### 6.3 previousPost メソッド

| ID | パラメーター | 初期状態 | ユースケース結果 | 期待される最終状態 |
|----|--------------|---------|-------------------|-------------------|
| WVMPP1 | - | WatchTimelineLoaded<br>currentIndex: 2<br>(posts.length: 3) | - | WatchTimelineLoaded<br>currentIndex: 1 |
| WVMPP2 | - | WatchTimelineLoaded<br>currentIndex: 0<br>(posts.length: 3) | - | WatchTimelineLoaded<br>currentIndex: 0<br>(変化なし) |
| WVMPP3 | - | WatchTimelineInitial<br>currentIndex: 0 | - | WatchTimelineInitial<br>currentIndex: 0<br>(変化なし) |

## 7. TimelineScreen UI テスト用パラメーター

### 7.1 初期表示

| ID | パラメーター | ビューモデル状態 | 期待されるUI表示 |
|----|--------------|-----------------|-----------------|
| TS1 | - | TimelineInitial | ・ローディングインジケーターが表示される<br>・「ファミリー」タブが選択されている |
| TS2 | - | TimelineLoading | ・ローディングインジケーターが表示される<br>・「ファミリー」タブが選択されている |
| TS3 | - | TimelineLoaded(空のリスト) | ・「投稿がありません」メッセージが表示される<br>・「ファミリー」タブが選択されている |
| TS4 | - | TimelineLoaded(3件の投稿) | ・3件の投稿カードが表示される<br>・各カードに適切なコンテンツが表示される<br>・「ファミリー」タブが選択されている |
| TS5 | - | TimelineError("エラーメッセージ") | ・エラーメッセージが表示される<br>・再試行ボタンが表示される |

### 7.2 タイムラインタイプ切替

| ID | パラメーター | 初期ビューモデル状態 | ユーザーアクション | 期待されるビューモデル動作 |
|----|--------------|---------------------|-----------------|------------------------|
| TSTT1 | - | TimelineLoaded<br>currentType: TimelineType.family | 「ウォッチ」タブをタップ | ・`switchTimelineType(TimelineType.watch)`メソッドが呼び出される |
| TSTT2 | - | TimelineLoaded<br>currentType: TimelineType.watch | 「ファミリー」タブをタップ | ・`switchTimelineType(TimelineType.family)`メソッドが呼び出される |
| TSTT3 | - | TimelineError<br>currentType: TimelineType.family | 「ウォッチ」タブをタップ | ・`switchTimelineType(TimelineType.watch)`メソッドが呼び出される |

### 7.3 プルトゥリフレッシュ

| ID | パラメーター | 初期ビューモデル状態 | ユーザーアクション | 期待されるビューモデル動作 |
|----|--------------|---------------------|-----------------|------------------------|
| TSPTR1 | - | TimelineLoaded | 画面を下にプルダウン | ・`refresh()`メソッドが呼び出される |
| TSPTR2 | - | TimelineError | 画面を下にプルダウン | ・`refresh()`メソッドが呼び出される |

### 7.4 無限スクロール

| ID | パラメーター | 初期ビューモデル状態 | ユーザーアクション | 期待されるビューモデル動作 |
|----|--------------|---------------------|-----------------|------------------------|
| TSIS1 | - | TimelineLoaded(nextCursorあり) | リストの最下部までスクロール | ・`loadMore()`メソッドが呼び出される |
| TSIS2 | - | TimelineLoaded(nextCursorなし) | リストの最下部までスクロール | ・`loadMore()`メソッドは呼び出されない |

## 8. WatchTimelineScreen UI テスト用パラメーター

### 8.1 初期表示

| ID | パラメーター | ビューモデル状態 | 期待されるUI表示 |
|----|--------------|-----------------|-----------------|
| WTS1 | - | WatchTimelineInitial | ・ローディングインジケーターが表示される |
| WTS2 | - | WatchTimelineLoading | ・ローディングインジケーターが表示される |
| WTS3 | - | WatchTimelineLoaded(空のリスト) | ・「投稿がありません」メッセージが表示される |
| WTS4 | - | WatchTimelineLoaded(投稿リスト、currentIndex: 1) | ・現在のインデックス(1)の投稿が全画面表示される<br>・メディアコンテンツが適切に表示される<br>・投稿者情報とインタラクションボタンが表示される |
| WTS5 | - | WatchTimelineError("エラーメッセージ") | ・エラーメッセージが表示される<br>・再試行ボタンが表示される |

### 8.2 投稿間ナビゲーション

| ID | パラメーター | 初期ビューモデル状態 | ユーザーアクション | 期待されるビューモデル動作 |
|----|--------------|---------------------|-----------------|------------------------|
| WTSN1 | - | WatchTimelineLoaded<br>currentIndex: 1<br>(posts.length: 3) | 画面を上にスワイプ | ・`nextPost()`メソッドが呼び出される |
| WTSN2 | - | WatchTimelineLoaded<br>currentIndex: 1<br>(posts.length: 3) | 画面を下にスワイプ | ・`previousPost()`メソッドが呼び出される |

### 8.3 閲覧履歴記録

| ID | パラメーター | 初期ビューモデル状態 | ユーザーアクション | 期待されるビューモデル動作 |
|----|--------------|---------------------|-----------------|------------------------|
| WTSVH1 | - | WatchTimelineLoaded<br>currentIndex: 0 | 5秒間投稿を閲覧 | ・`recordCurrentPostView(duration, completed)`メソッドが呼び出される |
| WTSVH2 | - | WatchTimelineLoaded<br>currentIndex: 0 | 次の投稿へスワイプ | ・`recordCurrentPostView(duration, completed)`メソッドが呼び出される<br>・`nextPost()`メソッドが呼び出される |