import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../../src/lib/authService';
import { supabase } from '../../src/lib/supabase';
import { Profile, Account } from '../../src/lib/db/schema/profile';
import { User } from '@supabase/supabase-js';

// モック設定
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
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
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })),
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn() })) })),
      update: vi.fn(() => ({ eq: vi.fn() })),
      delete: vi.fn(() => ({ eq: vi.fn() })),
    })),
  },
}));

// Mock services that don't exist yet but are referenced in tests
const mockUserService = {
  getCurrentUser: vi.fn(),
  updateProfile: vi.fn(),
  uploadProfileImage: vi.fn(),
  uploadIntroAudio: vi.fn(),
};

const mockAccountService = {
  getAccounts: vi.fn(),
  switchAccount: vi.fn(),
  addAccount: vi.fn(),
};

const mockNotificationService = {
  getNotificationSettings: vi.fn(),
  updateNotificationSettings: vi.fn(),
  updateFcmToken: vi.fn(),
};

// Make services available globally in tests
(global as any).userService = mockUserService;
(global as any).accountService = mockAccountService;
(global as any).notificationService = mockNotificationService;

// Declare global types for the test services
declare global {
  var userService: typeof mockUserService;
  var accountService: typeof mockAccountService;
  var notificationService: typeof mockNotificationService;
}

// テストヘルパー関数
const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: { name: 'Test User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  ...overrides,
});

const createMockProfile = (overrides = {}): Partial<Profile> => ({
  id: 'test-profile-id',
  displayName: '開発テストユーザー',
  email: 'testuser@kanushi.love',
  profileText: 'これは開発用のテストアカウントです',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockAccount = (overrides = {}): Partial<Account> => ({
  id: 'test-account-id',
  profileId: 'test-profile-id',
  accountType: 'google',
  isActive: true,
  switchOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Missing helper functions for tests
const createTestUser = async (overrides = {}) => {
  const mockUser = createMockUser(overrides);
  const mockProfile = createMockProfile(overrides);
  
  // Mock database call
  const mockFrom = vi.mocked(supabase.from);
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
      })
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
      })
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
    })
  } as any);
  
  return { ...mockUser, profile: mockProfile };
};

const createAuthenticatedUser = async (overrides = {}) => {
  const user = await createTestUser(overrides);
  
  // Mock authenticated session
  const mockAuth = vi.mocked(supabase.auth);
  mockAuth.getUser.mockResolvedValue({ 
    data: { user: user as User }, 
    error: null 
  });
  
  return user;
};

const createAdditionalAccount = async (userId: string, overrides = {}) => {
  return createMockAccount({ profileId: userId, ...overrides });
};

const createAccount = async (userId: string, overrides = {}) => {
  return createMockAccount({ profileId: userId, ...overrides });
};

const setupPasskeyUser = async (email: string) => {
  const user = await createTestUser({ email });
  return {
    id: 'mock_credential_id',
    rawId: new ArrayBuffer(32),
    type: 'public-key' as const
  };
};

const createMockFile = (type: string, size = 1024) => {
  return new File(['mock content'], 'test.txt', { type, size } as any);
};

const createMockImageFile = (size = 1024) => {
  return new File(['mock image content'], 'test.jpg', { 
    type: 'image/jpeg',
    size 
  } as any);
};

const createMockAudioFile = (duration = 60, size = 1024) => {
  const file = new File(['mock audio content'], 'test.mp3', { 
    type: 'audio/mpeg',
    size 
  } as any);
  (file as any).duration = duration;
  return file;
};

// Mock external variables
const mockGoogleToken = 'mock_google_token';
const mockCredential = {
  id: 'mock_credential_id',
  rawId: new ArrayBuffer(32),
  type: 'public-key' as const
};

