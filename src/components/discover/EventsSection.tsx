import { Calendar, Filter, Plus, Search } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export function EventsSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const events = [
    {
      title: '集団瞑想会',
      date: '2024年4月15日 10:00-12:00',
      location: '渋谷区瞑想センター',
      price: '¥2,000',
      capacity: '定員10名',
      image: 'https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83',
    },
    {
      title: 'チャクラ開放ワークショップ',
      date: '2024年4月16日 14:00-16:00',
      location: '新宿区ヨガスタジオ',
      price: '¥3,500',
      capacity: '定員15名',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
    },
    {
      title: '目醒めシェアリングサークル',
      date: '2024年4月17日 19:00-21:00',
      location: '目黒区コミュニティセンター',
      price: '¥1,500',
      capacity: '定員12名',
      image: 'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a',
    },
    {
      title: 'スピリチュアルヒーリング体験会',
      date: '2024年4月18日 13:00-15:00',
      location: '池袋区カルチャーセンター',
      price: '¥4,000',
      capacity: '定員8名',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
    },
  ];

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Calendar size={20} color="#000" />
            <Text style={{ fontSize: 18, fontWeight: '600' }}>イベント</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{ padding: 8, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6 }}
            >
              <Filter size={16} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: '#000',
                borderRadius: 6,
              }}
              onPress={() => setShowCreateDialog(true)}
            >
              <Plus size={16} color="#fff" />
              <Text style={{ color: '#fff', marginLeft: 4, fontSize: 14 }}>イベントを企画</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F3F4F6',
            borderRadius: 6,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginBottom: 24,
          }}
        >
          <Search size={16} color="#666" />
          <TextInput
            style={{ flex: 1, marginLeft: 8 }}
            placeholder="イベントを検索"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <Text style={{ fontWeight: '500', marginBottom: 12 }}>注目のイベント</Text>
          <View
            style={{ aspectRatio: 16 / 9, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}
          >
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800' }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
          <Text style={{ fontWeight: '500' }}>シアターワーク体験会</Text>
          <Text style={{ fontSize: 14, color: '#4B5563', marginTop: 4 }}>
            2024年4月20日 14:00-16:00
          </Text>
          <Text style={{ marginTop: 8 }}>青梅市文化会館</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: '#F3F4F6',
                borderRadius: 4,
              }}
            >
              <Text style={{ fontSize: 14 }}>参加費無料</Text>
            </View>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: '#F3F4F6',
                borderRadius: 4,
              }}
            >
              <Text style={{ fontSize: 14 }}>定員20名</Text>
            </View>
          </View>
        </View>

        <View style={{ gap: 16 }}>
          {events.map((event, i) => (
            <TouchableOpacity
              key={i}
              style={{
                backgroundColor: '#fff',
                borderRadius: 8,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 2,
              }}
              onPress={() => setSelectedEvent(event.title)}
            >
              <View style={{ aspectRatio: 16 / 9 }}>
                <Image
                  source={{ uri: event.image }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
              <View style={{ padding: 16 }}>
                <Text style={{ fontWeight: '500' }}>{event.title}</Text>
                <Text style={{ fontSize: 14, color: '#4B5563', marginTop: 4 }}>{event.date}</Text>
                <Text style={{ marginTop: 8 }}>{event.location}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      backgroundColor: '#F3F4F6',
                      borderRadius: 4,
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{event.price}</Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      backgroundColor: '#F3F4F6',
                      borderRadius: 4,
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{event.capacity}</Text>
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
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <View
              style={{
                flex: 1,
                marginTop: 80,
                backgroundColor: '#fff',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              }}
            >
              <ScrollView style={{ flex: 1, padding: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}>
                  新しいイベントを企画
                </Text>

                <View style={{ gap: 16 }}>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4 }}>
                      イベント名
                    </Text>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: '#D1D5DB',
                        borderRadius: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                      }}
                    />
                  </View>

                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4 }}>
                      コンテンツ
                    </Text>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: '#D1D5DB',
                        borderRadius: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        height: 96,
                      }}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4 }}>人数</Text>
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: '#D1D5DB',
                          borderRadius: 6,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                        }}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4 }}>金額</Text>
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: '#D1D5DB',
                          borderRadius: 6,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                        }}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4 }}>
                      開催場所
                    </Text>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: '#D1D5DB',
                        borderRadius: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                      }}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, paddingTop: 16 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderWidth: 1,
                        borderColor: '#D1D5DB',
                        borderRadius: 6,
                      }}
                      onPress={() => setShowCreateDialog(false)}
                    >
                      <Text style={{ textAlign: 'center' }}>キャンセル</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        backgroundColor: '#000',
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ textAlign: 'center', color: '#fff' }}>作成</Text>
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
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <View
              style={{
                flex: 1,
                marginTop: 80,
                backgroundColor: '#fff',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              }}
            >
              <ScrollView style={{ flex: 1, padding: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
                  {selectedEvent}
                </Text>

                <View
                  style={{
                    aspectRatio: 16 / 9,
                    borderRadius: 8,
                    overflow: 'hidden',
                    marginBottom: 16,
                  }}
                >
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800',
                    }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </View>

                <View style={{ gap: 16 }}>
                  <View>
                    <Text style={{ fontWeight: '500', marginBottom: 4 }}>イベント詳細</Text>
                    <Text style={{ fontSize: 14, color: '#4B5563' }}>
                      瞑想を通じて、心の平安とマインドフルネスを体験するワークショップです。
                      初心者の方も安心してご参加いただけます。
                    </Text>
                  </View>

                  <View style={{ gap: 12 }}>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '500' }}>開催日時</Text>
                      <Text style={{ fontSize: 14, color: '#4B5563' }}>
                        2024年4月20日 14:00-16:00
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '500' }}>場所</Text>
                      <Text style={{ fontSize: 14, color: '#4B5563' }}>渋谷区瞑想センター</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '500' }}>参加費</Text>
                      <Text style={{ fontSize: 14, color: '#4B5563' }}>¥3,000</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '500' }}>定員</Text>
                      <Text style={{ fontSize: 14, color: '#4B5563' }}>15名</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, paddingTop: 16 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderWidth: 1,
                        borderColor: '#D1D5DB',
                        borderRadius: 6,
                      }}
                      onPress={() => setSelectedEvent(null)}
                    >
                      <Text style={{ textAlign: 'center' }}>閉じる</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        backgroundColor: '#000',
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ textAlign: 'center', color: '#fff' }}>参加する</Text>
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
