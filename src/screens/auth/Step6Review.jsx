import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { db } from '../../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const TOTAL_STEPS = 6;
const STEP = 6;

const NETWORKS = {
  Voda:    { label: 'M-Pesa',   color: '#00A651' },
  Airtel:  { label: 'Airtel',   color: '#E20020' },
  Yas:     { label: 'Yas Mixx', color: '#0057A8' },
  Halotel: { label: 'Halotel',  color: '#F68B1F' },
};

const PARTICLE_COLORS = ['#E01535','#C8102E','#FF6B6B','#FF9F43','#FECA57','#48DBFB','#fff'];
const PARTICLE_COUNT  = 18;

function maskNida(nida = '') {
  if (nida.length < 4) return nida;
  return '•'.repeat(nida.length - 4) + nida.slice(-4);
}

function fmtFloat(n) {
  if (!n) return '—';
  if (n >= 1_000_000) return `TSh ${(n / 1_000_000).toFixed(1)}M/day`;
  return `TSh ${(n / 1000).toFixed(0)}K/day`;
}

// ── Particle system ──────────────────────────────────────────────────────────
function Particles({ trigger }) {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      op: new Animated.Value(0),
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      size: 6 + Math.random() * 6,
      angle: (360 / PARTICLE_COUNT) * i + (Math.random() * 20 - 10),
      dist: 80 + Math.random() * 80,
    }))
  ).current;

  useEffect(() => {
    if (!trigger) return;
    particles.forEach(p => {
      p.x.setValue(0); p.y.setValue(0); p.op.setValue(0);
    });
    const rad  = (deg) => deg * (Math.PI / 180);
    // Split by driver — NEVER mix in Animated.parallel (design system rule)
    const translateAnims = particles.map(p => {
      const tx = Math.cos(rad(p.angle)) * p.dist;
      const ty = Math.sin(rad(p.angle)) * p.dist - 40;
      return Animated.parallel([
        Animated.spring(p.x, { toValue: tx, tension: 80, friction: 6, useNativeDriver: true }),
        Animated.spring(p.y, { toValue: ty, tension: 80, friction: 6, useNativeDriver: true }),
      ]);
    });

    const opacityAnims = particles.map(p =>
      Animated.sequence([
        Animated.timing(p.op, { toValue: 1, duration: 100, useNativeDriver: false }),
        Animated.delay(500),
        Animated.timing(p.op, { toValue: 0, duration: 400, useNativeDriver: false }),
      ])
    );

    // Fire both groups independently — matching stagger keeps visual sync
    Animated.stagger(18, translateAnims).start();
    Animated.stagger(18, opacityAnims).start();
  }, [trigger]);

  if (!trigger) return null;

  return (
    <View style={particleStyles.wrap} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[particleStyles.dot, {
            width: p.size, height: p.size, borderRadius: p.size / 2,
            backgroundColor: p.color,
            opacity: p.op,
            transform: [{ translateX: p.x }, { translateY: p.y }],
          }]}
        />
      ))}
    </View>
  );
}
const particleStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 27, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  dot: { position: 'absolute' },
});
// ─────────────────────────────────────────────────────────────────────────────

function FieldRow({ label, value, mono }) {
  const { theme } = useTheme();
  const s = fieldStyles(theme);
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={[s.value, mono && s.mono]}>{value}</Text>
    </View>
  );
}
const fieldStyles = (theme) => StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border, gap: 12,
  },
  label: { fontSize: 13, fontFamily: 'Inter_400Regular', color: theme.textDim, flex: 0.45 },
  value: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: theme.text, flex: 0.55, textAlign: 'right' },
  mono:  { fontFamily: 'RobotoMono_400Regular', fontSize: 12 },
});

