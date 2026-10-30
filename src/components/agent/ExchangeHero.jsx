import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { fonts } from '../../constants/theme';
import { AgentButton, AgentSheet, useAgentUI } from './AgentUI';

export default function ExchangeHero({ onTransfer }) {
  const { colors, copy, reducedMotion } = useAgentUI();
  const focused = useIsFocused();
  const dimensions = useWindowDimensions();
  const [width, setWidth] = useState(Math.max(240, dimensions.width - 48));
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [screenReader, setScreenReader] = useState(true);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [creditInfo, setCreditInfo] = useState(false);
  const pager = useRef(null);
  const scroll = useRef(new Animated.Value(0)).current;
  const auto = !dragging && !screenReader && !reducedMotion && focused && foreground && !creditInfo;
  const slides = [
    { key: 'move', eyebrow: copy('MOVE WITH SWIFT WAKALA', 'HAMISHA NA SWIFT WAKALA'), title: copy('Move float.\nKeep cash flowing.', 'Hamisha float.\nBiashara iendelee.'),
      detail: copy('Send, receive, and keep business moving.', 'Tuma na pokea. Endeleza biashara yako.'), action: copy('Start a transfer', 'Anza kuhamisha'), icon: 'swap-horizontal', gradient: ['#303B49', '#151C25'], onPress: onTransfer },
    { key: 'instant', eyebrow: copy('YOUR NEXT MOVE', 'HATUA YAKO INAYOFUATA'), title: copy('Float, one\ntap away.', 'Float, kwa\nmguso mmoja.'),
      detail: copy('Your next transfer starts with Swift Wakala.', 'Anza uhamisho wako na Swift Wakala.'), action: copy('Transfer float', 'Hamisha float'), icon: 'flash-outline', gradient: ['#243D44', '#12252B'], onPress: onTransfer },
    { key: 'credit', eyebrow: copy('COMING SOON', 'INAKUJA HIVI KARIBUNI'), title: copy('Swift Wakala credit.\nMore possibility.', 'Mkopo wa Swift Wakala.\nFursa zaidi.'),
      detail: copy('A new chapter for your business.', 'Hatua mpya kwa biashara yako.'), action: copy('Discover credit', 'Kuhusu mkopo'), icon: 'sparkles-outline', gradient: ['#3D3549', '#211D2C'], onPress: () => setCreditInfo(true) },
  ];

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isScreenReaderEnabled().then(value => { if (active) setScreenReader(value); }).catch(() => {});
    const reader = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader);
    const app = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => { active = false; reader?.remove(); app.remove(); };
  }, []);

  useEffect(() => {
    pager.current?.scrollTo({ x: index * width, animated: !reducedMotion });
  }, [index, width, reducedMotion]);

  useEffect(() => {
    if (!auto) return undefined;
    const timer = setTimeout(() => setIndex(value => (value + 1) % slides.length), 6500);
    return () => clearTimeout(timer);
  }, [auto, index]);

  const chooseSlide = next => setIndex(next);

  return <View style={s.wrap} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    <Animated.ScrollView ref={pager} testID="home-banners" horizontal pagingEnabled nestedScrollEnabled directionalLockEnabled
      showsHorizontalScrollIndicator={false} scrollEventThrottle={16}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scroll } } }], { useNativeDriver: true })}
      onScrollBeginDrag={() => setDragging(true)}
      onScrollEndDrag={() => setDragging(false)}
      onMomentumScrollEnd={event => setIndex(Math.max(0, Math.min(slides.length - 1, Math.round(event.nativeEvent.contentOffset.x / width))))}
      style={s.pager}>
      {slides.map((slide, position) => <View key={slide.key} style={{ width }} accessibilityElementsHidden={index !== position} importantForAccessibility={index === position ? 'auto' : 'no-hide-descendants'}>
        <LinearGradient colors={slide.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.banner}>
          <Animated.View pointerEvents="none" accessible={false} style={[s.artwork, {
            opacity: reducedMotion ? 0.8 : scroll.interpolate({ inputRange: [(position - 1) * width, position * width, (position + 1) * width], outputRange: [0.2, 0.8, 0.2], extrapolate: 'clamp' }),
            transform: [{ translateX: reducedMotion ? 0 : scroll.interpolate({ inputRange: [(position - 1) * width, position * width, (position + 1) * width], outputRange: [24, 0, -24], extrapolate: 'clamp' }) }],
          }]}>
            <View style={s.orbitOuter} /><View style={s.orbitInner} />
            <View style={s.artIcon}><Ionicons name={slide.icon} size={41} color="#E0E8F2" /></View>
          </Animated.View>
          <View style={s.copy}>
            <Text style={s.eyebrow}>{slide.eyebrow}</Text>
            <Text accessibilityRole="header" style={s.title}>{slide.title}</Text>
            <Text style={s.detail}>{slide.detail}</Text>
          </View>
          <Pressable testID={`banner-action-${position}`} onPress={slide.onPress} accessibilityRole="button" accessibilityLabel={slide.action}
            style={({ pressed }) => [s.action, { opacity: pressed ? 0.65 : 1 }]}>
            <Text style={s.actionText}>{slide.action}</Text><Ionicons name="arrow-forward" size={19} color="#F7FAFF" />
          </Pressable>
        </LinearGradient>
      </View>)}
    </Animated.ScrollView>
    <View style={s.controls}>
      <View style={s.dots}>
        {slides.map((slide, position) => <Pressable key={slide.key} testID={`banner-page-${position}`} onPress={() => chooseSlide(position)} accessibilityRole="button"
          accessibilityLabel={`${copy('Banner', 'Bango')} ${position + 1}: ${slide.title.replace('\n', ' ')}`} accessibilityState={{ selected: index === position }} style={s.dotTarget}>
          <View style={{ width: index === position ? 22 : 6, height: 5, borderRadius: 3, backgroundColor: index === position ? colors.text : colors.border }} />
        </Pressable>)}
      </View>
    </View>
    <AgentSheet visible={creditInfo} onClose={() => setCreditInfo(false)} title={copy('Swift Wakala credit', 'Mkopo wa Swift Wakala')}>
      <Text style={[s.creditLabel, { color: colors.text }]}>{copy('Coming soon', 'Inakuja hivi karibuni')}</Text>
      <Text style={[s.creditBody, { color: colors.secondary }]}>{copy('We’re working on credit features for Swift Wakala agents. Eligibility, limits, and how to apply will be shared when the service launches.', 'Tunaandaa huduma za mikopo kwa mawakala wa Swift Wakala. Vigezo, viwango na jinsi ya kuomba vitatangazwa huduma itakapoanza.')}</Text>
      <AgentButton label={copy('Got it', 'Nimeelewa')} onPress={() => setCreditInfo(false)} />
    </AgentSheet>
  </View>;
}
const s = StyleSheet.create({
  wrap: { marginTop: 12 }, pager: { borderRadius: 24, overflow: 'hidden', flexGrow: 0 },
  banner: { flex: 1, minHeight: 196, padding: 18, borderRadius: 24, justifyContent: 'space-between', overflow: 'hidden' },
  copy: { paddingRight: 62 },
  eyebrow: { fontFamily: fonts.bodySemi, color: '#BAC8D9', fontSize: 10, lineHeight: 16, letterSpacing: 1.1 },
  title: { fontFamily: fonts.heading, color: '#FAFCFF', fontSize: 24, lineHeight: 30, letterSpacing: -0.7, marginTop: 8 },
  detail: { fontFamily: fonts.body, color: '#CBD5E2', fontSize: 13, lineHeight: 19, marginTop: 8 },
  action: { alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  actionText: { fontFamily: fonts.bodySemi, color: '#F7FAFF', fontSize: 14, lineHeight: 21 },
  artwork: { position: 'absolute', right: -8, top: 44, width: 110, height: 150, alignItems: 'center', justifyContent: 'center' },
  orbitOuter: { position: 'absolute', width: 144, height: 144, borderRadius: 72, borderWidth: 1, borderColor: 'rgba(220,235,255,0.12)' },
  orbitInner: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(220,235,255,0.2)' },
  artIcon: { width: 69, height: 69, borderRadius: 24, backgroundColor: 'rgba(220,235,255,0.09)', borderWidth: 1, borderColor: 'rgba(220,235,255,0.2)', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-12deg' }] },
  controls: { flexDirection: 'row', alignItems: 'center', minHeight: 44 }, dots: { flex: 1, flexDirection: 'row' }, dotTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  creditLabel: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 34, marginBottom: 10 },
  creditBody: { fontFamily: fonts.body, fontSize: 16, lineHeight: 25, marginBottom: 24 },
});
