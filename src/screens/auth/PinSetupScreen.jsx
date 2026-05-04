import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import PinPad from '../../components/PinPad';

export default function PinSetupScreen({ navigation }) {
  const { savePin, profile } = useAuth();
  const { theme, tr } = useTheme();
  const [stage, setStage]       = useState('create');  // create | confirm
  const [firstPin, setFirstPin] = useState('');
  const [error, setError]       = useState('');

  const handlePin = async (pin) => {
    setError('');
    if (stage === 'create') {
      setFirstPin(pin);
      setStage('confirm');
      return;
    }
    // Confirm stage
    if (pin !== firstPin) {
      setError(tr('pinMismatch'));
      setStage('create');
      setFirstPin('');
      return;
    }
    try {
      await savePin(pin);
      navigation.replace('App');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.inner}>
        <Text style={[styles.brand, { color: theme.primary }]}>Silverstone</Text>
        <Text style={[styles.title, { color: theme.text }]}>
          {stage === 'create' ? tr('createPin') : tr('confirmPin')}
        </Text>
        <Text style={[styles.desc, { color: theme.textDim }]}>
          {stage === 'create' ? tr('createPinDesc') : `Hi ${profile?.name?.split(' ')[0]}, re-enter your PIN`}
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PinPad length={6} onComplete={handlePin} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1 },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 24 },
  brand: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  desc:  { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  error: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
});