import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import OverviewScreen   from '../screens/main-agent/OverviewScreen';
import QueueScreen      from '../screens/main-agent/QueueScreen';
import TransfersScreen  from '../screens/main-agent/TransfersScreen';
import AgentsScreen     from '../screens/main-agent/AgentsScreen';
import ApprovalsScreen  from '../screens/main-agent/ApprovalsScreen';
import { listenAgents, listenAllRequests } from '../utils/firestore';

const Tab = createBottomTabNavigator();

function TabIcon({ iconComponent, badge, focused, color }) {
  return (
    <View style={{ alignItems: 'center' }}>
      {focused && (
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, marginBottom: 3 }} />
      )}
      <View>
        {iconComponent}
        {badge > 0 && (
          <View style={{
            position: 'absolute', top: -4, right: -8,
            backgroundColor: color, borderRadius: 8,
            paddingHorizontal: 4, paddingVertical: 1,
            minWidth: 16, alignItems: 'center',
          }}>
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{badge}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function MainAgentNavigator() {
  const { theme, tr } = useTheme();
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [pendingQueue,     setPendingQueue]     = useState(0);

  useEffect(() => {
    const unsubAgents = listenAgents((agents) => {
      setPendingApprovals(agents.filter(a => a.status === 'pending').length);
    });
    const unsubQueue = listenAllRequests((requests) => {
      setPendingQueue(requests.filter(r => r.status === 'pending').length);
    });
    return () => { unsubAgents(); unsubQueue(); };
  }, []);

  const tabStyle = {
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
  };

  return (
    <Tab.Navigator screenOptions={tabStyle}>
      <Tab.Screen name="Overview" component={OverviewScreen}
        options={{ tabBarLabel: tr('overview'), tabBarIcon: ({ focused, color }) =>
          <TabIcon focused={focused} color={color}
            iconComponent={<Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={24} color={color} />} /> }} />

      <Tab.Screen name="Queue" component={QueueScreen}
        options={{ tabBarLabel: tr('queue'), tabBarIcon: ({ focused, color }) =>
          <TabIcon focused={focused} color={color} badge={pendingQueue}
            iconComponent={<Ionicons name={focused ? 'list' : 'list-outline'} size={24} color={color} />} /> }} />

      <Tab.Screen name="Transfers" component={TransfersScreen}
        options={{ tabBarLabel: tr('transfers'), tabBarIcon: ({ focused, color }) =>
          <TabIcon focused={focused} color={color}
            iconComponent={<MaterialIcons name="swap-horiz" size={24} color={color} />} /> }} />

      <Tab.Screen name="Agents" component={AgentsScreen}
        options={{ tabBarLabel: tr('agents'), tabBarIcon: ({ focused, color }) =>
          <TabIcon focused={focused} color={color}
            iconComponent={<Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />} /> }} />

      <Tab.Screen name="Approvals" component={ApprovalsScreen}
        options={{ tabBarLabel: tr('approvals'), tabBarIcon: ({ focused, color }) =>
          <TabIcon focused={focused} color={color} badge={pendingApprovals}
            iconComponent={<Ionicons name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} size={24} color={color} />} /> }} />
    </Tab.Navigator>
  );
}
