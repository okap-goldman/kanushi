import { useNavigation } from '@react-navigation/native';
import * as Audio from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Mic, Pause, Play, Save, Square, Upload } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

export function ProfileEdit() {
  const navigation = useNavigation();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [avatar, setAvatar] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Audio recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (profile) {
      setAvatar(profile.image || '');
      setName(profile.name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need camera roll permissions to upload your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need microphone permissions to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      toast({
        title: 'エラー',
        description: '録音の開始に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedAudioUri(uri);
      setRecording(null);
      setIsRecording(false);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const playRecordedAudio = async () => {
    if (!recordedAudioUri) return;

    try {
      if (sound && isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        if (sound) {
          await sound.unloadAsync();
        }
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: recordedAudioUri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (err) {
      console.error('Failed to play audio', err);
    }
  };

  const uploadFile = async (
    uri: string,
    folder: string
  ): Promise<{ url?: string; error?: Error }> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const fileExt = uri.split('.').pop() || 'jpg';

      const { data, error } = await supabase.storage
        .from('media')
        .upload(`${folder}/${fileName}.${fileExt}`, blob);

      if (error) throw error;

      const { data: publicUrl } = supabase.storage.from('media').getPublicUrl(data.path);

      return { url: publicUrl.publicUrl };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      let imageUrl = profile?.image || '';

      // Upload avatar if changed
      if (avatar && avatar !== profile?.image && avatar.startsWith('file://')) {
        const result = await uploadFile(avatar, 'avatars');
        if (result.error) throw result.error;
        if (result.url) imageUrl = result.url;
      }

      // Upload audio if recorded
      let audioUrl = profile?.audio_url || '';
      if (recordedAudioUri) {
        const result = await uploadFile(recordedAudioUri, 'audio');
        if (result.error) throw result.error;
        if (result.url) audioUrl = result.url;
      }

      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          username,
          bio,
          image: imageUrl,
          audio_url: audioUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: '保存完了',
        description: 'プロフィールが更新されました',
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'エラー',
        description: 'プロフィールの保存中にエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>プロフィール編集</Text>
        <TouchableOpacity onPress={saveProfile} disabled={isLoading}>
          <Save size={24} color={isLoading ? '#ccc' : '#6366f1'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} disabled={isLoading}>
            <Avatar
              source={{
                uri: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`,
              }}
              style={styles.avatar}
              fallback={name?.[0] || user?.email?.[0] || 'U'}
            />
            <View style={styles.uploadButton}>
              <Upload size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>名前</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="名前を入力"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ユーザーネーム</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="ユーザーネームを入力"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ユーザーID</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={user?.id || ''}
              editable={false}
            />
            <Text style={styles.helpText}>ユーザーIDは変更できません</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>自己紹介</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={bio}
              onChangeText={setBio}
              placeholder="自己紹介を入力"
              multiline
              numberOfLines={4}
              editable={!isLoading}
            />
          </View>

          <Card style={styles.audioCard}>
            <Text style={styles.audioTitle}>自己紹介音声</Text>
            <Text style={styles.audioDescription}>
              プロフィールに表示される自己紹介音声を録音します
            </Text>

            <View style={styles.audioButtons}>
              {!isRecording ? (
                <Button variant="outline" onPress={startRecording} disabled={isLoading}>
                  <Mic size={16} color="#6366f1" style={{ marginRight: 8 }} />
                  録音開始
                </Button>
              ) : (
                <Button variant="destructive" onPress={stopRecording} disabled={isLoading}>
                  <Square size={16} color="#fff" style={{ marginRight: 8 }} />
                  録音停止
                </Button>
              )}

              {recordedAudioUri && (
                <Button
                  variant="outline"
                  onPress={playRecordedAudio}
                  disabled={isRecording || isLoading}
                >
                  {isPlaying ? (
                    <Pause size={16} color="#6366f1" style={{ marginRight: 8 }} />
                  ) : (
                    <Play size={16} color="#6366f1" style={{ marginRight: 8 }} />
                  )}
                  {isPlaying ? '再生停止' : '再生'}
                </Button>
              )}
            </View>

            {(recordedAudioUri || profile?.audio_url) && (
              <Text style={styles.audioStatus}>✅ 録音済み</Text>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  uploadButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366f1',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  formSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  audioCard: {
    padding: 16,
    marginTop: 8,
  },
  audioTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  audioDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  audioButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  audioStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
});
