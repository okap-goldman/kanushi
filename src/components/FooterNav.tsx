import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function FooterNav() {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const navItems = [
    { name: 'ホーム', icon: 'home', route: 'Home', testId: 'nav-home' },
    { name: '検索', icon: 'search', route: 'Search', testId: 'nav-search' },
    { name: '発見', icon: 'compass', route: 'Discover', testId: 'nav-discover' },
    { name: 'メッセージ', icon: 'message-circle', route: 'Messages', testId: 'nav-messages' },
    { name: 'プロフィール', icon: 'user', route: 'Profile', testId: 'nav-profile' },
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
          testID={item.testId}
        >
          <Feather
            name={item.icon as any}
            size={22}
            color={isActive(item.route) ? '#0070F3' : '#64748B'}
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
