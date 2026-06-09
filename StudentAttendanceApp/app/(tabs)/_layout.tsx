import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerShadowVisible: true,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 2,
          shadowOpacity: 0.1,
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Medini technologies ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          headerTitle: 'Mark Attendance',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          headerTitle: 'Attendance Logs',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "time" : "time-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen 
  name="analytics" 
  options={{ 
    title: 'Analytics', 
    headerTitle: 'Student Performance',
    tabBarIcon: ({ color }) => <Ionicons name="pie-chart" size={24} color={color} /> 
  }} 
/>

      {/* Hide secondary routes from physically appearing on the bottom tab bar line */}
      <Tabs.Screen name="dashboard" options={{ href: null, title: 'Dashboard' }} />
      <Tabs.Screen name="explore" options={{ href: null, title: 'Explore' }} />
    </Tabs>
  );
}