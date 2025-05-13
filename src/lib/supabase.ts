import { createClient } from '@supabase/supabase-js';

// 環境変数からSupabaseの設定を取得（後で.envファイルに追加します）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Supabaseクライアントの作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 投稿データの型定義
export interface PostData {
  user_id: string;
  content_type: string;
  text_content: string;
  media_url?: string | null;
  audio_url?: string | null;
  thumbnail_url?: string | null;
}

// ファイルアップロード関数
export const uploadFile = async (
  file: File,
  bucket: string = 'media',
  folder: string = 'uploads'
): Promise<{ url: string | null; error: Error | null }> => {
  try {
    // ファイル名の一意性を確保するため、タイムスタンプを追加
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // ファイルをアップロード
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // アップロードしたファイルの公開URLを取得
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error('Upload error:', error);
    return { url: null, error: error as Error };
  }
};

// 音声Blobをアップロードする関数
export const uploadAudioBlob = async (
  audioBlob: Blob,
  bucket: string = 'media',
  folder: string = 'audio'
): Promise<{ url: string | null; error: Error | null }> => {
  try {
    // 一意のファイル名を生成
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 15)}.wav`;
    
    // Blobをアップロード
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, audioBlob, {
        contentType: 'audio/wav',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // アップロードしたファイルの公開URLを取得
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error('Audio upload error:', error);
    return { url: null, error: error as Error };
  }
};

// 投稿を保存する関数
export const savePost = async (
  postData: PostData
): Promise<{ success: boolean; error: Error | null; data: any }> => {
  try {
    // メディアURLが配列の場合は最初の要素を使用し、残りはJSON文字列として保存
    let primaryMediaUrl = null;
    if (Array.isArray(postData.media_url) && postData.media_url.length > 0) {
      primaryMediaUrl = postData.media_url[0];
    } else if (typeof postData.media_url === 'string') {
      primaryMediaUrl = postData.media_url;
    }

    // 投稿データをpostsテーブルに挿入
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: postData.user_id,
        content_type: postData.content_type,
        text_content: postData.text_content,
        media_url: Array.isArray(postData.media_url) ? JSON.stringify(postData.media_url) : postData.media_url,
        thumbnail_url: postData.thumbnail_url || primaryMediaUrl, // サムネイルがなければ最初のメディアを使用
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Post save error:', error);
    return { success: false, error: error as Error, data: null };
  }
};