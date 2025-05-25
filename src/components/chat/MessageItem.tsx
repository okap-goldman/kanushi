import React, { useState, useEffect } from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { Avatar } from "../ui/Avatar";
import { Message } from "../../lib/messageService";
import { formatRelativeTime } from "../../lib/utils";
import { Video, Audio } from 'expo-av';

interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export function MessageItem({ message, isCurrentUser }: MessageItemProps) {
  const [formattedContent, setFormattedContent] = useState(message.content);
  
  // Process message to handle markdown formatting (simplified for React Native)
  useEffect(() => {
    // For React Native, we'll keep it simple - just preserve the original message
    // You could use a markdown library like react-native-markdown-display for full support
    setFormattedContent(message.content);
  }, [message.content]);

  return (
    <View style={[
      styles.container,
      isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer
    ]}>
      {!isCurrentUser && (
        <Avatar
          size={32}
          source={message.sender?.image || undefined}
          fallbackText={message.sender?.name?.substring(0, 2).toUpperCase()}
          style={styles.avatar}
        />
      )}
      
      <View style={styles.messageWrapper}>
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
        ]}>
          {message.content_type === 'text' && (
            <Text style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText
            ]}>
              {formattedContent}
            </Text>
          )}
          
          {message.content_type === 'image' && (
            <View style={styles.mediaContainer}>
              <Image 
                source={{ uri: message.media_url || '' }}
                style={styles.messageImage}
                resizeMode="cover"
              />
              {message.content && (
                <Text style={[
                  styles.messageText,
                  styles.mediaCaption,
                  isCurrentUser ? styles.currentUserText : styles.otherUserText
                ]}>
                  {formattedContent}
                </Text>
              )}
            </View>
          )}
          
          {message.content_type === 'audio' && (
            <View style={styles.mediaContainer}>
              <View style={styles.audioPlayer}>
                <Text style={styles.audioText}>🎵 Audio message</Text>
              </View>
              {message.content && (
                <Text style={[
                  styles.messageText,
                  styles.mediaCaption,
                  isCurrentUser ? styles.currentUserText : styles.otherUserText
                ]}>
                  {formattedContent}
                </Text>
              )}
            </View>
          )}
          
          {message.content_type === 'video' && (
            <View style={styles.mediaContainer}>
              <View style={styles.videoPlayer}>
                <Text style={styles.videoText}>🎥 Video message</Text>
              </View>
              {message.content && (
                <Text style={[
                  styles.messageText,
                  styles.mediaCaption,
                  isCurrentUser ? styles.currentUserText : styles.otherUserText
                ]}>
                  {formattedContent}
                </Text>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.messageInfo}>
          <Text style={styles.timestamp}>
            {formatRelativeTime(new Date(message.created_at))}
          </Text>
          
          {message.is_read && isCurrentUser && (
            <Text style={styles.readStatus}>Read</Text>
          )}
          
          {message.reactions && message.reactions.length > 0 && (
            <View style={styles.reactions}>
              {message.reactions.map(reaction => (
                <Text 
                  key={reaction.id} 
                  style={styles.reaction}
                >
                  {reaction.reaction}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  currentUserContainer: {
    justifyContent: "flex-end",
  },
  otherUserContainer: {
    justifyContent: "flex-start",
  },
  avatar: {
    marginTop: 4,
    marginRight: 8,
  },
  messageWrapper: {
    maxWidth: screenWidth * 0.8,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  currentUserBubble: {
    backgroundColor: "#007AFF",
    borderTopRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: "#E5E5EA",
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  currentUserText: {
    color: "#FFFFFF",
  },
  otherUserText: {
    color: "#000000",
  },
  mediaContainer: {
    gap: 8,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  audioPlayer: {
    backgroundColor: "rgba(0,0,0,0.1)",
    padding: 12,
    borderRadius: 8,
    width: 200,
  },
  audioText: {
    fontSize: 14,
  },
  videoPlayer: {
    backgroundColor: "rgba(0,0,0,0.1)",
    padding: 20,
    borderRadius: 8,
    width: 200,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  videoText: {
    fontSize: 16,
  },
  mediaCaption: {
    marginTop: 4,
  },
  messageInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  timestamp: {
    fontSize: 12,
    color: "#8E8E93",
  },
  readStatus: {
    fontSize: 12,
    color: "#007AFF",
  },
  reactions: {
    flexDirection: "row",
    gap: 4,
  },
  reaction: {
    fontSize: 14,
  },
});