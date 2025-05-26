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
import { FooterNav } from '../components/FooterNav';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'highlights' | 'likes' | 'bookmarks'>('posts');
 
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user } = useAuth();

  // Get userId from route params or use current user's ID
  const userId = (route.params as any)?.userId || user?.id;

  const fetchProfile = async () => {
    try {
      setLoading(true);

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

  const handleFollowersPress = () => {
    navigation.navigate('FollowersList', { userId, type: 'followers' });
  };

  const handleFollowingPress = () => {
    navigation.navigate('FollowersList', { userId, type: 'following' });
  };

  const isCurrentUser = user?.id === userId;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Navbar />
        <View style={styles.loadingContainer}>
          <Text>プロフィールを読み込み中...</Text>
        </View>
        <FooterNav />
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
        <FooterNav />
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
            <Avatar source={profile.profileImageUrl || 'https://via.placeholder.com/80'} size="xl" />

            <View style={styles.profileStats}>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statValue}>{profile.posts?.count || 0}</Text>
                <Text style={styles.statLabel}>投稿</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.statItem} onPress={handleFollowersPress}>
                <Text style={styles.statValue}>{profile.followers?.count || 0}</Text>
                <Text style={styles.statLabel}>フォロワー</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.statItem} onPress={handleFollowingPress}>
                <Text style={styles.statValue}>{profile.following?.count || 0}</Text>
                <Text style={styles.statLabel}>フォロー中</Text>
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
        </View>

        <ProfileTabs userId={userId} activeTab={activeTab} onChangeTab={setActiveTab} />
      </ScrollView>
      <FooterNav />
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
  profileStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
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
