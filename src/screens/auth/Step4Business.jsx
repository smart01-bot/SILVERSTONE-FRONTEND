import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, Animated, TouchableOpacity, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import AnimatedInput from '../../components/AnimatedInput';
import { useHaptics } from '../../hooks/useHaptics';

const TOTAL_STEPS = 6;
const STEP = 4;

const NETWORKS = [
  { id: 'mpesa',   label: 'M-Pesa',   color: '#00A651' },
  { id: 'airtel',  label: 'Airtel',   color: '#E20020' },
  { id: 'yas',     label: 'Yas Mixx', color: '#0057A8' },
  { id: 'halotel', label: 'Halotel',  color: '#F68B1F' },
];

const FLOAT_STEPS  = [100, 250, 500, 1000, 2500, 5000, 10000]; // ×1000 TSh
const FLOAT_LABELS = ['100K', '250K', '500K', '1M', '2.5M', '5M', '10M+'];

// ── Network chip with per-chip spring animation ───────────────────────────────
function NetworkChip({ network, active, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Spring bounce on tap — useNativeDriver: true (scale)
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.88, tension: 300, friction: 8, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1,    tension: 200, friction: 7, useNativeDriver: true }),
    ]).start();
    onPress(network.id);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={1}
        style={[
          chipStyles.chip,
          { borderColor: active ? network.color : '#DCDCE8' },
          active && { backgroundColor: network.color + '15' },
        ]}
      >
        <View style={[chipStyles.dot, { backgroundColor: network.color }]} />
        <Text style={[chipStyles.label, active && { color: network.color, fontFamily: 'Inter_700Bold' }]}>
          {network.label}
        </Text>
        {active && <Text style={[chipStyles.check, { color: network.color }]}>✓</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: 12, borderWidth: 1.5,
    backgroundColor: '#EEEEF5',
    gap: 7,
  },
  dot:   { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#60606E' },
  check: { fontSize: 12, marginLeft: 2 },
});
// ─────────────────────────────────────────────────────────────────────────────

