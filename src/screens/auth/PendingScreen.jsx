import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { getAuth } from 'firebase/auth';

const TARGET_PCT = 60; // %
const ANIMATE_FROM = 25;

const STEPS = [
  { label: 'Application submitted', sub: 'Just now',         done: true,  active: false },
  { label: 'Identity check',        sub: 'Done',             done: true,  active: false },
  { label: 'Main-agent review',     sub: 'In progress',      done: false, active: true  },
  { label: 'Account activated',     sub: 'Usually within 4 hrs', done: false, active: false },
];


export default function PendingScreen({ navigation }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const [pctDisplay, setPctDisplay] = useState(ANIMATE_FROM);

  // Animated values
  const ringAnim    = useRef(new Animated.Value(ANIMATE_FROM)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const stepsAnim   = useRef(STEPS.map(() => new Animated.Value(0))).current;

  const auth = getAuth();
  const user = auth.currentUser;
  const phone = user?.phoneNumber ?? '+255 ••• ••• •••';
  // Mask phone: show +255 XXX ••• XXX
  const maskedPhone = phone.replace(/(\+255\s?\d{3})\s?\d{3}\s?(\d{3})/, '$1 ••• $2');

  useEffect(() => {
    // Animate ring
    Animated.timing(ringAnim, {
      toValue: TARGET_PCT,
      duration: 1800,
      delay: 400,
      useNativeDriver: false,
    }).start();

    // Track display number
    ringAnim.addListener(({ value }) => {
      setPctDisplay(Math.round(value));
    });

    // Content fade-in
    Animated.timing(contentAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Stagger steps
    Animated.stagger(120,
      stepsAnim.map(a =>
        Animated.spring(a, {
          toValue: 1,
          tension: 60,
          friction: 9,
          useNativeDriver: true,
        })
      )
    ).start();

    return () => ringAnim.removeAllListeners();
  }, []);

  const strokeDashoffset = ringAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRCUMFERENCE, CIRCUMFERENCE - (CIRCUMFERENCE * TARGET_PCT / 100)],
  });

  // Since Animated SVG Circle is complex, we use a JS ticker approach
  // We'll render a manual arc using border/clip approach
  const s = styles(theme, insets);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Background */}
      <View style={s.bgTop} />

      <Animated.View style={[s.content, { opacity: contentAnim }]}>

        {/* Ring */}
        <View style={[s.ringWrap, { paddingTop: insets.top + 32 }]}>
          <View style={s.ringOuter}>
            {/* Track ring */}
            <View style={s.ringTrack} />

            {/* Progress arc — we approximate with a rotating clip */}
            <View style={s.ringProgressWrap}>
              <View style={[s.ringHalf, s.ringHalfLeft]}>
                <Animated.View style={[s.ringFill, {
                  transform: [{
                    rotate: ringAnim.interpolate({
                      inputRange: [0, 50, 100],
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
                      inputRange: [0, 50, 100],
                      outputRange: ['-180deg', '-180deg', '0deg'],
                    }),
                  }],
                  backgroundColor: theme.gradPrimA,
                }]} />
              </View>
            </View>

            {/* Center content */}
            <View style={s.ringCenter}>
              <Text style={s.ringPct}>{pctDisplay}%</Text>
              <Text style={s.ringLabel}>VERIFIED</Text>
            </View>
          </View>
        </View>

        {/* Main text */}
        <View style={s.textBlock}>
          <Text style={s.headline}>You're under review.</Text>
          <Text style={s.subtext}>
            You can close the app — we'll send you an SMS the moment you're cleared to log in.
          </Text>
        </View>

        {/* Steps list */}
        <View style={s.stepsList}>
          {STEPS.map((step, i) => (
            <Animated.View
              key={i}
              style={[s.stepRow, {
                opacity: stepsAnim[i],
                transform: [{
                  translateX: stepsAnim[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                }],
              }]}
            >
              {/* Icon */}
              <View style={[
                s.stepIcon,
                step.done   && s.stepIconDone,
                step.active && s.stepIconActive,
              ]}>
                {step.done ? (
                  <Text style={s.stepIconText}>✓</Text>
                ) : step.active ? (
                  <View style={s.stepActiveDot} />
                ) : (
                  <View style={s.stepEmptyDot} />
                )}
              </View>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <View style={[s.connector, step.done && s.connectorDone]} />
              )}

              {/* Text */}
              <View style={s.stepText}>
                <Text style={[
                  s.stepLabel,
                  !step.done && !step.active && s.stepLabelDim,
                ]}>
                  {step.label}
                </Text>
                <Text style={[
                  s.stepSub,
                  step.active && s.stepSubActive,
                ]}>
                  {step.sub}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Footer */}
        <View style={[s.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={s.footerText}>SMS will be sent to</Text>
          <Text style={s.footerPhone}>{maskedPhone}</Text>

          {/* Demo CTA — remove in production */}
          <TouchableOpacity
            style={s.demoBtn}
            onPress={() => {
              haptics.light();
              navigation.reset({ index: 0, routes: [{ name: 'PinSetup' }] });
            }}
          >
            <Text style={s.demoBtnText}>Simulate approval (demo) →</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const RING_SIZE = 168;
const RING_BORDER = 10;

const styles = (theme, insets) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },

  bgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: theme.surfaceAlt,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  ringWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  ringOuter: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTrack: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_BORDER,
    borderColor: theme.border,
  },
  ringProgressWrap: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    overflow: 'hidden',
  },
  ringHalf: {
    position: 'absolute',
    width: RING_SIZE / 2,
    height: RING_SIZE,
    overflow: 'hidden',
  },
  ringHalfLeft: { left: 0 },
  ringHalfRight: { right: 0 },
  ringFill: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_BORDER,
    borderColor: 'transparent',
  },
  ringCenter: {
    alignItems: 'center',
    zIndex: 2,
  },
  ringPct: {
    fontSize: 34,
    fontFamily: 'Manrope_800ExtraBold',
    color: theme.text,
    lineHeight: 40,
  },
  ringLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: theme.primary,
    letterSpacing: 2,
    marginTop: 2,
  },

  textBlock: {
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 32,
  },
  headline: {
    fontSize: 24,
    fontFamily: 'Manrope_800ExtraBold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: theme.textDim,
    textAlign: 'center',
    lineHeight: 22,
  },

  stepsList: {
    width: '100%',
    paddingHorizontal: 28,
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
    minHeight: 52,
    position: 'relative',
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    marginRight: 14,
    marginTop: 2,
    zIndex: 2,
  },
  stepIconDone: {
    borderColor: '#22C55E',
    backgroundColor: '#22C55E',
  },
  stepIconActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  stepIconText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  stepActiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
  },
  stepEmptyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.border,
  },
  connector: {
    position: 'absolute',
    left: 13,
    top: 32,
    width: 2,
    height: 24,
    backgroundColor: theme.border,
    zIndex: 1,
  },
  connectorDone: {
    backgroundColor: '#22C55E',
  },

  stepText: { flex: 1 },
  stepLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: theme.text,
    lineHeight: 20,
  },
  stepLabelDim: { color: theme.muted },
  stepSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: theme.textDim,
    marginTop: 1,
  },
  stepSubActive: {
    color: '#F59E0B',
    fontFamily: 'Inter_600SemiBold',
  },

  footer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    width: '100%',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: theme.muted,
  },
  footerPhone: {
    fontSize: 14,
    fontFamily: 'RobotoMono_400Regular',
    color: theme.text,
  },

  demoBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
  },
  demoBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: theme.muted,
  },
});
