import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { storyService } from '../../src/lib/storyService';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        createSignedUrl: vi.fn(),
      })),
    },
  })),
}));

const mockSupabase = createClient('mock-url', 'mock-key');

describe('Story Service - API Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1.1 Story Creation API', () => {
    it('should create an image story with optional caption and location', async () => {
      const mockStoryId = 'story-123';
      const mockUserId = 'user-123';
      const mockImage = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
      const mockCaption = 'Beautiful sunset';
      const mockLocation = 'Tokyo, Japan';
      
      // Mock auth
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      // Mock storage upload
      vi.mocked(mockSupabase.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'stories/image.jpg' },
          error: null,
        }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://example.com/image.jpg' },
          error: null,
        }),
      } as any);

      // Mock database insert
      const mockInsert = vi.fn().mockResolvedValue({
        data: {
          id: mockStoryId,
          userId: mockUserId,
          imageUrl: 'https://example.com/image.jpg',
          caption: mockCaption,
          location: mockLocation,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockInsert,
          }),
        }),
      } as any);

      const result = await storyService.createImageStory(mockImage, mockCaption, mockLocation);

      expect(result).toEqual({
        id: mockStoryId,
        createdAt: expect.any(String),
        expiresAt: expect.any(String),
      });
    });

    it('should create a text-only story with background and font style', async () => {
      const mockStoryId = 'story-456';
      const mockUserId = 'user-123';
      const mockTextContent = 'Hello World!';
      const mockBackgroundColor = '#FF5733';
      const mockFontStyle = 'bold';

      // Mock auth
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      // Mock database insert
      const mockInsert = vi.fn().mockResolvedValue({
        data: {
          id: mockStoryId,
          userId: mockUserId,
          textContent: mockTextContent,
          backgroundColor: mockBackgroundColor,
          fontStyle: mockFontStyle,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockInsert,
          }),
        }),
      } as any);

      const result = await storyService.createTextStory(
        mockTextContent,
        mockBackgroundColor,
        mockFontStyle
      );

      expect(result).toEqual({
        id: mockStoryId,
        createdAt: expect.any(String),
      });
    });

    it('should handle invalid content format error', async () => {
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });

      await expect(storyService.createImageStory(invalidFile)).rejects.toThrow(
        'Unsupported file type'
      );
    });

    it('should require authentication for story creation', async () => {
      // Mock auth failure
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const mockImage = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });

      await expect(storyService.createImageStory(mockImage)).rejects.toThrow(
        'Authentication required'
      );
    });
  });

  describe('1.2 Story Retrieval API', () => {
    it('should fetch active stories from followed users', async () => {
      const mockUserId = 'user-123';
      const mockStories = [
        {
          id: 'story-1',
          userId: 'user-456',
          imageUrl: 'https://example.com/image1.jpg',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          user: {
            id: 'user-456',
            username: 'john_doe',
            avatarUrl: 'https://example.com/avatar1.jpg',
          },
        },
        {
          id: 'story-2',
          userId: 'user-789',
          textContent: 'Hello World',
          backgroundColor: '#FF5733',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
          user: {
            id: 'user-789',
            username: 'jane_smith',
            avatarUrl: 'https://example.com/avatar2.jpg',
          },
        },
      ];

      // Mock auth
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      // Mock follow query
      const mockFollowQuery = vi.fn().mockResolvedValue({
        data: [{ followeeId: 'user-456' }, { followeeId: 'user-789' }],
        error: null,
      });

      // Mock stories query
      const mockStoriesQuery = vi.fn().mockResolvedValue({
        data: mockStories,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === 'follow') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue(mockFollowQuery),
              }),
            }),
          } as any;
        }
        if (table === 'story') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue(mockStoriesQuery),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await storyService.getFollowedUsersStories(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('user');
    });

    it('should fetch stories from a specific user', async () => {
      const targetUserId = 'user-456';
      const mockStories = [
        {
          id: 'story-1',
          userId: targetUserId,
          imageUrl: 'https://example.com/image1.jpg',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const mockQuery = vi.fn().mockResolvedValue({
        data: mockStories,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue(mockQuery),
            }),
          }),
        }),
      } as any);

      const result = await storyService.getUserStories(targetUserId);

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(targetUserId);
    });

    it('should fetch story details with view count and reactions', async () => {
      const storyId = 'story-123';
      const mockStoryDetail = {
        id: storyId,
        userId: 'user-456',
        imageUrl: 'https://example.com/image.jpg',
        viewCount: 42,
        reactions: [
          { userId: 'user-1', emoji: '❤️' },
          { userId: 'user-2', emoji: '😂' },
        ],
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      };

      const mockQuery = vi.fn().mockResolvedValue({
        data: mockStoryDetail,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockQuery,
          }),
        }),
      } as any);

      const result = await storyService.getStoryDetails(storyId);

      expect(result).toEqual(mockStoryDetail);
      expect(result.viewCount).toBe(42);
      expect(result.reactions).toHaveLength(2);
    });

    it('should handle expired stories appropriately', async () => {
      const storyId = 'expired-story';

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '404', message: 'Story not found or expired' },
            }),
          }),
        }),
      } as any);

      await expect(storyService.getStoryDetails(storyId)).rejects.toThrow(
        'Story not found or expired'
      );
    });
  });

  describe('1.3 Story Interaction API', () => {
    it('should send a reaction to a story', async () => {
      const storyId = 'story-123';
      const userId = 'user-123';
      const emoji = '❤️';

      // Mock auth
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      const mockInsert = vi.fn().mockResolvedValue({
        data: { id: 'reaction-123', storyId, userId, emoji },
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockInsert,
          }),
        }),
      } as any);

      const result = await storyService.sendReaction(storyId, emoji);

      expect(result).toBe(true);
    });

    it('should send a reply to a story', async () => {
      const storyId = 'story-123';
      const userId = 'user-123';
      const replyText = 'Great story!';

      // Mock auth
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      const mockInsert = vi.fn().mockResolvedValue({
        data: {
          id: 'reply-123',
          storyId,
          userId,
          replyText,
          messageId: 'message-123',
        },
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockInsert,
          }),
        }),
      } as any);

      const result = await storyService.sendReply(storyId, replyText);

      expect(result).toEqual({
        replyId: 'reply-123',
        messageId: 'message-123',
      });
    });

    it('should update story view status', async () => {
      const storyId = 'story-123';
      const userId = 'user-123';

      // Mock auth
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      const mockUpsert = vi.fn().mockResolvedValue({
        data: { storyId, userId, viewedAt: new Date().toISOString() },
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as any);

      const result = await storyService.markAsViewed(storyId);

      expect(result).toBe(true);
      expect(mockUpsert).toHaveBeenCalledWith(
        { storyId, userId },
        { onConflict: 'story_id,user_id' }
      );
    });

    it('should report inappropriate content', async () => {
      const storyId = 'story-123';
      const userId = 'user-123';
      const reason = 'Inappropriate content';

      // Mock auth
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      const mockInsert = vi.fn().mockResolvedValue({
        data: { id: 'report-123', storyId, userId, reason },
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockInsert,
          }),
        }),
      } as any);

      const result = await storyService.reportStory(storyId, reason);

      expect(result).toEqual({
        reportId: 'report-123',
        confirmed: true,
      });
    });
  });

  describe('Additional Story Features', () => {
    it('should delete an expired story', async () => {
      const storyId = 'story-123';
      const userId = 'user-123';

      // Mock auth
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      const mockDelete = vi.fn().mockResolvedValue({
        data: { id: storyId },
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue(mockDelete),
          }),
        }),
      } as any);

      const result = await storyService.deleteStory(storyId);

      expect(result).toBe(true);
    });

    it('should get story viewers list', async () => {
      const storyId = 'story-123';
      const mockViewers = [
        {
          userId: 'user-1',
          viewedAt: new Date().toISOString(),
          user: { username: 'viewer1', avatarUrl: 'https://example.com/avatar1.jpg' },
        },
        {
          userId: 'user-2',
          viewedAt: new Date().toISOString(),
          user: { username: 'viewer2', avatarUrl: 'https://example.com/avatar2.jpg' },
        },
      ];

      const mockQuery = vi.fn().mockResolvedValue({
        data: mockViewers,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue(mockQuery),
          }),
        }),
      } as any);

      const result = await storyService.getStoryViewers(storyId);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('user');
    });

    it('should repost a story', async () => {
      const originalStoryId = 'story-123';
      const userId = 'user-123';

      // Mock auth
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      const mockInsert = vi.fn().mockResolvedValue({
        data: {
          id: 'repost-123',
          userId,
          originalStoryId,
          isRepost: true,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockInsert,
          }),
        }),
      } as any);

      const result = await storyService.repostStory(originalStoryId);

      expect(result).toEqual({
        id: 'repost-123',
        originalStoryId,
        isRepost: true,
      });
    });
  });
});