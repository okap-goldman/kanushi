// API test setup
import { beforeEach, vi } from 'vitest';

// グローバル変数の定義
global.__DEV__ = true;
global.fetch = vi.fn();

// React NativeとExpo関連のモック
vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: (obj: any) => obj.ios || obj.default,
  },
  StyleSheet: {
    create: (styles: any) => styles,
  },
  Dimensions: {
    get: () => ({ width: 375, height: 812 }),
  },
}));

// Expo関連のモジュールをモック
vi.mock('expo-modules-core', () => ({
  Platform: {
    OS: 'ios',
  },
  NativeModulesProxy: {},
  requireNativeModule: vi.fn(() => ({})),
}));

vi.mock('expo-secure-store', () => ({
  setItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock('expo-crypto', () => ({
  randomUUID: () => 'mock-uuid',
  digestStringAsync: vi.fn(),
}));

// Supabase関連のモックを設定
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithIdToken: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  })),
}));

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});