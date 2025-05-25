import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}

interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  onPress?: () => void;
}

interface DialogContentProps {
  children: React.ReactNode;
  showCloseButton?: boolean;
}

interface DialogHeaderProps {
  children: React.ReactNode;
}

interface DialogFooterProps {
  children: React.ReactNode;
}

interface DialogTitleProps {
  children: React.ReactNode;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
}

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  onOpenChange: () => {},
});

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({ children, asChild, onPress }: DialogTriggerProps) {
  const { onOpenChange } = React.useContext(DialogContext);

  const handlePress = () => {
    onOpenChange(true);
    onPress?.();
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, {
      onPress: handlePress,
    });
  }

  return <TouchableOpacity onPress={handlePress}>{children}</TouchableOpacity>;
}

export function DialogContent({ children, showCloseButton = true }: DialogContentProps) {
  const { open, onOpenChange } = React.useContext(DialogContext);

  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => onOpenChange(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <Pressable style={styles.overlay} onPress={() => onOpenChange(false)}>
          <Pressable style={styles.contentContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.content}>
              {showCloseButton && (
                <TouchableOpacity style={styles.closeButton} onPress={() => onOpenChange(false)}>
                  <X size={20} color="#666" />
                </TouchableOpacity>
              )}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {children}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return <View style={styles.header}>{children}</View>;
}

export function DialogFooter({ children }: DialogFooterProps) {
  return <View style={styles.footer}>{children}</View>;
}

export function DialogTitle({ children }: DialogTitleProps) {
  return <Text style={styles.title}>{children}</Text>;
}

export function DialogDescription({ children }: DialogDescriptionProps) {
  return <Text style={styles.description}>{children}</Text>;
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
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
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    maxHeight: '80%',
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
  scrollContent: {
    flexGrow: 1,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
    padding: 4,
  },
  header: {
    marginBottom: 16,
  },
  footer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});
