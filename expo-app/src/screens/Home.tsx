import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Post } from '../components/post/Post';
import { CreatePostDialog } from '../components/CreatePostDialog';

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timelineType, setTimelineType] = useState<'family' | 'watch'>('family');
  const [showCreatePost, setShowCreatePost] = useState(false);
  
  const { user } = useAuth();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Using different queries based on timeline type
      let query;
      
      if (timelineType === 'family') {
        // Family timeline: posts from people you follow + your posts
        query = supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id (id, username, image),
            post_tags!inner (
              tags (id, name)
            )
          `)
          .order('created_at', { ascending: false });
      } else {
        // Watch timeline: shows all posts
        query = supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id (id, username, image),
            post_tags!inner (
              tags (id, name)
            )
          `)
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data) {
        // Process the data to format it properly
        const formattedPosts = data.map((post) => ({
          id: post.id,
          content: post.media_url || post.audio_url || post.text_content,
          caption: post.text_content,
          mediaType: post.content_type,
          author: {
            id: post.profiles.id,
            name: post.profiles.username,
            image: post.profiles.image,
          },
          // Consolidate tags from the posts_tags join table
          tags: post.post_tags.map((pt: any) => ({
            id: pt.tags.id,
            name: pt.tags.name,
          })),
        }));
        
        setPosts(formattedPosts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [timelineType]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kanushi</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              timelineType === 'family' && styles.activeTab,
            ]}
            onPress={() => setTimelineType('family')}
          >
            <Text
              style={[
                styles.tabText,
                timelineType === 'family' && styles.activeTabText,
              ]}
            >
              Family
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              timelineType === 'watch' && styles.activeTab,
            ]}
            onPress={() => setTimelineType('watch')}
          >
            <Text
              style={[
                styles.tabText,
                timelineType === 'watch' && styles.activeTabText,
              ]}
            >
              Watch
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Post
            author={item.author}
            content={item.content}
            caption={item.caption}
            mediaType={item.mediaType}
            postId={item.id}
            tags={item.tags}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreatePost(true)}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <CreatePostDialog
        visible={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSuccess={() => {
          setShowCreatePost(false);
          fetchPosts();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.05)',
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 16,
  },
  activeTab: {
    borderBottomColor: '#0070F3',
  },
  tabText: {
    color: '#64748B',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#0070F3',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0070F3',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    elevation: 5,
  },
});