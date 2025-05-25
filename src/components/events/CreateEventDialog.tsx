import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import { eventService, CreateEventRequest } from "../../lib/eventService";
import { Picker } from "@react-native-picker/picker";

interface CreateEventDialogProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  "social",
  "conference",
  "workshop",
  "concert",
  "sports",
  "fitness",
  "food",
  "art",
  "culture",
  "business",
  "tech",
  "education",
  "family",
  "other",
];

const PRIVACY_LEVELS = [
  { value: "public", label: "Public (Anyone can see and join)" },
  { value: "friends", label: "Friends (Only your connections can see and join)" },
  { value: "private", label: "Private (By invitation only)" },
];

export default function CreateEventDialog({ visible, onClose }: CreateEventDialogProps) {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState("");
  const [onlineUrl, setOnlineUrl] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [price, setPrice] = useState("0");
  const [currency] = useState("JPY");
  const [category, setCategory] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState("public");
  const [registrationDeadline, setRegistrationDeadline] = useState<Date | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState("");

  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showRegistrationDatePicker, setShowRegistrationDatePicker] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to create an event");
      return;
    }

    // Validate required fields
    if (!title.trim()) {
      Alert.alert("Error", "Please enter an event title");
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
        Alert.alert("Invalid date/time", "End date/time must be after start date/time");
        setIsSubmitting(false);
        return;
      }

      const eventData: CreateEventRequest = {
        title,
        description: description || undefined,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        is_online: isOnline,
        price: parseInt(price, 10) || 0,
        currency,
        category: category || undefined,
        privacy_level: privacyLevel as "public" | "friends" | "private",
        registration_deadline: registrationDeadline?.toISOString(),
        cover_image_url: coverImageUrl || undefined,
      };

      // Add location or online URL based on event type
      if (isOnline) {
        eventData.online_url = onlineUrl || undefined;
      } else {
        eventData.location = location || undefined;
      }

      if (maxParticipants) {
        eventData.max_participants = parseInt(maxParticipants, 10);
      }

      // Create the event
      const { event, error } = await eventService.createEvent(eventData);

      if (error) {
        throw new Error(error.message);
      }

      Alert.alert("Success", "Your event has been created successfully", [
        {
          text: "OK",
          onPress: () => {
            onClose();
            if (event?.id) {
              navigation.navigate("EventDetail", { eventId: event.id });
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create event"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartDate(new Date());
    setStartTime(new Date());
    setEndDate(new Date());
    setEndTime(new Date());
    setIsOnline(false);
    setLocation("");
    setOnlineUrl("");
    setMaxParticipants("");
    setPrice("0");
    setCategory("");
    setPrivacyLevel("public");
    setRegistrationDeadline(null);
    setCoverImageUrl("");
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
          <Text style={styles.headerTitle}>Create New Event</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.submitButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Event Title*</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Give your event a name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your event..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Category */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={setCategory}
                style={styles.picker}
              >
                <Picker.Item label="Select a category" value="" />
                {CATEGORIES.map((cat) => (
                  <Picker.Item
                    key={cat}
                    label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                    value={cat}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Start Date & Time */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Date & Time*</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.dateTimeButton, { flex: 1 }]}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.dateTimeText}>{format(startDate, "PPP")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.dateTimeText}>{format(startTime, "p")}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* End Date & Time */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>End Date & Time*</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.dateTimeButton, { flex: 1 }]}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.dateTimeText}>{format(endDate, "PPP")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.dateTimeText}>{format(endTime, "p")}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Online Event Toggle */}
          <View style={styles.formGroup}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.label}>Online Event</Text>
                <Text style={styles.helperText}>
                  Enable if this event will be held online
                </Text>
              </View>
              <Switch value={isOnline} onValueChange={setIsOnline} />
            </View>
          </View>

          {/* Location or Online URL */}
          {isOnline ? (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Online URL</Text>
              <TextInput
                style={styles.input}
                value={onlineUrl}
                onChangeText={setOnlineUrl}
                placeholder="e.g., https://zoom.us/j/123456789"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
              <Text style={styles.helperText}>
                Provide a link where participants can join your event
              </Text>
            </View>
          ) : (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g., Tokyo, Shibuya"
                placeholderTextColor="#999"
              />
              <Text style={styles.helperText}>Provide the location of your event</Text>
            </View>
          )}

          {/* Max Participants */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Maximum Participants</Text>
            <TextInput
              style={styles.input}
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              placeholder="Leave empty for unlimited"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>
              Set a limit on the number of participants, or leave empty for unlimited
            </Text>
          </View>

          {/* Price */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Price ({currency})</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0 for free events"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>
              Set a price for your event, or 0 for free events
            </Text>
          </View>

          {/* Privacy Level */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Privacy Level</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={privacyLevel}
                onValueChange={setPrivacyLevel}
                style={styles.picker}
              >
                {PRIVACY_LEVELS.map((level) => (
                  <Picker.Item
                    key={level.value}
                    label={level.label}
                    value={level.value}
                  />
                ))}
              </Picker>
            </View>
            <Text style={styles.helperText}>Control who can see and join your event</Text>
          </View>

          {/* Registration Deadline */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Registration Deadline</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowRegistrationDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.dateTimeText}>
                {registrationDeadline ? format(registrationDeadline, "PPP") : "Optional"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>
              Last day for participants to register (optional)
            </Text>
          </View>

          {/* Cover Image URL */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Cover Image URL</Text>
            <TextInput
              style={styles.input}
              value={coverImageUrl}
              onChangeText={setCoverImageUrl}
              placeholder="URL to event cover image"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
            <Text style={styles.helperText}>
              Provide a URL for an image that represents your event
            </Text>
          </View>
        </ScrollView>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
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
            display={Platform.OS === "ios" ? "spinner" : "default"}
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
            display={Platform.OS === "ios" ? "spinner" : "default"}
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
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, time) => {
              setShowEndTimePicker(false);
              if (time) setEndTime(time);
            }}
          />
        )}

        {showRegistrationDatePicker && (
          <DateTimePicker
            value={registrationDeadline || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              setShowRegistrationDatePicker(false);
              if (date) setRegistrationDeadline(date);
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
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
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
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
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
    fontWeight: "500",
    marginBottom: 8,
    color: "#000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#000",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 8,
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  dateTimeText: {
    fontSize: 16,
    color: "#000",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  helperText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
});