import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight, User, Bell, Lock, HelpCircle, LogOut } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const navigation = useNavigation<any>();
  const { signOut } = useAuth();

  const settingsItems = [
    {
      title: 'アカウント設定',
      icon: User,
      onPress: () => navigation.navigate('ProfileEdit'),
    },
    {
      title: '通知設定',
      icon: Bell,
      onPress: () => {},
    },
    {
      title: 'プライバシー設定',
      icon: Lock,
      onPress: () => {},
    },
    {
      title: 'ヘルプ・お問い合わせ',
      icon: HelpCircle,
      onPress: () => {},
    },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>設定</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {settingsItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={index}
              style={styles.settingItem}
              onPress={item.onPress}
            >
              <View style={styles.settingItemLeft}>
                <Icon size={22} color="#666" />
                <Text style={styles.settingItemText}>{item.title}</Text>
              </View>
              <ChevronRight size={20} color="#999" />
            </TouchableOpacity>
          );
        })}
        
        <TouchableOpacity
          style={[styles.settingItem, styles.signOutItem]}
          onPress={handleSignOut}
        >
          <View style={styles.settingItemLeft}>
            <LogOut size={22} color="#FF3B30" />
            <Text style={[styles.settingItemText, styles.signOutText]}>ログアウト</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  content: {
    flex: 1,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingItemText: {
    fontSize: 16,
    color: '#1A202C',
  },
  signOutItem: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  signOutText: {
    color: '#FF3B30',
  },
});