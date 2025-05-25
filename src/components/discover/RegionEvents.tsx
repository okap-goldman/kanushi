import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export function RegionEvents() {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>イベント</Text>
      <View style={{ gap: 16 }}>
        <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '500' }}>集団瞑想会</Text>
              <Text style={{ fontSize: 14, color: '#4B5563' }}>2024年4月20日</Text>
            </View>
            <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#000', borderRadius: 6, marginLeft: 8 }}>
              <Text style={{ color: '#fff', fontSize: 14 }}>参加する</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 14, color: '#4B5563', marginTop: 8 }}>
            地域の皆さんと共に、深い瞑想体験を共有します。
          </Text>
        </View>
        
        <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '500' }}>目醒めシェアリングサークル</Text>
              <Text style={{ fontSize: 14, color: '#4B5563' }}>2024年4月25日</Text>
            </View>
            <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#000', borderRadius: 6, marginLeft: 8 }}>
              <Text style={{ color: '#fff', fontSize: 14 }}>参加する</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 14, color: '#4B5563', marginTop: 8 }}>
            それぞれの気づきや学びを分かち合う場を設けます。
          </Text>
        </View>
      </View>
    </View>
  );
}