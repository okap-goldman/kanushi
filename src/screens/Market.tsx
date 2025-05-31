import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Bell, Check, Heart, Search } from 'lucide-react-native';
import Avatar from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
import { ecService, type Product } from '../lib/ecService';
import { followService } from '../lib/followService';
import { type Profile } from '../lib/db/schema';
import { theme } from '../lib/theme';

interface ProductGridItemProps {
  product: Product;
  onPress: () => void;
}

const ProductGridItem: React.FC<ProductGridItemProps> = ({ product, onPress }) => {
  const formatPrice = (price: number) => {
    return `¥ ${price.toLocaleString()}`;
  };

  return (
    <TouchableOpacity style={styles.gridItem} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: product.image_url }} style={styles.gridImage} />
      <View style={styles.priceTag}>
        <Text style={styles.priceText}>{formatPrice(product.price)}</Text>
      </View>
    </TouchableOpacity>
  );
};


const Market: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [followedUsers, setFollowedUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 商品一覧を取得
      const response = await ecService.getProducts();
      if (response.success && response.data) {
        setProducts(response.data);
      }

      // 最近閲覧した商品（モック）
      if (response.success && response.data) {
        setRecentlyViewed(response.data.slice(0, 6));
      }

      // フォローしているユーザーを取得
      if (user) {
        const followResponse = await followService.getFollowing(user.id);
        if (followResponse.success && followResponse.data) {
          setFollowedUsers(followResponse.data.slice(0, 10));
        }
      }
    } catch (error) {
      console.error('Failed to load market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const handleSearch = () => {
    navigation.navigate('Search', { initialQuery: searchQuery, type: 'products' });
  };


  const renderContent = () => {
    return (
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* あなたの興味のある商品 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>あなたの興味のある商品</Text>
          
          {/* 最近閲覧した商品 */}
          <View style={styles.recentlyViewedSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.subSectionTitle}>最近閲覧した商品</Text>
              <TouchableOpacity>
                <Text style={styles.seeMoreText}>すべて見る ›</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.horizontalList}>
                {recentlyViewed.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.recentItem}
                    onPress={() => handleProductPress(product.id)}
                  >
                    <Image source={{ uri: product.image_url }} style={styles.recentImage} />
                    <View style={styles.recentPriceTag}>
                      <Text style={styles.recentPrice}>¥ {product.price.toLocaleString()}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* フォロー中のユーザー */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>フォロー中のユーザー</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.userList}>
              {followedUsers.map((profile) => (
                <TouchableOpacity
                  key={profile.id}
                  style={styles.userItem}
                  onPress={() => navigation.navigate('Profile', { userId: profile.id })}
                >
                  <Avatar
                    source={{ uri: profile.profile_image_url }}
                    size={56}
                    style={styles.userAvatar}
                  />
                  <Text style={styles.userName} numberOfLines={1}>
                    {profile.display_name}
                  </Text>
                  <Text style={styles.userInfo}>出品数: {profile.product_count || 3}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 商品一覧 */}
        <View style={styles.productsGridSection}>
          <Text style={styles.sectionTitle}>新着商品</Text>
          <View style={styles.productsGrid}>
            {products.slice(0, 9).map((product) => (
              <ProductGridItem
                key={product.id}
                product={product}
                onPress={() => handleProductPress(product.id)}
              />
            ))}
          </View>
          
          {/* もっと見るボタン */}
          <TouchableOpacity 
            style={styles.seeMoreButton}
            onPress={() => navigation.navigate('Shop')}
          >
            <Text style={styles.seeMoreButtonText}>もっと見る</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search color={theme.colors.text.muted} size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="買いたい、売りたいものを探す"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.headerIcon}>
          <Bell color={theme.colors.text.primary} size={24} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerIcon}
          onPress={() => navigation.navigate('Cart')}
        >
          <Check color={theme.colors.text.primary} size={24} />
        </TouchableOpacity>
      </View>

      {/* コンテンツ */}
      {renderContent()}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  headerIcon: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: theme.colors.background.primary,
    marginBottom: 8,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  recentlyViewedSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  seeMoreText: {
    fontSize: 14,
    color: theme.colors.secondary.main,
  },
  horizontalList: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  recentItem: {
    marginRight: 8,
    position: 'relative',
  },
  recentImage: {
    width: 120,
    height: 120,
    borderRadius: 4,
  },
  recentPriceTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  recentPrice: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  userList: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  userItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  userAvatar: {
    marginBottom: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  productsGridSection: {
    backgroundColor: theme.colors.background.primary,
    paddingVertical: 16,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  gridItem: {
    width: '31%',
    aspectRatio: 1,
    marginHorizontal: '1.16%',
    marginBottom: 8,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  priceTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  priceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  seeMoreButton: {
    backgroundColor: theme.colors.primary.main,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  seeMoreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Market;