// src/screens/auth/ForgotPinScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  ActivityIndicator, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons }       from '@expo/vector-icons';
import { useAuth }        from '../../context/AuthContext';
import { useTheme }       from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';
import AnimatedInput      from '../../components/AnimatedInput';

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

      {/* ── Gradient header band ── */}
      <LinearGradient
        colors={[theme.gradPrimA, theme.gradPrimB]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.headerBand}
      >
        <View style={s.headerDecor} />
        <TouchableOpacity onPress={onBack} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={s.headerHeading}>Reset Your PIN</Text>
        <Text style={s.headerSub}>Enter your password to verify your identity</Text>
      </LinearGradient>

      <View style={s.inner}>
        {/* Email read-only */}
        <View style={[s.emailBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Ionicons name="mail-outline" size={18} color={theme.textDim} />
          <Text style={[s.emailText, { color: theme.textDim }]}>{user?.email ?? ''}</Text>
        </View>

        {/* Password with AnimatedInput */}
        <View style={s.passwordWrap}>
          <AnimatedInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your account password"
            secureTextEntry={!showPwd}
            autoCapitalize="none"
            autoFocus
            inputStyle={{ paddingRight: 44 }}
          />
          <TouchableOpacity
            onPress={() => setShowPwd(v => !v)}
            style={s.eyeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={22} color={theme.textDim} />
          </TouchableOpacity>
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity
          onPress={handleVerify}
          disabled={loading}
          style={[s.btn, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Verify & Reset PIN</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  headerBand: {
    paddingHorizontal:       spacing.lg,
    paddingTop:              spacing.lg,
    paddingBottom:           spacing.xl,
    borderBottomLeftRadius:  radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow:                'hidden',
    marginBottom:            spacing.md,
  },
  headerDecor: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -50, right: -50,
  },
  backBtn:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm - 2, marginBottom: spacing.lg },
  backText:      { fontSize: 18, fontFamily: fonts.bodyMed, color: '#fff' },
  headerHeading: { fontSize: 32, fontFamily: fonts.display, color: '#fff', letterSpacing: -0.6 },
  headerSub:     { fontSize: 17, fontFamily: fonts.body, color: 'rgba(255,255,255,0.75)', marginTop: spacing.xs, lineHeight: 24 },

  inner: { flex: 1, paddingHorizontal: spacing.lg },

  emailBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    height: 52, borderWidth: 1.5, borderRadius: radius.md,
    paddingHorizontal: spacing.md, marginTop: spacing.md,
  },
  emailText: { fontSize: 17, fontFamily: fonts.body },

  passwordWrap: { position: 'relative' },
  eyeBtn:       { position: 'absolute', right: spacing.md, bottom: 17 },

  error: {
    color: '#C8102E', fontSize: 16, fontFamily: fonts.body,
    textAlign: 'center', marginTop: spacing.md - 4,
  },

  btn: {
    height: 56, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg,
  },
  btnText: { color: '#fff', fontSize: 19, fontFamily: fonts.bodyBold },
});
