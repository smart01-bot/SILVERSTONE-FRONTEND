import React from 'react';
import { View } from 'react-native';
import { RegistrationFrame, RegistrationText, GlassButton, TextAction } from '../../components/auth/RegistrationUI';
import { useAuthStyle } from '../../components/auth/AuthUI';

export default function Step2OTP({ navigation, route }) {
  const { copy } = useAuthStyle();
  return <RegistrationFrame step={2} onBack={() => navigation.goBack()} title={copy('Verify your number', 'Thibitisha namba yako')}
    description={route.params?.phone} footer={<>
      <RegistrationText>{copy('Verification is required before submission.', 'Uthibitisho unahitajika kabla ya kutuma ombi.')}</RegistrationText>
      <GlassButton label={copy('Continue with draft', 'Endelea na rasimu')} onPress={() => navigation.navigate('Step3Personal', route.params)} />
    </>}>
    <View style={{ paddingVertical: 24 }}><RegistrationText>{copy('SMS verification is unavailable. No code has been sent.', 'Uthibitisho wa SMS haupatikani. Hakuna msimbo uliotumwa.')}</RegistrationText></View>
    <TextAction label={copy('Change number', 'Badili namba')} onPress={() => navigation.goBack()} />
  </RegistrationFrame>;
}
