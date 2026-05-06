import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import OverviewScreen   from '../screens/main-agent/OverviewScreen';
import QueueScreen      from '../screens/main-agent/QueueScreen';
import TransfersScreen  from '../screens/main-agent/TransfersScreen';
import AgentsScreen     from '../screens/main-agent/AgentsScreen';
import ApprovalsScreen  from '../screens/main-agent/ApprovalsScreen';
import { listenAgents, listenAllRequests } from '../utils/firestore';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, badge, color = '#D32F2F' }) {
  return (
    <View style={{ position: 'relative' }}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      {badge > 0 && (
        <View style={{
          position: 'absolute', top: -4, right: -8,
          backgroundColor: color, borderRadius: 8,
          paddingHorizontal: 5, paddingVertical: 1,
          minWidth: 16, alignItems: 'center',
        }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

export default function MainAgentNavigator() {
  const { theme, tr } = useTheme();
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [pendingQueue, setPendingQueue]         = useState(0);

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
      paddingBottom: 6,
      paddingTop: 6,
      height: 64,
    },
    tabBarActiveTintColor:   theme.primary,
    tabBarInactiveTintColor: theme.textDim,
    tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
  };

  return (
    <Tab.Navigator screenOptions={tabStyle}>
      <Tab.Screen name="Overview"  component={OverviewScreen}
        options={{ tabBarLabel: tr('overview'),  tabBarIcon: () => <TabIcon emoji="📊" /> }} />
      <Tab.Screen name="Queue"     component={QueueScreen}
        options={{ tabBarLabel: tr('queue'),     tabBarIcon: () => <TabIcon emoji="📋" badge={pendingQueue} /> }} />
      <Tab.Screen name="Transfers" component={TransfersScreen}
        options={{ tabBarLabel: tr('transfers'), tabBarIcon: () => <TabIcon emoji="⇄" /> }} />
      <Tab.Screen name="Agents"    component={AgentsScreen}
        options={{ tabBarLabel: tr('agents'),    tabBarIcon: () => <TabIcon emoji="👥" /> }} />
      <Tab.Screen name="Approvals" component={ApprovalsScreen}
        options={{
          tabBarLabel: tr('approvals'),
          tabBarIcon: () => <TabIcon emoji="✅" badge={pendingApprovals} color="#F59E0B" />,
        }} />
    </Tab.Navigator>
  );
}
