import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductList from '@/components/shop/ProductList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from '@/components/Navbar';
import FooterNav from '@/components/FooterNav';

const Shop: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sellerId = searchParams.get('seller_id') || undefined;
  const initialSearch = searchParams.get('search') || '';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">ショップ</h1>
          {sellerId && (
            <p className="text-gray-600 mt-1">特定の販売者の商品を表示しています</p>
          )}
        </div>

        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="w-full max-w-md mx-auto">
            <TabsTrigger value="all" className="flex-1">全商品</TabsTrigger>
            <TabsTrigger value="featured" className="flex-1">おすすめ</TabsTrigger>
            <TabsTrigger value="new" className="flex-1">新着</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <ProductList sellerId={sellerId} initialSearch={initialSearch} />
          </TabsContent>
          
          <TabsContent value="featured" className="mt-6">
            <div className="text-center py-8 text-gray-500">
              準備中です。しばらくお待ちください。
            </div>
          </TabsContent>
          
          <TabsContent value="new" className="mt-6">
            <div className="text-center py-8 text-gray-500">
              準備中です。しばらくお待ちください。
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <FooterNav />
    </div>
  );
};

export default Shop;