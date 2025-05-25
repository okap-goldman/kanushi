import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useToast } from '../../hooks/use-toast';
import { Toast, ToastProps } from './Toast';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={() => dismiss(toast.id)} />
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
