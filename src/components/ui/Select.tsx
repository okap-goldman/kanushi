import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

interface SelectTriggerProps {
  children?: React.ReactNode;
  disabled?: boolean;
}

interface SelectValueProps {
  placeholder?: string;
}

interface SelectContentProps {
  children?: React.ReactNode;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

interface SelectGroupProps {
  children?: React.ReactNode;
}

interface SelectLabelProps {
  children: React.ReactNode;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
}>({
  open: false,
  setOpen: () => {},
});

export function Select({ value, onValueChange, placeholder, disabled, children }: SelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange,
        open,
        setOpen,
        placeholder,
        disabled,
      }}
    >
      {children}
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, disabled: propDisabled }: SelectTriggerProps) {
  const { setOpen, disabled: contextDisabled } = React.useContext(SelectContext);
  const disabled = propDisabled || contextDisabled;

  return (
    <TouchableOpacity
      style={[styles.trigger, disabled && styles.triggerDisabled]}
      onPress={() => !disabled && setOpen(true)}
      disabled={disabled}
    >
      {children}
    </TouchableOpacity>
  );
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const { value, placeholder: contextPlaceholder } = React.useContext(SelectContext);
  const displayPlaceholder = placeholder || contextPlaceholder;

  return (
    <View style={styles.valueContainer}>
      <Text style={[styles.value, !value && styles.placeholder]}>
        {value || displayPlaceholder || 'Select...'}
      </Text>
      <ChevronDown size={16} color="#666" />
    </View>
  );
}

export function SelectContent({ children }: SelectContentProps) {
  const { open, setOpen } = React.useContext(SelectContext);

  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <Pressable
        style={styles.overlay}
        onPress={() => setOpen(false)}
      >
        <Pressable
          style={styles.contentContainer}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.content}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.scrollView}
            >
              {children}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function SelectItem({ value, children, disabled }: SelectItemProps) {
  const { value: selectedValue, onValueChange, setOpen } = React.useContext(SelectContext);
  const isSelected = selectedValue === value;

  const handlePress = () => {
    if (!disabled) {
      onValueChange?.(value);
      setOpen(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.item,
        isSelected && styles.itemSelected,
        disabled && styles.itemDisabled,
      ]}
      onPress={handlePress}
      disabled={disabled}
    >
      <View style={styles.itemCheckContainer}>
        {isSelected && <Check size={16} color="#2563eb" />}
      </View>
      <Text style={[
        styles.itemText,
        isSelected && styles.itemTextSelected,
        disabled && styles.itemTextDisabled,
      ]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

export function SelectGroup({ children }: SelectGroupProps) {
  return <View style={styles.group}>{children}</View>;
}

export function SelectLabel({ children }: SelectLabelProps) {
  return <Text style={styles.label}>{children}</Text>;
}

export function SelectSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  valueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
  },
  placeholder: {
    color: '#999999',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Android shadow
    elevation: 5,
  },
  scrollView: {
    maxHeight: 300,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  itemSelected: {
    backgroundColor: '#f3f4f6',
  },
  itemDisabled: {
    opacity: 0.5,
  },
  itemCheckContainer: {
    width: 24,
    height: 24,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
  },
  itemTextSelected: {
    fontWeight: '500',
  },
  itemTextDisabled: {
    color: '#999999',
  },
  group: {
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginVertical: 4,
    marginHorizontal: 8,
  },
});