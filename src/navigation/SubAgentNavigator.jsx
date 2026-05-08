import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import HomeScreen       from '../screens/sub-agent/HomeScreen';
import NewRequestScreen from '../screens/sub-agent/NewRequestScreen';
import MyRequestsScreen from '../screens/sub-agent/MyRequestsScreen';
import ProfileScreen    from '../screens/sub-agent/ProfileScreen';
import NetworksScreen   from '../screens/sub-agent/NetworksScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ name, activeName, focused, color }) {
  return (
    <View style={{ alignItems: 'center' }}>
      {focused && (
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, marginBottom: 3 }} />
      )}
      <Ionicons name={focused ? activeName : name} size={24} color={color} />
    </View>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="Networks"    component={NetworksScreen} />
    </Stack.Navigator>
  );
}

export default function SubAgentNavigator() {
  const { user } = useAuth();
  const { theme, tr } = useTheme();
  useNotifications(user?.uid);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarActiveTintColor:   theme.primary,
        tabBarInactiveTintColor: theme.textDim,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: tr('home'), tabBarIcon: ({ focused, color }) =>
          <TabIcon name="home-outline" activeName="home" focused={focused} color={color} /> }}
      />
      <Tab.Screen name="NewRequest"
        component={NewRequestScreen}
        options={{ tabBarLabel: tr('request'), tabBarIcon: ({ focused, color }) =>
          <TabIcon name="add-circle-outline" activeName="add-circle" focused={focused} color={color} /> }}
      />
      <Tab.Screen name="MyRequests"
        component={MyRequestsScreen}
        options={{ tabBarLabel: tr('history'), tabBarIcon: ({ focused, color }) =>
          <TabIcon name="time-outline" activeName="time" focused={focused} color={color} /> }}
      />
      <Tab.Screen name="Profile"
        component={ProfileStack}
        options={{ tabBarLabel: tr('profile'), tabBarIcon: ({ focused, color }) =>
          <TabIcon name="person-outline" activeName="person" focused={focused} color={color} /> }}
      />
    </Tab.Navigator>
  );
}
