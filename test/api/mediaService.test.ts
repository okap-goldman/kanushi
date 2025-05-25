import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMediaService } from '../../src/lib/mediaService';

// モックSupabaseクライアント
const mockSupabase = {
  functions: {
    invoke: vi.fn(),
  },
};

describe('MediaService', () => {
  let mediaService: ReturnType<typeof createMediaService>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mediaService = createMediaService(mockSupabase as any);
  });
  
  describe('uploadFile', () => {
    it('ファイルアップロードが正常に完了すること', async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const mockResponse = {
        data: {
          success: true,
          url: 'https://cdn.example.com/test.jpg',
          fileId: 'file123',
        },
      };
      
      mockSupabase.functions.invoke.mockResolvedValueOnce(mockResponse);
      
      const result = await mediaService.uploadFile({ file: mockFile });
      
      expect(result.error).toBeUndefined();
      expect(result.data).toEqual({
        url: 'https://cdn.example.com/test.jpg',
        fileId: 'file123',
      });
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('upload-to-b2', {
        body: expect.any(FormData),
      });
    });
    
    it('アップロードエラー時にエラーメッセージを返すこと', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        error: { message: 'Upload failed' },
      });
      
      const result = await mediaService.uploadFile({ file: mockFile });
      
      expect(result.error).toBe('Upload failed');
      expect(result.data).toBeUndefined();
    });
  });
  
  describe('processAudio', () => {
    it('音声処理が正常に完了すること', async () => {
      const audioUrl = 'https://example.com/audio.mp3';
      const mockResponse = {
        data: {
          success: true,
          originalUrl: audioUrl,
          processedUrl: 'https://cdn.example.com/processed.mp3',
          waveformUrl: 'https://cdn.example.com/waveform.json',
          previewUrl: 'https://cdn.example.com/preview.mp3',
          durationSeconds: 300,
        },
      };
      
      mockSupabase.functions.invoke.mockResolvedValueOnce(mockResponse);
      
      const result = await mediaService.processAudio(audioUrl);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data).toEqual({
        originalUrl: audioUrl,
        processedUrl: 'https://cdn.example.com/processed.mp3',
        waveformUrl: 'https://cdn.example.com/waveform.json',
        previewUrl: 'https://cdn.example.com/preview.mp3',
        durationSeconds: 300,
      });
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('process-audio', {
        body: {
          audioUrl,
          outputPath: 'audio',
        },
      });
    });
    
    it('音質向上処理が適用されること', async () => {
      const audioUrl = 'https://example.com/audio.mp3';
      const mockResponse = {
        data: {
          success: true,
          originalUrl: audioUrl,
          processedUrl: 'https://cdn.example.com/processed.mp3',
          waveformUrl: 'https://cdn.example.com/waveform.json',
          previewUrl: 'https://cdn.example.com/preview.mp3',
          durationSeconds: 300,
          enhancementApplied: true,
        },
      };
      
      mockSupabase.functions.invoke.mockResolvedValueOnce(mockResponse);
      
      const result = await mediaService.processAudio(audioUrl, { enhanceAudio: true });
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data?.enhancementApplied).toBe(true);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('process-audio', {
        body: {
          audioUrl,
          outputPath: 'audio',
          enhanceAudio: true,
        },
      });
    });
    
    it('波形データが正しい形式で生成されること', async () => {
      const audioUrl = 'https://example.com/audio.mp3';
      const mockWaveformData = {
        waveform: Array(100).fill(0).map(() => Math.random()),
        duration: 300,
      };
      
      const mockResponse = {
        data: {
          success: true,
          originalUrl: audioUrl,
          processedUrl: 'https://cdn.example.com/processed.mp3',
          waveformUrl: 'https://cdn.example.com/waveform.json',
          waveformData: mockWaveformData,
          previewUrl: 'https://cdn.example.com/preview.mp3',
          durationSeconds: 300,
        },
      };
      
      mockSupabase.functions.invoke.mockResolvedValueOnce(mockResponse);
      
      const result = await mediaService.processAudio(audioUrl, { generateWaveform: true });
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data?.waveformData).toEqual(mockWaveformData);
      expect(result.data?.waveformData?.waveform.length).toBe(100);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('process-audio', {
        body: {
          audioUrl,
          outputPath: 'audio',
          generateWaveform: true,
        },
      });
    });
    
    it('プレビュー生成が指定した長さで作成されること', async () => {
      const audioUrl = 'https://example.com/audio.mp3';
      const previewDuration = 25; // 25秒のプレビュー
      
      const mockResponse = {
        data: {
          success: true,
          originalUrl: audioUrl,
          processedUrl: 'https://cdn.example.com/processed.mp3',
          waveformUrl: 'https://cdn.example.com/waveform.json',
          previewUrl: 'https://cdn.example.com/preview.mp3',
          previewDurationSeconds: previewDuration,
          durationSeconds: 300,
        },
      };
      
      mockSupabase.functions.invoke.mockResolvedValueOnce(mockResponse);
      
      const result = await mediaService.processAudio(audioUrl, { 
        generatePreview: true,
        previewDurationSeconds: previewDuration
      });
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data?.previewDurationSeconds).toBe(previewDuration);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('process-audio', {
        body: {
          audioUrl,
          outputPath: 'audio',
          generatePreview: true,
          previewDurationSeconds: previewDuration,
        },
      });
    });
    
    it('音声処理エラー時にエラーメッセージを返すこと', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        error: { message: 'Processing failed' },
      });
      
      const result = await mediaService.processAudio('https://example.com/audio.mp3');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Processing failed');
      expect(result.data).toBeUndefined();
    });
  });
  
  describe('processImage', () => {
    it('画像処理が正常に完了すること', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      const mockResponse = {
        data: {
          success: true,
          originalUrl: imageUrl,
          processedUrl: 'https://cdn.example.com/optimized.jpg',
          thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
          width: 1920,
          height: 1080,
          size: 512000,
        },
      };
      
      mockSupabase.functions.invoke.mockResolvedValueOnce(mockResponse);
      
      const result = await mediaService.processImage(imageUrl);
      
      expect(result.error).toBeUndefined();
      expect(result.data).toEqual({
        originalUrl: imageUrl,
        processedUrl: 'https://cdn.example.com/optimized.jpg',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        width: 1920,
        height: 1080,
        size: 512000,
      });
    });
    
    it('カスタムオプションで画像処理が実行されること', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      const options = { maxWidth: 800, maxHeight: 600, quality: 90 };
      const mockResponse = {
        data: {
          success: true,
          originalUrl: imageUrl,
          processedUrl: 'https://cdn.example.com/optimized.jpg',
          thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
          width: 800,
          height: 600,
          size: 256000,
        },
      };
      
      mockSupabase.functions.invoke.mockResolvedValueOnce(mockResponse);
      
      const result = await mediaService.processImage(imageUrl, options);
      
      expect(result.error).toBeUndefined();
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('process-image', {
        body: {
          imageUrl,
          outputPath: 'images',
          ...options,
        },
      });
    });
    
    it('画像処理エラー時にエラーメッセージを返すこと', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: { success: false, error: 'Invalid image format' },
      });
      
      const result = await mediaService.processImage('https://example.com/image.jpg');
      
      expect(result.error).toBe('Invalid image format');
      expect(result.data).toBeUndefined();
    });
  });
});
