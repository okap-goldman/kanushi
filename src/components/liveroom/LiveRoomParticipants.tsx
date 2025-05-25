import { liveRoomService } from '@/lib/liveRoomService';
import { Check, Crown, Gift, Search, X, XCircle } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Avatar } from '../ui/Avatar';

interface Participant {
  user_id: string;
  role: 'speaker' | 'listener';
  joined_at: string;
  user: {
    display_name: string;
    profile_image_url?: string;
  };
}

interface SpeakerRequest {
  id: string;
  requester_id: string;
  status: string;
  created_at: string;
  requester: {
    display_name: string;
  };
}

interface LiveRoomParticipantsProps {
  roomId: string;
  hostUserId: string;
  currentUserId: string;
  isHost: boolean;
  onClose?: () => void;
  refreshTrigger?: number;
}

export function LiveRoomParticipants({
  roomId,
  hostUserId,
  currentUserId,
  isHost,
  onClose,
  refreshTrigger,
}: LiveRoomParticipantsProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [speakerRequests, setSpeakerRequests] = useState<SpeakerRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showGiftDialog, setShowGiftDialog] = useState(false);

  useEffect(() => {
    loadParticipants();
    if (isHost) {
      loadSpeakerRequests();
    }
  }, [refreshTrigger]);

  const loadParticipants = async () => {
    try {
      const data = await liveRoomService.getParticipants(roomId);
      setParticipants(data);
    } catch (err) {
      console.error('Failed to load participants:', err);
    }
  };

  const loadSpeakerRequests = async () => {
    try {
      const data = await liveRoomService.getSpeakerRequests(roomId);
      setSpeakerRequests(data.filter((r) => r.status === 'pending'));
    } catch (err) {
      console.error('Failed to load speaker requests:', err);
    }
  };

  const handleSpeakerRequest = async (requestId: string, approve: boolean) => {
    try {
      await liveRoomService.handleSpeakerRequest(requestId, approve);
      loadSpeakerRequests();
      loadParticipants();
    } catch (err) {
      Alert.alert('エラー', 'リクエスト処理に失敗しました');
    }
  };

  const handleGiftSend = (userId: string) => {
    setSelectedUser(userId);
    setShowGiftDialog(true);
  };

  const sendGift = async (giftType: string) => {
    if (!selectedUser) return;

    try {
      await liveRoomService.sendGift(roomId, selectedUser, giftType, 1);
      Alert.alert('成功', 'ギフトを送信しました');
      setShowGiftDialog(false);
      setSelectedUser(null);
    } catch (err) {
      Alert.alert('エラー', err instanceof Error ? err.message : 'ギフト送信に失敗しました');
    }
  };

  const filteredParticipants = participants.filter((p) =>
    p.user.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const speakers = filteredParticipants.filter((p) => p.role === 'speaker');
  const listeners = filteredParticipants.filter((p) => p.role === 'listener');

  const renderParticipant = ({ item }: { item: Participant }) => {
    const isHost = item.user_id === hostUserId;
    const isCurrentUser = item.user_id === currentUserId;

    return (
      <View style={styles.participantItem}>
        <View style={styles.participantInfo}>
          <Avatar
            source={item.user.profile_image_url ? { uri: item.user.profile_image_url } : undefined}
            fallback={item.user.display_name[0]}
            size={40}
          />
          <View style={styles.participantDetails}>
            <View style={styles.nameContainer}>
              <Text style={styles.participantName}>{item.user.display_name}</Text>
              {isHost && (
                <View testID="host-badge" style={styles.hostBadge}>
                  <Crown size={12} color="white" />
                </View>
              )}
            </View>
          </View>
        </View>
        {item.role === 'speaker' && !isCurrentUser && (
          <TouchableOpacity
            onPress={() => handleGiftSend(item.user_id)}
            testID={`gift-button-${item.user_id}`}
            style={styles.giftButton}
          >
            <Gift size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderSpeakerRequest = ({ item }: { item: SpeakerRequest }) => (
    <View style={styles.requestItem}>
      <Text style={styles.requestName}>{item.requester.display_name}</Text>
      <View style={styles.requestActions}>
        <TouchableOpacity
          onPress={() => handleSpeakerRequest(item.id, true)}
          testID={`approve-${item.id}`}
          style={[styles.requestButton, styles.approveButton]}
        >
          <Check size={16} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleSpeakerRequest(item.id, false)}
          testID={`reject-${item.id}`}
          style={[styles.requestButton, styles.rejectButton]}
        >
          <XCircle size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>参加者</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#333" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="参加者を検索..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {isHost && speakerRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>登壇リクエスト ({speakerRequests.length})</Text>
            <FlatList
              data={speakerRequests}
              renderItem={renderSpeakerRequest}
              keyExtractor={(item) => item.id}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>スピーカー ({speakers.length})</Text>
          <FlatList
            data={speakers}
            renderItem={renderParticipant}
            keyExtractor={(item) => item.user_id}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>リスナー ({listeners.length})</Text>
          <FlatList
            data={listeners}
            renderItem={renderParticipant}
            keyExtractor={(item) => item.user_id}
          />
        </View>
      </View>

      {/* ギフト選択ダイアログ */}
      <Modal visible={showGiftDialog} transparent animationType="fade">
        <View style={styles.dialogOverlay}>
          <View style={styles.giftDialog}>
            <Text style={styles.giftDialogTitle}>ギフトを送る</Text>
            <TouchableOpacity onPress={() => sendGift('light')} style={styles.giftOption}>
              <Text style={styles.giftName}>光のギフト (300円)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => sendGift('star')} style={styles.giftOption}>
              <Text style={styles.giftName}>星のギフト (600円)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => sendGift('diamond')} style={styles.giftOption}>
              <Text style={styles.giftName}>ダイヤモンドギフト (1200円)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowGiftDialog(false);
                setSelectedUser(null);
              }}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  section: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
    color: '#666',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantDetails: {
    marginLeft: 12,
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantName: {
    fontSize: 16,
  },
  hostBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  giftButton: {
    padding: 8,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  requestName: {
    fontSize: 16,
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  requestButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftDialog: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  giftDialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  giftOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  giftName: {
    fontSize: 16,
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 16,
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
