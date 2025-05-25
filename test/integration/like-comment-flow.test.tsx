import { AuthProvider } from '@/context/AuthContext';
import AppNavigator from '@/navigation/AppNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, waitFor, within } from '@testing-library/react-native';
import React from 'react';

describe('いいね・コメント機能の連携テスト', () => {
  it('いいねとコメントが同期的に更新される', async () => {
    // Arrange
    const { getByTestId, getByText, getAllByTestId } = render(
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getAllByTestId(/^post-/).length).toBeGreaterThan(0);
    });

    const firstPost = getAllByTestId(/^post-/)[0];

    // Act - いいね
    const likeButton = within(firstPost).getByTestId('like-button');
    fireEvent.press(likeButton);

    // Assert - いいね数が増える
    await waitFor(() => {
      const likeCount = within(firstPost).getByTestId('like-count');
      expect(parseInt(likeCount.props.children)).toBeGreaterThan(0);
    });

    // Act - コメント
    const commentButton = within(firstPost).getByTestId('comment-button');
    fireEvent.press(commentButton);

    await waitFor(() => {
      expect(getByTestId('comment-input')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('comment-input'), 'テストコメント');
    fireEvent.press(getByTestId('send-comment-button'));

    // Assert - コメントが追加される
    await waitFor(() => {
      expect(getByText('テストコメント')).toBeTruthy();
      const commentCount = within(firstPost).getByTestId('comment-count');
      expect(parseInt(commentCount.props.children)).toBeGreaterThan(0);
    });
  });
});
