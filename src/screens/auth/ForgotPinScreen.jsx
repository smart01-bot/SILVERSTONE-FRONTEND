// src/screens/auth/ForgotPinScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';

export default function ForgotPinScreen({ onBack, onComplete }) {
  const { user, login, resetPin } = useAuth();
  const { theme, isDark } = useTheme();

  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleVerify = async () => {
    if (!password) { setError('Please enter your password.'); return; }
    setError('');
    setLoading(true);
    try {
      await login(user.email, password);
      await resetPin();
      onComplete?.();
    } catch (e) {
      setError('Incorrect password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      <View style={s.inner}>
        <View style={s.logoRow}>
          <View style={s.logoTile}>
            <Image source={require('../../../assets/images/SilverS.png')} style={s.logoImg} resizeMode="contain" />
          </View>
          <Text style={[s.logoText, { color: theme.text }]}>silverstone</Text>
        </View>

        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
          <Text style={[s.backText, { color: theme.text }]}>Back</Text>
        </TouchableOpacity>

        <Text style={[s.heading, { color: theme.text }]}>Reset Your PIN</Text>
        <Text style={[s.sub, { color: theme.textDim }]}>Enter your password to verify your identity</Text>

        <View style={[s.emailBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Ionicons name="mail-outline" size={18} color={theme.textDim} />
          <Text style={[s.emailText, { color: theme.textDim }]}>{user?.email ?? ''}</Text>
        </View>

        <View style={s.fieldWrap}>
          <Text style={[s.label, { color: theme.textDim }]}>Password</Text>
          <View>
            <TextInput
              style={[s.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text, paddingRight: 52 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Your account password"
              placeholderTextColor={theme.muted}
              secureTextEntry={!showPwd}
              autoCapitalize="none"
              autoFocus
            />
            <TouchableOpacity
              onPress={() => setShowPwd(v => !v)}
              style={s.eyeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={22} color={theme.textDim} />
            </TouchableOpacity>
          </View>
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity
          onPress={handleVerify}
          disabled={loading}
          style={[s.btn, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Verify & Reset PIN</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1 },
  inner: { flex: 1, padding: spacing.lg },

  logoRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.sm + 2,
    marginBottom:   spacing.lg,
  },
  logoTile: {
    width: 36, height: 36, borderRadius: radius.sm + 1,
    backgroundColor: '#C8102E', alignItems: 'center', justifyContent: 'center', padding: spacing.sm - 2,
  },
  logoImg:  { width: '100%', height: '100%' },
  logoText: { fontSize: 24, fontFamily: fonts.display, letterSpacing: -0.5 },

  backBtn:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm - 2, marginBottom: spacing.lg },
  backText: { fontSize: 18, fontFamily: fonts.bodyMed },

  heading: { fontSize: 32, fontFamily: fonts.display, letterSpacing: -0.6, marginBottom: spacing.sm },
  sub:     { fontSize: 18, fontFamily: fonts.body, lineHeight: 26, marginBottom: spacing.lg },

  emailBox: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.sm,
    height:            52,
    borderWidth:       1.5,
    borderRadius:      radius.md,
    paddingHorizontal: spacing.md,
    marginBottom:      spacing.md,
  },
  emailText: { fontSize: 17, fontFamily: fonts.body },

  fieldWrap: { marginBottom: spacing.md },
  label:     { fontSize: 16, fontFamily: fonts.bodyMed, marginBottom: spacing.sm - 2 },
  input: {
    height:            56,
    borderWidth:       1.5,
    borderRadius:      radius.md,
    paddingHorizontal: spacing.md,
    fontSize:          19,
    fontFamily:        fonts.body,
  },
  eyeBtn: { position: 'absolute', right: 16, top: 17 },

  error: { color: '#C8102E', fontSize: 16, fontFamily: fonts.body, textAlign: 'center', marginBottom: spacing.md - 4 },

  btn: {
    height: 56, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm,
  },
  btnText: { color: '#fff', fontSize: 19, fontFamily: fonts.bodyBold },
});
