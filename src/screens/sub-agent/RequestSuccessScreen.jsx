// src/screens/sub-agent/RequestSuccessScreen.jsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';

let Clipboard = null;
try {
  Clipboard = require('expo-clipboard');
} catch (e) {
  Clipboard = { setStringAsync: async () => {} };
}

export default function RequestSuccessScreen({ navigation, route }) {
  const { theme, isDark, tr } = useTheme();
  const { queuePosition, sourceNetwork, destNetwork, amount, requestId } =
    route?.params ?? {};

  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, tension: 60, friction: 8,  useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 450,             useNativeDriver: true }),
      Animated.spring(slideY,  { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const fmt = (n) => {
    if (!n) return 'TZS 0';
    if (n >= 1_000_000) return `TZS ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `TZS ${(n / 1_000).toFixed(0)}k`;
    return `TZS ${n}`;
  };

  const shortId = requestId?.slice(-8)?.toUpperCase() ?? '—';
  const copyId  = async () => { if (requestId) await Clipboard.setStringAsync(shortId); };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      <Animated.View style={[s.inner, { opacity }]}>

        <Animated.View style={[s.iconWrap, { transform: [{ scale }] }]}>
          <View style={[s.iconCircle, { backgroundColor: '#16A34A1A' }]}>
            <Ionicons name="checkmark-circle" size={96} color="#16A34A" />
          </View>
        </Animated.View>

        <Animated.View style={{ transform: [{ translateY: slideY }], alignItems: 'center', gap: spacing.sm + 2 }}>
          <Text style={[s.title, { color: theme.text }]}>{tr('requestSent')}</Text>
          <Text style={[s.sub,   { color: theme.textDim }]}>{tr('requestSentDesc')}</Text>
        </Animated.View>

        <Animated.View style={[s.card, {
          backgroundColor: theme.surfaceAlt,
          borderColor:     theme.border,
          transform:       [{ translateY: slideY }],
        }]}>
          <View style={s.cardRow}>
            <Text style={[s.cardLabel, { color: theme.textDim }]}>{tr('route')}</Text>
            <Text style={[s.cardValue, { color: theme.text }]}>{sourceNetwork} → {destNetwork}</Text>
          </View>
          <View style={[s.divider, { backgroundColor: theme.border }]} />
          <View style={s.cardRow}>
            <Text style={[s.cardLabel, { color: theme.textDim }]}>{tr('amount')}</Text>
            <Text style={[s.cardValue, { color: theme.primary }]}>{fmt(amount)}</Text>
          </View>
          <View style={[s.divider, { backgroundColor: theme.border }]} />
          <View style={s.cardRow}>
            <Text style={[s.cardLabel, { color: theme.textDim }]}>{tr('queuePos')}</Text>
            <Text style={[s.cardValue, { color: theme.text }]}>#{queuePosition ?? '—'}</Text>
          </View>
          {requestId && (
            <>
              <View style={[s.divider, { backgroundColor: theme.border }]} />
              <TouchableOpacity style={s.cardRow} onPress={copyId} activeOpacity={0.7}>
                <Text style={[s.cardLabel, { color: theme.textDim }]}>{tr('requestId')}</Text>
                <View style={s.idRow}>
                  <Text style={[s.cardValue, { color: theme.text }]}>#{shortId}</Text>
                  <Ionicons name="copy-outline" size={17} color={theme.textDim} />
                </View>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        <View style={s.btnRow}>
          <TouchableOpacity
            onPress={() => navigation.replace('NewRequest')}
            style={[s.btnOutline, { borderColor: theme.border }]}
            activeOpacity={0.75}
          >
            <Text style={[s.btnOutlineText, { color: theme.text }]}>{tr('newRequest')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.replace('Home')}
            style={[s.btnFilled, { backgroundColor: theme.primary }]}
            activeOpacity={0.85}
          >
            <Text style={s.btnFilledText}>{tr('backHome')}</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1 },
  inner: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        spacing.lg,
    gap:            spacing.md + 4,
  },
  iconWrap:   { marginBottom: spacing.sm - 2 },
  iconCircle: {
    width:          148,
    height:         148,
    borderRadius:   74,
    alignItems:     'center',
    justifyContent: 'center',
  },

  title: { fontSize: 34, fontFamily: fonts.display, letterSpacing: -0.5, textAlign: 'center' },
  sub:   { fontSize: 18, fontFamily: fonts.body,    textAlign: 'center', lineHeight: 28 },

  card:    { width: '100%', borderRadius: radius.xl - 2, borderWidth: 1, overflow: 'hidden' },
  cardRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        spacing.md,
  },
  cardLabel: { fontSize: 17, fontFamily: fonts.body },
  cardValue: { fontSize: 19, fontFamily: fonts.bodyBold },
  divider:   { height: 1 },
  idRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm - 1 },

  btnRow: { flexDirection: 'row', gap: spacing.md - 4, width: '100%', marginTop: spacing.sm - 2 },
  btnOutline: {
    flex:           1,
    height:         58,
    borderRadius:   radius.lg,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
  },
  btnOutlineText: { fontSize: 18, fontFamily: fonts.bodyBold },
  btnFilled: {
    flex:           1,
    height:         58,
    borderRadius:   radius.lg,
    alignItems:     'center',
    justifyContent: 'center',
  },
  btnFilledText: { color: '#fff', fontSize: 18, fontFamily: fonts.bodyBold },
});
