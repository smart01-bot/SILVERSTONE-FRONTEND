import React from 'react';
import Svg, { Path } from 'react-native-svg';

export default function SilverstoneMark({ color, size = 28 }) {
  return <Svg width={size} height={size * 31 / 28} viewBox="0 0 28 31" accessible={false}>
    <Path fill={color} d="M14 1 27 8.5 22 11.4 14 6.8 6 11.4 22 20.6 22 15.9 27 18.8 27 23.1 14 30.6 1 23.1 1 17.3 14 24.8 19 21.9 1 11.5 1 8.5Z" />
    <Path fill={color} d="M8 13.7 13 10.8 27 18.9 22 21.8Z" />
  </Svg>;
}
