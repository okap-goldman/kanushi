import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';

type SpinnerSize = 'sm' | 'default' | 'lg' | 'xl';
type SpinnerVariant = 'default' | 'secondary' | 'muted' | 'white';

interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  style?: ViewStyle;
}

export function Spinner({ size = 'default', variant = 'default', style }: SpinnerProps) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => animation.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sizeStyles = {
    sm: { width: 16, height: 16, borderWidth: 2 },
    default: { width: 20, height: 20, borderWidth: 2 },
    lg: { width: 24, height: 24, borderWidth: 3 },
    xl: { width: 32, height: 32, borderWidth: 3 },
  };

  const variantStyles = {
    default: {
      borderColor: '#2563eb',
      borderRightColor: 'transparent',
    },
    secondary: {
      borderColor: '#6b7280',
      borderRightColor: 'transparent',
    },
    muted: {
      borderColor: '#9ca3af',
      borderRightColor: 'transparent',
    },
    white: {
      borderColor: '#FFFFFF',
      borderRightColor: 'transparent',
    },
  };

  return (
    <Animated.View
      style={[
        styles.spinner,
        sizeStyles[size],
        variantStyles[variant],
        { transform: [{ rotate: spin }] },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="読み込み中"
    />
  );
}

const styles = StyleSheet.create({
  spinner: {
    borderRadius: 999,
  },
});
