import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, DrawerActions } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from './ui/Avatar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { theme } from '../lib/theme';

export function FooterNav() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user } = useAuth();
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchUserAvatar();
    }
  }, [user?.id]);

  const fetchUserAvatar = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profile')
        .select('profile_image_url')
        .eq('id', user.id)
        .single();
      
      if (data && !error) {
        setUserAvatar(data.profile_image_url);
      }
    } catch (error) {
      console.error('Error fetching user avatar:', error);
    }
  };

  const navItems = [
    { name: 'メニュー', icon: 'menu', route: 'Menu', testId: 'nav-menu' },
    { name: '発見', icon: 'compass', route: 'Discover', testId: 'nav-discover' },
    { name: 'タイムライン', icon: 'home', route: 'Home', testId: 'nav-home' },
    { name: 'マーケット', icon: 'shopping-bag', route: 'Market', testId: 'nav-market' },
  ];

  // Check if the current route matches the nav item
  const isActive = (itemRoute: string) => {
    return route.name === itemRoute;
  };

  return (
    <View style={styles.container}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={styles.navItem}
          onPress={() => {
            if (item.route === 'Menu') {
              navigation.dispatch(DrawerActions.openDrawer());
            } else {
              navigation.navigate(item.route);
            }
          }}
          testID={item.testId}
        >
          <Feather
            name={item.icon as any}
            size={22}
            color={isActive(item.route) ? theme.colors.primary.main : theme.colors.text.muted}
          />
          <Text style={[styles.navText, isActive(item.route) ? styles.activeText : null]}>
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.primary,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    boxShadow: '0px -3px 3px rgba(0, 0, 0, 0.1)',
    elevation: 10,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  navText: {
    fontSize: 12,
    marginTop: 2,
    color: theme.colors.text.muted,
  },
  activeText: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  avatarContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
  },
  activeAvatarContainer: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary.main,
  },
});
