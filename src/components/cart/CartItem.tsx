import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CartItem as CartItemType } from '../../lib/cartService';
import { QuantitySelector } from '../shop/QuantitySelector';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({ 
  item, 
  onUpdateQuantity, 
  onRemove 
}) => {
  const formatPrice = (price: number, currency: string = 'JPY') => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleQuantityChange = (newQuantity: number) => {
    onUpdateQuantity(item.id, newQuantity);
  };

  const subtotal = item.price * item.quantity;

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(item.id)}
          >
            <Feather name="x" size={20} color="#718096" />
          </TouchableOpacity>
        </View>

        <Text style={styles.price}>
          {formatPrice(item.price, item.currency)}
        </Text>

        <View style={styles.footer}>
          <QuantitySelector
            quantity={item.quantity}
            maxQuantity={item.stock}
            onQuantityChange={handleQuantityChange}
            style={styles.quantitySelector}
          />
          
          <Text style={styles.subtotal}>
            {formatPrice(subtotal, item.currency)}
          </Text>
        </View>

        {item.quantity >= item.stock && (
          <Text style={styles.stockWarning}>
            在庫数に達しています
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  price: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantitySelector: {
    flex: 0,
  },
  subtotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  stockWarning: {
    fontSize: 12,
    color: '#E53E3E',
    marginTop: 4,
  },
});