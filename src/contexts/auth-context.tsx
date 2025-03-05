import { createContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '@/types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          // Firestoreからユーザー情報を取得
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            // ユーザードキュメントが存在しない場合は基本情報だけ設定
            setUser({
              uid: firebaseUser.uid,
              user_id: parseInt(firebaseUser.uid.slice(0, 8), 16),
              user_name: firebaseUser.displayName || '名称未設定',
              email: firebaseUser.email || '',
              profile_icon_url: firebaseUser.photoURL || null,
              profile_audio_url: null,
              shop_link_url: null,
              is_shop_link: false,
              introduction: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as User);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('認証エラーが発生しました'));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
