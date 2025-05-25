# ダイレクトメッセージ機能テスト仕様書

## 概要

本書はダイレクトメッセージ機能のTDD実装のためのテスト仕様書です。
APIユニットテスト、UIユニットテスト、結合テスト、E2Eテストの4種類のテストケースを定義します。

### 使用ライブラリ
- jest-expo@~53.0.0
- @testing-library/react-native@^13
- @testing-library/jest-native@^6
- react-native-reanimated/mock

### テスト方針
- 可能な限りモックを使用せず、実際のAPIとコンポーネントとの統合を重視
- E2E暗号化、WebSocketリアルタイム通信、ファイルアップロードなどの複雑な機能も含めてテスト
- カバレッジ目標：≥90%

## 1. APIユニットテスト

### 1.1 DM会話開始API

#### Test: POST /dm/threads/{userId} - 新規スレッド作成

```typescript
describe('POST /dm/threads/{userId}', () => {
  it('新規DMスレッドを作成できる', async () => {
    // Arrange
    const recipientUserId = 'user-456';
    
    // Act
    const response = await dmAPI.createThread(recipientUserId);
    
    // Assert
    expect(response.status).toBe(201);
    expect(response.data.id).toBeDefined();
    expect(response.data.user1.id).toBe(currentUser.id);
    expect(response.data.user2.id).toBe(recipientUserId);
    expect(response.data.createdAt).toBeDefined();
  });

  it('既存スレッドが存在する場合は既存スレッドを返す', async () => {
    // Arrange
    const recipientUserId = 'user-456';
    await dmAPI.createThread(recipientUserId);
    
    // Act
    const response = await dmAPI.createThread(recipientUserId);
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.data.id).toBeDefined();
  });

  it('存在しないユーザーIDで404エラーが返る', async () => {
    // Arrange
    const invalidUserId = 'invalid-user-id';
    
    // Act & Assert
    await expect(dmAPI.createThread(invalidUserId))
      .rejects.toMatchObject({
        response: { status: 404 }
      });
  });

  it('認証されていない場合401エラーが返る', async () => {
    // Arrange
    const recipientUserId = 'user-456';
    dmAPI.setAuthToken(null);
    
    // Act & Assert
    await expect(dmAPI.createThread(recipientUserId))
      .rejects.toMatchObject({
        response: { status: 401 }
      });
  });
});
```

#### Test: GET /dm/threads - スレッド一覧取得

```typescript
describe('GET /dm/threads', () => {
  it('DMスレッド一覧を取得できる', async () => {
    // Arrange
    await dmAPI.createThread('user-456');
    await dmAPI.createThread('user-789');
    
    // Act
    const response = await dmAPI.getThreads();
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.data.items).toHaveLength(2);
    expect(response.data.items[0]).toMatchObject({
      id: expect.any(String),
      user1: expect.objectContaining({ id: expect.any(String) }),
      user2: expect.objectContaining({ id: expect.any(String) }),
      createdAt: expect.any(String)
    });
  });

  it('未読数が正しく表示される', async () => {
    // Arrange
    const threadId = await dmAPI.createThread('user-456');
    await dmAPI.sendMessage(threadId.data.id, {
      messageType: 'text',
      textContent: 'Test message'
    });
    
    // Act (別ユーザーでスレッド取得)
    const response = await dmAPI.getThreads();
    
    // Assert
    expect(response.data.items[0].unreadCount).toBe(1);
  });

  it('ページネーションが正しく動作する', async () => {
    // Arrange
    for (let i = 0; i < 25; i++) {
      await dmAPI.createThread(`user-${i}`);
    }
    
    // Act
    const firstPage = await dmAPI.getThreads();
    const secondPage = await dmAPI.getThreads({ cursor: firstPage.data.nextCursor });
    
    // Assert
    expect(firstPage.data.items).toHaveLength(20);
    expect(secondPage.data.items).toHaveLength(5);
    expect(firstPage.data.nextCursor).toBeDefined();
    expect(secondPage.data.nextCursor).toBeNull();
  });
});
```

### 1.2 メッセージ送信API

#### Test: POST /dm/threads/{threadId}/messages - テキストメッセージ送信

