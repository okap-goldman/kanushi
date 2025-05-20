import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrderById, updateOrderStatus } from '@/lib/ecService';
import Navbar from '@/components/Navbar';
import FooterNav from '@/components/FooterNav';
import OrderStatusBadge from '@/components/shop/OrderStatusBadge';
import PriceDisplay from '@/components/shop/PriceDisplay';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft,
  Package,
  Truck,
  RefreshCcw,
  AlertTriangle,
  Calendar,
  ClipboardCheck,
  MapPin
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatDistance, format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('ヤマト運輸');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { data: order, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id as string),
    enabled: !!id,
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      return format(new Date(dateString), 'yyyy年M月d日 HH:mm', { locale: ja });
    } catch (e) {
      return dateString;
    }
  };

  const formatRelativeDate = (dateString?: string) => {
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

  const handleUpdateToShipped = async () => {
    if (!order || !id) return;
    
    try {
      setIsUpdatingStatus(true);
      
      await updateOrderStatus(id, 'shipped', {
        tracking_number: trackingNumber,
        shipping_carrier: shippingCarrier,
      });
      
      toast({
        title: '更新完了',
        description: '注文を発送済みに更新しました。',
      });
      
      refetch();
    } catch (err) {
      toast({
        title: 'エラー',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !id) return;
    
    try {
      setIsUpdatingStatus(true);
      
      await updateOrderStatus(id, 'refunded');
      
      toast({
        title: '注文キャンセル完了',
        description: '注文がキャンセルされ、返金処理が開始されました。',
      });
      
      refetch();
    } catch (err) {
      toast({
        title: 'エラー',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Determine if current user is the seller or buyer
  const isSeller = order?.product?.seller?.id === 'current-user-id'; // This would be a real check
  const isBuyer = order?.buyer?.id === 'current-user-id'; // This would be a real check

  // Calculate stats
  const isPending = order?.status === 'pending';
  const isPaid = order?.status === 'paid';
  const isShipped = order?.status === 'shipped';
  const isRefunded = order?.status === 'refunded';
  const isCompletable = isPaid && !isShipped && !isRefunded;
  const isCancelable = (isPending || isPaid) && !isShipped && !isRefunded;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container max-w-3xl mx-auto px-4 py-6">
        <Link to="/orders" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft size={16} className="mr-1" />
          注文一覧に戻る
        </Link>
        
        {isLoading ? (
          <OrderDetailSkeleton />
        ) : isError ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            <AlertTriangle className="inline-block mr-2" />
            エラーが発生しました: {(error as Error).message || '注文の取得に失敗しました。'}
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Order Header */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>注文詳細</CardTitle>
                    <CardDescription>
                      注文番号: {order.id.substring(0, 8)}
                    </CardDescription>
                  </div>
                  <OrderStatusBadge status={order.status} size="lg" />
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium mb-1 text-gray-500">注文日</h3>
                    <p className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                      {formatDate(order.created_at)}
                    </p>
                    
                    {order.paid_at && (
                      <>
                        <h3 className="text-sm font-medium mb-1 mt-3 text-gray-500">支払い日</h3>
                        <p className="flex items-center">
                          <ClipboardCheck className="h-4 w-4 mr-1 text-gray-500" />
                          {formatDate(order.paid_at)}
                        </p>
                      </>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    {order.shipped_at && (
                      <>
                        <h3 className="text-sm font-medium mb-1 text-gray-500">発送日</h3>
                        <p className="flex items-center">
                          <Truck className="h-4 w-4 mr-1 text-gray-500" />
                          {formatDate(order.shipped_at)}
                        </p>
                      </>
                    )}
                    
                    {order.refunded_at && (
                      <>
                        <h3 className="text-sm font-medium mb-1 mt-3 text-gray-500">返金日</h3>
                        <p className="flex items-center">
                          <RefreshCcw className="h-4 w-4 mr-1 text-gray-500" />
                          {formatDate(order.refunded_at)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Shipping Information */}
                {isShipped && order.tracking_number && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <h3 className="text-sm font-medium mb-2">配送情報</h3>
                    <p className="text-sm">
                      配送業者: {order.shipping_carrier || '未指定'}
                    </p>
                    <p className="text-sm">
                      追跡番号: {order.tracking_number}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle>商品情報</CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="flex">
                  {order.product?.image_url && (
                    <div className="flex-shrink-0 mr-4">
                      <Link to={`/shop/product/${order.product.id}`}>
                        <img 
                          src={order.product.image_url} 
                          alt={order.product.title} 
                          className="w-24 h-24 object-cover rounded"
                        />
                      </Link>
                    </div>
                  )}
                  
                  <div>
                    <Link 
                      to={`/shop/product/${order.product?.id}`}
                      className="font-medium hover:underline"
                    >
                      {order.product?.title}
                    </Link>
                    
                    {order.product?.seller && (
                      <div className="text-sm text-gray-500 mt-1">
                        販売者: {order.product.seller.display_name}
                      </div>
                    )}
                    
                    <div className="mt-2">
                      <span className="text-sm">数量: {order.quantity}</span>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>小計</span>
                    <PriceDisplay price={order.amount} size="sm" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>送料</span>
                    <span>無料</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>合計金額</span>
                    <PriceDisplay price={order.amount} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Shipping Address (placeholder) */}
            <Card>
              <CardHeader>
                <CardTitle>配送先住所</CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium">テスト 太郎</p>
                    <p className="text-sm text-gray-600">
                      〒123-4567<br />
                      東京都渋谷区代々木1-2-3<br />
                      アパート101号室<br />
                      電話: 090-1234-5678
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Actions Section */}
            {(isCompletable || isCancelable) && (
              <Card>
                <CardHeader>
                  <CardTitle>アクション</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* For Seller: Mark as Shipped */}
                  {isSeller && isCompletable && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">商品を発送する</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="shipping-carrier">配送業者</Label>
                            <Input 
                              id="shipping-carrier"
                              value={shippingCarrier}
                              onChange={(e) => setShippingCarrier(e.target.value)}
                              placeholder="ヤマト運輸"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tracking-number">追跡番号</Label>
                            <Input 
                              id="tracking-number"
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                              placeholder="123456789012"
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={handleUpdateToShipped}
                          disabled={isUpdatingStatus || !trackingNumber}
                          className="w-full md:w-auto"
                        >
                          {isUpdatingStatus ? '処理中...' : '発送済みに更新する'}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* For Buyer (or Seller): Cancel Order */}
                  {(isBuyer || isSeller) && isCancelable && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">注文をキャンセルする</h3>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full md:w-auto">
                            注文をキャンセル
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>注文をキャンセルしますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              この操作は取り消せません。注文はキャンセルされ、支払い済みの場合は返金処理が行われます。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleCancelOrder}
                              disabled={isUpdatingStatus}
                            >
                              {isUpdatingStatus ? '処理中...' : '注文をキャンセルする'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            注文が見つかりませんでした
          </div>
        )}
      </main>
      
      <FooterNav />
    </div>
  );
};

const OrderDetailSkeleton = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-5 w-40" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex">
            <Skeleton className="w-24 h-24 mr-4" />
            <div className="flex-1">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          
          <Skeleton className="h-px w-full my-4" />
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-px w-full my-2" />
            <div className="flex justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex">
            <Skeleton className="h-5 w-5 mr-2" />
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48 mb-1" />
              <Skeleton className="h-4 w-40 mb-1" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetail;