import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import React, { useState, useEffect } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Product, ecService, createApplePayOrder } from '../lib/ecService';
import { useAuth } from '../context/AuthContext';
import { cartService } from '../lib/cartService';
import { ApplePayButton } from '../components/shop/ApplePayButton';
import { Avatar } from '../components/ui/Avatar';

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
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { productId } = route.params || {};

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productData = await ecService.getProductById(productId);
      setProduct(productData);
    } catch (error) {
      Alert.alert('エラー', '商品の取得に失敗しました');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070F3" />
          <Text style={styles.loadingText}>商品を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>商品が見つかりません</Text>
        </View>
      </SafeAreaView>
    );
  }

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

  const addToCart = async () => {
    if (!user) {
      Alert.alert('ログインが必要です', 'カートに追加するにはログインしてください');
      return;
    }

    if (!product) return;

    try {
      await cartService.addToCart({
        productId: product.id,
        title: product.title,
        price: product.price,
        currency: product.currency,
        imageUrl: product.image_url,
        quantity: quantity,
        stock: product.stock,
        sellerId: product.seller_user_id,
      });
      
      Alert.alert(
        'カートに追加しました', 
        `${product.title} × ${quantity}個をカートに追加しました`,
        [
          { text: 'ショッピングを続ける', style: 'cancel' },
          { 
            text: 'カートを見る', 
            onPress: () => navigation.navigate('Cart' as never)
          }
        ]
      );
    } catch (error) {
      Alert.alert('エラー', (error as Error).message);
    }
  };

  const handleApplePayStart = () => {
    console.log('Apple Pay決済を開始します...');
  };

  const handleApplePaySuccess = async (result: any) => {
    try {
      if (!user || !product) {
        Alert.alert('エラー', 'ユーザー情報または商品情報が見つかりません');
        return;
      }

      // TODO: 実際の配送先住所IDを取得する必要があります
      // ここでは仮のIDを使用
      const shippingAddressId = 'default-address-id';

      const order = await createApplePayOrder(user.id, {
        productId: product.id,
        quantity,
        shippingAddressId,
        applePayResult: result,
      });

      Alert.alert(
        '注文完了',
        `Apple Payでの決済が完了しました。\n注文ID: ${order.id}`,
        [
          {
            text: '注文履歴を見る',
            onPress: () => navigation.navigate('Orders' as never),
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      console.error('Apple Pay order creation failed:', error);
      Alert.alert('エラー', 'Apple Pay決済の処理に失敗しました');
    }
  };

  const handleApplePayError = (error: Error) => {
    console.error('Apple Pay payment failed:', error);
    Alert.alert('エラー', 'Apple Pay決済に失敗しました');
  };

  const handleApplePayCancel = () => {
    console.log('Apple Pay決済がキャンセルされました');
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
            onPress={() => navigation.navigate('Cart' as never)}
          >
            <Feather name="shopping-cart" size={24} color="#1A202C" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product images */}
        <View style={styles.imageGallery}>
          <Image
            source={{ uri: product.image_url }}
            style={styles.productImage}
            contentFit="cover"
          />
        </View>

        {/* Product info */}
        <View style={styles.productInfo}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {new Intl.NumberFormat('ja-JP', {
                style: 'currency',
                currency: product.currency,
                minimumFractionDigits: 0,
              }).format(product.price)}
            </Text>
          </View>

          <Text style={styles.productName}>{product.title}</Text>

          {product.seller && (
            <TouchableOpacity 
              style={styles.sellerRow}
              onPress={() => navigation.navigate('Profile', { userId: product.seller!.id })}
            >
              <Avatar
                source={product.seller.profile_image_url}
                size={32}
                style={styles.sellerAvatar}
              />
              <Text style={styles.sellerLabel}>出品者:</Text>
              <Text style={styles.sellerName}>{product.seller.display_name}</Text>
              <Feather name="chevron-right" size={16} color="#718096" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quantity selector */}
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>数量:</Text>
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

          <Text style={styles.stockText}>在庫: {product.stock}個</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>商品説明</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.actionBarContainer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>合計</Text>
          <Text style={styles.totalPrice}>
            {new Intl.NumberFormat('ja-JP', {
              style: 'currency',
              currency: product.currency,
              minimumFractionDigits: 0,
            }).format(product.price * quantity)}
          </Text>
        </View>

        {/* Apple Pay Button */}
        <ApplePayButton
          amount={product.price * quantity}
          currency={product.currency}
          label={product.title}
          onPaymentStart={handleApplePayStart}
          onPaymentSuccess={handleApplePaySuccess}
          onPaymentError={handleApplePayError}
          onPaymentCancel={handleApplePayCancel}
          disabled={product.stock === 0}
          style={styles.applePayButton}
        />

        <TouchableOpacity 
          style={[styles.addToCartButton, product.stock === 0 && styles.addToCartButtonDisabled]} 
          onPress={addToCart}
          disabled={product.stock === 0}
        >
          <Feather name="shopping-cart" size={20} color="#FFFFFF" />
          <Text style={styles.addToCartText}>
            {product.stock === 0 ? '在庫切れ' : 'カートに追加'}
          </Text>
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
  actionBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  totalContainer: {
    marginBottom: 16,
  },
  applePayButton: {
    marginBottom: 8,
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
    paddingVertical: 16,
    borderRadius: 8,
    width: '100%',
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#718096',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#E53E3E',
  },
  sellerAvatar: {
    marginRight: 8,
  },
});
