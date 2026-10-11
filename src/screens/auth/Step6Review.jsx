import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { api } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { workflowError } from '../../api/workflowState';
import { useSavedDocuments } from '../../components/auth/useSavedDocuments';
import { RegistrationFrame, GlassButton, RegistrationText, Section, PlainRow, CheckRow, TextAction } from '../../components/auth/RegistrationUI';
import { useAuthStyle } from '../../components/auth/AuthUI';

export default function Step6Review({ navigation, route }) {
  const { copy, colors } = useAuthStyle();
  const { refreshProfile } = useAuth();
  const p = route.params || {};
  const readOnly = p.readOnly === true;
  const [application, setApplication] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [details, setDetails] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const pending = useRef(false);
  const live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  useEffect(() => {
    let current = true;
    setApplication(null); setLoadError('');
    api.call('/applications/me').then(state => { if (current) setApplication(state); }).catch(e => { if (current) setLoadError(workflowError(e)); });
    return () => { current = false; };
  }, [attempt, p.expectedVersion]);
  const revision = application?.revisions?.[0];
  // Submitted views use the immutable revision, never the subsequently edited draft.
  const data = readOnly ? (revision?.data || application?.data || {}) : p;
  const documents = useSavedDocuments(data.documentIds);
  const knownProof = !!application?.phoneVerification && application.phoneVerification !== 'unavailable';
  const editable = ['draft', 'changes_requested'].includes(application?.status);
  const sameVersion = application?.version === p.expectedVersion;
  const canSubmit = !readOnly && !submitted && editable && knownProof && sameVersion && agreed;
  async function submit() {
    if (pending.current || !canSubmit) return;
    pending.current = true; setBusy(true); setError('');
    try {
      await api.call('/applications/me/submit', { method: 'POST', body: { expectedVersion: p.expectedVersion } });
      if (live.current) setSubmitted(true);
      await refreshProfile(); // Routing remains server-controlled.
    } catch (e) { if (live.current) setError(workflowError(e)); }
    finally { pending.current = false; if (live.current) setBusy(false); }
  }
  const edit = screen => !readOnly && !busy && !submitted ? () => navigation.navigate(screen, p) : undefined;
  const valueStyle = { color: colors.text, marginBottom: 7 };
  const names = { Voda: 'M-Pesa', vodacom: 'M-Pesa', Airtel: 'Airtel', airtel: 'Airtel', Yas: 'Yas Mixx', yas: 'Yas Mixx', Halotel: 'Halotel', halotel: 'Halotel' };
  return <RegistrationFrame step={readOnly ? undefined : 6} title={readOnly ? copy('Your application', 'Ombi lako') : copy('Final check', 'Ukaguzi wa mwisho')}
    onBack={() => navigation.goBack()} busy={busy} footer={readOnly ? <TextAction label={copy('Back to status', 'Rudi kwenye hali ya ombi')} onPress={() => navigation.goBack()} /> : <>
      {!submitted && <CheckRow label={copy('My details are accurate.', 'Taarifa zangu ni sahihi.')} checked={agreed} onPress={() => setAgreed(v => !v)} disabled={busy} />}
      <RegistrationText error>{error || loadError}</RegistrationText>
      {loadError && <TextAction label={copy('Retry status check', 'Jaribu tena kukagua hali')} onPress={() => setAttempt(n => n + 1)} />}
      {!application && !loadError && <RegistrationText>{copy('Checking application…', 'Inakagua ombi…')}</RegistrationText>}
      {application && !submitted && <RegistrationText>{!sameVersion ? copy('Your application changed. Reopen your saved draft before submitting.', 'Ombi lako limebadilika. Fungua rasimu iliyohifadhiwa kabla ya kutuma.')
        : !knownProof ? copy('Verify your phone before submitting.', 'Thibitisha simu yako kabla ya kutuma.') : !editable ? copy('This application is already with your reviewer.', 'Ombi hili tayari lipo kwa mkaguzi.') : ''}</RegistrationText>}
      <GlassButton label={busy ? copy('Submitting…', 'Inatuma…') : submitted ? copy('Application submitted', 'Ombi limetumwa') : copy('Submit application', 'Tuma ombi')} onPress={submit} busy={busy} disabled={!canSubmit} />
      {submitted && <TextAction label={copy('Refresh account status', 'Sasisha hali ya akaunti')} onPress={async () => { try { await refreshProfile(); } catch (e) { setError(workflowError(e)); } }} />}
    </>}>
    {readOnly && loadError ? <><RegistrationText error>{loadError}</RegistrationText><TextAction label={copy('Try again', 'Jaribu tena')} onPress={() => setAttempt(n => n + 1)} /></> : readOnly && !application ? <RegistrationText>{copy('Loading application…', 'Inapakia ombi…')}</RegistrationText> : <>
      <Section title={copy('Personal', 'Taarifa binafsi')} action={edit('Step3Personal')}>
        <RegistrationText style={valueStyle}>{data.name || '—'}</RegistrationText><RegistrationText style={valueStyle}>{readOnly ? application?.email : p.email}</RegistrationText>
        <RegistrationText>{`NIDA •••• ${data.nida?.slice(-4) || '—'}`}</RegistrationText>
      </Section>
      <Section title={copy('Business', 'Biashara')} action={edit('Step4Business')}>
        <RegistrationText style={valueStyle}>{data.businessName || '—'}</RegistrationText><RegistrationText>{data.businessLocation || '—'}</RegistrationText>
      </Section>
      <PlainRow label={copy('More details', 'Taarifa zaidi')} icon={details ? 'chevron-up' : 'chevron-down'} onPress={() => setDetails(v => !v)} />
      {details && <View style={{ paddingVertical: 12 }}>
        <PlainRow label={copy('Phone', 'Simu')} detail={readOnly ? application?.phone : p.phone} />
        <PlainRow label={copy('Networks', 'Mitandao')} detail={(data.networks || []).map(n => names[n] || n).join(' · ')} />
        <PlainRow label={copy('Daily float capacity', 'Kiasi cha float kwa siku')} detail={`TZS ${String(data.floatCapacity || '—').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`} />
        <PlainRow label={copy('Business TIN', 'TIN ya biashara')} detail={data.businessTIN} />
        <PlainRow label={copy('Licence number', 'Namba ya leseni')} detail={data.businessLicenceNumber} />
        {data.coordinates && <PlainRow label={copy('Coordinates', 'Viwianishi')} detail={`${data.coordinates.lat}, ${data.coordinates.lng}`} />}
      </View>}
      <PlainRow label={copy('Documents', 'Nyaraka')} detail={documents.loading ? copy('Loading…', 'Inapakia…') : documents.error ? copy('Unable to load file status', 'Imeshindikana kupakia hali ya faili') : copy(`${documents.documents.length} files saved privately`, `Faili ${documents.documents.length} zimehifadhiwa kwa faragha`)}
        icon={showDocuments ? 'chevron-up' : 'chevron-down'} onPress={() => setShowDocuments(v => !v)} />
      {showDocuments && <View style={{ paddingVertical: 12 }}>{documents.documents.map(d => <PlainRow key={d.id} label={d.kind === 'selfie' ? copy('Selfie', 'Picha yako') : d.kind === 'tin' ? copy('TIN certificate', 'Cheti cha TIN') : copy('Business licence', 'Leseni ya biashara')} detail={d.name} />)}
        <RegistrationText error>{documents.error}</RegistrationText>{documents.error && <TextAction label={copy('Retry documents', 'Jaribu tena nyaraka')} onPress={documents.retry} />}
        {!readOnly && <><TextAction label={copy('Edit business documents', 'Hariri nyaraka za biashara')} disabled={busy || submitted} onPress={edit('Step4Business')} /><TextAction label={copy('Edit selfie', 'Badili picha yako')} disabled={busy || submitted} onPress={edit('Step5Selfie')} /></>}
      </View>}
    </>}
  </RegistrationFrame>;
}
