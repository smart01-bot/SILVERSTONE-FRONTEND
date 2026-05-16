import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';

const TOTAL_STEPS = 6;
const STEP = 5;
const { width: W } = Dimensions.get('window');
const OVAL_W = W * 0.62;
const OVAL_H = OVAL_W * 1.28;

export default function Step5Selfie({ navigation, route }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const [phase, setPhase] = useState('idle'); // idle | scanning | done
  const [scanPct, setScanPct] = useState(0);

  const progressAnim  = useRef(new Animated.Value((STEP - 1) / TOTAL_STEPS)).current;
  const scanProgress  = useRef(new Animated.Value(0)).current;
  const frameGlow     = useRef(new Animated.Value(0)).current;
  const checkAnim     = useRef(new Animated.Value(0)).current;
  const scanLineAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim     = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: STEP / TOTAL_STEPS,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, []);

  // Scan line loop
  useEffect(() => {
    if (phase === 'scanning') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(scanLineAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [phase]);

  // Pulse when idle
  useEffect(() => {
    if (phase === 'idle') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [phase]);

  const startScan = () => {
    haptics.medium();
    setPhase('scanning');
    scanProgress.setValue(0);
    setScanPct(0);

    // Drive the % display via listener (not __getValue)
    const listenerId = scanProgress.addListener(({ value }) => {
      setScanPct(Math.round(value * 100));
    });

    Animated.timing(scanProgress, {
      toValue: 1,
      duration: 3200,
      useNativeDriver: false,
    }).start(() => {
      scanProgress.removeListener(listenerId);
      haptics.success();
      setPhase('done');

      // Frame turns green
      Animated.timing(frameGlow, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();

      // Checkmark spring
      Animated.spring(checkAnim, {
        toValue: 1,
        tension: 80,
        friction: 7,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleNext = () => {
    haptics.medium();
    setTimeout(() => haptics.success(), 120);
    navigation.navigate('Step6Review', {
      ...route.params,
      selfieVerified: true,
    });
  };

  const headerProgress = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, OVAL_H],
  });

  const frameColor = frameGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.6)', 'rgba(34,197,94,1)'],
  });

  const checkScale = checkAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 1.2, 1],
  });

  const s = styles(theme, insets);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full screen gradient bg */}
      <LinearGradient
        colors={['#0A0A12', '#1A0508', '#0A0A12']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={s.navRow}>
          <TouchableOpacity
            onPress={() => { haptics.light(); navigation.goBack(); }}
            style={s.backBtn}
          >
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={s.progressTrack}>
            <Animated.View style={[s.progressFill, { width: headerProgress }]} />
          </View>
          <Text style={s.stepCounter}>{STEP}/{TOTAL_STEPS}</Text>
        </View>

        <Text style={s.eyebrow}>SIGN UP · SUB-AGENT</Text>
        <Text style={s.title}>Identity Scan</Text>
        <Text style={s.subtitle}>
          {phase === 'done'
            ? 'Face matched successfully.'
            : 'Look directly at the camera in a well-lit area.'}
        </Text>
      </View>

      {/* Oval frame */}
      <View style={s.ovalWrap}>
        <Animated.View style={[s.oval, {
          transform: phase === 'idle' ? [{ scale: pulseAnim }] : [],
        }]}>
          {/* Dashed border ring */}
          <Animated.View style={[s.ovalBorder, { borderColor: frameColor }]} />

          {/* Corner brackets */}
          {[
            { top: -4, left: -4 },
            { top: -4, right: -4 },
            { bottom: -4, left: -4 },
            { bottom: -4, right: -4 },
          ].map((pos, i) => (
            <View key={i} style={[s.bracket, pos, {
              borderTopWidth: pos.top !== undefined ? 3 : 0,
              borderBottomWidth: pos.bottom !== undefined ? 3 : 0,
              borderLeftWidth: pos.left !== undefined ? 3 : 0,
              borderRightWidth: pos.right !== undefined ? 3 : 0,
              borderColor: phase === 'done' ? '#22C55E' : '#fff',
            }]} />
          ))}

          {/* Silhouette hint */}
          {phase === 'idle' && (
            <Text style={s.silhouette}>👤</Text>
          )}

          {/* Scan line */}
          {phase === 'scanning' && (
            <Animated.View style={[s.scanLine, {
              transform: [{ translateY: scanLineY }],
            }]}>
              <LinearGradient
                colors={['transparent', 'rgba(224,21,53,0.6)', 'transparent']}
                style={s.scanLineGrad}
              />
            </Animated.View>
          )}

          {/* Done checkmark */}
          {phase === 'done' && (
            <Animated.View style={[s.checkWrap, {
              transform: [{ scale: checkScale }],
            }]}>
              <View style={s.checkCircle}>
                <Text style={s.checkIcon}>✓</Text>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </View>

      {/* Helper chips */}
      <View style={s.chips}>
        {['Eyes open', 'No hat', 'Good light'].map((c) => (
          <View key={c} style={s.chip}>
            <Text style={s.chipText}>{c}</Text>
          </View>
        ))}
      </View>

      {/* Progress bar */}
      {phase === 'scanning' && (
        <View style={s.progressWrap}>
          <View style={s.progressBg}>
            <Animated.View style={[s.progressScan, {
              width: scanProgress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }]} />
          </View>
          <Text style={s.progressPct}>
            <Text style={s.progressNum}>{scanPct}</Text>%
          </Text>
        </View>
      )}

      {/* Done badge */}
      {phase === 'done' && (
        <View style={s.doneBadge}>
          <View style={s.doneDot} />
          <Text style={s.doneText}>Face matched · 97% confidence</Text>
        </View>
      )}

      {/* Bottom */}
      <View style={[s.bottom, { paddingBottom: insets.bottom + 16 }]}>
        {phase === 'idle' && (
          <TouchableOpacity onPress={startScan} activeOpacity={0.85}>
            <LinearGradient
              colors={[theme.gradPrimA, theme.gradPrimB]}
              style={s.cta}
            >
              <Text style={s.ctaText}>Start Face Scan</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {phase === 'scanning' && (
          <View style={[s.cta, s.ctaScanning]}>
            <Text style={s.ctaText}>Scanning…</Text>
          </View>
        )}

        {phase === 'done' && (
          <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
            <LinearGradient
              colors={['#16A34A', '#15803D']}
              style={s.cta}
            >
              <Text style={s.ctaText}>Continue  →</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <Text style={s.note}>🔒 Your biometric data is never stored or shared</Text>
      </View>
    </View>
  );
}

const styles = (theme, insets) => StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A12' },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    zIndex: 2,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: { marginRight: 12, padding: 4 },
  backArrow: { fontSize: 22, color: '#fff' },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  stepCounter: {
    marginLeft: 12,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontFamily: 'Manrope_800ExtraBold',
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },

  ovalWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oval: {
    width: OVAL_W,
    height: OVAL_H,
    borderRadius: OVAL_W / 2,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  ovalBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: OVAL_W / 2,
    borderWidth: 2,
    borderStyle: 'dashed',
  },

  bracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#fff',
  },

  silhouette: {
    fontSize: OVAL_W * 0.45,
    opacity: 0.15,
  },

  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    top: 0,
  },
  scanLineGrad: {
    flex: 1,
    height: 3,
  },

  checkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  checkIcon: { color: '#fff', fontSize: 36, fontFamily: 'Inter_700Bold' },

  chips: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.7)',
  },

  progressWrap: {
    paddingHorizontal: 32,
    marginBottom: 16,
    alignItems: 'center',
    gap: 8,
  },
  progressBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressScan: {
    height: '100%',
    backgroundColor: '#E01535',
    borderRadius: 2,
  },
  progressPct: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: 'RobotoMono_400Regular',
  },
  progressNum: {
    color: '#fff',
  },

  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  doneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  doneText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#22C55E',
  },

  bottom: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  cta: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E01535',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaScanning: {
    backgroundColor: '#333',
    shadowOpacity: 0,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  note: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.35)',
  },
});
