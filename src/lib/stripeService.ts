import Stripe from 'stripe';
import type { ApiResponse } from './data';
import { env } from './env';

// Stripeクライアントの初期化（条件付き）
let stripe: Stripe | null = null;

try {
  if (env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY.length > 0) {
    stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
  }
} catch (error) {
  console.warn('Stripe initialization failed:', error);
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: string;
  metadata?: {
    eventId?: string;
    userId?: string;
    participantId?: string;
    type?: 'event_participation' | 'archive_purchase' | 'gift' | 'product_purchase';
  };
  useApplePay?: boolean;
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
  paymentMethodId?: string;
}

export interface RefundRequest {
  paymentIntentId: string;
  amount?: number;
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}

export const stripeService = {
  // 決済インテントの作成
  async createPaymentIntent(
    request: CreatePaymentIntentRequest
  ): Promise<ApiResponse<Stripe.PaymentIntent>> {
    try {
      if (!stripe) {
        return { data: null, error: new Error('Stripe is not configured') };
      }

      if (request.amount < 50) {
        return { data: null, error: new Error('金額は50円以上である必要があります') };
      }

      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: request.amount,
        currency: request.currency || 'jpy',
        metadata: request.metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      };

      // Apple Pay使用時の追加設定
      if (request.useApplePay) {
        paymentIntentParams.payment_method_types = ['card', 'apple_pay'];
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      return { data: paymentIntent, error: null };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return { data: null, error: error as Error };
    }
  },

  // 決済インテントの確認
  async confirmPayment(request: ConfirmPaymentRequest): Promise<ApiResponse<Stripe.PaymentIntent>> {
    try {
      if (!env.STRIPE_SECRET_KEY) {
        return { data: null, error: new Error('Stripe API key is not configured') };
      }

      const paymentIntent = await stripe.paymentIntents.confirm(
        request.paymentIntentId,
        request.paymentMethodId ? { payment_method: request.paymentMethodId } : {}
      );

      return { data: paymentIntent, error: null };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return { data: null, error: error as Error };
    }
  },

  // 決済インテントの取得
  async getPaymentIntent(paymentIntentId: string): Promise<ApiResponse<Stripe.PaymentIntent>> {
    try {
      if (!env.STRIPE_SECRET_KEY) {
        return { data: null, error: new Error('Stripe API key is not configured') };
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return { data: paymentIntent, error: null };
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      return { data: null, error: error as Error };
    }
  },

  // 返金処理
  async createRefund(request: RefundRequest): Promise<ApiResponse<Stripe.Refund>> {
    try {
      if (!env.STRIPE_SECRET_KEY) {
        return { data: null, error: new Error('Stripe API key is not configured') };
      }

      const refund = await stripe.refunds.create({
        payment_intent: request.paymentIntentId,
        amount: request.amount,
        reason: request.reason || 'requested_by_customer',
      });

      return { data: refund, error: null };
    } catch (error) {
      console.error('Error creating refund:', error);
      return { data: null, error: error as Error };
    }
  },

  // Webhookイベントの検証
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    endpointSecret: string
  ): Stripe.Event | null {
    try {
      return stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    } catch (error) {
      console.error('Error constructing webhook event:', error);
      return null;
    }
  },

  // 決済メソッドのアタッチ
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<ApiResponse<Stripe.PaymentMethod>> {
    try {
      if (!env.STRIPE_SECRET_KEY) {
        return { data: null, error: new Error('Stripe API key is not configured') };
      }

      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      return { data: paymentMethod, error: null };
    } catch (error) {
      console.error('Error attaching payment method:', error);
      return { data: null, error: error as Error };
    }
  },

  // カスタマーの作成
  async createCustomer(
    email: string,
    metadata?: Record<string, string>
  ): Promise<ApiResponse<Stripe.Customer>> {
    try {
      if (!env.STRIPE_SECRET_KEY) {
        return { data: null, error: new Error('Stripe API key is not configured') };
      }

      const customer = await stripe.customers.create({
        email,
        metadata: metadata || {},
      });

      return { data: customer, error: null };
    } catch (error) {
      console.error('Error creating customer:', error);
      return { data: null, error: error as Error };
    }
  },

  // Apple Pay決済の可用性チェック（フロントエンド用）
  async isApplePayAvailable(): Promise<boolean> {
    try {
      // React Nativeの場合、プラットフォームチェックが必要
      // この関数はフロントエンドで呼び出されることを想定
      if (typeof window !== 'undefined' && window.ApplePaySession) {
        return window.ApplePaySession.canMakePayments();
      }
      return false;
    } catch (error) {
      console.error('Error checking Apple Pay availability:', error);
      return false;
    }
  },

  // Apple Pay決済専用のPayment Intent作成
  async createApplePaymentIntent(
    request: Omit<CreatePaymentIntentRequest, 'useApplePay'>
  ): Promise<ApiResponse<Stripe.PaymentIntent>> {
    return this.createPaymentIntent({
      ...request,
      useApplePay: true,
    });
  },

  // Apple Pay Payment Request設定の生成（フロントエンド用）
  createApplePaymentRequest(
    amount: number,
    currency: string = 'JPY',
    label: string = 'Kanushi ショップ'
  ): any {
    return {
      currency: currency.toLowerCase(),
      total: {
        label,
        amount: (amount / 100).toString(), // 円からセントに変換
      },
      countryCode: 'JP',
      merchantCapabilities: ['supports3DS'],
      supportedNetworks: ['visa', 'masterCard', 'amex', 'jcb'],
      requiredBillingContactFields: ['postalAddress'],
      requiredShippingContactFields: ['postalAddress', 'name', 'phoneNumber'],
    };
  },
};
