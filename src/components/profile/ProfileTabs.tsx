import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { supabase } from '../../lib/supabase';

type Tab = 'posts' | 'highlights' | 'likes' | 'bookmarks';

interface ProfileTabsProps {
  userId: string;
  activeTab: Tab;
  onChangeTab: (tab: Tab) => void;
}

export function ProfileTabs({ userId, activeTab, onChangeTab }: ProfileTabsProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    } else if (activeTab === 'highlights') {
      fetchHighlights();
    } else if (activeTab === 'likes') {
      fetchLikes();
    } else if (activeTab === 'bookmarks') {
      fetchBookmarks();
    }
  }, [activeTab, userId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
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

  const fetchLikes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('likes')
        .select('*, posts!inner(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setLikes(data);
      }
    } catch (err) {
      console.error('Error fetching likes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*, posts!inner(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setBookmarks(data);
      }
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070F3" />
        </View>
      );
    }

    if (activeTab === 'posts' && posts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="image" size={48} color="#CBD5E0" />
          <Text style={styles.emptyText}>No posts yet</Text>
        </View>
      );
    }

    if (activeTab === 'highlights' && highlights.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="star" size={48} color="#CBD5E0" />
          <Text style={styles.emptyText}>No highlights yet</Text>
        </View>
      );
    }

    if (activeTab === 'likes' && likes.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="heart" size={48} color="#CBD5E0" />
          <Text style={styles.emptyText}>No likes yet</Text>
        </View>
      );
    }

    if (activeTab === 'bookmarks' && bookmarks.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="bookmark" size={48} color="#CBD5E0" />
          <Text style={styles.emptyText}>No bookmarks yet</Text>
        </View>
      );
    }

    let data = [];
    if (activeTab === 'posts') {
      data = posts;
    } else if (activeTab === 'highlights') {
      data = highlights.map(h => h.posts);
    } else if (activeTab === 'likes') {
      data = likes.map(l => l.posts);
    } else if (activeTab === 'bookmarks') {
      data = bookmarks.map(b => b.posts);
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.gridItem}>
            {item.content_type === 'image' ? (
              <Image
                source={{ uri: item.media_url || item.thumbnail_url }}
                style={styles.gridImage}
                contentFit="cover"
              />
            ) : item.content_type === 'video' ? (
              <View style={styles.gridItem}>
                <Image
                  source={{ uri: item.thumbnail_url || 'https://via.placeholder.com/150' }}
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
                  {item.text_content || 'Audio'}
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
          <Feather
            name="grid"
            size={20}
            color={activeTab === 'posts' ? '#0070F3' : '#64748B'}
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'highlights' && styles.activeTab]}
          onPress={() => onChangeTab('highlights')}
        >
          <Feather
            name="star"
            size={20}
            color={activeTab === 'highlights' ? '#0070F3' : '#64748B'}
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'likes' && styles.activeTab]}
          onPress={() => onChangeTab('likes')}
        >
          <Feather
            name="heart"
            size={20}
            color={activeTab === 'likes' ? '#0070F3' : '#64748B'}
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          testID="bookmark-tab"
          style={[styles.tab, activeTab === 'bookmarks' && styles.activeTab]}
          onPress={() => onChangeTab('bookmarks')}
        >
          <Feather
            name="bookmark"
            size={20}
            color={activeTab === 'bookmarks' ? '#0070F3' : '#64748B'}
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContent}>
        {renderTabContent()}
      </View>
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
    borderBottomColor: '#0070F3',
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
    backgroundColor: '#0070F3',
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
});
