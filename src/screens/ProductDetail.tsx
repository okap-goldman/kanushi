import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

// Sample products data (same as in Shop.tsx)
const SAMPLE_PRODUCTS = [
  {
    id: '1',
    name: 'Japanese Traditional Indigo Tote Bag',
    price: 4500,
    discountPrice: 3600,
    images: [
      'https://picsum.photos/400/400?random=40',
      'https://picsum.photos/400/400?random=50',
      'https://picsum.photos/400/400?random=51',
    ],
    rating: 4.8,
    reviews: 24,
    category: 'accessories',
    seller: 'Traditional Craft Co.',
    isFeatured: true,
    isNew: false,
    description:
      'Handcrafted tote bag made with traditional Japanese indigo dyeing techniques. Each bag is unique with slight variations in the pattern.\n\nThe tote bag features:\n- 100% cotton canvas material\n- Hand-dyed using traditional aizome indigo technique\n- Interior pocket\n- Leather handles\n- Dimensions: 35cm x 40cm x 10cm\n\nEvery purchase supports local artisans continuing centuries-old Japanese dyeing traditions.',
    specifications: [
      { name: 'Material', value: '100% Cotton Canvas' },
      { name: 'Color', value: 'Indigo Blue' },
      { name: 'Dimensions', value: '35cm x 40cm x 10cm' },
      { name: 'Weight', value: '350g' },
      { name: 'Care', value: 'Hand wash cold, hang dry' },
    ],
    stock: 12,
  },
  {
    id: '2',
    name: 'Modern Kimono Jacket',
    price: 12000,
    discountPrice: null,
    images: [
      'https://picsum.photos/400/400?random=41',
      'https://picsum.photos/400/400?random=52',
      'https://picsum.photos/400/400?random=53',
    ],
    rating: 4.5,
    reviews: 36,
    category: 'clothing',
    seller: 'Tokyo Style',
    isFeatured: true,
    isNew: true,
    description:
      'Contemporary take on the traditional kimono, redesigned as a versatile jacket that can be worn with any outfit. Combines traditional Japanese textiles with modern silhouettes.\n\nFeatures:\n- Made from premium quality cotton and silk blend\n- Traditional Japanese pattern inspired by cherry blossoms\n- Wide sleeves with subtle drape\n- Tie belt closure\n- Available in sizes S, M, L\n\nThis kimono jacket transitions easily from casual daywear to elegant evening attire.',
    specifications: [
      { name: 'Material', value: 'Cotton-Silk Blend' },
      { name: 'Color', value: 'Navy with Pattern' },
      { name: 'Sizes', value: 'S, M, L' },
      { name: 'Care', value: 'Dry clean only' },
      { name: 'Made in', value: 'Japan' },
    ],
    stock: 8,
  },
  {
    id: '3',
    name: 'Ceramic Tea Set',
    price: 8500,
    discountPrice: null,
    images: [
      'https://picsum.photos/400/400?random=42',
      'https://picsum.photos/400/400?random=54',
      'https://picsum.photos/400/400?random=55',
    ],
    rating: 4.9,
    reviews: 18,
    category: 'homeware',
    seller: 'Kyoto Ceramics',
    isFeatured: false,
    isNew: true,
    description:
      'Handmade ceramic tea set including teapot and four cups. Perfect for enjoying Japanese green tea in style.\n\nThis elegant tea set is crafted by master potter Yamada Takeshi in his Kyoto studio. Each piece is individually thrown, glazed, and fired using traditional methods passed down through generations.\n\nThe set includes:\n- 1 teapot (350ml capacity) with bamboo handle\n- 4 tea cups\n- 1 bamboo tea scoop\n\nThe minimalist design features a subtle blue glaze that enhances the tea drinking experience.',
    specifications: [
      { name: 'Material', value: 'Porcelain' },
      { name: 'Color', value: 'Sky Blue' },
      { name: 'Capacity', value: '350ml (teapot), 70ml (cups)' },
      { name: 'Care', value: 'Hand wash only' },
      { name: 'Made in', value: 'Kyoto, Japan' },
    ],
    stock: 5,
  },
];

