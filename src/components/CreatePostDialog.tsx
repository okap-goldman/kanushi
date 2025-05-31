import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { VideoPlayer, VideoView } from 'expo-video';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { uploadToB2 } from '../lib/b2Service';
import { type ExtendedEvent, eventService } from '../lib/eventService';
import { type Hashtag, searchHashtags } from '../lib/hashtagService';
import { uploadToSupabaseStorage } from '../lib/storageService';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface CreatePostDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type MediaType = 'text' | 'image' | 'video' | 'audio';

export function CreatePostDialog({ visible, onClose, onSuccess }: CreatePostDialogProps) {
  const [textContent, setTextContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [recordedSound, setRecordedSound] = useState<Audio.Sound | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);

  // Event selection
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [userEvents, setUserEvents] = useState<ExtendedEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Hashtag suggestions
  const [hashtagSuggestions, setHashtagSuggestions] = useState<Hashtag[]>([]);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [hashtagQueryStart, setHashtagQueryStart] = useState(0);

  const { user } = useAuth();

  // Load user's created events on component mount
  React.useEffect(() => {
    if (visible && user) {
      loadUserEvents();
    }
  }, [visible, user]);

  const loadUserEvents = async () => {
    if (!user) return;

    setLoadingEvents(true);
    try {
      const result = await eventService.getUserEvents(user.id, 'created');
      if (result.data) {
        // Filter to only show upcoming events
        const now = new Date();
        const upcomingEvents = result.data.filter((event) => new Date(event.start_date) > now);
        setUserEvents(upcomingEvents);
      }
    } catch (error) {
      console.error('Error loading user events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setImageUri(url);
        }
      };
      input.click();
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      // Web環境では、カメラ入力を使用
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      (input as any).capture = 'environment'; // カメラを使用
      input.onchange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setImageUri(url);
        }
      };
      input.click();
    } else {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    }
  };

  const takeVideo = async () => {
    if (Platform.OS === 'web') {
      // Web環境では、ビデオ入力を使用
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      (input as any).capture = 'environment'; // カメラを使用
      input.onchange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setVideoUri(url);
        }
      };
      input.click();
    } else {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        videoMaxDuration: 60,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setVideoUri(result.assets[0].uri);
      }
    }
  };

  const pickVideo = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.onchange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setVideoUri(url);
        }
      };
      input.click();
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets.length > 0) {
        setVideoUri(result.assets[0].uri);
      }
    }
  };

  const pickAudio = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*';
      input.onchange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setAudioUri(url);
        }
      };
      input.click();
    } else {
      // Use DocumentPicker for audio files
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsEditing: false,
          quality: 1,
        });

        if (!result.canceled && result.assets.length > 0) {
          const asset = result.assets[0];
          // Check if it's an audio file
          if (asset.type === 'video' && asset.fileName?.match(/\.(mp3|wav|m4a|aac|ogg)$/i)) {
            setAudioUri(asset.uri);
          } else if (asset.fileName?.match(/\.(mp3|wav|m4a|aac|ogg)$/i)) {
            setAudioUri(asset.uri);
          } else {
            Alert.alert('エラー', '音声ファイルを選択してください。');
          }
        }
      } catch (error) {
        console.error('Error picking audio:', error);
        Alert.alert('エラー', '音声ファイルの選択に失敗しました。');
      }
    }
  };

  const startRecording = async () => {
    if (Platform.OS === 'web') {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('MediaDevices API is not supported');
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (event) => {
          chunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/wav' });
          const url = URL.createObjectURL(blob);
          setAudioUri(url);
          stream.getTracks().forEach((track) => track.stop());
        };

        setRecording(mediaRecorder);
        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to start recording', err);
        Alert.alert('エラー', 'マイクへのアクセスが許可されていません。');
      }
    } else {
      try {
        await Audio.requestPermissionsAsync();
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
      }
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);

    if (Platform.OS === 'web') {
      if (recording instanceof MediaRecorder) {
        recording.stop();
        setRecording(null);
      }
    } else {
      await recording.stopAndUnloadAsync();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);

      // Load the recorded audio for playback
      if (uri) {
        try {
          const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
          setRecordedSound(sound);
        } catch (error) {
          console.error('Error loading recorded audio:', error);
        }
      }
    }
  };

  const handleMicButton = () => {
    if (Platform.OS === 'web') {
      pickAudio();
    } else {
      Alert.alert(
        '音声を追加',
        '音声を録音するか、ファイルから選択してください',
        [
          {
            text: 'キャンセル',
            style: 'cancel',
          },
          {
            text: '録音する',
            onPress: startRecording,
          },
          {
            text: 'ファイルから選択',
            onPress: pickAudio,
          },
        ],
        { cancelable: true }
      );
    }
  };

  const pickMedia = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.onchange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          if (file.type.startsWith('image/')) {
            setImageUri(url);
          } else if (file.type.startsWith('video/')) {
            setVideoUri(url);
          }
        }
      };
      input.click();
    } else {
      Alert.alert(
        '画像・動画を追加',
        'カメラで撮影するか、ファイルから選択してください',
        [
          {
            text: 'キャンセル',
            style: 'cancel',
          },
          {
            text: '写真を撮影',
            onPress: takePhoto,
          },
          {
            text: '動画を撮影',
            onPress: takeVideo,
          },
          {
            text: '画像を選択',
            onPress: pickImage,
          },
          {
            text: '動画を選択',
            onPress: pickVideo,
          },
        ],
        { cancelable: true }
      );
    }
  };

  const handleCameraButton = () => {
    pickMedia();
  };

  // Hashtag suggestion logic
  const detectHashtagQuery = (text: string, cursorPosition: number) => {
    if (!text || cursorPosition < 0) {
      setShowHashtagSuggestions(false);
      return;
    }

    // Find the last # before cursor position
    let hashPosition = -1;
    for (let i = cursorPosition - 1; i >= 0; i--) {
      if (text[i] === '#') {
        hashPosition = i;
        break;
      }
      if (text[i] === ' ' || text[i] === '\n') {
        break;
      }
    }

    if (hashPosition === -1) {
      setShowHashtagSuggestions(false);
      return;
    }

    // Extract query from # to cursor
    const query = text.substring(hashPosition + 1, cursorPosition);

    // Check if there's a space in the query (indicates end of hashtag)
    if (query.includes(' ') || query.includes('\n')) {
      setShowHashtagSuggestions(false);
      return;
    }

    if (query.length >= 2) {
      setHashtagQueryStart(hashPosition);
      searchAndShowHashtags(query);
    } else {
      setShowHashtagSuggestions(false);
    }
  };

  const searchAndShowHashtags = async (query: string) => {
    try {
      const result = await searchHashtags(query, 5);
      setHashtagSuggestions(result.hashtags);
      setShowHashtagSuggestions(result.hashtags.length > 0);
    } catch (error) {
      console.error('Error searching hashtags:', error);
      setShowHashtagSuggestions(false);
    }
  };

  const insertHashtag = (hashtag: string) => {
    const currentCursor = textContent.length; // Fallback cursor position
    const beforeHashtag = textContent.substring(0, hashtagQueryStart);
    const afterCursor = textContent.substring(currentCursor);
    const newText = `${beforeHashtag}#${hashtag} ${afterCursor}`;

    setTextContent(newText);
    setShowHashtagSuggestions(false);
  };

  const handleTextChange = (text: string) => {
    setTextContent(text);
    // Use text length as cursor position approximation
    detectHashtagQuery(text, text.length);
  };

  const resetForm = async () => {
    setTextContent('');
    setImageUri(null);
    setVideoUri(null);
    setAudioUri(null);
    setSelectedEventId(null);
    setHashtagSuggestions([]);
    setShowHashtagSuggestions(false);

    // Cleanup recorded sound
    if (recordedSound) {
      await recordedSound.unloadAsync();
      setRecordedSound(null);
    }
    setIsPlayingRecorded(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const canSubmit = (): boolean => {
    return (
      textContent.trim().length > 0 || imageUri !== null || videoUri !== null || audioUri !== null
    );
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);

    try {
      let mediaUrl = null;
      let audioUrl = null;
      let contentType: MediaType = 'text';

      // Determine content type based on what's present
      if (audioUri) {
        contentType = 'audio';
      } else if (videoUri) {
        contentType = 'video';
      } else if (imageUri) {
        contentType = 'image';
      }

      // Upload media based on type
      if (imageUri) {
        try {
          // Convert URI to File object for upload
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const file = new File([blob], `image_${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });

          // Try Supabase Storage first (more reliable for local development)
          let result = await uploadToSupabaseStorage(file, 'posts');
          if (!result.success) {
            result = await uploadToB2(file, 'posts');
            if (!result.success)
              throw new Error(`Both upload methods failed. Last error: ${result.error}`);
          }
          mediaUrl = result.url;
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          throw new Error(
            `画像のアップロードに失敗しました: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`
          );
        }
      } else if (videoUri) {
        try {
          const response = await fetch(videoUri);
          const blob = await response.blob();
          const file = new File([blob], `video_${Date.now()}.mp4`, {
            type: 'video/mp4',
          });

          // Try Supabase Storage first (more reliable for local development)
          let result = await uploadToSupabaseStorage(file, 'posts');
          if (!result.success) {
            result = await uploadToB2(file, 'posts');
            if (!result.success)
              throw new Error(`Both upload methods failed. Last error: ${result.error}`);
          }
          mediaUrl = result.url;
        } catch (uploadError) {
          console.error('Video upload error:', uploadError);
          throw new Error(
            `動画のアップロードに失敗しました: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`
          );
        }
      } else if (audioUri) {
        try {
          const response = await fetch(audioUri);
          const blob = await response.blob();
          const file = new File([blob], `audio_${Date.now()}.m4a`, {
            type: 'audio/m4a',
          });

          // Try Supabase Storage first (more reliable for local development)
          let result = await uploadToSupabaseStorage(file, 'posts');
          if (!result.success) {
            result = await uploadToB2(file, 'posts');
            if (!result.success)
              throw new Error(`Both upload methods failed. Last error: ${result.error}`);
          }
          audioUrl = result.url;
        } catch (uploadError) {
          console.error('Audio upload error:', uploadError);
          throw new Error(
            `音声のアップロードに失敗しました: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`
          );
        }
      }

      // Prepare post data
      const postData = {
        user_id: user.id,
        content_type: contentType,
        text_content: textContent,
        media_url: mediaUrl,
        audio_url: audioUrl,
        event_id: selectedEventId,
      };

      // Save post to Supabase
      const { success, error } = await savePost(postData);

      if (error) throw error;

      if (success) {
        resetForm();
        onSuccess();
      }
    } catch (err) {
      console.error('Error creating post:', err);
      Alert.alert(
        'エラー',
        err instanceof Error ? err.message : '投稿の作成に失敗しました。もう一度お試しください。'
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper function to save post
  const _formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const savePost = async (postData: any) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: postData.user_id,
          content_type: postData.content_type,
          text_content: postData.text_content,
          media_url: postData.media_url,
          audio_url: postData.audio_url,
          event_id: postData.event_id,
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      return { success: true, error: null, data };
    } catch (error) {
      console.error('Post save error:', error);
      return { success: false, error: error as Error, data: null };
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Feather name="x" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>投稿を作成</Text>
          <Button
            onPress={handleSubmit}
            size="sm"
            disabled={loading || !canSubmit()}
            loading={loading}
          >
            投稿
          </Button>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Main Text Input */}
          <View style={styles.textContent}>
            <Input
              placeholder="今何を思っていますか？"
              value={textContent}
              onChangeText={handleTextChange}
              multiline
              inputStyle={styles.textInput}
            />

            {/* Hashtag Suggestions */}
            {showHashtagSuggestions && hashtagSuggestions.length > 0 && (
              <View style={styles.hashtagSuggestions}>
                {hashtagSuggestions.map((hashtag) => (
                  <TouchableOpacity
                    key={hashtag.id}
                    style={styles.hashtagSuggestionItem}
                    onPress={() => insertHashtag(hashtag.name)}
                  >
                    <Text style={styles.hashtagSuggestionText}>#{hashtag.name}</Text>
                    <Text style={styles.hashtagUseCount}>{hashtag.use_count}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Event Selection */}
          {userEvents.length > 0 && (
            <View style={styles.eventSelection}>
              <Text style={styles.sectionTitle}>開催中のイベント（任意）</Text>
              <Select
                value={selectedEventId || ''}
                onValueChange={(value) => setSelectedEventId(value || null)}
                placeholder="イベントを選択してください"
                disabled={loadingEvents}
              >
                <Select.Trigger>
                  <Select.Value placeholder="イベントを選択してください" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="">イベントを選択しない</Select.Item>
                  {userEvents.map((event) => (
                    <Select.Item key={event.id} value={event.id}>
                      {event.title} - {new Date(event.start_date).toLocaleDateString()}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </View>
          )}

          {/* Media Buttons */}
          <View style={styles.mediaButtons}>
            <TouchableOpacity style={styles.mediaButton} onPress={handleCameraButton}>
              <Feather name="camera" size={24} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaButton} onPress={handleMicButton}>
              <Feather name="folder" size={24} color="#64748B" />
            </TouchableOpacity>
            {Platform.OS === 'web' && (
              <TouchableOpacity
                style={[styles.mediaButton, isRecording && styles.recordingButtonActive]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Feather
                  name={isRecording ? 'square' : 'mic'}
                  size={20}
                  color={isRecording ? '#FFFFFF' : '#64748B'}
                />
                {isRecording && <Text style={styles.recordingTextSmall}>録音中</Text>}
              </TouchableOpacity>
            )}
          </View>

          {/* Media Preview Area */}
          {(imageUri || videoUri || audioUri) && (
            <View style={styles.mediaPreview}>
              {imageUri && (
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.imagePreview}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={() => setImageUri(null)}
                  >
                    <Feather name="x" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

              {videoUri && (
                <View style={styles.previewContainer}>
                  <VideoView
                    player={React.useMemo(() => {
                      const player = new VideoPlayer(videoUri);
                      return player;
                    }, [videoUri])}
                    style={styles.videoPreview}
                    nativeControls={true}
                    contentFit="contain"
                  />
                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={() => setVideoUri(null)}
                  >
                    <Feather name="x" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

              {audioUri && (
                <View style={styles.audioPreviewContainer}>
                  <View style={styles.audioPreview}>
                    <Feather name="music" size={40} color="#6366F1" />
                    <Text style={styles.audioText}>音声が録音されました</Text>
                  </View>

                  <View style={styles.audioControls}>
                    <TouchableOpacity
                      style={styles.playButton}
                      onPress={async () => {
                        if (!recordedSound) return;

                        try {
                          if (isPlayingRecorded) {
                            await recordedSound.pauseAsync();
                            setIsPlayingRecorded(false);
                          } else {
                            await recordedSound.playAsync();
                            setIsPlayingRecorded(true);

                            recordedSound.setOnPlaybackStatusUpdate((status) => {
                              if (status.isLoaded && status.didJustFinish) {
                                setIsPlayingRecorded(false);
                              }
                            });
                          }
                        } catch (error) {
                          console.error('Error playing audio:', error);
                        }
                      }}
                      disabled={!recordedSound}
                    >
                      <Feather
                        name={isPlayingRecorded ? 'pause' : 'play'}
                        size={24}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={async () => {
                      if (recordedSound) {
                        await recordedSound.unloadAsync();
                        setRecordedSound(null);
                      }
                      setAudioUri(null);
                      setIsPlayingRecorded(false);
                    }}
                  >
                    <Feather name="x" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  mediaButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  mediaButton: {
    padding: 12,
    marginRight: 16,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  recordingButtonActive: {
    backgroundColor: '#E53E3E',
    borderColor: '#E53E3E',
  },
  recordingTextSmall: {
    fontSize: 10,
    color: '#FFFFFF',
    marginTop: 2,
    fontWeight: '500',
  },
  mediaPreview: {
    marginTop: 16,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hashtagSuggestions: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  hashtagSuggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  hashtagSuggestionText: {
    fontSize: 16,
    color: '#0070F3',
    fontWeight: '500',
  },
  hashtagUseCount: {
    fontSize: 12,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  textContent: {
    flex: 1,
  },
  textInput: {
    minHeight: 150,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  mediaContent: {
    flex: 1,
  },
  mediaSelector: {
    height: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mediaSelectorText: {
    marginTop: 8,
    fontSize: 16,
    color: '#64748B',
  },
  previewContainer: {
    marginBottom: 16,
  },
  imagePreview: {
    height: 200,
    borderRadius: 8,
  },
  videoPreview: {
    height: 200,
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  changeButton: {
    marginTop: 8,
    alignSelf: 'center',
  },
  changeButtonText: {
    color: '#0070F3',
    fontWeight: '500',
  },
  audioPreview: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  audioText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '500',
  },
  captionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  recordContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0070F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  recordButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E53E3E',
    marginRight: 8,
  },
  recordingText: {
    color: '#E53E3E',
    fontWeight: '500',
  },
  audioPreviewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  audioWaveform: {
    width: '100%',
    height: 60,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  audioWave: {
    height: 2,
    width: '80%',
    backgroundColor: '#0070F3',
  },
  tagsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    marginBottom: 0,
  },
  addTagButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0070F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#0070F3',
    fontSize: 14,
  },
  removeTagButton: {
    marginLeft: 4,
    padding: 2,
  },
  audioControls: {
    width: '100%',
    marginVertical: 16,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  progressContainer: {
    width: '100%',
  },
  progressSlider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
  },
  eventSelection: {
    marginVertical: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  reRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    marginTop: 8,
  },
  reRecordButtonText: {
    color: '#6366F1',
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 14,
  },
});