```typescript
describe('POST /dm/threads/{threadId}/messages', () => {
  let threadId: string;
  
  beforeEach(async () => {
    const thread = await dmAPI.createThread('user-456');
    threadId = thread.data.id;
  });

  it('テキストメッセージを送信できる', async () => {
    // Arrange
    const messageData = {
      messageType: 'text',
      textContent: 'Hello, World!'
    };
    
    // Act
    const response = await dmAPI.sendMessage(threadId, messageData);
    
    // Assert
    expect(response.status).toBe(201);
    expect(response.data.messageType).toBe('text');
    expect(response.data.textContent).toBe('Hello, World!');
    expect(response.data.isRead).toBe(false);
    expect(response.data.createdAt).toBeDefined();
  });

  it('画像メッセージを送信できる', async () => {
    // Arrange
    const imageFile = new FormData();
    imageFile.append('file', {
      uri: 'test-image.jpg',
      type: 'image/jpeg',
      name: 'test.jpg'
    } as any);
    
    const messageData = {
      messageType: 'image',
      file: imageFile
    };
    
    // Act
    const response = await dmAPI.sendMessage(threadId, messageData);
    
    // Assert
    expect(response.status).toBe(201);
    expect(response.data.messageType).toBe('image');
    expect(response.data.mediaUrl).toBeDefined();
    expect(response.data.mediaUrl).toMatch(/^https:\/\//);
  });

  it('音声メッセージを送信できる', async () => {
    // Arrange
    const audioFile = new FormData();
    audioFile.append('file', {
      uri: 'test-audio.m4a',
      type: 'audio/m4a',
      name: 'test.m4a'
    } as any);
    
    const messageData = {
      messageType: 'audio',
      file: audioFile
    };
    
    // Act
    const response = await dmAPI.sendMessage(threadId, messageData);
    
    // Assert
    expect(response.status).toBe(201);
    expect(response.data.messageType).toBe('audio');
    expect(response.data.mediaUrl).toBeDefined();
  });

  it('空のテキストでバリデーションエラーが返る', async () => {
    // Arrange
    const messageData = {
      messageType: 'text',
      textContent: ''
    };
    
    // Act & Assert
    await expect(dmAPI.sendMessage(threadId, messageData))
      .rejects.toMatchObject({
        response: { status: 400 }
      });
  });

  it('10000文字を超えるテキストでバリデーションエラーが返る', async () => {
    // Arrange
    const longText = 'a'.repeat(10001);
    const messageData = {
      messageType: 'text',
      textContent: longText
    };
    
    // Act & Assert
    await expect(dmAPI.sendMessage(threadId, messageData))
      .rejects.toMatchObject({
        response: { status: 400 }
      });
  });

  it('存在しないスレッドIDで404エラーが返る', async () => {
    // Arrange
    const invalidThreadId = 'invalid-thread-id';
    const messageData = {
      messageType: 'text',
      textContent: 'Hello'
    };
    
    // Act & Assert
    await expect(dmAPI.sendMessage(invalidThreadId, messageData))
      .rejects.toMatchObject({
        response: { status: 404 }
      });
  });
});
```

### 1.3 既読処理API

#### Test: PUT /dm/messages/{messageId}/read - 既読状態更新

```typescript
describe('PUT /dm/messages/{messageId}/read', () => {
  let threadId: string;
  let messageId: string;
  
  beforeEach(async () => {
    const thread = await dmAPI.createThread('user-456');
    threadId = thread.data.id;
    
    const message = await dmAPI.sendMessage(threadId, {
      messageType: 'text',
      textContent: 'Test message'
    });
    messageId = message.data.id;
  });

  it('メッセージを既読にできる', async () => {
    // Act
    const response = await dmAPI.markAsRead(messageId);
    
    // Assert
    expect(response.status).toBe(200);
    
    // メッセージの既読状態を確認
    const messages = await dmAPI.getMessages(threadId);
    const message = messages.data.items.find(m => m.id === messageId);
    expect(message.isRead).toBe(true);
  });

  it('既に既読のメッセージは正常処理される', async () => {
    // Arrange
    await dmAPI.markAsRead(messageId);
    
    // Act
    const response = await dmAPI.markAsRead(messageId);
    
    // Assert
    expect(response.status).toBe(200);
  });

  it('存在しないメッセージIDで404エラーが返る', async () => {
    // Arrange
    const invalidMessageId = 'invalid-message-id';
    
    // Act & Assert
    await expect(dmAPI.markAsRead(invalidMessageId))
      .rejects.toMatchObject({
        response: { status: 404 }
      });
  });

  it('他人のメッセージを既読にしようとすると403エラーが返る', async () => {
    // Arrange (他のユーザーでログイン)
    dmAPI.setAuthToken('other-user-token');
    
    // Act & Assert
    await expect(dmAPI.markAsRead(messageId))
      .rejects.toMatchObject({
        response: { status: 403 }
      });
  });
});
```

### 1.4 メッセージ履歴取得API

#### Test: GET /dm/threads/{threadId}/messages - メッセージ履歴取得

