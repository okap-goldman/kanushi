import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createShareService, ShareService } from '../../src/lib/shareService';

describe('ShareService - URL生成機能', () => {
  let shareService: ShareService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    shareService = createShareService();
    
    vi.spyOn(shareService, 'validatePostExists').mockImplementation(async (postId) => {
      if (postId && postId.trim() !== '') {
        return {
          success: true,
          data: true,
          error: null
        };
      } else {
        return {
          success: false,
          data: null,
          error: new Error('投稿が見つかりません')
        };
      }
    });
  });

  describe('generateShareUrl', () => {
    it('投稿IDからシェアURLを正常に生成すること', async () => {
      const postId = 'test-post-123';
      const result = await shareService.generateShareUrl(postId);
      
      expect(result.success).toBe(true);
      expect(result.data?.deepLink).toBe(`kanushi://post/${postId}`);
      expect(result.data?.webUrl).toMatch(/https:\/\/app\.kanushi\.tld/);
    });

    it('無効な投稿IDでエラーを返すこと', async () => {
      const result = await shareService.generateShareUrl('');
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('投稿IDが無効です');
    });
  });
});
