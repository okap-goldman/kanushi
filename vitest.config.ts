import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup/api.ts', './test/setup/ui.ts'],
    alias: {
      jest: 'vitest',
    },
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'test/', 'mobile/', '.expo/', 'dist/'],
    },
    // React Native関連のモジュールを外部依存として扱う
    server: {
      deps: {
        external: [
          'react-native',
          'react-native-url-polyfill',
          'expo*',
          '@expo*',
          'react-native-gesture-handler',
        ],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react-native': path.resolve(__dirname, './test/mocks/react-native.ts'),
      'react-native-url-polyfill/auto': path.resolve(__dirname, './test/mocks/empty.ts'),
      'react-native-gesture-handler/jestSetup': path.resolve(__dirname, './test/mocks/empty.ts'),
      'react-native-gesture-handler': path.resolve(__dirname, './test/mocks/empty.ts'),
      '@testing-library/react-native': path.resolve(
        __dirname,
        './test/mocks/testing-library-react-native.ts'
      ),
      '@react-native-community/datetimepicker': path.resolve(
        __dirname,
        './test/mocks/datetimepicker.ts'
      ),
      '@react-native-picker/picker': path.resolve(__dirname, './test/mocks/empty.ts'),
    },
  },
});
