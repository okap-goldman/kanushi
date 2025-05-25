import type { ApiResponse } from './data';
import { stripeService } from './stripeService';
import { supabase } from './supabase';

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
  paymentMethodId?: string; // Stripe決済メソッド
}

// アーカイブアクセスレスポンスの型定義
export interface ArchiveAccessResponse {
  url: string;
  expiresAt: Date | null;
}

export const eventServiceDrizzle = {
  // 通常イベントの作成
  async createEvent(
    eventData: CreateEventRequest,
    userId: string
  ): Promise<ApiResponse<EventResponse>> {
    try {
      // バリデーション
      if (!eventData.name || !eventData.startsAt || !eventData.endsAt) {
        return {
          data: null,
          error: new Error('必須項目が不足しています: name, startsAt, endsAt'),
        };
      }

      // 開始時間の検証
      if (eventData.startsAt < new Date()) {
        return {
          data: null,
          error: new Error('開始時間は現在以降である必要があります'),
        };
      }

      // 終了時間の検証
      if (eventData.endsAt <= eventData.startsAt) {
        return {
          data: null,
          error: new Error('終了時間は開始時間より後である必要があります'),
        };
      }

      // イベントの作成
      const { data, error } = await supabase
        .from('event')
        .insert({
          creator_user_id: userId,
          name: eventData.name,
          description: eventData.description,
          event_type: eventData.eventType || 'offline',
          location: eventData.location,
          starts_at: eventData.startsAt.toISOString(),
          ends_at: eventData.endsAt.toISOString(),
          fee: eventData.fee?.toString(),
          currency: eventData.currency || 'JPY',
          refund_policy: eventData.refundPolicy,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        data: {
          id: data.id,
          creatorUserId: data.creator_user_id,
          name: data.name,
          description: data.description,
          eventType: data.event_type,
          location: data.location,
          startsAt: new Date(data.starts_at),
          endsAt: new Date(data.ends_at),
          fee: data.fee,
          currency: data.currency,
          refundPolicy: data.refund_policy,
          liveRoomId: data.live_room_id,
          createdAt: new Date(data.created_at),
        } as EventResponse,
        error: null,
      };
    } catch (error) {
      console.error('Error creating event:', error);
      return { data: null, error: error as Error };
    }
  },

  // 音声ワークショップの作成
  async createVoiceWorkshop(
    workshopData: CreateVoiceWorkshopRequest,
    userId: string
  ): Promise<ApiResponse<EventResponse>> {
    try {
      // バリデーション
      if (!workshopData.name || !workshopData.startsAt || !workshopData.endsAt) {
        return {
          data: null,
          error: new Error('必須項目が不足しています: name, startsAt, endsAt'),
        };
      }

      // 開始時間の検証
      if (workshopData.startsAt < new Date()) {
        return {
          data: null,
          error: new Error('開始時間は現在以降である必要があります'),
        };
      }

      // 定員の検証
      const maxParticipants = workshopData.maxParticipants || 10;
      if (maxParticipants < 1) {
        return {
          data: null,
          error: new Error('定員は1人以上である必要があります'),
        };
      }
      if (maxParticipants > 1000) {
        return {
          data: null,
          error: new Error('定員は1000人以下である必要があります'),
        };
      }

      // イベントの作成
      const { data: newEvent, error: eventError } = await supabase
        .from('event')
        .insert({
          creator_user_id: userId,
          name: workshopData.name,
          description: workshopData.description,
          event_type: 'voice_workshop',
          location: workshopData.location || 'オンライン',
          starts_at: workshopData.startsAt.toISOString(),
          ends_at: workshopData.endsAt.toISOString(),
          fee: workshopData.fee?.toString(),
          currency: workshopData.currency || 'JPY',
          refund_policy: workshopData.refundPolicy,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // ワークショップ情報の作成
      const { data: workshopInfo, error: workshopError } = await supabase
        .from('event_voice_workshop')
        .insert({
          event_id: newEvent.id,
          max_participants: maxParticipants,
          is_recorded: workshopData.isRecorded || false,
          archive_expires_at: workshopData.archiveExpiresAt?.toISOString(),
        })
        .select()
        .single();

      if (workshopError) {
        // イベントを削除
        await supabase.from('event').delete().eq('id', newEvent.id);
        throw workshopError;
      }

      return {
        data: {
          id: newEvent.id,
          creatorUserId: newEvent.creator_user_id,
          name: newEvent.name,
          description: newEvent.description,
          eventType: newEvent.event_type,
          location: newEvent.location,
          startsAt: new Date(newEvent.starts_at),
          endsAt: new Date(newEvent.ends_at),
          fee: newEvent.fee,
          currency: newEvent.currency,
          refundPolicy: newEvent.refund_policy,
          liveRoomId: newEvent.live_room_id,
          createdAt: new Date(newEvent.created_at),
          workshop: {
            id: workshopInfo.id,
            eventId: workshopInfo.event_id,
            maxParticipants: workshopInfo.max_participants,
            isRecorded: workshopInfo.is_recorded,
            recordingUrl: workshopInfo.recording_url,
            archiveExpiresAt: workshopInfo.archive_expires_at
              ? new Date(workshopInfo.archive_expires_at)
              : null,
          },
        } as EventResponse,
        error: null,
      };
    } catch (error) {
      console.error('Error creating voice workshop:', error);
      return { data: null, error: error as Error };
    }
  },

  // イベント参加
  async joinEvent(
    joinData: JoinEventRequest,
    userId: string
  ): Promise<
    ApiResponse<{
      participantId: string;
      paymentRequired: boolean;
      paymentIntentClientSecret?: string;
    }>
  > {
    try {
      // イベント情報を取得
      const { data: event, error: eventError } = await supabase
        .from('event')
        .select('*, event_voice_workshop(max_participants)')
        .eq('id', joinData.eventId)
        .single();

      if (eventError || !event) {
        return { data: null, error: new Error('イベントが見つかりません') };
      }

      // 開始時間のチェック
      if (new Date(event.starts_at) < new Date()) {
        return { data: null, error: new Error('このイベントは既に開始しています') };
      }

      // 既に参加しているかチェック
      const { data: existingParticipant } = await supabase
        .from('event_participant')
        .select('id')
        .eq('event_id', joinData.eventId)
        .eq('user_id', userId)
        .single();

      if (existingParticipant) {
        return { data: null, error: new Error('既にこのイベントに参加しています') };
      }

      // 音声ワークショップの場合、定員チェック
      if (event.event_type === 'voice_workshop' && event.event_voice_workshop?.[0]) {
        const { count } = await supabase
          .from('event_participant')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', joinData.eventId)
          .eq('status', 'confirmed');

        if (count && count >= event.event_voice_workshop[0].max_participants) {
          return { data: null, error: new Error('このワークショップは定員に達しています') };
        }
      }

      // 決済が必要かチェック
      const paymentRequired = !!(event.fee && Number.parseFloat(event.fee) > 0);
      let paymentIntentClientSecret: string | undefined;
      let paymentIntentId: string | undefined = joinData.paymentIntentId;

      // 有料イベントで決済インテントがない場合は作成
      if (paymentRequired && !paymentIntentId) {
        const { data: paymentIntent, error: paymentError } =
          await stripeService.createPaymentIntent({
            amount: Number.parseFloat(event.fee),
            currency: event.currency || 'JPY',
            metadata: {
              eventId: joinData.eventId,
              userId: userId,
              type: 'event_participation',
            },
          });

        if (paymentError || !paymentIntent) {
          return { data: null, error: new Error('決済インテントの作成に失敗しました') };
        }

        paymentIntentId = paymentIntent.id;
        paymentIntentClientSecret = paymentIntent.client_secret || undefined;
      }

      // 参加者レコードを作成
      const { data: participant, error: participantError } = await supabase
        .from('event_participant')
        .insert({
          event_id: joinData.eventId,
          user_id: userId,
          status: paymentRequired ? 'pending' : 'confirmed',
          payment_status: paymentRequired ? 'pending' : 'free',
          stores_payment_id: paymentIntentId,
        })
        .select()
        .single();

      if (participantError) throw participantError;

      return {
        data: {
          participantId: participant.id,
          paymentRequired,
          paymentIntentClientSecret,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error joining event:', error);
      return { data: null, error: error as Error };
    }
  },

  // アーカイブアクセス制御
  async getArchiveAccess(
    eventId: string,
    userId: string
  ): Promise<ApiResponse<ArchiveAccessResponse>> {
    try {
      // イベントとワークショップ情報を取得
      const { data: event, error: eventError } = await supabase
        .from('event')
        .select('*, event_voice_workshop(*)')
        .eq('id', eventId)
        .single();

      if (eventError || !event) {
        return { data: null, error: new Error('イベントが見つかりません') };
      }

      // 音声ワークショップでない場合はエラー
      if (event.event_type !== 'voice_workshop' || !event.event_voice_workshop?.[0]) {
        return { data: null, error: new Error('このイベントにはアーカイブがありません') };
      }

      const workshop = event.event_voice_workshop[0];

      // 録画されていない場合
      if (!workshop.is_recorded || !workshop.recording_url) {
        return { data: null, error: new Error('このワークショップの録画はありません') };
      }

      // アーカイブの有効期限チェック
      if (workshop.archive_expires_at && new Date(workshop.archive_expires_at) < new Date()) {
        return { data: null, error: new Error('このアーカイブは有効期限が切れています') };
      }

      // ユーザーのアクセス権をチェック
      // 1. イベント作成者
      if (event.creator_user_id === userId) {
        return {
          data: {
            url: workshop.recording_url,
            expiresAt: workshop.archive_expires_at ? new Date(workshop.archive_expires_at) : null,
          },
          error: null,
        };
      }

      // 2. イベント参加者（confirmed状態）
      const { data: participant } = await supabase
        .from('event_participant')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .single();

      if (participant) {
        return {
          data: {
            url: workshop.recording_url,
            expiresAt: workshop.archive_expires_at ? new Date(workshop.archive_expires_at) : null,
          },
          error: null,
        };
      }

      // 3. アーカイブ購入者
      const { data: archiveAccess } = await supabase
        .from('event_archive_access')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      if (archiveAccess) {
        // 個別の有効期限チェック
        if (archiveAccess.expires_at && new Date(archiveAccess.expires_at) < new Date()) {
          return { data: null, error: new Error('アーカイブへのアクセス権が期限切れです') };
        }

        return {
          data: {
            url: workshop.recording_url,
            expiresAt: archiveAccess.expires_at ? new Date(archiveAccess.expires_at) : null,
          },
          error: null,
        };
      }

      // アクセス権なし
      return { data: null, error: new Error('このアーカイブにアクセスする権限がありません') };
    } catch (error) {
      console.error('Error getting archive access:', error);
      return { data: null, error: error as Error };
    }
  },

  // ワークショップ入室制御
  async getWorkshopRoomAccess(
    eventId: string,
    userId: string
  ): Promise<ApiResponse<{ liveRoomId: string; role: 'moderator' | 'speaker' | 'listener' }>> {
    try {
      // イベント情報を取得
      const { data: event, error: eventError } = await supabase
        .from('event')
        .select('*, event_voice_workshop(*)')
        .eq('id', eventId)
        .single();

      if (eventError || !event) {
        return { data: null, error: new Error('イベントが見つかりません') };
      }

      // 音声ワークショップでない場合はエラー
      if (event.event_type !== 'voice_workshop') {
        return { data: null, error: new Error('このイベントは音声ワークショップではありません') };
      }

      // ライブルームIDがない場合はエラー
      if (!event.live_room_id) {
        return { data: null, error: new Error('ライブルームが設定されていません') };
      }

      // 現在時刻のチェック
      const now = new Date();
      const startsAt = new Date(event.starts_at);
      const endsAt = new Date(event.ends_at);

      // 開始30分前から入室可能
      const entryAllowedTime = new Date(startsAt.getTime() - 30 * 60 * 1000);

      if (now < entryAllowedTime) {
        return { data: null, error: new Error('ワークショップ開始30分前から入室可能です') };
      }

      if (now > endsAt) {
        return { data: null, error: new Error('このワークショップは終了しました') };
      }

      // ロールの判定
      let role: 'moderator' | 'speaker' | 'listener' = 'listener';

      // 1. イベント作成者はモデレーター
      if (event.creator_user_id === userId) {
        role = 'moderator';
      } else {
        // 2. 参加者チェック
        const { data: participant } = await supabase
          .from('event_participant')
          .select('*')
          .eq('event_id', eventId)
          .eq('user_id', userId)
          .eq('status', 'confirmed')
          .single();

        if (!participant) {
          return { data: null, error: new Error('このワークショップに参加登録していません') };
        }

        // 3. 共同ホストチェック（将来的な実装のためのプレースホルダー）
        // TODO: co_host テーブルができたら実装
        // const { data: coHost } = await supabase
        //   .from('event_co_host')
        //   .select('*')
        //   .eq('event_id', eventId)
        //   .eq('user_id', userId)
        //   .single();
        //
        // if (coHost) {
        //   role = 'speaker';
        // }
      }

      return {
        data: {
          liveRoomId: event.live_room_id,
          role,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error getting workshop room access:', error);
      return { data: null, error: error as Error };
    }
  },

  // イベント更新
  async updateEvent(
    eventId: string,
    eventData: Partial<CreateEventRequest>,
    userId: string
  ): Promise<ApiResponse<EventResponse>> {
    try {
      // イベントの所有者確認
      const { data: existingEvent } = await supabase
        .from('event')
        .select('creator_user_id')
        .eq('id', eventId)
        .single();

      if (!existingEvent || existingEvent.creator_user_id !== userId) {
        return { data: null, error: new Error('このイベントを更新する権限がありません') };
      }

      // 更新データの準備
      const updateData: any = {};
      if (eventData.name !== undefined) updateData.name = eventData.name;
      if (eventData.description !== undefined) updateData.description = eventData.description;
      if (eventData.location !== undefined) updateData.location = eventData.location;
      if (eventData.startsAt !== undefined) updateData.starts_at = eventData.startsAt.toISOString();
      if (eventData.endsAt !== undefined) updateData.ends_at = eventData.endsAt.toISOString();
      if (eventData.fee !== undefined) updateData.fee = eventData.fee.toString();
      if (eventData.currency !== undefined) updateData.currency = eventData.currency;
      if (eventData.refundPolicy !== undefined) updateData.refund_policy = eventData.refundPolicy;

      // イベントの更新
      const { data, error } = await supabase
        .from('event')
        .update(updateData)
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;

      return {
        data: {
          ...data,
          startsAt: new Date(data.starts_at),
          endsAt: new Date(data.ends_at),
        } as EventResponse,
        error: null,
      };
    } catch (error) {
      console.error('Error updating event:', error);
      return { data: null, error: error as Error };
    }
  },

  // イベント削除
  async deleteEvent(eventId: string, userId: string): Promise<ApiResponse<boolean>> {
    try {
      // イベントの所有者確認
      const { data: existingEvent } = await supabase
        .from('event')
        .select('creator_user_id, starts_at')
        .eq('id', eventId)
        .single();

      if (!existingEvent || existingEvent.creator_user_id !== userId) {
        return { data: null, error: new Error('このイベントを削除する権限がありません') };
      }

      // 開始済みのイベントは削除不可
      if (new Date(existingEvent.starts_at) < new Date()) {
        return { data: null, error: new Error('開始済みのイベントは削除できません') };
      }

      // イベントの削除（カスケード削除により関連データも削除される）
      const { error } = await supabase.from('event').delete().eq('id', eventId);

      if (error) throw error;

      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting event:', error);
      return { data: null, error: error as Error };
    }
  },

  // イベント参加の決済確認
  async confirmEventPayment(
    participantId: string,
    paymentIntentId: string
  ): Promise<ApiResponse<{ status: 'confirmed' | 'failed' }>> {
    try {
      // 参加者情報を取得
      const { data: participant, error: participantError } = await supabase
        .from('event_participant')
        .select('*, event(fee)')
        .eq('id', participantId)
        .single();

      if (participantError || !participant) {
        return { data: null, error: new Error('参加者情報が見つかりません') };
      }

      // 既に確認済みの場合
      if (participant.status === 'confirmed') {
        return { data: { status: 'confirmed' }, error: null };
      }

      // Stripeから決済情報を取得
      const { data: paymentIntent, error: stripeError } =
        await stripeService.getPaymentIntent(paymentIntentId);

      if (stripeError || !paymentIntent) {
        return { data: null, error: new Error('決済情報の取得に失敗しました') };
      }

      // 決済が成功していない場合
      if (paymentIntent.status !== 'succeeded') {
        return { data: { status: 'failed' }, error: null };
      }

      // 金額の検証
      const expectedAmount = Number.parseFloat(participant.event.fee || '0');
      if (paymentIntent.amount !== expectedAmount) {
        return { data: null, error: new Error('決済金額が一致しません') };
      }

      // 参加者ステータスを更新
      const { error: updateError } = await supabase
        .from('event_participant')
        .update({
          status: 'confirmed',
          payment_status: 'completed',
          stores_payment_id: paymentIntentId,
        })
        .eq('id', participantId);

      if (updateError) throw updateError;

      return { data: { status: 'confirmed' }, error: null };
    } catch (error) {
      console.error('Error confirming event payment:', error);
      return { data: null, error: error as Error };
    }
  },

  // イベント参加のキャンセルと返金
  async cancelEventParticipation(
    participantId: string,
    userId: string
  ): Promise<ApiResponse<{ refunded: boolean }>> {
    try {
      // 参加者情報を取得
      const { data: participant, error: participantError } = await supabase
        .from('event_participant')
        .select('*, event(*)')
        .eq('id', participantId)
        .eq('user_id', userId)
        .single();

      if (participantError || !participant) {
        return { data: null, error: new Error('参加情報が見つかりません') };
      }

      const event = participant.event;

      // イベント開始時刻のチェック
      const now = new Date();
      const startsAt = new Date(event.starts_at);
      const hoursUntilStart = (startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      // 返金ポリシーのチェック（デフォルトは24時間前まで）
      let refundDeadlineHours = 24;
      if (event.refund_policy) {
        const match = event.refund_policy.match(/(\d+)時間前/);
        if (match) {
          refundDeadlineHours = Number.parseInt(match[1]);
        }
      }

      let refunded = false;

      // 返金可能期間内で、決済済みの場合
      if (
        hoursUntilStart >= refundDeadlineHours &&
        participant.stores_payment_id &&
        participant.payment_status === 'completed'
      ) {
        const { data: refund, error: refundError } = await stripeService.createRefund({
          paymentIntentId: participant.stores_payment_id,
          reason: 'requested_by_customer',
        });

        if (!refundError && refund) {
          refunded = true;
        }
      }

      // 参加者レコードを削除
      const { error: deleteError } = await supabase
        .from('event_participant')
        .delete()
        .eq('id', participantId);

      if (deleteError) throw deleteError;

      return { data: { refunded }, error: null };
    } catch (error) {
      console.error('Error canceling event participation:', error);
      return { data: null, error: error as Error };
    }
  },

  // アーカイブアクセス権の購入
  async purchaseArchiveAccess(
    eventId: string,
    userId: string,
    paymentIntentId: string
  ): Promise<ApiResponse<{ accessId: string }>> {
    try {
      // イベントとワークショップ情報を取得
      const { data: event, error: eventError } = await supabase
        .from('event')
        .select('*, event_voice_workshop(*)')
        .eq('id', eventId)
        .single();

      if (eventError || !event) {
        return { data: null, error: new Error('イベントが見つかりません') };
      }

      // 音声ワークショップでない場合はエラー
      if (event.event_type !== 'voice_workshop' || !event.event_voice_workshop?.[0]) {
        return { data: null, error: new Error('このイベントにはアーカイブがありません') };
      }

      const workshop = event.event_voice_workshop[0];

      // 録画されていない場合
      if (!workshop.is_recorded || !workshop.recording_url) {
        return { data: null, error: new Error('このワークショップの録画はありません') };
      }

      // 既にアクセス権を持っているかチェック
      const { data: existingAccess } = await supabase
        .from('event_archive_access')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      if (existingAccess) {
        return { data: null, error: new Error('既にアーカイブへのアクセス権を持っています') };
      }

      // アクセス権の作成（有効期限は30日後）
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { data: archiveAccess, error: accessError } = await supabase
        .from('event_archive_access')
        .insert({
          event_id: eventId,
          user_id: userId,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (accessError) throw accessError;

      return {
        data: { accessId: archiveAccess.id },
        error: null,
      };
    } catch (error) {
      console.error('Error purchasing archive access:', error);
      return { data: null, error: error as Error };
    }
  },
};
