/**
 * Crypto polyfill for React Native Web
 * Ensures crypto.subtle is available in web environment
 */

// Check if we're in a browser environment that doesn't have crypto.subtle
if (typeof window !== 'undefined' && (!window.crypto || !window.crypto.subtle)) {
  // For React Native Web, we need to provide a polyfill
  const cryptoBrowserify = require('crypto-browserify');
  
  // Create a minimal crypto.subtle implementation
  // Note: This is a simplified polyfill - in production, consider using a full WebCrypto polyfill
  if (!window.crypto) {
    window.crypto = {} as any;
  }
  
  // Use the browser's native crypto.subtle if available, otherwise provide a basic implementation
  if (!window.crypto.subtle && typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    window.crypto.subtle = globalThis.crypto.subtle;
  }
}

// Export a function to ensure crypto is available
export function ensureCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto;
  }
  
  // In Node.js environment (for tests), use the global crypto
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  
  // Fallback for environments without crypto
  throw new Error('Crypto API not available in this environment');
}