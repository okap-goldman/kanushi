/**
 * 認証コンテキストモジュール
 * 
 * ユーザー認証の状態とメソッドを提供するコンテキストです。
 * Firebase Authenticationを使用してユーザーのログイン・ログアウト機能を提供します。
 */
import { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/types/user';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * 認証コンテキストの型定義
 * 
 * @typedef {Object} AuthContextType
 * @property {User | null} user - 現在ログインしているユーザー情報（未ログイン時はnull）
 * @property {boolean} isLoading - 認証処理中かどうかを示すフラグ
 * @property {boolean} isInitialized - 認証コンテキストが初期化されたかどうかを示すフラグ
 * @property {Function} login - ログイン処理を行う関数
 * @property {Function} logout - ログアウト処理を行う関数
 */
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

/**
 * 認証コンテキストの作成
 * 初期値はundefinedで、後からProviderによって値が提供されます
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Firebase認証ユーザーからアプリケーション用のユーザーオブジェクトを作成します
 * 
 * @param {Object} firebaseUser - Firebase認証から取得したユーザー情報
 * @param {string} firebaseUser.uid - ユーザーの一意識別子
 * @param {string} [firebaseUser.displayName] - ユーザーの表示名
 * @param {string} [firebaseUser.email] - ユーザーのメールアドレス
 * @param {string} [firebaseUser.photoURL] - ユーザーのプロフィール画像URL
 * @returns {User} アプリケーション用のユーザーオブジェクト
 */
const createUserFromFirebase = (firebaseUser: { 
  uid: string; 
  displayName?: string; 
  email?: string; 
  photoURL?: string;
}): User => ({
  user_id: parseInt(firebaseUser.uid.slice(0, 8), 16), // UIDの最初の8文字を数値に変換
  uid: firebaseUser.uid, // Firebase UIDを保持
  user_name: firebaseUser.displayName || '名称未設定',
  email: firebaseUser.email || '',
  profile_icon_url: firebaseUser.photoURL,
  profile_audio_url: null,
  shop_link_url: null,
  is_shop_link: false,
  introduction: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

/**
 * 認証プロバイダーコンポーネント
 * 
 * アプリケーション全体に認証状態と認証機能を提供します。
 * Firebase Authenticationの状態変更を監視し、ユーザー情報を管理します。
 * 開発環境では自動的にテストユーザーでログインできる機能も提供します。
 * 
 * @param {Object} props - コンポーネントのプロパティ
 * @param {React.ReactNode} props.children - プロバイダーでラップする子コンポーネント
 * @returns {JSX.Element} 認証プロバイダーコンポーネント
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const isDevelopment = import.meta.env.MODE === 'development';
  const testingEmail = import.meta.env.VITE_TESTING_GOOGLE_MAIL;

  /**
   * Firebase認証の状態変更を監視し、ユーザー情報を更新します
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      try {
        if (firebaseUser) {
          const appUser = createUserFromFirebase(firebaseUser);
          setUser(appUser);
        } else {
          // 開発環境では自動的にテストユーザーでログイン
          if (isDevelopment && testingEmail) {
            console.log('開発環境: テストユーザーで自動ログイン');
            const mockUser = {
              uid: '12345678',
              displayName: 'Test User',
              email: testingEmail,
              photoURL: 'https://example.com/default-avatar.png'
            };
            const appUser = createUserFromFirebase(mockUser);
            setUser(appUser);
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isDevelopment, testingEmail]);

  /**
   * ユーザーのログイン処理を行います
   * 
   * Google認証を使用してユーザーをログインさせます。
   * 開発環境ではテストユーザーでログインすることも可能です。
   * 
   * @returns {Promise<void>} ログイン処理の結果を返すPromise
   */
  const login = async () => {
    try {
      setIsLoading(true);
      
      if (isDevelopment && testingEmail) {
        // 開発環境でのバイパス
        const mockUser = {
          uid: '12345678',
          displayName: 'Test User',
          email: testingEmail,
          photoURL: 'https://example.com/default-avatar.png'
        };
        const appUser = createUserFromFirebase(mockUser);
        setUser(appUser);
        setIsLoading(false);
        return;
      }

      // 通常のGoogle認証フロー
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const appUser = createUserFromFirebase(result.user);
      setUser(appUser);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ユーザーのログアウト処理を行います
   * 
   * Firebase認証からサインアウトし、ユーザー情報をクリアします。
   * 
   * @returns {Promise<void>} ログアウト処理の結果を返すPromise
   */
  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isInitialized, login, logout }}>
      {isInitialized ? children : null}
    </AuthContext.Provider>
  );
}

/**
 * 認証コンテキストを使用するためのカスタムフック
 * 
 * AuthProviderの外部で使用した場合はエラーをスローします。
 * 
 * @returns {AuthContextType} 認証コンテキストの値
 * @throws {Error} AuthProviderの外部で使用された場合
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
