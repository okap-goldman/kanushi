import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { cartService, Cart, CartItem } from '../lib/cartService';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { stripeReactNativeService, formatAmountForStripe } from '../lib/stripeReactNativeService';

// モック配送先住所データ
const MOCK_SHIPPING_ADDRESS = {
  id: 'addr1',
  recipient_name: '山田 花子',
  postal_code: '150-0001',
  prefecture: '東京都',
  city: '渋谷区',
  address_line: '神宮前1-1-1 マンション名 101号室',
  phone_number: '090-1234-5678',
};

// モック支払い方法データ
const MOCK_PAYMENT_METHODS = [
  { id: 'credit', name: 'クレジットカード', details: '**** **** **** 1234' },
  { id: 'apple_pay', name: 'Apple Pay', details: 'iPhone' },
  { id: 'bank', name: '銀行振込', details: '振込手数料お客様負担' },
];

export default function CheckoutScreen() {
  const [cart, setCart] = useState<Cart>({ items: [], totalAmount: 0, totalItems: 0 });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const cartData = await cartService.loadCart();
      setCart(cartData);
    } catch (error) {
      console.error('Failed to load cart:', error);
      Alert.alert('エラー', 'カートの読み込みに失敗しました');
    }
  };

  const formatPrice = (price: number, currency: string = 'JPY') => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calculateTotalWithFees = () => {
    const subtotal = cart.totalAmount;
    const shippingFee = 500; // 配送料
    const tax = Math.floor(subtotal * 0.1); // 消費税10%
    return {
      subtotal,
      shippingFee,
      tax,
      total: subtotal + shippingFee + tax,
    };
  };

  const { subtotal, shippingFee, tax, total } = calculateTotalWithFees();

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert('エラー', 'ログインが必要です');
      return;
    }

    if (cart.items.length === 0) {
      Alert.alert('エラー', 'カートに商品がありません');
      return;
    }

    setIsProcessing(true);

    try {
      // Stripe決済処理
      const paymentAmount = formatAmountForStripe(total, 'JPY');
      
      const paymentResult = await stripeReactNativeService.processPayment({
        amount: paymentAmount,
        currency: 'jpy',
        metadata: {
          userId: user.id,
          orderType: 'product_purchase',
          itemCount: cart.items.length.toString(),
        },
      });

      if (!paymentResult.success) {
        if (paymentResult.error?.message === '決済がキャンセルされました') {
          Alert.alert('決済キャンセル', '決済がキャンセルされました');
        } else {
          Alert.alert('決済エラー', paymentResult.error?.message || '決済処理に失敗しました');
        }
        return;
      }

      // 決済成功後の処理
      console.log('Payment successful:', paymentResult.paymentIntentId);

      // 注文データの保存（実際の実装では注文をデータベースに保存）
      const orderData = {
        userId: user.id,
        items: cart.items,
        totalAmount: total,
        paymentIntentId: paymentResult.paymentIntentId,
        paymentMethod: selectedPaymentMethod,
        shippingAddress: MOCK_SHIPPING_ADDRESS,
        createdAt: new Date().toISOString(),
      };

      console.log('Creating order:', orderData);

      // モック注文保存処理
      await new Promise(resolve => setTimeout(resolve, 1000));

      // カートをクリア
      await cartService.clearCart();
      
      Alert.alert(
        '注文完了',
        'ご注文ありがとうございます！\n決済が完了し、注文確認メールをお送りしました。',
        [
          {
            text: '注文履歴を見る',
            onPress: () => navigation.navigate('Orders' as never),
          },
          {
            text: 'ショップに戻る',
            onPress: () => navigation.navigate('Shop' as never),
          },
        ]
      );
    } catch (error) {
      console.error('Order processing error:', error);
      Alert.alert('エラー', '注文処理に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCartItem = (item: CartItem) => (
    <View key={item.id} style={styles.cartItem}>
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.itemImage}
        contentFit="cover"
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.itemPrice}>
          {formatPrice(item.price)} × {item.quantity}
        </Text>
        <Text style={styles.itemTotal}>
          {formatPrice(item.price * item.quantity)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.title}>購入手続き</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* 注文商品 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>注文商品</Text>
          <View style={styles.card}>
            {cart.items.map(renderCartItem)}
          </View>
        </View>

        {/* 配送先住所 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>配送先住所</Text>
          <TouchableOpacity style={styles.card}>
            <View style={styles.addressHeader}>
              <Text style={styles.addressName}>{MOCK_SHIPPING_ADDRESS.recipient_name}</Text>
              <Feather name="chevron-right" size={20} color="#718096" />
            </View>
            <Text style={styles.addressText}>
              〒{MOCK_SHIPPING_ADDRESS.postal_code}
            </Text>
            <Text style={styles.addressText}>
              {MOCK_SHIPPING_ADDRESS.prefecture}{MOCK_SHIPPING_ADDRESS.city}
            </Text>
            <Text style={styles.addressText}>
              {MOCK_SHIPPING_ADDRESS.address_line}
            </Text>
            <Text style={styles.addressText}>
              {MOCK_SHIPPING_ADDRESS.phone_number}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 支払い方法 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>支払い方法</Text>
          <View style={styles.card}>
            {MOCK_PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  selectedPaymentMethod === method.id && styles.paymentMethodSelected,
                ]}
                onPress={() => handlePaymentMethodSelect(method.id)}
              >
                <View style={styles.paymentMethodInfo}>
                  <Text style={styles.paymentMethodName}>{method.name}</Text>
                  <Text style={styles.paymentMethodDetails}>{method.details}</Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    selectedPaymentMethod === method.id && styles.radioSelected,
                  ]}
                >
                  {selectedPaymentMethod === method.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 注文内容確認 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>注文内容確認</Text>
          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>商品小計</Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>配送料</Text>
              <Text style={styles.summaryValue}>{formatPrice(shippingFee)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>消費税</Text>
              <Text style={styles.summaryValue}>{formatPrice(tax)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>合計金額</Text>
              <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
            </View>
          </View>
        </View>

        {/* 注意事項 */}
        <View style={styles.section}>
          <View style={styles.notice}>
            <Feather name="info" size={16} color="#718096" />
            <Text style={styles.noticeText}>
              ご注文確定後、お支払い完了のメールをお送りします。商品の発送までに2-3営業日いただく場合があります。
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 注文確定ボタン */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>合計</Text>
          <Text style={styles.footerTotalAmount}>{formatPrice(total)}</Text>
        </View>
        <Button
          onPress={handlePlaceOrder}
          style={styles.orderButton}
          disabled={isProcessing || cart.items.length === 0}
        >
          {isProcessing ? '決済処理中...' : '決済して注文を確定する'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cartItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A202C',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  addressText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  paymentMethodSelected: {
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A202C',
    marginBottom: 2,
  },
  paymentMethodDetails: {
    fontSize: 12,
    color: '#718096',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#0070F3',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0070F3',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#718096',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1A202C',
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  notice: {
    flexDirection: 'row',
    backgroundColor: '#F7FAFC',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0070F3',
  },
  noticeText: {
    fontSize: 12,
    color: '#718096',
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  footerTotalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  orderButton: {
    paddingVertical: 16,
  },
});