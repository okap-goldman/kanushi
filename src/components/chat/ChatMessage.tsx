import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../ui/Avatar';

interface ChatMessageProps {
  isAi?: boolean;
  message: string;
}

export function ChatMessage({ isAi = false, message }: ChatMessageProps) {
  const [formattedMessage, setFormattedMessage] = useState(message);

  // Process message to handle markdown formatting (simplified for React Native)
  useEffect(() => {
    // For React Native, we'll keep it simple - just preserve the original message
    // You could use a markdown library like react-native-markdown-display for full support
    setFormattedMessage(message);
  }, [message]);

  return (
    <View style={[styles.container, isAi ? styles.aiBackground : styles.userBackground]}>
      <Avatar
        size={32}
        source={isAi ? '/assets/icon.png' : undefined}
        fallbackText={isAi ? 'AI' : 'Me'}
      />
      <View style={styles.contentContainer}>
        <Text style={styles.label}>{isAi ? 'アシスタント' : 'あなた'}</Text>
        <Text style={styles.message}>{formattedMessage}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 16,
    padding: 24,
  },
  aiBackground: {
    backgroundColor: '#f5f5f5',
  },
  userBackground: {
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    flex: 1,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  message: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});
