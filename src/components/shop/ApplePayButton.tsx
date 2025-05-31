import React, { useState, useEffect } from 'react';
import { Platform, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { stripeService } from '../../lib/stripeService';

interface ApplePayButtonProps {
  amount: number;
  currency?: string;
  label?: string;
  onPaymentStart?: () => void;
  onPaymentSuccess?: (result: any) => void;
  onPaymentError?: (error: Error) => void;
  onPaymentCancel?: () => void;
  disabled?: boolean;
  style?: any;
}

export function ApplePayButton({
  amount,
  currency = 'JPY',
  label = 'Kanushi ショップ',
  onPaymentStart,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
  disabled = false,
  style,
}: ApplePayButtonProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkApplePayAvailability();
  }, []);

  const checkApplePayAvailability = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web環境でのApple Pay可用性チェック
        const available = await stripeService.isApplePayAvailable();
        setIsAvailable(available);
      } else if (Platform.OS === 'ios') {
        // iOS環境では通常利用可能
        setIsAvailable(true);
      } else {
        // Android等では利用不可
        setIsAvailable(false);
      }
    } catch (error) {
      console.error('Apple Pay availability check failed:', error);
      setIsAvailable(false);
    }
  };

  const handleApplePayPress = async () => {
    if (disabled || loading) return;

    try {
      setLoading(true);
      onPaymentStart?.();

      if (Platform.OS === 'web') {
        await handleWebApplePay();
      } else {
        // モバイル版は今後実装
        Alert.alert(
          'Apple Pay',
          'モバイル版のApple Pay決済は今後対応予定です。\n通常の決済をご利用ください。'
        );
        onPaymentCancel?.();
      }
    } catch (error) {
      console.error('Apple Pay payment failed:', error);
      onPaymentError?.(error as Error);
      Alert.alert('エラー', 'Apple Pay決済に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleWebApplePay = async () => {
    try {
      // PaymentIntentを作成
      const { data: paymentIntent, error } = await stripeService.createApplePaymentIntent({
        amount,
        currency,
        metadata: {
          type: 'product_purchase',
        },
      });

      if (error || !paymentIntent) {
        throw new Error(error?.message || 'Payment Intent作成に失敗しました');
      }

      // Apple Pay Payment Request設定
      const paymentRequest = stripeService.createApplePaymentRequest(amount, currency, label);

      // Web環境でのApple Pay処理
      if (typeof window !== 'undefined' && window.ApplePaySession) {
        const session = new window.ApplePaySession(3, paymentRequest);

        session.onvalidatemerchant = async (event: any) => {
          try {
            // マーチャント検証（実際の実装では、バックエンドで検証する必要があります）
            const merchantSession = {
              epochTimestamp: Date.now(),
              expiresAt: Date.now() + 300000, // 5分後
              merchantSessionIdentifier: 'merchant_session_id',
              nonce: 'nonce',
              merchantIdentifier: 'merchant.com.kanushi.app',
              domainName: window.location.hostname,
              displayName: 'Kanushi',
              signature: 'signature',
            };
            session.completeMerchantValidation(merchantSession);
          } catch (error) {
            console.error('Merchant validation failed:', error);
            session.abort();
            throw error;
          }
        };

        session.onpaymentauthorized = async (event: any) => {
          try {
            // 決済処理（実際の実装では、バックエンドで処理する必要があります）
            const payment = event.payment;
            
            // 決済成功の場合
            session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
            onPaymentSuccess?.({
              paymentMethod: payment,
              paymentIntent,
            });
          } catch (error) {
            console.error('Payment authorization failed:', error);
            session.completePayment(window.ApplePaySession.STATUS_FAILURE);
            throw error;
          }
        };

        session.oncancel = () => {
          onPaymentCancel?.();
        };

        session.begin();
      } else {
        throw new Error('Apple Pay is not available');
      }
    } catch (error) {
      throw error;
    }
  };

  // Apple Payが利用できない場合は何も表示しない
  if (!isAvailable) {
    return null;
  }

  if (Platform.OS === 'web') {
    // Web環境では標準のApple Payボタンスタイルを模倣
    return (
      <TouchableOpacity
        style={[styles.applePayButton, style, disabled && styles.disabled]}
        onPress={handleApplePayPress}
        disabled={disabled || loading}
      >
        <Feather name="smartphone" size={20} color="#FFFFFF" />
        <Text style={styles.applePayButtonText}>
          {loading ? '処理中...' : ' Pay'}
        </Text>
      </TouchableOpacity>
    );
  }

  // React Native環境では代替ボタン
  return (
    <TouchableOpacity
      style={[styles.applePayButton, style, disabled && styles.disabled]}
      onPress={handleApplePayPress}
      disabled={disabled || loading}
    >
      <Feather name="smartphone" size={20} color="#FFFFFF" />
      <Text style={styles.applePayButtonText}>
        {loading ? '処理中...' : 'Apple Pay'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  applePayButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        userSelect: 'none',
      },
    }),
  },
  disabled: {
    backgroundColor: '#A0A0A0',
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
      },
    }),
  },
  applePayButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});