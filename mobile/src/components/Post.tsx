import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type PostProps = {
  id: string;
  username: string;
  avatarUrl: string;
  imageUrl: string;
  caption: string;
  timestamp: string;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
};

export const Post = ({
  id,
  username,
  avatarUrl,
  imageUrl,
  caption,
  timestamp,
  likeCount,
  commentCount,
  isLiked = false,
}: PostProps) => {
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likeCount);
  const [modalVisible, setModalVisible] = useState(false);

  const handleLike = () => {
    if (liked) {
      setLikes(likes - 1);
    } else {
      setLikes(likes + 1);
    }
    setLiked(!liked);
  };

  return (
    <View className="mb-4 bg-background border border-border rounded-lg overflow-hidden">
      {/* Post Header */}
      <View className="flex-row items-center p-3">
        <Image 
          source={{ uri: avatarUrl || 'https://via.placeholder.com/40' }} 
          className="h-10 w-10 rounded-full mr-3" 
        />
        <Text className="font-semibold text-foreground">{username}</Text>
      </View>

      {/* Post Image */}
      <Image 
        source={{ uri: imageUrl || 'https://via.placeholder.com/600/400' }} 
        className="w-full aspect-square" 
        resizeMode="cover"
      />

      {/* Post Actions */}
      <View className="flex-row items-center p-3">
        <TouchableOpacity onPress={handleLike} className="mr-4">
          <Ionicons 
            name={liked ? "heart" : "heart-outline"} 
            size={24} 
            color={liked ? "#f43f5e" : "#64748b"} 
          />
        </TouchableOpacity>
        <TouchableOpacity className="mr-4">
          <Ionicons name="chatbubble-outline" size={24} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="paper-plane-outline" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Like Count */}
      <View className="px-3 pb-1">
        <Text className="font-semibold text-foreground">{likes} likes</Text>
      </View>

      {/* Caption */}
      <View className="px-3 pb-2">
        <Text>
          <Text className="font-semibold text-foreground">{username} </Text>
          <Text className="text-foreground">{caption}</Text>
        </Text>
      </View>

      {/* Comments */}
      <TouchableOpacity className="px-3 pb-3">
        <Text className="text-muted-foreground">
          View all {commentCount} comments
        </Text>
      </TouchableOpacity>

      {/* Timestamp */}
      <View className="px-3 pb-3">
        <Text className="text-xs text-muted-foreground">{timestamp}</Text>
      </View>

      {/* Modal for options (replaces Dialog) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View className="mt-auto bg-background rounded-t-xl">
            <View className="p-4 border-b border-border">
              <Text className="text-lg font-semibold text-center text-foreground">Post Options</Text>
            </View>
            <TouchableOpacity className="p-4 border-b border-border">
              <Text className="text-foreground">Share Post</Text>
            </TouchableOpacity>
            <TouchableOpacity className="p-4 border-b border-border">
              <Text className="text-red-500">Report Post</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="p-4 mb-4" 
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-center font-semibold text-foreground">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};