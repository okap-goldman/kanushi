import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import {
  getMockEvent,
  getMockEventPosts,
  type MockEventPost,
} from '../lib/mockData/events';
import EventParticipantsList from '../components/events/EventParticipantsList';
import type { EventParticipant } from '../lib/eventService';
import { useAuth } from '../context/AuthContext';
// import { ShareModal } from '../components/ShareModal';

export default function EventDetail() {
  const [event, setEvent] = useState<ExtendedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [participating, setParticipating] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [relatedPosts, setRelatedPosts] = useState<MockEventPost[]>([]);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { eventId } = route.params || {};
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadEvent();
    loadEventData();
    loadParticipants();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      
      // eventIdが無い場合のエラーハンドリング
      if (!eventId) {
        toast({
          title: 'エラー',
          description: 'イベントIDが指定されていません',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      
      // モックデータを使用
      const mockEvent = getMockEvent(eventId);
      
      if (mockEvent) {
        // ExtendedEvent形式に変換
        const extendedEvent: ExtendedEvent = {
          id: mockEvent.id,
          title: mockEvent.title,
          description: mockEvent.description,
          start_date: mockEvent.start_date,
          end_date: mockEvent.end_date,
          location: mockEvent.location,
          online_url: mockEvent.online_url,
          price: mockEvent.price,
          currency: mockEvent.currency,
          capacity: mockEvent.capacity,
          current_participants: mockEvent.current_participants,
          event_type: mockEvent.event_type,
          category: mockEvent.category,
          cover_image: mockEvent.cover_image,
          cover_image_url: mockEvent.cover_image, // 追加: cover_image_urlも設定
          image_url: mockEvent.cover_image, // 追加: image_urlも設定
          is_registered: mockEvent.is_registered,
          created_at: mockEvent.created_at,
          creator_profile: mockEvent.host ? {
            id: mockEvent.host.id,
            username: mockEvent.host.username,
            display_name: mockEvent.host.display_name,
            avatar_url: mockEvent.host.avatar_url,
            bio: mockEvent.host.bio,
          } : undefined,
          participant_count: mockEvent.current_participants,
          max_participants: mockEvent.capacity,
          user_participation_status: mockEvent.is_registered ? 'attending' : undefined,
          is_online: mockEvent.event_type === 'online' || mockEvent.event_type === 'hybrid',
        };
        
        setEvent(extendedEvent);
        setParticipating(mockEvent.is_registered || false);
      } else {
        toast({
          title: 'エラー',
          description: 'イベントが見つかりません',
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

  const loadEventData = () => {
    const eventPosts = getMockEventPosts(eventId);
    setRelatedPosts(eventPosts);
  };

  const loadParticipants = async () => {
    if (!eventId) return;
    
    try {
      setParticipantsLoading(true);
      const { data, error } = await eventService.getEventParticipants(eventId);
      
      if (error) {
        console.error('Error loading participants:', error);
      } else {
        setParticipants(data || []);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setParticipantsLoading(false);
    }
  };

  const isEventHost = user && event && event.organizer_id === user.id;

  const handleParticipation = async () => {
    if (!event) return;

    try {
      // モック実装: 単純にステータスを切り替え
      if (participating) {
        setParticipating(false);
        toast({
          title: '成功',
          description: 'イベント参加をキャンセルしました',
        });
      } else {
        setParticipating(true);
        toast({
          title: '成功',
          description: 'イベントに参加登録しました',
        });
      }
    } catch (error) {
      toast({
        title: 'エラー',
        description: '操作に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleContactOrganizer = () => {
    if (!event?.creator_profile?.id) {
      toast({
        title: 'エラー',
        description: '主催者情報が見つかりません',
        variant: 'destructive',
      });
      return;
    }

    navigation.navigate('MessageDetail', { 
      userId: event.creator_profile.id,
      userName: event.creator_profile.display_name || event.creator_profile.username
    });
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
          {(event.cover_image || event.cover_image_url || event.image_url) ? (
            <Image
              source={{ uri: event.cover_image || event.cover_image_url || event.image_url }}
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
          <TouchableOpacity style={styles.shareButton} onPress={() => setShowShareModal(true)}>
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

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'details' && styles.activeTab]}
              onPress={() => setActiveTab('details')}
            >
              <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
                詳細
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
              onPress={() => setActiveTab('posts')}
            >
              <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
                関連投稿 ({relatedPosts.length})
              </Text>
            </TouchableOpacity>
            {isEventHost && (
              <TouchableOpacity
                style={[styles.tab, activeTab === 'participants' && styles.activeTab]}
                onPress={() => setActiveTab('participants')}
              >
                <Text style={[styles.tabText, activeTab === 'participants' && styles.activeTabText]}>
                  参加者 ({participants.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <View>
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

              {/* 主催者に連絡ボタン */}
              <TouchableOpacity 
                style={styles.contactOrganizerButton}
                onPress={handleContactOrganizer}
              >
                <Feather name="message-circle" size={20} color="#0070F3" />
                <Text style={styles.contactOrganizerText}>主催者に連絡</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Related Posts Tab */}
          {activeTab === 'posts' && (
            <View style={styles.tabContent}>
              <FlatList
                data={relatedPosts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.relatedPostCard}>
                    <View style={styles.relatedPostHeader}>
                      <Image
                        source={{ uri: item.user?.avatar_url }}
                        style={styles.relatedPostAvatar}
                      />
                      <View style={styles.relatedPostUserInfo}>
                        <Text style={styles.relatedPostUserName}>{item.user?.display_name}</Text>
                        <Text style={styles.relatedPostDate}>
                          {new Date(item.created_at).toLocaleDateString('ja-JP')}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.relatedPostTitle}>{item.title}</Text>
                    <Text style={styles.relatedPostContent}>{item.content}</Text>
                    {item.audio_url && (
                      <View style={styles.relatedPostAudio}>
                        <Text style={styles.audioPlaceholder}>🎵 音声投稿 ({item.audio_duration}秒)</Text>
                      </View>
                    )}
                    {item.image_urls && item.image_urls.length > 0 && (
                      <View style={styles.relatedPostImages}>
                        {item.image_urls.slice(0, 2).map((imageUrl, index) => {
                          return (
                            <Image
                              key={`${item.id}-image-${index}`}
                              source={{ uri: imageUrl }}
                              style={styles.relatedPostImage}
                            />
                          );
                        })}
                      </View>
                    )}
                    <View style={styles.relatedPostStats}>
                      <Text style={styles.relatedPostStat}>❤️ {item.likes_count}</Text>
                      <Text style={styles.relatedPostStat}>💬 {item.comments_count}</Text>
                    </View>
                  </View>
                )}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Participants Tab */}
          {activeTab === 'participants' && (
            <View style={styles.tabContent}>
              {participantsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#0070F3" />
                  <Text style={styles.loadingText}>参加者を読み込み中...</Text>
                </View>
              ) : (
                <EventParticipantsList
                  participants={participants}
                  isHost={isEventHost || false}
                  onParticipantPress={(participant) => {
                    // ここで参加者詳細画面に遷移するなど
                    console.log('Participant pressed:', participant);
                  }}
                />
              )}
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

      {/* Share Modal */}
      {/* TODO: Implement ShareModal
      {showShareModal && (
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareUrl={`https://kanushi.app/events/${eventId}`}
          title={event?.title || 'イベント'}
        />
      )}
      */}
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
  
  // New styles for tabs and content
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1A202C',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  
  // Related post styles
  relatedPostCard: {
    marginBottom: 16,
    padding: 16,
  },
  relatedPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  relatedPostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  relatedPostUserInfo: {
    flex: 1,
  },
  relatedPostUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
  },
  relatedPostDate: {
    fontSize: 12,
    color: '#718096',
  },
  relatedPostTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 8,
  },
  relatedPostContent: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    marginBottom: 12,
  },
  relatedPostAudio: {
    marginBottom: 12,
  },
  relatedPostImages: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  relatedPostImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  relatedPostStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  relatedPostStat: {
    fontSize: 12,
    color: '#718096',
    marginRight: 16,
  },
  
  // Audio Placeholder
  audioPlaceholder: {
    fontSize: 12,
    color: '#718096',
    fontStyle: 'italic',
    backgroundColor: '#F7FAFC',
    padding: 8,
    borderRadius: 6,
  },
  
  // Contact Organizer Button
  contactOrganizerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#0070F3',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  contactOrganizerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0070F3',
    marginLeft: 8,
  },
});
