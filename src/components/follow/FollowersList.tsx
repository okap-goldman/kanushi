import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { followService } from '@/lib/followService';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react-native';

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
        cursor
      });

      if (cursor) {
        setFollowers(prev => [...prev, ...result.followers]);
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
      className="flex-row items-center p-4 border-b border-gray-200 dark:border-gray-700"
    >
      <Image
        source={{ uri: item.follower.profileImageUrl || 'https://via.placeholder.com/50' }}
        className="w-12 h-12 rounded-full mr-3"
      />
      
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="font-semibold text-gray-900 dark:text-white">
            {item.follower.displayName}
          </Text>
          {item.isFollowingBack && (
            <Users
              testID={`mutual-follow-icon-${item.id}`}
              size={16}
              className="ml-2 text-blue-500"
            />
          )}
        </View>
        
        {item.followReason && (
          <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {item.followReason}
          </Text>
        )}
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
    <View className="flex-1 justify-center items-center py-20">
      <Text className="text-gray-500 dark:text-gray-400">
        フォロワーはまだいません
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-4">
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
      <View className="flex-1 justify-center items-center">
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