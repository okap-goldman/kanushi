import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import { type ExtendedEvent, eventService } from '../lib/eventService';

export default function MyEvents() {
  const [activeTab, setActiveTab] = useState('attending');
  const [attendingEvents, setAttendingEvents] = useState<ExtendedEvent[]>([]);
  const [createdEvents, setCreatedEvents] = useState<ExtendedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      loadEvents();
    }
  }, [user?.id]);

  const loadEvents = async (shouldRefresh = false) => {
    if (!user?.id) return;

    try {
      if (shouldRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // 参加予定のイベントを取得
      const attendingResponse = await eventService.getUserEvents(user.id, 'attending');
      if (attendingResponse.data) {
        setAttendingEvents(attendingResponse.data);
      }

      // 主催しているイベントを取得
      const createdResponse = await eventService.getUserEvents(user.id, 'created');
      if (createdResponse.data) {
        setCreatedEvents(createdResponse.data);
      }
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'イベントの読み込みに失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadEvents(true);
  };

  const formatEventDate = (startDate: string) => {
    const date = new Date(startDate);
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };

    return date.toLocaleString('ja-JP', dateOptions);
  };

  const getEventTypeBadge = (eventType?: string) => {
    switch (eventType) {
      case 'online':
        return { text: 'オンライン', color: '#10B981' };
      case 'offline':
        return { text: 'オフライン', color: '#F59E0B' };
      case 'hybrid':
        return { text: 'ハイブリッド', color: '#8B5CF6' };
      case 'voice_workshop':
        return { text: 'ボイスワークショップ', color: '#EC4899' };
      default:
        return null;
    }
  };

  const renderEventItem = ({ item }: { item: ExtendedEvent }) => {
    const badge = getEventTypeBadge(item.event_type || item.category);

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
      >
        {item.image_url || item.cover_image_url ? (
          <Image
            source={{ uri: item.image_url || item.cover_image_url }}
            style={styles.eventImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.eventImage, styles.placeholderImage]}>
            <Feather name="calendar" size={32} color="#CBD5E0" />
          </View>
        )}

        {badge && (
          <View style={[styles.eventTypeBadge, { backgroundColor: badge.color }]}>
            <Text style={styles.eventTypeBadgeText}>{badge.text}</Text>
          </View>
        )}

        <View style={styles.eventContent}>
          <Text style={styles.eventDate}>{formatEventDate(item.start_date)}</Text>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {item.location && (
            <Text style={styles.eventLocation} numberOfLines={1}>
              <Feather name="map-pin" size={12} color="#718096" /> {item.location}
            </Text>
          )}

          <View style={styles.eventFooter}>
            <View style={styles.attendeeCount}>
              <Feather name="users" size={12} color="#718096" />
              <Text style={styles.attendeeText}>{item.participant_count || 0} 人参加</Text>
            </View>
            <Text style={styles.eventPrice}>
              {item.price ? `¥${item.price.toLocaleString()}` : '無料'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (type: 'attending' | 'created') => (
    <View style={styles.emptyContainer}>
      <Feather name="calendar" size={64} color="#CBD5E0" />
      <Text style={styles.emptyText}>
        {type === 'attending'
          ? '参加予定のイベントはありません'
          : '主催しているイベントはありません'}
      </Text>
      <TouchableOpacity style={styles.exploreButton} onPress={() => navigation.navigate('Events')}>
        <Text style={styles.exploreButtonText}>イベントを探す</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.title}>マイイベント</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Feather name="plus" size={24} color="#0070F3" />
        </TouchableOpacity>
      </View>

      <Tabs value={activeTab} onValueChange={setActiveTab} style={styles.tabs}>
        <TabsList style={styles.tabsList}>
          <TabsTrigger value="attending" style={styles.tabTrigger}>
            参加予定
          </TabsTrigger>
          <TabsTrigger value="created" style={styles.tabTrigger}>
            主催中
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attending" style={styles.tabContent}>
          {loading && attendingEvents.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>読み込み中...</Text>
            </View>
          ) : attendingEvents.length === 0 ? (
            renderEmptyState('attending')
          ) : (
            <FlatList
              data={attendingEvents}
              renderItem={renderEventItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.eventsList}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            />
          )}
        </TabsContent>

        <TabsContent value="created" style={styles.tabContent}>
          {loading && createdEvents.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>読み込み中...</Text>
            </View>
          ) : createdEvents.length === 0 ? (
            renderEmptyState('created')
          ) : (
            <FlatList
              data={createdEvents}
              renderItem={renderEventItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.eventsList}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            />
          )}
        </TabsContent>
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  createButton: {
    padding: 4,
  },
  tabs: {
    flex: 1,
  },
  tabsList: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabTrigger: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  eventsList: {
    padding: 16,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  eventImage: {
    width: 100,
    height: 100,
  },
  placeholderImage: {
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventTypeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  eventContent: {
    flex: 1,
    padding: 12,
  },
  eventDate: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 8,
  },
  eventLocation: {
    fontSize: 12,
    color: '#4A5568',
    marginBottom: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeeCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeText: {
    fontSize: 11,
    color: '#718096',
    marginLeft: 4,
  },
  eventPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0070F3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#718096',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0070F3',
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
