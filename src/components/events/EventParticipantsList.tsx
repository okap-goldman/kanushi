import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Avatar } from '../ui/Avatar';
import type { EventParticipant } from '../../lib/eventService';

interface EventParticipantsListProps {
  participants: EventParticipant[];
  isHost: boolean;
  onParticipantPress?: (participant: EventParticipant) => void;
}

export default function EventParticipantsList({
  participants,
  isHost,
  onParticipantPress,
}: EventParticipantsListProps) {
  if (!isHost) {
    return (
      <View style={styles.notHostContainer}>
        <Ionicons name="lock-closed-outline" size={48} color="#CBD5E0" />
        <Text style={styles.notHostTitle}>参加者リストは主催者のみ表示できます</Text>
        <Text style={styles.notHostDescription}>
          イベントを主催している場合のみ、参加者の詳細を確認できます。
        </Text>
      </View>
    );
  }

  if (participants.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={64} color="#CBD5E0" />
        <Text style={styles.emptyTitle}>まだ参加者がいません</Text>
        <Text style={styles.emptyDescription}>
          参加者が登録すると、こちらに表示されます。
        </Text>
      </View>
    );
  }

  const renderParticipant = ({ item }: { item: EventParticipant }) => (
    <TouchableOpacity
      style={styles.participantCard}
      onPress={() => onParticipantPress?.(item)}
      activeOpacity={0.7}
    >
      <Avatar
        uri={item.profile?.avatar_url}
        username={item.profile?.username || ''}
        size={48}
      />
      
      <View style={styles.participantInfo}>
        <Text style={styles.participantName}>
          {item.profile?.display_name || item.profile?.username || '名前未設定'}
        </Text>
        
        <View style={styles.participantMeta}>
          <View style={styles.statusBadge}>
            <Ionicons 
              name={item.status === 'attending' ? 'checkmark-circle' : 'help-circle'} 
              size={12} 
              color={item.status === 'attending' ? '#10B981' : '#F59E0B'} 
            />
            <Text style={[
              styles.statusText,
              { color: item.status === 'attending' ? '#10B981' : '#F59E0B' }
            ]}>
              {item.status === 'attending' ? '参加確定' : '興味あり'}
            </Text>
          </View>
          
          {item.payment_status && (
            <View style={styles.paymentBadge}>
              <Ionicons 
                name={item.payment_status === 'paid' ? 'card' : 'time'} 
                size={12} 
                color={item.payment_status === 'paid' ? '#10B981' : '#F59E0B'} 
              />
              <Text style={[
                styles.paymentText,
                { color: item.payment_status === 'paid' ? '#10B981' : '#F59E0B' }
              ]}>
                {item.payment_status === 'paid' ? '決済済み' : 
                 item.payment_status === 'pending' ? '決済待ち' : 
                 item.payment_status === 'refunded' ? '返金済み' : '無料'}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.joinedDate}>
          参加日: {new Date(item.created_at).toLocaleDateString('ja-JP')}
        </Text>
      </View>
      
      <View style={styles.participantActions}>
        <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
      </View>
    </TouchableOpacity>
  );

  const attendingCount = participants.filter(p => p.status === 'attending').length;
  const interestedCount = participants.filter(p => p.status === 'interested').length;

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{attendingCount}</Text>
          <Text style={styles.statLabel}>参加確定</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{interestedCount}</Text>
          <Text style={styles.statLabel}>興味あり</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{participants.length}</Text>
          <Text style={styles.statLabel}>合計</Text>
        </View>
      </View>

      <FlatList
        data={participants}
        renderItem={renderParticipant}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notHostContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  notHostTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  notHostDescription: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F7FAFC',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  participantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 6,
  },
  participantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '500',
  },
  joinedDate: {
    fontSize: 12,
    color: '#718096',
  },
  participantActions: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});