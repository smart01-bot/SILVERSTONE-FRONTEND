import React, { useState } from 'react';
import { RegistrationFrame, GlassField, GlassButton, TextAction, RegistrationText } from '../../components/auth/RegistrationUI';
import { useAuthStyle } from '../../components/auth/AuthUI';

export default function Step1Phone({ navigation, route }) {
  const { copy } = useAuthStyle();
  const [phone, setPhone] = useState((route.params?.phone || '').replace(/^\+255/, ''));
  const digits = phone.replace(/\D/g, '').slice(0, 9);
  function next() {
    if (digits.length === 9) navigation.navigate('Step2OTP', { ...route.params, phone: `+255${digits}` });
  }
  return <RegistrationFrame step={1} onBack={() => navigation.goBack()} title={copy('Your number', 'Namba yako')}
    description={copy('Start your sub-agent application.', 'Anza ombi lako la uwakala.')}
    footer={<><RegistrationText>{copy('SMS unavailable · Draft only', 'SMS hazipatikani · Rasimu tu')}</RegistrationText>
      <GlassButton label={copy('Continue with draft', 'Endelea na rasimu')} disabled={digits.length !== 9} onPress={next} />
      <TextAction label={copy('Already registered? Sign in', 'Umesajiliwa? Ingia')} onPress={() => navigation.navigate('Login')} /></>}>
    <GlassField label={copy('Mobile number', 'Namba ya simu')} prefix="+255" value={digits.replace(/(\d{3})(?=\d)/g, '$1 ')}
      onChangeText={value => setPhone(value.replace(/\D/g, '').slice(0, 9))} keyboardType="phone-pad" autoComplete="tel-national" maxLength={11}
      placeholder="7XX XXX XXX" returnKeyType="next" onSubmitEditing={next} />
  </RegistrationFrame>;
}
