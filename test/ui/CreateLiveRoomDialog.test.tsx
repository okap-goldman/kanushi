import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

// Mock components and services
jest.mock('@/components/ui/Dialog', () => 'Dialog');
jest.mock('@/components/ui/TextInput', () => 'TextInput');
jest.mock('@/components/ui/Button', () => 'Button');
jest.mock('@/components/ui/Switch', () => 'Switch');
jest.mock('@/components/ui/Text', () => 'Text');
jest.mock('@/services/liveRoomService', () => ({
  createRoom: jest.fn().mockResolvedValue({ id: 'room-123' })
}));

import CreateLiveRoomDialog from '@/components/CreateLiveRoomDialog';
import { liveRoomService } from '@/services/liveRoomService';

describe('CreateLiveRoomDialog Component', () => {
  test('ダイアログの表示', () => {
    // Given
    const props = {
      visible: true,
      onClose: jest.fn(),
      onSuccess: jest.fn()
    };

    // When
    render(<CreateLiveRoomDialog {...props} />);

    // Then
    expect(screen.getByText('ライブルーム作成')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('タイトルを入力（50文字以内）')).toBeOnTheScreen();
    expect(screen.getByText('最大登壇者数')).toBeOnTheScreen();
    expect(screen.getByText('録音する')).toBeOnTheScreen();
    expect(screen.getByText('作成')).toBeDisabled(); // 初期状態ではボタン無効
  });

  test('入力に応じたボタンの有効化', async () => {
    // Given
    const props = {
      visible: true,
      onClose: jest.fn(),
      onSuccess: jest.fn()
    };

    // When
    render(<CreateLiveRoomDialog {...props} />);
    
    // タイトル入力
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('タイトルを入力（50文字以内）'),
        '目醒めトーク'
      );
    });

    // Then
    expect(screen.getByText('作成')).not.toBeDisabled();
  });

  test('登壇者数の変更', async () => {
    // Given
    const props = {
      visible: true,
      onClose: jest.fn(),
      onSuccess: jest.fn()
    };

    // When
    render(<CreateLiveRoomDialog {...props} />);
    
    // 初期値は5
    expect(screen.getByText('5')).toBeOnTheScreen();
    
    // 増加ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('increase-speakers'));
    });
    
    // Then
    expect(screen.getByText('6')).toBeOnTheScreen();
    
    // 減少ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('decrease-speakers'));
    });
    
    // Then
    expect(screen.getByText('5')).toBeOnTheScreen();
  });

  test('録音スイッチの切り替え', async () => {
    // Given
    const props = {
      visible: true,
      onClose: jest.fn(),
      onSuccess: jest.fn()
    };

    // When
    render(<CreateLiveRoomDialog {...props} />);
    
    // 初期値はオフ
    const recordingSwitch = screen.getByTestId('recording-switch');
    expect(recordingSwitch.props.value).toBe(false);
    
    // スイッチをタップ
    await act(() => {
      fireEvent(recordingSwitch, 'valueChange', true);
    });
    
    // Then
    expect(recordingSwitch.props.value).toBe(true);
  });

  test('ルーム作成の実行', async () => {
    // Given
    const mockOnSuccess = jest.fn();
    const props = {
      visible: true,
      onClose: jest.fn(),
      onSuccess: mockOnSuccess
    };

    // When
    render(<CreateLiveRoomDialog {...props} />);
    
    // フォーム入力
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('タイトルを入力（50文字以内）'),
        '目醒めトーク'
      );
    });
    
    await act(() => {
      fireEvent.press(screen.getByTestId('increase-speakers'));
    });
    
    await act(() => {
      fireEvent(screen.getByTestId('recording-switch'), 'valueChange', true);
    });
    
    // 作成ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByText('作成'));
    });
    
    // Then
    expect(liveRoomService.createRoom).toHaveBeenCalledWith({
      title: '目醒めトーク',
      maxSpeakers: 6,
      isRecording: true
    });
    
    expect(mockOnSuccess).toHaveBeenCalledWith({ id: 'room-123' });
  });

  test('エラーハンドリング', async () => {
    // Given
    (liveRoomService.createRoom as jest.Mock).mockRejectedValueOnce(
      new Error('タイトルは1-50文字で入力してください')
    );
    
    const props = {
      visible: true,
      onClose: jest.fn(),
      onSuccess: jest.fn()
    };

    // When
    render(<CreateLiveRoomDialog {...props} />);
    
    // フォーム入力して送信
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('タイトルを入力（50文字以内）'),
        'x'.repeat(51) // 51文字で制限オーバー
      );
    });
    
    await act(() => {
      fireEvent.press(screen.getByText('作成'));
    });
    
    // Then
    expect(screen.getByText('タイトルは1-50文字で入力してください')).toBeOnTheScreen();
    expect(props.onSuccess).not.toHaveBeenCalled();
  });
});