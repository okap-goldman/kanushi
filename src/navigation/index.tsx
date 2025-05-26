import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, type NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Linking } from 'react-native';

// Auth Screens
import Login from '../screens/Login';
import Register from '../screens/Register';

import { useAuth } from '../context/AuthContext';
import Discover from '../screens/Discover';
import EventDetailScreen from '../screens/EventDetail';
import EventsScreen from '../screens/Events';
// Main Screens
import Home from '../screens/Home';
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

// LiveRoom Screens
import { LiveRoomScreen } from '../components/liveroom/LiveRoomScreen';
import LiveRooms from '../screens/LiveRooms';

// Navigation ref for programmatic navigation
export const navigationRef = React.createRef<NavigationContainerRef<any>>();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#0070F3',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingTop: 5,
          paddingBottom: 5,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={Home}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={Search}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => <Feather name="search" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="LiveRoomsTab"
        component={LiveRooms}
        options={{
          tabBarLabel: 'Live',
          tabBarIcon: ({ color, size }) => <Feather name="radio" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={Messages}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={Profile}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
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
            <Stack.Screen name="Home" component={HomeTabs} />

            {/* Profile Stack */}
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="ProfileEdit" component={ProfileEdit} />

            {/* Messages Stack */}
            <Stack.Screen name="Messages" component={Messages} />
            <Stack.Screen name="MessageDetail" component={MessageDetail} />
            <Stack.Screen name="NewMessage" component={NewMessage} />

            {/* Events Stack */}
            <Stack.Screen name="Events" component={EventsScreen} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />

            {/* Shop Stack */}
            <Stack.Screen name="Shop" component={Shop} />
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
