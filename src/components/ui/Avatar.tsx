import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: string;
  size?: AvatarSize | number;
  style?: ViewStyle;
  fallbackText?: string;
}

export function Avatar({ source, size = 'md', style, fallbackText }: AvatarProps) {
  const sizeStyle = typeof size === 'number' ? { width: size, height: size } : styles[size];

  return (
    <View style={[styles.container, sizeStyle, style]}>
      {source ? (
        <Image
          source={source}
          style={styles.image}
          contentFit="cover"
          transition={300}
          placeholder={{
            uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEVgJJMUZcpAAAAABJRU5ErkJggg==',
          }}
        />
      ) : (
        <View style={[styles.fallback, { backgroundColor: '#6366F1' }]}>
          <Text style={styles.fallbackText}>{fallbackText || '?'}</Text>
        </View>
      )}
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
  fallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
