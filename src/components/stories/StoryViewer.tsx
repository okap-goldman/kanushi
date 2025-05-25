import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
  Image,
  Dimensions,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { X } from "lucide-react-native";
import StoryProgress from "./StoryProgress";

interface Story {
  id: string;
  userId: string;
  username: string;
  profileImage: string;
  mediaUrl: string;
  contentType: "image" | "video";
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

const { width: screenWidth } = Dimensions.get("window");

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

  const handlePress = (locationX: number) => {
    if (locationX < screenWidth / 3) {
      // Left side - go to previous story
      goToPreviousStory();
    } else if (locationX > (screenWidth * 2) / 3) {
      // Right side - go to next story
      goToNextStory();
    } else {
      // Middle - pause/play
      setIsPaused(!isPaused);
    }
  };

  const handleVideoStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      goToNextStory();
    }
  };

  if (!activeUser || !activeStory) return null;

  const createdAtTime = new Date(activeStory.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={() => onOpenChange(false)}
    >
      <SafeAreaView style={styles.container}>
        <TouchableWithoutFeedback
          onPress={(e) => handlePress(e.nativeEvent.locationX)}
        >
          <View style={styles.content}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => onOpenChange(false)}
            >
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
              <Image
                source={{ uri: activeUser.profileImage }}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.username}>{activeUser.username}</Text>
                <Text style={styles.timestamp}>{createdAtTime}</Text>
              </View>
            </View>

            {/* Story content */}
            <View style={styles.mediaContainer}>
              {activeStory.contentType === "image" ? (
                <Image
                  source={{ uri: activeStory.mediaUrl }}
                  style={styles.media}
                  resizeMode="contain"
                />
              ) : (
                <Video
                  ref={videoRef}
                  source={{ uri: activeStory.mediaUrl }}
                  style={styles.media}
                  useNativeControls={false}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay={!isPaused}
                  isLooping={false}
                  onPlaybackStatusUpdate={handleVideoStatusUpdate}
                />
              )}

              {/* Caption */}
              {activeStory.caption && (
                <View style={styles.captionContainer}>
                  <Text style={styles.caption}>{activeStory.caption}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 50,
    padding: 8,
  },
  progressContainer: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    zIndex: 40,
  },
  userInfo: {
    position: "absolute",
    top: 24,
    left: 16,
    right: 16,
    zIndex: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },
  username: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  timestamp: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.8,
  },
  mediaContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  captionContainer: {
    position: "absolute",
    bottom: 32,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  caption: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});