```typescript
describe('GET /dm/threads/{threadId}/messages', () => {
  let threadId: string;
  
  beforeEach(async () => {
    const thread = await dmAPI.createThread('user-456');
    threadId = thread.data.id;
  });

  it('メッセージ履歴を取得できる', async () => {
    // Arrange
    await dmAPI.sendMessage(threadId, {
      messageType: 'text',
      textContent: 'Message 1'
    });
    await dmAPI.sendMessage(threadId, {
      messageType: 'text',
      textContent: 'Message 2'
    });
    
    // Act
    const response = await dmAPI.getMessages(threadId);
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.data.items).toHaveLength(2);
    expect(response.data.items[0].textContent).toBe('Message 2'); // 新しい順
    expect(response.data.items[1].textContent).toBe('Message 1');
  });

  it('暗号化されたメッセージが復号化される', async () => {
    // Arrange
    await dmAPI.sendMessage(threadId, {
      messageType: 'text',
      textContent: 'Encrypted message'
    });
    
    // Act
    const response = await dmAPI.getMessages(threadId);
    
    // Assert
    expect(response.data.items[0].textContent).toBe('Encrypted message');
    // 実際の実装では暗号化されたデータがクライアントで復号化される
  });

  it('ページネーションが正しく動作する', async () => {
    // Arrange
    for (let i = 0; i < 25; i++) {
      await dmAPI.sendMessage(threadId, {
        messageType: 'text',
        textContent: `Message ${i}`
      });
    }
    
    // Act
    const firstPage = await dmAPI.getMessages(threadId);
    const secondPage = await dmAPI.getMessages(threadId, { 
      cursor: firstPage.data.nextCursor 
    });
    
    // Assert
    expect(firstPage.data.items).toHaveLength(20);
    expect(secondPage.data.items).toHaveLength(5);
  });
});
```

## 2. UIユニットテスト

### 2.1 DMスレッド一覧コンポーネント

#### Test: MessageList Component

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MessageList } from '../components/MessageList';
import { DMProvider } from '../context/DMContext';

