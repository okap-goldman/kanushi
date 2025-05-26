import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRoute, useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';

const { width } = Dimensions.get('window');

// Mock data for the region detail page
const POPULAR_USERS = [
  {
    id: '1',
    name: '山田太郎',
    username: 'yamada_taro',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    followersCount: 1250,
    location: '東京都渋谷区',
    bio: 'スピリチュアルな旅を共有します ✨',
  },
  {
    id: '2',
    name: '佐藤花子',
    username: 'hanako_sato',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
    followersCount: 980,
    location: '東京都新宿区',
    bio: '瞑想とヨガで心の平和を 🧘‍♀️',
  },
  {
    id: '3',
    name: '田中一郎',
    username: 'ichiro_tanaka',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    followersCount: 756,
    location: '神奈川県横浜市',
    bio: '音楽を通じた覚醒体験 🎵',
  },
];

const TRENDING_POSTS = [
  {
    id: '1',
    user: {
      name: '山田太郎',
      username: 'yamada_taro',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
    },
    content: '今朝の瞑想で素晴らしい洞察を得ました。愛と光に包まれた感覚は言葉では表現できません。',
    audioUrl: 'https://example.com/audio1.mp3',
    duration: '3:45',
    likes: 234,
    comments: 18,
    location: '代々木公園',
    createdAt: '2024-01-15T08:30:00Z',
  },
  {
    id: '2',
    user: {
      name: '佐藤花子',
      username: 'hanako_sato',
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
    },
    content: 'チャクラ調整のセッション後の変化について語ります。エネルギーの流れが劇的に改善されました。',
    audioUrl: 'https://example.com/audio2.mp3',
    duration: '5:12',
    likes: 189,
    comments: 25,
    location: '明治神宮',
    createdAt: '2024-01-14T19:15:00Z',
  },
];

const POPULAR_SPOTS = [
  {
    id: '1',
    name: '明治神宮',
    category: 'パワースポット',
    postCount: 145,
    image: 'https://picsum.photos/300/200?random=30',
    description: '都心にある神聖なエネルギースポット',
  },
  {
    id: '2',
    name: '代々木公園',
    category: '自然・瞑想',
    postCount: 98,
    image: 'https://picsum.photos/300/200?random=31',
    description: '自然の中での瞑想に最適な場所',
  },
  {
    id: '3',
    name: '浅草寺',
    category: 'お寺・巡礼',
    postCount: 87,
    image: 'https://picsum.photos/300/200?random=32',
    description: '古くから続く霊的な聖地',
  },
  {
    id: '4',
    name: '東京スカイツリー',
    category: 'エネルギー・展望',
    postCount: 76,
    image: 'https://picsum.photos/300/200?random=33',
    description: '高いエネルギーと広大な視野',
  },
];

const AI_SUMMARY = {
  title: '関東地域のスピリチュアル傾向',
  content: `関東地域では、都市部における現代的なスピリチュアル実践が特徴的です。特に瞑想、チャクラワーク、エネルギーヒーリングに関する投稿が多く見られます。

人気のあるトピック：
• 都市生活でのマインドフルネス実践
• パワースポット巡りと体験談
• 音楽を使った瞑想セッション
• エネルギーワークとチャクラ調整

この地域のユーザーは、忙しい日常の中でスピリチュアルな成長を求める傾向があり、短時間で効果的な実践方法に関心を示しています。`,
  insights: [
    '平日の朝と夜の投稿が多い',
    '音声コンテンツは3-5分が人気',
    'パワースポット情報の共有が活発',
    '初心者向けガイダンスの需要が高い',
  ],
};

