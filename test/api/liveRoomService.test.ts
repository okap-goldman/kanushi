import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock modules first
vi.mock('@/lib/supabase', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  };

  return { supabase: mockSupabase };
});

// Import after mocks
import { liveRoomService } from '@/lib/liveRoomService';
import { supabase } from '@/lib/supabase';

const mockSupabase = supabase as any;

describe('LiveRoom Service', () => {
  const mockUser = {
    id: 'user-123',
    user_metadata: {
      display_name: 'テストユーザー',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default auth mocks
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'mock-token' } },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createRoom', () => {
    test('正常なルーム作成', async () => {
      const roomData = {
        title: '目醒めトーク',
        maxSpeakers: 10,
        isRecording: false,
      };

      // Mock LiveKit edge function
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: {
          room: {
            name: 'livekit-room-123',
            emptyTimeout: 300,
            maxParticipants: 10,
          },
        },
        error: null,
      });

      // Mock database insert with chaining
      const mockDbChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'room-123',
            host_user_id: mockUser.id,
            title: roomData.title,
            status: 'preparing',
            max_speakers: 10,
            is_recording: false,
            participant_count: 0,
            livekit_room_name: expect.any(String),
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockDbChain);

      const result = await liveRoomService.createRoom(roomData);

      expect(result).toMatchObject({
        id: 'room-123',
        hostUser: expect.objectContaining({
          id: mockUser.id,
          displayName: 'テストユーザー',
        }),
        title: roomData.title,
        status: 'preparing',
        maxSpeakers: 10,
        isRecording: false,
        participantCount: 0,
        livekitRoomName: expect.any(String),
        createdAt: expect.any(String),
      });

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('manage-livekit-room', {
        body: {
          action: 'create',
          roomName: expect.any(String),
          emptyTimeout: 300,
          maxParticipants: 10,
        },
      });
    });

    test('タイトル未入力でバリデーションエラー', async () => {
      const invalidData = {
        title: '',
        maxSpeakers: 10,
        isRecording: false,
      };

      await expect(liveRoomService.createRoom(invalidData)).rejects.toThrow(
        'タイトルは1-50文字で入力してください'
      );
    });

    test('最大登壇者数が範囲外でバリデーションエラー', async () => {
      const invalidData = {
        title: '目醒めトーク',
        maxSpeakers: 20,
        isRecording: false,
      };

      await expect(liveRoomService.createRoom(invalidData)).rejects.toThrow(
        '最大登壇者数は1-15人の範囲で指定してください'
      );
    });

    test('LiveKitエラーハンドリング', async () => {
      const roomData = {
        title: '目醒めトーク',
        maxSpeakers: 10,
        isRecording: false,
      };

      mockSupabase.functions.invoke.mockRejectedValueOnce(new Error('LiveKit error'));

      await expect(liveRoomService.createRoom(roomData)).rejects.toThrow(
        'ルーム作成に失敗しました: LiveKit error'
      );
    });
  });

  describe('joinRoom', () => {
    test('リスナーとしてルーム参加', async () => {
      const roomId = 'room-123';
      const identity = 'user-123';

      // Mock room lookup
      const mockRoomChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: roomId,
            host_user_id: 'host-user',
            title: '目醒めトーク',
            status: 'active',
            max_speakers: 10,
            is_recording: false,
            participant_count: 5,
            livekit_room_name: 'livekit-room-123',
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      };

      // Mock participant upsert
      const mockParticipantChain = {
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockRoomChain)
        .mockReturnValueOnce(mockParticipantChain);

      // Mock token generation
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: { token: 'mock-token' },
        error: null,
      });

      const result = await liveRoomService.joinRoom(roomId, identity, 'listener');

      expect(result).toMatchObject({
        token: 'mock-token',
        room: expect.objectContaining({
          id: roomId,
          status: 'active',
        }),
      });

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('livekit-token', {
        body: {
          action: 'join',
          roomName: 'livekit-room-123',
          identity: identity,
          permissions: {
            canPublish: false,
            canSubscribe: true,
          },
        },
      });
    });

    test('スピーカーとしてルーム参加', async () => {
      const roomId = 'room-123';
      const identity = 'host-user';

      const mockRoomChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: roomId,
            host_user_id: identity,
            title: '目醒めトーク',
            status: 'active',
            max_speakers: 10,
            is_recording: false,
            participant_count: 5,
            livekit_room_name: 'livekit-room-123',
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      };

      const mockParticipantChain = {
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockRoomChain)
        .mockReturnValueOnce(mockParticipantChain);

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: { token: 'mock-token' },
        error: null,
      });

      const result = await liveRoomService.joinRoom(roomId, identity, 'speaker');

      expect(result).toMatchObject({
        token: 'mock-token',
        room: expect.objectContaining({
          id: roomId,
          status: 'active',
        }),
      });

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('livekit-token', {
        body: {
          action: 'join',
          roomName: 'livekit-room-123',
          identity: identity,
          permissions: {
            canPublish: true,
            canSubscribe: true,
          },
        },
      });
    });

    test('存在しないルームエラー', async () => {
      const roomId = 'non-existent-room';
      const identity = 'user-123';

      const mockRoomChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockRoomChain);

      await expect(liveRoomService.joinRoom(roomId, identity, 'listener')).rejects.toThrow(
        'ルームが見つかりません'
      );
    });

    test('終了済みルームエラー', async () => {
      const roomId = 'ended-room';
      const identity = 'user-123';

      const mockRoomChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: roomId,
            host_user_id: 'host-user',
            title: '目醒めトーク',
            status: 'ended',
            max_speakers: 10,
            is_recording: false,
            participant_count: 0,
            livekit_room_name: 'livekit-room-123',
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockRoomChain);

      await expect(liveRoomService.joinRoom(roomId, identity, 'listener')).rejects.toThrow(
        'このルームは終了しています'
      );
    });
  });

  describe('startRoom', () => {
    test('正常なライブ開始', async () => {
      const roomId = 'room-123';

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: roomId,
            host_user_id: mockUser.id,
            title: '目醒めトーク',
            status: 'preparing',
            max_speakers: 10,
            is_recording: false,
            participant_count: 0,
            livekit_room_name: 'livekit-room-123',
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      };

      const mockUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: roomId,
            status: 'active',
            started_at: new Date().toISOString(),
          },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValueOnce(mockSelectChain).mockReturnValueOnce(mockUpdateChain);

      const result = await liveRoomService.startRoom(roomId);

      expect(result).toMatchObject({
        status: 'active',
        startedAt: expect.any(String),
      });
    });

    test('ホスト以外が開始しようとしてエラー', async () => {
      const roomId = 'room-123';

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'other-user' } },
        error: null,
      });

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: roomId,
            host_user_id: mockUser.id,
            title: '目醒めトーク',
            status: 'preparing',
          },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockSelectChain);

      await expect(liveRoomService.startRoom(roomId)).rejects.toThrow(
        'ホストのみがライブを開始できます'
      );
    });

    test('存在しないルームでエラー', async () => {
      const roomId = 'non-existent';

      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockSelectChain);

      await expect(liveRoomService.startRoom(roomId)).rejects.toThrow('ルームが見つかりません');
    });
  });

  describe('sendChatMessage', () => {
    test('正常なチャットメッセージ送信', async () => {
      const roomId = 'room-123';
      const messageContent = 'こんにちは！';
      const messageId = 'message-123';

      // Mock the rate limit check method
      // @ts-ignore
      liveRoomService._rateLimitCheck = vi.fn().mockReturnValue(true);

      // Mock room check
      const mockRoomChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: roomId,
            status: 'active',
          },
          error: null,
        }),
      };

      // Mock message insert
      const mockMessageChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: messageId,
            room_id: roomId,
            user_id: mockUser.id,
            content: messageContent,
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValueOnce(mockRoomChain).mockReturnValueOnce(mockMessageChain);

      const result = await liveRoomService.sendChatMessage(roomId, messageContent);

      expect(result).toMatchObject({
        id: messageId,
        content: messageContent,
        userId: mockUser.id,
      });
    });

    test('空のメッセージでエラー', async () => {
      const roomId = 'room-123';

      await expect(liveRoomService.sendChatMessage(roomId, '')).rejects.toThrow(
        'メッセージ内容は必須です'
      );
    });

    test('レート制限エラー', async () => {
      const roomId = 'room-123';
      const messageContent = 'test';

      // Mock rate limit check to return false
      // @ts-ignore
      liveRoomService._rateLimitCheck = vi.fn().mockReturnValue(false);

      await expect(liveRoomService.sendChatMessage(roomId, messageContent)).rejects.toThrow(
        'メッセージ送信レートが制限を超えています'
      );
    });
  });

  describe('getChatMessages', () => {
    test('メッセージ履歴取得', async () => {
      const roomId = 'room-123';
      const messages = [
        {
          id: 'msg-1',
          content: 'Hello',
          user_id: 'user-1',
          created_at: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          content: 'Hi there',
          user_id: 'user-2',
          created_at: new Date().toISOString(),
        },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: messages,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockChain);

      const result = await liveRoomService.getChatMessages(roomId, 20);

      expect(result).toHaveLength(2);
      expect(result).toEqual(messages);
    });
  });

  describe('sendGift', () => {
    test('自分自身へのギフト送信エラー', async () => {
      const roomId = 'room-123';

      await expect(liveRoomService.sendGift(roomId, mockUser.id, 'light', 1)).rejects.toThrow(
        '自分自身にギフトを送ることはできません'
      );
    });
  });
});
