import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import type { EventResponse } from '../../lib/eventServiceDrizzle';

interface EventCardProps {
  event: EventResponse;
  variant?: 'default' | 'compact';
  onParticipationChange?: () => void;
  participantCount?: number;
  isParticipating?: boolean;
}

export default function EventCard({
  event,
  variant = 'default',
  onParticipationChange,
  participantCount = 0,
  isParticipating = false,
}: EventCardProps) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);

  const isCompact = variant === 'compact';
  const startDate = new Date(event.startsAt);
  const endDate = new Date(event.endsAt);
  const isSameDay = startDate.toDateString() === endDate.toDateString();

  // Format price display
  const priceDisplay =
    event.fee && Number.parseFloat(event.fee) > 0
      ? `¥${Number.parseInt(event.fee).toLocaleString()}`
      : '無料';

  // Format location or online details
  const locationDisplay =
    event.eventType === 'online'
      ? 'オンラインイベント'
      : event.eventType === 'voice_workshop'
        ? '音声ワークショップ'
        : event.location || '場所未定';

  // Handle navigation to event detail
  const handleNavigateToEvent = () => {
    navigation.navigate('EventDetail', { eventId: event.id });
  };

  // Get event type label
  const getEventTypeLabel = () => {
    switch (event.eventType) {
      case 'online':
        return 'オンライン';
      case 'offline':
        return 'オフライン';
      case 'hybrid':
        return 'ハイブリッド';
      case 'voice_workshop':
        return '音声ワークショップ';
      default:
        return '';
    }
  };

  // Get event type icon
  const getEventTypeIcon = () => {
    switch (event.eventType) {
      case 'online':
        return 'globe-outline';
      case 'offline':
        return 'location-outline';
      case 'hybrid':
        return 'git-merge-outline';
      case 'voice_workshop':
        return 'mic-outline';
      default:
        return 'calendar-outline';
    }
  };

  return (
    <TouchableOpacity onPress={handleNavigateToEvent} activeOpacity={0.7}>
      <View style={[styles.card, isCompact && styles.cardCompact]}>
        <View style={[styles.cardHeader, isCompact && styles.cardHeaderCompact]}>
          <View style={styles.badgeContainer}>
            <View
              style={[
                styles.badge,
                event.fee && Number.parseFloat(event.fee) > 0
                  ? styles.badgePrimary
                  : styles.badgeOutline,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  event.fee && Number.parseFloat(event.fee) > 0 && styles.badgeTextPrimary,
                ]}
              >
                {priceDisplay}
              </Text>
            </View>

            <View style={styles.badgeSecondary}>
              <Ionicons name={getEventTypeIcon()} size={12} color="#666" />
              <Text style={styles.badgeTextSecondary}>{getEventTypeLabel()}</Text>
            </View>

            {isParticipating && (
              <View style={[styles.badge, styles.badgePrimary]}>
                <Text style={styles.badgeTextPrimary}>参加中</Text>
              </View>
            )}

            {event.workshop && (
              <View style={styles.badgeSecondary}>
                <Ionicons name="people-outline" size={12} color="#666" />
                <Text style={styles.badgeTextSecondary}>
                  定員{event.workshop.maxParticipants}名
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.title, isCompact && styles.titleCompact]} numberOfLines={2}>
            {event.name}
          </Text>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              {format(startDate, 'PPP', { locale: ja })}
              {!isSameDay && ` 〜 ${format(endDate, 'PPP', { locale: ja })}`}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              {format(startDate, 'p', { locale: ja })} - {format(endDate, 'p', { locale: ja })}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name={getEventTypeIcon()} size={16} color="#666" />
            <Text style={styles.infoText}>{locationDisplay}</Text>
          </View>

          {event.workshop && event.workshop.isRecorded && (
            <View style={styles.infoRow}>
              <Ionicons name="recording-outline" size={16} color="#666" />
              <Text style={styles.infoText}>録音あり（アーカイブ配信）</Text>
            </View>
          )}
        </View>

        {!isCompact && event.description && (
          <View style={styles.cardContent}>
            <Text style={styles.description} numberOfLines={3}>
              {event.description}
            </Text>
          </View>
        )}

        <View style={[styles.cardFooter, isCompact && styles.cardFooterCompact]}>
          <View style={styles.statsContainer}>
            {participantCount > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={16} color="#666" />
                <Text style={styles.statText}>{participantCount}人参加</Text>
              </View>
            )}
          </View>

          <View style={styles.actionContainer}>
            <Text style={styles.viewDetailText}>詳細を見る</Text>
            <Ionicons name="chevron-forward" size={16} color="#007AFF" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
  cardCompact: {
    maxWidth: 300,
  },
  cardHeader: {
    padding: 16,
  },
  cardHeaderCompact: {
    padding: 12,
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
  titleCompact: {
    fontSize: 16,
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
  cardFooterCompact: {
    padding: 12,
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
});
