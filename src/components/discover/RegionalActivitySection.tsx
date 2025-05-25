import { ChevronDown, MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { RegionDetailView } from './RegionDetailView';

const REGIONS = ['北海道・東北', '関東', '中部', '近畿', '中国・四国', '九州・沖縄'];

export function RegionalActivitySection() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region);
    setShowIntro(false);
    setShowDropdown(false);
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MapPin size={20} color="#000" />
            <Text style={{ fontSize: 18, fontWeight: '600' }}>地域毎の活動状況</Text>
          </View>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 6,
            }}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={{ marginRight: 8 }}>{selectedRegion || '地域を選択'}</Text>
            <ChevronDown size={16} color="#000" />
          </TouchableOpacity>
        </View>

        {showDropdown && (
          <View
            style={{
              position: 'absolute',
              right: 16,
              top: 48,
              zIndex: 10,
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            {REGIONS.map((region) => (
              <TouchableOpacity
                key={region}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F3F4F6',
                }}
                onPress={() => handleRegionSelect(region)}
              >
                <Text>{region}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showIntro && (
          <View
            style={{
              padding: 24,
              marginBottom: 16,
              backgroundColor: '#EFF6FF',
              borderWidth: 2,
              borderColor: '#BFDBFE',
              borderRadius: 8,
            }}
          >
            <Text style={{ fontWeight: '500', fontSize: 18, marginBottom: 8 }}>
              地域を選択してください
            </Text>
            <Text style={{ fontSize: 14, color: '#4B5563' }}>
              地域を選択すると、その地域の詳細情報が表示されます。
              下の地域一覧から選択するか、上部のドロップダウンメニューからお選びください。
            </Text>
          </View>
        )}

        <View style={{ gap: 16 }}>
          {REGIONS.map((region) => (
            <TouchableOpacity
              key={region}
              style={{
                backgroundColor: '#fff',
                padding: 16,
                borderRadius: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 2,
              }}
              onPress={() => handleRegionSelect(region)}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontWeight: '500' }}>{region}</Text>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    backgroundColor: '#F3F4F6',
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{region === '関東' ? '活発' : '普通'}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 14, color: '#4B5563', marginTop: 8 }}>
                {region === '関東'
                  ? '多くのコミュニティ活動が行われています'
                  : 'いくつかのコミュニティ活動が進行中です'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <RegionDetailView
          open={!!selectedRegion}
          onClose={() => setSelectedRegion(null)}
          region={selectedRegion || ''}
        />
      </View>
    </ScrollView>
  );
}
