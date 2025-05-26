import { MaterialIcons } from '@expo/vector-icons';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useToast } from '../../hooks/use-toast';
import { type ChatMessage, type ChatSession, type Recommendations, aiChatService } from '../../lib/aiChatService';

interface AIChatProps {
  isVisible?: boolean;
  onClose?: () => void;
}

interface QuickAction {
  id: string;
  label: string;
  message: string;
}

const quickActions: QuickAction[] = [
  { id: '1', label: 'イベントを探す', message: 'イベントを探したいです' },
  { id: '2', label: 'おすすめの投稿', message: 'おすすめの投稿を教えてください' },
  { id: '3', label: '使い方を教えて', message: 'このアプリの使い方を教えてください' },
];

export const AIChat: React.FC<AIChatProps> = ({ isVisible = true, onClose = () => {} }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [recentSessions, setRecentSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSessionList, setShowSessionList] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isVisible) {
      loadRecentSessions();
    }
  }, [isVisible]);

  const loadRecentSessions = async () => {
    try {
      const sessions = await aiChatService.getRecentSessions(3);
      setRecentSessions(sessions);
      // If no current session and no messages, show session list
      if (!currentSessionId && messages.length === 0) {
        setShowSessionList(true);
      }
    } catch (error) {
      console.error('Failed to load recent sessions:', error);
    }
  };

  const loadChatHistory = async (sessionId?: string) => {
    try {
      const history = sessionId
        ? await aiChatService.getChatHistory(sessionId)
        : await aiChatService.getChatHistory();
      setMessages(history);
      if (sessionId) {
        setCurrentSessionId(sessionId);
        setShowSessionList(false);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Hide session list when starting a new conversation
    setShowSessionList(false);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Create new session if not exists
      if (!currentSessionId) {
        const newSession = await aiChatService.createSession();
        setCurrentSessionId(newSession.id);
      }

      const response = await aiChatService.sendMessage(message, {
        sessionId: currentSessionId || undefined,
      });
      
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '-ai',
        content: response.message || '',
        role: 'assistant',
        created_at: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      scrollToBottom();
      // Reload sessions to update the list
      loadRecentSessions();
    } catch (error) {
      toast({
        title: 'メッセージの送信に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    sendMessage(inputMessage);
  };

  const handleQuickAction = (action: QuickAction) => {
    sendMessage(action.message);
  };

  const handleClearChat = async () => {
    try {
      await aiChatService.clearChatHistory();
      setMessages([]);
      setCurrentSessionId(null);
      setShowSessionList(true);
      await loadRecentSessions();
      toast({
        title: '履歴をクリアしました',
      });
    } catch (error) {
      toast({
        title: '履歴のクリアに失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleSessionSelect = (session: ChatSession) => {
    loadChatHistory(session.id);
  };

  const handleNewChat = async () => {
    setMessages([]);
    setCurrentSessionId(null);
    setShowSessionList(false);
  };

  const handleShowRecommendations = async () => {
    try {
      const recs = await aiChatService.getRecommendations();
      setRecommendations(recs);
      setShowRecommendations(true);
    } catch (error) {
      toast({
        title: 'おすすめの取得に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        <View
          style={[styles.messageBubble, isUser ? styles.userMessageBubble : styles.aiMessageBubble]}
        >
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  };

  // If used in navigation, don't render as modal
  const content = (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AIアシスタント</Text>
        {onClose !== (() => {}) && (
          <TouchableOpacity onPress={onClose} testID="close-button">
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actionsBar}>
        <TouchableOpacity
          onPress={handleClearChat}
          testID="clear-chat-button"
          style={styles.actionButton}
        >
          <MaterialIcons name="delete" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleShowRecommendations}
          testID="recommendations-button"
          style={styles.actionButton}
        >
          <MaterialIcons name="star" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNewChat}
          testID="new-chat-button"
          style={styles.actionButton}
        >
          <MaterialIcons name="add" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {showSessionList && messages.length === 0 && (
        <View style={styles.sessionsContainer}>
          {recentSessions.length > 0 ? (
            <>
              <Text style={styles.sessionsTitle}>最近のチャット</Text>
              {recentSessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionItem}
                  onPress={() => handleSessionSelect(session)}
                >
                  <View style={styles.sessionContent}>
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    <Text style={styles.sessionPreview}>{session.last_message}</Text>
                    <Text style={styles.sessionDate}>
                      {new Date(session.updated_at).toLocaleDateString('ja-JP')}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#ccc" />
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>チャット履歴がありません</Text>
              <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
                <Text style={styles.newChatButtonText}>新しいチャットを開始</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {!showSessionList && messages.length === 0 && (
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>よく聞かれる質問</Text>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionButton}
              onPress={() => handleQuickAction(action)}
            >
              <Text style={styles.quickActionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={scrollToBottom}
        testID="chat-scroll-view"
      >
        {messages.map(renderMessage)}
        {isLoading && (
          <View style={styles.loadingContainer} testID="message-loading">
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="メッセージを入力..."
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            testID="send-message-button"
            disabled={!inputMessage.trim() || isLoading}
            style={[
              styles.sendButton,
              (!inputMessage.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
          >
            <MaterialIcons
              name="send"
              size={20}
              color={inputMessage.trim() && !isLoading ? '#007AFF' : '#ccc'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {showRecommendations && recommendations && (
        <Modal
          visible={showRecommendations}
          animationType="slide"
          transparent
          onRequestClose={() => setShowRecommendations(false)}
        >
          <View style={styles.recommendationsOverlay}>
            <View style={styles.recommendationsContent} testID="recommendations-view">
              <Text style={styles.recommendationsTitle}>おすすめ</Text>
              <TouchableOpacity
                onPress={() => setShowRecommendations(false)}
                style={styles.recommendationsClose}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <ScrollView>
                <Text style={styles.recommendationSection}>
                  投稿: {recommendations.posts.length}件
                </Text>
                <Text style={styles.recommendationSection}>
                  ユーザー: {recommendations.users.length}人
                </Text>
                <Text style={styles.recommendationSection}>
                  イベント: {recommendations.events.length}件
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </>
  );

  // When used as a screen in navigation, render without modal
  if (!onClose || onClose === (() => {})) {
    return (
      <SafeAreaView style={styles.container}>
        {content}
      </SafeAreaView>
    );
  }

  // When used as a modal, render with modal wrapper
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {content}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  actionsBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButton: {
    padding: 8,
    marginRight: 15,
  },
  quickActionsContainer: {
    padding: 20,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 15,
    color: '#666',
  },
  quickActionButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 14,
    color: '#333',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
  },
  messageContainer: {
    marginBottom: 15,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
  },
  userMessageBubble: {
    backgroundColor: '#007AFF',
  },
  aiMessageBubble: {
    backgroundColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  userMessageText: {
    color: '#fff',
  },
  loadingContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    fontSize: 14,
    marginRight: 10,
  },
  sendButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  recommendationsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  recommendationsContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  recommendationsClose: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  recommendationSection: {
    fontSize: 14,
    marginBottom: 10,
    color: '#666',
  },
  sessionsContainer: {
    padding: 15,
  },
  sessionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 10,
  },
  sessionContent: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  sessionPreview: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  sessionDate: {
    fontSize: 11,
    color: '#999',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  newChatButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
