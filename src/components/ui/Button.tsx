import type React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  type TextStyle,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';
import { theme } from '../../lib/theme';

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

  const textStyles = [styles.text, styles[`${variant}Text`], styles[`${size}Text`], textStyle];

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
          color={variant === 'primary' || variant === 'destructive' ? theme.colors.text.inverse : theme.colors.primary.main}
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
    backgroundColor: theme.colors.primary.main,
    borderWidth: 1,
    borderColor: theme.colors.primary.main,
  },
  primaryText: {
    color: theme.colors.text.inverse,
  },

  secondary: {
    backgroundColor: theme.colors.background.rose.light,
    borderWidth: 1,
    borderColor: theme.colors.border.rose,
  },
  secondaryText: {
    color: theme.colors.secondary.dark,
  },

  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  outlineText: {
    color: theme.colors.text.primary,
  },

  ghost: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: theme.colors.text.primary,
  },

  link: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  linkText: {
    color: theme.colors.primary.main,
    textDecorationLine: 'underline',
  },

  destructive: {
    backgroundColor: theme.colors.status.error,
    borderWidth: 1,
    borderColor: theme.colors.status.error,
  },
  destructiveText: {
    color: theme.colors.text.inverse,
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
