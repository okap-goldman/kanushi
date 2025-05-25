import { useNavigation } from '@react-navigation/native';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { vi } from 'vitest';

// Mock modules before importing the component
vi.mock('@react-navigation/native', () => ({
  useNavigation: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
  }),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, formatStr: string, options?: any) => {
    if (formatStr === 'PPP') return '2024年1月1日';
    if (formatStr === 'p') return '午後3:00';
    return date.toISOString();
  }),
}));

vi.mock('date-fns/locale', () => ({
  ja: {},
}));

// Import after mocks
import EventCard from '@/components/events/EventCard';
import { EventResponse } from '@/lib/eventServiceDrizzle';
import { format } from 'date-fns';

const mockNavigation = {
  navigate: vi.fn(),
};

const createMockEvent = (overrides?: Partial<EventResponse>): EventResponse => ({
  id: 'event-123',
  creatorUserId: 'creator-123',
  name: 'テストイベント',
  description: 'これはテストイベントの説明です',
  eventType: 'offline',
  location: '東京都渋谷区',
  startsAt: new Date('2024-01-01T15:00:00'),
  endsAt: new Date('2024-01-01T17:00:00'),
  fee: '3000',
  currency: 'JPY',
  refundPolicy: 'イベント開始24時間前まで全額返金',
  liveRoomId: null,
  createdAt: new Date('2023-12-01'),
  ...overrides,
});

describe('EventCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigation).mockReturnValue(mockNavigation);
  });

  it('イベント情報が正しく表示される', () => {
    const event = createMockEvent();
    const { getByText } = render(<EventCard event={event} />);

    expect(getByText('テストイベント')).toBeTruthy();
    expect(getByText('これはテストイベントの説明です')).toBeTruthy();
    expect(getByText('¥3,000')).toBeTruthy();
    expect(getByText('東京都渋谷区')).toBeTruthy();
  });

  it('無料イベントの場合、無料と表示される', () => {
    const event = createMockEvent({ fee: null });
    const { getByText } = render(<EventCard event={event} />);

    expect(getByText('無料')).toBeTruthy();
  });

  it('オンラインイベントの場合、オンラインと表示される', () => {
    const event = createMockEvent({
      eventType: 'online',
      location: null,
    });
    const { getByText } = render(<EventCard event={event} />);

    expect(getByText('オンライン')).toBeTruthy();
    expect(getByText('オンラインイベント')).toBeTruthy();
  });

  it('音声ワークショップの場合、追加情報が表示される', () => {
    const event = createMockEvent({
      eventType: 'voice_workshop',
      workshop: {
        id: 'workshop-123',
        eventId: 'event-123',
        maxParticipants: 20,
        isRecorded: true,
        recordingUrl: null,
        archiveExpiresAt: null,
      },
    });
    const { getByText } = render(<EventCard event={event} />);

    expect(getByText('音声ワークショップ')).toBeTruthy();
    expect(getByText('定員20名')).toBeTruthy();
    expect(getByText('録音あり（アーカイブ配信）')).toBeTruthy();
  });

  it('コンパクトバリアントの場合、説明が表示されない', () => {
    const event = createMockEvent();
    const { queryByText } = render(<EventCard event={event} variant="compact" />);

    expect(queryByText('これはテストイベントの説明です')).toBeNull();
  });

  it.skip('カードをタップすると詳細画面に遷移する', () => {
    const event = createMockEvent();
    const { getByText } = render(<EventCard event={event} />);

    // TODO: TouchableOpacityのテストが正しく動作するよう修正が必要
    expect(mockNavigation.navigate).toHaveBeenCalledWith('EventDetail', {
      eventId: 'event-123',
    });
  });

  it('参加中フラグが表示される', () => {
    const event = createMockEvent();
    const { getByText } = render(<EventCard event={event} isParticipating={true} />);

    expect(getByText('参加中')).toBeTruthy();
  });

  it('参加者数が表示される', () => {
    const event = createMockEvent();
    const { getByText } = render(<EventCard event={event} participantCount={15} />);

    expect(getByText('15人参加')).toBeTruthy();
  });

  it('同日イベントの場合、日付が1つだけ表示される', () => {
    const event = createMockEvent({
      startsAt: new Date('2024-01-01T15:00:00'),
      endsAt: new Date('2024-01-01T17:00:00'),
    });
    const { getByText } = render(<EventCard event={event} />);

    // 日付が表示されることを確認
    expect(getByText(/2024年1月1日/)).toBeTruthy();
  });

  it('複数日イベントの場合、両方の日付が表示される', () => {
    const event = createMockEvent({
      startsAt: new Date('2024-01-01T15:00:00'),
      endsAt: new Date('2024-01-03T17:00:00'),
    });

    // format関数をモック
    vi.mocked(format).mockImplementation((date: Date, formatStr: string) => {
      if (formatStr === 'PPP') {
        const day = date.getDate();
        return `2024年1月${day}日`;
      }
      return '午後3:00';
    });

    const { getByText } = render(<EventCard event={event} />);

    expect(getByText(/〜/)).toBeTruthy();
  });

  it('ハイブリッドイベントの場合、適切なアイコンが表示される', () => {
    const event = createMockEvent({ eventType: 'hybrid' });
    const { getByText } = render(<EventCard event={event} />);

    expect(getByText('ハイブリッド')).toBeTruthy();
  });

  it('詳細を見るリンクが表示される', () => {
    const event = createMockEvent();
    const { getByText } = render(<EventCard event={event} />);

    expect(getByText('詳細を見る')).toBeTruthy();
  });
});
