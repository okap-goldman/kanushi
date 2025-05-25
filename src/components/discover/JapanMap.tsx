import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface JapanMapProps {
  onRegionSelect: (region: string) => void;
}

const regions = [
  { name: '北海道・東北', color: '#e11d48' },
  { name: '関東', color: '#f59e0b' },
  { name: '中部', color: '#10b981' },
  { name: '近畿', color: '#3b82f6' },
  { name: '中国・四国', color: '#8b5cf6' },
  { name: '九州・沖縄', color: '#ec4899' },
];

export function JapanMap({ onRegionSelect }: JapanMapProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>地域を選択</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.mapContainer}>
          {regions.map((region) => (
            <TouchableOpacity
              key={region.name}
              style={[styles.region, { backgroundColor: region.color }]}
              onPress={() => onRegionSelect(region.name)}
              activeOpacity={0.8}
            >
              <Text style={styles.regionText}>{region.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  scrollView: {
    paddingHorizontal: 16,
  },
  mapContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  region: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  regionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
