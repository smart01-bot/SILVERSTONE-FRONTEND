export const COLORS = {
  primary:      '#FFA500',
  primaryDark:  '#E6940A',
  primaryLight: '#FFF3E0',

  // Networks
  vodacom: '#E40000',
  yas:     '#7B2FBE',
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
  bg:          '#F4F4F4',
  surface:     '#FFFFFF',
  surfaceAlt:  '#F7F7F7',
  border:      '#EBEBEB',
  text:        '#0A0A0A',
  textMid:     '#1A1A1A',
  textDim:     '#666666',
  muted:       '#C4C4C4',
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  heroShadow: {
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  ...COLORS,
};

export const DARK = {
  bg:          '#0A0A0A',
  surface:     '#141414',
  surfaceAlt:  '#1C1C1C',
  border:      '#2A2A2A',
  text:        '#F5F5F5',
  textMid:     '#D4D4D4',
  textDim:     '#909090',
  muted:       '#333333',
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  heroShadow: {
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  ...COLORS,
};

export const FONT = {
  regular:  undefined, // system default (SF Pro / Roboto)
  medium:   undefined,
  bold:     undefined,
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