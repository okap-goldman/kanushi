import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
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

  const formatEventDate = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;
    const isSameDay = start.toDateString() === end.toDateString();

    if (isSameDay) {
      return {
        date: format(start, 'PPP', { locale: ja }),
        time: `${format(start, 'p', { locale: ja })} - ${format(end, 'p', { locale: ja })}`,
      };
    } else {
      return {
        date: `${format(start, 'PPP', { locale: ja })} 〜 ${format(end, 'PPP', { locale: ja })}`,
        time: `${format(start, 'p', { locale: ja })} - ${format(end, 'p', { locale: ja })}`,
      };
    }
  };

  const getEventTypeInfo = (event: ExtendedEvent) => {
    const eventType = event.event_type || event.category;
    
    let typeInfo = { text: '', icon: 'calendar-outline' as const, color: '#666' };
    
    switch (eventType) {
      case 'online':
        typeInfo = { text: 'オンライン', icon: 'globe-outline', color: '#10B981' };
        break;
      case 'offline':
        typeInfo = { text: 'オフライン', icon: 'location-outline', color: '#F59E0B' };
        break;
      case 'hybrid':
        typeInfo = { text: 'ハイブリッド', icon: 'git-merge-outline', color: '#8B5CF6' };
        break;
      case 'voice_workshop':
        typeInfo = { text: '音声ワークショップ', icon: 'mic-outline', color: '#EC4899' };
        break;
      default:
        typeInfo = { text: 'イベント', icon: 'calendar-outline', color: '#666' };
    }
    
    return typeInfo;
  };

  const renderEventItem = ({ item }: { item: ExtendedEvent }) => {
    const typeInfo = getEventTypeInfo(item);
    const dateInfo = formatEventDate(item.start_date, item.end_date);
    const priceDisplay = item.price && item.price > 0 ? `¥${item.price.toLocaleString()}` : '無料';
    const isUserParticipating = item.user_participation_status === 'attending';
    const locationDisplay = item.is_online ? 'オンラインイベント' : item.location || '場所未定';

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, item.price && item.price > 0 ? styles.badgePrimary : styles.badgeOutline]}>
              <Text style={[styles.badgeText, item.price && item.price > 0 && styles.badgeTextPrimary]}>
                {priceDisplay}
              </Text>
            </View>
            
            <View style={styles.badgeSecondary}>
              <Ionicons name={typeInfo.icon} size={12} color={typeInfo.color} />
              <Text style={styles.badgeTextSecondary}>{typeInfo.text}</Text>
            </View>
            
            {isUserParticipating && (
              <View style={[styles.badge, styles.badgePrimary]}>
                <Text style={styles.badgeTextPrimary}>参加中</Text>
              </View>
            )}
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{dateInfo.date}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{dateInfo.time}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name={typeInfo.icon} size={16} color="#666" />
            <Text style={styles.infoText}>{locationDisplay}</Text>
          </View>
        </View>

        {item.description && (
          <View style={styles.cardContent}>
            <Text style={styles.description} numberOfLines={3}>
              {item.description}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.statsContainer}>
            {item.participant_count && item.participant_count > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={16} color="#666" />
                <Text style={styles.statText}>{item.participant_count}人参加</Text>
              </View>
            )}
          </View>

          <View style={styles.actionContainer}>
            <Text style={styles.viewDetailText}>詳細を見る</Text>
            <Ionicons name="chevron-forward" size={16} color="#007AFF" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (type: 'attending' | 'created') => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#CBD5E0" />
      <Text style={styles.emptyText}>
        {type === 'attending'
          ? '参加予定のイベントはありません'
          : '主催しているイベントはありません'}
      </Text>
      <Text style={styles.emptySubText}>
        {type === 'attending'
          ? '興味のあるイベントを見つけて参加してみましょう'
          : '新しいイベントを作成して、仲間を集めましょう'}
      </Text>
      <TouchableOpacity 
        style={styles.exploreButton} 
        onPress={() => navigation.navigate(type === 'attending' ? 'Events' : 'CreateEvent')}
      >
        <Ionicons 
          name={type === 'attending' ? 'search-outline' : 'add-outline'} 
          size={16} 
          color="#FFFFFF" 
          style={{ marginRight: 8 }} 
        />
        <Text style={styles.exploreButtonText}>
          {type === 'attending' ? 'イベントを探す' : 'イベントを作成'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>マイイベント</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
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
  headerTitle: {
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
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgePrimary: {
    backgroundColor: '#007AFF',
  },
  badgeOutline: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  badgeSecondary: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#666',
  },
  badgeTextPrimary: {
    color: '#fff',
  },
  badgeTextSecondary: {
    fontSize: 12,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
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
    fontSize: 18,
    color: '#1A202C',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
