import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';

interface SeparatorProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical';
}

export function Separator({ orientation = 'horizontal', style, ...props }: SeparatorProps) {
  return (
    <View
      style={[
        styles.separator,
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        style
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  separator: {
    backgroundColor: '#E2E8F0',
  },
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
  },
});