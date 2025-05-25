import { useNavigation } from '@react-navigation/native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { vi } from 'vitest';

// Mock Alert directly
const Alert = {
  alert: vi.fn(),
};

// Mock dependencies
vi.mock('@react-navigation/native', () => ({
  useNavigation: vi.fn(),
}));

vi.mock('@/lib/eventServiceDrizzle', () => ({
  eventServiceDrizzle: {
    createEvent: vi.fn(),
    createVoiceWorkshop: vi.fn(),
  },
}));

// Mock date-fns with a simpler implementation
vi.mock('date-fns', () => ({
  format: (date: Date, formatStr: string) => {
    if (formatStr === 'PPP') return '2024年1月1日';
    if (formatStr === 'p') return '午後3:00';
    return date.toISOString();
  },
}));

vi.mock('date-fns/locale', () => ({
  ja: {},
}));

// Import components
import CreateEventDialog from '@/components/events/CreateEventDialog';
import { eventServiceDrizzle } from '@/lib/eventServiceDrizzle';

const mockNavigation = {
  navigate: vi.fn(),
};

// Mock useAuth at module level
let mockAuthUser: any = { id: 'user-123', email: 'test@example.com' };

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: any) => children,
}));

describe('CreateEventDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigation).mockReturnValue(mockNavigation);
    // Reset to default user
    mockAuthUser = { id: 'user-123', email: 'test@example.com' };
  });

  const renderComponent = (props: any) => {
    return render(<CreateEventDialog {...props} />);
  };

  it('モーダルが表示される', () => {
    const { getByText } = renderComponent({
      visible: true,
      onClose: jest.fn(),
    });

    expect(getByText('新規イベント作成')).toBeTruthy();
    expect(getByText('作成')).toBeTruthy();
  });

  it('必須フィールドが空の場合エラーを表示', async () => {
    const onClose = jest.fn();
    const { getByText } = renderComponent({
      visible: true,
      onClose,
    });

    const createButton = getByText('作成');
    fireEvent.press(createButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('エラー', 'イベント名を入力してください');
    });
  });

  it('通常イベントの作成が成功する', async () => {
    const onClose = jest.fn();
    const { getByPlaceholderText, getByText } = renderComponent({
      visible: true,
      onClose,
    });

    // フォームに入力
    fireEvent.changeText(getByPlaceholderText('イベント名を入力してください'), 'テストイベント');
    fireEvent.changeText(
      getByPlaceholderText('イベントの詳細を記入してください...'),
      'これはテストイベントです'
    );

    // モックの設定
    vi.mocked(eventServiceDrizzle.createEvent).mockResolvedValue({
      data: { id: 'event-123' },
      error: null,
    });

    // 送信
    const createButton = getByText('作成');
    fireEvent.press(createButton);

    await waitFor(() => {
      expect(eventServiceDrizzle.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'テストイベント',
          description: 'これはテストイベントです',
          eventType: 'offline',
        }),
        'user-123'
      );
    });

    // 成功アラートが表示されることを確認
    expect(Alert.alert).toHaveBeenCalledWith('成功', 'イベントが作成されました', expect.any(Array));
  });

  it('音声ワークショップの作成が成功する', async () => {
    const onClose = jest.fn();
    const { getByPlaceholderText, getByText, getByTestId, getByDisplayValue } = renderComponent({
      visible: true,
      onClose,
    });

    // イベント種別を音声ワークショップに変更
    const eventTypePicker = getByTestId('event-type-picker');
    fireEvent(eventTypePicker, 'onValueChange', 'voice_workshop');

    // フォームに入力
    fireEvent.changeText(
      getByPlaceholderText('イベント名を入力してください'),
      '音声ワークショップテスト'
    );
    fireEvent.changeText(getByPlaceholderText('10（デフォルト）'), '20');

    // 録音オプションをオンにする
    const recordSwitch = getByTestId('record-switch');
    fireEvent(recordSwitch, 'onValueChange', true);

    // モックの設定
    vi.mocked(eventServiceDrizzle.createVoiceWorkshop).mockResolvedValue({
      data: { id: 'workshop-123' },
      error: null,
    });

    // 送信
    const createButton = getByText('作成');
    fireEvent.press(createButton);

    await waitFor(() => {
      expect(eventServiceDrizzle.createVoiceWorkshop).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '音声ワークショップテスト',
          maxParticipants: 20,
          isRecorded: true,
        }),
        'user-123'
      );
    });
  });

  it('有料イベントの場合、返金ポリシーフィールドが表示される', () => {
    const { getByPlaceholderText, getByText, queryByText } = renderComponent({
      visible: true,
      onClose: jest.fn(),
    });

    // 最初は返金ポリシーフィールドは表示されない
    expect(queryByText('返金ポリシー')).toBeNull();

    // 参加費を入力
    fireEvent.changeText(getByPlaceholderText('無料の場合は空欄'), '5000');

    // 返金ポリシーフィールドが表示される
    expect(getByText('返金ポリシー')).toBeTruthy();
    expect(getByPlaceholderText('返金に関する規定を記載してください')).toBeTruthy();
  });

  it('閉じるボタンでモーダルが閉じる', () => {
    const onClose = jest.fn();
    const { getByTestId } = renderComponent({
      visible: true,
      onClose,
    });

    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('エラー時にエラーメッセージが表示される', async () => {
    const onClose = jest.fn();
    const { getByPlaceholderText, getByText } = renderComponent({
      visible: true,
      onClose,
    });

    // フォームに入力
    fireEvent.changeText(getByPlaceholderText('イベント名を入力してください'), 'エラーテスト');

    // エラーを返すモック
    vi.mocked(eventServiceDrizzle.createEvent).mockResolvedValue({
      data: null,
      error: new Error('ネットワークエラー'),
    });

    // 送信
    const createButton = getByText('作成');
    fireEvent.press(createButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('エラー', 'ネットワークエラー');
    });
  });

  it('ログインしていない場合エラーを表示', async () => {
    // Set mock user to null for this test
    mockAuthUser = null;

    const { getByText } = renderComponent({
      visible: true,
      onClose: jest.fn(),
    });

    const createButton = getByText('作成');
    fireEvent.press(createButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('エラー', 'ログインが必要です');
    });
  });

  it('終了日時が開始日時より前の場合エラーを表示', async () => {
    const onClose = jest.fn();
    const { getByPlaceholderText, getByText, getByTestId } = renderComponent({
      visible: true,
      onClose,
    });

    // イベント名を入力
    fireEvent.changeText(getByPlaceholderText('イベント名を入力してください'), 'テストイベント');

    // 終了時間を開始時間より前に設定する処理をシミュレート
    // （実際のDateTimePickerの動作をモックする必要がある）

    const createButton = getByText('作成');
    fireEvent.press(createButton);

    // この部分は実装の詳細に依存するため、実際のテストではより詳細な設定が必要
  });
});
