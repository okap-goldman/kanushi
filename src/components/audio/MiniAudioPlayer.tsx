import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useAudio } from '../../hooks/useAudio';

interface MiniAudioPlayerProps {
  audioUrl: string;
  title: string;
  author: string;
  waveformData?: number[];
  onClose: () => void;
  showPlaybackRate?: boolean;
  minimizable?: boolean;
}

interface WaveformBarProps {
  height: number;
  isActive: boolean;
  index: number;
}

const WaveformBar: React.FC<WaveformBarProps> = ({ height, isActive, index }) => {
  return (
    <View
      style={[
        styles.waveformBar,
        {
          height: Math.max(height * 40, 2), // Min height 2px, max 40px
          backgroundColor: isActive ? '#0070F3' : '#E2E8F0',
        },
      ]}
      testID={`waveform-bar-${index}`}
    />
  );
};

export function MiniAudioPlayer({
  audioUrl,
  title,
  author,
  waveformData = [],
  onClose,
  showPlaybackRate = false,
  minimizable = false,
}: MiniAudioPlayerProps) {
  const {
    isLoading,
    isPlaying,
    duration,
    position,
    error,
    play,
    pause,
    seek,
    setRate,
  } = useAudio(audioUrl);

  const [isMinimized, setIsMinimized] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

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

  const handleWaveformTap = useCallback((event: any) => {
    if (!duration) return;

    const { locationX } = event.nativeEvent;
    const waveformWidth = 300; // Assuming fixed width
    const progress = locationX / waveformWidth;
    const seekPosition = progress * duration;
    
    seek(seekPosition);
  }, [duration, seek]);

  const handlePlaybackRateToggle = useCallback(async () => {
    const rates = [1.0, 1.25, 1.5, 2.0];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    
    setPlaybackRate(nextRate);
    await setRate(nextRate);
  }, [playbackRate, setRate]);

  const handleRetry = useCallback(() => {
    // Retry loading audio
    console.log('Retrying audio load...');
  }, []);

  const progress = duration > 0 ? position / duration : 0;

  if (error) {
    return (
      <View style={styles.container} testID="mini-player-error">
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={24} color="#DC2626" />
          <Text style={styles.errorText}>音声の読み込みに失敗しました</Text>
          <TouchableOpacity onPress={handleRetry} testID="retry-button">
            <Text style={styles.retryText}>再試行</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onClose} testID="close-button">
          <Feather name="x" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>
    );
  }

  if (isMinimized) {
    return (
      <TouchableOpacity
        style={styles.minimizedContainer}
        onPress={() => setIsMinimized(false)}
        testID="mini-player-minimized"
      >
        <View style={styles.minimizedContent}>
          <TouchableOpacity onPress={handlePlayPause} testID={isPlaying ? 'pause-button' : 'play-button'}>
            <Feather
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <Text style={styles.minimizedTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} testID="close-button">
          <Feather name="x" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container} testID="mini-player-expanded">
      <View style={styles.header}>
        <View style={styles.trackInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.author} numberOfLines={1}>
            {author}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {minimizable && (
            <TouchableOpacity
              onPress={() => setIsMinimized(true)}
              style={styles.actionButton}
              testID="minimize-button"
            >
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#64748B" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose} style={styles.actionButton} testID="close-button">
            <Feather name="x" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.waveformContainer} testID="waveform-container">
        <TouchableOpacity
          onPress={handleWaveformTap}
          activeOpacity={1}
          style={styles.waveformTouchArea}
        >
          <View style={styles.waveform} testID="waveform-bars">
            {waveformData.map((height, index) => {
              const barProgress = index / waveformData.length;
              const isActive = barProgress <= progress;
              
              return (
                <WaveformBar
                  key={index}
                  height={height}
                  isActive={isActive}
                  index={index}
                />
              );
            })}
          </View>
          
          {/* Progress indicator */}
          <View
            style={[
              styles.progressIndicator,
              { left: `${progress * 100}%` },
            ]}
            testID="waveform-progress"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
        
        <View style={styles.playbackControls}>
          {showPlaybackRate && (
            <TouchableOpacity
              onPress={handlePlaybackRateToggle}
              style={styles.rateButton}
              testID="playback-rate-button"
            >
              <Text style={styles.rateText}>{playbackRate}x</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={handlePlayPause}
            style={styles.playButton}
            testID={isPlaying ? 'pause-button' : 'play-button'}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" testID="loading-indicator" />
            ) : (
              <Feather
                name={isPlaying ? 'pause' : 'play'}
                size={24}
                color="#FFFFFF"
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  minimizedContainer: {
    backgroundColor: '#0070F3',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  trackInfo: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 2,
  },
  author: {
    fontSize: 14,
    color: '#64748B',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  waveformContainer: {
    marginBottom: 16,
  },
  waveformTouchArea: {
    position: 'relative',
    height: 50,
    justifyContent: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    paddingHorizontal: 4,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
    marginHorizontal: 1,
  },
  progressIndicator: {
    position: 'absolute',
    top: '50%',
    width: 2,
    height: 50,
    backgroundColor: '#0070F3',
    borderRadius: 1,
    marginTop: -25,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
    marginHorizontal: 8,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rateButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginRight: 12,
  },
  rateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0070F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
    marginRight: 12,
    flex: 1,
  },
  retryText: {
    fontSize: 14,
    color: '#0070F3',
    fontWeight: '600',
  },
});