import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Conversation } from '../../lib/messageService';
import { formatRelativeTime } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';

interface ConversationItemProps {
  conversation: Conversation;
  isActive?: boolean;
  onPress?: () => void;
}

export function ConversationItem({
  conversation,
  isActive = false,
  onPress,
}: ConversationItemProps) {
  // Get other participants (assuming display properties are set in the service)
  const displayName = conversation.display_name || 'Chat';
  const displayImage = conversation.display_image || '';

  // Get last message preview
  const lastMessage = conversation.last_message;
  const lastMessagePreview = lastMessage ? getMessagePreview(lastMessage) : 'Start a conversation';

  // Format the timestamp
  const timestamp = lastMessage ? formatRelativeTime(new Date(lastMessage.created_at)) : '';

  return (
    <TouchableOpacity
      style={[styles.container, isActive ? styles.activeBackground : styles.defaultBackground]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Avatar
        size={48}
        source={displayImage || undefined}
        fallbackText={displayName.substring(0, 2).toUpperCase()}
      />

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.displayName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>

        <View style={styles.messageRow}>
          <Text style={styles.messagePreview} numberOfLines={1}>
            {lastMessagePreview}
          </Text>

          {conversation.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{conversation.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Helper function to generate a preview of the message based on content type
function getMessagePreview(message: Conversation['last_message']) {
  if (!message) return '';

  switch (message.content_type) {
    case 'text':
      // Truncate long text
      return message.content.length > 30
        ? `${message.content.substring(0, 30)}...`
        : message.content;
    case 'image':
      return '📷 Photo';
    case 'video':
      return '🎥 Video';
    case 'audio':
      return '🎵 Audio';
    default:
      return 'New message';
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
  activeBackground: {
    backgroundColor: '#e5e5e5',
  },
  defaultBackground: {
    backgroundColor: 'transparent',
  },
  contentContainer: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messagePreview: {
    fontSize: 12,
    color: '#666666',
    flex: 1,
    maxWidth: 180,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
});
