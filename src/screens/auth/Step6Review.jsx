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
import { getAuth } from 'firebase/auth';

const TOTAL_STEPS = 6;
const STEP = 6;

const NETWORKS = {
  mpesa:  { label: 'M-Pesa',   color: '#00A651' },
  airtel: { label: 'Airtel',   color: '#E20020' },
  yas:    { label: 'Yas Mixx', color: '#0057A8' },
  halotel:{ label: 'Halotel',  color: '#F68B1F' },
};

function maskNida(nida = '') {
  if (nida.length < 4) return nida;
  return '•'.repeat(nida.length - 4) + nida.slice(-4);
}

function fmtFloat(n) {
  if (!n) return '—';
  if (n >= 1_000_000) return `TSh ${(n / 1_000_000).toFixed(1)}M/day`;
  return `TSh ${(n / 1000).toFixed(0)}K/day`;
}

function FieldRow({ label, value, mono }) {
  const { theme } = useTheme();
  return (
    <View style={fieldStyles(theme).row}>
      <Text style={fieldStyles(theme).label}>{label}</Text>
      <Text style={[fieldStyles(theme).value, mono && fieldStyles(theme).mono]}>{value}</Text>
    </View>
  );
}
const fieldStyles = (theme) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: theme.textDim,
    flex: 0.45,
  },
  value: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: theme.text,
    flex: 0.55,
    textAlign: 'right',
  },
  mono: {
    fontFamily: 'RobotoMono_400Regular',
    fontSize: 12,
  },
});

