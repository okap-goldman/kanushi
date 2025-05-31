import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, Mic, MicOff, Pause, Play, Send, Square, X } from 'lucide-react-native';
import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface CreateStoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    audioFile: { uri: string; type: string; name: string };
    imageFile: { uri: string; type: string; name: string };
    audioTranscript?: string;
    caption: string;
  }) => Promise<void>;
}

export default function CreateStoryDialog({
  isOpen,
  onOpenChange,
  onSubmit,
}: CreateStoryDialogProps) {
  const [currentStep, setCurrentStep] = useState<'audio' | 'image' | 'edit'>('audio');
  const [audioFile, setAudioFile] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [imageFile, setImageFile] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [audioTranscript, setAudioTranscript] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Audio recording states
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, [sound, recording]);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('許可が必要です', 'マイクへのアクセスを許可してください。');
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
      setRecordingDuration(0);

      recordingTimer.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('エラー', '録音を開始できませんでした。');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        setAudioFile({
          uri,
          type: 'audio/mp3',
          name: `story-audio-${Date.now()}.mp3`,
        });
        
        // 手動入力のプロンプトを表示
        setAudioTranscript('');
      }
      
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('エラー', '録音の停止に失敗しました。');
    }
  };

  const playAudio = async () => {
    if (!audioFile) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioFile.uri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Failed to play audio:', error);
      Alert.alert('エラー', '音声の再生に失敗しました。');
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // 編集を無効にして元の比率を保持
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageFile({
        uri: asset.uri,
        type: 'image/jpeg',
        name: `story-${Date.now()}.jpg`,
      });
      setCurrentStep('edit');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('許可が必要です', 'カメラへのアクセスを許可してください。');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false, // 編集を無効にして元の比率を保持
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageFile({
        uri: asset.uri,
        type: 'image/jpeg',
        name: `story-${Date.now()}.jpg`,
      });
      setCurrentStep('edit');
    }
  };

  const resetForm = () => {
    setAudioFile(null);
    setImageFile(null);
    setAudioTranscript('');
    setCaption('');
    setCurrentStep('audio');
    setRecordingDuration(0);
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
    if (recording) {
      recording.stopAndUnloadAsync();
      setRecording(null);
    }
    setIsRecording(false);
    setIsPlaying(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!audioFile || !imageFile) return;

    setIsSubmitting(true);

    try {
      await onSubmit({
        audioFile,
        imageFile,
        audioTranscript,
        caption: '', // キャプションは不要なので空文字列
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating story:', error);
      Alert.alert('エラー', 'ストーリーの作成に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {currentStep === 'audio' && 'ストーリー音声を録音'}
            {currentStep === 'image' && 'ストーリー画像を選択'}
            {currentStep === 'edit' && 'ストーリーを編集'}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Progress indicators */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, currentStep === 'audio' && styles.activeStepDot]} />
          <View style={[styles.stepLine, (currentStep === 'image' || currentStep === 'edit') && styles.activeStepLine]} />
          <View style={[styles.stepDot, (currentStep === 'image' || currentStep === 'edit') && styles.activeStepDot]} />
          <View style={[styles.stepLine, currentStep === 'edit' && styles.activeStepLine]} />
          <View style={[styles.stepDot, currentStep === 'edit' && styles.activeStepDot]} />
        </View>

        <ScrollView style={styles.content}>
          {/* Audio Recording Step */}
          {currentStep === 'audio' && (
            <View style={styles.audioContainer}>
              <Text style={styles.stepTitle}>音声を録音してください</Text>
              
              {!audioFile ? (
                <View style={styles.recordingArea}>
                  <TouchableOpacity
                    style={[styles.recordButton, isRecording && styles.recordingButton]}
                    onPress={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? (
                      <Square size={40} color="#fff" />
                    ) : (
                      <Mic size={40} color="#fff" />
                    )}
                  </TouchableOpacity>
                  
                  <Text style={styles.recordingStatus}>
                    {isRecording ? `録音中 ${formatDuration(recordingDuration)}` : '録音ボタンをタップ'}
                  </Text>
                </View>
              ) : (
                <View style={styles.audioPreview}>
                  <Text style={styles.audioPreviewText}>音声録音完了 ({formatDuration(recordingDuration)})</Text>
                  
                  <View style={styles.audioControls}>
                    <TouchableOpacity
                      style={styles.playButton}
                      onPress={isPlaying ? stopAudio : playAudio}
                    >
                      {isPlaying ? (
                        <Pause size={24} color="#000" />
                      ) : (
                        <Play size={24} color="#000" />
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.rerecordButton}
                      onPress={() => {
                        setAudioFile(null);
                        setAudioTranscript('');
                        setRecordingDuration(0);
                      }}
                    >
                      <Text style={styles.rerecordButtonText}>再録音</Text>
                    </TouchableOpacity>
                  </View>
                  
                  
                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={() => setCurrentStep('image')}
                  >
                    <Text style={styles.nextButtonText}>次へ</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Image Selection Step */}
          {currentStep === 'image' && (
            <View style={styles.imageContainer}>
              <Text style={styles.stepTitle}>画像を選択してください</Text>
              
              {!imageFile ? (
                <View style={styles.imageSelectionArea}>
                  <Text style={styles.imageSelectionText}>画像を選択してください</Text>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                      <ImageIcon size={20} color="#000" />
                      <Text style={styles.uploadButtonText}>ギャラリー</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                      <Camera size={20} color="#000" />
                      <Text style={styles.uploadButtonText}>撮影</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.imagePreview}>
                  <View style={styles.squarePreviewContainer}>
                  <Image source={{ uri: imageFile.uri }} style={styles.squarePreview} resizeMode="contain" />
                </View>
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={() => setImageFile(null)}
                  >
                    <Text style={styles.changeImageButtonText}>画像を変更</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.navigationButtons}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setCurrentStep('audio')}
                >
                  <Text style={styles.backButtonText}>戻る</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Edit Step */}
          {currentStep === 'edit' && (
            <View style={styles.editContainer}>
              <Text style={styles.stepTitle}>ストーリーをプレビュー</Text>
              
              <View style={styles.storyPreview}>
                {/* Square image at top */}
                <View style={styles.imageSection}>
                  <View style={styles.finalPreviewContainer}>
                    <Image source={{ uri: imageFile?.uri }} style={styles.finalPreview} resizeMode="contain" />
                  </View>
                </View>
                
                {/* Manual text input at bottom */}
                <View style={styles.transcriptSection}>
                  <Text style={styles.transcriptLabel}>音声に合わせてテキストを入力してください:</Text>
                  <TextInput
                    style={styles.transcriptInput}
                    placeholder="ここにテキストを入力..."
                    value={audioTranscript}
                    onChangeText={setAudioTranscript}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
              
              <View style={styles.finalActionButtons}>
                <TouchableOpacity
                    style={[styles.button, styles.backButton]}
                    onPress={() => setCurrentStep('image')}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.backButtonText}>戻る</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.submitButton,
                      (!audioFile || !imageFile || !audioTranscript.trim() || isSubmitting) && styles.disabledButton,
                    ]}
                    onPress={handleSubmit}
                    disabled={!audioFile || !imageFile || !audioTranscript.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Send size={16} color="#fff" />
                        <Text style={styles.submitButtonText}>ストーリーを投稿</Text>
                      </>
                    )}
                  </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ddd',
  },
  activeStepDot: {
    backgroundColor: '#000',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#ddd',
    marginHorizontal: 8,
  },
  activeStepLine: {
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  // Audio Recording Styles
  audioContainer: {
    padding: 32,
    alignItems: 'center',
  },
  recordingArea: {
    alignItems: 'center',
    minHeight: 300,
    justifyContent: 'center',
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingButton: {
    backgroundColor: '#ff3b30',
    transform: [{ scale: 1.1 }],
  },
  recordingStatus: {
    marginTop: 24,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  audioPreview: {
    alignItems: 'center',
    width: '100%',
  },
  audioPreviewText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rerecordButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  rerecordButtonText: {
    fontSize: 14,
    color: '#666',
  },
  transcriptContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  transcriptLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  transcriptText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Image Selection Styles
  imageContainer: {
    padding: 32,
    alignItems: 'center',
  },
  imageSelectionArea: {
    alignItems: 'center',
    minHeight: 300,
    justifyContent: 'center',
  },
  imageSelectionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
  },
  imagePreview: {
    alignItems: 'center',
  },
  squarePreviewContainer: {
    width: 300,
    height: 300,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squarePreview: {
    width: 300,
    height: 300,
  },
  changeImageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  changeImageButtonText: {
    fontSize: 14,
    color: '#666',
  },
  navigationButtons: {
    marginTop: 32,
  },
  // Edit Styles
  editContainer: {
    padding: 16,
  },
  storyPreview: {
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    aspectRatio: 9/16,
  },
  imageSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  finalPreviewContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  finalPreview: {
    width: '100%',
    height: '100%',
  },
  transcriptSection: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-start',
    backgroundColor: '#000',
  },
  transcriptLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  transcriptInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  finalActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginHorizontal: 16,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  backButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#000',
    flex: 2,
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
