import React from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

interface TextareaProps extends TextInputProps {
  disabled?: boolean;
}

export function Textarea({ disabled, style, ...props }: TextareaProps) {
  return (
    <TextInput
      multiline
      textAlignVertical="top"
      style={[styles.textarea, disabled && styles.disabled, style]}
      editable={!disabled}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  textarea: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1A202C',
  },
  disabled: {
    backgroundColor: '#F8FAFC',
    opacity: 0.5,
  },
});
