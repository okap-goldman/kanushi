# ダイレクトメッセージ機能のテストパラメータ

このドキュメントでは、ダイレクトメッセージ機能のテストに使用するテストパラメータを定義します。

## 1. エンティティのテストパラメータ

### 1.1 MessageEntityのテストパラメータ

#### 1.1.1 標準的なメッセージ

```dart
final testMessageEntity = MessageEntity(
  id: '1',
  conversationId: '1',
  senderId: '1',
  content: 'こんにちは！',
  mediaAttachments: [],
  quotedMessage: null,
  createdAt: DateTime(2023, 4, 1, 12, 0, 0),
  updatedAt: null,
  status: MessageStatus.sent,
  reactions: [],
  readStatuses: [],
  isEdited: false,
  isDeleted: false,
);
```

#### 1.1.2 メディア添付付きメッセージ

```dart
final testMessageWithMediaEntity = MessageEntity(
  id: '2',
  conversationId: '1',
  senderId: '1',
  content: '写真を送ります',
  mediaAttachments: [
    MediaAttachmentEntity(
      id: '1',
      messageId: '2',
      type: MediaType.image,
      url: 'https://example.com/image.jpg',
      thumbnailUrl: 'https://example.com/image_thumb.jpg',
      size: 1024 * 1024,
      metadata: {
        'width': 800,
        'height': 600,
        'filename': 'image.jpg',
      },
      createdAt: DateTime(2023, 4, 1, 12, 5, 0),
    )
  ],
  quotedMessage: null,
  createdAt: DateTime(2023, 4, 1, 12, 5, 0),
  updatedAt: null,
  status: MessageStatus.sent,
  reactions: [],
  readStatuses: [],
  isEdited: false,
  isDeleted: false,
);
```

#### 1.1.3 引用返信付きメッセージ

```dart
final testMessageWithQuoteEntity = MessageEntity(
  id: '3',
  conversationId: '1',
  senderId: '2',
  content: 'はい、了解しました',
  mediaAttachments: [],
  quotedMessage: MessageEntity(
    id: '1',
    conversationId: '1',
    senderId: '1',
    content: 'こんにちは！',
    mediaAttachments: [],
    quotedMessage: null,
    createdAt: DateTime(2023, 4, 1, 12, 0, 0),
    updatedAt: null,
    status: MessageStatus.read,
    reactions: [],
    readStatuses: [],
    isEdited: false,
    isDeleted: false,
  ),
  createdAt: DateTime(2023, 4, 1, 12, 10, 0),
  updatedAt: null,
  status: MessageStatus.sent,
  reactions: [],
  readStatuses: [],
  isEdited: false,
  isDeleted: false,
);
```

#### 1.1.4 既読ステータス付きメッセージ

```dart
final testMessageWithReadStatusEntity = MessageEntity(
  id: '4',
  conversationId: '1',
  senderId: '1',
  content: 'お疲れ様です',
  mediaAttachments: [],
  quotedMessage: null,
  createdAt: DateTime(2023, 4, 1, 15, 0, 0),
  updatedAt: null,
  status: MessageStatus.read,
  reactions: [],
  readStatuses: [
    ReadStatusEntity(
      id: '1',
      messageId: '4',
      userId: '2',
      readAt: DateTime(2023, 4, 1, 15, 1, 0),
    )
  ],
  isEdited: false,
  isDeleted: false,
);
```

#### 1.1.5 リアクション付きメッセージ

```dart
final testMessageWithReactionEntity = MessageEntity(
  id: '5',
  conversationId: '1',
  senderId: '1',
  content: '良いニュースがあります！',
  mediaAttachments: [],
  quotedMessage: null,
  createdAt: DateTime(2023, 4, 1, 16, 0, 0),
  updatedAt: null,
  status: MessageStatus.read,
  reactions: [
    ReactionEntity(
      id: '1',
      messageId: '5',
      userId: '2',
      type: ReactionType.like,
      createdAt: DateTime(2023, 4, 1, 16, 1, 0),
    ),
    ReactionEntity(
      id: '2',
      messageId: '5',
      userId: '3',
      type: ReactionType.love,
      createdAt: DateTime(2023, 4, 1, 16, 2, 0),
    )
  ],
  readStatuses: [],
  isEdited: false,
  isDeleted: false,
);
```

