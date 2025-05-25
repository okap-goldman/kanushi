import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

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

export function TabsTrigger({
  value,
  children,
  disabled,
  style,
  textStyle,
}: TabsTriggerProps) {
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
    backgroundColor: '#f3f4f6',
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
    backgroundColor: '#FFFFFF',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // Android shadow
    elevation: 2,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  triggerTextActive: {
    color: '#1a1a1a',
  },
  triggerTextDisabled: {
    color: '#9ca3af',
  },
  content: {
    marginTop: 8,
    flex: 1,
  },
});