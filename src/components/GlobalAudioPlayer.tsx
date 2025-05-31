import { Feather, MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { useAudio } from '../context/AudioContext';
import { theme } from '../lib/theme';

interface GlobalAudioPlayerProps {
  onExpand?: () => void;
}

export function GlobalAudioPlayer({ onExpand }: GlobalAudioPlayerProps) {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    position,
    duration,
    error,
    isPlayerVisible,
    play,
    pause,
    hidePlayer,
    showFullScreen,
  } = useAudio();

  const [isMinimized, setIsMinimized] = useState(false);

  const formatTime = useCallback((milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause]);

  const handleClose = useCallback(() => {
    hidePlayer();
  }, [hidePlayer]);

  const handleExpand = useCallback(() => {
    if (onExpand) {
      onExpand();
    } else {
      showFullScreen();
    }
  }, [onExpand, showFullScreen]);

  const progress = duration > 0 ? position / duration : 0;

  // Don't render if no track or player is hidden
  if (!currentTrack || !isPlayerVisible) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container} testID="global-player-error">
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={20} color="#DC2626" />
          <Text style={styles.errorText}>再生エラー</Text>
        </View>
        <TouchableOpacity onPress={handleClose} testID="close-button">
          <Feather name="x" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <TouchableOpacity
        style={styles.minimizedContainer}
        onPress={handleExpand}
        testID="global-player-minimized"
      >
        <View style={styles.minimizedContent}>
          <TouchableOpacity
            onPress={handlePlayPause}
            testID={isPlaying ? 'pause-button' : 'play-button'}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather name={isPlaying ? 'pause' : 'play'} size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          <Text style={styles.minimizedTitle} numberOfLines={1}>
            {currentTrack.title}
          </Text>
        </View>
        <TouchableOpacity onPress={handleClose} testID="close-button">
          <Feather name="x" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // Full player state
  return (
    <View style={styles.container} testID="global-player-expanded">
      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.content}>
        {/* Track info */}
        <TouchableOpacity style={styles.trackInfo} onPress={handleExpand}>
          {currentTrack.coverUrl && (
            <Image source={{ uri: currentTrack.coverUrl }} style={styles.coverImage} />
          )}
          <View style={styles.textInfo}>
            <Text style={styles.title} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.author} numberOfLines={1}>
              {currentTrack.author}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Time display */}
          <Text style={styles.timeText}>
            {formatTime(position)} / {formatTime(duration)}
          </Text>

          {/* Play/Pause button */}
          <TouchableOpacity
            onPress={handlePlayPause}
            style={styles.playButton}
            testID={isPlaying ? 'pause-button' : 'play-button'}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" testID="loading-indicator" />
            ) : (
              <Feather name={isPlaying ? 'pause' : 'play'} size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          {/* Minimize button */}
          <TouchableOpacity
            onPress={() => setIsMinimized(true)}
            style={styles.actionButton}
            testID="minimize-button"
          >
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#64748B" />
          </TouchableOpacity>

          {/* Close button */}
          <TouchableOpacity onPress={handleClose} style={styles.actionButton} testID="close-button">
            <Feather name="x" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: '#E2E8F0',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary.main,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  trackInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  coverImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#F1F5F9',
  },
  textInfo: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  author: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    color: theme.colors.text.muted,
    marginRight: 12,
    minWidth: 60,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  actionButton: {
    padding: 6,
    marginLeft: 4,
  },
  minimizedContainer: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  minimizedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  minimizedTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
  },
});