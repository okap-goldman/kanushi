import { useContext } from 'react';
import { AuthContextType } from '@/contexts/AuthContext/types';
import { AuthContext } from '@/contexts/AuthContext/context';

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