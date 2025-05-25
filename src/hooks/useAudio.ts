import { useState, useEffect, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';

/**
 * 音声再生オプション
 */
interface AudioOptions {
  usePreview?: boolean;
  initialRate?: number;
}

/**
 * 音声データ
 */
interface AudioData {
  url: string;
  previewUrl?: string;
  waveformUrl?: string;
  waveformData?: {
    waveform: number[];
    duration: number;
  };
  durationSeconds?: number;
}

/**
 * useAudioフックの戻り値
 */
interface UseAudioReturn {
  audio: Audio.Sound | null;
  isLoading: boolean;
  isPlaying: boolean;
  duration: number;
  position: number;
  error: string | null;
  waveformData: number[] | null;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (positionMillis: number) => Promise<void>;
  setRate: (rate: number) => Promise<void>;
}

/**
 * 音声再生を管理するカスタムフック
 * @param audioData 音声データまたはURL
 * @param options 再生オプション
 * @returns 音声再生の状態と制御関数
 */
export function useAudio(
  audioData: AudioData | string | null,
  options: AudioOptions = {}
): UseAudioReturn {
  const [audio, setAudio] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<number[] | null>(null);
  
  const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const { usePreview = false, initialRate = 1.0 } = options;

  const getAudioUrl = useCallback(() => {
    if (!audioData) return null;
    
    if (typeof audioData === 'string') {
      return audioData;
    }
    
    if (usePreview && audioData.previewUrl) {
      return audioData.previewUrl;
    }
    
    return audioData.url;
  }, [audioData, usePreview]);

  const loadWaveformData = useCallback(async () => {
    if (!audioData || typeof audioData === 'string') return;
    
    if (audioData.waveformData?.waveform) {
      setWaveformData(audioData.waveformData.waveform);
      return;
    }
    
    if (audioData.waveformUrl) {
      try {
        const response = await fetch(audioData.waveformUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.waveform && Array.isArray(data.waveform)) {
            setWaveformData(data.waveform);
          }
        }
      } catch (err) {
        console.error('Error loading waveform data:', err);
      }
    }
  }, [audioData]);

  const loadAudio = useCallback(async () => {
    const audioUrl = getAudioUrl();
    if (!audioUrl) return;

    try {
      setIsLoading(true);
      setError(null);

      // Unload previous audio if exists
      if (audio) {
        await audio.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false, rate: initialRate },
        onPlaybackStatusUpdate
      );

      if (initialRate !== 1.0) {
        await sound.setRateAsync(initialRate, true);
      }

      setAudio(sound);
      
      await loadWaveformData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audio');
      console.error('Error loading audio:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getAudioUrl, audio, initialRate, loadWaveformData]);

  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying || false);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    } else if (status.error) {
      setError(status.error);
    }
  }, []);

  const play = useCallback(async () => {
    if (!audio) return;

    try {
      await audio.playAsync();
      setIsPlaying(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play audio');
      console.error('Error playing audio:', err);
    }
  }, [audio]);

  const pause = useCallback(async () => {
    if (!audio) return;

    try {
      await audio.pauseAsync();
      setIsPlaying(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause audio');
      console.error('Error pausing audio:', err);
    }
  }, [audio]);

  const stop = useCallback(async () => {
    if (!audio) return;

    try {
      await audio.stopAsync();
      setIsPlaying(false);
      setPosition(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop audio');
      console.error('Error stopping audio:', err);
    }
  }, [audio]);

  const seek = useCallback(async (positionMillis: number) => {
    if (!audio) return;

    try {
      await audio.setPositionAsync(positionMillis);
      setPosition(positionMillis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seek audio');
      console.error('Error seeking audio:', err);
    }
  }, [audio]);

  const setRate = useCallback(async (rate: number) => {
    if (!audio) return;

    try {
      await audio.setRateAsync(rate, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set playback rate');
      console.error('Error setting playback rate:', err);
    }
  }, [audio]);

  // Load audio when data changes
  useEffect(() => {
    if (audioData) {
      loadAudio();
    }

    return () => {
      if (audio) {
        audio.unloadAsync();
      }
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
    };
  }, [audioData, loadAudio]);

  // Setup position update interval when playing
  useEffect(() => {
    if (isPlaying && audio) {
      positionUpdateInterval.current = setInterval(async () => {
        try {
          const status = await audio.getStatusAsync();
          if (status.isLoaded) {
            setPosition(status.positionMillis || 0);
          }
        } catch (err) {
          console.error('Error getting audio position:', err);
        }
      }, 1000);
    } else {
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
        positionUpdateInterval.current = null;
      }
    }

    return () => {
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
    };
  }, [isPlaying, audio]);

  return {
    audio,
    isLoading,
    isPlaying,
    duration,
    position,
    error,
    waveformData,
    play,
    pause,
    stop,
    seek,
    setRate
  };
}
