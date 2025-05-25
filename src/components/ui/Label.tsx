import type React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

interface LabelProps extends TextProps {
  children?: React.ReactNode;
  disabled?: boolean;
}

export function Label({ children, disabled, style, ...props }: LabelProps) {
  return (
    <Text style={[styles.label, disabled && styles.disabled, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#1A202C',
  },
  disabled: {
    opacity: 0.7,
  },
});