#### 1.1.6 編集済みメッセージ

```dart
final testEditedMessageEntity = MessageEntity(
  id: '6',
  conversationId: '1',
  senderId: '1',
  content: '修正後のメッセージ内容',
  mediaAttachments: [],
  quotedMessage: null,
  createdAt: DateTime(2023, 4, 1, 17, 0, 0),
  updatedAt: DateTime(2023, 4, 1, 17, 5, 0),
  status: MessageStatus.sent,
  reactions: [],
  readStatuses: [],
  isEdited: true,
  isDeleted: false,
);
```

#### 1.1.7 削除済みメッセージ

```dart
final testDeletedMessageEntity = MessageEntity(
  id: '7',
  conversationId: '1',
  senderId: '1',
  content: 'このメッセージは削除されました',
  mediaAttachments: [],
  quotedMessage: null,
  createdAt: DateTime(2023, 4, 1, 18, 0, 0),
  updatedAt: DateTime(2023, 4, 1, 18, 5, 0),
  status: MessageStatus.sent,
  reactions: [],
  readStatuses: [],
  isEdited: false,
  isDeleted: true,
);
```

### 1.2 ConversationEntityのテストパラメータ

#### 1.2.1 1対1の会話

```dart
final testDirectConversationEntity = ConversationEntity(
  id: '1',
  title: null,
  type: ConversationType.direct,
  status: ConversationStatus.active,
  participants: [
    ParticipantEntity(
      id: '1',
      conversationId: '1',
      userId: '1',
      user: UserEntity(
        id: '1',
        username: 'user1',
        displayName: '山田太郎',
        profileImage: 'https://example.com/user1.jpg',
        awakeningLevel: 3,
        createdAt: DateTime(2023, 1, 1),
        updatedAt: DateTime(2023, 3, 1),
      ),
      role: ParticipantRole.member,
      joinedAt: DateTime(2023, 4, 1),
      leftAt: null,
      isActive: true,
    ),
    ParticipantEntity(
      id: '2',
      conversationId: '1',
      userId: '2',
      user: UserEntity(
        id: '2',
        username: 'user2',
        displayName: '佐藤花子',
        profileImage: 'https://example.com/user2.jpg',
        awakeningLevel: 2,
        createdAt: DateTime(2023, 1, 2),
        updatedAt: DateTime(2023, 3, 2),
      ),
      role: ParticipantRole.member,
      joinedAt: DateTime(2023, 4, 1),
      leftAt: null,
      isActive: true,
    ),
  ],
  lastMessage: MessageEntity(
    id: '10',
    conversationId: '1',
    senderId: '2',
    content: '了解しました！',
    mediaAttachments: [],
    quotedMessage: null,
    createdAt: DateTime(2023, 4, 1, 20, 0, 0),
    updatedAt: null,
    status: MessageStatus.sent,
    reactions: [],
    readStatuses: [],
    isEdited: false,
    isDeleted: false,
  ),
  createdAt: DateTime(2023, 4, 1),
  updatedAt: null,
  lastMessageAt: DateTime(2023, 4, 1, 20, 0, 0),
  unreadCount: 0,
);
```

#### 1.2.2 グループ会話

