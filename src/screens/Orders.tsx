import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import React from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Sample orders data
const SAMPLE_ORDERS = [
  {
    id: 'order1',
    date: '2023-05-15',
    status: 'delivered',
    total: 8600,
    items: [
      {
        id: 'item1',
        name: 'Japanese Traditional Indigo Tote Bag',
        price: 3600,
        quantity: 1,
        image: 'https://picsum.photos/400/400?random=40',
      },
      {
        id: 'item2',
        name: 'Handcrafted Wooden Chopsticks Set',
        price: 2500,
        quantity: 2,
        image: 'https://picsum.photos/400/400?random=44',
      },
    ],
    trackingNumber: 'JP12345678901',
    shippingAddress: {
      name: 'Yuki Tanaka',
      street: '1-2-3 Shibuya',
      city: 'Shibuya-ku',
      prefecture: 'Tokyo',
      postalCode: '150-0002',
      country: 'Japan',
    },
  },
  {
    id: 'order2',
    date: '2023-04-28',
    status: 'delivered',
    total: 12000,
    items: [
      {
        id: 'item3',
        name: 'Modern Kimono Jacket',
        price: 12000,
        quantity: 1,
        image: 'https://picsum.photos/400/400?random=41',
      },
    ],
    trackingNumber: 'JP98765432109',
    shippingAddress: {
      name: 'Yuki Tanaka',
      street: '1-2-3 Shibuya',
      city: 'Shibuya-ku',
      prefecture: 'Tokyo',
      postalCode: '150-0002',
      country: 'Japan',
    },
  },
  {
    id: 'order3',
    date: '2023-05-20',
    status: 'processing',
    total: 8500,
    items: [
      {
        id: 'item4',
        name: 'Ceramic Tea Set',
        price: 8500,
        quantity: 1,
        image: 'https://picsum.photos/400/400?random=42',
      },
    ],
    shippingAddress: {
      name: 'Yuki Tanaka',
      street: '1-2-3 Shibuya',
      city: 'Shibuya-ku',
      prefecture: 'Tokyo',
      postalCode: '150-0002',
      country: 'Japan',
    },
  },
];

// Status label and color mapping
const ORDER_STATUS = {
  processing: { label: '処理中', color: '#F59E0B' },
  shipped: { label: '発送済み', color: '#3B82F6' },
  delivered: { label: '配達済み', color: '#10B981' },
  cancelled: { label: 'キャンセル', color: '#EF4444' },
};

export default function Orders() {
  const navigation = useNavigation<any>();

  const navigateToOrderDetail = (orderId: string) => {
    navigation.navigate('OrderDetail', { orderId });
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const renderOrderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.orderCard} onPress={() => navigateToOrderDetail(item.id)}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderDate}>{formatDate(item.date)}</Text>
          <Text style={styles.orderId}>Order #{item.id}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: ORDER_STATUS[item.status as keyof typeof ORDER_STATUS].color + '20',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: ORDER_STATUS[item.status as keyof typeof ORDER_STATUS].color },
            ]}
          >
            {ORDER_STATUS[item.status as keyof typeof ORDER_STATUS].label}
          </Text>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {item.items.map((orderItem: any) => (
          <View key={orderItem.id} style={styles.orderItem}>
            <Image source={{ uri: orderItem.image }} style={styles.itemImage} contentFit="cover" />

            <View style={styles.itemDetails}>
              <Text style={styles.itemName} numberOfLines={1}>
                {orderItem.name}
              </Text>

              <View style={styles.itemPriceRow}>
                <Text style={styles.itemPrice}>¥{orderItem.price.toLocaleString()}</Text>
                <Text style={styles.itemQuantity}>× {orderItem.quantity}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalAmount}>¥{item.total.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="shopping-bag" size={48} color="#A0AEC0" />
      <Text style={styles.emptyStateTitle}>No orders yet</Text>
      <Text style={styles.emptyStateText}>When you place orders, they'll appear here</Text>
      <TouchableOpacity style={styles.shopButton} onPress={() => navigation.navigate('Shop')}>
        <Text style={styles.shopButtonText}>Browse Products</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.title}>My Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={SAMPLE_ORDERS}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.ordersList}
        ListEmptyComponent={renderEmptyState}
      />
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
    padding: 4,
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  ordersList: {
    padding: 16,
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
  },
  orderId: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    color: '#1A202C',
    marginBottom: 4,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 14,
    color: '#718096',
    marginRight: 8,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A5568',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#0070F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shopButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
