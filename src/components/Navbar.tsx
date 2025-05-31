import { useToast } from '@/hooks/use-toast';
import { Bell, MessageCircle, Settings } from 'lucide-react-native';
import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../lib/theme';

export function Navbar() {
  const { toast: _ } = useToast(); // Keep the import but mark as unused
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <Text style={styles.logo}>Kanushi</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
            <Bell size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Messages')}>
            <MessageCircle size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Settings')}>
            <Settings size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary.main,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 8,
  },
});

export default Navbar;
