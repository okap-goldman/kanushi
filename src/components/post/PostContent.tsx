import { Feather } from '@expo/vector-icons';
import { type AVPlaybackStatus, Audio, Video } from 'expo-av';
import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PostContentProps {
  content: string;
  caption?: string;
  mediaType: string;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
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
}: PostContentProps) {
  const contentRef = React.useRef<Video>(null);
  const [sound, setSound] = React.useState<Audio.Sound | null>(null);
  const [audioStatus, setAudioStatus] = React.useState<AVPlaybackStatus | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  const truncatedText = React.useMemo(() => {
    if (!caption || caption.length <= MAX_TEXT_LENGTH || isExpanded) {
      return caption;
    }
    return caption.substring(0, MAX_TEXT_LENGTH) + '...';
  }, [caption, isExpanded]);

  // Load audio when component mounts and media type is audio
  React.useEffect(() => {
    if (mediaType === 'audio' && content) {
      loadAudio();
    }
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [content, mediaType]);
  
  const loadAudio = async () => {
    try {
      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: content },
        { shouldPlay: false },
        onAudioStatusUpdate
      );
      setSound(audioSound);
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };
  
  const onAudioStatusUpdate = (status: AVPlaybackStatus) => {
    setAudioStatus(status);
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
    }
  };
  
  const toggleAudio = async () => {
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
      }
    } catch (error) {
      console.error('Error toggling audio:', error);
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
            <Video
              ref={contentRef}
              source={{ uri: content }}
              style={styles.video}
              useNativeControls
              shouldPlay={false}
              isLooping
              resizeMode="cover"
            />
          </View>
        );

      case 'audio':
        return (
          <View style={styles.audioContainer}>
            <TouchableOpacity onPress={toggleAudio} style={styles.audioButton}>
              <Feather name={isPlaying ? 'pause' : 'play'} size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.audioWaveform}>
              <View style={styles.waveformBar} />
              <View style={[styles.waveformBar, styles.waveformBarTall]} />
              <View style={styles.waveformBar} />
              <View style={[styles.waveformBar, styles.waveformBarTall]} />
              <View style={styles.waveformBar} />
            </View>
            <Text style={styles.audioDuration}>
              {audioStatus && 'isLoaded' in audioStatus && audioStatus.isLoaded
                ? `${Math.floor(audioStatus.positionMillis / 1000)}s / ${Math.floor(audioStatus.durationMillis / 1000)}s`
                : '0s'}
            </Text>
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
  audioWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
  },
  waveformBar: {
    width: 3,
    height: 16,
    backgroundColor: '#10B981', // Emerald-500
    marginHorizontal: 3,
    borderRadius: 3,
  },
  waveformBarTall: {
    height: 24,
  },
  audioDuration: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 16,
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
