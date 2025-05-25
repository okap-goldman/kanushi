import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MapPin, ChevronDown } from 'lucide-react-native';
import { RegionDetailView } from './RegionDetailView';

const REGIONS = [
  "北海道・東北",
  "関東",
  "中部",
  "近畿",
  "中国・四国",
  "九州・沖縄"
];

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
    <ScrollView className="flex-1">
      <View className="space-y-4 p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <MapPin size={20} color="#000" />
            <Text className="text-lg font-semibold">地域毎の活動状況</Text>
          </View>
          
          <TouchableOpacity 
            className="flex-row items-center px-3 py-2 border border-gray-300 rounded-md"
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text className="mr-2">{selectedRegion || "地域を選択"}</Text>
            <ChevronDown size={16} color="#000" />
          </TouchableOpacity>
        </View>

        {showDropdown && (
          <View className="absolute right-4 top-12 z-10 bg-white border border-gray-300 rounded-md shadow-lg">
            {REGIONS.map((region) => (
              <TouchableOpacity
                key={region}
                className="px-4 py-2 border-b border-gray-100"
                onPress={() => handleRegionSelect(region)}
              >
                <Text>{region}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showIntro && (
          <View className="p-6 mb-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <Text className="font-medium text-lg mb-2">地域を選択してください</Text>
            <Text className="text-sm text-gray-600">
              地域を選択すると、その地域の詳細情報が表示されます。
              下の地域一覧から選択するか、上部のドロップダウンメニューからお選びください。
            </Text>
          </View>
        )}

        <View className="space-y-4">
          {REGIONS.map((region) => (
            <TouchableOpacity
              key={region}
              className="bg-white p-4 rounded-lg shadow-sm"
              onPress={() => handleRegionSelect(region)}
            >
              <View className="flex-row justify-between items-center">
                <Text className="font-medium">{region}</Text>
                <View className="px-2 py-1 bg-gray-100 rounded">
                  <Text className="text-sm">
                    {region === "関東" ? "活発" : "普通"}
                  </Text>
                </View>
              </View>
              <Text className="text-sm text-gray-600 mt-2">
                {region === "関東" 
                  ? "多くのコミュニティ活動が行われています"
                  : "いくつかのコミュニティ活動が進行中です"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <RegionDetailView
          open={!!selectedRegion}
          onClose={() => setSelectedRegion(null)}
          region={selectedRegion || ""}
        />
      </View>
    </ScrollView>
  );
}