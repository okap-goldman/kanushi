import { ShoppingCart } from 'lucide-react-native';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

interface RegionSpecialtiesProps {
  specialties: string[];
}

export function RegionSpecialties({ specialties }: RegionSpecialtiesProps) {
  const handlePurchase = (item: string) => {
    Alert.alert('カートに追加しました', `${item}をカートに追加しました。`, [{ text: 'OK' }]);
  };

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
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>名産品</Text>
      <View style={{ gap: 16 }}>
        {specialties.map((specialty, index) => (
          <View key={index} style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 16 }}>
            <View
              style={{
                aspectRatio: 1,
                backgroundColor: '#E5E7EB',
                borderRadius: 8,
                marginBottom: 16,
              }}
            />
            <Text style={{ fontWeight: '500', marginBottom: 8 }}>{specialty}</Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, color: '#4B5563' }}>¥3,800</Text>
              <TouchableOpacity
                onPress={() => handlePurchase(specialty)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  backgroundColor: '#000',
                  borderRadius: 6,
                }}
              >
                <ShoppingCart size={16} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 14 }}>購入</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
