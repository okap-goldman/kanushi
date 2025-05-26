import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { LogOut, Pause, Play, Store } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';

interface ProfileHeaderProps {
  isPlaying?: boolean;
  handlePlayVoice?: () => void;
  selectedTab?: string;
  setSelectedTab?: (tab: string) => void;
}

export function ProfileHeader({ isPlaying, handlePlayVoice }: ProfileHeaderProps) {
  const navigation = useNavigation();
  const { user, profile, signOut } = useAuth();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const toggleAudio = async () => {
    try {
      if (isAudioPlaying && sound) {
        await sound.pauseAsync();
        setIsAudioPlaying(false);
      } else {
        if (sound) {
          await sound.playAsync();
          setIsAudioPlaying(true);
        } else {
          const audioUrl =
            profile?.audio_url ||
            'https://s328.podbean.com/pb/4b3e15298687315db3070972aaa50fee/676f0aab/data1/fs91/20007750/uploads/6b592.m4a?pbss=abbaab44-f1dd-5725-bf73-452199e42c01';
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: audioUrl },
            { shouldPlay: true }
          );
          setSound(newSound);
          setIsAudioPlaying(true);

          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsAudioPlaying(false);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigation.navigate('Login' as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarRow}>
        <TouchableOpacity style={styles.iconButton} onPress={toggleAudio}>
          {isAudioPlaying ? (
            <Pause size={24} color="#6366f1" />
          ) : (
            <Play size={24} color="#6366f1" />
          )}
        </TouchableOpacity>

        <Avatar
          source={{
            uri:
              profile?.image ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || '1'}`,
          }}
          style={styles.avatar}
          fallback={profile?.name?.[0] || user?.email?.[0] || 'U'}
        />

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('Shop' as never)}
        >
          <Store size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <Button variant="outline" onPress={() => navigation.navigate('ProfileEdit' as never)}>
          プロフィールを編集
        </Button>

        <Button variant="outline" onPress={handleSignOut}>
          <LogOut size={16} color="#6366f1" style={{ marginRight: 8 }} />
          ログアウト
        </Button>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{profile?.name || user?.email?.split('@')[0]}</Text>
        <Text style={styles.username}>@{profile?.username || 'username'}</Text>
        <Text style={styles.userId}>ID: {user?.id?.substring(0, 8) || '123456789'}</Text>
        <Text style={styles.bio}>
          {profile?.bio || '地球での使命：人々の心に光を灯し、内なる平安への道を示すこと'}
        </Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>1.2k</Text>
          <Text style={styles.statLabel}>ファミリー</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>890</Text>
          <Text style={styles.statLabel}>ウォッチ</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>3.4k</Text>
          <Text style={styles.statLabel}>フォロー</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>2.1k</Text>
          <Text style={styles.statLabel}>フォロワー</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  info: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
});
