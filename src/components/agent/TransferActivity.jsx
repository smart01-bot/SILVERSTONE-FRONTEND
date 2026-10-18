import { WingLoader } from '../Loader';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { fonts } from '../../constants/theme';
import { useAgentUI } from './AgentUI';
import { activityDate, amountRatio, formatActivityAmount, transferActivity } from './activitySummary';

function axisAmount(amount) {
  const divisor = amount >= 1000000000n ? 1000000000n : amount >= 1000000n ? 1000000n : amount >= 1000n ? 1000n : 1n;
  const suffix = divisor === 1000000000n ? 'B' : divisor === 1000000n ? 'M' : divisor === 1000n ? 'K' : '';
  const tenth = amount * 10n / divisor;
  return `${tenth / 10n}${tenth % 10n ? `.${tenth % 10n}` : ''}${suffix}`;
}

export default function TransferActivity({ requests, loading, error }) {
  const { colors, isDark, lang, copy, reducedMotion, reducedTransparency } = useAgentUI();
  const [days, setDays] = useState(7);
  const [selected, setSelected] = useState(null);
  const [width, setWidth] = useState(300);
  const activity = useMemo(() => transferActivity(requests, { days }), [requests, days]);
  const fade = useRef(new Animated.Value(1)).current;
  const unavailable = loading || (Boolean(error) && requests.length === 0);
  const ink = isDark ? '#9AD6DC' : '#266D78';
  const plotTop = 12, plotBottom = 116, inset = 9;
  const plotWidth = Math.max(1, width - inset * 2);
  const point = i => ({ x: inset + i * plotWidth / (days - 1), y: plotBottom - amountRatio(activity.buckets[i].amount, activity.max) * (plotBottom - plotTop) });
  const points = activity.buckets.map((_, i) => point(i));
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  const area = `${line} L${points[points.length - 1].x},${plotBottom} L${points[0].x},${plotBottom} Z`;
  const chosen = selected === null ? null : activity.buckets[selected];
  const chosenPoint = selected === null ? null : points[selected];
  const dateLabel = chosen ? activityDate(chosen.timestamp, lang) : `${activityDate(activity.buckets[0].timestamp, lang)} – ${activityDate(activity.buckets[days - 1].timestamp, lang)}`;
  const chosenText = chosen ? `${activityDate(chosen.timestamp, lang)} · TZS ${formatActivityAmount(chosen.amount)} · ${chosen.count} ${copy('transfers', 'miamala')}` : '';
  const axisIndices = days === 7 ? [0, 1, 2, 3, 4, 5, 6] : [0, 7, 14, 21, 29];

  useEffect(() => {
    if (reducedMotion) { fade.setValue(1); return; }
    fade.setValue(0.35);
    const animation = Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [days, loading, reducedMotion, fade]);

  const choosePeriod = value => { setSelected(null); setDays(value); };
  const selectDay = event => {
    const x = Platform.OS === 'web'
      ? event.nativeEvent.clientX - event.currentTarget.getBoundingClientRect().left
      : event.nativeEvent.locationX;
    if (Number.isFinite(x)) setSelected(Math.max(0, Math.min(days - 1, Math.round((x - inset) / plotWidth * (days - 1)))));
  };
  const moveSelection = delta => setSelected(value => Math.max(0, Math.min(days - 1, (value ?? days - 1) + delta)));

  return <View testID="transfer-activity" style={[s.section, {
    borderColor: colors.glassBorder,
    backgroundColor: reducedTransparency ? colors.surface : colors.glass,
  }]}>
    {Platform.OS === 'ios' && !reducedTransparency && (
      <BlurView intensity={18} tint={isDark ? 'dark' : 'light'} pointerEvents="none" style={StyleSheet.absoluteFill} />
    )}
    <View style={s.heading}>
      <Text accessibilityRole="header" style={[s.headingText, { color: colors.text }]}>{copy('Transfer activity', 'Miamala yako')}</Text>
      <View style={[s.periods, { borderColor: colors.border }]}>
        {[7, 30].map(value => <Pressable key={value} testID={`activity-period-${value}`} onPress={() => choosePeriod(value)} accessibilityRole="button"
          accessibilityLabel={copy(`Last ${value} days`, `Siku ${value} zilizopita`)} accessibilityState={{ selected: days === value }}
          style={[s.period, { backgroundColor: days === value ? colors.text : 'transparent' }]}>
          <Text style={[s.periodText, { color: days === value ? colors.bg : colors.secondary }]}>{value}{copy('D', 'S')}</Text>
        </Pressable>)}
      </View>
    </View>
    <Text style={[s.totalLabel, { color: colors.secondary }]}>{copy('Amount transferred', 'Kiasi kilichohamishwa')}</Text>
    <View style={s.amountRow}>
      <Text style={[s.currency, { color: colors.secondary }]}>TZS</Text>
      <Text testID="activity-total" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5} style={[s.amount, { color: colors.text }]}>{unavailable ? '—' : formatActivityAmount(activity.total)}</Text>
    </View>
    <View style={s.summary}>
      <Text testID="activity-count" style={[s.summaryText, { color: colors.secondary }]}>{unavailable
        ? copy('Waiting for transfer history', 'Inasubiri historia ya miamala')
        : copy(`${activity.count} completed transfer${activity.count === 1 ? '' : 's'}`, `Miamala ${activity.count} iliyokamilika`)}</Text>
      <Text style={[s.summaryText, { color: colors.secondary }]}>{activityDate(activity.buckets[0].timestamp, lang)} – {activityDate(activity.buckets[days - 1].timestamp, lang)}</Text>
    </View>

    <Animated.View style={{ opacity: fade }} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      <View style={s.chartCaption}>
        <Text testID="activity-day" accessibilityLiveRegion="polite" style={[s.dayText, { color: colors.secondary }]}>{unavailable ? '' : chosenText || copy('Daily transfer amount', 'Kiasi kwa siku')}</Text>
        {!unavailable && activity.max > 0n ? <Text style={[s.axisMaximum, { color: colors.secondary }]}>{axisAmount(activity.max)}</Text> : null}
      </View>
      <Pressable testID="activity-chart" accessibilityRole="adjustable" disabled={unavailable}
        accessibilityLabel={copy('Daily completed transfer amounts', 'Kiasi cha miamala iliyokamilika kwa siku')}
        accessibilityHint={copy('Select a day to see its amount.', 'Chagua siku kuona kiasi chake.')}
        accessibilityValue={{ min: 0, max: days - 1, now: selected ?? days - 1, text: chosenText || dateLabel }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={event => moveSelection(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
        onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); moveSelection(event.key === 'ArrowRight' ? 1 : -1); } }}
        onPress={selectDay}>
        <Svg width={width} height={128} accessible={false} pointerEvents="none">
          <Defs><LinearGradient id="activity-fill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={ink} stopOpacity="0.2" /><Stop offset="1" stopColor={ink} stopOpacity="0" />
          </LinearGradient></Defs>
          {[plotTop, (plotTop + plotBottom) / 2, plotBottom].map(y => <Line key={y} x1="0" y1={y} x2={width} y2={y} stroke={colors.border} strokeWidth="1" strokeDasharray={y === plotBottom ? undefined : '3 6'} />)}
          {!unavailable && activity.max > 0n ? <>
            <Path d={area} fill="url(#activity-fill)" />
            <Path d={line} stroke={ink} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
            {chosenPoint ? <>
              <Line x1={chosenPoint.x} y1="0" x2={chosenPoint.x} y2={plotBottom} stroke={colors.secondary} strokeDasharray="3 4" strokeWidth="1" />
              <Circle cx={chosenPoint.x} cy={chosenPoint.y} r="5" fill={ink} stroke={colors.bg} strokeWidth="2" />
            </> : null}
          </> : null}
        </Svg>
        {unavailable || activity.count === 0 ? <View pointerEvents="none" style={s.chartState}>
          {loading ? <WingLoader color={colors.secondary} /> : null}
          <Text style={[s.stateText, { color: colors.secondary, backgroundColor: colors.bg }]}>{loading ? copy('Loading activity…', 'Inapakia miamala…') : unavailable
            ? copy('Activity unavailable. Try refreshing.', 'Miamala haijapatikana. Jaribu kupakia tena.')
            : copy('Completed transfers will appear here.', 'Miamala iliyokamilika itaonekana hapa.')}</Text>
        </View> : null}
      </Pressable>
      <View style={s.axisLabels}>
        {axisIndices.map(i => <Text key={i} style={[s.axisLabel, { color: colors.secondary }]}>{activityDate(activity.buckets[i].timestamp, lang, days === 7)}</Text>)}
      </View>
    </Animated.View>
    {error && requests.length > 0 ? <Text style={[s.note, { color: colors.secondary }]}>{copy('Showing previously loaded activity.', 'Inaonyesha miamala iliyopakiwa awali.')}</Text> : null}
    {!unavailable && activity.omitted > 0 ? <Text style={[s.note, { color: colors.secondary }]}>{copy(`${activity.omitted} completed transfer(s) have incomplete details and are excluded.`, `Miamala ${activity.omitted} yenye taarifa pungufu haijajumuishwa.`)}</Text> : null}
  </View>;
}

