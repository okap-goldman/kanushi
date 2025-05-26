import { Feather } from '@expo/vector-icons';
import React, { useState, useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
} from 'react-native';
import { Bell, MessageCircle, Settings } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar } from '../components/ui/Avatar';
import { CreatePostDialog } from '../components/CreatePostDialog';
import { Post } from '../components/post/Post';
import { FooterNav } from '../components/FooterNav';
import { useAuth } from '../context/AuthContext';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [timelineType, setTimelineType] = useState<'family' | 'watch'>('family');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const fetchPostsData = useCallback(
    async (page: number, pageSize: number) => {
      try {
        // Using different queries based on timeline type
        let query;

        if (timelineType === 'family') {
          // Family timeline: posts from people you follow + your posts
          query = supabase
            .from('post')
            .select(`
            *,
            profile!post_user_id_fkey (id, display_name, profile_image_url),
            post_hashtag (
              hashtag (id, name)
            )
          `)
            .order('created_at', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);
        } else {
          // Watch timeline: shows all posts
          query = supabase
            .from('post')
            .select(`
            *,
            profile!post_user_id_fkey (id, display_name, profile_image_url),
            post_hashtag (
              hashtag (id, name)
            )
          `)
            .order('created_at', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        if (data) {
          // Process the data to format it properly
          const formattedPosts = data.map((post) => ({
            id: post.id,
            content: post.media_url || post.text_content,
            caption: post.text_content,
            mediaType: post.content_type,
            author: {
              id: post.profile.id,
              name: post.profile.display_name,
              image: post.profile.profile_image_url,
            },
            // Consolidate tags from the post_hashtag join table
            tags:
              post.post_hashtag?.map((pt: any) => ({
                id: pt.hashtag.id,
                name: pt.hashtag.name,
              })) || [],
          }));

          return formattedPosts;
        }

        return [];
      } catch (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }
    },
    [timelineType]
  );

  const {
    data: posts,
    loading,
    loadingMore,
    hasNextPage,
    loadMore,
    refresh,
    refreshing,
  } = useInfiniteScroll({
    fetchData: fetchPostsData,
    pageSize: 10,
  });

  // Refresh data when timeline type changes
  useEffect(() => {
    refresh();
  }, [timelineType]);

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingMore} testID="loading-more-indicator">
        <ActivityIndicator size="small" color="#0070F3" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Kanushi</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowNotifications(true)}>
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
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, timelineType === 'family' && styles.activeTab]}
            onPress={() => setTimelineType('family')}
          >
            <Text style={[styles.tabText, timelineType === 'family' && styles.activeTabText]}>
              ファミリー
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, timelineType === 'watch' && styles.activeTab]}
            onPress={() => setTimelineType('watch')}
          >
            <Text style={[styles.tabText, timelineType === 'watch' && styles.activeTabText]}>
              ウォッチ
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        testID="posts-flatlist"
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
        onEndReached={hasNextPage && !loadingMore ? loadMore : undefined}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        refreshing={refreshing}
        onRefresh={refresh}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowCreatePost(true)}>
        <Feather name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <CreatePostDialog
        visible={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSuccess={() => {
          setShowCreatePost(false);
          refresh();
        }}
      />

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>通知</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Text style={styles.closeButton}>閉じる</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {[1, 2, 3].map((i) => (
                <TouchableOpacity key={i} style={styles.notificationItem}>
                  <Avatar
                    source={{ uri: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}` }}
                    style={styles.avatar}
                  />
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationText}>
                      ユーザー{i}があなたの投稿にいいねしました
                    </Text>
                    <Text style={styles.notificationTime}>1時間前</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      <FooterNav />
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 8,
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
    bottom: 80,
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
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    color: '#0070F3',
    fontSize: 16,
  },
  modalScroll: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: '#333',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
