import type { AuthError, User } from '@supabase/supabase-js';
import type { Account, Profile } from './db/schema/profile';
import { supabase } from './supabase';

// 認証サービスのレスポンス型
export type AuthResponse = {
  user: User | null;
  profile: Profile | null;
  account: Account | null;
  error: AuthError | null;
};

// 複数アカウント情報
export type AccountInfo = {
  account: Account;
  profile: Profile;
  isActive: boolean;
};

// 認証サービスのインターフェース
export interface IAuthService {
  // Google OAuth認証
  signInWithGoogle(idToken: string): Promise<AuthResponse>;

  // Apple Sign-In認証
  signInWithApple(identityToken: string | null): Promise<AuthResponse>;

  // Email + Passkey認証
  signUpWithPasskey(email: string, credential: any): Promise<AuthResponse>;
  signInWithPasskey(email: string, credential: any): Promise<AuthResponse>;

  // Alias for registerWithPasskey (used in tests)
  registerWithPasskey(email: string, credential: any): Promise<AuthResponse>;

  // リフレッシュトークンでアクセストークンを更新
  refreshToken(refreshToken: string): Promise<AuthResponse>;

  // 現在のユーザー情報を取得
  getCurrentUser(): Promise<AuthResponse>;

  // ログアウト
  signOut(): Promise<{ error: AuthError | null }>;

  // 複数アカウント管理
  getAccounts(): Promise<{ accounts: AccountInfo[]; error: Error | null }>;
  switchAccount(accountId: string): Promise<AuthResponse>;
  addAccount(authData: any): Promise<AuthResponse>;

  // 開発環境用自動ログイン
  checkAutoLogin(): Promise<{ shouldAutoLogin: boolean }>;
  performAutoLogin(): Promise<AuthResponse>;
}

// 認証サービスの実装クラス
export class AuthService implements IAuthService {
  private supabase = supabase;

  // 開発環境の自動ログイン判定
  async checkAutoLogin(): Promise<{ shouldAutoLogin: boolean }> {
    const isAuthTest = process.env.TEST_FILE?.includes('auth') || false;
    const isDevelopment =
      process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local';
    const isDisabled = process.env.DISABLE_AUTO_LOGIN === 'true';
    const shouldAutoLogin = isDevelopment && !isAuthTest && !isDisabled;

    return { shouldAutoLogin };
  }

