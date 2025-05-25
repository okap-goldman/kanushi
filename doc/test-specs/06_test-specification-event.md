# イベント機能テスト仕様書

## 概要

本ドキュメントは「目醒め人のためのSNS」のイベント機能について、TDD（テスト駆動開発）で実装するための詳細なテスト仕様を定義します。

### 対象機能
- イベント作成（通常イベント・音声ワークショップ）
- イベント参加・決済（無料・有料）
- イベント投稿紐付け
- 音声ワークショップのライブルーム連携
- アーカイブ視聴（購入者限定）

### テスト環境
- **React Native**: Expo SDK 53
- **テストフレームワーク**: jest-expo@~53.0.0
- **テストライブラリ**: 
  - @testing-library/react-native@^13
  - @testing-library/jest-native@^6
  - react-native-reanimated/mock
- **モック方針**: 可能な限り不使用（実際のAPIとDBを使用）

## 1. APIユニットテスト

### 1.1 イベント作成API

#### 1.1.1 通常イベント作成

```javascript
describe('POST /events - 通常イベント作成', () => {
  test('有効なデータでイベント作成成功', async () => {
    // Given
    const eventData = {
      name: 'スピリチュアル瞑想会',
      description: '初心者向けの瞑想セッション',
      location: '東京都渋谷区',
      startsAt: '2024-06-01T10:00:00Z',
      endsAt: '2024-06-01T12:00:00Z',
      fee: 0,
      currency: 'JPY',
      refundPolicy: 'キャンセル不可'
    };

    // When
    const response = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${userToken}`)
      .send(eventData);

    // Then
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: eventData.name,
      description: eventData.description,
      eventType: 'offline',
      creatorUserId: userId,
      fee: 0
    });
    expect(response.body.liveRoomId).toBeNull();
  });

  test('必須フィールド不足でバリデーションエラー', async () => {
    // Given
    const invalidData = {
      description: '説明のみ'
    };

    // When
    const response = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${userToken}`)
      .send(invalidData);

    // Then
    expect(response.status).toBe(400);
    expect(response.body.type).toBe('VALIDATION_ERROR');
    expect(response.body.errors).toContainEqual({
      field: 'name',
      message: 'Event name is required'
    });
  });

  test('未認証でアクセス拒否', async () => {
    // When
    const response = await request(app)
      .post('/events')
      .send({});

    // Then
    expect(response.status).toBe(401);
    expect(response.body.type).toBe('MISSING_TOKEN');
  });
});
```

#### 1.1.2 音声ワークショップ作成

```javascript
describe('POST /events - 音声ワークショップ作成', () => {
  test('音声ワークショップ作成でライブルーム同時作成', async () => {
    // Given
    const workshopData = {
      name: '目醒めの声明ワークショップ',
      description: '音声による深い気づきのセッション',
      eventType: 'audio_workshop',
      startsAt: '2024-06-01T14:00:00Z',
      endsAt: '2024-06-01T16:00:00Z',
      fee: 3000,
      currency: 'JPY'
    };

    // When
    const response = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${userToken}`)
      .send(workshopData);

    // Then
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      eventType: 'audio_workshop',
      fee: 3000,
      liveRoomId: expect.any(String)
    });

    // ライブルーム作成確認
    const roomResponse = await request(app)
      .get(`/live-rooms/${response.body.liveRoomId}`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(roomResponse.status).toBe(200);
    expect(roomResponse.body).toMatchObject({
      status: 'preparing',
      isRecording: true,
      maxSpeakers: 10
    });
  });

  test('LiveKit連携エラーでロールバック', async () => {
    // Given - LiveKitが利用不可状態を模擬
    const workshopData = {
      name: 'テストワークショップ',
      eventType: 'audio_workshop',
      startsAt: '2024-06-01T14:00:00Z',
      endsAt: '2024-06-01T16:00:00Z',
      fee: 1000
    };

    // Mock LiveKit failure
    jest.spyOn(liveKitService, 'createRoom')
      .mockRejectedValueOnce(new Error('LiveKit unavailable'));

    // When
    const response = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${userToken}`)
      .send(workshopData);

    // Then
    expect(response.status).toBe(500);
    expect(response.body.type).toBe('LIVEKIT_ERROR');

    // イベントが作成されていないことを確認
    const eventsResponse = await request(app)
      .get('/events?filter=created')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(eventsResponse.body.items).not.toContainEqual(
      expect.objectContaining({ name: workshopData.name })
    );
  });
});
```

### 1.2 イベント参加API

#### 1.2.1 無料イベント参加

```javascript
describe('POST /events/{eventId}/participate - 無料イベント参加', () => {
  let freeEvent;

  beforeEach(async () => {
    freeEvent = await createTestEvent({ fee: 0 });
  });

  test('無料イベントに即座に参加完了', async () => {
    // When
    const response = await request(app)
      .post(`/events/${freeEvent.id}/participate`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'going' });

    // Then
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      userId: userId,
      eventId: freeEvent.id,
      status: 'going',
      paymentStatus: 'paid'
    });
  });

  test('既に参加済みの場合は409エラー', async () => {
    // Given - 既に参加済み
    await request(app)
      .post(`/events/${freeEvent.id}/participate`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'going' });

    // When
    const response = await request(app)
      .post(`/events/${freeEvent.id}/participate`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'going' });

    // Then
    expect(response.status).toBe(409);
    expect(response.body.type).toBe('ALREADY_PARTICIPATING');
  });

  test('存在しないイベントIDで404エラー', async () => {
    // When
    const response = await request(app)
      .post('/events/non-existent-id/participate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'going' });

    // Then
    expect(response.status).toBe(404);
    expect(response.body.type).toBe('RESOURCE_NOT_FOUND');
  });
});
```

#### 1.2.2 有料イベント参加（Stores.jp決済）

```javascript
describe('POST /events/{eventId}/participate - 有料イベント参加', () => {
  let paidEvent;

  beforeEach(async () => {
    paidEvent = await createTestEvent({ fee: 3000 });
  });

  test('有料イベント参加で決済URL取得', async () => {
    // When
    const response = await request(app)
      .post(`/events/${paidEvent.id}/participate`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'going' });

    // Then
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      paymentUrl: expect.stringMatching(/^https:\/\/stores\.jp/),
      participant: expect.objectContaining({
        paymentStatus: 'pending',
        storesPaymentId: expect.any(String)
      })
    });
  });

  test('Stores.jp決済完了webhookで参加確定', async () => {
    // Given - 参加申込み
    const participateResponse = await request(app)
      .post(`/events/${paidEvent.id}/participate`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'going' });

    const { participant } = participateResponse.body;

    // When - Webhook受信
    const webhookResponse = await request(app)
      .post('/webhooks/stores')
      .send({
        type: 'payment.succeeded',
        data: {
          payment_id: participant.storesPaymentId,
          status: 'paid',
          amount: 3000
        }
      });

    // Then
    expect(webhookResponse.status).toBe(200);

    // 参加状態確認
    const eventResponse = await request(app)
      .get(`/events/${paidEvent.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    const participants = eventResponse.body.participants || [];
    expect(participants).toContainEqual(
      expect.objectContaining({
        userId: userId,
        paymentStatus: 'paid'
      })
    );
  });

  test('決済失敗webhookで参加キャンセル', async () => {
    // Given
    const participateResponse = await request(app)
      .post(`/events/${paidEvent.id}/participate`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'going' });

    const { participant } = participateResponse.body;

    // When
    const webhookResponse = await request(app)
      .post('/webhooks/stores')
      .send({
        type: 'payment.failed',
        data: {
          payment_id: participant.storesPaymentId,
          status: 'failed'
        }
      });

    // Then
    expect(webhookResponse.status).toBe(200);

    // 参加者リストから削除確認
    const eventResponse = await request(app)
      .get(`/events/${paidEvent.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    const participants = eventResponse.body.participants || [];
    expect(participants).not.toContainEqual(
      expect.objectContaining({ userId: userId })
    );
  });
});
```

### 1.3 アクセス制御API

#### 1.3.1 音声ワークショップ入室制御

```javascript
describe('POST /live-rooms/{roomId}/join - アクセス制御', () => {
  let workshop, room;

  beforeEach(async () => {
    workshop = await createTestEvent({ 
      eventType: 'audio_workshop', 
      fee: 2000 
    });
    room = await getLiveRoom(workshop.liveRoomId);
  });

  test('購入済みユーザーは入室可能', async () => {
    // Given - 決済完了済み
    await participateInEvent(workshop.id, userId, { paid: true });

    // When
    const response = await request(app)
      .post(`/live-rooms/${room.id}/join`)
      .set('Authorization', `Bearer ${userToken}`);

    // Then
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      token: expect.any(String),
      url: expect.stringMatching(/^wss?:\/\//)
    });
  });

  test('未購入ユーザーは入室拒否', async () => {
    // When
    const response = await request(app)
      .post(`/live-rooms/${room.id}/join`)
      .set('Authorization', `Bearer ${userToken}`);

    // Then
    expect(response.status).toBe(403);
    expect(response.body.type).toBe('ACCESS_DENIED');
    expect(response.body.detail).toContain('参加権限がありません');
  });

  test('決済待ちユーザーは入室拒否', async () => {
    // Given - 決済待ち状態
    await participateInEvent(workshop.id, userId, { pending: true });

    // When
    const response = await request(app)
      .post(`/live-rooms/${room.id}/join`)
      .set('Authorization', `Bearer ${userToken}`);

    // Then
    expect(response.status).toBe(402);
    expect(response.body.type).toBe('PAYMENT_REQUIRED');
  });
});
```

#### 1.3.2 アーカイブ視聴制御

```javascript
describe('GET /posts/{postId} - アーカイブ視聴制御', () => {
  let workshop, archivePost;

  beforeEach(async () => {
    workshop = await createTestEvent({ 
      eventType: 'audio_workshop', 
      fee: 1500 
    });
    archivePost = await createArchivePost(workshop.id);
  });

  test('購入済みユーザーは署名付きURL取得可能', async () => {
    // Given
    await participateInEvent(workshop.id, userId, { paid: true });

    // When
    const response = await request(app)
      .get(`/posts/${archivePost.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    // Then
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: archivePost.id,
      mediaUrl: expect.stringContaining('X-Amz-Signature'),
      eventId: workshop.id
    });
  });

  test('未購入ユーザーはプレビューのみ取得', async () => {
    // When
    const response = await request(app)
      .get(`/posts/${archivePost.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    // Then
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: archivePost.id,
      previewUrl: expect.any(String),
      eventId: workshop.id
    });
    expect(response.body.mediaUrl).toBeNull();
  });
});
```

## 2. UIユニットテスト

### 2.1 イベント作成フォーム

```javascript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CreateEventDialog } from '@/components/events/CreateEventDialog';

describe('CreateEventDialog', () => {
  const mockProps = {
    visible: true,
    onClose: jest.fn(),
    onEventCreated: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('通常イベント作成フォーム表示', () => {
    // When
    const { getByText, getByPlaceholderText } = render(
      <CreateEventDialog {...mockProps} />
    );

    // Then
    expect(getByText('イベント作成')).toBeTruthy();
    expect(getByPlaceholderText('イベント名')).toBeTruthy();
    expect(getByPlaceholderText('説明')).toBeTruthy();
    expect(getByPlaceholderText('開催場所')).toBeTruthy();
    expect(getByText('通常イベント')).toBeTruthy();
    expect(getByText('音声ワークショップ')).toBeTruthy();
  });

  test('音声ワークショップ選択時に録音設定表示', () => {
    // Given
    const { getByText, queryByText } = render(
      <CreateEventDialog {...mockProps} />
    );

    // When
    fireEvent.press(getByText('音声ワークショップ'));

    // Then
    expect(queryByText('録音設定')).toBeTruthy();
    expect(queryByText('自動録音を有効にする')).toBeTruthy();
  });

  test('有効なデータでイベント作成', async () => {
    // Given
    const { getByPlaceholderText, getByText } = render(
      <CreateEventDialog {...mockProps} />
    );

    // When
    fireEvent.changeText(getByPlaceholderText('イベント名'), 'テストイベント');
    fireEvent.changeText(getByPlaceholderText('説明'), 'テスト説明');
    fireEvent.changeText(getByPlaceholderText('開催場所'), '東京');
    fireEvent.press(getByText('作成'));

    // Then
    await waitFor(() => {
      expect(mockProps.onEventCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'テストイベント',
          description: 'テスト説明',
          location: '東京'
        })
      );
    });
  });

  test('必須フィールド未入力でエラー表示', async () => {
    // Given
    const { getByText, queryByText } = render(
      <CreateEventDialog {...mockProps} />
    );

    // When
    fireEvent.press(getByText('作成'));

    // Then
    await waitFor(() => {
      expect(queryByText('イベント名は必須です')).toBeTruthy();
    });
    expect(mockProps.onEventCreated).not.toHaveBeenCalled();
  });

  test('開始時刻が終了時刻より後の場合エラー', async () => {
    // Given
    const { getByPlaceholderText, getByText, queryByText } = render(
      <CreateEventDialog {...mockProps} />
    );

    // When
    fireEvent.changeText(getByPlaceholderText('イベント名'), 'テスト');
    fireEvent.changeText(getByPlaceholderText('開始時刻'), '2024-06-01 15:00');
    fireEvent.changeText(getByPlaceholderText('終了時刻'), '2024-06-01 14:00');
    fireEvent.press(getByText('作成'));

    // Then
    await waitFor(() => {
      expect(queryByText('終了時刻は開始時刻より後に設定してください')).toBeTruthy();
    });
  });
});
```

### 2.2 イベント詳細画面

```javascript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { EventDetailScreen } from '@/screens/EventDetail';

describe('EventDetailScreen', () => {
  const mockEvent = {
    id: 'event-1',
    name: 'スピリチュアル瞑想会',
    description: '初心者向けの瞑想セッション',
    location: '東京都渋谷区',
    startsAt: '2024-06-01T10:00:00Z',
    endsAt: '2024-06-01T12:00:00Z',
    fee: 0,
    eventType: 'offline',
    creatorUserId: 'creator-1'
  };

  test('無料イベント詳細表示', () => {
    // When
    const { getByText } = render(
      <EventDetailScreen event={mockEvent} />
    );

    // Then
    expect(getByText('スピリチュアル瞑想会')).toBeTruthy();
    expect(getByText('初心者向けの瞑想セッション')).toBeTruthy();
    expect(getByText('東京都渋谷区')).toBeTruthy();
    expect(getByText('無料')).toBeTruthy();
    expect(getByText('参加する')).toBeTruthy();
  });

  test('有料イベント詳細表示', () => {
    // Given
    const paidEvent = { ...mockEvent, fee: 3000, currency: 'JPY' };

    // When
    const { getByText } = render(
      <EventDetailScreen event={paidEvent} />
    );

    // Then
    expect(getByText('¥3,000')).toBeTruthy();
    expect(getByText('参加する')).toBeTruthy();
  });

  test('音声ワークショップの場合ライブ情報表示', () => {
    // Given
    const workshop = {
      ...mockEvent,
      eventType: 'audio_workshop',
      fee: 2000,
      liveRoom: {
        id: 'room-1',
        status: 'preparing'
      }
    };

    // When
    const { getByText } = render(
      <EventDetailScreen event={workshop} />
    );

    // Then
    expect(getByText('音声ワークショップ')).toBeTruthy();
    expect(getByText('ライブ配信')).toBeTruthy();
    expect(getByText('準備中')).toBeTruthy();
  });

  test('参加済みの場合ボタン状態変更', () => {
    // Given
    const participatedEvent = {
      ...mockEvent,
      isParticipating: true,
      paymentStatus: 'paid'
    };

    // When
    const { getByText, queryByText } = render(
      <EventDetailScreen event={participatedEvent} />
    );

    // Then
    expect(queryByText('参加済み')).toBeTruthy();
    expect(queryByText('参加する')).toBeFalsy();
  });

  test('決済待ちの場合状態表示', () => {
    // Given
    const pendingEvent = {
      ...mockEvent,
      fee: 1000,
      isParticipating: true,
      paymentStatus: 'pending'
    };

    // When
    const { getByText } = render(
      <EventDetailScreen event={pendingEvent} />
    );

    // Then
    expect(getByText('決済待ち')).toBeTruthy();
    expect(getByText('決済を完了する')).toBeTruthy();
  });
});
```

### 2.3 イベント参加ボタン

```javascript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { EventParticipateButton } from '@/components/events/EventParticipateButton';

describe('EventParticipateButton', () => {
  const mockProps = {
    event: {
      id: 'event-1',
      fee: 0
    },
    onParticipate: jest.fn(),
    onPaymentRequired: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('無料イベント参加ボタン', async () => {
    // Given
    const { getByText } = render(
      <EventParticipateButton {...mockProps} />
    );

    // When
    fireEvent.press(getByText('参加する'));

    // Then
    await waitFor(() => {
      expect(mockProps.onParticipate).toHaveBeenCalledWith('event-1', 'going');
    });
  });

  test('有料イベント参加で決済画面遷移', async () => {
    // Given
    const paidEventProps = {
      ...mockProps,
      event: { ...mockProps.event, fee: 2000 }
    };
    const { getByText } = render(
      <EventParticipateButton {...paidEventProps} />
    );

    // When
    fireEvent.press(getByText('¥2,000で参加'));

    // Then
    await waitFor(() => {
      expect(mockProps.onPaymentRequired).toHaveBeenCalledWith('event-1');
    });
  });

  test('参加処理中のローディング状態', async () => {
    // Given
    const { getByText, rerender } = render(
      <EventParticipateButton {...mockProps} />
    );

    // When
    fireEvent.press(getByText('参加する'));
    rerender(
      <EventParticipateButton {...mockProps} loading={true} />
    );

    // Then
    expect(getByText('参加中...')).toBeTruthy();
  });

  test('参加済み状態表示', () => {
    // Given
    const participatedProps = {
      ...mockProps,
      isParticipating: true,
      paymentStatus: 'paid'
    };

    // When
    const { getByText } = render(
      <EventParticipateButton {...participatedProps} />
    );

    // Then
    expect(getByText('参加済み')).toBeTruthy();
  });
});
```

### 2.4 アーカイブ再生UI

```javascript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ArchivePlayer } from '@/components/events/ArchivePlayer';

describe('ArchivePlayer', () => {
  const mockArchive = {
    id: 'post-1',
    mediaUrl: 'https://cdn.example.com/archive.mp3',
    previewUrl: 'https://cdn.example.com/preview.mp3',
    duration: 3600,
    eventId: 'event-1'
  };

  test('購入済みユーザーのフル再生', () => {
    // Given
    const { getByTestId, getByText } = render(
      <ArchivePlayer 
        archive={mockArchive} 
        hasAccess={true}
      />
    );

    // Then
    expect(getByTestId('audio-player')).toBeTruthy();
    expect(getByText('60:00')).toBeTruthy(); // フル時間表示
    expect(getByTestId('play-button')).toBeTruthy();
  });

  test('未購入ユーザーのプレビュー再生', () => {
    // Given
    const { getByTestId, getByText } = render(
      <ArchivePlayer 
        archive={mockArchive} 
        hasAccess={false}
      />
    );

    // Then
    expect(getByTestId('preview-player')).toBeTruthy();
    expect(getByText('プレビュー (30秒)')).toBeTruthy();
    expect(getByText('フル版を聴く')).toBeTruthy();
  });

  test('アクセス権なしでフル版購入促進', () => {
    // Given
    const mockOnPurchase = jest.fn();
    const { getByText } = render(
      <ArchivePlayer 
        archive={mockArchive} 
        hasAccess={false}
        onPurchase={mockOnPurchase}
      />
    );

    // When
    fireEvent.press(getByText('フル版を聴く'));

    // Then
    expect(mockOnPurchase).toHaveBeenCalledWith('event-1');
  });

  test('再生ボタン押下で音声再生開始', async () => {
    // Given
    const { getByTestId } = render(
      <ArchivePlayer 
        archive={mockArchive} 
        hasAccess={true}
      />
    );

    // When
    fireEvent.press(getByTestId('play-button'));

    // Then
    await waitFor(() => {
      expect(getByTestId('pause-button')).toBeTruthy();
    });
  });
});
```

## 3. 結合テスト

### 3.1 イベント作成からライブルーム作成まで

```javascript
describe('Event Creation Integration', () => {
  test('音声ワークショップ作成の完全フロー', async () => {
    // Given
    const eventData = {
      name: '目醒めワークショップ',
      eventType: 'audio_workshop',
      startsAt: '2024-06-01T14:00:00Z',
      endsAt: '2024-06-01T16:00:00Z',
      fee: 5000
    };

    // When - イベント作成
    const eventResponse = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${hostToken}`)
      .send(eventData);

    // Then - イベント作成確認
    expect(eventResponse.status).toBe(201);
    const event = eventResponse.body;
    expect(event.liveRoomId).toBeTruthy();

    // When - ライブルーム詳細取得
    const roomResponse = await request(app)
      .get(`/live-rooms/${event.liveRoomId}`)
      .set('Authorization', `Bearer ${hostToken}`);

    // Then - ライブルーム設定確認
    expect(roomResponse.status).toBe(200);
    expect(roomResponse.body).toMatchObject({
      hostUserId: hostUserId,
      status: 'preparing',
      isRecording: true,
      maxSpeakers: 10,
      livekitRoomName: expect.any(String)
    });

    // When - LiveKit確認（実際のLiveKit API呼び出し）
    const liveKitRooms = await liveKitClient.listRooms();
    const createdRoom = liveKitRooms.find(r => 
      r.name === roomResponse.body.livekitRoomName
    );

    // Then - LiveKitルーム存在確認
    expect(createdRoom).toBeTruthy();
    expect(createdRoom.emptyTimeout).toBe(300); // 5分
  });

  test('LiveKit障害時のトランザクションロールバック', async () => {
    // Given - LiveKit API障害を模擬
    const originalCreateRoom = liveKitService.createRoom;
    liveKitService.createRoom = jest.fn()
      .mockRejectedValue(new Error('LiveKit service unavailable'));

    const eventData = {
      name: 'FailTestWorkshop',
      eventType: 'audio_workshop',
      startsAt: '2024-06-01T14:00:00Z',
      endsAt: '2024-06-01T16:00:00Z',
      fee: 3000
    };

    // When
    const response = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${hostToken}`)
      .send(eventData);

    // Then - エラーレスポンス
    expect(response.status).toBe(500);
    expect(response.body.type).toBe('LIVEKIT_ERROR');

    // Then - データベースにイベントが作成されていないことを確認
    const eventsResponse = await request(app)
      .get('/events?filter=created')
      .set('Authorization', `Bearer ${hostToken}`);
    
    expect(eventsResponse.body.items).not.toContainEqual(
      expect.objectContaining({ name: 'FailTestWorkshop' })
    );

    // Cleanup
    liveKitService.createRoom = originalCreateRoom;
  });
});
```

### 3.2 決済完了から参加確定まで

```javascript
describe('Payment Integration', () => {
  let paidEvent;

  beforeEach(async () => {
    paidEvent = await createTestEvent({ 
      fee: 2000, 
      eventType: 'audio_workshop' 
    });
  });

  test('Stores.jp決済完了の完全フロー', async () => {
    // Given - 参加申込み
    const participateResponse = await request(app)
      .post(`/events/${paidEvent.id}/participate`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'going' });

    expect(participateResponse.status).toBe(200);
    const { participant, paymentUrl } = participateResponse.body;

    // When - Stores.jp決済シミュレーション
    const paymentResponse = await simulateStoresPayment(
      participant.storesPaymentId,
      2000,
      'succeeded'
    );

    // Then - Webhook自動呼び出し確認
    await waitFor(async () => {
      const eventResponse = await request(app)
        .get(`/events/${paidEvent.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      const updatedParticipant = eventResponse.body.participants.find(
        p => p.userId === userId
      );
      expect(updatedParticipant.paymentStatus).toBe('paid');
    }, { timeout: 5000 });

    // Then - ライブルーム入室可能確認
    const joinResponse = await request(app)
      .post(`/live-rooms/${paidEvent.liveRoomId}/join`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(joinResponse.status).toBe(200);
    expect(joinResponse.body.token).toBeTruthy();

    // Then - プッシュ通知送信確認
    const notifications = await getNotifications(userId);
    expect(notifications).toContainEqual(
      expect.objectContaining({
        title: '参加登録完了',
        body: expect.stringContaining(paidEvent.name)
      })
    );
  });

  test('決済失敗時の自動キャンセル', async () => {
    // Given - 参加申込み
    const participateResponse = await request(app)
      .post(`/events/${paidEvent.id}/participate`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'going' });

    const { participant } = participateResponse.body;

    // When - 決済失敗シミュレーション
    await simulateStoresPayment(
      participant.storesPaymentId,
      2000,
      'failed'
    );

    // Then - 参加レコード自動削除確認
    await waitFor(async () => {
      const eventResponse = await request(app)
        .get(`/events/${paidEvent.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      const participants = eventResponse.body.participants || [];
      expect(participants).not.toContainEqual(
        expect.objectContaining({ userId: userId })
      );
    }, { timeout: 5000 });
  });
});
```

### 3.3 ライブルーム終了からアーカイブ作成まで

```javascript
describe('Archive Creation Integration', () => {
  let workshop, room;

  beforeEach(async () => {
    workshop = await createTestEvent({ 
      eventType: 'audio_workshop', 
      fee: 1500 
    });
    room = await getLiveRoom(workshop.liveRoomId);
    
    // ワークショップ開始
    await request(app)
      .post(`/live-rooms/${room.id}/start`)
      .set('Authorization', `Bearer ${hostToken}`);
  });

  test('ライブルーム終了時の自動アーカイブ作成', async () => {
    // Given - 録音中状態
    expect(room.isRecording).toBe(true);

    // When - ライブルーム終了
    const endResponse = await request(app)
      .post(`/live-rooms/${room.id}/end`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ createPost: true });

    // Then - 正常終了
    expect(endResponse.status).toBe(200);

    // Then - アーカイブ投稿作成確認
    await waitFor(async () => {
      const postsResponse = await request(app)
        .get('/posts')
        .set('Authorization', `Bearer ${hostToken}`)
        .query({ eventId: workshop.id });

      const archivePosts = postsResponse.body.items.filter(
        post => post.contentType === 'audio' && post.eventId === workshop.id
      );
      expect(archivePosts).toHaveLength(1);

      const archivePost = archivePosts[0];
      expect(archivePost.mediaUrl).toMatch(/^https:\/\/cdn\./);
      expect(archivePost.durationSeconds).toBeGreaterThan(0);
    }, { timeout: 10000 });

    // Then - 参加者への通知送信確認
    const participants = await getEventParticipants(workshop.id);
    for (const participant of participants) {
      const notifications = await getNotifications(participant.userId);
      expect(notifications).toContainEqual(
        expect.objectContaining({
          title: 'アーカイブ公開',
          body: expect.stringContaining('視聴可能')
        })
      );
    }
  });

  test('録音データのB2アップロード確認', async () => {
    // When - ライブルーム終了
    await request(app)
      .post(`/live-rooms/${room.id}/end`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ createPost: true });

    // Then - B2ストレージ確認
    await waitFor(async () => {
      const b2Objects = await b2Client.listObjects({
        bucketName: process.env.B2_BUCKET_NAME,
        prefix: `archives/${workshop.id}/`
      });

      expect(b2Objects.length).toBeGreaterThan(0);
      
      const archiveFile = b2Objects.find(obj => 
        obj.fileName.endsWith('.mp3') || obj.fileName.endsWith('.wav')
      );
      expect(archiveFile).toBeTruthy();
      expect(archiveFile.contentLength).toBeGreaterThan(1000); // 最低1KB
    }, { timeout: 15000 });
  });
});
```

## 4. E2Eテスト

### 4.1 音声ワークショップの完全フロー

```javascript
describe('Audio Workshop E2E', () => {
  test('ホストによる音声ワークショップ開催の完全フロー', async () => {
    // Given - テストユーザー準備
    const host = await createTestUser({ role: 'host' });
    const participant1 = await createTestUser({ role: 'participant' });
    const participant2 = await createTestUser({ role: 'participant' });

    // Step 1: ホストがワークショップ作成
    const createEventResponse = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${host.token}`)
      .send({
        name: 'E2E音声ワークショップ',
        description: '完全フローテスト用ワークショップ',
        eventType: 'audio_workshop',
        startsAt: new Date(Date.now() + 60000).toISOString(), // 1分後
        endsAt: new Date(Date.now() + 3600000).toISOString(), // 1時間後
        fee: 1000,
        currency: 'JPY'
      });

    expect(createEventResponse.status).toBe(201);
    const workshop = createEventResponse.body;

    // Step 2: 参加者が決済付きで参加申込み
    const participate1Response = await request(app)
      .post(`/events/${workshop.id}/participate`)
      .set('Authorization', `Bearer ${participant1.token}`)
      .send({ status: 'going' });

    expect(participate1Response.status).toBe(200);
    
    // Step 3: 決済完了シミュレーション
    await simulateStoresPayment(
      participate1Response.body.participant.storesPaymentId,
      1000,
      'succeeded'
    );

    // 参加者2も同様
    const participate2Response = await request(app)
      .post(`/events/${workshop.id}/participate`)
      .set('Authorization', `Bearer ${participant2.token}`)
      .send({ status: 'going' });

    await simulateStoresPayment(
      participate2Response.body.participant.storesPaymentId,
      1000,
      'succeeded'
    );

    // Step 4: ホストがライブルーム開始
    const startResponse = await request(app)
      .post(`/live-rooms/${workshop.liveRoomId}/start`)
      .set('Authorization', `Bearer ${host.token}`);

    expect(startResponse.status).toBe(200);

    // Step 5: 参加者がライブルーム入室
    const joinResponse1 = await request(app)
      .post(`/live-rooms/${workshop.liveRoomId}/join`)
      .set('Authorization', `Bearer ${participant1.token}`);

    expect(joinResponse1.status).toBe(200);
    expect(joinResponse1.body.token).toBeTruthy();

    // Step 6: ライブルームでの活動シミュレーション
    // チャット送信
    const chatResponse = await request(app)
      .post(`/live-rooms/${workshop.liveRoomId}/chat`)
      .set('Authorization', `Bearer ${participant1.token}`)
      .send({
        content: 'とても素晴らしいワークショップです！'
      });

    expect(chatResponse.status).toBe(201);

    // Step 7: ホストがライブルーム終了（アーカイブ作成）
    const endResponse = await request(app)
      .post(`/live-rooms/${workshop.liveRoomId}/end`)
      .set('Authorization', `Bearer ${host.token}`)
      .send({ createPost: true });

    expect(endResponse.status).toBe(200);

    // Step 8: アーカイブ投稿作成確認
    await waitFor(async () => {
      const postsResponse = await request(app)
        .get('/posts')
        .set('Authorization', `Bearer ${host.token}`)
        .query({ eventId: workshop.id });

      const archivePosts = postsResponse.body.items.filter(
        post => post.contentType === 'audio'
      );
      expect(archivePosts).toHaveLength(1);
    }, { timeout: 10000 });

    // Step 9: 参加者のアーカイブ視聴権限確認
    const archiveAccessResponse = await request(app)
      .get('/posts')
      .set('Authorization', `Bearer ${participant1.token}`)
      .query({ eventId: workshop.id });

    const archivePost = archiveAccessResponse.body.items.find(
      post => post.contentType === 'audio'
    );
    expect(archivePost.mediaUrl).toBeTruthy(); // 署名付きURL取得可能

    // Step 10: 未購入者のアクセス制御確認
    const nonParticipant = await createTestUser({ role: 'guest' });
    const noAccessResponse = await request(app)
      .get(`/posts/${archivePost.id}`)
      .set('Authorization', `Bearer ${nonParticipant.token}`);

    expect(noAccessResponse.body.mediaUrl).toBeFalsy(); // フルアクセス不可
    expect(noAccessResponse.body.previewUrl).toBeTruthy(); // プレビューのみ
  });
});
```

### 4.2 決済エラーハンドリングE2E

```javascript
describe('Payment Error Handling E2E', () => {
  test('決済エラー発生時の完全復旧フロー', async () => {
    // Given
    const user = await createTestUser();
    const event = await createTestEvent({ fee: 2000 });

    // Step 1: 正常な参加申込み
    const participateResponse = await request(app)
      .post(`/events/${event.id}/participate`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ status: 'going' });

    expect(participateResponse.status).toBe(200);
    const { participant } = participateResponse.body;

    // Step 2: 決済失敗シミュレーション
    await simulateStoresPayment(
      participant.storesPaymentId,
      2000,
      'failed'
    );

    // Step 3: 自動キャンセル確認
    await waitFor(async () => {
      const eventResponse = await request(app)
        .get(`/events/${event.id}`)
        .set('Authorization', `Bearer ${user.token}`);

      const participants = eventResponse.body.participants || [];
      expect(participants).not.toContainEqual(
        expect.objectContaining({ userId: user.id })
      );
    }, { timeout: 5000 });

    // Step 4: 再度参加申込み
    const retryResponse = await request(app)
      .post(`/events/${event.id}/participate`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ status: 'going' });

    expect(retryResponse.status).toBe(200);

    // Step 5: 今度は決済成功
    await simulateStoresPayment(
      retryResponse.body.participant.storesPaymentId,
      2000,
      'succeeded'
    );

    // Step 6: 参加確定確認
    await waitFor(async () => {
      const finalEventResponse = await request(app)
        .get(`/events/${event.id}`)
        .set('Authorization', `Bearer ${user.token}`);

      const finalParticipants = finalEventResponse.body.participants || [];
      expect(finalParticipants).toContainEqual(
        expect.objectContaining({
          userId: user.id,
          paymentStatus: 'paid'
        })
      );
    }, { timeout: 5000 });
  });
});
```

### 4.3 アクセス権限制御E2E

```javascript
describe('Access Control E2E', () => {
  test('段階的アクセス権限制御の完全フロー', async () => {
    // Given - ユーザーとワークショップ準備
    const host = await createTestUser({ role: 'host' });
    const paidUser = await createTestUser({ role: 'paid_participant' });
    const freeUser = await createTestUser({ role: 'free_user' });

    const workshop = await createTestEvent({
      creatorUserId: host.id,
      eventType: 'audio_workshop',
      fee: 1500
    });

    // Step 1: 有料ユーザーの決済完了
    const participateResponse = await request(app)
      .post(`/events/${workshop.id}/participate`)
      .set('Authorization', `Bearer ${paidUser.token}`)
      .send({ status: 'going' });

    await simulateStoresPayment(
      participateResponse.body.participant.storesPaymentId,
      1500,
      'succeeded'
    );

    // Step 2: ワークショップ開始
    await request(app)
      .post(`/live-rooms/${workshop.liveRoomId}/start`)
      .set('Authorization', `Bearer ${host.token}`);

    // Step 3: 有料ユーザーは入室可能
    const joinResponse = await request(app)
      .post(`/live-rooms/${workshop.liveRoomId}/join`)
      .set('Authorization', `Bearer ${paidUser.token}`);

    expect(joinResponse.status).toBe(200);

    // Step 4: 無料ユーザーは入室拒否
    const deniedJoinResponse = await request(app)
      .post(`/live-rooms/${workshop.liveRoomId}/join`)
      .set('Authorization', `Bearer ${freeUser.token}`);

    expect(deniedJoinResponse.status).toBe(403);

    // Step 5: ワークショップ終了・アーカイブ作成
    await request(app)
      .post(`/live-rooms/${workshop.liveRoomId}/end`)
      .set('Authorization', `Bearer ${host.token}`)
      .send({ createPost: true });

    // アーカイブ作成待ち
    await waitFor(async () => {
      const postsResponse = await request(app)
        .get('/posts')
        .query({ eventId: workshop.id });
      
      return postsResponse.body.items.some(
        post => post.contentType === 'audio'
      );
    }, { timeout: 10000 });

    // Step 6: 有料ユーザーはフル再生可能
    const paidArchiveResponse = await request(app)
      .get('/posts')
      .set('Authorization', `Bearer ${paidUser.token}`)
      .query({ eventId: workshop.id });

    const paidArchive = paidArchiveResponse.body.items.find(
      post => post.contentType === 'audio'
    );
    expect(paidArchive.mediaUrl).toMatch(/X-Amz-Signature/); // 署名付きURL

    // Step 7: 無料ユーザーはプレビューのみ
    const freeArchiveResponse = await request(app)
      .get(`/posts/${paidArchive.id}`)
      .set('Authorization', `Bearer ${freeUser.token}`);

    expect(freeArchiveResponse.body.mediaUrl).toBeFalsy();
    expect(freeArchiveResponse.body.previewUrl).toBeTruthy();

    // Step 8: 無料ユーザーが後から参加申込み
    const laterParticipateResponse = await request(app)
      .post(`/events/${workshop.id}/participate`)
      .set('Authorization', `Bearer ${freeUser.token}`)
      .send({ status: 'going' });

    await simulateStoresPayment(
      laterParticipateResponse.body.participant.storesPaymentId,
      1500,
      'succeeded'
    );

    // Step 9: 決済後はフル視聴可能
    await waitFor(async () => {
      const upgradedAccessResponse = await request(app)
        .get(`/posts/${paidArchive.id}`)
        .set('Authorization', `Bearer ${freeUser.token}`);

      expect(upgradedAccessResponse.body.mediaUrl).toMatch(/X-Amz-Signature/);
    }, { timeout: 5000 });
  });
});
```

## 5. テストデータセットアップ

### 5.1 テストヘルパー関数

```javascript
// test-helpers/eventHelpers.js
export const createTestEvent = async (overrides = {}) => {
  const defaultEvent = {
    name: 'テストイベント',
    description: 'テスト用の説明',
    location: '東京',
    startsAt: new Date(Date.now() + 86400000).toISOString(), // 明日
    endsAt: new Date(Date.now() + 90000000).toISOString(),   // 明日+1時間
    fee: 0,
    currency: 'JPY',
    eventType: 'offline'
  };

  const eventData = { ...defaultEvent, ...overrides };
  
  const response = await request(app)
    .post('/events')
    .set('Authorization', `Bearer ${testUserToken}`)
    .send(eventData);

  return response.body;
};

