// src/constants/networks.js
// Network values MUST match the backend API exactly.
// Use NETWORK_DISPLAY for UI labels, NETWORK_COLORS/TEXT for badges.

export const NETWORKS = ['Vodacom', 'Airtel', 'Halotel', 'Yas'];

// Short display labels shown in the UI
export const NETWORK_DISPLAY = {
  Vodacom: 'Voda',
  Airtel:  'Airtel',
  Halotel: 'Halotel',
  Yas:     'Yas',
};

export const NETWORK_WALLETS = {
  Vodacom: 'M-Pesa',
  Airtel:  'Airtel Money',
  Halotel: 'Halopesa',
  Yas:     'Mixx',
};

export const NETWORK_COLORS = {
  Vodacom: '#E40000',
  Airtel:  '#FFFB14',
  Halotel: '#FF9B17',
  Yas:     '#0070B8',
};

export const NETWORK_TEXT_COLORS = {
  Vodacom: '#fff',
  Airtel:  '#000', // yellow bg needs dark text
  Halotel: '#fff',
  Yas:     '#fff',
};

export const NETWORK_SHORT = {
  Vodacom: 'VOD',
  Airtel:  'AIR',
  Halotel: 'HAL',
  Yas:     'YAS',
};