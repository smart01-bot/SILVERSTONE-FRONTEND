import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth }  from '../../context/AuthContext';
import { useHaptics } from '../../hooks/useHaptics';
import { useLoader } from '../../context/LoaderContext';

const TARGET_PCT   = 0;
const ANIMATE_FROM = 0;
const RING_SIZE    = 168;
const RING_BORDER  = 10;

const STEPS = [
  { label: 'Account saved', sub: 'Application not submitted',             done: true,  active: false },
  { label: 'Identity check',        sub: 'Not completed',        done: false,  active: false },
  { label: 'Main-agent review',     sub: 'Not started',          done: false, active: true  },
  { label: 'Account activated',     sub: 'After approval', done: false, active: false },
];

// ── Orbiting dot ─────────────────────────────────────────────────────────────
function OrbitDot({ phase, color, size, speed }) {
  const rotAnim = useRef(new Animated.Value(phase)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotAnim, {
        toValue: phase + 360,
        duration: speed,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const rotate = rotAnim.interpolate({
    inputRange:  [phase, phase + 360],
    outputRange: [`${phase}deg`, `${phase + 360}deg`],
  });

  return (
    <Animated.View
      style={[
        orbitStyles.container,
        { width: RING_SIZE + 36, height: RING_SIZE + 36, transform: [{ rotate }] },
      ]}
    >
      <View style={[orbitStyles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]} />
    </Animated.View>
  );
}

const orbitStyles = StyleSheet.create({
  container: { position: 'absolute', alignItems: 'center', justifyContent: 'flex-start' },
  dot: { marginTop: -4 },
});

export default function PendingScreen({ navigation }) {
  const { theme } = useTheme();
  const { logout, profile, refreshProfile } = useAuth();
  const { hideLoader } = useLoader();
  const [refreshError, setRefreshError] = useState('');
  useEffect(() => { hideLoader(); }, []);
  const insets  = useSafeAreaInsets();
  const haptics = useHaptics();

  const [pctDisplay, setPctDisplay] = useState(ANIMATE_FROM);

  const ringAnim    = useRef(new Animated.Value(ANIMATE_FROM)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const glowAnim    = useRef(new Animated.Value(0)).current;

  // stepsAnim drives translate only (native driver) — opacity handled separately
  const stepsTranslate = useRef(STEPS.map(() => new Animated.Value(0))).current;
  const stepsOpacity   = useRef(STEPS.map(() => new Animated.Value(0))).current;

  const phone = profile?.phone ?? '+255 ••• ••• •••';
  const maskedPhone = phone.replace(/(\+255\s?\d{3})\s?\d{3}\s?(\d{3})/, '$1 ••• $2');

  // JS driver — width, opacity
  useEffect(() => {
    Animated.timing(ringAnim, {
      toValue: TARGET_PCT, duration: 1800, delay: 400, useNativeDriver: false,
    }).start();

    ringAnim.addListener(({ value }) => setPctDisplay(Math.round(value)));

    Animated.timing(contentAnim, { toValue: 1, duration: 600, useNativeDriver: false }).start();

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 1200, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.2, duration: 1200, useNativeDriver: false }),
      ])
    );
    glowLoop.start();

    // Steps opacity — JS driver (separate from translate)
    Animated.stagger(120,
      stepsOpacity.map(a =>
        Animated.timing(a, { toValue: 1, duration: 300, useNativeDriver: false })
      )
    ).start();

    return () => { ringAnim.removeAllListeners(); glowLoop.stop(); };
  }, []);

  // Steps translate — native driver (separate from opacity)
  useEffect(() => {
    Animated.stagger(120,
      stepsTranslate.map(a =>
        Animated.spring(a, { toValue: 1, tension: 60, friction: 9, useNativeDriver: true })
      )
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.55] });
  // glowScale also from glowAnim (JS driver) — fine since it's the same value/driver
  const glowScale   = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.12] });

  const s = styles(theme, insets);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <View style={s.bgTop} />

      <Animated.View style={[s.content, { opacity: contentAnim }]}>

        <View style={[s.ringWrap, { paddingTop: insets.top + 32 }]}>

          {/* Glow halo — opacity AND scale both from glowAnim (JS driver only, safe) */}
          <Animated.View style={[s.glowHalo, {
            opacity:   glowOpacity,
            transform: [{ scale: glowScale }],
          }]} />

          <View style={s.orbitWrap}>
            <OrbitDot phase={0}   color={theme.primary}       size={10} speed={5000} />
            <OrbitDot phase={120} color="rgba(200,16,46,0.5)" size={7}  speed={7000} />
            <OrbitDot phase={240} color="rgba(200,16,46,0.3)" size={5}  speed={9000} />
          </View>

          <View style={s.ringOuter}>
            <View style={s.ringTrack} />
            <View style={s.ringProgressWrap}>
              <View style={[s.ringHalf, s.ringHalfLeft]}>
                <Animated.View style={[s.ringFill, {
                  transform: [{
                    rotate: ringAnim.interpolate({
                      inputRange:  [0, 50, 100],
                      outputRange: ['-180deg', '0deg', '0deg'],
                    }),
                  }],
                  backgroundColor: theme.gradPrimA,
                }]} />
              </View>
              <View style={[s.ringHalf, s.ringHalfRight]}>
                <Animated.View style={[s.ringFill, {
                  transform: [{
                    rotate: ringAnim.interpolate({
                      inputRange:  [0, 50, 100],
                      outputRange: ['-180deg', '-180deg', '0deg'],
                    }),
                  }],
                  backgroundColor: theme.gradPrimA,
                }]} />
              </View>
            </View>
            <View style={s.ringCenter}>
              <Text style={s.ringPct}>—</Text>
              <Text style={s.ringLabel}>PENDING</Text>
            </View>
          </View>
        </View>

        <View style={s.textBlock}>
          <Text style={s.headline}>{profile?.accountStatus === 'suspended' ? 'Account suspended.' : 'Account awaiting approval.'}</Text>
          <Text style={s.subtext}>
            Operational access is restricted. Application submission and review will be available in a later update.
          </Text>
        </View>

        <View style={s.stepsList}>
          {STEPS.map((step, i) => (
            // Outer: opacity only — JS driver
            <Animated.View key={i} style={[s.stepRow, { opacity: stepsOpacity[i] }]}>
              {/* Inner: transform only — native driver */}
              <Animated.View style={[s.stepInner, {
                transform: [{
                  translateX: stepsTranslate[i].interpolate({ inputRange: [0,1], outputRange: [-20, 0] }),
                }],
              }]}>
                <View style={[s.stepIcon, step.done && s.stepIconDone, step.active && s.stepIconActive]}>
                  {step.done
                    ? <Text style={s.stepIconText}>✓</Text>
                    : step.active ? <View style={s.stepActiveDot} />
                    : <View style={s.stepEmptyDot} />}
                </View>
                {i < STEPS.length - 1 && (
                  <View style={[s.connector, step.done && s.connectorDone]} />
                )}
                <View style={s.stepText}>
                  <Text style={[s.stepLabel, !step.done && !step.active && s.stepLabelDim]}>{step.label}</Text>
                  <Text style={[s.stepSub, step.active && s.stepSubActive]}>{step.sub}</Text>
                </View>
              </Animated.View>
            </Animated.View>
          ))}
        </View>

        <View style={[s.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={s.footerText}>Registered phone</Text>
          <Text style={s.footerPhone}>{maskedPhone}</Text>

          <TouchableOpacity
            style={s.demoBtn}
            onPress={() => { setRefreshError(''); refreshProfile().catch(e => setRefreshError(e.message)); }}
          >
            <Text style={s.demoBtnText}>Refresh account status →</Text>
          </TouchableOpacity>

          {refreshError ? <Text style={s.footerText}>{refreshError}</Text> : null}
          <TouchableOpacity
            style={s.signOutBtn}
            onPress={() => { haptics.light(); logout(); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={s.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = (theme, insets) => StyleSheet.create({
  root:   { flex: 1, backgroundColor: theme.bg },
  bgTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: '45%', backgroundColor: theme.surfaceAlt,
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },

  ringWrap:    { alignItems: 'center', justifyContent: 'center', marginBottom: 28, paddingHorizontal: 40 },
  glowHalo: {
    position: 'absolute',
    width: RING_SIZE + 48, height: RING_SIZE + 48,
    borderRadius: (RING_SIZE + 48) / 2,
    backgroundColor: theme.primary, zIndex: 0,
  },
  orbitWrap: {
    position: 'absolute',
    width: RING_SIZE + 36, height: RING_SIZE + 36,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  ringOuter: {
    width: RING_SIZE, height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  ringTrack: {
    position: 'absolute',
    width: RING_SIZE, height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_BORDER, borderColor: theme.border,
  },
  ringProgressWrap: {
    position: 'absolute',
    width: RING_SIZE, height: RING_SIZE,
    borderRadius: RING_SIZE / 2, overflow: 'hidden',
  },
  ringHalf:      { position: 'absolute', width: RING_SIZE / 2, height: RING_SIZE, overflow: 'hidden' },
  ringHalfLeft:  { left: 0 },
  ringHalfRight: { right: 0 },
  ringFill: {
    position: 'absolute',
    width: RING_SIZE, height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_BORDER, borderColor: 'transparent',
  },
  ringCenter: { alignItems: 'center', zIndex: 2 },
  ringPct:    { fontSize: 34, fontFamily: 'Manrope_800ExtraBold', color: theme.text, lineHeight: 40 },
  ringLabel:  { fontSize: 10, fontFamily: 'Inter_700Bold', color: theme.primary, letterSpacing: 2, marginTop: 2 },

  textBlock: { paddingHorizontal: 32, alignItems: 'center', marginBottom: 32 },
  headline:  { fontSize: 24, fontFamily: 'Manrope_800ExtraBold', color: theme.text, textAlign: 'center', marginBottom: 10 },
  subtext:   { fontSize: 14, fontFamily: 'Inter_400Regular', color: theme.textDim, textAlign: 'center', lineHeight: 22 },

  stepsList: { width: '100%', paddingHorizontal: 28 },
  stepRow:   { paddingVertical: 4, minHeight: 52 },
  stepInner: { flexDirection: 'row', alignItems: 'flex-start', position: 'relative' },
  stepIcon: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: theme.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.surface, marginRight: 14, marginTop: 2, zIndex: 2,
  },
  stepIconDone:   { borderColor: '#22C55E', backgroundColor: '#22C55E' },
  stepIconActive: { borderColor: '#F59E0B', backgroundColor: '#FEF3C7' },
  stepIconText:   { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
  stepActiveDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: '#F59E0B' },
  stepEmptyDot:   { width: 8,  height: 8,  borderRadius: 4, backgroundColor: theme.border },
  connector:      { position: 'absolute', left: 13, top: 32, width: 2, height: 24, backgroundColor: theme.border, zIndex: 1 },
  connectorDone:  { backgroundColor: '#22C55E' },
  stepText:       { flex: 1 },
  stepLabel:      { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: theme.text, lineHeight: 20 },
  stepLabelDim:   { color: theme.muted },
  stepSub:        { fontSize: 12, fontFamily: 'Inter_400Regular', color: theme.textDim, marginTop: 1 },
  stepSubActive:  { color: '#F59E0B', fontFamily: 'Inter_600SemiBold' },

  footer:      { alignItems: 'center', paddingTop: 24, paddingHorizontal: 24, width: '100%', gap: 4 },
  footerText:  { fontSize: 12, fontFamily: 'Inter_400Regular', color: theme.muted },
  footerPhone: { fontSize: 14, fontFamily: 'RobotoMono_400Regular', color: theme.text },
  demoBtn: {
    marginTop: 20, paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 10, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed',
  },
  demoBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: theme.muted },
  signOutBtn:  { marginTop: 16 },
  signOutText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: theme.textDim, textDecorationLine: 'underline' },
});