import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stripeService } from '../../src/lib/stripeService';

// Mock Stripe
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      paymentIntents: {
        create: vi.fn(),
        confirm: vi.fn(),
        retrieve: vi.fn(),
      },
      refunds: {
        create: vi.fn(),
      },
      webhooks: {
        constructEvent: vi.fn(),
      },
      paymentMethods: {
        attach: vi.fn(),
      },
      customers: {
        create: vi.fn(),
      },
    })),
  };
});

// Mock environment
vi.mock('../../src/lib/env', () => ({
  env: {
    STRIPE_SECRET_KEY: 'sk_test_123456789',
  },
}));

describe('StripeService Apple Pay Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createApplePaymentIntent', () => {
    it('Apple Pay用のPayment Intentを作成できる', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        amount: 1000,
        currency: 'jpy',
        payment_method_types: ['card', 'apple_pay'],
      };

      // stripeの実装をモック
      const stripe = require('stripe');
      const mockStripeInstance = stripe.default();
      mockStripeInstance.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await stripeService.createApplePaymentIntent({
        amount: 1000,
        currency: 'JPY',
        metadata: {
          type: 'product_purchase',
          userId: 'user123',
        },
      });

      expect(result.data).toEqual(mockPaymentIntent);
      expect(result.error).toBeNull();
      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'jpy',
        metadata: {
          type: 'product_purchase',
          userId: 'user123',
        },
        automatic_payment_methods: {
          enabled: true,
        },
        payment_method_types: ['card', 'apple_pay'],
      });
    });

    it('エラー時に適切なエラーメッセージを返す', async () => {
      const stripe = require('stripe');
      const mockStripeInstance = stripe.default();
      mockStripeInstance.paymentIntents.create.mockRejectedValue(
        new Error('Stripe API error')
      );

      const result = await stripeService.createApplePaymentIntent({
        amount: 1000,
        currency: 'JPY',
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Stripe API error');
    });
  });

  describe('createApplePaymentRequest', () => {
    it('Apple Pay用のPayment Request設定を作成できる', () => {
      const paymentRequest = stripeService.createApplePaymentRequest(
        1000,
        'JPY',
        'テスト商品'
      );

      expect(paymentRequest).toEqual({
        currency: 'jpy',
        total: {
          label: 'テスト商品',
          amount: '10.00', // 円からセントへの変換
        },
        countryCode: 'JP',
        merchantCapabilities: ['supports3DS'],
        supportedNetworks: ['visa', 'masterCard', 'amex', 'jcb'],
        requiredBillingContactFields: ['postalAddress'],
        requiredShippingContactFields: ['postalAddress', 'name', 'phoneNumber'],
      });
    });

    it('デフォルト値が正しく設定される', () => {
      const paymentRequest = stripeService.createApplePaymentRequest(2000);

      expect(paymentRequest.currency).toBe('jpy');
      expect(paymentRequest.total.label).toBe('Kanushi ショップ');
      expect(paymentRequest.total.amount).toBe('20.00');
    });
  });

  describe('isApplePayAvailable', () => {
    it('Apple Pay利用不可の場合はfalseを返す', async () => {
      // DOM環境がない場合
      const result = await stripeService.isApplePayAvailable();
      expect(result).toBe(false);
    });
  });
});