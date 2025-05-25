import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  StyleSheet,
  FlatList,
  RefreshControl
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getProducts, Product } from '../../lib/ecService';
import ProductCard from './ProductCard';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface ProductListProps {
  sellerId?: string;
  initialSearch?: string;
}

const ProductList: React.FC<ProductListProps> = ({ sellerId, initialSearch = '' }) => {
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Price filter state
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['products', page, search, minPrice, maxPrice, sellerId],
    queryFn: () => getProducts({
      page,
      seller_id: sellerId,
      search: search || undefined,
      min_price: minPrice,
      max_price: maxPrice,
    }),
    keepPreviousData: true,
  });

  useEffect(() => {
    if (data) {
      if (page === 1) {
        setAllProducts(data.products);
      } else {
        setAllProducts(prev => [...prev, ...data.products]);
      }
      setNextPage(data.next_page);
    }
  }, [data, page]);

  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  const handleLoadMore = () => {
    if (nextPage && !isLoading) {
      setPage(nextPage);
    }
  };

  const handlePriceFilter = () => {
    setMinPrice(tempMinPrice ? Number(tempMinPrice) : undefined);
    setMaxPrice(tempMaxPrice ? Number(tempMaxPrice) : undefined);
    setPage(1);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setSearch('');
    setTempMinPrice('');
    setTempMaxPrice('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setPage(1);
    setShowFilters(false);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="商品名で検索"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>検索</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.filterToggle} 
        onPress={() => setShowFilters(!showFilters)}
      >
        <Text style={styles.filterToggleText}>詳細検索</Text>
      </TouchableOpacity>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.priceFilters}>
            <View style={styles.priceInputContainer}>
              <Text style={styles.label}>最低価格</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                value={tempMinPrice}
                onChangeText={setTempMinPrice}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.priceInputContainer}>
              <Text style={styles.label}>最高価格</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="100000"
                value={tempMaxPrice}
                onChangeText={setTempMaxPrice}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.filterButtons}>
            <TouchableOpacity 
              style={[styles.filterButton, styles.applyButton]} 
              onPress={handlePriceFilter}
            >
              <Text style={styles.applyButtonText}>価格で絞り込む</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, styles.resetButton]} 
              onPress={resetFilters}
            >
              <Text style={styles.resetButtonText}>リセット</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {(minPrice !== undefined || maxPrice !== undefined || search) && (
        <View style={styles.activeFilters}>
          <Text style={styles.activeFiltersLabel}>検索条件: </Text>
          {search && <Text style={styles.activeFilter}>「{search}」</Text>}
          {minPrice !== undefined && <Text style={styles.activeFilter}>最低価格: {minPrice}円</Text>}
          {maxPrice !== undefined && <Text style={styles.activeFilter}>最高価格: {maxPrice}円</Text>}
        </View>
      )}
    </View>
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productItem}>
      <ProductCard product={item} />
    </View>
  );

  const renderFooter = () => {
    if (isLoading && page > 1) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color="#3b82f6" />
        </View>
      );
    }

    if (nextPage && !isLoading) {
      return (
        <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
          <Text style={styles.loadMoreText}>もっと見る</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderEmpty = () => {
    if (isLoading && page === 1) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>商品が見つかりませんでした</Text>
      </View>
    );
  };

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          エラーが発生しました: {(error as Error).message}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={allProducts}
      renderItem={renderProduct}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching && page === 1}
          onRefresh={() => {
            setPage(1);
            refetch();
          }}
        />
      }
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  filterToggle: {
    alignSelf: 'flex-start',
  },
  filterToggleText: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  filtersContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  priceFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceInputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 4,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  applyButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  applyButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  resetButton: {
    backgroundColor: '#ffffff',
  },
  resetButtonText: {
    color: '#6b7280',
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  activeFiltersLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  activeFilter: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 8,
  },
  productItem: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadMoreButton: {
    marginVertical: 20,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#374151',
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
  },
});

export default ProductList;