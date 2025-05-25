import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Reusing sample events data from Events.tsx
const SAMPLE_EVENTS = [
  {
    id: '1',
    title: 'Tokyo Food Festival',
    date: '2023-06-15',
    time: '11:00 - 20:00',
    location: 'Yoyogi Park, Tokyo',
    image: 'https://picsum.photos/500/300?random=30',
    description:
      "Explore the best of Tokyo's food scene with over 100 vendors offering traditional and modern Japanese cuisine. The festival will feature food stalls, cooking demonstrations, tasting sessions, and cultural performances throughout the day.\n\nHighlights include:\n- Regional specialties from all over Japan\n- Sake and craft beer tasting area\n- Live cooking demonstrations by renowned chefs\n- Traditional music and dance performances\n- Activities for children including food-themed crafts",
    category: 'food',
    attendees: 458,
    price: 'Free Entry',
    organizer: {
      name: 'Tokyo Food Association',
      logo: 'https://i.pravatar.cc/150?img=30',
    },
    address: '2-1 Yoyogi Kamizonocho, Shibuya City, Tokyo 151-0052',
    website: 'www.tokyofoodfestival.jp',
  },
  {
    id: '2',
    title: 'Japanese Ink Painting Workshop',
    date: '2023-06-18',
    time: '14:00 - 16:30',
    location: 'Roppongi Arts Center, Tokyo',
    image: 'https://picsum.photos/500/300?random=31',
    description:
      'Learn the traditional art of Sumi-e (Japanese ink painting) with master artist Tanaka Hiroshi. This workshop is suitable for beginners and will cover the basics of brush techniques, composition, and the philosophy behind this ancient art form.\n\nAll materials will be provided, and participants will create their own ink painting to take home. The workshop will be conducted in Japanese with English translation available.',
    category: 'workshop',
    attendees: 24,
    price: '¥5,000',
    organizer: {
      name: 'Japan Traditional Arts Society',
      logo: 'https://i.pravatar.cc/150?img=31',
    },
    address: '6-6-9 Roppongi, Minato City, Tokyo 106-0032',
    website: 'www.japanarts.org/workshops',
  },
  {
    id: '3',
    title: 'Summer Night Market',
    date: '2023-06-24',
    time: '18:00 - 23:00',
    location: 'Nakameguro, Tokyo',
    image: 'https://picsum.photos/500/300?random=32',
    description:
      'Enjoy a vibrant night market with local crafts, street food, and live music along the Meguro River. As the sun sets, the riverbanks will be illuminated with lanterns creating a magical atmosphere for this summer evening event.\n\nThe market features:\n- Handcrafted goods from local artisans\n- Food stalls offering a variety of cuisines\n- Craft beer and sake tasting\n- Live acoustic performances\n- Riverside seating areas',
    category: 'market',
    attendees: 287,
    price: 'Free Entry',
    organizer: {
      name: 'Nakameguro Community Association',
      logo: 'https://i.pravatar.cc/150?img=32',
    },
    address: 'Nakameguro Station Area, Meguro City, Tokyo',
    website: 'www.nakameguro-nightmarket.jp',
  },
  {
    id: '4',
    title: 'Traditional Tea Ceremony',
    date: '2023-06-20',
    time: '13:00 - 15:00',
    location: 'Happo-en Garden, Tokyo',
    image: 'https://picsum.photos/500/300?random=33',
    description:
      'Experience the art and philosophy of Japanese tea ceremony in a beautiful traditional garden setting. This session will introduce participants to the customs, etiquette, and spiritual aspects of this important cultural practice.\n\nThe ceremony will be held in an authentic tea house within the historic Happo-en Garden, providing the perfect serene backdrop for this meditative experience. Participants will enjoy matcha tea and traditional Japanese sweets.',
    category: 'cultural',
    attendees: 18,
    price: '¥3,500',
    organizer: {
      name: 'Chado Culture Foundation',
      logo: 'https://i.pravatar.cc/150?img=33',
    },
    address: '1-1-1 Shirokanedai, Minato City, Tokyo 108-0071',
    website: 'www.happo-en.com/teaceremony',
  },
  {
    id: '5',
    title: 'Sumida River Fireworks Festival',
    date: '2023-07-29',
    time: '19:00 - 20:30',
    location: 'Sumida River, Tokyo',
    image: 'https://picsum.photos/500/300?random=34',
    description:
      "One of Tokyo's most famous fireworks displays with over 20,000 fireworks illuminating the summer night sky. This traditional festival dates back to the Edo period and has become one of the most anticipated summer events in Tokyo.\n\nThe fireworks can be viewed from various locations along the Sumida River, with the main viewing areas around Asakusa and the Tokyo Skytree. Food stalls and festival activities will be available throughout the area, creating a lively atmosphere for this spectacular summer tradition.",
    category: 'festival',
    attendees: 950,
    price: 'Free (Premium viewing areas available)',
    organizer: {
      name: 'Tokyo Tourism Association',
      logo: 'https://i.pravatar.cc/150?img=34',
    },
    address: 'Sumida River, between Sakurabashi and Kototoibashi, Tokyo',
    website: 'www.sumidagawa-hanabi.com',
  },
];

