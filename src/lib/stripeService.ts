import Stripe from 'stripe';
import { env } from './env';
import type { ApiResponse } from './data';

// Stripeクライアントの初期化
const stripe = new Stripe(env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia'
});

export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: string;
  metadata?: {
    eventId?: string;
    userId?: string;
    participantId?: string;
    type?: 'event_participation' | 'archive_purchase' | 'gift' | 'product_purchase';
  };
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
  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<ApiResponse<Stripe.PaymentIntent>> {
    try {
      if (!env.STRIPE_SECRET_KEY) {
        return { data: null, error: new Error('Stripe API key is not configured') };
      }

      if (request.amount < 50) {
        return { data: null, error: new Error('金額は50円以上である必要があります') };
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: request.amount,
        currency: request.currency || 'jpy',
        metadata: request.metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      });

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
        reason: request.reason || 'requested_by_customer'
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
  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<ApiResponse<Stripe.PaymentMethod>> {
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
  async createCustomer(email: string, metadata?: Record<string, string>): Promise<ApiResponse<Stripe.Customer>> {
    try {
      if (!env.STRIPE_SECRET_KEY) {
        return { data: null, error: new Error('Stripe API key is not configured') };
      }

      const customer = await stripe.customers.create({
        email,
        metadata: metadata || {}
      });

      return { data: customer, error: null };
    } catch (error) {
      console.error('Error creating customer:', error);
      return { data: null, error: error as Error };
    }
  }
};