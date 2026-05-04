// src/constants/theme.js
export const COLORS = {
  primary:      '#D32F2F',
  primaryDark:  '#B71C1C',
  primaryLight: '#FFEBEE',

  // Networks
  voda:    '#E40000',
  yas:     '#0070B8',
  airtel:  '#3D3D3D',
  halotel: '#D4A017',

  // Status
  success:      '#16A34A',
  successLight: '#DCFCE7',
  info:         '#0891B2',
  infoLight:    '#E0F2FE',
  warning:      '#F59E0B',
  warningLight: '#FEF3C7',
  danger:       '#DC2626',
  dangerLight:  '#FEE2E2',
};

export const LIGHT = {
  bg:          '#FFFFFF',
  surface:     '#FFFFFF',
  surfaceAlt:  '#F7F7F7',
  border:      '#EBEBEB',
  text:        '#0A0A0A',
  textMid:     '#1A1A1A',
  textDim:     '#555555',
  muted:       '#C4C4C4',

  // Semantic aliases used in screens
  primary:      '#D32F2F',
  primaryDark:  '#B71C1C',
  primaryLight: '#FFEBEE',
  red:          '#D32F2F',
  redLight:     '#FFEBEE',
  green:        '#16A34A',
  greenLight:   '#DCFCE7',
  teal:         '#0891B2',
  tealLight:    '#E0F2FE',
  amber:        '#F59E0B',

  heroGradStart: '#D32F2F',
  heroGradEnd:   '#B71C1C',

  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  heroShadow: {
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
};

export const DARK = {
  bg:          '#000000',
  surface:     '#0D0D0D',
  surfaceAlt:  '#161616',
  border:      '#222222',
  text:        '#F5F5F5',
  textMid:     '#D4D4D4',
  textDim:     '#909090',
  muted:       '#222222',

  // Semantic aliases
  primary:      '#EF5350',
  primaryDark:  '#D32F2F',
  primaryLight: '#1C0000',
  red:          '#EF5350',
  redLight:     '#1C0000',
  green:        '#22C55E',
  greenLight:   '#052E16',
  teal:         '#06B6D4',
  tealLight:    '#083344',
  amber:        '#F59E0B',

  heroGradStart: '#1C0000',
  heroGradEnd:   '#2C0000',

  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  heroShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const typography = {
  h1:    { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  h2:    { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  h3:    { fontSize: 18, fontWeight: '700' },
  h4:    { fontSize: 16, fontWeight: '600' },
  body:  { fontSize: 15, fontWeight: '400' },
  bodyS: { fontSize: 13, fontWeight: '400' },
  label: { fontSize: 12, fontWeight: '500', letterSpacing: 0.3 },
  mono:  { fontSize: 13, fontFamily: 'Courier New' },
  monoL: { fontSize: 20, fontFamily: 'Courier New', fontWeight: '700' },
  monoXL:{ fontSize: 28, fontFamily: 'Courier New', fontWeight: '700' },
};
