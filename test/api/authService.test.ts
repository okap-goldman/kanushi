import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../../src/lib/authService';
import { supabase } from '../../src/lib/supabase';
import { Profile, Account } from '../../src/lib/db/schema/profile';

// モック設定
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithIdToken: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })),
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn() })) })),
      update: vi.fn(() => ({ eq: vi.fn() })),
      delete: vi.fn(() => ({ eq: vi.fn() })),
    })),
  },
}));

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

describe('認証バイパス機能', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 環境変数をリセット
    delete process.env.NODE_ENV;
    delete process.env.TEST_FILE;
    delete process.env.DISABLE_AUTO_LOGIN;
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
      const expectedUser = {
        id: expect.any(String),
        email: 'test@example.com',
        displayName: 'Test User'
      };

      // When
      const result = await authService.signInWithGoogle(mockIdToken);

      // Then
      expect(result.user).toMatchObject(expectedUser);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBeGreaterThan(0);
    });

    it('既存ユーザーのログインが成功する', async () => {
      // Given
      const existingUser = await createTestUser();
      const mockIdToken = 'mock_existing_user_token';

      // When
      const result = await authService.signInWithGoogle(mockIdToken);

      // Then
      expect(result.user.id).toBe(existingUser.id);
      expect(result.accessToken).toBeDefined();
    });

    it('無効なIDトークンでエラーが発生する', async () => {
      // Given
      const invalidToken = 'invalid_token';

      // When & Then
      await expect(authService.signInWithGoogle(invalidToken))
        .rejects.toThrow('INVALID_TOKEN');
    });

    it('ネットワークエラーで適切なエラーが発生する', async () => {
      // Given
      server.use(
        rest.post('/auth/google', (req, res, ctx) => {
          return res.networkError('Failed to connect');
        })
      );

      // When & Then
      await expect(authService.signInWithGoogle('token'))
        .rejects.toThrow('NETWORK_ERROR');
    });
  });

  describe('refreshToken', () => {
    it('有効なリフレッシュトークンで新しいアクセストークンを取得', async () => {
      // Given
      const validRefreshToken = 'valid_refresh_token';

      // When
      const result = await authService.refreshToken(validRefreshToken);

      // Then
      expect(result.accessToken).toBeDefined();
      expect(result.expiresIn).toBeGreaterThan(0);
    });

    it('無効なリフレッシュトークンでエラーが発生する', async () => {
      // Given
      const invalidRefreshToken = 'invalid_refresh_token';

      // When & Then
      await expect(authService.refreshToken(invalidRefreshToken))
        .rejects.toThrow('TOKEN_EXPIRED');
    });
  });
});

describe('Apple Sign-In Authentication', () => {
  describe('signInWithApple', () => {
    it('Apple ID認証が成功する', async () => {
      // Given
      const mockAppleCredential = {
        identityToken: 'mock_apple_identity_token',
        authorizationCode: 'mock_auth_code'
      };

      // When
      const result = await authService.signInWithApple(mockAppleCredential);

      // Then
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
    });

    it('Apple認証がキャンセルされた場合の処理', async () => {
      // Given
      const cancelledCredential = null;

      // When & Then
      await expect(authService.signInWithApple(cancelledCredential))
        .rejects.toThrow('AUTH_CANCELLED');
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

      // When
      const result = await authService.registerWithPasskey(email, mockCredential);

      // Then
      expect(result.user.email).toBe(email);
      expect(result.accessToken).toBeDefined();
    });

    it('既存メールアドレスでエラーが発生する', async () => {
      // Given
      const existingEmail = 'existing@example.com';
      await createTestUser({ email: existingEmail });

      // When & Then
      await expect(authService.registerWithPasskey(existingEmail, mockCredential))
        .rejects.toThrow('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('signInWithPasskey', () => {
    it('パスキーログインが成功する', async () => {
      // Given
      const email = 'test@example.com';
      const credential = await setupPasskeyUser(email);

      // When
      const result = await authService.signInWithPasskey(email, credential);

      // Then
      expect(result.user.email).toBe(email);
      expect(result.accessToken).toBeDefined();
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