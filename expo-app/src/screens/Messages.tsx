import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Sample data for messages
const SAMPLE_MESSAGES = [
  {
    id: '1',
    user: {
      id: 'user1',
      name: 'Yuki Tanaka',
      avatar: 'https://i.pravatar.cc/150?img=20',
      isOnline: true,
    },
    lastMessage: 'Hi there! Are you coming to the event tomorrow?',
    timestamp: '09:45',
    unread: 2,
  },
  {
    id: '2',
    user: {
      id: 'user2',
      name: 'Hiroshi Sato',
      avatar: 'https://i.pravatar.cc/150?img=21',
      isOnline: false,
    },
    lastMessage: 'Thanks for sharing the photos!',
    timestamp: 'Yesterday',
    unread: 0,
  },
  {
    id: '3',
    user: {
      id: 'user3',
      name: 'Akiko Yamamoto',
      avatar: 'https://i.pravatar.cc/150?img=22',
      isOnline: true,
    },
    lastMessage: 'Let me know when you arrive at the station.',
    timestamp: 'Yesterday',
    unread: 0,
  },
  {
    id: '4',
    user: {
      id: 'user4',
      name: 'Takeshi Kimura',
      avatar: 'https://i.pravatar.cc/150?img=23',
      isOnline: false,
    },
    lastMessage: 'The restaurant was amazing, we should go again!',
    timestamp: 'Monday',
    unread: 0,
  },
  {
    id: '5',
    user: {
      id: 'user5',
      name: 'Naomi Kato',
      avatar: 'https://i.pravatar.cc/150?img=24',
      isOnline: false,
    },
    lastMessage: 'Did you see the new exhibition at the museum?',
    timestamp: 'Sunday',
    unread: 0,
  },
];

export default function Messages() {
  const navigation = useNavigation<any>();

  const navigateToMessageDetail = (messageId: string, user: any) => {
    navigation.navigate('MessageDetail', { messageId, user });
  };

  const navigateToNewMessage = () => {
    navigation.navigate('NewMessage');
  };

  const renderMessageItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() => navigateToMessageDetail(item.id, item.user)}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: item.user.avatar }}
          style={styles.avatar}
          contentFit="cover"
        />
        {item.user.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.userName}>{item.user.name}</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
        
        <View style={styles.messagePreview}>
          <Text
            style={[
              styles.messageText,
              item.unread > 0 && styles.unreadMessageText,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="message-circle" size={48} color="#A0AEC0" />
      <Text style={styles.emptyStateTitle}>No messages yet</Text>
      <Text style={styles.emptyStateText}>
        When you start conversations, they'll appear here
      </Text>
      <TouchableOpacity
        style={styles.newMessageButton}
        onPress={navigateToNewMessage}
      >
        <Text style={styles.newMessageButtonText}>Start a Conversation</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity onPress={navigateToNewMessage}>
          <Feather name="edit" size={24} color="#0070F3" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={SAMPLE_MESSAGES}
        renderItem={renderMessageItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
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
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  messagesList: {
    flexGrow: 1,
  },
  messageItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#48BB78',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    bottom: 0,
    right: 0,
  },
  messageContent: {
    flex: 1,
    justifyContent: 'center',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
  },
  timestamp: {
    fontSize: 12,
    color: '#718096',
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    color: '#718096',
    flex: 1,
  },
  unreadMessageText: {
    fontWeight: '600',
    color: '#1A202C',
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0070F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A5568',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
  },
  newMessageButton: {
    backgroundColor: '#0070F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newMessageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});