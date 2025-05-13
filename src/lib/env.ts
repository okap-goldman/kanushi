// Environment variables helper to handle safely loading from import.meta.env in Vite

// Helper function for safely reading environment variables with default fallbacks
function getEnvVar(key: string, defaultValue: string = ''): string {
  if (import.meta.env[key] !== undefined) {
    return import.meta.env[key] as string;
  }
  return defaultValue;
}

// OpenRouter API key
export const OPENROUTER_API_KEY = getEnvVar('VITE_OPENROUTER_API_KEY', '');

// Check if we're in development mode
export const IS_DEV = getEnvVar('NODE_ENV', 'development') === 'development';

// Export other environment variables as needed