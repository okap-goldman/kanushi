import React from 'react';
import { View, Text } from 'react-native';

export default function CreatePostScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-lg font-bold text-foreground">Create Post</Text>
      <Text className="text-muted-foreground">Post creation form will be here</Text>
    </View>
  );
}