import { Audio, type AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { X } from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import StoryProgress from './StoryProgress';

interface Story {
  id: string;
  userId: string;
  username: string;
  profileImage: string;
  imageUrl: string; // 画像必須
  audioUrl: string; // 音声必須
  audioTranscript?: string; // 音声の文字起こし
  mediaUrl: string; // 下位互換性のため残す
  contentType: 'image' | 'video';
  caption?: string;
  createdAt: string;
}

interface UserStories {
  userId: string;
  username: string;
  profileImage: string;
  stories: Story[];
}

interface StoryViewerProps {
  userStories: UserStories[];
  initialUserIndex?: number;
  initialStoryIndex?: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStoryView?: (storyId: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function StoryViewer({
  userStories,
  initialUserIndex = 0,
  initialStoryIndex = 0,
  isOpen,
  onOpenChange,
  onStoryView,
}: StoryViewerProps) {
  const [activeUserIndex, setActiveUserIndex] = useState(initialUserIndex);
  const [activeStoryIndex, setActiveStoryIndex] = useState(initialStoryIndex);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<Video>(null);
  
  // Audio states
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const activeUser = userStories[activeUserIndex];
  const activeStory = activeUser?.stories[activeStoryIndex];

  // Reset to initial indices when dialog is opened
  useEffect(() => {
    if (isOpen) {
      setActiveUserIndex(initialUserIndex);
      setActiveStoryIndex(initialStoryIndex);
      setIsPaused(false);
    }
  }, [isOpen, initialUserIndex, initialStoryIndex]);

  // Notify when a story is viewed
  useEffect(() => {
    if (isOpen && activeStory && onStoryView) {
      onStoryView(activeStory.id);
    }
  }, [isOpen, activeStory, activeUserIndex, activeStoryIndex, onStoryView]);

  // Audio management
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Load and play audio when story changes
  useEffect(() => {
    const loadAudio = async () => {
      if (!isOpen || !activeStory?.audioUrl) return;

      try {
        // Stop and unload previous sound
        if (sound) {
          await sound.unloadAsync();
          setSound(null);
        }

        // Load new audio
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: activeStory.audioUrl },
          { shouldPlay: true, isLooping: false }
        );

        setSound(newSound);
        setIsPlaying(true);

        // Set up status update listener
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setAudioPosition(status.positionMillis || 0);
            setAudioDuration(status.durationMillis || 0);
            
            if (status.didJustFinish) {
              setIsPlaying(false);
              setAudioPosition(0);
              // Auto advance to next story when audio finishes
              goToNextStory();
            }
          }
        });
      } catch (error) {
        console.error('Error loading audio:', error);
      }
    };

    loadAudio();
  }, [isOpen, activeStory?.audioUrl]);


  const goToNextStory = () => {
    if (!activeUser) return;

    if (activeStoryIndex < activeUser.stories.length - 1) {
      // Go to next story of the same user
      setActiveStoryIndex(activeStoryIndex + 1);
    } else if (activeUserIndex < userStories.length - 1) {
      // Go to first story of the next user
      setActiveUserIndex(activeUserIndex + 1);
      setActiveStoryIndex(0);
    } else {
      // End of all stories, close the viewer
      onOpenChange(false);
    }
  };

  const goToPreviousStory = () => {
    if (activeStoryIndex > 0) {
      // Go to previous story of the same user
      setActiveStoryIndex(activeStoryIndex - 1);
    } else if (activeUserIndex > 0) {
      // Go to last story of the previous user
      setActiveUserIndex(activeUserIndex - 1);
      setActiveStoryIndex(userStories[activeUserIndex - 1].stories.length - 1);
    }
  };


  const handleVideoStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      goToNextStory();
    }
  };

  if (!activeUser || !activeStory) return null;

  const createdAtTime = new Date(activeStory.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={() => onOpenChange(false)}
    >
      <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={() => onOpenChange(false)}>
              <X size={24} color="#fff" />
            </TouchableOpacity>

            {/* Progress bars */}
            <View style={styles.progressContainer}>
              <StoryProgress
                count={activeUser.stories.length}
                activeIndex={activeStoryIndex}
                onComplete={goToNextStory}
                isPaused={isPaused}
              />
            </View>

            {/* User info */}
            <View style={styles.userInfo}>
              <Image source={{ uri: activeUser.profileImage }} style={styles.avatar} />
              <View>
                <Text style={styles.username}>{activeUser.username}</Text>
                <Text style={styles.timestamp}>{createdAtTime}</Text>
              </View>
            </View>

            {/* Story content - new layout with tap areas */}
            <View style={styles.storyContainer}>
              {/* Invisible tap areas */}
              <TouchableOpacity 
                style={styles.leftTapArea} 
                onPress={() => {
                  console.log('Left tap area pressed');
                  goToPreviousStory();
                }}
                activeOpacity={1}
              />
              <TouchableOpacity 
                style={styles.centerTapArea} 
                onPress={() => {
                  console.log('Center tap area pressed');
                  setIsPaused(!isPaused);
                  if (sound) {
                    if (isPlaying) {
                      sound.pauseAsync();
                      setIsPlaying(false);
                    } else {
                      sound.playAsync();
                      setIsPlaying(true);
                    }
                  }
                }}
                activeOpacity={1}
              />
              <TouchableOpacity 
                style={styles.rightTapArea} 
                onPress={() => {
                  console.log('Right tap area pressed');
                  goToNextStory();
                }}
                activeOpacity={1}
              />

              {/* Upper half - Square image */}
              <View style={styles.imageSection}>
                <View style={styles.squareImageContainer}>
                  <Image
                    source={{ uri: activeStory.imageUrl }}
                    style={styles.squareImage}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Lower half - Audio transcript */}
              <View style={styles.audioSection}>
                {/* Audio transcript */}
                {activeStory.audioTranscript && (
                  <View style={styles.transcriptContainer}>
                    <Text style={styles.transcriptText}>
                      {activeStory.audioTranscript}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 50,
    padding: 8,
  },
  progressContainer: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    zIndex: 40,
  },
  userInfo: {
    position: 'absolute',
    top: 24,
    left: 16,
    right: 16,
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  storyContainer: {
    flex: 1,
    marginTop: 60,
  },
  leftTapArea: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '30%',
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  centerTapArea: {
    position: 'absolute',
    left: '30%',
    top: 0,
    bottom: 0,
    width: '40%',
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  rightTapArea: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '30%',
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  imageSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  squareImageContainer: {
    width: screenWidth,
    height: screenWidth,
    maxHeight: '100%',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  squareImage: {
    width: screenWidth,
    height: screenWidth,
    maxHeight: '100%',
  },
  audioSection: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
    justifyContent: 'flex-start',
  },
  transcriptContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 16,
  },
  transcriptText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
