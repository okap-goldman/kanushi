import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

// Auth Screens
import Login from '../screens/Login';
import Register from '../screens/Register';

// Main Screens
import Home from '../screens/Home';
import Search from '../screens/Search';
import Discover from '../screens/Discover';
import Messages from '../screens/Messages';
import Profile from '../screens/Profile';
import ProfileEdit from '../screens/ProfileEdit';
import EventsScreen from '../screens/Events';
import EventDetailScreen from '../screens/EventDetail';
import MessageDetail from '../screens/MessageDetail';
import NewMessage from '../screens/NewMessage';
import Shop from '../screens/Shop';
import ProductDetail from '../screens/ProductDetail';
import Orders from '../screens/Orders';
import OrderDetail from '../screens/OrderDetail';
import { useAuth } from '../context/AuthContext';

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
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="SearchTab" 
        component={Search} 
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Feather name="search" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="DiscoverTab" 
        component={Discover} 
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <Feather name="compass" color={color} size={size} />
          ),
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
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}