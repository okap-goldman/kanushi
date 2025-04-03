import { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/types/user';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const createUserFromFirebase = (firebaseUser: any): User => ({
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const isDevelopment = import.meta.env.MODE === 'development';
  const testingEmail = import.meta.env.VITE_TESTING_GOOGLE_MAIL;

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
