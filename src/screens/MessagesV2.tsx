import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { ConversationItem } from '@/components/chat/ConversationItem';
import { dmService } from '@/lib/dmService';
import type { DmThread } from '@/lib/dmService';
import { useAuth } from '@/context/AuthContext';

export default function MessagesV2() {
  const [threads, setThreads] = useState<DmThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { user: authUser } = useAuth();

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const userThreads = await dmService.getUserThreads();
      setThreads(userThreads);
    } catch (error) {
      console.error('Failed to load threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadThreads();
    setRefreshing(false);
  };

  const handleThreadPress = (thread: DmThread) => {
    const otherParticipant = thread.participants.find(p => p.id !== authUser?.id);
    
    navigation.navigate('MessageDetail' as any, {
      threadId: thread.id,
      user: {
        id: otherParticipant?.id,
        name: otherParticipant?.displayName || 'User',
        avatar: otherParticipant?.profileImage,
      },
    });
  };

  const renderThread = ({ item }: { item: DmThread }) => {
    const otherParticipant = item.participants.find(p => p.id !== authUser?.id);
    
    if (!otherParticipant) return null;

    // Format last message time
    let lastMessageTime = '';
    if (item.lastMessage?.createdAt) {
      const date = new Date(item.lastMessage.createdAt);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) {
        lastMessageTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffInDays === 1) {
        lastMessageTime = 'Yesterday';
      } else if (diffInDays < 7) {
        lastMessageTime = date.toLocaleDateString([], { weekday: 'short' });
      } else {
        lastMessageTime = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    }

    // Format last message preview
    let lastMessagePreview = '';
    if (item.lastMessage) {
      if (item.lastMessage.messageType === 'text') {
        lastMessagePreview = item.lastMessage.content;
      } else if (item.lastMessage.messageType === 'image') {
        lastMessagePreview = '📷 Photo';
      } else if (item.lastMessage.messageType === 'audio') {
        lastMessagePreview = '🎤 Voice message';
      }
    }

    return (
      <ConversationItem
        conversation={{
          id: item.id,
          participants: [
            {
              id: otherParticipant.id,
              name: otherParticipant.displayName || 'User',
              avatar: otherParticipant.profileImage || undefined,
            }
          ],
          lastMessage: item.lastMessage ? {
            id: item.lastMessage.id,
            content: lastMessagePreview,
            timestamp: item.lastMessage.createdAt.toISOString(),
            senderId: item.lastMessage.senderId,
          } : undefined,
          lastMessageTime,
          unreadCount: item.unreadCount || 0,
        }}
        onPress={() => handleThreadPress(item)}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather name="message-circle" size={64} color="#CBD5E0" />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a new conversation to connect with others
      </Text>
      <TouchableOpacity 
        style={styles.newMessageButton}
        onPress={() => navigation.navigate('NewMessage' as any)}
      >
        <Text style={styles.newMessageButtonText}>Start New Conversation</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070F3" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity 
          style={styles.newMessageIcon}
          onPress={() => navigation.navigate('NewMessage' as any)}
        >
          <Feather name="edit" size={24} color="#0070F3" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={threads}
        renderItem={renderThread}
        keyExtractor={item => item.id}
        contentContainerStyle={threads.length === 0 ? styles.emptyListContainer : undefined}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0070F3']}
            tintColor="#0070F3"
          />
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
  },
  newMessageIcon: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
  },
  newMessageButton: {
    backgroundColor: '#0070F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newMessageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});