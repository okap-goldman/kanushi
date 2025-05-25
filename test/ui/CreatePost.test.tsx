import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreatePost from '@/screens/CreatePost';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

describe('CreatePost Screen', () => {
  it('メディアタイプ選択が表示される', () => {
    // Arrange & Act
    const { getByText } = render(<CreatePost />);

    // Assert
    expect(getByText('音声投稿')).toBeTruthy();
    expect(getByText('画像投稿')).toBeTruthy();
    expect(getByText('テキスト投稿')).toBeTruthy();
  });

  describe('音声投稿', () => {
    it('録音を開始・停止できる', async () => {
      // Arrange
      const mockRecording = {
        startAsync: jest.fn(),
        stopAndUnloadAsync: jest.fn().mockResolvedValue({
          uri: 'file://audio.m4a'
        }),
        getStatusAsync: jest.fn().mockResolvedValue({
          durationMillis: 5000
        })
      };
      
      Audio.Recording.createAsync = jest.fn().mockResolvedValue({
        recording: mockRecording
      });

      const { getByText, getByTestId } = render(<CreatePost />);
      fireEvent.press(getByText('音声投稿'));

      // Act
      fireEvent.press(getByTestId('record-button'));
      
      // Assert
      await waitFor(() => {
        expect(getByTestId('recording-indicator')).toBeTruthy();
      });

      // Act
      fireEvent.press(getByTestId('stop-button'));

      // Assert
      await waitFor(() => {
        expect(mockRecording.stopAndUnloadAsync).toHaveBeenCalled();
        expect(getByTestId('audio-preview')).toBeTruthy();
      });
    });

    it('ファイル選択ができる', async () => {
      // Arrange
      ImagePicker.launchImageLibraryAsync = jest.fn().mockResolvedValue({
        cancelled: false,
        assets: [{
          uri: 'file://audio.mp3',
          type: 'audio'
        }]
      });

      const { getByText, getByTestId } = render(<CreatePost />);
      fireEvent.press(getByText('音声投稿'));

      // Act
      fireEvent.press(getByTestId('file-select-button'));

      // Assert
      await waitFor(() => {
        expect(getByTestId('audio-preview')).toBeTruthy();
      });
    });
  });

  describe('画像投稿', () => {
    it('カメラで撮影できる', async () => {
      // Arrange
      ImagePicker.requestCameraPermissionsAsync = jest.fn().mockResolvedValue({
        granted: true
      });
      
      ImagePicker.launchCameraAsync = jest.fn().mockResolvedValue({
        cancelled: false,
        assets: [{
          uri: 'file://photo.jpg',
          width: 1920,
          height: 1080
        }]
      });

      const { getByText, getByTestId } = render(<CreatePost />);
      fireEvent.press(getByText('画像投稿'));

      // Act
      fireEvent.press(getByTestId('camera-button'));

      // Assert
      await waitFor(() => {
        expect(getByTestId('image-preview')).toBeTruthy();
        expect(getByTestId('image-preview')).toHaveProp('source', {
          uri: 'file://photo.jpg'
        });
      });
    });

    it('ギャラリーから選択できる', async () => {
      // Arrange
      ImagePicker.launchImageLibraryAsync = jest.fn().mockResolvedValue({
        cancelled: false,
        assets: [{
          uri: 'file://gallery.jpg',
          width: 1920,
          height: 1080
        }]
      });

      const { getByText, getByTestId } = render(<CreatePost />);
      fireEvent.press(getByText('画像投稿'));

      // Act
      fireEvent.press(getByTestId('gallery-button'));

      // Assert
      await waitFor(() => {
        expect(getByTestId('image-preview')).toBeTruthy();
      });
    });
  });

  describe('テキスト投稿', () => {
    it('文字数カウントが表示される', () => {
      // Arrange
      const { getByText, getByTestId } = render(<CreatePost />);
      fireEvent.press(getByText('テキスト投稿'));

      // Act
      const textInput = getByTestId('text-input');
      fireEvent.changeText(textInput, 'テスト投稿です');

      // Assert
      expect(getByTestId('char-count')).toHaveTextContent('7 / 10000');
    });

    it('10,000文字を超えると警告が表示される', () => {
      // Arrange
      const { getByText, getByTestId } = render(<CreatePost />);
      fireEvent.press(getByText('テキスト投稿'));

      // Act
      const longText = 'あ'.repeat(10001);
      const textInput = getByTestId('text-input');
      fireEvent.changeText(textInput, longText);

      // Assert
      expect(getByTestId('char-count')).toHaveStyle({ color: 'red' });
      expect(getByTestId('submit-button')).toBeDisabled();
    });
  });

  it('ハッシュタグを追加できる', () => {
    // Arrange
    const { getByText, getByTestId, getAllByTestId } = render(<CreatePost />);
    fireEvent.press(getByText('テキスト投稿'));

    // Act
    const hashtagInput = getByTestId('hashtag-input');
    fireEvent.changeText(hashtagInput, '目醒め');
    fireEvent.press(getByTestId('add-hashtag-button'));

    // Assert
    expect(getAllByTestId(/^hashtag-chip-/)).toHaveLength(1);
    expect(getByText('#目醒め')).toBeTruthy();
  });

  it('最大5個までハッシュタグを追加できる', () => {
    // Arrange
    const { getByText, getByTestId, getAllByTestId } = render(<CreatePost />);
    fireEvent.press(getByText('テキスト投稿'));

    // Act
    const hashtags = ['タグ1', 'タグ2', 'タグ3', 'タグ4', 'タグ5', 'タグ6'];
    const hashtagInput = getByTestId('hashtag-input');
    
    hashtags.forEach(tag => {
      fireEvent.changeText(hashtagInput, tag);
      fireEvent.press(getByTestId('add-hashtag-button'));
    });

    // Assert
    expect(getAllByTestId(/^hashtag-chip-/)).toHaveLength(5);
    expect(getByTestId('hashtag-limit-warning')).toBeTruthy();
  });
});