export default function EventDetail() {
  const [attending, setAttending] = useState(false);
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { eventId } = route.params || { eventId: '1' };

  // Find the event from the sample data
  const event = SAMPLE_EVENTS.find((e) => e.id === eventId) || SAMPLE_EVENTS[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: event.image }} style={styles.eventImage} contentFit="cover" />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Feather name="share-2" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {/* Event header */}
          <View style={styles.eventHeader}>
            <Text style={styles.eventCategory}>
              {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
            </Text>
            <Text style={styles.eventTitle}>{event.title}</Text>

            <View style={styles.organizerRow}>
              <Image source={{ uri: event.organizer.logo }} style={styles.organizerLogo} />
              <Text style={styles.organizerName}>Organized by {event.organizer.name}</Text>
            </View>
          </View>

          {/* Event details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Feather name="calendar" size={20} color="#0070F3" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailText}>{event.date}</Text>
                <Text style={styles.detailText}>{event.time}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Feather name="map-pin" size={20} color="#0070F3" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailText}>{event.location}</Text>
                <Text style={styles.detailAddress}>{event.address}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Feather name="users" size={20} color="#0070F3" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Attendees</Text>
                <Text style={styles.detailText}>{event.attendees} people attending</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Feather name="dollar-sign" size={20} color="#0070F3" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Price</Text>
                <Text style={styles.detailText}>{event.price}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.websiteLink}>
              <Feather name="globe" size={16} color="#0070F3" />
              <Text style={styles.websiteLinkText}>Visit event website</Text>
              <Feather name="external-link" size={16} color="#0070F3" />
            </TouchableOpacity>
          </View>

          {/* Event description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About Event</Text>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.actionBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>{event.price}</Text>
        </View>

        <TouchableOpacity
          style={[styles.attendButton, attending && styles.attendingButton]}
          onPress={() => setAttending(!attending)}
        >
          <Text style={[styles.attendButtonText, attending && styles.attendingButtonText]}>
            {attending ? 'Going' : 'Attend Event'}
          </Text>
          {attending && (
            <Feather name="check" size={16} color="#FFFFFF" style={styles.attendingIcon} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    position: 'relative',
    height: 250,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 20,
  },
  eventHeader: {
    marginBottom: 24,
  },
  eventCategory: {
    fontSize: 14,
    color: '#0070F3',
    fontWeight: '600',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 16,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  organizerName: {
    fontSize: 14,
    color: '#4A5568',
  },
  detailsSection: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#1A202C',
    fontWeight: '600',
  },
  detailAddress: {
    fontSize: 12,
    color: '#4A5568',
    marginTop: 2,
  },
  websiteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  websiteLinkText: {
    fontSize: 14,
    color: '#0070F3',
    fontWeight: '600',
    marginHorizontal: 8,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4A5568',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#718096',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  attendButton: {
    backgroundColor: '#0070F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendingButton: {
    backgroundColor: '#48BB78',
  },
  attendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  attendingButtonText: {
    color: '#FFFFFF',
  },
  attendingIcon: {
    marginLeft: 8,
  },
});
