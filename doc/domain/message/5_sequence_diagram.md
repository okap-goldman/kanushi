# ダイレクトメッセージ機能のシーケンス図

このドキュメントでは、ダイレクトメッセージ機能における主要な操作のシーケンス図を記述します。

## 1. 会話一覧の取得

```mermaid
sequenceDiagram
    actor User
    participant UI as UI (MessageListScreen)
    participant ViewModel as ConversationViewModel
    participant UseCase as GetConversationsUseCase
    participant Repository as ConversationRepository
    participant LocalDS as ConversationLocalDataSource
    participant RemoteDS as ConversationRemoteDataSource
    participant API as API Server
    participant Supabase as Supabase Realtime DB

    User->>UI: 会話一覧画面を開く
    UI->>ViewModel: getConversations()
    ViewModel->>UseCase: call(GetConversationsParams)
    UseCase->>Repository: getConversations()
    Repository->>LocalDS: getCachedConversations()
    LocalDS-->>Repository: キャッシュされた会話リスト
    Repository->>RemoteDS: getConversations()
    RemoteDS->>API: GET /api/messages/conversations
    API-->>RemoteDS: 会話リスト
    RemoteDS-->>Repository: ConversationModelリスト
    Repository->>LocalDS: cacheConversations()
    Repository-->>UseCase: ConversationEntityリスト
    UseCase-->>ViewModel: Either<Failure, List<ConversationEntity>>
    ViewModel-->>UI: 会話リスト
    UI-->>User: 会話一覧を表示

    Note over ViewModel,Supabase: リアルタイム更新のセットアップ
    ViewModel->>Supabase: 会話変更をサブスクライブ
    Supabase-->>ViewModel: 会話変更イベント
    ViewModel-->>UI: 会話リストを更新
    UI-->>User: 会話一覧を更新表示
```

## 2. メッセージの取得と送信

```mermaid
sequenceDiagram
    actor User
    participant UI as UI (ConversationDetailScreen)
    participant MViewModel as MessageViewModel
    participant CViewModel as ConversationViewModel
    participant GetUseCase as GetMessagesUseCase
    participant SendUseCase as SendMessageUseCase
    participant MRepository as MessageRepository
    participant CRepository as ConversationRepository
    participant LocalDS as MessageLocalDataSource
    participant RemoteDS as MessageRemoteDataSource
    participant API as API Server
    participant Supabase as Supabase Realtime DB

    User->>UI: 特定の会話を選択
    UI->>CViewModel: selectConversation(conversationId)
    CViewModel-->>UI: selectedConversation
    UI->>MViewModel: getMessages(conversationId)
    MViewModel->>GetUseCase: call(GetMessagesParams)
    GetUseCase->>MRepository: getMessages(conversationId)
    MRepository->>LocalDS: getCachedMessages(conversationId)
    LocalDS-->>MRepository: キャッシュされたメッセージリスト
    MRepository->>RemoteDS: getMessages(conversationId)
    RemoteDS->>API: GET /api/messages/conversations/{id}/messages
    API-->>RemoteDS: メッセージリスト
    RemoteDS-->>MRepository: MessageModelリスト
    MRepository->>LocalDS: cacheMessages(messages)
    MRepository-->>GetUseCase: MessageEntityリスト
    GetUseCase-->>MViewModel: Either<Failure, List<MessageEntity>>
    MViewModel-->>UI: メッセージリスト
    UI-->>User: メッセージを表示

    Note over MViewModel,Supabase: リアルタイム更新のセットアップ
    MViewModel->>Supabase: メッセージ変更をサブスクライブ
    Supabase-->>MViewModel: メッセージ変更イベント
    MViewModel-->>UI: メッセージリストを更新
    UI-->>User: メッセージを更新表示

    User->>UI: メッセージを入力して送信
    UI->>MViewModel: sendMessage(conversationId, content)
    MViewModel->>SendUseCase: call(SendMessageParams)
    SendUseCase->>MRepository: sendMessage(conversationId, content)
    MRepository->>RemoteDS: sendMessage(conversationId, content)
    RemoteDS->>API: POST /api/messages/conversations/{id}/messages
    API->>Supabase: メッセージを保存して通知
    API-->>RemoteDS: 送信されたメッセージ
    RemoteDS-->>MRepository: MessageModel
    MRepository->>LocalDS: saveMessage(message)
    MRepository-->>SendUseCase: MessageEntity
    SendUseCase-->>MViewModel: Either<Failure, MessageEntity>
    MViewModel-->>UI: 送信完了
    
    Note over Supabase: リアルタイム通知
    Supabase-->>MViewModel: 新しいメッセージイベント
    MViewModel-->>UI: メッセージリストを更新
    UI-->>User: 送信したメッセージを表示

    Note over API,Supabase: 相手のデバイスへの通知
    Supabase-->>API: message:new イベント
    API->>API: プッシュ通知を送信
```

