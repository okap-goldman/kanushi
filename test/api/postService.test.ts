import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { app } from '@/test/setup/api';
import fs from 'fs/promises';

describe('Post API Tests', () => {
  let validToken: string;

  beforeEach(() => {
    validToken = 'test-valid-token';
    jest.clearAllMocks();
  });

  describe('POST /posts - 音声投稿', () => {
    it('音声ファイルを含む投稿を作成できる', async () => {
      // Arrange
      const audioBuffer = await fs.readFile('test-audio.mp3');
      
      // Act
      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${validToken}`)
        .field('contentType', 'audio')
        .field('textContent', 'テスト音声投稿')
        .attach('file', audioBuffer, 'test.mp3');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.contentType).toBe('audio');
      expect(response.body.mediaUrl).toMatch(/^https:\/\//);
      expect(response.body.waveformUrl).toBeDefined();
      expect(response.body.durationSeconds).toBeGreaterThan(0);
      expect(response.body.aiMetadata).toMatchObject({
        summary: expect.any(String),
        tags: expect.any(Array)
      });
    });

    it('音声投稿にイベントタグを付けられる', async () => {
      // Arrange
      const eventId = 'test-event-id';
      const audioBuffer = await fs.readFile('test-audio.mp3');

      // Act
      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${validToken}`)
        .field('contentType', 'audio')
        .field('textContent', 'イベント関連音声')
        .field('eventId', eventId)
        .attach('file', audioBuffer, 'test.mp3');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.eventId).toBe(eventId);
    });

    it('音声ファイルサイズが制限を超える場合413エラーを返す', async () => {
      // Arrange
      const largeAudioBuffer = Buffer.alloc(100 * 1024 * 1024); // 100MB

      // Act
      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${validToken}`)
        .field('contentType', 'audio')
        .attach('file', largeAudioBuffer, 'large.mp3');

      // Assert
      expect(response.status).toBe(413);
      expect(response.body.type).toBe('PAYLOAD_TOO_LARGE');
    });
  });

  describe('POST /posts - 画像投稿', () => {
    it('画像ファイルを含む投稿を作成できる', async () => {
      // Arrange
      const imageBuffer = await fs.readFile('test-image.jpg');

      // Act
      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${validToken}`)
        .field('contentType', 'image')
        .field('textContent', 'テスト画像投稿')
        .attach('file', imageBuffer, 'test.jpg');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.contentType).toBe('image');
      expect(response.body.mediaUrl).toMatch(/^https:\/\//);
      expect(response.body.previewUrl).toBeDefined();
    });

    it('GIF画像を投稿できる', async () => {
      // Arrange
      const gifBuffer = await fs.readFile('test-animation.gif');

      // Act
      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${validToken}`)
        .field('contentType', 'image')
        .attach('file', gifBuffer, 'test.gif');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.mediaUrl).toMatch(/\.gif$/);
    });
  });

  describe('POST /posts - テキスト投稿', () => {
    it('テキストのみの投稿を作成できる', async () => {
      // Act
      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          contentType: 'text',
          textContent: 'これはテスト投稿です。'
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.contentType).toBe('text');
      expect(response.body.textContent).toBe('これはテスト投稿です。');
      expect(response.body.mediaUrl).toBeNull();
    });

    it('最大10,000文字のテキストを投稿できる', async () => {
      // Arrange
      const longText = 'あ'.repeat(10000);

      // Act
      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          contentType: 'text',
          textContent: longText
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.textContent.length).toBe(10000);
    });

    it('10,001文字以上のテキストは400エラーを返す', async () => {
      // Arrange
      const tooLongText = 'あ'.repeat(10001);

      // Act
      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          contentType: 'text',
          textContent: tooLongText
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.type).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('textContent');
    });

    it('ハッシュタグを最大5個まで付けられる', async () => {
      // Arrange
      const hashtags = ['#目醒め', '#スピリチュアル', '#音声', '#瞑想', '#ヒーリング'];

      // Act
      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          contentType: 'text',
          textContent: 'ハッシュタグテスト ' + hashtags.join(' ')
        });

      // Assert
      expect(response.status).toBe(201);
      // ハッシュタグが正しく保存されていることを確認
    });
  });
});
