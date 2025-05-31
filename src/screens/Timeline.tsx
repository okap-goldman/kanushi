import React, { useState, useEffect } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  Modal, 
  Pressable,
  RefreshControl, 
  StyleSheet, 
  Text, 
  TouchableOpacity,
  View 
} from 'react-native';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import StoriesRow from '../components/stories/StoriesRow';
import CreateStoryDialog from '../components/stories/CreateStoryDialog';
import { getStories, createStory, viewStory, type UserStories } from '../lib/storyService';
import { createTimelineService } from '../lib/timelineService';
import { mockPosts } from '../lib/mockData';

interface Post {
  id: string;
  user: {
    id: string;
    displayName: string;
    profileImageUrl?: string;
  };
  contentType: 'text' | 'image' | 'audio' | 'video';
  textContent?: string;
  mediaUrl?: string;
  waveformUrl?: string;
  durationSeconds?: number;
  aiMetadata?: {
    summary?: string;
  };
  createdAt: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isHighlighted: boolean;
  isBookmarked: boolean;
}

type TimelineProps = {};

export default function Timeline(_props: TimelineProps) {
  const [activeTab, setActiveTab] = useState<'family' | 'watch'>('family');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [userStories, setUserStories] = useState<UserStories[]>([]);
  const [showCreateStoryDialog, setShowCreateStoryDialog] = useState(false);

  const { user } = useAuth();

  // Mock data for testing
  const mockFamilyPosts = [
    {
      id: 'family-post-1',
      user: {
        id: 'user-1',
        displayName: 'ファミリーユーザー1',
        profileImageUrl: 'https://example.com/avatar1.jpg',
      },
      contentType: 'text' as const,
      textContent: 'これは家族タイムラインのテスト投稿です。家族の温かいメッセージをお届けします。',
      createdAt: '2024-01-01T10:00:00Z',
      likes: 5,
      comments: 2,
      isLiked: false,
      isHighlighted: false,
      isBookmarked: false,
    },
    {
      id: 'family-post-2',
      user: {
        id: 'user-2',
        displayName: 'ファミリーユーザー2',
        profileImageUrl: 'https://example.com/avatar2.jpg',
      },
      contentType: 'audio' as const,
      mediaUrl: 'https://example.com/audio.mp3',
      waveformUrl: 'https://example.com/waveform.png',
      durationSeconds: 180,
      aiMetadata: {
        summary: '家族の絆についての瞑想音声',
      },
      createdAt: '2024-01-01T09:00:00Z',
      likes: 12,
      comments: 4,
      isLiked: true,
      isHighlighted: false,
      isBookmarked: true,
    },
  ];

  const mockWatchPosts = [
    {
      id: 'watch-post-1',
      user: {
        id: 'user-3',
        displayName: 'ウォッチユーザー1',
        profileImageUrl: 'https://example.com/avatar3.jpg',
      },
      contentType: 'text' as const,
      textContent: 'これはウォッチタイムラインの投稿です。興味深いコンテンツをお楽しみください。',
      createdAt: '2024-01-01T11:00:00Z',
      likes: 8,
      comments: 3,
      isLiked: false,
      isHighlighted: true,
      isBookmarked: false,
    },
    {
      id: 'watch-post-2',
      user: {
        id: 'user-4',
        displayName: 'ウォッチユーザー2',
        profileImageUrl: 'https://example.com/avatar4.jpg',
      },
      contentType: 'audio' as const,
      mediaUrl: 'https://example.com/audio2.mp3',
      waveformUrl: 'https://example.com/waveform2.png',
      durationSeconds: 240,
      aiMetadata: {
        summary: '目醒めのプロセスについての深い洞察',
      },
      createdAt: '2024-01-01T08:30:00Z',
      likes: 15,
      comments: 6,
      isLiked: true,
      isHighlighted: false,
      isBookmarked: true,
    },
  ];

  useEffect(() => {
    loadTimeline();
    loadStories();
  }, [activeTab]);


  const loadTimeline = async () => {
    setLoading(true);
    try {
      const timelineService = createTimelineService();
      const result = await timelineService.getTimeline(
        user?.id || '1',
        activeTab === 'family' ? 'family' : 'public',
        20
      );
      
      if (result.success && result.data) {
        const formattedPosts: Post[] = result.data.data.map(post => {
          // Use appropriate mock data based on active tab
          const currentMockData = activeTab === 'family' ? mockFamilyPosts : mockWatchPosts;
          const mockUser = currentMockData.find(p => p.id === post.id)?.user;
          
          return {
            id: post.id,
            user: mockUser ? {
              id: mockUser.id,
              displayName: mockUser.display_name,
              profileImageUrl: mockUser.avatar_url,
            } : {
              id: post.userId,
              displayName: 'ユーザー',
              profileImageUrl: 'https://picsum.photos/200',
            },
            contentType: post.contentType as 'text' | 'image' | 'audio' | 'video',
            textContent: post.textContent || undefined,
            mediaUrl: post.mediaUrl || undefined,
            waveformUrl: post.waveformUrl || undefined,
            durationSeconds: post.durationSeconds || undefined,
            aiMetadata: post.aiMetadata || undefined,
            createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt,
            likes: post.likesCount,
            comments: post.commentsCount,
            isLiked: false,
            isHighlighted: false,
            isBookmarked: false,
          };
        });
        
        setPosts(formattedPosts);
        setHasNextPage(result.data.nextCursor !== null);
      } else {
        // Fallback to mock data if service fails
        const currentMockData = activeTab === 'family' ? mockFamilyPosts : mockWatchPosts;
        setPosts(currentMockData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading timeline:', error);
      setLoading(false);
    }
  };

  const loadStories = async () => {
    try {
      const stories = await getStories();
      setUserStories(stories);
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Simulate refresh with appropriate mock data
      setTimeout(() => {
        const currentMockData = activeTab === 'family' ? mockFamilyPosts : mockWatchPosts;
        setPosts(currentMockData);
        setRefreshing(false);
      }, 500);
      // Also refresh stories
      await loadStories();
    } catch (error) {
      console.error('Error refreshing timeline:', error);
      setRefreshing(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasNextPage) return;

    setLoadingMore(true);
    try {
      // Simulate loading more posts with appropriate mock data
      setTimeout(() => {
        const currentMockData = activeTab === 'family' ? mockFamilyPosts : mockWatchPosts;
        const morePosts = currentMockData.map((post, index) => ({
          ...post,
          id: `${post.id}-more-${index}`,
        }));
        setPosts((prev) => [...prev, ...morePosts]);
        setLoadingMore(false);
        setHasNextPage(false); // Simulate no more pages
      }, 1000);
    } catch (error) {
      console.error('Error loading more posts:', error);
      setLoadingMore(false);
    }
  };

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const handleHighlight = (postId: string, reason: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, isHighlighted: !post.isHighlighted } : post
      )
    );
  };

  const handleComment = (postId: string) => {
    // Navigate to comments or open comment modal
  };

  const handleDelete = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      currentUserId={user?.id}
      onLike={handleLike}
      onHighlight={handleHighlight}
      onComment={handleComment}
      onDelete={handleDelete}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#0070F3" />
      </View>
    );
  };

  const handleTabChange = (value: string) => {
    // If switching from family to watch, show confirmation dialog
    if (activeTab === 'family' && value === 'watch') {
      setShowConfirmDialog(true);
    } else {
      setActiveTab(value as 'family' | 'watch');
    }
  };

  const handleConfirmSwitch = () => {
    setActiveTab('watch');
    setShowConfirmDialog(false);
  };

  const handleCancelSwitch = () => {
    setShowConfirmDialog(false);
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
    file: { uri: string; type: string; name: string };
    caption: string;
    contentType: 'image' | 'video';
  }) => {
    try {
      const story = await createStory(
        data.file.uri,
        data.file.type,
        data.caption,
        data.contentType
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0070F3" testID="loading-indicator" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stories Row - Fixed at top */}
      <View style={styles.storiesContainer}>
        <StoriesRow
          userStories={userStories}
          currentUserId={user?.id || ''}
          currentUserImage={user?.profileImage || 'https://picsum.photos/100'}
          onCreateStory={handleCreateStory}
          onStoryView={handleStoryView}
        />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <View style={styles.tabsList}>
          <TouchableOpacity 
            style={[styles.tabTrigger, activeTab === 'family' && styles.tabTriggerActive]}
            onPress={() => handleTabChange('family')}
          >
            <Text style={[styles.tabText, activeTab === 'family' && styles.activeTabText]}>
              ファミリー
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabTrigger, activeTab === 'watch' && styles.tabTriggerActive]}
            onPress={() => handleTabChange('watch')}
          >
            <Text style={[styles.tabText, activeTab === 'watch' && styles.activeTabText]}>
              ウォッチ
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Timeline Content */}
      <View
        style={styles.content}
        testID={activeTab === 'watch' ? 'watch-timeline' : 'timeline-content'}
      >
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          testID="timeline-list"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              testID="refresh-control"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
        />
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelSwitch}
        testID="confirm-modal"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>タイムライン切り替えの確認</Text>
            <Text style={styles.modalDescription}>
              ファミリータイムラインからウォッチタイムラインに切り替えますか？
              {'\n\n'}
              ウォッチタイムラインでは、ウォッチしているユーザーの投稿が表示されます。
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleCancelSwitch}>
                <Text style={styles.modalButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handleConfirmSwitch}>
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>切り替える</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Story Dialog */}
      <CreateStoryDialog
        isOpen={showCreateStoryDialog}
        onOpenChange={setShowCreateStoryDialog}
        onSubmit={handleStorySubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsList: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
    margin: 16,
  },
  tabTriggerActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  tabTrigger: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#0070F3',
  },
  content: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
    zIndex: 1001,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalButtonTextPrimary: {
    color: 'white',
  },
  storiesContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
});
