import { Feather } from '@expo/vector-icons';
import { NavigationContainer, type NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import React from 'react';
import { Linking, View, StyleSheet } from 'react-native';
import { GlobalAudioPlayer } from '../components/GlobalAudioPlayer';
import { FullScreenAudioPlayer } from '../components/FullScreenAudioPlayer';
import { FooterNav } from '../components/FooterNav';

// Auth Screens
import Login from '../screens/Login';
import Register from '../screens/Register';

import { useAuth } from '../context/AuthContext';
import { AudioProvider } from '../context/AudioContext';
import Discover from '../screens/Discover';
import RegionDetail from '../screens/RegionDetail';
import EventDetailScreen from '../screens/EventDetail';
import EventsScreen from '../screens/Events';
import CreateEvent from '../screens/CreateEvent';
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
import Cart from '../screens/Cart';
import Settings from '../screens/Settings';
import HitChart from '../screens/HitChart';
import MyEvents from '../screens/MyEvents';
import Premium from '../screens/Premium';
import MyShop from '../screens/MyShop';
import CreateProduct from '../screens/CreateProduct';
import EditProduct from '../screens/EditProduct';
import Bookmarks from '../screens/Bookmarks';
import WatchLater from '../screens/WatchLater';

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
          onPress={() => navigation.navigate('Main', {
            screen: 'Profile',
            params: { userId: user?.id }
          })}
          icon={({ color, size }) => <Feather name="user" color={color} size={size} />}
        />
        <DrawerItem
          label="ブックマーク"
          onPress={() => navigation.navigate('Main', { screen: 'Bookmarks' })}
          icon={({ color, size }) => <Feather name="bookmark" color={color} size={size} />}
        />
        <DrawerItem
          label="マイイベント"
          onPress={() => navigation.navigate('Main', { screen: 'MyEvents' })}
          icon={({ color, size }) => <Feather name="calendar" color={color} size={size} />}
        />
        <DrawerItem
          label="マイショップ"
          onPress={() => navigation.navigate('Main', { screen: 'MyShop' })}
          icon={({ color, size }) => <Feather name="shopping-bag" color={color} size={size} />}
        />
        <DrawerItem
          label="ヒットチャート"
          onPress={() => navigation.navigate('Main', { screen: 'HitChart' })}
          icon={({ color, size }) => <Feather name="trending-up" color={color} size={size} />}
        />
        <DrawerItem
          label="後で見る"
          onPress={() => navigation.navigate('Main', { screen: 'WatchLater' })}
          icon={({ color, size }) => <Feather name="clock" color={color} size={size} />}
        />
        <DrawerItem
          label="プレミアム"
          onPress={() => navigation.navigate('Main', { screen: 'Premium' })}
          icon={({ color, size }) => <Feather name="award" color={color} size={size} />}
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


function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="HomeScreen" component={Home} />
      <Stack.Screen name="Search" component={Search} />
      <Stack.Screen name="Discover" component={Discover} />
      <Stack.Screen name="RegionDetail" component={RegionDetail} />
      <Stack.Screen name="AIChat" component={AIChat} />

      {/* Profile Stack */}
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="ProfileEdit" component={ProfileEdit} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="HitChart" component={HitChart} />
      <Stack.Screen name="Premium" component={Premium} />
      <Stack.Screen name="Bookmarks" component={Bookmarks} />
      <Stack.Screen name="WatchLater" component={WatchLater} />

      {/* Messages Stack */}
      <Stack.Screen name="Messages" component={Messages} />
      <Stack.Screen name="MessageDetail" component={MessageDetail} />
      <Stack.Screen name="NewMessage" component={NewMessage} />

      {/* Events Stack */}
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEvent} />
      <Stack.Screen name="MyEvents" component={MyEvents} />

      {/* Shop Stack */}
      <Stack.Screen name="Shop" component={Shop} />
      <Stack.Screen name="Market" component={Market} />
      <Stack.Screen name="ProductDetail" component={ProductDetail} />
      <Stack.Screen name="Cart" component={Cart} />
      <Stack.Screen name="Orders" component={Orders} />
      <Stack.Screen name="OrderDetail" component={OrderDetail} />
      <Stack.Screen name="MyShop" component={MyShop} />
      <Stack.Screen name="CreateProduct" component={CreateProduct} />
      <Stack.Screen name="EditProduct" component={EditProduct} />

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
    </Stack.Navigator>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={CustomDrawerContent}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen name="Main" component={MainStack} />
    </Drawer.Navigator>
  );
}

function MainLayout() {
  return (
    <AudioProvider>
      <View style={mainLayoutStyles.container}>
        <View style={mainLayoutStyles.content}>
          <DrawerNavigator />
        </View>
        <GlobalAudioPlayer />
        <FooterNav />
        <FullScreenAudioPlayer visible={true} onClose={() => {}} />
      </View>
    </AudioProvider>
  );
}

const mainLayoutStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

// Deep Link configuration
const linking = {
  prefixes: ['kanushi://', 'https://kanushi.app'],
  config: {
    screens: {
      Home: {
        screens: {
          Main: {
            screens: {
              HomeScreen: {
                screens: {
                  LiveRoomsTab: 'live',
                },
              },
              LiveRoom: 'liveroom/:roomId',
              PostDetail: 'post/:postId',
            },
          },
        },
      },
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
          // Main App Screens - All wrapped in MainLayout
          <Stack.Screen name="Home" component={MainLayout} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
