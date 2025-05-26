import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState, useEffect } from 'react';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Bell, MessageCircle, Settings } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../components/ui/Card';
import { FooterNav } from '../components/FooterNav';
import { searchService } from '../lib/searchService';

// Sample data for the discover page
const REGIONS = [
  { id: '1', name: '北海道', image: 'https://picsum.photos/400/200?random=10', count: 245 },
  { id: '2', name: '東北', image: 'https://picsum.photos/400/200?random=11', count: 182 },
  { id: '3', name: '関東', image: 'https://picsum.photos/400/200?random=12', count: 156 },
  { id: '4', name: '中部', image: 'https://picsum.photos/400/200?random=13', count: 134 },
  { id: '5', name: '関西', image: 'https://picsum.photos/400/200?random=14', count: 98 },
  { id: '6', name: '中国', image: 'https://picsum.photos/400/200?random=15', count: 87 },
  { id: '7', name: '四国', image: 'https://picsum.photos/400/200?random=16', count: 76 },
  { id: '8', name: '九州・沖縄', image: 'https://picsum.photos/400/200?random=17', count: 65 },
];

const SEARCH_FILTERS = [
  { id: 'posts', name: '投稿', icon: 'edit' },
  { id: 'users', name: 'ユーザー', icon: 'user' },
  { id: 'events', name: 'イベント', icon: 'calendar' },
  { id: 'items', name: 'アイテム', icon: 'shopping-bag' },
];

const TRENDING_POSTS = [
  {
    id: '1',
    user: {
      id: 'user1',
      name: 'Sakura Restaurant',
      username: 'sakura_tokyo',
      avatarUrl: 'https://i.pravatar.cc/150?img=10',
    },
    content: 'Our new seasonal menu is now available! 🍜 #japanesefood #tokyo',
    images: ['https://picsum.photos/500/300?random=20'],
    createdAt: '2023-05-10T09:24:00Z',
    likes: 89,
    comments: 14,
  },
  {
    id: '2',
    user: {
      id: 'user2',
      name: 'Osaka Tourism',
      username: 'visit_osaka',
      avatarUrl: 'https://i.pravatar.cc/150?img=11',
    },
    content: 'Explore the vibrant streets of Dotonbori! #osaka #travel',
    images: ['https://picsum.photos/500/300?random=21'],
    createdAt: '2023-05-09T18:30:00Z',
    likes: 122,
    comments: 27,
  },
  {
    id: '3',
    user: {
      id: 'user3',
      name: 'Kyoto Temples',
      username: 'kyoto_temples',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
    },
    content: 'Morning light at Kinkaku-ji Temple 🌞 #kyoto #goldtemple',
    images: ['https://picsum.photos/500/300?random=22'],
    createdAt: '2023-05-08T06:15:00Z',
    likes: 211,
    comments: 35,
  },
];

const { width } = Dimensions.get('window');
const regionCardWidth = width * 0.7;

