import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashScreen } from './src/components/SplashScreen';
import { AuthProvider } from './src/context/AuthContext';
import { AudioProvider } from './src/context/AudioContext';
import Navigation from './src/navigation';
// Polyfill for Animated.createAnimatedComponent
import 'react-native-reanimated';
// Crypto polyfill for web
import './src/lib/crypto-polyfill';

export default function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate splash screen loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen onFinish={() => setIsLoading(false)} />;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AudioProvider>
              <Navigation />
              <StatusBar style="auto" />
            </AudioProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