```dart
final testGroupConversationEntity = ConversationEntity(
  id: '2',
  title: '覚醒チーム',
  type: ConversationType.group,
  status: ConversationStatus.active,
  participants: [
    ParticipantEntity(
      id: '3',
      conversationId: '2',
      userId: '1',
      user: UserEntity(
        id: '1',
        username: 'user1',
        displayName: '山田太郎',
        profileImage: 'https://example.com/user1.jpg',
        awakeningLevel: 3,
        createdAt: DateTime(2023, 1, 1),
        updatedAt: DateTime(2023, 3, 1),
      ),
      role: ParticipantRole.owner,
      joinedAt: DateTime(2023, 4, 2),
      leftAt: null,
      isActive: true,
    ),
    ParticipantEntity(
      id: '4',
      conversationId: '2',
      userId: '2',
      user: UserEntity(
        id: '2',
        username: 'user2',
        displayName: '佐藤花子',
        profileImage: 'https://example.com/user2.jpg',
        awakeningLevel: 2,
        createdAt: DateTime(2023, 1, 2),
        updatedAt: DateTime(2023, 3, 2),
      ),
      role: ParticipantRole.admin,
      joinedAt: DateTime(2023, 4, 2),
      leftAt: null,
      isActive: true,
    ),
    ParticipantEntity(
      id: '5',
      conversationId: '2',
      userId: '3',
      user: UserEntity(
        id: '3',
        username: 'user3',
        displayName: '鈴木一郎',
        profileImage: 'https://example.com/user3.jpg',
        awakeningLevel: 1,
        createdAt: DateTime(2023, 1, 3),
        updatedAt: DateTime(2023, 3, 3),
      ),
      role: ParticipantRole.member,
      joinedAt: DateTime(2023, 4, 2),
      leftAt: null,
      isActive: true,
    ),
  ],
  lastMessage: MessageEntity(
    id: '20',
    conversationId: '2',
    senderId: '1',
    content: '皆さん、次のミーティングは水曜日でお願いします。',
    mediaAttachments: [],
    quotedMessage: null,
    createdAt: DateTime(2023, 4, 2, 16, 0, 0),
    updatedAt: null,
    status: MessageStatus.sent,
    reactions: [],
    readStatuses: [],
    isEdited: false,
    isDeleted: false,
  ),
  createdAt: DateTime(2023, 4, 2),
  updatedAt: null,
  lastMessageAt: DateTime(2023, 4, 2, 16, 0, 0),
  unreadCount: 2,
);
```

#### 1.2.3 アーカイブ済み会話

```dart
final testArchivedConversationEntity = ConversationEntity(
  id: '3',
  title: null,
  type: ConversationType.direct,
  status: ConversationStatus.archived,
  participants: [
    ParticipantEntity(
      id: '6',
      conversationId: '3',
      userId: '1',
      user: UserEntity(
        id: '1',
        username: 'user1',
        displayName: '山田太郎',
        profileImage: 'https://example.com/user1.jpg',
        awakeningLevel: 3,
        createdAt: DateTime(2023, 1, 1),
        updatedAt: DateTime(2023, 3, 1),
      ),
      role: ParticipantRole.member,
      joinedAt: DateTime(2023, 3, 15),
      leftAt: null,
      isActive: true,
    ),
    ParticipantEntity(
      id: '7',
      conversationId: '3',
      userId: '4',
      user: UserEntity(
        id: '4',
        username: 'user4',
        displayName: '田中健太',
        profileImage: 'https://example.com/user4.jpg',
        awakeningLevel: 2,
        createdAt: DateTime(2023, 1, 4),
        updatedAt: DateTime(2023, 3, 4),
      ),
      role: ParticipantRole.member,
      joinedAt: DateTime(2023, 3, 15),
      leftAt: null,
      isActive: true,
    ),
  ],
  lastMessage: MessageEntity(
    id: '30',
    conversationId: '3',
    senderId: '4',
    content: 'プロジェクトは終了しました。お疲れ様でした。',
    mediaAttachments: [],
    quotedMessage: null,
    createdAt: DateTime(2023, 3, 30, 14, 0, 0),
    updatedAt: null,
    status: MessageStatus.read,
    reactions: [],
    readStatuses: [],
    isEdited: false,
    isDeleted: false,
  ),
  createdAt: DateTime(2023, 3, 15),
  updatedAt: DateTime(2023, 4, 1),
  lastMessageAt: DateTime(2023, 3, 30, 14, 0, 0),
  unreadCount: 0,
);
```

### 1.3 MediaAttachmentEntityのテストパラメータ

#### 1.3.1 画像添付

```dart
final testImageAttachmentEntity = MediaAttachmentEntity(
  id: '1',
  messageId: '2',
  type: MediaType.image,
  url: 'https://example.com/image.jpg',
  thumbnailUrl: 'https://example.com/image_thumb.jpg',
  size: 1024 * 1024, // 1MB
  metadata: {
    'width': 800,
    'height': 600,
    'filename': 'image.jpg',
  },
  createdAt: DateTime(2023, 4, 1, 12, 5, 0),
);
```

#### 1.3.2 動画添付

