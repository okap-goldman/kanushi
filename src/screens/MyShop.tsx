import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  RefreshControl,
} from 'react-native';
import { Product, ecService } from '../lib/ecService';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/shop/ProductCard';
import { Button } from '../components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Order } from '../lib/ecService';

export default function MyShop() {
  const [selectedTab, setSelectedTab] = useState('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const fetchMyProducts = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const result = await ecService.getProducts({ seller_id: user.id });
      if (result.success && result.data) {
        setProducts(result.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('エラー', '商品の取得に失敗しました');
    }
  }, [user?.id]);

  const fetchMyOrders = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const result = await ecService.getOrders(user.id, { as_seller: true });
      setOrders(result.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('エラー', '注文の取得に失敗しました');
    }
  }, [user?.id]);

  const loadData = useCallback(async () => {
    setLoading(true);
    if (selectedTab === 'products') {
      await fetchMyProducts();
    } else if (selectedTab === 'orders') {
      await fetchMyOrders();
    }
    setLoading(false);
  }, [selectedTab, fetchMyProducts, fetchMyOrders]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleCreateProduct = () => {
    navigation.navigate('CreateProduct');
  };

  const handleEditProduct = (product: Product) => {
    navigation.navigate('EditProduct', { productId: product.id, product });
  };

  const handleDeleteProduct = async (product: Product) => {
    Alert.alert(
      '商品を削除',
      `「${product.title}」を削除してもよろしいですか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user?.id) return;
              await ecService.deleteProduct(user.id, product.id);
              Alert.alert('成功', '商品を削除しました');
              await fetchMyProducts();
            } catch (error) {
              Alert.alert('エラー', '商品の削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productItem}>
      <ProductCard product={item} />
      <View style={styles.productActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditProduct(item)}
        >
          <Feather name="edit-2" size={20} color="#0070F3" />
          <Text style={styles.actionButtonText}>編集</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteProduct(item)}
        >
          <Feather name="trash-2" size={20} color="#E53E3E" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>削除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderDate}>
          {new Date(item.created_at).toLocaleDateString('ja-JP')}
        </Text>
        <Text style={styles.orderStatus}>{getStatusText(item.status)}</Text>
      </View>
      <Text style={styles.orderProduct} numberOfLines={1}>
        {item.product?.title || '商品名不明'}
      </Text>
      <View style={styles.orderFooter}>
        <Text style={styles.orderBuyer}>
          購入者: {item.buyer?.display_name || '不明'}
        </Text>
        <Text style={styles.orderAmount}>
          ¥{item.amount.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '支払い待ち';
      case 'paid': return '支払い済み';
      case 'shipped': return '発送済み';
      case 'refunded': return '返金済み';
      default: return status;
    }
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      {selectedTab === 'products' ? (
        <>
          <Feather name="package" size={64} color="#CBD5E0" />
          <Text style={styles.emptyTitle}>まだ商品を出品していません</Text>
          <Text style={styles.emptyDescription}>
            最初の商品を出品してみましょう
          </Text>
          <Button
            onPress={handleCreateProduct}
            style={styles.emptyButton}
          >
            商品を出品する
          </Button>
        </>
      ) : (
        <>
          <Feather name="shopping-bag" size={64} color="#CBD5E0" />
          <Text style={styles.emptyTitle}>注文はまだありません</Text>
          <Text style={styles.emptyDescription}>
            商品が購入されるとここに表示されます
          </Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.title}>マイショップ</Text>
        {selectedTab === 'products' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateProduct}
          >
            <Feather name="plus" size={24} color="#0070F3" />
          </TouchableOpacity>
        )}
      </View>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList style={styles.tabsList}>
          <TabsTrigger value="products" style={styles.tabTrigger}>
            <Feather name="package" size={20} />
            <Text style={styles.tabText}>出品した商品</Text>
          </TabsTrigger>
          <TabsTrigger value="orders" style={styles.tabTrigger}>
            <Feather name="shopping-bag" size={20} />
            <Text style={styles.tabText}>注文管理</Text>
          </TabsTrigger>
          <TabsTrigger value="sales" style={styles.tabTrigger}>
            <Feather name="trending-up" size={20} />
            <Text style={styles.tabText}>売上管理</Text>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" style={styles.tabContent}>
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyComponent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </TabsContent>

        <TabsContent value="orders" style={styles.tabContent}>
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyComponent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </TabsContent>

        <TabsContent value="sales" style={styles.tabContent}>
          <View style={styles.salesContainer}>
            <Text style={styles.salesTitle}>売上管理機能は準備中です</Text>
            <Text style={styles.salesDescription}>
              売上レポートや分析機能を提供予定です
            </Text>
          </View>
        </TabsContent>
      </Tabs>

      {selectedTab === 'products' && products.length > 0 && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={handleCreateProduct}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  addButton: {
    padding: 8,
  },
  tabsList: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  productItem: {
    margin: 16,
    marginBottom: 8,
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#EBF8FF',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0070F3',
  },
  deleteButtonText: {
    color: '#E53E3E',
  },
  orderItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 12,
    color: '#718096',
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0070F3',
  },
  orderProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderBuyer: {
    fontSize: 14,
    color: '#718096',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  salesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  salesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
  },
  salesDescription: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0070F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowColor: '#000',
  },
});