describe('認証バイパス機能', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 環境変数をリセット
    delete process.env.NODE_ENV;
    delete process.env.TEST_FILE;
    delete process.env.DISABLE_AUTO_LOGIN;
    
    // Reset mock services
    mockUserService.getCurrentUser.mockReset();
    mockUserService.updateProfile.mockReset();
    mockUserService.uploadProfileImage.mockReset();
    mockUserService.uploadIntroAudio.mockReset();
    mockAccountService.getAccounts.mockReset();
    mockAccountService.switchAccount.mockReset();
    mockAccountService.addAccount.mockReset();
    mockNotificationService.getNotificationSettings.mockReset();
    mockNotificationService.updateNotificationSettings.mockReset();
    mockNotificationService.updateFcmToken.mockReset();
  });

  it('開発環境で認証バイパスが有効になること', async () => {
    process.env.NODE_ENV = 'development';
    process.env.TEST_FILE = 'post.test.ts';
    
    const result = await authService.checkAutoLogin();
    expect(result.shouldAutoLogin).toBe(true);
  });

  it('本番環境では認証バイパスが無効になること', async () => {
    process.env.NODE_ENV = 'production';
    
    const result = await authService.checkAutoLogin();
    expect(result.shouldAutoLogin).toBe(false);
  });

  it('認証テスト実行時はバイパスが無効になること', async () => {
    process.env.NODE_ENV = 'development';
    process.env.TEST_FILE = 'authService.test.ts';
    
    const result = await authService.checkAutoLogin();
    expect(result.shouldAutoLogin).toBe(false);
  });

  it('認証以外のテストではバイパスが有効になること', async () => {
    process.env.NODE_ENV = 'development';
    process.env.TEST_FILE = 'postService.test.ts';
    
    const result = await authService.checkAutoLogin();
    expect(result.shouldAutoLogin).toBe(true);
  });

  it('DISABLE_AUTO_LOGINフラグでバイパスを無効化できること', async () => {
    process.env.NODE_ENV = 'development';
    process.env.TEST_FILE = 'post.test.ts';
    process.env.DISABLE_AUTO_LOGIN = 'true';
    
    const result = await authService.checkAutoLogin();
    expect(result.shouldAutoLogin).toBe(false);
  });
});

describe('Google OAuth Authentication', () => {
  describe('signInWithGoogle', () => {
    it('新規ユーザー登録が成功する', async () => {
      // Given
      const mockIdToken = 'mock_google_id_token';
      const mockUser = createMockUser({ email: 'test@example.com' });
      const mockProfile = createMockProfile({ email: 'test@example.com' });
      const mockAccount = createMockAccount();
      
      // Mock Supabase auth response
      const mockAuth = vi.mocked(supabase.auth);
      mockAuth.signInWithIdToken.mockResolvedValue({
        data: { user: mockUser as User, session: { access_token: 'token', refresh_token: 'refresh', expires_in: 3600 } as any },
        error: null
      });
      
      // Mock database calls for new user (no existing profile)
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }) // No existing profile
              })
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
            })
          } as any;
        } else if (table === 'accounts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }) // No existing account
              })
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockAccount, error: null })
              })
            })
          } as any;
        }
        return {} as any;
      });

      // When
      const result = await authService.signInWithGoogle(mockIdToken);

      // Then
      expect(result.user).toMatchObject({
        id: expect.any(String),
        email: 'test@example.com'
      });
      expect(result.profile).toBeDefined();
      expect(result.account).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('既存ユーザーのログインが成功する', async () => {
      // Given
      const mockIdToken = 'mock_existing_user_token';
      const mockUser = createMockUser({ email: 'existing@example.com' });
      const mockProfile = createMockProfile({ email: 'existing@example.com' });
      const mockAccount = createMockAccount();
      
      // Mock Supabase auth response
      const mockAuth = vi.mocked(supabase.auth);
      mockAuth.signInWithIdToken.mockResolvedValue({
        data: { user: mockUser as User, session: { access_token: 'token', refresh_token: 'refresh', expires_in: 3600 } as any },
        error: null
      });
      
      // Mock database calls for existing user
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }) // Existing profile
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
            })
          } as any;
        } else if (table === 'accounts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockAccount, error: null }) // Existing account
              })
            })
          } as any;
        }
        return {} as any;
      });

      // When
      const result = await authService.signInWithGoogle(mockIdToken);

      // Then
      expect(result.user.id).toBe(mockUser.id);
      expect(result.profile).toBeDefined();
      expect(result.account).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('無効なIDトークンでエラーが発生する', async () => {
      // Given
      const invalidToken = 'invalid_token';
      
      // Mock Supabase auth error response
      const mockAuth = vi.mocked(supabase.auth);
      mockAuth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'invalid token format' } as any
      });

      // When
      const result = await authService.signInWithGoogle(invalidToken);

      // Then
      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('INVALID_TOKEN');
    });

    it('ネットワークエラーで適切なエラーが発生する', async () => {
      // Given
      const token = 'test_token';
      
      // Mock Supabase auth network error
      const mockAuth = vi.mocked(supabase.auth);
      mockAuth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'network fetch error' } as any
      });

      // When
      const result = await authService.signInWithGoogle(token);

      // Then
      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('NETWORK_ERROR');
    });
  });

  describe('refreshToken', () => {
    it('有効なリフレッシュトークンで新しいアクセストークンを取得', async () => {
      // Given
      const validRefreshToken = 'valid_refresh_token';
      const mockUser = createMockUser();
      const mockProfile = createMockProfile();
      const mockAccount = createMockAccount();
      
      // Mock Supabase refresh response
      const mockAuth = vi.mocked(supabase.auth);
      mockAuth.refreshSession.mockResolvedValue({
        data: { 
          user: mockUser as User, 
          session: { access_token: 'new_token', refresh_token: 'new_refresh', expires_in: 3600 } as any 
        },
        error: null
      });
      
      // Mock database calls
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
              })
            })
          } as any;
        } else if (table === 'accounts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockAccount, error: null })
                })
              })
            })
          } as any;
        }
        return {} as any;
      });

      // When
      const result = await authService.refreshToken(validRefreshToken);

      // Then
      expect(result.user).toBeDefined();
      expect(result.profile).toBeDefined();
      expect(result.account).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('無効なリフレッシュトークンでエラーが発生する', async () => {
      // Given
      const invalidRefreshToken = 'invalid_refresh_token';
      
      // Mock Supabase refresh error response
      const mockAuth = vi.mocked(supabase.auth);
      mockAuth.refreshSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'refresh token expired' } as any
      });

      // When
      const result = await authService.refreshToken(invalidRefreshToken);

      // Then
      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('TOKEN_EXPIRED');
    });
  });
});

