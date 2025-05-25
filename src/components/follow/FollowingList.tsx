import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { followService } from '@/lib/followService';
import { Badge } from '@/components/ui/badge';
import { FileText, Image as ImageIcon, Mic, Video } from 'lucide-react-native';

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
        cursor
      });

      if (cursor) {
        setFollowing(prev => [...prev, ...result.following]);
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
        return <FileText size={16} className="text-gray-500" />;
      case 'image':
        return <ImageIcon size={16} className="text-gray-500" />;
      case 'audio':
        return <Mic testID={`audio-icon-${contentType}`} size={16} className="text-gray-500" />;
      case 'video':
        return <Video size={16} className="text-gray-500" />;
      default:
        return null;
    }
  };

  const renderFollowing = ({ item }: { item: FollowingItem }) => (
    <TouchableOpacity
      testID={`following-item-${item.followeeId}`}
      onPress={() => handleUserPress(item.followeeId)}
      className="flex-row items-start p-4 border-b border-gray-200 dark:border-gray-700"
    >
      <Image
        source={{ uri: item.followee.profileImageUrl || 'https://via.placeholder.com/50' }}
        className="w-12 h-12 rounded-full mr-3"
      />
      
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="font-semibold text-gray-900 dark:text-white">
            {item.followee.displayName}
          </Text>
          <Badge
            testID={`${item.followType}-badge-${item.id}`}
            variant={item.followType === 'family' ? 'default' : 'secondary'}
            className="ml-2"
          >
            {item.followType === 'family' ? 'ファミリー' : 'ウォッチ'}
          </Badge>
        </View>
        
        {item.latestPost ? (
          <View className="flex-row items-start">
            <View className="mr-2 mt-1">
              {getContentIcon(item.latestPost.contentType)}
            </View>
            <Text 
              className="text-sm text-gray-600 dark:text-gray-400 flex-1"
              numberOfLines={2}
            >
              {item.latestPost.content || 
                (item.latestPost.contentType === 'audio' && '音声投稿') ||
                (item.latestPost.contentType === 'image' && '画像投稿') ||
                (item.latestPost.contentType === 'video' && '動画投稿')}
            </Text>
          </View>
        ) : (
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            まだ投稿がありません
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View className="flex-1 justify-center items-center py-20">
      <Text className="text-gray-500 dark:text-gray-400">
        まだ誰もフォローしていません
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
      loadFollowing(nextCursor);
    }
  };

  if (loading && following.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* フィルタータブ */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="border-b border-gray-200 dark:border-gray-700"
      >
        <View className="flex-row px-4 py-2">
          <TouchableOpacity
            testID="filter-all"
            onPress={() => setFilter('all')}
            className={`px-4 py-2 rounded-full mr-2 ${
              filter === 'all' 
                ? 'bg-blue-500' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <Text className={`font-medium ${
              filter === 'all' 
                ? 'text-white' 
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              すべて
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="filter-family"
            onPress={() => setFilter('family')}
            className={`px-4 py-2 rounded-full mr-2 ${
              filter === 'family' 
                ? 'bg-blue-500' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <Text className={`font-medium ${
              filter === 'family' 
                ? 'text-white' 
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              ファミリー
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="filter-watch"
            onPress={() => setFilter('watch')}
            className={`px-4 py-2 rounded-full ${
              filter === 'watch' 
                ? 'bg-blue-500' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <Text className={`font-medium ${
              filter === 'watch' 
                ? 'text-white' 
                : 'text-gray-700 dark:text-gray-300'
            }`}>
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