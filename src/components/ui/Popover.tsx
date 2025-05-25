import React, { useState, useRef } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface PopoverProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface PopoverContentProps {
  children: React.ReactNode;
  style?: any;
}

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<View>;
}>({
  open: false,
  setOpen: () => {},
  triggerRef: React.createRef(),
});

export function Popover({
  children,
  open: controlledOpen,
  onOpenChange,
}: Omit<PopoverProps, 'trigger'>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const triggerRef = useRef<View>(null);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({ children }: { children: React.ReactNode }) {
  const { setOpen, triggerRef } = React.useContext(PopoverContext);

  return (
    <TouchableOpacity ref={triggerRef} onPress={() => setOpen(true)}>
      {children}
    </TouchableOpacity>
  );
}

export function PopoverContent({ children, style }: PopoverContentProps) {
  const { open, setOpen } = React.useContext(PopoverContext);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (open) {
      // Simple positioning - can be enhanced based on trigger position
      const { height } = Dimensions.get('window');
      setPosition({
        top: height * 0.3,
        left: 20,
      });
    }
  }, [open]);

  if (!open) return null;

  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
      <TouchableWithoutFeedback onPress={() => setOpen(false)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.content, { top: position.top, left: position.left }, style]}>
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  content: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: Dimensions.get('window').width - 40,
  },
});
