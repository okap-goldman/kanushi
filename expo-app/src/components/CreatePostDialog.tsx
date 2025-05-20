import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-audio';
import { Video } from 'expo-video';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface CreatePostDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type MediaType = 'text' | 'image' | 'video' | 'audio';

export function CreatePostDialog({ visible, onClose, onSuccess }: CreatePostDialogProps) {
  const [activeTab, setActiveTab] = useState<MediaType>('text');
  const [textContent, setTextContent] = useState('');
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<any | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const pickVideo = async () => {
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
  };

  const startRecording = async () => {
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
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    
    const uri = recording.getURI();
    setAudioUri(uri);
    setRecording(null);
    
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    
    const newTag = tagInput.trim().toLowerCase();
    if (!tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const resetForm = () => {
    setActiveTab('text');
    setTextContent('');
    setCaption('');
    setImageUri(null);
    setVideoUri(null);
    setAudioUri(null);
    setTagInput('');
    setTags([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    if (activeTab === 'text' && !textContent.trim()) {
      // No content to post
      return;
    }

    setLoading(true);

    try {
      let mediaUrl = null;
      let audioUrl = null;
      let contentType = activeTab;

      // Upload media based on type
      if (activeTab === 'image' && imageUri) {
        // Need to convert URI to blob for uploadFile
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const file = {
          name: `image_${Date.now()}.jpg`,
          type: 'image/jpeg',
          uri: imageUri,
        };
        
        const { url, error } = await uploadFile(file, 'media', 'images');
        if (error) throw error;
        mediaUrl = url;
      } else if (activeTab === 'video' && videoUri) {
        const response = await fetch(videoUri);
        const blob = await response.blob();
        const file = {
          name: `video_${Date.now()}.mp4`,
          type: 'video/mp4',
          uri: videoUri,
        };
        
        const { url, error } = await uploadFile(file, 'media', 'videos');
        if (error) throw error;
        mediaUrl = url;
      } else if (activeTab === 'audio' && audioUri) {
        const response = await fetch(audioUri);
        const blob = await response.blob();
        const file = {
          name: `audio_${Date.now()}.m4a`,
          type: 'audio/m4a',
          uri: audioUri,
        };
        
        const { url, error } = await uploadFile(file, 'media', 'audio');
        if (error) throw error;
        audioUrl = url;
      }

      // Prepare post data
      const postData = {
        user_id: user.id,
        content_type: contentType,
        text_content: activeTab === 'text' ? textContent : caption,
        media_url: mediaUrl,
        audio_url: audioUrl,
        tags: tags,
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
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  // Helper function to save post
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
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      // Handle tags if provided
      if (postData.tags && postData.tags.length > 0 && data && data.length > 0) {
        const postId = data[0].id;
        
        for (const tagName of postData.tags) {
          // Check if tag exists
          const { data: existingTag, error: findError } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName)
            .maybeSingle();
          
          if (findError) {
            console.error(`Error finding tag ${tagName}:`, findError);
            continue;
          }
          
          let tagId;
          
          // Create tag if it doesn't exist
          if (!existingTag) {
            const { data: newTag, error: createError } = await supabase
              .from('tags')
              .insert({ name: tagName })
              .select()
              .single();
            
            if (createError) {
              console.error(`Error creating tag ${tagName}:`, createError);
              continue;
            }
            
            tagId = newTag.id;
          } else {
            tagId = existingTag.id;
          }
          
          // Link tag to post
          const { error: linkError } = await supabase
            .from('post_tags')
            .insert({
              post_id: postId,
              tag_id: tagId
            });
          
          if (linkError) {
            console.error(`Error linking tag ${tagName} to post:`, linkError);
          }
        }
      }

      return { success: true, error: null, data };
    } catch (error) {
      console.error('Post save error:', error);
      return { success: false, error: error as Error, data: null };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Feather name="x" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <Button
            onPress={handleSubmit}
            size="sm"
            disabled={loading}
            loading={loading}
          >
            Post
          </Button>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'text' && styles.activeTab]}
            onPress={() => setActiveTab('text')}
          >
            <Feather
              name="type"
              size={20}
              color={activeTab === 'text' ? '#0070F3' : '#64748B'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'text' && styles.activeTabText,
              ]}
            >
              Text
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'image' && styles.activeTab]}
            onPress={() => setActiveTab('image')}
          >
            <Feather
              name="image"
              size={20}
              color={activeTab === 'image' ? '#0070F3' : '#64748B'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'image' && styles.activeTabText,
              ]}
            >
              Image
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'video' && styles.activeTab]}
            onPress={() => setActiveTab('video')}
          >
            <Feather
              name="video"
              size={20}
              color={activeTab === 'video' ? '#0070F3' : '#64748B'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'video' && styles.activeTabText,
              ]}
            >
              Video
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'audio' && styles.activeTab]}
            onPress={() => setActiveTab('audio')}
          >
            <Feather
              name="mic"
              size={20}
              color={activeTab === 'audio' ? '#0070F3' : '#64748B'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'audio' && styles.activeTabText,
              ]}
            >
              Audio
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {activeTab === 'text' && (
            <View style={styles.textContent}>
              <Input
                placeholder="What's on your mind?"
                value={textContent}
                onChangeText={setTextContent}
                multiline
                inputStyle={styles.textInput}
              />
            </View>
          )}

          {activeTab === 'image' && (
            <View style={styles.mediaContent}>
              {imageUri ? (
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.imagePreview}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={styles.changeButton}
                    onPress={pickImage}
                  >
                    <Text style={styles.changeButtonText}>Change Image</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.mediaSelector}
                  onPress={pickImage}
                >
                  <Feather name="image" size={40} color="#94A3B8" />
                  <Text style={styles.mediaSelectorText}>Select Image</Text>
                </TouchableOpacity>
              )}
              
              <Input
                placeholder="Add a caption..."
                value={caption}
                onChangeText={setCaption}
                multiline
                inputStyle={styles.captionInput}
              />
            </View>
          )}

          {activeTab === 'video' && (
            <View style={styles.mediaContent}>
              {videoUri ? (
                <View style={styles.previewContainer}>
                  <Video
                    source={{ uri: videoUri }}
                    style={styles.videoPreview}
                    useNativeControls
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    style={styles.changeButton}
                    onPress={pickVideo}
                  >
                    <Text style={styles.changeButtonText}>Change Video</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.mediaSelector}
                  onPress={pickVideo}
                >
                  <Feather name="video" size={40} color="#94A3B8" />
                  <Text style={styles.mediaSelectorText}>Select Video</Text>
                </TouchableOpacity>
              )}
              
              <Input
                placeholder="Add a caption..."
                value={caption}
                onChangeText={setCaption}
                multiline
                inputStyle={styles.captionInput}
              />
            </View>
          )}

          {activeTab === 'audio' && (
            <View style={styles.mediaContent}>
              {audioUri ? (
                <View style={styles.audioPreviewContainer}>
                  <Audio.Sound source={{ uri: audioUri }} />
                  <View style={styles.audioWaveform}>
                    <View style={styles.audioWave} />
                  </View>
                  <TouchableOpacity
                    style={styles.recordButton}
                    onPress={startRecording}
                  >
                    <Text style={styles.recordButtonText}>Record Again</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.recordContainer}>
                  <TouchableOpacity
                    style={[
                      styles.recordButton,
                      isRecording && styles.recordingButton,
                    ]}
                    onPress={isRecording ? stopRecording : startRecording}
                  >
                    <Feather
                      name={isRecording ? 'square' : 'mic'}
                      size={24}
                      color="#FFFFFF"
                    />
                    <Text style={styles.recordButtonText}>
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </Text>
                  </TouchableOpacity>
                  
                  {isRecording && (
                    <View style={styles.recordingIndicator}>
                      <View style={styles.recordingDot} />
                      <Text style={styles.recordingText}>Recording...</Text>
                    </View>
                  )}
                </View>
              )}
              
              <Input
                placeholder="Add a caption..."
                value={caption}
                onChangeText={setCaption}
                multiline
                inputStyle={styles.captionInput}
              />
            </View>
          )}

          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagInputContainer}>
              <Input
                placeholder="Add tags (press Enter to add)"
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
                containerStyle={styles.tagInput}
              />
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={addTag}
                disabled={!tagInput.trim()}
              >
                <Feather name="plus" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.tagsContainer}>
              {tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                  <TouchableOpacity
                    onPress={() => removeTag(tag)}
                    style={styles.removeTagButton}
                  >
                    <Feather name="x" size={14} color="#64748B" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0070F3',
  },
  tabText: {
    marginLeft: 4,
    color: '#64748B',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#0070F3',
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
  recordingButton: {
    backgroundColor: '#E53E3E',
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
});