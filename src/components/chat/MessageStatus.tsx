import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type MessageStatusType = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

interface MessageStatusProps {
  status: MessageStatusType;
  size?: number;
  color?: string;
}

export function MessageStatus({ status, size = 16, color = '#718096' }: MessageStatusProps) {
  const getIcon = () => {
    switch (status) {
      case 'sending':
        return <Ionicons name="time-outline" size={size} color={color} />;
      case 'sent':
        return <Ionicons name="checkmark" size={size} color={color} />;
      case 'delivered':
        return (
          <View style={styles.doubleCheckContainer}>
            <Ionicons name="checkmark" size={size} color={color} />
            <Ionicons name="checkmark" size={size} color={color} style={styles.secondCheck} />
          </View>
        );
      case 'read':
        return (
          <View style={styles.doubleCheckContainer}>
            <Ionicons name="checkmark" size={size} color="#0070F3" />
            <Ionicons name="checkmark" size={size} color="#0070F3" style={styles.secondCheck} />
          </View>
        );
      case 'failed':
        return <Ionicons name="alert-circle-outline" size={size} color="#E53E3E" />;
      default:
        return null;
    }
  };

  return <View style={styles.container}>{getIcon()}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doubleCheckContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondCheck: {
    marginLeft: -8,
  },
});
