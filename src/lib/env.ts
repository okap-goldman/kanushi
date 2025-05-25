// Environment variables helper to handle safely loading in Expo

// Expo uses process.env for environment variables
// You can also use expo-constants for additional configuration

// Helper function for safely reading environment variables with default fallbacks
function getEnvVar(key: string, defaultValue: string = ''): string {
  if (process.env[key] !== undefined) {
    return process.env[key] as string;
  }
  return defaultValue;
}

// OpenRouter API key
export const OPENROUTER_API_KEY = getEnvVar('OPENROUTER_API_KEY', '');

// Check if we're in development mode
export const IS_DEV = __DEV__ || false;

// Export other environment variables as needed