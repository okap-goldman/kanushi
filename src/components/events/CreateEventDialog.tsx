import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  type CreateEventRequest,
  type CreateVoiceWorkshopRequest,
  eventServiceDrizzle,
} from '../../lib/eventServiceDrizzle';

interface CreateEventDialogProps {
  visible: boolean;
  onClose: () => void;
}

const EVENT_TYPES = [
  { value: 'offline', label: 'オフライン' },
  { value: 'online', label: 'オンライン' },
  { value: 'hybrid', label: 'ハイブリッド' },
  { value: 'voice_workshop', label: '音声ワークショップ' },
];

export default function CreateEventDialog({ visible, onClose }: CreateEventDialogProps) {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<'offline' | 'online' | 'hybrid' | 'voice_workshop'>(
    'offline'
  );
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [fee, setFee] = useState('');
  const [currency] = useState('JPY');
  const [refundPolicy, setRefundPolicy] = useState('イベント開始24時間前まで全額返金');

  // Voice workshop specific fields
  const [maxParticipants, setMaxParticipants] = useState('');
  const [isRecorded, setIsRecorded] = useState(false);
  const [archiveExpiresAt, setArchiveExpiresAt] = useState<Date | null>(null);

  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showArchiveDatePicker, setShowArchiveDatePicker] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('エラー', 'ログインが必要です');
      return;
    }

    // Validate required fields
    if (!name.trim()) {
      Alert.alert('エラー', 'イベント名を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time
      const startDateTime = new Date(startDate);
      startDateTime.setHours(startTime.getHours(), startTime.getMinutes());

      const endDateTime = new Date(endDate);
      endDateTime.setHours(endTime.getHours(), endTime.getMinutes());

      // Basic validation for dates
      if (endDateTime <= startDateTime) {
        Alert.alert('日時エラー', '終了日時は開始日時より後に設定してください');
        setIsSubmitting(false);
        return;
      }

      let result;

      if (eventType === 'voice_workshop') {
        // Create voice workshop
        const workshopData: CreateVoiceWorkshopRequest = {
          name,
          description: description || undefined,
          location: location || 'オンライン',
          startsAt: startDateTime,
          endsAt: endDateTime,
          fee: fee ? Number.parseInt(fee, 10) : undefined,
          currency,
          refundPolicy: refundPolicy || undefined,
          maxParticipants: maxParticipants ? Number.parseInt(maxParticipants, 10) : 10,
          isRecorded,
          archiveExpiresAt: archiveExpiresAt || undefined,
        };

        result = await eventServiceDrizzle.createVoiceWorkshop(workshopData, user.id);
      } else {
        // Create regular event
        const eventData: CreateEventRequest = {
          name,
          description: description || undefined,
          eventType,
          location: location || undefined,
          startsAt: startDateTime,
          endsAt: endDateTime,
          fee: fee ? Number.parseInt(fee, 10) : undefined,
          currency,
          refundPolicy: refundPolicy || undefined,
        };

        result = await eventServiceDrizzle.createEvent(eventData, user.id);
      }

      const { data, error } = result;

      if (error) {
        throw new Error(error.message);
      }

      Alert.alert('成功', 'イベントが作成されました', [
        {
          text: 'OK',
          onPress: () => {
            onClose();
            resetForm();
            if (data?.id) {
              navigation.navigate('EventDetail', { eventId: data.id });
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        'エラー',
        error instanceof Error ? error.message : 'イベントの作成に失敗しました'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setEventType('offline');
    setLocation('');
    setStartDate(new Date());
    setStartTime(new Date());
    setEndDate(new Date());
    setEndTime(new Date());
    setFee('');
    setRefundPolicy('イベント開始24時間前まで全額返金');
    setMaxParticipants('');
    setIsRecorded(false);
    setArchiveExpiresAt(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>新規イベント作成</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.submitButtonText}>作成</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Event Type */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>イベント種別*</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={eventType} onValueChange={setEventType} style={styles.picker}>
                {EVENT_TYPES.map((type) => (
                  <Picker.Item key={type.value} label={type.label} value={type.value} />
                ))}
              </Picker>
            </View>
            {eventType === 'voice_workshop' && (
              <Text style={styles.helperText}>
                音声での対話型ワークショップです。録音・アーカイブ機能があります。
              </Text>
            )}
          </View>

          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>イベント名*</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="イベント名を入力してください"
              placeholderTextColor="#999"
            />
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>説明</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="イベントの詳細を記入してください..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Location */}
          {eventType !== 'online' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>場所</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder={
                  eventType === 'voice_workshop' ? 'オンライン（省略可）' : '例: 東京都渋谷区'
                }
                placeholderTextColor="#999"
              />
            </View>
          )}

          {/* Start Date & Time */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>開始日時*</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.dateTimeButton, { flex: 1 }]}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.dateTimeText}>{format(startDate, 'PPP', { locale: ja })}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.dateTimeText}>{format(startTime, 'p', { locale: ja })}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* End Date & Time */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>終了日時*</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.dateTimeButton, { flex: 1 }]}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.dateTimeText}>{format(endDate, 'PPP', { locale: ja })}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.dateTimeText}>{format(endTime, 'p', { locale: ja })}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Price */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>参加費 ({currency})</Text>
            <TextInput
              style={styles.input}
              value={fee}
              onChangeText={setFee}
              placeholder="無料の場合は空欄"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>参加費を設定する場合は金額を入力してください</Text>
          </View>

          {/* Refund Policy */}
          {fee && Number.parseInt(fee) > 0 && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>返金ポリシー</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={refundPolicy}
                onChangeText={setRefundPolicy}
                placeholder="返金に関する規定を記載してください"
                placeholderTextColor="#999"
                multiline
                numberOfLines={2}
              />
            </View>
          )}

          {/* Voice Workshop Specific Fields */}
          {eventType === 'voice_workshop' && (
            <>
              {/* Max Participants */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>定員</Text>
                <TextInput
                  style={styles.input}
                  value={maxParticipants}
                  onChangeText={setMaxParticipants}
                  placeholder="10（デフォルト）"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>同時参加できる最大人数（1〜1000人）</Text>
              </View>

              {/* Recording Toggle */}
              <View style={styles.formGroup}>
                <View style={styles.toggleRow}>
                  <View>
                    <Text style={styles.label}>録音する</Text>
                    <Text style={styles.helperText}>
                      ワークショップを録音してアーカイブとして提供
                    </Text>
                  </View>
                  <Switch value={isRecorded} onValueChange={setIsRecorded} />
                </View>
              </View>

              {/* Archive Expiration */}
              {isRecorded && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>アーカイブ有効期限</Text>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => setShowArchiveDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                    <Text style={styles.dateTimeText}>
                      {archiveExpiresAt
                        ? format(archiveExpiresAt, 'PPP', { locale: ja })
                        : '無期限'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.helperText}>録画の公開期限（省略可）</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowStartDatePicker(false);
              if (date) setStartDate(date);
            }}
            minimumDate={new Date()}
          />
        )}

        {showStartTimePicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, time) => {
              setShowStartTimePicker(false);
              if (time) setStartTime(time);
            }}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowEndDatePicker(false);
              if (date) setEndDate(date);
            }}
            minimumDate={new Date()}
          />
        )}

        {showEndTimePicker && (
          <DateTimePicker
            value={endTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, time) => {
              setShowEndTimePicker(false);
              if (time) setEndTime(time);
            }}
          />
        )}

        {showArchiveDatePicker && (
          <DateTimePicker
            value={archiveExpiresAt || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowArchiveDatePicker(false);
              if (date) setArchiveExpiresAt(date);
            }}
            minimumDate={new Date()}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#000',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