export default function Step6Review({ navigation, route }) {
  const { theme } = useTheme();
  const insets    = useSafeAreaInsets();
  const haptics   = useHaptics();

  const [agreed, setAgreed]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [burst, setBurst]     = useState(false);

  // Guard: AppNavigator tears down this component the moment Firebase auth
  // state fires (profile.status === 'pending' → PendingScreen). Without this,
  // the async handleSubmit continues running after unmount and crashes.
  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const p = route.params ?? {};

  // ── Animations ────────────────────────────────────────────────────────────
  const progressAnim  = useRef(new Animated.Value((STEP - 1) / TOTAL_STEPS)).current;
  const heroAnim      = useRef(new Animated.Value(0)).current;
  const card1Anim     = useRef(new Animated.Value(0)).current;
  const card2Anim     = useRef(new Animated.Value(0)).current;
  const termsAnim     = useRef(new Animated.Value(0)).current;
  const checkAnim     = useRef(new Animated.Value(0)).current;

  // useNativeDriver: false — width
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1, duration: 600, useNativeDriver: false,
    }).start();
  }, []);

  // useNativeDriver: true — translate / scale
  useEffect(() => {
    Animated.stagger(100, [
      Animated.spring(heroAnim,  { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }),
      Animated.spring(card1Anim, { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }),
      Animated.spring(card2Anim, { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }),
      Animated.spring(termsAnim, { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  const toggleAgree = () => {
    haptics.selection();
    const next = !agreed;
    setAgreed(next);
    // useNativeDriver: true — scale
    Animated.spring(checkAnim, {
      toValue: next ? 1 : 0, tension: 80, friction: 7, useNativeDriver: true,
    }).start();
  };

  const handleSubmit = async () => {
    if (!agreed) { haptics.error(); setError('Please accept the terms to continue.'); return; }
    haptics.medium();

    // Particle burst
    setBurst(false);
    setTimeout(() => setBurst(true), 10);

    setLoading(true);
    setError('');

    try {
      const auth = getAuth();

      // Step 1 — create the Firebase Auth account
      // (no account exists yet; the wizard never called createUserWithEmailAndPassword)
      if (!p.email || !p.password) throw new Error('Missing credentials');
      const cred = await createUserWithEmailAndPassword(auth, p.email, p.password);

      // After createUser, onAuthStateChanged fires immediately. AppNavigator
      // will detect the new user, read profile.status === 'pending', and tear
      // down this component. If that already happened, bail silently.
      if (!isMounted.current) return;

      const uid  = cred.user.uid;

      // Step 2 — write the agent document
      await setDoc(doc(db, 'agents', uid), {
        uid,
        name:                  p.name ?? '',
        phone:                 p.phone ?? '',
        email:                 p.email ?? '',
        nida:                  p.nida ?? '',
        businessName:          p.businessName ?? '',
        businessLocation:      p.businessLocation ?? '',
        coordinates:           p.coordinates ?? null,
        networks:              p.networks ?? [],
        floatCapacity:         p.floatCapacity ?? 0,
        businessTIN:           p.businessTIN ?? '',
        businessLicenceNumber: p.businessLicenceNumber ?? '',
        tinCertificateUrl:     p.tinCertificateUrl ?? null,
        licenceCertificateUrl: p.licenceCertificateUrl ?? null,
        selfieVerified:        p.selfieVerified ?? false,
        role:              'sub-agent',
        status:            'pending',
        pinSet:            false,
        agentPhoneNumbers: {},
        createdAt:         serverTimestamp(),
      });

      // Don't touch state or navigate — AppNavigator handles the cascade.
      // If we're still mounted for some reason, just mark success.
      if (isMounted.current) haptics.success();
    } catch (e) {
      // Component may have unmounted between the await and the catch
      if (!isMounted.current) return;

      haptics.error();
      const msg = e?.message ?? '';
      if (msg.includes('email-already-in-use')) {
        setError('An account with this email already exists. Try logging in instead.');
      } else if (msg.includes('Missing credentials')) {
        setError('Registration data is incomplete. Please go back and check your details.');
      } else {
        setError('Something went wrong. Please try again.');
      }
      setLoading(false);
    }
  };

  const headerProgress = progressAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  const reveal = (anim) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [24, 0] }) }],
  });

  const checkScale = checkAnim.interpolate({
    inputRange: [0, 0.6, 1], outputRange: [0.8, 1.15, 1],
  });

  const s = styles(theme, insets);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient colors={[theme.gradPrimA, theme.gradPrimB]} style={s.header}>
        <View style={s.navRow}>
          <TouchableOpacity onPress={() => { haptics.light(); navigation.goBack(); }} style={s.backBtn}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={s.progressTrack}>
            <Animated.View style={[s.progressFill, { width: headerProgress }]} />
          </View>
          <Text style={s.stepCounter}>{STEP}/{TOTAL_STEPS}</Text>
        </View>
        <Text style={s.eyebrow}>SIGN UP · SUB-AGENT</Text>
        <Text style={s.title}>Review & Submit</Text>
        <Text style={s.subtitle}>Check everything before submitting your application.</Text>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <Animated.View style={[s.heroCard, reveal(heroAnim)]}>
          <View style={s.heroMap}>
            <Text style={s.heroMapIcon}>📍</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.heroName}>{p.businessName || '—'}</Text>
            <Text style={s.heroArea}>{p.businessLocation || '—'}</Text>
            {p.coordinates && (
              <Text style={s.heroCoords}>{p.coordinates.lat}° · {p.coordinates.lng}°</Text>
            )}
          </View>
        </Animated.View>

        {/* Network chips */}
        {p.networks && p.networks.length > 0 && (
          <Animated.View style={[s.netChips, reveal(heroAnim)]}>
            {p.networks.map(id => {
              const n = NETWORKS[id]; if (!n) return null;
              return (
                <View key={id} style={[s.netChip, { borderColor: n.color + '80' }]}>
                  <View style={[s.netDot, { backgroundColor: n.color }]} />
                  <Text style={[s.netLabel, { color: n.color }]}>{n.label}</Text>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* Personal */}
        <Animated.View style={reveal(card1Anim)}>
          <Text style={s.sectionTitle}>Personal</Text>
          <View style={s.card}>
            <FieldRow label="Full Name" value={p.name || '—'} />
            <FieldRow label="Phone"     value={p.phone || '—'} mono />
            <FieldRow label="Email"     value={p.email || '—'} />
            <FieldRow label="NIDA"      value={maskNida(p.nida || '')} mono />
          </View>
        </Animated.View>

        {/* Business */}
        <Animated.View style={reveal(card2Anim)}>
          <Text style={s.sectionTitle}>Business</Text>
          <View style={s.card}>
            <FieldRow label="Till Name"   value={p.businessName || '—'} />
            <FieldRow label="Location"    value={p.businessLocation || '—'} />
            <FieldRow label="Float Cap."  value={fmtFloat(p.floatCapacity)} mono />
            <FieldRow label="TIN"         value={p.businessTIN || '—'} mono />
            <FieldRow label="Licence No." value={p.businessLicenceNumber || '—'} mono />
            <FieldRow label="TIN Cert."   value={p.tinCertificateUrl ? '✅ Uploaded' : '—'} />
            <FieldRow label="Lic. Cert."  value={p.licenceCertificateUrl ? '✅ Uploaded' : '—'} />
            <FieldRow label="Identity"    value={p.selfieVerified ? '✅ Verified (97%)' : '—'} />
          </View>
        </Animated.View>

        {/* Terms */}
        <Animated.View style={[reveal(termsAnim), { marginTop: 4 }]}>
          <TouchableOpacity style={s.termsRow} onPress={toggleAgree} activeOpacity={0.8}>
            <Animated.View style={[s.checkbox, agreed && s.checkboxActive, { transform: [{ scale: checkScale }] }]}>
              {agreed && <Text style={s.checkMark}>✓</Text>}
            </Animated.View>
            <Text style={s.termsText}>
              I confirm all information is accurate and agree to Silverstone's{' '}
              <Text style={s.termsLink}>Terms of Service</Text> and{' '}
              <Text style={s.termsLink}>Privacy Policy</Text>.
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {error ? <Text style={s.errText}>{error}</Text> : null}

        {/* Submit — particle burst source */}
        <View style={{ marginTop: 24 }}>
          <Particles trigger={burst} />
          <TouchableOpacity onPress={handleSubmit} disabled={!agreed || loading} activeOpacity={0.85}>
            <LinearGradient
              colors={agreed && !loading ? [theme.gradPrimA, theme.gradPrimB] : ['#555', '#444']}
              style={s.cta}
            >
              <Text style={s.ctaText}>{loading ? 'Submitting…' : 'Submit Application →'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = (theme, insets) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },

  header: {
    paddingTop: insets.top + 12, paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  navRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn:  { marginRight: 12, padding: 4 },
  backArrow:{ fontSize: 22, color: '#fff' },
  progressTrack: {
    flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  stepCounter: { marginLeft: 12, color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  eyebrow: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.4, marginBottom: 6 },
  title:   { color: '#fff', fontSize: 26, fontFamily: 'Manrope_800ExtraBold', marginBottom: 6 },
  subtitle:{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },

  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  heroCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.surfaceAlt, borderRadius: 16,
    borderWidth: 1, borderColor: theme.border,
    padding: 16, gap: 14, marginBottom: 12,
  },
  heroMap:    { width: 52, height: 52, borderRadius: 10, backgroundColor: '#EEF2F5', alignItems: 'center', justifyContent: 'center' },
  heroMapIcon:{ fontSize: 26 },
  heroName:   { fontSize: 17, fontFamily: 'Manrope_700Bold', color: theme.text },
  heroArea:   { fontSize: 13, fontFamily: 'Inter_400Regular', color: theme.textDim, marginTop: 2 },
  heroCoords: { fontSize: 11, fontFamily: 'RobotoMono_400Regular', color: theme.muted, marginTop: 3 },

  netChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  netChip:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, gap: 6, backgroundColor: theme.surfaceAlt },
  netDot:   { width: 7, height: 7, borderRadius: 4 },
  netLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  sectionTitle: { fontSize: 11, fontFamily: 'Inter_700Bold', color: theme.muted, letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },
  card: { backgroundColor: theme.surfaceAlt, borderRadius: 14, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 16, marginBottom: 20 },

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, borderColor: theme.border,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, backgroundColor: theme.surfaceAlt,
  },
  checkboxActive: { borderColor: theme.primary, backgroundColor: theme.primary },
  checkMark:      { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  termsText:      { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: theme.textDim, lineHeight: 20 },
  termsLink:      { color: theme.primary, fontFamily: 'Inter_600SemiBold' },

  errText: { marginTop: 12, fontSize: 13, fontFamily: 'Inter_400Regular', color: theme.primary, textAlign: 'center' },

  cta: {
    height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C8102E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  ctaText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});