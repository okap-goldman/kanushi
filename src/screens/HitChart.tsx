import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { createHitChartService, type HitChartPost } from '../lib/hitChartService';
import { liveRoomService } from '../lib/liveRoomService';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Avatar } from '../components/ui/Avatar';
import { Card } from '../components/ui/Card';
import { Navbar } from '../components/Navbar';
import { theme } from '../lib/theme';

const hitChartService = createHitChartService();
const { width } = Dimensions.get('window');

// スピリチュアル音声カテゴリ
const CATEGORIES = [
  { id: 'all', name: 'すべて', icon: 'play-circle' },
  { id: 'meditation', name: '瞑想', icon: 'heart' },
  { id: 'healing', name: 'ヒーリング', icon: 'feather' },
  { id: 'channeling', name: 'チャネリング', icon: 'zap' },
  { id: 'spiritual', name: 'スピリチュアル', icon: 'star' },
  { id: 'wisdom', name: '智慧', icon: 'book-open' },
];

// モックデータ - 今注目の音声
const FEATURED_AUDIO = [
  {
    id: '1',
    title: '深い瞑想への導き',
    artist: '山田瞑想先生',
    duration: '12:45',
    plays: 15420,
    thumbnail: 'https://picsum.photos/300/300?random=1',
  },
  {
    id: '2', 
    title: '宇宙との繋がり',
    artist: '佐藤チャネラー',
    duration: '8:30',
    plays: 9876,
    thumbnail: 'https://picsum.photos/300/300?random=2',
  },
  {
    id: '3',
    title: '魂の目醒めセッション',
    artist: '田中スピリチュアル',
    duration: '15:20',
    plays: 12340,
    thumbnail: 'https://picsum.photos/300/300?random=3',
  },
  {
    id: '4',
    title: 'チャクラ浄化の音霊',
    artist: '鈴木ヒーラー',
    duration: '10:15',
    plays: 8567,
    thumbnail: 'https://picsum.photos/300/300?random=4',
  },
];

// モックデータ - 話題のユーザー
const TRENDING_USERS = [
  {
    id: '1',
    name: '山田瞑想先生',
    username: 'yamada_meditation',
    followers: 12500,
    avatar: 'https://i.pravatar.cc/150?img=1',
    speciality: '深層瞑想',
  },
  {
    id: '2',
    name: '佐藤ヒーラー',
    username: 'sato_healer',
    followers: 8900,
    avatar: 'https://i.pravatar.cc/150?img=2',
    speciality: 'エネルギーヒーリング',
  },
  {
    id: '3',
    name: '田中チャネラー',
    username: 'tanaka_channel',
    followers: 6780,
    avatar: 'https://i.pravatar.cc/150?img=3',
    speciality: '高次元メッセージ',
  },
];

// モックデータ - 地域別人気音声
const REGIONAL_HITS = [
  {
    id: '1',
    region: '関東',
    title: '都市生活の浄化法',
    artist: '東京スピリチュアルセンター',
    plays: 5432,
    thumbnail: 'https://picsum.photos/300/300?random=10',
  },
  {
    id: '2',
    region: '関西',
    title: '大阪の波動上昇',
    artist: '関西エネルギーワーカー',
    plays: 4123,
    thumbnail: 'https://picsum.photos/300/300?random=11',
  },
  {
    id: '3',
    region: '北海道',
    title: '大地のエネルギー瞑想',
    artist: '北海道ネイチャーガイド',
    plays: 3456,
    thumbnail: 'https://picsum.photos/300/300?random=12',
  },
  {
    id: '4',
    region: '九州',
    title: '火の国のパワー覚醒',
    artist: '熊本霊性センター',
    plays: 2890,
    thumbnail: 'https://picsum.photos/300/300?random=13',
  },
];

interface LiveRoom {
  id: string;
  title: string;
  host_user_id: string;
  status: string;
  participant_count: number;
  is_recording: boolean;
  created_at: string;
  host?: {
    display_name: string;
    profile_image_url?: string;
  };
}

