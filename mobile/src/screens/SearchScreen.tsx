import React from 'react';
import { View, Text } from 'react-native';

export default function SearchScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-lg font-bold text-foreground">Search Screen</Text>
      <Text className="text-muted-foreground">Search functionality will be here</Text>
    </View>
  );
}