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
      <SilverstoneMark color={colors.text} size={92} />
      <View style={[s.rule,{backgroundColor:colors.strongBorder}]} />
      <Text style={[s.brand, { color: colors.text }]}>SILVERSTONE</Text>
      <Text style={[s.tagline, { color: colors.secondary }]}>{copy('Float through your main-agent.', 'Float kupitia wakala wako mkuu.')}</Text>
    </View>
    <LoadingIndicator label={copy('Opening Silverstone…', 'Inafungua Silverstone…')} />
  </SafeAreaView>;
}
const s = StyleSheet.create({
  root: { flex: 1, padding: 24 }, center: { flex: 1, alignItems: 'flex-start', justifyContent: 'center', gap: 24,paddingHorizontal:12 },
  brand: { fontFamily: fonts.bodySemi, fontSize: 28, letterSpacing: 1 },
  rule: { width:48,height:2,marginTop:8 },
  tagline: { fontFamily: fonts.body, fontSize: 17, lineHeight: 26,maxWidth:260 },
});
