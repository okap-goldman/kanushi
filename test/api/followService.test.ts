import { describe, it, expect, beforeEach, vi } from 'vitest';
import { followService } from '@/lib/followService';
import { db } from '@/lib/db/client';
import { follows, profiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Mock database
vi.mock('@/lib/db/client', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

describe('Follow Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createFollow', () => {
    describe('ファミリーフォロー', () => {
      it('理由ありの場合、正常にフォローが作成される', async () => {
        const mockFollow = {
          id: 'follow-id',
          followerId: 'user1',
          followeeId: 'user2',
          followType: 'family',
          status: 'active',
          followReason: 'とても価値のあるコンテンツを提供してくれるから',
          createdAt: new Date()
        };

        vi.mocked(db.insert).mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockFollow])
          })
        } as any);

        const result = await followService.createFollow({
          followerId: 'user1',
          followeeId: 'user2',
          followType: 'family',
          followReason: 'とても価値のあるコンテンツを提供してくれるから'
        });

        expect(result).toEqual(mockFollow);
        expect(db.insert).toHaveBeenCalledWith(follows);
      });

      it('理由なしの場合、バリデーションエラーが発生する', async () => {
        await expect(
          followService.createFollow({
            followerId: 'user1',
            followeeId: 'user2',
            followType: 'family'
          })
        ).rejects.toThrow('ファミリーフォローには理由の入力が必要です');
      });
    });

    describe('ウォッチフォロー', () => {
      it('理由なしでも正常にフォローが作成される', async () => {
        const mockFollow = {
          id: 'follow-id',
          followerId: 'user1',
          followeeId: 'user2',
          followType: 'watch',
          status: 'active',
          followReason: null,
          createdAt: new Date()
        };

        vi.mocked(db.insert).mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockFollow])
          })
        } as any);

        const result = await followService.createFollow({
          followerId: 'user1',
          followeeId: 'user2',
          followType: 'watch'
        });

        expect(result).toEqual(mockFollow);
      });

      it('理由ありでも正常にフォローが作成される', async () => {
        const mockFollow = {
          id: 'follow-id',
          followerId: 'user1',
          followeeId: 'user2',
          followType: 'watch',
          status: 'active',
          followReason: '参考になるコンテンツ',
          createdAt: new Date()
        };

        vi.mocked(db.insert).mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockFollow])
          })
        } as any);

        const result = await followService.createFollow({
          followerId: 'user1',
          followeeId: 'user2',
          followType: 'watch',
          followReason: '参考になるコンテンツ'
        });

        expect(result).toEqual(mockFollow);
      });
    });

    describe('異常系', () => {
      it('既にフォローしている場合、エラーが発生する', async () => {
        vi.mocked(db.select).mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ id: 'existing-follow' }])
          })
        } as any);

        await expect(
          followService.createFollow({
            followerId: 'user1',
            followeeId: 'user2',
            followType: 'family',
            followReason: '理由'
          })
        ).rejects.toThrow('すでにフォローしています');
      });

      it('自分自身をフォローしようとした場合、エラーが発生する', async () => {
        await expect(
          followService.createFollow({
            followerId: 'user1',
            followeeId: 'user1',
            followType: 'watch'
          })
        ).rejects.toThrow('自分自身をフォローすることはできません');
      });

      it('短時間で多数のフォローを行った場合、レート制限エラーが発生する', async () => {
        // 最初の20回は成功
        for (let i = 0; i < 20; i++) {
          vi.mocked(db.select).mockReturnValueOnce({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([])
            })
          } as any);

          vi.mocked(db.insert).mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: `follow-${i}` }])
            })
          } as any);

          await followService.createFollow({
            followerId: 'user1',
            followeeId: `user${i + 2}`,
            followType: 'watch'
          });
        }

        // 21回目でレート制限エラー
        await expect(
          followService.createFollow({
            followerId: 'user1',
            followeeId: 'user22',
            followType: 'watch'
          })
        ).rejects.toThrow('RATE_LIMIT_EXCEEDED');
      });
    });
  });

  describe('unfollowUser', () => {
    it('理由ありでアンフォローできる', async () => {
      const mockFollow = {
        id: 'follow-id',
        followerId: 'user1',
        followeeId: 'user2',
        status: 'active'
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockFollow])
        })
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ ...mockFollow, status: 'unfollowed' }])
        })
      } as any);

      await followService.unfollowUser({
        followId: 'follow-id',
        userId: 'user1',
        unfollowReason: 'コンテンツの方向性が変わったため'
      });

      expect(db.update).toHaveBeenCalledWith(follows);
    });

    it('理由なしでもアンフォローできる', async () => {
      const mockFollow = {
        id: 'follow-id',
        followerId: 'user1',
        followeeId: 'user2',
        status: 'active'
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockFollow])
        })
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ ...mockFollow, status: 'unfollowed' }])
        })
      } as any);

      await followService.unfollowUser({
        followId: 'follow-id',
        userId: 'user1'
      });

      expect(db.update).toHaveBeenCalledWith(follows);
    });

    it('存在しないフォローIDの場合、エラーが発生する', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      } as any);

      await expect(
        followService.unfollowUser({
          followId: 'non-existent',
          userId: 'user1'
        })
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });

    it('他ユーザーのフォロー関係を操作しようとした場合、エラーが発生する', async () => {
      const mockFollow = {
        id: 'follow-id',
        followerId: 'user2',
        followeeId: 'user3',
        status: 'active'
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockFollow])
        })
      } as any);

      await expect(
        followService.unfollowUser({
          followId: 'follow-id',
          userId: 'user1'
        })
      ).rejects.toThrow('他のユーザーのフォロー関係は操作できません');
    });
  });

  describe('getFollowers', () => {
    it('ページネーション付きでフォロワー一覧を取得できる', async () => {
      const mockFollowers = [
        {
          id: 'follow1',
          followerId: 'user2',
          followeeId: 'user1',
          followType: 'family',
          followReason: '素晴らしいコンテンツ',
          createdAt: new Date(),
          follower: {
            id: 'user2',
            displayName: 'User 2',
            profileImageUrl: 'https://example.com/user2.jpg'
          }
        }
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockFollowers)
              })
            })
          })
        })
      } as any);

      const result = await followService.getFollowers({
        userId: 'user1',
        limit: 20
      });

      expect(result.followers).toHaveLength(1);
      expect(result.followers[0].follower.displayName).toBe('User 2');
      expect(result.nextCursor).toBeDefined();
    });

    it('フォロワーがいない場合、空の配列を返す', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([])
              })
            })
          })
        })
      } as any);

      const result = await followService.getFollowers({
        userId: 'user1',
        limit: 20
      });

      expect(result.followers).toHaveLength(0);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe('getFollowing', () => {
    it('最新投稿付きでフォロー中一覧を取得できる', async () => {
      const mockFollowing = [
        {
          id: 'follow1',
          followerId: 'user1',
          followeeId: 'user2',
          followType: 'family',
          createdAt: new Date(),
          followee: {
            id: 'user2',
            displayName: 'User 2',
            profileImageUrl: 'https://example.com/user2.jpg'
          },
          latestPost: {
            id: 'post1',
            content: '最新の投稿です',
            contentType: 'text',
            createdAt: new Date()
          }
        }
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockFollowing)
              })
            })
          })
        })
      } as any);

      const result = await followService.getFollowing({
        userId: 'user1'
      });

      expect(result.following).toHaveLength(1);
      expect(result.following[0].followee.displayName).toBe('User 2');
      expect(result.following[0].latestPost?.content).toBe('最新の投稿です');
    });

    it('フォロータイプでフィルタリングできる', async () => {
      const mockFollowing = [
        {
          id: 'follow1',
          followerId: 'user1',
          followeeId: 'user2',
          followType: 'family',
          createdAt: new Date(),
          followee: {
            id: 'user2',
            displayName: 'Family User',
            profileImageUrl: 'https://example.com/user2.jpg'
          }
        }
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockFollowing)
              })
            })
          })
        })
      } as any);

      const result = await followService.getFollowing({
        userId: 'user1',
        type: 'family'
      });

      expect(result.following).toHaveLength(1);
      expect(result.following[0].followType).toBe('family');
    });
  });
});