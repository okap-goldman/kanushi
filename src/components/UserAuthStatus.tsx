import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';

export function UserAuthStatus() {
  const { user, profile, signOut: _, isLoading } = useAuth(); // Mark signOut as unused
  const navigation = useNavigation();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingSkeleton} />
        <View style={styles.loadingText} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.authButtons}>
        <Button variant="outline" size="sm" onPress={() => navigation.navigate('Login' as never)}>
          ログイン
        </Button>
        <Button size="sm" onPress={() => navigation.navigate('Register' as never)}>
          登録
        </Button>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={() => navigation.navigate('Profile' as never)}>
      <Avatar
        source={profile?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
        style={styles.avatar}
        fallbackText={profile?.name?.[0] || user.email?.[0] || 'U'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingSkeleton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e5e5',
  },
  loadingText: {
    width: 60,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#e5e5e5',
  },
  authButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
