import { createMockRequest, createMockResponse } from '../utils/test-utils';
import { unfollow } from '../../controllers/follows';
import { Request, Response } from 'express';

/**
 * アンフォロー機能のテストケース
 * - 正常系：有効なフォローIDでアンフォロー
 * - 異常系：存在しないフォローID
 * - 異常系：不正なフォローIDフォーマット
 */
describe('Unfollow', () => {
  // 有効なフォローIDでアンフォローできることを確認
  it('should successfully unfollow with valid follow_id', async () => {
    const req = createMockRequest({
      params: {
        follow_id: '123'
      }
    });
    const res = createMockResponse();

    await unfollow(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  // 存在しないフォローIDの場合は404エラーを返すことを確認
  it('should return 404 for non-existent follow_id', async () => {
    const req = createMockRequest({
      params: {
        follow_id: '999999'
      }
    });
    const res = createMockResponse();

    await unfollow(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: expect.any(String)
      })
    );
  });

  // フォローIDのフォーマットが不正な場合は400エラーを返すことを確認
  it('should return 400 for invalid follow_id format', async () => {
    const req = createMockRequest({
      params: {
        follow_id: 'invalid-id'
      }
    });
    const res = createMockResponse();

    await unfollow(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: expect.any(String)
      })
    );
  });
});
