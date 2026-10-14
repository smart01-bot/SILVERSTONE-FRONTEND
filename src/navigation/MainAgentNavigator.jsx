// src/navigation/MainAgentNavigator.jsx
import React, { useState,useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator }    from '@react-navigation/drawer';
import { View, Text, Keyboard, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import DrawerContent from '../components/DrawerContent';
import { MainAgentUIProvider } from '../components/agent/MainAgentUI';
import { useAgentUI } from '../components/agent/AgentUI';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PressFeedback from '../components/PressFeedback';
import { spacing, radius, fonts } from '../constants/theme';

import OverviewScreen  from '../screens/main-agent/OverviewScreen';
import QueueScreen     from '../screens/main-agent/QueueScreen';
import TransfersScreen from '../screens/main-agent/TransfersScreen';
import AgentsScreen    from '../screens/main-agent/AgentsScreen';
import ApprovalsScreen from '../screens/main-agent/ApprovalsScreen';

const Tab    = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

export function MainTabBar({state,descriptors,navigation}) {
  const {colors}=useAgentUI();const insets=useSafeAreaInsets();
  const [keyboardVisible,setKeyboardVisible]=useState(false);
  useEffect(()=>{const show=Keyboard.addListener('keyboardDidShow',()=>setKeyboardVisible(true));const hide=Keyboard.addListener('keyboardDidHide',()=>setKeyboardVisible(false));return()=>{show.remove();hide.remove();};},[]);
  if(keyboardVisible)return null;
  const icons={Overview:'grid',Queue:'list',Transfers:'swap-horizontal',Agents:'people',Approvals:'checkmark-circle'};
  return <View style={{backgroundColor:colors.bg,paddingHorizontal:12,paddingTop:8,paddingBottom:Math.max(insets.bottom,8)}}>
    <View style={{flexDirection:'row',padding:5,borderRadius:26,borderWidth:1,borderColor:colors.glassBorder,backgroundColor:colors.glass}}>
      {state.routes.map((route,index)=>{const selected=index===state.index;const options=descriptors[route.key].options;return <PressFeedback key={route.key}
        containerStyle={{flex:1}} accessibilityRole="tab" accessibilityLabel={options.tabBarLabel} accessibilityState={{selected}}
        onPress={()=>{const event=navigation.emit({type:'tabPress',target:route.key,canPreventDefault:true});if(!selected&&!event.defaultPrevented)navigation.navigate(route.name);}}
        onLongPress={()=>navigation.emit({type:'tabLongPress',target:route.key})}
        style={{minHeight:64,paddingVertical:8,paddingHorizontal:2,borderRadius:21,alignItems:'center',justifyContent:'center',backgroundColor:selected?colors.selected:'transparent',gap:5}}>
        <Ionicons name={icons[route.name]+(selected?'':'-outline')} size={23} color={selected?colors.text:colors.secondary}/>
        <Text style={{fontFamily:selected?fonts.bodySemi:fonts.body,fontSize:10,lineHeight:15,color:selected?colors.text:colors.secondary,textAlign:'center'}}>{options.tabBarLabel}</Text>
      </PressFeedback>})}
    </View>
  </View>;
}

function MainTabs() {
  const { theme, tr } = useTheme();
  return (
    <Tab.Navigator tabBar={props=><MainTabBar {...props}/>}
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
          tabBarLabel: tr('overview'),
        }}
      />
      <Tab.Screen
        name="Queue"
        component={QueueScreen}
        options={{
          tabBarLabel: tr('queue'),
        }}
      />
      <Tab.Screen
        name="Transfers"
        component={TransfersScreen}
        options={{
          tabBarLabel: tr('transfers'),
        }}
      />
      <Tab.Screen
        name="Agents"
        component={AgentsScreen}
        options={{
          tabBarLabel: tr('agents'),
        }}
      />
      <Tab.Screen
        name="Approvals"
        component={ApprovalsScreen}
        options={{
          tabBarLabel: tr('approvals'),
        }}
      />
    </Tab.Navigator>
  );
}

function MainAgentContent() {
  const { theme, tr } = useTheme();

  const DRAWER_ITEMS = [
    { label: tr('overview'),  icon: 'bar-chart-outline',        onPress: nav => nav.navigate('MainTabs', { screen: 'Overview'  }) },
    { label: tr('queue'),     icon: 'list-outline',             onPress: nav => nav.navigate('MainTabs', { screen: 'Queue'     }) },
    { label: tr('transfers'), icon: 'swap-horizontal-outline',  onPress: nav => nav.navigate('MainTabs', { screen: 'Transfers' }) },
    { label: tr('agents'),    icon: 'people-outline',           onPress: nav => nav.navigate('MainTabs', { screen: 'Agents'    }) },
    { label: tr('approvals'), icon: 'checkmark-circle-outline', onPress: nav => nav.navigate('MainTabs', { screen: 'Approvals' }) },
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
        <DrawerContent {...props} items={DRAWER_ITEMS} />
      )}
    >
      <Drawer.Screen name="MainTabs" component={MainTabs} />
    </Drawer.Navigator>
  );
}

export default function MainAgentNavigator() {
  return <MainAgentUIProvider><MainAgentContent/></MainAgentUIProvider>;
}
