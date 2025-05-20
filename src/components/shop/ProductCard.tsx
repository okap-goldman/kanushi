import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Product } from '@/lib/ecService';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const formatPrice = (price: number, currency: string = 'JPY') => {
    return new Intl.NumberFormat('ja-JP', { 
      style: 'currency', 
      currency,
      minimumFractionDigits: 0
    }).format(price);
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <div className="relative">
        <Link to={`/shop/product/${product.id}`}>
          <img 
            src={product.image_url} 
            alt={product.title}
            className="h-48 w-full object-cover"
          />
        </Link>
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-bold">
              売り切れ
            </span>
          </div>
        )}
      </div>
      
      <CardContent className="flex-grow pt-4">
        <Link to={`/shop/product/${product.id}`} className="hover:underline">
          <h3 className="font-bold text-lg line-clamp-1">{product.title}</h3>
        </Link>
        
        {product.seller && (
          <div className="flex items-center mt-2">
            <Avatar className="h-5 w-5 mr-2">
              <img src={product.seller.profile_image_url} alt={product.seller.display_name} />
            </Avatar>
            <span className="text-sm text-gray-600">{product.seller.display_name}</span>
          </div>
        )}
        
        <p className="text-sm text-gray-500 line-clamp-2 mt-2">
          {product.description}
        </p>
      </CardContent>
      
      <CardFooter className="flex justify-between bg-gray-50 mt-auto">
        <div className="font-bold text-lg">
          {formatPrice(product.price, product.currency)}
        </div>
        <div className="text-sm text-gray-600">
          {isOutOfStock 
            ? <span className="text-red-600">在庫なし</span> 
            : <span>在庫: {product.stock}点</span>
          }
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;