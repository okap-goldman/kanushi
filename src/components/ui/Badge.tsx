import type React from 'react';
import { StyleSheet, Text, type TextStyle, View, type ViewStyle } from 'react-native';

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
  // Default variant
  variantDefault: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  variantDefaultText: {
    color: '#FFFFFF',
  },
  // Secondary variant
  variantSecondary: {
    backgroundColor: '#f3f4f6',
    borderColor: '#f3f4f6',
  },
  variantSecondaryText: {
    color: '#374151',
  },
  // Destructive variant
  variantDestructive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  variantDestructiveText: {
    color: '#FFFFFF',
  },
  // Outline variant
  variantOutline: {
    backgroundColor: 'transparent',
    borderColor: '#e5e7eb',
  },
  variantOutlineText: {
    color: '#1a1a1a',
  },
});
