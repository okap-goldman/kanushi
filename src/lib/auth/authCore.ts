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

  // Email + Passkey 新規登録
  async registerWithPasskey(email: string, credentialId: string, publicKey: string): Promise<AuthResult> {
    try {
      // メールアドレスが既に存在するかチェック
      const { data: existingProfile } = await this.dbProvider
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (existingProfile) {
        return {
          user: null,
          profile: null,
          account: null,
          error: new Error('EMAIL_ALREADY_REGISTERED'),
        };
      }

      // 新規ユーザー作成
      const userId = `user_${Date.now()}`;
      const user: AuthUser = {
        id: userId,
        email,
        displayName: email.split('@')[0],
      };

      // プロフィール作成
      const newProfile: AuthProfile = {
        id: userId,
        email,
        displayName: user.displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { data: profile, error: profileError } = await this.dbProvider
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (profileError) throw profileError;

      // パスキー情報保存
      const { error: passkeyError } = await this.dbProvider
        .from('passkeys')
        .insert({
          profileId: userId,
          credentialId,
          publicKey,
          counter: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      if (passkeyError) throw passkeyError;

      // アカウント作成
      const accountResult = await this.getOrCreateAccount(profile, 'passkey');

      return {
        user,
        profile,
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

  // Passkey ログイン
  async signInWithPasskey(credentialId: string, signature: string): Promise<AuthResult> {
    try {
      // パスキー情報取得
      const { data: passkey, error: passkeyError } = await this.dbProvider
        .from('passkeys')
        .select('*')
        .eq('credentialId', credentialId)
        .single();

      if (!passkey || passkeyError) {
        return {
          user: null,
          profile: null,
          account: null,
          error: new Error('INVALID_PASSKEY'),
        };
      }

      // TODO: 実際の実装では、signatureの検証が必要
      // ここではモックなので省略

      // プロフィール取得
      const { data: profile, error: profileError } = await this.dbProvider
        .from('profiles')
        .select('*')
        .eq('id', passkey.profileId)
        .single();

      if (!profile || profileError) {
        throw new Error('Profile not found');
      }

      const user: AuthUser = {
        id: profile.id,
        email: profile.email,
        displayName: profile.displayName,
      };

      // アカウント取得
      const { data: account, error: accountError } = await this.dbProvider
        .from('accounts')
        .select('*')
        .eq('profileId', profile.id)
        .eq('accountType', 'passkey')
        .single();

      // パスキーの最終使用日時を更新
      await this.dbProvider
        .from('passkeys')
        .update({ lastUsedAt: new Date() })
        .eq('id', passkey.id);

      return {
        user,
        profile,
        account,
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

  // 複数アカウント管理: アカウント一覧取得
  async getAccounts(profileId: string): Promise<{
    accounts: AuthAccount[] | null;
    error: Error | null;
  }> {
    try {
      const { data: accounts, error } = await this.dbProvider
        .from('accounts')
        .select('*')
        .eq('profileId', profileId)
        .order('switchOrder');

      if (error) throw error;

      return { accounts, error: null };
    } catch (error) {
      return { accounts: null, error: error as Error };
    }
  }

  // 複数アカウント管理: アカウント切り替え
  async switchAccount(currentProfileId: string, targetAccountId: string): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      // ターゲットアカウントの存在確認
      const { data: targetAccount, error: targetError } = await this.dbProvider
        .from('accounts')
        .select('*')
        .eq('id', targetAccountId)
        .single();

      if (!targetAccount || targetError) {
        return {
          success: false,
          error: new Error('ACCOUNT_NOT_FOUND'),
        };
      }

      // 権限チェック（自分のアカウントか確認）
      if (targetAccount.profileId !== currentProfileId) {
        return {
          success: false,
          error: new Error('UNAUTHORIZED_ACCOUNT_ACCESS'),
        };
      }

      // 現在のアクティブアカウントを非アクティブに
      await this.dbProvider
        .from('accounts')
        .update({ isActive: false, lastSwitchedAt: new Date() })
        .eq('profileId', currentProfileId);

      // ターゲットアカウントをアクティブに
      const { error: updateError } = await this.dbProvider
        .from('accounts')
        .update({ isActive: true, lastSwitchedAt: new Date() })
        .eq('id', targetAccountId);

      if (updateError) throw updateError;

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  // 複数アカウント管理: アカウント追加
  async addAccount(profileId: string, accountType: 'google' | 'apple' | 'passkey'): Promise<{
    account: AuthAccount | null;
    error: Error | null;
  }> {
    try {
      // 既存アカウント数チェック
      const { data: existingAccounts, error: countError } = await this.dbProvider
        .from('accounts')
        .select('*')
        .eq('profileId', profileId);

      if (countError) throw countError;

      if (existingAccounts && existingAccounts.length >= 5) {
        return {
          account: null,
          error: new Error('ACCOUNT_LIMIT_REACHED'),
        };
      }

      // 新しいswitchOrderを計算
      const nextOrder = existingAccounts ? existingAccounts.length + 1 : 1;

      // 新規アカウント作成
      const newAccount: AuthAccount = {
        id: `acc_${Date.now()}`,
        profileId,
        accountType,
        isActive: false,
        switchOrder: nextOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { data: account, error: insertError } = await this.dbProvider
        .from('accounts')
        .insert(newAccount)
        .select()
        .single();

      if (insertError) throw insertError;

      return { account, error: null };
    } catch (error) {
      return { account: null, error: error as Error };
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