## 3. メディア添付のアップロードとメッセージ送信

```mermaid
sequenceDiagram
    actor User
    participant UI as UI (ConversationDetailScreen)
    participant MViewModel as MessageViewModel
    participant UploadUseCase as UploadMediaUseCase
    participant SendUseCase as SendMessageUseCase
    participant MediaRepo as MediaRepository
    participant MRepository as MessageRepository
    participant MediaDS as MediaRemoteDataSource
    participant MRemoteDS as MessageRemoteDataSource
    participant API as API Server
    participant CDN as Backblaze B2 + Cloudflare CDN
    participant Supabase as Supabase Realtime DB

    User->>UI: メディアを選択して添付
    UI->>MViewModel: uploadMedia(file, mediaType)
    MViewModel->>UploadUseCase: call(UploadMediaParams)
    UploadUseCase->>MediaRepo: uploadMedia(file, mediaType)
    MediaRepo->>MediaDS: uploadMedia(file, mediaType)
    MediaDS->>API: POST /api/messages/media
    API->>CDN: メディアファイルをアップロード
    CDN-->>API: ファイルURL
    API-->>MediaDS: MediaAttachmentModel
    MediaDS-->>MediaRepo: MediaAttachmentModel
    MediaRepo-->>UploadUseCase: MediaAttachmentEntity
    UploadUseCase-->>MViewModel: Either<Failure, MediaAttachmentEntity>
    MViewModel-->>UI: アップロード完了、プレビュー表示
    UI-->>User: アップロードされたメディアのプレビュー

    User->>UI: 送信ボタンをタップ
    UI->>MViewModel: sendMessage(conversationId, content, mediaAttachmentIds)
    MViewModel->>SendUseCase: call(SendMessageParams)
    SendUseCase->>MRepository: sendMessage(conversationId, content, mediaAttachmentIds)
    MRepository->>MRemoteDS: sendMessage(conversationId, content, mediaAttachmentIds)
    MRemoteDS->>API: POST /api/messages/conversations/{id}/messages
    API->>Supabase: メディア添付メッセージを保存して通知
    API-->>MRemoteDS: 送信されたメッセージ
    MRemoteDS-->>MRepository: MessageModel
    MRepository-->>SendUseCase: MessageEntity
    SendUseCase-->>MViewModel: Either<Failure, MessageEntity>
    MViewModel-->>UI: 送信完了
    
    Note over Supabase: リアルタイム通知
    Supabase-->>MViewModel: 新しいメッセージイベント
    MViewModel-->>UI: メッセージリストを更新
    UI-->>User: 送信したメディア付きメッセージを表示
```

## 4. 新規会話の作成

```mermaid
sequenceDiagram
    actor User
    participant UI as UI (NewConversationScreen)
    participant ViewModel as ConversationViewModel
    participant UseCase as CreateConversationUseCase
    participant Repository as ConversationRepository
    participant RemoteDS as ConversationRemoteDataSource
    participant API as API Server
    participant Supabase as Supabase Realtime DB

    User->>UI: 新規メッセージ作成画面を開く
    User->>UI: 受信者を選択
    User->>UI: メッセージを入力
    User->>UI: 送信ボタンをタップ
    
    UI->>ViewModel: createConversation(type, participantIds, message)
    ViewModel->>UseCase: call(CreateConversationParams)
    UseCase->>Repository: createConversation(type, participantIds, title)
    Repository->>RemoteDS: createConversation(type, participantIds, title)
    RemoteDS->>API: POST /api/messages/conversations
    API->>Supabase: 会話を作成して通知
    API-->>RemoteDS: 作成された会話
    RemoteDS-->>Repository: ConversationModel
    Repository-->>UseCase: ConversationEntity
    UseCase-->>ViewModel: Either<Failure, ConversationEntity>
    ViewModel-->>UI: 会話作成完了
    
    Note over UI,ViewModel: 作成された会話にメッセージを送信
    UI->>ViewModel: sendInitialMessage(conversationId, content, mediaAttachmentIds)
    
    Note over Supabase: リアルタイム通知
    Supabase-->>ViewModel: 新しい会話イベント
    ViewModel-->>UI: 会話リストを更新
    UI-->>User: 会話詳細画面に遷移
```

