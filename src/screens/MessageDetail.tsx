import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import React, { useState, useRef, useEffect } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Sample messages for the conversation
const SAMPLE_CONVERSATION = [
  {
    id: 'm1',
    text: 'Hi there! Are you coming to the event tomorrow?',
    sender: 'them',
    timestamp: '09:45',
  },
  {
    id: 'm2',
    text: 'Yes, I am planning to attend. What time does it start?',
    sender: 'me',
    timestamp: '09:47',
  },
  {
    id: 'm3',
    text: 'It starts at 7 PM. We could meet up before if you want.',
    sender: 'them',
    timestamp: '09:49',
  },
  {
    id: 'm4',
    text: 'Sounds good! How about we meet at the cafe around 6:30?',
    sender: 'me',
    timestamp: '09:51',
  },
  {
    id: 'm5',
    text: "Perfect! I'll see you there.",
    sender: 'them',
    timestamp: '09:53',
  },
];

export default function MessageDetail() {
  const [messages, setMessages] = useState(SAMPLE_CONVERSATION);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const navigation = useNavigation();
  const route = useRoute<any>();
  const { user } = route.params || {
    user: { name: 'User', avatar: 'https://i.pravatar.cc/150?img=20' },
  };

  // Scroll to bottom of messages when the component mounts or messages change
  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages]);

  const sendMessage = () => {
    if (inputText.trim() === '') return;

    const newMessage = {
      id: `m${messages.length + 1}`,
      text: inputText.trim(),
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, newMessage]);
    setInputText('');
  };

  const renderMessage = ({ item }: { item: any }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === 'me' ? styles.sentMessage : styles.receivedMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.sender === 'me' ? styles.sentBubble : styles.receivedBubble,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
      <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1A202C" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.userInfo}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} contentFit="cover" />
          <Text style={styles.userName}>{user.name}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton}>
          <Feather name="more-vertical" size={24} color="#1A202C" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Feather name="paperclip" size={20} color="#718096" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() === '' ? styles.sendButtonDisabled : null]}
            onPress={sendMessage}
            disabled={inputText.trim() === ''}
          >
            <Feather
              name="send"
              size={20}
              color={inputText.trim() === '' ? '#A0AEC0' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
  },
  menuButton: {
    padding: 4,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  messageContainer: {
    maxWidth: '75%',
    marginBottom: 12,
  },
  sentMessage: {
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  sentBubble: {
    backgroundColor: '#0070F3',
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#1A202C',
  },
  messageTimestamp: {
    fontSize: 10,
    color: '#718096',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#EDF2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0070F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
});
