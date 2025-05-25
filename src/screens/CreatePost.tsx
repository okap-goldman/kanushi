import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { Button } from '../components/ui/Button';

type MediaType = 'text' | 'image' | 'audio';

export default function CreatePost() {
  const [activeType, setActiveType] = useState<MediaType>('text');
  const [textContent, setTextContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [showHashtagWarning, setShowHashtagWarning] = useState(false);
  const [loading, setLoading] = useState(false);

  const MAX_CHARS = 10000;
  const MAX_HASHTAGS = 5;

  const characterCount = textContent.length;
  const isTextTooLong = characterCount > MAX_CHARS;
  const canSubmit = !isTextTooLong && 
    (activeType !== 'text' || textContent.trim().length > 0) &&
    !loading;

  const handleTypeChange = (type: MediaType) => {
    setActiveType(type);
    // Reset other states when switching type
    if (type !== 'text') {
      setTextContent('');
    }
    if (type !== 'image') {
      setImageUri(null);
    }
    if (type !== 'audio') {
      setAudioUri(null);
      if (recording) {
        recording.stopAndUnloadAsync();
        setRecording(null);
      }
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

  // Hashtag functions
  const addHashtag = () => {
    const tag = hashtagInput.trim();
    if (!tag) return;

    if (hashtags.length >= MAX_HASHTAGS) {
      setShowHashtagWarning(true);
      setTimeout(() => setShowHashtagWarning(false), 3000);
      return;
    }

    if (!hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
    setHashtagInput('');
  };

  const removeHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
    setShowHashtagWarning(false);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      // Simulate post submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      setTextContent('');
      setImageUri(null);
      setAudioUri(null);
      setHashtags([]);
      setHashtagInput('');
      setActiveType('text');
      
      console.log('Post submitted successfully');
    } catch (error) {
      console.error('Error submitting post:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeType) {
      case 'text':
        return (
          <View style={styles.textSection}>
            <TextInput
              style={[
                styles.textInput,
                isTextTooLong && styles.textInputError
              ]}
              placeholder="今何を考えていますか？"
              value={textContent}
              onChangeText={setTextContent}
              multiline
              textAlignVertical="top"
              testID="text-input"
            />
            <View style={styles.charCountContainer}>
              <Text
                style={[
                  styles.charCount,
                  isTextTooLong && styles.charCountError
                ]}
                testID="char-count"
              >
                {characterCount} / {MAX_CHARS}
              </Text>
            </View>
          </View>
        );

      case 'image':
        return (
          <View style={styles.imageSection}>
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: imageUri }}
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
                </View>
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
                  style={[
                    styles.recordButton,
                    isRecording && styles.recordButtonActive
                  ]}
                  onPress={isRecording ? stopRecording : startRecording}
                  testID={isRecording ? "stop-button" : "record-button"}
                >
                  <Feather
                    name={isRecording ? "square" : "mic"}
                    size={24}
                    color="#FFFFFF"
                  />
                  <Text style={styles.recordButtonText}>
                    {isRecording ? "録音停止" : "録音開始"}
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
          投稿
        </Button>
      </View>

      {/* Type Selector */}
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            activeType === 'text' && styles.activeTypeButton
          ]}
          onPress={() => handleTypeChange('text')}
        >
          <Text style={[
            styles.typeButtonText,
            activeType === 'text' && styles.activeTypeButtonText
          ]}>
            テキスト投稿
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.typeButton,
            activeType === 'image' && styles.activeTypeButton
          ]}
          onPress={() => handleTypeChange('image')}
        >
          <Text style={[
            styles.typeButtonText,
            activeType === 'image' && styles.activeTypeButtonText
          ]}>
            画像投稿
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.typeButton,
            activeType === 'audio' && styles.activeTypeButton
          ]}
          onPress={() => handleTypeChange('audio')}
        >
          <Text style={[
            styles.typeButtonText,
            activeType === 'audio' && styles.activeTypeButtonText
          ]}>
            音声投稿
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {renderContent()}

        {/* Hashtag Section */}
        <View style={styles.hashtagSection}>
          <Text style={styles.hashtagTitle}>ハッシュタグ</Text>
          
          <View style={styles.hashtagInputContainer}>
            <TextInput
              style={styles.hashtagInput}
              placeholder="ハッシュタグを入力"
              value={hashtagInput}
              onChangeText={setHashtagInput}
              onSubmitEditing={addHashtag}
              testID="hashtag-input"
            />
            <TouchableOpacity
              style={[
                styles.addHashtagButton,
                !hashtagInput.trim() && styles.addHashtagButtonDisabled
              ]}
              onPress={addHashtag}
              disabled={!hashtagInput.trim()}
              testID="add-hashtag-button"
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {showHashtagWarning && (
            <Text style={styles.warningText} testID="hashtag-limit-warning">
              ハッシュタグは最大{MAX_HASHTAGS}個まで追加できます
            </Text>
          )}

          <View style={styles.hashtagsList}>
            {hashtags.map((tag, index) => (
              <View key={index} style={styles.hashtagChip} testID={`hashtag-chip-${index}`}>
                <Text style={styles.hashtagText}>#{tag}</Text>
                <TouchableOpacity
                  onPress={() => removeHashtag(tag)}
                  style={styles.removeHashtagButton}
                >
                  <Feather name="x" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
  hashtagSection: {
    marginTop: 24,
  },
  hashtagTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  hashtagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hashtagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  addHashtagButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0070F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addHashtagButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  warningText: {
    fontSize: 12,
    color: '#EF4444',
    marginBottom: 8,
  },
  hashtagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hashtagText: {
    fontSize: 14,
    color: '#4338CA',
    marginRight: 4,
  },
  removeHashtagButton: {
    padding: 2,
  },
});