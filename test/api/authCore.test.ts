import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthCore } from '../../src/lib/auth/authCore';

// モックプロバイダーの作成
const createMockAuthProvider = () => ({
  signInWithIdToken: vi.fn(),
  signOut: vi.fn(),
  refreshSession: vi.fn(),
});

const createMockDbProvider = () => ({
  from: vi.fn((table: string) => ({
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
});

describe('AuthCore - 認証バイパス機能', () => {
  let authCore: AuthCore;
  let mockAuthProvider: any;
  let mockDbProvider: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // 環境変数をリセット
    delete process.env.NODE_ENV;
    delete process.env.TEST_FILE;
    delete process.env.DISABLE_AUTO_LOGIN;
    
    mockAuthProvider = createMockAuthProvider();
    mockDbProvider = createMockDbProvider();
    authCore = new AuthCore(mockAuthProvider, mockDbProvider);
  });

  it('開発環境で認証バイパスが有効になること', () => {
    process.env.NODE_ENV = 'development';
    process.env.TEST_FILE = 'post.test.ts';
    
    const result = authCore.checkAutoLogin();
    expect(result.shouldAutoLogin).toBe(true);
  });

  it('本番環境では認証バイパスが無効になること', () => {
    process.env.NODE_ENV = 'production';
    
    const result = authCore.checkAutoLogin();
    expect(result.shouldAutoLogin).toBe(false);
  });

  it('認証テスト実行時はバイパスが無効になること', () => {
    process.env.NODE_ENV = 'development';
    process.env.TEST_FILE = 'authService.test.ts';
    
    const result = authCore.checkAutoLogin();
    expect(result.shouldAutoLogin).toBe(false);
  });

  it('自動ログインで正しいテストユーザーが設定されること', async () => {
    process.env.NODE_ENV = 'development';
    process.env.TEST_FILE = 'post.test.ts';
    
    const result = await authCore.performAutoLogin();
    
    expect(result.error).toBeNull();
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe('testuser@kanushi.love');
    expect(result.user?.displayName).toBe('開発テストユーザー');
    expect(result.profile?.profileText).toBe('これは開発用のテストアカウントです');
  });
});

describe('AuthCore - Google OAuth認証', () => {
  let authCore: AuthCore;
  let mockAuthProvider: any;
  let mockDbProvider: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthProvider = createMockAuthProvider();
    mockDbProvider = createMockDbProvider();
    authCore = new AuthCore(mockAuthProvider, mockDbProvider);
  });

  it('新規ユーザーがGoogle認証で正常に登録できること', async () => {
    // モックの設定
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { name: 'Test User' },
    };

    mockAuthProvider.signInWithIdToken.mockResolvedValue({
      data: { user: mockUser, session: { access_token: 'token' } },
      error: null,
    });

    // プロフィールが存在しない（新規ユーザー）
    const profileQuery = mockDbProvider.from('profiles');
    profileQuery.select().eq().single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' }, // Not found
    });

    // 新規プロフィール作成
    profileQuery.insert().select().single.mockResolvedValueOnce({
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      },
      error: null,
    });

    // アカウントが存在しない
    const accountQuery = mockDbProvider.from('accounts');
    accountQuery.select().eq().eq().single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' },
    });

    // 新規アカウント作成
    accountQuery.insert().select().single.mockResolvedValueOnce({
      data: {
        id: 'test-account-id',
        profileId: 'test-user-id',
        accountType: 'google',
        isActive: true,
      },
      error: null,
    });

    // テスト実行
    const result = await authCore.signInWithGoogle('mock-google-token');

    // 検証
    expect(result.error).toBeNull();
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe('test@example.com');
    expect(result.user?.displayName).toBe('Test User');
    expect(result.profile).toBeDefined();
    expect(result.account).toBeDefined();
  });

  it('無効なトークンでエラーが発生すること', async () => {
    mockAuthProvider.signInWithIdToken.mockResolvedValue({
      data: null,
      error: { message: 'Invalid token' },
    });

    const result = await authCore.signInWithGoogle('invalid-token');

    expect(result.user).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('INVALID_TOKEN');
  });

  it('ネットワークエラーで適切なエラーが発生すること', async () => {
    mockAuthProvider.signInWithIdToken.mockResolvedValue({
      data: null,
      error: { message: 'Network error: fetch failed' },
    });

    const result = await authCore.signInWithGoogle('token');

    expect(result.user).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('NETWORK_ERROR');
  });
});

