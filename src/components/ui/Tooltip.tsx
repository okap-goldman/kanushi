import type React from 'react';
import { useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  delay?: number;
}

export function Tooltip({ children, content, delay = 500 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();
  const triggerRef = useRef<TouchableOpacity>(null);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      triggerRef.current?.measure((x, y, width, height, pageX, pageY) => {
        const screenWidth = Dimensions.get('window').width;
        const tooltipX = Math.min(pageX, screenWidth - 150);

        setPosition({
          x: tooltipX,
          y: pageY - 40,
        });

        setVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  return (
    <>
      <TouchableOpacity
        ref={triggerRef}
        onPressIn={showTooltip}
        onPressOut={hideTooltip}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>

      {visible && (
        <Animated.View
          style={[
            styles.tooltip,
            {
              opacity: fadeAnim,
              transform: [{ translateX: position.x }, { translateY: position.y }],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.tooltipText}>{content}</Text>
        </Animated.View>
      )}
    </>
  );
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export const TooltipTrigger = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const TooltipContent = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    maxWidth: 200,
    zIndex: 9999,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
});