```dart
final testVideoAttachmentEntity = MediaAttachmentEntity(
  id: '2',
  messageId: '3',
  type: MediaType.video,
  url: 'https://example.com/video.mp4',
  thumbnailUrl: 'https://example.com/video_thumb.jpg',
  size: 10 * 1024 * 1024, // 10MB
  metadata: {
    'width': 1280,
    'height': 720,
    'duration': 120, // 秒
    'filename': 'video.mp4',
  },
  createdAt: DateTime(2023, 4, 1, 14, 0, 0),
);
```

#### 1.3.3 音声添付

```dart
final testAudioAttachmentEntity = MediaAttachmentEntity(
  id: '3',
  messageId: '4',
  type: MediaType.audio,
  url: 'https://example.com/audio.mp3',
  thumbnailUrl: null,
  size: 5 * 1024 * 1024, // 5MB
  metadata: {
    'duration': 180, // 秒
    'filename': 'audio.mp3',
  },
  createdAt: DateTime(2023, 4, 1, 16, 0, 0),
);
```

#### 1.3.4 ファイル添付

```dart
final testFileAttachmentEntity = MediaAttachmentEntity(
  id: '4',
  messageId: '5',
  type: MediaType.file,
  url: 'https://example.com/document.pdf',
  thumbnailUrl: null,
  size: 3 * 1024 * 1024, // 3MB
  metadata: {
    'filename': 'document.pdf',
    'mimeType': 'application/pdf',
  },
  createdAt: DateTime(2023, 4, 1, 18, 0, 0),
);
```

### 1.4 ReactionEntityのテストパラメータ

```dart
final testLikeReactionEntity = ReactionEntity(
  id: '1',
  messageId: '5',
  userId: '2',
  type: ReactionType.like,
  createdAt: DateTime(2023, 4, 1, 16, 1, 0),
);

final testLoveReactionEntity = ReactionEntity(
  id: '2',
  messageId: '5',
  userId: '3',
  type: ReactionType.love,
  createdAt: DateTime(2023, 4, 1, 16, 2, 0),
);

final testLaughReactionEntity = ReactionEntity(
  id: '3',
  messageId: '6',
  userId: '2',
  type: ReactionType.laugh,
  createdAt: DateTime(2023, 4, 1, 17, 1, 0),
);

final testWowReactionEntity = ReactionEntity(
  id: '4',
  messageId: '7',
  userId: '3',
  type: ReactionType.wow,
  createdAt: DateTime(2023, 4, 1, 18, 1, 0),
);
```

### 1.5 ReadStatusEntityのテストパラメータ

```dart
final testReadStatusEntity = ReadStatusEntity(
  id: '1',
  messageId: '4',
  userId: '2',
  readAt: DateTime(2023, 4, 1, 15, 1, 0),
);
```

## 2. モデルのテストパラメータ

### 2.1 MessageModelのテストパラメータ

#### 2.1.1 JSON形式（標準的なメッセージ）

```dart
final testMessageJson = {
  'id': '1',
  'conversationId': '1',
  'senderId': '1',
  'content': 'こんにちは！',
  'mediaAttachments': [],
  'quotedMessage': null,
  'createdAt': '2023-04-01T12:00:00.000Z',
  'updatedAt': null,
  'status': 'SENT',
  'reactions': [],
  'readBy': [],
  'isEdited': false,
  'isDeleted': false,
};
```

#### 2.1.2 JSON形式（メディア添付付きメッセージ）

```dart
final testMessageWithMediaJson = {
  'id': '2',
  'conversationId': '1',
  'senderId': '1',
  'content': '写真を送ります',
  'mediaAttachments': [
    {
      'id': '1',
      'messageId': '2',
      'type': 'IMAGE',
      'url': 'https://example.com/image.jpg',
      'thumbnailUrl': 'https://example.com/image_thumb.jpg',
      'size': 1048576,
      'metadata': {
        'width': 800,
        'height': 600,
        'filename': 'image.jpg',
      },
      'createdAt': '2023-04-01T12:05:00.000Z',
    }
  ],
  'quotedMessage': null,
  'createdAt': '2023-04-01T12:05:00.000Z',
  'updatedAt': null,
  'status': 'SENT',
  'reactions': [],
  'readBy': [],
  'isEdited': false,
  'isDeleted': false,
};
```

