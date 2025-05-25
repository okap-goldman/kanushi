import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

// Mock components and hooks
jest.mock('@/components/ui/Button', () => 'Button');
jest.mock('@/components/ui/Text', () => 'Text');
jest.mock('@/components/ui/View', () => 'View');
jest.mock('@/components/ui/Avatar', () => 'Avatar');
jest.mock('@livekit/react-native', () => ({
  useRoom: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue({}),
    disconnect: jest.fn(),
    participants: new Map(),
    localParticipant: {
      publishTrack: jest.fn().mockResolvedValue({}),
      setMicrophoneEnabled: jest.fn()
    }
  }),
  useParticipant: jest.fn().mockReturnValue({
    isSpeaking: false,
    isMuted: false,
    metadata: JSON.stringify({ role: 'host' })
  }),
  AudioTrack: 'AudioTrack',
  VideoTrack: 'VideoTrack'
}));

import LiveRoomScreen from '@/components/LiveRoomScreen';
import { liveRoomService } from '@/services/liveRoomService';

// Mock liveRoomService
jest.mock('@/services/liveRoomService', () => ({
  liveRoomService: {
    joinRoom: jest.fn().mockResolvedValue({
      token: 'mock-token',
      room: {
        id: 'room-123',
        title: '目醒めトーク',
        hostUser: {
          id: 'host-123',
          displayName: 'ホストユーザー'
        },
        status: 'active',
        participantCount: 5
      }
    }),
    endRoom: jest.fn().mockResolvedValue({}),
    leaveRoom: jest.fn().mockResolvedValue({})
  }
}));

describe('LiveRoomScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ルーム情報の表示', async () => {
    // Given
    const props = {
      roomId: 'room-123',
      userId: 'user-456',
      role: 'listener'
    };

    // When
    render(<LiveRoomScreen {...props} />);
    
    // Then - ローディング後にルーム情報が表示される
    await screen.findByText('目醒めトーク');
    expect(screen.getByText('ホストユーザー')).toBeOnTheScreen();
    expect(screen.getByText('参加者: 5')).toBeOnTheScreen();
  });

  test('リスナーとしての参加', async () => {
    // Given
    const props = {
      roomId: 'room-123',
      userId: 'user-456',
      role: 'listener'
    };

    // When
    render(<LiveRoomScreen {...props} />);
    
    // Then
    await screen.findByText('目醒めトーク');
    
    // リスナーとして参加したので、登壇リクエストボタンが表示される
    expect(screen.getByText('登壇をリクエスト')).toBeOnTheScreen();
    
    // マイクのミュートボタンは表示されない
    expect(screen.queryByTestId('mute-button')).toBeNull();
  });

  test('スピーカーとしての参加', async () => {
    // Given
    const props = {
      roomId: 'room-123',
      userId: 'host-123', // ホストユーザー
      role: 'speaker'
    };

    // When
    render(<LiveRoomScreen {...props} />);
    
    // Then
    await screen.findByText('目醒めトーク');
    
    // スピーカーとして参加したので、マイクのミュートボタンが表示される
    expect(screen.getByTestId('mute-button')).toBeOnTheScreen();
    
    // 登壇リクエストボタンは表示されない
    expect(screen.queryByText('登壇をリクエスト')).toBeNull();
  });

  test('マイクのミュート切り替え', async () => {
    // Given
    const props = {
      roomId: 'room-123',
      userId: 'host-123',
      role: 'speaker'
    };

    // When
    render(<LiveRoomScreen {...props} />);
    
    // スピーカーUIが表示されるまで待機
    await screen.findByTestId('mute-button');
    
    // マイクボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('mute-button'));
    });
    
    // Then
    expect(screen.getByTestId('mute-button')).toHaveAccessibilityState({ selected: true });
  });

  test('ホストによるルーム終了', async () => {
    // Given
    const props = {
      roomId: 'room-123',
      userId: 'host-123', // ホストユーザー
      role: 'speaker',
      onRoomEnded: jest.fn()
    };

    // When
    render(<LiveRoomScreen {...props} />);
    
    // ルーム情報が表示されるまで待機
    await screen.findByText('目醒めトーク');
    
    // メニューボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('room-menu-button'));
    });
    
    // 「ルームを終了」をタップ
    await act(() => {
      fireEvent.press(screen.getByText('ルームを終了'));
    });
    
    // 確認ダイアログの「終了」をタップ
    await act(() => {
      fireEvent.press(screen.getByText('終了する'));
    });
    
    // Then
    expect(liveRoomService.endRoom).toHaveBeenCalledWith('room-123');
    expect(props.onRoomEnded).toHaveBeenCalled();
  });

  test('参加者によるルーム退出', async () => {
    // Given
    const props = {
      roomId: 'room-123',
      userId: 'user-456', // 一般参加者
      role: 'listener',
      onLeaveRoom: jest.fn()
    };

    // When
    render(<LiveRoomScreen {...props} />);
    
    // ルーム情報が表示されるまで待機
    await screen.findByText('目醒めトーク');
    
    // 退出ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('leave-room-button'));
    });
    
    // Then
    expect(liveRoomService.leaveRoom).toHaveBeenCalledWith('room-123', 'user-456');
    expect(props.onLeaveRoom).toHaveBeenCalled();
  });
});