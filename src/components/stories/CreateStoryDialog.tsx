import { ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Camera, FileVideo, Image as ImageIcon, Send, X } from 'lucide-react-native';
import React, { useState, useRef } from 'react';
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
    file: { uri: string; type: string; name: string };
    caption: string;
    contentType: 'image' | 'video';
  }) => Promise<void>;
}

export default function CreateStoryDialog({
  isOpen,
  onOpenChange,
  onSubmit,
}: CreateStoryDialogProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [caption, setCaption] = useState('');
  const [contentType, setContentType] = useState<'image' | 'video'>('image');
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        type: 'image/jpeg',
        name: `story-${Date.now()}.jpg`,
      });
      setPreview(asset.uri);
      setContentType('image');
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        type: 'video/mp4',
        name: `story-${Date.now()}.mp4`,
      });
      setPreview(asset.uri);
      setContentType('video');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('許可が必要です', 'カメラへのアクセスを許可してください。');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        type: 'image/jpeg',
        name: `story-${Date.now()}.jpg`,
      });
      setPreview(asset.uri);
      setContentType('image');
      setActiveTab('upload');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setCaption('');
    setPreview(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsSubmitting(true);

    try {
      await onSubmit({
        file: selectedFile,
        caption,
        contentType,
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

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>ストーリーを作成</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upload' && styles.activeTab]}
            onPress={() => setActiveTab('upload')}
          >
            <Text style={[styles.tabText, activeTab === 'upload' && styles.activeTabText]}>
              アップロード
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'camera' && styles.activeTab]}
            onPress={() => setActiveTab('camera')}
          >
            <Text style={[styles.tabText, activeTab === 'camera' && styles.activeTabText]}>
              カメラ
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {activeTab === 'upload' ? (
            !preview ? (
              <View style={styles.uploadContainer}>
                <Text style={styles.uploadText}>画像またはビデオを選択してください</Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                    <ImageIcon size={20} color="#000" />
                    <Text style={styles.uploadButtonText}>画像</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.uploadButton} onPress={pickVideo}>
                    <FileVideo size={20} color="#000" />
                    <Text style={styles.uploadButtonText}>ビデオ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.previewContainer}>
                {contentType === 'image' ? (
                  <Image source={{ uri: preview }} style={styles.preview} />
                ) : (
                  <Video
                    source={{ uri: preview }}
                    style={styles.preview}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                  />
                )}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => {
                    setPreview(null);
                    setSelectedFile(null);
                  }}
                >
                  <X size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )
          ) : (
            <View style={styles.cameraContainer}>
              <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
                <Camera size={40} color="#000" />
                <Text style={styles.cameraText}>撮影</Text>
              </TouchableOpacity>
            </View>
          )}

          {preview && (
            <View style={styles.captionContainer}>
              <TextInput
                style={styles.captionInput}
                placeholder="キャプションを追加..."
                value={caption}
                onChangeText={setCaption}
                multiline
                numberOfLines={2}
              />

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleClose}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.submitButton,
                    (!selectedFile || isSubmitting) && styles.disabledButton,
                  ]}
                  onPress={handleSubmit}
                  disabled={!selectedFile || isSubmitting}
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  uploadContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  uploadText: {
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
  previewContainer: {
    position: 'relative',
    height: 400,
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  cameraContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  cameraButton: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 100,
  },
  cameraText: {
    marginTop: 8,
    fontSize: 16,
  },
  captionContainer: {
    padding: 16,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
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
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#000',
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