describe('Apple Sign-In Authentication', () => {
  describe('signInWithApple', () => {
    it('Apple ID認証が成功する', async () => {
      // Given
      const mockIdentityToken = 'mock_apple_identity_token';
      const mockUser = createMockUser({ email: 'test@example.com' });
      const mockProfile = createMockProfile({ email: 'test@example.com' });
      const mockAccount = createMockAccount({ accountType: 'apple' });
      
      // Mock Supabase auth response
      const mockAuth = vi.mocked(supabase.auth);
      mockAuth.signInWithIdToken.mockResolvedValue({
        data: { user: mockUser as User, session: { access_token: 'token', refresh_token: 'refresh', expires_in: 3600 } as any },
        error: null
      });
      
      // Mock database calls
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
            })
          } as any;
        } else if (table === 'accounts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockAccount, error: null })
              })
            })
          } as any;
        }
        return {} as any;
      });

      // When
      const result = await authService.signInWithApple(mockIdentityToken);

      // Then
      expect(result.user).toBeDefined();
      expect(result.profile).toBeDefined();
      expect(result.account).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('Apple認証がキャンセルされた場合の処理', async () => {
      // Given
      const cancelledCredential = null;

      // When
      const result = await authService.signInWithApple(cancelledCredential);

      // Then
      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('AUTH_CANCELLED');
    });
  });
});

describe('Passkey Authentication', () => {
  describe('registerWithPasskey', () => {
    it('パスキー登録が成功する', async () => {
      // Given
      const email = 'test@example.com';
      const mockCredential = {
        id: 'credential_id',
        rawId: new ArrayBuffer(32),
        type: 'public-key'
      };
      const mockUser = createMockUser({ email });
      const mockProfile = createMockProfile({ email });
      const mockAccount = createMockAccount({ accountType: 'passkey' });
      
      // Mock Supabase auth response for sign up
      const mockAuth = vi.mocked(supabase.auth);
      mockAuth.signUp.mockResolvedValue({
        data: { user: mockUser as User, session: { access_token: 'token', refresh_token: 'refresh', expires_in: 3600 } as any },
        error: null
      });
      
      // Mock database calls for new user
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }) // No existing profile
              })
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
              })
            })
          } as any;
        } else if (table === 'accounts') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockAccount, error: null })
              })
            })
          } as any;
        }
        return {} as any;
      });

      // When
      const result = await authService.registerWithPasskey(email, mockCredential);

      // Then
      expect(result.user.email).toBe(email);
      expect(result.profile).toBeDefined();
      expect(result.account).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('既存メールアドレスでエラーが発生する', async () => {
      // Given
      const existingEmail = 'existing@example.com';
      const existingProfile = createMockProfile({ email: existingEmail });
      
      // Mock database call to return existing profile
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: existingProfile, error: null })
              })
            })
          } as any;
        }
        return {} as any;
      });

      // When
      const result = await authService.registerWithPasskey(existingEmail, mockCredential);

      // Then
      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('signInWithPasskey', () => {
    it('パスキーログインが成功する', async () => {
      // Given
      const email = 'test@example.com';
      const credential = await setupPasskeyUser(email);
      const mockUser = createMockUser({ email });
      const mockProfile = createMockProfile({ email });
      const mockAccount = createMockAccount({ accountType: 'passkey' });
      
      // Mock Supabase auth response for sign in
      const mockAuth = vi.mocked(supabase.auth);
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser as User, session: { access_token: 'token', refresh_token: 'refresh', expires_in: 3600 } as any },
        error: null
      });
      
      // Mock database calls
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
            })
          } as any;
        } else if (table === 'accounts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockAccount, error: null })
              })
            })
          } as any;
        }
        return {} as any;
      });

      // When
      const result = await authService.signInWithPasskey(email, credential);

      // Then
      expect(result.user.email).toBe(email);
      expect(result.profile).toBeDefined();
      expect(result.account).toBeDefined();
      expect(result.error).toBeNull();
    });
  });
});

