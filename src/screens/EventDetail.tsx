import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useToast } from '../hooks/use-toast';
import { type ExtendedEvent, eventService } from '../lib/eventService';

export default function EventDetail() {
  const [event, setEvent] = useState<ExtendedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [participating, setParticipating] = useState(false);
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { eventId } = route.params;
  const { toast } = useToast();

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEvent(eventId);

      if (response.data) {
        setEvent(response.data);
        setParticipating(response.data.user_participation_status === 'attending');
      } else {
        toast({
          title: 'エラー',
          description: 'イベント情報の読み込みに失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading event:', error);
      toast({
        title: 'エラー',
        description: 'イベント情報の読み込みに失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleParticipation = async () => {
    if (!event) return;

    try {
      if (participating) {
        // 参加をキャンセル
        const response = await eventService.leaveEvent(event.id);
        if (response.data) {
          setParticipating(false);
          toast({
            title: '成功',
            description: 'イベント参加をキャンセルしました',
          });
        }
      } else {
        // イベントに参加
        const response = await eventService.joinEvent(event.id, 'attending');
        if (response.data) {
          setParticipating(true);
          toast({
            title: '成功',
            description: 'イベントに参加登録しました',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'エラー',
        description: '操作に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const formatEventDate = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };

    const dateStr = start.toLocaleDateString('ja-JP', dateOptions);
    const startTimeStr = start.toLocaleTimeString('ja-JP', timeOptions);

    if (end) {
      const endTimeStr = end.toLocaleTimeString('ja-JP', timeOptions);
      return {
        date: dateStr,
        time: `${startTimeStr} - ${endTimeStr}`,
      };
    }

    return {
      date: dateStr,
      time: startTimeStr,
    };
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070F3" />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={64} color="#CBD5E0" />
          <Text style={styles.errorText}>イベントが見つかりません</Text>
          <TouchableOpacity style={styles.backButtonAlt} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonAltText}>戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { date, time } = formatEventDate(event.start_date, event.end_date);
  const badge = getEventTypeBadge(event.event_type || event.category);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          {event.image_url || event.cover_image_url ? (
            <Image
              source={{ uri: event.image_url || event.cover_image_url }}
              style={styles.eventImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.eventImage, styles.placeholderImage]}>
              <Feather name="calendar" size={64} color="#CBD5E0" />
            </View>
          )}

          {badge && (
            <View style={[styles.eventTypeBadge, { backgroundColor: badge.color }]}>
              <Text style={styles.eventTypeBadgeText}>{badge.text}</Text>
            </View>
          )}

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
            <Text style={styles.eventTitle}>{event.title}</Text>

            {event.creator_profile && (
              <View style={styles.organizerRow}>
                {event.creator_profile.avatar_url && (
                  <Image
                    source={{ uri: event.creator_profile.avatar_url }}
                    style={styles.organizerLogo}
                  />
                )}
                <Text style={styles.organizerName}>
                  主催者: {event.creator_profile.display_name || event.creator_profile.username}
                </Text>
              </View>
            )}
          </View>

          {/* Event details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Feather name="calendar" size={20} color="#0070F3" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>日時</Text>
                <Text style={styles.detailText}>{date}</Text>
                <Text style={styles.detailText}>{time}</Text>
              </View>
            </View>

            {event.location && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Feather name="map-pin" size={20} color="#0070F3" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>場所</Text>
                  <Text style={styles.detailText}>{event.location}</Text>
                  {event.location_details?.address && (
                    <Text style={styles.detailAddress}>{event.location_details.address}</Text>
                  )}
                </View>
              </View>
            )}

            {event.is_online && event.online_url && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Feather name="video" size={20} color="#0070F3" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>オンライン会場</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(event.online_url!)}>
                    <Text style={styles.onlineLink}>オンラインリンクを開く</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Feather name="users" size={20} color="#0070F3" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>参加者</Text>
                <Text style={styles.detailText}>
                  {event.participant_count || 0} 人参加
                  {event.max_participants && ` / ${event.max_participants} 人定員`}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Feather name="tag" size={20} color="#0070F3" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>参加費</Text>
                <Text style={styles.detailText}>
                  {event.price ? `¥${event.price.toLocaleString()}` : '無料'}
                </Text>
              </View>
            </View>
          </View>

          {/* Event description */}
          {event.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>イベント詳細</Text>
              <Text style={styles.descriptionText}>{event.description}</Text>
            </View>
          )}

          {/* Refund policy */}
          {event.refund_policy && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>キャンセルポリシー</Text>
              <Text style={styles.descriptionText}>{event.refund_policy}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.actionBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>参加費</Text>
          <Text style={styles.priceValue}>
            {event.price ? `¥${event.price.toLocaleString()}` : '無料'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.attendButton, participating && styles.attendingButton]}
          onPress={handleParticipation}
        >
          <Text style={[styles.attendButtonText, participating && styles.attendingButtonText]}>
            {participating ? '参加予定' : 'イベントに参加'}
          </Text>
          {participating && (
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginTop: 16,
  },
  backButtonAlt: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0070F3',
    borderRadius: 8,
  },
  backButtonAltText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  eventTypeBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
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
  onlineLink: {
    fontSize: 14,
    color: '#0070F3',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
