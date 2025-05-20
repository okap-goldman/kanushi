import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { Card } from '../components/ui/Card';

// Sample data for the discover page
const REGIONS = [
  { id: '1', name: 'Tokyo', image: 'https://picsum.photos/400/200?random=10', count: 245 },
  { id: '2', name: 'Osaka', image: 'https://picsum.photos/400/200?random=11', count: 182 },
  { id: '3', name: 'Kyoto', image: 'https://picsum.photos/400/200?random=12', count: 156 },
  { id: '4', name: 'Hokkaido', image: 'https://picsum.photos/400/200?random=13', count: 134 },
  { id: '5', name: 'Okinawa', image: 'https://picsum.photos/400/200?random=14', count: 98 },
  { id: '6', name: 'Hiroshima', image: 'https://picsum.photos/400/200?random=15', count: 87 },
];

const TRENDING_CATEGORIES = [
  { id: '1', name: 'Food', icon: 'coffee' },
  { id: '2', name: 'Events', icon: 'calendar' },
  { id: '3', name: 'Nature', icon: 'tree' },
  { id: '4', name: 'Art', icon: 'image' },
  { id: '5', name: 'Shopping', icon: 'shopping-bag' },
  { id: '6', name: 'Nightlife', icon: 'moon' },
];

const TRENDING_POSTS = [
  {
    id: '1',
    user: {
      id: 'user1',
      name: 'Sakura Restaurant',
      username: 'sakura_tokyo',
      avatarUrl: 'https://i.pravatar.cc/150?img=10',
    },
    content: 'Our new seasonal menu is now available! 🍜 #japanesefood #tokyo',
    images: ['https://picsum.photos/500/300?random=20'],
    createdAt: '2023-05-10T09:24:00Z',
    likes: 89,
    comments: 14,
  },
  {
    id: '2',
    user: {
      id: 'user2',
      name: 'Osaka Tourism',
      username: 'visit_osaka',
      avatarUrl: 'https://i.pravatar.cc/150?img=11',
    },
    content: 'Explore the vibrant streets of Dotonbori! #osaka #travel',
    images: ['https://picsum.photos/500/300?random=21'],
    createdAt: '2023-05-09T18:30:00Z',
    likes: 122,
    comments: 27,
  },
  {
    id: '3',
    user: {
      id: 'user3',
      name: 'Kyoto Temples',
      username: 'kyoto_temples',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
    },
    content: 'Morning light at Kinkaku-ji Temple 🌞 #kyoto #goldtemple',
    images: ['https://picsum.photos/500/300?random=22'],
    createdAt: '2023-05-08T06:15:00Z',
    likes: 211,
    comments: 35,
  },
];

const { width } = Dimensions.get('window');
const regionCardWidth = width * 0.7;

export default function Discover() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Regions section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Regions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            horizontal
            data={REGIONS}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.regionCard}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.regionImage}
                  contentFit="cover"
                />
                <View style={styles.regionInfo}>
                  <Text style={styles.regionName}>{item.name}</Text>
                  <Text style={styles.regionCount}>{item.count} posts</Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.regionList}
            snapToInterval={regionCardWidth + 15}
            decelerationRate="fast"
          />
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore</Text>
          <View style={styles.categoriesContainer}>
            {TRENDING_CATEGORIES.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonSelected,
                ]}
                onPress={() => setSelectedCategory(
                  selectedCategory === category.id ? null : category.id
                )}
              >
                <Feather
                  name={category.icon as any}
                  size={16}
                  color={selectedCategory === category.id ? '#FFFFFF' : '#4A5568'}
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.categoryTextSelected,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trending posts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Now</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {TRENDING_POSTS.map(post => (
            <Card key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Image
                  source={{ uri: post.user.avatarUrl }}
                  style={styles.postAvatar}
                />
                <View>
                  <Text style={styles.postUserName}>{post.user.name}</Text>
                  <Text style={styles.postUsername}>@{post.user.username}</Text>
                </View>
              </View>
              
              <Text style={styles.postContent} numberOfLines={2}>
                {post.content}
              </Text>
              
              <Image
                source={{ uri: post.images[0] }}
                style={styles.postImage}
                contentFit="cover"
              />
              
              <View style={styles.postStats}>
                <View style={styles.postStat}>
                  <Feather name="heart" size={16} color="#4A5568" />
                  <Text style={styles.postStatText}>{post.likes}</Text>
                </View>
                <View style={styles.postStat}>
                  <Feather name="message-circle" size={16} color="#4A5568" />
                  <Text style={styles.postStatText}>{post.comments}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  seeAllText: {
    fontSize: 14,
    color: '#0070F3',
  },
  regionList: {
    paddingLeft: 16,
    paddingRight: 6,
  },
  regionCard: {
    width: regionCardWidth,
    height: 160,
    marginRight: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  regionImage: {
    width: '100%',
    height: '100%',
  },
  regionInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  regionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  regionCount: {
    fontSize: 12,
    color: '#E2E8F0',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  categoryButtonSelected: {
    backgroundColor: '#0070F3',
  },
  categoryText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 6,
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  postCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  postUsername: {
    fontSize: 14,
    color: '#718096',
  },
  postContent: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  postStatText: {
    fontSize: 14,
    color: '#718096',
    marginLeft: 4,
  },
});