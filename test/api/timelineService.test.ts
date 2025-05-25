import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DrizzlePost, PaginatedResult, ServiceResult, TimelineType } from '../../src/lib/data';
import {
  SimpleCache,
  type TimelineService,
  createTimelineService,
} from '../../src/lib/timelineService';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  storage: {
    from: vi.fn(),
  },
  auth: {
    getUser: vi.fn(),
  },
  rpc: vi.fn(),
};

// Mock database client
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  query: {
    follows: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    posts: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    profiles: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
  transaction: vi.fn(),
};

describe('TimelineService - タイムライン取得機能', () => {
  let timelineService: TimelineService;
  let mockCache: SimpleCache;
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockCache = new SimpleCache();
    timelineService = createTimelineService(mockSupabaseClient as any, mockDb as any, mockCache);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ファミリータイムライン', () => {
    it('ファミリーフォローの投稿を時系列順に取得できること', async () => {
      // Mock family follows
      const mockFamilyFollows = [
        {
          id: 'follow-1',
          followerId: mockUserId,
          followeeId: 'family-user-1',
          followType: 'family',
          status: 'active',
          followReason: '素晴らしい内容',
          createdAt: new Date(),
        },
        {
          id: 'follow-2',
          followerId: mockUserId,
          followeeId: 'family-user-2',
          followType: 'family',
          status: 'active',
          followReason: '共感できる投稿',
          createdAt: new Date(),
        },
      ];

      // Mock posts from followed users
      const mockPosts = [
        {
          id: 'post-1',
          userId: 'family-user-1',
          contentType: 'text',
          textContent: '今日の気づきをシェアします',
          createdAt: new Date('2024-01-02T10:00:00Z'),
          updatedAt: new Date('2024-01-02T10:00:00Z'),
          deletedAt: null,
          mediaUrl: null,
          previewUrl: null,
          waveformUrl: null,
          durationSeconds: null,
          youtubeVideoId: null,
          eventId: null,
          groupId: null,
          aiMetadata: null,
        },
        {
          id: 'post-2',
          userId: 'family-user-2',
          contentType: 'audio',
          textContent: '瞑想の音声です',
          mediaUrl: 'https://storage.b2.com/audio/meditation.mp3',
          durationSeconds: 600,
          createdAt: new Date('2024-01-02T08:00:00Z'),
          updatedAt: new Date('2024-01-02T08:00:00Z'),
          deletedAt: null,
          previewUrl: null,
          waveformUrl: 'https://storage.b2.com/waveform/meditation.png',
          youtubeVideoId: null,
          eventId: null,
          groupId: null,
          aiMetadata: null,
        },
      ];

      mockDb.query.follows.findMany.mockResolvedValue(mockFamilyFollows);
      mockDb.query.posts.findMany.mockResolvedValue(mockPosts);

      const result = await timelineService.getTimeline(mockUserId, 'family', 20);

      expect(result.success).toBe(true);
      expect(result.data!.items).toHaveLength(2);
      expect(result.data!.items[0].id).toBe('post-1'); // 新しい投稿が先
      expect(result.data!.items[1].id).toBe('post-2');
      expect(result.error).toBeNull();
    });

    it('フォローしているユーザーがいない場合、空の配列が返されること', async () => {
      mockDb.query.follows.findMany.mockResolvedValue([]);

      const result = await timelineService.getTimeline(mockUserId, 'family', 20);

      expect(result.success).toBe(true);
      expect(result.data!.items).toEqual([]);
      expect(result.data!.hasMore).toBe(false);
      expect(result.data!.nextCursor).toBeNull();
      expect(result.error).toBeNull();
    });

    it('削除された投稿は除外されること', async () => {
      const mockFamilyFollows = [
        {
          id: 'follow-1',
          followerId: mockUserId,
          followeeId: 'family-user-1',
          followType: 'family',
          status: 'active',
        },
      ];

      const mockPostsWithDeleted = [
        {
          id: 'post-1',
          userId: 'family-user-1',
          contentType: 'text',
          textContent: '通常の投稿',
          deletedAt: null,
          createdAt: new Date('2024-01-02T10:00:00Z'),
        },
        {
          id: 'post-2',
          userId: 'family-user-1',
          contentType: 'text',
          textContent: '削除された投稿',
          deletedAt: new Date('2024-01-02T11:00:00Z'), // 削除済み
          createdAt: new Date('2024-01-02T09:00:00Z'),
        },
      ];

      mockDb.query.follows.findMany.mockResolvedValue(mockFamilyFollows);
      mockDb.query.posts.findMany.mockResolvedValue(
        mockPostsWithDeleted.filter((p) => p.deletedAt === null)
      );

      const result = await timelineService.getTimeline(mockUserId, 'family', 20);

      expect(result.success).toBe(true);
      expect(result.data!.items).toHaveLength(1);
      expect(result.data!.items[0].id).toBe('post-1');
      expect(result.error).toBeNull();
    });
  });

  describe('ウォッチタイムライン', () => {
    it('ウォッチフォローの投稿を時系列順に取得できること', async () => {
      const mockWatchFollows = [
        {
          id: 'follow-3',
          followerId: mockUserId,
          followeeId: 'watch-user-1',
          followType: 'watch',
          status: 'active',
          followReason: null,
        },
        {
          id: 'follow-4',
          followerId: mockUserId,
          followeeId: 'watch-user-2',
          followType: 'watch',
          status: 'active',
          followReason: null,
        },
      ];

      const mockPosts = [
        {
          id: 'post-3',
          userId: 'watch-user-1',
          contentType: 'image',
          textContent: '美しい朝焼け',
          mediaUrl: 'https://storage.b2.com/images/sunrise.jpg',
          previewUrl: 'https://storage.b2.com/images/sunrise_thumb.jpg',
          createdAt: new Date('2024-01-03T06:00:00Z'),
          deletedAt: null,
        },
        {
          id: 'post-4',
          userId: 'watch-user-2',
          contentType: 'text',
          textContent: '今日の学び',
          createdAt: new Date('2024-01-03T07:00:00Z'),
          deletedAt: null,
        },
      ];

      mockDb.query.follows.findMany.mockResolvedValue(mockWatchFollows);
      mockDb.query.posts.findMany.mockResolvedValue(mockPosts.reverse()); // 新しい順

      const result = await timelineService.getTimeline(mockUserId, 'watch', 20);

      expect(result.success).toBe(true);
      expect(result.data!.items).toHaveLength(2);
      expect(result.data!.items[0].id).toBe('post-4'); // 新しい投稿が先
      expect(result.data!.items[1].id).toBe('post-3');
      expect(result.error).toBeNull();
    });
  });

  describe('ページネーション', () => {
    it('指定されたlimit数だけ投稿を取得できること', async () => {
      const mockFollows = [
        {
          id: 'follow-1',
          followerId: mockUserId,
          followeeId: 'user-1',
          followType: 'family',
          status: 'active',
        },
      ];

      // 25件の投稿を作成
      const mockPosts = Array.from({ length: 25 }, (_, i) => ({
        id: `post-${i}`,
        userId: 'user-1',
        contentType: 'text',
        textContent: `投稿 ${i}`,
        createdAt: new Date(`2024-01-01T${String(i).padStart(2, '0')}:00:00Z`),
        deletedAt: null,
      }));

      mockDb.query.follows.findMany.mockResolvedValue(mockFollows);
      mockDb.query.posts.findMany.mockResolvedValue(mockPosts.slice(0, 21).reverse()); // limit + 1

      const result = await timelineService.getTimeline(mockUserId, 'family', 20);

      expect(result.success).toBe(true);
      expect(result.data!.items).toHaveLength(20);
      expect(result.data!.hasMore).toBe(true);
      expect(result.data!.nextCursor).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('カーソルを使用して次のページを取得できること', async () => {
      const mockFollows = [
        {
          id: 'follow-1',
          followerId: mockUserId,
          followeeId: 'user-1',
          followType: 'family',
          status: 'active',
        },
      ];

      // 次のページの投稿
      const mockNextPagePosts = Array.from({ length: 10 }, (_, i) => ({
        id: `post-page2-${i}`,
        userId: 'user-1',
        contentType: 'text',
        textContent: `ページ2の投稿 ${i}`,
        createdAt: new Date(`2024-01-02T${String(i).padStart(2, '0')}:00:00Z`),
        deletedAt: null,
      }));

      mockDb.query.follows.findMany.mockResolvedValue(mockFollows);
      mockDb.query.posts.findMany.mockResolvedValue(mockNextPagePosts.reverse());

      const cursor = Buffer.from(
        JSON.stringify({
          createdAt: '2024-01-01T19:00:00Z',
        })
      ).toString('base64');

      const result = await timelineService.getTimeline(mockUserId, 'family', 20, cursor);

      expect(result.success).toBe(true);
      expect(result.data!.items).toHaveLength(10);
      expect(result.data!.hasMore).toBe(false);
      expect(result.error).toBeNull();
    });
  });

  describe('プルトゥリフレッシュ', () => {
    it('最新の投稿を取得できること', async () => {
      const mockFollows = [
        {
          id: 'follow-1',
          followerId: mockUserId,
          followeeId: 'user-1',
          followType: 'family',
          status: 'active',
        },
      ];

      const latestPosts = [
        {
          id: 'latest-post-1',
          userId: 'user-1',
          contentType: 'text',
          textContent: '最新の投稿',
          createdAt: new Date('2024-01-05T12:00:00Z'),
          deletedAt: null,
        },
      ];

      mockDb.query.follows.findMany.mockResolvedValue(mockFollows);
      mockDb.query.posts.findMany.mockResolvedValue(latestPosts);

      const result = await timelineService.refreshTimeline(mockUserId, 'family');

      expect(result.success).toBe(true);
      expect(result.data!.items).toHaveLength(1);
      expect(result.data!.items[0].id).toBe('latest-post-1');
      expect(result.error).toBeNull();
    });
  });

  describe('エラーハンドリング', () => {
    it('データベースエラーが適切に処理されること', async () => {
      mockDb.query.follows.findMany.mockRejectedValue(new Error('Database connection error'));

      const result = await timelineService.getTimeline(mockUserId, 'family', 20);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Database connection error');
      expect(result.data).toBeNull();
    });
  });

  describe('キャッシュ機能', () => {
    it('キャッシュからタイムラインを取得できること', async () => {
      const cachedTimeline = {
        items: [
          {
            id: 'cached-post-1',
            userId: 'user-1',
            contentType: 'text',
            textContent: 'キャッシュされた投稿',
            createdAt: new Date('2024-01-01T10:00:00Z'),
          },
        ],
        hasMore: false,
        nextCursor: null,
        cachedAt: new Date(),
      };

      // Spy on cache get method
      const mockCacheGet = vi.spyOn(mockCache, 'get').mockReturnValue(cachedTimeline);

      const result = await timelineService.getCachedTimeline(mockUserId, 'family');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedTimeline);
      expect(mockCacheGet).toHaveBeenCalledWith(`timeline:${mockUserId}:family`);
    });

    it('タイムライン取得後にキャッシュに保存されること', async () => {
      const mockFollows = [
        {
          id: 'follow-1',
          followerId: mockUserId,
          followeeId: 'user-1',
          followType: 'family',
          status: 'active',
        },
      ];

      const mockPosts = [
        {
          id: 'post-1',
          userId: 'user-1',
          contentType: 'text',
          textContent: '新しい投稿',
          createdAt: new Date(),
          deletedAt: null,
        },
      ];

      // Spy on cache set method
      const mockCacheSet = vi.spyOn(mockCache, 'set');

      mockDb.query.follows.findMany.mockResolvedValue(mockFollows);
      mockDb.query.posts.findMany.mockResolvedValue(mockPosts);

      await timelineService.getTimeline(mockUserId, 'family', 20);

      expect(mockCacheSet).toHaveBeenCalledWith(
        `timeline:${mockUserId}:family`,
        expect.objectContaining({
          items: expect.any(Array),
          hasMore: expect.any(Boolean),
          nextCursor: expect.any(Object),
          cachedAt: expect.any(Date),
        }),
        300 // 5分のTTL
      );
    });
  });
});
