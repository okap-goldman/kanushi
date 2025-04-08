import { createContext } from 'react';
import { AuthContextType } from './types';

/**
 * 認証コンテキストの作成
 * 初期値はundefinedで、後からProviderによって値が提供されます
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined); 