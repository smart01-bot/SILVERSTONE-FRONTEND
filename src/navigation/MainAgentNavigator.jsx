import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import OverviewScreen   from '../screens/main-agent/OverviewScreen';
import QueueScreen      from '../screens/main-agent/QueueScreen';
import TransfersScreen  from '../screens/main-agent/TransfersScreen';
import AgentsScreen     from '../screens/main-agent/AgentsScreen';
import ApprovalsScreen  from '../screens/main-agent/ApprovalsScreen';
import { listenAgents } from '../utils/firestore';
import { useEffect, useState } from 'react';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, badge }) {
  return (
    <View style={{ position: 'relative' }}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      {badge > 0 && (
        <View style={{
          position: 'absolute', top: -4, right: -8,
          backgroundColor: '#FFA500', borderRadius: 8,
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

  useEffect(() => {
    return listenAgents((agents) => {
      setPendingApprovals(agents.filter(a => a.status === 'pending').length);
    });
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
        options={{ tabBarLabel: tr('overview'), tabBarIcon: () => <TabIcon emoji="📊" /> }} />
      <Tab.Screen name="Queue"     component={QueueScreen}
        options={{ tabBarLabel: tr('queue'),    tabBarIcon: ({ badge }) => <TabIcon emoji="📋" /> }} />
      <Tab.Screen name="Transfers" component={TransfersScreen}
        options={{ tabBarLabel: tr('transfers'),tabBarIcon: () => <TabIcon emoji="⇄" /> }} />
      <Tab.Screen name="Agents"    component={AgentsScreen}
        options={{ tabBarLabel: tr('agents'),   tabBarIcon: () => <TabIcon emoji="👥" /> }} />
      <Tab.Screen name="Approvals" component={ApprovalsScreen}
        options={{
          tabBarLabel: tr('approvals'),
          tabBarIcon: () => <TabIcon emoji="✅" badge={pendingApprovals} />,
        }} />
    </Tab.Navigator>
  );
}