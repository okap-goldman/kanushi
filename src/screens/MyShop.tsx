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

function getStatusText(status: string) {
  switch (status) {
    case 'pending': return '支払い待ち';
    case 'paid': return '支払い済み';
    case 'shipped': return '発送済み';
    case 'delivered': return '配達済み';
    case 'refunded': return '返金済み';
    default: return status;
  }
}

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
  // Modal styles
  modalContent: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  editButton: {
    padding: 8,
  },
  productDetailContainer: {
    padding: 16,
  },
  productDetailImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 16,
  },
  productInfo: {
    marginBottom: 24,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0070F3',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 12,
  },
  productDescription: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  productStats: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
  },
  editButtonFull: {
    marginBottom: 12,
  },
  deleteButtonFull: {
    backgroundColor: '#E53E3E',
  },
  // Order Detail Modal styles
  orderDetailContainer: {
    padding: 16,
  },
  orderSummary: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderProductImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  orderQuantity: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  buyerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0070F3',
  },
  trackingInfo: {
    fontSize: 14,
    color: '#1A202C',
    marginBottom: 4,
  },
  carrierInfo: {
    fontSize: 14,
    color: '#718096',
  },
  shippingForm: {
    marginTop: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  statusButton: {
    marginTop: 8,
  },
  refundButton: {
    backgroundColor: '#E53E3E',
  },
  orderActions: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
});

// Product Detail Modal Component
function ProductDetailModal({ product, onClose, onEdit, onDelete }: {
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  if (!product) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Feather name="x" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.title}>商品詳細</Text>
        <TouchableOpacity style={styles.editButton} onPress={() => onEdit(product)}>
          <Feather name="edit-2" size={20} color="#0070F3" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalContent}>
        <View style={styles.productDetailContainer}>
          <Image
            source={{ uri: product.image_url }}
            style={styles.productDetailImage}
            contentFit="cover"
          />
          
          <View style={styles.productInfo}>
            <Text style={styles.productTitle}>{product.title}</Text>
            <Text style={styles.productPrice}>¥{product.price.toLocaleString()}</Text>
            <Text style={styles.productStock}>在庫: {product.stock}個</Text>
            <Text style={styles.productDescription}>{product.description}</Text>
          </View>

          <View style={styles.productStats}>
            <Text style={styles.sectionTitle}>販売状況</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>総販売数:</Text>
              <Text style={styles.statValue}>8個</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>総売上:</Text>
              <Text style={styles.statValue}>¥{(product.price * 8).toLocaleString()}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>今月の売上:</Text>
              <Text style={styles.statValue}>¥{(product.price * 3).toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.productActions}>
            <Button
              onPress={() => onEdit(product)}
              style={styles.editButtonFull}
            >
              商品を編集
            </Button>
            <Button
              onPress={() => onDelete(product)}
              style={[styles.editButtonFull, styles.deleteButtonFull]}
            >
              商品を削除
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Order Detail Modal Component
function OrderDetailModal({ order, onClose, onUpdateStatus }: {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string, trackingInfo?: any) => void;
}) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('Japan Post');

  if (!order) return null;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '支払い待ち';
      case 'paid': return '支払い済み';
      case 'shipped': return '発送済み';
      case 'delivered': return '配達済み';
      case 'refunded': return '返金済み';
      default: return status;
    }
  };

  const handleStatusUpdate = (status: string) => {
    if (status === 'shipped') {
      if (!trackingNumber.trim()) {
        Alert.alert('エラー', '追跡番号を入力してください');
        return;
      }
      onUpdateStatus(order.id, status, {
        tracking_number: trackingNumber,
        shipping_carrier: shippingCarrier
      });
    } else {
      onUpdateStatus(order.id, status);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Feather name="x" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.title}>注文詳細</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.modalContent}>
        <View style={styles.orderDetailContainer}>
          <View style={styles.orderSummary}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>注文 #{order.id}</Text>
              <Text style={styles.orderStatus}>{getStatusText(order.status)}</Text>
            </View>
            <Text style={styles.orderDate}>
              {new Date(order.created_at).toLocaleDateString('ja-JP')}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>商品情報</Text>
            <View style={styles.productRow}>
              <Image
                source={{ uri: order.product?.image_url }}
                style={styles.orderProductImage}
                contentFit="cover"
              />
              <View style={styles.productInfo}>
                <Text style={styles.productTitle}>{order.product?.title}</Text>
                <Text style={styles.productPrice}>¥{order.product?.price.toLocaleString()}</Text>
                <Text style={styles.orderQuantity}>数量: {order.quantity || 1}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>購入者情報</Text>
            <Text style={styles.buyerName}>{order.buyer?.display_name}</Text>
            <Text style={styles.totalAmount}>合計: ¥{order.amount.toLocaleString()}</Text>
          </View>

          {order.tracking_number && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>配送情報</Text>
              <Text style={styles.trackingInfo}>追跡番号: {order.tracking_number}</Text>
              <Text style={styles.carrierInfo}>配送業者: {order.shipping_carrier}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ステータス管理</Text>
            
            {order.status === 'paid' && (
              <View style={styles.shippingForm}>
                <Text style={styles.formLabel}>追跡番号</Text>
                <TextInput
                  style={styles.input}
                  value={trackingNumber}
                  onChangeText={setTrackingNumber}
                  placeholder="追跡番号を入力"
                />
                <Text style={styles.formLabel}>配送業者</Text>
                <TextInput
                  style={styles.input}
                  value={shippingCarrier}
                  onChangeText={setShippingCarrier}
                  placeholder="配送業者"
                />
                <Button
                  onPress={() => handleStatusUpdate('shipped')}
                  style={styles.statusButton}
                >
                  発送完了
                </Button>
              </View>
            )}

            {order.status === 'shipped' && (
              <Button
                onPress={() => handleStatusUpdate('delivered')}
                style={styles.statusButton}
              >
                配達完了
              </Button>
            )}

            {(order.status === 'paid' || order.status === 'shipped') && (
              <Button
                onPress={() => handleStatusUpdate('refunded')}
                style={[styles.statusButton, styles.refundButton]}
              >
                返金処理
              </Button>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}