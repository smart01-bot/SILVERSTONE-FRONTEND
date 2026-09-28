import { workflowError } from '../../api/workflowState';
// src/screens/auth/Step4Business.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { api } from "../../config/api";
import { saveDraft, wizardParams, syncWizard } from "../../api/onboarding";
import { uploadDocument } from "../../api/documents";
import { useTheme } from "../../context/ThemeContext";
import AnimatedInput from "../../components/AnimatedInput";
import { useHaptics } from "../../hooks/useHaptics";
import { fonts, spacing, radius } from "../../constants/theme";

const TOTAL_STEPS = 6;
const STEP = 4;

const NETWORKS = [
  { id: "Voda", label: "M-Pesa", color: "#00A651" },
  { id: "Airtel", label: "Airtel", color: "#E20020" },
  { id: "Yas", label: "Yas Mixx", color: "#0057A8" },
  { id: "Halotel", label: "Halotel", color: "#F68B1F" },
];

const FLOAT_STEPS = [100, 250, 500, 1000, 2500, 5000, 10000];
const FLOAT_LABELS = ["100K", "250K", "500K", "1M", "2.5M", "5M", "10M+"];
const DOC_TYPES = ["image/jpeg", "image/png"];

// ── Network chip ─────────────────────────────────────────────────────────────
function NetworkChip({ network, active, onPress, theme }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.88,
        tension: 300,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 7,
        useNativeDriver: true,
      }),
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
          {
            borderColor: active ? network.color : theme.border,
            backgroundColor: theme.surfaceAlt,
          },
          active && {
            backgroundColor: network.color + "15",
            borderColor: network.color,
          },
        ]}
      >
        <View style={[chipStyles.dot, { backgroundColor: network.color }]} />
        <Text
          style={[
            chipStyles.label,
            { color: theme.textDim, fontFamily: fonts.bodySemi },
            active && { color: network.color, fontFamily: fonts.bodyBold },
          ]}
        >
          {network.label}
        </Text>
        {active && (
          <Text style={[chipStyles.check, { color: network.color }]}>✓</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.sm + 3,
    borderRadius: radius.md,
    borderWidth: 1.5,
    gap: spacing.sm - 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 14 },
  check: { fontSize: 12, marginLeft: 2 },
});

// ── Upload row ────────────────────────────────────────────────────────────────
function UploadRow({ label, file, onPick, theme }) {
  return (
    <TouchableOpacity
      style={[
        uploadStyles.btn,
        { borderColor: theme.border, backgroundColor: theme.surfaceAlt },
        file && {
          borderStyle: "solid",
          borderColor: theme.success + "60",
          backgroundColor: theme.successSoft,
        },
      ]}
      accessibilityRole="button" accessibilityLabel={`${label}: ${file ? "selected, not yet saved" : "choose image"}`}
      onPress={onPick}
      activeOpacity={0.8}
    >
      <Text style={uploadStyles.icon}>{file ? "✅" : "📎"}</Text>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            uploadStyles.label,
            { color: theme.text, fontFamily: fonts.bodySemi },
          ]}
        >
          {label}
        </Text>
        {file ? (
          <Text
            style={[
              uploadStyles.file,
              { color: theme.success, fontFamily: fonts.body },
            ]}
            numberOfLines={1}
          >
            {file.name} · selected, not yet saved
          </Text>
        ) : (
          <Text
            style={[
              uploadStyles.hint,
              { color: theme.muted, fontFamily: fonts.body },
            ]}
          >
            Choose PNG or JPEG · 2 MB maximum
          </Text>
        )}
      </View>
      {!file && (
        <Text style={[uploadStyles.chevron, { color: theme.muted }]}>›</Text>
      )}
    </TouchableOpacity>
  );
}

