// src/screens/auth/Step6Review.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar,
} from 'react-native';
import { LinearGradient }    from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme }          from '../../context/ThemeContext';
import { useHaptics }        from '../../hooks/useHaptics';
import { db, storage }       from '../../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { fonts, spacing, radius } from '../../constants/theme';

const TOTAL_STEPS = 6;
const STEP        = 6;

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

// ── Upload helper — runs after UID is obtained ────────────────────────────────
const uploadFile = async (uri, path) => {
  const response = await fetch(uri);
  const blob     = await response.blob();
  const fileRef  = ref(storage, path);
  await uploadBytes(fileRef, blob);
  return getDownloadURL(fileRef);
};

// ── Particle system ──────────────────────────────────────────────────────────
function Particles({ trigger }) {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x:     new Animated.Value(0),
      y:     new Animated.Value(0),
      op:    new Animated.Value(0),
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      size:  6 + Math.random() * 6,
      angle: (360 / PARTICLE_COUNT) * i + (Math.random() * 20 - 10),
      dist:  80 + Math.random() * 80,
    }))
  ).current;

  useEffect(() => {
    if (!trigger) return;
    particles.forEach(p => { p.x.setValue(0); p.y.setValue(0); p.op.setValue(0); });
    const rad = (deg) => deg * (Math.PI / 180);

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

    Animated.stagger(18, translateAnims).start();
    Animated.stagger(18, opacityAnims).start();
  }, [trigger]);

  if (!trigger) return null;

  return (
    <View style={particleStyles.wrap} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View key={i} style={[particleStyles.opacityLayer, { opacity: p.op }]}>
          <Animated.View
            style={[particleStyles.dot, {
              width: p.size, height: p.size, borderRadius: p.size / 2,
              backgroundColor: p.color,
              transform: [{ translateX: p.x }, { translateY: p.y }],
            }]}
          />
        </Animated.View>
      ))}
    </View>
  );
}

const particleStyles = StyleSheet.create({
  wrap:         { position: 'absolute', bottom: 27, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  opacityLayer: { position: 'absolute' },
  dot:          { position: 'absolute' },
});

function FieldRow({ label, value, mono }) {
  const { theme } = useTheme();
  return (
    <View style={[fieldStyles.row, { borderBottomColor: theme.border }]}>
      <Text style={[fieldStyles.label, { color: theme.textDim, fontFamily: fonts.body }]}>{label}</Text>
      <Text style={[
        fieldStyles.value,
        { color: theme.text, fontFamily: fonts.bodySemi },
        mono && { fontFamily: fonts.mono, fontSize: 12 },
      ]}>{value}</Text>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, gap: 12 },
  label: { fontSize: 13, flex: 0.45 },
  value: { fontSize: 13, flex: 0.55, textAlign: 'right' },
});

