import { useCallback, useState } from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';

export type ToastVariant = 'default' | 'destructive';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactElement;
  variant?: ToastVariant;
}

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  action?: React.ReactElement;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const { title, description, variant = 'default' } = options;

    if (Platform.OS === 'android') {
      // Use native Android toast
      ToastAndroid.show(description || title || 'Notification', ToastAndroid.SHORT);
    } else {
      // Use Alert for iOS
      Alert.alert(title || 'Notification', description, [{ text: 'OK' }]);
    }

    // Still maintain internal state for custom toast implementations if needed
    const id = Date.now().toString();
    const newToast: Toast = {
      id,
      ...options,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    } else {
      setToasts([]);
    }
  }, []);

  return {
    toast,
    dismiss,
    toasts,
  };
}
