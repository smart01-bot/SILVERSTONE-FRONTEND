import React from 'react';
import Svg, { Path } from 'react-native-svg';

// The approved offset-wing mark. A single theme colour keeps the small silhouette clear.
export const SWIFT_WINGS = [
  'M16 55C25 39 27 26 44 19C60 12 80 6 100 0C94 21 86 29 74 33C55 39 33 44 16 55Z',
  'M0 79C13 60 23 53 40 47C51 43 65 38 75 35C70 53 64 59 52 63C35 69 17 73 0 79Z',
];
export default function SwiftWakalaMark({ color = '#17191C', size = 32 }) {
  return <Svg width={size} height={size * 0.8} viewBox="0 0 100 80" accessible={false}>
    {SWIFT_WINGS.map((path, index) => <Path key={index} fill={color} d={path} />)}
  </Svg>;
}
