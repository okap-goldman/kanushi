import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MiniAudioPlayer } from '../../src/components/audio/MiniAudioPlayer';

// Mock Audio player
const mockAudio = {
  play: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  seek: jest.fn(),
  setRate: jest.fn(),
  getDuration: jest.fn().mockResolvedValue(120000), // 2 minutes
  getPosition: jest.fn().mockResolvedValue(30000), // 30 seconds
};

jest.mock('../../src/hooks/useAudio', () => ({
  useAudio: () => ({
    audio: mockAudio,
    isLoading: false,
    isPlaying: false,
    duration: 120000,
    position: 30000,
    play: mockAudio.play,
    pause: mockAudio.pause,
    stop: mockAudio.stop,
    seek: mockAudio.seek,
    setRate: mockAudio.setRate
  })
}));

// Mock Expo Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
  MaterialIcons: 'MaterialIcons'
}));

describe('MiniAudioPlayer Component', () => {
  const defaultProps = {
    audioUrl: 'https://example.com/audio.mp3',
    title: 'Test Audio',
    author: 'Test Author',
    waveformData: [0.1, 0.5, 0.8, 0.3, 0.6, 0.9, 0.2, 0.7],
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct title and author', () => {
    const { getByText } = render(
      <MiniAudioPlayer {...defaultProps} />
    );

    expect(getByText('Test Audio')).toBeTruthy();
    expect(getByText('Test Author')).toBeTruthy();
  });

  it('displays play button when audio is not playing', () => {
    const { getByTestId } = render(
      <MiniAudioPlayer {...defaultProps} />
    );

    expect(getByTestId('play-button')).toBeTruthy();
  });

  it('plays audio when play button is pressed', () => {
    const { getByTestId } = render(
      <MiniAudioPlayer {...defaultProps} />
    );

    const playButton = getByTestId('play-button');
    fireEvent.press(playButton);

    expect(mockAudio.play).toHaveBeenCalled();
  });

  it('displays pause button when audio is playing', () => {
    // Mock playing state
    jest.doMock('../../src/hooks/useAudio', () => ({
      useAudio: () => ({
        audio: mockAudio,
        isLoading: false,
        isPlaying: true,
        duration: 120000,
        position: 30000,
        play: mockAudio.play,
        pause: mockAudio.pause,
        stop: mockAudio.stop,
        seek: mockAudio.seek,
        setRate: mockAudio.setRate
      })
    }));

    const { getByTestId } = render(
      <MiniAudioPlayer {...defaultProps} />
    );

    expect(getByTestId('pause-button')).toBeTruthy();
  });

  it('pauses audio when pause button is pressed', () => {
    // Mock playing state
    jest.doMock('../../src/hooks/useAudio', () => ({
      useAudio: () => ({
        audio: mockAudio,
        isLoading: false,
        isPlaying: true,
        duration: 120000,
        position: 30000,
        play: mockAudio.play,
        pause: mockAudio.pause,
        stop: mockAudio.stop,
        seek: mockAudio.seek,
        setRate: mockAudio.setRate
      })
    }));

    const { getByTestId } = render(
      <MiniAudioPlayer {...defaultProps} />
    );

    const pauseButton = getByTestId('pause-button');
    fireEvent.press(pauseButton);

    expect(mockAudio.pause).toHaveBeenCalled();
  });

  it('displays waveform correctly', () => {
    const { getByTestId } = render(
      <MiniAudioPlayer {...defaultProps} />
    );

    expect(getByTestId('waveform-container')).toBeTruthy();
    
    // Check that waveform bars are rendered
    const waveformBars = getByTestId('waveform-bars');
    expect(waveformBars).toBeTruthy();
  });

  it('seeks to position when waveform is tapped', () => {
    const { getByTestId } = render(
      <MiniAudioPlayer {...defaultProps} />
    );

    const waveform = getByTestId('waveform-container');
    
    // Simulate tap at 50% position
    fireEvent.press(waveform, {
      nativeEvent: {
        locationX: 150, // Half of 300px width
        target: { offsetWidth: 300 }
      }
    });

    // Should seek to 50% of duration (60 seconds)
    expect(mockAudio.seek).toHaveBeenCalledWith(60000);
  });

  it('displays current time and duration', () => {
    const { getByText } = render(
      <MiniAudioPlayer {...defaultProps} />
    );

    expect(getByText('0:30')).toBeTruthy(); // Current position
    expect(getByText('2:00')).toBeTruthy(); // Duration
  });

  it('calls onClose when close button is pressed', () => {
    const mockOnClose = jest.fn();
    const { getByTestId } = render(
      <MiniAudioPlayer {...defaultProps} onClose={mockOnClose} />
    );

    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays loading state correctly', () => {
    // Mock loading state
    jest.doMock('../../src/hooks/useAudio', () => ({
      useAudio: () => ({
        audio: mockAudio,
        isLoading: true,
        isPlaying: false,
        duration: 0,
        position: 0,
        play: mockAudio.play,
        pause: mockAudio.pause,
        stop: mockAudio.stop,
        seek: mockAudio.seek,
        setRate: mockAudio.setRate
      })
    }));

    const { getByTestId } = render(
      <MiniAudioPlayer {...defaultProps} />
    );

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('supports playback rate control', () => {
    const { getByTestId } = render(
      <MiniAudioPlayer {...defaultProps} showPlaybackRate={true} />
    );

    const rateButton = getByTestId('playback-rate-button');
    fireEvent.press(rateButton);

    // Should cycle through rates: 1x -> 1.25x -> 1.5x -> 2x -> 1x
    expect(mockAudio.setRate).toHaveBeenCalledWith(1.25);
  });

  it('displays progress correctly on waveform', () => {
    const { getByTestId } = render(
      <MiniAudioPlayer {...defaultProps} />
    );

    const progressIndicator = getByTestId('waveform-progress');
    expect(progressIndicator).toBeTruthy();
    
    // Progress should be 25% (30s / 120s)
    // This would be tested by checking the width style of the progress bar
  });

  it('handles audio errors gracefully', () => {
    // Mock error state
    jest.doMock('../../src/hooks/useAudio', () => ({
      useAudio: () => ({
        audio: null,
        isLoading: false,
        isPlaying: false,
        duration: 0,
        position: 0,
        error: 'Failed to load audio',
        play: jest.fn(),
        pause: jest.fn(),
        stop: jest.fn(),
        seek: jest.fn(),
        setRate: jest.fn()
      })
    }));

    const { getByTestId, getByText } = render(
      <MiniAudioPlayer {...defaultProps} />
    );

    expect(getByText('音声の読み込みに失敗しました')).toBeTruthy();
    expect(getByTestId('retry-button')).toBeTruthy();
  });

  it('can be minimized and expanded', () => {
    const { getByTestId } = render(
      <MiniAudioPlayer {...defaultProps} minimizable={true} />
    );

    const minimizeButton = getByTestId('minimize-button');
    fireEvent.press(minimizeButton);

    // Should show minimized state
    expect(getByTestId('mini-player-minimized')).toBeTruthy();
    
    // Click to expand again
    const miniPlayer = getByTestId('mini-player-minimized');
    fireEvent.press(miniPlayer);
    
    expect(getByTestId('mini-player-expanded')).toBeTruthy();
  });
});