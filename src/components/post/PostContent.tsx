import { Feather } from '@expo/vector-icons';
import { type AudioStatus, useAudioPlayer } from 'expo-audio';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAudio } from '../../context/AudioContext';

interface PostContentProps {
  content: string;
  caption?: string;
  mediaType: string;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  postId?: string;
  authorName?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const imageSize = screenWidth - 24; // パディングを考慮
const MAX_TEXT_LENGTH = 100;

export function PostContent({
  content,
  caption,
  mediaType,
  isExpanded,
  setIsExpanded,
  postId,
  authorName,
}: PostContentProps) {
  const videoPlayer = useVideoPlayer(mediaType === 'video' ? content : '', (player) => {
    player.loop = true;
    player.play();
  });
  const audioPlayer = useAudioPlayer(mediaType === 'audio' ? content : '', {
    shouldPrepare: mediaType === 'audio',
  });
  const [audioStatus, setAudioStatus] = React.useState<AudioStatus | null>(null);
  
  const { playTrack, currentTrack, isPlaying } = useAudio();

  const truncatedText = React.useMemo(() => {
    if (!caption || caption.length <= MAX_TEXT_LENGTH || isExpanded) {
      return caption;
    }
    return caption.substring(0, MAX_TEXT_LENGTH) + '...';
  }, [caption, isExpanded]);

  // Monitor audio status
  React.useEffect(() => {
    if (mediaType === 'audio' && audioPlayer) {
      const subscription = audioPlayer.addListener('playbackStatusUpdate', (status) => {
        setAudioStatus(status);
      });

      return () => {
        subscription?.remove();
      };
    }
  }, [mediaType, audioPlayer]);
  
  const toggleAudio = async () => {
    if (mediaType !== 'audio' || !content || !postId) return;

    try {
      await playTrack({
        id: postId,
        title: caption || 'Untitled Audio',
        author: authorName || 'Unknown',
        audioUrl: content,
        waveformData: [],
        duration: audioStatus?.duration ? audioStatus.duration * 1000 : undefined,
        postId: postId, // 投稿IDを追加
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const renderMedia = () => {
    switch (mediaType) {
      case 'image':
        return (
          <Image
            source={{ uri: content }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        );

      case 'video':
        return (
          <View style={styles.videoContainer}>
            <VideoView
              player={videoPlayer}
              style={styles.video}
              nativeControls
              contentFit="cover"
            />
          </View>
        );

      case 'audio':
        const isCurrentTrack = currentTrack?.id === postId;
        const isTrackPlaying = isCurrentTrack && isPlaying;
        
        return (
          <View style={styles.audioContainer}>
            <TouchableOpacity 
              onPress={toggleAudio} 
              style={[styles.audioButton, isTrackPlaying && styles.audioButtonPlaying]}
            >
              <Feather name={isTrackPlaying ? 'pause' : 'play'} size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.audioWaveform}>
              <View style={[styles.waveformBar, isTrackPlaying && styles.waveformBarActive]} />
              <View style={[styles.waveformBar, styles.waveformBarTall, isTrackPlaying && styles.waveformBarActive]} />
              <View style={[styles.waveformBar, isTrackPlaying && styles.waveformBarActive]} />
              <View style={[styles.waveformBar, styles.waveformBarTall, isTrackPlaying && styles.waveformBarActive]} />
              <View style={[styles.waveformBar, isTrackPlaying && styles.waveformBarActive]} />
            </View>
            <View style={styles.audioInfo}>
              {isCurrentTrack && (
                <Text style={styles.nowPlayingIndicator}>再生中</Text>
              )}
              <Text style={styles.audioDuration}>
                {audioStatus && audioStatus.currentTime !== undefined && audioStatus.duration !== undefined
                  ? `${Math.floor(audioStatus.currentTime)}s / ${Math.floor(audioStatus.duration)}s`
                  : '音声投稿'}
              </Text>
            </View>
          </View>
        );

      case 'text':
      default:
        return (
          <View style={styles.textContent}>
            <Text style={styles.textContentText}>{content}</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderMedia()}

      {caption && mediaType !== 'text' && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>{truncatedText}</Text>

          {caption.length > MAX_TEXT_LENGTH && (
            <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={styles.readMore}>
              <Text style={styles.readMoreText}>{isExpanded ? 'Read less' : 'Read more'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  image: {
    width: imageSize,
    height: imageSize,
    alignSelf: 'center',
  },
  videoContainer: {
    width: imageSize,
    height: imageSize,
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  audioButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981', // Emerald-500
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  audioButtonPlaying: {
    backgroundColor: '#EF4444', // Red-500 for pause button
  },
  audioWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
  },
  waveformBar: {
    width: 3,
    height: 16,
    backgroundColor: '#94A3B8', // Slate-400
    marginHorizontal: 3,
    borderRadius: 3,
  },
  waveformBarActive: {
    backgroundColor: '#10B981', // Emerald-500
  },
  waveformBarTall: {
    height: 24,
  },
  audioInfo: {
    alignItems: 'flex-end',
  },
  nowPlayingIndicator: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 2,
  },
  audioDuration: {
    fontSize: 12,
    color: '#64748B',
  },
  textContent: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginVertical: 8,
  },
  textContentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1E293B',
  },
  captionContainer: {
    marginTop: 12,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1E293B',
  },
  readMore: {
    marginTop: 4,
  },
  readMoreText: {
    fontSize: 14,
    color: '#10B981', // Emerald-500
    fontWeight: '500',
  },
});
