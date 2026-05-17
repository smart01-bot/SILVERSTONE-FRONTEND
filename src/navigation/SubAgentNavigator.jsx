// src/navigation/SubAgentNavigator.jsx
import React, { useRef, useEffect } from 'react';
import { createBottomTabNavigator }   from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator }      from '@react-navigation/drawer';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme }         from '../context/ThemeContext';
import DrawerContent        from '../components/DrawerContent';
import { fonts, radius, spacing } from '../constants/theme';

import HomeScreen           from '../screens/sub-agent/HomeScreen';
import NewRequestScreen     from '../screens/sub-agent/NewRequestScreen';
import RequestSuccessScreen from '../screens/sub-agent/RequestSuccessScreen';
import MyRequestsScreen     from '../screens/sub-agent/MyRequestsScreen';
import ProfileScreen        from '../screens/sub-agent/ProfileScreen';
import NetworksScreen       from '../screens/sub-agent/NetworksScreen';

const Tab    = createBottomTabNavigator();
const Stack  = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// ─── Animated tab icon ────────────────────────────────────────────────────────
// CRASH FIX: native driver (scale) and non-native driver (backgroundColor glow)
// MUST live in separate useEffect calls and separate Animated.View wrappers.
function TabIcon({ name, focused, color, badge }) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue:         focused ? 1.25 : 1,
      useNativeDriver: true,
      tension:         200,
      friction:        7,
    }).start();
  }, [focused]);

  useEffect(() => {
    Animated.timing(glow, {
      toValue:         focused ? 1 : 0,
      duration:        180,
      useNativeDriver: false,
    }).start();
  }, [focused]);

  const bgColor = glow.interpolate({
    inputRange:  [0, 1],
    outputRange: ['rgba(0,0,0,0)', color + '25'],
  });

  return (
    <Animated.View style={[styles.tabIconWrap, { backgroundColor: bgColor }]}>
      <Animated.View style={{ transform: [{ scale }], alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons
          name={focused ? name : `${name}-outline`}
          size={26}
          color={color}
          style={focused && Platform.OS === 'ios' ? {
            shadowColor:   color,
            shadowOffset:  { width: 0, height: 3 },
            shadowOpacity: 0.6,
            shadowRadius:  6,
          } : undefined}
        />
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

// ─── Bottom tabs ──────────────────────────────────────────────────────────────
function HomeTabs() {
  const { theme, tr } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        lazy:        true,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor:  theme.border,
          borderTopWidth:  1,
          paddingBottom:   Platform.OS === 'ios' ? 22 : 10,
          paddingTop:      spacing.sm,
          height:          Platform.OS === 'ios' ? 86 : 68,
          ...Platform.select({
            ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.10, shadowRadius: 14 },
            android: { elevation: 16 },
          }),
        },
        tabBarActiveTintColor:   theme.primary,
        tabBarInactiveTintColor: theme.textDim,
        tabBarLabelStyle: {
          fontSize:      13,
          fontFamily:    fonts.bodyBold,
          marginTop:     2,
          letterSpacing: 0.1,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: tr('home'),
          tabBarIcon:  ({ focused, color }) => <TabIcon name="home"       focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="NewRequest"
        component={NewRequestScreen}
        options={{
          tabBarLabel: tr('request'),
          tabBarIcon:  ({ focused, color }) => <TabIcon name="add-circle" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="MyRequests"
        component={MyRequestsScreen}
        options={{
          tabBarLabel: tr('history'),
          tabBarIcon:  ({ focused, color }) => <TabIcon name="time"       focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Stack ────────────────────────────────────────────────────────────────────
function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown:       false,
        animation:         'slide_from_right',
        animationDuration: 300,
        gestureEnabled:    true,
      }}
    >
      <Stack.Screen name="Tabs"           component={HomeTabs} />
      <Stack.Screen
        name="RequestSuccess"
        component={RequestSuccessScreen}
        options={{ animation: 'slide_from_bottom', animationDuration: 350 }}
      />
      <Stack.Screen
        name="Networks"
        component={NetworksScreen}
        options={{ animation: 'slide_from_right', animationDuration: 280 }}
      />
    </Stack.Navigator>
  );
}

// ─── Root Drawer ──────────────────────────────────────────────────────────────
export default function SubAgentNavigator() {
  const { theme, tr } = useTheme();

  const drawerItems = [
    { label: tr('home'),       icon: 'home-outline',       onPress: nav => nav.navigate('MainStack', { screen: 'Tabs', params: { screen: 'Home'       } }) },
    { label: tr('newRequest'), icon: 'add-circle-outline', onPress: nav => nav.navigate('MainStack', { screen: 'Tabs', params: { screen: 'NewRequest' } }) },
    { label: tr('history'),    icon: 'time-outline',       onPress: nav => nav.navigate('MainStack', { screen: 'Tabs', params: { screen: 'MyRequests' } }) },
    { label: tr('networks'),    icon: 'wifi-outline',       onPress: nav => nav.navigate('MainStack', { screen: 'Networks' }) },
    { label: tr('profile'),    icon: 'person-outline',     onPress: nav => nav.navigate('MainStack', { screen: 'Tabs', params: { screen: 'Profile'    } }) },
  ];

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown:    false,
        drawerType:     'front',
        overlayColor:   'rgba(0,0,0,0.55)',
        swipeEdgeWidth: 60,
        drawerStyle: {
          width:           290,
          backgroundColor: theme.surface,
          ...Platform.select({
            ios:     { shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.22, shadowRadius: 18 },
            android: { elevation: 22 },
          }),
        },
      }}
      drawerContent={(props) => (
        <DrawerContent {...props} items={drawerItems} />
      )}
    >
      <Drawer.Screen name="MainStack" component={MainStack} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    width:          46,
    height:         38,
    borderRadius:   radius.md,
    alignItems:     'center',
    justifyContent: 'center',
  },
  badge: {
    position:          'absolute',
    top:               -4,
    right:             -8,
    backgroundColor:   '#C8102E',
    borderRadius:      radius.full,
    minWidth:          18,
    height:            18,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: spacing.xs,
  },
  badgeText: { color: '#fff', fontSize: 11, fontFamily: fonts.bodyXBold },
});
