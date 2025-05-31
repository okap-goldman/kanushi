import { Check, ChevronDown } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../../lib/theme';

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
      <ChevronDown size={16} color={theme.colors.text.muted} />
    </View>
  );
}

export function SelectContent({ children }: SelectContentProps) {
  const { open, setOpen } = React.useContext(SelectContext);

  if (!open) return null;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
        <Pressable style={styles.contentContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.content}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
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
      style={[styles.item, isSelected && styles.itemSelected, disabled && styles.itemDisabled]}
      onPress={handlePress}
      disabled={disabled}
    >
      <View style={styles.itemCheckContainer}>
        {isSelected && <Check size={16} color={theme.colors.primary.main} />}
      </View>
      <Text
        style={[
          styles.itemText,
          isSelected && styles.itemTextSelected,
          disabled && styles.itemTextDisabled,
        ]}
      >
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

// Attach Item and other components to Select for convenient access
Select.Trigger = SelectTrigger;
Select.Value = SelectValue;
Select.Content = SelectContent;
Select.Item = SelectItem;
Select.Group = SelectGroup;
Select.Label = SelectLabel;
Select.Separator = SelectSeparator;

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
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
    color: theme.colors.text.primary,
    flex: 1,
  },
  placeholder: {
    color: theme.colors.text.light,
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
    backgroundColor: theme.colors.background.primary,
    borderRadius: 12,
    overflow: 'hidden',
    // Themed shadow
    ...theme.shadows.lg,
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
    backgroundColor: theme.colors.background.emerald.subtle,
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
    color: theme.colors.text.primary,
    flex: 1,
  },
  itemTextSelected: {
    fontWeight: '500',
  },
  itemTextDisabled: {
    color: theme.colors.text.light,
  },
  group: {
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.muted,
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginVertical: 4,
    marginHorizontal: 8,
  },
});
