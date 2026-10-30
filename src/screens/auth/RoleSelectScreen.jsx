import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, AppState, Easing, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import SwiftWakalaMark, { SWIFT_WINGS } from '../../components/SwiftWakalaMark';
import { AgentFrame } from '../../components/agent/AgentChrome';
import { AgentUIProvider, useAgentUI } from '../../components/agent/AgentUI';
import { useThemeReveal } from '../../components/agent/ThemeReveal';
import { fonts } from '../../constants/theme';

function WelcomeWing() {
  const { colors, isDark, reducedMotion } = useAgentUI();
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => sub.remove();
  }, []);
  useEffect(() => {
    progress.setValue(0);
    if (reducedMotion || !active || !focused) return undefined;
    const timing = toValue => Animated.timing(progress, { toValue, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false });
    const animation = Animated.loop(Animated.sequence([timing(1), timing(0)]));
    animation.start();
    return () => { animation.stop(); progress.stopAnimation(); };
  }, [active, focused, reducedMotion, progress]);
  return <View style={s.visual} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none">
    <Svg width={270} height={220} style={s.halo}>
      <Defs><RadialGradient id="welcome-halo" cx="50%" cy="50%" rx="50%" ry="50%">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity={isDark ? 0.055 : 0.95} /><Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
      </RadialGradient></Defs><Ellipse cx={135} cy={110} rx={135} ry={110} fill="url(#welcome-halo)" />
    </Svg>
    <Animated.View testID="welcome-wing" style={[s.mark, { transform: [
      { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] }) },
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [3, -7] }) },
      { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '1deg'] }) },
    ] }]}>
      {SWIFT_WINGS.map((path, index) => <Animated.View key={path} style={[StyleSheet.absoluteFillObject, { transform: [
        { translateX: index ? 0 : progress.interpolate({ inputRange: [0, 1], outputRange: [0, 2.6] }) },
        { translateY: index ? 0 : progress.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
      ] }]}><Svg width="100%" height="100%" viewBox="-12 -12 124 104"><Path d={path} fill={colors.text} /></Svg></Animated.View>)}
    </Animated.View>
  </View>;
}

