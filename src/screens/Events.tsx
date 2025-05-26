import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Input } from '../components/ui/Input';
import { useToast } from '../hooks/use-toast';
import { eventService, type ExtendedEvent } from '../lib/eventService';

const EVENT_CATEGORIES = [
  { id: 'all', name: 'すべて', value: undefined },
  { id: 'offline', name: 'オフライン', value: 'offline' },
  { id: 'online', name: 'オンライン', value: 'online' },
  { id: 'hybrid', name: 'ハイブリッド', value: 'hybrid' },
  { id: 'voice_workshop', name: 'ボイスワークショップ', value: 'voice_workshop' },
];

export default function Events() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [events, setEvents] = useState<ExtendedEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const navigation = useNavigation<any>();
  const { toast } = useToast();

  const fetchEvents = async (pageNum = 1, shouldRefresh = false) => {
    try {
      if (shouldRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const categoryValue = EVENT_CATEGORIES.find((cat) => cat.id === selectedCategory)?.value;
      
      const response = await eventService.getEvents({
        category: categoryValue,
        search: searchQuery,
        page: pageNum,
        limit: 20,
      });

      if (response.data) {
        if (pageNum === 1) {
          setEvents(response.data.events);
        } else {
          setEvents((prev) => [...prev, ...response.data.events]);
        }
        setHasMore(response.data.events.length === 20);
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

  useEffect(() => {
    fetchEvents(1);
  }, [selectedCategory, searchQuery]);

  const handleRefresh = () => {
    setPage(1);
    fetchEvents(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchEvents(nextPage);
    }
  };

  const navigateToEventDetail = (eventId: string) => {
    navigation.navigate('EventDetail', { eventId });
  };

  const formatEventDate = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    
    const startStr = start.toLocaleString('ja-JP', dateOptions);
    
    if (end) {
      const endStr = end.toLocaleString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${startStr} - ${endStr}`;
    }
    
    return startStr;
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
      <TouchableOpacity style={styles.eventCard} onPress={() => navigateToEventDetail(item.id)}>
        {item.image_url || item.cover_image_url ? (
          <Image 
            source={{ uri: item.image_url || item.cover_image_url }} 
            style={styles.eventImage} 
            contentFit="cover" 
          />
        ) : (
          <View style={[styles.eventImage, styles.placeholderImage]}>
            <Feather name="calendar" size={48} color="#CBD5E0" />
          </View>
        )}

        {badge && (
          <View style={[styles.eventTypeBadge, { backgroundColor: badge.color }]}>
            <Text style={styles.eventTypeBadgeText}>{badge.text}</Text>
          </View>
        )}

        <View style={styles.eventContent}>
          <Text style={styles.eventDate}>
            {formatEventDate(item.start_date, item.end_date)}
          </Text>
          <Text style={styles.eventTitle}>{item.title}</Text>
          
          {item.location && (
            <Text style={styles.eventLocation} numberOfLines={1}>
              <Feather name="map-pin" size={12} color="#718096" /> {item.location}
            </Text>
          )}

          <View style={styles.eventFooter}>
            <View style={styles.attendeeCount}>
              <Feather name="users" size={14} color="#718096" />
              <Text style={styles.attendeeText}>
                {item.participant_count || 0} 人参加
              </Text>
            </View>
            <Text style={styles.eventPrice}>
              {item.price ? `¥${item.price.toLocaleString()}` : '無料'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.title}>イベント</Text>
        <TouchableOpacity style={styles.searchButton} onPress={() => setShowSearch(!showSearch)}>
          <Feather name="search" size={24} color="#1A202C" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Input
            placeholder="イベントを検索..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            leftIcon={<Feather name="search" size={20} color="#718096" />}
            rightIcon={
              searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Feather name="x" size={20} color="#718096" />
                </TouchableOpacity>
              ) : null
            }
          />
        </View>
      )}

      {/* Categories filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {EVENT_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonSelected,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextSelected,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && events.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="calendar" size={64} color="#CBD5E0" />
          <Text style={styles.emptyText}>イベントがありません</Text>
          <Text style={styles.emptySubText}>
            {searchQuery 
              ? '検索条件に一致するイベントが見つかりませんでした' 
              : '新しいイベントが追加されるまでお待ちください'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.eventsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && events.length > 0 ? (
              <View style={styles.loadingFooter}>
                <Text style={styles.loadingFooterText}>読み込み中...</Text>
              </View>
            ) : null
          }
        />
      )}
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
  searchButton: {
    padding: 4,
  },
  categoriesContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoriesContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EDF2F7',
    marginHorizontal: 4,
  },
  categoryButtonSelected: {
    backgroundColor: '#0070F3',
  },
  categoryText: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  eventsList: {
    padding: 16,
  },
  eventCard: {
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
    width: '100%',
    height: 160,
  },
  eventContent: {
    padding: 16,
  },
  eventDate: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
  },
  eventLocation: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 12,
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
    fontSize: 12,
    color: '#718096',
    marginLeft: 4,
  },
  eventPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0070F3',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInput: {
    backgroundColor: '#F7FAFC',
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
    fontWeight: '600',
    color: '#2D3748',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingFooterText: {
    fontSize: 14,
    color: '#718096',
  },
  eventTypeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  eventTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  placeholderImage: {
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
