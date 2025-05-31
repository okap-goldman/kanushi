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
} from 'react-native';
import { Bell, MessageCircle, Settings } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { mockConfig, mockPosts } from '../lib/mockData';
import { createTimelineService } from '../lib/timelineService';
import { Avatar } from '../components/ui/Avatar';
import { CreatePostDialog } from '../components/CreatePostDialog';
import { Post } from '../components/post/Post';
import { useAuth } from '../context/AuthContext';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { supabase } from '../lib/supabase';
import StoriesRow from '../components/stories/StoriesRow';
import CreateStoryDialog from '../components/stories/CreateStoryDialog';
import { getStories, createStory, viewStory, type UserStories } from '../lib/storyService';

export default function Home() {
  const [timelineType, setTimelineType] = useState<'family' | 'watch'>('family');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [userStories, setUserStories] = useState<UserStories[]>([]);
  const [showCreateStoryDialog, setShowCreateStoryDialog] = useState(false);

  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const fetchPostsData = useCallback(
    async (page: number, pageSize: number) => {
      try {
        console.log('fetchPostsData called with:', { page, pageSize, timelineType, mockConfigEnabled: mockConfig.enabled });
        
        // モックモードの場合
        if (mockConfig.enabled) {
          console.log('Using mock mode, available mockPosts:', mockPosts.length);
          
          // 直接モックデータを返す
          const posts = mockPosts.map(post => ({
            id: post.id,
            user_id: post.user.id,
            content_type: post.contentType,
            text_content: post.textContent,
            media_url: post.mediaUrl,
            audio_url: post.contentType === 'audio' ? post.mediaUrl : undefined,
            audio_duration: post.durationSeconds,
            image_urls: post.contentType === 'image' && post.mediaUrl ? [post.mediaUrl] : undefined,
            preview_url: post.mediaUrl,
            created_at: post.createdAt,
            likes_count: post.likes,
            comments_count: post.comments,
            shares_count: 0,
            highlights_count: 0,
            profile: {
              id: post.user.id,
              display_name: post.user.displayName,
              profile_image_url: post.user.profileImageUrl,
            },
            post_hashtag: [],
          }));
          
          console.log('Returning mock posts:', posts.length);
          return posts;
        }
        
        // Using different queries based on timeline type
        let query;

        if (timelineType === 'family') {
          // Family timeline: posts from people you follow + your posts
          query = supabase
            .from('post')
            .select(`
            *,
            profile:user_id (id, display_name, profile_image_url),
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
            profile:user_id (id, display_name, profile_image_url),
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
    [timelineType, user?.id]
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

  console.log('Home component render:', { 
    postsLength: posts?.length, 
    loading, 
    mockConfigEnabled: mockConfig.enabled 
  });

  // Refresh data when timeline type changes
  useEffect(() => {
    refresh();
  }, [timelineType]);

  // Load stories on mount
  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const stories = await getStories();
      setUserStories(stories);
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  };

  const handleCreateStory = () => {
    setShowCreateStoryDialog(true);
  };

  const handleStoryView = async (storyId: string) => {
    try {
      await viewStory(storyId);
    } catch (error) {
      console.error('Error viewing story:', error);
    }
  };

  const handleStorySubmit = async (data: {
    audioFile: { uri: string; type: string; name: string };
    imageFile: { uri: string; type: string; name: string };
    audioTranscript?: string;
    caption: string;
  }) => {
    try {
      const story = await createStory(
        data.audioFile,
        data.imageFile,
        data.audioTranscript,
        data.caption
      );
      
      if (story) {
        // Refresh stories to show the new one
        await loadStories();
      }
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingMore} testID="loading-more-indicator">
        <ActivityIndicator size="small" color="#10B981" />
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
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
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

      {/* Stories Row */}
      <View style={styles.storiesContainer}>
        <StoriesRow
          userStories={userStories}
          currentUserId={user?.id || ''}
          currentUserImage={user?.profileImage || 'https://picsum.photos/100'}
          onCreateStory={handleCreateStory}
          onStoryView={handleStoryView}
        />
      </View>

      <FlatList
        testID="posts-flatlist"
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          console.log('Rendering post item:', item);
          
          // メディアコンテンツの決定
          let content = item.text_content || '';
          let caption = item.text_content || '';
          
          if (item.content_type === 'audio' && item.audio_url) {
            content = item.audio_url;
          } else if (item.content_type === 'image' && item.image_urls && item.image_urls.length > 0) {
            content = item.image_urls[0];
          } else if (item.content_type === 'video' && item.media_url) {
            content = item.media_url;
          }
          
          // テキスト以外のコンテンツの場合、text_contentをキャプションとして使用
          if (item.content_type !== 'text') {
            caption = item.text_content || '';
          }
          
          return (
            <Post
              author={{
                name: item.profile?.display_name || 'Unknown',
                image: item.profile?.profile_image_url || 'https://picsum.photos/200',
                id: item.profile?.id || item.user_id
              }}
              content={content}
              caption={caption}
              mediaType={item.content_type || 'text'}
              postId={item.id}
              tags={item.tags || []}
            />
          );
        }}
        onEndReached={hasNextPage && !loadingMore ? loadMore : undefined}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        refreshing={refreshing}
        onRefresh={refresh}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text>投稿がありません</Text>
          </View>
        )}
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


      {/* Create Story Dialog */}
      <CreateStoryDialog
        isOpen={showCreateStoryDialog}
        onOpenChange={setShowCreateStoryDialog}
        onSubmit={handleStorySubmit}
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
    borderBottomColor: '#10B981', // Emerald-500
  },
  tabText: {
    color: '#64748B',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#10B981', // Emerald-500
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
    bottom: 100,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981', // Emerald-500
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
  storiesContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
});
