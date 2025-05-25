import { useState, useEffect, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';

interface UseAudioReturn {
  audio: Audio.Sound | null;
  isLoading: boolean;
  isPlaying: boolean;
  duration: number;
  position: number;
  error: string | null;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (positionMillis: number) => Promise<void>;
  setRate: (rate: number) => Promise<void>;
}

export function useAudio(audioUrl: string | null): UseAudioReturn {
  const [audio, setAudio] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  const loadAudio = useCallback(async () => {
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
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      setAudio(sound);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audio');
      console.error('Error loading audio:', err);
    } finally {
      setIsLoading(false);
    }
  }, [audioUrl]);

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

  // Load audio when URL changes
  useEffect(() => {
    if (audioUrl) {
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
  }, [audioUrl, loadAudio]);

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
    play,
    pause,
    stop,
    seek,
    setRate
  };
}