import { LiveRoomScreen } from '@/components/liveroom/LiveRoomScreen';
import { liveRoomService } from '@/lib/liveRoomService';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/lib/liveRoomService');
jest.mock('@react-navigation/native');

describe('LiveRoomScreen', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn()
  };

  const mockRoom = {
    id: 'room-123',
    host_user_id: 'host-123',
    title: '目醒めトーク',
    status: 'active',
    max_speakers: 10,
    is_recording: true,
    participant_count: 5,
    livekit_room_name: 'livekit-room-123',
    created_at: new Date().toISOString()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue(mockNavigation);
  });

  test('ルーム情報の表示', async () => {
    (useRoute as jest.Mock).mockReturnValue({
      params: {
        roomId: 'room-123',
        userId: 'user-123',
        role: 'listener'
      }
    });

    (liveRoomService.joinRoom as jest.Mock).mockResolvedValue({
      token: 'mock-token',
      room: mockRoom
    });

    const { getByText, getByTestId } = render(<LiveRoomScreen />);

    await waitFor(() => {
      expect(getByText('目醒めトーク')).toBeTruthy();
      expect(getByTestId('participant-count').props.children).toContain('5');
      expect(getByTestId('recording-indicator')).toBeTruthy();
    });
  });

  test('リスナーとしての参加', async () => {
    (useRoute as jest.Mock).mockReturnValue({
      params: {
        roomId: 'room-123',
        userId: 'user-123',
        role: 'listener'
      }
    });

    (liveRoomService.joinRoom as jest.Mock).mockResolvedValue({
      token: 'mock-token',
      room: mockRoom
    });

    const { getByText, queryByTestId } = render(<LiveRoomScreen />);

    await waitFor(() => {
      // リスナー専用UI
      expect(getByText('登壇リクエスト')).toBeTruthy();
      expect(queryByTestId('mic-button')).toBeNull();
    });
  });

  test('スピーカーとしての参加', async () => {
    (useRoute as jest.Mock).mockReturnValue({
      params: {
        roomId: 'room-123',
        userId: 'speaker-123',
        role: 'speaker'
      }
    });

    (liveRoomService.joinRoom as jest.Mock).mockResolvedValue({
      token: 'mock-token',
      room: mockRoom
    });

    const { getByTestId, queryByText } = render(<LiveRoomScreen />);

    await waitFor(() => {
      // スピーカー専用UI
      expect(getByTestId('mic-button')).toBeTruthy();
      expect(queryByText('登壇リクエスト')).toBeNull();
    });
  });

  test('マイクのミュート切り替え', async () => {
    (useRoute as jest.Mock).mockReturnValue({
      params: {
        roomId: 'room-123',
        userId: 'speaker-123',
        role: 'speaker'
      }
    });

    (liveRoomService.joinRoom as jest.Mock).mockResolvedValue({
      token: 'mock-token',
      room: mockRoom
    });

    const { getByTestId } = render(<LiveRoomScreen />);

    await waitFor(() => {
      const micButton = getByTestId('mic-button');
      expect(micButton).toBeTruthy();
    });

    const micButton = getByTestId('mic-button');
    
    // 初期状態はミュート解除
    expect(micButton.props.accessibilityLabel).toBe('マイクオン');

    // ミュート切り替え
    fireEvent.press(micButton);
    expect(micButton.props.accessibilityLabel).toBe('マイクオフ');

    // 再度切り替え
    fireEvent.press(micButton);
    expect(micButton.props.accessibilityLabel).toBe('マイクオン');
  });

  test('ホストによるルーム終了', async () => {
    (useRoute as jest.Mock).mockReturnValue({
      params: {
        roomId: 'room-123',
        userId: 'host-123',
        role: 'speaker'
      }
    });

    (liveRoomService.joinRoom as jest.Mock).mockResolvedValue({
      token: 'mock-token',
      room: { ...mockRoom, host_user_id: 'host-123' }
    });

    (liveRoomService.endRoom as jest.Mock).mockResolvedValue({
      status: 'ended',
      endedAt: new Date().toISOString(),
      postId: null
    });

    const { getByTestId, getByText } = render(<LiveRoomScreen />);

    await waitFor(() => {
      expect(getByTestId('room-menu')).toBeTruthy();
    });

    // メニューを開く
    fireEvent.press(getByTestId('room-menu'));
    
    // ルーム終了を選択
    fireEvent.press(getByText('ルームを終了'));

    // 確認ダイアログ
    await waitFor(() => {
      expect(getByText('ルームを終了しますか？')).toBeTruthy();
    });

    // 確定
    fireEvent.press(getByText('終了する'));

    await waitFor(() => {
      expect(liveRoomService.endRoom).toHaveBeenCalledWith('room-123', false);
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  test('参加者によるルーム退出', async () => {
    (useRoute as jest.Mock).mockReturnValue({
      params: {
        roomId: 'room-123',
        userId: 'user-123',
        role: 'listener'
      }
    });

    (liveRoomService.joinRoom as jest.Mock).mockResolvedValue({
      token: 'mock-token',
      room: mockRoom
    });

    const { getByTestId, getByText } = render(<LiveRoomScreen />);

    await waitFor(() => {
      expect(getByTestId('leave-button')).toBeTruthy();
    });

    // 退出ボタンをタップ
    fireEvent.press(getByTestId('leave-button'));

    // 確認ダイアログ
    await waitFor(() => {
      expect(getByText('ルームを退出しますか？')).toBeTruthy();
    });

    // 確定
    fireEvent.press(getByText('退出する'));

    await waitFor(() => {
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  test('登壇リクエスト送信', async () => {
    (useRoute as jest.Mock).mockReturnValue({
      params: {
        roomId: 'room-123',
        userId: 'user-123',
        role: 'listener'
      }
    });

    (liveRoomService.joinRoom as jest.Mock).mockResolvedValue({
      token: 'mock-token',
      room: mockRoom
    });

    (liveRoomService.requestToSpeak as jest.Mock).mockResolvedValue({
      id: 'request-123',
      status: 'pending'
    });

    const { getByText } = render(<LiveRoomScreen />);

    await waitFor(() => {
      expect(getByText('登壇リクエスト')).toBeTruthy();
    });

    // リクエスト送信
    fireEvent.press(getByText('登壇リクエスト'));

    await waitFor(() => {
      expect(liveRoomService.requestToSpeak).toHaveBeenCalledWith('room-123');
      expect(getByText('リクエスト送信済み')).toBeTruthy();
    });
  });

  test('エラーハンドリング - ルーム参加失敗', async () => {
    (useRoute as jest.Mock).mockReturnValue({
      params: {
        roomId: 'room-123',
        userId: 'user-123',
        role: 'listener'
      }
    });

    (liveRoomService.joinRoom as jest.Mock).mockRejectedValue(
      new Error('このルームは終了しています')
    );

    const { getByText } = render(<LiveRoomScreen />);

    await waitFor(() => {
      expect(getByText('このルームは終了しています')).toBeTruthy();
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });
});
EOF < /dev/null