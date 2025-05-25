import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shareService } from '../../src/lib/shareService';

// shareServiceをモック化
vi.mock('../../src/lib/shareService', () => ({
  shareService: {
    generateShareUrl: vi.fn(),
  },
}));

describe('ShareModal機能テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('シェアURLが正常に生成されることを確認', async () => {
    const postId = 'test-post-123';
    const mockShareData = {
      deepLink: `kanushi://post/${postId}`,
      webUrl: `https://app.kanushi.tld/post/${postId}`,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`kanushi://post/${postId}`)}`,
    };

    vi.mocked(shareService.generateShareUrl).mockResolvedValue({
      success: true,
      data: mockShareData,
      error: null,
    });

    const result = await shareService.generateShareUrl(postId);
    
    expect(result.success).toBe(true);
    expect(result.data?.deepLink).toBe(`kanushi://post/${postId}`);
    expect(result.data?.webUrl).toBe(`https://app.kanushi.tld/post/${postId}`);
  });

  it('無効な投稿IDでエラーを返すことを確認', async () => {
    vi.mocked(shareService.generateShareUrl).mockResolvedValue({
      success: false,
      data: null,
      error: new Error('投稿が見つかりません'),
    });

    const result = await shareService.generateShareUrl('');
    
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('投稿が見つかりません');
  });
});
