import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Map, Calendar, Image as ImageIcon, MessageCircle } from 'lucide-react-native';
import DashboardScreen from '../screens/DashboardScreen';
import AddTripScreen from '../screens/AddTripScreen';
import TripDetailsScreen from '../screens/TripDetailsScreen';
import TripsScreen from '../screens/TripsScreen';
import CalendarScreen from '../screens/CalendarScreen';
import GalleryScreen from '../screens/GalleryScreen';
import TripGalleryScreen from '../screens/TripGalleryScreen';
import ChatScreen from '../screens/ChatScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen'; // Import here
import AddDocumentScreen from '../screens/AddDocumentScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          backgroundColor: 'white',
          height: 85,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        },
        tabBarLabelStyle: {
          paddingBottom: 10,
          fontSize: 10,
          fontWeight: '600',
        }
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Trips" 
        component={TripsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Gallery" 
        component={GalleryScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <ImageIcon color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen 
        name="AddTrip" 
        component={AddTripScreen} 
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} 
      />
      <Stack.Screen 
        name="TripDetails" 
        component={TripDetailsScreen}
        options={{ animation: 'slide_from_right' }} 
      />
      <Stack.Screen 
        name="TripGallery" 
        component={TripGalleryScreen}
        options={{ animation: 'slide_from_right' }} 
      />
      <Stack.Screen 
        name="AddExpense" 
        component={AddExpenseScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} 
      />
      <Stack.Screen 
        name="AddDocument" 
        component={AddDocumentScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} 
      />
    </Stack.Navigator>
  );
}