import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../config/api';
import { wizardParams } from '../../api/onboarding';
import { workflowError } from '../../api/workflowState';
import { useAuth } from '../../context/AuthContext';
import { RegistrationFrame, GlassButton, RegistrationText, PlainRow, TextAction, Section } from '../../components/auth/RegistrationUI';
import { useAuthStyle } from '../../components/auth/AuthUI';

export default function PendingScreen({ navigation }) {
  const { profile, logout, refreshProfile } = useAuth();
  const { colors, copy } = useAuthStyle();
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const generation = useRef(0);
  const suspended = profile?.accountStatus === 'suspended';
  const status = profile?.applicationStatus;
  const corrections = status === 'changes_requested';
  const draft = status === 'draft';
  const rejected = status === 'rejected';
  const submitted = status === 'submitted';
  const editable = profile?.accountStatus === 'pending' && (draft || corrections);
  useEffect(() => {
    const current = ++generation.current;
    setApplication(null); setError(''); setBusy(false);
    if (!suspended) api.call('/applications/me').then(value => { if (generation.current === current) setApplication(value); }).catch(e => { if (generation.current === current) setError(workflowError(e)); });
    return () => { generation.current++; };
  }, [profile?.id, status, suspended]);
  async function refresh() {
    if (pending.current) return;
    const current = generation.current;
    pending.current = true; setBusy(true); setError('');
    try {
      // Refresh the authoritative account first; it may immediately replace this screen.
      await refreshProfile();
      if (!suspended) {
        const result = await api.call('/applications/me');
        if (generation.current === current) setApplication(result);
      }
    } catch (e) { if (generation.current === current) setError(workflowError(e)); }
    finally { pending.current = false; if (generation.current === current) setBusy(false); }
  }
  const title = suspended ? copy('Account suspended', 'Akaunti imesimamishwa') : corrections ? copy('A small update needed', 'Marekebisho yanahitajika') : draft ? copy('Your saved draft', 'Rasimu yako') : rejected ? copy('Application not approved', 'Ombi halijaidhinishwa') : copy('Under review', 'Ombi linakaguliwa');
  const description = suspended ? copy('Your account cannot access exchange features.', 'Akaunti yako haiwezi kutumia huduma za kubadilisha float.') : corrections ? copy('Your main-agent requested a correction.', 'Wakala mkuu ameomba marekebisho.') : draft ? copy('Continue where you left off.', 'Endelea ulipoishia.') : rejected ? copy('Read your main-agent’s feedback below.', 'Soma maoni ya wakala mkuu hapa chini.') : copy('Your application is awaiting main-agent approval.', 'Ombi lako linasubiri idhini ya wakala mkuu.');
  const latest = application?.revisions?.[0];
  const labels = { name: copy('Full name', 'Jina kamili'), nida: 'NIDA', businessName: copy('Business name', 'Jina la biashara'), businessLocation: copy('Business location', 'Eneo la biashara'), businessTIN: 'TIN', businessLicenceNumber: copy('Licence number', 'Namba ya leseni'), documentIds: copy('Documents', 'Nyaraka'), networks: copy('Networks', 'Mitandao'), floatCapacity: copy('Daily float capacity', 'Kiasi cha float kwa siku'), coordinates: copy('Coordinates', 'Viwianishi') };
  return <RegistrationFrame title={title} description={description} footer={<>
    <RegistrationText error>{error}</RegistrationText>
    {editable && application && <GlassButton label={corrections ? copy('Update application', 'Rekebisha ombi') : copy('Continue application', 'Endelea na ombi')} disabled={busy}
      onPress={() => navigation.navigate('Step3Personal', wizardParams(application))} />}
    {!editable && <GlassButton label={busy ? copy('Checking…', 'Inakagua…') : copy('Check status', 'Kagua hali')} onPress={refresh} busy={busy} />}
    {editable && <TextAction label={busy ? copy('Checking…', 'Inakagua…') : copy('Refresh status', 'Sasisha hali')} onPress={refresh} disabled={busy} />}
    {application && !suspended && !draft && <TextAction label={copy('View submitted details', 'Angalia taarifa zilizotumwa')} disabled={busy} onPress={() => navigation.navigate('Step6Review', { readOnly: true })} />}
    <TextAction label={copy('Sign out', 'Ondoka')} disabled={busy} onPress={logout} />
  </>}>
    <View style={{ alignItems: 'center', paddingVertical: 28 }}><Ionicons name={suspended ? 'lock-closed-outline' : corrections || draft ? 'create-outline' : rejected ? 'close-circle-outline' : 'time-outline'} size={76} color={colors.secondary} /></View>
    {submitted && !suspended && <View style={{ marginVertical: 18 }}>
      {[copy('Submitted', 'Limetumwa'), copy('Main-agent review', 'Ukaguzi wa wakala mkuu'), copy('Decision', 'Uamuzi')].map((label, index) => <View key={index} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 60, gap: 18 }}>
        <Ionicons name={index === 0 ? 'checkmark-circle-outline' : index === 1 ? 'radio-button-on-outline' : 'ellipse-outline'} size={24} color={index === 2 ? colors.muted : colors.text} />
        <RegistrationText style={{ color: index === 2 ? colors.muted : colors.text, flex: 1 }}>{label}</RegistrationText>
      </View>)}
    </View>}
    {(corrections || rejected) && !suspended && latest?.reason && <Section title={copy('Main-agent feedback', 'Maoni ya wakala mkuu')}><RegistrationText style={{ color: colors.text }}>{latest.reason}</RegistrationText>
      {latest.fieldsToCorrect?.length > 0 && <PlainRow label={copy('Please update', 'Tafadhali rekebisha')} detail={latest.fieldsToCorrect.map(key => labels[key] || key).join(' · ')} />}
    </Section>}
    {!suspended && <RegistrationText>{corrections ? copy('Your other details are saved.', 'Taarifa zako nyingine zimehifadhiwa.') : submitted ? copy('Exchange access unlocks after approval.', 'Huduma za kubadilisha float zitapatikana baada ya idhini.') : ''}</RegistrationText>}
  </RegistrationFrame>;
}
