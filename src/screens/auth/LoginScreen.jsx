// src/screens/auth/LoginScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen({ navigation, route }) {
  const { login } = useAuth();
  const { theme, isDark } = useTheme();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      // AppNavigator handles routing after login
    } catch (e) {
      setError(
        e.message
          ?.replace('Firebase: ', '')
          ?.replace('(auth/invalid-credential).', 'Incorrect email or password.')
          ?.replace('(auth/user-not-found).', 'No account found with that email.')
          ?.replace('(auth/wrong-password).', 'Incorrect password.')
          ?? 'Login failed. Please try again.'
      );
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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

          {/* Heading */}
          <View style={styles.headingWrap}>
            <Text style={[styles.heading, { color: theme.text }]}>
              Welcome back.
            </Text>
            <Text style={[styles.sub, { color: theme.textDim }]}>
              Sign in to continue
            </Text>
          </View>

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: theme.textDim }]}>
              Email
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.surfaceAlt,
                borderColor:     theme.border,
                color:           theme.text,
              }]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: theme.textDim }]}>
              Password
            </Text>
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
                placeholder="••••••••"
                placeholderTextColor={theme.muted}
                secureTextEntry={!showPwd}
                autoCapitalize="none"
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

          {/* Error */}
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          {/* Sign in button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={[styles.btn, { backgroundColor: theme.primary }]}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Sign In</Text>
            }
          </TouchableOpacity>

          {/* Forgot password */}
          <TouchableOpacity
            onPress={() => {}}
            style={styles.forgotWrap}
          >
            <Text style={[styles.forgot, { color: theme.primary }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.textDim }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          {/* Register */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.registerWrap}
          >
            <Text style={[styles.registerText, { color: theme.textDim }]}>
              Don't have an account?{' '}
              <Text style={{ color: theme.primary, fontWeight: '700' }}>
                Register
              </Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: {
    flexGrow:          1,
    padding:           24,
    paddingBottom:     48,
  },
  logoRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            10,
    marginBottom:   40,
    marginTop:      16,
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
  logoImg: {
    width:  '100%',
    height: '100%',
  },
  logoText: {
    fontSize:      20,
    fontWeight:    '800',
    letterSpacing: -0.5,
  },
  headingWrap: {
    marginBottom: 32,
  },
  heading: {
    fontSize:      24,
    fontWeight:    '800',
    letterSpacing: -0.6,
  },
  sub: {
    fontSize:  14,
    marginTop: 6,
  },
  fieldWrap: {
    marginBottom: 16,
  },
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
  eyeBtn: {
    position: 'absolute',
    right:    14,
    top:      14,
  },
  error: {
    color:        '#C8102E',
    fontSize:     13,
    marginBottom: 12,
    textAlign:    'center',
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
  forgotWrap: {
    alignItems: 'center',
    marginTop:  16,
  },
  forgot: {
    fontSize:   13,
    fontWeight: '500',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    marginTop:     24,
    marginBottom:  24,
  },
  dividerLine: {
    flex:   1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
  },
  registerWrap: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
  },
});