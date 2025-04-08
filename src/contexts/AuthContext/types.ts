import type { User } from '@/types/user';

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
export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}; 