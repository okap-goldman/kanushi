import { createMockRequest, createMockResponse } from '../utils/test-utils';
import { updateUserInfo } from '../../controllers/users';
import { Request, Response } from 'express';

describe('User Update', () => {
  it('should update user info successfully', async () => {
    const req = createMockRequest({
      params: {
        user_id: '123'
      },
      body: {
        user_name: 'Updated Name',
        profile_icon_url: 'https://example.com/icon.jpg',
        profile_audio_url: 'https://example.com/audio.mp3',
        shop_link_url: 'https://example.com/shop',
        is_shop_link: true,
        introduction: 'Updated introduction'
      }
    });
    const res = createMockResponse();

    await updateUserInfo(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: expect.any(Number),
        user_name: 'Updated Name',
        profile_icon_url: 'https://example.com/icon.jpg',
        profile_audio_url: 'https://example.com/audio.mp3',
        shop_link_url: 'https://example.com/shop',
        is_shop_link: true,
        introduction: 'Updated introduction',
        created_at: expect.any(String),
        updated_at: expect.any(String)
      })
    );
  });

  it('should return 400 for invalid user ID', async () => {
    const req = createMockRequest({
      params: {
        user_id: 'invalid-id'
      },
      body: {
        user_name: 'Updated Name'
      }
    });
    const res = createMockResponse();

    await updateUserInfo(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: expect.any(String)
      })
    );
  });

  it('should return 400 for missing required fields', async () => {
    const req = createMockRequest({
      params: {
        user_id: '123'
      },
      body: {}
    });
    const res = createMockResponse();

    await updateUserInfo(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: expect.any(String)
      })
    );
  });

  it('should return 400 for invalid field formats', async () => {
    const req = createMockRequest({
      params: {
        user_id: '123'
      },
      body: {
        user_name: '',  // Empty string
        profile_icon_url: 'not-a-url',
        is_shop_link: 'not-a-boolean'  // Invalid boolean
      }
    });
    const res = createMockResponse();

    await updateUserInfo(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: expect.any(String)
      })
    );
  });
});
