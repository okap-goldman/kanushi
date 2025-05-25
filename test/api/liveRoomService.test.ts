import { describe, expect, test, jest, beforeEach } from '@jest/globals';

// Mock supabase and livekit
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis()
};

const mockLiveKit = {
  createRoom: jest.fn(),
  createToken: jest.fn()
};

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}));

jest.mock('@/lib/livekit', () => mockLiveKit);

import { liveRoomService } from '@/services/liveRoomService';

describe('LiveRoom Service - Create Room', () => {
  const mockUser = {
    id: 'user-123',
    displayName: 'テストユーザー',
    profileImageUrl: 'https://example.com/avatar.jpg'
  };

  beforeEach(() => {
    // Supabase認証をセットアップ
    jest.clearAllMocks();
  });

  describe('createLiveRoom', () => {
    test('正常なルーム作成', async () => {
      const roomData = {
        title: '目醒めトーク',
        maxSpeakers: 10,
        isRecording: false
      };

      mockSupabase.insert.mockResolvedValueOnce({
        data: {
          id: 'room-123',
          host_user_id: mockUser.id,
          title: roomData.title,
          status: 'preparing',
          max_speakers: 10,
          is_recording: false,
          participant_count: 0,
          livekit_room_name: 'livekit-room-123',
          created_at: new Date().toISOString()
        },
        error: null
      });

      mockLiveKit.createRoom.mockResolvedValueOnce({
        name: 'livekit-room-123',
        emptyTimeout: 300,
        maxParticipants: 10
      });

      const result = await liveRoomService.createRoom(roomData);

      expect(result).toMatchObject({
        id: expect.any(String),
        hostUser: expect.objectContaining({
          id: mockUser.id,
          displayName: mockUser.displayName
        }),
        title: roomData.title,
        status: 'preparing',
        maxSpeakers: 10,
        isRecording: false,
        participantCount: 0,
        livekitRoomName: expect.any(String),
        createdAt: expect.any(String)
      });

      expect(mockLiveKit.createRoom).toHaveBeenCalledWith({
        name: expect.any(String),
        emptyTimeout: 300,
        maxParticipants: 10
      });
    });

    test('入力バリデーションエラー', async () => {
      const invalidData = {
        title: '', // タイトルが空
        maxSpeakers: 20, // 最大登壇者数が範囲外
        isRecording: false
      };

      await expect(liveRoomService.createRoom(invalidData))
        .rejects.toThrow('タイトルは1-50文字で入力してください');

      const invalidData2 = {
        title: '目醒めトーク',
        maxSpeakers: 20, // 最大登壇者数が範囲外
        isRecording: false
      };

      await expect(liveRoomService.createRoom(invalidData2))
        .rejects.toThrow('最大登壇者数は1-15人の範囲で指定してください');
    });

    test('LiveKitエラーハンドリング', async () => {
      const roomData = {
        title: '目醒めトーク',
        maxSpeakers: 10,
        isRecording: false
      };

      mockLiveKit.createRoom.mockRejectedValueOnce(new Error('LiveKit error'));

      await expect(liveRoomService.createRoom(roomData))
        .rejects.toThrow('ルーム作成に失敗しました: LiveKit error');
    });
  });

  describe('joinLiveRoom', () => {
    test('ルーム参加（視聴者として）', async () => {
      const roomId = 'room-123';
      const identity = 'user-123';

      mockSupabase.select.mockResolvedValueOnce({
        data: {
          id: roomId,
          host_user_id: 'host-user',
          title: '目醒めトーク',
          status: 'active',
          max_speakers: 10,
          is_recording: false,
          participant_count: 5,
          livekit_room_name: 'livekit-room-123',
          created_at: new Date().toISOString()
        },
        error: null
      });

      mockLiveKit.createToken.mockReturnValueOnce('mock-token');

      const result = await liveRoomService.joinRoom(roomId, identity, 'listener');

      expect(result).toMatchObject({
        token: 'mock-token',
        room: expect.objectContaining({
          id: roomId,
          status: 'active'
        })
      });

      expect(mockLiveKit.createToken).toHaveBeenCalledWith('livekit-room-123', identity, {
        canPublish: false,
        canSubscribe: true
      });
    });

    test('ルーム参加（登壇者として）', async () => {
      const roomId = 'room-123';
      const identity = 'host-user';

      mockSupabase.select.mockResolvedValueOnce({
        data: {
          id: roomId,
          host_user_id: identity,
          title: '目醒めトーク',
          status: 'active',
          max_speakers: 10,
          is_recording: false,
          participant_count: 5,
          livekit_room_name: 'livekit-room-123',
          created_at: new Date().toISOString()
        },
        error: null
      });

      mockLiveKit.createToken.mockReturnValueOnce('mock-token');

      const result = await liveRoomService.joinRoom(roomId, identity, 'speaker');

      expect(result).toMatchObject({
        token: 'mock-token',
        room: expect.objectContaining({
          id: roomId,
          status: 'active'
        })
      });

      expect(mockLiveKit.createToken).toHaveBeenCalledWith('livekit-room-123', identity, {
        canPublish: true,
        canSubscribe: true
      });
    });

    test('存在しないルームエラー', async () => {
      const roomId = 'non-existent-room';
      const identity = 'user-123';

      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: null
      });

      await expect(liveRoomService.joinRoom(roomId, identity, 'listener'))
        .rejects.toThrow('ルームが見つかりません');
    });

    test('終了済みルームエラー', async () => {
      const roomId = 'ended-room';
      const identity = 'user-123';

      mockSupabase.select.mockResolvedValueOnce({
        data: {
          id: roomId,
          host_user_id: 'host-user',
          title: '目醒めトーク',
          status: 'ended',
          max_speakers: 10,
          is_recording: false,
          participant_count: 0,
          livekit_room_name: 'livekit-room-123',
          created_at: new Date().toISOString()
        },
        error: null
      });

      await expect(liveRoomService.joinRoom(roomId, identity, 'listener'))
        .rejects.toThrow('このルームは終了しています');
    });
  });
});