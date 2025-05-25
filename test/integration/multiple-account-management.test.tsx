import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import App from '../../App';
import { setupAuthenticatedUser, createTestAccount, mockGoogleSignIn } from '../setup/integration';
import * as userService from '../../src/lib/authService';

describe('Multiple Account Management Integration', () => {
  it('アカウント追加から切替まで', async () => {
    // Given - 認証済みユーザー
    const primaryUser = await setupAuthenticatedUser();
    const { getByTestId, getByText } = render(<App />);

    // When - プロフィール長押しでアカウント切替画面表示
    const profileIcon = getByTestId('profile-icon');
    fireEvent(profileIcon, 'onLongPress');

    // Then - アカウント切替画面が表示される
    await waitFor(() => {
      expect(getByText('アカウント切替')).toBeOnTheScreen();
    });

    // When - アカウント追加ボタンタップ
    const addAccountButton = getByText('アカウントを追加');
    fireEvent.press(addAccountButton);

    // Then - Google認証画面が表示される
    await waitFor(() => {
      expect(getByTestId('google-signin-button')).toBeOnTheScreen();
    });

    // When - 新しいGoogleアカウントで認証
    mockGoogleSignIn('second@example.com');
    const googleButton = getByTestId('google-signin-button');
    fireEvent.press(googleButton);

    // Then - 新アカウントでオンボーディング開始
    await waitFor(() => {
      expect(getByText('表示名を入力してください')).toBeOnTheScreen();
    });

    // When - オンボーディング完了
    const displayNameInput = getByTestId('display-name-input');
    fireEvent.changeText(displayNameInput, 'セカンドアカウント');
    fireEvent.press(getByText('次へ'));
    
    // ... オンボーディング工程をスキップ
    fireEvent.press(getByText('完了'));

    // Then - 新アカウントでホーム画面表示
    await waitFor(() => {
      expect(getByText('ファミリータイムライン')).toBeOnTheScreen();
    });

    // When - 再度アカウント切替画面を表示
    fireEvent(profileIcon, 'onLongPress');

    // Then - 2つのアカウントが表示される
    await waitFor(() => {
      expect(getByText('セカンドアカウント')).toBeOnTheScreen();
      expect(getByText(primaryUser.displayName)).toBeOnTheScreen();
    });

    // When - プライマリアカウントに切替
    fireEvent.press(getByText(primaryUser.displayName));

    // Then - プライマリアカウントの画面が表示される
    await waitFor(() => {
      const currentUser = userService.getCurrentUser();
      expect(currentUser.id).toBe(primaryUser.id);
    });
  });

  it('5アカウント制限のテスト', async () => {
    // Given - 既に5アカウント作成済み
    await Promise.all(Array(5).fill(null).map((_, i) => 
      createTestAccount(`user${i}@example.com`)
    ));

    const { getByTestId, getByText } = render(<App />);

    // When - アカウント切替画面表示
    const profileIcon = getByTestId('profile-icon');
    fireEvent(profileIcon, 'onLongPress');

    // Then - アカウント追加ボタンが無効
    await waitFor(() => {
      const addButton = getByText('アカウントを追加');
      expect(addButton).toBeDisabled();
    });

    // When - 無効なアカウント追加ボタンをタップ
    fireEvent.press(getByText('アカウントを追加'));

    // Then - エラーメッセージ表示
    await waitFor(() => {
      expect(getByText('アカウントは最大5つまで作成できます')).toBeOnTheScreen();
    });
  });
});