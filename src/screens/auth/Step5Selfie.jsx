import React, { useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '../../config/api';
import { uploadDocument } from '../../api/documents';
import { saveDraft, syncWizard } from '../../api/onboarding';
import { workflowError } from '../../api/workflowState';
import { useSavedDocuments } from '../../components/auth/useSavedDocuments';
import { RegistrationFrame, GlassButton, RegistrationText, TextAction } from '../../components/auth/RegistrationUI';
import { useAuthStyle } from '../../components/auth/AuthUI';

export default function Step5Selfie({ navigation, route }) {
  const { copy, colors } = useAuthStyle();
  const p = route.params || {};
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const upload = useRef(null);
  const saved = useSavedDocuments(p.documentIds);
  const previous = saved.documents.find(d => d.kind === 'selfie');
  async function choose() {
    if (pending.current) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png'], copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) { setPhoto(result.assets[0]); setError(''); }
    } catch (e) { setError(workflowError(e)); }
  }
  async function next() {
    if (pending.current || (!photo && !previous)) return;
    pending.current = true; setBusy(true); setError('');
    try {
      let ids = [...(p.documentIds || [])];
      if (photo) {
        if (upload.current?.uri !== photo.uri) upload.current = { ...(await uploadDocument(photo, 'selfie')), uri: photo.uri };
        const existing = await Promise.all(ids.map(id => api.call(`/documents/${id}?metadata=1`)));
        ids = [...existing.filter(d => d.kind !== 'selfie').map(d => d.id), upload.current.id];
      }
      navigation.navigate('Step6Review', { ...syncWizard(navigation, await saveDraft(api, { ...p, documentIds: ids })), readOnly: false });
    } catch (e) { setError(workflowError(e)); }
    finally { pending.current = false; setBusy(false); }
  }
  return <RegistrationFrame step={5} title={copy('Selfie photo', 'Picha yako')} description={copy('For your main-agent to review.', 'Kwa ajili ya ukaguzi wa wakala mkuu.')}
    onBack={() => navigation.goBack()} busy={busy} footer={<><RegistrationText error>{error || saved.error}</RegistrationText>
      {saved.error && <TextAction label={copy('Retry document status', 'Jaribu tena hali ya nyaraka')} onPress={saved.retry} />}
      <GlassButton label={busy ? copy('Saving photo…', 'Inahifadhi picha…') : copy('Save & continue', 'Hifadhi na uendelee')} onPress={next} busy={busy} disabled={!photo && !previous} /></>}>
    <View style={{ alignItems: 'center', paddingVertical: 32 }}>
      {photo ? <Image accessibilityLabel={copy('Selected selfie', 'Picha iliyochaguliwa')} source={{ uri: photo.uri }} style={{ width: '80%', maxWidth: 260, aspectRatio: 0.8, borderRadius: 18 }} resizeMode="cover" />
        : <View style={{ minHeight: 180, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="person-outline" size={88} color={colors.secondary} /></View>}
    </View>
    <RegistrationText style={{ textAlign: 'center' }}>{photo ? copy('Selected · Not saved yet', 'Imechaguliwa · Bado haijahifadhiwa') : previous ? copy('Your selfie is saved privately.', 'Picha yako imehifadhiwa kwa faragha.') : copy('Face visible · Good lighting', 'Uso uonekane · Mwanga mzuri')}</RegistrationText>
    <TextAction label={photo || previous ? copy('Choose another photo', 'Chagua picha nyingine') : copy('Choose a selfie photo', 'Chagua picha yako')} onPress={choose} disabled={busy} />
    <RegistrationText style={{ textAlign: 'center', fontSize: 13 }}>{copy('PNG or JPEG · Up to 2 MB', 'PNG au JPEG · Hadi MB 2')}</RegistrationText>
  </RegistrationFrame>;
}
