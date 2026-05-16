// src/navigation/MainAgentNavigator.jsx
import React, { useRef, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator }    from '@react-navigation/drawer';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import DrawerContent from '../components/DrawerContent';
import { spacing, radius, fonts } from '../constants/theme';

import OverviewScreen  from '../screens/main-agent/OverviewScreen';
import QueueScreen     from '../screens/main-agent/QueueScreen';
import TransfersScreen from '../screens/main-agent/TransfersScreen';
import AgentsScreen    from '../screens/main-agent/AgentsScreen';
import ApprovalsScreen from '../screens/main-agent/ApprovalsScreen';

const Tab    = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const DRAWER_ITEMS = [
  { label: 'Overview',  icon: 'bar-chart-outline',        onPress: nav => nav.navigate('MainTabs', { screen: 'Overview'  }) },
  { label: 'Queue',     icon: 'list-outline',             onPress: nav => nav.navigate('MainTabs', { screen: 'Queue'     }) },
  { label: 'Transfers', icon: 'swap-horizontal-outline',  onPress: nav => nav.navigate('MainTabs', { screen: 'Transfers' }) },
  { label: 'Agents',    icon: 'people-outline',           onPress: nav => nav.navigate('MainTabs', { screen: 'Agents'    }) },
  { label: 'Approvals', icon: 'checkmark-circle-outline', onPress: nav => nav.navigate('MainTabs', { screen: 'Approvals' }) },
];

// ─── Animated tab icon — matches SubAgentNavigator pattern exactly ────────────
// CRASH-SAFE: native driver (scale) and non-native (glow) in separate useEffects
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

function MainTabs() {
  const { theme } = useTheme();
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
        name="Overview"
        component={OverviewScreen}
        options={{
          tabBarLabel: 'Overview',
          tabBarIcon:  ({ focused, color }) => <TabIcon name="bar-chart"       focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Queue"
        component={QueueScreen}
        options={{
          tabBarLabel: 'Queue',
          tabBarIcon:  ({ focused, color }) => <TabIcon name="list"            focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Transfers"
        component={TransfersScreen}
        options={{
          tabBarLabel: 'Transfers',
          tabBarIcon:  ({ focused, color }) => <TabIcon name="swap-horizontal" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Agents"
        component={AgentsScreen}
        options={{
          tabBarLabel: 'Agents',
          tabBarIcon:  ({ focused, color }) => <TabIcon name="people"         focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Approvals"
        component={ApprovalsScreen}
        options={{
          tabBarLabel: 'Approvals',
          tabBarIcon:  ({ focused, color }) => <TabIcon name="checkmark-circle" focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function MainAgentNavigator() {
  const { theme } = useTheme();
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
        <DrawerContent {...props} items={DRAWER_ITEMS} />
      )}
    >
      <Drawer.Screen name="MainTabs" component={MainTabs} />
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
