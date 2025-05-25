// 認証のコアロジック（依存関係を最小限に）
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthProfile {
  id: string;
  email: string;
  displayName: string;
  profileText?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthAccount {
  id: string;
  profileId: string;
  accountType: 'google' | 'apple' | 'passkey';
  isActive: boolean;
  switchOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  user: AuthUser | null;
  profile: AuthProfile | null;
  account: AuthAccount | null;
  error: Error | null;
}

export interface AuthProvider {
  signInWithIdToken(params: { provider: string; token: string }): Promise<any>;
  signOut(): Promise<any>;
  refreshSession(params: { refresh_token: string }): Promise<any>;
}

export interface DatabaseProvider {
  from(table: string): any;
}

export class AuthCore {
  constructor(
    private authProvider: AuthProvider,
    private dbProvider: DatabaseProvider
  ) {}

  // 開発環境の自動ログイン判定
  checkAutoLogin(): { shouldAutoLogin: boolean } {
    const isAuthTest = process.env.TEST_FILE?.includes('auth') || false;
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local';
    const isDisabled = process.env.DISABLE_AUTO_LOGIN === 'true';
    const shouldAutoLogin = isDevelopment && !isAuthTest && !isDisabled;
    
    return { shouldAutoLogin };
  }

  // 開発環境用の自動ログイン実行
  async performAutoLogin(): Promise<AuthResult> {
    const { shouldAutoLogin } = this.checkAutoLogin();
    
    if (!shouldAutoLogin) {
      return {
        user: null,
        profile: null,
        account: null,
        error: new Error('Auto login is disabled'),
      };
    }

    // 開発用テストユーザーの情報
    const testUser: AuthUser = {
      id: 'dev-test-user-id',
      email: 'testuser@kanushi.love',
      displayName: '開発テストユーザー',
    };

    const testProfile: AuthProfile = {
      id: 'dev-test-profile-id',
      email: 'testuser@kanushi.love',
      displayName: '開発テストユーザー',
      profileText: 'これは開発用のテストアカウントです',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const testAccount: AuthAccount = {
      id: 'dev-test-account-id',
      profileId: testProfile.id,
      accountType: 'google',
      isActive: true,
      switchOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      user: testUser,
      profile: testProfile,
      account: testAccount,
      error: null,
    };
  }

  // Google OAuth認証
  async signInWithGoogle(idToken: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.authProvider.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        if (error.message.includes('invalid') || error.message.includes('token')) {
          throw new Error('INVALID_TOKEN');
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('NETWORK_ERROR');
        }
        throw error;
      }

      if (!data.user) {
        return {
          user: null,
          profile: null,
          account: null,
          error: new Error('Authentication failed'),
        };
      }

      // ユーザー情報を変換
      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.name || 'ユーザー',
      };

      // プロフィールの取得または作成
      const profileResult = await this.getOrCreateProfile(user);
      const accountResult = await this.getOrCreateAccount(profileResult.profile!);

      return {
        user,
        profile: profileResult.profile,
        account: accountResult.account,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        profile: null,
        account: null,
        error: error as Error,
      };
    }
  }

  // プロフィールの取得または作成
  private async getOrCreateProfile(user: AuthUser): Promise<{ profile: AuthProfile | null; error: Error | null }> {
    try {
      const { data: profile, error } = await this.dbProvider
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .single();

      if (profile && !error) {
        return { profile, error: null };
      }

      // 新規プロフィール作成
      const newProfile: AuthProfile = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { data: created, error: createError } = await this.dbProvider
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (createError) throw createError;

      return { profile: created, error: null };
    } catch (error) {
      return { profile: null, error: error as Error };
    }
  }

  // アカウントの取得または作成
  private async getOrCreateAccount(
    profile: AuthProfile, 
    accountType: 'google' | 'apple' | 'passkey' = 'google'
  ): Promise<{ account: AuthAccount | null; error: Error | null }> {
    try {
      const { data: account, error } = await this.dbProvider
        .from('accounts')
        .select('*')
        .eq('profileId', profile.id)
        .eq('accountType', accountType)
        .single();

      if (account && !error) {
        return { account, error: null };
      }

      // 新規アカウント作成
      const newAccount: AuthAccount = {
        id: `acc_${Date.now()}`,
        profileId: profile.id,
        accountType,
        isActive: true,
        switchOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { data: created, error: createError } = await this.dbProvider
        .from('accounts')
        .insert(newAccount)
        .select()
        .single();

      if (createError) throw createError;

      return { account: created, error: null };
    } catch (error) {
      return { account: null, error: error as Error };
    }
  }

  // Apple Sign-In認証
  async signInWithApple(identityToken: string): Promise<AuthResult> {
    try {
      if (!identityToken) {
        throw new Error('AUTH_CANCELLED');
      }

      const { data, error } = await this.authProvider.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        return {
          user: null,
          profile: null,
          account: null,
          error: new Error('Authentication failed'),
        };
      }

      // ユーザー情報を変換
      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.name || data.user.email.split('@')[0],
      };

      // プロフィールの取得または作成
      const profileResult = await this.getOrCreateProfile(user);
      const accountResult = await this.getOrCreateAccount(profileResult.profile!, 'apple');

      return {
        user,
        profile: profileResult.profile,
        account: accountResult.account,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        profile: null,
        account: null,
        error: error as Error,
      };
    }
  }

  // リフレッシュトークンでアクセストークンを更新
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.authProvider.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          throw new Error('TOKEN_EXPIRED');
        }
        throw error;
      }

      if (!data.user || !data.session) {
        return {
          user: null,
          profile: null,
          account: null,
          error: new Error('Refresh failed'),
        };
      }

      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.name || 'ユーザー',
      };

      // プロフィールとアカウント情報を取得
      const profileResult = await this.getOrCreateProfile(user);
      const accountResult = await this.getOrCreateAccount(profileResult.profile!);

      return {
        user,
        profile: profileResult.profile,
        account: accountResult.account,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        profile: null,
        account: null,
        error: error as Error,
      };
    }
  }

  // ログアウト
  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.authProvider.signOut();
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }
}