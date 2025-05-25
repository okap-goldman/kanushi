import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventServiceDrizzle } from '../../src/lib/eventServiceDrizzle';
import type {
  CreateEventRequest,
  CreateVoiceWorkshopRequest,
} from '../../src/lib/eventServiceDrizzle';
import { supabase } from '../../src/lib/supabase';

// モックの設定
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/stripeService', () => ({
  stripeService: {
    createPaymentIntent: vi.fn(),
    getPaymentIntent: vi.fn(),
    createRefund: vi.fn(),
  },
}));

// テスト用のユーザー
const testUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

describe('EventService - イベント作成API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('通常イベント作成', () => {
    it('有効なデータでイベント作成成功', async () => {
      const eventData: CreateEventRequest = {
        name: 'スピリチュアル瞑想会',
        description: '日常から離れて内なる声に耳を傾ける時間',
        eventType: 'offline',
        location: '東京都渋谷区',
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1週間後
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2時間後
        fee: 3000,
        currency: 'JPY',
        refundPolicy: 'イベント開始24時間前まで全額返金',
      };

      const mockEvent = {
        id: 'event-1',
        creator_user_id: testUser.id,
        name: eventData.name,
        description: eventData.description,
        event_type: eventData.eventType,
        location: eventData.location,
        starts_at: eventData.startsAt.toISOString(),
        ends_at: eventData.endsAt.toISOString(),
        fee: String(eventData.fee),
        currency: eventData.currency,
        refund_policy: eventData.refundPolicy,
        created_at: new Date().toISOString(),
      };

      const mockSupabaseChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockEvent, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const result = await eventServiceDrizzle.createEvent(eventData, testUser.id);

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data?.id).toBe('event-1');
      expect(result.data?.creatorUserId).toBe(testUser.id);
      expect(result.data?.name).toBe(eventData.name);
      expect(result.data?.description).toBe(eventData.description);
      expect(result.data?.eventType).toBe(eventData.eventType);
      expect(result.data?.location).toBe(eventData.location);
      expect(result.data?.fee).toBe(String(eventData.fee));
      expect(result.data?.currency).toBe(eventData.currency);
      expect(result.data?.refundPolicy).toBe(eventData.refundPolicy);
      expect(supabase.from).toHaveBeenCalledWith('event');
    });

    it('必須項目不足でエラー', async () => {
      const invalidEventData = {
        description: '説明のみ',
        location: '東京都',
        fee: 1000,
      } as CreateEventRequest;

      const result = await eventServiceDrizzle.createEvent(invalidEventData, testUser.id);

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('必須項目');
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('過去の日時でエラー', async () => {
      const eventData: CreateEventRequest = {
        name: '過去のイベント',
        eventType: 'online',
        startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1日前
        endsAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      };

      const result = await eventServiceDrizzle.createEvent(eventData, testUser.id);

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toBe('開始時間は現在以降である必要があります');
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('音声ワークショップ作成', () => {
    it('音声ワークショップ作成成功', async () => {
      const workshopData: CreateVoiceWorkshopRequest = {
        name: '目醒めのための音声ワークショップ',
        description: '深い気づきを得るためのガイド付き瞑想',
        location: 'オンライン（専用ルーム）',
        startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // 90分
        fee: 5000,
        currency: 'JPY',
        refundPolicy: '開始24時間前まで全額返金',
        maxParticipants: 20,
        isRecorded: false,
      };

      const mockEvent = {
        id: 'event-2',
        creator_user_id: testUser.id,
        name: workshopData.name,
        description: workshopData.description,
        event_type: 'voice_workshop',
        location: workshopData.location,
        starts_at: workshopData.startsAt.toISOString(),
        ends_at: workshopData.endsAt.toISOString(),
        fee: String(workshopData.fee),
        currency: workshopData.currency,
        refund_policy: workshopData.refundPolicy,
      };

      const mockWorkshop = {
        id: 'workshop-1',
        event_id: 'event-2',
        max_participants: workshopData.maxParticipants,
        is_recorded: workshopData.isRecorded,
        recording_url: null,
        archive_expires_at: null,
      };

      const mockSupabaseChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValueOnce({ data: mockEvent, error: null })
          .mockResolvedValueOnce({ data: mockWorkshop, error: null }),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const result = await eventServiceDrizzle.createVoiceWorkshop(workshopData, testUser.id);

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data?.eventType).toBe('voice_workshop');
      expect(result.data?.workshop).toBeTruthy();
      expect(result.data?.workshop?.maxParticipants).toBe(workshopData.maxParticipants);
      expect(result.data?.workshop?.isRecorded).toBe(workshopData.isRecorded);
      expect(supabase.from).toHaveBeenCalledWith('event');
      expect(supabase.from).toHaveBeenCalledWith('event_voice_workshop');
    });

    it('録音付きワークショップの作成', async () => {
      const workshopData: CreateVoiceWorkshopRequest = {
        name: 'アーカイブ付き音声セッション',
        description: '後から何度でも聴き返せる音声セッション',
        startsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        fee: 8000,
        currency: 'JPY',
        maxParticipants: 50,
        isRecorded: true,
        archiveExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
      };

      const mockEvent = {
        id: 'event-3',
        creator_user_id: testUser.id,
        name: workshopData.name,
        description: workshopData.description,
        event_type: 'voice_workshop',
        location: 'オンライン',
        starts_at: workshopData.startsAt.toISOString(),
        ends_at: workshopData.endsAt.toISOString(),
        fee: String(workshopData.fee),
        currency: workshopData.currency,
      };

      const mockWorkshop = {
        id: 'workshop-2',
        event_id: 'event-3',
        max_participants: workshopData.maxParticipants,
        is_recorded: true,
        recording_url: null,
        archive_expires_at: workshopData.archiveExpiresAt?.toISOString(),
      };

      const mockSupabaseChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValueOnce({ data: mockEvent, error: null })
          .mockResolvedValueOnce({ data: mockWorkshop, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const result = await eventServiceDrizzle.createVoiceWorkshop(workshopData, testUser.id);

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data?.workshop?.isRecorded).toBe(true);
      expect(result.data?.workshop?.archiveExpiresAt).toBeTruthy();
    });

    it('無効な定員設定でエラー', async () => {
      const workshopData: CreateVoiceWorkshopRequest = {
        name: '無効な定員のワークショップ',
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        maxParticipants: 1500, // 最大1000人を超える
      };

      const result = await eventServiceDrizzle.createVoiceWorkshop(workshopData, testUser.id);

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('定員は1000人以下である必要があります');
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('負の定員設定でエラー', async () => {
      const workshopData: CreateVoiceWorkshopRequest = {
        name: '負の定員のワークショップ',
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        maxParticipants: -5,
      };

      const result = await eventServiceDrizzle.createVoiceWorkshop(workshopData, testUser.id);

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('定員は1人以上である必要があります');
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('イベント参加API', () => {
    it('無料イベントへの参加成功', async () => {
      const joinData = {
        eventId: 'event-1',
      };

      const mockEvent = {
        id: 'event-1',
        creator_user_id: 'other-user',
        event_type: 'offline',
        starts_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        fee: null,
      };

      const mockParticipant = {
        id: 'participant-1',
        event_id: 'event-1',
        user_id: testUser.id,
        status: 'confirmed',
        payment_status: 'free',
      };

      // Event fetch mock
      const eventChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockEvent, error: null }),
      };

      // Existing participant check mock
      const existingParticipantChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      // New participant insert mock
      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockParticipant, error: null }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(eventChain) // For event fetch
        .mockReturnValueOnce(existingParticipantChain) // For existing participant check
        .mockReturnValueOnce(insertChain); // For participant insert

      const result = await eventServiceDrizzle.joinEvent(joinData, testUser.id);

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data?.participantId).toBe('participant-1');
      expect(result.data?.paymentRequired).toBe(false);
    });

    it('有料イベントへの参加（決済待ち）', async () => {
      const joinData = {
        eventId: 'event-2',
      };

      const mockEvent = {
        id: 'event-2',
        creator_user_id: 'other-user',
        event_type: 'online',
        starts_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        ends_at: new Date(Date.now() + 48 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        fee: '3000',
        currency: 'JPY',
      };

      const mockPaymentIntent = {
        id: 'pi_test_456',
        client_secret: 'pi_test_456_secret',
        amount: 3000,
        currency: 'jpy',
      };

      const mockParticipant = {
        id: 'participant-2',
        event_id: 'event-2',
        user_id: testUser.id,
        status: 'pending',
        payment_status: 'pending',
        stores_payment_id: 'pi_test_456',
      };

      // Event fetch mock
      const eventChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockEvent, error: null }),
      };

      // Existing participant check mock
      const existingParticipantChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      // New participant insert mock
      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockParticipant, error: null }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(eventChain)
        .mockReturnValueOnce(existingParticipantChain)
        .mockReturnValueOnce(insertChain);

      // Stripe mock
      const { stripeService } = await import('../../src/lib/stripeService');
      vi.mocked(stripeService.createPaymentIntent).mockResolvedValue({
        data: mockPaymentIntent,
        error: null,
      });

      const result = await eventServiceDrizzle.joinEvent(joinData, testUser.id);

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data?.paymentRequired).toBe(true);
      expect(result.data?.paymentIntentClientSecret).toBe('pi_test_456_secret');
    });

    it('定員に達したワークショップへの参加エラー', async () => {
      const joinData = {
        eventId: 'workshop-event-1',
      };

      const mockEvent = {
        id: 'workshop-event-1',
        event_type: 'voice_workshop',
        starts_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        ends_at: new Date(Date.now() + 72 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
        fee: '5000',
        event_voice_workshop: [
          {
            max_participants: 10,
          },
        ],
      };

      // Event fetch mock
      const eventChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockEvent, error: null }),
      };

      // Existing participant check mock
      const existingParticipantChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      // Participant count check mock
      const countChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      // Simulate the result after the second eq()
      countChain.eq.mockReturnValueOnce(countChain).mockReturnValueOnce({ count: 10 });

      (supabase.from as any)
        .mockReturnValueOnce(eventChain) // For event fetch
        .mockReturnValueOnce(existingParticipantChain) // For existing participant check
        .mockReturnValueOnce(countChain); // For participant count

      const result = await eventServiceDrizzle.joinEvent(joinData, testUser.id);

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('定員に達しています');
    });
  });

  describe('アーカイブアクセス制御API', () => {
    it('参加者によるアーカイブアクセス成功', async () => {
      const eventId = 'workshop-event-1';

      const mockEvent = {
        id: eventId,
        creator_user_id: 'other-user',
        event_type: 'voice_workshop',
        event_voice_workshop: [
          {
            is_recorded: true,
            recording_url: 'https://example.com/recording.mp3',
            archive_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      };

      const mockParticipant = {
        id: 'participant-1',
        event_id: eventId,
        user_id: testUser.id,
        status: 'confirmed',
      };

      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValueOnce({ data: mockEvent, error: null })
          .mockResolvedValueOnce({ data: mockParticipant, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const result = await eventServiceDrizzle.getArchiveAccess(eventId, testUser.id);

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data?.url).toBe('https://example.com/recording.mp3');
      expect(result.data?.expiresAt).toBeTruthy();
    });

    it('録画されていないワークショップでエラー', async () => {
      const eventId = 'workshop-event-2';

      const mockEvent = {
        id: eventId,
        event_type: 'voice_workshop',
        event_voice_workshop: [
          {
            is_recorded: false,
            recording_url: null,
          },
        ],
      };

      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockEvent, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const result = await eventServiceDrizzle.getArchiveAccess(eventId, testUser.id);

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('録画はありません');
    });
  });

  describe('ワークショップ入室制御API', () => {
    it('参加者の入室許可（開始30分前）', async () => {
      const eventId = 'workshop-event-1';
      const startsIn25Minutes = new Date(Date.now() + 25 * 60 * 1000);
      const endsIn115Minutes = new Date(Date.now() + 115 * 60 * 1000);

      const mockEvent = {
        id: eventId,
        creator_user_id: 'other-user',
        event_type: 'voice_workshop',
        live_room_id: 'room-123',
        starts_at: startsIn25Minutes.toISOString(),
        ends_at: endsIn115Minutes.toISOString(),
      };

      const mockParticipant = {
        id: 'participant-1',
        event_id: eventId,
        user_id: testUser.id,
        status: 'confirmed',
      };

      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValueOnce({ data: mockEvent, error: null })
          .mockResolvedValueOnce({ data: mockParticipant, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const result = await eventServiceDrizzle.getWorkshopRoomAccess(eventId, testUser.id);

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data?.liveRoomId).toBe('room-123');
      expect(result.data?.role).toBe('listener');
    });

    it('作成者はモデレーターロール', async () => {
      const eventId = 'workshop-event-2';
      const userId = 'creator-user-id';

      const mockEvent = {
        id: eventId,
        creator_user_id: userId,
        event_type: 'voice_workshop',
        live_room_id: 'room-456',
        starts_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        ends_at: new Date(Date.now() + 100 * 60 * 1000).toISOString(),
      };

      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockEvent, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const result = await eventServiceDrizzle.getWorkshopRoomAccess(eventId, userId);

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data?.role).toBe('moderator');
    });

    it('開始前31分以上でエラー', async () => {
      const eventId = 'workshop-event-3';
      const startsIn35Minutes = new Date(Date.now() + 35 * 60 * 1000);

      const mockEvent = {
        id: eventId,
        event_type: 'voice_workshop',
        live_room_id: 'room-789',
        starts_at: startsIn35Minutes.toISOString(),
        ends_at: new Date(startsIn35Minutes.getTime() + 90 * 60 * 1000).toISOString(),
      };

      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockEvent, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const result = await eventServiceDrizzle.getWorkshopRoomAccess(eventId, testUser.id);

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('30分前から入室可能');
    });
  });

  describe('Stripe決済統合', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('有料イベント参加時に決済インテントを作成', async () => {
      const joinData = {
        eventId: 'paid-event-1',
      };

      const mockEvent = {
        id: 'paid-event-1',
        creator_user_id: 'other-user',
        event_type: 'online',
        starts_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        ends_at: new Date(Date.now() + 48 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        fee: '5000',
        currency: 'JPY',
      };

      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 5000,
        currency: 'jpy',
      };

      const mockParticipant = {
        id: 'participant-3',
        event_id: 'paid-event-1',
        user_id: testUser.id,
        status: 'pending',
        payment_status: 'pending',
        stores_payment_id: 'pi_test_123',
      };

      // Mocks setup
      const eventChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockEvent, error: null }),
      };

      const existingParticipantChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockParticipant, error: null }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(eventChain)
        .mockReturnValueOnce(existingParticipantChain)
        .mockReturnValueOnce(insertChain);

      // Stripe mock
      const { stripeService } = await import('../../src/lib/stripeService');
      vi.mocked(stripeService.createPaymentIntent).mockResolvedValue({
        data: mockPaymentIntent,
        error: null,
      });

      const result = await eventServiceDrizzle.joinEvent(joinData, testUser.id);

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data?.paymentRequired).toBe(true);
      expect(result.data?.paymentIntentClientSecret).toBe('pi_test_123_secret');
      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith({
        amount: 5000,
        currency: 'JPY',
        metadata: {
          eventId: 'paid-event-1',
          userId: testUser.id,
          type: 'event_participation',
        },
      });
    });

    it('決済確認でイベント参加ステータスを更新', async () => {
      const participantId = 'participant-1';
      const paymentIntentId = 'pi_test_123';

      const mockParticipant = {
        id: participantId,
        status: 'pending',
        event: { fee: '3000' },
      };

      const mockPaymentIntent = {
        id: paymentIntentId,
        status: 'succeeded',
        amount: 3000,
      };

      // Supabase mocks
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockParticipant, error: null }),
      };

      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(selectChain) // For participant fetch
        .mockReturnValueOnce(updateChain); // For participant update

      // Stripe mock
      const { stripeService } = await import('../../src/lib/stripeService');
      vi.mocked(stripeService.getPaymentIntent).mockResolvedValue({
        data: mockPaymentIntent,
        error: null,
      });

      const result = await eventServiceDrizzle.confirmEventPayment(participantId, paymentIntentId);

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data?.status).toBe('confirmed');
      expect(updateChain.update).toHaveBeenCalledWith({
        status: 'confirmed',
        payment_status: 'completed',
        stores_payment_id: paymentIntentId,
      });
    });

    it('返金可能期間内のキャンセルで返金処理', async () => {
      const participantId = 'participant-1';

      const mockParticipant = {
        id: participantId,
        user_id: testUser.id,
        stores_payment_id: 'pi_test_123',
        payment_status: 'completed',
        event: {
          starts_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48時間後
          refund_policy: 'イベント開始24時間前まで全額返金',
        },
      };

      const mockRefund = {
        id: 're_test_123',
        amount: 3000,
        status: 'succeeded',
      };

      // Supabase mocks
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockParticipant, error: null }),
      };

      const deleteChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(selectChain) // For participant fetch
        .mockReturnValueOnce(deleteChain); // For participant delete

      // Stripe mock
      const { stripeService } = await import('../../src/lib/stripeService');
      vi.mocked(stripeService.createRefund).mockResolvedValue({
        data: mockRefund,
        error: null,
      });

      const result = await eventServiceDrizzle.cancelEventParticipation(participantId, testUser.id);

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data?.refunded).toBe(true);
      expect(stripeService.createRefund).toHaveBeenCalledWith({
        paymentIntentId: 'pi_test_123',
        reason: 'requested_by_customer',
      });
    });

    it('返金期限を過ぎたキャンセルでは返金なし', async () => {
      const participantId = 'participant-2';

      const mockParticipant = {
        id: participantId,
        user_id: testUser.id,
        stores_payment_id: 'pi_test_456',
        payment_status: 'completed',
        event: {
          starts_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12時間後
          refund_policy: 'イベント開始24時間前まで全額返金',
        },
      };

      // Supabase mocks
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockParticipant, error: null }),
      };

      const deleteChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      (supabase.from as any).mockReturnValueOnce(selectChain).mockReturnValueOnce(deleteChain);

      const { stripeService } = await import('../../src/lib/stripeService');

      const result = await eventServiceDrizzle.cancelEventParticipation(participantId, testUser.id);

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data?.refunded).toBe(false);
      expect(stripeService.createRefund).not.toHaveBeenCalled();
    });
  });
});