## 5. メッセージの既読状態の更新

```mermaid
sequenceDiagram
    actor User
    participant UI as UI (ConversationDetailScreen)
    participant MViewModel as MessageViewModel
    participant UseCase as MarkAsReadUseCase
    participant Repository as MessageRepository
    participant RemoteDS as MessageRemoteDataSource
    participant API as API Server
    participant Supabase as Supabase Realtime DB

    User->>UI: 会話を開く/スクロールする
    UI->>MViewModel: markAsRead(conversationId, messageId)
    MViewModel->>UseCase: call(MarkAsReadParams)
    UseCase->>Repository: markAsRead(conversationId, messageId)
    Repository->>RemoteDS: markAsRead(conversationId, messageId)
    RemoteDS->>API: POST /api/messages/conversations/{id}/read
    API->>Supabase: 既読状態を更新して通知
    API-->>RemoteDS: 更新された既読状態
    RemoteDS-->>Repository: ReadStatusModel
    Repository-->>UseCase: ReadStatusEntity
    UseCase-->>MViewModel: Either<Failure, ReadStatusEntity>
    
    Note over Supabase: リアルタイム通知
    Supabase-->>MViewModel: message:read イベント
    MViewModel-->>UI: メッセージの既読状態を更新
    UI-->>User: 既読インジケーターを表示

    Note over API,Supabase: 送信者のデバイスへの通知
    Supabase-->>API: message:read イベント
    API->>API: 未読カウントを更新
```

## 6. メッセージへのリアクション追加

```mermaid
sequenceDiagram
    actor User
    participant UI as UI (ConversationDetailScreen)
    participant MViewModel as MessageViewModel
    participant UseCase as AddReactionUseCase
    participant Repository as MessageRepository
    participant RemoteDS as MessageRemoteDataSource
    participant API as API Server
    participant Supabase as Supabase Realtime DB

    User->>UI: メッセージを長押し
    UI-->>User: リアクションメニューを表示
    User->>UI: リアクションを選択
    UI->>MViewModel: addReaction(conversationId, messageId, reactionType)
    MViewModel->>UseCase: call(AddReactionParams)
    UseCase->>Repository: addReaction(conversationId, messageId, reactionType)
    Repository->>RemoteDS: addReaction(conversationId, messageId, reactionType)
    RemoteDS->>API: POST /api/messages/conversations/{id}/messages/{id}/reactions
    API->>Supabase: リアクションを保存して通知
    API-->>RemoteDS: 追加されたリアクション
    RemoteDS-->>Repository: ReactionModel
    Repository-->>UseCase: ReactionEntity
    UseCase-->>MViewModel: Either<Failure, ReactionEntity>
    
    Note over Supabase: リアルタイム通知
    Supabase-->>MViewModel: reaction:add イベント
    MViewModel-->>UI: メッセージのリアクションを更新
    UI-->>User: リアクションを表示

    Note over API,Supabase: 他のユーザーへの通知
    Supabase-->>API: reaction:add イベント
```

## 7. 会話のアーカイブ

```mermaid
sequenceDiagram
    actor User
    participant UI as UI (MessageListScreen)
    participant ViewModel as ConversationViewModel
    participant UseCase as UpdateConversationStatusUseCase
    participant Repository as ConversationRepository
    participant RemoteDS as ConversationRemoteDataSource
    participant API as API Server
    participant Supabase as Supabase Realtime DB

    User->>UI: 会話を左にスワイプ
    UI-->>User: アーカイブオプションを表示
    User->>UI: アーカイブを選択
    UI->>ViewModel: updateConversationStatus(conversationId, ARCHIVED)
    ViewModel->>UseCase: call(UpdateConversationStatusParams)
    UseCase->>Repository: updateConversationStatus(conversationId, ARCHIVED)
    Repository->>RemoteDS: updateConversationStatus(conversationId, ARCHIVED)
    RemoteDS->>API: PATCH /api/messages/conversations/{id}/status
    API->>Supabase: 会話ステータスを更新して通知
    API-->>RemoteDS: 更新された会話
    RemoteDS-->>Repository: ConversationModel
    Repository-->>UseCase: ConversationEntity
    UseCase-->>ViewModel: Either<Failure, ConversationEntity>
    ViewModel-->>UI: 会話ステータス更新完了
    UI-->>User: 会話をアーカイブリストに移動
    
    Note over Supabase: リアルタイム通知
    Supabase-->>ViewModel: conversation:update イベント
    ViewModel-->>UI: 会話リストを更新
```

