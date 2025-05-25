import { supabase } from './supabase';
import type { Database } from './db/schema';

type Tables = Database['public']['Tables'];
type LiveRoom = Tables['live_rooms']['Row'];
type LiveRoomInsert = Tables['live_rooms']['Insert'];
type LiveRoomChat = Tables['live_room_chats']['Row'];
type LiveRoomGift = Tables['live_room_gifts']['Row'];
type LiveRoomParticipant = Tables['live_room_participants']['Row'];
type SpeakerRequest = Tables['speaker_requests']['Row'];

interface CreateRoomData {
  title: string;
  maxSpeakers: number;
  isRecording: boolean;
}

interface JoinRoomResult {
  token: string;
  room: LiveRoom;
}

interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  sharedUrl?: string;
  urlPreview?: {
    title: string;
    description: string;
    image?: string;
  };
  createdAt: string;
}

interface Gift {
  id: string;
  giftType: string;
  quantity: number;
  totalAmount: number;
}

const GIFT_PRICES = {
  light: 300,
  star: 600,
  diamond: 1200
};

class LiveRoomService {
  private rateLimitMap = new Map<string, number[]>();

  async createRoom(data: CreateRoomData) {
    // バリデーション
    if (!data.title || data.title.trim() === '') {
      throw new Error('タイトルは1-50文字で入力してください');
    }
    if (data.title.length > 50) {
      throw new Error('タイトルは1-50文字で入力してください');
    }
    if (data.maxSpeakers < 1 || data.maxSpeakers > 15) {
      throw new Error('最大登壇者数は1-15人の範囲で指定してください');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('認証が必要です');
    }

    const roomName = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // LiveKit Room作成（Edge Function経由）
      const { data: livekitRoom, error: livekitError } = await supabase.functions.invoke('manage-livekit-room', {
        body: {
          action: 'create',
          roomName,
          emptyTimeout: 300,
          maxParticipants: data.maxSpeakers
        }
      });

      if (livekitError) {
        throw new Error(`LiveKit error: ${livekitError.message}`);
      }

      // DBにルーム情報を保存
      const { data: room, error: dbError } = await supabase
        .from('live_rooms')
        .insert({
          host_user_id: user.id,
          title: data.title,
          status: 'preparing',
          max_speakers: data.maxSpeakers,
          is_recording: data.isRecording,
          participant_count: 0,
          livekit_room_name: roomName
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      return {
        id: room.id,
        hostUser: {
          id: user.id,
          displayName: user.user_metadata?.display_name || 'Unknown'
        },
        title: room.title,
        status: room.status,
        maxSpeakers: room.max_speakers,
        isRecording: room.is_recording,
        participantCount: room.participant_count,
        livekitRoomName: room.livekit_room_name,
        createdAt: room.created_at
      };
    } catch (error) {
      throw new Error(`ルーム作成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async joinRoom(roomId: string, identity: string, role: 'speaker' | 'listener') {
    const { data: room, error } = await supabase
      .from('live_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error || !room) {
      throw new Error('ルームが見つかりません');
    }

    if (room.status === 'ended') {
      throw new Error('このルームは終了しています');
    }

    // LiveKitトークン生成（Edge Function経由）
    const { data: tokenData, error: tokenError } = await supabase.functions.invoke('livekit-token', {
      body: {
        action: 'join',
        roomName: room.livekit_room_name,
        identity,
        permissions: {
          canPublish: role === 'speaker',
          canSubscribe: true
        }
      }
    });

    if (tokenError) {
      throw new Error('トークン生成に失敗しました');
    }

    // 参加者記録
    await supabase
      .from('live_room_participants')
      .upsert({
        room_id: roomId,
        user_id: identity,
        role,
        joined_at: new Date().toISOString()
      });

    return {
      token: tokenData.token,
      room
    };
  }

  async startRoom(roomId: string) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('認証が必要です');
    }

    const { data: room, error } = await supabase
      .from('live_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error || !room) {
      throw new Error('ルームが見つかりません');
    }

    if (room.host_user_id !== user.id) {
      throw new Error('ホストのみがライブを開始できます');
    }

    const { data: updatedRoom, error: updateError } = await supabase
      .from('live_rooms')
      .update({
        status: 'active',
        started_at: new Date().toISOString()
      })
      .eq('id', roomId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return {
      status: updatedRoom.status,
      startedAt: updatedRoom.started_at
    };
  }

  async endRoom(roomId: string, createPost: boolean) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('認証が必要です');
    }

    const { data: room, error } = await supabase
      .from('live_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error || !room) {
      throw new Error('ルームが見つかりません');
    }

    if (room.host_user_id !== user.id) {
      throw new Error('ホストのみがライブを終了できます');
    }

    // ルームを終了
    const { data: updatedRoom, error: updateError } = await supabase
      .from('live_rooms')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString()
      })
      .eq('id', roomId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // LiveKitルーム削除（Edge Function経由）
    await supabase.functions.invoke('manage-livekit-room', {
      body: { 
        action: 'delete',
        roomName: room.livekit_room_name 
      }
    });

    let postId = null;

    // 録音がある場合は投稿を作成
    if (room.is_recording && room.recording_url && createPost) {
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: `ライブルーム: ${room.title}`,
          audio_url: room.recording_url,
          is_public: true
        })
        .select()
        .single();

      if (!postError && post) {
        postId = post.id;
      }
    }

    return {
      status: updatedRoom.status,
      endedAt: updatedRoom.ended_at,
      postId
    };
  }

  async requestToSpeak(roomId: string) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('認証が必要です');
    }

    const { data: room } = await supabase
      .from('live_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (!room || room.status !== 'active') {
      throw new Error('アクティブなルームが見つかりません');
    }

    // 既存のリクエスト確認
    const { data: existingRequest } = await supabase
      .from('speaker_requests')
      .select('*')
      .eq('room_id', roomId)
      .eq('requester_id', user.id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      throw new Error('既に登壇リクエストを送信済みです');
    }

    const { data: request, error: requestError } = await supabase
      .from('speaker_requests')
      .insert({
        room_id: roomId,
        requester_id: user.id,
        status: 'pending'
      })
      .select()
      .single();

    if (requestError) {
      throw requestError;
    }

    return {
      id: request.id,
      status: request.status
    };
  }

  async handleSpeakerRequest(requestId: string, approve: boolean) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('認証が必要です');
    }

    const { data: request, error } = await supabase
      .from('speaker_requests')
      .select('*, room:live_rooms(*)')
      .eq('id', requestId)
      .single();

    if (error || !request) {
      throw new Error('リクエストが見つかりません');
    }

    if (request.room.host_user_id !== user.id) {
      throw new Error('ホストのみがリクエストを承認できます');
    }

    const status = approve ? 'approved' : 'rejected';

    const { data: updatedRequest, error: updateError } = await supabase
      .from('speaker_requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // 承認の場合は参加者のロールを更新
    if (approve) {
      await supabase
        .from('live_room_participants')
        .update({ role: 'speaker' })
        .eq('room_id', request.room_id)
        .eq('user_id', request.requester_id);
    }

    return {
      status: updatedRequest.status
    };
  }

  async sendChatMessage(roomId: string, content: string, options?: { sharedUrl?: string }) {
    if (!content || content.trim() === '') {
      throw new Error('メッセージ内容は必須です');
    }

    // レート制限チェック
    if (!this._rateLimitCheck || !this._rateLimitCheck(roomId, 10)) {
      throw new Error('メッセージ送信レートが制限を超えています');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('認証が必要です');
    }

    const { data: room } = await supabase
      .from('live_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (!room || room.status !== 'active') {
      throw new Error('アクティブなルームが見つかりません');
    }

    let urlPreview = undefined;
    if (options?.sharedUrl) {
      // URL プレビュー生成（簡易実装）
      urlPreview = {
        title: 'Example Article',
        description: 'An example article',
        image: 'https://example.com/image.jpg'
      };
    }

    const { data: message, error } = await supabase
      .from('live_room_chats')
      .insert({
        room_id: roomId,
        user_id: user.id,
        content,
        shared_url: options?.sharedUrl,
        url_preview: urlPreview
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      id: message.id,
      content: message.content,
      userId: message.user_id,
      sharedUrl: message.shared_url,
      urlPreview: message.url_preview,
      createdAt: message.created_at
    };
  }

  async getChatMessages(roomId: string, limit = 20) {
    const { data: messages, error } = await supabase
      .from('live_room_chats')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return messages;
  }

  async sendGift(roomId: string, recipientId: string, giftType: string, quantity: number) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('認証が必要です');
    }

    if (user.id === recipientId) {
      throw new Error('自分自身にギフトを送ることはできません');
    }

    // ルーム確認
    const { data: room } = await supabase
      .from('live_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (!room || room.status !== 'active') {
      throw new Error('アクティブなルームが見つかりません');
    }

    // 受信者がルームに参加しているか確認
    const { data: participant } = await supabase
      .from('live_room_participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', recipientId)
      .single();

    if (!participant) {
      throw new Error('指定されたユーザーはルームに参加していません');
    }

    // ポイント確認
    const totalAmount = GIFT_PRICES[giftType as keyof typeof GIFT_PRICES] * quantity;
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.points < totalAmount) {
      throw new Error('ポイントが不足しています');
    }

    // ギフト送信
    const { data: gift, error: giftError } = await supabase
      .from('live_room_gifts')
      .insert({
        room_id: roomId,
        sender_id: user.id,
        recipient_id: recipientId,
        gift_type: giftType,
        quantity,
        total_amount: totalAmount
      })
      .select()
      .single();

    if (giftError) {
      throw giftError;
    }

    return {
      id: gift.id,
      giftType: gift.gift_type,
      quantity: gift.quantity,
      totalAmount: gift.total_amount
    };
  }

  // レート制限のヘルパー関数（テスト用にモック可能）
  _rateLimitCheck(roomId: string, maxPerMinute: number): boolean {
    const now = Date.now();
    const timestamps = this.rateLimitMap.get(roomId) || [];
    const recentTimestamps = timestamps.filter(t => now - t < 60000);
    
    if (recentTimestamps.length >= maxPerMinute) {
      return false;
    }
    
    recentTimestamps.push(now);
    this.rateLimitMap.set(roomId, recentTimestamps);
    return true;
  }

  async getParticipants(roomId: string) {
    const { data, error } = await supabase
      .from('live_room_participants')
      .select(`
        *,
        user:profiles(
          display_name,
          profile_image_url
        )
      `)
      .eq('room_id', roomId)
      .is('left_at', null);

    if (error) {
      throw error;
    }

    return data || [];
  }

  async getSpeakerRequests(roomId: string) {
    const { data, error } = await supabase
      .from('speaker_requests')
      .select(`
        *,
        requester:profiles!requester_id(
          display_name
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  async getActiveRooms() {
    const { data, error } = await supabase
      .from('live_rooms')
      .select(`
        *,
        host:profiles!host_user_id(
          display_name,
          profile_image_url
        )
      `)
      .in('status', ['preparing', 'active'])
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }
}

export const liveRoomService = new LiveRoomService();