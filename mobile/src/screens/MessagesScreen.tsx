import React from 'react';
import { View, Text } from 'react-native';

export default function MessagesScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-lg font-bold text-foreground">Messages</Text>
      <Text className="text-muted-foreground">Messages will be displayed here</Text>
    </View>
  );
}