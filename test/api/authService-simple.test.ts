import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../src/lib/authService';

// 簡単なモック実装
const mockSupabase = {
  auth: {
    signInWithIdToken: vi.fn(),
    signOut: vi.fn(),
    refreshSession: vi.fn(),
    getUser: vi.fn(),
    getSession: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
  },
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(),
    })),
  })),
};

describe('AuthService - Google OAuth認証', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    // AuthServiceのインスタンスを作成し、モックを注入
    authService = new AuthService();
    (authService as any).supabase = mockSupabase;
  });

  it('新規ユーザーがGoogle認証で正常に登録できること', async () => {
    // モックの設定
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { name: 'Test User' },
    };

    mockSupabase.auth.signInWithIdToken.mockResolvedValue({
      data: { user: mockUser, session: { access_token: 'token' } },
      error: null,
    });

    // プロフィールが存在しない（新規ユーザー）
    mockSupabase.from().select().eq().single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' }, // Not found
    });

    // 新規プロフィール作成
    mockSupabase.from().insert().select().single.mockResolvedValueOnce({
      data: {
        id: 'test-user-id',
        googleUid: 'test@example.com',
        displayName: 'Test User',
      },
      error: null,
    });

    // アカウントが存在しない
    mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' },
    });

    // 新規アカウント作成
    mockSupabase.from().insert().select().single.mockResolvedValueOnce({
      data: {
        id: 'test-account-id',
        profileId: 'test-user-id',
        accountType: 'google',
        isActive: true,
      },
      error: null,
    });

    // 最終ログイン時刻更新
    mockSupabase.from().update().eq.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    // テスト実行
    const result = await authService.signInWithGoogle('mock-google-token');

    // 検証
    expect(result.error).toBeNull();
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe('test@example.com');
    expect(result.profile).toBeDefined();
    expect(result.account).toBeDefined();
  });

  it('無効なトークンでエラーが発生すること', async () => {
    mockSupabase.auth.signInWithIdToken.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    const result = await authService.signInWithGoogle('invalid-token');

    expect(result.user).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('INVALID_TOKEN');
  });

  it('ネットワークエラーで適切なエラーが発生すること', async () => {
    mockSupabase.auth.signInWithIdToken.mockResolvedValue({
      data: { user: null },
      error: { message: 'Network error: fetch failed' },
    });

    const result = await authService.signInWithGoogle('token');

    expect(result.user).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('NETWORK_ERROR');
  });
});

describe('AuthService - リフレッシュトークン', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
    (authService as any).supabase = mockSupabase;
  });

  it('有効なリフレッシュトークンで新しいアクセストークンを取得できること', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    };

    // refreshSessionの戻り値を修正
    mockSupabase.auth.refreshSession.mockResolvedValue({
      data: {
        user: mockUser,
        session: { access_token: 'new-token', refresh_token: 'new-refresh' },
      },
      error: null,
    });

    // プロフィール取得のモック
    mockSupabase.from().select().eq().single.mockResolvedValueOnce({
      data: { id: 'test-user-id', displayName: 'Test User' },
      error: null,
    });

    // アカウント取得のモック
    mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
      data: { id: 'test-account-id', profileId: 'test-user-id' },
      error: null,
    });

    const result = await authService.refreshToken('valid-refresh-token');

    expect(result.error).toBeNull();
    expect(result.user).toBeDefined();
  });

  it('無効なリフレッシュトークンでエラーが発生すること', async () => {
    mockSupabase.auth.refreshSession.mockResolvedValue({
      data: { user: null },
      error: { message: 'Token expired' },
    });

    const result = await authService.refreshToken('expired-token');

    expect(result.user).toBeNull();
    expect(result.error?.message).toBe('TOKEN_EXPIRED');
  });
});

describe('AuthService - ログアウト', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
    (authService as any).supabase = mockSupabase;
  });

  it('ログアウトが正常に完了すること', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({
      error: null,
    });

    const result = await authService.signOut();

    expect(result.error).toBeNull();
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it('ログアウトエラーが適切に処理されること', async () => {
    const mockError = new Error('Logout failed');
    mockSupabase.auth.signOut.mockResolvedValue({
      error: mockError,
    });

    const result = await authService.signOut();

    expect(result.error).toBe(mockError);
  });
});
