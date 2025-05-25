import { AuthProvider } from '@/context/AuthContext';
import AppNavigator from '@/navigation/AppNavigator';
import NetInfo from '@react-native-community/netinfo';
import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

describe('オフライン→オンライン同期テスト', () => {
  it('オフライン時の投稿がオンライン復帰後に送信される', async () => {
    // Arrange
    const { getByTestId, getByText } = render(
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    );

    // オフラインモードをシミュレート
    jest.spyOn(NetInfo, 'fetch').mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    });

    // Act - オフラインで投稿作成
    fireEvent.press(getByTestId('create-post-button'));
    fireEvent.press(getByText('テキスト投稿'));
    fireEvent.changeText(getByTestId('text-input'), 'オフライン投稿');
    fireEvent.press(getByTestId('submit-button'));

    // Assert - オフライン投稿として保存
    await waitFor(() => {
      expect(getByText('オフラインで保存されました')).toBeTruthy();
    });

    // Act - オンライン復帰
    jest.spyOn(NetInfo, 'fetch').mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });

    // オンライン復帰イベントを発火
    NetInfo.eventEmitter.emit('connectionChange', {
      isConnected: true,
      isInternetReachable: true,
    });

    // Assert - 投稿が送信される
    await waitFor(
      () => {
        expect(getByText('オフライン投稿')).toBeTruthy();
        expect(getByTestId('sync-indicator')).not.toBeTruthy();
      },
      { timeout: 10000 }
    );
  });
});
