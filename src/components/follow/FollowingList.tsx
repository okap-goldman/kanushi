import { useNavigation } from '@react-navigation/native';
import { FileText, Image as ImageIcon, Mic, Video } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { followService } from '../../lib/followService';
import { Badge } from '../ui/Badge';

interface FollowingListProps {
  userId: string;
}

interface FollowingItem {
  id: string;
  followerId: string;
  followeeId: string;
  followType: 'family' | 'watch';
  createdAt: Date;
  followee: {
    id: string;
    displayName: string;
    profileImageUrl: string | null;
  };
  latestPost?: {
    id: string;
    content: string | null;
    contentType: 'text' | 'image' | 'audio' | 'video';
    audioUrl?: string;
    imageUrl?: string;
    videoUrl?: string;
    createdAt: Date;
  } | null;
}

type FilterType = 'all' | 'family' | 'watch';

export function FollowingList({ userId }: FollowingListProps) {
  const navigation = useNavigation();
  const [following, setFollowing] = useState<FollowingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadFollowing();
  }, [userId, filter]);

  const loadFollowing = async (cursor?: string) => {
    if (!cursor) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await followService.getFollowing({
        userId,
        type: filter === 'all' ? undefined : filter,
        cursor,
      });

      if (cursor) {
        setFollowing((prev) => [...prev, ...result.following]);
      } else {
        setFollowing(result.following);
      }
      setNextCursor(result.nextCursor);
    } catch (error) {
      console.error('Failed to load following:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleUserPress = (followeeId: string) => {
    navigation.navigate('Profile' as never, { userId: followeeId } as never);
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'text':
        return <FileText size={16} color="#6B7280" />;
      case 'image':
        return <ImageIcon size={16} color="#6B7280" />;
      case 'audio':
        return <Mic testID={`audio-icon-${contentType}`} size={16} color="#6B7280" />;
      case 'video':
        return <Video size={16} color="#6B7280" />;
      default:
        return null;
    }
  };

  const renderFollowing = ({ item }: { item: FollowingItem }) => (
    <TouchableOpacity
      testID={`following-item-${item.followeeId}`}
      onPress={() => handleUserPress(item.followeeId)}
      style={styles.followingItem}
    >
      <Image
        source={{ uri: item.followee.profileImageUrl || 'https://via.placeholder.com/50' }}
        style={styles.profileImage}
      />

      <View style={styles.followingInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{item.followee.displayName}</Text>
          <Badge
            testID={`${item.followType}-badge-${item.id}`}
            variant={item.followType === 'family' ? 'default' : 'secondary'}
            style={styles.badge}
          >
            {item.followType === 'family' ? 'ファミリー' : 'ウォッチ'}
          </Badge>
        </View>

        {item.latestPost ? (
          <View style={styles.postPreview}>
            <View style={styles.iconContainer}>{getContentIcon(item.latestPost.contentType)}</View>
            <Text style={styles.postContent} numberOfLines={2}>
              {item.latestPost.content ||
                (item.latestPost.contentType === 'audio' && '音声投稿') ||
                (item.latestPost.contentType === 'image' && '画像投稿') ||
                (item.latestPost.contentType === 'video' && '動画投稿')}
            </Text>
          </View>
        ) : (
          <Text style={styles.noPostText}>まだ投稿がありません</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>まだ誰もフォローしていません</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" />
      </View>
    );
  };

  const handleEndReached = () => {
    if (nextCursor && !loadingMore) {
      loadFollowing(nextCursor);
    }
  };

  if (loading && following.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* フィルタータブ */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            testID="filter-all"
            onPress={() => setFilter('all')}
            style={[
              styles.filterButton,
              filter === 'all' ? styles.filterButtonActive : styles.filterButtonInactive,
            ]}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === 'all' ? styles.filterButtonTextActive : styles.filterButtonTextInactive,
              ]}
            >
              すべて
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="filter-family"
            onPress={() => setFilter('family')}
            style={[
              styles.filterButton,
              filter === 'family' ? styles.filterButtonActive : styles.filterButtonInactive,
            ]}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === 'family'
                  ? styles.filterButtonTextActive
                  : styles.filterButtonTextInactive,
              ]}
            >
              ファミリー
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="filter-watch"
            onPress={() => setFilter('watch')}
            style={[
              styles.filterButton,
              filter === 'watch' ? styles.filterButtonActive : styles.filterButtonInactive,
              { marginRight: 0 },
            ]}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === 'watch'
                  ? styles.filterButtonTextActive
                  : styles.filterButtonTextInactive,
              ]}
            >
              ウォッチ
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* フォロー中リスト */}
      <FlatList
        testID="following-list"
        data={following}
        keyExtractor={(item) => item.id}
        renderItem={renderFollowing}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  followingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  followingInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontWeight: '600',
    color: '#111827',
  },
  badge: {
    marginLeft: 8,
  },
  postPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 8,
    marginTop: 4,
  },
  postContent: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  noPostText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: '#6B7280',
  },
  footerContainer: {
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterButtonInactive: {
    backgroundColor: '#E5E7EB',
  },
  filterButtonText: {
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterButtonTextInactive: {
    color: '#374151',
  },
});
