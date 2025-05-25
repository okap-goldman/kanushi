import React from 'react';
import { Text, View } from 'react-native';

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
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>活動する人々</Text>
      <View style={{ gap: 16 }}>
        {people.map((person, index) => (
          <View
            key={index}
            style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 16 }}
          >
            <Text style={{ fontWeight: '500' }}>{person.name}</Text>
            <Text style={{ fontSize: 14, color: '#2563EB' }}>{person.role}</Text>
            <Text style={{ fontSize: 14, color: '#4B5563', marginTop: 8 }}>
              {person.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
