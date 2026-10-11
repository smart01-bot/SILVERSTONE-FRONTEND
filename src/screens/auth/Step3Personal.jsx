import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../config/api';
import { saveDraft, syncWizard } from '../../api/onboarding';
import { workflowError } from '../../api/workflowState';
import { RegistrationFrame, GlassField, GlassButton, RegistrationText } from '../../components/auth/RegistrationUI';
import { useAuthStyle } from '../../components/auth/AuthUI';

export default function Step3Personal({ navigation, route }) {
  const { user, register } = useAuth();
  const { copy } = useAuthStyle();
  const p = route.params || {};
  const [name, setName] = useState(p.name || '');
  const [email, setEmail] = useState(p.email || '');
  const [nida, setNida] = useState(p.nida || '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  function change(setter, key) { return value => { setter(value); setErrors(current => ({ ...current, [key]: '' })); }; }
  async function next() {
    if (pending.current) return;
    const e = {};
    if (name.trim().length < 3) e.name = copy('Enter your full name.', 'Weka jina lako kamili.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = copy('Enter a valid email.', 'Weka barua pepe sahihi.');
    if (!/^\d{20}$/.test(nida)) e.nida = copy('Enter all 20 NIDA digits.', 'Weka tarakimu zote 20 za NIDA.');
    if (!user && (password.length < 12 || password.length > 72)) e.password = copy('Use 12–72 characters.', 'Tumia herufi 12–72.');
    if (!user && password !== confirmation) e.confirmation = copy('Passwords do not match.', 'Nenosiri halifanani.');
    setErrors(e); if (Object.keys(e).length) return;
    pending.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const params = { ...p, name: name.trim(), email: email.trim(), nida };
      if (!user) {
        const result = await register({ ...params, password });
        if (result?.requiresEmailConfirmation) setNotice(copy(
          'Confirm your email using the link in your inbox, then tap Save & continue again.',
          'Thibitisha barua pepe kupitia kiungo kwenye ujumbe uliotumwa, kisha bonyeza Hifadhi na uendelee tena.'
        ));
      }
      else navigation.navigate('Step4Business', syncWizard(navigation, await saveDraft(api, params)));
    } catch (e) { setError(workflowError(e)); }
    finally { pending.current = false; setBusy(false); }
  }
  return <RegistrationFrame step={3} title={copy('About you', 'Kuhusu wewe')} onBack={() => navigation.goBack()} busy={busy}
    footer={<><RegistrationText>{notice}</RegistrationText><RegistrationText error>{error}</RegistrationText><GlassButton label={busy ? copy('Saving…', 'Inahifadhi…') : copy('Save & continue', 'Hifadhi na uendelee')} onPress={next} busy={busy} /></>}>
    <GlassField label={copy('Full name', 'Jina kamili')} value={name} onChangeText={change(setName, 'name')} error={errors.name} editable={!busy} autoCapitalize="words" autoComplete="name" maxLength={100} />
    <GlassField label={copy('Email', 'Barua pepe')} value={email} onChangeText={change(setEmail, 'email')} error={errors.email} editable={!busy && !user} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
    <GlassField label={copy('NIDA number', 'Namba ya NIDA')} value={nida.replace(/(\d{5})(?=\d)/g, '$1 ')} onChangeText={value => change(setNida, 'nida')(value.replace(/\D/g, '').slice(0, 20))}
      error={errors.nida} editable={!busy} keyboardType="number-pad" maxLength={23} />
    {!user && <><GlassField label={copy('Password', 'Nenosiri')} password value={password} onChangeText={change(setPassword, 'password')} error={errors.password}
      hint={copy('12–72 characters', 'Herufi 12–72')} editable={!busy} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" />
      <GlassField label={copy('Confirm password', 'Rudia nenosiri')} password value={confirmation} onChangeText={change(setConfirmation, 'confirmation')} error={errors.confirmation}
        editable={!busy} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" returnKeyType="done" onSubmitEditing={next} /></>}
  </RegistrationFrame>;
}