#### 2.1.3 JSON形式（引用返信付きメッセージ）

```dart
final testMessageWithQuoteJson = {
  'id': '3',
  'conversationId': '1',
  'senderId': '2',
  'content': 'はい、了解しました',
  'mediaAttachments': [],
  'quotedMessage': {
    'id': '1',
    'conversationId': '1',
    'senderId': '1',
    'content': 'こんにちは！',
    'mediaAttachments': [],
    'createdAt': '2023-04-01T12:00:00.000Z',
    'status': 'READ',
    'isEdited': false,
    'isDeleted': false,
  },
  'createdAt': '2023-04-01T12:10:00.000Z',
  'updatedAt': null,
  'status': 'SENT',
  'reactions': [],
  'readBy': [],
  'isEdited': false,
  'isDeleted': false,
};
```

### 2.2 ConversationModelのテストパラメータ

#### 2.2.1 JSON形式（1対1の会話）

```dart
final testDirectConversationJson = {
  'id': '1',
  'title': null,
  'type': 'DIRECT',
  'status': 'ACTIVE',
  'participants': [
    {
      'id': '1',
      'conversationId': '1',
      'userId': '1',
      'user': {
        'id': '1',
        'username': 'user1',
        'displayName': '山田太郎',
        'profileImage': 'https://example.com/user1.jpg',
        'awakeningLevel': 3,
        'createdAt': '2023-01-01T00:00:00.000Z',
        'updatedAt': '2023-03-01T00:00:00.000Z',
      },
      'role': 'MEMBER',
      'joinedAt': '2023-04-01T00:00:00.000Z',
      'leftAt': null,
      'isActive': true,
    },
    {
      'id': '2',
      'conversationId': '1',
      'userId': '2',
      'user': {
        'id': '2',
        'username': 'user2',
        'displayName': '佐藤花子',
        'profileImage': 'https://example.com/user2.jpg',
        'awakeningLevel': 2,
        'createdAt': '2023-01-02T00:00:00.000Z',
        'updatedAt': '2023-03-02T00:00:00.000Z',
      },
      'role': 'MEMBER',
      'joinedAt': '2023-04-01T00:00:00.000Z',
      'leftAt': null,
      'isActive': true,
    },
  ],
  'lastMessage': {
    'id': '10',
    'conversationId': '1',
    'senderId': '2',
    'content': '了解しました！',
    'createdAt': '2023-04-01T20:00:00.000Z',
    'status': 'SENT',
  },
  'createdAt': '2023-04-01T00:00:00.000Z',
  'updatedAt': null,
  'lastMessageAt': '2023-04-01T20:00:00.000Z',
  'unreadCount': 0,
};
```

#### 2.2.2 JSON形式（グループ会話）

```dart
final testGroupConversationJson = {
  'id': '2',
  'title': '覚醒チーム',
  'type': 'GROUP',
  'status': 'ACTIVE',
  'participants': [
    {
      'id': '3',
      'conversationId': '2',
      'userId': '1',
      'user': {
        'id': '1',
        'username': 'user1',
        'displayName': '山田太郎',
        'profileImage': 'https://example.com/user1.jpg',
        'awakeningLevel': 3,
        'createdAt': '2023-01-01T00:00:00.000Z',
        'updatedAt': '2023-03-01T00:00:00.000Z',
      },
      'role': 'OWNER',
      'joinedAt': '2023-04-02T00:00:00.000Z',
      'leftAt': null,
      'isActive': true,
    },
    {
      'id': '4',
      'conversationId': '2',
      'userId': '2',
      'user': {
        'id': '2',
        'username': 'user2',
        'displayName': '佐藤花子',
        'profileImage': 'https://example.com/user2.jpg',
        'awakeningLevel': 2,
        'createdAt': '2023-01-02T00:00:00.000Z',
        'updatedAt': '2023-03-02T00:00:00.000Z',
      },
      'role': 'ADMIN',
      'joinedAt': '2023-04-02T00:00:00.000Z',
      'leftAt': null,
      'isActive': true,
    },
    {
      'id': '5',
      'conversationId': '2',
      'userId': '3',
      'user': {
        'id': '3',
        'username': 'user3',
        'displayName': '鈴木一郎',
        'profileImage': 'https://example.com/user3.jpg',
        'awakeningLevel': 1,
        'createdAt': '2023-01-03T00:00:00.000Z',
        'updatedAt': '2023-03-03T00:00:00.000Z',
      },
      'role': 'MEMBER',
      'joinedAt': '2023-04-02T00:00:00.000Z',
      'leftAt': null,
      'isActive': true,
    },
  ],
  'lastMessage': {
    'id': '20',
    'conversationId': '2',
    'senderId': '1',
    'content': '皆さん、次のミーティングは水曜日でお願いします。',
    'createdAt': '2023-04-02T16:00:00.000Z',
    'status': 'SENT',
  },
  'createdAt': '2023-04-02T00:00:00.000Z',
  'updatedAt': null,
  'lastMessageAt': '2023-04-02T16:00:00.000Z',
  'unreadCount': 2,
};
```

