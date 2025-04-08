import { createMockRequest, createMockResponse } from '../utils/test-utils';
import { getUserInfo } from '../../controllers/users';
import { Request, Response } from 'express';

describe('User Info', () => {
  it('should return user info for valid user ID', async () => {
    const req = createMockRequest({
      params: {
        user_id: '123'
      }
    });
    const res = createMockResponse();

    await getUserInfo(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: expect.any(Number),
        user_name: expect.any(String),
        email: expect.any(String),
        profile_icon_url: expect.any(String),
        profile_audio_url: expect.any(String),
        shop_link_url: expect.any(String),
        is_shop_link: expect.any(Boolean),
        introduction: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String)
      })
    );
  });

  it('should return 404 for non-existent user ID', async () => {
    const req = createMockRequest({
      params: {
        user_id: '999999'
      }
    });
    const res = createMockResponse();

    await getUserInfo(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: expect.any(String)
      })
    );
  });

  it('should return 400 for invalid user ID format', async () => {
    const req = createMockRequest({
      params: {
        user_id: 'invalid-id'
      }
    });
    const res = createMockResponse();

    await getUserInfo(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: expect.any(String)
      })
    );
  });
});