export default function RegionDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const { regionName = '関東' } = route.params as { regionName?: string };

  const renderPopularUser = ({ item }: { item: typeof POPULAR_USERS[0] }) => (
    <Card style={styles.userCard}>
      <View style={styles.userInfo}>
        <Avatar source={{ uri: item.avatarUrl }} size="md" />
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userHandle}>@{item.username}</Text>
          <Text style={styles.userLocation}>{item.location}</Text>
          <Text style={styles.userBio} numberOfLines={2}>{item.bio}</Text>
        </View>
      </View>
      <View style={styles.userStats}>
        <Text style={styles.followersCount}>{item.followersCount.toLocaleString()}</Text>
        <Text style={styles.followersLabel}>フォロワー</Text>
      </View>
      <TouchableOpacity style={styles.followButton}>
        <Text style={styles.followButtonText}>フォロー</Text>
      </TouchableOpacity>
    </Card>
  );

  const renderTrendingPost = ({ item }: { item: typeof TRENDING_POSTS[0] }) => (
    <Card style={styles.postCard}>
      <View style={styles.postHeader}>
        <Avatar source={{ uri: item.user.avatarUrl }} size="sm" />
        <View style={styles.postUserInfo}>
          <Text style={styles.postUserName}>{item.user.name}</Text>
          <Text style={styles.postUserHandle}>@{item.user.username}</Text>
        </View>
        <View style={styles.postLocation}>
          <Feather name="map-pin" size={12} color="#718096" />
          <Text style={styles.postLocationText}>{item.location}</Text>
        </View>
      </View>
      
      <Text style={styles.postContent}>{item.content}</Text>
      
      <View style={styles.audioPlayer}>
        <TouchableOpacity style={styles.playButton}>
          <Feather name="play" size={16} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.audioInfo}>
          <Text style={styles.audioTitle}>音声投稿</Text>
          <Text style={styles.audioDuration}>{item.duration}</Text>
        </View>
        <View style={styles.waveform}>
          {[...Array(20)].map((_, i) => (
            <View key={i} style={[styles.waveBar, { height: Math.random() * 20 + 4 }]} />
          ))}
        </View>
      </View>
      
      <View style={styles.postStats}>
        <View style={styles.postStat}>
          <Feather name="heart" size={16} color="#E53E3E" />
          <Text style={styles.postStatText}>{item.likes}</Text>
        </View>
        <View style={styles.postStat}>
          <Feather name="message-circle" size={16} color="#4A5568" />
          <Text style={styles.postStatText}>{item.comments}</Text>
        </View>
      </View>
    </Card>
  );

  const renderPopularSpot = ({ item }: { item: typeof POPULAR_SPOTS[0] }) => (
    <TouchableOpacity style={styles.spotCard}>
      <Image source={{ uri: item.image }} style={styles.spotImage} contentFit="cover" />
      <View style={styles.spotInfo}>
        <Text style={styles.spotName}>{item.name}</Text>
        <Text style={styles.spotCategory}>{item.category}</Text>
        <Text style={styles.spotDescription} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.spotPostCount}>{item.postCount}件の投稿</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.title}>{regionName}地域</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* AI Summary Section */}
        <View style={styles.section}>
          <Card style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Feather name="zap" size={20} color="#805AD5" />
              <Text style={styles.summaryTitle}>{AI_SUMMARY.title}</Text>
            </View>
            <Text style={styles.summaryContent}>{AI_SUMMARY.content}</Text>
            <View style={styles.insightsList}>
              {AI_SUMMARY.insights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <View style={styles.insightDot} />
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Popular Users Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>人気のユーザー</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>すべて見る</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={POPULAR_USERS}
            renderItem={renderPopularUser}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>

        {/* Trending Posts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>よく見られている投稿</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>すべて見る</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={TRENDING_POSTS}
            renderItem={renderTrendingPost}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>

        {/* Popular Spots Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>人気のスポット</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>すべて見る</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={POPULAR_SPOTS}
            renderItem={renderPopularSpot}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.spotsList}
          />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginVertical: 8,
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

  // Summary Card Styles
  summaryCard: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#FAF5FF',
    borderLeftWidth: 4,
    borderLeftColor: '#805AD5',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#553C9A',
    marginLeft: 8,
  },
  summaryContent: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    marginBottom: 16,
  },
  insightsList: {
    marginTop: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  insightDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#805AD5',
    marginRight: 8,
  },
  insightText: {
    fontSize: 13,
    color: '#553C9A',
  },

  // User Card Styles
  userCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  userHandle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 2,
  },
  userLocation: {
    fontSize: 12,
    color: '#A0AEC0',
    marginBottom: 4,
  },
  userBio: {
    fontSize: 13,
    color: '#4A5568',
  },
  userStats: {
    alignItems: 'center',
    marginRight: 16,
  },
  followersCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  followersLabel: {
    fontSize: 12,
    color: '#718096',
  },
  followButton: {
    backgroundColor: '#0070F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  // Post Card Styles
  postCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postUserInfo: {
    flex: 1,
    marginLeft: 8,
  },
  postUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  postUserHandle: {
    fontSize: 12,
    color: '#718096',
  },
  postLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postLocationText: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 4,
  },
  postContent: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    marginBottom: 16,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0070F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  audioInfo: {
    marginRight: 12,
  },
  audioTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4A5568',
  },
  audioDuration: {
    fontSize: 11,
    color: '#718096',
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 24,
  },
  waveBar: {
    width: 2,
    backgroundColor: '#CBD5E0',
    borderRadius: 1,
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

  // Spot Card Styles
  spotsList: {
    paddingLeft: 16,
    paddingRight: 6,
  },
  spotCard: {
    width: 200,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  spotImage: {
    width: '100%',
    height: 120,
  },
  spotInfo: {
    padding: 12,
  },
  spotName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 4,
  },
  spotCategory: {
    fontSize: 12,
    color: '#805AD5',
    fontWeight: '500',
    marginBottom: 6,
  },
  spotDescription: {
    fontSize: 12,
    color: '#4A5568',
    lineHeight: 16,
    marginBottom: 8,
  },
  spotPostCount: {
    fontSize: 11,
    color: '#718096',
  },
});