function Welcome({ navigation }) {
  const { colors, isDark, copy, reducedMotion, reducedTransparency } = useAgentUI();
  const { toggle, error } = useThemeReveal();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState('sub-agent');
  const [selectorWidth, setSelectorWidth] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;
  const main = selected === 'main-agent';
  const compact = width < 350 || height < 740;
  useEffect(() => {
    slide.stopAnimation();
    const toValue = main ? 1 : 0;
    if (reducedMotion) { slide.setValue(toValue); return undefined; }
    const animation = Animated.timing(slide, { toValue, duration: 380, easing: Easing.bezier(.22, 1, .36, 1), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [main, reducedMotion, slide]);
  const login = () => navigation.navigate('Login', { selectedRole: selected });
  const register = () => {
    if (!main) { navigation.navigate('Step1Phone'); return; }
    Alert.alert(copy('Main Agent accounts', 'Akaunti za Wakala Mkuu'),
      copy('Silverstone sets up Main Agent accounts. If your account is ready, sign in to continue.', 'Silverstone huandaa akaunti za Wakala Mkuu. Ikiwa akaunti yako iko tayari, ingia ili kuendelea.'),
      [{ text: copy('Back', 'Rudi'), style: 'cancel' }, { text: copy('Sign in', 'Ingia'), onPress: login }]);
  };
  return <ScrollView testID="welcome-screen" showsVerticalScrollIndicator={false} contentContainerStyle={[s.page, {
    paddingHorizontal: width < 350 ? 20 : 26, paddingTop: compact ? 18 : 28, paddingBottom: Math.max(16, insets.bottom),
  }]}>
    <View style={s.header}>
      <View accessible accessibilityLabel="Swift Wakala by Silverstone" style={s.brand}>
        <SwiftWakalaMark color={colors.text} size={34} />
        <View><Text style={[s.brandName, { color: colors.text }]}>Swift Wakala</Text><Text style={[s.owner, { color: colors.secondary }]}>by Silverstone</Text></View>
      </View>
      <Pressable testID="welcome-theme" accessibilityRole="button" accessibilityLabel={isDark ? copy('Switch to light theme', 'Badili kwenda mwanga') : copy('Switch to dark theme', 'Badili kwenda giza')}
        onPress={event => toggle({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY })}
        style={({ pressed }) => [s.theme, { borderColor: colors.border, backgroundColor: colors.glass, opacity: pressed ? 0.65 : 1 }]}>
        <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={21} color={colors.text} />
      </Pressable>
    </View>
    <View style={[s.intro, compact && { marginTop: 30 }]}>
      <Text style={[s.eyebrow, { color: colors.secondary }]}>{copy('YOUR BUSINESS. IN MOTION.', 'BIASHARA YAKO. INAENDELEA.')}</Text>
      <Text accessibilityRole="header" style={[s.title, { color: colors.text, fontSize: compact ? 41 : 49, lineHeight: compact ? 47 : 55 }]}>{copy('Let’s get\nyou moving', 'Tuendelee\npamoja')}<Text style={{ color: colors.muted }}>.</Text></Text>
      <Text style={[s.subtitle, { color: colors.secondary }]}>{copy('Choose how you use Swift Wakala.', 'Chagua jinsi unavyotumia Swift Wakala.')}</Text>
    </View>
    <WelcomeWing />
    <View style={s.actions}>
      <View accessibilityRole="radiogroup" accessibilityLabel={copy('Account role', 'Aina ya akaunti')}
        onLayout={event => setSelectorWidth(event.nativeEvent.layout.width)}
        style={[s.selector, { borderColor: colors.border, backgroundColor: reducedTransparency ? colors.surface : isDark ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.42)' }]}>
        <Animated.View pointerEvents="none" style={[s.selection, { width: Math.max(0, (selectorWidth - 12) / 2), backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : '#FFFFFF',
          transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(0, (selectorWidth - 12) / 2)] }) }] }]} />
        {[['sub-agent', copy('Agent', 'Wakala')], ['main-agent', copy('Main Agent', 'Wakala Mkuu')]].map(([id, label]) => <Pressable key={id} testID={`welcome-${id}`} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: selected === id }} aria-checked={selected === id}
          onPress={() => setSelected(id)} style={s.role}><Text style={[s.roleText, { color: selected === id ? colors.text : colors.secondary }]}>{label}</Text></Pressable>)}
      </View>
      <Text accessibilityLiveRegion="polite" style={[s.description, { color: colors.secondary }]}>{main ? copy('Support your agents. Keep business moving.', 'Saidia mawakala wako. Endeleza biashara.') : copy('Move float. Serve your customers.', 'Hamisha float. Hudumia wateja wako.')}</Text>
      {error ? <Text accessibilityRole="alert" style={[s.error, { color: colors.danger }]}>{error}</Text> : null}
      <Pressable accessibilityRole="button" onPress={login} style={({ pressed }) => [s.continue, { backgroundColor: colors.action, opacity: pressed ? 0.75 : 1 }]}>
        <Text style={[s.continueText, { color: colors.actionText }]}>{main ? copy('Continue as Main Agent', 'Endelea kama Wakala Mkuu') : copy('Continue as Agent', 'Endelea kama Wakala')}</Text>
        <Ionicons name="arrow-forward" size={22} color={colors.actionText} />
      </Pressable>
      <View style={s.registration}><Text style={[s.newHere, { color: colors.secondary }]}>{copy('New here?', 'Mgeni hapa?')}</Text><Pressable accessibilityRole="button" onPress={register} style={s.registerLink}><Text style={[s.registerText, { color: colors.text }]}>{copy('Create an account', 'Fungua akaunti')}</Text></Pressable></View>
    </View>
  </ScrollView>;
}

export default function RoleSelectScreen(props) {
  return <AgentUIProvider><AgentFrame><Welcome {...props} /></AgentFrame></AgentUIProvider>;
}
const s = StyleSheet.create({
  page: { flexGrow: 1, width: '100%', maxWidth: 460, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9, flexShrink: 1 },
  brandName: { fontFamily: fonts.heading, fontSize: 19, letterSpacing: -.7 }, owner: { fontFamily: fonts.body, fontSize: 11, letterSpacing: .5, marginTop: 3 },
  theme: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  intro: { marginTop: 48 }, eyebrow: { fontFamily: fonts.bodySemi, fontSize: 11, lineHeight: 17, letterSpacing: 1.8, marginBottom: 17 },
  title: { fontFamily: fonts.heading, letterSpacing: -2.7 }, subtitle: { fontFamily: fonts.body, fontSize: 15, lineHeight: 24, marginTop: 19, letterSpacing: -.2 },
  visual: { flexGrow: 1, minHeight: 196, maxHeight: 340, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 12 },
  halo: { position: 'absolute' }, mark: { width: 164, height: 146 }, actions: { marginTop: 'auto' },
  selector: { borderWidth: 1, borderRadius: 21, padding: 5, flexDirection: 'row', overflow: 'hidden' },
  selection: { position: 'absolute', left: 5, top: 5, bottom: 5, borderRadius: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.13)' },
  role: { flex: 1, minHeight: 48, paddingVertical: 12, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center' }, roleText: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  description: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 15, marginBottom: 25 },
  continue: { minHeight: 60, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 12 }, continueText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 24 },
  registration: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 17 }, newHere: { fontFamily: fonts.body, fontSize: 14 },
  registerLink: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 3 }, registerText: { fontFamily: fonts.bodySemi, fontSize: 14 }, error: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, marginBottom: 12 },
});