  // 開発環境用の自動ログイン実行
  async performAutoLogin(): Promise<AuthResponse> {
    const { shouldAutoLogin } = await this.checkAutoLogin();

    if (!shouldAutoLogin) {
      return {
        user: null,
        profile: null,
        account: null,
        error: new Error('自動ログインは無効です') as any,
      };
    }

    // 開発用テストユーザーの情報
    const testUser = {
      id: 'dev-test-user-id',
      email: 'testuser@kanushi.love',
      app_metadata: {},
      user_metadata: {
        name: '開発テストユーザー',
        avatar_url: null,
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    // テストプロフィール
    const testProfile: Partial<Profile> = {
      id: 'dev-test-profile-id',
      displayName: '開発テストユーザー',
      email: 'testuser@kanushi.love',
      profileText: 'これは開発用のテストアカウントです',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // テストアカウント
    const testAccount: Partial<Account> = {
      id: 'dev-test-account-id',
      profileId: testProfile.id,
      accountType: 'google',
      isActive: true,
      switchOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      user: testUser as User,
      profile: testProfile as Profile,
      account: testAccount as Account,
      error: null,
    };
  }

  // Google OAuth認証
  async signInWithGoogle(idToken: string): Promise<AuthResponse> {
    try {
      // Supabaseを使用してGoogle IDトークンで認証
      const { data, error } = await this.supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        if (error.message.includes('invalid') || error.message.includes('token')) {
          throw new Error('無効なトークンです');
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('ネットワークエラーが発生しました');
        }
        throw error;
      }

      if (!data.user) {
        return {
          user: null,
          profile: null,
          account: null,
          error: new Error('認証に失敗しました') as any,
        };
      }

      // プロフィールの取得または作成
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('email', data.user.email)
        .single();

      let userProfile = profile;

      // 新規ユーザーの場合、プロフィールを作成
      if (!profile) {
        const { data: newProfile, error: createError } = await this.supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            displayName: data.user.user_metadata?.name || 'ユーザー',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .select()
          .single();

        if (createError) throw createError;
        userProfile = newProfile;
      }

      // アカウントの取得または作成
      const { data: account, error: accountError } = await this.supabase
        .from('accounts')
        .select('*')
        .eq('profileId', userProfile.id)
        .eq('accountType', 'google')
        .single();

      let userAccount = account;

      // 新規アカウントの場合、作成
      if (!account) {
        const { data: newAccount, error: createAccountError } = await this.supabase
          .from('accounts')
          .insert({
            profileId: userProfile.id,
            accountType: 'google',
            isActive: true,
            switchOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .select()
          .single();

        if (createAccountError) throw createAccountError;
        userAccount = newAccount;
      }

      // 最終ログイン時刻を更新
      await this.supabase
        .from('profiles')
        .update({ lastLoginAt: new Date() })
        .eq('id', userProfile.id);

      return {
        user: data.user,
        profile: userProfile as Profile,
        account: userAccount as Account,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        profile: null,
        account: null,
        error: error as AuthError,
      };
    }
  }

  // Apple Sign-In認証
  async signInWithApple(identityToken: string | null): Promise<AuthResponse> {
    try {
      if (!identityToken) {
        throw new Error('認証がキャンセルされました');
      }

      // Supabaseを使用してApple IDトークンで認証
      const { data, error } = await this.supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
      });

      if (error) {
        if (error.message.includes('invalid') || error.message.includes('token')) {
          throw new Error('無効なトークンです');
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('ネットワークエラーが発生しました');
        }
        throw error;
      }

      if (!data.user) {
        return {
          user: null,
          profile: null,
          account: null,
          error: new Error('認証に失敗しました') as any,
        };
      }

      // プロフィールの取得または作成
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('email', data.user.email)
        .single();

      let userProfile = profile;

      // 新規ユーザーの場合、プロフィールを作成
      if (!profile) {
        const { data: newProfile, error: createError } = await this.supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            displayName: data.user.user_metadata?.name || 'ユーザー',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .select()
          .single();

        if (createError) throw createError;
        userProfile = newProfile;
      }

      // アカウントの取得または作成
      const { data: account, error: accountError } = await this.supabase
        .from('accounts')
        .select('*')
        .eq('profileId', userProfile.id)
        .eq('accountType', 'apple')
        .single();

      let userAccount = account;

      // 新規アカウントの場合、作成
      if (!account) {
        const { data: newAccount, error: createAccountError } = await this.supabase
          .from('accounts')
          .insert({
            profileId: userProfile.id,
            accountType: 'apple',
            isActive: true,
            switchOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .select()
          .single();

        if (createAccountError) throw createAccountError;
        userAccount = newAccount;
      }

      // 最終ログイン時刻を更新
      await this.supabase
        .from('profiles')
        .update({ lastLoginAt: new Date() })
        .eq('id', userProfile.id);

      return {
        user: data.user,
        profile: userProfile as Profile,
        account: userAccount as Account,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        profile: null,
        account: null,
        error: error as AuthError,
      };
    }
  }

  // Email + Passkey認証（新規登録）
  async signUpWithPasskey(email: string, credential: any): Promise<AuthResponse> {
    try {
      // 既存ユーザーチェック
      const { data: existingProfile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (existingProfile) {
        throw new Error('このメールアドレスは既に登録されています');
      }

      // Supabaseでパスキー認証のユーザー登録（仮実装）
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password: crypto.randomUUID(), // パスキーの場合はランダムなパスワード
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        return {
          user: null,
          profile: null,
          account: null,
          error: new Error('登録に失敗しました') as any,
        };
      }

      // プロフィール作成
      const { data: newProfile, error: createError } = await this.supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: email,
          displayName: 'ユーザー',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .select()
        .single();

      if (createError) throw createError;

      // アカウント作成
      const { data: newAccount, error: createAccountError } = await this.supabase
        .from('accounts')
        .insert({
          profileId: newProfile.id,
          accountType: 'passkey',
          isActive: true,
          switchOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .select()
        .single();

      if (createAccountError) throw createAccountError;

      return {
        user: data.user,
        profile: newProfile as Profile,
        account: newAccount as Account,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        profile: null,
        account: null,
        error: error as AuthError,
      };
    }
  }

  // Email + Passkey認証（ログイン）
  async signInWithPasskey(email: string, credential: any): Promise<AuthResponse> {
    try {
      // パスキー認証のログイン（仮実装）
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password: crypto.randomUUID(), // パスキーの場合の仮パスワード
      });

      if (error) {
        if (error.message.includes('invalid') || error.message.includes('credentials')) {
          throw new Error('メールアドレスまたはパスワードが正しくありません');
        }
        throw error;
      }

      if (!data.user) {
        return {
          user: null,
          profile: null,
          account: null,
          error: new Error('認証に失敗しました') as any,
        };
      }

      // プロフィール取得
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // アカウント取得
      const { data: account } = await this.supabase
        .from('accounts')
        .select('*')
        .eq('profileId', data.user.id)
        .eq('accountType', 'passkey')
        .single();

      // 最終ログイン時刻を更新
      await this.supabase
        .from('profiles')
        .update({ lastLoginAt: new Date() })
        .eq('id', data.user.id);

      return {
        user: data.user,
        profile: profile as Profile,
        account: account as Account,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        profile: null,
        account: null,
        error: error as AuthError,
      };
    }
  }

  // リフレッシュトークンでアクセストークンを更新
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          throw new Error('トークンの有効期限が切れています');
        }
        throw error;
      }

      if (!data.user || !data.session) {
        return {
          user: null,
          profile: null,
          account: null,
          error: new Error('トークンの更新に失敗しました') as any,
        };
      }

      // プロフィールとアカウント情報を取得
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      const { data: account } = await this.supabase
        .from('accounts')
        .select('*')
        .eq('profileId', data.user.id)
        .eq('isActive', true)
        .single();

      return {
        user: data.user,
        profile: profile as Profile,
        account: account as Account,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        profile: null,
        account: null,
        error: error as AuthError,
      };
    }
  }

