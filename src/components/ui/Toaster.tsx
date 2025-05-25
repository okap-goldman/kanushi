import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Toast, ToastProps } from './Toast';
import { useToast } from '../../hooks/use-toast';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onDismiss={() => dismiss(toast.id)}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  toastContainer: {
    paddingTop: 50,
  },
});