describe('AuthCore - リフレッシュトークン', () => {
  let authCore: AuthCore;
  let mockAuthProvider: any;
  let mockDbProvider: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthProvider = createMockAuthProvider();
    mockDbProvider = createMockDbProvider();
    authCore = new AuthCore(mockAuthProvider, mockDbProvider);
  });

  it('有効なリフレッシュトークンで新しいアクセストークンを取得できること', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { name: 'Test User' },
    };

    mockAuthProvider.refreshSession.mockResolvedValue({
      data: {
        user: mockUser,
        session: { access_token: 'new-token', refresh_token: 'new-refresh' },
      },
      error: null,
    });

    // プロフィール取得
    const profileQuery = mockDbProvider.from('profiles');
    profileQuery.select().eq().single.mockResolvedValueOnce({
      data: { 
        id: 'test-user-id', 
        email: 'test@example.com',
        displayName: 'Test User' 
      },
      error: null,
    });

    // アカウント取得
    const accountQuery = mockDbProvider.from('accounts');
    accountQuery.select().eq().eq().single.mockResolvedValueOnce({
      data: { 
        id: 'test-account-id', 
        profileId: 'test-user-id',
        accountType: 'google',
        isActive: true
      },
      error: null,
    });

    const result = await authCore.refreshToken('valid-refresh-token');

    expect(result.error).toBeNull();
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe('test@example.com');
  });

  it('無効なリフレッシュトークンでエラーが発生すること', async () => {
    mockAuthProvider.refreshSession.mockResolvedValue({
      data: null,
      error: { message: 'Token expired' },
    });

    const result = await authCore.refreshToken('expired-token');

    expect(result.user).toBeNull();
    expect(result.error?.message).toBe('TOKEN_EXPIRED');
  });
});

describe('AuthCore - Apple Sign-In認証', () => {
  let authCore: AuthCore;
  let mockAuthProvider: any;
  let mockDbProvider: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthProvider = createMockAuthProvider();
    mockDbProvider = createMockDbProvider();
    authCore = new AuthCore(mockAuthProvider, mockDbProvider);
  });

  it('Apple ID認証で正常に登録できること', async () => {
    const mockUser = {
      id: 'apple-user-id',
      email: 'apple@example.com',
      user_metadata: { name: 'Apple User' },
    };

    mockAuthProvider.signInWithIdToken.mockResolvedValue({
      data: { user: mockUser, session: { access_token: 'token' } },
      error: null,
    });

    let fromCallCount = 0;
    mockDbProvider.from.mockImplementation((table: string) => {
      fromCallCount++;
      
      // 1回目: profiles select
      if (fromCallCount === 1 && table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        };
      }
      
      // 2回目: profiles insert
      if (fromCallCount === 2 && table === 'profiles') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'apple-user-id',
              email: 'apple@example.com',
              displayName: 'Apple User',
            },
            error: null,
          }),
        };
      }
      
      // 3回目: accounts select
      if (fromCallCount === 3 && table === 'accounts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        };
      }
      
      // 4回目: accounts insert
      if (fromCallCount === 4 && table === 'accounts') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'apple-account-id',
              profileId: 'apple-user-id',
              accountType: 'apple',
              isActive: true,
              switchOrder: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            error: null,
          }),
        };
      }
    });

    const result = await authCore.signInWithApple('mock-apple-token');

    expect(result.error).toBeNull();
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe('apple@example.com');
    expect(result.profile).toBeDefined();
    expect(result.account).toBeDefined();
    expect(result.account?.accountType).toBe('apple');
  });

  it('Apple認証がキャンセルされた場合にエラーが発生すること', async () => {
    const result = await authCore.signInWithApple('');

    expect(result.user).toBeNull();
    expect(result.error?.message).toBe('AUTH_CANCELLED');
  });

  it('メール情報のみでも認証が成功すること', async () => {
    const mockUser = {
      id: 'apple-user-id',
      email: 'onlyemail@example.com',
      user_metadata: {}, // 名前なし
    };

    mockAuthProvider.signInWithIdToken.mockResolvedValue({
      data: { user: mockUser, session: { access_token: 'token' } },
      error: null,
    });

    // プロフィール作成
    const profileQuery = mockDbProvider.from('profiles');
    profileQuery.select().eq().single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' },
    });

    profileQuery.insert().select().single.mockResolvedValueOnce({
      data: {
        id: 'apple-user-id',
        email: 'onlyemail@example.com',
        displayName: 'onlyemail', // メールアドレスから生成
      },
      error: null,
    });

    // アカウント作成
    const accountQuery = mockDbProvider.from('accounts');
    accountQuery.select().eq().eq().single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' },
    });

    accountQuery.insert().select().single.mockResolvedValueOnce({
      data: {
        id: 'apple-account-id',
        profileId: 'apple-user-id',
        accountType: 'apple',
        isActive: true,
        switchOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      error: null,
    });

    const result = await authCore.signInWithApple('mock-apple-token');

    expect(result.error).toBeNull();
    expect(result.user?.displayName).toBe('onlyemail');
  });
});