  // 現在のユーザー情報を取得
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();

      if (error || !user) {
        throw new Error('認証されていません');
      }

      // プロフィール取得
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // アクティブアカウント取得
      const { data: account } = await this.supabase
        .from('accounts')
        .select('*')
        .eq('profileId', user.id)
        .eq('isActive', true)
        .single();

      return {
        user,
        profile: profile as Profile,
        account: account as Account,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        profile: null,
        account: null,
        error: error as AuthError,
      };
    }
  }

  // ログアウト
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  // 複数アカウント管理：アカウント一覧取得
  async getAccounts(): Promise<{ accounts: AccountInfo[]; error: Error | null }> {
    // TODO: 実装
    throw new Error('未実装の機能です');
  }

  // 複数アカウント管理：アカウント切替
  async switchAccount(accountId: string): Promise<AuthResponse> {
    // TODO: 実装
    throw new Error('未実装の機能です');
  }

  // 複数アカウント管理：アカウント追加
  async addAccount(authData: any): Promise<AuthResponse> {
    // TODO: 実装
    throw new Error('未実装の機能です');
  }

  // Alias for registerWithPasskey (used in tests)
  async registerWithPasskey(email: string, credential: any): Promise<AuthResponse> {
    return this.signUpWithPasskey(email, credential);
  }
}

// シングルトンインスタンス
export const authService = new AuthService();
