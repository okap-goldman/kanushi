import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { vi } from 'vitest';
import AudioPlayer from '@/components/AudioPlayer';
import { Audio } from 'expo-av';

describe('AudioPlayer Component', () => {
  const mockAudioPost = {
    id: 'audio-post-1',
    mediaUrl: 'https://example.com/audio.mp3',
    waveformUrl: 'https://example.com/waveform.png',
    durationSeconds: 180,
    aiMetadata: {
      summary: '瞑想に関する音声投稿'
    }
  };

  beforeEach(() => {
    // Audio APIのモックをリセット
    vi.clearAllMocks();
  });

  it('初期状態で再生ボタンが表示される', () => {
    // Arrange & Act
    const { getByTestId } = render(<AudioPlayer post={mockAudioPost} />);

    // Assert
    expect(getByTestId('play-button')).toBeTruthy();
    expect(getByTestId('audio-duration')).toHaveTextContent('3:00');
  });

  it('再生ボタンをタップすると音声が再生される', async () => {
    // Arrange
    const mockSoundObject = {
      playAsync: vi.fn().mockResolvedValue({}),
      pauseAsync: vi.fn().mockResolvedValue({}),
      getStatusAsync: vi.fn().mockResolvedValue({
        isLoaded: true,
        isPlaying: true,
        positionMillis: 0,
        durationMillis: 180000
      })
    };
    
    Audio.Sound.createAsync = vi.fn().mockResolvedValue({
      sound: mockSoundObject,
      status: { isLoaded: true }
    });

    const { getByTestId } = render(<AudioPlayer post={mockAudioPost} />);

    // Act
    fireEvent.press(getByTestId('play-button'));

    // Assert
    await waitFor(() => {
      expect(mockSoundObject.playAsync).toHaveBeenCalled();
      expect(getByTestId('pause-button')).toBeTruthy();
    });
  });

  it('シークバーで再生位置を変更できる', async () => {
    // Arrange
    const mockSoundObject = {
      setPositionAsync: vi.fn().mockResolvedValue({})
    };
    
    const { getByTestId } = render(
      <AudioPlayer post={mockAudioPost} sound={mockSoundObject} />
    );

    // Act
    const seekBar = getByTestId('seek-bar');
    fireEvent(seekBar, 'onValueChange', 90); // 90秒の位置

    // Assert
    await waitFor(() => {
      expect(mockSoundObject.setPositionAsync).toHaveBeenCalledWith(90000);
    });
  });

  it('波形が表示される', () => {
    // Arrange & Act
    const { getByTestId } = render(<AudioPlayer post={mockAudioPost} />);

    // Assert
    expect(getByTestId('waveform-image')).toHaveProp('source', {
      uri: mockAudioPost.waveformUrl
    });
  });

  it('AI要約が表示される', () => {
    // Arrange & Act
    const { getByText } = render(<AudioPlayer post={mockAudioPost} />);

    // Assert
    expect(getByText('瞑想に関する音声投稿')).toBeTruthy();
  });
});
