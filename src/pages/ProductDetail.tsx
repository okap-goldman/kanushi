import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProductById, createOrder, Product, processPayment } from '@/lib/ecService';
import Navbar from '@/components/Navbar';
import FooterNav from '@/components/FooterNav';
import QuantitySelector from '@/components/shop/QuantitySelector';
import PriceDisplay from '@/components/shop/PriceDisplay';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { ArrowLeft, ShoppingBag, Share2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatDistance } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id as string),
    enabled: !!id,
  });

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  const handlePurchase = async () => {
    if (!product) return;
    
    try {
      setIsProcessing(true);
      
      // In a real app, we would first collect shipping address,
      // but for this demo we use a placeholder
      const order = await createOrder({
        product_id: product.id,
        quantity,
        shipping_address_id: 'placeholder', // This would be selected by the user
      });
      
      // Process payment
      const payment = await processPayment(order.id);
      
      if (payment.success) {
        toast({
          title: '購入完了',
          description: '商品の購入が完了しました。',
        });
        
        // Navigate to order detail page
        navigate(`/orders/${order.id}`);
      }
    } catch (err) {
      toast({
        title: 'エラー',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.title,
        text: product?.description,
        url: window.location.href,
      })
      .catch((error) => {
        toast({
          title: '共有できませんでした',
          description: error.message,
          variant: 'destructive',
        });
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'リンクをコピーしました',
        description: 'URLがクリップボードにコピーされました。',
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistance(new Date(dateString), new Date(), {
        addSuffix: true,
        locale: ja,
      });
    } catch (e) {
      return dateString;
    }
  };

  const isOutOfStock = product?.stock === 0;
  const isOwnProduct = false; // This would be checked against the current user

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container max-w-4xl mx-auto px-4 py-6">
        <Link to="/shop" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft size={16} className="mr-1" />
          ショップに戻る
        </Link>
        
        {isLoading ? (
          <ProductDetailSkeleton />
        ) : isError ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>エラーが発生しました</AlertTitle>
            <AlertDescription>
              {(error as Error).message || '商品情報の取得に失敗しました。'}
            </AlertDescription>
          </Alert>
        ) : product ? (
          <div className="bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="md:flex">
              {/* Product Image */}
              <div className="md:w-1/2">
                <img 
                  src={product.image_url} 
                  alt={product.title}
                  className="w-full h-auto object-cover"
                />
              </div>
              
              {/* Product Details */}
              <div className="p-6 md:w-1/2">
                <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
                
                {product.seller && (
                  <Link 
                    to={`/profile/${product.seller.id}`}
                    className="flex items-center mb-4 hover:underline"
                  >
                    <Avatar className="h-6 w-6 mr-2">
                      <img 
                        src={product.seller.profile_image_url} 
                        alt={product.seller.display_name} 
                      />
                    </Avatar>
                    <span className="text-sm text-gray-700">
                      {product.seller.display_name}
                    </span>
                  </Link>
                )}
                
                <div className="mb-4">
                  <PriceDisplay 
                    price={product.price} 
                    currency={product.currency} 
                    size="lg" 
                  />
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">在庫状況:</span>
                    {isOutOfStock ? (
                      <span className="text-red-600 font-medium">売り切れ</span>
                    ) : (
                      <span className="text-green-600 font-medium">
                        残り{product.stock}点
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">出品日:</span>
                    <span>{formatDate(product.created_at)}</span>
                  </div>
                </div>
                
                {!isOutOfStock && !isOwnProduct && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium">数量:</span>
                      <QuantitySelector
                        quantity={quantity}
                        onChange={handleQuantityChange}
                        maxQuantity={product.stock}
                      />
                    </div>
                    
                    <Button 
                      className="w-full mb-2"
                      onClick={handlePurchase}
                      disabled={isProcessing}
                    >
                      {isProcessing ? '処理中...' : '購入する'} 
                      <ShoppingBag size={16} className="ml-2" />
                    </Button>
                  </div>
                )}
                
                {isOutOfStock && (
                  <Alert className="mb-6">
                    <AlertTitle>売り切れ</AlertTitle>
                    <AlertDescription>
                      この商品は現在在庫切れです。
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleShare}
                >
                  共有する <Share2 size={16} className="ml-2" />
                </Button>
              </div>
            </div>
            
            {/* Product Description */}
            <div className="p-6 border-t">
              <h2 className="text-xl font-bold mb-3">商品詳細</h2>
              <div className="whitespace-pre-line">
                {product.description}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            商品が見つかりませんでした
          </div>
        )}
        
        {/* Related Products (placeholder) */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">関連商品</h2>
          <div className="text-center py-8 text-gray-500">
            準備中です。しばらくお待ちください。
          </div>
        </div>
      </main>
      
      <FooterNav />
    </div>
  );
};

const ProductDetailSkeleton = () => {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm">
      <div className="md:flex">
        {/* Image Skeleton */}
        <div className="md:w-1/2">
          <Skeleton className="w-full h-96" />
        </div>
        
        {/* Details Skeleton */}
        <div className="p-6 md:w-1/2">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-4" />
          <Skeleton className="h-10 w-1/2 mb-6" />
          
          <Skeleton className="h-32 w-full mb-6" />
          
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      
      <div className="p-6 border-t">
        <Skeleton className="h-7 w-1/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
};

export default ProductDetail;