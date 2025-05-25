import { liveRoomService } from '@/lib/liveRoomService';
import { Link, Send } from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user?: {
    display_name: string;
  };
  shared_url?: string;
  url_preview?: {
    title: string;
    description: string;
    image?: string;
  };
}

interface LiveRoomChatProps {
  roomId: string;
  userId: string;
  userName: string;
  newMessage?: Message;
}

export function LiveRoomChat({ roomId, userId, userName, newMessage }: LiveRoomChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [sharedUrl, setSharedUrl] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    if (newMessage) {
      setMessages((prev) => [newMessage, ...prev]);
    }
  }, [newMessage]);

  const loadMessages = async () => {
    try {
      const data = await liveRoomService.getChatMessages(roomId);
      setMessages(data.reverse()); // 古い順に並べ替え
      setLoading(false);
    } catch (err) {
      setError('メッセージの読み込みに失敗しました');
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText('');

    try {
      const options = sharedUrl ? { sharedUrl } : undefined;
      const message = await liveRoomService.sendChatMessage(roomId, messageText, options);

      // ローカルに即座に追加
      const localMessage: Message = {
        id: message.id,
        content: message.content,
        user_id: userId,
        created_at: new Date().toISOString(),
        user: { display_name: userName },
        shared_url: message.sharedUrl,
        url_preview: message.urlPreview,
      };

      setMessages((prev) => [...prev, localMessage]);
      setSharedUrl('');

      // スクロール
      setTimeout(() => {
        flatListRef.current?.scrollToEnd();
      }, 100);
    } catch (err) {
      Alert.alert('エラー', 'メッセージの送信に失敗しました');
      setInputText(messageText); // 復元
    }
  };

  const handleUrlShare = () => {
    setShowUrlDialog(true);
  };

  const confirmUrlShare = () => {
    setShowUrlDialog(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.user_id === userId;

    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
        <Text style={styles.userName}>{item.user?.display_name || 'Unknown'}</Text>
        <View style={[styles.messageBubble, isOwnMessage && styles.ownMessageBubble]}>
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
            {item.content}
          </Text>
          {item.url_preview && (
            <View style={styles.urlPreview}>
              <Text style={styles.urlTitle}>{item.url_preview.title}</Text>
              <Text style={styles.urlDescription}>{item.url_preview.description}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>読み込み中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity
          onPress={handleUrlShare}
          testID="url-share-button"
          style={styles.urlButton}
        >
          <Link size={20} color="#666" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="メッセージを入力..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          onPress={handleSend}
          testID="send-button"
          style={styles.sendButton}
          disabled={!inputText.trim()}
        >
          <Send size={20} color={inputText.trim() ? '#007AFF' : '#ccc'} />
        </TouchableOpacity>
      </View>

      {/* URL入力ダイアログ */}
      <Modal visible={showUrlDialog} transparent animationType="fade">
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>URLを共有</Text>
            <TextInput
              style={styles.urlInput}
              placeholder="URLを入力..."
              value={sharedUrl}
              onChangeText={setSharedUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity
                onPress={confirmUrlShare}
                testID="url-confirm"
                style={styles.dialogButton}
              >
                <Text style={styles.dialogButtonText}>OK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowUrlDialog(false);
                  setSharedUrl('');
                }}
                style={styles.dialogButton}
              >
                <Text style={styles.dialogButtonText}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  messageBubble: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  ownMessageBubble: {
    backgroundColor: '#007AFF',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  ownMessageText: {
    color: 'white',
  },
  urlPreview: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  urlTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  urlDescription: {
    fontSize: 14,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  urlButton: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '80%',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  dialogButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  dialogButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
