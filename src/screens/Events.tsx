import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Sample events data
const SAMPLE_EVENTS = [
  {
    id: '1',
    title: 'Tokyo Food Festival',
    date: '2023-06-15',
    time: '11:00 - 20:00',
    location: 'Yoyogi Park, Tokyo',
    image: 'https://picsum.photos/500/300?random=30',
    description:
      "Explore the best of Tokyo's food scene with over 100 vendors offering traditional and modern Japanese cuisine.",
    category: 'food',
    attendees: 458,
    price: 'Free Entry',
  },
  {
    id: '2',
    title: 'Japanese Ink Painting Workshop',
    date: '2023-06-18',
    time: '14:00 - 16:30',
    location: 'Roppongi Arts Center, Tokyo',
    image: 'https://picsum.photos/500/300?random=31',
    description:
      'Learn the traditional art of Sumi-e (Japanese ink painting) with master artist Tanaka Hiroshi.',
    category: 'workshop',
    attendees: 24,
    price: '¥5,000',
  },
  {
    id: '3',
    title: 'Summer Night Market',
    date: '2023-06-24',
    time: '18:00 - 23:00',
    location: 'Nakameguro, Tokyo',
    image: 'https://picsum.photos/500/300?random=32',
    description:
      'Enjoy a vibrant night market with local crafts, street food, and live music along the Meguro River.',
    category: 'market',
    attendees: 287,
    price: 'Free Entry',
  },
  {
    id: '4',
    title: 'Traditional Tea Ceremony',
    date: '2023-06-20',
    time: '13:00 - 15:00',
    location: 'Happo-en Garden, Tokyo',
    image: 'https://picsum.photos/500/300?random=33',
    description:
      'Experience the art and philosophy of Japanese tea ceremony in a beautiful traditional garden setting.',
    category: 'cultural',
    attendees: 18,
    price: '¥3,500',
  },
  {
    id: '5',
    title: 'Sumida River Fireworks Festival',
    date: '2023-07-29',
    time: '19:00 - 20:30',
    location: 'Sumida River, Tokyo',
    image: 'https://picsum.photos/500/300?random=34',
    description:
      "One of Tokyo's most famous fireworks displays with over 20,000 fireworks illuminating the summer night sky.",
    category: 'festival',
    attendees: 950,
    price: 'Free (Premium viewing areas available)',
  },
];

const EVENT_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'food', name: 'Food' },
  { id: 'cultural', name: 'Cultural' },
  { id: 'workshop', name: 'Workshops' },
  { id: 'market', name: 'Markets' },
  { id: 'festival', name: 'Festivals' },
];

export default function Events() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigation = useNavigation<any>();

  const filteredEvents =
    selectedCategory === 'all'
      ? SAMPLE_EVENTS
      : SAMPLE_EVENTS.filter((event) => event.category === selectedCategory);

  const navigateToEventDetail = (eventId: string) => {
    navigation.navigate('EventDetail', { eventId });
  };

  const renderEventItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.eventCard} onPress={() => navigateToEventDetail(item.id)}>
      <Image source={{ uri: item.image }} style={styles.eventImage} contentFit="cover" />

      <View style={styles.eventContent}>
        <Text style={styles.eventDate}>
          {item.date} • {item.time}
        </Text>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventLocation} numberOfLines={1}>
          <Feather name="map-pin" size={12} color="#718096" /> {item.location}
        </Text>

        <View style={styles.eventFooter}>
          <View style={styles.attendeeCount}>
            <Feather name="users" size={14} color="#718096" />
            <Text style={styles.attendeeText}>{item.attendees} attending</Text>
          </View>
          <Text style={styles.eventPrice}>{item.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.title}>Events</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Feather name="search" size={24} color="#1A202C" />
        </TouchableOpacity>
      </View>

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

      <FlatList
        data={filteredEvents}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.eventsList}
        showsVerticalScrollIndicator={false}
      />
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
});
