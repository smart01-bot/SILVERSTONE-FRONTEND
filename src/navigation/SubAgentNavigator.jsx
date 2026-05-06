import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
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

const Icon = ({ emoji, focused }) => (
  <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

// Profile stack wraps ProfileScreen + NetworksScreen
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
        options={{ tabBarLabel: tr('home'),    tabBarIcon: ({ focused }) => <Icon emoji="🏠" focused={focused} /> }}
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
        component={ProfileStack}
        options={{ tabBarLabel: tr('profile'), tabBarIcon: ({ focused }) => <Icon emoji="👤" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}
