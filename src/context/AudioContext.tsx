import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';

export interface AudioTrack {
  id: string;
  title: string;
  author: string;
  audioUrl: string;
  waveformData?: number[];
  coverUrl?: string;
  duration?: number;
  postId?: string; // 投稿IDを追加
}

interface AudioContextProps {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  position: number;
  duration: number;
  error: string | null;
  isPlayerVisible: boolean;
  isFullScreenVisible: boolean;
  playTrack: (track: AudioTrack) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setRate: (rate: number) => Promise<void>;
  showPlayer: () => void;
  hidePlayer: () => void;
  togglePlayerVisibility: () => void;
  showFullScreen: () => void;
  hideFullScreen: () => void;
  toggleFullScreen: () => void;
}

const AudioContext = createContext<AudioContextProps | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [isFullScreenVisible, setIsFullScreenVisible] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

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
      setIsLoading(false);
    }
  }, []);

  const loadAudio = useCallback(async (audioUrl: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Unload previous audio if exists
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false, rate: playbackRate },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      return newSound;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audio');
      console.error('Error loading audio:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sound, playbackRate, onPlaybackStatusUpdate]);

  const playTrack = useCallback(async (track: AudioTrack) => {
    // If same track is already loaded, just play it
    if (currentTrack?.id === track.id && sound) {
      await play();
      return;
    }

    // Set new track and load audio
    setCurrentTrack(track);
    setIsPlayerVisible(true);
    const newSound = await loadAudio(track.audioUrl);
    
    if (newSound) {
      try {
        await newSound.playAsync();
        setIsPlaying(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to play audio');
        console.error('Error playing audio:', err);
      }
    }
  }, [currentTrack, sound, loadAudio]);

  const play = useCallback(async () => {
    if (!sound) return;

    try {
      await sound.playAsync();
      setIsPlaying(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play audio');
      console.error('Error playing audio:', err);
    }
  }, [sound]);

  const pause = useCallback(async () => {
    if (!sound) return;

    try {
      await sound.pauseAsync();
      setIsPlaying(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause audio');
      console.error('Error pausing audio:', err);
    }
  }, [sound]);

  const stop = useCallback(async () => {
    if (!sound) return;

    try {
      await sound.stopAsync();
      setIsPlaying(false);
      setPosition(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop audio');
      console.error('Error stopping audio:', err);
    }
  }, [sound]);

  const seek = useCallback(async (positionMillis: number) => {
    if (!sound) return;

    try {
      await sound.setPositionAsync(positionMillis);
      setPosition(positionMillis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seek audio');
      console.error('Error seeking audio:', err);
    }
  }, [sound]);

  const setRate = useCallback(async (rate: number) => {
    if (!sound) return;

    try {
      await sound.setRateAsync(rate, true);
      setPlaybackRate(rate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set playback rate');
      console.error('Error setting playback rate:', err);
    }
  }, [sound]);

  const showPlayer = useCallback(() => {
    setIsPlayerVisible(true);
  }, []);

  const hidePlayer = useCallback(() => {
    setIsPlayerVisible(false);
  }, []);

  const togglePlayerVisibility = useCallback(() => {
    setIsPlayerVisible(!isPlayerVisible);
  }, [isPlayerVisible]);

  const showFullScreen = useCallback(() => {
    setIsFullScreenVisible(true);
  }, []);

  const hideFullScreen = useCallback(() => {
    setIsFullScreenVisible(false);
  }, []);

  const toggleFullScreen = useCallback(() => {
    setIsFullScreenVisible(!isFullScreenVisible);
  }, [isFullScreenVisible]);

  const value: AudioContextProps = {
    currentTrack,
    isPlaying,
    isLoading,
    position,
    duration,
    error,
    isPlayerVisible,
    isFullScreenVisible,
    playTrack,
    play,
    pause,
    stop,
    seek,
    setRate,
    showPlayer,
    hidePlayer,
    togglePlayerVisibility,
    showFullScreen,
    hideFullScreen,
    toggleFullScreen,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}