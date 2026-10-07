// UI-only tab shell. Keep the original request route names and params so
// account data, retry-prefill and the offline queue retain their existing paths.
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { createNavigatorFactory, TabActions, TabRouter, useNavigationBuilder } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabView } from 'react-native-tab-view';
import { AgentUIProvider, useAgentUI } from '../components/agent/AgentUI';
import { AgentFrame, AgentHeader, AgentPagePlaceholder, AgentTabBar } from '../components/agent/AgentChrome';
import HomeScreen from '../screens/sub-agent/HomeScreen';
import NewRequestScreen from '../screens/sub-agent/NewRequestScreen';
import MyRequestsScreen from '../screens/sub-agent/MyRequestsScreen';
import ProfileScreen from '../screens/sub-agent/ProfileScreen';
import NetworksScreen from '../screens/sub-agent/NetworksScreen';
import RequestSuccessScreen from '../screens/sub-agent/RequestSuccessScreen';

const Stack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function AgentTabNavigator({ initialRouteName, children, screenOptions }) {
  const { state, navigation, descriptors, NavigationContent } = useNavigationBuilder(TabRouter, {
    children, screenOptions, initialRouteName, backBehavior: 'history',
  });
  const { colors, reducedMotion } = useAgentUI();
  const { width } = useWindowDimensions();
  const visited = useRef(new Set());
  visited.current.add(state.routes[state.index].key);
  return <NavigationContent>
    <AgentFrame>
      <AgentHeader activeName={state.routes[state.index].name}
        onHistory={() => navigation.navigate('MyRequests', { showList: true })} />
      <TabView navigationState={state} initialLayout={{ width }}
        onIndexChange={index => navigation.dispatch({ ...TabActions.jumpTo(state.routes[index].name, state.routes[index].params), target: state.key })}
        // A cancelled first swipe must not mount Requests and trigger its
        // existing offline auto-sync. Once selected, keep scenes/drafts alive.
        renderScene={({ route }) => visited.current.has(route.key)
          ? descriptors[route.key].render() : <AgentPagePlaceholder />}
        renderTabBar={props => <AgentTabBar {...props} navigation={navigation} />}
        tabBarPosition="bottom" lazy lazyPreloadDistance={0}
        renderLazyPlaceholder={() => <AgentPagePlaceholder />}
        animationEnabled={!reducedMotion} swipeEnabled keyboardDismissMode="on-drag"
        sceneContainerStyle={{ backgroundColor: colors.bg }} style={{ backgroundColor: colors.bg }} />
    </AgentFrame>
  </NavigationContent>;
}

const Tab = createNavigatorFactory(AgentTabNavigator)();

function ProfileArea() {
  const { colors, reducedMotion } = useAgentUI();
  return <ProfileStack.Navigator initialRouteName="ProfileOverview" screenOptions={{ headerShown: false,
    contentStyle: { backgroundColor: colors.bg }, animation: reducedMotion ? 'none' : 'slide_from_right' }}>
    <ProfileStack.Screen name="ProfileOverview" component={ProfileScreen} />
    <ProfileStack.Screen name="Networks" component={NetworksScreen} />
  </ProfileStack.Navigator>;
}

function HomeTabs() {
  return <Tab.Navigator initialRouteName="Home">
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="NewRequest" component={NewRequestScreen} />
    <Tab.Screen name="MyRequests" component={MyRequestsScreen} />
    <Tab.Screen name="Profile" component={ProfileArea} />
  </Tab.Navigator>;
}

// Compatibility for former stack entry points; these are not extra main pages.
function LegacyProfileRoute({ navigation, route }) {
  const { colors } = useAgentUI();
  useEffect(() => {
    navigation.navigate('Tabs', { screen: 'Profile', params: {
      screen: route.name === 'Networks' ? 'Networks' : 'ProfileOverview', initial: false,
    } });
  }, [navigation, route.name]);
  return <View style={[styles.flex, { backgroundColor: colors.bg }]} />;
}

function MainStack() {
  const { colors, reducedMotion } = useAgentUI();
  return <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg },
    animation: reducedMotion ? 'none' : 'slide_from_right', gestureEnabled: true }}>
    <Stack.Screen name="Tabs" component={HomeTabs} />
    <Stack.Screen name="RequestSuccess" component={RequestSuccessScreen} />
    <Stack.Screen name="Networks" component={LegacyProfileRoute} />
    <Stack.Screen name="Profile" component={LegacyProfileRoute} />
  </Stack.Navigator>;
}

export default function SubAgentNavigator() {
  return <AgentUIProvider><MainStack /></AgentUIProvider>;
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