describe('AuthCore - Email + Passkey認証', () => {
  let authCore: AuthCore;
  let mockAuthProvider: any;
  let mockDbProvider: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthProvider = createMockAuthProvider();
    mockDbProvider = createMockDbProvider();
    authCore = new AuthCore(mockAuthProvider, mockDbProvider);
  });

  it('パスキーを使った新規登録が正常に完了すること', async () => {
    const mockUser = {
      id: 'passkey-user-id',
      email: 'passkey@example.com',
      user_metadata: {},
    };

    let fromCallCount = 0;
    mockDbProvider.from.mockImplementation((table: string) => {
      fromCallCount++;
      
      // 1回目: profiles select (メールアドレスの重複チェック)
      if (fromCallCount === 1 && table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }, // Not found
          }),
        };
      }
      
      // 2回目: profiles insert
      if (fromCallCount === 2 && table === 'profiles') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'passkey-user-id',
              email: 'passkey@example.com',
              displayName: 'passkey',
            },
            error: null,
          }),
        };
      }
      
      // 3回目: passkeys insert
      if (fromCallCount === 3 && table === 'passkeys') {
        return {
          insert: vi.fn().mockResolvedValue({
            error: null,
          }),
        };
      }
      
      // 4回目: accounts select
      if (fromCallCount === 4 && table === 'accounts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        };
      }
      
      // 5回目: accounts insert
      if (fromCallCount === 5 && table === 'accounts') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'passkey-account-id',
              profileId: 'passkey-user-id',
              accountType: 'passkey',
              isActive: true,
            },
            error: null,
          }),
        };
      }
    });

    const result = await authCore.registerWithPasskey('passkey@example.com', 'mock-credential-id', 'mock-public-key');

    expect(result.error).toBeNull();
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe('passkey@example.com');
    expect(result.account?.accountType).toBe('passkey');
  });

  it('既に登録済みのメールアドレスでパスキー登録を試みた際にエラーが発生すること', async () => {
    // 既存のプロフィール
    mockDbProvider.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'existing-user-id',
              email: 'existing@example.com',
              displayName: 'Existing User',
            },
            error: null,
          }),
        };
      }
    });

    const result = await authCore.registerWithPasskey('existing@example.com', 'mock-credential-id', 'mock-public-key');

    expect(result.user).toBeNull();
    expect(result.error?.message).toBe('EMAIL_ALREADY_REGISTERED');
  });

  it('パスキーを使ったログインが正常に完了すること', async () => {
    const mockUser = {
      id: 'passkey-user-id',
      email: 'passkey@example.com',
      user_metadata: {},
    };

    let fromCallCount = 0;
    mockDbProvider.from.mockImplementation((table: string) => {
      fromCallCount++;
      
      // 1回目: passkeys select
      if (fromCallCount === 1 && table === 'passkeys') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'passkey-id',
              profileId: 'passkey-user-id',
              credentialId: 'mock-credential-id',
              publicKey: 'mock-public-key',
            },
            error: null,
          }),
        };
      }
      
      // 2回目: profiles select
      if (fromCallCount === 2 && table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'passkey-user-id',
              email: 'passkey@example.com',
              displayName: 'Passkey User',
            },
            error: null,
          }),
        };
      }
      
      // 3回目: accounts select
      if (fromCallCount === 3 && table === 'accounts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'passkey-account-id',
              profileId: 'passkey-user-id',
              accountType: 'passkey',
              isActive: true,
            },
            error: null,
          }),
        };
      }
      
      // 4回目: passkeys update (lastUsedAt)
      if (fromCallCount === 4 && table === 'passkeys') {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        };
      }
    });

    const result = await authCore.signInWithPasskey('mock-credential-id', 'mock-signature');

    expect(result.error).toBeNull();
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe('passkey@example.com');
  });

  it('無効なパスキー情報でログインを試みた際にエラーが発生すること', async () => {
    // パスキーが見つからない
    mockDbProvider.from.mockImplementation((table: string) => {
      if (table === 'passkeys') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }, // Not found
          }),
        };
      }
    });

    const result = await authCore.signInWithPasskey('invalid-credential-id', 'mock-signature');

    expect(result.user).toBeNull();
    expect(result.error?.message).toBe('INVALID_PASSKEY');
  });
});

describe('AuthCore - ログアウト', () => {
  let authCore: AuthCore;
  let mockAuthProvider: any;
  let mockDbProvider: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthProvider = createMockAuthProvider();
    mockDbProvider = createMockDbProvider();
    authCore = new AuthCore(mockAuthProvider, mockDbProvider);
  });

  it('ログアウトが正常に完了すること', async () => {
    mockAuthProvider.signOut.mockResolvedValue({
      error: null,
    });

    const result = await authCore.signOut();

    expect(result.error).toBeNull();
    expect(mockAuthProvider.signOut).toHaveBeenCalled();
  });

  it('ログアウトエラーが適切に処理されること', async () => {
    const mockError = new Error('Logout failed');
    mockAuthProvider.signOut.mockResolvedValue({
      error: mockError,
    });

    const result = await authCore.signOut();

    expect(result.error).toBe(mockError);
  });
});