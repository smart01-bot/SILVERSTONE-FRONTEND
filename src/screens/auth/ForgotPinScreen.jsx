import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function ForgotPinScreen({ onBack }) {
  const { user, login, resetPin } = useAuth();
  const { theme } = useTheme();

  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleVerify = async () => {
    if (!password.trim()) { setError('Please enter your password.'); return; }
    setError('');
    setLoading(true);
    try {
      await login(user.email, password);
      await resetPin();
      // pinSet=false + pinExists=false → overlay condition false → PinSetupScreen shown automatically
    } catch (e) {
      const msg = e.message?.replace('Firebase: ', '') ?? 'Verification failed.';
      if (
        msg.includes('wrong-password') ||
        msg.includes('invalid-credential') ||
        msg.includes('INVALID_LOGIN_CREDENTIALS')
      ) {
        setError('Incorrect password. Please try again.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.inner, { paddingBottom: 80 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '600' }}>‹ Back</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.iconWrap, { backgroundColor: theme.primaryLight }]}>
            <Text style={{ fontSize: 36 }}>🔐</Text>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>Reset Your PIN</Text>
          <Text style={[styles.sub, { color: theme.textDim }]}>
            Enter your password to verify your identity. You'll then create a new PIN.
          </Text>

          <View style={{ width: '100%', gap: 10 }}>
            <Text style={[styles.label, { color: theme.textDim }]}>Email</Text>
            <View style={[styles.readOnly, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Text style={{ color: theme.muted, fontSize: 15 }}>{user?.email ?? ''}</Text>
            </View>

            <Text style={[styles.label, { color: theme.textDim }]}>Password</Text>
            <TextInput
              style={[styles.inp, { backgroundColor: theme.surfaceAlt, borderColor: error ? '#DC2626' : theme.border, color: theme.text }]}
              placeholder="Enter your password"
              placeholderTextColor={theme.muted}
              value={password}
              onChangeText={v => { setPassword(v); setError(''); }}
              secureTextEntry
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleVerify}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            onPress={handleVerify}
            disabled={loading}
            style={[styles.btn, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Verify Identity</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1 },
  inner:    { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  topRow:   { width: '100%', alignItems: 'flex-start' },
  iconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  sub:      { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  label:    { fontSize: 13, fontWeight: '500', marginBottom: 2, alignSelf: 'flex-start' },
  readOnly: { width: '100%', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  inp:      { width: '100%', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  error:    { color: '#DC2626', fontSize: 14, textAlign: 'center' },
  btn:      { width: '100%', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
});
