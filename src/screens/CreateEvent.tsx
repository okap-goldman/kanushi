import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { useToast } from '../hooks/use-toast';
import { eventService } from '../lib/eventService';
import { storageService } from '../lib/storageService';

const EVENT_CATEGORIES = [
  { label: 'オフライン', value: 'offline' },
  { label: 'オンライン', value: 'online' },
  { label: 'ハイブリッド', value: 'hybrid' },
  { label: 'ボイスワークショップ', value: 'voice_workshop' },
];

export default function CreateEvent() {
  const navigation = useNavigation<any>();
  const { toast } = useToast();

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [category, setCategory] = useState('offline');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      toast({
        title: 'エラー',
        description: '画像の選択に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      toast({
        title: 'エラー',
        description: 'イベント名を入力してください',
        variant: 'destructive',
      });
      return;
    }

    if (!location.trim() && category !== 'online') {
      toast({
        title: 'エラー',
        description: '場所を入力してください',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let imageUrl = '';

      // Upload image if selected
      if (imageUri) {
        const uploadResult = await storageService.uploadImage(imageUri, 'event');
        if (uploadResult.data?.publicUrl) {
          imageUrl = uploadResult.data.publicUrl;
        }
      }

      // Create event
      const eventData = {
        title,
        description,
        location,
        start_date: startDate.toISOString(),
        end_date: endDate > startDate ? endDate.toISOString() : undefined,
        price: price ? Number(price) : 0,
        category,
        cover_image_url: imageUrl,
        image_url: imageUrl,
        is_online: category === 'online',
        is_published: true,
      };

      const result = await eventService.createEvent(eventData);

      if (result.error) {
        throw result.error;
      }

      toast({
        title: '成功',
        description: 'イベントが作成されました',
      });

      // Navigate to event detail
      if (result.data) {
        navigation.replace('EventDetail', { eventId: result.data.id });
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'エラー',
        description: 'イベントの作成に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Feather name="x" size={24} color="#1A202C" />
          </TouchableOpacity>
          <Text style={styles.title}>イベントを作成</Text>
          <Button
            onPress={handleSubmit}
            disabled={!title.trim() || loading}
            size="sm"
            style={styles.submitButton}
          >
            {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : '作成'}
          </Button>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Event Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>イベント名 *</Text>
            <Input
              placeholder="イベント名を入力"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>イベントの詳細</Text>
            <Textarea
              placeholder="イベントの詳細を入力"
              value={description}
              onChangeText={setDescription}
              style={styles.textarea}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Category */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>カテゴリー</Text>
            <Select
              value={category}
              onValueChange={setCategory}
              options={EVENT_CATEGORIES}
              placeholder="カテゴリーを選択"
            />
          </View>

          {/* Location */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>場所 {category !== 'online' && '*'}</Text>
            <Input
              placeholder={category === 'online' ? 'オンラインURL（任意）' : '場所を入力'}
              value={location}
              onChangeText={setLocation}
              style={styles.input}
            />
          </View>

          {/* Price */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>金額</Text>
            <Input
              placeholder="0"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              style={styles.input}
              leftIcon={<Text style={styles.currencyIcon}>¥</Text>}
            />
          </View>

          {/* Start Date */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>開始日時</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Feather name="calendar" size={20} color="#718096" />
              <Text style={styles.dateText}>{formatDate(startDate)}</Text>
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="datetime"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setStartDate(selectedDate);
                    // Update end date if it's before start date
                    if (endDate < selectedDate) {
                      setEndDate(selectedDate);
                    }
                  }
                }}
              />
            )}
          </View>

          {/* End Date */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>終了日時</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Feather name="calendar" size={20} color="#718096" />
              <Text style={styles.dateText}>{formatDate(endDate)}</Text>
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="datetime"
                display="default"
                minimumDate={startDate}
                onChange={(event, selectedDate) => {
                  setShowEndDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setEndDate(selectedDate);
                  }
                }}
              />
            )}
          </View>

          {/* Image */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>画像</Text>
            <TouchableOpacity style={styles.imageButton} onPress={handleImagePick}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} contentFit="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Feather name="image" size={40} color="#CBD5E0" />
                  <Text style={styles.imagePlaceholderText}>画像を選択</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  submitButton: {
    minWidth: 80,
  },
  form: {
    flex: 1,
    paddingHorizontal: 16,
  },
  formGroup: {
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F7FAFC',
  },
  textarea: {
    backgroundColor: '#F7FAFC',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#1A202C',
  },
  imageButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#718096',
  },
  currencyIcon: {
    fontSize: 16,
    color: '#718096',
  },
  bottomPadding: {
    height: 40,
  },
});