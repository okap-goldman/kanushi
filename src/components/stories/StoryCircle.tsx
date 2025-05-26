import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface StoryCircleProps {
  userId: string;
  username: string;
  profileImage: string;
  hasUnviewedStory: boolean;
  isActive?: boolean;
  onPress: () => void;
}

export default function StoryCircle({
  userId,
  username,
  profileImage,
  hasUnviewedStory,
  isActive = false,
  onPress,
}: StoryCircleProps) {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const displayName = username.length > 10 ? `${username.substring(0, 8)}...` : username;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: isActive ? Animated.multiply(scaleAnim, 1.1) : scaleAnim }],
          },
        ]}
      >
        {hasUnviewedStory ? (
          <LinearGradient
            colors={['#10b981', '#059669', '#047857']}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.gradientBorder}
          >
            <View style={styles.innerBorder}>
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.grayBorder}>
            <View style={styles.innerBorder}>
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            </View>
          </View>
        )}
        <Text style={styles.username} numberOfLines={1}>
          {displayName}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  gradientBorder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
    marginBottom: 4,
  },
  grayBorder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#d1d5db',
    padding: 2,
    marginBottom: 4,
  },
  innerBorder: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#fff',
  },
  username: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    width: 64,
  },
});
