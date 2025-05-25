import { Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StoryCircle from './StoryCircle';
import StoryViewer from './StoryViewer';

interface Story {
  id: string;
  userId: string;
  username: string;
  profileImage: string;
  mediaUrl: string;
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
        {/* Create Story Button */}
        <View style={styles.storyItem}>
          <View style={styles.createStoryCircle}>
            <TouchableOpacity onPress={onCreateStory} style={styles.createStoryButton}>
              <Plus size={32} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.username}>ストーリー作成</Text>
        </View>

        {/* User Stories */}
        {userStories.length > 0 ? (
          userStories.map((userStory, index) => (
            <StoryCircle
              key={userStory.userId}
              userId={userStory.userId}
              username={userStory.username}
              profileImage={userStory.profileImage}
              hasUnviewedStory={userStory.hasUnviewedStory}
              onPress={() => handleStoryCircleClick(index)}
            />
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
    paddingHorizontal: 8,
    gap: 8,
  },
  storyItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    minWidth: 60,
  },
  createStoryCircle: {
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    padding: 2,
    marginBottom: 4,
  },
  createStoryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
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
