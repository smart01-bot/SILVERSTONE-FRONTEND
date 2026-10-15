import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAgentUI } from './AgentUI';

// Keep the supplied artwork intact. Further providers can add their own assets here.
const LOGOS = {
  Voda: require('../../../assets/images/networks/mpesa.jpg'),
  Yas: require('../../../assets/images/networks/mixx.png'),
  Airtel: require('../../../assets/images/networks/airtel-money.jpg'),
  Halotel: require('../../../assets/images/networks/halopesa.jpg'),
};

// Decorative: the adjoining account/picker text supplies the accessible network name.
export default function NetworkLogo({ network, size = 48 }) {
  const { colors } = useAgentUI();
  const source = LOGOS[network];
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[s.logo, { width: size, height: size, backgroundColor: source ? 'transparent' : colors.selected }]}>
    {source ? <Image testID={`network-logo-${network}`} source={source} resizeMode="contain" accessible={false}
      style={{ width: size, height: size }} />
      : <Ionicons name="wallet-outline" size={24} color={colors.secondary} />}
  </View>;
}

const s = StyleSheet.create({
  logo: { flexShrink: 0, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
});
