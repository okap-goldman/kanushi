import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

export function Avatar({ source, size = 'md', style }: AvatarProps) {
  return (
    <View style={[styles.container, styles[size], style]}>
      <Image
        source={source}
        style={styles.image}
        contentFit="cover"
        transition={300}
        placeholder={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEVgJJMUZcpAAAAABJRU5ErkJggg==' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  xs: {
    width: 24,
    height: 24,
  },
  sm: {
    width: 32,
    height: 32,
  },
  md: {
    width: 40,
    height: 40,
  },
  lg: {
    width: 56,
    height: 56,
  },
  xl: {
    width: 80,
    height: 80,
  },
});