### 2.3 MediaAttachmentModelのテストパラメータ

#### 2.3.1 JSON形式（画像添付）

```dart
final testImageAttachmentJson = {
  'id': '1',
  'messageId': '2',
  'type': 'IMAGE',
  'url': 'https://example.com/image.jpg',
  'thumbnailUrl': 'https://example.com/image_thumb.jpg',
  'size': 1048576,
  'metadata': {
    'width': 800,
    'height': 600,
    'filename': 'image.jpg',
  },
  'createdAt': '2023-04-01T12:05:00.000Z',
};
```

## 3. リポジトリテストのパラメータ

### 3.1 APIレスポンスのテストパラメータ

#### 3.1.1 メッセージ一覧の取得成功

```dart
final getMessagesSuccessResponse = {
  'success': true,
  'data': [
    testMessageJson,
    testMessageWithMediaJson,
    testMessageWithQuoteJson,
  ],
  'meta': {
    'pagination': {
      'hasMore': true,
      'oldestMessageId': '1',
      'newestMessageId': '3',
    }
  }
};
```

#### 3.1.2 メッセージ送信成功

```dart
final sendMessageSuccessResponse = {
  'success': true,
  'data': testMessageJson,
};
```

#### 3.1.3 会話一覧の取得成功

```dart
final getConversationsSuccessResponse = {
  'success': true,
  'data': [
    testDirectConversationJson,
    testGroupConversationJson,
  ],
  'meta': {
    'pagination': {
      'total': 2,
      'limit': 20,
      'offset': 0,
      'hasMore': false,
    }
  }
};
```

#### 3.1.4 会話詳細の取得成功

```dart
final getConversationByIdSuccessResponse = {
  'success': true,
  'data': testDirectConversationJson,
};
```

#### 3.1.5 エラーレスポンス

```dart
final serverErrorResponse = {
  'success': false,
  'error': {
    'message': 'サーバーエラーが発生しました',
    'code': 'SERVER_ERROR',
    'details': {
      'stack': '...'
    }
  }
};

final notFoundErrorResponse = {
  'success': false,
  'error': {
    'message': '指定されたリソースが見つかりません',
    'code': 'NOT_FOUND',
  }
};

final validationErrorResponse = {
  'success': false,
  'error': {
    'message': '入力値が不正です',
    'code': 'VALIDATION_ERROR',
    'details': {
      'content': 'テキストは必須です'
    }
  }
};
```

## 4. ビューモデルテストのパラメータ

### 4.1 MessageViewModelのテストパラメータ

```dart
// 初期状態のメッセージリスト
final initialMessageList = <MessageEntity>[];

// 3件のメッセージを含むリスト
final populatedMessageList = [
  testMessageEntity,
  testMessageWithMediaEntity,
  testMessageWithQuoteEntity,
];

// 追加の3件のメッセージ
final additionalMessageList = [
  testMessageWithReadStatusEntity,
  testMessageWithReactionEntity,
  testEditedMessageEntity,
];

// 結合された6件のメッセージリスト
final combinedMessageList = [
  ...populatedMessageList,
  ...additionalMessageList,
];
```

### 4.2 ConversationViewModelのテストパラメータ