export const participateInEvent = async (eventId, userId, paymentStatus = 'paid') => {
  const participateResponse = await request(app)
    .post(`/events/${eventId}/participate`)
    .set('Authorization', `Bearer ${getUserToken(userId)}`)
    .send({ status: 'going' });

  if (paymentStatus === 'paid') {
    await simulateStoresPayment(
      participateResponse.body.participant.storesPaymentId,
      1000,
      'succeeded'
    );
  }

  return participateResponse.body;
};

export const simulateStoresPayment = async (paymentId, amount, status) => {
  return await request(app)
    .post('/webhooks/stores')
    .send({
      type: `payment.${status}`,
      data: {
        payment_id: paymentId,
        amount,
        status,
        currency: 'JPY'
      }
    });
};
```

### 5.2 テスト環境設定

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/test-setup.js'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.{js,ts}',
    '<rootDir>/src/**/*.{test,spec}.{js,ts}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 30000
};
```

### 5.3 テストセットアップ

```javascript
// test-setup.js
import { jest } from '@jest/globals';
import 'react-native-reanimated/lib/reanimated2/jestUtils';

// React Native Reanimated mock
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Supabase mock（最小限）
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    }))
  }
}));

// Test database setup
beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await cleanupTestDatabase();
});

beforeEach(async () => {
  await clearTestData();
});
```

