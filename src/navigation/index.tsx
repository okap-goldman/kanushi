import { Feather } from '@expo/vector-icons';
import { NavigationContainer, type NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import React from 'react';
import { Linking, View, StyleSheet } from 'react-native';

// Auth Screens
import Login from '../screens/Login';
import Register from '../screens/Register';

import { useAuth } from '../context/AuthContext';
import Discover from '../screens/Discover';
import RegionDetail from '../screens/RegionDetail';
import EventDetailScreen from '../screens/EventDetail';
import EventsScreen from '../screens/Events';
// Main Screens
import Home from '../screens/Home';
import { AIChat } from '../components/ai/AIChat';
import MessageDetail from '../screens/MessageDetail';
import Messages from '../screens/Messages';
import NewMessage from '../screens/NewMessage';
import OrderDetail from '../screens/OrderDetail';
import Orders from '../screens/Orders';
import ProductDetail from '../screens/ProductDetail';
import Profile from '../screens/Profile';
import ProfileEdit from '../screens/ProfileEdit';
import { Search } from '../screens/Search';
import Shop from '../screens/Shop';
import Market from '../screens/Market';
import Settings from '../screens/Settings';
import HitChart from '../screens/HitChart';

// LiveRoom Screens
import { LiveRoomScreen } from '../components/liveroom/LiveRoomScreen';
import LiveRooms from '../screens/LiveRooms';

// Navigation ref for programmatic navigation
export const navigationRef = React.createRef<NavigationContainerRef<any>>();

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  const navigation = props.navigation;
  const { user } = useAuth();

  return (
    <View style={drawerStyles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={drawerStyles.scrollContent}>
        <DrawerItem
          label="プロフィール"
          onPress={() => navigation.navigate('Profile', { userId: user?.id })}
          icon={({ color, size }) => <Feather name="user" color={color} size={size} />}
        />
        <DrawerItem
          label="ブックマーク"
          onPress={() => navigation.navigate('Bookmarks')}
          icon={({ color, size }) => <Feather name="bookmark" color={color} size={size} />}
        />
        <DrawerItem
          label="マイイベント"
          onPress={() => navigation.navigate('MyEvents')}
          icon={({ color, size }) => <Feather name="calendar" color={color} size={size} />}
        />
        <DrawerItem
          label="マイショップ"
          onPress={() => navigation.navigate('MyShop')}
          icon={({ color, size }) => <Feather name="shopping-bag" color={color} size={size} />}
        />
        <DrawerItem
          label="ヒットチャート"
          onPress={() => navigation.navigate('HitChart')}
          icon={({ color, size }) => <Feather name="trending-up" color={color} size={size} />}
        />
        <DrawerItem
          label="後で見る"
          onPress={() => navigation.navigate('WatchLater')}
          icon={({ color, size }) => <Feather name="clock" color={color} size={size} />}
        />
      </DrawerContentScrollView>
      <View style={drawerStyles.bottomSection}>
        <DrawerItem
          label="メニューを閉じる"
          onPress={() => navigation.closeDrawer()}
          icon={({ color, size }) => <Feather name="menu" color={color} size={size} />}
          style={drawerStyles.closeButton}
        />
      </View>
    </View>
  );
}

const drawerStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: 20,
  },
  closeButton: {
    marginTop: 8,
  },
});


function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={CustomDrawerContent}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen name="Main" component={Home} />
    </Drawer.Navigator>
  );
}

// Deep Link configuration
const linking = {
  prefixes: ['kanushi://', 'https://kanushi.app'],
  config: {
    screens: {
      Home: {
        screens: {
          LiveRoomsTab: 'live',
        },
      },
      LiveRoom: 'liveroom/:roomId',
      PostDetail: 'post/:postId',
      Login: {
        path: 'login',
        parse: {
          redirectTo: (redirectTo: string) => redirectTo,
          redirectParams: (params: string) => JSON.parse(params || '{}'),
        },
      },
    },
  },
};

export default function Navigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={() => {
        // Handle initial deep link
        Linking.getInitialURL().then((url) => {
          if (url) {
            // Handle deep link
          }
        });
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      >
        {!user ? (
          // Auth Screens
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
          </>
        ) : (
          // Main App Screens
          <>
            <Stack.Screen name="Home" component={DrawerNavigator} />
            <Stack.Screen name="Search" component={Search} />
            <Stack.Screen name="Discover" component={Discover} />
            <Stack.Screen name="RegionDetail" component={RegionDetail} />
            <Stack.Screen name="AIChat" component={AIChat} />

            {/* Profile Stack */}
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="ProfileEdit" component={ProfileEdit} />
            <Stack.Screen name="Settings" component={Settings} />
            <Stack.Screen name="HitChart" component={HitChart} />

            {/* Messages Stack */}
            <Stack.Screen name="Messages" component={Messages} />
            <Stack.Screen name="MessageDetail" component={MessageDetail} />
            <Stack.Screen name="NewMessage" component={NewMessage} />

            {/* Events Stack */}
            <Stack.Screen name="Events" component={EventsScreen} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />

            {/* Shop Stack */}
            <Stack.Screen name="Shop" component={Shop} />
            <Stack.Screen name="Market" component={Market} />
            <Stack.Screen name="ProductDetail" component={ProductDetail} />
            <Stack.Screen name="Orders" component={Orders} />
            <Stack.Screen name="OrderDetail" component={OrderDetail} />

            {/* LiveRoom Stack */}
            <Stack.Screen name="LiveRooms" component={LiveRooms} />
            <Stack.Screen
              name="LiveRoom"
              component={LiveRoomScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
