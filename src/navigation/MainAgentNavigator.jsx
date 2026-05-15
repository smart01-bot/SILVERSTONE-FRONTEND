// src/navigation/MainAgentNavigator.jsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import DrawerContent from '../components/DrawerContent';

import OverviewScreen   from '../screens/main-agent/OverviewScreen';
import QueueScreen      from '../screens/main-agent/QueueScreen';
import TransfersScreen  from '../screens/main-agent/TransfersScreen';
import AgentsScreen     from '../screens/main-agent/AgentsScreen';
import ApprovalsScreen  from '../screens/main-agent/ApprovalsScreen';

const Tab    = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const DRAWER_ITEMS = [
  { label: 'Overview',  icon: 'bar-chart-outline',        onPress: nav => nav.navigate('MainTabs', { screen: 'Overview'  }) },
  { label: 'Queue',     icon: 'list-outline',             onPress: nav => nav.navigate('MainTabs', { screen: 'Queue'     }) },
  { label: 'Transfers', icon: 'swap-horizontal-outline',  onPress: nav => nav.navigate('MainTabs', { screen: 'Transfers' }) },
  { label: 'Agents',    icon: 'people-outline',           onPress: nav => nav.navigate('MainTabs', { screen: 'Agents'    }) },
  { label: 'Approvals', icon: 'checkmark-circle-outline', onPress: nav => nav.navigate('MainTabs', { screen: 'Approvals' }) },
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

function MainTabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor:       theme.surface,
          borderTopColor:        theme.border,
          borderTopWidth:        1,
          paddingBottom:         8,
          paddingTop:            8,
          height:                64,
          sceneAnimationEnabled: true,
          sceneAnimationType:    'shifting',
        },
        tabBarActiveTintColor:   theme.primary,
        tabBarInactiveTintColor: theme.textDim,
        tabBarLabelStyle: {
          fontSize:   10,
          fontWeight: '600',
          marginTop:  2,
        },
      }}
    >
      <Tab.Screen
        name="Overview"
        component={OverviewScreen}
        options={{
          tabBarLabel: 'Overview',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="bar-chart" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Queue"
        component={QueueScreen}
        options={{
          tabBarLabel: 'Queue',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="list" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Transfers"
        component={TransfersScreen}
        options={{
          tabBarLabel: 'Transfers',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="swap-horizontal" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Agents"
        component={AgentsScreen}
        options={{
          tabBarLabel: 'Agents',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="people" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Approvals"
        component={ApprovalsScreen}
        options={{
          tabBarLabel: 'Approvals',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="checkmark-circle" focused={focused} color={color} />
          ),
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
        headerShown:  false,
        drawerType:   'front',
        overlayColor: 'rgba(0,0,0,0.5)',
        drawerStyle: {
          width:           280,
          backgroundColor: theme.surface,
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
  badgeText: {
    color:      '#fff',
    fontSize:   9,
    fontWeight: '800',
  },
});