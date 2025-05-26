import { CreateLiveRoomDialog } from '@/components/liveroom/CreateLiveRoomDialog';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { liveRoomService } from '@/lib/liveRoomService';
import { useNavigation } from '@react-navigation/native';
import { Plus, Radio, Users } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface LiveRoom {
  id: string;
  title: string;
  host_user_id: string;
  status: string;
  participant_count: number;
  is_recording: boolean;
  created_at: string;
  host?: {
    display_name: string;
    profile_image_url?: string;
  };
}

export default function LiveRooms() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const activeRooms = await liveRoomService.getActiveRooms();
      setRooms(activeRooms);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRooms();
  };

  const handleJoinRoom = (room: LiveRoom) => {
    const isHost = room.host_user_id === user?.id;
    navigation.navigate('LiveRoom', {
      roomId: room.id,
      userId: user?.id,
      role: isHost ? 'speaker' : 'listener',
      preloadedData: room,
    });
  };

  const handleCreateSuccess = (room: any) => {
    setShowCreateDialog(false);
    navigation.navigate('LiveRoom', {
      roomId: room.id,
      userId: user?.id,
      role: 'speaker',
    });
  };

  const renderRoom = ({ item }: { item: LiveRoom }) => (
    <TouchableOpacity onPress={() => handleJoinRoom(item)}>
      <Card style={styles.roomCard}>
        <CardContent style={styles.roomContent}>
          <View style={styles.roomHeader}>
            <View style={styles.liveIndicator}>
              <Radio size={16} color="#FF0000" />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            {item.is_recording && (
              <View style={styles.recordingBadge}>
                <Text style={styles.recordingText}>REC</Text>
              </View>
            )}
          </View>

          <Text style={styles.roomTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.roomInfo}>
            <Text style={styles.hostName}>{item.host?.display_name || 'Unknown Host'}</Text>
            <View style={styles.participantInfo}>
              <Users size={14} color="#666" />
              <Text style={styles.participantCount}>{item.participant_count}</Text>
            </View>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Radio size={48} color="#ccc" />
      <Text style={styles.emptyText}>現在アクティブなライブルームはありません</Text>
      <Text style={styles.emptySubtext}>新しいライブルームを作成してみましょう</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ライブルーム</Text>
        <TouchableOpacity onPress={() => setShowCreateDialog(true)} style={styles.createButton}>
          <Plus size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={renderEmpty}
      />

      <CreateLiveRoomDialog
        visible={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleCreateSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    padding: 8,
  },
  list: {
    padding: 16,
  },
  roomCard: {
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roomContent: {
    padding: 16,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveText: {
    color: '#FF0000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  recordingBadge: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recordingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  roomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hostName: {
    color: '#666',
    fontSize: 14,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantCount: {
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});
