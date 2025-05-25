import React from 'react';
import { View, Text } from 'react-native';

interface RegionCharacteristicsProps {
  characteristics: string;
}

export function RegionCharacteristics({ characteristics }: RegionCharacteristicsProps) {
  return (
    <View className="bg-white rounded-lg shadow-sm p-6">
      <Text className="text-lg font-semibold mb-4">地域の特色</Text>
      <Text className="text-gray-600">{characteristics}</Text>
    </View>
  );
}