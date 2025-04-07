/**
 * プライベートルートコンポーネントモジュール
 * 
 * 認証されたユーザーのみがアクセスできるルートを提供します。
 * 認証されていないユーザーはログインページにリダイレクトされます。
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { type ReactNode } from 'react';

/**
 * プライベートルートコンポーネント
 * 
 * 認証状態を確認し、認証されているユーザーのみ子コンポーネントを表示します。
 * 認証されていない場合、ログインページにリダイレクトします。
 * 認証情報の読み込み中はローディングスピナーを表示します。
 * 
 * @param {Object} props - コンポーネントのプロパティ
 * @param {ReactNode} props.children - 保護されたコンテンツとして表示する子コンポーネント
 * @returns {JSX.Element} 認証状態に基づいて表示されるコンポーネント
 */
export function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, isInitialized } = useAuth();
  const location = useLocation();

  if (!isInitialized || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-500"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
