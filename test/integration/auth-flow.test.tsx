import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import App from '../../App';
import * as userService from '../../src/lib/authService';
import {
  createMockNavigation,
  createTestUser,
  mockGoogleSignIn,
  mockGoogleSignInError,
  resetTestDatabase,
} from '../setup/integration';

describe('Authentication Flow Integration', () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it('新規ユーザー登録からオンボーディング完了まで', async () => {
    // Given
    const navigation = createMockNavigation();
    const { getByTestId, getByText } = render(
      <NavigationContainer>
        <App />
      </NavigationContainer>
    );

    // When - ログイン画面でGoogle認証
    const googleButton = getByTestId('google-signin-button');
    fireEvent.press(googleButton);

    // Then - オンボーディング画面に遷移
    await waitFor(() => {
      expect(getByText('表示名を入力してください')).toBeOnTheScreen();
    });

    // When - 表示名入力
    const displayNameInput = getByTestId('display-name-input');
    fireEvent.changeText(displayNameInput, 'テストユーザー');
    fireEvent.press(getByText('次へ'));

    // Then - 自己紹介文入力画面に遷移
    await waitFor(() => {
      expect(getByText('自己紹介文を入力してください')).toBeOnTheScreen();
    });

    // When - 自己紹介文をスキップ
    fireEvent.press(getByText('スキップ'));

    // Then - プロフィール画像設定画面に遷移
    await waitFor(() => {
      expect(getByText('プロフィール画像を設定してください')).toBeOnTheScreen();
    });

    // When - プロフィール画像をスキップ
    fireEvent.press(getByText('スキップ'));

    // Then - 音声録音画面に遷移
    await waitFor(() => {
      expect(getByText('自己紹介音声を録音してください')).toBeOnTheScreen();
    });

    // When - 音声録音をスキップ
    fireEvent.press(getByText('スキップ'));

    // Then - 外部リンク設定画面に遷移
    await waitFor(() => {
      expect(getByText('外部リンクを設定してください')).toBeOnTheScreen();
    });

    // When - 完了ボタンをタップ
    fireEvent.press(getByText('完了'));

    // Then - ホーム画面に遷移
    await waitFor(() => {
      expect(getByText('ファミリータイムライン')).toBeOnTheScreen();
    });

    // Then - ユーザーデータが正しく保存されている
    const savedUser = await userService.getCurrentUser();
    expect(savedUser.displayName).toBe('テストユーザー');
  });

  it('既存ユーザーのログイン', async () => {
    // Given - 既存ユーザーをDB作成
    const existingUser = await createTestUser({
      displayName: '既存ユーザー',
      email: 'existing@example.com',
    });

    const { getByTestId, getByText } = render(
      <NavigationContainer>
        <App />
      </NavigationContainer>
    );

    // When - ログイン画面でGoogle認証（既存ユーザー）
    mockGoogleSignIn(existingUser.email);
    const googleButton = getByTestId('google-signin-button');
    fireEvent.press(googleButton);

    // Then - 直接ホーム画面に遷移（オンボーディングスキップ）
    await waitFor(
      () => {
        expect(getByText('ファミリータイムライン')).toBeOnTheScreen();
      },
      { timeout: 5000 }
    );

    // Then - 正しいユーザー情報が取得される
    const currentUser = await userService.getCurrentUser();
    expect(currentUser.id).toBe(existingUser.id);
    expect(currentUser.displayName).toBe('既存ユーザー');
  });

  it('認証エラーハンドリング', async () => {
    // Given
    mockGoogleSignInError('INVALID_TOKEN');
    const { getByTestId, getByText } = render(<App />);

    // When
    const googleButton = getByTestId('google-signin-button');
    fireEvent.press(googleButton);

    // Then
    await waitFor(() => {
      expect(getByText('認証に失敗しました。もう一度お試しください。')).toBeOnTheScreen();
    });

    // Then - ログイン画面に留まる
    expect(getByText('Googleアカウント連携')).toBeOnTheScreen();
  });
});
