import { supabase } from './supabase';

/**
 * サービス結果の型定義
 * @param T 成功時のデータ型
 */
export interface ServiceResult<T> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * メディア処理の型定義
 */
export interface MediaUploadInput {
  file: File;
  path?: string;
}

/**
 * 音声処理オプション
 */
export interface AudioProcessingOptions {
  enhanceAudio?: boolean;
  generateWaveform?: boolean;
  generatePreview?: boolean;
  previewDurationSeconds?: number;
}

/**
 * 音声処理結果
 */
export interface AudioProcessingResult {
  originalUrl: string;
  processedUrl: string;
  waveformUrl: string;
  waveformData?: {
    waveform: number[];
    duration: number;
  };
  previewUrl: string;
  previewDurationSeconds?: number;
  durationSeconds: number;
  enhancementApplied?: boolean;
}

/**
 * 画像処理結果
 */
export interface ImageProcessingResult {
  originalUrl: string;
  processedUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  size: number;
}

/**
 * メディアサービスインターフェース
 */
export interface MediaService {
  uploadFile(input: MediaUploadInput): Promise<ServiceResult<{ url: string; fileId: string }>>;
  processAudio(audioUrl: string, options?: AudioProcessingOptions): Promise<ServiceResult<AudioProcessingResult>>;
  processImage(imageUrl: string, options?: { maxWidth?: number; maxHeight?: number; quality?: number }): Promise<ServiceResult<ImageProcessingResult>>;
}

export function createMediaService(supabaseClient = supabase): MediaService {
  return {
    async uploadFile(input: MediaUploadInput): Promise<ServiceResult<{ url: string; fileId: string }>> {
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
          return { 
            error: error.message,
            success: false
          };
        }
        
        if (!data.success) {
          return { 
            error: data.error || 'Upload failed',
            success: false
          };
        }
        
        return {
          data: {
            url: data.url,
            fileId: data.fileId,
          },
          success: true
        };
      } catch (error) {
        console.error('File upload error:', error);
        return { 
          error: error instanceof Error ? error.message : 'ファイルのアップロードに失敗しました',
          success: false
        };
      }
    },
    
    async processAudio(audioUrl: string, options?: AudioProcessingOptions): Promise<ServiceResult<AudioProcessingResult>> {
      try {
        // Edge Functionを呼び出して音声を処理
        const { data, error } = await supabaseClient.functions.invoke('process-audio', {
          body: {
            audioUrl,
            outputPath: 'audio',
            ...options,
          },
        });
        
        if (error) {
          return { 
            error: error.message,
            success: false
          };
        }
        
        if (!data.success) {
          return { 
            error: data.error || 'Audio processing failed',
            success: false
          };
        }
        
        return {
          data: {
            originalUrl: data.originalUrl,
            processedUrl: data.processedUrl,
            waveformUrl: data.waveformUrl,
            waveformData: data.waveformData,
            previewUrl: data.previewUrl,
            previewDurationSeconds: data.previewDurationSeconds,
            durationSeconds: data.durationSeconds,
            enhancementApplied: data.enhancementApplied,
          },
          success: true
        };
      } catch (error) {
        console.error('Audio processing error:', error);
        return { 
          error: error instanceof Error ? error.message : '音声の処理に失敗しました',
          success: false
        };
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
          return { 
            error: error.message,
            success: false
          };
        }
        
        if (!data.success) {
          return { 
            error: data.error || 'Image processing failed',
            success: false
          };
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
          success: true
        };
      } catch (error) {
        console.error('Image processing error:', error);
        return { 
          error: error instanceof Error ? error.message : '画像の処理に失敗しました',
          success: false
        };
      }
    },
  };
}
