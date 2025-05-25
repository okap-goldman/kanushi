import React from 'react';
import { View, Text } from 'react-native';

interface Person {
  name: string;
  role: string;
  description: string;
}

interface RegionPeopleProps {
  people: Person[];
}

export function RegionPeople({ people }: RegionPeopleProps) {
  return (
    <View className="bg-white rounded-lg shadow-sm p-6">
      <Text className="text-lg font-semibold mb-4">活動する人々</Text>
      <View className="space-y-4">
        {people.map((person, index) => (
          <View key={index} className="border border-gray-200 rounded-lg p-4">
            <Text className="font-medium">{person.name}</Text>
            <Text className="text-sm text-blue-600">{person.role}</Text>
            <Text className="text-sm text-gray-600 mt-2">
              {person.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}