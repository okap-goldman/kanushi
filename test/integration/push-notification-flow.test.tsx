import { AuthProvider } from '@/context/AuthContext';
import AppNavigator from '@/navigation/AppNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { render, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import React from 'react';

describe('プッシュ通知連携テスト', () => {
  beforeEach(() => {
    // プッシュ通知の権限をモック
    jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
      status: 'granted',
    });
  });

  it('いいね通知が正しく処理される', async () => {
    // Arrange
    const mockNotification = {
      request: {
        content: {
          title: '新しいいいね',
          body: 'テストユーザーがあなたの投稿にいいねしました',
          data: {
            type: 'like',
            postId: 'test-post-id',
          },
        },
      },
    };

    const { getByTestId } = render(
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    );

    // Act - 通知を受信
    const notificationListener = Notifications.addNotificationReceivedListener.mock.calls[0][0];
    notificationListener(mockNotification);

    // Assert - 通知バッジが表示される
    await waitFor(() => {
      expect(getByTestId('notification-badge')).toBeTruthy();
      expect(getByTestId('notification-badge')).toHaveTextContent('1');
    });

    // Act - 通知をタップ
    const responseListener = Notifications.addNotificationResponseReceivedListener.mock.calls[0][0];
    responseListener({
      notification: mockNotification,
      actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
    });

    // Assert - 該当の投稿画面に遷移
    await waitFor(() => {
      expect(getByTestId('post-detail-screen')).toBeTruthy();
      expect(getByTestId('post-id')).toHaveTextContent('test-post-id');
    });
  });
});