const uploadStyles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: spacing.md,
    marginTop: spacing.sm + 2,
    gap: spacing.md,
  },
  icon: { fontSize: 20 },
  label: { fontSize: 14 },
  hint: { fontSize: 12, marginTop: 2 },
  file: { fontSize: 12, marginTop: 2 },
  chevron: { fontSize: 20 },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function Step4Business({ navigation, route }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const prefillLocation =
    route.params?.location ?? route.params?.businessLocation ?? "";
  const prefillCoords = route.params?.coordinates ?? null;

  const [bizName, setBizName] = useState(route.params?.businessName ?? "");
  const [bizNameErr, setBizNameErr] = useState("");
  const [location, setLocation] = useState(prefillLocation);
  const [coords, setCoords] = useState(prefillCoords);
  const [networks, setNetworks] = useState(route.params?.networks ?? []);
  const [netErr, setNetErr] = useState("");
  const [sliderIdx, setSliderIdx] = useState(
    Math.max(
      0,
      FLOAT_STEPS.indexOf(Number(route.params?.floatCapacity || 500000) / 1000),
    ),
  );
  const [tin, setTin] = useState(route.params?.businessTIN ?? "");
  const [tinErr, setTinErr] = useState("");
  const [tinCert, setTinCert] = useState(null); // { uri, name }
  const [licence, setLicence] = useState(
    route.params?.businessLicenceNumber ?? "",
  );
  const [licenceErr, setLicenceErr] = useState("");
  const [licenceCert, setLicenceCert] = useState(null); // { uri, name }

  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedDocuments,setSavedDocuments]=useState([]);
  useEffect(()=>{let live=true;Promise.all((route.params?.documentIds||[]).map(id=>api.call(`/documents/${id}?metadata=1`))).then(rows=>{if(live)setSavedDocuments(rows);}).catch(e=>{if(live)setSaveError(workflowError(e));});return ()=>{live=false;};},[route.params?.documentIds]);
  const progressAnim = useRef(
    new Animated.Value((STEP - 1) / TOTAL_STEPS),
  ).current;
  const sliderFill = useRef(
    new Animated.Value(sliderIdx / (FLOAT_STEPS.length - 1)),
  ).current;

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

  const handleSlider = (i) => {
    haptics.selection();
    setSliderIdx(i);
    Animated.timing(sliderFill, {
      toValue: i / (FLOAT_STEPS.length - 1),
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const toggleNetwork = (id) => {
    setNetworks((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id],
    );
    if (netErr) setNetErr("");
  };

  const pickDocument = async (setter) => {
    haptics.light();
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: DOC_TYPES,
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        setter(asset);
        haptics.success();
      }
    } catch (e) {
      setSaveError(workflowError(e));
    }
  };

  const canProceed =
    bizName.trim().length >= 3 &&
    location.length > 0 &&
    networks.length >= 1 &&
    tin.replace(/\D/g, "").length >= 8 &&
    licence.length >= 3;

  const validate = () => {
    let ok = true;
    if (bizName.trim().length < 3) {
      setBizNameErr("Business name must be at least 3 characters");
      ok = false;
    }
    if (networks.length < 1) {
      setNetErr("Select at least one network");
      ok = false;
    }
    if (tin.replace(/\D/g, "").length < 8) {
      setTinErr("Enter a valid TIN number");
      ok = false;
    }
    if (licence.length < 3) {
      setLicenceErr("Enter your business licence number");
      ok = false;
    }
    return ok;
  };

  const persist = async (advance = false) => {
    if (saving || (advance && !validate())) return;
    setSaving(true);
    setSaveError("");
    try {
      let ids = [...(route.params?.documentIds || [])];
      for (const [asset, kind] of [
        [tinCert, "tin"],
        [licenceCert, "licence"],
      ]) {
        if (!asset?.uri) continue;
        const uploaded = await uploadDocument(asset, kind);
        const kept = [];
        for (const id of ids) {
          const doc = await api.call(`/documents/${id}?metadata=1`);
          if (doc.kind !== kind) kept.push(id);
        }
        ids = [...kept, uploaded.id];
      }
      const saved = await saveDraft(api, {
        ...route.params,
        businessName: bizName.trim(),
        businessLocation: location,
        coordinates: coords,
        networks,
        floatCapacity: FLOAT_STEPS[sliderIdx] * 1000,
        businessTIN: tin,
        businessLicenceNumber: licence,
        documentIds: ids,
      });
      const params = syncWizard(navigation, saved);
      setTinCert(null);
      setLicenceCert(null);
      if (advance) navigation.navigate("Step5Selfie", params);
      else setSaveError("Draft saved.");
    } catch (e) {
      setSaveError(workflowError(e));
    } finally {
      setSaving(false);
    }
  };
  const handleNext = () => persist(true);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });
  const sliderFillWidth = sliderFill.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const s = styles(theme, insets);

  return (
    <View style={s.root}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <LinearGradient
        colors={[theme.gradPrimA, theme.gradPrimB]}
        style={s.header}
      >
        <View style={s.navRow}>
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              navigation.goBack();
            }}
            style={s.backBtn}
          >
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={s.progressTrack}>
            <Animated.View style={[s.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={s.stepCounter}>
            {STEP}/{TOTAL_STEPS}
          </Text>
        </View>
        {saveError ? (
          <Text accessibilityRole="alert" style={{ color: "white" }}>
            {saveError}
          </Text>
        ) : null}
        <TouchableOpacity disabled={saving} onPress={() => persist(false)}>
          <Text style={{ color: "white", paddingVertical: 12 }}>
            Save draft
          </Text>
        </TouchableOpacity>
        {savedDocuments.filter(d=>d.kind!=="selfie").map(d=><Text key={d.id} style={{color:"white"}}>Saved: {d.name}</Text>)}
        <Text style={s.eyebrow}>SIGN UP · SUB-AGENT</Text>
        <Text style={s.title}>Business Details</Text>
        <Text style={s.subtitle}>
          Tell us about your mobile money operation.
        </Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
            onChangeText={(t) => {
              setBizName(t);
              if (bizNameErr) setBizNameErr("");
            }}
            placeholder="e.g. Juma Mobile Money"
            error={bizNameErr}
            autoCapitalize="words"
          />

          {/* Location */}
          <View style={{ marginTop: spacing.md }}>
            <Text style={s.sectionLabel}>Till Location</Text>
            <TouchableOpacity
              style={[
                s.locationBtn,
                location && { borderColor: theme.primary + "60" },
              ]}
              onPress={() => {
                haptics.light();
                navigation.navigate("Step4aMap", route.params);
              }}
            >
              {location ? (
                <View style={s.locationFilled}>
                  <View style={s.miniMap}>
                    <Text style={s.miniMapIcon}>📍</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.locationArea, { color: theme.text }]}>
                      {location}
                    </Text>
                    {coords && (
                      <Text
                        style={[s.locationCoords, { color: theme.textDim }]}
                      >
                        {coords.lat.toFixed(4)}° · {coords.lng.toFixed(4)}°
                      </Text>
                    )}
                  </View>
                  <Text style={[s.editLink, { color: theme.primary }]}>
                    EDIT
                  </Text>
                </View>
              ) : (
                <View style={s.locationEmpty}>
                  <Text style={s.locationPin}>📍</Text>
                  <Text style={[s.locationPlaceholder, { color: theme.muted }]}>
                    Tap to pin your till on the map
                  </Text>
                  <Text style={[s.locationChevron, { color: theme.muted }]}>
                    ›
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Networks */}
          <View style={{ marginTop: spacing.lg }}>
            <View style={s.rowBetween}>
              <Text style={s.sectionLabel}>Networks You Operate</Text>
              {netErr ? (
                <Text style={[s.errText, { color: theme.primary }]}>
                  {netErr}
                </Text>
              ) : null}
            </View>
            <View style={s.networkChips}>
              {NETWORKS.map((n) => (
                <NetworkChip
                  key={n.id}
                  network={n}
                  active={networks.includes(n.id)}
                  onPress={toggleNetwork}
                  theme={theme}
                />
              ))}
            </View>
          </View>

          {/* Float capacity */}
          <View style={{ marginTop: spacing.lg }}>
            <View style={s.rowBetween}>
              <Text style={s.sectionLabel}>Daily Float Capacity</Text>
              <Text style={[s.sliderValue, { color: theme.primary }]}>
                TSh {FLOAT_LABELS[sliderIdx]}/day
              </Text>
            </View>
            <View style={s.sliderWrap}>
              <View
                style={[s.sliderTrackBg, { backgroundColor: theme.border }]}
              >
                <Animated.View
                  style={[s.sliderTrackFill, { width: sliderFillWidth }]}
                >
                  <LinearGradient
                    colors={[theme.gradPrimA, theme.gradPrimB]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </Animated.View>
              </View>
              <View style={s.sliderStops} pointerEvents="box-none">
                {FLOAT_STEPS.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      s.stop,
                      { backgroundColor: theme.border, borderColor: theme.bg },
                      i <= sliderIdx && {
                        backgroundColor: theme.primary + "80",
                      },
                      i === sliderIdx && {
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: theme.primary,
                        shadowColor: theme.primary,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.5,
                        shadowRadius: 4,
                        elevation: 3,
                      },
                    ]}
                    onPress={() => handleSlider(i)}
                    hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
                  />
                ))}
              </View>
            </View>
            <View style={s.sliderLabels}>
              <Text style={[s.sliderLabel, { color: theme.muted }]}>100K</Text>
              <Text style={[s.sliderLabel, { color: theme.muted }]}>10M+</Text>
            </View>
          </View>

          {/* TIN */}
          <View style={{ marginTop: spacing.lg }}>
            <AnimatedInput
              label="Business TIN Number"
              value={tin}
              onChangeText={(t) => {
                setTin(t);
                if (tinErr) setTinErr("");
              }}
              placeholder="000-000-000"
              error={tinErr}
              keyboardType="number-pad"
              mono
            />
          </View>
          <UploadRow
            label="TIN Certificate"
            file={tinCert}
            onPick={() => pickDocument(setTinCert)}
            theme={theme}
          />

          {/* Licence */}
          <View style={{ marginTop: spacing.md }}>
            <AnimatedInput
              label="Business Licence Number"
              value={licence}
              onChangeText={(t) => {
                setLicence(t);
                if (licenceErr) setLicenceErr("");
              }}
              placeholder="BRN-XXXXXXXX"
              error={licenceErr}
              autoCapitalize="characters"
              mono
            />
          </View>
          <UploadRow
            label="Business Licence Certificate"
            file={licenceCert}
            onPick={() => pickDocument(setLicenceCert)}
            theme={theme}
          />

          {/* CTA */}
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.85}
            style={{ marginTop: spacing.xl }}
          >
            <LinearGradient
              colors={
                canProceed
                  ? [theme.gradPrimA, theme.gradPrimB]
                  : [theme.border, theme.border]
              }
              style={s.cta}
            >
              <Text
                style={[s.ctaText, !canProceed && { color: theme.textDim }]}
              >
                Continue
              </Text>
              <Text
                style={[s.ctaArrow, !canProceed && { color: theme.textDim }]}
              >
                →
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = (theme, insets) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },

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

  sectionLabel: { fontSize: 13, fontFamily: fonts.bodySemi, color: theme.textDim, marginBottom: spacing.sm },
  rowBetween:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  errText:      { fontSize: 12, fontFamily: fonts.body },

  locationBtn: {
    borderRadius: radius.lg, borderWidth: 1,
    borderColor: theme.border, backgroundColor: theme.surfaceAlt, overflow: 'hidden',
  },
  locationEmpty:  { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm + 2 },
  locationFilled: { flexDirection: 'row', alignItems: 'center', padding: spacing.md - 2, gap: spacing.md },
  locationPin:    { fontSize: 20 },
  locationPlaceholder: { flex: 1, fontSize: 14, fontFamily: fonts.body },
  locationChevron:     { fontSize: 20 },
  miniMap:      { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: theme.surfaceElev, alignItems: 'center', justifyContent: 'center' },
  miniMapIcon:  { fontSize: 20 },
  locationArea: { fontSize: 15, fontFamily: fonts.bodySemi },
  locationCoords: { fontSize: 11, fontFamily: fonts.mono, marginTop: 2 },
  editLink:     { fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 0.8 },

  networkChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm + 2 },

  sliderWrap: { height: 20, justifyContent: 'center', marginVertical: 4 },
  sliderTrackBg: {
    height: 6, borderRadius: 3, overflow: 'hidden',
    position: 'absolute', left: 0, right: 0,
  },
  sliderTrackFill: { height: '100%', borderRadius: 3, overflow: 'hidden' },
  sliderStops: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    position: 'absolute', left: 0, right: 0,
  },
  stop: { width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sliderLabel:  { fontSize: 11, fontFamily: fonts.body },
  sliderValue:  { fontSize: 14, fontFamily: fonts.heading },

  cta: {
    height: 54, borderRadius: radius.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    shadowColor: '#C8102E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  ctaText:  { color: '#fff', fontSize: 16, fontFamily: fonts.bodyBold },
  ctaArrow: { color: '#fff', fontSize: 18 },
});