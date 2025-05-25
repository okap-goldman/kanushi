import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { ProfileTabs } from '../components/profile/ProfileTabs';

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
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          followers:followers!follower_id(count),
          following:following!user_id(count)
        `)
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setProfile(data);
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

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.profileHeader}>
            <Avatar 
              source={profile.image || 'https://via.placeholder.com/80'} 
              size="xl" 
            />
            
            <View style={styles.profileStats}>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statValue}>
                  {profile.post_count || 0}
                </Text>
                <Text style={styles.statLabel}>Posts</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.statItem}
                onPress={handleFollowersPress}
              >
                <Text style={styles.statValue}>
                  {profile.followers?.count || 0}
                </Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.statItem}
                onPress={handleFollowingPress}
              >
                <Text style={styles.statValue}>
                  {profile.following?.count || 0}
                </Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>{profile.full_name || profile.username}</Text>
            {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
            
            {isCurrentUser ? (
              <Button
                onPress={handleEditProfile}
                variant="outline"
                style={styles.editButton}
              >
                Edit Profile
              </Button>
            ) : (
              <Button
                onPress={() => {}}
                style={styles.followButton}
              >
                Follow
              </Button>
            )}
          </View>
        </View>

        <ProfileTabs
          userId={userId}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
        />
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
