import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { createTestUser, createFollowRelation } from '../setup/integration';

// Mock services
jest.mock('@/services/followService', () => ({
  followUser: jest.fn(),
  unfollowUser: jest.fn(),
  getFollowers: jest.fn(),
  getFollowing: jest.fn(),
}));

jest.mock('@/services/notificationService', () => ({
  getNotifications: jest.fn(),
  sendPushNotification: jest.fn(),
}));

// Mock components
jest.mock('@/components/UserProfileScreen', () => 'UserProfileScreen');
jest.mock('@/components/FollowingListScreen', () => 'FollowingListScreen');
jest.mock('@/components/TimelineScreen', () => 'TimelineScreen');

describe('Family Follow Integration', () => {
  test('should complete family follow flow with notification', async () => {
    // Given
    const targetUser = await createTestUser({
      displayName: 'テストユーザー',
      notificationSettings: { follow: true }
    });
    const currentUser = await createTestUser({
      displayName: '現在のユーザー'
    });

    // When
    render(<UserProfileScreen userId={targetUser.id} />);
    
    // Step 1: Press follow button
    await act(() => {
      fireEvent.press(screen.getByText('フォロー'));
    });

    // Step 2: Select family follow
    await act(() => {
      fireEvent.press(screen.getByText('ファミリーフォロー'));
    });

    // Step 3: Enter reason
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('フォローする理由を入力してください'),
        '素晴らしい投稿をされているため'
      );
    });

    // Step 4: Submit follow
    await act(() => {
      fireEvent.press(screen.getByText('フォロー'));
    });

    // Then
    await waitFor(() => {
      expect(screen.getByText('フォロー中')).toBeOnTheScreen();
    });

    // Verify notification was sent
    const notifications = await getNotificationsForUser(targetUser.id);
    expect(notifications).toContainEqual(
      expect.objectContaining({
        type: 'follow',
        data: expect.objectContaining({
          followType: 'family',
          followerName: '現在のユーザー'
        })
      })
    );
  });
});

describe('Unfollow Integration', () => {
  test('should complete unfollow flow', async () => {
    // Given
    const targetUser = await createTestUser();
    const currentUser = await createTestUser();
    await createFollowRelation(currentUser.id, targetUser.id, 'watch');

    // When
    render(<UserProfileScreen userId={targetUser.id} />);
    
    // Step 1: Long press following button
    await act(() => {
      fireEvent(screen.getByText('フォロー中'), 'longPress');
    });

    // Step 2: Confirm unfollow
    await act(() => {
      fireEvent.press(screen.getByText('アンフォロー'));
    });

    // Step 3: Enter unfollow reason (optional)
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('理由を入力（任意）'),
        '投稿内容の方向性が変わったため'
      );
    });

    // Step 4: Confirm
    await act(() => {
      fireEvent.press(screen.getByText('確定'));
    });

    // Then
    await waitFor(() => {
      expect(screen.getByText('フォロー')).toBeOnTheScreen();
    });

    // Verify unfollow was recorded
    const followRecord = await getFollowRecord(currentUser.id, targetUser.id);
    expect(followRecord.status).toBe('unfollowed');
    expect(followRecord.unfollowReason).toBe('投稿内容の方向性が変わったため');
  });
});

describe('Real-time Follow Updates', () => {
  test('should update follower count in real-time', async () => {
    // Given
    const targetUser = await createTestUser();
    const follower1 = await createTestUser();
    const follower2 = await createTestUser();

    // When
    render(<UserProfileScreen userId={targetUser.id} />);
    
    // Initially 0 followers
    expect(screen.getByText('フォロワー: 0')).toBeOnTheScreen();

    // Simulate real-time follow from another user
    await simulateFollowFromAnotherUser(follower1.id, targetUser.id, 'family');

    // Then
    await waitFor(() => {
      expect(screen.getByText('フォロワー: 1')).toBeOnTheScreen();
    });

    // Another follow
    await simulateFollowFromAnotherUser(follower2.id, targetUser.id, 'watch');

    await waitFor(() => {
      expect(screen.getByText('フォロワー: 2')).toBeOnTheScreen();
    });
  });
});

describe('Follow Data Consistency', () => {
  test('should maintain follow state consistency across screens', async () => {
    // Given
    const targetUser = await createTestUser();
    const currentUser = await createTestUser();

    // When
    // Screen 1: Profile screen follow
    const { unmount: unmountProfile } = render(
      <UserProfileScreen userId={targetUser.id} />
    );
    
    await act(() => {
      fireEvent.press(screen.getByText('フォロー'));
    });
    await act(() => {
      fireEvent.press(screen.getByText('ウォッチフォロー'));
    });

    await waitFor(() => {
      expect(screen.getByText('フォロー中')).toBeOnTheScreen();
    });

    unmountProfile();

    // Screen 2: Following list should show the user
    render(<FollowingListScreen />);
    
    await waitFor(() => {
      expect(screen.getByText(targetUser.displayName)).toBeOnTheScreen();
    });

    // Screen 3: Timeline should show posts from followed user
    render(<TimelineScreen type="watch" />);
    
    // Create a post from the followed user
    await createPostFromUser(targetUser.id, {
      contentType: 'text',
      textContent: 'テスト投稿'
    });

    await waitFor(() => {
      expect(screen.getByText('テスト投稿')).toBeOnTheScreen();
    });
  });
});

// Helper functions for integration tests
async function getNotificationsForUser(userId) {
  // Implementation would be added here
  return [
    { 
      type: 'follow',
      data: {
        followType: 'family',
        followerName: '現在のユーザー'
      }
    }
  ];
}

async function getFollowRecord(followerId, followeeId) {
  // Implementation would be added here
  return {
    status: 'unfollowed',
    unfollowReason: '投稿内容の方向性が変わったため'
  };
}

async function simulateFollowFromAnotherUser(followerId, followeeId, type) {
  // Implementation would be added here
  return { success: true };
}

async function createPostFromUser(userId, postData) {
  // Implementation would be added here
  return { id: 'post-123', ...postData };
}