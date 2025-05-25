import { db } from './db/client';
import { events, eventParticipants, eventVoiceWorkshops, eventArchiveAccess } from './db/schema';
import { eq, and, gte, lte, desc, asc, count, or, ilike } from 'drizzle-orm';
import type { ApiResponse } from './data';

// イベント作成リクエストの型定義
export interface CreateEventRequest {
  name: string;
  description?: string;
  eventType?: 'online' | 'offline' | 'hybrid';
  location?: string;
  startsAt: Date;
  endsAt: Date;
  fee?: number;
  currency?: string;
  refundPolicy?: string;
}

// 音声ワークショップ作成リクエストの型定義
export interface CreateVoiceWorkshopRequest extends Omit<CreateEventRequest, 'eventType'> {
  maxParticipants?: number;
  isRecorded?: boolean;
  archiveExpiresAt?: Date;
}

// イベントレスポンスの型定義
export interface EventResponse {
  id: string;
  creatorUserId: string;
  name: string;
  description: string | null;
  eventType: 'online' | 'offline' | 'hybrid' | 'voice_workshop';
  location: string | null;
  startsAt: Date;
  endsAt: Date;
  fee: string | null;
  currency: string | null;
  refundPolicy: string | null;
  liveRoomId: string | null;
  createdAt: Date;
  workshop?: {
    id: string;
    eventId: string;
    maxParticipants: number;
    isRecorded: boolean;
    recordingUrl: string | null;
    archiveExpiresAt: Date | null;
  };
}

// イベント参加リクエストの型定義
export interface JoinEventRequest {
  eventId: string;
  paymentIntentId?: string; // Stripe決済用
}

// アーカイブアクセスレスポンスの型定義
export interface ArchiveAccessResponse {
  url: string;
  expiresAt: Date | null;
}

export const eventServiceDrizzle = {
  // 通常イベントの作成
  async createEvent(eventData: CreateEventRequest, userId: string): Promise<ApiResponse<EventResponse>> {
    try {
      // バリデーション
      if (!eventData.name || !eventData.startsAt || !eventData.endsAt) {
        return { 
          data: null, 
          error: new Error('必須項目が不足しています: name, startsAt, endsAt') 
        };
      }

      // 開始時間の検証
      if (eventData.startsAt < new Date()) {
        return { 
          data: null, 
          error: new Error('開始時間は現在以降である必要があります') 
        };
      }

      // 終了時間の検証
      if (eventData.endsAt <= eventData.startsAt) {
        return { 
          data: null, 
          error: new Error('終了時間は開始時間より後である必要があります') 
        };
      }

      // イベントの作成
      const [newEvent] = await db.insert(events).values({
        creatorUserId: userId,
        name: eventData.name,
        description: eventData.description,
        eventType: eventData.eventType || 'offline',
        location: eventData.location,
        startsAt: eventData.startsAt,
        endsAt: eventData.endsAt,
        fee: eventData.fee?.toString(),
        currency: eventData.currency || 'JPY',
        refundPolicy: eventData.refundPolicy
      }).returning();

      return { data: newEvent as EventResponse, error: null };
    } catch (error) {
      console.error('Error creating event:', error);
      return { data: null, error: error as Error };
    }
  },

  // 音声ワークショップの作成
  async createVoiceWorkshop(workshopData: CreateVoiceWorkshopRequest, userId: string): Promise<ApiResponse<EventResponse>> {
    try {
      // バリデーション
      if (!workshopData.name || !workshopData.startsAt || !workshopData.endsAt) {
        return { 
          data: null, 
          error: new Error('必須項目が不足しています: name, startsAt, endsAt') 
        };
      }

      // 開始時間の検証
      if (workshopData.startsAt < new Date()) {
        return { 
          data: null, 
          error: new Error('開始時間は現在以降である必要があります') 
        };
      }

      // 定員の検証
      const maxParticipants = workshopData.maxParticipants || 10;
      if (maxParticipants < 1) {
        return { 
          data: null, 
          error: new Error('定員は1人以上である必要があります') 
        };
      }
      if (maxParticipants > 1000) {
        return { 
          data: null, 
          error: new Error('定員は1000人以下である必要があります') 
        };
      }

      // トランザクションでイベントとワークショップ情報を作成
      const result = await db.transaction(async (tx) => {
        // イベントの作成
        const [newEvent] = await tx.insert(events).values({
          creatorUserId: userId,
          name: workshopData.name,
          description: workshopData.description,
          eventType: 'voice_workshop',
          location: workshopData.location || 'オンライン',
          startsAt: workshopData.startsAt,
          endsAt: workshopData.endsAt,
          fee: workshopData.fee?.toString(),
          currency: workshopData.currency || 'JPY',
          refundPolicy: workshopData.refundPolicy
        }).returning();

        // ワークショップ情報の作成
        const [workshopInfo] = await tx.insert(eventVoiceWorkshops).values({
          eventId: newEvent.id,
          maxParticipants,
          isRecorded: workshopData.isRecorded || false,
          archiveExpiresAt: workshopData.archiveExpiresAt
        }).returning();

        return {
          ...newEvent,
          workshop: workshopInfo
        };
      });

      return { data: result as EventResponse, error: null };
    } catch (error) {
      console.error('Error creating voice workshop:', error);
      return { data: null, error: error as Error };
    }
  },

  // イベント参加（後続のテストで実装）
  async joinEvent(joinData: JoinEventRequest, userId: string): Promise<ApiResponse<any>> {
    // TODO: 実装予定
    return { data: null, error: new Error('Not implemented') };
  },

  // アーカイブアクセス制御（後続のテストで実装）
  async getArchiveAccess(eventId: string, userId: string): Promise<ApiResponse<ArchiveAccessResponse>> {
    // TODO: 実装予定
    return { data: null, error: new Error('Not implemented') };
  },

  // ワークショップ入室制御（後続のテストで実装）
  async getWorkshopRoomAccess(eventId: string, userId: string): Promise<ApiResponse<any>> {
    // TODO: 実装予定
    return { data: null, error: new Error('Not implemented') };
  }
};