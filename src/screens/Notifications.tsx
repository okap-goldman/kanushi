import { Avatar } from '@/components/ui/Avatar';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../lib/theme';

export default function Notifications() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>お知らせ</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.content}>
        {/* New Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New</Text>
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
              {i === 1 && <View style={styles.unreadBadge} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* This Week Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今週</Text>
          {[4, 5, 6].map((i) => (
            <TouchableOpacity key={i} style={styles.notificationItem}>
              <Avatar
                source={{ uri: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}` }}
                style={styles.avatar}
              />
              <View style={styles.notificationContent}>
                <Text style={styles.notificationText}>
                  ユーザー{i}があなたをフォローしました
                </Text>
                <Text style={styles.notificationTime}>{i - 1}日前</Text>
              </View>
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>フォロー</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* This Month Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今月</Text>
          {[7, 8, 9].map((i) => (
            <TouchableOpacity key={i} style={styles.notificationItem}>
              <Avatar
                source={{ uri: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}` }}
                style={styles.avatar}
              />
              <View style={styles.notificationContent}>
                <Text style={styles.notificationText}>
                  ユーザー{i}があなたをフォローしました
                </Text>
                <Text style={styles.notificationTime}>{i - 5}週間前</Text>
              </View>
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>フォロー</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary.main,
    marginLeft: 8,
  },
  followButton: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  followButtonText: {
    color: theme.colors.background.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});