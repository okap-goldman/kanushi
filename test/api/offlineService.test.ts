import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { app } from '@/test/setup/api';

describe('Offline Content API Tests', () => {
  let validToken: string;

  beforeEach(() => {
    validToken = 'test-valid-token';
    jest.clearAllMocks();
  });

  describe('POST /offline-content/{postId}', () => {
    it('投稿をオフライン保存できる', async () => {
      // Act
      const response = await request(app)
        .post('/offline-content/test-post-id')
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(201);
    });

    it('既に保存済みの投稿は409エラーを返す', async () => {
      // Arrange
      await request(app)
        .post('/offline-content/test-post-id')
        .set('Authorization', `Bearer ${validToken}`);

      // Act
      const response = await request(app)
        .post('/offline-content/test-post-id')
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(409);
    });
  });

  describe('GET /offline-content', () => {
    it('オフライン保存したコンテンツ一覧を取得できる', async () => {
      // Act
      const response = await request(app)
        .get('/offline-content')
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        items: expect.any(Array),
        totalSizeBytes: expect.any(Number),
        maxSizeBytes: 524288000 // 500MB
      });
      expect(response.body.items[0]).toMatchObject({
        post: expect.any(Object),
        sizeBytes: expect.any(Number),
        cachedAt: expect.any(String),
        expiresAt: expect.any(String)
      });
    });
  });
});

describe('Rate Limiting Tests', () => {
  let validToken: string;

  beforeEach(() => {
    validToken = 'test-valid-token';
    jest.clearAllMocks();
  });

  it('1分間に10件を超える投稿で429エラーを返す', async () => {
    // Arrange
    const promises = [];
    for (let i = 0; i < 11; i++) {
      promises.push(
        request(app)
          .post('/posts')
          .set('Authorization', `Bearer ${validToken}`)
          .send({
            contentType: 'text',
            textContent: `テスト投稿 ${i}`
          })
      );
    }

    // Act
    const responses = await Promise.all(promises);

    // Assert
    const successCount = responses.filter(r => r.status === 201).length;
    const rateLimitedCount = responses.filter(r => r.status === 429).length;
    
    expect(successCount).toBe(10);
    expect(rateLimitedCount).toBe(1);
    
    const rateLimitedResponse = responses.find(r => r.status === 429);
    expect(rateLimitedResponse.body).toMatchObject({
      type: 'RATE_LIMIT_EXCEEDED',
      retryAfter: expect.any(Number),
      limit: 10,
      window: '1 minute'
    });
  });
});
