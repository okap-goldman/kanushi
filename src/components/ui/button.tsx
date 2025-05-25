import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  testID?: string;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
  testID,
}: ButtonProps) {
  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' || variant === 'destructive' ? '#FFFFFF' : '#0070F3'} 
        />
      ) : (
        <Text style={textStyles}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  
  // Variants
  primary: {
    backgroundColor: '#0070F3',
    borderWidth: 1,
    borderColor: '#0070F3',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  
  secondary: {
    backgroundColor: '#EEF4FF',
    borderWidth: 1,
    borderColor: '#EEF4FF',
  },
  secondaryText: {
    color: '#0070F3',
  },
  
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  outlineText: {
    color: '#1E293B',
  },
  
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: '#1E293B',
  },
  
  link: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  linkText: {
    color: '#0070F3',
    textDecorationLine: 'underline',
  },
  
  destructive: {
    backgroundColor: '#DC2626',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  destructiveText: {
    color: '#FFFFFF',
  },
  
  // Sizes
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smText: {
    fontSize: 14,
  },
  
  md: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  mdText: {
    fontSize: 16,
  },
  
  lg: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  lgText: {
    fontSize: 18,
  },
});