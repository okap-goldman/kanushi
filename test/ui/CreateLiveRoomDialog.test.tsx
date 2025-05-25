import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CreateLiveRoomDialog } from '@/components/liveroom/CreateLiveRoomDialog';
import { liveRoomService } from '@/lib/liveRoomService';

jest.mock('@/lib/liveRoomService');

describe('CreateLiveRoomDialog', () => {
  const mockOnSuccess = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ダイアログの表示', () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(
      <CreateLiveRoomDialog
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // ダイアログ要素の確認
    expect(getByText('ライブルームを作成')).toBeTruthy();
    expect(getByPlaceholderText('ルームタイトル')).toBeTruthy();
    expect(getByText('最大登壇者数')).toBeTruthy();
    expect(getByText('録音する')).toBeTruthy();
    expect(getByText('作成')).toBeTruthy();
    expect(getByText('キャンセル')).toBeTruthy();

    // 初期状態で作成ボタンは無効
    const createButton = getByText('作成');
    expect(createButton.props.disabled).toBe(true);
  });

  test('入力に応じたボタンの有効化', () => {
    const { getByPlaceholderText, getByText } = render(
      <CreateLiveRoomDialog
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const titleInput = getByPlaceholderText('ルームタイトル');
    const createButton = getByText('作成');

    // タイトル入力前は無効
    expect(createButton.props.disabled).toBe(true);

    // タイトル入力後は有効
    fireEvent.changeText(titleInput, '目醒めトーク');
    expect(createButton.props.disabled).toBe(false);
  });

  test('登壇者数の変更', () => {
    const { getByTestId, getByText } = render(
      <CreateLiveRoomDialog
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const decrementButton = getByTestId('speaker-decrement');
    const incrementButton = getByTestId('speaker-increment');
    const speakerCount = getByTestId('speaker-count');

    // 初期値は10
    expect(speakerCount.props.children).toBe('10');

    // 増加
    fireEvent.press(incrementButton);
    expect(speakerCount.props.children).toBe('11');

    // 減少
    fireEvent.press(decrementButton);
    fireEvent.press(decrementButton);
    expect(speakerCount.props.children).toBe('9');

    // 最小値は1
    for (let i = 0; i < 10; i++) {
      fireEvent.press(decrementButton);
    }
    expect(speakerCount.props.children).toBe('1');

    // 最大値は15
    for (let i = 0; i < 20; i++) {
      fireEvent.press(incrementButton);
    }
    expect(speakerCount.props.children).toBe('15');
  });

  test('録音スイッチの切り替え', () => {
    const { getByTestId } = render(
      <CreateLiveRoomDialog
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const recordingSwitch = getByTestId('recording-switch');

    // 初期状態はオフ
    expect(recordingSwitch.props.value).toBe(false);

    // 切り替え
    fireEvent(recordingSwitch, 'onValueChange', true);
    expect(recordingSwitch.props.value).toBe(true);
  });

  test('ルーム作成の実行', async () => {
    const mockRoom = {
      id: 'room-123',
      title: '目醒めトーク',
      hostUser: {
        id: 'user-123',
        displayName: 'テストユーザー'
      },
      status: 'preparing'
    };

    (liveRoomService.createRoom as jest.Mock).mockResolvedValue(mockRoom);

    const { getByPlaceholderText, getByText, getByTestId } = render(
      <CreateLiveRoomDialog
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // フォーム入力
    fireEvent.changeText(getByPlaceholderText('ルームタイトル'), '目醒めトーク');
    fireEvent(getByTestId('recording-switch'), 'onValueChange', true);

    // 作成実行
    fireEvent.press(getByText('作成'));

    await waitFor(() => {
      expect(liveRoomService.createRoom).toHaveBeenCalledWith({
        title: '目醒めトーク',
        maxSpeakers: 10,
        isRecording: true
      });
      expect(mockOnSuccess).toHaveBeenCalledWith(mockRoom);
    });
  });

  test('エラーハンドリング', async () => {
    (liveRoomService.createRoom as jest.Mock).mockRejectedValue(
      new Error('ルーム作成に失敗しました')
    );

    const { getByPlaceholderText, getByText } = render(
      <CreateLiveRoomDialog
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // フォーム入力
    fireEvent.changeText(getByPlaceholderText('ルームタイトル'), '目醒めトーク');

    // 作成実行
    fireEvent.press(getByText('作成'));

    await waitFor(() => {
      expect(getByText('ルーム作成に失敗しました')).toBeTruthy();
      // ボタンが再度有効になる
      expect(getByText('作成').props.disabled).toBe(false);
    });
  });

  test('キャンセル操作', () => {
    const { getByText } = render(
      <CreateLiveRoomDialog
        visible={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.press(getByText('キャンセル'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('非表示状態', () => {
    const { queryByText } = render(
      <CreateLiveRoomDialog
        visible={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(queryByText('ライブルームを作成')).toBeNull();
  });
});
EOF < /dev/null