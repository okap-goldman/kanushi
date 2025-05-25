import React, { useState, useRef } from "react";
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Image as RNImage,
  Modal,
  Text,
  Platform,
  KeyboardAvoidingView
} from "react-native";
import { 
  Camera, 
  Paperclip, 
  Mic, 
  Send, 
  Image, 
  Video, 
  X, 
  FileAudio
} from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { uploadFile, uploadAudioBlob } from "../../lib/supabase";

interface MessageInputProps {
  onSendMessage: (content: string, contentType: 'text' | 'image' | 'video' | 'audio', mediaUrl?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ 
  onSendMessage, 
  disabled = false,
  placeholder = "メッセージを入力..."
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | null>(null);
  const [mediaFile, setMediaFile] = useState<any>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  
  const handleSend = async () => {
    if (disabled) return;
    
    // Handle media upload if there's media
    if (mediaType && mediaFile) {
      try {
        // Upload file to Supabase
        const folder = mediaType === 'image' ? 'message-images' : 
                      mediaType === 'video' ? 'message-videos' : 'message-audio';
        
        // Create a file-like object for upload
        const file = {
          uri: mediaFile.uri,
          name: mediaFile.fileName || `${Date.now()}.${mediaType === 'image' ? 'jpg' : mediaType === 'video' ? 'mp4' : 'wav'}`,
          type: mediaFile.mimeType || `${mediaType}/*`
        };
                      
        const { url, error } = await uploadFile(file as any, 'media', folder);
        
        if (error || !url) {
          console.error('Error uploading media:', error);
          Alert.alert("Error", "Failed to upload media");
          return;
        }
        
        // Send message with media URL
        onSendMessage(message, mediaType, url);
        
        // Reset state
        setMessage("");
        setMediaPreview(null);
        setMediaType(null);
        setMediaFile(null);
      } catch (error) {
        console.error('Error uploading media:', error);
        Alert.alert("Error", "Failed to upload media");
      }
    } else if (message.trim()) {
      // Send text message
      onSendMessage(message, 'text');
      setMessage("");
    }
  };
  
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaType('image');
      setMediaFile(result.assets[0]);
      setMediaPreview(result.assets[0].uri);
      setShowAttachmentMenu(false);
    }
  };
  
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Camera permission is required to take photos");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaType('image');
      setMediaFile(result.assets[0]);
      setMediaPreview(result.assets[0].uri);
    }
  };
  
  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaType('video');
      setMediaFile(result.assets[0]);
      setMediaPreview(result.assets[0].uri);
      setShowAttachmentMenu(false);
    }
  };
  
  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
    });

    if (!result.canceled && result.assets[0]) {
      setMediaType('audio');
      setMediaFile(result.assets[0]);
      setMediaPreview('audio');
      setShowAttachmentMenu(false);
    }
  };
  
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Microphone permission is required to record audio");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert("Error", "Failed to start recording");
    }
  };
  
  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      if (uri) {
        // Upload the audio file
        const file = {
          uri,
          name: `${Date.now()}.wav`,
          type: 'audio/wav'
        };
        
        const { url, error } = await uploadFile(file as any, 'media', 'message-audio');
        
        if (error || !url) {
          console.error('Error uploading audio:', error);
          Alert.alert("Error", "Failed to upload audio");
          return;
        }
        
        // Send message with audio URL
        onSendMessage(message || "Audio message", 'audio', url);
        
        // Reset state
        setMessage("");
      }
      
      recordingRef.current = null;
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert("Error", "Failed to stop recording");
    }
  };
  
  const cancelMedia = () => {
    setMediaPreview(null);
    setMediaType(null);
    setMediaFile(null);
  };
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.container}>
        {/* Media preview */}
        {mediaPreview && (
          <View style={styles.mediaPreviewContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={cancelMedia}
            >
              <X size={16} color="white" />
            </TouchableOpacity>
            
            {mediaType === 'image' && (
              <RNImage 
                source={{ uri: mediaPreview }} 
                style={styles.imagePreview}
                resizeMode="contain"
              />
            )}
            
            {mediaType === 'video' && (
              <View style={styles.videoPreview}>
                <Video size={24} color="#666" />
                <Text style={styles.videoText}>Video selected</Text>
              </View>
            )}
            
            {mediaType === 'audio' && (
              <View style={styles.audioPreview}>
                <FileAudio size={24} color="#666" />
                <Text style={styles.audioText}>{mediaFile?.name || 'Audio file'}</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Message input area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setShowAttachmentMenu(true)}
          >
            <Paperclip size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={takePhoto}
          >
            <Camera size={20} color="#666" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder={placeholder}
            value={message}
            onChangeText={setMessage}
            multiline
            editable={!disabled && !isRecording}
          />
          
          {message.trim() || mediaPreview ? (
            <TouchableOpacity 
              style={[styles.sendButton, (!message.trim() && !mediaPreview) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={disabled || (!message.trim() && !mediaPreview)}
            >
              <Send size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendButton, isRecording && styles.recordingButton]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={disabled}
            >
              <Mic size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Attachment menu modal */}
        <Modal
          visible={showAttachmentMenu}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAttachmentMenu(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAttachmentMenu(false)}
          >
            <View style={styles.attachmentMenu}>
              <TouchableOpacity style={styles.attachmentOption} onPress={pickImage}>
                <Image size={24} color="#666" />
                <Text style={styles.attachmentText}>Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.attachmentOption} onPress={pickVideo}>
                <Video size={24} color="#666" />
                <Text style={styles.attachmentText}>Video</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.attachmentOption} onPress={pickAudio}>
                <FileAudio size={24} color="#666" />
                <Text style={styles.attachmentText}>Audio</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  mediaPreviewContainer: {
    position: "relative",
    marginBottom: 8,
    marginHorizontal: 16,
    marginTop: 8,
    maxWidth: 200,
  },
  cancelButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    padding: 4,
    zIndex: 1,
  },
  imagePreview: {
    height: 160,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  videoPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 8,
  },
  videoText: {
    fontSize: 14,
    color: "#666",
  },
  audioPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 8,
  },
  audioText: {
    fontSize: 14,
    color: "#666",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 8,
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  recordingButton: {
    backgroundColor: "#FF3B30",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  attachmentMenu: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  attachmentOption: {
    alignItems: "center",
    gap: 8,
    padding: 16,
  },
  attachmentText: {
    fontSize: 12,
    color: "#666",
  },
});