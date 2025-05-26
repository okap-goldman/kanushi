import React from 'react';
import { Text, View } from 'react-native';

interface RegionCharacteristicsProps {
  characteristics: string;
}

export function RegionCharacteristics({ characteristics }: RegionCharacteristicsProps) {
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
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>地域の特色</Text>
      <Text style={{ color: '#4B5563' }}>{characteristics}</Text>
    </View>
  );
}
