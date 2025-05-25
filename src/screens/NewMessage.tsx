import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Sample user data for contacts
const SAMPLE_CONTACTS = [
  {
    id: 'user1',
    name: 'Yuki Tanaka',
    username: 'yuki_t',
    avatar: 'https://i.pravatar.cc/150?img=20',
  },
  {
    id: 'user2',
    name: 'Hiroshi Sato',
    username: 'hiroshi_sato',
    avatar: 'https://i.pravatar.cc/150?img=21',
  },
  {
    id: 'user3',
    name: 'Akiko Yamamoto',
    username: 'akiko_yam',
    avatar: 'https://i.pravatar.cc/150?img=22',
  },
  {
    id: 'user4',
    name: 'Takeshi Kimura',
    username: 'take_kim',
    avatar: 'https://i.pravatar.cc/150?img=23',
  },
  {
    id: 'user5',
    name: 'Naomi Kato',
    username: 'naomi',
    avatar: 'https://i.pravatar.cc/150?img=24',
  },
  {
    id: 'user6',
    name: 'Ken Suzuki',
    username: 'ken_suzuki',
    avatar: 'https://i.pravatar.cc/150?img=25',
  },
  {
    id: 'user7',
    name: 'Ai Nakamura',
    username: 'ai_naka',
    avatar: 'https://i.pravatar.cc/150?img=26',
  },
  {
    id: 'user8',
    name: 'Ryo Watanabe',
    username: 'ryo_w',
    avatar: 'https://i.pravatar.cc/150?img=27',
  },
];

export default function NewMessage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const navigation = useNavigation<any>();

  const filteredContacts = SAMPLE_CONTACTS.filter(contact => {
    const query = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.username.toLowerCase().includes(query)
    );
  });

  const handleUserSelection = (userId: string) => {
    // If user is already selected, remove them
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      // Otherwise, add them to selection
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleStartConversation = () => {
    if (selectedUsers.length === 0) return;
    
    // For simplicity, we'll just navigate to the first selected user's message detail
    const selectedUserId = selectedUsers[0];
    const selectedUser = SAMPLE_CONTACTS.find(contact => contact.id === selectedUserId);
    
    if (selectedUser) {
      navigation.navigate('MessageDetail', {
        user: {
          id: selectedUser.id,
          name: selectedUser.name,
          avatar: selectedUser.avatar,
        },
      });
    }
  };

  const renderContactItem = ({ item }: { item: any }) => {
    const isSelected = selectedUsers.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.contactItem, isSelected && styles.selectedContactItem]}
        onPress={() => handleUserSelection(item.id)}
      >
        <Image
          source={{ uri: item.avatar }}
          style={styles.avatar}
          contentFit="cover"
        />
        
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactUsername}>@{item.username}</Text>
        </View>
        
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Feather name="check" size={14} color="#FFFFFF" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#1A202C" />
        </TouchableOpacity>
        
        <Text style={styles.title}>New Message</Text>
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            selectedUsers.length === 0 && styles.nextButtonDisabled,
          ]}
          onPress={handleStartConversation}
          disabled={selectedUsers.length === 0}
        >
          <Text
            style={[
              styles.nextButtonText,
              selectedUsers.length === 0 && styles.nextButtonTextDisabled,
            ]}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBarContainer}>
          <Feather name="search" size={16} color="#718096" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search people"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color="#718096" />
            </TouchableOpacity>
          ) : null}
        </View>

        {selectedUsers.length > 0 && (
          <View style={styles.selectedUsersContainer}>
            <Text style={styles.selectedUsersText}>
              Selected: {selectedUsers.length}
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={filteredContacts}
        renderItem={renderContactItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.contactsList}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  nextButton: {
    padding: 8,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0070F3',
  },
  nextButtonTextDisabled: {
    color: '#A0AEC0',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#4A5568',
    paddingVertical: 4,
  },
  selectedUsersContainer: {
    marginTop: 12,
  },
  selectedUsersText: {
    fontSize: 14,
    color: '#4A5568',
  },
  contactsList: {
    paddingVertical: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectedContactItem: {
    backgroundColor: '#EDF2F7',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 2,
  },
  contactUsername: {
    fontSize: 14,
    color: '#718096',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#0070F3',
    borderColor: '#0070F3',
  },
});