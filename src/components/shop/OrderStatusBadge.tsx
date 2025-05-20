import React from 'react';
import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '@/lib/ecService';

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
          variant: 'secondary' as const
        };
      case 'paid':
        return {
          label: '支払い完了',
          variant: 'default' as const
        };
      case 'shipped':
        return {
          label: '発送済み',
          variant: 'success' as const
        };
      case 'refunded':
        return {
          label: '返金済み',
          variant: 'destructive' as const
        };
      default:
        return {
          label: status,
          variant: 'outline' as const
        };
    }
  };

  const config = getStatusConfig(status);
  
  const sizeClass = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <Badge variant={config.variant} className={sizeClass[size]}>
      {config.label}
    </Badge>
  );
};

export default OrderStatusBadge;