export default function Discover() {
  const [selectedFilter, setSelectedFilter] = useState<'posts' | 'users' | 'events' | 'items' | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigation = useNavigation<any>();

  // フィルター選択時に検索を実行
  useEffect(() => {
    if (selectedFilter) {
      handleFilterSearch();
    }
  }, [selectedFilter]);

  const handleFilterSearch = async () => {
    if (!selectedFilter) return;
    
    setIsSearching(true);
    try {
      const results = await searchService.getDiscoverContent(selectedFilter);
      setSearchResults(results);
    } catch (error) {
      console.error('Filter search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>発見</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Bell size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Messages')}>
              <MessageCircle size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Settings')}>
              <Settings size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Regions section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>地域別ヒットチャート</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>すべて見る</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            horizontal
            data={REGIONS}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.regionCard}
                onPress={() => navigation.navigate('RegionDetail', { regionName: item.name })}
              >
                <Image source={{ uri: item.image }} style={styles.regionImage} contentFit="cover" />
                <View style={styles.regionInfo}>
                  <Text style={styles.regionName}>{item.name}</Text>
                  <Text style={styles.regionCount}>{item.count} 件の投稿</Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.regionList}
            snapToInterval={regionCardWidth + 15}
            decelerationRate="fast"
          />
        </View>

        {/* Search Filters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>カテゴリで探す</Text>
          <View style={styles.categoriesContainer}>
            {SEARCH_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.categoryButton,
                  selectedFilter === filter.id && styles.categoryButtonSelected,
                ]}
                onPress={() =>
                  setSelectedFilter(selectedFilter === filter.id ? null : filter.id as any)
                }
              >
                <Feather
                  name={filter.icon as any}
                  size={16}
                  color={selectedFilter === filter.id ? '#FFFFFF' : '#4A5568'}
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedFilter === filter.id && styles.categoryTextSelected,
                  ]}
                >
                  {filter.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search Results */}
        {selectedFilter && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {SEARCH_FILTERS.find(f => f.id === selectedFilter)?.name}の検索結果
              </Text>
              <TouchableOpacity onPress={() => setSelectedFilter(null)}>
                <Text style={styles.seeAllText}>クリア</Text>
              </TouchableOpacity>
            </View>

            {isSearching ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>検索中...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <View>
                {selectedFilter === 'posts' && searchResults.map((post) => (
                  <Card key={post.id} style={styles.postCard}>
                    <View style={styles.postHeader}>
                      <Image 
                        source={{ uri: post.profiles?.avatar_url || 'https://i.pravatar.cc/150' }} 
                        style={styles.postAvatar} 
                      />
                      <View>
                        <Text style={styles.postUserName}>{post.profiles?.name || '匿名ユーザー'}</Text>
                        <Text style={styles.postUsername}>@{post.profiles?.username || 'anonymous'}</Text>
                      </View>
                    </View>
                    <Text style={styles.postContent} numberOfLines={2}>
                      {post.content}
                    </Text>
                    {post.media_url && (
                      <Image source={{ uri: post.media_url }} style={styles.postImage} contentFit="cover" />
                    )}
                  </Card>
                ))}
                
                {selectedFilter === 'users' && searchResults.map((user) => (
                  <Card key={user.id} style={styles.postCard}>
                    <View style={styles.postHeader}>
                      <Image 
                        source={{ uri: user.avatar_url || 'https://i.pravatar.cc/150' }} 
                        style={styles.postAvatar} 
                      />
                      <View>
                        <Text style={styles.postUserName}>{user.name || '匿名ユーザー'}</Text>
                        <Text style={styles.postUsername}>@{user.username || 'anonymous'}</Text>
                        {user.bio && <Text style={styles.userBio}>{user.bio}</Text>}
                      </View>
                    </View>
                  </Card>
                ))}

                {(selectedFilter === 'events' || selectedFilter === 'items') && (
                  <View style={styles.comingSoonContainer}>
                    <Text style={styles.comingSoonText}>この機能は近日公開予定です</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>結果が見つかりませんでした</Text>
              </View>
            )}
          </View>
        )}

        {/* Trending posts - show only when no filter is selected */}
        {!selectedFilter && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>トレンド</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>すべて見る</Text>
              </TouchableOpacity>
            </View>

            {TRENDING_POSTS.map((post) => (
              <Card key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Image source={{ uri: post.user.avatarUrl }} style={styles.postAvatar} />
                  <View>
                    <Text style={styles.postUserName}>{post.user.name}</Text>
                    <Text style={styles.postUsername}>@{post.user.username}</Text>
                  </View>
                </View>

                <Text style={styles.postContent} numberOfLines={2}>
                  {post.content}
                </Text>

                <Image source={{ uri: post.images[0] }} style={styles.postImage} contentFit="cover" />

                <View style={styles.postStats}>
                  <View style={styles.postStat}>
                    <Feather name="heart" size={16} color="#4A5568" />
                    <Text style={styles.postStatText}>{post.likes}</Text>
                  </View>
                  <View style={styles.postStat}>
                    <Feather name="message-circle" size={16} color="#4A5568" />
                    <Text style={styles.postStatText}>{post.comments}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
      
      <FooterNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.05)',
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
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
  regionList: {
    paddingLeft: 16,
    paddingRight: 6,
  },
  regionCard: {
    width: regionCardWidth,
    height: 160,
    marginRight: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  regionImage: {
    width: '100%',
    height: '100%',
  },
  regionInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  regionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  regionCount: {
    fontSize: 12,
    color: '#E2E8F0',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  categoryButtonSelected: {
    backgroundColor: '#0070F3',
  },
  categoryText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 6,
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  postCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  postUsername: {
    fontSize: 14,
    color: '#718096',
  },
  postContent: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  postStatText: {
    fontSize: 14,
    color: '#718096',
    marginLeft: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#718096',
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#718096',
  },
  comingSoonContainer: {
    padding: 20,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    color: '#718096',
    fontStyle: 'italic',
  },
  userBio: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 4,
  },
});
