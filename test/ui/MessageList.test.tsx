import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

// Mock components
jest.mock('@/components/ui/FlatList', () => 'FlatList');
jest.mock('@/components/ui/Avatar', () => 'Avatar');
jest.mock('@/components/ui/Text', () => 'Text');
jest.mock('@/components/ui/View', () => 'View');
jest.mock('@/components/ui/TouchableOpacity', () => 'TouchableOpacity');
jest.mock('@/components/ui/Icon', () => 'Icon');

// Mock DM service
jest.mock('@/services/dmService', () => ({
  getThreads: jest.fn().mockResolvedValue([
    {
      id: 'thread-1',
      otherUser: {
        id: 'user-456',
        displayName: 'ユーザー2',
        profileImage: 'https://example.com/image2.jpg',
      },
      lastMessage: {
        content: 'こんにちは',
        createdAt: new Date().toISOString(),
      },
      unreadCount: 2,
    },
    {
      id: 'thread-2',
      otherUser: {
        id: 'user-789',
        displayName: 'ユーザー3',
        profileImage: 'https://example.com/image3.jpg',
      },
      lastMessage: {
        content: 'おはよう',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1日前
      },
      unreadCount: 0,
    },
  ]),
  searchThreads: jest.fn(),
}));

import MessageList from '@/components/MessageList';
import { dmService } from '@/services/dmService';

describe('MessageList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('スレッド一覧の表示', async () => {
    // Given
    const props = {
      onThreadSelect: jest.fn(),
    };

    // When
    render(<MessageList {...props} />);

    // Then - スレッド一覧がロードされるまで待機
    await screen.findByText('ユーザー2');

    // スレッドが正しく表示されていることを確認
    expect(screen.getByText('ユーザー2')).toBeOnTheScreen();
    expect(screen.getByText('ユーザー3')).toBeOnTheScreen();
    expect(screen.getByText('こんにちは')).toBeOnTheScreen();
    expect(screen.getByText('おはよう')).toBeOnTheScreen();

    // 未読バッジが表示されていることを確認
    expect(screen.getByTestId('unread-badge-thread-1')).toHaveTextContent('2');
    expect(screen.queryByTestId('unread-badge-thread-2')).toBeNull();

    // 日時フォーマットが正しいことを確認
    expect(screen.getByText('たった今')).toBeOnTheScreen(); // 現在時刻のメッセージ
    expect(screen.getByText('1日前')).toBeOnTheScreen(); // 1日前のメッセージ
  });

  test('スレッド選択', async () => {
    // Given
    const mockOnThreadSelect = jest.fn();
    const props = {
      onThreadSelect: mockOnThreadSelect,
    };

    // When
    render(<MessageList {...props} />);

    // スレッド一覧がロードされるまで待機
    await screen.findByText('ユーザー2');

    // スレッドをタップ
    await act(() => {
      fireEvent.press(screen.getByText('ユーザー2'));
    });

    // Then
    expect(mockOnThreadSelect).toHaveBeenCalledWith({
      id: 'thread-1',
      otherUser: {
        id: 'user-456',
        displayName: 'ユーザー2',
        profileImage: 'https://example.com/image2.jpg',
      },
    });
  });

  test('スレッド検索', async () => {
    // Given
    const props = {
      onThreadSelect: jest.fn(),
    };

    // 検索結果のモック
    (dmService.searchThreads as jest.Mock).mockResolvedValueOnce([
      {
        id: 'thread-3',
        otherUser: {
          id: 'user-search',
          displayName: '検索ユーザー',
          profileImage: 'https://example.com/search.jpg',
        },
        lastMessage: {
          content: '検索結果のメッセージ',
          createdAt: new Date().toISOString(),
        },
        unreadCount: 0,
      },
    ]);

    // When
    render(<MessageList {...props} />);

    // 検索フィールドに入力
    await screen.findByText('ユーザー2'); // 最初のロード完了を待つ

    await act(() => {
      fireEvent.changeText(screen.getByPlaceholderText('メッセージを検索'), '検索');
    });

    // 検索結果が表示されるまで待機
    await screen.findByText('検索ユーザー');

    // Then
    expect(dmService.searchThreads).toHaveBeenCalledWith('検索');
    expect(screen.getByText('検索ユーザー')).toBeOnTheScreen();
    expect(screen.getByText('検索結果のメッセージ')).toBeOnTheScreen();

    // 元のリストが表示されていないことを確認
    expect(screen.queryByText('ユーザー2')).toBeNull();
    expect(screen.queryByText('ユーザー3')).toBeNull();
  });

  test('新規DM作成ボタン', async () => {
    // Given
    const mockOnNewDM = jest.fn();
    const props = {
      onThreadSelect: jest.fn(),
      onNewDM: mockOnNewDM,
    };

    // When
    render(<MessageList {...props} />);

    // 新規DMボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('new-dm-button'));
    });

    // Then
    expect(mockOnNewDM).toHaveBeenCalled();
  });

  test('スレッドのプルダウンリフレッシュ', async () => {
    // Given
    const props = {
      onThreadSelect: jest.fn(),
    };

    // When
    render(<MessageList {...props} />);

    // スレッド一覧がロードされるまで待機
    await screen.findByText('ユーザー2');

    // getThreads呼び出し回数をリセット
    (dmService.getThreads as jest.Mock).mockClear();

    // プルダウンリフレッシュをシミュレート
    await act(() => {
      fireEvent(screen.getByTestId('thread-list'), 'refresh');
    });

    // Then
    expect(dmService.getThreads).toHaveBeenCalledTimes(1);
  });

  test('エラー状態の表示', async () => {
    // Given
    const props = {
      onThreadSelect: jest.fn(),
    };

    // エラーを発生させる
    (dmService.getThreads as jest.Mock).mockRejectedValueOnce(new Error('読み込みエラー'));

    // When
    render(<MessageList {...props} />);

    // Then
    await screen.findByText('読み込みに失敗しました');
    expect(screen.getByText('再試行')).toBeOnTheScreen();

    // 再試行ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByText('再試行'));
    });

    // 再度API呼び出しがあったことを確認
    expect(dmService.getThreads).toHaveBeenCalledTimes(2);
  });
});
