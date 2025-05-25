import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { stripeService } from '../../src/lib/stripeService';
import Stripe from 'stripe';

// Stripeをモック
vi.mock('stripe', () => {
  const mockStripe = {
    paymentIntents: {
      create: vi.fn(),
      confirm: vi.fn(),
      retrieve: vi.fn()
    },
    refunds: {
      create: vi.fn()
    },
    paymentMethods: {
      attach: vi.fn()
    },
    customers: {
      create: vi.fn()
    },
    webhooks: {
      constructEvent: vi.fn()
    }
  };

  return {
    default: vi.fn(() => mockStripe)
  };
});

// 環境変数をモック
vi.mock('../../src/lib/env', () => ({
  env: {
    STRIPE_SECRET_KEY: 'sk_test_mock_key'
  }
}));

describe('StripeService', () => {
  let mockStripe: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Stripeインスタンスを取得
    const StripeConstructor = vi.mocked(Stripe);
    mockStripe = new StripeConstructor('sk_test_mock_key', { apiVersion: '2024-12-18.acacia' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('決済インテントの作成成功', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        amount: 3000,
        currency: 'jpy',
        client_secret: 'pi_test_123_secret',
        status: 'requires_payment_method',
        metadata: {
          eventId: 'event-1',
          userId: 'user-1',
          type: 'event_participation'
        }
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await stripeService.createPaymentIntent({
        amount: 3000,
        metadata: {
          eventId: 'event-1',
          userId: 'user-1',
          type: 'event_participation'
        }
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockPaymentIntent);
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 3000,
        currency: 'jpy',
        metadata: {
          eventId: 'event-1',
          userId: 'user-1',
          type: 'event_participation'
        },
        automatic_payment_methods: {
          enabled: true
        }
      });
    });

    it('50円未満の金額でエラー', async () => {
      const result = await stripeService.createPaymentIntent({
        amount: 49
      });

      expect(result.data).toBeNull();
      expect(result.error?.message).toContain('50円以上');
      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
    });

    it('Stripe APIエラーのハンドリング', async () => {
      const mockError = new Error('Stripe API error');
      mockStripe.paymentIntents.create.mockRejectedValue(mockError);

      const result = await stripeService.createPaymentIntent({
        amount: 5000
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('confirmPayment', () => {
    it('決済確認成功', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 3000
      };

      mockStripe.paymentIntents.confirm.mockResolvedValue(mockPaymentIntent);

      const result = await stripeService.confirmPayment({
        paymentIntentId: 'pi_test_123',
        paymentMethodId: 'pm_test_456'
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockPaymentIntent);
      expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith(
        'pi_test_123',
        { payment_method: 'pm_test_456' }
      );
    });
  });

  describe('getPaymentIntent', () => {
    it('決済インテント取得成功', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 3000,
        metadata: { eventId: 'event-1' }
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const result = await stripeService.getPaymentIntent('pi_test_123');

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockPaymentIntent);
      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_test_123');
    });
  });

  describe('createRefund', () => {
    it('返金処理成功', async () => {
      const mockRefund = {
        id: 're_test_123',
        amount: 3000,
        status: 'succeeded',
        payment_intent: 'pi_test_123'
      };

      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      const result = await stripeService.createRefund({
        paymentIntentId: 'pi_test_123',
        reason: 'requested_by_customer'
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockRefund);
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_123',
        amount: undefined,
        reason: 'requested_by_customer'
      });
    });

    it('部分返金の処理', async () => {
      const mockRefund = {
        id: 're_test_123',
        amount: 1500,
        status: 'succeeded'
      };

      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      const result = await stripeService.createRefund({
        paymentIntentId: 'pi_test_123',
        amount: 1500,
        reason: 'fraudulent'
      });

      expect(result.error).toBeNull();
      expect(result.data?.amount).toBe(1500);
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_123',
        amount: 1500,
        reason: 'fraudulent'
      });
    });
  });

  describe('constructWebhookEvent', () => {
    it('Webhookイベントの検証成功', () => {
      const mockEvent = {
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test_123' } }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = stripeService.constructWebhookEvent(
        'payload',
        'signature',
        'whsec_test'
      );

      expect(result).toEqual(mockEvent);
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        'payload',
        'signature',
        'whsec_test'
      );
    });

    it('無効な署名でnullを返す', () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const result = stripeService.constructWebhookEvent(
        'payload',
        'invalid_signature',
        'whsec_test'
      );

      expect(result).toBeNull();
    });
  });

  describe('createCustomer', () => {
    it('カスタマー作成成功', async () => {
      const mockCustomer = {
        id: 'cus_test_123',
        email: 'test@example.com',
        metadata: { userId: 'user-1' }
      };

      mockStripe.customers.create.mockResolvedValue(mockCustomer);

      const result = await stripeService.createCustomer(
        'test@example.com',
        { userId: 'user-1' }
      );

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockCustomer);
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: { userId: 'user-1' }
      });
    });
  });
});