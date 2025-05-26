import type React from 'react';
import { StyleSheet, Text, type TextStyle, View, type ViewStyle } from 'react-native';
import { theme } from '../../lib/theme';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({ children, variant = 'default', style, textStyle }: BadgeProps) {
  const variantStyles = {
    default: {
      container: styles.variantDefault,
      text: styles.variantDefaultText,
    },
    secondary: {
      container: styles.variantSecondary,
      text: styles.variantSecondaryText,
    },
    destructive: {
      container: styles.variantDestructive,
      text: styles.variantDestructiveText,
    },
    outline: {
      container: styles.variantOutline,
      text: styles.variantOutlineText,
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <View style={[styles.badge, currentVariant.container, style]}>
      <Text style={[styles.badgeText, currentVariant.text, textStyle]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Default variant - Pink Gold accent
  variantDefault: {
    backgroundColor: theme.colors.accent.main,
    borderColor: theme.colors.accent.main,
  },
  variantDefaultText: {
    color: theme.colors.text.inverse,
  },
  // Secondary variant - Emerald subtle
  variantSecondary: {
    backgroundColor: theme.colors.background.emerald.light,
    borderColor: theme.colors.border.emerald,
  },
  variantSecondaryText: {
    color: theme.colors.primary.dark,
  },
  // Destructive variant
  variantDestructive: {
    backgroundColor: theme.colors.status.error,
    borderColor: theme.colors.status.error,
  },
  variantDestructiveText: {
    color: theme.colors.text.inverse,
  },
  // Outline variant
  variantOutline: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.border.default,
  },
  variantOutlineText: {
    color: theme.colors.text.primary,
  },
});
