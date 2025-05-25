import { liveRoomService } from '@/lib/liveRoomService';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Mic, MicOff, MoreVertical, Radio, Users, X } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../ui/button';
import { LiveRoomChat } from './LiveRoomChat';
import { LiveRoomParticipants } from './LiveRoomParticipants';

interface RouteParams {
  roomId: string;
  userId: string;
  role: 'speaker' | 'listener';
}

export function LiveRoomScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { roomId, userId, role } = route.params as RouteParams;

  const [room, setRoom] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [hasRequestedToSpeak, setHasRequestedToSpeak] = useState(false);
  const [currentRole, setCurrentRole] = useState(role);

  useEffect(() => {
    joinRoom();
  }, []);

  const joinRoom = async () => {
    try {
      const result = await liveRoomService.joinRoom(roomId, userId, currentRole);
      setRoom(result.room);
      setToken(result.token);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ルーム参加に失敗しました');
      setLoading(false);
      Alert.alert('エラー', error || 'ルーム参加に失敗しました', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const handleRequestToSpeak = async () => {
    try {
      await liveRoomService.requestToSpeak(roomId);
      setHasRequestedToSpeak(true);
    } catch (err) {
      Alert.alert('エラー', err instanceof Error ? err.message : '登壇リクエストに失敗しました');
    }
  };

  const handleEndRoom = async () => {
    Alert.alert('ルームを終了しますか？', 'この操作は取り消せません', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '終了する',
        style: 'destructive',
        onPress: async () => {
          try {
            await liveRoomService.endRoom(roomId, false);
            navigation.goBack();
          } catch (err) {
            Alert.alert('エラー', 'ルーム終了に失敗しました');
          }
        },
      },
    ]);
  };

  const handleLeaveRoom = () => {
    Alert.alert('ルームを退出しますか？', 'いつでも再度参加できます', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '退出する',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const isHost = room?.host_user_id === userId;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={handleLeaveRoom}
            testID="leave-button"
            style={styles.closeButton}
          >
            <X size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.roomTitle}>{room?.title}</Text>
          <View style={styles.roomInfo}>
            <Radio size={16} color="#FF0000" />
            <Text style={styles.liveText}>LIVE</Text>
            {room?.is_recording && (
              <View testID="recording-indicator" style={styles.recordingDot} />
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          {isHost && (
            <TouchableOpacity onPress={() => {}} testID="room-menu" style={styles.menuButton}>
              <MoreVertical size={24} color="#333" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.participantInfo}>
        <Users size={20} color="#666" />
        <Text testID="participant-count" style={styles.participantCount}>
          {room?.participant_count || 0} 人が参加中
        </Text>
      </View>

      <View style={styles.content}>
        <LiveRoomChat
          roomId={roomId}
          userId={userId}
          userName="ユーザー名" // 実際はユーザー情報から取得
        />
      </View>

      <View style={styles.controls}>
        {currentRole === 'speaker' ? (
          <TouchableOpacity
            onPress={() => setIsMuted(!isMuted)}
            testID="mic-button"
            style={[styles.micButton, isMuted && styles.micButtonMuted]}
            accessibilityLabel={isMuted ? 'マイクオフ' : 'マイクオン'}
          >
            {isMuted ? <MicOff size={24} color="white" /> : <Mic size={24} color="white" />}
          </TouchableOpacity>
        ) : (
          <Button
            onPress={handleRequestToSpeak}
            disabled={hasRequestedToSpeak}
            style={styles.requestButton}
          >
            <Text style={styles.requestButtonText}>
              {hasRequestedToSpeak ? 'リクエスト送信済み' : '登壇リクエスト'}
            </Text>
          </Button>
        )}

        <TouchableOpacity
          onPress={() => setShowParticipants(!showParticipants)}
          style={styles.participantsButton}
        >
          <Users size={24} color="#333" />
        </TouchableOpacity>

        {isHost && (
          <TouchableOpacity onPress={handleEndRoom} style={styles.endButton}>
            <Text style={styles.endButtonText}>ルームを終了</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 参加者リストモーダル */}
      {showParticipants && (
        <LiveRoomParticipants
          roomId={roomId}
          hostUserId={room?.host_user_id}
          currentUserId={userId}
          isHost={isHost}
          onClose={() => setShowParticipants(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flex: 3,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: 8,
  },
  menuButton: {
    padding: 8,
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveText: {
    color: '#FF0000',
    fontWeight: 'bold',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  participantCount: {
    color: '#666',
  },
  content: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 16,
  },
  micButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonMuted: {
    backgroundColor: '#FF3B30',
  },
  requestButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  requestButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  participantsButton: {
    padding: 12,
  },
  endButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 16,
  },
  endButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
