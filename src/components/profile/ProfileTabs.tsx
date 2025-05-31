import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { mockConfig, mockDelay, mockPosts } from '../../lib/mockData';
import { mockProducts } from '../../lib/mockData/products';
import { getMockUserEvents } from '../../lib/mockData/events';

type Tab = 'posts' | 'highlights' | 'shop' | 'events';

interface ProfileTabsProps {
  userId: string;
  activeTab: Tab;
  onChangeTab: (tab: Tab) => void;
}

export function ProfileTabs({ userId, activeTab, onChangeTab }: ProfileTabsProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [shop, setShop] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    } else if (activeTab === 'highlights') {
      fetchHighlights();
    } else if (activeTab === 'shop') {
      fetchShop();
    } else if (activeTab === 'events') {
      fetchEvents();
    }
  }, [activeTab, userId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);

      // モックモードの場合
      if (mockConfig.enabled) {
        await mockDelay();
        
        // 指定されたuserIdの投稿をフィルタリング
        const userPosts = mockPosts
          .filter(post => post.user_id === userId)
          .map(post => ({
            id: post.id,
            user_id: post.user_id,
            content: post.content,
            text_content: post.content,
            content_type: post.audio_url ? 'audio' : post.image_urls?.length ? 'image' : post.video_url ? 'video' : 'text',
            media_url: post.image_urls?.[0] || post.video_url,
            audio_url: post.audio_url,
            audio_duration: post.audio_duration,
            thumbnail_url: post.image_urls?.[0] || 'https://picsum.photos/150',
            likes_count: post.likes_count,
            comments_count: post.comments_count,
            shares_count: post.shares_count,
            created_at: post.created_at,
            updated_at: post.updated_at
          }));
        
        setPosts(userPosts);
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setPosts(data);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHighlights = async () => {
    try {
      setLoading(true);

      // モックモードの場合
      if (mockConfig.enabled) {
        await mockDelay();
        
        // ハイライトされた投稿を取得（is_highlighted: trueの投稿）
        const highlightedPosts = mockPosts
          .filter(post => post.user_id === userId && post.is_highlighted)
          .map(post => ({
            id: `highlight-${post.id}`,
            user_id: userId,
            post_id: post.id,
            created_at: post.created_at,
            posts: {
              id: post.id,
              user_id: post.user_id,
              content: post.content,
              text_content: post.content,
              content_type: post.audio_url ? 'audio' : post.image_urls?.length ? 'image' : post.video_url ? 'video' : 'text',
              media_url: post.image_urls?.[0] || post.video_url,
              audio_url: post.audio_url,
              thumbnail_url: post.image_urls?.[0] || 'https://picsum.photos/150',
              created_at: post.created_at
            }
          }));
        
        setHighlights(highlightedPosts);
        return;
      }

      const { data, error } = await supabase
        .from('highlights')
        .select('*, posts!inner(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setHighlights(data);
      }
    } catch (err) {
      console.error('Error fetching highlights:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchShop = async () => {
    try {
      setLoading(true);

      // モックモードの場合
      if (mockConfig.enabled) {
        await mockDelay();
        
        // 指定されたuserIdが販売している商品を取得
        const userProducts = mockProducts
          .filter(product => product.seller_id === userId)
          .map(product => ({
            id: product.id,
            seller_id: product.seller_id,
            name: product.name,
            description: product.description,
            category: product.category,
            price: product.price,
            currency: product.currency,
            stock_quantity: product.stock_quantity,
            images: product.images,
            is_digital: product.is_digital,
            rating: product.rating,
            reviews_count: product.reviews_count,
            thumbnail_url: product.images[0] || 'https://picsum.photos/150',
            created_at: product.created_at
          }));
        
        setShop(userProducts);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setShop(data);
      }
    } catch (err) {
      console.error('Error fetching shop products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);

      // モックモードの場合
      if (mockConfig.enabled) {
        await mockDelay();
        
        // 指定されたuserIdが主催するイベントを取得
        const userEvents = getMockUserEvents(userId)
          .map(event => ({
            id: event.id,
            host_id: event.host_id,
            title: event.title,
            description: event.description,
            event_type: event.event_type,
            category: event.category,
            start_date: event.start_date,
            end_date: event.end_date,
            location: event.location,
            online_url: event.online_url,
            capacity: event.capacity,
            current_participants: event.current_participants,
            price: event.price,
            currency: event.currency,
            cover_image: event.cover_image,
            thumbnail_url: event.cover_image || 'https://picsum.photos/150',
            created_at: event.created_at
          }));
        
        setEvents(userEvents);
        return;
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('host_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setEvents(data);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      );
    }

    if (activeTab === 'posts' && posts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="image" size={48} color="#CBD5E0" />
          <Text style={styles.emptyText}>まだ投稿がありません</Text>
        </View>
      );
    }

    if (activeTab === 'highlights' && highlights.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="star" size={48} color="#CBD5E0" />
          <Text style={styles.emptyText}>まだハイライトがありません</Text>
        </View>
      );
    }

    if (activeTab === 'shop' && shop.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="shopping-bag" size={48} color="#CBD5E0" />
          <Text style={styles.emptyText}>まだ商品がありません</Text>
        </View>
      );
    }

    if (activeTab === 'events' && events.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="calendar" size={48} color="#CBD5E0" />
          <Text style={styles.emptyText}>まだイベントがありません</Text>
        </View>
      );
    }

    let data = [];
    if (activeTab === 'posts') {
      data = posts;
    } else if (activeTab === 'highlights') {
      data = highlights.map((h) => h.posts);
    } else if (activeTab === 'shop') {
      data = shop;
    } else if (activeTab === 'events') {
      data = events;
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.gridItem}>
            {activeTab === 'shop' ? (
              <View style={styles.gridItem}>
                <Image
                  source={{ uri: item.images?.[0] || item.thumbnail_url || 'https://picsum.photos/150' }}
                  style={styles.gridImage}
                  contentFit="cover"
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.productPrice}>
                    ¥{item.price?.toLocaleString()}
                  </Text>
                </View>
              </View>
            ) : activeTab === 'events' ? (
              <View style={styles.gridItem}>
                <Image
                  source={{ uri: item.cover_image || item.thumbnail_url || 'https://picsum.photos/150' }}
                  style={styles.gridImage}
                  contentFit="cover"
                />
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.eventPrice}>
                    ¥{item.price?.toLocaleString()}
                  </Text>
                </View>
              </View>
            ) : item.content_type === 'image' ? (
              <Image
                source={{ uri: item.media_url || item.thumbnail_url }}
                style={styles.gridImage}
                contentFit="cover"
              />
            ) : item.content_type === 'video' ? (
              <View style={styles.gridItem}>
                <Image
                  source={{ uri: item.thumbnail_url || 'https://picsum.photos/150' }}
                  style={styles.gridImage}
                  contentFit="cover"
                />
                <View style={styles.videoIndicator}>
                  <Feather name="play" size={16} color="#FFFFFF" />
                </View>
              </View>
            ) : item.content_type === 'audio' ? (
              <View style={styles.audioGridItem}>
                <Feather name="mic" size={24} color="#FFFFFF" />
                <Text style={styles.audioText} numberOfLines={2}>
                  {item.text_content || '音声'}
                </Text>
              </View>
            ) : (
              <View style={styles.textGridItem}>
                <Text style={styles.textContent} numberOfLines={4}>
                  {item.text_content}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => onChangeTab('posts')}
        >
          <Feather name="grid" size={20} color={activeTab === 'posts' ? '#10B981' : '#64748B'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'highlights' && styles.activeTab]}
          onPress={() => onChangeTab('highlights')}
        >
          <Feather
            name="star"
            size={20}
            color={activeTab === 'highlights' ? '#10B981' : '#64748B'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'shop' && styles.activeTab]}
          onPress={() => onChangeTab('shop')}
        >
          <Feather name="shopping-bag" size={20} color={activeTab === 'shop' ? '#10B981' : '#64748B'} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'events' && styles.activeTab]}
          onPress={() => onChangeTab('events')}
        >
          <Feather
            name="calendar"
            size={20}
            color={activeTab === 'events' ? '#10B981' : '#64748B'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContent}>{renderTabContent()}</View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const itemSize = width / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#10B981', // Emerald-500
  },
  tabContent: {
    flex: 1,
  },
  gridItem: {
    width: itemSize,
    height: itemSize,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioGridItem: {
    width: '100%',
    height: '100%',
    backgroundColor: '#10B981', // Emerald-500
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  audioText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  textGridItem: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    padding: 8,
    justifyContent: 'center',
  },
  textContent: {
    fontSize: 12,
    color: '#1E293B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94A3B8',
  },
  productInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  productPrice: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: 'bold',
  },
  eventInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
  },
  eventTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  eventPrice: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
