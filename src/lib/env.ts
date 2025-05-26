// Environment variables helper to handle safely loading in Expo

// Expo uses process.env for environment variables
// You can also use expo-constants for additional configuration

// Helper function for safely reading environment variables with default fallbacks
function getEnvVar(key: string, defaultValue = ''): string {
  if (process.env[key] !== undefined) {
    return process.env[key] as string;
  }
  return defaultValue;
}

// OpenRouter API key
export const OPENROUTER_API_KEY = getEnvVar('OPENROUTER_API_KEY', '');

// Stripe configuration
export const STRIPE_SECRET_KEY = getEnvVar('STRIPE_SECRET_KEY', '');
export const STRIPE_PUBLISHABLE_KEY = getEnvVar('STRIPE_PUBLISHABLE_KEY', '');
export const STRIPE_WEBHOOK_SECRET = getEnvVar('STRIPE_WEBHOOK_SECRET', '');

// Check if we're in development mode
export const IS_DEV = __DEV__ || false;

// Export all environment variables as a single object for easy access
export const env = {
  OPENROUTER_API_KEY,
  STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET,
  IS_DEV,
};
