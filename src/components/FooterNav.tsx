import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

export function FooterNav() {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const navItems = [
    { name: 'Home', icon: 'home', route: 'Home' },
    { name: 'Search', icon: 'search', route: 'Search' },
    { name: 'Discover', icon: 'compass', route: 'Discover' },
    { name: 'Messages', icon: 'message-circle', route: 'Messages' },
    { name: 'Profile', icon: 'user', route: 'Profile' },
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
          onPress={() => navigation.navigate(item.route)}
        >
          <Feather
            name={item.icon as any}
            size={22}
            color={isActive(item.route) ? '#0070F3' : '#64748B'}
          />
          <Text
            style={[
              styles.navText,
              isActive(item.route) ? styles.activeText : null,
            ]}
          >
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
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
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
    color: '#64748B',
  },
  activeText: {
    color: '#0070F3',
    fontWeight: '600',
  },
});