```dart
// 初期状態の会話リスト
final initialConversationList = <ConversationEntity>[];

// 3件の会話を含むリスト
final populatedConversationList = [
  testDirectConversationEntity,
  testGroupConversationEntity,
  testArchivedConversationEntity,
];

// アクティブな会話のみ
final activeConversationList = [
  testDirectConversationEntity,
  testGroupConversationEntity,
];

// アーカイブ済みの会話のみ
final archivedConversationList = [
  testArchivedConversationEntity,
];
```

## 5. 失敗シナリオのテストパラメータ

### 5.1 接続エラー

```dart
final connectionFailure = NetworkFailure(
  message: 'ネットワーク接続を確認してください',
);
```

### 5.2 サーバーエラー

```dart
final serverFailure = ServerFailure(
  message: 'サーバーエラーが発生しました',
);
```

### 5.3 認証エラー

```dart
final authenticationFailure = AuthenticationFailure(
  message: '認証情報が無効です',
);
```

### 5.4 検証エラー

```dart
final validationFailure = ValidationFailure(
  message: '入力値が不正です',
);
```

### 5.5 リソース未発見エラー

```dart
final notFoundFailure = NotFoundFailure(
  message: '指定されたリソースが見つかりません',
);
```

## 6. UIテストのパラメータ

### 6.1 ダミーユーザー

```dart
final testUser1 = UserEntity(
  id: '1',
  username: 'user1',
  displayName: '山田太郎',
  profileImage: 'https://example.com/user1.jpg',
  awakeningLevel: 3,
  createdAt: DateTime(2023, 1, 1),
  updatedAt: DateTime(2023, 3, 1),
);

final testUser2 = UserEntity(
  id: '2',
  username: 'user2',
  displayName: '佐藤花子',
  profileImage: 'https://example.com/user2.jpg',
  awakeningLevel: 2,
  createdAt: DateTime(2023, 1, 2),
  updatedAt: DateTime(2023, 3, 2),
);

final testUser3 = UserEntity(
  id: '3',
  username: 'user3',
  displayName: '鈴木一郎',
  profileImage: 'https://example.com/user3.jpg',
  awakeningLevel: 1,
  createdAt: DateTime(2023, 1, 3),
  updatedAt: DateTime(2023, 3, 3),
);
```

### 6.2 タップイベントのダミーデータ

```dart
final testTapEvent = PointerDownEvent(
  position: Offset(150, 150),
);

final testLongPressEvent = LongPressStartDetails(
  globalPosition: Offset(150, 150),
  localPosition: Offset(150, 150),
);
```

### 6.3 テスト用入力テキスト

```dart
final testInputMessage = 'これはテストメッセージです';
final testEmptyMessage = '';
final testLongMessage = 'これは300文字を超える長いメッセージです...' * 10; // 長いテキスト
```

## 7. リアルタイム更新のテストパラメータ

### 7.1 新しいメッセージイベント

```dart
final newMessageEvent = {
  'event': 'message:new',
  'data': {
    'id': '100',
    'conversationId': '1',
    'senderId': '2',
    'content': '新しいメッセージです',
    'mediaAttachments': [],
    'quotedMessage': null,
    'createdAt': '2023-04-01T21:00:00.000Z',
    'updatedAt': null,
    'status': 'SENT',
    'reactions': [],
    'readBy': [],
    'isEdited': false,
    'isDeleted': false,
  }
};
```

### 7.2 メッセージ更新イベント

```dart
final messageUpdateEvent = {
  'event': 'message:update',
  'data': {
    'id': '1',
    'conversationId': '1',
    'content': '更新されたメッセージ内容',
    'updatedAt': '2023-04-01T21:05:00.000Z',
    'isEdited': true,
  }
};
```

### 7.3 メッセージ削除イベント

```dart
final messageDeleteEvent = {
  'event': 'message:delete',
  'data': {
    'id': '2',
    'conversationId': '1',
    'isDeleted': true,
    'deletedAt': '2023-04-01T21:10:00.000Z',
  }
};
```

### 7.4 既読ステータスイベント

```dart
final readStatusEvent = {
  'event': 'message:read',
  'data': {
    'messageId': '3',
    'userId': '1',
    'readAt': '2023-04-01T21:15:00.000Z',
  }
};
```

### 7.5 リアクション追加イベント

