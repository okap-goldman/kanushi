// API test setup
import { beforeEach, vi } from 'vitest';

// グローバル変数の定義
(global as any).__DEV__ = true;
(global as any).fetch = vi.fn();

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
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      rangegt: vi.fn().mockReturnThis(),
      rangegte: vi.fn().mockReturnThis(),
      rangelt: vi.fn().mockReturnThis(),
      rangelts: vi.fn().mockReturnThis(),
      adjacent: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      abortSignal: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      csv: vi.fn().mockResolvedValue({ data: '', error: null }),
      geojson: vi.fn().mockResolvedValue({ data: null, error: null }),
      explain: vi.fn().mockResolvedValue({ data: '', error: null }),
      rollback: vi.fn().mockResolvedValue({ data: null, error: null }),
      returns: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}));

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
