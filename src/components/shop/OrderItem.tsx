import React from 'react';
import { Link } from 'react-router-dom';
import { Order } from '@/lib/ecService';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistance } from 'date-fns';
import { ja } from 'date-fns/locale';
import OrderStatusBadge from './OrderStatusBadge';
import PriceDisplay from './PriceDisplay';

interface OrderItemProps {
  order: Order;
}

const OrderItem: React.FC<OrderItemProps> = ({ order }) => {
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

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 flex justify-between items-center border-b">
          <div>
            <div className="text-sm text-gray-500">注文番号: {order.id.substring(0, 8)}</div>
            <div className="text-sm">{formatDate(order.created_at)}</div>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        
        <Link to={`/orders/${order.id}`} className="block hover:bg-gray-50">
          <div className="flex p-4">
            {order.product?.image_url && (
              <div className="flex-shrink-0 mr-4">
                <img 
                  src={order.product.image_url} 
                  alt={order.product?.title || '商品画像'} 
                  className="w-20 h-20 object-cover rounded"
                />
              </div>
            )}
            
            <div className="flex-grow">
              <h3 className="font-medium">
                {order.product?.title || '商品名が取得できません'}
              </h3>
              
              <div className="flex justify-between mt-2">
                <div className="text-sm text-gray-600">
                  数量: {order.quantity}
                </div>
                <PriceDisplay price={order.amount} size="sm" />
              </div>
              
              {order.status === 'shipped' && order.tracking_number && (
                <div className="mt-2 text-xs text-gray-500">
                  配送情報: {order.shipping_carrier || ''} {order.tracking_number}
                </div>
              )}
              
              <div className="mt-2 text-sm">
                <span className="text-gray-500">ステータス更新: </span>
                <span>{getRelevantDate(order)}</span>
              </div>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};

export default OrderItem;