import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

// Mock components
jest.mock('@/components/ui/FlatList', () => 'FlatList');
jest.mock('@/components/ui/Avatar', () => 'Avatar');
jest.mock('@/components/ui/Text', () => 'Text');
jest.mock('@/components/ui/Badge', () => 'Badge');
jest.mock('@/components/ui/Icon', () => 'Icon');
jest.mock('@/components/ui/TouchableOpacity', () => 'TouchableOpacity');

import FollowersList from '@/components/FollowersList';
import FollowingList from '@/components/FollowingList';

describe('FollowersList Component', () => {
  const mockFollowers = [
    {
      user: {
        id: 'user-1',
        displayName: 'ユーザー1',
        profileImageUrl: 'https://example.com/user1.jpg'
      },
      followType: 'family',
      followReason: 'テスト理由',
      isFollowingBack: true,
      createdAt: '2025-05-25T10:00:00Z'
    },
    {
      user: {
        id: 'user-2',
        displayName: 'ユーザー2',
        profileImageUrl: 'https://example.com/user2.jpg'
      },
      followType: 'watch',
      followReason: null,
      isFollowingBack: false,
      createdAt: '2025-05-25T11:00:00Z'
    }
  ];

  test('should render followers list', () => {
    // Given
    const props = {
      followers: mockFollowers,
      onLoadMore: jest.fn(),
      onUserPress: jest.fn()
    };

    // When
    render(<FollowersList {...props} />);

    // Then
    expect(screen.getByText('ユーザー1')).toBeOnTheScreen();
    expect(screen.getByText('ユーザー2')).toBeOnTheScreen();
    expect(screen.getByText('ファミリー')).toBeOnTheScreen();
    expect(screen.getByText('ウォッチ')).toBeOnTheScreen();
  });

  test('should show mutual follow indicator', () => {
    // Given
    const props = {
      followers: mockFollowers,
      onLoadMore: jest.fn(),
      onUserPress: jest.fn()
    };

    // When
    render(<FollowersList {...props} />);

    // Then
    expect(screen.getByTestId('mutual-follow-user-1')).toBeOnTheScreen();
    expect(screen.queryByTestId('mutual-follow-user-2')).not.toBeOnTheScreen();
  });

  test('should handle user press', async () => {
    // Given
    const mockOnUserPress = jest.fn();
    const props = {
      followers: mockFollowers,
      onLoadMore: jest.fn(),
      onUserPress: mockOnUserPress
    };

    // When
    render(<FollowersList {...props} />);
    
    await act(() => {
      fireEvent.press(screen.getByText('ユーザー1'));
    });

    // Then
    expect(mockOnUserPress).toHaveBeenCalledWith('user-1');
  });
});

describe('FollowingList Component', () => {
  const mockFollowing = [
    {
      user: {
        id: 'user-1',
        displayName: 'ユーザー1',
        profileImageUrl: 'https://example.com/user1.jpg'
      },
      followType: 'family',
      followReason: 'テスト理由',
      latestPost: {
        id: 'post-1',
        contentType: 'audio',
        textContent: '最新の音声投稿です',
        createdAt: '2025-05-25T12:00:00Z'
      },
      createdAt: '2025-05-25T10:00:00Z'
    }
  ];

  test('should render following list with latest posts', () => {
    // Given
    const props = {
      following: mockFollowing,
      onLoadMore: jest.fn(),
      onUserPress: jest.fn(),
      onPostPress: jest.fn()
    };

    // When
    render(<FollowingList {...props} />);

    // Then
    expect(screen.getByText('ユーザー1')).toBeOnTheScreen();
    expect(screen.getByText('最新の音声投稿です')).toBeOnTheScreen();
    expect(screen.getByTestId('post-type-audio')).toBeOnTheScreen();
  });

  test('should filter by follow type', async () => {
    // Given
    const mixedFollowing = [
      { ...mockFollowing[0], followType: 'family' },
      { ...mockFollowing[0], user: { ...mockFollowing[0].user, id: 'user-2' }, followType: 'watch' }
    ];
    const props = {
      following: mixedFollowing,
      selectedFilter: 'family',
      onFilterChange: jest.fn(),
      onLoadMore: jest.fn()
    };

    // When
    render(<FollowingList {...props} />);

    // Then
    expect(screen.getByTestId('follow-type-filter-family')).toHaveStyle({
      backgroundColor: expect.any(String) // アクティブな色
    });
  });
});