describe('User Profile API', () => {
  describe('getCurrentUser', () => {
    it('認証済みユーザーのプロフィールを取得', async () => {
      // Given
      const user = await createAuthenticatedUser();

      // When
      const profile = await userService.getCurrentUser();

      // Then
      expect(profile).toMatchObject({
        id: user.id,
        displayName: expect.any(String),
        email: user.email
      });
    });

    it('未認証の場合401エラーが発生', async () => {
      // Given
      await authService.signOut();

      // When & Then
      await expect(userService.getCurrentUser())
        .rejects.toThrow('UNAUTHORIZED');
    });
  });

  describe('updateProfile', () => {
    it('プロフィール更新が成功する', async () => {
      // Given
      const user = await createAuthenticatedUser();
      const updateData = {
        displayName: '新しい表示名',
        profileText: '自己紹介文',
        prefecture: '東京都',
        city: '渋谷区'
      };

      // When
      const updatedProfile = await userService.updateProfile(updateData);

      // Then
      expect(updatedProfile).toMatchObject(updateData);
    });

    it('バリデーションエラーで400エラーが発生', async () => {
      // Given
      const invalidData = {
        displayName: '', // 空文字は無効
        profileText: 'a'.repeat(1001) // 1000文字制限超過
      };

      // When & Then
      await expect(userService.updateProfile(invalidData))
        .rejects.toThrow('VALIDATION_ERROR');
    });

    it('表示名の重複チェック', async () => {
      // Given
      await createTestUser({ displayName: '既存ユーザー' });
      const user = await createAuthenticatedUser();

      // When & Then
      await expect(userService.updateProfile({ displayName: '既存ユーザー' }))
        .rejects.toThrow('DISPLAY_NAME_TAKEN');
    });
  });
});

