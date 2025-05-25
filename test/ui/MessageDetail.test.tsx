import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

// Mock components
jest.mock('@/components/ui/ScrollView', () => 'ScrollView');
jest.mock('@/components/ui/View', () => 'View');
jest.mock('@/components/ui/Text', () => 'Text');
jest.mock('@/components/ui/Avatar', () => 'Avatar');
jest.mock('@/components/ui/Image', () => 'Image');
jest.mock('@/components/ui/Icon', () => 'Icon');
jest.mock('@/components/ui/Button', () => 'Button');
jest.mock('@/components/ui/ActivityIndicator', () => 'ActivityIndicator');

// Mock hooks
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'current-user' }
  })
}));

// Mock services
jest.mock('@/services/dmService', () => ({
  getMessages: jest.fn().mockResolvedValue([
    {
      id: 'msg-1',
      threadId: 'thread-123',
      senderId: 'other-user',
      content: 'こんにちは',
      imageUrl: null,
      createdAt: new Date(Date.now() - 3600000).toISOString() // 1時間前
    },
    {
      id: 'msg-2',
      threadId: 'thread-123',
      senderId: 'current-user',
      content: 'はじめまして',
      imageUrl: null,
      createdAt: new Date(Date.now() - 1800000).toISOString() // 30分前
    },
    {
      id: 'msg-3',
      threadId: 'thread-123',
      senderId: 'other-user',
      content: '写真です',
      imageUrl: 'https://example.com/image.jpg',
      createdAt: new Date().toISOString() // 現在
    }
  ]),
  markThreadAsRead: jest.fn().mockResolvedValue({ updatedCount: 2 })
}));

import MessageDetail from '@/components/MessageDetail';
import { dmService } from '@/services/dmService';

describe('MessageDetail Component', () => {
  const thread = {
    id: 'thread-123',
    otherUser: {
      id: 'other-user',
      displayName: '相手ユーザー',
      profileImage: 'https://example.com/avatar.jpg'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('メッセージ履歴の表示', async () => {
    // Given
    const props = {
      thread,
      onBackPress: jest.fn()
    };

    // When
    render(<MessageDetail {...props} />);

    // Then - メッセージがロードされるまで待機
    await screen.findByText('こんにちは');
    
    // ヘッダーが正しく表示されていることを確認
    expect(screen.getByText('相手ユーザー')).toBeOnTheScreen();
    
    // メッセージが正しく表示されていることを確認
    expect(screen.getByText('こんにちは')).toBeOnTheScreen();
    expect(screen.getByText('はじめまして')).toBeOnTheScreen();
    expect(screen.getByText('写真です')).toBeOnTheScreen();
    
    // 画像メッセージが表示されていることを確認
    expect(screen.getByTestId('message-image-msg-3')).toHaveProp('source', {
      uri: 'https://example.com/image.jpg'
    });
    
    // 既読処理が呼ばれたことを確認
    expect(dmService.markThreadAsRead).toHaveBeenCalledWith('thread-123');
  });

  test('バックボタン処理', async () => {
    // Given
    const mockOnBackPress = jest.fn();
    const props = {
      thread,
      onBackPress: mockOnBackPress
    };

    // When
    render(<MessageDetail {...props} />);
    
    // メッセージがロードされるまで待機
    await screen.findByText('こんにちは');
    
    // バックボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('back-button'));
    });
    
    // Then
    expect(mockOnBackPress).toHaveBeenCalled();
  });

  test('メッセージの送信UI', async () => {
    // Given
    const mockOnSendMessage = jest.fn();
    const props = {
      thread,
      onBackPress: jest.fn(),
      onSendMessage: mockOnSendMessage
    };

    // When
    render(<MessageDetail {...props} />);
    
    // メッセージがロードされるまで待機
    await screen.findByText('こんにちは');
    
    // 入力フィールドにテキストを入力
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('メッセージを入力'),
        '新しいメッセージ'
      );
    });
    
    // 送信ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('send-button'));
    });
    
    // Then
    expect(mockOnSendMessage).toHaveBeenCalledWith({
      content: '新しいメッセージ',
      threadId: 'thread-123'
    });
    
    // 入力フィールドがクリアされることを確認
    expect(screen.getByPlaceholderText('メッセージを入力')).toHaveProp('value', '');
  });

  test('画像添付機能', async () => {
    // Given
    const mockOnSendMessage = jest.fn();
    const mockImagePicker = {
      launchImageLibraryAsync: jest.fn().mockResolvedValue({
        cancelled: false,
        assets: [{
          uri: 'file:///path/to/image.jpg',
          width: 300,
          height: 400,
          type: 'image'
        }]
      })
    };
    
    // Mock image picker
    jest.mock('expo-image-picker', () => mockImagePicker);
    
    const props = {
      thread,
      onBackPress: jest.fn(),
      onSendMessage: mockOnSendMessage
    };

    // When
    render(<MessageDetail {...props} />);
    
    // メッセージがロードされるまで待機
    await screen.findByText('こんにちは');
    
    // 画像添付ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('attach-image-button'));
    });
    
    // テキストを入力
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('メッセージを入力'),
        '画像を添付します'
      );
    });
    
    // 送信ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('send-button'));
    });
    
    // Then
    expect(mockOnSendMessage).toHaveBeenCalledWith({
      content: '画像を添付します',
      threadId: 'thread-123',
      image: {
        uri: 'file:///path/to/image.jpg',
        width: 300,
        height: 400,
        type: 'image'
      }
    });
  });

  test('日付セパレータ表示', async () => {
    // Given
    // 異なる日付のメッセージを用意
    const messagesOnDifferentDays = [
      {
        id: 'msg-1',
        threadId: 'thread-123',
        senderId: 'other-user',
        content: '昨日のメッセージ',
        createdAt: new Date(Date.now() - 86400000).toISOString() // 1日前
      },
      {
        id: 'msg-2',
        threadId: 'thread-123',
        senderId: 'current-user',
        content: '今日のメッセージ',
        createdAt: new Date().toISOString() // 現在
      }
    ];
    
    (dmService.getMessages as jest.Mock).mockResolvedValueOnce(messagesOnDifferentDays);
    
    const props = {
      thread,
      onBackPress: jest.fn()
    };

    // When
    render(<MessageDetail {...props} />);
    
    // Then
    await screen.findByText('昨日のメッセージ');
    
    // 日付セパレータが表示されていることを確認
    expect(screen.getByText('昨日')).toBeOnTheScreen();
    expect(screen.getByText('今日')).toBeOnTheScreen();
  });

  test('エラー状態の表示と再試行', async () => {
    // Given
    (dmService.getMessages as jest.Mock).mockRejectedValueOnce(new Error('読み込みエラー'));
    
    const props = {
      thread,
      onBackPress: jest.fn()
    };

    // When
    render(<MessageDetail {...props} />);
    
    // Then
    await screen.findByText('メッセージの読み込みに失敗しました');
    
    // 再試行ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByText('再試行'));
    });
    
    // API呼び出しが再度行われたことを確認
    expect(dmService.getMessages).toHaveBeenCalledTimes(2);
  });
});