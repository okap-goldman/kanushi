import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { app } from '@/test/setup/api';
import { supabase } from '@/lib/supabase';

describe('Timeline API Tests', () => {
  let validToken: string;

  beforeEach(() => {
    validToken = 'test-valid-token';
    jest.clearAllMocks();
  });

  describe('GET /timeline?type=family', () => {
    it('ファミリーフォローの投稿を時系列順に取得できる', async () => {
      // Arrange
      const userId = 'test-user-id';
      const expectedPosts = [
        { id: 'post1', user_id: 'family-user1', created_at: '2024-01-02' },
        { id: 'post2', user_id: 'family-user2', created_at: '2024-01-01' }
      ];

      // Act
      const response = await request(app)
        .get('/timeline?type=family')
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0].id).toBe('post1');
      expect(response.body.nextCursor).toBeDefined();
    });

    it('カーソルベースのページネーションが動作する', async () => {
      // Arrange
      const firstPageCursor = 'cursor-1';

      // Act
      const response = await request(app)
        .get(`/timeline?type=family&cursor=${firstPageCursor}`)
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.items).toBeDefined();
      expect(response.body.items.length).toBeLessThanOrEqual(20);
    });

    it('認証なしでアクセスすると401エラーを返す', async () => {
      // Act
      const response = await request(app)
        .get('/timeline?type=family');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.type).toBe('MISSING_TOKEN');
    });
  });

  describe('GET /timeline?type=watch', () => {
    it('ウォッチフォローの投稿を取得できる', async () => {
      // Act
      const response = await request(app)
        .get('/timeline?type=watch')
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.items).toBeDefined();
      expect(response.body.items.every(post => 
        post.user.followType === 'watch'
      )).toBe(true);
    });
  });
});
