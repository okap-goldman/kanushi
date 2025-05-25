import React from 'react';
import { Switch as RNSwitch, type SwitchProps as RNSwitchProps, StyleSheet } from 'react-native';

interface SwitchProps extends RNSwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function Switch({ checked = false, onChange, disabled, ...props }: SwitchProps) {
  return (
    <RNSwitch
      value={checked}
      onValueChange={onChange}
      disabled={disabled}
      trackColor={{ false: '#E2E8F0', true: '#0070F3' }}
      thumbColor={checked ? '#FFFFFF' : '#F8FAFC'}
      ios_backgroundColor="#E2E8F0"
      style={[styles.switch, disabled && styles.disabled]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
