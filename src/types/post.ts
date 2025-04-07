/**
 * 投稿関連モデルの型定義
 * 
 * アプリケーションで使用される各種投稿タイプの型を定義します。
 * 基本的な投稿インターフェースとそれを拡張した各種メディアタイプの投稿が含まれています。
 */

/**
 * 基本投稿インターフェース
 * 
 * すべての投稿タイプの基本となるインターフェース
 * 
 * @interface Post
 * @property {number} [post_id] - 投稿ID（新規作成時はundefined）
 * @property {number} user_id - 投稿者のユーザーID
 * @property {string} post_type - 投稿タイプを示す文字列
 * @property {string} [created_at] - 投稿作成日時（ISO形式の文字列、新規作成時はundefined）
 * @property {string} [updated_at] - 投稿更新日時（ISO形式の文字列、新規作成時はundefined）
 * @property {'public' | 'private' | 'followers'} visibility - 投稿の公開範囲
 */
export interface Post {
  post_id?: number;
  user_id: number;
  post_type: string;
  created_at?: string;
  updated_at?: string;
  visibility: 'public' | 'private' | 'followers';
}

/**
 * テキスト投稿インターフェース
 * 
 * テキストコンテンツを含む投稿の型定義
 * 
 * @interface TextPost
 * @extends {Post}
 * @property {string} [title] - 投稿のタイトル（省略可能）
 * @property {string} text_content - 投稿のテキスト内容
 */
export interface TextPost extends Post {
  title?: string;
  text_content: string;
}

/**
 * 動画投稿インターフェース
 * 
 * YouTube動画のURLを含む投稿の型定義
 * 
 * @interface VideoPost
 * @extends {Post}
 * @property {string} [title] - 動画のタイトル（省略可能）
 * @property {string} [description] - 動画の説明（省略可能）
 * @property {string} youtube_url - YouTube動画のURL
 * @property {string} [thumbnail_url] - サムネイル画像のURL（省略可能）
 * @property {number | null} [upload_id] - アップロードID（省略可能）
 */
export interface VideoPost extends Post {
  title?: string;
  description?: string;
  youtube_url: string;
  thumbnail_url?: string;
  upload_id?: number | null;
}