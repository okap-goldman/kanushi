import React from 'react';
import {
  type TextInputProps as RNTextInputProps,
  StyleSheet,
  Text,
  TextInput,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { theme } from '../../lib/theme';

interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  leftIcon,
  rightIcon,
  ...props
}: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View style={[styles.inputContainer, error ? styles.inputContainerError : null]}>
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            inputStyle,
          ]}
          placeholderTextColor={theme.colors.text.light}
          autoCapitalize="none"
          {...props}
        />
        {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
      </View>
      {error && <Text style={[styles.error, errorStyle]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: theme.colors.text.secondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: 8,
    backgroundColor: theme.colors.background.primary,
  },
  inputContainerError: {
    borderColor: theme.colors.status.error,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  leftIconContainer: {
    paddingLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    fontSize: 12,
    color: theme.colors.status.error,
    marginTop: 4,
  },
});
