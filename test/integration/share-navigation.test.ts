import { describe, expect, test, vi, beforeEach } from 'vitest';
import { navigationRef } from '../../src/navigation';

describe('Share Navigation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Deep Link対応', () => {
    test('Deep Linkから投稿詳細画面へのダイレクトアクセス', () => {
      const deepLink = 'kanushi://post/test-post-123';
      
      handleDeepLink(deepLink);

      const currentRoute = navigationRef.current?.getCurrentRoute();
      expect(currentRoute?.name).toBe('PostDetail');
      expect(currentRoute?.params).toMatchObject({
        postId: 'test-post-123'
      });
    });

    test('無効な投稿Deep Linkのハンドリング', () => {
      const invalidLink = 'kanushi://post/invalid-id';
      
      const result = handleDeepLink(invalidLink);

      expect(result).toBe(false);
      const currentRoute = navigationRef.current?.getCurrentRoute();
      expect(currentRoute?.name).toBe('Home');
    });
  });
});

function handleDeepLink(url: string): boolean {
  if (url.startsWith('kanushi://post/')) {
    const postId = url.replace('kanushi://post/', '');
    
    navigationRef.current?.navigate('PostDetail', {
      postId,
      source: 'deeplink'
    });
    return true;
  }
  
  navigationRef.current?.navigate('Home');
  return false;
}
