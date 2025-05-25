import { renderHook, act } from '@testing-library/react-hooks';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAudio } from '../../src/hooks/useAudio';

vi.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: vi.fn(async (source, initialStatus, onPlaybackStatusUpdate) => {
        const mockSound = {
          playAsync: vi.fn(),
          pauseAsync: vi.fn(),
          stopAsync: vi.fn(),
          setPositionAsync: vi.fn(),
          setRateAsync: vi.fn(),
          unloadAsync: vi.fn(),
          getStatusAsync: vi.fn().mockResolvedValue({
            isLoaded: true,
            positionMillis: 30000,
            durationMillis: 180000,
            isPlaying: true,
          }),
        };
        
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
}));

global.fetch = vi.fn().mockImplementation((url) => {
  if (url.includes('waveform')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        waveform: Array(100).fill(0).map(() => Math.random()),
        duration: 180,
      }),
    });
  }
  return Promise.resolve({
    ok: false,
  });
});

describe('useAudio Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('文字列URLで音声を読み込む', async () => {
    const { Audio } = await import('expo-av');
    const { result, waitForNextUpdate } = renderHook(() => 
      useAudio('https://example.com/audio.mp3')
    );

    expect(result.current.isLoading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
      { uri: 'https://example.com/audio.mp3' },
      { shouldPlay: false, rate: 1.0 },
      expect.any(Function)
    );
  });

  it('AudioDataオブジェクトで音声を読み込む', async () => {
    const { Audio } = await import('expo-av');
    const audioData = {
      url: 'https://example.com/audio.mp3',
      waveformUrl: 'https://example.com/waveform.json',
      durationSeconds: 180,
    };
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useAudio(audioData)
    );
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
      { uri: 'https://example.com/audio.mp3' },
      { shouldPlay: false, rate: 1.0 },
      expect.any(Function)
    );
    
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/waveform.json');
    expect(result.current.waveformData).not.toBeNull();
  });

  it('usePreview=trueでプレビューURLを使用する', async () => {
    const { Audio } = await import('expo-av');
    const audioData = {
      url: 'https://example.com/audio.mp3',
      previewUrl: 'https://example.com/preview.mp3',
    };
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useAudio(audioData, { usePreview: true })
    );
    
    await waitForNextUpdate();
    
    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
      { uri: 'https://example.com/preview.mp3' },
      { shouldPlay: false, rate: 1.0 },
      expect.any(Function)
    );
  });

  it('再生・一時停止・停止が機能する', async () => {
    const { Audio } = await import('expo-av');
    const { result, waitForNextUpdate } = renderHook(() => 
      useAudio('https://example.com/audio.mp3')
    );
    
    await waitForNextUpdate();
    
    await act(async () => {
      await result.current.play();
    });
    
    expect(result.current.audio?.playAsync).toHaveBeenCalled();
    
    await act(async () => {
      await result.current.pause();
    });
    
    expect(result.current.audio?.pauseAsync).toHaveBeenCalled();
    
    await act(async () => {
      await result.current.stop();
    });
    
    expect(result.current.audio?.stopAsync).toHaveBeenCalled();
  });

  it('シーク機能が動作する', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useAudio('https://example.com/audio.mp3')
    );
    
    await waitForNextUpdate();
    
    await act(async () => {
      await result.current.seek(60000);
    });
    
    expect(result.current.audio?.setPositionAsync).toHaveBeenCalledWith(60000);
  });

  it('再生速度の変更が機能する', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useAudio('https://example.com/audio.mp3')
    );
    
    await waitForNextUpdate();
    
    await act(async () => {
      await result.current.setRate(1.5);
    });
    
    expect(result.current.audio?.setRateAsync).toHaveBeenCalledWith(1.5, true);
  });

  it('初期再生速度を設定できる', async () => {
    const { Audio } = await import('expo-av');
    const { waitForNextUpdate } = renderHook(() => 
      useAudio('https://example.com/audio.mp3', { initialRate: 1.5 })
    );
    
    await waitForNextUpdate();
    
    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
      { uri: 'https://example.com/audio.mp3' },
      { shouldPlay: false, rate: 1.5 },
      expect.any(Function)
    );
  });

  it('波形データが直接提供されている場合はそれを使用する', async () => {
    const waveformData = Array(100).fill(0).map(() => Math.random());
    const audioData = {
      url: 'https://example.com/audio.mp3',
      waveformData: {
        waveform: waveformData,
        duration: 180,
      },
    };
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useAudio(audioData)
    );
    
    await waitForNextUpdate();
    
    expect(result.current.waveformData).toEqual(waveformData);
    expect(global.fetch).not.toHaveBeenCalled(); // fetchは呼ばれない
  });
});