export default function Step6Review({ navigation, route }) {
  const { theme } = useTheme();
  const insets    = useSafeAreaInsets();
  const haptics   = useHaptics();

  const [agreed,   setAgreed]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [burst,    setBurst]    = useState(false);
  const [status,   setStatus]   = useState(''); // upload progress label

  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const p = route.params ?? {};

  const progressAnim = useRef(new Animated.Value((STEP - 1) / TOTAL_STEPS)).current;
  const heroAnim     = useRef(new Animated.Value(0)).current;
  const card1Anim    = useRef(new Animated.Value(0)).current;
  const card2Anim    = useRef(new Animated.Value(0)).current;
  const termsAnim    = useRef(new Animated.Value(0)).current;
  const checkAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: 1, duration: 600, useNativeDriver: false }).start();
  }, []);

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
    Animated.spring(checkAnim, { toValue: next ? 1 : 0, tension: 80, friction: 7, useNativeDriver: true }).start();
  };

  const handleSubmit = async () => {
    if (!agreed) { haptics.error(); setError('Please accept the terms to continue.'); return; }
    haptics.medium();
    setBurst(false);
    setTimeout(() => setBurst(true), 10);
    setLoading(true);
    setError('');

    try {
      const auth = getAuth();
      if (!p.email || !p.password) throw new Error('Missing credentials');

      const cred = await createUserWithEmailAndPassword(auth, p.email, p.password);
      if (!isMounted.current) return;

      const uid = cred.user.uid;

      // Upload documents now that we have a UID
      let tinCertificateUrl   = null;
      let licenceCertificateUrl = null;

      if (p.tinCertUri) {
        setStatus('Uploading TIN certificate…');
        try {
          tinCertificateUrl = await uploadFile(p.tinCertUri, `agents/${uid}/tin-certificate`);
        } catch (e) { console.warn('TIN cert upload failed:', e); }
      }

      if (p.licenceUri) {
        setStatus('Uploading licence certificate…');
        try {
          licenceCertificateUrl = await uploadFile(p.licenceUri, `agents/${uid}/licence-certificate`);
        } catch (e) { console.warn('Licence upload failed:', e); }
      }

      if (!isMounted.current) return;
      setStatus('Saving profile…');

      await setDoc(doc(db, 'agents', uid), {
        uid,
        name:                  p.name             ?? '',
        phone:                 p.phone             ?? '',
        email:                 p.email             ?? '',
        nida:                  p.nida              ?? '',
        businessName:          p.businessName      ?? '',
        businessLocation:      p.businessLocation  ?? '',
        coordinates:           p.coordinates       ?? null,
        networks:              p.networks          ?? [],
        floatCapacity:         p.floatCapacity     ?? 0,
        businessTIN:           p.businessTIN       ?? '',
        businessLicenceNumber: p.businessLicenceNumber ?? '',
        tinCertificateUrl,
        licenceCertificateUrl,
        selfieVerified:        p.selfieVerified    ?? false,
        role:              'sub-agent',
        status:            'pending',
        pinSet:            false,
        agentPhoneNumbers: {},
        createdAt:         serverTimestamp(),
      });

      if (isMounted.current) haptics.success();
      // AppNavigator watches profile.status and routes to PendingScreen automatically
    } catch (e) {
      if (!isMounted.current) return;
      haptics.error();
      setStatus('');
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

  const headerProgress = progressAnim.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] });

  const reveal = (anim) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [24,0] }) }],
  });

  const checkScale = checkAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.8, 1.15, 1] });

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

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        <Animated.View style={[s.heroCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }, reveal(heroAnim)]}>
          <View style={[s.heroMap, { backgroundColor: theme.surfaceElev }]}>
            <Text style={s.heroMapIcon}>📍</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.heroName, { color: theme.text }]}>{p.businessName || '—'}</Text>
            <Text style={[s.heroArea, { color: theme.textDim }]}>{p.businessLocation || '—'}</Text>
            {p.coordinates && (
              <Text style={[s.heroCoords, { color: theme.muted }]}>{p.coordinates.lat}° · {p.coordinates.lng}°</Text>
            )}
          </View>
        </Animated.View>

        {p.networks && p.networks.length > 0 && (
          <Animated.View style={[s.netChips, reveal(heroAnim)]}>
            {p.networks.map(id => {
              const n = NETWORKS[id]; if (!n) return null;
              return (
                <View key={id} style={[s.netChip, { borderColor: n.color + '80', backgroundColor: theme.surfaceAlt }]}>
                  <View style={[s.netDot, { backgroundColor: n.color }]} />
                  <Text style={[s.netLabel, { color: n.color, fontFamily: fonts.bodySemi }]}>{n.label}</Text>
                </View>
              );
            })}
          </Animated.View>
        )}

        <Animated.View style={reveal(card1Anim)}>
          <Text style={[s.sectionTitle, { color: theme.muted }]}>Personal</Text>
          <View style={[s.card, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <FieldRow label="Full Name" value={p.name || '—'} />
            <FieldRow label="Phone"     value={p.phone || '—'} mono />
            <FieldRow label="Email"     value={p.email || '—'} />
            <FieldRow label="NIDA"      value={maskNida(p.nida || '')} mono />
          </View>
        </Animated.View>

        <Animated.View style={reveal(card2Anim)}>
          <Text style={[s.sectionTitle, { color: theme.muted }]}>Business</Text>
          <View style={[s.card, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <FieldRow label="Till Name"   value={p.businessName || '—'} />
            <FieldRow label="Location"    value={p.businessLocation || '—'} />
            <FieldRow label="Float Cap."  value={fmtFloat(p.floatCapacity)} mono />
            <FieldRow label="TIN"         value={p.businessTIN || '—'} mono />
            <FieldRow label="Licence No." value={p.businessLicenceNumber || '—'} mono />
            <FieldRow label="TIN Cert."   value={p.tinCertUri   ? `✅ ${p.tinCertName  ?? 'Attached'}` : '—'} />
            <FieldRow label="Lic. Cert."  value={p.licenceUri   ? `✅ ${p.licenceName  ?? 'Attached'}` : '—'} />
            <FieldRow label="Identity"    value={p.selfieVerified ? '✅ Verified (97%)' : '—'} />
          </View>
        </Animated.View>

        <Animated.View style={[reveal(termsAnim), { marginTop: 4 }]}>
          <TouchableOpacity style={s.termsRow} onPress={toggleAgree} activeOpacity={0.8}>
            <Animated.View style={[
              s.checkbox,
              { borderColor: theme.border, backgroundColor: theme.surfaceAlt },
              agreed && { borderColor: theme.primary, backgroundColor: theme.primary },
              { transform: [{ scale: checkScale }] },
            ]}>
              {agreed && <Text style={s.checkMark}>✓</Text>}
            </Animated.View>
            <Text style={[s.termsText, { color: theme.textDim, fontFamily: fonts.body }]}>
              I confirm all information is accurate and agree to Silverstone's{' '}
              <Text style={[s.termsLink, { color: theme.primary, fontFamily: fonts.bodySemi }]}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={[s.termsLink, { color: theme.primary, fontFamily: fonts.bodySemi }]}>Privacy Policy</Text>.
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {error ? <Text style={[s.errText, { color: theme.primary, fontFamily: fonts.body }]}>{error}</Text> : null}
        {loading && status ? <Text style={[s.statusText, { color: theme.textDim, fontFamily: fonts.body }]}>{status}</Text> : null}

        <View style={{ marginTop: spacing.lg }}>
          <Particles trigger={burst} />
          <TouchableOpacity onPress={handleSubmit} disabled={!agreed || loading} activeOpacity={0.85}>
            <LinearGradient
              colors={agreed && !loading ? [theme.gradPrimA, theme.gradPrimB] : [theme.border, theme.border]}
              style={s.cta}
            >
              <Text style={[s.ctaText, (!agreed || loading) && { color: theme.textDim }]}>
                {loading ? (status || 'Submitting…') : 'Submit Application →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: insets.bottom + spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = (theme, insets) => StyleSheet.create({
  root:   { flex: 1, backgroundColor: theme.bg },
  header: {
    paddingTop: insets.top + 12, paddingBottom: spacing.lg + 4,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radius.xxl, borderBottomRightRadius: radius.xxl,
  },
  navRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  backBtn:  { marginRight: spacing.md, padding: 4 },
  backArrow:{ fontSize: 22, color: '#fff' },
  progressTrack: {
    flex: 1, height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  stepCounter:  { marginLeft: spacing.md, color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: fonts.bodySemi },
  eyebrow:  { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: fonts.bodySemi, letterSpacing: 1.4, marginBottom: 6 },
  title:    { color: '#fff', fontSize: 26, fontFamily: fonts.display, marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontFamily: fonts.body, lineHeight: 20 },

  scroll:        { flex: 1 },
  scrollContent: { padding: spacing.lg },

  heroCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.lg, borderWidth: 1,
    padding: spacing.md, gap: spacing.md, marginBottom: spacing.md,
  },
  heroMap:    { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  heroMapIcon:{ fontSize: 26 },
  heroName:   { fontSize: 17, fontFamily: fonts.heading },
  heroArea:   { fontSize: 13, fontFamily: fonts.body, marginTop: 2 },
  heroCoords: { fontSize: 11, fontFamily: fonts.mono, marginTop: 3 },

  netChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  netChip:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md - 4, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, gap: 6 },
  netDot:   { width: 7, height: 7, borderRadius: 4 },
  netLabel: { fontSize: 12 },

  sectionTitle: { fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1.2, marginBottom: spacing.sm, marginTop: 4 },
  card:         { borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: spacing.md, marginBottom: spacing.lg },

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  checkbox: { width: 24, height: 24, borderRadius: radius.sm - 2, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkMark:{ color: '#fff', fontSize: 14, fontFamily: fonts.bodyBold },
  termsText:{ flex: 1, fontSize: 13, lineHeight: 20 },
  termsLink:{ },

  errText:    { marginTop: spacing.md, fontSize: 13, textAlign: 'center' },
  statusText: { marginTop: spacing.sm, fontSize: 13, textAlign: 'center' },

  cta: {
    height: 54, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C8102E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  ctaText: { fontSize: 16, fontFamily: fonts.bodyBold, color: '#fff' },
});