import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { vi } from 'vitest';
import PostCard from '@/components/PostCard';

describe('PostCard Component', () => {
  const mockPost = {
    id: 'test-post-1',
    user: {
      id: 'user-1',
      displayName: 'テストユーザー',
      profileImageUrl: 'https://example.com/avatar.jpg'
    },
    contentType: 'text' as const,
    textContent: 'これはテスト投稿です',
    createdAt: '2024-01-01T00:00:00Z',
    likes: 5,
    comments: 3,
    isLiked: false,
    isHighlighted: false,
    isBookmarked: false
  };

  it('投稿内容が正しく表示される', () => {
    // Arrange & Act
    const { getByText, getByTestId } = render(<PostCard post={mockPost} />);

    // Assert
    expect(getByText('テストユーザー')).toBeTruthy();
    expect(getByText('これはテスト投稿です')).toBeTruthy();
    expect(getByTestId('like-count')).toHaveTextContent('5');
    expect(getByTestId('comment-count')).toHaveTextContent('3');
  });

  it('いいねボタンが動作する', async () => {
    // Arrange
    const onLike = vi.fn();
    const { getByTestId } = render(
      <PostCard post={mockPost} onLike={onLike} />
    );

    // Act
    fireEvent.press(getByTestId('like-button'));

    // Assert
    expect(onLike).toHaveBeenCalledWith(mockPost.id);
  });

  it('ハイライトボタンで理由入力ダイアログが表示される', () => {
    // Arrange
    const { getByTestId, getByText } = render(<PostCard post={mockPost} />);

    // Act
    fireEvent.press(getByTestId('highlight-button'));

    // Assert
    expect(getByText('ハイライトの理由')).toBeTruthy();
    expect(getByTestId('highlight-reason-input')).toBeTruthy();
  });

  it('自分の投稿に削除ボタンが表示される', () => {
    // Arrange
    const myPost = { ...mockPost, user: { ...mockPost.user, id: 'current-user-id' } };
    const { getByTestId } = render(
      <PostCard post={myPost} currentUserId="current-user-id" />
    );

    // Assert
    expect(getByTestId('delete-button')).toBeTruthy();
  });

  it('他人の投稿に削除ボタンが表示されない', () => {
    // Arrange & Act
    const { queryByTestId } = render(
      <PostCard post={mockPost} currentUserId="current-user-id" />
    );

    // Assert
    expect(queryByTestId('delete-button')).toBeNull();
  });
});
