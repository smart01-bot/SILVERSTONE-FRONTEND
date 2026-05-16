import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  StatusBar, TextInput, ScrollView, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';

const { width: W, height: H } = Dimensions.get('window');

const ANCHORS = [
  { name: 'Kariakoo Market', area: 'Kariakoo, Ilala', lat: -6.8190, lng: 39.2699 },
  { name: 'Ubungo Bus Terminal', area: 'Ubungo, Dar es Salaam', lat: -6.7924, lng: 39.2083 },
  { name: 'Mlimani City Mall', area: 'Mlimani, Dar es Salaam', lat: -6.7741, lng: 39.2295 },
];

// Mock map regions (colored zones)
const ZONES = [
  { x: 0.05, y: 0.15, w: 0.28, h: 0.22, color: 'rgba(200,16,46,0.07)', label: 'Kinondoni' },
  { x: 0.35, y: 0.10, w: 0.32, h: 0.28, color: 'rgba(200,16,46,0.05)', label: 'Ubungo' },
  { x: 0.68, y: 0.18, w: 0.28, h: 0.20, color: 'rgba(200,16,46,0.08)', label: 'Kigamboni' },
  { x: 0.08, y: 0.40, w: 0.30, h: 0.30, color: 'rgba(200,16,46,0.06)', label: 'Ilala' },
  { x: 0.40, y: 0.42, w: 0.28, h: 0.25, color: 'rgba(200,16,46,0.09)', label: 'Temeke' },
  { x: 0.72, y: 0.38, w: 0.24, h: 0.28, color: 'rgba(200,16,46,0.05)', label: '' },
  { x: 0.15, y: 0.72, w: 0.35, h: 0.22, color: 'rgba(200,16,46,0.07)', label: 'Kigamboni' },
];

// Grid lines
const GRID_H = 8;
const GRID_V = 6;

export default function Step4aMap({ navigation, route }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const [pin, setPin]       = useState(null); // { x%, y%, lat, lng, area }
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const pinAnim   = useRef(new Animated.Value(0)).current;
  const warnAnim  = useRef(new Animated.Value(0)).current;
  const cardAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(warnAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    if (pin) {
      Animated.spring(cardAnim, {
        toValue: 1,
        tension: 70,
        friction: 9,
        useNativeDriver: true,
      }).start();
    }
  }, [pin]);

  const handleMapTap = (evt) => {
    const { locationX, locationY } = evt.nativeEvent;
    const mapH = H * 0.52;
    const xPct = locationX / W;
    const yPct = locationY / mapH;

    // Mock lat/lng from tap position (rough Dar es Salaam bounds)
    const lat = -6.75 + (yPct * -0.15);
    const lng = 39.18 + (xPct * 0.18);

    const areas = ['Kariakoo', 'Ubungo', 'Kinondoni', 'Ilala', 'Temeke', 'Kijitonyama', 'Magomeni'];
    const area  = areas[Math.floor(xPct * yPct * areas.length * 7) % areas.length];

    haptics.selection();

    setPin({ xPct, yPct, lat, lng, area });

    Animated.sequence([
      Animated.timing(pinAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.spring(pinAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
    ]).start();
  };

  const selectAnchor = (anchor) => {
    haptics.selection();
    setSearch(anchor.name);
    setShowSuggestions(false);
    setPin({
      xPct: 0.4,
      yPct: 0.4,
      lat: anchor.lat,
      lng: anchor.lng,
      area: anchor.area,
    });
  };

  const handleConfirm = () => {
    if (!pin) return;
    haptics.medium();
    navigation.navigate('Step4Business', {
      ...route.params,
      location: pin.area,
      coordinates: { lat: +pin.lat.toFixed(4), lng: +pin.lng.toFixed(4) },
    });
  };

  const fmtCoord = (n) => n.toFixed(4);

  const pinScale = pinAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1.3, 1] });
  const cardTranslate = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });
  const warnHeight = warnAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 44] });

  const s = styles(theme, insets);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Top bar */}
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => { haptics.light(); navigation.goBack(); }} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>Pin Your Location</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search bar */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={(t) => { setSearch(t); setShowSuggestions(t.length > 0); }}
          placeholder="Search area or landmark…"
          placeholderTextColor={theme.muted}
          onFocus={() => setShowSuggestions(search.length > 0)}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); setShowSuggestions(false); }}>
            <Text style={s.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <View style={s.suggestions}>
          {ANCHORS.filter(a =>
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.area.toLowerCase().includes(search.toLowerCase())
          ).map((a) => (
            <TouchableOpacity key={a.name} style={s.suggestion} onPress={() => selectAnchor(a)}>
              <Text style={s.suggestionIcon}>📍</Text>
              <View>
                <Text style={s.suggestionName}>{a.name}</Text>
                <Text style={s.suggestionArea}>{a.area}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {ANCHORS.filter(a =>
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.area.toLowerCase().includes(search.toLowerCase())
          ).length === 0 && (
            <Text style={s.noResult}>No results — tap the map to pin manually</Text>
          )}
        </View>
      )}

      {/* Warning banner */}
      <Animated.View style={[s.warnBanner, { height: warnHeight, overflow: 'hidden' }]}>
        <Text style={s.warnText}>⚠️  Pin your actual till location — not your home</Text>
      </Animated.View>

      {/* Mock map */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleMapTap}
        style={s.map}
      >
        {/* Map bg */}
        <View style={s.mapBg} />

        {/* Grid lines */}
        {Array.from({ length: GRID_H }).map((_, i) => (
          <View key={`h${i}`} style={[s.gridH, { top: `${(i / GRID_H) * 100}%` }]} />
        ))}
        {Array.from({ length: GRID_V }).map((_, i) => (
          <View key={`v${i}`} style={[s.gridV, { left: `${(i / GRID_V) * 100}%` }]} />
        ))}

        {/* Zone overlays */}
        {ZONES.map((z, i) => (
          <View key={i} style={[s.zone, {
            left: `${z.x * 100}%`,
            top: `${z.y * 100}%`,
            width: `${z.w * 100}%`,
            height: `${z.h * 100}%`,
            backgroundColor: z.color,
          }]}>
            {z.label ? <Text style={s.zoneLabel}>{z.label}</Text> : null}
          </View>
        ))}

        {/* Anchor dots */}
        {ANCHORS.map((a, i) => (
          <View key={i} style={[s.anchorDot, {
            left: `${(30 + i * 22)}%`,
            top:  `${(25 + i * 18)}%`,
          }]} />
        ))}

        {/* Pin */}
        {pin && (
          <Animated.View style={[s.pinWrap, {
            left: pin.xPct * W - 16,
            top:  pin.yPct * (H * 0.52) - 40,
            transform: [{ scale: pinScale }],
          }]}>
            <View style={s.pinHead} />
            <View style={s.pinTail} />
            <View style={s.pinPulse} />
          </Animated.View>
        )}

        {/* Tap hint */}
        {!pin && (
          <View style={s.tapHint}>
            <Text style={s.tapHintText}>Tap to drop a pin</Text>
          </View>
        )}

        {/* FAB: current location */}
        <TouchableOpacity
          style={s.fab}
          onPress={() => {
            haptics.light();
            selectAnchor(ANCHORS[0]);
          }}
        >
          <Text style={s.fabIcon}>⊕</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Bottom card */}
      {pin ? (
        <Animated.View style={[s.bottomCard, {
          transform: [{ translateY: cardTranslate }],
          paddingBottom: insets.bottom + 16,
        }]}>
          <View style={s.bottomCardInner}>
            <View style={s.locationInfo}>
              <Text style={s.locationArea}>{pin.area}</Text>
              <Text style={s.locationCoords}>
                {fmtCoord(pin.lat)}° N · {fmtCoord(pin.lng)}° E
              </Text>
            </View>
            <TouchableOpacity style={s.editBtn} onPress={() => { haptics.light(); setPin(null); }}>
              <Text style={s.editBtnText}>RESET</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleConfirm} activeOpacity={0.85} style={s.confirmBtn}>
            <View style={s.confirmBtnInner}>
              <Text style={s.confirmBtnText}>Confirm Location →</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <View style={[s.bottomCard, s.bottomCardEmpty, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={s.emptyHint}>Select a location from the map or search bar above</Text>
        </View>
      )}
    </View>
  );
}

