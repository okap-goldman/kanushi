import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  ActivityIndicator,
  Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { Event, eventService } from "../../lib/eventService";
import { useAuth } from "../../context/AuthContext";

interface EventCardProps {
  event: Event;
  variant?: "default" | "compact";
  onParticipationChange?: () => void;
}

export default function EventCard({ 
  event, 
  variant = "default",
  onParticipationChange 
}: EventCardProps) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [participationStatus, setParticipationStatus] = useState<'attending' | 'interested' | null>(
    event.user_participation_status === 'attending' || event.user_participation_status === 'interested' 
      ? event.user_participation_status 
      : null
  );

  const isCompact = variant === "compact";
  const startDate = new Date(event.start_datetime);
  const endDate = new Date(event.end_datetime);
  const isSameDay = startDate.toDateString() === endDate.toDateString();
  
  // Format price display
  const priceDisplay = event.price > 0 
    ? `${event.price.toLocaleString()} ${event.currency}` 
    : "Free";

  // Format location or online details
  const locationDisplay = event.is_online 
    ? "Online Event" 
    : (event.location || "Location not specified");

  // Get avatar initials from creator name
  const creatorName = event.creator_profile?.display_name || event.creator_profile?.username || "Unknown";
  const creatorInitials = creatorName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  // Handle navigation to event detail
  const handleNavigateToEvent = () => {
    navigation.navigate('EventDetail', { eventId: event.id });
  };

  // Handle joining event
  const handleJoinEvent = async (status: 'attending' | 'interested') => {
    if (!user) {
      Alert.alert(
        "Authentication required",
        "Please sign in to join events",
        [{ text: "OK" }]
      );
      return;
    }

    setIsJoining(true);
    try {
      // If already in this status, leave the event
      if (participationStatus === status) {
        const { success, error } = await eventService.leaveEvent(event.id);
        if (error) throw new Error(error.message);
        
        if (success) {
          setParticipationStatus(null);
          Alert.alert(
            "Left event",
            "You have been removed from this event",
            [{ text: "OK" }]
          );
        }
      } else {
        // Otherwise, join/update status
        const { participation, error } = await eventService.joinEvent(event.id, status);
        if (error) throw new Error(error.message);
        
        if (participation) {
          setParticipationStatus(status);
          Alert.alert(
            status === 'attending' ? "Joined event" : "Marked as interested",
            status === 'attending' 
              ? "You are now attending this event" 
              : "You've marked this event as interesting",
            [{ text: "OK" }]
          );
        }
      }
      
      // Notify parent component if callback provided
      if (onParticipationChange) {
        onParticipationChange();
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update event participation",
        [{ text: "OK" }]
      );
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <View style={[styles.card, isCompact && styles.cardCompact]}>
      {event.cover_image_url && (
        <TouchableOpacity onPress={handleNavigateToEvent}>
          <Image 
            source={{ uri: event.cover_image_url }}
            style={[styles.coverImage, isCompact && styles.coverImageCompact]}
          />
        </TouchableOpacity>
      )}
      
      <View style={[styles.cardHeader, isCompact && styles.cardHeaderCompact]}>
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, event.price > 0 ? styles.badgePrimary : styles.badgeOutline]}>
            <Text style={[styles.badgeText, event.price > 0 && styles.badgeTextPrimary]}>
              {priceDisplay}
            </Text>
          </View>
          {event.category && (
            <View style={styles.badgeSecondary}>
              <Text style={styles.badgeTextSecondary}>
                {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
              </Text>
            </View>
          )}
          
          {participationStatus && (
            <View style={[styles.badge, participationStatus === 'attending' ? styles.badgePrimary : styles.badgeOutline]}>
              <Text style={[styles.badgeText, participationStatus === 'attending' && styles.badgeTextPrimary]}>
                {participationStatus === 'attending' ? "Attending" : "Interested"}
              </Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity onPress={handleNavigateToEvent}>
          <Text style={[styles.title, isCompact && styles.titleCompact]}>
            {event.title}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.infoText}>
            {format(startDate, "PPP")}
            {!isSameDay && ` - ${format(endDate, "PPP")}`}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.infoText}>
            {format(startDate, "p")} - {format(endDate, "p")}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons 
            name={event.is_online ? "globe-outline" : "location-outline"} 
            size={16} 
            color="#666" 
          />
          <Text style={styles.infoText}>{locationDisplay}</Text>
        </View>
        
        {event.max_participants && (
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              {event.participant_count ? `${event.participant_count} / ${event.max_participants}` : `0 / ${event.max_participants}`} participants
            </Text>
          </View>
        )}
      </View>
      
      {!isCompact && event.description && (
        <View style={styles.cardContent}>
          <Text style={styles.description} numberOfLines={2}>
            {event.description}
          </Text>
        </View>
      )}
      
      <View style={[styles.cardFooter, isCompact && styles.cardFooterCompact]}>
        <View style={styles.creatorInfo}>
          <View style={styles.avatar}>
            {event.creator_profile?.avatar_url ? (
              <Image source={{ uri: event.creator_profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{creatorInitials}</Text>
            )}
          </View>
          <Text style={styles.creatorName}>{creatorName}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[
              styles.button, 
              styles.buttonOutline,
              participationStatus === 'interested' && styles.buttonOutlineActive
            ]}
            onPress={() => handleJoinEvent('interested')}
            disabled={isJoining}
          >
            {isJoining && <ActivityIndicator size="small" color="#007AFF" />}
            <Text style={[
              styles.buttonText,
              participationStatus === 'interested' && styles.buttonTextActive
            ]}>
              Interested
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.button, 
              styles.buttonPrimary,
              participationStatus === 'attending' && styles.buttonAttending
            ]}
            onPress={() => handleJoinEvent('attending')}
            disabled={isJoining}
          >
            {isJoining && <ActivityIndicator size="small" color="#FFF" />}
            <Text style={styles.buttonTextPrimary}>
              {participationStatus === 'attending' ? "Attending" : "Attend"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardCompact: {
    maxWidth: 300,
  },
  coverImage: {
    width: '100%',
    height: 192,
  },
  coverImageCompact: {
    height: 144,
  },
  cardHeader: {
    padding: 24,
  },
  cardHeaderCompact: {
    padding: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePrimary: {
    backgroundColor: '#007AFF',
  },
  badgeOutline: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  badgeSecondary: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#666',
  },
  badgeTextPrimary: {
    color: '#fff',
  },
  badgeTextSecondary: {
    fontSize: 12,
    color: '#666',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  titleCompact: {
    fontSize: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  cardFooterCompact: {
    padding: 12,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  creatorName: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonOutlineActive: {
    borderColor: '#007AFF',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonAttending: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    fontSize: 14,
    color: '#666',
  },
  buttonTextActive: {
    color: '#007AFF',
  },
  buttonTextPrimary: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});