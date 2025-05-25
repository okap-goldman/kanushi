import { FollowersList } from '@/components/follow/FollowersList';
import { FollowingList } from '@/components/follow/FollowingList';
import { followService } from '@/lib/followService';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock followService
vi.mock('@/lib/followService', () => ({
  followService: {
    getFollowers: vi.fn(),
    getFollowing: vi.fn(),
  },
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('FollowersList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('フォロワー一覧表示', () => {
    it('フォロワー一覧が正しく表示される', async () => {
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
            profileImageUrl: 'https://example.com/user2.jpg',
          },
        },
        {
          id: 'follow2',
          followerId: 'user3',
          followeeId: 'user1',
          followType: 'watch',
          followReason: null,
          createdAt: new Date(),
          follower: {
            id: 'user3',
            displayName: 'User 3',
            profileImageUrl: 'https://example.com/user3.jpg',
          },
        },
      ];

      vi.mocked(followService.getFollowers).mockResolvedValue({
        followers: mockFollowers,
        nextCursor: null,
      });

      render(<FollowersList userId="user1" />);

      await waitFor(() => {
        expect(screen.getByText('User 2')).toBeTruthy();
        expect(screen.getByText('User 3')).toBeTruthy();
        expect(screen.getByTestId('family-badge-follow1')).toBeTruthy();
        expect(screen.getByTestId('watch-badge-follow2')).toBeTruthy();
      });
    });

    it('相互フォロー表示が正しく機能する', async () => {
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
            displayName: 'Mutual User',
            profileImageUrl: 'https://example.com/user2.jpg',
          },
          isFollowingBack: true,
        },
      ];

      vi.mocked(followService.getFollowers).mockResolvedValue({
        followers: mockFollowers,
        nextCursor: null,
      });

      render(<FollowersList userId="user1" currentUserId="user1" />);

      await waitFor(() => {
        expect(screen.getByTestId('mutual-follow-icon-follow1')).toBeTruthy();
      });
    });

    it('フォロワーがいない場合、空の状態が表示される', async () => {
      vi.mocked(followService.getFollowers).mockResolvedValue({
        followers: [],
        nextCursor: null,
      });

      render(<FollowersList userId="user1" />);

      await waitFor(() => {
        expect(screen.getByText('フォロワーはまだいません')).toBeTruthy();
      });
    });

    it('ユーザープレスでプロフィール画面に遷移する', async () => {
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
            profileImageUrl: 'https://example.com/user2.jpg',
          },
        },
      ];

      vi.mocked(followService.getFollowers).mockResolvedValue({
        followers: mockFollowers,
        nextCursor: null,
      });

      render(<FollowersList userId="user1" />);

      await waitFor(() => {
        const userItem = screen.getByTestId('follower-item-user2');
        fireEvent.press(userItem);
      });

      expect(mockNavigate).toHaveBeenCalledWith('Profile', { userId: 'user2' });
    });
  });

  describe('ページネーション', () => {
    it('スクロールで追加のフォロワーが読み込まれる', async () => {
      const firstPageFollowers = Array.from({ length: 20 }, (_, i) => ({
        id: `follow${i}`,
        followerId: `user${i + 2}`,
        followeeId: 'user1',
        followType: 'watch' as const,
        followReason: null,
        createdAt: new Date(),
        follower: {
          id: `user${i + 2}`,
          displayName: `User ${i + 2}`,
          profileImageUrl: `https://example.com/user${i + 2}.jpg`,
        },
      }));

      vi.mocked(followService.getFollowers)
        .mockResolvedValueOnce({
          followers: firstPageFollowers,
          nextCursor: 'cursor1',
        })
        .mockResolvedValueOnce({
          followers: [
            {
              id: 'follow20',
              followerId: 'user22',
              followeeId: 'user1',
              followType: 'watch',
              followReason: null,
              createdAt: new Date(),
              follower: {
                id: 'user22',
                displayName: 'User 22',
                profileImageUrl: 'https://example.com/user22.jpg',
              },
            },
          ],
          nextCursor: null,
        });

      const { getByTestId } = render(<FollowersList userId="user1" />);

      await waitFor(() => {
        expect(screen.getByText('User 2')).toBeTruthy();
      });

      // スクロールをシミュレート
      const flatList = getByTestId('followers-list');
      fireEvent.scroll(flatList, {
        nativeEvent: {
          contentOffset: { y: 1000 },
          contentSize: { height: 2000 },
          layoutMeasurement: { height: 800 },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('User 22')).toBeTruthy();
      });
    });
  });
});

