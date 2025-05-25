import { vi } from 'vitest';

// React Nativeのモック
export default {
  Platform: {
    OS: 'ios',
    select: (obj: any) => obj.ios || obj.default,
  },
  StyleSheet: {
    create: (styles: any) => styles,
  },
  Dimensions: {
    get: () => ({ width: 375, height: 812 }),
  },
};

export const Alert = {
  alert: vi.fn(),
};

export const Text = (props: any) => {
  const React = require('react');
  return React.createElement('span', props, props.children);
};

export const View = (props: any) => {
  const React = require('react');
  return React.createElement('div', props, props.children);
};

export const TouchableOpacity = (props: any) => {
  const React = require('react');
  return React.createElement(
    'button',
    {
      ...props,
      onClick: props.onPress,
    },
    props.children
  );
};

export const ScrollView = (props: any) => {
  const React = require('react');
  return React.createElement('div', props, props.children);
};

export const TextInput = (props: any) => {
  const React = require('react');
  return React.createElement('input', {
    ...props,
    onChange: (e: any) => props.onChangeText?.(e.target.value),
  });
};

export const Switch = (props: any) => {
  const React = require('react');
  return React.createElement('input', {
    type: 'checkbox',
    checked: props.value,
    onChange: (e: any) => props.onValueChange?.(e.target.checked),
    testID: props.testID,
  });
};

export const Modal = (props: any) => {
  const React = require('react');
  if (!props.visible) return null;
  return React.createElement(
    'div',
    {
      testID: 'modal',
      style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 },
    },
    props.children
  );
};

export const Picker = (props: any) => {
  const React = require('react');
  return React.createElement(
    'select',
    {
      ...props,
      value: props.selectedValue,
      onChange: (e: any) => props.onValueChange?.(e.target.value),
      testID: props.testID,
    },
    props.children
  );
};

Picker.Item = (props: any) => {
  const React = require('react');
  return React.createElement(
    'option',
    {
      value: props.value,
    },
    props.label
  );
};
