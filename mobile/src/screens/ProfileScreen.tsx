import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Mock data
  const profileData = {
    username: user?.name || 'User',
    bio: 'This is a bio description for the profile. This is migrated from React to React Native.',
    postsCount: 24,
    followersCount: 842,
    followingCount: 267,
    avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
  };

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Profile Header */}
      <View className="p-4">
        <View className="flex-row items-center">
          <Image 
            source={{ uri: profileData.avatarUrl }} 
            className="h-20 w-20 rounded-full mr-4" 
          />
          
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">{profileData.username}</Text>
            <Text className="text-muted-foreground">{profileData.bio}</Text>
            
            <View className="flex-row mt-2">
              <Button 
                variant="outline" 
                size="sm"
                className="mr-2 flex-1"
                onPress={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
              
              <Button 
                variant="destructive" 
                size="sm"
                className="flex-1"
                onPress={signOut}
              >
                Sign Out
              </Button>
            </View>
          </View>
        </View>
        
        {/* Stats */}
        <View className="flex-row justify-between mt-4">
          <View className="items-center">
            <Text className="text-lg font-bold text-foreground">{profileData.postsCount}</Text>
            <Text className="text-muted-foreground">Posts</Text>
          </View>
          
          <View className="items-center">
            <Text className="text-lg font-bold text-foreground">{profileData.followersCount}</Text>
            <Text className="text-muted-foreground">Followers</Text>
          </View>
          
          <View className="items-center">
            <Text className="text-lg font-bold text-foreground">{profileData.followingCount}</Text>
            <Text className="text-muted-foreground">Following</Text>
          </View>
        </View>
      </View>
      
      {/* Tabs */}
      <View className="flex-row border-t border-border">
        <TouchableOpacity className="flex-1 p-4 items-center border-b-2 border-primary">
          <Ionicons name="grid-outline" size={24} color="#3b82f6" />
        </TouchableOpacity>
        
        <TouchableOpacity className="flex-1 p-4 items-center">
          <Ionicons name="bookmark-outline" size={24} color="#64748b" />
        </TouchableOpacity>
        
        <TouchableOpacity className="flex-1 p-4 items-center">
          <Ionicons name="heart-outline" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>
      
      {/* Grid View */}
      <View className="flex-row flex-wrap">
        {Array.from({ length: 9 }).map((_, index) => (
          <TouchableOpacity 
            key={index}
            className="w-1/3 aspect-square p-0.5"
          >
            <Image 
              source={{ 
                uri: `https://picsum.photos/400/400?random=${index}` 
              }} 
              className="w-full h-full"
            />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}