export default function Step4Business({ navigation, route }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const prefillLocation = route.params?.location ?? '';
  const prefillCoords   = route.params?.coordinates ?? null;

  const [bizName, setBizName]     = useState('');
  const [bizNameErr, setBizNameErr] = useState('');
  const [location, setLocation]   = useState(prefillLocation);
  const [coords, setCoords]       = useState(prefillCoords);
  const [networks, setNetworks]   = useState([]);
  const [netErr, setNetErr]       = useState('');
  const [sliderIdx, setSliderIdx] = useState(2);
  const [tin, setTin]             = useState('');
  const [tinErr, setTinErr]       = useState('');
  const [tinCert, setTinCert]     = useState(null);
  const [licence, setLicence]     = useState('');
  const [licenceErr, setLicenceErr] = useState('');
  const [licenceCert, setLicenceCert] = useState(null);

  const progressAnim = useRef(new Animated.Value((STEP - 1) / TOTAL_STEPS)).current;

  // Slider fill — animated width (useNativeDriver: false)
  const sliderFill = useRef(new Animated.Value(sliderIdx / (FLOAT_STEPS.length - 1))).current;

  useEffect(() => {
    if (route.params?.location) {
      setLocation(route.params.location);
      setCoords(route.params.coordinates);
    }
  }, [route.params?.location]);

  // useNativeDriver: false — width
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: STEP / TOTAL_STEPS, duration: 600, useNativeDriver: false,
    }).start();
  }, []);

  const handleSlider = (i) => {
    haptics.selection();
    setSliderIdx(i);
    // useNativeDriver: false — animating width
    Animated.timing(sliderFill, {
      toValue: i / (FLOAT_STEPS.length - 1),
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const toggleNetwork = (id) => {
    setNetworks((prev) => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
    if (netErr) setNetErr('');
  };

  const mockPickDocument = (setter) => {
    haptics.light();
    setter({ name: 'document.pdf', size: '1.2 MB' });
  };

  const canProceed =
    bizName.trim().length >= 3 &&
    location.length > 0 &&
    networks.length >= 1 &&
    tin.replace(/\D/g, '').length >= 9 &&
    licence.length >= 3;

  const validate = () => {
    let ok = true;
    if (bizName.trim().length < 3)          { setBizNameErr('Business name must be at least 3 characters'); ok = false; }
    if (networks.length < 1)                 { setNetErr('Select at least one network'); ok = false; }
    if (tin.replace(/\D/g, '').length < 9)  { setTinErr('Enter a valid TIN number'); ok = false; }
    if (licence.length < 3)                  { setLicenceErr('Enter your business licence number'); ok = false; }
    return ok;
  };

  const handleNext = () => {
    if (!validate()) { haptics.error(); return; }
    haptics.medium();
    setTimeout(() => haptics.success(), 120);
    navigation.navigate('Step5Selfie', {
      ...route.params,
      businessName: bizName.trim(),
      businessLocation: location,
      coordinates: coords,
      networks,
      floatCapacity: FLOAT_STEPS[sliderIdx] * 1000,
      businessTIN: tin,
      businessLicenceNumber: licence,
      tinCertificateUrl:     tinCert    ? 'mock://tin-cert'     : null,
      licenceCertificateUrl: licenceCert? 'mock://licence-cert' : null,
    });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  const sliderFillWidth = sliderFill.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
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
            <Animated.View style={[s.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={s.stepCounter}>{STEP}/{TOTAL_STEPS}</Text>
        </View>
        <Text style={s.eyebrow}>SIGN UP · SUB-AGENT</Text>
        <Text style={s.title}>Business Details</Text>
        <Text style={s.subtitle}>Tell us about your mobile money operation.</Text>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Business name */}
          <AnimatedInput
            label="Business / Till Name"
            value={bizName}
            onChangeText={(t) => { setBizName(t); if (bizNameErr) setBizNameErr(''); }}
            placeholder="e.g. Juma Mobile Money"
            error={bizNameErr}
            autoCapitalize="words"
          />

          {/* Location picker */}
          <View style={{ marginTop: 16 }}>
            <Text style={s.sectionLabel}>Till Location</Text>
            <TouchableOpacity
              style={[s.locationBtn, location && s.locationBtnFilled]}
              onPress={() => { haptics.light(); navigation.navigate('Step4aMap', route.params); }}
            >
              {location ? (
                <View style={s.locationFilled}>
                  <View style={s.miniMap}>
                    <Text style={s.miniMapIcon}>📍</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.locationArea}>{location}</Text>
                    {coords && (
                      <Text style={s.locationCoords}>
                        {coords.lat.toFixed(4)}° · {coords.lng.toFixed(4)}°
                      </Text>
                    )}
                  </View>
                  <Text style={s.editLink}>EDIT</Text>
                </View>
              ) : (
                <View style={s.locationEmpty}>
                  <Text style={s.locationPin}>📍</Text>
                  <Text style={s.locationPlaceholder}>Tap to pin your till on the map</Text>
                  <Text style={s.locationChevron}>›</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Networks */}
          <View style={{ marginTop: 20 }}>
            <View style={s.rowBetween}>
              <Text style={s.sectionLabel}>Networks You Operate</Text>
              {netErr ? <Text style={s.errText}>{netErr}</Text> : null}
            </View>
            <View style={s.networkChips}>
              {NETWORKS.map(n => (
                <NetworkChip
                  key={n.id}
                  network={n}
                  active={networks.includes(n.id)}
                  onPress={toggleNetwork}
                />
              ))}
            </View>
          </View>

          {/* Float capacity — gradient slider */}
          <View style={{ marginTop: 20 }}>
            <View style={s.rowBetween}>
              <Text style={s.sectionLabel}>Daily Float Capacity</Text>
              <Text style={s.sliderValue}>TSh {FLOAT_LABELS[sliderIdx]}/day</Text>
            </View>

            {/* Segmented slider with gradient fill */}
            <View style={s.sliderWrap}>
              {/* Filled track */}
              <View style={s.sliderTrackBg}>
                <Animated.View style={[s.sliderTrackFill, { width: sliderFillWidth }]}>
                  <LinearGradient
                    colors={[theme.gradPrimA, theme.gradPrimB]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </Animated.View>
              </View>

              {/* Stop dots */}
              <View style={s.sliderStops} pointerEvents="box-none">
                {FLOAT_STEPS.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      s.stop,
                      i <= sliderIdx && s.stopActive,
                      i === sliderIdx && s.stopCurrent,
                    ]}
                    onPress={() => handleSlider(i)}
                    hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
                  />
                ))}
              </View>
            </View>

            <View style={s.sliderLabels}>
              <Text style={s.sliderLabel}>100K</Text>
              <Text style={s.sliderLabel}>10M+</Text>
            </View>
          </View>

          {/* TIN */}
          <View style={{ marginTop: 20 }}>
            <AnimatedInput
              label="Business TIN Number"
              value={tin}
              onChangeText={(t) => { setTin(t); if (tinErr) setTinErr(''); }}
              placeholder="000-000-000"
              error={tinErr}
              keyboardType="number-pad"
              mono
            />
          </View>

          <TouchableOpacity
            style={[s.uploadBtn, tinCert && s.uploadBtnDone]}
            onPress={() => mockPickDocument(setTinCert)}
          >
            <Text style={s.uploadIcon}>{tinCert ? '✅' : '📎'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.uploadLabel}>TIN Certificate</Text>
              {tinCert
                ? <Text style={s.uploadFile}>{tinCert.name} · {tinCert.size}</Text>
                : <Text style={s.uploadHint}>Tap to upload PDF or image</Text>
              }
            </View>
            {!tinCert && <Text style={s.uploadChevron}>›</Text>}
          </TouchableOpacity>

          {/* Licence */}
          <View style={{ marginTop: 16 }}>
            <AnimatedInput
              label="Business Licence Number"
              value={licence}
              onChangeText={(t) => { setLicence(t); if (licenceErr) setLicenceErr(''); }}
              placeholder="BRN-XXXXXXXX"
              error={licenceErr}
              autoCapitalize="characters"
              mono
            />
          </View>

          <TouchableOpacity
            style={[s.uploadBtn, licenceCert && s.uploadBtnDone]}
            onPress={() => mockPickDocument(setLicenceCert)}
          >
            <Text style={s.uploadIcon}>{licenceCert ? '✅' : '📎'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.uploadLabel}>Business Licence Certificate</Text>
              {licenceCert
                ? <Text style={s.uploadFile}>{licenceCert.name} · {licenceCert.size}</Text>
                : <Text style={s.uploadHint}>Tap to upload PDF or image</Text>
              }
            </View>
            {!licenceCert && <Text style={s.uploadChevron}>›</Text>}
          </TouchableOpacity>

          {/* CTA */}
          <TouchableOpacity onPress={handleNext} disabled={!canProceed} activeOpacity={0.85} style={{ marginTop: 32 }}>
            <LinearGradient
              colors={canProceed ? [theme.gradPrimA, theme.gradPrimB] : ['#555', '#444']}
              style={s.cta}
            >
              <Text style={s.ctaText}>Continue</Text>
              <Text style={s.ctaArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    flex: 1, height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  stepCounter: { marginLeft: 12, color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  eyebrow: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.4, marginBottom: 6 },
  title:   { color: '#fff', fontSize: 26, fontFamily: 'Manrope_800ExtraBold', marginBottom: 6 },
  subtitle:{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },

  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  sectionLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: theme.textDim, marginBottom: 8 },
  rowBetween:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  errText:      { fontSize: 12, color: theme.primary, fontFamily: 'Inter_400Regular' },

  locationBtn: {
    borderRadius: 14, borderWidth: 1,
    borderColor: theme.border, backgroundColor: theme.surfaceAlt, overflow: 'hidden',
  },
  locationBtnFilled: { borderColor: theme.primary + '60' },
  locationEmpty: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
  locationFilled:{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  locationPin:   { fontSize: 20 },
  locationPlaceholder: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: theme.muted },
  locationChevron: { fontSize: 20, color: theme.muted },
  miniMap: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#EEF2F5', alignItems: 'center', justifyContent: 'center' },
  miniMapIcon: { fontSize: 20 },
  locationArea:  { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: theme.text },
  locationCoords:{ fontSize: 11, fontFamily: 'RobotoMono_400Regular', color: theme.textDim, marginTop: 2 },
  editLink:      { fontSize: 11, fontFamily: 'Inter_700Bold', color: theme.primary, letterSpacing: 0.8 },

  networkChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  // Gradient slider
  sliderWrap: { height: 20, justifyContent: 'center', marginVertical: 4 },
  sliderTrackBg: {
    height: 6, borderRadius: 3,
    backgroundColor: theme.border,
    overflow: 'hidden',
    position: 'absolute',
    left: 0, right: 0,
  },
  sliderTrackFill: {
    height: '100%', borderRadius: 3, overflow: 'hidden',
  },
  sliderStops: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    left: 0, right: 0,
  },
  stop: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: theme.border,
    borderWidth: 2, borderColor: theme.bg,
  },
  stopActive:  { backgroundColor: theme.primary + '80', borderColor: theme.bg },
  stopCurrent: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: theme.primary,
    borderColor: theme.bg, borderWidth: 2,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5, shadowRadius: 4, elevation: 3,
  },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sliderLabel:  { fontSize: 11, fontFamily: 'Inter_400Regular', color: theme.muted },
  sliderValue:  { fontSize: 14, fontFamily: 'Manrope_700Bold', color: theme.primary },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, borderStyle: 'dashed',
    borderColor: theme.border, padding: 14, marginTop: 10, gap: 12,
    backgroundColor: theme.surfaceAlt,
  },
  uploadBtnDone: {
    borderStyle: 'solid', borderColor: '#22C55E60',
    backgroundColor: '#22C55E0A',
  },
  uploadIcon:   { fontSize: 20 },
  uploadLabel:  { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: theme.text },
  uploadHint:   { fontSize: 12, fontFamily: 'Inter_400Regular', color: theme.muted, marginTop: 2 },
  uploadFile:   { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#22C55E', marginTop: 2 },
  uploadChevron:{ fontSize: 20, color: theme.muted },

  cta: {
    height: 54, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#C8102E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  ctaText:  { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  ctaArrow: { color: '#fff', fontSize: 18 },
});