const styles = (theme, insets) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    zIndex: 10,
  },
  backBtn: { padding: 6 },
  backIcon: { fontSize: 22, color: theme.text },
  topTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: theme.text,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceAlt,
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    height: 44,
    zIndex: 20,
  },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: theme.text,
  },
  clearBtn: { color: theme.muted, fontSize: 14, padding: 4 },

  suggestions: {
    position: 'absolute',
    top: insets.top + 8 + 44 + 20 + 54,
    left: 16,
    right: 16,
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    zIndex: 50,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  suggestionIcon: { fontSize: 16 },
  suggestionName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: theme.text },
  suggestionArea: { fontSize: 12, fontFamily: 'Inter_400Regular', color: theme.textDim },
  noResult: {
    padding: 14,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: theme.textDim,
    textAlign: 'center',
  },

  warnBanner: {
    backgroundColor: 'rgba(234,179,8,0.12)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(234,179,8,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#92400E',
  },

  map: {
    flex: 1,
    backgroundColor: '#E8EDF0',
    position: 'relative',
    overflow: 'hidden',
  },
  mapBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EEF2F5',
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  zone: {
    position: 'absolute',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(200,16,46,0.5)',
    letterSpacing: 0.5,
  },
  anchorDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(200,16,46,0.3)',
    borderWidth: 2,
    borderColor: 'rgba(200,16,46,0.5)',
    marginLeft: -4,
    marginTop: -4,
  },

  pinWrap: {
    position: 'absolute',
    alignItems: 'center',
    width: 32,
  },
  pinHead: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#C8102E',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#C8102E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  pinTail: {
    width: 3,
    height: 14,
    backgroundColor: '#C8102E',
    marginTop: -2,
    borderRadius: 2,
  },
  pinPulse: {
    position: 'absolute',
    top: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(200,16,46,0.3)',
    marginLeft: -6,
  },

  tapHint: {
    position: 'absolute',
    bottom: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tapHintText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },

  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  fabIcon: { fontSize: 22, color: '#C8102E' },

  bottomCard: {
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  bottomCardEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: theme.textDim,
    textAlign: 'center',
  },
  bottomCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  locationInfo: { flex: 1 },
  locationArea: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: theme.text,
  },
  locationCoords: {
    fontSize: 12,
    fontFamily: 'RobotoMono_400Regular',
    color: theme.textDim,
    marginTop: 2,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  editBtnText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: theme.textDim,
    letterSpacing: 1,
  },

  confirmBtn: {
    height: 54,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#C8102E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C8102E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
});
