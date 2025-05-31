import { Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StoryCircle from './StoryCircle';
import StoryViewer from './StoryViewer';

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
  hasUnviewedStory: boolean;
}

interface StoriesRowProps {
  userStories: UserStories[];
  currentUserId: string;
  currentUserImage: string;
  onCreateStory: () => void;
  onStoryView?: (storyId: string) => void;
}

export default function StoriesRow({
  userStories,
  currentUserId,
  currentUserImage,
  onCreateStory,
  onStoryView,
}: StoriesRowProps) {
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);

  const handleStoryCircleClick = (index: number) => {
    setSelectedUserIndex(index);
    setStoryViewerOpen(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Create Story Card */}
        <TouchableOpacity onPress={onCreateStory} style={styles.createStoryCard}>
          <Image 
            source={{ uri: currentUserImage }} 
            style={styles.createStoryBackground}
          />
          <View style={styles.createStoryOverlay}>
            <View style={styles.createStoryContent}>
              <View style={styles.plusIconContainer}>
                <Plus size={20} color="#fff" />
              </View>
              <Text style={styles.createStoryText}>ストーリーズを作成</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* User Stories */}
        {userStories.length > 0 ? (
          userStories.map((userStory, index) => (
            <TouchableOpacity 
              key={userStory.userId}
              style={styles.storyCard}
              onPress={() => handleStoryCircleClick(index)}
            >
              <Image 
                source={{ uri: userStory.stories[0]?.imageUrl || userStory.profileImage }} 
                style={styles.storyCardBackground}
              />
              <View style={styles.storyCardOverlay}>
                <View style={styles.storyProfileContainer}>
                  <View style={[
                    styles.storyProfileBorder, 
                    userStory.hasUnviewedStory ? styles.unviewedBorder : styles.viewedBorder
                  ]}>
                    <Image 
                      source={{ uri: userStory.profileImage }} 
                      style={styles.storyProfileImage}
                    />
                  </View>
                </View>
                <Text style={styles.storyUsername} numberOfLines={1}>
                  {userStory.username}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>ストーリーがありません</Text>
          </View>
        )}
      </ScrollView>

      {/* Story Viewer Modal */}
      <StoryViewer
        userStories={userStories}
        initialUserIndex={selectedUserIndex}
        initialStoryIndex={0}
        isOpen={storyViewerOpen}
        onOpenChange={setStoryViewerOpen}
        onStoryView={onStoryView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  createStoryCard: {
    width: 120,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createStoryBackground: {
    width: '100%',
    height: '75%',
    resizeMode: 'cover',
  },
  createStoryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  createStoryContent: {
    backgroundColor: '#fff',
    height: '25%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  plusIconContainer: {
    position: 'absolute',
    top: -15,
    left: '50%',
    marginLeft: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1877f2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  createStoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginTop: 8,
  },
  storyCard: {
    width: 120,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  storyCardBackground: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  storyCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'space-between',
    padding: 12,
  },
  storyProfileContainer: {
    alignSelf: 'flex-start',
  },
  storyProfileBorder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unviewedBorder: {
    backgroundColor: '#10b981',
  },
  viewedBorder: {
    backgroundColor: '#9ca3af',
  },
  storyProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  storyUsername: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
