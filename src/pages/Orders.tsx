import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrders, OrderStatus } from '@/lib/ecService';
import OrderItem from '@/components/shop/OrderItem';
import Navbar from '@/components/Navbar';
import FooterNav from '@/components/FooterNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Package, ShoppingBag } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Orders: React.FC = () => {
  const [viewMode, setViewMode] = useState<'buyer' | 'seller'>('buyer');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['orders', viewMode, statusFilter, page],
    queryFn: () => getOrders({
      as_seller: viewMode === 'seller',
      status: statusFilter,
      page,
    }),
    keepPreviousData: true,
  });

  useEffect(() => {
    if (data) {
      if (page === 1) {
        setAllOrders(data.orders);
      } else {
        setAllOrders(prev => [...prev, ...data.orders]);
      }
    }
  }, [data, page]);

  const handleTabChange = (value: string) => {
    setViewMode(value as 'buyer' | 'seller');
    setPage(1);
    setAllOrders([]);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as OrderStatus | 'all');
    setPage(1);
    setAllOrders([]);
  };

  const handleLoadMore = () => {
    if (data?.next_page) {
      setPage(data.next_page);
    }
  };

  // Skeleton loader for orders
  const OrderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          <div className="p-4 border-b flex justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="p-4 flex">
            <Skeleton className="w-20 h-20 rounded mr-4" />
            <div className="flex-grow">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-5/6 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="container max-w-3xl mx-auto px-4 py-6 flex-grow">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <ShoppingBag className="mr-2" size={24} />
            注文履歴
          </h1>
        </div>

        <Tabs defaultValue="buyer" onValueChange={handleTabChange} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buyer">購入した商品</TabsTrigger>
            <TabsTrigger value="seller">販売した商品</TabsTrigger>
          </TabsList>
          
          <div className="mt-6 mb-6">
            <div className="text-sm font-medium mb-2">ステータスで絞り込む:</div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={statusFilter === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => handleStatusFilterChange('all')}
              >
                すべて
              </Button>
              <Button 
                variant={statusFilter === 'pending' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => handleStatusFilterChange('pending')}
              >
                注文受付
              </Button>
              <Button 
                variant={statusFilter === 'paid' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => handleStatusFilterChange('paid')}
              >
                支払い完了
              </Button>
              <Button 
                variant={statusFilter === 'shipped' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => handleStatusFilterChange('shipped')}
              >
                発送済み
              </Button>
              <Button 
                variant={statusFilter === 'refunded' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => handleStatusFilterChange('refunded')}
              >
                返金済み
              </Button>
            </div>
          </div>
          
          <TabsContent value="buyer">
            {isLoading && page === 1 ? (
              <OrderSkeleton />
            ) : isError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {(error as Error).message || '注文履歴の取得に失敗しました。'}
                </AlertDescription>
              </Alert>
            ) : allOrders.length > 0 ? (
              <div className="space-y-4">
                {allOrders.map(order => (
                  <OrderItem key={order.id} order={order} />
                ))}
                
                {data?.next_page && (
                  <div className="text-center mt-6">
                    <Button onClick={handleLoadMore} variant="outline">
                      もっと読み込む
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                <Package size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">注文履歴がありません</p>
                <p className="mt-2">商品を購入すると、ここに表示されます。</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/shop'}>
                  ショップを見る
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="seller">
            {isLoading && page === 1 ? (
              <OrderSkeleton />
            ) : isError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {(error as Error).message || '注文履歴の取得に失敗しました。'}
                </AlertDescription>
              </Alert>
            ) : allOrders.length > 0 ? (
              <div className="space-y-4">
                {allOrders.map(order => (
                  <OrderItem key={order.id} order={order} />
                ))}
                
                {data?.next_page && (
                  <div className="text-center mt-6">
                    <Button onClick={handleLoadMore} variant="outline">
                      もっと読み込む
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                <Package size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">販売履歴がありません</p>
                <p className="mt-2">商品が購入されると、ここに表示されます。</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/shop/manage'}>
                  出品管理
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <FooterNav />
    </div>
  );
};

export default Orders;