import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, SafeAreaView } from 'react-native';
import { Bell, MessageCircle } from 'lucide-react-native';
import { useToast } from '@/hooks/use-toast';
import { Avatar } from '@/components/ui/Avatar';
import { UserAuthStatus } from './UserAuthStatus';

export function Navbar() {
  const { toast } = useToast();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <Text style={styles.logo}>Kuripura</Text>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowNotifications(true)}
          >
            <Bell size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowMessages(true)}
          >
            <MessageCircle size={20} color="#666" />
          </TouchableOpacity>
          
          <UserAuthStatus />
        </View>
      </View>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>通知</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Text style={styles.closeButton}>閉じる</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {[1, 2, 3].map((i) => (
                <TouchableOpacity key={i} style={styles.notificationItem}>
                  <Avatar 
                    source={{ uri: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}` }}
                    style={styles.avatar}
                  />
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationText}>
                      ユーザー{i}があなたの投稿にいいねしました
                    </Text>
                    <Text style={styles.notificationTime}>1時間前</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Messages Modal */}
      <Modal
        visible={showMessages}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMessages(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>メッセージ</Text>
              <TouchableOpacity onPress={() => setShowMessages(false)}>
                <Text style={styles.closeButton}>閉じる</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {[1, 2, 3].map((i) => (
                <TouchableOpacity key={i} style={styles.messageItem}>
                  <Avatar 
                    source={{ uri: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}` }}
                    style={styles.avatar}
                  />
                  <View style={styles.messageContent}>
                    <Text style={styles.messageName}>ユーザー{i}</Text>
                    <Text style={styles.messagePreview}>最新のメッセージ...</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    color: '#6366f1',
    fontSize: 16,
  },
  modalScroll: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: '#333',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  messageContent: {
    flex: 1,
  },
  messageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  messagePreview: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default Navbar;