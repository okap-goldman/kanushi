import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { app } from '@/test/setup/api';

describe('Post Actions API Tests', () => {
  let validToken: string;

  beforeEach(() => {
    validToken = 'test-valid-token';
    jest.clearAllMocks();
  });

  describe('POST /posts/{postId}/like', () => {
    it('投稿にいいねできる', async () => {
      // Arrange
      const postId = 'test-post-id';

      // Act
      const response = await request(app)
        .post(`/posts/${postId}/like`)
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(204);
    });

    it('同じ投稿に2回いいねすると409エラーを返す', async () => {
      // Arrange
      const postId = 'test-post-id';
      await request(app)
        .post(`/posts/${postId}/like`)
        .set('Authorization', `Bearer ${validToken}`);

      // Act
      const response = await request(app)
        .post(`/posts/${postId}/like`)
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.type).toBe('ALREADY_LIKED');
    });

    it('存在しない投稿にいいねすると404エラーを返す', async () => {
      // Act
      const response = await request(app)
        .post('/posts/non-existent-id/like')
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.type).toBe('RESOURCE_NOT_FOUND');
    });
  });

  describe('DELETE /posts/{postId}/like', () => {
    it('いいねを取り消せる', async () => {
      // Arrange
      const postId = 'test-post-id';
      await request(app)
        .post(`/posts/${postId}/like`)
        .set('Authorization', `Bearer ${validToken}`);

      // Act
      const response = await request(app)
        .delete(`/posts/${postId}/like`)
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(204);
    });
  });

  describe('POST /posts/{postId}/highlight', () => {
    it('理由付きでハイライトできる', async () => {
      // Arrange
      const postId = 'test-post-id';
      const reason = 'この投稿から深い気づきを得ました';

      // Act
      const response = await request(app)
        .post(`/posts/${postId}/highlight`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ reason });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.reason).toBe(reason);
      expect(response.body.postId).toBe(postId);
    });

    it('理由なしでハイライトすると400エラーを返す', async () => {
      // Act
      const response = await request(app)
        .post('/posts/test-post-id/highlight')
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.type).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('reason');
    });

    it('同じ投稿を2回ハイライトすると409エラーを返す', async () => {
      // Arrange
      const postId = 'test-post-id';
      await request(app)
        .post(`/posts/${postId}/highlight`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ reason: '初回の理由' });

      // Act
      const response = await request(app)
        .post(`/posts/${postId}/highlight`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ reason: '2回目の理由' });

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.type).toBe('ALREADY_HIGHLIGHTED');
    });
  });

  describe('POST /posts/{postId}/comments', () => {
    it('投稿にコメントできる', async () => {
      // Arrange
      const postId = 'test-post-id';
      const comment = '素晴らしい投稿ですね！';

      // Act
      const response = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ body: comment });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.body).toBe(comment);
      expect(response.body.user.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('空のコメントは400エラーを返す', async () => {
      // Act
      const response = await request(app)
        .post('/posts/test-post-id/comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ body: '' });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.type).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /posts/{postId}/comments', () => {
    it('投稿のコメント一覧を取得できる', async () => {
      // Act
      const response = await request(app)
        .get('/posts/test-post-id/comments')
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toMatchObject({
        id: expect.any(String),
        body: expect.any(String),
        user: expect.any(Object),
        createdAt: expect.any(String)
      });
    });
  });

  describe('POST /posts/{postId}/bookmark', () => {
    it('投稿をブックマークできる', async () => {
      // Act
      const response = await request(app)
        .post('/posts/test-post-id/bookmark')
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(201);
    });
  });

  describe('DELETE /posts/{postId}/bookmark', () => {
    it('ブックマークを解除できる', async () => {
      // Arrange
      await request(app)
        .post('/posts/test-post-id/bookmark')
        .set('Authorization', `Bearer ${validToken}`);

      // Act
      const response = await request(app)
        .delete('/posts/test-post-id/bookmark')
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(204);
    });
  });

  describe('GET /bookmarks', () => {
    it('ブックマーク一覧を取得できる', async () => {
      // Act
      const response = await request(app)
        .get('/bookmarks')
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.items).toBeDefined();
      expect(response.body.nextCursor).toBeDefined();
    });
  });

  describe('DELETE /posts/{postId}', () => {
    it('自分の投稿を削除できる', async () => {
      // Arrange
      const createResponse = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          contentType: 'text',
          textContent: '削除テスト投稿'
        });
      const postId = createResponse.body.id;

      // Act
      const response = await request(app)
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(204);
    });

    it('他人の投稿は削除できない', async () => {
      // Act
      const response = await request(app)
        .delete('/posts/other-user-post-id')
        .set('Authorization', `Bearer ${validToken}`);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.type).toBe('FORBIDDEN');
    });
  });
});
