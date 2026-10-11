import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../constants/theme';
import SilverstoneMark from '../../components/SilverstoneMark';
import { LoadingIndicator } from '../../components/Loader';
import { useAuthStyle } from '../../components/auth/AuthUI';

export default function SplashScreen({ navigation, onDone }) {
  const { colors, isDark, copy } = useAuthStyle();
  useEffect(() => {
    const timer = setTimeout(() => onDone ? onDone() : navigation?.replace('Login'), 1800);
    return () => clearTimeout(timer);
  }, [navigation, onDone]);
  return <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]}>
    <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
    <View style={s.center}>
      <SilverstoneMark color={colors.text} size={64} />
      <Text style={[s.brand, { color: colors.text }]}>SILVERSTONE</Text>
      <Text style={[s.tagline, { color: colors.secondary }]}>{copy('Float through your main-agent.', 'Float kupitia wakala wako mkuu.')}</Text>
    </View>
    <LoadingIndicator label={copy('Opening Silverstone…', 'Inafungua Silverstone…')} />
  </SafeAreaView>;
}
const s = StyleSheet.create({
  root: { flex: 1, padding: 24 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 },
  brand: { fontFamily: fonts.bodySemi, fontSize: 24, letterSpacing: 2 },
  tagline: { fontFamily: fonts.body, fontSize: 15, lineHeight: 24, textAlign: 'center' },
});
