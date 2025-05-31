import { Feather } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Animated,
  PanResponder
} from 'react-native';
import { Image } from 'expo-image';
import { useAudio } from '../context/AudioContext';
import { PostActions } from './post/PostActions';
import { theme } from '../lib/theme';
import { useAuth } from '../context/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FullScreenAudioPlayerProps {
  visible: boolean;
  onClose: () => void;
}

export function FullScreenAudioPlayer({ visible, onClose }: FullScreenAudioPlayerProps) {
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    play,
    pause,
    seek,
    isFullScreenVisible,
    hideFullScreen,
  } = useAudio();
  
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [tempPosition, setTempPosition] = useState(0);

  // Format time in minutes:seconds
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format duration for display (handles long audio)
  const formatDuration = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  };

  const handleSeek = async (value: number) => {
    const newPosition = (value / 100) * duration;
    await seek(newPosition);
    setTempPosition(newPosition);
  };

  const handleProgressTouch = (x: number) => {
    const progressBarWidth = screenWidth - 48; // Account for padding
    const percentage = Math.max(0, Math.min(1, x / progressBarWidth));
    const newPosition = percentage * duration;
    setTempPosition(newPosition);
    return percentage * 100;
  };

  // Create PanResponder for progress bar
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      setIsDragging(true);
      const value = handleProgressTouch(event.nativeEvent.locationX);
    },
    onPanResponderMove: (event) => {
      const value = handleProgressTouch(event.nativeEvent.locationX);
    },
    onPanResponderRelease: async (event) => {
      const value = handleProgressTouch(event.nativeEvent.locationX);
      await handleSeek(value);
      setIsDragging(false);
    },
  });

  const progressPercentage = duration > 0 ? ((isDragging ? tempPosition : position) / duration) * 100 : 0;

  if (!currentTrack || !visible) {
    return null;
  }

  return (
    <Modal
      visible={isFullScreenVisible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={hideFullScreen}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.backgroundContainer}>
          {/* Background with gradient */}
          <View style={styles.gradientBackground} />
          
          {/* Cover Art or Waveform Visualization */}
          <View style={styles.visualContainer}>
            {currentTrack.coverUrl ? (
              <Image
                source={{ uri: currentTrack.coverUrl }}
                style={styles.coverArt}
                contentFit="cover"
              />
            ) : (
              <View style={styles.defaultCover}>
                <View style={styles.waveformContainer}>
                  {/* Simple waveform visualization */}
                  {Array.from({ length: 20 }).map((_, index) => {
                    const isActive = index < (progressPercentage / 100) * 20;
                    const height = Math.random() * 40 + 20;
                    return (
                      <View
                        key={index}
                        style={[
                          styles.waveformBar,
                          { height },
                          isActive && styles.waveformBarActive,
                        ]}
                      />
                    );
                  })}
                </View>
                <Feather name="headphones" size={80} color="rgba(255, 255, 255, 0.3)" />
              </View>
            )}
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={hideFullScreen}>
            <Feather name="chevron-down" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Track Info */}
          <View style={styles.trackInfoContainer}>
            <Text style={styles.trackTitle} numberOfLines={2}>
              {currentTrack.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {currentTrack.author}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{formatTime(isDragging ? tempPosition : position)}</Text>
            
            <View style={styles.progressBarContainer} {...panResponder.panHandlers}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercentage}%` },
                  ]}
                />
                <View
                  style={[
                    styles.progressBarHandle,
                    { left: `${progressPercentage}%` },
                  ]}
                />
              </View>
            </View>
            
            <Text style={styles.timeText}>{formatDuration(duration)}</Text>
          </View>

          {/* Control Buttons */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity style={styles.controlButton}>
              <Feather name="skip-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
              <Feather
                name={isPlaying ? 'pause' : 'play'}
                size={32}
                color="#FFFFFF"
                style={!isPlaying && styles.playIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton}>
              <Feather name="skip-forward" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {currentTrack.postId && (
              <PostActions
                postId={currentTrack.postId}
                onComment={() => {
                  // Handle comment action
                  console.log('Comment on post:', currentTrack.postId);
                }}
                onHighlight={() => {
                  // Handle highlight action
                  console.log('Highlight post:', currentTrack.postId);
                }}
              />
            )}
          </View>

          {/* Additional Controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.bottomControlButton}>
              <Feather name="shuffle" size={20} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.bottomControlButton}>
              <Feather name="repeat" size={20} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.bottomControlButton}>
              <Feather name="share" size={20} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.bottomControlButton}>
              <Feather name="more-horizontal" size={20} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
          </View>
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundContainer: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 44,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
    // You can add gradient here using expo-linear-gradient if needed
  },
  visualContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  coverArt: {
    width: screenWidth - 80,
    height: screenWidth - 80,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  defaultCover: {
    width: screenWidth - 80,
    height: screenWidth - 80,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  waveformContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 40,
  },
  waveformBar: {
    width: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  waveformBarActive: {
    backgroundColor: theme.colors.primary.main,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  trackInfoContainer: {
    paddingHorizontal: 40,
    paddingVertical: 32,
    alignItems: 'center',
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  trackArtist: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    minWidth: 40,
    textAlign: 'center',
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: 16,
    height: 40,
    justifyContent: 'center',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary.main,
    borderRadius: 2,
  },
  progressBarHandle: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 32,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  playIcon: {
    marginLeft: 4, // Adjust play icon position
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingBottom: 32,
  },
  bottomControlButton: {
    padding: 12,
  },
});