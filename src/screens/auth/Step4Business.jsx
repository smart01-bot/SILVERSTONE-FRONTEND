import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, Animated, TouchableOpacity, StatusBar, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import AnimatedInput from '../../components/AnimatedInput';
import { useHaptics } from '../../hooks/useHaptics';

const TOTAL_STEPS = 6;
const STEP = 4;

const NETWORKS = [
  { id: 'mpesa',    label: 'M-Pesa',   color: '#00A651' },
  { id: 'airtel',   label: 'Airtel',   color: '#E20020' },
  { id: 'yas',      label: 'Yas Mixx', color: '#0057A8' },
  { id: 'halotel',  label: 'Halotel',  color: '#F68B1F' },
];

const FLOAT_STEPS = [100, 250, 500, 1000, 2500, 5000, 10000]; // ×1000 TSh
const FLOAT_LABELS = ['100K', '250K', '500K', '1M', '2.5M', '5M', '10M+'];

export default function Step4Business({ navigation, route }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  // Prefill location if returning from map
  const prefillLocation = route.params?.location ?? '';
  const prefillCoords   = route.params?.coordinates ?? null;

  const [bizName, setBizName]     = useState('');
  const [bizNameErr, setBizNameErr] = useState('');

  const [location, setLocation]   = useState(prefillLocation);
  const [coords, setCoords]       = useState(prefillCoords);

  const [networks, setNetworks]   = useState([]);
  const [netErr, setNetErr]       = useState('');

  const [sliderIdx, setSliderIdx] = useState(2); // default 500K

  const [tin, setTin]             = useState('');
  const [tinErr, setTinErr]       = useState('');
  const [tinCert, setTinCert]     = useState(null); // mock

  const [licence, setLicence]     = useState('');
  const [licenceErr, setLicenceErr] = useState('');
  const [licenceCert, setLicenceCert] = useState(null); // mock

  const progressAnim = useRef(new Animated.Value((STEP - 1) / TOTAL_STEPS)).current;
  const shieldAnim   = useRef(new Animated.Value(0)).current;

  // Update location if returning from map
  useEffect(() => {
    if (route.params?.location) {
      setLocation(route.params.location);
      setCoords(route.params.coordinates);
    }
  }, [route.params?.location]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: STEP / TOTAL_STEPS,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    Animated.spring(shieldAnim, {
      toValue: 1,
      delay: 250,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const toggleNetwork = (id) => {
    haptics.selection();
    setNetworks((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
    if (netErr) setNetErr('');
  };

  const mockPickDocument = (setter) => {
    haptics.light();
    // Mock: pretend we picked a file
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
    if (bizName.trim().length < 3) { setBizNameErr('Business name must be at least 3 characters'); ok = false; }
    if (networks.length < 1) { setNetErr('Select at least one network'); ok = false; }
    if (tin.replace(/\D/g, '').length < 9) { setTinErr('Enter a valid TIN number'); ok = false; }
    if (licence.length < 3) { setLicenceErr('Enter your business licence number'); ok = false; }
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
      tinCertificateUrl: tinCert ? 'mock://tin-cert' : null,
      licenceCertificateUrl: licenceCert ? 'mock://licence-cert' : null,
    });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
            returnKeyType="next"
          />

          {/* Location */}
          <View style={{ marginTop: 16 }}>
            <Text style={s.sectionLabel}>Till Location</Text>
            <TouchableOpacity
              style={[
                s.locationBtn,
                location ? s.locationBtnFilled : null,
              ]}
              onPress={() => {
                haptics.light();
                navigation.navigate('Step4aMap', route.params);
              }}
            >
              {location ? (
                <View style={s.locationFilled}>
                  <View style={s.miniMapThumb}>
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
              {NETWORKS.map((n) => {
                const active = networks.includes(n.id);
                return (
                  <TouchableOpacity
                    key={n.id}
                    style={[
                      s.chip,
                      active && { borderColor: n.color, backgroundColor: n.color + '18' },
                    ]}
                    onPress={() => toggleNetwork(n.id)}
                  >
                    <View style={[s.chipDot, { backgroundColor: n.color }]} />
                    <Text style={[s.chipLabel, active && { color: n.color }]}>
                      {n.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Float capacity slider */}
          <View style={{ marginTop: 20 }}>
            <View style={s.rowBetween}>
              <Text style={s.sectionLabel}>Daily Float Capacity</Text>
              <Text style={s.sliderValue}>TSh {FLOAT_LABELS[sliderIdx]}/day</Text>
            </View>
            <View style={s.sliderTrack}>
              {FLOAT_STEPS.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    s.sliderStop,
                    i <= sliderIdx && s.sliderStopActive,
                    i === sliderIdx && s.sliderStopCurrent,
                  ]}
                  onPress={() => { haptics.selection(); setSliderIdx(i); }}
                />
              ))}
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

          {/* TIN cert upload */}
          <TouchableOpacity
            style={[s.uploadBtn, tinCert && s.uploadBtnDone]}
            onPress={() => mockPickDocument(setTinCert)}
          >
            <Text style={s.uploadIcon}>{tinCert ? '✅' : '📎'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.uploadLabel}>TIN Certificate</Text>
              {tinCert ? (
                <Text style={s.uploadFile}>{tinCert.name} · {tinCert.size}</Text>
              ) : (
                <Text style={s.uploadHint}>Tap to upload PDF or image</Text>
              )}
            </View>
            {!tinCert && <Text style={s.uploadChevron}>›</Text>}
          </TouchableOpacity>

          {/* Business licence number */}
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

          {/* Licence cert upload */}
          <TouchableOpacity
            style={[s.uploadBtn, licenceCert && s.uploadBtnDone]}
            onPress={() => mockPickDocument(setLicenceCert)}
          >
            <Text style={s.uploadIcon}>{licenceCert ? '✅' : '📎'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.uploadLabel}>Business Licence Certificate</Text>
              {licenceCert ? (
                <Text style={s.uploadFile}>{licenceCert.name} · {licenceCert.size}</Text>
              ) : (
                <Text style={s.uploadHint}>Tap to upload PDF or image</Text>
              )}
            </View>
            {!licenceCert && <Text style={s.uploadChevron}>›</Text>}
          </TouchableOpacity>

          {/* CTA */}
          <TouchableOpacity
            onPress={handleNext}
            disabled={!canProceed}
            activeOpacity={0.85}
            style={{ marginTop: 32 }}
          >
            <LinearGradient
              colors={canProceed
                ? [theme.gradPrimA, theme.gradPrimB]
                : ['#555', '#444']}
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

  sectionLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: theme.textDim,
    marginBottom: 8,
  },

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  errText: {
    fontSize: 12,
    color: theme.primary,
    fontFamily: 'Inter_400Regular',
  },

  locationBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceAlt,
    overflow: 'hidden',
  },
  locationBtnFilled: {
    borderColor: theme.primary + '60',
  },
  locationEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  locationFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  locationPin: { fontSize: 20 },
  locationPlaceholder: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: theme.muted,
  },
  locationChevron: { fontSize: 20, color: theme.muted },
  miniMapThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EEF2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMapIcon: { fontSize: 20 },
  locationArea: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: theme.text,
  },
  locationCoords: {
    fontSize: 11,
    fontFamily: 'RobotoMono_400Regular',
    color: theme.textDim,
    marginTop: 2,
  },
  editLink: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: theme.primary,
    letterSpacing: 0.8,
  },

  networkChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceAlt,
    gap: 7,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: theme.textDim,
  },

  sliderTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  sliderStop: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.border,
  },
  sliderStopActive: {
    backgroundColor: theme.primary + '60',
  },
  sliderStopCurrent: {
    backgroundColor: theme.primary,
    height: 10,
    borderRadius: 5,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: theme.muted,
  },
  sliderValue: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: theme.primary,
  },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.border,
    padding: 14,
    marginTop: 10,
    gap: 12,
    backgroundColor: theme.surfaceAlt,
  },
  uploadBtnDone: {
    borderStyle: 'solid',
    borderColor: '#22C55E' + '60',
    backgroundColor: '#22C55E0A',
  },
  uploadIcon: { fontSize: 20 },
  uploadLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: theme.text,
  },
  uploadHint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: theme.muted,
    marginTop: 2,
  },
  uploadFile: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#22C55E',
    marginTop: 2,
  },
  uploadChevron: {
    fontSize: 20,
    color: theme.muted,
  },

  cta: {
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  ctaArrow: { color: '#fff', fontSize: 18 },
});
