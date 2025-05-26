import { useNavigation } from '@react-navigation/native';
import { Users } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { followService } from '../../lib/followService';
import { Badge } from '../ui/Badge';

interface FollowersListProps {
  userId: string;
  currentUserId?: string;
}

interface FollowerItem {
  id: string;
  followerId: string;
  followeeId: string;
  followType: 'family' | 'watch';
  followReason: string | null;
  createdAt: Date;
  follower: {
    id: string;
    displayName: string;
    profileImageUrl: string | null;
  };
  isFollowingBack?: boolean;
}

export function FollowersList({ userId, currentUserId }: FollowersListProps) {
  const navigation = useNavigation();
  const [followers, setFollowers] = useState<FollowerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    loadFollowers();
  }, [userId]);

  const loadFollowers = async (cursor?: string) => {
    if (!cursor) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await followService.getFollowers({
        userId,
        cursor,
      });

      if (cursor) {
        setFollowers((prev) => [...prev, ...result.followers]);
      } else {
        setFollowers(result.followers);
      }
      setNextCursor(result.nextCursor);
    } catch (error) {
      console.error('Failed to load followers:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleUserPress = (followerId: string) => {
    navigation.navigate('Profile' as never, { userId: followerId } as never);
  };

  const renderFollower = ({ item }: { item: FollowerItem }) => (
    <TouchableOpacity
      testID={`follower-item-${item.followerId}`}
      onPress={() => handleUserPress(item.followerId)}
      style={styles.followerItem}
    >
      <Image
        source={{ uri: item.follower.profileImageUrl || 'https://via.placeholder.com/50' }}
        style={styles.profileImage}
      />

      <View style={styles.followerInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{item.follower.displayName}</Text>
          {item.isFollowingBack && (
            <Users
              testID={`mutual-follow-icon-${item.id}`}
              size={16}
              color="#3B82F6"
              style={styles.mutualIcon}
            />
          )}
        </View>

        {item.followReason && <Text style={styles.followReason}>{item.followReason}</Text>}
      </View>

      <Badge
        testID={`${item.followType}-badge-${item.id}`}
        variant={item.followType === 'family' ? 'default' : 'secondary'}
      >
        {item.followType === 'family' ? 'ファミリー' : 'ウォッチ'}
      </Badge>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>フォロワーはまだいません</Text>
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
      loadFollowers(nextCursor);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      testID="followers-list"
      data={followers}
      keyExtractor={(item) => item.id}
      renderItem={renderFollower}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.1}
    />
  );
}

const styles = StyleSheet.create({
  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  followerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayName: {
    fontWeight: '600',
    color: '#111827',
  },
  mutualIcon: {
    marginLeft: 8,
  },
  followReason: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
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
});
