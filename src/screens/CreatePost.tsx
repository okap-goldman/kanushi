import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { Button } from '../components/ui/Button';
import ImageEditor from '../components/ImageEditor';

type MediaType = 'text' | 'image' | 'audio';
type PostType = 'post' | 'story';

export default function CreatePost() {
  const [activeType, setActiveType] = useState<MediaType>('text');
  const [postType, setPostType] = useState<PostType>('post');
  const [textContent, setTextContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editedImageUri, setEditedImageUri] = useState<string | null>(null);

  const MAX_CHARS = 10000;

  const characterCount = textContent.length;
  const isTextTooLong = characterCount > MAX_CHARS;
  
  // Extract hashtags from text content
  const extractedHashtags = textContent.match(/#[^\s#]+/g) || [];
  
  const canSubmit =
    !isTextTooLong && (activeType !== 'text' || textContent.trim().length > 0) && !loading;

  const handleTypeChange = (type: MediaType) => {
    setActiveType(type);
    // Reset other states when switching type
    if (type !== 'text') {
      setTextContent('');
    }
    if (type !== 'image') {
      setImageUri(null);
      setEditedImageUri(null);
    }
    if (type !== 'audio') {
      setAudioUri(null);
      if (recording) {
        recording.stopAndUnloadAsync();
        setRecording(null);
      }
    }
    // Reset to post when changing from image to other types
    if (type !== 'image' && postType === 'story') {
      setPostType('post');
    }
  };

  // Camera functions
  const takePicture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('カメラの許可が必要です');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets?.[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
    }
  };

  const selectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets?.[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
    }
  };

  // Audio functions
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('マイクの許可が必要です');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const result = await recording.getStatusAsync();
      const uri = recording.getURI();

      if (uri) {
        setAudioUri(uri);
      }

      setRecording(null);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const selectAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
      });

      if (!result.canceled && result.assets?.[0]) {
        setAudioUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting audio file:', error);
    }
  };


  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      // Prepare submission data
      const submissionData = {
        type: postType,
        mediaType: activeType,
        textContent: activeType === 'text' ? textContent : undefined,
        imageUri: activeType === 'image' ? (editedImageUri || imageUri) : undefined,
        audioUri: activeType === 'audio' ? audioUri : undefined,
        hashtags: extractedHashtags,
      };

      // Simulate post/story submission
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Submitting:', submissionData);

      // Reset form
      setTextContent('');
      setImageUri(null);
      setEditedImageUri(null);
      setAudioUri(null);
      setActiveType('text');
      setPostType('post');

      console.log(`${postType === 'story' ? 'Story' : 'Post'} submitted successfully`);
    } catch (error) {
      console.error('Error submitting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageEditorSave = (editedUri: string) => {
    setEditedImageUri(editedUri);
    setIsEditingImage(false);
  };

  const handleImageEditorCancel = () => {
    setIsEditingImage(false);
  };

  const renderContent = () => {
    switch (activeType) {
      case 'text':
        return (
          <View style={styles.textSection}>
            <TextInput
              style={[styles.textInput, isTextTooLong && styles.textInputError]}
              placeholder="今何を考えていますか？ #ハッシュタグ を使って投稿をカテゴライズできます"
              value={textContent}
              onChangeText={setTextContent}
              multiline
              textAlignVertical="top"
              testID="text-input"
            />
            <View style={styles.charCountContainer}>
              <Text
                style={[styles.charCount, isTextTooLong && styles.charCountError]}
                testID="char-count"
              >
                {characterCount} / {MAX_CHARS}
              </Text>
            </View>
            {extractedHashtags.length > 0 && (
              <View style={styles.extractedHashtags}>
                <Text style={styles.hashtagsLabel}>検出されたハッシュタグ:</Text>
                <View style={styles.hashtagsList}>
                  {extractedHashtags.map((tag, index) => (
                    <View key={index} style={styles.hashtagChip}>
                      <Text style={styles.hashtagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        );

      case 'image':
        return (
          <View style={styles.imageSection}>
            {/* Post Type Selector for Image */}
            <View style={styles.postTypeSelector}>
              <TouchableOpacity
                style={[styles.postTypeButton, postType === 'post' && styles.activePostTypeButton]}
                onPress={() => setPostType('post')}
              >
                <Feather name="file-text" size={20} color={postType === 'post' ? '#FFFFFF' : '#6B7280'} />
                <Text style={[styles.postTypeText, postType === 'post' && styles.activePostTypeText]}>
                  通常投稿
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.postTypeButton, postType === 'story' && styles.activePostTypeButton]}
                onPress={() => setPostType('story')}
              >
                <Feather name="clock" size={20} color={postType === 'story' ? '#FFFFFF' : '#6B7280'} />
                <Text style={[styles.postTypeText, postType === 'story' && styles.activePostTypeText]}>
                  ストーリー (24時間)
                </Text>
              </TouchableOpacity>
            </View>

            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: editedImageUri || imageUri }}
                  style={styles.imagePreview}
                  testID="image-preview"
                />
                <View style={styles.imageActions}>
                  <Button onPress={takePicture} variant="outline" size="sm">
                    再撮影
                  </Button>
                  <Button onPress={selectFromGallery} variant="outline" size="sm">
                    別の画像を選択
                  </Button>
                  <Button 
                    onPress={() => setIsEditingImage(true)} 
                    variant="outline" 
                    size="sm"
                    style={styles.editButton}
                  >
                    <Feather name="edit-2" size={16} /> 編集
                  </Button>
                </View>
                {postType === 'story' && (
                  <Text style={styles.storyNote}>
                    ストーリーは24時間後に自動的に削除されます
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.imageSelector}>
                <TouchableOpacity
                  style={styles.imageOption}
                  onPress={takePicture}
                  testID="camera-button"
                >
                  <Feather name="camera" size={40} color="#0070F3" />
                  <Text style={styles.imageOptionText}>カメラで撮影</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.imageOption}
                  onPress={selectFromGallery}
                  testID="gallery-button"
                >
                  <Feather name="image" size={40} color="#0070F3" />
                  <Text style={styles.imageOptionText}>ギャラリーから選択</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      case 'audio':
        return (
          <View style={styles.audioSection}>
            {audioUri ? (
              <View style={styles.audioPreviewContainer}>
                <View style={styles.audioPreview} testID="audio-preview">
                  <Feather name="music" size={40} color="#0070F3" />
                  <Text style={styles.audioPreviewText}>音声が録音されました</Text>
                </View>
                <View style={styles.audioActions}>
                  <Button
                    onPress={startRecording}
                    variant="outline"
                    size="sm"
                    testID="record-button"
                  >
                    再録音
                  </Button>
                  <Button
                    onPress={selectAudioFile}
                    variant="outline"
                    size="sm"
                    testID="file-select-button"
                  >
                    ファイル選択
                  </Button>
                </View>
              </View>
            ) : (
              <View style={styles.audioRecorder}>
                {isRecording && (
                  <View style={styles.recordingIndicator} testID="recording-indicator">
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingText}>録音中...</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                  onPress={isRecording ? stopRecording : startRecording}
                  testID={isRecording ? 'stop-button' : 'record-button'}
                >
                  <Feather name={isRecording ? 'square' : 'mic'} size={24} color="#FFFFFF" />
                  <Text style={styles.recordButtonText}>
                    {isRecording ? '録音停止' : '録音開始'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.orText}>または</Text>

                <TouchableOpacity
                  style={styles.fileSelectButton}
                  onPress={selectAudioFile}
                  testID="file-select-button"
                >
                  <Feather name="upload" size={20} color="#0070F3" />
                  <Text style={styles.fileSelectText}>ファイルを選択</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>投稿作成</Text>
        <Button
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={loading}
          size="sm"
          testID="submit-button"
        >
          {postType === 'story' ? 'ストーリーを投稿' : '投稿'}
        </Button>
      </View>

      {/* Type Selector */}
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeButton, activeType === 'text' && styles.activeTypeButton]}
          onPress={() => handleTypeChange('text')}
        >
          <Text
            style={[styles.typeButtonText, activeType === 'text' && styles.activeTypeButtonText]}
          >
            テキスト投稿
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, activeType === 'image' && styles.activeTypeButton]}
          onPress={() => handleTypeChange('image')}
        >
          <Text
            style={[styles.typeButtonText, activeType === 'image' && styles.activeTypeButtonText]}
          >
            画像投稿
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, activeType === 'audio' && styles.activeTypeButton]}
          onPress={() => handleTypeChange('audio')}
        >
          <Text
            style={[styles.typeButtonText, activeType === 'audio' && styles.activeTypeButtonText]}
          >
            音声投稿
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {renderContent()}
      </ScrollView>

      {/* Image Editor Modal */}
      <Modal
        visible={isEditingImage}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {imageUri && (
          <ImageEditor
            imageUri={imageUri}
            onSave={handleImageEditorSave}
            onCancel={handleImageEditorCancel}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  typeSelector: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  typeButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTypeButton: {
    borderBottomColor: '#0070F3',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTypeButtonText: {
    color: '#0070F3',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  textSection: {
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  textInputError: {
    borderColor: '#EF4444',
  },
  charCountContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  charCountError: {
    color: '#EF4444',
  },
  imageSection: {
    flex: 1,
  },
  imageSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 40,
  },
  imageOption: {
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  imageOptionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: 300,
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  audioSection: {
    flex: 1,
  },
  audioRecorder: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0070F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 20,
  },
  recordButtonActive: {
    backgroundColor: '#EF4444',
  },
  recordButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  orText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  fileSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#0070F3',
    borderRadius: 8,
  },
  fileSelectText: {
    color: '#0070F3',
    marginLeft: 8,
    fontWeight: '500',
  },
  audioPreviewContainer: {
    alignItems: 'center',
  },
  audioPreview: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 16,
  },
  audioPreviewText: {
    marginTop: 8,
    fontSize: 16,
    color: '#0070F3',
    fontWeight: '500',
  },
  audioActions: {
    flexDirection: 'row',
    gap: 12,
  },
  extractedHashtags: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  hashtagsLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  hashtagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtagChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  hashtagText: {
    fontSize: 12,
    color: '#4338CA',
  },
  postTypeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  postTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  activePostTypeButton: {
    backgroundColor: '#0070F3',
    borderColor: '#0070F3',
  },
  postTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activePostTypeText: {
    color: '#FFFFFF',
  },
  storyNote: {
    marginTop: 12,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
