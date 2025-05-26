import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/hooks/use-toast';
import { Bell, MessageCircle, Settings } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../lib/theme';

export function Navbar() {
  const { toast: _ } = useToast(); // Keep the import but mark as unused
  const [showNotifications, setShowNotifications] = useState(false);
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <Text style={styles.logo}>Kuripura</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowNotifications(true)}>
            <Bell size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Messages')}>
            <MessageCircle size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Settings')}>
            <Settings size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
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
    color: theme.colors.primary.main,
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
    backgroundColor: theme.colors.background.primary,
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
    borderBottomColor: theme.colors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    color: theme.colors.accent.main,
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
    borderBottomColor: theme.colors.background.tertiary,
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
    color: theme.colors.text.primary,
  },
  notificationTime: {
    fontSize: 12,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
});

export default Navbar;
