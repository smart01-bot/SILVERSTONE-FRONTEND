import { Platform } from 'react-native';

export const typography = {
  display:       { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, lineHeight: 38 },
  h1:            { fontSize: 26, fontWeight: '700', letterSpacing: -0.3, lineHeight: 32 },
  h2:            { fontSize: 22, fontWeight: '700', letterSpacing: -0.2, lineHeight: 28 },
  h3:            { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  h4:            { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  body:          { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyMedium:    { fontSize: 15, fontWeight: '500', lineHeight: 22 },
  caption:       { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  captionMedium: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  label:         { fontSize: 12, fontWeight: '500', letterSpacing: 0.3, lineHeight: 16 },
  labelCaps:     { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', lineHeight: 16 },
  mono: {
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    lineHeight: 22,
  },
  monoLarge: {
    fontSize: 28, fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: -0.5, lineHeight: 34,
  },
  monoDisplay: {
    fontSize: 36, fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: -1, lineHeight: 42,
  },
};
