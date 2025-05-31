import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import React, { useState, useEffect } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { mockConfig, mockDelay, getMockUser, mockCurrentUser } from '../lib/mockData';
import { followServiceInstance } from '../lib/followService';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'highlights' | 'shop' | 'events'>('posts');
  const [followStatsByType, setFollowStatsByType] = useState<{
    family: { followersCount: number; followingCount: number };
    watch: { followersCount: number; followingCount: number };
  } | null>(null);
 
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user } = useAuth();

  // Get userId from route params or use current user's ID
  const userId = (route.params as any)?.userId || user?.id;

  const fetchProfile = async () => {
    try {
      setLoading(true);

      // モックモードの場合
      if (mockConfig.enabled) {
        await mockDelay();
        
        // 指定されたuserIdのモックユーザーを取得、なければ現在のユーザー
        const mockUser = getMockUser(userId) || mockCurrentUser;
        
        setProfile({
          id: mockUser.id,
          displayName: mockUser.display_name,
          profileImageUrl: mockUser.avatar_url,
          profileText: mockUser.bio,
          username: mockUser.username,
          email: mockUser.email,
          isVerified: mockUser.is_verified,
          createdAt: mockUser.created_at,
          followers: { count: mockUser.followers_count },
          following: { count: mockUser.following_count },
          posts: { count: mockUser.posts_count }
        });

        // ファミリー・ウォッチ別の統計データを取得
        const followStatsResult = await followServiceInstance.getFollowStatsByType(userId);
        if (followStatsResult.success) {
          setFollowStatsByType(followStatsResult.data);
        }
        return;
      }

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profile')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }

      // Fetch followers count
      const { count: followersCount } = await supabase
        .from('follow')
        .select('*', { count: 'exact', head: true })
        .eq('followee_id', userId)
        .eq('status', 'active');

      // Fetch following count
      const { count: followingCount } = await supabase
        .from('follow')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)
        .eq('status', 'active');

      // Fetch posts count
      const { count: postsCount } = await supabase
        .from('post')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (profileData) {
        setProfile({
          ...profileData,
          followers: { count: followersCount || 0 },
          following: { count: followingCount || 0 },
          posts: { count: postsCount || 0 }
        });

        // ファミリー・ウォッチ別の統計データを取得
        const followStatsResult = await followServiceInstance.getFollowStatsByType(userId);
        if (followStatsResult.success) {
          setFollowStatsByType(followStatsResult.data);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleEditProfile = () => {
    navigation.navigate('ProfileEdit');
  };

  const handleFollowersPress = (followType?: 'family' | 'watch') => {
    navigation.navigate('FollowersList', { userId, type: 'followers', followType });
  };

  const handleFollowingPress = (followType?: 'family' | 'watch') => {
    navigation.navigate('FollowersList', { userId, type: 'following', followType });
  };

  const isCurrentUser = user?.id === userId;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Navbar />
        <View style={styles.loadingContainer}>
          <Text>プロフィールを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Navbar />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>プロフィールが見つかりません</Text>
          <Button onPress={handleRefresh} variant="outline" style={styles.retryButton}>
            再読み込み
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Navbar />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.header}>
          <View style={styles.profileHeader}>
            <Avatar source={profile.profileImageUrl || 'https://picsum.photos/80'} size="xl" />
            <View style={styles.profileBasicStats}>
              <TouchableOpacity style={styles.postStatItem}>
                <Text style={styles.postStatValue}>{profile.posts?.count || 0}</Text>
                <Text style={styles.postStatLabel}>投稿</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>{profile.displayName}</Text>
            {profile.profileText && <Text style={styles.bio}>{profile.profileText}</Text>}

            {isCurrentUser ? (
              <Button onPress={handleEditProfile} variant="outline" style={styles.editButton}>
                プロフィールを編集
              </Button>
            ) : (
              <Button onPress={() => {}} style={styles.followButton}>
                フォロー
              </Button>
            )}
          </View>

          <View style={styles.followStatsContainer}>
            <View style={styles.followTypeSection}>
              <Text style={styles.followTypeSectionTitle}>ファミリー</Text>
              <View style={styles.followTypeStatsRow}>
                <TouchableOpacity style={styles.followStatItem} onPress={() => handleFollowersPress('family')}>
                  <Text style={styles.followStatValue}>{followStatsByType?.family.followersCount || 0}</Text>
                  <Text style={styles.followStatLabel}>フォロワー</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.followStatItem} onPress={() => handleFollowingPress('family')}>
                  <Text style={styles.followStatValue}>{followStatsByType?.family.followingCount || 0}</Text>
                  <Text style={styles.followStatLabel}>フォロー中</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.followTypeSection}>
              <Text style={styles.followTypeSectionTitle}>ウォッチ</Text>
              <View style={styles.followTypeStatsRow}>
                <TouchableOpacity style={styles.followStatItem} onPress={() => handleFollowersPress('watch')}>
                  <Text style={styles.followStatValue}>{followStatsByType?.watch.followersCount || 0}</Text>
                  <Text style={styles.followStatLabel}>フォロワー</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.followStatItem} onPress={() => handleFollowingPress('watch')}>
                  <Text style={styles.followStatValue}>{followStatsByType?.watch.followingCount || 0}</Text>
                  <Text style={styles.followStatLabel}>フォロー中</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <ProfileTabs userId={userId} activeTab={activeTab} onChangeTab={setActiveTab} />
      </ScrollView>
    </SafeAreaView>
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
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
  },
  header: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileBasicStats: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 24,
  },
  postStatItem: {
    alignItems: 'center',
  },
  postStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  postStatLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  followStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  followTypeSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  followTypeSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  followTypeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  followStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  followStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  followStatLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  profileInfo: {
    marginBottom: 16,
  },
  displayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 12,
  },
  editButton: {
    marginTop: 8,
  },
  followButton: {
    marginTop: 8,
  },
});
