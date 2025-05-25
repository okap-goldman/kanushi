import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

const DropdownMenuContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ children }: { children: React.ReactNode }) {
  const { setOpen } = React.useContext(DropdownMenuContext);

  return <TouchableOpacity onPress={() => setOpen(true)}>{children}</TouchableOpacity>;
}

export function DropdownMenuContent({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = React.useContext(DropdownMenuContext);

  if (!open) return null;

  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
      <TouchableWithoutFeedback onPress={() => setOpen(false)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.content}>
              <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export function DropdownMenuItem({ children, onPress, disabled }: DropdownMenuItemProps) {
  const { setOpen } = React.useContext(DropdownMenuContext);

  const handlePress = () => {
    if (!disabled) {
      onPress?.();
      setOpen(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.item, disabled && styles.disabled]}
      onPress={handlePress}
      disabled={disabled}
    >
      {typeof children === 'string' ? (
        <Text style={[styles.itemText, disabled && styles.disabledText]}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

export function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.label}>
      <Text style={styles.labelText}>{children}</Text>
    </View>
  );
}

export function DropdownMenuSeparator() {
  return <View style={styles.separator} />;
}

export function DropdownMenuCheckboxItem({
  children,
  checked,
  onCheckedChange,
  disabled,
}: DropdownMenuItemProps & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  const { setOpen } = React.useContext(DropdownMenuContext);

  const handlePress = () => {
    if (!disabled) {
      onCheckedChange?.(!checked);
      setOpen(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.item, disabled && styles.disabled]}
      onPress={handlePress}
      disabled={disabled}
    >
      <View style={styles.checkboxItem}>
        <View style={styles.checkbox}>{checked && <Text style={styles.checkmark}>✓</Text>}</View>
        <Text style={[styles.itemText, disabled && styles.disabledText]}>{children}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    minWidth: 200,
    maxWidth: 300,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
  },
  itemText: {
    fontSize: 14,
    color: '#1A202C',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#718096',
  },
  label: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
  },
  separator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
    marginHorizontal: -8,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 3,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 10,
    color: '#0070F3',
    fontWeight: 'bold',
  },
});
