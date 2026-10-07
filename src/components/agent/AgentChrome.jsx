import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Keyboard, Platform, Pressable, StatusBar,
  StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as NavigationBar from 'expo-navigation-bar';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { fonts } from '../../constants/theme';
import { AGENT_TABS, isBoxyAgentDevice } from './agentTheme';
import { AgentButton, AgentNotice, AgentSheet, useAgentUI } from './AgentUI';

export function AgentFrame({ children }) {
  const { colors, isDark } = useAgentUI();
  const mounted = useRef(false);
  const original = useRef(null);
  const operations = useRef(Promise.resolve());

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    mounted.current = true;
    // Capture once. Theme changes must not replace the values restored on exit.
    operations.current = Promise.allSettled([
      NavigationBar.getBackgroundColorAsync(),
      NavigationBar.getButtonStyleAsync(),
      NavigationBar.getBorderColorAsync(),
    ]).then(values => { original.current = values; });
    return () => {
      mounted.current = false;
      operations.current = operations.current.then(async () => {
        const saved = original.current;
        if (!saved) return;
        await Promise.allSettled([
          saved[0].status === 'fulfilled' ? NavigationBar.setBackgroundColorAsync(saved[0].value) : Promise.resolve(),
          saved[1].status === 'fulfilled' ? NavigationBar.setButtonStyleAsync(saved[1].value) : Promise.resolve(),
          saved[2].status === 'fulfilled' ? NavigationBar.setBorderColorAsync(saved[2].value) : Promise.resolve(),
        ]);
      }).catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    operations.current = operations.current.then(async () => {
      if (!mounted.current) return;
      await Promise.allSettled([
        NavigationBar.setBackgroundColorAsync(colors.bg),
        NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark'),
        NavigationBar.setBorderColorAsync(colors.bg),
      ]);
    }).catch(() => {});
  }, [colors.bg, isDark]);

  return (
    <SafeAreaView edges={{ top: 'additive', left: 'additive', right: 'additive', bottom: 'off' }} style={[s.frame, { backgroundColor: colors.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />
      {children}
    </SafeAreaView>
  );
}

function SilverstoneMark({ color }) {
  return (
    <Svg width={28} height={31} viewBox="0 0 28 31" accessible={false}>
      <Path fill={color} d="M14 1 27 8.5 22 11.4 14 6.8 6 11.4 22 20.6 22 15.9 27 18.8 27 23.1 14 30.6 1 23.1 1 17.3 14 24.8 19 21.9 1 11.5 1 8.5Z" />
      <Path fill={color} d="M8 13.7 13 10.8 27 18.9 22 21.8Z" />
    </Svg>
  );
}

export function AgentHeader({ activeName, onHistory }) {
  const { colors, isDark, copy, reducedMotion, setHeaderHeight } = useAgentUI();
  const { setTheme, userPreference } = useTheme();
  const [sheet, setSheet] = useState(null);
  const [appearanceError, setAppearanceError] = useState('');
  const tab = AGENT_TABS.find(item => item.name === activeName) || AGENT_TABS[0];
  const label = copy(tab.en, tab.sw);
  const transition = useRef(new Animated.Value(1)).current;
  const [titles, setTitles] = useState({ current: label, previous: null });
  const latestTitle = useRef(label);

  useEffect(() => {
    if (latestTitle.current === label) {
      if (reducedMotion) {
        transition.stopAnimation();
        transition.setValue(1);
        setTitles({ current: label, previous: null });
      }
      return undefined;
    }
    const previous = latestTitle.current;
    latestTitle.current = label;
    transition.stopAnimation();
    if (reducedMotion) {
      setTitles({ current: label, previous: null });
      transition.setValue(1);
      return undefined;
    }
    setTitles({ current: label, previous });
    transition.setValue(0);
    const animation = Animated.timing(transition, { toValue: 1, duration: 180, useNativeDriver: true });
    animation.start(({ finished }) => {
      if (finished) setTitles({ current: label, previous: null });
    });
    return () => animation.stop();
  }, [label, reducedMotion, transition]);

  const chooseAppearance = async preference => {
    setAppearanceError('');
    try {
      await setTheme(preference);
      setSheet(null);
    } catch {
      setAppearanceError(copy('Appearance changed, but your preference could not be saved. Try again.', 'Mwonekano umebadilika, lakini chaguo lako halijahifadhiwa. Jaribu tena.'));
    }
  };

  return (
    <>
      <View onLayout={event => setHeaderHeight(event.nativeEvent.layout.height)}>
      <View style={s.header}>
        <View style={s.brand} accessibilityLabel="Silverstone" accessible>
          <SilverstoneMark color={colors.text} />
          <Text numberOfLines={1} style={[s.brandText, { color: colors.text }]}>SILVERSTONE</Text>
        </View>
        <View style={s.headerActions}>
          <Pressable onPress={() => { setAppearanceError(''); setSheet('appearance'); }}
            accessibilityRole="button" accessibilityLabel={copy('Appearance', 'Mwonekano')}
            style={({ pressed }) => [s.iconButton, { backgroundColor: colors.glass, borderColor: colors.glassBorder, opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={23} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => setSheet('notifications')}
            accessibilityRole="button" accessibilityLabel={copy('Notifications', 'Arifa')}
            style={({ pressed }) => [s.iconButton, { backgroundColor: colors.glass, borderColor: colors.glassBorder, opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons name="notifications-outline" size={23} color={colors.text} />
          </Pressable>
        </View>
      </View>
      <View style={s.titleSlot}>
        {titles.previous && (
          <Animated.Text accessible={false} importantForAccessibility="no-hide-descendants"
            style={[s.pageTitle, s.previousTitle, { color: colors.text,
              opacity: transition.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              transform: [{ translateY: transition.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }],
            }]}>{titles.previous}</Animated.Text>
        )}
        <Animated.Text accessibilityRole="header" accessibilityLiveRegion="polite"
          style={[s.pageTitle, { color: colors.text, opacity: transition,
            transform: [{ translateY: transition.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          }]}>{titles.current}</Animated.Text>
      </View>

      </View>

      <AgentSheet visible={sheet === 'appearance'} onClose={() => setSheet(null)} title={copy('Appearance', 'Mwonekano')}>
        {[
          { value: 'auto', label: copy('System', 'Mfumo'), icon: 'phone-portrait-outline' },
          { value: 'light', label: copy('Light', 'Mwanga'), icon: 'sunny-outline' },
          { value: 'dark', label: copy('Dark', 'Giza'), icon: 'moon-outline' },
        ].map(option => {
          const selected = (userPreference || 'auto') === option.value;
          return <Pressable key={option.value} onPress={() => chooseAppearance(option.value)}
            accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ checked: selected }}
            style={({ pressed }) => [s.sheetRow, { borderBottomColor: colors.border, opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons name={option.icon} size={22} color={colors.text} />
            <Text style={[s.sheetLabel, { color: colors.text }]}>{option.label}</Text>
            {selected && <Ionicons name="checkmark" size={21} color={colors.text} />}
          </Pressable>;
        })}
        {appearanceError ? <AgentNotice error>{appearanceError}</AgentNotice> : null}
      </AgentSheet>
      <AgentSheet visible={sheet === 'notifications'} onClose={() => setSheet(null)} title={copy('Notifications', 'Arifa')}>
        <Text style={[s.sheetDescription, { color: colors.secondary }]}>
          {copy('Request updates are available in History. Push notifications are not available yet.', 'Taarifa za maombi zinapatikana kwenye Historia. Arifa za moja kwa moja bado hazipatikani.')}
        </Text>
        <AgentButton label={copy('View history', 'Angalia historia')} onPress={() => { setSheet(null); onHistory?.(); }} />
      </AgentSheet>
    </>
  );
}

export function AgentTabBar({ navigationState, position, navigation }) {
  const { colors, isDark, copy, reducedTransparency, reducedMotion } = useAgentUI();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const boxy = isBoxyAgentDevice(Platform.constants?.Model);
  const corner = boxy ? 14 : 34;
  const cellWidth = Math.max(0, (width - 12) / navigationState.routes.length);
  const markerWidth = Math.max(0, Math.min(50, cellWidth - 8));
  const indicatorPosition = useMemo(() => Animated.multiply(position, cellWidth), [position, cellWidth]);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  if (keyboardVisible) return null;

  return (
    <View style={[s.navigationArea, { backgroundColor: colors.bg, paddingBottom: Math.max(insets.bottom, 6) + 8 }]}>
      <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={[s.navigationBar, {
        borderRadius: corner, borderColor: colors.glassBorder,
        backgroundColor: reducedTransparency ? colors.surface : colors.glass,
      }]}>
        {Platform.OS === 'ios' && !reducedTransparency && (
          <BlurView intensity={18} tint={isDark ? 'dark' : 'light'} pointerEvents="none" style={StyleSheet.absoluteFill} />
        )}
        {cellWidth > 0 && <Animated.View pointerEvents="none" style={[s.selection, {
          left: 6 + (cellWidth - markerWidth) / 2,
          width: markerWidth, borderRadius: boxy ? 10 : 27, backgroundColor: colors.selected,
          borderColor: colors.glassBorder,
          transform: [{ translateX: reducedMotion ? navigationState.index * cellWidth : indicatorPosition }],
        }]} />}
        <View style={s.tabs}>
          {navigationState.routes.map((route, index) => {
            const tab = AGENT_TABS.find(item => item.name === route.name) || AGENT_TABS[index];
            const selected = navigationState.index === index;
            return <Pressable key={route.key} testID={`agent-tab-${route.name}`}
              accessibilityRole="tab" accessibilityLabel={copy(tab.en, tab.sw)} accessibilityState={{ selected }}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!selected && !event.defaultPrevented) navigation.navigate({ name: route.name, merge: true });
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={({ pressed }) => [s.tab, { opacity: pressed ? 0.55 : 1 }]}>
              <Ionicons name={tab.icon} size={25} color={selected ? colors.text : colors.secondary} />
            </Pressable>;
          })}
        </View>
      </View>
    </View>
  );
}

export function AgentPagePlaceholder() {
  const { colors, copy } = useAgentUI();
  return <View style={[s.placeholder, { backgroundColor: colors.bg }]}>
    <ActivityIndicator color={colors.secondary} accessibilityLabel={copy('Loading page', 'Inapakia ukurasa')} />
  </View>;
}

const s = StyleSheet.create({
  frame: { flex: 1 },
  header: { minHeight: 70, paddingHorizontal: 24, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { flexShrink: 1, fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 0.1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { width: 44, height: 44, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  titleSlot: { minHeight: 48, paddingHorizontal: 24, paddingTop: 4, paddingBottom: 10, overflow: 'hidden' },
  pageTitle: { fontFamily: fonts.bodySemi, fontSize: 23, lineHeight: 32, letterSpacing: -0.45 },
  previousTitle: { position: 'absolute', left: 24, top: 4, right: 24 },
  sheetRow: { minHeight: 60, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetLabel: { flex: 1, fontFamily: fonts.bodyMed, fontSize: 16, lineHeight: 23 },
  sheetDescription: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, marginBottom: 24 },
  navigationArea: { paddingTop: 8, paddingHorizontal: 20 },
  navigationBar: { width: '100%', maxWidth: 440, height: 64, alignSelf: 'center', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  tabs: { flex: 1, flexDirection: 'row', padding: 6 },
  tab: { flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  selection: { position: 'absolute', left: 10, top: 6, bottom: 6, borderWidth: StyleSheet.hairlineWidth },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
