import type React from 'react';
import { ScrollView, type ScrollViewProps, StyleSheet } from 'react-native';

interface ScrollAreaProps extends ScrollViewProps {
  children?: React.ReactNode;
}

export function ScrollArea({ children, style, ...props }: ScrollAreaProps) {
  return (
    <ScrollView
      style={[styles.container, style]}
      showsVerticalScrollIndicator={true}
      showsHorizontalScrollIndicator={false}
      {...props}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
