import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Post } from '../components/Post';

// Sample data for posts
const SAMPLE_POSTS = [
  {
    id: '1',
    username: 'user1',
    avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1612832021074-13c673e4b2b0?q=80&w=1470&auto=format&fit=crop',
    caption: 'This is a beautiful place!',
    timestamp: '30 minutes ago',
    likeCount: 120,
    commentCount: 8,
    isLiked: false,
  },
  {
    id: '2',
    username: 'user2',
    avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1593642634367-d91a135587b5?q=80&w=1469&auto=format&fit=crop',
    caption: 'Working on my new project',
    timestamp: '2 hours ago',
    likeCount: 85,
    commentCount: 4,
    isLiked: true,
  },
  {
    id: '3',
    username: 'user3',
    avatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1470&auto=format&fit=crop',
    caption: 'Mountains are calling!',
    timestamp: '1 day ago',
    likeCount: 210,
    commentCount: 15,
    isLiked: false,
  },
];

export default function HomeScreen() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // In a real app, we would fetch new posts here
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  return (
    <ScrollView 
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="py-2">
        {SAMPLE_POSTS.map(post => (
          <Post key={post.id} {...post} />
        ))}
      </View>
    </ScrollView>
  );
}