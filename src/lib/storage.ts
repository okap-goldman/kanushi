/**
 * ストレージモジュール
 * 
 * 画像や音声ファイルのアップロード機能を提供します。
 * Firebase StorageとAWS S3への接続とファイルの格納を管理します。
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * 画像アップロードのオプション型定義
 * 
 * @interface UploadImageOptions
 * @property {string[]} [allowedTypes] - アップロード可能なMIMEタイプの配列
 */
interface UploadImageOptions {
  allowedTypes?: string[];
}

/**
 * 画像アップロードのデフォルトオプション
 * 
 * @constant {UploadImageOptions}
 * @default
 */
const DEFAULT_OPTIONS: UploadImageOptions = {
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

/**
 * 音声アップロードのオプション型定義
 * 
 * @interface UploadAudioOptions
 * @property {string[]} [allowedTypes] - アップロード可能なMIMEタイプの配列
 */
interface UploadAudioOptions {
  allowedTypes?: string[];
}

/**
 * 音声アップロードのデフォルトオプション
 * 
 * @constant {UploadAudioOptions}
 * @default
 */
const DEFAULT_AUDIO_OPTIONS: UploadAudioOptions = {
  allowedTypes: ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a']
};

/**
 * 画像アップロード用のカスタムエラークラス
 * 
 * @class ImageUploadError
 * @extends {Error}
 */
export class ImageUploadError extends Error {
  /**
   * ImageUploadErrorのコンストラクタ
   * 
   * @param {string} message - エラーメッセージ
   */
  constructor(message: string) {
    super(message);
    this.name = 'ImageUploadError';
  }
}

/**
 * 音声アップロード用のカスタムエラークラス
 * 
 * @class AudioUploadError
 * @extends {Error}
 */
export class AudioUploadError extends Error {
  /**
   * AudioUploadErrorのコンストラクタ
   * 
   * @param {string} message - エラーメッセージ
   */
  constructor(message: string) {
    super(message);
    this.name = 'AudioUploadError';
  }
}

/**
 * 画像ファイルをFirebase Storageにアップロードします
 * 
 * 開発環境では失敗した場合にローカルURLを生成して返します。
 * ファイルタイプのバリデーションを行い、対応していない形式の場合はエラーを投げます。
 * 
 * @param {File} file - アップロードする画像ファイル
 * @param {UploadImageOptions} [options=DEFAULT_OPTIONS] - アップロードオプション
 * @returns {Promise<string>} アップロードされた画像のURL
 * @throws {ImageUploadError} アップロードに失敗した場合やファイル形式が非対応の場合
 */
export const uploadImage = async (
  file: File,
  options: UploadImageOptions = DEFAULT_OPTIONS
): Promise<string> => {
  // バリデーション
  if (!options.allowedTypes?.includes(file.type)) {
    throw new ImageUploadError(
      '対応していないファイル形式です。JPEG、PNG、GIF、WebPのみ対応しています。'
    );
  }

  try {
    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `images/${fileName}`);
    
    // メタデータを設定（CORSの問題対応）
    const metadata = {
      contentType: file.type,
      customMetadata: {
        'Access-Control-Allow-Origin': '*'
      }
    };
    
    // 開発環境での処理
    const isDevelopment = import.meta.env.MODE === 'development';
    if (isDevelopment) {
      console.log('開発環境: Firebase Storage Emulatorを使用します');
      
      try {
        // ファイルアップロード（メタデータを含める）
        const snapshot = await uploadBytes(storageRef, file, metadata);
        
        // ダウンロードURL取得
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
      } catch (storageError) {
        console.warn('開発環境: Firebase Storageへのアップロードに失敗しました。ローカルURLを返します。', storageError);
        
        // 開発環境ではエラーが発生した場合、ローカルURLを返す
        // これにより、開発環境でもUIテストが可能になる
        const localUrl = URL.createObjectURL(file);
        console.log('開発環境: ローカルURLを生成しました:', localUrl);
        return localUrl;
      }
    }
    
    // 本番環境での処理
    // ファイルアップロード（メタデータを含める）
    const snapshot = await uploadBytes(storageRef, file, metadata);
    
    // ダウンロードURL取得
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Image upload error:', error);
    // より詳細なエラーメッセージをログに出力
    if (error instanceof Error) {
      console.error('エラーの詳細:', error.message);
      if ('code' in error) {
        console.error('エラーコード:', (error as {code: string}).code);
      }
    }
    throw new ImageUploadError(
      'アップロードに失敗しました。もう一度お試しください。'
    );
  }
};

/**
 * 音声ファイルをFirebase Storageにアップロードします
 * 
 * 開発環境では失敗した場合にローカルURLを生成して返します。
 * ファイルタイプのバリデーションを行い、対応していない形式の場合はエラーを投げます。
 * 
 * @param {File} file - アップロードする音声ファイル
 * @param {UploadAudioOptions} [options=DEFAULT_AUDIO_OPTIONS] - アップロードオプション
 * @returns {Promise<string>} アップロードされた音声ファイルのURL
 * @throws {AudioUploadError} アップロードに失敗した場合やファイル形式が非対応の場合
 */
export const uploadAudio = async (
  file: File,
  options: UploadAudioOptions = DEFAULT_AUDIO_OPTIONS
): Promise<string> => {
  // バリデーション
  if (!options.allowedTypes?.includes(file.type)) {
    throw new AudioUploadError(
      '対応していないファイル形式です。WAV、MP3、MP4、M4Aのみ対応しています。'
    );
  }

  try {
    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `audios/${fileName}`);
    
    // メタデータを設定（CORSの問題対応）
    const metadata = {
      contentType: file.type,
      customMetadata: {
        'Access-Control-Allow-Origin': '*'
      }
    };
    
    // 開発環境での処理
    const isDevelopment = import.meta.env.MODE === 'development';
    if (isDevelopment) {
      console.log('開発環境: Firebase Storage Emulatorを使用します');
      
      try {
        // ファイルアップロード（メタデータを含める）
        const snapshot = await uploadBytes(storageRef, file, metadata);
        
        // ダウンロードURL取得
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
      } catch (storageError) {
        console.warn('開発環境: Firebase Storageへのアップロードに失敗しました。ローカルURLを返します。', storageError);
        
        // 開発環境ではエラーが発生した場合、ローカルURLを返す
        // これにより、開発環境でもUIテストが可能になる
        const localUrl = URL.createObjectURL(file);
        console.log('開発環境: ローカルURLを生成しました:', localUrl);
        return localUrl;
      }
    }
    
    // 本番環境での処理
    // ファイルアップロード（メタデータを含める）
    const snapshot = await uploadBytes(storageRef, file, metadata);
    
    // ダウンロードURL取得
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Audio upload error:', error);
    // より詳細なエラーメッセージをログに出力
    if (error instanceof Error) {
      console.error('エラーの詳細:', error.message);
      if ('code' in error) {
        console.error('エラーコード:', (error as {code: string}).code);
      }
    }
    throw new AudioUploadError(
      'アップロードに失敗しました。もう一度お試しください。'
    );
  }
}
