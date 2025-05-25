import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { eventServiceDrizzle } from '../../src/lib/eventServiceDrizzle';
import { db } from '../../src/lib/db/client';
import { events, eventParticipants, eventVoiceWorkshops, eventArchiveAccess } from '../../src/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { CreateEventRequest, CreateVoiceWorkshopRequest } from '../../src/lib/eventServiceDrizzle';

// テスト用のユーザー
const testUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString()
};

describe('EventService - イベント作成API', () => {
  beforeEach(async () => {
    // テストデータのクリーンアップ
    await db.delete(eventArchiveAccess).where(eq(eventArchiveAccess.userId, testUser.id));
    await db.delete(eventParticipants).where(eq(eventParticipants.userId, testUser.id));
    await db.delete(eventVoiceWorkshops);
    await db.delete(events).where(eq(events.creatorUserId, testUser.id));
  });

  afterEach(async () => {
    // テストデータのクリーンアップ
    await db.delete(eventArchiveAccess).where(eq(eventArchiveAccess.userId, testUser.id));
    await db.delete(eventParticipants).where(eq(eventParticipants.userId, testUser.id));
    await db.delete(eventVoiceWorkshops);
    await db.delete(events).where(eq(events.creatorUserId, testUser.id));
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
        refundPolicy: 'イベント開始24時間前まで全額返金'
      };

      const result = await eventServiceDrizzle.createEvent(eventData, testUser.id);

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data?.id).toBeTruthy();
      expect(result.data?.creatorUserId).toBe(testUser.id);
      expect(result.data?.name).toBe(eventData.name);
      expect(result.data?.description).toBe(eventData.description);
      expect(result.data?.eventType).toBe(eventData.eventType);
      expect(result.data?.location).toBe(eventData.location);
      expect(result.data?.fee).toBe(String(eventData.fee));
      expect(result.data?.currency).toBe(eventData.currency);
      expect(result.data?.refundPolicy).toBe(eventData.refundPolicy);
    });

    it('必須項目不足でエラー', async () => {
      const invalidEventData = {
        description: '説明のみ',
        location: '東京都',
        fee: 1000
      } as CreateEventRequest;

      const result = await eventServiceDrizzle.createEvent(invalidEventData, testUser.id);

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('必須項目');
    });

    it('過去の日時でエラー', async () => {
      const eventData: CreateEventRequest = {
        name: '過去のイベント',
        eventType: 'online',
        startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1日前
        endsAt: new Date(Date.now() - 23 * 60 * 60 * 1000)
      };

      const result = await eventServiceDrizzle.createEvent(eventData, testUser.id);

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toBe('開始時間は現在以降である必要があります');
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
        isRecorded: false
      };

      const result = await eventServiceDrizzle.createVoiceWorkshop(workshopData, testUser.id);

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data?.eventType).toBe('voice_workshop');
      expect(result.data?.workshop).toBeTruthy();
      expect(result.data?.workshop?.maxParticipants).toBe(workshopData.maxParticipants);
      expect(result.data?.workshop?.isRecorded).toBe(workshopData.isRecorded);
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
        archiveExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30日後
      };

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
        maxParticipants: 1500 // 最大1000人を超える
      };

      const result = await eventServiceDrizzle.createVoiceWorkshop(workshopData, testUser.id);

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('定員');
    });

    it('負の定員設定でエラー', async () => {
      const workshopData: CreateVoiceWorkshopRequest = {
        name: '負の定員のワークショップ',
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        maxParticipants: -5
      };

      const result = await eventServiceDrizzle.createVoiceWorkshop(workshopData, testUser.id);

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('定員は1人以上である必要があります');
    });
  });
});