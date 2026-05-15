// src/constants/theme.js
import { Platform } from 'react-native';

// ─── LIGHT ────────────────────────────────────────────────────────────────────
export const LIGHT = {
  bg:            '#F7F7FA',          // warm off-white — not blinding white
  surface:       '#FFFFFF',
  surfaceAlt:    '#EEEEF5',          // clearly distinct layer
  surfaceElev:   '#FFFFFF',          // elevated cards (shadow adds depth)
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

  // Gradient anchors
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
  bg:            '#07070E',          // deep blue-black
  surface:       '#0E0E1C',
  surfaceAlt:    '#16162A',
  surfaceElev:   '#1E1E35',
  border:        '#24243C',
  borderStrong:  '#38385A',

  text:          '#EEEEF8',
  textMid:       '#C4C4DC',
  textDim:       '#7474A0',
  muted:         '#32324A',

  primary:       '#E01535',          // brighter for dark contrast
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

// ─── TYPOGRAPHY — ~90% bump across the board ──────────────────────────────────
export const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export const typography = {
  display:   { fontSize: 48, fontWeight: '800', letterSpacing: -1.2 },  // was 30
  h1:        { fontSize: 38, fontWeight: '800', letterSpacing: -0.9 },  // was 24
  h2:        { fontSize: 32, fontWeight: '700', letterSpacing: -0.6 },  // was 20
  h3:        { fontSize: 27, fontWeight: '700', letterSpacing: -0.3 },  // was 17
  h4:        { fontSize: 22, fontWeight: '700' },                        // was 15
  body:      { fontSize: 20, fontWeight: '400', lineHeight: 30 },       // was 15
  bodyMed:   { fontSize: 20, fontWeight: '500', lineHeight: 30 },       // was 15
  caption:   { fontSize: 17, fontWeight: '400', lineHeight: 26 },       // was 13
  capMed:    { fontSize: 17, fontWeight: '500', lineHeight: 26 },       // was 13
  label:     { fontSize: 16, fontWeight: '500', letterSpacing: 0.3 },   // was 12
  labelCaps: { fontSize: 14, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }, // was 11
  mono:      { fontSize: 20, fontFamily: mono },                         // was 15
  monoLg:    { fontSize: 38, fontWeight: '700', fontFamily: mono, letterSpacing: -0.5 }, // was 24
  monoXl:    { fontSize: 52, fontWeight: '800', fontFamily: mono, letterSpacing: -1 },   // was 32
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
