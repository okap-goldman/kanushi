import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MediaType, PostCreateInput, PostUpdateInput, TimelineType } from '../../src/lib/data';
import { PostService, createPostService } from '../../src/lib/postService';

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
    posts: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    hashtags: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    postHashtags: {
      findMany: vi.fn(),
    },
    likes: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    comments: {
      findMany: vi.fn(),
    },
    highlights: {
      findFirst: vi.fn(),
    },
    bookmarks: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
  transaction: vi.fn(),
};

describe('PostService - 投稿作成機能', () => {
  let postService: PostService;
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    postService = createPostService(mockSupabaseClient as any, mockDb as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('音声投稿作成', () => {
    it('音声ファイルと説明文で投稿作成が正常に完了すること', async () => {
      const audioPostInput: PostCreateInput = {
        userId: mockUserId,
        contentType: 'audio' as MediaType,
        textContent: '目醒めの瞬間について語ります',
        mediaUrl: 'https://storage.b2.com/audio/123.mp3',
        durationSeconds: 300,
        hashtags: ['#目醒め', '#瞑想'],
      };

      const mockPostId = 'post-123';
      const mockCreatedPost = {
        id: mockPostId,
        userId: mockUserId,
        contentType: 'audio',
        textContent: audioPostInput.textContent,
        mediaUrl: audioPostInput.mediaUrl,
        durationSeconds: 300,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        aiMetadata: null,
        previewUrl: null,
        waveformUrl: null,
        youtubeVideoId: null,
        eventId: null,
        groupId: null,
      };

      // Mock hashtag creation/lookup
      const mockHashtags = [
        { id: 'hashtag-1', name: '目醒め', useCount: 10 },
        { id: 'hashtag-2', name: '瞑想', useCount: 5 },
      ];

      mockDb.transaction.mockImplementation(async (callback) => {
        return await callback({
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([mockCreatedPost]),
            }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue({}),
            }),
          }),
          query: {
            hashtags: {
              findFirst: vi
                .fn()
                .mockResolvedValueOnce(mockHashtags[0])
                .mockResolvedValueOnce(mockHashtags[1]),
            },
          },
        });
      });

      const result = await postService.createPost(audioPostInput);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          id: mockPostId,
          userId: mockUserId,
          contentType: 'audio',
          textContent: audioPostInput.textContent,
          mediaUrl: audioPostInput.mediaUrl,
          durationSeconds: 300,
        })
      );
      expect(result.error).toBeNull();
    });

    it('8時間を超える音声投稿でエラーが発生すること', async () => {
      const largeAudioInput: PostCreateInput = {
        userId: mockUserId,
        contentType: 'audio' as MediaType,
        textContent: '長時間の音声投稿',
        mediaUrl: 'https://storage.b2.com/audio/large.mp3',
        durationSeconds: 28801, // 8時間1秒 = 制限超過
        hashtags: [],
      };

      const result = await postService.createPost(largeAudioInput);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Audio duration exceeds maximum limit');
      expect(result.data).toBeNull();
    });

    it('イベントタグ付き音声投稿が正常に作成されること', async () => {
      const eventAudioInput: PostCreateInput = {
        userId: mockUserId,
        contentType: 'audio' as MediaType,
        textContent: 'ワークショップでの学び',
        mediaUrl: 'https://storage.b2.com/audio/workshop.mp3',
        durationSeconds: 1200,
        eventId: 'event-456',
        hashtags: ['#ワークショップ'],
      };

      const mockCreatedPost = {
        id: 'post-456',
        userId: mockUserId,
        contentType: 'audio',
        textContent: eventAudioInput.textContent,
        mediaUrl: eventAudioInput.mediaUrl,
        durationSeconds: 1200,
        eventId: 'event-456',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        aiMetadata: null,
        previewUrl: null,
        waveformUrl: null,
        youtubeVideoId: null,
        groupId: null,
      };

      mockDb.transaction.mockImplementation(async (callback) => {
        return await callback({
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([mockCreatedPost]),
            }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue({}),
            }),
          }),
          query: {
            hashtags: {
              findFirst: vi
                .fn()
                .mockResolvedValue({ id: 'hashtag-3', name: 'ワークショップ', useCount: 1 }),
            },
          },
        });
      });

      const result = await postService.createPost(eventAudioInput);

      expect(result.success).toBe(true);
      expect(result.data!.eventId).toBe('event-456');
      expect(result.error).toBeNull();
    });
  });

  describe('画像投稿作成', () => {
    it('JPEG/PNG画像の投稿が正常に作成されること', async () => {
      const imagePostInput: PostCreateInput = {
        userId: mockUserId,
        contentType: 'image' as MediaType,
        textContent: '美しい朝焼けの写真',
        mediaUrl: 'https://storage.b2.com/images/sunrise.jpg',
        previewUrl: 'https://storage.b2.com/images/sunrise_thumb.jpg',
        hashtags: ['#朝焼け', '#自然'],
      };

      const mockCreatedPost = {
        id: 'post-789',
        userId: mockUserId,
        contentType: 'image',
        textContent: imagePostInput.textContent,
        mediaUrl: imagePostInput.mediaUrl,
        previewUrl: imagePostInput.previewUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        aiMetadata: null,
        durationSeconds: null,
        waveformUrl: null,
        youtubeVideoId: null,
        eventId: null,
        groupId: null,
      };

      mockDb.transaction.mockImplementation(async (callback) => {
        return await callback({
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([mockCreatedPost]),
            }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue({}),
            }),
          }),
          query: {
            hashtags: {
              findFirst: vi
                .fn()
                .mockResolvedValueOnce({ id: 'hashtag-4', name: '朝焼け', useCount: 3 })
                .mockResolvedValueOnce({ id: 'hashtag-5', name: '自然', useCount: 8 }),
            },
          },
        });
      });

      const result = await postService.createPost(imagePostInput);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          contentType: 'image',
          mediaUrl: imagePostInput.mediaUrl,
          previewUrl: imagePostInput.previewUrl,
        })
      );
      expect(result.error).toBeNull();
    });
  });

  describe('テキスト投稿作成', () => {
    it('テキストのみの投稿が正常に作成されること', async () => {
      const textPostInput: PostCreateInput = {
        userId: mockUserId,
        contentType: 'text' as MediaType,
        textContent:
          '今日の気づきをシェアします。自分の内なる声に耳を傾けることの大切さを改めて感じました。',
        hashtags: ['#気づき', '#内観'],
      };

      const mockCreatedPost = {
        id: 'post-text-1',
        userId: mockUserId,
        contentType: 'text',
        textContent: textPostInput.textContent,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        mediaUrl: null,
        previewUrl: null,
        durationSeconds: null,
        waveformUrl: null,
        youtubeVideoId: null,
        eventId: null,
        groupId: null,
        aiMetadata: null,
      };

      mockDb.transaction.mockImplementation(async (callback) => {
        return await callback({
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([mockCreatedPost]),
            }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue({}),
            }),
          }),
          query: {
            hashtags: {
              findFirst: vi
                .fn()
                .mockResolvedValueOnce({ id: 'hashtag-6', name: '気づき', useCount: 15 })
                .mockResolvedValueOnce({ id: 'hashtag-7', name: '内観', useCount: 12 }),
            },
          },
        });
      });

      const result = await postService.createPost(textPostInput);

      expect(result.success).toBe(true);
      expect(result.data!.contentType).toBe('text');
      expect(result.data!.textContent).toBe(textPostInput.textContent);
      expect(result.error).toBeNull();
    });

    it('10,000文字のテキスト投稿が正常に作成されること', async () => {
      const longText = 'a'.repeat(10000);
      const longTextInput: PostCreateInput = {
        userId: mockUserId,
        contentType: 'text' as MediaType,
        textContent: longText,
        hashtags: [],
      };

      const mockCreatedPost = {
        id: 'post-long-text',
        userId: mockUserId,
        contentType: 'text',
        textContent: longText,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        mediaUrl: null,
        previewUrl: null,
        durationSeconds: null,
        waveformUrl: null,
        youtubeVideoId: null,
        eventId: null,
        groupId: null,
        aiMetadata: null,
      };

      mockDb.transaction.mockImplementation(async (callback) => {
        return await callback({
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([mockCreatedPost]),
            }),
          }),
        });
      });

      const result = await postService.createPost(longTextInput);

      expect(result.success).toBe(true);
      expect(result.data!.textContent).toBe(longText);
      expect(result.data!.textContent!.length).toBe(10000);
      expect(result.error).toBeNull();
    });

    it('10,001文字以上のテキストでエラーが発生すること', async () => {
      const tooLongText = 'a'.repeat(10001);
      const invalidTextInput: PostCreateInput = {
        userId: mockUserId,
        contentType: 'text' as MediaType,
        textContent: tooLongText,
        hashtags: [],
      };

      const result = await postService.createPost(invalidTextInput);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Text content exceeds maximum limit');
      expect(result.data).toBeNull();
    });

    it('最大5個のハッシュタグ付き投稿が正常に作成されること', async () => {
      const hashtagInput: PostCreateInput = {
        userId: mockUserId,
        contentType: 'text' as MediaType,
        textContent: 'ハッシュタグのテスト投稿',
        hashtags: ['#テスト', '#投稿', '#ハッシュタグ', '#機能', '#確認'],
      };

      const mockHashtags = [
        { id: 'h1', name: 'テスト', useCount: 1 },
        { id: 'h2', name: '投稿', useCount: 1 },
        { id: 'h3', name: 'ハッシュタグ', useCount: 1 },
        { id: 'h4', name: '機能', useCount: 1 },
        { id: 'h5', name: '確認', useCount: 1 },
      ];

      const mockCreatedPost = {
        id: 'post-hashtag-test',
        userId: mockUserId,
        contentType: 'text',
        textContent: hashtagInput.textContent,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        mediaUrl: null,
        previewUrl: null,
        durationSeconds: null,
        waveformUrl: null,
        youtubeVideoId: null,
        eventId: null,
        groupId: null,
        aiMetadata: null,
      };

      mockDb.transaction.mockImplementation(async (callback) => {
        return await callback({
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([mockCreatedPost]),
            }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue({}),
            }),
          }),
          query: {
            hashtags: {
              findFirst: vi
                .fn()
                .mockResolvedValueOnce(mockHashtags[0])
                .mockResolvedValueOnce(mockHashtags[1])
                .mockResolvedValueOnce(mockHashtags[2])
                .mockResolvedValueOnce(mockHashtags[3])
                .mockResolvedValueOnce(mockHashtags[4]),
            },
          },
        });
      });

      const result = await postService.createPost(hashtagInput);

      expect(result.success).toBe(true);
      expect(result.data!.textContent).toBe(hashtagInput.textContent);
      expect(result.error).toBeNull();
    });

    it('6個以上のハッシュタグでエラーが発生すること', async () => {
      const tooManyHashtagsInput: PostCreateInput = {
        userId: mockUserId,
        contentType: 'text' as MediaType,
        textContent: '過多なハッシュタグのテスト',
        hashtags: ['#1', '#2', '#3', '#4', '#5', '#6'],
      };

      const result = await postService.createPost(tooManyHashtagsInput);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Maximum 5 hashtags allowed');
      expect(result.data).toBeNull();
    });
  });

  describe('投稿削除機能', () => {
    it('自分の投稿を正常に削除できること', async () => {
      const postId = 'post-to-delete';
      const mockPost = {
        id: postId,
        userId: mockUserId,
        contentType: 'text',
        textContent: '削除予定の投稿',
        deletedAt: null,
      };

      mockDb.query.posts.findFirst.mockResolvedValue(mockPost);
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        }),
      });

      const result = await postService.deletePost(postId, mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it('他人の投稿削除を試みた際にエラーが発生すること', async () => {
      const postId = 'other-user-post';
      const otherUserId = 'other-user-456';
      const mockPost = {
        id: postId,
        userId: otherUserId,
        contentType: 'text',
        textContent: '他人の投稿',
        deletedAt: null,
      };

      mockDb.query.posts.findFirst.mockResolvedValue(mockPost);

      const result = await postService.deletePost(postId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('You do not have permission to delete this post');
      expect(result.data).toBeNull();
    });

    it('存在しない投稿の削除を試みた際にエラーが発生すること', async () => {
      const nonExistentPostId = 'non-existent-post';

      mockDb.query.posts.findFirst.mockResolvedValue(null);

      const result = await postService.deletePost(nonExistentPostId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Post not found');
      expect(result.data).toBeNull();
    });
  });
});

