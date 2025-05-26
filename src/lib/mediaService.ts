import type { ServiceResult } from './data';
import { supabase } from './supabase';

// メディア処理の型定義
export interface MediaUploadInput {
  file: File;
  path?: string;
}

export interface AudioProcessingResult {
  originalUrl: string;
  processedUrl: string;
  waveformUrl: string;
  previewUrl: string;
  durationSeconds: number;
}

export interface ImageProcessingResult {
  originalUrl: string;
  processedUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  size: number;
}

export interface MediaService {
  uploadFile(input: MediaUploadInput): Promise<ServiceResult<{ url: string; fileId: string }>>;
  processAudio(audioUrl: string): Promise<ServiceResult<AudioProcessingResult>>;
  processImage(
    imageUrl: string,
    options?: { maxWidth?: number; maxHeight?: number; quality?: number }
  ): Promise<ServiceResult<ImageProcessingResult>>;
}

export function createMediaService(supabaseClient = supabase): MediaService {
  return {
    async uploadFile(
      input: MediaUploadInput
    ): Promise<ServiceResult<{ url: string; fileId: string }>> {
      try {
        const { file, path = 'uploads' } = input;

        // FormDataを作成
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', path);

        // Edge Functionを呼び出してファイルをアップロード
        const { data, error } = await supabaseClient.functions.invoke('upload-to-b2', {
          body: formData,
        });

        if (error) {
          return { error: error.message };
        }

        if (!data.success) {
          return { error: data.error || 'Upload failed' };
        }

        return {
          data: {
            url: data.url,
            fileId: data.fileId,
          },
        };
      } catch (error) {
        console.error('File upload error:', error);
        return { error: 'ファイルのアップロードに失敗しました' };
      }
    },

    async processAudio(audioUrl: string): Promise<ServiceResult<AudioProcessingResult>> {
      try {
        // Edge Functionを呼び出して音声を処理
        const { data, error } = await supabaseClient.functions.invoke('process-audio', {
          body: {
            audioUrl,
            outputPath: 'audio',
          },
        });

        if (error) {
          return { error: error.message };
        }

        if (!data.success) {
          return { error: data.error || 'Audio processing failed' };
        }

        return {
          data: {
            originalUrl: data.originalUrl,
            processedUrl: data.processedUrl,
            waveformUrl: data.waveformUrl,
            previewUrl: data.previewUrl,
            durationSeconds: data.durationSeconds,
          },
        };
      } catch (error) {
        console.error('Audio processing error:', error);
        return { error: '音声の処理に失敗しました' };
      }
    },

    async processImage(
      imageUrl: string,
      options?: { maxWidth?: number; maxHeight?: number; quality?: number }
    ): Promise<ServiceResult<ImageProcessingResult>> {
      try {
        // Edge Functionを呼び出して画像を処理
        const { data, error } = await supabaseClient.functions.invoke('process-image', {
          body: {
            imageUrl,
            outputPath: 'images',
            ...options,
          },
        });

        if (error) {
          return { error: error.message };
        }

        if (!data.success) {
          return { error: data.error || 'Image processing failed' };
        }

        return {
          data: {
            originalUrl: data.originalUrl,
            processedUrl: data.processedUrl,
            thumbnailUrl: data.thumbnailUrl,
            width: data.width,
            height: data.height,
            size: data.size,
          },
        };
      } catch (error) {
        console.error('Image processing error:', error);
        return { error: '画像の処理に失敗しました' };
      }
    },
  };
}