```dart
final reactionAddEvent = {
  'event': 'reaction:add',
  'data': {
    'id': '10',
    'messageId': '3',
    'userId': '1',
    'reactionType': 'LIKE',
    'createdAt': '2023-04-01T21:20:00.000Z',
  }
};
```

### 7.6 リアクション削除イベント

```dart
final reactionRemoveEvent = {
  'event': 'reaction:remove',
  'data': {
    'messageId': '3',
    'userId': '1',
    'reactionType': 'LIKE',
  }
};
```

## 8. オフラインテストのパラメータ

### 8.1 オフラインキューのダミーデータ

```dart
final offlineQueuedMessages = [
  {
    'id': 'local-1',
    'conversationId': '1',
    'senderId': '1',
    'content': 'オフライン中に作成されたメッセージ1',
    'mediaAttachments': [],
    'quotedMessage': null,
    'createdAt': '2023-04-01T22:00:00.000Z',
    'status': 'SENDING',
  },
  {
    'id': 'local-2',
    'conversationId': '1',
    'senderId': '1',
    'content': 'オフライン中に作成されたメッセージ2',
    'mediaAttachments': [],
    'quotedMessage': null,
    'createdAt': '2023-04-01T22:05:00.000Z',
    'status': 'SENDING',
  },
];
```

### 8.2 オフラインキャッシュのダミーデータ

```dart
final offlineCachedConversations = [
  testDirectConversationJson,
  testGroupConversationJson,
];

final offlineCachedMessages = [
  testMessageJson,
  testMessageWithMediaJson,
  testMessageWithQuoteJson,
];
```

## 9. パフォーマンステストのパラメータ

### 9.1 大量データのテストパラメータ

```dart
// 1000件のダミーメッセージを生成
List<MessageEntity> generateBulkMessages(int count) {
  return List.generate(count, (index) => 
    MessageEntity(
      id: 'bulk-${index + 1}',
      conversationId: '1',
      senderId: index % 2 == 0 ? '1' : '2',
      content: 'これはテストメッセージ ${index + 1} です',
      mediaAttachments: [],
      quotedMessage: null,
      createdAt: DateTime(2023, 4, 1).add(Duration(minutes: index)),
      updatedAt: null,
      status: MessageStatus.sent,
      reactions: [],
      readStatuses: [],
      isEdited: false,
      isDeleted: false,
    )
  );
}

// 100件のダミー会話を生成
List<ConversationEntity> generateBulkConversations(int count) {
  return List.generate(count, (index) => 
    ConversationEntity(
      id: 'bulk-${index + 1}',
      title: index % 3 == 0 ? 'グループ ${index + 1}' : null,
      type: index % 3 == 0 ? ConversationType.group : ConversationType.direct,
      status: index % 5 == 0 ? ConversationStatus.archived : ConversationStatus.active,
      participants: [
        ParticipantEntity(
          id: 'p-${index}-1',
          conversationId: 'bulk-${index + 1}',
          userId: '1',
          user: testUser1,
          role: index % 3 == 0 ? ParticipantRole.owner : ParticipantRole.member,
          joinedAt: DateTime(2023, 3, 1),
          leftAt: null,
          isActive: true,
        ),
        ParticipantEntity(
          id: 'p-${index}-2',
          conversationId: 'bulk-${index + 1}',
          userId: '2',
          user: testUser2,
          role: ParticipantRole.member,
          joinedAt: DateTime(2023, 3, 1),
          leftAt: null,
          isActive: true,
        ),
      ],
      lastMessage: MessageEntity(
        id: 'last-${index + 1}',
        conversationId: 'bulk-${index + 1}',
        senderId: index % 2 == 0 ? '1' : '2',
        content: 'これは最後のメッセージ ${index + 1} です',
        mediaAttachments: [],
        quotedMessage: null,
        createdAt: DateTime(2023, 4, 1).add(Duration(hours: index)),
        updatedAt: null,
        status: MessageStatus.sent,
        reactions: [],
        readStatuses: [],
        isEdited: false,
        isDeleted: false,
      ),
      createdAt: DateTime(2023, 3, 1),
      updatedAt: null,
      lastMessageAt: DateTime(2023, 4, 1).add(Duration(hours: index)),
      unreadCount: index % 3,
    )
  );
}
```