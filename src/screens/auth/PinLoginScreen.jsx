import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/Logo';

export default function PinLoginScreen({ navigation }) {
  const { login } = useAuth();
  const { theme, lang, setLang, tr } = useTheme();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      // AppNavigator handles routing via onAuthStateChanged
    } catch (e) {
      setError(e.message?.replace('Firebase: ', '') ?? tr('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.inner, { paddingBottom: 60 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <View style={styles.brandGroup}>
              <Logo size={60} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.brand, { color: theme.primary }]}>Silverstone</Text>
                <Text style={[styles.tagline, { color: theme.textDim }]}>{tr('tagline')}</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.greeting, { color: theme.text }]}>{tr('signIn')}</Text>

          <View style={{ width: '100%', gap: 10 }}>
            <TextInput
              style={[styles.inp, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
              placeholder={tr('email')}
              placeholderTextColor={theme.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
            <TextInput
              style={[styles.inp, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
              placeholder={tr('password')}
              placeholderTextColor={theme.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={[styles.btn, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>{tr('signIn')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('CreateAccount')} style={{ marginTop: 8 }}>
            <Text style={{ color: theme.textDim, fontSize: 14 }}>
              {tr('noAccount')}{' '}
              <Text style={{ color: theme.primary, fontWeight: '600' }}>{tr('createAccount')}</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.langRow}>
            {[['en', 'EN'], ['sw', 'SW']].map(([code, label]) => (
              <TouchableOpacity
                key={code}
                onPress={() => setLang(code)}
                style={[
                  styles.langBtn,
                  { backgroundColor: lang === code ? theme.primary : 'transparent', borderColor: theme.border },
                ]}
              >
                <Text style={{ color: lang === code ? '#fff' : theme.textDim, fontSize: 12, fontWeight: '700' }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  inner:      { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20 },
  topRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 },
  brandGroup: { flexDirection: 'row', alignItems: 'center' },
  brand:      { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  tagline:    { fontSize: 11, marginTop: 2 },
  greeting:   { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  error:      { color: '#DC2626', fontSize: 14, textAlign: 'center' },
  inp:        { width: '100%', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  btn:        { width: '100%', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },
  langRow:    { flexDirection: 'row', gap: 6 },
  langBtn:    { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
});
