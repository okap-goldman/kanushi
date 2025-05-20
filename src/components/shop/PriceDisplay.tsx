import React from 'react';

interface PriceDisplayProps {
  price: number;
  currency?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  price, 
  currency = 'JPY', 
  className = '',
  size = 'md'
}) => {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('ja-JP', { 
      style: 'currency', 
      currency,
      minimumFractionDigits: 0
    }).format(price);
  };

  const sizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <span className={`font-bold ${sizeClasses[size]} ${className}`}>
      {formatPrice(price, currency)}
    </span>
  );
};

export default PriceDisplay;