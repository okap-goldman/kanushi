import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AudioPlayer from '../../src/components/AudioPlayer';

// モックの設定
vi.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: vi.fn(async (source, initialStatus, onPlaybackStatusUpdate) => {
        const mockSound = {
          playAsync: vi.fn(),
          pauseAsync: vi.fn(),
          setPositionAsync: vi.fn(),
          unloadAsync: vi.fn(),
        };
        
        // 初期ステータスを送信
        setTimeout(() => {
          onPlaybackStatusUpdate?.({
            isLoaded: true,
            isPlaying: false,
            positionMillis: 0,
            durationMillis: 180000,
          });
        }, 0);
        
        return { sound: mockSound };
      }),
    },
  },
  AVPlaybackStatus: {},
}));

vi.mock('@expo/vector-icons', () => ({
  Feather: ({ name, size, color }: any) => ({ testID: `icon-${name}`, children: name }),
}));

vi.mock('../../src/components/ui/slider', () => ({
  Slider: ({ onValueChange, value, testID }: any) => (
    <input
      type="range"
      value={value}
      onChange={(e) => onValueChange?.(Number(e.target.value))}
      data-testid={testID}
    />
  ),
}));

describe('AudioPlayer Component', () => {
  const mockPost = {
    id: 'audio-1',
    mediaUrl: 'https://example.com/audio.mp3',
    waveformUrl: 'https://example.com/waveform.png',
    durationSeconds: 180,
    aiMetadata: {
      summary: 'これは音声コンテンツの要約です',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態で正しく表示される', () => {
    const { getByTestId, getByText } = render(<AudioPlayer post={mockPost} />);

    expect(getByTestId('waveform-container')).toBeTruthy();
    
    // 波形画像が表示される（waveformDataがない場合はURLから画像を表示）
    expect(getByTestId('waveform-image')).toBeTruthy();
    
    // 再生ボタンが表示される
    expect(getByTestId('play-button')).toBeTruthy();
    
    // シークバーが表示される
    expect(getByTestId('seek-bar')).toBeTruthy();
    
    // 時間表示（初期値は0:00と3:00）
    expect(getByText('0:00')).toBeTruthy();
    expect(getByTestId('audio-duration')).toBeTruthy();
    
    // AI要約が表示される
    expect(getByText('これは音声コンテンツの要約です')).toBeTruthy();
  });

  it('再生ボタンをクリックすると音声が読み込まれる', async () => {
    const { Audio } = await import('expo-av');
    const { getByTestId } = render(<AudioPlayer post={mockPost} />);

    // 再生ボタンをクリック
    const playButton = getByTestId('play-button');
    fireEvent.press(playButton);

    // Audio.Sound.createAsyncが呼ばれる
    await waitFor(() => {
      expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
        { uri: mockPost.mediaUrl },
        { shouldPlay: false },
        expect.any(Function)
      );
    });
  });
  
  it('usePreview=trueでプレビューURLがある場合はプレビューが使用される', async () => {
    const { Audio } = await import('expo-av');
    const postWithPreview = {
      ...mockPost,
      previewUrl: 'https://example.com/preview.mp3',
    };
    
    const { getByTestId } = render(<AudioPlayer post={postWithPreview} usePreview={true} />);

    // 再生ボタンをクリック
    const playButton = getByTestId('play-button');
    fireEvent.press(playButton);

    await waitFor(() => {
      expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
        { uri: postWithPreview.previewUrl },
        { shouldPlay: false },
        expect.any(Function)
      );
    });
  });

  it('再生/一時停止が切り替わる', async () => {
    const { Audio } = await import('expo-av');
    const mockSound = {
      playAsync: vi.fn(),
      pauseAsync: vi.fn(),
      setPositionAsync: vi.fn(),
      unloadAsync: vi.fn(),
    };
    
    (Audio.Sound.createAsync as any).mockResolvedValueOnce({ sound: mockSound });
    
    const { getByTestId } = render(<AudioPlayer post={mockPost} />);

    // 最初は再生ボタン
    expect(getByTestId('play-button')).toBeTruthy();

    // 再生ボタンをクリック
    fireEvent.press(getByTestId('play-button'));

    // 音声が読み込まれるのを待つ
    await waitFor(() => {
      expect(Audio.Sound.createAsync).toHaveBeenCalled();
    });

    // もう一度クリックすると再生される
    fireEvent.press(getByTestId('play-button'));
    
    await waitFor(() => {
      expect(mockSound.playAsync).toHaveBeenCalled();
    });
  });

  it('シークバーで位置を変更できる', async () => {
    const { Audio } = await import('expo-av');
    const mockSound = {
      playAsync: vi.fn(),
      pauseAsync: vi.fn(),
      setPositionAsync: vi.fn(),
      unloadAsync: vi.fn(),
    };
    
    (Audio.Sound.createAsync as any).mockImplementation(async (source: any, initialStatus: any, onPlaybackStatusUpdate: any) => {
      // 音声が読み込まれた状態を通知
      setTimeout(() => {
        onPlaybackStatusUpdate?.({
          isLoaded: true,
          isPlaying: true,
          positionMillis: 0,
          durationMillis: 180000,
        });
      }, 0);
      
      return { sound: mockSound };
    });
    
    const { getByTestId } = render(<AudioPlayer post={mockPost} />);

    // 再生ボタンをクリックして音声を読み込む
    fireEvent.press(getByTestId('play-button'));
    
    await waitFor(() => {
      expect(Audio.Sound.createAsync).toHaveBeenCalled();
    });

    // シークバーを操作
    const seekBar = getByTestId('seek-bar');
    fireEvent(seekBar, 'valueChange', 90000);

    await waitFor(() => {
      expect(mockSound.setPositionAsync).toHaveBeenCalledWith(90000);
    });
  });

  it('波形画像がない場合でも波形コンテナは表示される', () => {
    const postWithoutWaveform = {
      ...mockPost,
      waveformUrl: undefined,
    };
    
    const { queryByTestId } = render(<AudioPlayer post={postWithoutWaveform} />);
    
    expect(queryByTestId('waveform-container')).toBeTruthy();
    expect(queryByTestId('waveform-image')).toBeNull();
  });
  
  it('showWaveform=falseの場合は波形が表示されない', () => {
    const { queryByTestId } = render(<AudioPlayer post={mockPost} showWaveform={false} />);
    
    expect(queryByTestId('waveform-container')).toBeNull();
  });
  
  it('waveformDataがある場合は波形可視化が表示される', () => {
    const postWithWaveformData = {
      ...mockPost,
      waveformData: {
        waveform: Array(100).fill(0).map(() => Math.random()),
        duration: 180,
      },
    };
    
    const { queryByTestId } = render(<AudioPlayer post={postWithWaveformData} />);
    
    expect(queryByTestId('waveform-container')).toBeTruthy();
    expect(queryByTestId('waveform-image')).toBeNull();
  });

  it('AI要約がない場合は表示されない', () => {
    const postWithoutSummary = {
      ...mockPost,
      aiMetadata: undefined,
    };
    
    const { queryByText } = render(<AudioPlayer post={postWithoutSummary} />);
    
    expect(queryByText('これは音声コンテンツの要約です')).toBeNull();
  });

  it('時間が正しくフォーマットされる', () => {
    const { getByText, getByTestId } = render(<AudioPlayer post={mockPost} />);
    
    // 初期状態の時間表示
    expect(getByText('0:00')).toBeTruthy();
    expect(getByTestId('audio-duration').props.children).toBe('3:00');
  });

  it('ローディング中はローダーアイコンが表示される', async () => {
    const { Audio } = await import('expo-av');
    
    // createAsyncを遅延させる
    (Audio.Sound.createAsync as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    const { getByTestId } = render(<AudioPlayer post={mockPost} />);

    // 再生ボタンをクリック
    fireEvent.press(getByTestId('play-button'));

    // ローダーアイコンが表示される
    expect(getByTestId('icon-loader')).toBeTruthy();
  });

  it('エラーが発生してもクラッシュしない', async () => {
    const { Audio } = await import('expo-av');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // エラーを発生させる
    (Audio.Sound.createAsync as any).mockRejectedValueOnce(new Error('Failed to load audio'));
    
    const { getByTestId } = render(<AudioPlayer post={mockPost} />);

    // 再生ボタンをクリック
    fireEvent.press(getByTestId('play-button'));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading audio:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('コンポーネントがアンマウントされると音声がアンロードされる', async () => {
    const { Audio } = await import('expo-av');
    const mockSound = {
      playAsync: vi.fn(),
      pauseAsync: vi.fn(),
      setPositionAsync: vi.fn(),
      unloadAsync: vi.fn(),
    };
    
    (Audio.Sound.createAsync as any).mockResolvedValueOnce({ sound: mockSound });
    
    const { getByTestId, unmount } = render(<AudioPlayer post={mockPost} />);

    // 音声を読み込む
    fireEvent.press(getByTestId('play-button'));
    
    await waitFor(() => {
      expect(Audio.Sound.createAsync).toHaveBeenCalled();
    });

    // コンポーネントをアンマウント
    unmount();

    // unloadAsyncが呼ばれる
    expect(mockSound.unloadAsync).toHaveBeenCalled();
  });
});