describe('FollowingList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('フォロー中一覧表示', () => {
    it('最新投稿付きでフォロー中一覧が表示される', async () => {
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
            profileImageUrl: 'https://example.com/user2.jpg',
          },
          latestPost: {
            id: 'post1',
            content: '最新の投稿です',
            contentType: 'text',
            createdAt: new Date(),
          },
        },
        {
          id: 'follow2',
          followerId: 'user1',
          followeeId: 'user3',
          followType: 'watch',
          createdAt: new Date(),
          followee: {
            id: 'user3',
            displayName: 'User 3',
            profileImageUrl: 'https://example.com/user3.jpg',
          },
          latestPost: {
            id: 'post2',
            content: null,
            contentType: 'audio',
            audioUrl: 'https://example.com/audio.mp3',
            createdAt: new Date(),
          },
        },
      ];

      vi.mocked(followService.getFollowing).mockResolvedValue({
        following: mockFollowing,
        nextCursor: null,
      });

      render(<FollowingList userId="user1" />);

      await waitFor(() => {
        expect(screen.getByText('User 2')).toBeTruthy();
        expect(screen.getByText('User 3')).toBeTruthy();
        expect(screen.getByText('最新の投稿です')).toBeTruthy();
        expect(screen.getByTestId('audio-icon-post2')).toBeTruthy();
      });
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
            profileImageUrl: 'https://example.com/user2.jpg',
          },
          latestPost: null,
        },
        {
          id: 'follow2',
          followerId: 'user1',
          followeeId: 'user3',
          followType: 'watch',
          createdAt: new Date(),
          followee: {
            id: 'user3',
            displayName: 'Watch User',
            profileImageUrl: 'https://example.com/user3.jpg',
          },
          latestPost: null,
        },
      ];

      vi.mocked(followService.getFollowing)
        .mockResolvedValueOnce({
          following: mockFollowing,
          nextCursor: null,
        })
        .mockResolvedValueOnce({
          following: [mockFollowing[0]],
          nextCursor: null,
        });

      render(<FollowingList userId="user1" />);

      await waitFor(() => {
        expect(screen.getByText('Family User')).toBeTruthy();
        expect(screen.getByText('Watch User')).toBeTruthy();
      });

      // ファミリーフィルターをタップ
      fireEvent.press(screen.getByTestId('filter-family'));

      await waitFor(() => {
        expect(screen.getByText('Family User')).toBeTruthy();
        expect(screen.queryByText('Watch User')).toBeFalsy();
      });
    });

    it('投稿のないユーザーが正しく表示される', async () => {
      const mockFollowing = [
        {
          id: 'follow1',
          followerId: 'user1',
          followeeId: 'user2',
          followType: 'family',
          createdAt: new Date(),
          followee: {
            id: 'user2',
            displayName: 'No Post User',
            profileImageUrl: 'https://example.com/user2.jpg',
          },
          latestPost: null,
        },
      ];

      vi.mocked(followService.getFollowing).mockResolvedValue({
        following: mockFollowing,
        nextCursor: null,
      });

      render(<FollowingList userId="user1" />);

      await waitFor(() => {
        expect(screen.getByText('No Post User')).toBeTruthy();
        expect(screen.getByText('まだ投稿がありません')).toBeTruthy();
      });
    });

    it('フォロー中がいない場合、空の状態が表示される', async () => {
      vi.mocked(followService.getFollowing).mockResolvedValue({
        following: [],
        nextCursor: null,
      });

      render(<FollowingList userId="user1" />);

      await waitFor(() => {
        expect(screen.getByText('まだ誰もフォローしていません')).toBeTruthy();
      });
    });
  });

  describe('フィルター機能', () => {
    it('フィルタータブが正しく動作する', async () => {
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
            profileImageUrl: 'https://example.com/user2.jpg',
          },
          latestPost: null,
        },
      ];

      vi.mocked(followService.getFollowing).mockResolvedValue({
        following: mockFollowing,
        nextCursor: null,
      });

      render(<FollowingList userId="user1" />);

      await waitFor(() => {
        // デフォルトで「すべて」タブがアクティブ
        expect(screen.getByTestId('filter-all')).toHaveStyle({
          backgroundColor: expect.stringContaining('blue'),
        });
      });

      // ファミリータブをタップ
      fireEvent.press(screen.getByTestId('filter-family'));

      await waitFor(() => {
        expect(screen.getByTestId('filter-family')).toHaveStyle({
          backgroundColor: expect.stringContaining('blue'),
        });
        expect(screen.getByTestId('filter-all')).not.toHaveStyle({
          backgroundColor: expect.stringContaining('blue'),
        });
      });
    });
  });
});
