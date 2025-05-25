import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from '@/navigation/AppNavigator';
import { AuthProvider } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Audio } from 'expo-av';

describe('投稿作成フロー結合テスト', () => {
  beforeEach(() => {
    // Supabaseクライアントの初期化
    jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'test-user-id' } }
    });
  });

  it('テキスト投稿の作成から表示まで', async () => {
    // Arrange
    const { getByTestId, getByText } = render(
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    );

    // Act - タイムライン画面で投稿作成ボタンをタップ
    await waitFor(() => {
      expect(getByTestId('create-post-button')).toBeTruthy();
    });
    fireEvent.press(getByTestId('create-post-button'));

    // Act - テキスト投稿を選択
    await waitFor(() => {
      expect(getByText('テキスト投稿')).toBeTruthy();
    });
    fireEvent.press(getByText('テキスト投稿'));

    // Act - テキストを入力
    const textInput = getByTestId('text-input');
    fireEvent.changeText(textInput, 'テスト投稿です #テスト');

    // Act - 投稿ボタンをタップ
    fireEvent.press(getByTestId('submit-button'));

    // Assert - タイムラインに戻り、投稿が表示される
    await waitFor(() => {
      expect(getByText('テスト投稿です #テスト')).toBeTruthy();
    }, { timeout: 5000 });
  });

  it('音声投稿の作成から再生まで', async () => {
    // Arrange
    const mockAudioUri = 'file://test-audio.m4a';
    const mockRecording = {
      startAsync: jest.fn(),
      stopAndUnloadAsync: jest.fn().mockResolvedValue({ uri: mockAudioUri }),
      getStatusAsync: jest.fn().mockResolvedValue({ durationMillis: 5000 })
    };
    
    Audio.Recording.createAsync = jest.fn().mockResolvedValue({
      recording: mockRecording
    });

    const { getByTestId, getByText } = render(
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    );

    // Act - 投稿作成画面へ
    fireEvent.press(getByTestId('create-post-button'));
    await waitFor(() => {
      expect(getByText('音声投稿')).toBeTruthy();
    });
    fireEvent.press(getByText('音声投稿'));

    // Act - 録音
    fireEvent.press(getByTestId('record-button'));
    await waitFor(() => {
      expect(getByTestId('stop-button')).toBeTruthy();
    });
    fireEvent.press(getByTestId('stop-button'));

    // Act - 投稿本文入力
    await waitFor(() => {
      expect(getByTestId('post-text-input')).toBeTruthy();
    });
    fireEvent.changeText(getByTestId('post-text-input'), '音声テスト投稿');

    // Act - 投稿
    fireEvent.press(getByTestId('submit-button'));

    // Assert - タイムラインで音声プレーヤーが表示される
    await waitFor(() => {
      expect(getByTestId('audio-player-post')).toBeTruthy();
      expect(getByText('音声テスト投稿')).toBeTruthy();
    }, { timeout: 5000 });
  });
});
