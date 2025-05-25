import type React from 'react';
import { StyleSheet, Text, type TextStyle, View, type ViewStyle } from 'react-native';

type AlertVariant = 'default' | 'destructive';

interface AlertProps {
  children: React.ReactNode;
  variant?: AlertVariant;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

interface AlertTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export function Alert({ children, variant = 'default', style, icon }: AlertProps) {
  const variantStyles = {
    default: styles.variantDefault,
    destructive: styles.variantDestructive,
  };

  return (
    <View style={[styles.alert, variantStyles[variant], style]} accessibilityRole="alert">
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={[styles.contentContainer, icon && styles.contentWithIcon]}>{children}</View>
    </View>
  );
}

export function AlertTitle({ children, style }: AlertTitleProps) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function AlertDescription({ children, style }: AlertDescriptionProps) {
  return <Text style={[styles.description, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  alert: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
  },
  // Default variant
  variantDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#e5e7eb',
  },
  // Destructive variant
  variantDestructive: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  iconContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  contentContainer: {
    flex: 1,
  },
  contentWithIcon: {
    paddingLeft: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    lineHeight: 20,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});
