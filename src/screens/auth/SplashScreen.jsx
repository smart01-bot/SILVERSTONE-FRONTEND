import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View, Text, StyleSheet, StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as NativeSplashScreen from 'expo-splash-screen';
import { fonts } from '../../constants/theme';
import { SWIFT_WINGS } from '../../components/SwiftWakalaMark';
import { useTheme } from '../../context/ThemeContext';

// 1100ms assembly/hold + 850ms departure/reveal, matching the approved concept.
// Account readiness extends only the settled hold; it cannot bypass the PIN.
export default function SplashScreen({ navigation, onDone, ready = true, resourcesReady = true, contentProgress, onMotionPreference }) {
  const { isDark, lang } = useTheme();
  const dimensions = useWindowDimensions();
  const [laidOut, setLaidOut] = useState(false);
  const [nativeHidden, setNativeHidden] = useState(false);
  const [reduced, setReduced] = useState(null);
  const [introDone, setIntroDone] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [departing, setDeparting] = useState(false);
  const callbacks = useRef({ onDone, navigation });
  callbacks.current = { onDone, navigation };
  const values = useRef(null);
  if (!values.current) values.current = Object.fromEntries(
    ['top', 'lower', 'words', 'wordExit', 'launch', 'fade'].map(key => [key, new Animated.Value(0)]),
  );
  const v = values.current;
  const exit = useRef(null);
  const startedExit = useRef(false);
  const background = isDark ? '#000000' : '#EEF0F2';
  const ink = isDark ? '#F5F5F5' : '#17191C';
  const muted = isDark ? '#B3B8BF' : '#555C64';
  const small = dimensions.height < 550;
  const markWidth = small ? 180 : 218;
  const scale = markWidth / 188;
  const titleSize = Math.min(34, Math.max(28, dimensions.width * .08));
  const distance = Math.max(dimensions.height, dimensions.width) * .85;

  useEffect(() => {
    let active = true;
    const apply = value => { if (active) { setReduced(value); onMotionPreference?.(value); } };
    AccessibilityInfo.isReduceMotionEnabled().then(apply).catch(() => apply(true));
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!laidOut || !resourcesReady || reduced === null) return;
    let active = true;
    NativeSplashScreen.hideAsync().catch(() => {}).finally(() => { if (active) setNativeHidden(true); });
    return () => { active = false; };
  }, [laidOut, resourcesReady, reduced]);

  useEffect(() => {
    if (!nativeHidden) return;
    const ease = Easing.bezier(.16, 1, .3, 1);
    const timing = (value, duration, delay = 0) => Animated.timing(value, { toValue: 1, duration, delay, easing: ease, useNativeDriver: true, isInteraction: false });
    if (reduced) { v.top.setValue(1); v.lower.setValue(1); v.words.setValue(1); }
    const animation = reduced ? Animated.delay(350) : Animated.parallel([
      timing(v.top, 520), timing(v.lower, 520, 90), timing(v.words, 420, 300), Animated.delay(1100),
    ]);
    animation.start(({ finished }) => { if (finished) setIntroDone(true); });
    const timer = setTimeout(() => setWaiting(true), 2500);
    return () => { clearTimeout(timer); animation.stop(); };
  }, [nativeHidden, reduced, v]);

  useEffect(() => {
    if (!introDone || !ready || startedExit.current) return;
    startedExit.current = true;
    setDeparting(true);
    const timing = (value, duration, delay = 0, easing = Easing.linear) => Animated.timing(value, { toValue: 1, duration, delay, easing, useNativeDriver: true, isInteraction: false });
    const reveal = reduced ? 0 : 450;
    const duration = reduced ? 250 : 400;
    // Match the preview's whole-animation easing and its second keyframe easing.
    const overall = Easing.bezier(.42, 0, .58, 1);
    const accelerate = Easing.bezier(.65, 0, .9, .4);
    const departureEase = time => {
      const position = overall(time);
      return position <= .27 ? position : .27 + .73 * accelerate((position - .27) / .73);
    };
    exit.current = Animated.parallel([
      ...(reduced ? [] : [
        timing(v.launch, 570, 0, departureEase),
        timing(v.wordExit, 230, 120),
      ]),
      timing(v.fade, duration, reveal, Easing.bezier(0, 0, .58, 1)),
      ...(contentProgress ? [timing(contentProgress, duration, reveal, Easing.bezier(.16, 1, .3, 1))] : []),
    ]);
    exit.current.start(({ finished }) => {
      if (!finished) return;
      const callback = callbacks.current;
      if (callback.onDone) callback.onDone();
      else callback.navigation?.replace('Login');
    });
  }, [introDone, ready, reduced, contentProgress, v]);
  useEffect(() => () => exit.current?.stop(), []);

  const wingStyle = (value, x, y) => ({ opacity: value, transform: [
    { translateX: value.interpolate({ inputRange: [0, 1], outputRange: [x * scale, 0] }) },
    { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [y * scale, 0] }) },
  ] });
  return <Animated.View testID="startup-splash" onLayout={() => setLaidOut(true)}
    style={[s.root, { backgroundColor: background, opacity: v.fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
    <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={background} />
    <SafeAreaView style={s.safe}>
      <View accessible accessibilityRole="image" accessibilityLabel="Swift Wakala by Silverstone" style={[s.lockup, { transform: [{ translateY: small ? -8 : -22 }] }]}>
        <Animated.View style={{ height: small ? 115 : 154, alignItems: 'center', justifyContent: 'center', transform: [
          { translateX: v.launch.interpolate({ inputRange: [0, .27, 1], outputRange: [0, -9, distance] }) },
          { translateY: v.launch.interpolate({ inputRange: [0, .27, 1], outputRange: [0, 12, -distance * 1.2] }) },
          { scale: v.launch.interpolate({ inputRange: [0, .27, 1], outputRange: [1, .95, 1.12] }) },
        ] }}>
          <View style={{ width: markWidth, height: small ? 142 : 172 }}>
            {[v.top, v.lower].map((value, index) => <Animated.View key={index} style={[StyleSheet.absoluteFillObject, wingStyle(value, index ? -40 : 32, index ? 32 : -27)]}>
              <Svg width="100%" height="100%" viewBox="-44 -34 188 148" accessible={false}><Path fill={ink} d={SWIFT_WINGS[index]} /></Svg>
            </Animated.View>)}
          </View>
        </Animated.View>
        <Animated.View style={{ opacity: Animated.multiply(v.words, v.wordExit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })), transform: [{ translateY: v.words.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
          <Text style={[s.title, { color: ink, fontSize: titleSize, lineHeight: titleSize * 1.25 }]}>Swift Wakala</Text>
          <Text style={[s.owner, { color: muted }]}>by Silverstone</Text>
        </Animated.View>
      </View>
      {waiting && !departing ? <Text accessibilityLiveRegion="polite" style={[s.waiting, { color: muted }]}>{lang === 'sw' ? 'Inaandaa akaunti yako…' : 'Getting your account ready…'}</Text> : null}
    </SafeAreaView>
  </Animated.View>;
}
const s = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' }, safe: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lockup: { width: '100%', paddingHorizontal: 20 },
  title: { fontFamily: fonts.bodySemi, letterSpacing: -1.3, textAlign: 'center', marginTop: 2, marginBottom: 10 },
  owner: { fontFamily: fonts.body, fontSize: 12, lineHeight: 20, letterSpacing: 2, textAlign: 'center' },
  waiting: { position: 'absolute', bottom: 48, left: 24, right: 24, textAlign: 'center', fontFamily: fonts.body, fontSize: 12, lineHeight: 20 },
});