## 6. パフォーマンステスト

### 6.1 API応答時間テスト

```javascript
describe('Event API Performance', () => {
  test('イベント一覧取得のレスポンス時間', async () => {
    // Given - 100件のイベント作成
    for (let i = 0; i < 100; i++) {
      await createTestEvent({ name: `Event ${i}` });
    }

    // When
    const startTime = Date.now();
    const response = await request(app)
      .get('/events')
      .set('Authorization', `Bearer ${userToken}`);
    const responseTime = Date.now() - startTime;

    // Then
    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(2000); // 2秒以内
    expect(response.body.items).toHaveLength(20); // デフォルトページサイズ
  });

  test('同時参加申込みの処理性能', async () => {
    // Given
    const event = await createTestEvent({ fee: 1000 });
    const users = await Promise.all(
      Array.from({ length: 50 }, () => createTestUser())
    );

    // When - 50人同時参加申込み
    const startTime = Date.now();
    const responses = await Promise.all(
      users.map(user => 
        request(app)
          .post(`/events/${event.id}/participate`)
          .set('Authorization', `Bearer ${user.token}`)
          .send({ status: 'going' })
      )
    );
    const totalTime = Date.now() - startTime;

    // Then
    expect(responses.every(r => r.status === 200)).toBe(true);
    expect(totalTime).toBeLessThan(10000); // 10秒以内
  });
});
```

## まとめ

このテスト仕様書では、イベント機能の以下の観点を網羅的にテストします：

### テスト対象
1. **イベント作成** - 通常イベント・音声ワークショップ
2. **参加申込み** - 無料・有料イベントの決済フロー
3. **アクセス制御** - ライブルーム・アーカイブの権限制御
4. **エラーハンドリング** - 決済失敗・API障害への対応
5. **パフォーマンス** - 大量データ・同時アクセス対応

### テスト種別
- **APIユニットテスト**: 個別エンドポイントの機能検証
- **UIユニットテスト**: コンポーネント単位の動作検証
- **結合テスト**: 複数サービス間の連携検証
- **E2Eテスト**: ユーザージャーニー全体の検証

この仕様に基づいてTDDで実装することで、堅牢で信頼性の高いイベント機能を構築できます。