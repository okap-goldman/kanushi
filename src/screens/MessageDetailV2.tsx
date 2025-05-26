import { MessageInput } from '@/components/chat/MessageInput';
import { MessageItem } from '@/components/chat/MessageItem';
import { useAuth } from '@/context/AuthContext';
import { dmService } from '@/lib/dmService';
import type { DmMessage } from '@/lib/dmService';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Image } from 'expo-image';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function MessageDetailV2() {
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const navigation = useNavigation();
  const route = useRoute<any>();
  const { user: authUser } = useAuth();
  const { threadId, user } = route.params || {};

  // Load messages
  useEffect(() => {
    if (!threadId) return;

    loadMessages();
    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        dmService.unsubscribeFromThread(threadId);
      }
    };
  }, [threadId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const loadedMessages = await dmService.getMessages(threadId);
      setMessages(loadedMessages.reverse()); // Reverse to show oldest first

      // Mark messages as read
      await dmService.markThreadAsRead(threadId);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = async () => {
    try {
      channelRef.current = await dmService.subscribeToThread(threadId, {
        onNewMessage: (message) => {
          setMessages((prev) => [...prev, message]);
          if (message.senderId !== authUser?.id) {
            dmService.markThreadAsRead(threadId);
          }
        },
        onMessageRead: (messageId, readBy) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === messageId ? { ...msg, isRead: true } : msg))
          );
        },
        onTyping: (userId, typing) => {
          if (userId !== authUser?.id) {
            setOtherUserTyping(typing);
          }
        },
        onPresenceChange: (userId, presence) => {
          // Handle presence updates if needed
        },
      });
    } catch (error) {
      console.error('Failed to setup realtime subscription:', error);
    }
  };

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    if (!content.trim() && !attachments?.length) return;

    try {
      setSending(true);

      // Send text message
      if (content.trim()) {
        await dmService.sendMessage({
          threadId,
          content: content.trim(),
          encrypted: false, // Can be toggled based on user preference
        });
      }

      // Handle attachments if any
      if (attachments?.length) {
        for (const attachment of attachments) {
          if (attachment.type === 'image' && attachment.uri) {
            const file = await fetch(attachment.uri).then((r) => r.blob());
            await dmService.sendMessage({
              threadId,
              content: attachment.caption || '',
              imageFile: new File([file], 'image.jpg', { type: 'image/jpeg' }),
            });
          } else if (attachment.type === 'audio' && attachment.uri) {
            const file = await fetch(attachment.uri).then((r) => r.blob());
            await dmService.sendMessage({
              threadId,
              content: '',
              audioFile: new File([file], 'audio.m4a', { type: 'audio/m4a' }),
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = useCallback(
    (typing: boolean) => {
      if (typing !== isTyping) {
        setIsTyping(typing);
        dmService.sendTypingIndicator(threadId, typing);
      }

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing after 3 seconds
      if (typing) {
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          dmService.sendTypingIndicator(threadId, false);
        }, 3000);
      }
    },
    [isTyping, threadId]
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const renderMessage = ({ item }: { item: DmMessage }) => (
    <MessageItem
      message={{
        id: item.id,
        content: item.content,
        timestamp: item.createdAt.toISOString(),
        senderId: item.senderId,
        senderName: item.senderId === authUser?.id ? 'You' : user?.name || 'User',
        senderAvatar: item.senderId === authUser?.id ? authUser?.avatar : user?.avatar,
        messageType: item.messageType,
        mediaUrl: item.mediaUrl || undefined,
        reactions: [],
        isRead: item.isRead,
        threadId: item.threadId,
      }}
      currentUserId={authUser?.id || ''}
      onReaction={(messageId, emoji) => {
        // TODO: Implement reactions
      }}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070F3" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1A202C" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.userInfo}>
          <Image
            source={{ uri: user?.avatar || 'https://i.pravatar.cc/150' }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            {otherUserTyping && <Text style={styles.typingIndicator}>typing...</Text>}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton}>
          <Feather name="more-vertical" size={24} color="#1A202C" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        <MessageInput
          onSend={handleSendMessage}
          onTyping={handleTyping}
          disabled={sending}
          placeholder="Type a message..."
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
  },
  typingIndicator: {
    fontSize: 12,
    color: '#718096',
    fontStyle: 'italic',
  },
  menuButton: {
    padding: 4,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
