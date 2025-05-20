import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar } from '../ui/Avatar';
import { Feather } from '@expo/vector-icons';

interface PostHeaderProps {
  author: {
    name: string;
    image: string;
    id: string;
  };
}

export function PostHeader({ author }: PostHeaderProps) {
  const navigation = useNavigation<any>();

  const navigateToProfile = () => {
    navigation.navigate('Profile', { userId: author.id });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={navigateToProfile} style={styles.userInfo}>
        <Avatar source={author.image || 'https://via.placeholder.com/40'} size="md" />
        <Text style={styles.userName}>{author.name}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.moreButton}>
        <Feather name="more-horizontal" size={20} color="#64748B" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 10,
  },
  moreButton: {
    padding: 4,
  },
});