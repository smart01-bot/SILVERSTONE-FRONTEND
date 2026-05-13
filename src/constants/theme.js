// src/constants/theme.js
import { Platform } from 'react-native';

export const LIGHT = {
  bg:           '#FFFFFF',
  surface:      '#FFFFFF',
  surfaceAlt:   '#F6F6F7',
  border:       '#ECECEE',
  text:         '#0F0F10',
  textMid:      '#1A1A1A',
  textDim:      '#6B6B70',
  muted:        '#C4C4C4',
  primary:      '#C8102E',
  primaryLight: '#C8102E14',
  primaryDark:  '#A00D24',
  success:      '#16A34A',
  successSoft:  '#16A34A14',
  warning:      '#F59E0B',
  warningSoft:  '#F59E0B14',
  danger:       '#C8102E',
  dangerSoft:   '#C8102E14',
  info:         '#0891B2',
  infoSoft:     '#0891B214',
};

export const DARK = {
  bg:           '#0B0B0C',
  surface:      '#161618',
  surfaceAlt:   '#1E1E22',
  border:       '#26262B',
  text:         '#F4F4F5',
  textMid:      '#D4D4D4',
  textDim:      '#A1A1A6',
  muted:        '#3A3A3A',
  primary:      '#C8102E',
  primaryLight: '#C8102E24',
  primaryDark:  '#A00D24',
  success:      '#16A34A',
  successSoft:  '#16A34A20',
  warning:      '#F59E0B',
  warningSoft:  '#F59E0B20',
  danger:       '#C8102E',
  dangerSoft:   '#C8102E24',
  info:         '#0891B2',
  infoSoft:     '#0891B224',
};

export const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export const typography = {
  display:  { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  h1:       { fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
  h2:       { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  h3:       { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  h4:       { fontSize: 15, fontWeight: '700' },
  body:     { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyMed:  { fontSize: 15, fontWeight: '500', lineHeight: 22 },
  caption:  { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  capMed:   { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  label:    { fontSize: 12, fontWeight: '500', letterSpacing: 0.3 },
  labelCaps:{ fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  mono:     { fontSize: 15, fontFamily: mono },
  monoLg:   { fontSize: 24, fontWeight: '700', fontFamily: mono, letterSpacing: -0.5 },
  monoXl:   { fontSize: 32, fontWeight: '800', fontFamily: mono, letterSpacing: -1 },
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