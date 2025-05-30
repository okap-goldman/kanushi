// Node.js polyfills for React Native
import { Buffer } from 'buffer';
import process from 'process';

// Make Buffer available globally
global.Buffer = Buffer;
global.process = process;

// Export for type checking
export { Buffer, process };