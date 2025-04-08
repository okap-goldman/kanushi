import type { User } from '@/types/user';

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
export const createUserFromFirebase = (firebaseUser: { 
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