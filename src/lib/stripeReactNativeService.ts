// React Native用のStripe Service
// 実際の実装では @stripe/stripe-react-native をインストールして使用

import { Alert } from 'react-native';

// モック型定義（実際の実装では @stripe/stripe-react-native から import）
interface PaymentSheet {
  initPaymentSheet: (params: PaymentSheetInitParams) => Promise<{ error?: Error }>;
  presentPaymentSheet: () => Promise<{ error?: Error }>;
}

interface PaymentSheetInitParams {
  merchantDisplayName: string;
  paymentIntentClientSecret: string;
  customerId?: string;
  customerEphemeralKeySecret?: string;
  allowsDelayedPaymentMethods?: boolean;
  defaultBillingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      country?: string;
      state?: string;
      city?: string;
      line1?: string;
      line2?: string;
      postalCode?: string;
    };
  };
  appearance?: {
    primaryButton?: {
      colors?: {
        background?: string;
        text?: string;
      };
    };
  };
}

// モック実装（実際の実装では import { usePaymentSheet } from '@stripe/stripe-react-native'）
const mockPaymentSheet: PaymentSheet = {
  initPaymentSheet: async (params: PaymentSheetInitParams) => {
    // モック実装 - 成功を返す
    console.log('Mock: Initializing payment sheet with params:', params);
    return {};
  },
  presentPaymentSheet: async () => {
    // モック実装 - ランダムに成功/失敗を返す
    const shouldSucceed = Math.random() > 0.3; // 70%の確率で成功
    
    if (shouldSucceed) {
      console.log('Mock: Payment completed successfully');
      return {};
    } else {
      console.log('Mock: Payment cancelled or failed');
      return { error: new Error('Payment was cancelled') };
    }
  },
};

export interface PaymentIntentResponse {
  client_secret: string;
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

class StripeReactNativeService {
  private paymentSheet: PaymentSheet;

  constructor() {
    // 実際の実装では usePaymentSheet hook を使用
    this.paymentSheet = mockPaymentSheet;
  }

  // PaymentIntentを作成（サーバーサイドのAPI呼び出し）
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResponse> {
    try {
      // 実際の実装では、バックエンドAPIを呼び出してPaymentIntentを作成
      // ここではモックレスポンスを返す
      
      // モック実装 - 2秒の遅延を追加してリアルな感じにする
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockPaymentIntent: PaymentIntentResponse = {
        client_secret: `pi_mock_${Date.now()}_secret_mock`,
        id: `pi_mock_${Date.now()}`,
        amount: params.amount,
        currency: params.currency || 'jpy',
        status: 'requires_payment_method',
      };

      console.log('Mock: Created PaymentIntent:', mockPaymentIntent);
      return mockPaymentIntent;
    } catch (error) {
      console.error('Error creating PaymentIntent:', error);
      throw new Error('決済の初期化に失敗しました');
    }
  }

  // PaymentSheetの初期化
  async initializePaymentSheet(
    paymentIntentClientSecret: string,
    customerId?: string,
    customerEphemeralKeySecret?: string
  ): Promise<{ error?: Error }> {
    try {
      const { error } = await this.paymentSheet.initPaymentSheet({
        merchantDisplayName: 'Kanushi ショップ',
        paymentIntentClientSecret,
        customerId,
        customerEphemeralKeySecret,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: 'お客様',
          address: {
            country: 'JP',
          },
        },
        appearance: {
          primaryButton: {
            colors: {
              background: '#0070F3',
              text: '#FFFFFF',
            },
          },
        },
      });

      if (error) {
        console.error('PaymentSheet initialization failed:', error);
        return { error };
      }

      console.log('PaymentSheet initialized successfully');
      return {};
    } catch (error) {
      console.error('Error initializing PaymentSheet:', error);
      return { error: error as Error };
    }
  }

  // PaymentSheetを表示
  async presentPaymentSheet(): Promise<{ error?: Error }> {
    try {
      const { error } = await this.paymentSheet.presentPaymentSheet();

      if (error) {
        if (error.message === 'Payment was cancelled') {
          console.log('Payment was cancelled by user');
          return { error };
        } else {
          console.error('Payment failed:', error);
          return { error };
        }
      }

      console.log('Payment completed successfully');
      return {};
    } catch (error) {
      console.error('Error presenting PaymentSheet:', error);
      return { error: error as Error };
    }
  }

  // 完全な決済フローを実行
  async processPayment(params: CreatePaymentIntentParams): Promise<{
    success: boolean;
    paymentIntentId?: string;
    error?: Error;
  }> {
    try {
      // 1. PaymentIntentを作成
      const paymentIntent = await this.createPaymentIntent(params);

      // 2. PaymentSheetを初期化
      const initResult = await this.initializePaymentSheet(paymentIntent.client_secret);
      if (initResult.error) {
        return { success: false, error: initResult.error };
      }

      // 3. PaymentSheetを表示
      const presentResult = await this.presentPaymentSheet();
      if (presentResult.error) {
        if (presentResult.error.message === 'Payment was cancelled') {
          return { success: false, error: new Error('決済がキャンセルされました') };
        }
        return { success: false, error: presentResult.error };
      }

      // 4. 成功
      return { 
        success: true, 
        paymentIntentId: paymentIntent.id 
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return { 
        success: false, 
        error: error as Error 
      };
    }
  }

  // 決済状況の確認
  async confirmPaymentStatus(paymentIntentId: string): Promise<{
    status: 'succeeded' | 'processing' | 'requires_payment_method' | 'cancelled';
    error?: Error;
  }> {
    try {
      // 実際の実装では、サーバーサイドAPIを呼び出してPaymentIntentの状況を確認
      // ここではモック実装
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // モック: 90%の確率で成功
      const isSuccessful = Math.random() > 0.1;
      
      return {
        status: isSuccessful ? 'succeeded' : 'requires_payment_method'
      };
    } catch (error) {
      console.error('Error confirming payment status:', error);
      return {
        status: 'cancelled',
        error: error as Error
      };
    }
  }
}

export const stripeReactNativeService = new StripeReactNativeService();

// ユーティリティ関数
export const formatAmountForStripe = (amount: number, currency: string = 'jpy'): number => {
  // JPYは小数点以下の単位がないため、そのまま返す
  // USD等の場合はセント単位に変換（amount * 100）
  if (currency.toLowerCase() === 'jpy') {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
};

export const formatAmountFromStripe = (amount: number, currency: string = 'jpy'): number => {
  // JPYの場合はそのまま、USD等の場合は100で割る
  if (currency.toLowerCase() === 'jpy') {
    return amount;
  }
  return amount / 100;
};