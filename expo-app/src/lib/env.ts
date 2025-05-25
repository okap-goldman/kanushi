// Environment variables helper for React Native/Expo

// In React Native, we can use process.env with Expo
// or use expo-constants for more complex configurations

// Helper function for safely reading environment variables with default fallbacks
function getEnvVar(key: string, defaultValue: string = ''): string {
  // In Expo, environment variables can be accessed through process.env
  // when using EAS Build or local .env files with expo-constants
  if (process.env[key] !== undefined) {
    return process.env[key] as string;
  }
  return defaultValue;
}

// OpenRouter API key
export const OPENROUTER_API_KEY = getEnvVar('EXPO_PUBLIC_OPENROUTER_API_KEY', '');

// Supabase configuration
export const SUPABASE_URL = getEnvVar('EXPO_PUBLIC_SUPABASE_URL', '');
export const SUPABASE_ANON_KEY = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY', '');

// Check if we're in development mode
export const IS_DEV = __DEV__ || false;

// API endpoints
export const API_BASE_URL = IS_DEV 
  ? 'http://localhost:3000' 
  : 'https://api.kanushi.app';

// Export other environment variables as needed