const s = StyleSheet.create({
  section: { marginTop: 12, padding: 16, borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' }, heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  headingText: { fontFamily: fonts.bodySemi, fontSize: 19, lineHeight: 27 },
  periods: { flexDirection: 'row', padding: 3, borderWidth: StyleSheet.hairlineWidth, borderRadius: 15 },
  period: { minWidth: 44, minHeight: 44, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  periodText: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 18 },
  totalLabel: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20, marginTop: 14 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 3 },
  currency: { fontFamily: fonts.bodyMed, fontSize: 17, lineHeight: 26 },
  amount: { flex: 1, fontFamily: fonts.heading, fontSize: 35, lineHeight: 45, letterSpacing: -1.2 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 7 },
  summaryText: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
  chartCaption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 28, gap: 8, marginTop: 6 },
  dayText: { flex: 1, fontFamily: fonts.body, fontSize: 11, lineHeight: 17 }, axisMaximum: { fontFamily: fonts.bodyMed, fontSize: 11, lineHeight: 17 },
  axisLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 1 }, axisLabel: { fontFamily: fonts.body, fontSize: 11, lineHeight: 17 },
  chartState: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 10 },
  stateText: { padding: 8, maxWidth: '85%', textAlign: 'center', fontFamily: fonts.body, fontSize: 13, lineHeight: 20 },
  note: { fontFamily: fonts.body, fontSize: 12, lineHeight: 19, marginTop: 10 },
});
