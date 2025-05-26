import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import EventCard from '../components/events/EventCard';
import { Post } from '../components/post/Post';
import ProductCard from '../components/shop/ProductCard';
import { Avatar } from '../components/ui/Avatar';
import { useToast } from '../hooks/use-toast';
import { searchHistoryService, type SearchHistoryItem } from '../lib/searchHistoryService';
import { searchService } from '../lib/searchService';

type SearchTab = 'all' | 'users' | 'posts' | 'hashtags' | 'events' | 'products';

export const Search = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [recommendedPosts, setRecommendedPosts] = useState<any[]>([]);
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
      if (tab === 'all') {
        const results = await searchService.search(query);
        setSearchResults(results);
      } else {
        const categoryMap = {
          users: 'users',
          posts: 'posts',
          hashtags: 'hashtags',
          events: 'posts', // Using posts for now as events might be in posts
          products: 'posts', // Using posts for now as products might be in posts
        };
        
        const category = categoryMap[tab] as 'users' | 'posts' | 'hashtags';
        const result = await searchService.searchByCategory(query, category);
        
        setSearchResults({
          [category]: result.data,
          users: category === 'users' ? result.data : [],
          posts: category === 'posts' ? result.data : [],
          hashtags: category === 'hashtags' ? result.data : [],
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


  const renderTabs = () => (
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
  );

  const renderSearchHistory = () => {
    if (!isFocused || searchQuery.trim()) return null;

    return (
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
    );
  };

  const renderSearchResults = () => {
    if (!searchResults || loading) return null;

    const hasResults = 
      (searchResults.users?.length > 0) ||
      (searchResults.posts?.length > 0) ||
      (searchResults.hashtags?.length > 0);

    if (!hasResults) {
      return (
        <View style={styles.emptyState}>
          <Feather name="search" size={48} color="#65676B" />
          <Text style={styles.emptyStateTitle}>検索結果がありません</Text>
          <Text style={styles.emptyStateText}>
            別のキーワードで検索してみてください
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.resultsContainer}>
        {activeTab === 'all' || activeTab === 'users' ? (
          searchResults.users?.length > 0 && (
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
                  </View>
                </View>
              ))}
            </View>
          )
        ) : null}

        {activeTab === 'all' || activeTab === 'posts' ? (
          searchResults.posts?.length > 0 && (
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
          )
        ) : null}

        {activeTab === 'all' || activeTab === 'hashtags' ? (
          searchResults.hashtags?.length > 0 && (
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
          )
        ) : null}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.searchBarContainer}>
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
        </View>
      </View>

      {!isFocused && searchResults && renderTabs()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1877F2" />
        </View>
      ) : (
        <>
          {renderSearchHistory()}
          {searchResults ? (
            renderSearchResults()
          ) : (
            !isFocused && recommendedPosts.length > 0 && (
              <ScrollView style={styles.resultsContainer}>
                <Text style={styles.resonanceTitle}>あなたに共鳴している投稿</Text>
                {recommendedPosts.map((post: any) => (
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
              </ScrollView>
            )
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
  },
  backButton: {
    marginRight: 12,
  },
  searchBarContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 36,
    justifyContent: 'center',
  },
  searchInput: {
    fontSize: 16,
    color: '#050505',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
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
  historyContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#050505',
  },
  seeAllText: {
    fontSize: 15,
    color: '#1877F2',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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
  resonanceTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#050505',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
});