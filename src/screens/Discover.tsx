import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Bell, MessageCircle, Settings } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../components/ui/Card';
import { FooterNav } from '../components/FooterNav';
import { searchService } from '../lib/searchService';
import { searchHistoryService, type SearchHistoryItem } from '../lib/searchHistoryService';
import EventCard from '../components/events/EventCard';
import { Post } from '../components/post/Post';
import ProductCard from '../components/shop/ProductCard';
import { Avatar } from '../components/ui/Avatar';
import { useToast } from '../hooks/use-toast';

type SearchTab = 'all' | 'users' | 'posts' | 'hashtags' | 'events' | 'products';

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
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [recommendedPosts, setRecommendedPosts] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'posts' | 'users' | 'events' | 'items' | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSearchHistory();
    loadSuggestedUsers();
    loadRecommendedPosts();
  }, []);

  const loadSearchHistory = async () => {
    const history = await searchHistoryService.getSearchHistory();
    setSearchHistory(history);
  };

  const loadSuggestedUsers = async () => {
    const users = await searchHistoryService.getSuggestedUsers();
    setSuggestedUsers(users);
  };

  const loadRecommendedPosts = async () => {
    try {
      const posts = await searchService.getRecommendedPosts();
      setRecommendedPosts(posts);
    } catch (error) {
      console.error('Failed to load recommended posts:', error);
    }
  };

  const performSearch = useCallback(async (query: string, tab: SearchTab = activeTab) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setLoading(true);
    try {
      // Simulate delay for mock
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock search results
      const mockResults = {
        users: [
          { id: '1', name: '山田太郎', username: 'yamada_taro', avatar_url: 'https://i.pravatar.cc/150?img=1', bio: 'スピリチュアルヒーラー' },
          { id: '2', name: '佐藤花子', username: 'sato_hanako', avatar_url: 'https://i.pravatar.cc/150?img=2', bio: '瞑想インストラクター' },
          { id: '3', name: '鈴木一郎', username: 'suzuki_ichiro', avatar_url: 'https://i.pravatar.cc/150?img=3', bio: 'ヨガマスター' },
        ],
        posts: [
          {
            id: 'p1',
            author_id: '1',
            content: `${query}についての瞑想法を紹介します。毎朝10分の瞑想で心が整います。`,
            media_type: 'text',
            created_at: new Date().toISOString(),
            profiles: { name: '山田太郎', avatar_url: 'https://i.pravatar.cc/150?img=1' }
          },
          {
            id: 'p2',
            author_id: '2',
            content: `${query}のエネルギーを感じながら、今日も一日を大切に過ごしていきます✨`,
            media_type: 'text',
            created_at: new Date().toISOString(),
            profiles: { name: '佐藤花子', avatar_url: 'https://i.pravatar.cc/150?img=2' }
          },
          {
            id: 'p3',
            author_id: '3',
            content: `朝ヨガで${query}を意識しながら深呼吸。心身ともにリフレッシュできました🧘‍♂️`,
            media_type: 'text',
            created_at: new Date().toISOString(),
            profiles: { name: '鈴木一郎', avatar_url: 'https://i.pravatar.cc/150?img=3' }
          },
        ],
        hashtags: [
          { id: 'h1', name: query, post_count: 156 },
          { id: 'h2', name: `${query}ヒーリング`, post_count: 89 },
          { id: 'h3', name: `${query}瞑想`, post_count: 234 },
        ],
      };

      if (tab === 'all') {
        setSearchResults(mockResults);
      } else {
        setSearchResults({
          users: tab === 'users' ? mockResults.users : [],
          posts: tab === 'posts' ? mockResults.posts : [],
          hashtags: tab === 'hashtags' ? mockResults.hashtags : [],
        });
      }

      // Add to search history
      await searchHistoryService.addSearchHistory(query, tab);
      loadSearchHistory();
    } catch (error) {
      toast({
        title: '検索に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, toast]);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
      setIsFocused(false);
    }
  };

  const handleHistoryItemPress = (item: SearchHistoryItem) => {
    setSearchQuery(item.query);
    setActiveTab(item.type);
    performSearch(item.query, item.type);
    setIsFocused(false);
  };

  const handleRemoveHistoryItem = async (id: string) => {
    await searchHistoryService.removeSearchHistoryItem(id);
    loadSearchHistory();
  };

  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    if (searchQuery.trim()) {
      performSearch(searchQuery, tab);
    }
  };

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

      <View style={styles.searchSection}>
        <View style={styles.searchBarContainer}>
          <Feather name="search" size={20} color="#65676B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Kanushiを検索"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <MaterialIcons name="close" size={20} color="#65676B" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleSearchSubmit}
            style={[styles.searchButton, !searchQuery.trim() && styles.searchButtonDisabled]}
            disabled={!searchQuery.trim() || loading}
          >
            <Text style={[styles.searchButtonText, !searchQuery.trim() && styles.searchButtonTextDisabled]}>
              検索
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {!isFocused && searchResults && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {(['all', 'users', 'posts', 'hashtags', 'events', 'products'] as SearchTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => handleTabChange(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'all' && 'すべて'}
                {tab === 'users' && 'ユーザー'}
                {tab === 'posts' && '投稿'}
                {tab === 'hashtags' && 'ハッシュタグ'}
                {tab === 'events' && 'イベント'}
                {tab === 'products' && 'ショップ'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Show loading state when searching */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1877F2" />
            <Text style={styles.loadingText}>検索中...</Text>
          </View>
        )}

        {/* Show search history when focused */}
        {isFocused && !searchQuery.trim() && !loading && (
          <View style={styles.historyContainer}>
            {searchHistory.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>最近</Text>
                  <TouchableOpacity onPress={loadSearchHistory}>
                    <Text style={styles.seeAllText}>すべて見る</Text>
                  </TouchableOpacity>
                </View>
                {searchHistory.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.historyItem}
                    onPress={() => handleHistoryItemPress(item)}
                  >
                    <View style={styles.historyIcon}>
                      <MaterialIcons name="history" size={20} color="#65676B" />
                    </View>
                    <Text style={styles.historyText}>{item.query}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveHistoryItem(item.id)}
                      style={styles.removeButton}
                    >
                      <MaterialIcons name="close" size={18} color="#65676B" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {suggestedUsers.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>知り合いかも</Text>
                  <TouchableOpacity onPress={loadSuggestedUsers}>
                    <Text style={styles.seeAllText}>すべて見る</Text>
                  </TouchableOpacity>
                </View>
                {suggestedUsers.map((user) => (
                  <TouchableOpacity key={user.id} style={styles.userItem}>
                    <Avatar
                      source={user.avatar_url || 'https://via.placeholder.com/40'}
                      size={40}
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name || user.username}</Text>
                      <Text style={styles.userUsername}>@{user.username}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        )}

        {/* Show search results when searching */}
        {searchResults && !isFocused && !loading && (
          <View style={styles.resultsContainer}>
            {(activeTab === 'all' || activeTab === 'users') && searchResults.users?.length > 0 && (
              <View style={styles.resultSection}>
                {activeTab === 'all' && (
                  <Text style={styles.resultSectionTitle}>ユーザー</Text>
                )}
                {searchResults.users.map((user: any) => (
                  <View key={user.id} style={styles.userItem}>
                    <Avatar
                      source={user.avatar_url || 'https://via.placeholder.com/40'}
                      size={40}
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name || user.username}</Text>
                      <Text style={styles.userUsername}>@{user.username}</Text>
                      {user.bio && <Text style={styles.userBio}>{user.bio}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {(activeTab === 'all' || activeTab === 'posts') && searchResults.posts?.length > 0 && (
              <View style={styles.resultSection}>
                {activeTab === 'all' && (
                  <Text style={styles.resultSectionTitle}>投稿</Text>
                )}
                {searchResults.posts.map((post: any) => (
                  <Post
                    key={post.id}
                    author={{
                      id: post.author_id,
                      name: post.profiles?.name || 'ユーザー',
                      image: post.profiles?.avatar_url || '',
                    }}
                    content={post.content}
                    caption={post.content}
                    mediaType={post.media_type || 'text'}
                    postId={post.id}
                    tags={[]}
                  />
                ))}
              </View>
            )}

            {(activeTab === 'all' || activeTab === 'hashtags') && searchResults.hashtags?.length > 0 && (
              <View style={styles.resultSection}>
                {activeTab === 'all' && (
                  <Text style={styles.resultSectionTitle}>ハッシュタグ</Text>
                )}
                {searchResults.hashtags.map((tag: any) => (
                  <TouchableOpacity key={tag.id} style={styles.hashtagItem}>
                    <View style={styles.hashtagIcon}>
                      <Text style={styles.hashtagIconText}>#</Text>
                    </View>
                    <View style={styles.hashtagInfo}>
                      <Text style={styles.hashtagName}>{tag.name}</Text>
                      <Text style={styles.hashtagCount}>{tag.post_count || 0} 件の投稿</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {!searchResults.users?.length && !searchResults.posts?.length && !searchResults.hashtags?.length && (
              <View style={styles.emptyState}>
                <Feather name="search" size={48} color="#65676B" />
                <Text style={styles.emptyStateTitle}>検索結果がありません</Text>
                <Text style={styles.emptyStateText}>
                  別のキーワードで検索してみてください
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Show discover content when not searching */}
        {!searchResults && !isFocused && !loading && (
          <>
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
          </>
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
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
    backgroundColor: '#FFFFFF',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#050505',
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1877F2',
  },
  searchButtonDisabled: {
    backgroundColor: '#E4E6EB',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchButtonTextDisabled: {
    color: '#65676B',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
    backgroundColor: '#FFFFFF',
  },
  tabsContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1877F2',
  },
  tabText: {
    fontSize: 14,
    color: '#65676B',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1877F2',
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
  historyContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E4E6EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyText: {
    flex: 1,
    fontSize: 15,
    color: '#050505',
  },
  removeButton: {
    padding: 4,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#050505',
  },
  userUsername: {
    fontSize: 13,
    color: '#65676B',
    marginTop: 2,
  },
  resultsContainer: {
    flex: 1,
  },
  resultSection: {
    marginBottom: 16,
  },
  resultSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#050505',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  hashtagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  hashtagIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E4E6EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hashtagIconText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#65676B',
  },
  hashtagInfo: {
    flex: 1,
  },
  hashtagName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#050505',
  },
  hashtagCount: {
    fontSize: 13,
    color: '#65676B',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#050505',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#65676B',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    color: '#65676B',
    marginTop: 12,
  },
});