describe('MessageList Component', () => {
  const mockThreads = [
    {
      id: 'thread-1',
      user1: { id: 'user-1', displayName: 'Alice' },
      user2: { id: 'user-2', displayName: 'Bob' },
      lastMessage: {
        textContent: 'Hello',
        createdAt: '2024-01-01T10:00:00Z'
      },
      unreadCount: 2
    },
    {
      id: 'thread-2',
      user1: { id: 'user-1', displayName: 'Alice' },
      user2: { id: 'user-3', displayName: 'Charlie' },
      lastMessage: {
        textContent: 'Hi there',
        createdAt: '2024-01-01T09:00:00Z'
      },
      unreadCount: 0
    }
  ];

  it('DMスレッド一覧を表示できる', () => {
    // Act
    render(
      <DMProvider>
        <MessageList threads={mockThreads} />
      </DMProvider>
    );
    
    // Assert
    expect(screen.getByText('Bob')).toBeTruthy();
    expect(screen.getByText('Charlie')).toBeTruthy();
    expect(screen.getByText('Hello')).toBeTruthy();
    expect(screen.getByText('Hi there')).toBeTruthy();
  });

  it('未読バッジが正しく表示される', () => {
    // Act
    render(
      <DMProvider>
        <MessageList threads={mockThreads} />
      </DMProvider>
    );
    
    // Assert
    expect(screen.getByText('2')).toBeTruthy(); // 未読バッジ
    expect(screen.queryByText('0')).toBeNull(); // 未読0は非表示
  });

  it('スレッドタップで詳細画面に遷移する', () => {
    // Arrange
    const mockNavigation = { navigate: jest.fn() };
    
    // Act
    render(
      <DMProvider>
        <MessageList 
          threads={mockThreads} 
          navigation={mockNavigation}
        />
      </DMProvider>
    );
    
    fireEvent.press(screen.getByText('Bob'));
    
    // Assert
    expect(mockNavigation.navigate).toHaveBeenCalledWith('MessageDetail', {
      threadId: 'thread-1'
    });
  });

  it('プルツーリフレッシュが動作する', async () => {
    // Arrange
    const mockRefresh = jest.fn();
    
    // Act
    render(
      <DMProvider>
        <MessageList 
          threads={mockThreads}
          onRefresh={mockRefresh}
        />
      </DMProvider>
    );
    
    const scrollView = screen.getByTestId('message-list-scroll');
    fireEvent(scrollView, 'refresh');
    
    // Assert
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('空の状態が表示される', () => {
    // Act
    render(
      <DMProvider>
        <MessageList threads={[]} />
      </DMProvider>
    );
    
    // Assert
    expect(screen.getByText('まだメッセージがありません')).toBeTruthy();
    expect(screen.getByText('新しいメッセージを開始')).toBeTruthy();
  });

  it('ロード中状態が表示される', () => {
    // Act
    render(
      <DMProvider>
        <MessageList threads={[]} loading={true} />
      </DMProvider>
    );
    
    // Assert
    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });
});
```

### 2.2 メッセージ詳細コンポーネント

#### Test: MessageDetail Component

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MessageDetail } from '../components/MessageDetail';
import { DMProvider } from '../context/DMContext';

describe('MessageDetail Component', () => {
  const mockMessages = [
    {
      id: 'msg-1',
      sender: { id: 'user-2', displayName: 'Bob' },
      messageType: 'text',
      textContent: 'Hello Alice!',
      isRead: true,
      createdAt: '2024-01-01T10:00:00Z'
    },
    {
      id: 'msg-2',
      sender: { id: 'user-1', displayName: 'Alice' },
      messageType: 'text',
      textContent: 'Hi Bob!',
      isRead: false,
      createdAt: '2024-01-01T10:01:00Z'
    }
  ];

  const mockThread = {
    id: 'thread-1',
    user1: { id: 'user-1', displayName: 'Alice' },
    user2: { id: 'user-2', displayName: 'Bob' }
  };

  it('メッセージ履歴を表示できる', () => {
    // Act
    render(
      <DMProvider>
        <MessageDetail 
          thread={mockThread}
          messages={mockMessages}
        />
      </DMProvider>
    );
    
    // Assert
    expect(screen.getByText('Hello Alice!')).toBeTruthy();
    expect(screen.getByText('Hi Bob!')).toBeTruthy();
  });

  it('送信者によってメッセージの配置が変わる', () => {
    // Act
    render(
      <DMProvider>
        <MessageDetail 
          thread={mockThread}
          messages={mockMessages}
          currentUserId="user-1"
        />
      </DMProvider>
    );
    
    // Assert
    const bobMessage = screen.getByTestId('message-msg-1');
    const aliceMessage = screen.getByTestId('message-msg-2');
    
    expect(bobMessage).toHaveStyle({ alignSelf: 'flex-start' }); // 左寄せ
    expect(aliceMessage).toHaveStyle({ alignSelf: 'flex-end' }); // 右寄せ
  });

  it('既読マークが表示される', () => {
    // Act
    render(
      <DMProvider>
        <MessageDetail 
          thread={mockThread}
          messages={mockMessages}
          currentUserId="user-1"
        />
      </DMProvider>
    );
    
    // Assert
    const readMessage = screen.getByTestId('message-msg-1');
    expect(readMessage).toContainElement(screen.getByText('✓✓'));
  });

  it('メッセージ送信ができる', async () => {
    // Arrange
    const mockSendMessage = jest.fn();
    
    // Act
    render(
      <DMProvider>
        <MessageDetail 
          thread={mockThread}
          messages={mockMessages}
          onSendMessage={mockSendMessage}
        />
      </DMProvider>
    );
    
    const input = screen.getByPlaceholderText('メッセージを入力...');
    const sendButton = screen.getByTestId('send-button');
    
    fireEvent.changeText(input, 'New message');
    fireEvent.press(sendButton);
    
    // Assert
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith({
        messageType: 'text',
        textContent: 'New message'
      });
    });
    
    expect(input.props.value).toBe(''); // 送信後にクリア
  });

  it('空のメッセージは送信できない', () => {
    // Arrange
    const mockSendMessage = jest.fn();
    
    // Act
    render(
      <DMProvider>
        <MessageDetail 
          thread={mockThread}
          messages={mockMessages}
          onSendMessage={mockSendMessage}
        />
      </DMProvider>
    );
    
    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);
    
    // Assert
    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(sendButton).toBeDisabled();
  });
});
```

### 2.3 メッセージ入力コンポーネント

#### Test: MessageInput Component

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MessageInput } from '../components/MessageInput';

describe('MessageInput Component', () => {
  it('テキスト入力ができる', () => {
    // Arrange
    const mockOnSend = jest.fn();
    
    // Act
    render(<MessageInput onSend={mockOnSend} />);
    
    const input = screen.getByPlaceholderText('メッセージを入力...');
    fireEvent.changeText(input, 'Hello World');
    
    // Assert
    expect(input.props.value).toBe('Hello World');
  });

  it('画像選択ボタンが動作する', async () => {
    // Arrange
    const mockOnSend = jest.fn();
    const mockImagePicker = jest.fn().mockResolvedValue({
      uri: 'test-image.jpg',
      type: 'image/jpeg'
    });
    
    // Act
    render(
      <MessageInput 
        onSend={mockOnSend}
        imagePicker={mockImagePicker}
      />
    );
    
    const imageButton = screen.getByTestId('image-picker-button');
    fireEvent.press(imageButton);
    
    // Assert
    await waitFor(() => {
      expect(mockImagePicker).toHaveBeenCalled();
    });
  });

  it('音声録音ボタンが動作する', async () => {
    // Arrange
    const mockOnSend = jest.fn();
    const mockAudioRecorder = {
      startRecording: jest.fn(),
      stopRecording: jest.fn().mockResolvedValue('audio-file.m4a')
    };
    
    // Act
    render(
      <MessageInput 
        onSend={mockOnSend}
        audioRecorder={mockAudioRecorder}
      />
    );
    
    const recordButton = screen.getByTestId('audio-record-button');
    
    // 録音開始
    fireEvent.press(recordButton);
    expect(mockAudioRecorder.startRecording).toHaveBeenCalled();
    
    // 録音停止
    fireEvent.press(recordButton);
    
    // Assert
    await waitFor(() => {
      expect(mockAudioRecorder.stopRecording).toHaveBeenCalled();
    });
  });

  it('文字数制限が表示される', () => {
    // Arrange
    const mockOnSend = jest.fn();
    
    // Act
    render(<MessageInput onSend={mockOnSend} maxLength={10000} />);
    
    const input = screen.getByPlaceholderText('メッセージを入力...');
    fireEvent.changeText(input, 'Hello');
    
    // Assert
    expect(screen.getByText('5/10000')).toBeTruthy();
  });

  it('文字数制限を超えると警告が表示される', () => {
    // Arrange
    const mockOnSend = jest.fn();
    const longText = 'a'.repeat(10001);
    
    // Act
    render(<MessageInput onSend={mockOnSend} maxLength={10000} />);
    
    const input = screen.getByPlaceholderText('メッセージを入力...');
    fireEvent.changeText(input, longText);
    
    // Assert
    expect(screen.getByText('文字数制限を超えています')).toBeTruthy();
    expect(screen.getByTestId('send-button')).toBeDisabled();
  });
});
```

## 3. 結合テスト

### 3.1 DM機能全体の統合テスト

#### Test: DM Flow Integration

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { DMNavigator } from '../navigation/DMNavigator';
import { DMProvider } from '../context/DMContext';
import { setupTestServer } from '../__tests__/utils/testServer';

describe('DM機能統合テスト', () => {
  let testServer: any;
  
  beforeAll(() => {
    testServer = setupTestServer();
  });
  
  afterAll(() => {
    testServer.close();
  });

  it('DM会話開始から送信まで一連の流れが動作する', async () => {
    // Arrange
    render(
      <NavigationContainer>
        <DMProvider>
          <DMNavigator />
        </DMProvider>
      </NavigationContainer>
    );
    
    // Act 1: 新規メッセージ画面へ遷移
    const newMessageButton = screen.getByTestId('new-message-button');
    fireEvent.press(newMessageButton);
    
    await waitFor(() => {
      expect(screen.getByText('新しいメッセージ')).toBeTruthy();
    });
    
    // Act 2: ユーザー選択
    const userSearchInput = screen.getByPlaceholderText('ユーザーを検索...');
    fireEvent.changeText(userSearchInput, 'Bob');
    
    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeTruthy();
    });
    
    fireEvent.press(screen.getByText('Bob'));
    
    // Act 3: メッセージ送信
    await waitFor(() => {
      expect(screen.getByPlaceholderText('メッセージを入力...')).toBeTruthy();
    });
    
    const messageInput = screen.getByPlaceholderText('メッセージを入力...');
    fireEvent.changeText(messageInput, 'Hello Bob!');
    
    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Hello Bob!')).toBeTruthy();
    });
  });

  it('画像メッセージ送信が動作する', async () => {
    // Arrange
    const mockImagePicker = jest.fn().mockResolvedValue({
      uri: 'test-image.jpg',
      type: 'image/jpeg',
      fileName: 'test.jpg'
    });
    
    render(
      <NavigationContainer>
        <DMProvider imagePicker={mockImagePicker}>
          <DMNavigator initialRouteName="MessageDetail" 
                      initialParams={{ threadId: 'test-thread' }} />
        </DMProvider>
      </NavigationContainer>
    );
    
    // Act
    const imageButton = screen.getByTestId('image-picker-button');
    fireEvent.press(imageButton);
    
    await waitFor(() => {
      expect(mockImagePicker).toHaveBeenCalled();
    });
    
    // 画像選択後の送信確認ダイアログ
    await waitFor(() => {
      expect(screen.getByText('画像を送信しますか？')).toBeTruthy();
    });
    
    const confirmButton = screen.getByText('送信');
    fireEvent.press(confirmButton);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('image-message')).toBeTruthy();
    });
  });

  it('既読処理がリアルタイムで反映される', async () => {
    // Arrange
    render(
      <NavigationContainer>
        <DMProvider>
          <DMNavigator initialRouteName="MessageDetail" 
                      initialParams={{ threadId: 'test-thread' }} />
        </DMProvider>
      </NavigationContainer>
    );
    
    // 未読メッセージがある状態
    await waitFor(() => {
      expect(screen.getByText('未読のメッセージ')).toBeTruthy();
    });
    
    // Act: 画面を表示することで既読処理が実行される
    await waitFor(() => {
      expect(screen.getByText('✓✓')).toBeTruthy(); // 既読マーク
    });
  });
});
```

### 3.2 E2E暗号化統合テスト

#### Test: E2E Encryption Integration

```typescript
import { CryptoService } from '../services/CryptoService';
import { DMService } from '../services/DMService';

describe('E2E暗号化統合テスト', () => {
  let cryptoService: CryptoService;
  let dmService: DMService;
  
  beforeEach(() => {
    cryptoService = new CryptoService();
    dmService = new DMService(cryptoService);
  });

  it('メッセージのE2E暗号化・復号化が正しく動作する', async () => {
    // Arrange
    const originalMessage = 'Secret message';
    const senderKeyPair = await cryptoService.generateKeyPair();
    const recipientKeyPair = await cryptoService.generateKeyPair();
    
    // Act 1: 送信時の暗号化
    const encryptedData = await dmService.encryptMessage(
      originalMessage,
      recipientKeyPair.publicKey
    );
    
    expect(encryptedData.encryptedContent).not.toBe(originalMessage);
    expect(encryptedData.encryptedKey).toBeDefined();
    
    // Act 2: 受信時の復号化
    const decryptedMessage = await dmService.decryptMessage(
      encryptedData,
      recipientKeyPair.privateKey
    );
    
    // Assert
    expect(decryptedMessage).toBe(originalMessage);
  });

  it('画像ファイルのE2E暗号化が動作する', async () => {
    // Arrange
    const imageData = 'base64-encoded-image-data';
    const recipientKeyPair = await cryptoService.generateKeyPair();
    
    // Act 1: 画像暗号化
    const encryptedImage = await dmService.encryptMedia(
      imageData,
      'image/jpeg',
      recipientKeyPair.publicKey
    );
    
    expect(encryptedImage.encryptedContent).not.toBe(imageData);
    
    // Act 2: 画像復号化
    const decryptedImage = await dmService.decryptMedia(
      encryptedImage,
      recipientKeyPair.privateKey
    );
    
    // Assert
    expect(decryptedImage).toBe(imageData);
  });

  it('鍵の交換が正しく動作する', async () => {
    // Arrange
    const user1 = { id: 'user-1' };
    const user2 = { id: 'user-2' };
    
    // Act 1: 両ユーザーの鍵ペア生成
    const user1Keys = await cryptoService.generateKeyPair();
    const user2Keys = await cryptoService.generateKeyPair();
    
    // 公開鍵をサーバーに保存
    await dmService.savePublicKey(user1.id, user1Keys.publicKey);
    await dmService.savePublicKey(user2.id, user2Keys.publicKey);
    
    // Act 2: 鍵取得と検証
    const retrievedUser2PublicKey = await dmService.getPublicKey(user2.id);
    
    // Assert
    expect(retrievedUser2PublicKey).toBe(user2Keys.publicKey);
  });
});
```

### 3.3 WebSocketリアルタイム通信統合テスト

#### Test: WebSocket Real-time Integration

```typescript
import { WebSocketService } from '../services/WebSocketService';
import { DMService } from '../services/DMService';

describe('WebSocketリアルタイム通信統合テスト', () => {
  let wsService: WebSocketService;
  let dmService: DMService;
  
  beforeEach(() => {
    wsService = new WebSocketService();
    dmService = new DMService();
  });
  
  afterEach(() => {
    wsService.disconnect();
  });

  it('メッセージ送信がリアルタイムで通知される', async () => {
    // Arrange
    const threadId = 'test-thread';
    const messageListener = jest.fn();
    
    await wsService.connect();
    wsService.subscribeToThread(threadId, messageListener);
    
    // Act
    await dmService.sendMessage(threadId, {
      messageType: 'text',
      textContent: 'Real-time message'
    });
    
    // Assert
    await waitFor(() => {
      expect(messageListener).toHaveBeenCalledWith({
        type: 'new_message',
        threadId,
        message: expect.objectContaining({
          textContent: 'Real-time message'
        })
      });
    });
  });

  it('既読状態がリアルタイムで通知される', async () => {
    // Arrange
    const threadId = 'test-thread';
    const readStatusListener = jest.fn();
    
    await wsService.connect();
    wsService.subscribeToThread(threadId, readStatusListener);
    
    // メッセージ送信
    const message = await dmService.sendMessage(threadId, {
      messageType: 'text',
      textContent: 'Test message'
    });
    
    // Act: 既読処理
    await dmService.markAsRead(message.id);
    
    // Assert
    await waitFor(() => {
      expect(readStatusListener).toHaveBeenCalledWith({
        type: 'message_read',
        threadId,
        messageId: message.id
      });
    });
  });

  it('WebSocket接続が切断された場合の再接続が動作する', async () => {
    // Arrange
    const connectionListener = jest.fn();
    wsService.onConnectionChange(connectionListener);
    
    await wsService.connect();
    expect(connectionListener).toHaveBeenCalledWith('connected');
    
    // Act: 接続切断をシミュレート
    wsService.simulateDisconnection();
    
    // Assert: 自動再接続
    await waitFor(() => {
      expect(connectionListener).toHaveBeenCalledWith('disconnected');
    });
    
    await waitFor(() => {
      expect(connectionListener).toHaveBeenCalledWith('reconnecting');
    }, { timeout: 5000 });
    
    await waitFor(() => {
      expect(connectionListener).toHaveBeenCalledWith('connected');
    }, { timeout: 10000 });
  });
});
```

## 4. E2Eテスト

### 4.1 完全なユーザーフロー

#### Test: Complete DM User Flow

```typescript
import { device, element, by, expect as detoxExpect } from 'detox';

describe('DM機能E2Eテスト', () => {
  beforeAll(async () => {
    await device.launchApp();
    await element(by.id('login-button')).tap();
    // テストユーザーでログイン
    await element(by.id('email-input')).typeText('testuser@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('submit-login')).tap();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  it('新規DM会話を開始してメッセージを送信できる', async () => {
    // Act 1: メッセージ画面へ遷移
    await element(by.id('messages-tab')).tap();
    await detoxExpect(element(by.text('メッセージ'))).toBeVisible();
    
    // Act 2: 新規メッセージ作成
    await element(by.id('new-message-button')).tap();
    await detoxExpect(element(by.text('新しいメッセージ'))).toBeVisible();
    
    // Act 3: ユーザー検索・選択
    await element(by.id('user-search-input')).typeText('TestUser2');
    await element(by.text('TestUser2')).tap();
    
    // Act 4: メッセージ送信
    await detoxExpect(element(by.id('message-input'))).toBeVisible();
    await element(by.id('message-input')).typeText('Hello from E2E test!');
    await element(by.id('send-button')).tap();
    
    // Assert: メッセージが表示される
    await detoxExpect(element(by.text('Hello from E2E test!'))).toBeVisible();
    await detoxExpect(element(by.id('message-sent-indicator'))).toBeVisible();
  });

  it('画像メッセージを送信できる', async () => {
    // Arrange: DM画面にいる状態
    await element(by.id('messages-tab')).tap();
    await element(by.text('TestUser2')).tap();
    
    // Act 1: 画像選択ボタンをタップ
    await element(by.id('image-picker-button')).tap();
    
    // Act 2: ギャラリーから画像選択
    await element(by.text('ギャラリーから選択')).tap();
    // テスト用画像を選択（実際の実装では写真ライブラリのモック）
    await element(by.id('test-image-1')).tap();
    
    // Act 3: 送信確認
    await element(by.text('送信')).tap();
    
    // Assert: 画像メッセージが表示される
    await detoxExpect(element(by.id('image-message'))).toBeVisible();
  });

  it('音声メッセージを録音・送信できる', async () => {
    // Arrange: DM画面にいる状態
    await element(by.id('messages-tab')).tap();
    await element(by.text('TestUser2')).tap();
    
    // Act 1: 音声録音ボタンを長押し
    await element(by.id('audio-record-button')).longPress();
    
    // Act 2: 録音中の表示確認
    await detoxExpect(element(by.text('録音中...'))).toBeVisible();
    
    // Act 3: 録音停止
    await element(by.id('audio-record-button')).tap();
    
    // Act 4: 音声送信
    await element(by.id('send-audio-button')).tap();
    
    // Assert: 音声メッセージが表示される
    await detoxExpect(element(by.id('audio-message'))).toBeVisible();
    await detoxExpect(element(by.id('audio-waveform'))).toBeVisible();
  });

  it('既読状態が正しく表示される', async () => {
    // Arrange: 相手からメッセージが来ている状態をシミュレート
    // （実際の実装では、テスト用の別ユーザーからメッセージを送信）
    
    // Act: DM画面を開く
    await element(by.id('messages-tab')).tap();
    await element(by.text('TestUser2')).tap();
    
    // Assert: 未読メッセージがある
    await detoxExpect(element(by.id('unread-message'))).toBeVisible();
    
    // Act: メッセージを表示（既読処理実行）
    await device.reloadReactNative(); // 画面リロードで既読状態更新
    
    // Assert: 既読マークが表示される
    await detoxExpect(element(by.id('read-status-check'))).toBeVisible();
  });

  it('DM一覧での未読バッジが動作する', async () => {
    // Act: メッセージ一覧画面
    await element(by.id('messages-tab')).tap();
    
    // Assert: 未読バッジが表示される
    await detoxExpect(element(by.id('unread-badge'))).toBeVisible();
    await detoxExpect(element(by.text('3'))).toBeVisible(); // 未読数
    
    // Act: メッセージを読む
    await element(by.text('TestUser2')).tap();
    await element(by.id('back-button')).tap();
    
    // Assert: 未読バッジが更新される
    await detoxExpect(element(by.text('0'))).toBeVisible();
  });

  it('リアルタイムメッセージ受信が動作する', async () => {
    // Arrange: DM画面を開いている状態
    await element(by.id('messages-tab')).tap();
    await element(by.text('TestUser2')).tap();
    
    // Act: 外部からリアルタイムメッセージをシミュレート
    // （実際の実装では、テストサーバーからWebSocket経由でメッセージ送信）
    await device.sendUserNotification({
      payload: {
        type: 'new_dm_message',
        threadId: 'test-thread',
        message: 'Real-time message!'
      }
    });
    
    // Assert: 新しいメッセージが即座に表示される
    await detoxExpect(element(by.text('Real-time message!'))).toBeVisible();
  });
});
```

### 4.2 エラーハンドリングE2E

#### Test: Error Handling E2E

```typescript
describe('DMエラーハンドリングE2E', () => {
  it('ネットワークエラー時のオフライン対応', async () => {
    // Arrange: オフライン状態をシミュレート
    await device.setNetworkConnection('airplane');
    
    // Act: メッセージ送信を試行
    await element(by.id('messages-tab')).tap();
    await element(by.text('TestUser2')).tap();
    await element(by.id('message-input')).typeText('Offline message');
    await element(by.id('send-button')).tap();
    
    // Assert: オフライン送信表示
    await detoxExpect(element(by.text('Offline message'))).toBeVisible();
    await detoxExpect(element(by.id('message-pending-indicator'))).toBeVisible();
    
    // Act: ネットワーク復帰
    await device.setNetworkConnection('wifi');
    
    // Assert: メッセージが正常送信される
    await detoxExpect(element(by.id('message-sent-indicator'))).toBeVisible();
  });

  it('ファイルアップロードエラーのハンドリング', async () => {
    // Arrange: 大きすぎるファイルを準備
    await element(by.id('messages-tab')).tap();
    await element(by.text('TestUser2')).tap();
    
    // Act: 大きすぎる画像を選択
    await element(by.id('image-picker-button')).tap();
    await element(by.text('ギャラリーから選択')).tap();
    await element(by.id('large-test-image')).tap(); // 10MB超のテスト画像
    
    // Assert: エラーメッセージが表示される
    await detoxExpect(element(by.text('ファイルサイズが大きすぎます'))).toBeVisible();
    await detoxExpect(element(by.text('最大5MBまでです'))).toBeVisible();
  });

  it('認証エラー時の再ログイン促進', async () => {
    // Arrange: 認証トークンを無効化
    await device.sendUserActivity({
      type: 'invalidate_auth_token'
    });
    
    // Act: メッセージ送信を試行
    await element(by.id('messages-tab')).tap();
    await element(by.text('TestUser2')).tap();
    await element(by.id('message-input')).typeText('Test message');
    await element(by.id('send-button')).tap();
    
    // Assert: 再ログイン画面に遷移
    await detoxExpect(element(by.text('セッションが期限切れです'))).toBeVisible();
    await detoxExpect(element(by.text('再ログイン'))).toBeVisible();
  });
});
```

## テスト実行設定

### Jest設定（jest.config.js）

```javascript
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/jest.setup.js'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.test.{ts,tsx}'
  ]
};
```

### セットアップファイル（jest.setup.js）

```javascript
import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// AsyncStorage Mock
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// React Native Reanimated Mock
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Expo ImagePicker Mock
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    cancelled: false,
    assets: [{
      uri: 'mock-image-uri',
      type: 'image',
      fileName: 'test.jpg'
    }]
  })
}));

// Expo AV Mock
jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    Recording: jest.fn().mockImplementation(() => ({
      prepareToRecordAsync: jest.fn(),
      startAsync: jest.fn(),
      stopAndUnloadAsync: jest.fn(),
      getURI: jest.fn().mockReturnValue('mock-audio-uri')
    }))
  }
}));

// WebSocket Mock
global.WebSocket = jest.fn().mockImplementation(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1
}));

// Crypto Mock for E2E encryption tests
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr) => arr.map(() => Math.floor(Math.random() * 256))
  }
});
```

### Detox設定（.detoxrc.js）

```javascript
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/jest.config.js',
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug'
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug'
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/YourApp.app',
      build: 'xcodebuild -workspace ios/YourApp.xcworkspace -scheme YourApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14 Pro'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_4_API_30'
      }
    }
  }
};
```

## テスト実行コマンド

```bash
# 全テスト実行
npm test

# ユニットテストのみ
npm run test:unit

# 結合テストのみ
npm run test:integration

# E2Eテスト
npm run test:e2e

# カバレッジ付き実行
npm run test:coverage

# ウォッチモード
npm run test:watch
```

## 品質基準

### カバレッジ目標
- Line Coverage: ≥90%
- Function Coverage: ≥90%
- Branch Coverage: ≥90%
- Statement Coverage: ≥90%

### テスト実行時間目標
- ユニットテスト: <30秒
- 結合テスト: <2分
- E2Eテスト: <10分

### 必須テストケース
- 正常系：各機能の基本動作
- 異常系：エラーハンドリング
- 境界値：文字数制限、ファイルサイズ制限
- セキュリティ：暗号化、認証
- パフォーマンス：大量データ、ネットワーク遅延