import { useNavigation } from '@react-navigation/native';
import { formatDistance } from 'date-fns';
import { ja } from 'date-fns/locale';
import type React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Order } from '../../lib/ecService';
import Card from '../ui/Card';
import OrderStatusBadge from './OrderStatusBadge';
import PriceDisplay from './PriceDisplay';

interface OrderItemProps {
  order: Order;
}

const OrderItem: React.FC<OrderItemProps> = ({ order }) => {
  const navigation = useNavigation<any>();

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';

    try {
      return formatDistance(new Date(dateString), new Date(), {
        addSuffix: true,
        locale: ja,
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get appropriate date based on status
  const getRelevantDate = (order: Order) => {
    if (order.status === 'refunded' && order.refunded_at) {
      return formatDate(order.refunded_at);
    } else if (order.status === 'shipped' && order.shipped_at) {
      return formatDate(order.shipped_at);
    } else if (order.status === 'paid' && order.paid_at) {
      return formatDate(order.paid_at);
    } else {
      return formatDate(order.created_at);
    }
  };

  const handlePress = () => {
    navigation.navigate('OrderDetail', { orderId: order.id });
  };

  return (
    <Card>
      <View style={styles.header}>
        <View>
          <Text style={styles.orderNumber}>注文番号: {order.id.substring(0, 8)}</Text>
          <Text style={styles.date}>{formatDate(order.created_at)}</Text>
        </View>
        <OrderStatusBadge status={order.status} />
      </View>

      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <View style={styles.content}>
          {order.product?.image_url && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: order.product.image_url }} style={styles.productImage} />
            </View>
          )}

          <View style={styles.details}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {order.product?.title || '商品名が取得できません'}
            </Text>

            <View style={styles.row}>
              <Text style={styles.quantity}>数量: {order.quantity}</Text>
              <PriceDisplay price={order.amount} size="sm" />
            </View>

            {order.status === 'shipped' && order.tracking_number && (
              <Text style={styles.tracking}>
                配送情報: {order.shipping_carrier || ''} {order.tracking_number}
              </Text>
            )}

            <View style={styles.statusUpdate}>
              <Text style={styles.statusLabel}>ステータス更新: </Text>
              <Text style={styles.statusDate}>{getRelevantDate(order)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  orderNumber: {
    fontSize: 12,
    color: '#6b7280',
  },
  date: {
    fontSize: 12,
    marginTop: 4,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
  },
  imageContainer: {
    marginRight: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  details: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quantity: {
    fontSize: 14,
    color: '#4b5563',
  },
  tracking: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 8,
  },
  statusUpdate: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusDate: {
    fontSize: 14,
  },
});

export default OrderItem;
