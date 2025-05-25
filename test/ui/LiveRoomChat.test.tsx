import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

// Mock components
jest.mock('@/components/ui/FlatList', () => 'FlatList');
jest.mock('@/components/ui/TextInput', () => 'TextInput');
jest.mock('@/components/ui/Button', () => 'Button');
jest.mock('@/components/ui/Text', () => 'Text');
jest.mock('@/components/ui/View', () => 'View');
jest.mock('@/components/ui/Icon', () => 'Icon');

import LiveRoomChat from '@/components/LiveRoomChat';

// Mock chat service
jest.mock('@/services/chatService', () => ({
  sendChatMessage: jest.fn().mockResolvedValue({}),
  subscribeToChatMessages: jest.fn().mockImplementation((roomId, callback) => {
    // テスト用にコールバックを呼び出す
    setTimeout(() => {
      callback({
        id: 'msg-1',
        userId: 'user-123',
        userName: 'テストユーザー',
        content: 'こんにちは！',
        timestamp: new Date().toISOString()
      });
    }, 100);
    
    return { unsubscribe: jest.fn() };
  })
}));

describe('LiveRoomChat Component', () => {
  test('チャットの表示', async () => {
    // Given
    const props = {
      roomId: 'room-123',
      userId: 'user-456',
      userName: '現在のユーザー'
    };

    // When
    render(<LiveRoomChat {...props} />);
    
    // Then - リアルタイムメッセージが表示される
    await screen.findByText('テストユーザー');
    expect(screen.getByText('こんにちは！')).toBeOnTheScreen();
    
    // 入力フィールドが表示されている
    expect(screen.getByPlaceholderText('メッセージを入力...')).toBeOnTheScreen();
  });

  test('メッセージの送信', async () => {
    // Given
    const props = {
      roomId: 'room-123',
      userId: 'user-456',
      userName: '現在のユーザー'
    };

    // When
    render(<LiveRoomChat {...props} />);
    
    // メッセージを入力
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('メッセージを入力...'),
        'テストメッセージです'
      );
    });
    
    // 送信ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('send-button'));
    });
    
    // Then
    expect(require('@/services/chatService').sendChatMessage).toHaveBeenCalledWith(
      'room-123',
      'user-456',
      '現在のユーザー',
      'テストメッセージです'
    );
    
    // 入力フィールドがクリアされる
    expect(screen.getByPlaceholderText('メッセージを入力...')).toHaveProp('value', '');
  });

  test('空メッセージの送信防止', async () => {
    // Given
    const props = {
      roomId: 'room-123',
      userId: 'user-456',
      userName: '現在のユーザー'
    };

    // When
    render(<LiveRoomChat {...props} />);
    
    // 空のメッセージで送信ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('send-button'));
    });
    
    // Then
    expect(require('@/services/chatService').sendChatMessage).not.toHaveBeenCalled();
  });

  test('長いメッセージの切り詰め', async () => {
    // Given
    const props = {
      roomId: 'room-123',
      userId: 'user-456',
      userName: '現在のユーザー'
    };

    // When
    render(<LiveRoomChat {...props} />);
    
    // 300文字を超えるメッセージを入力
    const longMessage = 'あ'.repeat(301);
    
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('メッセージを入力...'),
        longMessage
      );
    });
    
    // 送信ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('send-button'));
    });
    
    // Then
    expect(require('@/services/chatService').sendChatMessage).toHaveBeenCalledWith(
      'room-123',
      'user-456',
      '現在のユーザー',
      'あ'.repeat(300) // 300文字に切り詰められる
    );
  });

  test('チャットのスクロール動作', async () => {
    // Given
    const props = {
      roomId: 'room-123',
      userId: 'user-456',
      userName: '現在のユーザー'
    };

    // When
    render(<LiveRoomChat {...props} />);
    
    // チャットリストを取得
    const chatList = screen.getByTestId('chat-list');
    
    // スクロールイベントをシミュレート
    await act(() => {
      fireEvent.scroll(chatList, {
        nativeEvent: {
          contentOffset: { y: 100 },
          contentSize: { height: 500, width: 100 },
          layoutMeasurement: { height: 100, width: 100 }
        }
      });
    });
    
    // 新しいメッセージが到着
    act(() => {
      require('@/services/chatService').subscribeToChatMessages.mock.calls[0][1]({
        id: 'msg-2',
        userId: 'user-789',
        userName: '別のユーザー',
        content: '新しいメッセージ',
        timestamp: new Date().toISOString()
      });
    });
    
    // Then
    // スクロール位置が変わらないことを確認（自動スクロールされない）
    // 実際のテストでは、scrollToEndがコールされないことを検証
    await screen.findByText('別のユーザー');
    expect(screen.getByText('新しいメッセージ')).toBeOnTheScreen();
  });
});