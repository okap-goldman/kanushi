import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export function RegionEvents() {
  return (
    <View className="bg-white rounded-lg shadow-sm p-6">
      <Text className="text-lg font-semibold mb-4">イベント</Text>
      <View className="space-y-4">
        <View className="border border-gray-200 rounded-lg p-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="font-medium">集団瞑想会</Text>
              <Text className="text-sm text-gray-600">2024年4月20日</Text>
            </View>
            <TouchableOpacity className="px-3 py-1 bg-black rounded-md ml-2">
              <Text className="text-white text-sm">参加する</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-sm text-gray-600 mt-2">
            地域の皆さんと共に、深い瞑想体験を共有します。
          </Text>
        </View>
        
        <View className="border border-gray-200 rounded-lg p-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="font-medium">目醒めシェアリングサークル</Text>
              <Text className="text-sm text-gray-600">2024年4月25日</Text>
            </View>
            <TouchableOpacity className="px-3 py-1 bg-black rounded-md ml-2">
              <Text className="text-white text-sm">参加する</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-sm text-gray-600 mt-2">
            それぞれの気づきや学びを分かち合う場を設けます。
          </Text>
        </View>
      </View>
    </View>
  );
}