import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '../../config/api';
import { saveDraft, syncWizard } from '../../api/onboarding';
import { uploadDocument } from '../../api/documents';
import { workflowError } from '../../api/workflowState';
import { useSavedDocuments } from '../../components/auth/useSavedDocuments';
import { RegistrationFrame, GlassField, GlassButton, RegistrationText, PlainRow, Section, TextAction, CheckRow } from '../../components/auth/RegistrationUI';
import { useAuthStyle } from '../../components/auth/AuthUI';

const NETWORKS = [['Voda', 'M-Pesa'], ['Airtel', 'Airtel'], ['Yas', 'Yas Mixx'], ['Halotel', 'Halotel']];
export default function Step4Business({ navigation, route }) {
  const { copy } = useAuthStyle();
  const p = route.params || {};
  const [name, setName] = useState(p.businessName || '');
  const [location, setLocation] = useState(p.location ?? p.businessLocation ?? '');
  const [coordinates, setCoordinates] = useState(p.coordinates ?? null);
  const [networks, setNetworks] = useState(p.networks || []);
  const [capacity, setCapacity] = useState(String(p.floatCapacity ?? 500000));
  const [tin, setTin] = useState(p.businessTIN || '');
  const [licence, setLicence] = useState(p.businessLicenceNumber || '');
  const [files, setFiles] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [errors, setErrors] = useState({});
  const pending = useRef(false);
  const uploads = useRef({});
  const saved = useSavedDocuments(p.documentIds);
  useEffect(() => {
    if (p.location !== undefined) { setLocation(p.location); setCoordinates(p.coordinates ?? null); }
  }, [p.location, p.coordinates]);
  async function pick(kind) {
    if (pending.current) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png'], copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) {
        setFiles(current => ({ ...current, [kind]: result.assets[0] })); setNotice('');
      }
    } catch (e) { setError(workflowError(e)); }
  }
  function params() {
    return { ...p, businessName: name.trim(), businessLocation: location, coordinates, networks,
      floatCapacity: capacity, businessTIN: tin, businessLicenceNumber: licence };
  }
  async function persist(advance) {
    if (pending.current) return;
    const e = {};
    if (advance) {
      if (name.trim().length < 3) e.name = copy('Enter your business name.', 'Weka jina la biashara.');
      if (location.trim().length < 3) e.location = copy('Add your business location.', 'Ongeza eneo la biashara.');
      if (!networks.length) e.networks = copy('Select at least one network.', 'Chagua angalau mtandao mmoja.');
      if (tin.replace(/\D/g, '').length < 8 || !/^[\d -]{8,20}$/.test(tin)) e.tin = copy('Check your TIN number.', 'Kagua namba ya TIN.');
      if (licence.trim().length < 3) e.licence = copy('Enter your licence number.', 'Weka namba ya leseni.');
    }
    if (!/^[1-9]\d{0,14}$/.test(capacity)) e.capacity = copy('Enter a positive whole TZS amount.', 'Weka kiasi chanya cha TZS bila desimali.');
    setErrors(e); if (Object.keys(e).length) return;
    pending.current = true; setBusy(true); setError(''); setNotice('');
    try {
      let ids = [...(p.documentIds || [])];
      for (const kind of ['tin', 'licence']) {
        const asset = files[kind]; if (!asset) continue;
        let uploaded = uploads.current[kind];
        if (!uploaded || uploaded.uri !== asset.uri) {
          const doc = await uploadDocument(asset, kind);
          uploaded = uploads.current[kind] = { uri: asset.uri, id: doc.id };
        }
        const existing = await Promise.all(ids.map(id => api.call(`/documents/${id}?metadata=1`)));
        ids = [...existing.filter(d => d.kind !== kind).map(d => d.id), uploaded.id];
      }
      const state = await saveDraft(api, { ...params(), documentIds: ids });
      const next = syncWizard(navigation, state);
      setFiles({}); uploads.current = {};
      if (advance) navigation.navigate('Step5Selfie', next);
      else setNotice(copy('Draft saved.', 'Rasimu imehifadhiwa.'));
    } catch (e) { setError(workflowError(e)); }
    finally { pending.current = false; setBusy(false); }
  }
  const detail = kind => files[kind] ? `${files[kind].name} · ${copy('Selected, not saved', 'Imechaguliwa, haijahifadhiwa')}`
    : saved.loading ? copy('Checking saved files…', 'Inakagua faili zilizohifadhiwa…') : saved.documents.find(d => d.kind === kind) ? copy('Saved privately · Tap to replace', 'Imehifadhiwa kwa faragha · Gusa kubadilisha')
      : copy('Choose image', 'Chagua picha');
  return <RegistrationFrame step={4} title={copy('Your business', 'Biashara yako')} onBack={() => navigation.goBack()} busy={busy}
    footer={<><RegistrationText error>{error}</RegistrationText><RegistrationText>{notice}</RegistrationText>
      <GlassButton label={busy ? copy('Saving…', 'Inahifadhi…') : copy('Save & continue', 'Hifadhi na uendelee')} onPress={() => persist(true)} busy={busy} />
      <TextAction label={copy('Save draft', 'Hifadhi rasimu')} onPress={() => persist(false)} disabled={busy} /></>}>
    <GlassField label={copy('Business / till name', 'Jina la biashara')} value={name} onChangeText={setName} maxLength={160} error={errors.name} editable={!busy} />
    <PlainRow label={copy('Business location', 'Eneo la biashara')} detail={location || copy('Add area and landmark', 'Ongeza eneo na alama ya karibu')} disabled={busy}
      onPress={() => navigation.navigate('Step4aMap', { ...params(), location })} />
    <RegistrationText error>{errors.location}</RegistrationText>
    <Section title={copy('Networks you operate', 'Mitandao unayotumia')}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 20 }}>
        {NETWORKS.map(([id, label]) => <View key={id} style={{ minWidth: 120, flexGrow: 1 }}><CheckRow label={label} checked={networks.includes(id)} disabled={busy}
          onPress={() => setNetworks(current => current.includes(id) ? current.filter(n => n !== id) : [...current, id])} /></View>)}
      </View><RegistrationText error>{errors.networks}</RegistrationText>
    </Section>
    <GlassField label={copy('Daily float capacity', 'Kiasi cha float kwa siku')} prefix="TZS" value={capacity} onChangeText={v => setCapacity(v.replace(/\D/g, '').slice(0, 15))}
      keyboardType="number-pad" error={errors.capacity} editable={!busy} />
    <GlassField label={copy('Business TIN', 'TIN ya biashara')} value={tin} onChangeText={setTin} maxLength={20} keyboardType="number-pad" error={errors.tin} editable={!busy} />
    <GlassField label={copy('Business licence number', 'Namba ya leseni ya biashara')} value={licence} onChangeText={setLicence} maxLength={80} error={errors.licence} editable={!busy} />
    <Section title={copy('Documents', 'Nyaraka')}>
      <RegistrationText>{copy('PNG or JPEG · Up to 2 MB each', 'PNG au JPEG · Hadi MB 2 kila picha')}</RegistrationText>
      <PlainRow label={copy('TIN certificate', 'Cheti cha TIN')} detail={detail('tin')} icon="attach-outline" disabled={busy} onPress={() => pick('tin')} />
      <PlainRow label={copy('Business licence', 'Leseni ya biashara')} detail={detail('licence')} icon="attach-outline" disabled={busy} onPress={() => pick('licence')} />
      <RegistrationText error>{saved.error}</RegistrationText>{saved.error && <TextAction label={copy('Retry document status', 'Jaribu tena hali ya nyaraka')} onPress={saved.retry} />}
    </Section>
  </RegistrationFrame>;
}
