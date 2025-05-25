import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FollowButton } from '../../src/components/follow/FollowButton';
import * as followService from '../../src/lib/followService';

// Mock followService
vi.mock('../../src/lib/followService');

// Mock AuthContext
vi.mock('../../src/context/AuthContext', () => ({
  AuthContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({ children }: { children: (value: any) => React.ReactNode }) => children({ user: { id: 'user1' } })
  }
}));

// Mock useToast
vi.mock('../../src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('FollowButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('フォローボタン表示', () => {
    it('未フォローユーザーに対して「フォロー」ボタンが表示される', () => {
      const { getByText } = render(
        <FollowButton 
          userId="user2"
          followStatus="not_following"
          onFollowChange={vi.fn()}
        />
      );

      expect(getByText('フォロー')).toBeTruthy();
    });

    it('フォロー済みユーザーに対して「フォロー中」ボタンとファミリーバッジが表示される', () => {
      const { getByText, getByTestId } = render(
        <FollowButton 
          userId="user2"
          followStatus="following"
          followType="family"
          followId="follow-id"
          onFollowChange={vi.fn()}
        />
      );

      expect(getByText('フォロー中')).toBeTruthy();
      expect(getByTestId('family-badge')).toBeTruthy();
    });

    it('ウォッチフォローの場合、ウォッチバッジが表示される', () => {
      const { getByText, getByTestId } = render(
        <FollowButton 
          userId="user2"
          followStatus="following"
          followType="watch"
          followId="follow-id"
          onFollowChange={vi.fn()}
        />
      );

      expect(getByText('フォロー中')).toBeTruthy();
      expect(getByTestId('watch-badge')).toBeTruthy();
    });

    it('フォロー処理中はローディングスピナーが表示され、ボタンが無効化される', async () => {
      const { rerender, getByText, getByTestId } = render(
        <FollowButton 
          userId="user2"
          followStatus="not_following"
          onFollowChange={vi.fn()}
        />
      );

      const button = getByText('フォロー');
      fireEvent.press(button);

      // モーダルが表示される
      await waitFor(() => {
        expect(getByTestId('follow-type-modal')).toBeTruthy();
      });

      // ファミリーフォローを選択
      fireEvent.press(getByText('ファミリーフォロー'));

      // 理由入力画面が表示される
      await waitFor(() => {
        expect(getByTestId('follow-reason-input')).toBeTruthy();
      });

      // isLoadingがtrueの時の表示を確認
      const { getByTestId: getByTestId2, getByText: getByText2 } = rerender(
        <FollowButton 
          userId="user2"
          followStatus="not_following"
          isLoading={true}
          onFollowChange={vi.fn()}
        />
      );

      expect(getByTestId2('loading-spinner')).toBeTruthy();
      // ボタンが無効化されていることを確認
      const button = getByText2('フォロー').parent;
      expect(button?.props.disabled).toBe(true);
    });
  });

  describe('フォローボタンインタラクション', () => {
    it('フォローボタンプレス時にモーダルが表示される', async () => {
      const { getByText, getByTestId } = render(
        <FollowButton 
          userId="user2"
          followStatus="not_following"
          onFollowChange={vi.fn()}
        />
      );

      const button = getByText('フォロー');
      fireEvent.press(button);

      await waitFor(() => {
        expect(getByTestId('follow-type-modal')).toBeTruthy();
        expect(getByText('ファミリーフォロー')).toBeTruthy();
        expect(getByText('ウォッチフォロー')).toBeTruthy();
      });
    });

    it('フォロー中ボタン長押し時にアンフォロー確認ダイアログが表示される', async () => {
      const { getByText, getByTestId } = render(
        <FollowButton 
          userId="user2"
          followStatus="following"
          followType="family"
          followId="follow-id"
          onFollowChange={vi.fn()}
        />
      );

      const button = getByText('フォロー中');
      fireEvent(button, 'onLongPress');

      await waitFor(() => {
        expect(getByTestId('unfollow-dialog')).toBeTruthy();
        expect(getByText('フォローを解除しますか？')).toBeTruthy();
      });
    });

    it('ファミリーフォロー選択時に理由入力画面が表示される', async () => {
      const { getByText, getByTestId, getByPlaceholderText } = render(
        <FollowButton 
          userId="user2"
          followStatus="not_following"
          onFollowChange={vi.fn()}
        />
      );

      fireEvent.press(getByText('フォロー'));
      
      await waitFor(() => {
        expect(getByTestId('follow-type-modal')).toBeTruthy();
      });

      fireEvent.press(getByText('ファミリーフォロー'));

      await waitFor(() => {
        expect(getByTestId('follow-reason-modal')).toBeTruthy();
        expect(getByText('ファミリーフォローの理由')).toBeTruthy();
        expect(getByPlaceholderText('フォローする理由を入力してください')).toBeTruthy();
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

      const { getByText, getByTestId } = render(
        <FollowButton 
          userId="user2"
          followStatus="not_following"
          currentUserId="user1"
          onFollowChange={onFollowChange}
        />
      );

      fireEvent.press(getByText('フォロー'));
      
      await waitFor(() => {
        expect(getByTestId('follow-type-modal')).toBeTruthy();
      });

      fireEvent.press(getByText('ウォッチフォロー'));

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

      const { getByText, getByTestId, getByPlaceholderText } = render(
        <FollowButton 
          userId="user2"
          followStatus="not_following"
          currentUserId="user1"
          onFollowChange={onFollowChange}
        />
      );

      // フォローボタンをタップ
      fireEvent.press(getByText('フォロー'));
      
      await waitFor(() => {
        expect(getByTestId('follow-type-modal')).toBeTruthy();
      });

      // ファミリーフォローを選択
      fireEvent.press(getByText('ファミリーフォロー'));

      await waitFor(() => {
        expect(getByTestId('follow-reason-modal')).toBeTruthy();
      });

      // 理由を入力
      const reasonInput = getByPlaceholderText('フォローする理由を入力してください');
      fireEvent.changeText(reasonInput, '素晴らしいコンテンツを共有してくれるから');

      // フォローボタンが有効になっていることを確認
      const submitButton = getByTestId('submit-follow-button');
      expect(submitButton.props.disabled).toBe(false);

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

      const { getByText, getByTestId, getByPlaceholderText } = render(
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
      const button = getByText('フォロー中');
      fireEvent(button, 'onLongPress');

      await waitFor(() => {
        expect(getByTestId('unfollow-dialog')).toBeTruthy();
      });

      // アンフォロー理由を入力（任意）
      const reasonInput = getByPlaceholderText('アンフォローする理由（任意）');
      fireEvent.changeText(reasonInput, 'コンテンツの方向性が変わったため');

      // アンフォローを実行
      fireEvent.press(getByText('アンフォロー'));

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

      const { getByText, getByTestId, queryByText } = render(
        <FollowButton 
          userId="user2"
          followStatus="not_following"
          currentUserId="user1"
          onFollowChange={onFollowChange}
        />
      );

      fireEvent.press(getByText('フォロー'));
      
      await waitFor(() => {
        expect(getByTestId('follow-type-modal')).toBeTruthy();
      });

      fireEvent.press(getByText('ウォッチフォロー'));

      await waitFor(() => {
        expect(queryByText('ネットワークエラーが発生しました')).toBeTruthy();
        expect(onFollowChange).not.toHaveBeenCalled();
      });
    });
  });
});