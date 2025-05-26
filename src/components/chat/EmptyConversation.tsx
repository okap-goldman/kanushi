import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface EmptyConversationProps {
  userName?: string;
  onStartConversation?: () => void;
}

export function EmptyConversation({ userName }: EmptyConversationProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Feather name="message-circle" size={64} color="#CBD5E0" />
      </View>
      <Text style={styles.title}>
        {userName ? `${userName}さんとの会話を始める` : 'メッセージはまだありません'}
      </Text>
      <Text style={styles.subtitle}>メッセージを送信して会話を始めましょう</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
});