export default function Step6Review({ navigation, route }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const [agreed, setAgreed]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const progressAnim  = useRef(new Animated.Value((STEP - 1) / TOTAL_STEPS)).current;
  const checkAnim     = useRef(new Animated.Value(0)).current;
  const cardAnim      = useRef(new Animated.Value(0)).current;

  const p = route.params ?? {};

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();

    Animated.spring(cardAnim, {
      toValue: 1,
      delay: 200,
      tension: 60,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, []);

  const toggleAgree = () => {
    haptics.selection();
    const next = !agreed;
    setAgreed(next);
    Animated.spring(checkAnim, {
      toValue: next ? 1 : 0,
      tension: 80,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const handleSubmit = async () => {
    if (!agreed) { haptics.error(); setError('Please accept the terms to continue.'); return; }
    haptics.medium();
    setLoading(true);
    setError('');

    try {
      const auth = getAuth();
      const uid  = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');

      await setDoc(doc(db, 'agents', uid), {
        name:                p.name ?? '',
        phone:               p.phone ?? '',
        email:               p.email ?? '',
        nida:                p.nida ?? '',
        businessName:        p.businessName ?? '',
        businessLocation:    p.businessLocation ?? '',
        coordinates:         p.coordinates ?? null,
        networks:            p.networks ?? [],
        floatCapacity:       p.floatCapacity ?? 0,
        businessTIN:         p.businessTIN ?? '',
        businessLicenceNumber: p.businessLicenceNumber ?? '',
        tinCertificateUrl:   p.tinCertificateUrl ?? null,
        licenceCertificateUrl: p.licenceCertificateUrl ?? null,
        selfieVerified:      p.selfieVerified ?? false,
        role:                'sub-agent',
        status:              'pending',
        createdAt:           serverTimestamp(),
      });

      haptics.success();
      navigation.reset({
        index: 0,
        routes: [{ name: 'PendingScreen' }],
      });
    } catch (e) {
      haptics.error();
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const headerProgress = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const cardTranslate = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  const checkScale = checkAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.8, 1.15, 1],
  });

  const s = styles(theme, insets);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <LinearGradient
        colors={[theme.gradPrimA, theme.gradPrimB]}
        style={s.header}
      >
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
        <Text style={s.title}>Review & Submit</Text>
        <Text style={s.subtitle}>Check everything below before submitting your application.</Text>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Hero location card */}
        <Animated.View style={[s.heroCard, {
          opacity: cardAnim,
          transform: [{ translateY: cardTranslate }],
        }]}>
          <View style={s.heroMap}>
            <Text style={s.heroMapIcon}>📍</Text>
          </View>
          <View style={s.heroInfo}>
            <Text style={s.heroName}>{p.businessName || '—'}</Text>
            <Text style={s.heroArea}>{p.businessLocation || '—'}</Text>
            {p.coordinates && (
              <Text style={s.heroCoords}>
                {p.coordinates.lat}° · {p.coordinates.lng}°
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Network chips */}
        {p.networks && p.networks.length > 0 && (
          <View style={s.netChips}>
            {p.networks.map((id) => {
              const n = NETWORKS[id];
              if (!n) return null;
              return (
                <View key={id} style={[s.netChip, { borderColor: n.color + '80' }]}>
                  <View style={[s.netDot, { backgroundColor: n.color }]} />
                  <Text style={[s.netLabel, { color: n.color }]}>{n.label}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Section: Personal */}
        <Text style={s.sectionTitle}>Personal</Text>
        <View style={s.card}>
          <FieldRow label="Full Name"  value={p.name || '—'} />
          <FieldRow label="Phone"      value={p.phone || '—'} mono />
          <FieldRow label="Email"      value={p.email || '—'} />
          <FieldRow
            label="NIDA"
            value={maskNida(p.nida || '')}
            mono
          />
        </View>

        {/* Section: Business */}
        <Text style={s.sectionTitle}>Business</Text>
        <View style={s.card}>
          <FieldRow label="Till Name"    value={p.businessName || '—'} />
          <FieldRow label="Location"     value={p.businessLocation || '—'} />
          <FieldRow label="Float Cap."   value={fmtFloat(p.floatCapacity)} mono />
          <FieldRow label="TIN"          value={p.businessTIN || '—'} mono />
          <FieldRow label="Licence No."  value={p.businessLicenceNumber || '—'} mono />
          <FieldRow
            label="TIN Cert."
            value={p.tinCertificateUrl ? '✅ Uploaded' : '—'}
          />
          <FieldRow
            label="Licence Cert."
            value={p.licenceCertificateUrl ? '✅ Uploaded' : '—'}
          />
          <FieldRow
            label="Identity"
            value={p.selfieVerified ? '✅ Verified (97%)' : '—'}
          />
        </View>

        {/* Terms checkbox */}
        <TouchableOpacity
          style={s.termsRow}
          onPress={toggleAgree}
          activeOpacity={0.8}
        >
          <Animated.View style={[s.checkbox, agreed && s.checkboxActive, {
            transform: [{ scale: checkScale }],
          }]}>
            {agreed && <Text style={s.checkMark}>✓</Text>}
          </Animated.View>
          <Text style={s.termsText}>
            I confirm all information is accurate and I agree to Silverstone's{' '}
            <Text style={s.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={s.termsLink}>Privacy Policy</Text>.
          </Text>
        </TouchableOpacity>

        {error ? (
          <Text style={s.errText}>{error}</Text>
        ) : null}

        {/* Submit CTA */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!agreed || loading}
          activeOpacity={0.85}
          style={{ marginTop: 24 }}
        >
          <LinearGradient
            colors={agreed && !loading
              ? [theme.gradPrimA, theme.gradPrimB]
              : ['#555', '#444']}
            style={s.cta}
          >
            <Text style={s.ctaText}>
              {loading ? 'Submitting…' : 'Submit Application →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = (theme, insets) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },

  header: {
    paddingTop: insets.top + 12,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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
    backgroundColor: 'rgba(255,255,255,0.25)',
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
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.75)',
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
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    gap: 14,
    marginBottom: 12,
  },
  heroMap: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#EEF2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMapIcon: { fontSize: 26 },
  heroInfo: { flex: 1 },
  heroName: {
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: theme.text,
  },
  heroArea: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: theme.textDim,
    marginTop: 2,
  },
  heroCoords: {
    fontSize: 11,
    fontFamily: 'RobotoMono_400Regular',
    color: theme.muted,
    marginTop: 3,
  },

  netChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  netChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    backgroundColor: theme.surfaceAlt,
  },
  netDot: { width: 7, height: 7, borderRadius: 4 },
  netLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },

  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: theme.muted,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
  },

  card: {
    backgroundColor: theme.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    backgroundColor: theme.surfaceAlt,
  },
  checkboxActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  checkMark: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: theme.textDim,
    lineHeight: 20,
  },
  termsLink: {
    color: theme.primary,
    fontFamily: 'Inter_600SemiBold',
  },

  errText: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: theme.primary,
    textAlign: 'center',
  },

  cta: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C8102E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
});
