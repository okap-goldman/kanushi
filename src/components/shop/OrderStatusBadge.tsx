import type React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { OrderStatus } from '../../lib/ecService';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: '注文受付',
          backgroundColor: '#e5e7eb',
          color: '#374151',
        };
      case 'paid':
        return {
          label: '支払い完了',
          backgroundColor: '#3b82f6',
          color: '#ffffff',
        };
      case 'shipped':
        return {
          label: '発送済み',
          backgroundColor: '#10b981',
          color: '#ffffff',
        };
      case 'refunded':
        return {
          label: '返金済み',
          backgroundColor: '#ef4444',
          color: '#ffffff',
        };
      default:
        return {
          label: status,
          backgroundColor: '#f3f4f6',
          color: '#374151',
        };
    }
  };

  const config = getStatusConfig(status);

  const sizeStyles = {
    sm: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 2 },
    md: { fontSize: 12, paddingHorizontal: 10, paddingVertical: 4 },
    lg: { fontSize: 14, paddingHorizontal: 12, paddingVertical: 6 },
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }, sizeStyles[size]]}>
      <Text style={[styles.text, { color: config.color, fontSize: sizeStyles[size].fontSize }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});

export default OrderStatusBadge;
