import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Sample product categories
const PRODUCT_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'clothing', name: 'Clothing' },
  { id: 'accessories', name: 'Accessories' },
  { id: 'books', name: 'Books' },
  { id: 'art', name: 'Art' },
  { id: 'homeware', name: 'Homeware' },
];

// Sample products data
const SAMPLE_PRODUCTS = [
  {
    id: '1',
    name: 'Japanese Traditional Indigo Tote Bag',
    price: 4500,
    discountPrice: 3600,
    images: ['https://picsum.photos/400/400?random=40'],
    rating: 4.8,
    reviews: 24,
    category: 'accessories',
    seller: 'Traditional Craft Co.',
    isFeatured: true,
    isNew: false,
    description: 'Handcrafted tote bag made with traditional Japanese indigo dyeing techniques. Each bag is unique with slight variations in the pattern.',
  },
  {
    id: '2',
    name: 'Modern Kimono Jacket',
    price: 12000,
    discountPrice: null,
    images: ['https://picsum.photos/400/400?random=41'],
    rating: 4.5,
    reviews: 36,
    category: 'clothing',
    seller: 'Tokyo Style',
    isFeatured: true,
    isNew: true,
    description: 'Contemporary take on the traditional kimono, redesigned as a versatile jacket that can be worn with any outfit.',
  },
  {
    id: '3',
    name: 'Ceramic Tea Set',
    price: 8500,
    discountPrice: null,
    images: ['https://picsum.photos/400/400?random=42'],
    rating: 4.9,
    reviews: 18,
    category: 'homeware',
    seller: 'Kyoto Ceramics',
    isFeatured: false,
    isNew: true,
    description: 'Handmade ceramic tea set including teapot and four cups. Perfect for enjoying Japanese green tea in style.',
  },
  {
    id: '4',
    name: 'Illustrated Guide to Japanese Gardens',
    price: 3200,
    discountPrice: null,
    images: ['https://picsum.photos/400/400?random=43'],
    rating: 4.6,
    reviews: 42,
    category: 'books',
    seller: 'Japan Press',
    isFeatured: false,
    isNew: false,
    description: 'Comprehensive guide to the most beautiful Japanese gardens, with full-color photographs and practical advice for garden design.',
  },
  {
    id: '5',
    name: 'Handcrafted Wooden Chopsticks Set',
    price: 2800,
    discountPrice: 2400,
    images: ['https://picsum.photos/400/400?random=44'],
    rating: 4.7,
    reviews: 29,
    category: 'homeware',
    seller: 'Kyoto Woodcraft',
    isFeatured: true,
    isNew: false,
    description: 'Set of two pairs of handcrafted wooden chopsticks with carrying case. Made from sustainable Japanese cypress wood.',
  },
  {
    id: '6',
    name: 'Mount Fuji Art Print',
    price: 6500,
    discountPrice: null,
    images: ['https://picsum.photos/400/400?random=45'],
    rating: 4.9,
    reviews: 13,
    category: 'art',
    seller: 'Tokyo Art Collective',
    isFeatured: false,
    isNew: true,
    description: 'Limited edition art print of Mount Fuji at sunrise. Signed by the artist and numbered. Includes certificate of authenticity.',
  },
];

// Featured products subset
const FEATURED_PRODUCTS = SAMPLE_PRODUCTS.filter(product => product.isFeatured);

export default function Shop() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigation = useNavigation<any>();

  const filteredProducts = selectedCategory === 'all'
    ? SAMPLE_PRODUCTS
    : SAMPLE_PRODUCTS.filter(product => product.category === selectedCategory);

  const navigateToProductDetail = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const navigateToOrders = () => {
    navigation.navigate('Orders');
  };

  const renderProductItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigateToProductDetail(item.id)}
    >
      <View style={styles.productImageContainer}>
        <Image
          source={{ uri: item.images[0] }}
          style={styles.productImage}
          contentFit="cover"
        />
        {item.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.sellerName}>{item.seller}</Text>
        
        <View style={styles.priceRow}>
          {item.discountPrice ? (
            <>
              <Text style={styles.discountPrice}>¥{item.discountPrice.toLocaleString()}</Text>
              <Text style={styles.originalPrice}>¥{item.price.toLocaleString()}</Text>
            </>
          ) : (
            <Text style={styles.price}>¥{item.price.toLocaleString()}</Text>
          )}
        </View>
        
        <View style={styles.ratingRow}>
          <View style={styles.rating}>
            <Feather name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          <Text style={styles.reviewCount}>({item.reviews} reviews)</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="search" size={24} color="#1A202C" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={navigateToOrders}
          >
            <Feather name="shopping-bag" size={24} color="#1A202C" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Featured products section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredProductsContainer}
          >
            {FEATURED_PRODUCTS.map(product => (
              <TouchableOpacity
                key={product.id}
                style={styles.featuredProductCard}
                onPress={() => navigateToProductDetail(product.id)}
              >
                <Image
                  source={{ uri: product.images[0] }}
                  style={styles.featuredProductImage}
                  contentFit="cover"
                />
                <View style={styles.featuredProductInfo}>
                  <Text style={styles.featuredProductName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.featuredProductPrice}>
                    ¥{product.discountPrice?.toLocaleString() || product.price.toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Categories filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {PRODUCT_CATEGORIES.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonSelected,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextSelected,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Products grid */}
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsGrid}
          scrollEnabled={false} // Disable scrolling as it's inside a ScrollView
        />
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  seeAllText: {
    fontSize: 14,
    color: '#0070F3',
  },
  featuredProductsContainer: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  featuredProductCard: {
    width: 160,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F7FAFC',
  },
  featuredProductImage: {
    width: '100%',
    height: 160,
  },
  featuredProductInfo: {
    padding: 8,
  },
  featuredProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
  },
  featuredProductPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0070F3',
  },
  categoriesContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoriesContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EDF2F7',
    marginHorizontal: 4,
  },
  categoryButtonSelected: {
    backgroundColor: '#0070F3',
  },
  categoryText: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  productsGrid: {
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 24,
  },
  productCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 160,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#0070F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
    height: 40,
  },
  sellerName: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E53E3E',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#718096',
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#1A202C',
    fontWeight: '600',
    marginLeft: 2,
  },
  reviewCount: {
    fontSize: 12,
    color: '#718096',
  },
});