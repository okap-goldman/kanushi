import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Reusing sample orders data from Orders.tsx
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
    paymentMethod: {
      type: 'Credit Card',
      cardBrand: 'Visa',
      lastFour: '4242',
    },
    shippingMethod: 'Standard Shipping',
    shippingCost: 500,
    orderTimeline: [
      { status: 'ordered', date: '2023-05-15T10:23:45Z', description: 'Order placed' },
      { status: 'processing', date: '2023-05-15T14:10:22Z', description: 'Payment confirmed' },
      { status: 'shipped', date: '2023-05-16T09:45:11Z', description: 'Order shipped' },
      { status: 'delivered', date: '2023-05-18T13:28:30Z', description: 'Order delivered' },
    ],
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
    paymentMethod: {
      type: 'Credit Card',
      cardBrand: 'Mastercard',
      lastFour: '1234',
    },
    shippingMethod: 'Express Shipping',
    shippingCost: 1200,
    orderTimeline: [
      { status: 'ordered', date: '2023-04-28T16:42:10Z', description: 'Order placed' },
      { status: 'processing', date: '2023-04-28T16:45:22Z', description: 'Payment confirmed' },
      { status: 'shipped', date: '2023-04-29T08:30:45Z', description: 'Order shipped' },
      { status: 'delivered', date: '2023-05-01T11:15:33Z', description: 'Order delivered' },
    ],
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
    paymentMethod: {
      type: 'PayPay',
      accountName: 'yuki.t@email.com',
    },
    shippingMethod: 'Standard Shipping',
    shippingCost: 500,
    orderTimeline: [
      { status: 'ordered', date: '2023-05-20T20:12:45Z', description: '注文が置かれました' },
      { status: 'processing', date: '2023-05-20T20:15:30Z', description: '支払いが確認されました' },
    ],
  },
];

// Status label and color mapping
const ORDER_STATUS = {
  ordered: { label: '注文済み', color: '#805AD5', icon: 'shopping-bag' },
  processing: { label: '処理中', color: '#F59E0B', icon: 'clock' },
  shipped: { label: '発送済み', color: '#3B82F6', icon: 'truck' },
  delivered: { label: '配達済み', color: '#10B981', icon: 'check-circle' },
  cancelled: { label: 'キャンセル', color: '#EF4444', icon: 'x-circle' },
};

export default function OrderDetail() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { orderId } = route.params || { orderId: 'order1' };

  // Find the order from the sample data
  const order = SAMPLE_ORDERS.find((o) => o.id === orderId) || SAMPLE_ORDERS[0];

  const formatDate = (dateString: string, includeTime = false) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.title}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderId}>Order #{order.id}</Text>
              <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    ORDER_STATUS[order.status as keyof typeof ORDER_STATUS].color + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: ORDER_STATUS[order.status as keyof typeof ORDER_STATUS].color },
                ]}
              >
                {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS].label}
              </Text>
            </View>
          </View>

          {order.trackingNumber && (
            <View style={styles.trackingContainer}>
              <Text style={styles.trackingLabel}>Tracking Number:</Text>
              <Text style={styles.trackingNumber}>{order.trackingNumber}</Text>
              <TouchableOpacity style={styles.trackButton}>
                <Text style={styles.trackButtonText}>Track</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Order Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Timeline</Text>

          <View style={styles.timeline}>
            {order.orderTimeline?.map((event, index) => (
              <View key={event.status} style={styles.timelineItem}>
                <View style={styles.timelineIconContainer}>
                  <View
                    style={[
                      styles.timelineIcon,
                      {
                        backgroundColor:
                          ORDER_STATUS[event.status as keyof typeof ORDER_STATUS].color,
                      },
                    ]}
                  >
                    <Feather
                      name={ORDER_STATUS[event.status as keyof typeof ORDER_STATUS].icon as any}
                      size={14}
                      color="#FFFFFF"
                    />
                  </View>

                  {index < order.orderTimeline.length - 1 && (
                    <View style={styles.timelineConnector} />
                  )}
                </View>

                <View style={styles.timelineContent}>
                  <Text style={styles.timelineEventTitle}>{event.description}</Text>
                  <Text style={styles.timelineEventDate}>{formatDate(event.date, true)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>

          {order.items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Image source={{ uri: item.image }} style={styles.itemImage} contentFit="cover" />

              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>

                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemPrice}>¥{item.price.toLocaleString()}</Text>
                  <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                </View>

                <Text style={styles.itemTotal}>
                  Subtotal: ¥{(item.price * item.quantity).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Shipping Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Recipient:</Text>
            <Text style={styles.infoValue}>{order.shippingAddress.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address:</Text>
            <View>
              <Text style={styles.infoValue}>{order.shippingAddress.street}</Text>
              <Text style={styles.infoValue}>
                {order.shippingAddress.city}, {order.shippingAddress.prefecture}
              </Text>
              <Text style={styles.infoValue}>
                {order.shippingAddress.postalCode}, {order.shippingAddress.country}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Method:</Text>
            <Text style={styles.infoValue}>{order.shippingMethod}</Text>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Method:</Text>
            <Text style={styles.infoValue}>
              {order.paymentMethod.type}
              {order.paymentMethod.cardBrand && ` (${order.paymentMethod.cardBrand})`}
              {order.paymentMethod.lastFour && ` ending in ${order.paymentMethod.lastFour}`}
              {order.paymentMethod.accountName && ` - ${order.paymentMethod.accountName}`}
            </Text>
          </View>

          {/* Order Summary */}
          <View style={styles.orderSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>
                ¥{(order.total - order.shippingCost).toLocaleString()}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping:</Text>
              <Text style={styles.summaryValue}>¥{order.shippingCost.toLocaleString()}</Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>¥{order.total.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {order.status === 'delivered' && (
            <TouchableOpacity style={styles.actionButton}>
              <Feather name="repeat" size={16} color="#0070F3" />
              <Text style={styles.actionButtonText}>Buy Again</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionButton}>
            <Feather name="help-circle" size={16} color="#0070F3" />
            <Text style={styles.actionButtonText}>Need Help?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  section: {
    backgroundColor: '#FFFFFF',
    marginVertical: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
  },
  orderDate: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  trackingLabel: {
    fontSize: 14,
    color: '#718096',
    marginRight: 8,
  },
  trackingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
    flex: 1,
  },
  trackButton: {
    backgroundColor: '#0070F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  trackButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeline: {
    marginBottom: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingBottom: 24,
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#CBD5E0',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 8,
  },
  timelineEventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
  },
  timelineEventDate: {
    fontSize: 12,
    color: '#718096',
  },
  orderItem: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 16,
    marginBottom: 16,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 8,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#1A202C',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#718096',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    color: '#718096',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#1A202C',
  },
  orderSummary: {
    marginTop: 16,
    paddingTop: 16,
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
  },
  totalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#0070F3',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#0070F3',
    fontWeight: '600',
    marginLeft: 8,
  },
});
