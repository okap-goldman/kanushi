import React from 'react';
import { Switch as RNSwitch, type SwitchProps as RNSwitchProps, StyleSheet } from 'react-native';
import { theme } from '../../lib/theme';

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
      trackColor={{ false: theme.colors.border.light, true: theme.colors.primary.main }}
      thumbColor={checked ? theme.colors.text.inverse : theme.colors.background.secondary}
      ios_backgroundColor={theme.colors.border.light}
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