describe('PostService - 投稿アクション機能', () => {
  let postService: PostService;
  const mockUserId = 'user-123';
  const mockPostId = 'post-123';

  beforeEach(() => {
    vi.clearAllMocks();
    postService = createPostService(mockSupabaseClient as any, mockDb as any);
  });

  describe('いいね機能', () => {
    it('投稿にいいねを追加できること', async () => {
      mockDb.query.likes.findFirst.mockResolvedValue(null); // いいね未済
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      const result = await postService.addLike(mockPostId, mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it('同じ投稿に2回いいねした場合にエラーが発生すること', async () => {
      const existingLike = {
        id: 'like-123',
        postId: mockPostId,
        userId: mockUserId,
        createdAt: new Date(),
      };

      mockDb.query.likes.findFirst.mockResolvedValue(existingLike);

      const result = await postService.addLike(mockPostId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Already liked this post');
      expect(result.data).toBeNull();
    });

    it('いいねを取り消しできること', async () => {
      const existingLike = {
        id: 'like-123',
        postId: mockPostId,
        userId: mockUserId,
        createdAt: new Date(),
      };

      mockDb.query.likes.findFirst.mockResolvedValue(existingLike);
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue({ rowCount: 1 }),
      });

      const result = await postService.removeLike(mockPostId, mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it('いいねしていない投稿のいいね取り消しでエラーが発生すること', async () => {
      mockDb.query.likes.findFirst.mockResolvedValue(null);

      const result = await postService.removeLike(mockPostId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Like not found');
      expect(result.data).toBeNull();
    });
  });

  describe('ハイライト機能', () => {
    it('理由付きでハイライトが正常に追加されること', async () => {
      const reason = 'とても感動しました';

      mockDb.query.highlights.findFirst.mockResolvedValue(null);
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      const result = await postService.addHighlight(mockPostId, mockUserId, reason);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it('理由なしでハイライトを追加した場合にエラーが発生すること', async () => {
      const result = await postService.addHighlight(mockPostId, mockUserId, '');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Reason is required for highlighting');
      expect(result.data).toBeNull();
    });

    it('同じ投稿を2回ハイライトした場合にエラーが発生すること', async () => {
      const existingHighlight = {
        id: 'highlight-123',
        postId: mockPostId,
        userId: mockUserId,
        reason: '既存のハイライト',
        createdAt: new Date(),
      };

      mockDb.query.highlights.findFirst.mockResolvedValue(existingHighlight);

      const result = await postService.addHighlight(mockPostId, mockUserId, '新しい理由');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Already highlighted this post');
      expect(result.data).toBeNull();
    });
  });

  describe('コメント機能', () => {
    it('投稿にコメントを追加できること', async () => {
      const commentText = 'とても良い投稿ですね！';
      const mockComment = {
        id: 'comment-123',
        postId: mockPostId,
        userId: mockUserId,
        body: commentText,
        createdAt: new Date(),
      };

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockComment]),
        }),
      });

      const result = await postService.addComment(mockPostId, mockUserId, commentText);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          body: commentText,
          postId: mockPostId,
          userId: mockUserId,
        })
      );
      expect(result.error).toBeNull();
    });

    it('空のコメントを投稿した場合にエラーが発生すること', async () => {
      const result = await postService.addComment(mockPostId, mockUserId, '');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Comment body cannot be empty');
      expect(result.data).toBeNull();
    });

    it('投稿のコメント一覧を取得できること', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          postId: mockPostId,
          userId: 'user-1',
          body: 'First comment',
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'comment-2',
          postId: mockPostId,
          userId: 'user-2',
          body: 'Second comment',
          createdAt: new Date('2024-01-02'),
        },
      ];

      mockDb.query.comments.findMany.mockResolvedValue(mockComments);

      const result = await postService.getComments(mockPostId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].body).toBe('First comment');
      expect(result.data![1].body).toBe('Second comment');
      expect(result.error).toBeNull();
    });
  });

  describe('ブックマーク機能', () => {
    it('投稿をブックマークに追加できること', async () => {
      mockDb.query.bookmarks.findFirst.mockResolvedValue(null);
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      const result = await postService.addBookmark(mockPostId, mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it('ブックマークを削除できること', async () => {
      const existingBookmark = {
        id: 'bookmark-123',
        postId: mockPostId,
        userId: mockUserId,
        createdAt: new Date(),
      };

      mockDb.query.bookmarks.findFirst.mockResolvedValue(existingBookmark);
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue({ rowCount: 1 }),
      });

      const result = await postService.removeBookmark(mockPostId, mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it('自分のブックマーク一覧を取得できること', async () => {
      const mockBookmarks = [
        {
          id: 'bookmark-1',
          postId: 'post-1',
          userId: mockUserId,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'bookmark-2',
          postId: 'post-2',
          userId: mockUserId,
          createdAt: new Date('2024-01-02'),
        },
      ];

      mockDb.query.bookmarks.findMany.mockResolvedValue(mockBookmarks);

      const result = await postService.getBookmarks(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.error).toBeNull();
    });
  });
});
