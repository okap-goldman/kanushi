import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { uploadToSoundCloud } from './soundcloud';

interface UploadImageOptions {
  allowedTypes?: string[];
}

const DEFAULT_OPTIONS: UploadImageOptions = {
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

interface UploadAudioOptions {
  allowedTypes?: string[];
}

const DEFAULT_AUDIO_OPTIONS: UploadAudioOptions = {
  allowedTypes: ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a']
};

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageUploadError';
  }
}

export class AudioUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AudioUploadError';
  }
}

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
        console.error('エラーコード:', (error as any).code);
      }
    }
    throw new ImageUploadError(
      'アップロードに失敗しました。もう一度お試しください。'
    );
  }
};


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
    // SoundCloudにアップロード
    const title = `Voice ${new Date().toISOString()}`;
    const soundcloudUrl = await uploadToSoundCloud(file, title);
    return soundcloudUrl;
  } catch (error) {
    console.error('Audio upload error:', error);
    // より詳細なエラーメッセージをログに出力
    if (error instanceof Error) {
      console.error('エラーの詳細:', error.message);
      if ('code' in error) {
        console.error('エラーコード:', (error as any).code);
      }
    }
    throw new AudioUploadError(
      'アップロードに失敗しました。もう一度お試しください。'
    );
  }
}
