import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { Slider } from './ui/Slider';

interface AudioPost {
  id: string;
  mediaUrl: string;
  waveformUrl?: string;
  durationSeconds: number;
  aiMetadata?: {
    summary?: string;
  };
}

interface AudioPlayerProps {
  post: AudioPost;
  sound?: Audio.Sound;
}

export function AudioPlayer({ post, sound: externalSound }: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(externalSound || null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(post.durationSeconds * 1000);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const loadAudio = async () => {
    try {
      setIsLoading(true);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: post.mediaUrl },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
    } catch (error) {
      console.error('Error loading audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    setStatus(status);
    if (status.isLoaded) {
      setPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || post.durationSeconds * 1000);
      setIsPlaying(status.isPlaying);
    }
  };

  const togglePlayback = async () => {
    if (!sound) {
      await loadAudio();
      return;
    }

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const onSeek = async (value: number) => {
    if (sound && status?.isLoaded) {
      try {
        await sound.setPositionAsync(value);
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Waveform Image */}
      {post.waveformUrl && (
        <Image
          source={{ uri: post.waveformUrl }}
          style={styles.waveform}
          testID="waveform-image"
        />
      )}

      {/* Audio Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={togglePlayback}
          disabled={isLoading}
          testID={isPlaying ? 'pause-button' : 'play-button'}
        >
          {isLoading ? (
            <Feather name="loader" size={24} color="#FFFFFF" />
          ) : (
            <Feather
              name={isPlaying ? 'pause' : 'play'}
              size={24}
              color="#FFFFFF"
            />
          )}
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>
            {formatTime(position)}
          </Text>
          
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onValueChange={onSeek}
            minimumTrackTintColor="#0070F3"
            maximumTrackTintColor="#E2E8F0"
            thumbStyle={styles.thumb}
            testID="seek-bar"
          />
          
          <Text style={styles.timeText} testID="audio-duration">
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      {/* AI Summary */}
      {post.aiMetadata?.summary && (
        <View style={styles.summaryContainer}>
          <Feather name="zap" size={16} color="#6366F1" />
          <Text style={styles.summaryText}>
            {post.aiMetadata.summary}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  waveform: {
    width: '100%',
    height: 60,
    borderRadius: 8,
    marginBottom: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0070F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
    minWidth: 35,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  thumb: {
    width: 16,
    height: 16,
    backgroundColor: '#0070F3',
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    color: '#4C1D95',
    marginLeft: 8,
    lineHeight: 20,
  },
});

export default AudioPlayer;