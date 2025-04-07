/**
 * ユーザーモデルの型定義
 * 
 * アプリケーション全体で使用されるユーザー情報の型を定義します。
 * Firebase認証との連携も含まれています。
 */

/**
 * ユーザーの型定義
 * 
 * @typedef {Object} User
 * @property {number} user_id - ユーザーの一意識別子（数値）
 * @property {string} uid - FirebaseのUID
 * @property {string} user_name - ユーザー名
 * @property {string} email - メールアドレス
 * @property {string | null} profile_icon_url - プロフィールアイコンのURL（設定されていない場合はnull）
 * @property {string | null} profile_audio_url - プロフィール音声のURL（設定されていない場合はnull）
 * @property {string | null} shop_link_url - ショップリンクのURL（設定されていない場合はnull）
 * @property {boolean} is_shop_link - ショップリンクが有効かどうか
 * @property {string | null} introduction - 自己紹介文（設定されていない場合はnull）
 * @property {string} created_at - アカウント作成日時（ISO形式の文字列）
 * @property {string} updated_at - アカウント更新日時（ISO形式の文字列）
 */
export type User = {
  user_id: number;
  uid: string;  // Firebase UID
  user_name: string;
  email: string;
  profile_icon_url: string | null;
  profile_audio_url: string | null;
  shop_link_url: string | null;
  is_shop_link: boolean;
  introduction: string | null;
  created_at: string;
  updated_at: string;
};
