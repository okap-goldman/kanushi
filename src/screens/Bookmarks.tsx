import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Navbar from '../components/Navbar';
import FooterNav from '../components/FooterNav';

export default function Bookmarks() {
  return (
    <SafeAreaView style={styles.container}>
      <Navbar />
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>ブックマーク</Text>
          <Text style={styles.subtitle}>保存した投稿はここに表示されます</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>まだブックマークはありません</Text>
        </View>
      </ScrollView>
      <FooterNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});