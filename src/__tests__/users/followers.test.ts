import { createMockRequest, createMockResponse } from '../utils/test-utils';
import { getUserFollowers } from '../../controllers/users';
import { Request, Response } from 'express';

describe('User Followers', () => {
  it('should return followers list for valid user ID', async () => {
    const req = createMockRequest({
      params: {
        user_id: '123'
      }
    });
    const res = createMockResponse();

    await getUserFollowers(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        followers: expect.arrayContaining([
          expect.objectContaining({
            follow_id: expect.any(Number),
            follower_id: expect.any(Number),
            followee_id: expect.any(Number),
            follow_type: expect.stringMatching(/^(family|watch)$/),
            reason: expect.any(String),
            created_at: expect.any(String)
          })
        ])
      })
    );
  });

  it('should return empty followers list for user with no followers', async () => {
    const req = createMockRequest({
      params: {
        user_id: '456'
      }
    });
    const res = createMockResponse();

    await getUserFollowers(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        followers: []
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

    await getUserFollowers(req as Request, res as Response);

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

    await getUserFollowers(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: expect.any(String)
      })
    );
  });

  it('should handle pagination parameters', async () => {
    const req = createMockRequest({
      params: {
        user_id: '123'
      },
      query: {
        offset: '20',
        limit: '10'
      }
    });
    const res = createMockResponse();

    await getUserFollowers(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        followers: expect.any(Array)
      })
    );
  });
});
