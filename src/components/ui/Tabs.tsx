import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  type TextStyle,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { theme } from '../../lib/theme';

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

interface TabsListProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
}>({
  value: '',
  onValueChange: () => {},
});

export function Tabs({
  defaultValue = '',
  value: controlledValue,
  onValueChange,
  children,
  style,
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setUncontrolledValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <View style={[styles.container, style]}>{children}</View>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, style }: TabsListProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.listContent, style]}
      style={styles.list}
    >
      <View style={styles.listInner}>{children}</View>
    </ScrollView>
  );
}

export function TabsTrigger({ value, children, disabled, style, textStyle }: TabsTriggerProps) {
  const { value: activeValue, onValueChange } = React.useContext(TabsContext);
  const isActive = activeValue === value;

  return (
    <TouchableOpacity
      style={[
        styles.trigger,
        isActive && styles.triggerActive,
        disabled && styles.triggerDisabled,
        style,
      ]}
      onPress={() => !disabled && onValueChange(value)}
      disabled={disabled}
    >
      <Text
        style={[
          styles.triggerText,
          isActive && styles.triggerTextActive,
          disabled && styles.triggerTextDisabled,
          textStyle,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

export function TabsContent({ value, children, style }: TabsContentProps) {
  const { value: activeValue } = React.useContext(TabsContext);

  if (activeValue !== value) {
    return null;
  }

  return <View style={[styles.content, style]}>{children}</View>;
}

// Add subcomponents to Tabs
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingHorizontal: 4,
  },
  listInner: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
    padding: 4,
  },
  trigger: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  triggerActive: {
    backgroundColor: theme.colors.background.primary,
    // Themed shadow
    ...theme.shadows.sm,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.muted,
  },
  triggerTextActive: {
    color: theme.colors.primary.main,
  },
  triggerTextDisabled: {
    color: theme.colors.text.light,
  },
  content: {
    marginTop: 8,
    flex: 1,
  },
});
