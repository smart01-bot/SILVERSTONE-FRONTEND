// src/screens/sub-agent/RequestSuccessScreen.jsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
let Clipboard = null;
try {
  Clipboard = require('expo-clipboard');
} catch (e) {
  Clipboard = { setStringAsync: async () => {} };
}

export default function RequestSuccessScreen({ navigation, route }) {
  const { theme, isDark } = useTheme();
  const { queuePosition, sourceNetwork, destNetwork, amount, requestId } = route?.params ?? {};

  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1, tension: 60, friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1, duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fmt = (n) => {
    if (!n) return 'TZS 0';
    if (n >= 1_000_000) return `TZS ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `TZS ${(n / 1_000).toFixed(0)}k`;
    return `TZS ${n}`;
  };

  const shortId = requestId?.slice(-8)?.toUpperCase() ?? '—';

  const copyId = async () => {
    if (requestId) {
      await Clipboard.setStringAsync(shortId);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      <Animated.View style={[styles.inner, { opacity }]}>

        {/* Success icon */}
        <Animated.View style={[
          styles.iconWrap,
          { transform: [{ scale }] },
        ]}>
          <View style={[styles.iconCircle, { backgroundColor: '#16A34A14' }]}>
            <Ionicons name="checkmark-circle" size={72} color="#16A34A" />
          </View>
        </Animated.View>

        <Text style={[styles.title, { color: theme.text }]}>
          Request Submitted
        </Text>
        <Text style={[styles.sub, { color: theme.textDim }]}>
          Your float request has been sent to the main agent
        </Text>

        {/* Details card */}
        <View style={[styles.card, {
          backgroundColor: theme.surfaceAlt,
          borderColor:     theme.border,
        }]}>
          <View style={styles.cardRow}>
            <Text style={[styles.cardLabel, { color: theme.textDim }]}>Route</Text>
            <Text style={[styles.cardValue, { color: theme.text }]}>
              {sourceNetwork} → {destNetwork}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.cardRow}>
            <Text style={[styles.cardLabel, { color: theme.textDim }]}>Amount</Text>
            <Text style={[styles.cardValue, { color: theme.primary }]}>
              {fmt(amount)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.cardRow}>
            <Text style={[styles.cardLabel, { color: theme.textDim }]}>Queue Position</Text>
            <Text style={[styles.cardValue, { color: theme.text }]}>
              #{queuePosition ?? '—'}
            </Text>
          </View>
          {requestId && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <TouchableOpacity
                style={styles.cardRow}
                onPress={copyId}
                activeOpacity={0.7}
              >
                <Text style={[styles.cardLabel, { color: theme.textDim }]}>Request ID</Text>
                <View style={styles.idRow}>
                  <Text style={[styles.cardValue, { color: theme.text }]}>
                    #{shortId}
                  </Text>
                  <Ionicons name="copy-outline" size={14} color={theme.textDim} />
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={[styles.notify, { color: theme.textDim }]}>
          Main agent has been notified
        </Text>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            onPress={() => navigation.replace('NewRequest')}
            style={[styles.btnOutline, { borderColor: theme.border }]}
            activeOpacity={0.75}
          >
            <Text style={[styles.btnOutlineText, { color: theme.text }]}>
              New Request
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.replace('Home')}
            style={[styles.btnFilled, { backgroundColor: theme.primary }]}
            activeOpacity={0.85}
          >
            <Text style={styles.btnFilledText}>Go Home</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1 },
  inner: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        24,
    gap:            16,
  },
  iconWrap:   { marginBottom: 8 },
  iconCircle: {
    width:          120,
    height:         120,
    borderRadius:   60,
    alignItems:     'center',
    justifyContent: 'center',
  },
  title: {
    fontSize:      24,
    fontWeight:    '800',
    letterSpacing: -0.4,
    textAlign:     'center',
  },
  sub: {
    fontSize:  14,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    width:        '100%',
    borderRadius: 16,
    borderWidth:  1,
    overflow:     'hidden',
  },
  cardRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        14,
  },
  cardLabel: { fontSize: 13 },
  cardValue: { fontSize: 14, fontWeight: '600' },
  divider:   { height: 1 },
  idRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  notify: {
    fontSize:  13,
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap:           10,
    width:         '100%',
    marginTop:     8,
  },
  btnOutline: {
    flex:           1,
    height:         52,
    borderRadius:   14,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
  },
  btnOutlineText: { fontSize: 15, fontWeight: '600' },
  btnFilled: {
    flex:           1,
    height:         52,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
  },
  btnFilledText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});