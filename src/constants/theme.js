// src/constants/theme.js
import { Platform } from 'react-native';

// ─── FONT FAMILIES (requires @expo-google-fonts/inter + manrope installed) ────
export const fonts = {
  display:   'Manrope_800ExtraBold',
  heading:   'Manrope_700Bold',
  body:      'Inter_400Regular',
  bodyMed:   'Inter_500Medium',
  bodySemi:  'Inter_600SemiBold',
  bodyBold:  'Inter_700Bold',
  bodyXBold: 'Inter_800ExtraBold',
};

// ─── LIGHT ────────────────────────────────────────────────────────────────────
export const LIGHT = {
  bg:            '#F7F7FA',
  surface:       '#FFFFFF',
  surfaceAlt:    '#EEEEF5',
  surfaceElev:   '#FFFFFF',
  border:        '#DCDCE8',
  borderStrong:  '#B8B8CC',

  text:          '#0A0A12',
  textMid:       '#1A1A2A',
  textDim:       '#60606E',
  muted:         '#B0B0C0',

  primary:       '#C8102E',
  primaryLight:  '#C8102E1A',
  primaryDark:   '#960B22',
  primaryBright: '#E01535',

  gradPrimA:     '#E01535',
  gradPrimB:     '#960B22',
  gradSurfA:     '#F2F2FA',
  gradSurfB:     '#E8E8F2',

  success:       '#15803D',
  successSoft:   '#15803D1A',
  warning:       '#D97706',
  warningSoft:   '#D977061A',
  danger:        '#C8102E',
  dangerSoft:    '#C8102E1A',
  info:          '#0369A1',
  infoSoft:      '#0369A11A',

  shadow:        'rgba(10,10,30,0.07)',
  shadowMd:      'rgba(10,10,30,0.13)',
};

// ─── DARK ─────────────────────────────────────────────────────────────────────
export const DARK = {
  bg:            '#07070E',
  surface:       '#0E0E1C',
  surfaceAlt:    '#16162A',
  surfaceElev:   '#1E1E35',
  border:        '#24243C',
  borderStrong:  '#38385A',

  text:          '#EEEEF8',
  textMid:       '#C4C4DC',
  textDim:       '#7474A0',
  muted:         '#32324A',

  primary:       '#E01535',
  primaryLight:  '#C8102E28',
  primaryDark:   '#960B22',
  primaryBright: '#FF1A3D',

  gradPrimA:     '#E01535',
  gradPrimB:     '#960B22',
  gradSurfA:     '#16162A',
  gradSurfB:     '#0E0E1C',

  success:       '#22C55E',
  successSoft:   '#22C55E22',
  warning:       '#FBBF24',
  warningSoft:   '#FBBF2422',
  danger:        '#E01535',
  dangerSoft:    '#E0153526',
  info:          '#22D3EE',
  infoSoft:      '#22D3EE22',

  shadow:        'rgba(0,0,0,0.35)',
  shadowMd:      'rgba(0,0,0,0.55)',
};

// ─── TYPOGRAPHY ───────────────────────────────────────────────────────────────
export const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export const typography = {
  display:   { fontSize: 48, fontFamily: fonts.display,   letterSpacing: -1.2 },
  h1:        { fontSize: 38, fontFamily: fonts.display,   letterSpacing: -0.9 },
  h2:        { fontSize: 32, fontFamily: fonts.heading,   letterSpacing: -0.6 },
  h3:        { fontSize: 27, fontFamily: fonts.heading,   letterSpacing: -0.3 },
  h4:        { fontSize: 22, fontFamily: fonts.heading },
  body:      { fontSize: 20, fontFamily: fonts.body,      lineHeight: 30 },
  bodyMed:   { fontSize: 20, fontFamily: fonts.bodyMed,   lineHeight: 30 },
  caption:   { fontSize: 17, fontFamily: fonts.body,      lineHeight: 26 },
  capMed:    { fontSize: 17, fontFamily: fonts.bodyMed,   lineHeight: 26 },
  label:     { fontSize: 16, fontFamily: fonts.bodySemi,  letterSpacing: 0.3 },
  labelCaps: { fontSize: 14, fontFamily: fonts.bodyBold,  letterSpacing: 0.8, textTransform: 'uppercase' },
  mono:      { fontSize: 20, fontFamily: mono },
  monoLg:    { fontSize: 38, fontFamily: mono, letterSpacing: -0.5 },
  monoXl:    { fontSize: 52, fontFamily: mono, letterSpacing: -1 },
};

// ─── SPACING (base-8) ─────────────────────────────────────────────────────────
export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

// ─── RADIUS ───────────────────────────────────────────────────────────────────
export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  full: 9999,
};

// ─── SHADOW HELPER ────────────────────────────────────────────────────────────
// Usage: ...shadow(theme.shadow, 12)
export const shadow = (color = 'rgba(0,0,0,0.12)', size = 8) =>
  Platform.select({
    ios: {
      shadowColor:   color,
      shadowOffset:  { width: 0, height: size * 0.4 },
      shadowOpacity: 1,
      shadowRadius:  size,
    },
    android: { elevation: Math.round(size * 0.8) },
  });
