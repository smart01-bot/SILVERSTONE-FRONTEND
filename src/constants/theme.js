// src/constants/theme.js
import { Platform } from 'react-native';

// ─── LIGHT ────────────────────────────────────────────────────────────────────
export const LIGHT = {
  bg:            '#FFFFFF',
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

// ─── DARK — pure black ────────────────────────────────────────────────────────
export const DARK = {
  bg:            '#000000',
  surface:       '#0D0D0D',
  surfaceAlt:    '#141414',
  surfaceElev:   '#1C1C1C',
  border:        '#2A2A2A',
  borderStrong:  '#3A3A3A',

  text:          '#F0F0F0',
  textMid:       '#C0C0C0',
  textDim:       '#707070',
  muted:         '#303030',

  primary:       '#E01535',
  primaryLight:  '#C8102E28',
  primaryDark:   '#960B22',
  primaryBright: '#FF1A3D',

  gradPrimA:     '#E01535',
  gradPrimB:     '#960B22',
  gradSurfA:     '#141414',
  gradSurfB:     '#0D0D0D',

  success:       '#22C55E',
  successSoft:   '#22C55E22',
  warning:       '#FBBF24',
  warningSoft:   '#FBBF2422',
  danger:        '#E01535',
  dangerSoft:    '#E0153526',
  info:          '#22D3EE',
  infoSoft:      '#22D3EE22',

  shadow:        'rgba(0,0,0,0.5)',
  shadowMd:      'rgba(0,0,0,0.75)',
};

// ─── TYPOGRAPHY ───────────────────────────────────────────────────────────────
export const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export const typography = {
  display:   { fontSize: 48, fontWeight: '800', letterSpacing: -1.2 },
  h1:        { fontSize: 38, fontWeight: '800', letterSpacing: -0.9 },
  h2:        { fontSize: 32, fontWeight: '700', letterSpacing: -0.6 },
  h3:        { fontSize: 27, fontWeight: '700', letterSpacing: -0.3 },
  h4:        { fontSize: 22, fontWeight: '700' },
  body:      { fontSize: 20, fontWeight: '400', lineHeight: 30 },
  bodyMed:   { fontSize: 20, fontWeight: '500', lineHeight: 30 },
  caption:   { fontSize: 17, fontWeight: '400', lineHeight: 26 },
  capMed:    { fontSize: 17, fontWeight: '500', lineHeight: 26 },
  label:     { fontSize: 16, fontWeight: '500', letterSpacing: 0.3 },
  labelCaps: { fontSize: 14, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  mono:      { fontSize: 20, fontFamily: mono },
  monoLg:    { fontSize: 38, fontWeight: '700', fontFamily: mono, letterSpacing: -0.5 },
  monoXl:    { fontSize: 52, fontWeight: '800', fontFamily: mono, letterSpacing: -1 },
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  full: 9999,
};

// ─── FONT FAMILIES ────────────────────────────────────────────────────────────
export const fonts = {
  display:   'Manrope_800ExtraBold',
  heading:   'Manrope_700Bold',
  body:      'Inter_400Regular',
  bodyMed:   'Inter_500Medium',
  bodySemi:  'Inter_600SemiBold',
  bodyBold:  'Inter_700Bold',
  bodyXBold: 'Inter_800ExtraBold',
};
