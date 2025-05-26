import type React from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';

interface PriceDisplayProps {
  price: number;
  currency?: string;
  style?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  currency = 'JPY',
  style,
  size = 'md',
}) => {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const sizeStyles = {
    sm: styles.small,
    md: styles.medium,
    lg: styles.large,
  };

  return <Text style={[styles.base, sizeStyles[size], style]}>{formatPrice(price, currency)}</Text>;
};

const styles = StyleSheet.create({
  base: {
    fontWeight: 'bold',
    color: '#000',
  },
  small: {
    fontSize: 16,
  },
  medium: {
    fontSize: 20,
  },
  large: {
    fontSize: 24,
  },
});

export default PriceDisplay;
