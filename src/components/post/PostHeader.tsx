import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from '../ui/Avatar';

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
        <Avatar source={author.image} size="md" fallbackText={author.name?.substring(0, 1)} />
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
