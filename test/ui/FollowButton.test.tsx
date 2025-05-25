import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FollowButton } from '@/components/follow/FollowButton';
import { followService } from '@/lib/followService';

// Mock followService
vi.mock('@/lib/followService', () => ({
  followService: {
    createFollow: vi.fn(),
    unfollowUser: vi.fn()
  }
}));

describe('FollowButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('フォローボタン表示', () => {
    it('未フォローユーザーに対して「フォロー」ボタンが表示される', () => {
      render(
        <FollowButton 
          userId="user2"
          followStatus="not_following"
          onFollowChange={vi.fn()}
        />
      );

      expect(screen.getByText('フォロー')).toBeTruthy();
    });

    it('フォロー済みユーザーに対して「フォロー中」ボタンとファミリーバッジが表示される', () => {
      render(
        <FollowButton 
          userId="user2"
          followStatus="following"
          followType="family"
          followId="follow-id"
          onFollowChange={vi.fn()}
        />
      );

      expect(screen.getByText('フォロー中')).toBeTruthy();
      expect(screen.getByTestId('family-badge')).toBeTruthy();
    });

    it('ウォッチフォローの場合、ウォッチバッジが表示される', () => {
      render(
        <FollowButton 
          userId="user2"
          followStatus="following"
          followType="watch"
          followId="follow-id"
          onFollowChange={vi.fn()}
        />
      );

      expect(screen.getByText('フォロー中')).toBeTruthy();
      expect(screen.getByTestId('watch-badge')).toBeTruthy();
    });

    it('フォロー処理中はローディングスピナーが表示され、ボタンが無効化される', async () => {
      const { rerender } = render(
        <FollowButton 
          userId="user2"
          followStatus="not_following"
          onFollowChange={vi.fn()}
        />
      );

      const button = screen.getByText('フォロー');
      fireEvent.press(button);

      // モーダルが表示される
      await waitFor(() => {
        expect(screen.getByTestId('follow-type-modal')).toBeTruthy();
      });

      // ファミリーフォローを選択
      fireEvent.press(screen.getByText('ファミリーフォロー'));

      // 理由入力画面が表示される
      await waitFor(() => {
        expect(screen.getByTestId('follow-reason-input')).toBeTruthy();
      });

      // isLoadingがtrueの時の表示を確認
      rerender(
        <FollowButton 
          userId="user2"
          followStatus="not_following"
          isLoading={true}
          onFollowChange={vi.fn()}
        />
      );

      expect(screen.getByTestId('loading-spinner')).toBeTruthy();
      expect(screen.getByText('フォロー')).toBeDisabled();
    });
  });

  describe('フォローボタンインタラクション', () => {
    it('フォローボタンプレス時にモーダルが表示される', async () => {
      render(
        <FollowButton 
          userId="user2"
          followStatus="not_following"
          onFollowChange={vi.fn()}
        />
      );

      const button = screen.getByText('フォロー');
      fireEvent.press(button);

      await waitFor(() => {
        expect(screen.getByTestId('follow-type-modal')).toBeTruthy();
        expect(screen.getByText('ファミリーフォロー')).toBeTruthy();
        expect(screen.getByText('ウォッチフォロー')).toBeTruthy();
      });
    });

    it('フォロー中ボタン長押し時にアンフォロー確認ダイアログが表示される', async () => {
      render(
        <FollowButton 
          userId="user2"
          followStatus="following"
          followType="family"
          followId="follow-id"
          onFollowChange={vi.fn()}
        />
      );

      const button = screen.getByText('フォロー中');
      fireEvent(button, 'onLongPress');

      await waitFor(() => {
        expect(screen.getByTestId('unfollow-dialog')).toBeTruthy();
        expect(screen.getByText('フォローを解除しますか？')).toBeTruthy();
      });
    });

    it('ファミリーフォロー選択時に理由入力画面が表示される', async () => {
      render(
        <FollowButton 
          userId="user2"
          followStatus="not_following"
          onFollowChange={vi.fn()}
        />
      );

      fireEvent.press(screen.getByText('フォロー'));
      
      await waitFor(() => {
        expect(screen.getByTestId('follow-type-modal')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('ファミリーフォロー'));

      await waitFor(() => {
        expect(screen.getByTestId('follow-reason-modal')).toBeTruthy();
        expect(screen.getByText('ファミリーフォローの理由')).toBeTruthy();
        expect(screen.getByPlaceholderText('フォローする理由を入力してください')).toBeTruthy();
      });
    });

    it('ウォッチフォロー選択時は即座にフォローが実行される', async () => {
      const onFollowChange = vi.fn();
      vi.mocked(followService.createFollow).mockResolvedValue({
        id: 'new-follow-id',
        followerId: 'user1',
        followeeId: 'user2',
        followType: 'watch',
        status: 'active',
        followReason: null,
        createdAt: new Date(),
        unfollowedAt: null,
        unfollowReason: null
      });

      render(
        <FollowButton 
          userId="user2"
          followStatus="not_following"
          currentUserId="user1"
          onFollowChange={onFollowChange}
        />
      );

      fireEvent.press(screen.getByText('フォロー'));
      
      await waitFor(() => {
        expect(screen.getByTestId('follow-type-modal')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('ウォッチフォロー'));

      await waitFor(() => {
        expect(followService.createFollow).toHaveBeenCalledWith({
          followerId: 'user1',
          followeeId: 'user2',
          followType: 'watch'
        });
        expect(onFollowChange).toHaveBeenCalledWith({
          followStatus: 'following',
          followType: 'watch',
          followId: 'new-follow-id'
        });
      });
    });

    it('理由入力後にファミリーフォローが実行される', async () => {
      const onFollowChange = vi.fn();
      vi.mocked(followService.createFollow).mockResolvedValue({
        id: 'new-follow-id',
        followerId: 'user1',
        followeeId: 'user2',
        followType: 'family',
        status: 'active',
        followReason: '素晴らしいコンテンツを共有してくれるから',
        createdAt: new Date(),
        unfollowedAt: null,
        unfollowReason: null
      });

      render(
        <FollowButton 
          userId="user2"
          followStatus="not_following"
          currentUserId="user1"
          onFollowChange={onFollowChange}
        />
      );

      // フォローボタンをタップ
      fireEvent.press(screen.getByText('フォロー'));
      
      await waitFor(() => {
        expect(screen.getByTestId('follow-type-modal')).toBeTruthy();
      });

      // ファミリーフォローを選択
      fireEvent.press(screen.getByText('ファミリーフォロー'));

      await waitFor(() => {
        expect(screen.getByTestId('follow-reason-modal')).toBeTruthy();
      });

      // 理由を入力
      const reasonInput = screen.getByPlaceholderText('フォローする理由を入力してください');
      fireEvent.changeText(reasonInput, '素晴らしいコンテンツを共有してくれるから');

      // フォローボタンが有効になっていることを確認
      const submitButton = screen.getByTestId('submit-follow-button');
      expect(submitButton).not.toBeDisabled();

      // フォローを実行
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(followService.createFollow).toHaveBeenCalledWith({
          followerId: 'user1',
          followeeId: 'user2',
          followType: 'family',
          followReason: '素晴らしいコンテンツを共有してくれるから'
        });
        expect(onFollowChange).toHaveBeenCalledWith({
          followStatus: 'following',
          followType: 'family',
          followId: 'new-follow-id'
        });
      });
    });

    it('アンフォロー確認後にアンフォローが実行される', async () => {
      const onFollowChange = vi.fn();
      vi.mocked(followService.unfollowUser).mockResolvedValue({
        id: 'follow-id',
        followerId: 'user1',
        followeeId: 'user2',
        followType: 'family',
        status: 'unfollowed',
        followReason: '理由',
        createdAt: new Date(),
        unfollowedAt: new Date(),
        unfollowReason: 'コンテンツの方向性が変わったため'
      });

      render(
        <FollowButton 
          userId="user2"
          followStatus="following"
          followType="family"
          followId="follow-id"
          currentUserId="user1"
          onFollowChange={onFollowChange}
        />
      );

      // フォロー中ボタンを長押し
      const button = screen.getByText('フォロー中');
      fireEvent(button, 'onLongPress');

      await waitFor(() => {
        expect(screen.getByTestId('unfollow-dialog')).toBeTruthy();
      });

      // アンフォロー理由を入力（任意）
      const reasonInput = screen.getByPlaceholderText('アンフォローする理由（任意）');
      fireEvent.changeText(reasonInput, 'コンテンツの方向性が変わったため');

      // アンフォローを実行
      fireEvent.press(screen.getByText('アンフォロー'));

      await waitFor(() => {
        expect(followService.unfollowUser).toHaveBeenCalledWith({
          followId: 'follow-id',
          userId: 'user1',
          unfollowReason: 'コンテンツの方向性が変わったため'
        });
        expect(onFollowChange).toHaveBeenCalledWith({
          followStatus: 'not_following'
        });
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('フォロー作成時のエラーが適切に表示される', async () => {
      const onFollowChange = vi.fn();
      vi.mocked(followService.createFollow).mockRejectedValue(
        new Error('ネットワークエラーが発生しました')
      );

      render(
        <FollowButton 
          userId="user2"
          followStatus="not_following"
          currentUserId="user1"
          onFollowChange={onFollowChange}
        />
      );

      fireEvent.press(screen.getByText('フォロー'));
      
      await waitFor(() => {
        expect(screen.getByTestId('follow-type-modal')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('ウォッチフォロー'));

      await waitFor(() => {
        expect(screen.getByText('ネットワークエラーが発生しました')).toBeTruthy();
        expect(onFollowChange).not.toHaveBeenCalled();
      });
    });
  });
});