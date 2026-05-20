// src/components/AnimatedInput.jsx
import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts, radius } from '../constants/theme';

/**
 * AnimatedInput — styled TextInput.
 * Focus state drives border colour via plain useState (no Animated drivers).
 * Props match TextInput + label, prefix, wrapStyle, inputStyle, containerStyle, mono.
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
  height = 56,
  mono   = false,
  ...props
}) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = focused ? theme.primary : theme.border;
  const borderWidth = focused ? 2 : 1.5;

  return (
    <View style={[s.wrap, wrapStyle, containerStyle]}>
      {label ? (
        <Text style={[s.label, { color: focused ? theme.primary : theme.textDim }]}>
          {label}
        </Text>
      ) : null}

      <View style={[
        s.box,
        {
          backgroundColor: theme.surfaceAlt,
          borderColor,
          borderWidth,
          height,
        },
      ]}>
        {prefix ? (
          <Text style={[s.prefix, { color: theme.textDim }]}>{prefix}</Text>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          style={[
            s.input,
            { color: theme.text },
            mono && s.inputMono,
            inputStyle,
          ]}
          {...props}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { marginTop: 18 },
  label: { fontSize: 15, fontFamily: fonts.bodySemi, marginBottom: 8, letterSpacing: 0.1 },
  box: {
    flexDirection:     'row',
    alignItems:        'center',
    borderRadius:      14,
    paddingHorizontal: 18,
  },
  prefix:    { fontSize: 19, marginRight: 10, fontFamily: fonts.bodyMed },
  input:     { flex: 1, fontSize: 19, fontFamily: fonts.body },
  inputMono: { fontFamily: fonts.bodyMed },
});