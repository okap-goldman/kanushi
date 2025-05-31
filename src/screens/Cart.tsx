import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { cartService, Cart, CartItem as CartItemType } from '../lib/cartService';
import { CartItem } from '../components/cart/CartItem';
import { Button } from '../components/ui/Button';
import { ApplePayButton } from '../components/shop/ApplePayButton';
import { useAuth } from '../context/AuthContext';
import { createApplePayCartOrder } from '../lib/ecService';

export default function CartScreen() {
  const [cart, setCart] = useState<Cart>({ items: [], totalAmount: 0, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
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
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCart();
    setRefreshing(false);
  }, []);

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      const updatedCart = await cartService.updateQuantity(itemId, quantity);
      setCart(updatedCart);
    } catch (error) {
      Alert.alert('エラー', (error as Error).message);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    Alert.alert(
      '商品を削除',
      'この商品をカートから削除してもよろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedCart = await cartService.removeFromCart(itemId);
              setCart(updatedCart);
            } catch (error) {
              Alert.alert('エラー', '商品の削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleClearCart = async () => {
    Alert.alert(
      'カートを空にする',
      'カート内のすべての商品を削除してもよろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedCart = await cartService.clearCart();
              setCart(updatedCart);
            } catch (error) {
              Alert.alert('エラー', 'カートのクリアに失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    if (!user) {
      Alert.alert('ログインが必要です', '購入手続きにはログインが必要です');
      return;
    }

    if (cart.items.length === 0) {
      Alert.alert('カートが空です', '商品をカートに追加してください');
      return;
    }

    // TODO: Implement checkout flow
    navigation.navigate('Checkout' as never);
  };

  const handleApplePayStart = () => {
    console.log('Apple Pay決済を開始します...');
  };

  const handleApplePaySuccess = async (result: any) => {
    try {
      if (!user) {
        Alert.alert('エラー', 'ユーザー情報が見つかりません');
        return;
      }

      // TODO: 実際の配送先住所IDを取得する必要があります
      // ここでは仮のIDを使用
      const shippingAddressId = 'default-address-id';

      const cartItems = cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const orders = await createApplePayCartOrder(user.id, {
        items: cartItems,
        shippingAddressId,
        applePayResult: result,
      });

      // カートをクリア
      await cartService.clearCart();
      setCart({ items: [], totalAmount: 0, totalItems: 0 });

      Alert.alert(
        '注文完了',
        `Apple Payでの決済が完了しました。\n注文数: ${orders.length}件`,
        [
          {
            text: '注文履歴を見る',
            onPress: () => navigation.navigate('Orders' as never),
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      console.error('Apple Pay order creation failed:', error);
      Alert.alert('エラー', 'Apple Pay決済の処理に失敗しました');
    }
  };

  const handleApplePayError = (error: Error) => {
    console.error('Apple Pay payment failed:', error);
    Alert.alert('エラー', 'Apple Pay決済に失敗しました');
  };

  const handleApplePayCancel = () => {
    console.log('Apple Pay決済がキャンセルされました');
  };

  const formatPrice = (price: number, currency: string = 'JPY') => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const groupedCart = cartService.getGroupedCart();
  const isEmpty = cart.items.length === 0;

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
        <Text style={styles.title}>カート ({cart.totalItems})</Text>
        {!isEmpty && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearCart}
          >
            <Text style={styles.clearButtonText}>全削除</Text>
          </TouchableOpacity>
        )}
      </View>

      {isEmpty ? (
        /* Empty cart */
        <View style={styles.emptyContainer}>
          <Feather name="shopping-cart" size={64} color="#CBD5E0" />
          <Text style={styles.emptyTitle}>カートは空です</Text>
          <Text style={styles.emptyDescription}>
            商品をカートに追加してショッピングを始めましょう
          </Text>
          <Button
            onPress={() => navigation.navigate('Shop' as never)}
            style={styles.shopButton}
          >
            ショップを見る
          </Button>
        </View>
      ) : (
        <>
          {/* Cart items */}
          <ScrollView
            style={styles.cartItems}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {Object.entries(groupedCart).map(([sellerId, { items }]) => (
              <View key={sellerId} style={styles.sellerGroup}>
                {items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </View>
            ))}
          </ScrollView>

          {/* Bottom summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>商品数</Text>
              <Text style={styles.summaryValue}>{cart.totalItems}個</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>合計金額</Text>
              <Text style={styles.totalAmount}>
                {formatPrice(cart.totalAmount)}
              </Text>
            </View>
            
            {/* Apple Pay Button */}
            <ApplePayButton
              amount={cart.totalAmount}
              currency="JPY"
              label="Kanushi ショップ"
              onPaymentStart={handleApplePayStart}
              onPaymentSuccess={handleApplePaySuccess}
              onPaymentError={handleApplePayError}
              onPaymentCancel={handleApplePayCancel}
              disabled={cart.items.length === 0}
              style={styles.applePayButton}
            />
            
            <Button
              onPress={handleCheckout}
              style={styles.checkoutButton}
              disabled={cart.items.length === 0}
            >
              購入手続きに進む
            </Button>
          </View>
        </>
      )}
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
    marginRight: 40,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#E53E3E',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  shopButton: {
    paddingHorizontal: 32,
  },
  cartItems: {
    flex: 1,
    padding: 16,
  },
  sellerGroup: {
    marginBottom: 16,
  },
  summary: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
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
  applePayButton: {
    marginTop: 16,
    marginBottom: 8,
  },
  checkoutButton: {
    marginTop: 8,
    paddingVertical: 16,
  },
});