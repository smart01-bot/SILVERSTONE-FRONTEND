import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import HomeScreen       from '../screens/sub-agent/HomeScreen';
import NewRequestScreen from '../screens/sub-agent/NewRequestScreen';
import MyRequestsScreen from '../screens/sub-agent/MyRequestsScreen';
import ProfileScreen    from '../screens/sub-agent/ProfileScreen';

const Tab = createBottomTabNavigator();

const Icon = ({ emoji, focused, color }) => (
  <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

export default function SubAgentNavigator() {
  const { theme, tr } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor:   theme.primary,
        tabBarInactiveTintColor: theme.textDim,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: tr('home'), tabBarIcon: ({ focused }) => <Icon emoji="🏠" focused={focused} /> }}
      />
      <Tab.Screen name="NewRequest"
        component={NewRequestScreen}
        options={{ tabBarLabel: tr('request'), tabBarIcon: ({ focused }) => <Icon emoji="➕" focused={focused} /> }}
      />
      <Tab.Screen name="MyRequests"
        component={MyRequestsScreen}
        options={{ tabBarLabel: tr('history'), tabBarIcon: ({ focused }) => <Icon emoji="📋" focused={focused} /> }}
      />
      <Tab.Screen name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: tr('profile'), tabBarIcon: ({ focused }) => <Icon emoji="👤" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}