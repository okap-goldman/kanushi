import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { View } from 'react-native';
import { AuthProvider } from '../../src/context/AuthContext';
import FollowButton from '../../src/components/follow/FollowButton';
import FollowersList from '../../src/components/follow/FollowersList';
import FollowingList from '../../src/components/follow/FollowingList';
import * as followService from '../../src/lib/followService';
import { useToast } from '../../src/hooks/use-toast';

// Mock NavigationContainer as a simple wrapper
const NavigationContainer = ({ children }: any) => <View>{children}</View>;

// Mock services
vi.mock('../../src/lib/followService');
vi.mock('../../src/hooks/use-toast');

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('@react-navigation/native', async () => {
  const actual = await vi.importActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

describe('フォロー機能の結合テスト', () => {
  const mockToast = vi.fn();
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };
  const targetUser = {
    id: 'target-user-id',
    display_name: 'テストユーザー',
    username: 'testuser',
    avatar_url: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as any).mockReturnValue({ toast: mockToast });
  });

  describe('3.1 フォロー処理の全体フロー', () => {
    describe('3.1.1 ファミリーフォロー完全フロー', () => {
      it('通知付きファミリーフォロー完全フロー', async () => {
        // Given - フォロー状態を未フォローに設定
        const mockCheckFollowStatus = vi.spyOn(followService, 'checkFollowStatus');
        mockCheckFollowStatus.mockResolvedValue({
          isFollowing: false,
          followType: null,
          followedAt: null,
        });

        const mockFollowUser = vi.spyOn(followService, 'followUser');
        mockFollowUser.mockResolvedValue({
          id: 'follow-id',
          follower_id: mockUser.id,
          following_id: targetUser.id,
          follow_type: 'family',
          reason: '素晴らしいコンテンツを共有してくれるから',
          created_at: new Date().toISOString(),
        });

        // When - フォローボタンをレンダリング
        const { getByText, getByPlaceholderText } = render(
          <NavigationContainer>
            <AuthProvider value={{ user: mockUser } as any}>
              <FollowButton userId={targetUser.id} />
            </AuthProvider>
          </NavigationContainer>
        );

        // Step 1: フォローボタンをタップ
        const followButton = getByText('フォロー');
        fireEvent.press(followButton);

        // Step 2: ファミリーフォローを選択
        await waitFor(() => {
          const familyOption = getByText('ファミリーフォロー');
          fireEvent.press(familyOption);
        });

        // Step 3: フォロー理由を入力
        await waitFor(() => {
          const reasonInput = getByPlaceholderText('どんなところに惹かれましたか？');
          fireEvent.changeText(reasonInput, '素晴らしいコンテンツを共有してくれるから');
        });

        // Step 4: フォロー確定
        await waitFor(() => {
          const confirmButton = getByText('フォローする');
          fireEvent.press(confirmButton);
        });

        // Then - 期待結果を検証
        await waitFor(() => {
          // フォローAPIが正しいパラメータで呼ばれたか
          expect(mockFollowUser).toHaveBeenCalledWith(
            targetUser.id,
            'family',
            '素晴らしいコンテンツを共有してくれるから'
          );

          // 成功トーストが表示されたか
          expect(mockToast).toHaveBeenCalledWith({
            title: 'フォローしました',
            description: 'ファミリーフォローとして登録されました',
          });

          // フォローボタンが「フォロー中」に変わったか
          expect(getByText('フォロー中')).toBeTruthy();
        });
      });
    });

    describe('3.1.2 アンフォロー完全フロー', () => {
      it('アンフォロー完全フロー', async () => {
        // Given - 既にフォロー済みの状態
        const mockCheckFollowStatus = vi.spyOn(followService, 'checkFollowStatus');
        mockCheckFollowStatus.mockResolvedValue({
          isFollowing: true,
          followType: 'family',
          followedAt: new Date().toISOString(),
        });

        const mockUnfollowUser = vi.spyOn(followService, 'unfollowUser');
        mockUnfollowUser.mockResolvedValue({ success: true });

        // When - フォローボタンをレンダリング
        const { getByText, getByPlaceholderText } = render(
          <NavigationContainer>
            <AuthProvider value={{ user: mockUser } as any}>
              <FollowButton userId={targetUser.id} />
            </AuthProvider>
          </NavigationContainer>
        );

        // フォロー中ボタンが表示されることを確認
        await waitFor(() => {
          expect(getByText('フォロー中')).toBeTruthy();
        });

        // Step 1: フォロー中ボタンを長押し
        const followingButton = getByText('フォロー中');
        fireEvent(followingButton, 'longPress');

        // Step 2: アンフォローを選択
        await waitFor(() => {
          const unfollowOption = getByText('アンフォロー');
          fireEvent.press(unfollowOption);
        });

        // Step 3: アンフォロー理由を入力（任意）
        await waitFor(() => {
          const reasonInput = getByPlaceholderText('理由（任意）');
          fireEvent.changeText(reasonInput, '投稿頻度が多すぎるため');
        });

        // Step 4: 確定ボタンをタップ
        await waitFor(() => {
          const confirmButton = getByText('アンフォローする');
          fireEvent.press(confirmButton);
        });

        // Then - 期待結果を検証
        await waitFor(() => {
          // アンフォローAPIが呼ばれたか
          expect(mockUnfollowUser).toHaveBeenCalledWith(
            targetUser.id,
            '投稿頻度が多すぎるため'
          );

          // 成功トーストが表示されたか
          expect(mockToast).toHaveBeenCalledWith({
            title: 'アンフォローしました',
          });

          // ボタンが「フォロー」状態に戻ったか
          expect(getByText('フォロー')).toBeTruthy();
        });
      });
    });
  });

  describe('3.2 リアルタイム更新テスト', () => {
    describe('3.2.1 フォロワー数のリアルタイム更新', () => {
      it('フォロワー数のリアルタイム更新', async () => {
        // Given - 初期フォロワーリスト
        const mockGetFollowers = vi.spyOn(followService, 'getFollowers');
        const initialFollowers = [];
        mockGetFollowers.mockResolvedValueOnce({
          data: initialFollowers,
          nextCursor: null,
        });

        // When - フォロワーリストをレンダリング
        const { rerender } = render(
          <NavigationContainer>
            <AuthProvider value={{ user: mockUser } as any}>
              <FollowersList userId={targetUser.id} />
            </AuthProvider>
          </NavigationContainer>
        );

        // 初期状態の確認
        await waitFor(() => {
          expect(mockGetFollowers).toHaveBeenCalledWith(targetUser.id, {
            limit: 20,
            cursor: undefined,
          });
        });

        // 新しいフォロワーを追加
        const newFollower1 = {
          id: 'follower-1',
          follower: {
            id: 'user-1',
            display_name: 'フォロワー1',
            username: 'follower1',
            avatar_url: null,
          },
          follow_type: 'family',
          reason: 'コンテンツが素晴らしい',
          created_at: new Date().toISOString(),
          is_following_back: false,
        };

        mockGetFollowers.mockResolvedValueOnce({
          data: [newFollower1],
          nextCursor: null,
        });

        // リレンダリングして更新を反映
        rerender(
          <NavigationContainer>
            <AuthProvider value={{ user: mockUser } as any}>
              <FollowersList userId={targetUser.id} />
            </AuthProvider>
          </NavigationContainer>
        );

        // Then - フォロワー数が更新されることを確認
        await waitFor(() => {
          expect(mockGetFollowers).toHaveBeenCalledTimes(2);
        });

        // さらに別のフォロワーを追加
        const newFollower2 = {
          id: 'follower-2',
          follower: {
            id: 'user-2',
            display_name: 'フォロワー2',
            username: 'follower2',
            avatar_url: null,
          },
          follow_type: 'watch',
          reason: null,
          created_at: new Date().toISOString(),
          is_following_back: true,
        };

        mockGetFollowers.mockResolvedValueOnce({
          data: [newFollower1, newFollower2],
          nextCursor: null,
        });

        rerender(
          <NavigationContainer>
            <AuthProvider value={{ user: mockUser } as any}>
              <FollowersList userId={targetUser.id} />
            </AuthProvider>
          </NavigationContainer>
        );

        await waitFor(() => {
          expect(mockGetFollowers).toHaveBeenCalledTimes(3);
        });
      });
    });
  });

  describe('3.3 データ整合性テスト', () => {
    describe('3.3.1 フォロー状態の一貫性', () => {
      it('画面間でのフォロー状態一貫性', async () => {
        // Given - フォロー前の状態
        const mockCheckFollowStatus = vi.spyOn(followService, 'checkFollowStatus');
        mockCheckFollowStatus.mockResolvedValue({
          isFollowing: false,
          followType: null,
          followedAt: null,
        });

        const mockFollowUser = vi.spyOn(followService, 'followUser');
        mockFollowUser.mockResolvedValue({
          id: 'follow-id',
          follower_id: mockUser.id,
          following_id: targetUser.id,
          follow_type: 'watch',
          reason: null,
          created_at: new Date().toISOString(),
        });

        const mockGetFollowing = vi.spyOn(followService, 'getFollowing');
        mockGetFollowing.mockResolvedValue({
          data: [],
          nextCursor: null,
        });

        // Step 1: プロフィール画面でユーザーをフォロー
        const { getByText } = render(
          <NavigationContainer>
            <AuthProvider value={{ user: mockUser } as any}>
              <FollowButton userId={targetUser.id} />
            </AuthProvider>
          </NavigationContainer>
        );

        // フォローボタンをタップ
        fireEvent.press(getByText('フォロー'));

        // ウォッチフォローを選択
        await waitFor(() => {
          const watchOption = getByText('ウォッチフォロー');
          fireEvent.press(watchOption);
        });

        // フォロー成功を確認
        await waitFor(() => {
          expect(mockFollowUser).toHaveBeenCalledWith(targetUser.id, 'watch', null);
          expect(getByText('フォロー中')).toBeTruthy();
        });

        // Step 2: フォロー中一覧画面に移動
        const followingUser = {
          id: 'following-1',
          following: targetUser,
          follow_type: 'watch',
          reason: null,
          created_at: new Date().toISOString(),
          latest_post: {
            id: 'post-1',
            content: 'テスト投稿',
            post_type: 'text',
            created_at: new Date().toISOString(),
          },
        };

        mockGetFollowing.mockResolvedValue({
          data: [followingUser],
          nextCursor: null,
        });

        const { getByText: getByTextFollowing } = render(
          <NavigationContainer>
            <AuthProvider value={{ user: mockUser } as any}>
              <FollowingList userId={mockUser.id} />
            </AuthProvider>
          </NavigationContainer>
        );

        // Then - フォロー中一覧にフォローしたユーザーが表示される
        await waitFor(() => {
          expect(mockGetFollowing).toHaveBeenCalledWith(mockUser.id, {
            limit: 20,
            cursor: undefined,
            type: undefined,
          });
          expect(getByTextFollowing('テストユーザー')).toBeTruthy();
          expect(getByTextFollowing('テスト投稿')).toBeTruthy();
        });
      });
    });
  });
});