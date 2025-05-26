import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

interface ProgressProps extends ViewProps {
  value?: number;
  max?: number;
}

export function Progress({ value = 0, max = 100, style, ...props }: ProgressProps) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

  return (
    <View style={[styles.container, style]} {...props}>
      <View style={[styles.indicator, { width: `${percentage}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 16,
    width: '100%',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  indicator: {
    height: '100%',
    backgroundColor: '#0070F3',
  },
});
