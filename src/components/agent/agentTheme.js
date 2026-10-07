// These tokens belong to the post-login sub-agent UI only.
// Auth and main-agent surfaces continue to use constants/theme.js.
export const AGENT_LIGHT = Object.freeze({
  bg: '#C4C7CB', text: '#16191D', secondary: '#454B53', muted: '#49515A',
  surface: '#F4F5F6', border: '#A6ABB1', strongBorder: '#797F87',
  action: '#202428', actionText: '#FFFFFF', danger: '#962E35',
  glass: 'rgba(245,247,249,0.36)', glassBorder: 'rgba(255,255,255,0.88)',
  selected: 'rgba(255,255,255,0.57)', scrim: 'rgba(0,0,0,0.28)',
});

export const AGENT_DARK = Object.freeze({
  bg: '#000000', text: '#F5F5F5', secondary: '#B8BCC1', muted: '#A1A7AF',
  surface: '#181A1D', border: '#303438', strongBorder: '#697079',
  action: '#F4F5F6', actionText: '#111315', danger: '#FFB0B5',
  glass: 'rgba(22,24,27,0.68)', glassBorder: 'rgba(220,225,232,0.52)',
  selected: 'rgba(235,240,247,0.14)', scrim: 'rgba(0,0,0,0.62)',
});

export const agentColors = dark => dark ? AGENT_DARK : AGENT_LIGHT;

// Model detection changes only the silhouette, never theme or navigation mode.
// Android exposes its actual model through Platform.constants.Model.
export const isBoxyAgentDevice = model => /(?:SM-S908|Galaxy S22 Ultra)/i.test(model || '');

export const AGENT_TABS = Object.freeze([
  { name: 'Home', en: 'Home', sw: 'Nyumbani', icon: 'home-outline' },
  { name: 'NewRequest', en: 'Requests', sw: 'Maombi', icon: 'swap-horizontal-outline' },
  { name: 'MyRequests', en: 'History', sw: 'Historia', icon: 'reader-outline' },
  { name: 'Profile', en: 'Profile', sw: 'Wasifu', icon: 'person-outline' },
]);
