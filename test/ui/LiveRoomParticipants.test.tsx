import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

// Mock components
jest.mock('@/components/ui/FlatList', () => 'FlatList');
jest.mock('@/components/ui/Text', () => 'Text');
jest.mock('@/components/ui/View', () => 'View');
jest.mock('@/components/ui/Avatar', () => 'Avatar');
jest.mock('@/components/ui/Button', () => 'Button');
jest.mock('@/components/ui/Icon', () => 'Icon');

import LiveRoomParticipants from '@/components/LiveRoomParticipants';

// Mock LiveKit hooks
jest.mock('@livekit/react-native', () => ({
  useParticipants: jest.fn(),
  useRoom: jest.fn().mockReturnValue({
    localParticipant: {
      identity: 'current-user-id',
      metadata: JSON.stringify({ role: 'listener' })
    },
    participants: new Map()
  })
}));

describe('LiveRoomParticipants Component', () => {
  // テスト用の参加者データ
  const mockParticipants = [
    {
      identity: 'host-user',
      metadata: JSON.stringify({ 
        role: 'host',
        displayName: 'ホストユーザー',
        profileImage: 'https://example.com/host.jpg'
      }),
      isSpeaking: false,
      connectionQuality: 'excellent'
    },
    {
      identity: 'speaker-1',
      metadata: JSON.stringify({ 
        role: 'speaker',
        displayName: '登壇者1',
        profileImage: 'https://example.com/speaker1.jpg'
      }),
      isSpeaking: true,
      connectionQuality: 'good'
    },
    {
      identity: 'listener-1',
      metadata: JSON.stringify({ 
        role: 'listener',
        displayName: 'リスナー1',
        profileImage: 'https://example.com/listener1.jpg'
      }),
      isSpeaking: false,
      connectionQuality: 'poor'
    }
  ];

  beforeEach(() => {
    // Mock useParticipants hook to return test data
    require('@livekit/react-native').useParticipants.mockReturnValue(mockParticipants);
  });

  test('参加者リストの表示', () => {
    // Given
    const props = {
      roomId: 'room-123',
      hostId: 'host-user',
      isHost: false,
      onActionRequest: jest.fn()
    };

    // When
    render(<LiveRoomParticipants {...props} />);
    
    // Then
    expect(screen.getByText('ホストユーザー')).toBeOnTheScreen();
    expect(screen.getByText('登壇者1')).toBeOnTheScreen();
    expect(screen.getByText('リスナー1')).toBeOnTheScreen();
    
    // ホストはホストバッジを持つ
    expect(screen.getByTestId('host-badge-host-user')).toBeOnTheScreen();
    
    // 発言中のスピーカーは発言インジケータを持つ
    expect(screen.getByTestId('speaking-indicator-speaker-1')).toBeOnTheScreen();
  });

  test('ホストによる参加者アクション', async () => {
    // Given
    const mockOnActionRequest = jest.fn();
    const props = {
      roomId: 'room-123',
      hostId: 'host-user',
      isHost: true, // ホストとして表示
      onActionRequest: mockOnActionRequest
    };

    // When
    render(<LiveRoomParticipants {...props} />);
    
    // リスナーを長押し
    await act(() => {
      fireEvent(screen.getByText('リスナー1'), 'longPress');
    });
    
    // Then - アクションメニューが表示される
    expect(screen.getByText('登壇者に昇格')).toBeOnTheScreen();
    
    // 「登壇者に昇格」をタップ
    await act(() => {
      fireEvent.press(screen.getByText('登壇者に昇格'));
    });
    
    // Then
    expect(mockOnActionRequest).toHaveBeenCalledWith({
      type: 'promote_to_speaker',
      targetUserId: 'listener-1',
      displayName: 'リスナー1'
    });
  });

  test('スピーカーのミュート管理', async () => {
    // Given
    const mockOnActionRequest = jest.fn();
    const props = {
      roomId: 'room-123',
      hostId: 'host-user',
      isHost: true, // ホストとして表示
      onActionRequest: mockOnActionRequest
    };

    // When
    render(<LiveRoomParticipants {...props} />);
    
    // スピーカーを長押し
    await act(() => {
      fireEvent(screen.getByText('登壇者1'), 'longPress');
    });
    
    // Then - アクションメニューが表示される
    expect(screen.getByText('ミュートする')).toBeOnTheScreen();
    
    // 「ミュートする」をタップ
    await act(() => {
      fireEvent.press(screen.getByText('ミュートする'));
    });
    
    // Then
    expect(mockOnActionRequest).toHaveBeenCalledWith({
      type: 'mute_participant',
      targetUserId: 'speaker-1',
      displayName: '登壇者1'
    });
  });

  test('登壇リクエストのUI', () => {
    // Given
    const props = {
      roomId: 'room-123',
      hostId: 'host-user',
      isHost: false, // 一般ユーザーとして表示
      onActionRequest: jest.fn(),
      pendingRequests: [
        {
          userId: 'requester-1',
          displayName: 'リクエスター1',
          requestType: 'speaker_request',
          timestamp: new Date().toISOString()
        }
      ]
    };

    // When
    render(<LiveRoomParticipants {...props} />);
    
    // Then - 登壇リクエストが表示される
    expect(screen.getByText('リクエスター1')).toBeOnTheScreen();
    expect(screen.getByText('登壇をリクエスト中')).toBeOnTheScreen();
  });

  test('ホストによる登壇リクエスト承認', async () => {
    // Given
    const mockOnActionRequest = jest.fn();
    const props = {
      roomId: 'room-123',
      hostId: 'host-user',
      isHost: true, // ホストとして表示
      onActionRequest: mockOnActionRequest,
      pendingRequests: [
        {
          userId: 'requester-1',
          displayName: 'リクエスター1',
          requestType: 'speaker_request',
          timestamp: new Date().toISOString()
        }
      ]
    };

    // When
    render(<LiveRoomParticipants {...props} />);
    
    // 承認ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('approve-request-requester-1'));
    });
    
    // Then
    expect(mockOnActionRequest).toHaveBeenCalledWith({
      type: 'approve_speaker_request',
      targetUserId: 'requester-1',
      displayName: 'リクエスター1'
    });
  });

  test('接続品質インジケータ', () => {
    // Given
    const props = {
      roomId: 'room-123',
      hostId: 'host-user',
      isHost: false,
      onActionRequest: jest.fn()
    };

    // When
    render(<LiveRoomParticipants {...props} />);
    
    // Then - 各参加者の接続品質インジケータが表示される
    expect(screen.getByTestId('connection-excellent-host-user')).toBeOnTheScreen();
    expect(screen.getByTestId('connection-good-speaker-1')).toBeOnTheScreen();
    expect(screen.getByTestId('connection-poor-listener-1')).toBeOnTheScreen();
  });
});