import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Product } from '../../lib/ecService';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigation = useNavigation<any>();

  const formatPrice = (price: number, currency: string = 'JPY') => {
    return new Intl.NumberFormat('ja-JP', { 
      style: 'currency', 
      currency,
      minimumFractionDigits: 0
    }).format(price);
  };

  const isOutOfStock = product.stock <= 0;

  const handlePress = () => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.image_url }} 
            style={styles.productImage}
          />
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>売り切れ</Text>
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {product.title}
          </Text>
          
          {product.seller && (
            <View style={styles.sellerInfo}>
              <Avatar 
                source={{ uri: product.seller.profile_image_url }}
                size={20}
                style={styles.sellerAvatar}
              />
              <Text style={styles.sellerName} numberOfLines={1}>
                {product.seller.display_name}
              </Text>
            </View>
          )}
          
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.price}>
            {formatPrice(product.price, product.currency)}
          </Text>
          <Text style={[
            styles.stock,
            isOutOfStock && styles.stockOut
          ]}>
            {isOutOfStock 
              ? '在庫なし' 
              : `在庫: ${product.stock}点`
            }
          </Text>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    margin: 0,
    padding: 0,
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    height: 192,
    width: '100%',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  outOfStockText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sellerAvatar: {
    marginRight: 8,
  },
  sellerName: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  stock: {
    fontSize: 14,
    color: '#4b5563',
  },
  stockOut: {
    color: '#dc2626',
  },
});

export default ProductCard;