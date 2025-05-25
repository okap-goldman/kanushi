import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup/api.ts', './test/setup/ui.ts'],
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        'mobile/',
        '.expo/',
        'dist/'
      ]
    },
    // React Native関連のモジュールを外部依存として扱う
    server: {
      deps: {
        external: [
          'react-native',
          'react-native-url-polyfill',
          'expo*',
          '@expo*'
        ],
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react-native': path.resolve(__dirname, './test/mocks/react-native.ts'),
      'react-native-url-polyfill/auto': path.resolve(__dirname, './test/mocks/empty.ts')
    }
  }
});