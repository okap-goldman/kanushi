import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Modal } from 'react-native';
import { Calendar, Filter, Search, Plus } from 'lucide-react-native';

export function EventsSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const events = [
    {
      title: "集団瞑想会",
      date: "2024年4月15日 10:00-12:00",
      location: "渋谷区瞑想センター",
      price: "¥2,000",
      capacity: "定員10名",
      image: "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83"
    },
    {
      title: "チャクラ開放ワークショップ",
      date: "2024年4月16日 14:00-16:00",
      location: "新宿区ヨガスタジオ",
      price: "¥3,500",
      capacity: "定員15名",
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773"
    },
    {
      title: "目醒めシェアリングサークル",
      date: "2024年4月17日 19:00-21:00",
      location: "目黒区コミュニティセンター",
      price: "¥1,500",
      capacity: "定員12名",
      image: "https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a"
    },
    {
      title: "スピリチュアルヒーリング体験会",
      date: "2024年4月18日 13:00-15:00",
      location: "池袋区カルチャーセンター",
      price: "¥4,000",
      capacity: "定員8名",
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773"
    }
  ];

  return (
    <ScrollView className="flex-1">
      <View className="space-y-6 p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Calendar size={20} color="#000" />
            <Text className="text-lg font-semibold">イベント</Text>
          </View>
          
          <View className="flex-row gap-2">
            <TouchableOpacity className="p-2 border border-gray-300 rounded-md">
              <Filter size={16} color="#000" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-row items-center px-3 py-2 bg-black rounded-md"
              onPress={() => setShowCreateDialog(true)}
            >
              <Plus size={16} color="#fff" />
              <Text className="text-white ml-1 text-sm">イベントを企画</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center bg-gray-100 rounded-md px-3 py-2">
          <Search size={16} color="#666" />
          <TextInput
            className="flex-1 ml-2"
            placeholder="イベントを検索"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View className="bg-white rounded-lg shadow-sm p-4">
          <Text className="font-medium mb-3">注目のイベント</Text>
          <View className="aspect-video rounded-lg overflow-hidden mb-3">
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800" }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
          <Text className="font-medium">シアターワーク体験会</Text>
          <Text className="text-sm text-gray-600 mt-1">2024年4月20日 14:00-16:00</Text>
          <Text className="mt-2">青梅市文化会館</Text>
          <View className="flex-row gap-2 mt-3">
            <View className="px-2 py-1 bg-gray-100 rounded">
              <Text className="text-sm">参加費無料</Text>
            </View>
            <View className="px-2 py-1 bg-gray-100 rounded">
              <Text className="text-sm">定員20名</Text>
            </View>
          </View>
        </View>

        <View className="space-y-4">
          {events.map((event, i) => (
            <TouchableOpacity 
              key={i}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
              onPress={() => setSelectedEvent(event.title)}
            >
              <View className="aspect-video">
                <Image
                  source={{ uri: event.image }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              <View className="p-4">
                <Text className="font-medium">{event.title}</Text>
                <Text className="text-sm text-gray-600 mt-1">{event.date}</Text>
                <Text className="mt-2">{event.location}</Text>
                <View className="flex-row gap-2 mt-3">
                  <View className="px-2 py-1 bg-gray-100 rounded">
                    <Text className="text-sm">{event.price}</Text>
                  </View>
                  <View className="px-2 py-1 bg-gray-100 rounded">
                    <Text className="text-sm">{event.capacity}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Create Event Dialog */}
        <Modal
          visible={showCreateDialog}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCreateDialog(false)}
        >
          <View className="flex-1 bg-black/50">
            <View className="flex-1 mt-20 bg-white rounded-t-3xl">
              <ScrollView className="flex-1 p-6">
                <Text className="text-xl font-bold mb-6">新しいイベントを企画</Text>
                
                <View className="space-y-4">
                  <View>
                    <Text className="text-sm font-medium mb-1">イベント名</Text>
                    <TextInput className="border border-gray-300 rounded-md px-3 py-2" />
                  </View>
                  
                  <View>
                    <Text className="text-sm font-medium mb-1">コンテンツ</Text>
                    <TextInput 
                      className="border border-gray-300 rounded-md px-3 py-2 h-24"
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                  
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-sm font-medium mb-1">人数</Text>
                      <TextInput 
                        className="border border-gray-300 rounded-md px-3 py-2"
                        keyboardType="numeric"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium mb-1">金額</Text>
                      <TextInput 
                        className="border border-gray-300 rounded-md px-3 py-2"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  
                  <View>
                    <Text className="text-sm font-medium mb-1">開催場所</Text>
                    <TextInput className="border border-gray-300 rounded-md px-3 py-2" />
                  </View>
                  
                  <View className="flex-row gap-2 pt-4">
                    <TouchableOpacity 
                      className="flex-1 py-3 border border-gray-300 rounded-md"
                      onPress={() => setShowCreateDialog(false)}
                    >
                      <Text className="text-center">キャンセル</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 py-3 bg-black rounded-md">
                      <Text className="text-center text-white">作成</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Event Detail Modal */}
        <Modal
          visible={!!selectedEvent}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedEvent(null)}
        >
          <View className="flex-1 bg-black/50">
            <View className="flex-1 mt-20 bg-white rounded-t-3xl">
              <ScrollView className="flex-1 p-6">
                <Text className="text-xl font-bold mb-4">{selectedEvent}</Text>
                
                <View className="aspect-video rounded-lg overflow-hidden mb-4">
                  <Image
                    source={{ uri: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800" }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
                
                <View className="space-y-4">
                  <View>
                    <Text className="font-medium mb-1">イベント詳細</Text>
                    <Text className="text-sm text-gray-600">
                      瞑想を通じて、心の平安とマインドフルネスを体験するワークショップです。
                      初心者の方も安心してご参加いただけます。
                    </Text>
                  </View>
                  
                  <View className="space-y-3">
                    <View>
                      <Text className="text-sm font-medium">開催日時</Text>
                      <Text className="text-sm text-gray-600">2024年4月20日 14:00-16:00</Text>
                    </View>
                    <View>
                      <Text className="text-sm font-medium">場所</Text>
                      <Text className="text-sm text-gray-600">渋谷区瞑想センター</Text>
                    </View>
                    <View>
                      <Text className="text-sm font-medium">参加費</Text>
                      <Text className="text-sm text-gray-600">¥3,000</Text>
                    </View>
                    <View>
                      <Text className="text-sm font-medium">定員</Text>
                      <Text className="text-sm text-gray-600">15名</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row gap-2 pt-4">
                    <TouchableOpacity 
                      className="flex-1 py-3 border border-gray-300 rounded-md"
                      onPress={() => setSelectedEvent(null)}
                    >
                      <Text className="text-center">閉じる</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 py-3 bg-black rounded-md">
                      <Text className="text-center text-white">参加する</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}