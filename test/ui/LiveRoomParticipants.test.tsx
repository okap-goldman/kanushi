import { LiveRoomParticipants } from '@/components/liveroom/LiveRoomParticipants';
import { liveRoomService } from '@/lib/liveRoomService';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/lib/liveRoomService');

describe('LiveRoomParticipants', () => {
  const mockParticipants = [
    {
      user_id: 'host-123',
      role: 'speaker',
      joined_at: new Date().toISOString(),
      user: {
        display_name: 'ホストユーザー',
        profile_image_url: 'https://example.com/host.jpg'
      }
    },
    {
      user_id: 'speaker-123',
      role: 'speaker',
      joined_at: new Date().toISOString(),
      user: {
        display_name: 'スピーカー1',
        profile_image_url: 'https://example.com/speaker1.jpg'
      }
    },
    {
      user_id: 'listener-1',
      role: 'listener',
      joined_at: new Date().toISOString(),
      user: {
        display_name: 'リスナー1',
        profile_image_url: null
      }
    },
    {
      user_id: 'listener-2',
      role: 'listener',
      joined_at: new Date().toISOString(),
      user: {
        display_name: 'リスナー2',
        profile_image_url: null
      }
    }
  ];

  const mockSpeakerRequests = [
    {
      id: 'request-1',
      requester_id: 'listener-3',
      status: 'pending',
      created_at: new Date().toISOString(),
      requester: {
        display_name: 'リスナー3'
      }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('参加者リストの表示', async () => {
    (liveRoomService.getParticipants as jest.Mock).mockResolvedValue(mockParticipants);
    (liveRoomService.getSpeakerRequests as jest.Mock).mockResolvedValue([]);

    const { getByText, getAllByTestId } = render(
      <LiveRoomParticipants
        roomId="room-123"
        hostUserId="host-123"
        currentUserId="listener-1"
        isHost={false}
      />
    );

    await waitFor(() => {
      // スピーカーセクション
      expect(getByText('スピーカー (2)')).toBeTruthy();
      expect(getByText('ホストユーザー')).toBeTruthy();
      expect(getByText('スピーカー1')).toBeTruthy();

      // リスナーセクション
      expect(getByText('リスナー (2)')).toBeTruthy();
      expect(getByText('リスナー1')).toBeTruthy();
      expect(getByText('リスナー2')).toBeTruthy();
    });

    // ホストバッジ
    const hostBadges = getAllByTestId('host-badge');
    expect(hostBadges).toHaveLength(1);
  });

  test('登壇リクエスト表示（ホスト視点）', async () => {
    (liveRoomService.getParticipants as jest.Mock).mockResolvedValue(mockParticipants);
    (liveRoomService.getSpeakerRequests as jest.Mock).mockResolvedValue(mockSpeakerRequests);

    const { getByText, getByTestId } = render(
      <LiveRoomParticipants
        roomId="room-123"
        hostUserId="host-123"
        currentUserId="host-123"
        isHost={true}
      />
    );

    await waitFor(() => {
      // 登壇リクエストセクション
      expect(getByText('登壇リクエスト (1)')).toBeTruthy();
      expect(getByText('リスナー3')).toBeTruthy();
      
      // 承認・拒否ボタン
      expect(getByTestId('approve-request-1')).toBeTruthy();
      expect(getByTestId('reject-request-1')).toBeTruthy();
    });
  });

  test('登壇リクエストの承認', async () => {
    (liveRoomService.getParticipants as jest.Mock).mockResolvedValue(mockParticipants);
    (liveRoomService.getSpeakerRequests as jest.Mock).mockResolvedValue(mockSpeakerRequests);
    (liveRoomService.handleSpeakerRequest as jest.Mock).mockResolvedValue({
      status: 'approved'
    });

    const { getByTestId } = render(
      <LiveRoomParticipants
        roomId="room-123"
        hostUserId="host-123"
        currentUserId="host-123"
        isHost={true}
      />
    );

    await waitFor(() => {
      const approveButton = getByTestId('approve-request-1');
      expect(approveButton).toBeTruthy();
    });

    // 承認ボタンをタップ
    fireEvent.press(getByTestId('approve-request-1'));

    await waitFor(() => {
      expect(liveRoomService.handleSpeakerRequest).toHaveBeenCalledWith('request-1', true);
    });
  });

  test('登壇リクエストの拒否', async () => {
    (liveRoomService.getParticipants as jest.Mock).mockResolvedValue(mockParticipants);
    (liveRoomService.getSpeakerRequests as jest.Mock).mockResolvedValue(mockSpeakerRequests);
    (liveRoomService.handleSpeakerRequest as jest.Mock).mockResolvedValue({
      status: 'rejected'
    });

    const { getByTestId } = render(
      <LiveRoomParticipants
        roomId="room-123"
        hostUserId="host-123"
        currentUserId="host-123"
        isHost={true}
      />
    );

    await waitFor(() => {
      const rejectButton = getByTestId('reject-request-1');
      expect(rejectButton).toBeTruthy();
    });

    // 拒否ボタンをタップ
    fireEvent.press(getByTestId('reject-request-1'));

    await waitFor(() => {
      expect(liveRoomService.handleSpeakerRequest).toHaveBeenCalledWith('request-1', false);
    });
  });

  test('ギフト送信ボタンの表示', async () => {
    (liveRoomService.getParticipants as jest.Mock).mockResolvedValue(mockParticipants);
    (liveRoomService.getSpeakerRequests as jest.Mock).mockResolvedValue([]);

    const { getAllByTestId } = render(
      <LiveRoomParticipants
        roomId="room-123"
        hostUserId="host-123"
        currentUserId="listener-1"
        isHost={false}
      />
    );

    await waitFor(() => {
      // スピーカーにはギフトボタンが表示される
      const giftButtons = getAllByTestId(/gift-button-.*/);
      expect(giftButtons.length).toBeGreaterThan(0);
    });
  });

  test('ギフト送信ダイアログ', async () => {
    (liveRoomService.getParticipants as jest.Mock).mockResolvedValue(mockParticipants);
    (liveRoomService.getSpeakerRequests as jest.Mock).mockResolvedValue([]);

    const { getByTestId, getByText } = render(
      <LiveRoomParticipants
        roomId="room-123"
        hostUserId="host-123"
        currentUserId="listener-1"
        isHost={false}
      />
    );

    await waitFor(() => {
      const giftButton = getByTestId('gift-button-speaker-123');
      expect(giftButton).toBeTruthy();
    });

    // ギフトボタンをタップ
    fireEvent.press(getByTestId('gift-button-speaker-123'));

    await waitFor(() => {
      // ギフト選択ダイアログが表示される
      expect(getByText('ギフトを送る')).toBeTruthy();
      expect(getByText('光のギフト (300円)')).toBeTruthy();
      expect(getByText('星のギフト (600円)')).toBeTruthy();
      expect(getByText('ダイヤモンドギフト (1200円)')).toBeTruthy();
    });
  });

  test('参加者検索フィルター', async () => {
    (liveRoomService.getParticipants as jest.Mock).mockResolvedValue(mockParticipants);
    (liveRoomService.getSpeakerRequests as jest.Mock).mockResolvedValue([]);

    const { getByPlaceholderText, getByText, queryByText } = render(
      <LiveRoomParticipants
        roomId="room-123"
        hostUserId="host-123"
        currentUserId="listener-1"
        isHost={false}
      />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('参加者を検索...')).toBeTruthy();
    });

    const searchInput = getByPlaceholderText('参加者を検索...');

    // 検索実行
    fireEvent.changeText(searchInput, 'スピーカー');

    await waitFor(() => {
      // マッチする参加者のみ表示
      expect(getByText('スピーカー1')).toBeTruthy();
      // マッチしない参加者は非表示
      expect(queryByText('リスナー1')).toBeNull();
      expect(queryByText('リスナー2')).toBeNull();
    });
  });

  test('リアルタイム更新', async () => {
    (liveRoomService.getParticipants as jest.Mock).mockResolvedValue(mockParticipants);
    (liveRoomService.getSpeakerRequests as jest.Mock).mockResolvedValue([]);

    const { getByText, rerender } = render(
      <LiveRoomParticipants
        roomId="room-123"
        hostUserId="host-123"
        currentUserId="listener-1"
        isHost={false}
      />
    );

    await waitFor(() => {
      expect(getByText('リスナー (2)')).toBeTruthy();
    });

    // 新しい参加者が追加された場合のシミュレート
    const updatedParticipants = [...mockParticipants, {
      user_id: 'listener-3',
      role: 'listener',
      joined_at: new Date().toISOString(),
      user: {
        display_name: 'リスナー3',
        profile_image_url: null
      }
    }];

    (liveRoomService.getParticipants as jest.Mock).mockResolvedValue(updatedParticipants);

    // リアルタイム更新をトリガー
    rerender(
      <LiveRoomParticipants
        roomId="room-123"
        hostUserId="host-123"
        currentUserId="listener-1"
        isHost={false}
        refreshTrigger={Date.now()}
      />
    );

    await waitFor(() => {
      expect(getByText('リスナー (3)')).toBeTruthy();
      expect(getByText('リスナー3')).toBeTruthy();
    });
  });
});
EOF < /dev/null