export default function ProductDetail() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute<any>();
  const { productId } = route.params || { productId: '1' };

  // Find the product from the sample data
  const product = SAMPLE_PRODUCTS.find((p) => p.id === productId) || SAMPLE_PRODUCTS[0];

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const addToCart = () => {
    // In a real app, this would add the product to the shopping cart
    alert(`Added ${quantity} item(s) to cart`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1A202C" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="heart" size={24} color="#1A202C" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="share-2" size={24} color="#1A202C" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Orders' as never)}
          >
            <Feather name="shopping-bag" size={24} color="#1A202C" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product images */}
        <View style={styles.imageGallery}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(newIndex);
            }}
          >
            {product.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.productImage}
                contentFit="cover"
              />
            ))}
          </ScrollView>

          {/* Image pagination indicators */}
          <View style={styles.paginationContainer}>
            {product.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  currentImageIndex === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Product info */}
        <View style={styles.productInfo}>
          <View style={styles.priceRow}>
            {product.discountPrice ? (
              <>
                <Text style={styles.discountPrice}>¥{product.discountPrice.toLocaleString()}</Text>
                <Text style={styles.originalPrice}>¥{product.price.toLocaleString()}</Text>
              </>
            ) : (
              <Text style={styles.price}>¥{product.price.toLocaleString()}</Text>
            )}

            {product.isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
          </View>

          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.ratingRow}>
            <View style={styles.rating}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Feather
                  key={star}
                  name="star"
                  size={16}
                  color={star <= Math.floor(product.rating) ? '#F59E0B' : '#E2E8F0'}
                  solid={star <= Math.floor(product.rating)}
                />
              ))}
              <Text style={styles.ratingText}>{product.rating}</Text>
            </View>
            <Text style={styles.reviewCount}>{product.reviews} reviews</Text>
          </View>

          <TouchableOpacity style={styles.sellerRow}>
            <Text style={styles.sellerLabel}>Seller:</Text>
            <Text style={styles.sellerName}>{product.seller}</Text>
            <Feather name="chevron-right" size={16} color="#718096" />
          </TouchableOpacity>
        </View>

        {/* Quantity selector */}
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Quantity:</Text>
          <View style={styles.quantitySelector}>
            <TouchableOpacity
              style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
              onPress={decrementQuantity}
              disabled={quantity <= 1}
            >
              <Feather name="minus" size={16} color={quantity <= 1 ? '#A0AEC0' : '#1A202C'} />
            </TouchableOpacity>

            <Text style={styles.quantityValue}>{quantity}</Text>

            <TouchableOpacity
              style={[
                styles.quantityButton,
                quantity >= product.stock && styles.quantityButtonDisabled,
              ]}
              onPress={incrementQuantity}
              disabled={quantity >= product.stock}
            >
              <Feather
                name="plus"
                size={16}
                color={quantity >= product.stock ? '#A0AEC0' : '#1A202C'}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.stockText}>{product.stock} available</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>
        </View>

        {/* Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specifications</Text>

          {product.specifications.map((spec, index) => (
            <View
              key={index}
              style={[
                styles.specRow,
                index === product.specifications.length - 1 && styles.lastSpecRow,
              ]}
            >
              <Text style={styles.specName}>{spec.name}</Text>
              <Text style={styles.specValue}>{spec.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.actionBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>
            ¥{((product.discountPrice || product.price) * quantity).toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity style={styles.addToCartButton} onPress={addToCart}>
          <Feather name="shopping-cart" size={20} color="#FFFFFF" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  imageGallery: {
    position: 'relative',
  },
  productImage: {
    width,
    height: width,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  productInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  discountPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E53E3E',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#718096',
    textDecorationLine: 'line-through',
  },
  newBadge: {
    backgroundColor: '#0070F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#1A202C',
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#718096',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerLabel: {
    fontSize: 14,
    color: '#718096',
    marginRight: 4,
  },
  sellerName: {
    fontSize: 14,
    color: '#0070F3',
    fontWeight: '600',
    flex: 1,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  quantityLabel: {
    fontSize: 16,
    color: '#1A202C',
    fontWeight: '600',
    marginRight: 16,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
  },
  quantityButton: {
    padding: 8,
    width: 36,
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    width: 40,
    textAlign: 'center',
  },
  stockText: {
    fontSize: 14,
    color: '#718096',
    marginLeft: 'auto',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4A5568',
  },
  specRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  lastSpecRow: {
    borderBottomWidth: 0,
  },
  specName: {
    fontSize: 14,
    color: '#718096',
    flex: 1,
  },
  specValue: {
    fontSize: 14,
    color: '#1A202C',
    fontWeight: '500',
    flex: 2,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: '#718096',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  addToCartButton: {
    backgroundColor: '#0070F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