describe('Media Upload API', () => {
  describe('uploadProfileImage', () => {
    it('プロフィール画像アップロードが成功する', async () => {
      // Given
      const user = await createAuthenticatedUser();
      const imageFile = createMockImageFile();

      // When
      const result = await userService.uploadProfileImage(imageFile);

      // Then
      expect(result.imageUrl).toMatch(/^https:\/\/cdn\.kanushi\.tld\/.+\.jpg$/);
      expect(result.imageUrl).toBeDefined();
    });

    it('不正なファイル形式でエラーが発生', async () => {
      // Given
      const invalidFile = createMockFile('text/plain');

      // When & Then
      await expect(userService.uploadProfileImage(invalidFile))
        .rejects.toThrow('INVALID_FILE_TYPE');
    });

    it('ファイルサイズ制限超過でエラーが発生', async () => {
      // Given
      const largeFile = createMockImageFile(10 * 1024 * 1024); // 10MB

      // When & Then
      await expect(userService.uploadProfileImage(largeFile))
        .rejects.toThrow('FILE_TOO_LARGE');
    });
  });

  describe('uploadIntroAudio', () => {
    it('自己紹介音声アップロードが成功する', async () => {
      // Given
      const audioFile = createMockAudioFile();

      // When
      const result = await userService.uploadIntroAudio(audioFile);

      // Then
      expect(result.audioUrl).toMatch(/^https:\/\/cdn\.kanushi\.tld\/.+\.mp3$/);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('音声時間制限チェック', async () => {
      // Given
      const longAudioFile = createMockAudioFile(301); // 5分1秒

      // When & Then
      await expect(userService.uploadIntroAudio(longAudioFile))
        .rejects.toThrow('AUDIO_TOO_LONG');
    });
  });
});

describe('Account Management API', () => {
  describe('getAccounts', () => {
    it('ユーザーの全アカウントを取得', async () => {
      // Given
      const user = await createAuthenticatedUser();
      await createAdditionalAccount(user.id);

      // When
      const accounts = await accountService.getAccounts();

      // Then
      expect(accounts).toHaveLength(2);
      expect(accounts[0].isActive).toBe(true);
      expect(accounts.every(acc => acc.switchOrder >= 1 && acc.switchOrder <= 5)).toBe(true);
    });
  });

  describe('switchAccount', () => {
    it('アカウント切替が成功する', async () => {
      // Given
      const user = await createAuthenticatedUser();
      const secondAccount = await createAdditionalAccount(user.id);

      // When
      const result = await accountService.switchAccount(secondAccount.id);

      // Then
      expect(result.accessToken).toBeDefined();
      expect(result.activeAccountId).toBe(secondAccount.id);
    });

    it('存在しないアカウントIDでエラーが発生', async () => {
      // Given
      const invalidAccountId = 'non-existent-id';

      // When & Then
      await expect(accountService.switchAccount(invalidAccountId))
        .rejects.toThrow('ACCOUNT_NOT_FOUND');
    });

    it('他人のアカウントへの切替でエラーが発生', async () => {
      // Given
      const otherUser = await createTestUser();
      const otherAccount = await createAccount(otherUser.id);

      // When & Then
      await expect(accountService.switchAccount(otherAccount.id))
        .rejects.toThrow('FORBIDDEN');
    });
  });

  describe('addAccount', () => {
    it('5アカウント未満の場合、新規アカウント追加が成功', async () => {
      // Given
      const user = await createAuthenticatedUser();
      // 既に3アカウント作成
      await Promise.all([
        createAdditionalAccount(user.id),
        createAdditionalAccount(user.id),
        createAdditionalAccount(user.id)
      ]);

      // When
      const newAccount = await accountService.addAccount(mockGoogleToken);

      // Then
      expect(newAccount.switchOrder).toBe(5);
      expect(newAccount.isActive).toBe(true);
    });

    it('5アカウント制限でエラーが発生', async () => {
      // Given
      const user = await createAuthenticatedUser();
      // 既に4アカウント追加（合計5アカウント）
      await Promise.all(Array(4).fill(null).map(() => createAdditionalAccount(user.id)));

      // When & Then
      await expect(accountService.addAccount(mockGoogleToken))
        .rejects.toThrow('ACCOUNT_LIMIT_EXCEEDED');
    });
  });
});

describe('Notification Settings API', () => {
  describe('getNotificationSettings', () => {
    it('デフォルト通知設定を取得', async () => {
      // Given
      const user = await createAuthenticatedUser();

      // When
      const settings = await notificationService.getNotificationSettings();

      // Then
      expect(settings).toMatchObject({
        comment: true,
        highlight: true,
        follow: true,
        gift: true
      });
    });
  });

  describe('updateNotificationSettings', () => {
    it('通知設定更新が成功する', async () => {
      // Given
      const newSettings = {
        comment: false,
        highlight: true,
        follow: false,
        gift: true
      };

      // When
      await notificationService.updateNotificationSettings(newSettings);
      const updatedSettings = await notificationService.getNotificationSettings();

      // Then
      expect(updatedSettings).toMatchObject(newSettings);
    });
  });

  describe('updateFcmToken', () => {
    it('FCMトークン更新が成功する', async () => {
      // Given
      const fcmToken = 'new_fcm_token_12345';

      // When
      await notificationService.updateFcmToken(fcmToken);

      // Then
      const user = await userService.getCurrentUser();
      expect(user.fcmToken).toBe(fcmToken);
    });

    it('FCMトークン削除（null設定）が成功する', async () => {
      // Given
      await notificationService.updateFcmToken('some_token');

      // When
      await notificationService.updateFcmToken(null);

      // Then
      const user = await userService.getCurrentUser();
      expect(user.fcmToken).toBeNull();
    });
  });
});