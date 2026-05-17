// src/components/AnimatedInput.jsx
import React, { useRef, useState } from 'react';
import { TextInput, Animated, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts }    from '../constants/theme';

/**
 * AnimatedInput — styled TextInput with:
 *   - Animated border colour on focus (dim → primary)
 *   - Subtle scale-up on focus
 *   - Label colour follows focus state
 *   - Optional prefix text (e.g. "TZS")
 *
 * Props match TextInput + label, prefix, wrapStyle, containerStyle, mono.
 */
export default function AnimatedInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType    = 'default',
  secureTextEntry = false,
  prefix,
  wrapStyle,
  containerStyle,
  inputStyle,
  mono = false,
  height = 56,
  ...props
}) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(1)).current;

  const animate = (toFocus) => {
    // border colour — non-native driver
    Animated.timing(borderAnim, {
      toValue:         toFocus ? 1 : 0,
      duration:        200,
      useNativeDriver: false,
    }).start();
    // scale — native driver
    Animated.spring(scaleAnim, {
      toValue:         toFocus ? 1.012 : 1,
      useNativeDriver: true,
      tension:         300,
      friction:        10,
    }).start();
  };

  const onFocus = () => { setFocused(true);  animate(true);  };
  const onBlur  = () => { setFocused(false); animate(false); };

  const borderColor = borderAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [theme.border, theme.primary],
  });

  return (
    <Animated.View style={[s.wrap, wrapStyle, containerStyle, { transform: [{ scale: scaleAnim }] }]}>
      {label ? (
        <Text style={[s.label, { color: focused ? theme.primary : theme.textDim }]}>
          {label}
        </Text>
      ) : null}
      <Animated.View style={[s.box, {
        backgroundColor: theme.surfaceAlt,
        borderColor,
        borderWidth: focused ? 2 : 1.5,
        height,
      }]}>
        {prefix ? (
          <Text style={[s.prefix, { color: theme.textDim }]}>{prefix}</Text>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          style={[s.input, { color: theme.text }, mono && { fontFamily: 'RobotoMono_400Regular' }, inputStyle]}
          {...props}
        />
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap:   { marginTop: 18 },
  label:  { fontSize: 15, fontFamily: fonts.bodySemi, marginBottom: 8, letterSpacing: 0.1 },
  box: {
    flexDirection:     'row',
    alignItems:        'center',
    borderRadius:      14,
    paddingHorizontal: 18,
    overflow:          'hidden',
  },
  prefix: { fontSize: 19, marginRight: 10, fontFamily: fonts.bodyMed },
  input:  { flex: 1, fontSize: 19, fontFamily: fonts.body },
});