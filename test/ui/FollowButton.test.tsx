import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

// Mock components
jest.mock('@/components/ui/Button', () => 'Button');
jest.mock('@/components/ui/Text', () => 'Text');
jest.mock('@/components/ui/Badge', () => 'Badge');
jest.mock('@/services/followService', () => ({
  followUser: jest.fn(),
  unfollowUser: jest.fn()
}));

import FollowButton from '@/components/FollowButton';

describe('FollowButton Component', () => {
  test('should render follow button for unfollowed user', () => {
    // Given
    const props = {
      userId: 'user-123',
      followStatus: 'not_following',
      onFollow: jest.fn()
    };

    // When
    render(<FollowButton {...props} />);

    // Then
    expect(screen.getByText('フォロー')).toBeOnTheScreen();
    expect(screen.queryByText('フォロー中')).not.toBeOnTheScreen();
  });

  test('should render following button for followed user', () => {
    // Given
    const props = {
      userId: 'user-123',
      followStatus: 'following',
      followType: 'family',
      onUnfollow: jest.fn()
    };

    // When
    render(<FollowButton {...props} />);

    // Then
    expect(screen.getByText('フォロー中')).toBeOnTheScreen();
    expect(screen.getByTestId('follow-type-badge')).toHaveTextContent('ファミリー');
  });

  test('should show loading state during follow action', () => {
    // Given
    const props = {
      userId: 'user-123',
      followStatus: 'not_following',
      isLoading: true,
      onFollow: jest.fn()
    };

    // When
    render(<FollowButton {...props} />);

    // Then
    expect(screen.getByTestId('loading-spinner')).toBeOnTheScreen();
    expect(screen.getByText('フォロー')).toBeDisabled();
  });
});

describe('FollowButton Interactions', () => {
  test('should open follow type selection modal on follow button press', async () => {
    // Given
    const mockOnFollow = jest.fn();
    const props = {
      userId: 'user-123',
      followStatus: 'not_following',
      onFollow: mockOnFollow
    };

    // When
    render(<FollowButton {...props} />);
    const followButton = screen.getByText('フォロー');
    
    await act(() => {
      fireEvent.press(followButton);
    });

    // Then
    expect(screen.getByText('フォローの種類を選択')).toBeOnTheScreen();
    expect(screen.getByText('ファミリーフォロー')).toBeOnTheScreen();
    expect(screen.getByText('ウォッチフォロー')).toBeOnTheScreen();
  });

  test('should open unfollow confirmation on long press', async () => {
    // Given
    const mockOnUnfollow = jest.fn();
    const props = {
      userId: 'user-123',
      followStatus: 'following',
      followType: 'watch',
      onUnfollow: mockOnUnfollow
    };

    // When
    render(<FollowButton {...props} />);
    const followingButton = screen.getByText('フォロー中');
    
    await act(() => {
      fireEvent(followingButton, 'longPress');
    });

    // Then
    expect(screen.getByText('アンフォロー')).toBeOnTheScreen();
    expect(screen.getByText('キャンセル')).toBeOnTheScreen();
  });
});