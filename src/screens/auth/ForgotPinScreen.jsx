// src/screens/auth/ForgotPinScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function ForgotPinScreen({ onBack, onComplete }) {
  const { user, login, resetPin } = useAuth();
  const { theme, isDark } = useTheme();

  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleVerify = async () => {
    if (!password) {
      setError('Please enter your password.');
      return;
    }
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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      <View style={styles.inner}>

        {/* Logo row */}
        <View style={styles.logoRow}>
          <View style={styles.logoTile}>
            <Image
              source={require('../../../assets/images/SilverS.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.logoText, { color: theme.text }]}>
            silverstone
          </Text>
        </View>

        {/* Back button */}
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
          <Text style={[styles.backText, { color: theme.text }]}>Back</Text>
        </TouchableOpacity>

        {/* Heading */}
        <Text style={[styles.heading, { color: theme.text }]}>
          Reset Your PIN
        </Text>
        <Text style={[styles.sub, { color: theme.textDim }]}>
          Enter your password to verify your identity
        </Text>

        {/* Email (read only) */}
        <View style={[styles.emailBox, {
          backgroundColor: theme.surfaceAlt,
          borderColor:     theme.border,
        }]}>
          <Ionicons name="mail-outline" size={16} color={theme.textDim} />
          <Text style={[styles.emailText, { color: theme.textDim }]}>
            {user?.email ?? ''}
          </Text>
        </View>

        {/* Password */}
        <View style={styles.fieldWrap}>
          <Text style={[styles.label, { color: theme.textDim }]}>Password</Text>
          <View>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.surfaceAlt,
                borderColor:     theme.border,
                color:           theme.text,
                paddingRight:    48,
              }]}
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
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={theme.textDim}
              />
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        {/* Verify button */}
        <TouchableOpacity
          onPress={handleVerify}
          disabled={loading}
          style={[styles.btn, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Verify & Reset PIN</Text>
          }
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1 },
  inner: {
    flex:    1,
    padding: 24,
  },
  logoRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            10,
    marginBottom:   24,
  },
  logoTile: {
    width:           32,
    height:          32,
    borderRadius:    9,
    backgroundColor: '#C8102E',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         6,
  },
  logoImg:  { width: '100%', height: '100%' },
  logoText: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  backBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    marginBottom:  24,
  },
  backText: { fontSize: 15, fontWeight: '500' },
  heading: {
    fontSize:      24,
    fontWeight:    '800',
    letterSpacing: -0.6,
    marginBottom:  8,
  },
  sub: {
    fontSize:     14,
    lineHeight:   22,
    marginBottom: 24,
  },
  emailBox: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    height:            48,
    borderWidth:       1.5,
    borderRadius:      12,
    paddingHorizontal: 16,
    marginBottom:      16,
  },
  emailText: { fontSize: 14 },
  fieldWrap: { marginBottom: 16 },
  label: {
    fontSize:     13,
    fontWeight:   '500',
    marginBottom: 6,
  },
  input: {
    height:            52,
    borderWidth:       1.5,
    borderRadius:      12,
    paddingHorizontal: 16,
    fontSize:          15,
  },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },
  error: {
    color:        '#C8102E',
    fontSize:     13,
    textAlign:    'center',
    marginBottom: 12,
  },
  btn: {
    height:         52,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      8,
  },
  btnText: {
    color:      '#fff',
    fontSize:   15,
    fontWeight: '700',
  },
});