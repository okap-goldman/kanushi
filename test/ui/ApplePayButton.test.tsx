import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Platform, Alert } from 'react-native';
import { ApplePayButton } from '../../src/components/shop/ApplePayButton';

// Mock dependencies
vi.mock('../../src/lib/stripeService', () => ({
  stripeService: {
    isApplePayAvailable: vi.fn(),
    createApplePaymentIntent: vi.fn(),
    createApplePaymentRequest: vi.fn(),
  },
}));

vi.mock('react-native', async () => {
  const RN = await vi.importActual('react-native');
  return {
    ...RN,
    Platform: {
      OS: 'web',
    },
    Alert: {
      alert: vi.fn(),
    },
  };
});

describe('ApplePayButton', () => {
  const defaultProps = {
    amount: 1000,
    currency: 'JPY',
    label: 'テスト商品',
    onPaymentStart: vi.fn(),
    onPaymentSuccess: vi.fn(),
    onPaymentError: vi.fn(),
    onPaymentCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Platformのモックをリセット
    Platform.OS = 'web';
  });

  describe('可用性チェック', () => {
    it('Apple Pay利用可能時にボタンが表示される', async () => {
      const { stripeService } = await import('../../src/lib/stripeService');
      vi.mocked(stripeService.isApplePayAvailable).mockResolvedValue(true);

      const { findByText } = render(<ApplePayButton {...defaultProps} />);

      await waitFor(async () => {
        const button = await findByText(' Pay');
        expect(button).toBeTruthy();
      });
    });

    it('Apple Pay利用不可時にボタンが表示されない', async () => {
      const { stripeService } = await import('../../src/lib/stripeService');
      vi.mocked(stripeService.isApplePayAvailable).mockResolvedValue(false);

      const { queryByText } = render(<ApplePayButton {...defaultProps} />);

      await waitFor(() => {
        const button = queryByText(' Pay');
        expect(button).toBeNull();
      });
    });
  });

  describe('プラットフォーム対応', () => {
    it('iOSプラットフォームでApple Payボタンが表示される', async () => {
      Platform.OS = 'ios';

      const { findByText } = render(<ApplePayButton {...defaultProps} />);

      await waitFor(async () => {
        const button = await findByText('Apple Pay');
        expect(button).toBeTruthy();
      });
    });

    it('Androidプラットフォームでボタンが表示されない', async () => {
      Platform.OS = 'android';

      const { queryByText } = render(<ApplePayButton {...defaultProps} />);

      await waitFor(() => {
        const button = queryByText('Apple Pay');
        expect(button).toBeNull();
      });
    });
  });

  describe('ボタンの操作', () => {
    it('有効なボタンが押された時に決済処理が開始される', async () => {
      const { stripeService } = await import('../../src/lib/stripeService');
      vi.mocked(stripeService.isApplePayAvailable).mockResolvedValue(true);

      const onPaymentStart = vi.fn();

      const { findByText } = render(
        <ApplePayButton {...defaultProps} onPaymentStart={onPaymentStart} />
      );

      const button = await findByText(' Pay');
      fireEvent.press(button);

      expect(onPaymentStart).toHaveBeenCalled();
    });

    it('無効なボタンが押されても決済処理が開始されない', async () => {
      const { stripeService } = await import('../../src/lib/stripeService');
      vi.mocked(stripeService.isApplePayAvailable).mockResolvedValue(true);

      const onPaymentStart = vi.fn();

      const { findByText } = render(
        <ApplePayButton {...defaultProps} disabled={true} onPaymentStart={onPaymentStart} />
      );

      const button = await findByText(' Pay');
      fireEvent.press(button);

      expect(onPaymentStart).not.toHaveBeenCalled();
    });
  });

  describe('エラーハンドリング', () => {
    it('モバイル版では未対応メッセージが表示される', async () => {
      Platform.OS = 'ios';

      const onPaymentCancel = vi.fn();

      const { findByText } = render(
        <ApplePayButton {...defaultProps} onPaymentCancel={onPaymentCancel} />
      );

      const button = await findByText('Apple Pay');
      fireEvent.press(button);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Apple Pay',
          'モバイル版のApple Pay決済は今後対応予定です。\n通常の決済をご利用ください。'
        );
        expect(onPaymentCancel).toHaveBeenCalled();
      });
    });

    it('Payment Intent作成エラー時に適切なエラー処理が行われる', async () => {
      const { stripeService } = await import('../../src/lib/stripeService');
      vi.mocked(stripeService.isApplePayAvailable).mockResolvedValue(true);
      vi.mocked(stripeService.createApplePaymentIntent).mockResolvedValue({
        data: null,
        error: new Error('テストエラー'),
      });

      const onPaymentError = vi.fn();

      const { findByText } = render(
        <ApplePayButton {...defaultProps} onPaymentError={onPaymentError} />
      );

      const button = await findByText(' Pay');
      fireEvent.press(button);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('エラー', 'Apple Pay決済に失敗しました');
        expect(onPaymentError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  describe('コンポーネントの表示', () => {
    it('正しいpropsでレンダリングされる', async () => {
      const { stripeService } = await import('../../src/lib/stripeService');
      vi.mocked(stripeService.isApplePayAvailable).mockResolvedValue(true);

      const { findByText } = render(
        <ApplePayButton
          amount={2500}
          currency="USD"
          label="Custom Product"
          disabled={false}
        />
      );

      const button = await findByText(' Pay');
      expect(button).toBeTruthy();
    });

    it('読み込み中状態が正しく表示される', async () => {
      const { stripeService } = await import('../../src/lib/stripeService');
      vi.mocked(stripeService.isApplePayAvailable).mockResolvedValue(true);
      vi.mocked(stripeService.createApplePaymentIntent).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: null, error: null }), 1000))
      );

      const { findByText } = render(<ApplePayButton {...defaultProps} />);

      const button = await findByText(' Pay');
      fireEvent.press(button);

      await waitFor(async () => {
        const loadingButton = await findByText('処理中...');
        expect(loadingButton).toBeTruthy();
      });
    });
  });
});