import { liveRoomService } from '@/lib/liveRoomService';
import React, { useState } from 'react';
import { Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface CreateLiveRoomDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (room: any) => void;
}

export function CreateLiveRoomDialog({ visible, onClose, onSuccess }: CreateLiveRoomDialogProps) {
  const [title, setTitle] = useState('');
  const [maxSpeakers, setMaxSpeakers] = useState(10);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const room = await liveRoomService.createRoom({
        title: title.trim(),
        maxSpeakers,
        isRecording,
      });
      onSuccess(room);
      onClose();
      // Reset form
      setTitle('');
      setMaxSpeakers(10);
      setIsRecording(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ルーム作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const incrementSpeakers = () => {
    if (maxSpeakers < 15) {
      setMaxSpeakers(maxSpeakers + 1);
    }
  };

  const decrementSpeakers = () => {
    if (maxSpeakers > 1) {
      setMaxSpeakers(maxSpeakers - 1);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>ライブルームを作成</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="ルームタイトル"
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>最大登壇者数</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity
                onPress={decrementSpeakers}
                testID="speaker-decrement"
                style={styles.counterButton}
              >
                <Text style={styles.counterButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue} testID="speaker-count">
                {maxSpeakers}
              </Text>
              <TouchableOpacity
                onPress={incrementSpeakers}
                testID="speaker-increment"
                style={styles.counterButton}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>録音する</Text>
            <Switch testID="recording-switch" value={isRecording} onValueChange={setIsRecording} />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <Button
              onPress={handleCreate}
              disabled={!title.trim() || loading}
              style={[styles.button, styles.primaryButton]}
            >
              <Text style={styles.buttonText}>作成</Text>
            </Button>
            <Button
              onPress={onClose}
              variant="outline"
              style={[styles.button, styles.secondaryButton]}
            >
              <Text style={styles.secondaryButtonText}>キャンセル</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    fontSize: 18,
  },
  counterValue: {
    marginHorizontal: 16,
    fontSize: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  actions: {
    marginTop: 20,
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 4,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#333',
    textAlign: 'center',
    fontSize: 16,
  },
});