## 8. リアルタイム通知の処理

```mermaid
sequenceDiagram
    participant Sender as 送信者
    participant API as API Server
    participant Supabase as Supabase Realtime DB
    participant Receiver as 受信者
    participant Firebase as Firebase Cloud Messaging
    participant Device as 受信者のデバイス
    participant MViewModel as MessageViewModel
    participant UI as UI (NotificationView)

    Sender->>API: メッセージ送信リクエスト
    API->>Supabase: メッセージを保存
    Supabase-->>API: 保存完了
    
    Note over API,Supabase: リアルタイム通知処理
    API->>Firebase: プッシュ通知送信リクエスト
    Firebase->>Device: プッシュ通知
    
    alt デバイスがオンライン＆アプリが開いている
        Device->>Supabase: message:new イベント取得
        Supabase-->>MViewModel: message:new イベント
        MViewModel-->>UI: メッセージリストを更新
        UI-->>Receiver: 新しいメッセージを表示
    else デバイスがオンライン＆アプリがバックグラウンド
        Device->>UI: 通知をタップ
        UI->>MViewModel: 会話を開く
        MViewModel-->>UI: メッセージを読み込み
        UI-->>Receiver: メッセージを表示
    else デバイスがオフライン
        Firebase-->>Device: オフラインキュー
        Device->>Device: デバイスがオンラインになったとき通知を表示
    end
```

## 9. グループメッセージの参加者管理（フェーズ2）

```mermaid
sequenceDiagram
    actor Admin
    participant UI as UI (GroupSettingsScreen)
    participant ViewModel as ConversationViewModel
    participant UseCase as AddParticipantsUseCase
    participant Repository as ConversationRepository
    participant RemoteDS as ConversationRemoteDataSource
    participant API as API Server
    participant Supabase as Supabase Realtime DB

    Admin->>UI: グループ設定画面を開く
    UI-->>Admin: 現在の参加者リストを表示
    Admin->>UI: 参加者追加ボタンをタップ
    UI-->>Admin: ユーザー検索画面を表示
    Admin->>UI: 追加するユーザーを選択
    UI->>ViewModel: addParticipants(conversationId, userIds)
    ViewModel->>UseCase: call(AddParticipantsParams)
    UseCase->>Repository: addParticipants(conversationId, userIds)
    Repository->>RemoteDS: addParticipants(conversationId, userIds)
    RemoteDS->>API: POST /api/messages/conversations/{id}/participants
    API->>Supabase: 参加者を追加して通知
    API-->>RemoteDS: 追加された参加者リスト
    RemoteDS-->>Repository: ParticipantModelリスト
    Repository-->>UseCase: ParticipantEntityリスト
    UseCase-->>ViewModel: Either<Failure, List<ParticipantEntity>>
    ViewModel-->>UI: 参加者追加完了
    UI-->>Admin: 更新された参加者リストを表示
    
    Note over Supabase: リアルタイム通知
    Supabase-->>ViewModel: participant:add イベント
    ViewModel-->>UI: 参加者リストを更新
    
    Note over API,Supabase: 新しい参加者への通知
    Supabase-->>API: participant:add イベント
    API->>API: 通知を送信
```

## 10. エンドツーエンド暗号化プロセス（フェーズ3）

```mermaid
sequenceDiagram
    actor Sender
    participant SenderApp as 送信者のアプリ
    participant API as API Server
    participant Supabase as Supabase DB
    participant ReceiverApp as 受信者のアプリ
    actor Receiver

    Note over SenderApp: 鍵管理プロセス
    SenderApp->>SenderApp: 会話ごとの対称鍵を生成
    SenderApp->>SenderApp: 受信者の公開鍵で対称鍵を暗号化
    
    Note over SenderApp: メッセージ暗号化
    Sender->>SenderApp: メッセージを入力
    SenderApp->>SenderApp: 対称鍵でメッセージを暗号化
    SenderApp->>API: 暗号化されたメッセージを送信
    API->>Supabase: 暗号化されたメッセージを保存
    Supabase-->>ReceiverApp: 暗号化されたメッセージを受信
    
    Note over ReceiverApp: 復号プロセス
    ReceiverApp->>ReceiverApp: 秘密鍵で対称鍵を復号
    ReceiverApp->>ReceiverApp: 対称鍵でメッセージを復号
    ReceiverApp-->>Receiver: 復号されたメッセージを表示
```