export default function HitChart() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [posts, setPosts] = useState<HitChartPost[]>([]);
  const [liveRooms, setLiveRooms] = useState<LiveRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  useEffect(() => {
    loadPosts();
    loadLiveRooms();
  }, [selectedCategory]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const result = await hitChartService.getTopPosts();
      if (result.success && result.data) {
        setPosts(result.data);
      }
    } catch (error) {
      console.error('Error loading hit chart:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLiveRooms = async () => {
    try {
      const activeRooms = await liveRoomService.getActiveRooms();
      setLiveRooms(activeRooms);
    } catch (error) {
      console.error('Failed to load live rooms:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPosts(), loadLiveRooms()]);
    setRefreshing(false);
  };

  const renderCategoryFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesContainer}
    >
      {CATEGORIES.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryButton,
            selectedCategory === category.id && styles.categoryButtonActive
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <Feather 
            name={category.icon as any} 
            size={16} 
            color={selectedCategory === category.id ? theme.colors.text.inverse : theme.colors.text.muted} 
          />
          <Text style={[
            styles.categoryText,
            selectedCategory === category.id && styles.categoryTextActive
          ]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderFeaturedAudio = ({ item }: { item: typeof FEATURED_AUDIO[0] }) => (
    <TouchableOpacity style={styles.featuredCard}>
      <View style={styles.featuredImageContainer}>
        <ExpoImage source={{ uri: item.thumbnail }} style={styles.featuredImage} />
        <View style={styles.playButtonOverlay}>
          <TouchableOpacity style={styles.playButton}>
            <Feather name="play" size={24} color={theme.colors.text.inverse} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.featuredInfo}>
        <Text style={styles.featuredTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.featuredArtist}>{item.artist}</Text>
        <View style={styles.featuredStats}>
          <Text style={styles.featuredDuration}>{item.duration}</Text>
          <Text style={styles.featuredPlays}>{item.plays.toLocaleString()} 再生</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTrendingUser = ({ item }: { item: typeof TRENDING_USERS[0] }) => (
    <TouchableOpacity style={styles.userCard}>
      <Avatar source={{ uri: item.avatar }} size="lg" />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userSpeciality}>{item.speciality}</Text>
        <Text style={styles.userFollowers}>{item.followers.toLocaleString()} フォロワー</Text>
      </View>
      <TouchableOpacity style={styles.followButton}>
        <Text style={styles.followButtonText}>フォロー</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRegionalHit = ({ item }: { item: typeof REGIONAL_HITS[0] }) => (
    <TouchableOpacity style={styles.regionalCard}>
      <ExpoImage source={{ uri: item.thumbnail }} style={styles.regionalImage} />
      <View style={styles.regionalInfo}>
        <Text style={styles.regionalRegion}>{item.region}</Text>
        <Text style={styles.regionalTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.regionalArtist}>{item.artist}</Text>
        <Text style={styles.regionalPlays}>{item.plays.toLocaleString()} 再生</Text>
      </View>
      <TouchableOpacity style={styles.playButtonSmall}>
        <Feather name="play" size={16} color={theme.colors.text.inverse} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const handleJoinRoom = (room: LiveRoom) => {
    const isHost = room.host_user_id === user?.id;
    navigation.navigate('LiveRoom', {
      roomId: room.id,
      userId: user?.id,
      role: isHost ? 'speaker' : 'listener',
      preloadedData: room,
    });
  };

  const renderLiveRoom = ({ item }: { item: LiveRoom }) => (
    <TouchableOpacity style={styles.liveRoomCard} onPress={() => handleJoinRoom(item)}>
      <View style={styles.liveRoomHeader}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        {item.is_recording && (
          <View style={styles.recordingBadge}>
            <Text style={styles.recordingText}>REC</Text>
          </View>
        )}
      </View>
      <Text style={styles.liveRoomTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <View style={styles.liveRoomInfo}>
        <Avatar 
          source={{ uri: item.host?.profile_image_url || 'https://i.pravatar.cc/150?u=' + item.host_user_id }} 
          size="sm" 
        />
        <View style={styles.liveRoomHostInfo}>
          <Text style={styles.liveRoomHostName}>{item.host?.display_name || '匿名ホスト'}</Text>
          <View style={styles.liveRoomStats}>
            <Feather name="users" size={12} color={theme.colors.text.muted} />
            <Text style={styles.liveRoomParticipants}>{item.participant_count || 0}人参加中</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.joinButton}>
        <Feather name="mic" size={16} color={theme.colors.text.inverse} />
        <Text style={styles.joinButtonText}>参加する</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Navbar />
      
      {/* Header with gradient background */}
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <Text style={styles.mainTitle}>ヒットチャート</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Feather name="search" size={24} color={theme.colors.text.inverse} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>目醒めの音声コンテンツ</Text>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Category Filter */}
        <View style={styles.filterSection}>
          {renderCategoryFilter()}
        </View>

        {/* Featured Audio Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今注目の音声</Text>
          <FlatList
            horizontal
            data={FEATURED_AUDIO}
            renderItem={renderFeaturedAudio}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        {/* Active Live Rooms Section */}
        {liveRooms.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>今注目のライブルーム</Text>
              <TouchableOpacity onPress={() => navigation.navigate('LiveRooms')}>
                <Text style={styles.seeAllText}>すべて見る</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={liveRooms.slice(0, 4)}
              renderItem={renderLiveRoom}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* Trending Users Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>話題のユーザー</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>すべて見る</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={TRENDING_USERS}
            renderItem={renderTrendingUser}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* Regional Hits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>地域別人気</Text>
          <FlatList
            data={REGIONAL_HITS}
            renderItem={renderRegionalHit}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* Weekly Chart Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>週間チャート Top10</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>全順位</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
          ) : posts.length > 0 ? (
            posts.slice(0, 10).map((post, index) => (
              <TouchableOpacity key={post.id} style={styles.chartItem}>
                <View style={styles.rankNumber}>
                  <Text style={styles.rankNumberText}>{index + 1}</Text>
                </View>
                <ExpoImage 
                  source={{ uri: post.profileAvatar || 'https://picsum.photos/300/300?random=' + index }} 
                  style={styles.chartItemImage} 
                />
                <View style={styles.chartItemInfo}>
                  <Text style={styles.chartItemTitle} numberOfLines={1}>
                    {post.textContent || 'タイトルなし'}
                  </Text>
                  <Text style={styles.chartItemArtist}>{post.profileName || '匿名ユーザー'}</Text>
                </View>
                <TouchableOpacity style={styles.chartPlayButton}>
                  <Feather name="play" size={16} color={theme.colors.primary.main} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="music" size={48} color={theme.colors.border.default} />
              <Text style={styles.emptyText}>まだチャートデータがありません</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  headerSection: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    opacity: 0.8,
  },
  searchButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  filterSection: {
    paddingVertical: 15,
    backgroundColor: theme.colors.background.primary,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.colors.secondary.main,
    fontWeight: '500',
  },
  horizontalList: {
    paddingHorizontal: 20,
  },

  // Featured Audio Card Styles
  featuredCard: {
    width: width * 0.7,
    backgroundColor: theme.colors.background.rose.subtle,
    borderRadius: 12,
    marginRight: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.rose,
  },
  featuredImageContainer: {
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: 180,
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.secondary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredInfo: {
    padding: 15,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 5,
  },
  featuredArtist: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 10,
  },
  featuredStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featuredDuration: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  featuredPlays: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },

  // Trending User Card Styles
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.emerald.subtle,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border.emerald,
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  userSpeciality: {
    fontSize: 14,
    color: theme.colors.primary.main,
    marginVertical: 2,
  },
  userFollowers: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  followButton: {
    backgroundColor: theme.colors.secondary.main,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 14,
    fontWeight: '500',
  },

  // Regional Hit Card Styles
  regionalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
  },
  regionalImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  regionalInfo: {
    flex: 1,
    marginLeft: 15,
  },
  regionalRegion: {
    fontSize: 12,
    color: theme.colors.secondary.main,
    fontWeight: '500',
  },
  regionalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginVertical: 2,
  },
  regionalArtist: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  regionalPlays: {
    fontSize: 11,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  playButtonSmall: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Chart Item Styles
  chartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
  },
  rankNumber: {
    width: 30,
    alignItems: 'center',
    marginRight: 15,
  },
  rankNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary.dark,
  },
  chartItemImage: {
    width: 45,
    height: 45,
    borderRadius: 6,
    marginRight: 15,
  },
  chartItemInfo: {
    flex: 1,
  },
  chartItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  chartItemArtist: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  chartPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background.emerald.light,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading and Empty States
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.text.muted,
  },

  // Live Room Card Styles
  liveRoomCard: {
    width: width * 0.8,
    backgroundColor: theme.colors.background.violet.subtle,
    borderRadius: 12,
    marginRight: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: theme.colors.border.violet,
  },
  liveRoomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
  },
  liveText: {
    color: '#FF0000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  recordingBadge: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recordingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  liveRoomTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  liveRoomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveRoomHostInfo: {
    marginLeft: 10,
    flex: 1,
  },
  liveRoomHostName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  liveRoomStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  liveRoomParticipants: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  joinButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 14,
    fontWeight: '500',
  },
});