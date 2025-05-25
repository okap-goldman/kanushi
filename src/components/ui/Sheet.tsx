import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { X } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}

interface SheetTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  onPress?: () => void;
}

interface SheetContentProps {
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  showCloseButton?: boolean;
}

interface SheetHeaderProps {
  children: React.ReactNode;
}

interface SheetFooterProps {
  children: React.ReactNode;
}

interface SheetTitleProps {
  children: React.ReactNode;
}

interface SheetDescriptionProps {
  children: React.ReactNode;
}

const SheetContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  onOpenChange: () => {},
});

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({ children, asChild, onPress }: SheetTriggerProps) {
  const { onOpenChange } = React.useContext(SheetContext);
  
  const handlePress = () => {
    onOpenChange(true);
    onPress?.();
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, {
      onPress: handlePress,
    });
  }

  return (
    <TouchableOpacity onPress={handlePress}>
      {children}
    </TouchableOpacity>
  );
}

export function SheetContent({ 
  children, 
  side = 'bottom',
  showCloseButton = true 
}: SheetContentProps) {
  const { open, onOpenChange } = React.useContext(SheetContext);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      const toValue = side === 'bottom' || side === 'top' ? 0 : 0;
      Animated.spring(
        side === 'left' || side === 'right' ? translateX : translateY,
        {
          toValue,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }
      ).start();
    } else {
      const toValue = side === 'bottom' ? SCREEN_HEIGHT : 
                      side === 'top' ? -SCREEN_HEIGHT :
                      side === 'left' ? -SCREEN_HEIGHT :
                      SCREEN_HEIGHT;
      Animated.timing(
        side === 'left' || side === 'right' ? translateX : translateY,
        {
          toValue,
          duration: 250,
          useNativeDriver: true,
        }
      ).start();
    }
  }, [open, side, translateY, translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (side === 'bottom' && gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (side === 'bottom' && gestureState.dy > 50) {
          onOpenChange(false);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!open) return null;

  const animatedStyle = {
    transform: [
      side === 'bottom' || side === 'top' 
        ? { translateY } 
        : { translateX }
    ],
  };

  const contentStyle = [
    styles.content,
    side === 'bottom' && styles.contentBottom,
    side === 'top' && styles.contentTop,
    side === 'left' && styles.contentLeft,
    side === 'right' && styles.contentRight,
  ];

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
        <Pressable
          style={styles.overlay}
          onPress={() => onOpenChange(false)}
        >
          <Animated.View
            style={[contentStyle, animatedStyle]}
            {...(side === 'bottom' ? panResponder.panHandlers : {})}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              {side === 'bottom' && (
                <View style={styles.handle} />
              )}
              {showCloseButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => onOpenChange(false)}
                >
                  <X size={20} color="#666" />
                </TouchableOpacity>
              )}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {children}
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function SheetHeader({ children }: SheetHeaderProps) {
  return <View style={styles.header}>{children}</View>;
}

export function SheetFooter({ children }: SheetFooterProps) {
  return <View style={styles.footer}>{children}</View>;
}

export function SheetTitle({ children }: SheetTitleProps) {
  return <Text style={styles.title}>{children}</Text>;
}

export function SheetDescription({ children }: SheetDescriptionProps) {
  return <Text style={styles.description}>{children}</Text>;
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Android shadow
    elevation: 5,
  },
  contentBottom: {
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '90%',
  },
  contentTop: {
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    maxHeight: '90%',
  },
  contentLeft: {
    top: 0,
    bottom: 0,
    left: 0,
    width: '80%',
    maxWidth: 320,
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  contentRight: {
    top: 0,
    bottom: 0,
    right: 0,
    width: '80%',
    maxWidth: 320,
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
    padding: 4,
  },
  scrollContent: {
    flexGrow: 1,
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