import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts, Product } from '@/lib/ecService';
import ProductCard from './ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductListProps {
  sellerId?: string;
  initialSearch?: string;
}

const ProductList: React.FC<ProductListProps> = ({ sellerId, initialSearch = '' }) => {
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  
  // Price filter state
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['products', page, search, minPrice, maxPrice, sellerId],
    queryFn: () => getProducts({
      page,
      seller_id: sellerId,
      search: search || undefined,
      min_price: minPrice,
      max_price: maxPrice,
    }),
    keepPreviousData: true,
  });

  useEffect(() => {
    if (data) {
      if (page === 1) {
        setAllProducts(data.products);
      } else {
        setAllProducts(prev => [...prev, ...data.products]);
      }
      setNextPage(data.next_page);
    }
  }, [data, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const handleLoadMore = () => {
    if (nextPage) {
      setPage(nextPage);
    }
  };

  const handlePriceFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setMinPrice(tempMinPrice ? Number(tempMinPrice) : undefined);
    setMaxPrice(tempMaxPrice ? Number(tempMaxPrice) : undefined);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setTempMinPrice('');
    setTempMaxPrice('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setPage(1);
  };

  // Skeleton loader for products
  const ProductSkeleton = () => (
    <div className="h-full">
      <Skeleton className="h-48 w-full" />
      <div className="p-4">
        <Skeleton className="h-6 w-2/3 mt-2" />
        <Skeleton className="h-4 w-1/3 mt-2" />
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-full mt-1" />
        <div className="flex justify-between mt-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <Input
            type="text"
            placeholder="商品名で検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit">検索</Button>
        </form>
        
        <details className="text-sm">
          <summary className="cursor-pointer font-medium">詳細検索</summary>
          <form onSubmit={handlePriceFilter} className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="min-price">最低価格</Label>
                <Input
                  id="min-price"
                  type="number"
                  placeholder="0"
                  value={tempMinPrice}
                  onChange={(e) => setTempMinPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="max-price">最高価格</Label>
                <Input
                  id="max-price"
                  type="number"
                  placeholder="100000"
                  value={tempMaxPrice}
                  onChange={(e) => setTempMaxPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <Button type="submit" variant="outline">
                価格で絞り込む
              </Button>
              <Button type="button" variant="ghost" onClick={resetFilters}>
                フィルターをリセット
              </Button>
            </div>
          </form>
        </details>
      </div>

      {isError ? (
        <div className="p-4 text-center text-red-500">
          エラーが発生しました: {(error as Error).message}
        </div>
      ) : (
        <>
          {(minPrice !== undefined || maxPrice !== undefined || search) && (
            <div className="mb-4 text-sm">
              <span className="font-medium">検索条件: </span>
              {search && <span className="mr-2">「{search}」</span>}
              {minPrice !== undefined && <span className="mr-2">最低価格: {minPrice}円</span>}
              {maxPrice !== undefined && <span>最高価格: {maxPrice}円</span>}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading && page === 1 ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="border rounded-lg overflow-hidden">
                  <ProductSkeleton />
                </div>
              ))
            ) : allProducts.length > 0 ? (
              allProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                商品が見つかりませんでした
              </div>
            )}
          </div>

          {isLoading && page > 1 && (
            <div className="flex justify-center mt-6">
              <div className="animate-pulse flex space-x-2">
                <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
                <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
                <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
              </div>
            </div>
          )}

          {nextPage && !isLoading && (
            <div className="flex justify-center mt-8">
              <Button onClick={handleLoadMore} variant="outline">
                もっと見る
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductList;