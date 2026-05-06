import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const STEPS = [
  { key: 'received',     label: 'Application Received',  labelSw: 'Maombi Yamepokelewa' },
  { key: 'identity',     label: 'Identity Verification', labelSw: 'Uthibitishaji wa Utambulisho' },
  { key: 'review',       label: 'Admin Review',          labelSw: 'Ukaguzi wa Msimamizi' },
  { key: 'activated',    label: 'Account Activated',     labelSw: 'Akaunti Imewashwa' },
];

function StepIcon({ state, color, pulseAnim }) {
  if (state === 'done') {
    return (
      <View style={[styles.stepCircle, { backgroundColor: '#16A34A', borderColor: '#16A34A' }]}>
        <Text style={styles.stepCheck}>✓</Text>
      </View>
    );
  }
  if (state === 'active') {
    return (
      <Animated.View style={[styles.stepCircle, { borderColor: '#F59E0B', backgroundColor: '#FEF3C7', transform: [{ scale: pulseAnim }] }]}>
        <View style={[styles.stepInnerDot, { backgroundColor: '#F59E0B' }]} />
      </Animated.View>
    );
  }
  return (
    <View style={[styles.stepCircle, { borderColor: color, backgroundColor: 'transparent' }]}>
      <View style={[styles.stepInnerDot, { backgroundColor: color, opacity: 0.3 }]} />
    </View>
  );
}

export default function PendingScreen({ navigation }) {
  const { logout, profile, user } = useAuth();
  const { theme, lang, tr } = useTheme();
  const [agentStatus, setAgentStatus] = useState(profile?.status ?? 'pending');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for active step
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0,  duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Listen to agent doc — navigate when approved
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, 'agents', user.uid), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setAgentStatus(data.status);
      if (data.status === 'approved') {
        unsub();
        navigation.replace('PinSetup');
      }
    });
    return unsub;
  }, [user?.uid]);

  // Derive which step index is current
  // 0=received(always done), 1=identity(in-progress), 2=review(waiting), 3=activated(waiting/done)
  const doneCount = agentStatus === 'approved' ? 4 : 1;

  const getState = (idx) => {
    if (idx < doneCount)      return 'done';
    if (idx === doneCount)     return 'active';
    return 'waiting';
  };

  const stepColor = (state) => {
    if (state === 'done')   return '#16A34A';
    if (state === 'active') return '#F59E0B';
    return theme.border;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.inner}>

        <View style={[styles.icon, { backgroundColor: theme.primaryLight }]}>
          <Text style={{ fontSize: 40 }}>⏳</Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          {lang === 'sw' ? 'Maombi Yamewasilishwa' : tr('applicationSent')}
        </Text>
        <Text style={[styles.name, { color: theme.primary }]}>
          {profile?.name ?? 'Agent'}
        </Text>

        {/* KYC Tracker */}
        <View style={[styles.tracker, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {STEPS.map((step, idx) => {
            const state = getState(idx);
            const color = stepColor(state);
            const isLast = idx === STEPS.length - 1;
            return (
              <View key={step.key}>
                <View style={styles.stepRow}>
                  <StepIcon state={state} color={color} pulseAnim={pulseAnim} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.stepLabel, {
                      color: state === 'waiting' ? theme.textDim : theme.text,
                      fontWeight: state === 'active' ? '700' : '500',
                    }]}>
                      {lang === 'sw' ? step.labelSw : step.label}
                    </Text>
                    {state === 'active' && (
                      <Text style={[styles.stepSub, { color: '#F59E0B' }]}>
                        {lang === 'sw' ? 'Inaendelea...' : 'In progress...'}
                      </Text>
                    )}
                    {state === 'done' && idx > 0 && (
                      <Text style={[styles.stepSub, { color: '#16A34A' }]}>
                        {lang === 'sw' ? 'Imekamilika' : 'Complete'}
                      </Text>
                    )}
                  </View>
                  {state === 'active' && (
                    <View style={[styles.activeBadge, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '700' }}>
                        {lang === 'sw' ? 'Sasa' : 'Now'}
                      </Text>
                    </View>
                  )}
                </View>
                {!isLast && (
                  <View style={[styles.connector, { backgroundColor: idx < doneCount ? '#16A34A' : theme.border }]} />
                )}
              </View>
            );
          })}
        </View>

        <Text style={[styles.eta, { color: theme.textDim }]}>
          {lang === 'sw' ? 'Muda unaokadiriwa: masaa 24–48' : 'Estimated time: 24–48 hours'}
        </Text>

        <TouchableOpacity
          onPress={async () => { await logout(); navigation.replace('PinLogin'); }}
          style={[styles.btn, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.btnText}>{tr('goToLogin')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => Linking.openURL('mailto:support@silverstone.co.tz')}>
          <Text style={[styles.support, { color: theme.primary }]}>
            {lang === 'sw' ? 'Wasiliana na msaada' : 'Contact support'}
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1 },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  icon:  { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  name:  { fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: -8 },

  tracker: {
    width: '100%', borderRadius: 16, borderWidth: 1,
    padding: 20, gap: 0,
  },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4,
  },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  stepCheck:    { color: '#fff', fontWeight: '800', fontSize: 15 },
  stepInnerDot: { width: 10, height: 10, borderRadius: 5 },
  stepLabel:    { fontSize: 14 },
  stepSub:      { fontSize: 11, marginTop: 2 },
  activeBadge:  { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  connector:    { width: 2, height: 20, marginLeft: 15, marginVertical: 2 },

  eta:     { fontSize: 13, textAlign: 'center' },
  btn:     { width: '100%', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  support: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
