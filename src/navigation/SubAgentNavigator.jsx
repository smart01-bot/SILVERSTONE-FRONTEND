// src/navigation/SubAgentNavigator.jsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import DrawerContent from '../components/DrawerContent';
import HomeScreen            from '../screens/sub-agent/HomeScreen';
import NewRequestScreen      from '../screens/sub-agent/NewRequestScreen';
import RequestSuccessScreen  from '../screens/sub-agent/RequestSuccessScreen';
import MyRequestsScreen      from '../screens/sub-agent/MyRequestsScreen';
import ProfileScreen         from '../screens/sub-agent/ProfileScreen';
import NetworksScreen        from '../screens/sub-agent/NetworksScreen';

const Tab    = createBottomTabNavigator();
const Stack  = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const DRAWER_ITEMS = [
  { label: 'Home',        icon: 'home-outline',       onPress: nav => nav.navigate('MainStack', { screen: 'Tabs', params: { screen: 'Home' } }) },
  { label: 'New Request', icon: 'add-circle-outline',  onPress: nav => nav.navigate('MainStack', { screen: 'Tabs', params: { screen: 'NewRequest' } }) },
  { label: 'History',     icon: 'time-outline',        onPress: nav => nav.navigate('MainStack', { screen: 'Tabs', params: { screen: 'MyRequests' } }) },
  { label: 'Networks',    icon: 'wifi-outline',        onPress: nav => nav.navigate('MainStack', { screen: 'Networks' }) },
  { label: 'Profile',     icon: 'person-outline',      onPress: nav => nav.navigate('MainStack', { screen: 'Tabs', params: { screen: 'Profile' } }) },
];

function TabIcon({ name, focused, color, badge }) {
  return (
    <View>
      <Ionicons name={focused ? name : `${name}-outline`} size={24} color={color} />
      {badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

function HomeTabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:       false,
        animation:         'slide_from_right',
        animationDuration: 250,
        gestureEnabled:    true,
        tabBarStyle: {
          backgroundColor:      theme.surface,
          borderTopColor:       theme.border,
          borderTopWidth:       1,
          paddingBottom:        8,
          paddingTop:           8,
          height:               64,
          lazy:                 true,
          tabBarHideOnKeyboard: true,
        },
        tabBarActiveTintColor:   theme.primary,
        tabBarInactiveTintColor: theme.textDim,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tab.Screen name="Home"       component={HomeScreen}       options={{ tabBarLabel: 'Home',    tabBarIcon: ({ focused, color }) => <TabIcon name="home"       focused={focused} color={color} /> }} />
      <Tab.Screen name="NewRequest" component={NewRequestScreen} options={{ tabBarLabel: 'Request', tabBarIcon: ({ focused, color }) => <TabIcon name="add-circle" focused={focused} color={color} /> }} />
      <Tab.Screen name="MyRequests" component={MyRequestsScreen} options={{ tabBarLabel: 'History', tabBarIcon: ({ focused, color }) => <TabIcon name="time"       focused={focused} color={color} /> }} />
      
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs"           component={HomeTabs} />
      <Stack.Screen name="RequestSuccess" component={RequestSuccessScreen} />
      <Stack.Screen name="Networks"       component={NetworksScreen} />
    </Stack.Navigator>
  );
}

export default function SubAgentNavigator() {
  const { theme } = useTheme();
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown:      false,
        drawerType:       'front',
        overlayColor:     'rgba(0,0,0,0.5)',
        drawerStyle: {
          width:           280,
          backgroundColor: theme.surface,
        },
      }}
      drawerContent={(props) => (
        <DrawerContent {...props} items={DRAWER_ITEMS} />
      )}
    >
      <Drawer.Screen name="MainStack" component={MainStack} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    position:          'absolute',
    top:               -4,
    right:             -8,
    backgroundColor:   '#C8102E',
    borderRadius:      9999,
    minWidth:          16,
    height:            16,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});