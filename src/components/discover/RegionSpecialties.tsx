import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';

interface RegionSpecialtiesProps {
  specialties: string[];
}

export function RegionSpecialties({ specialties }: RegionSpecialtiesProps) {
  const handlePurchase = (item: string) => {
    Alert.alert(
      'カートに追加しました',
      `${item}をカートに追加しました。`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View className="bg-white rounded-lg shadow-sm p-6">
      <Text className="text-lg font-semibold mb-4">名産品</Text>
      <View className="space-y-4">
        {specialties.map((specialty, index) => (
          <View key={index} className="bg-gray-50 rounded-lg p-4">
            <View className="aspect-square bg-gray-200 rounded-lg mb-4" />
            <Text className="font-medium mb-2">{specialty}</Text>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-gray-600">¥3,800</Text>
              <TouchableOpacity
                onPress={() => handlePurchase(specialty)}
                className="flex-row items-center gap-2 px-3 py-1 bg-black rounded-md"
              >
                <ShoppingCart size={16} color="#fff" />
                <Text className="text-white text-sm">購入</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}