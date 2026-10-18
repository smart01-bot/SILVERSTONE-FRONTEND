import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { fonts } from '../../constants/theme';
import { AgentButton, AgentSheet, useAgentUI } from './AgentUI';

export const profileText = value => typeof value === 'string' && value.trim() ? value.trim() : null;

function Detail({ label, value }) {
  const { colors, copy } = useAgentUI();
  return <View style={[s.detail, { borderBottomColor: colors.border }]}>
    <Text style={[s.label, { color: colors.secondary }]}>{label}</Text>
    <Text selectable style={[s.value, { color: colors.text }]}>{value || copy('Not provided', 'Haijatolewa')}</Text>
  </View>;
}

// Only mounted in the main-agent drawer; this is separate from the agent Profile tab.
export default function MainAgentWorkspaceSheet({ section, onClose }) {
  const { profile, user } = useAuth();
  const { colors, copy } = useAgentUI();
  const titles = {
    profile: copy('Main agent profile', 'Wasifu wa wakala mkuu'),
    enterprise: copy('My enterprise status', 'Hali ya biashara yangu'),
    credit: copy('Agent credit engine', 'Huduma ya mikopo ya mawakala'),
    cash: copy('Cash movement monitor', 'Ufuatiliaji wa usafirishaji wa fedha'),
    legal: copy('Terms & privacy', 'Masharti na faragha'),
  };
  const accountStates = { active: copy('Active', 'Hai'), suspended: copy('Suspended', 'Imesimamishwa'), inactive: copy('Inactive', 'Si hai') };
  const applicationStates = { approved: copy('Approved', 'Imeidhinishwa'), submitted: copy('Under review', 'Inakaguliwa'), in_review: copy('Under review', 'Inakaguliwa'), draft: copy('Draft', 'Rasimu'), rejected: copy('Rejected', 'Imekataliwa'), changes_requested: copy('Changes requested', 'Marekebisho yanahitajika') };
  const upcoming = section === 'credit' || section === 'cash';
  return <AgentSheet visible={Boolean(section)} onClose={onClose} title={titles[section] || ''}>
    {section === 'profile' && <>
      <Detail label={copy('Full name', 'Jina kamili')} value={profileText(profile?.name)} />
      <Detail label={copy('Main agent ID', 'Kitambulisho cha wakala mkuu')} value={profileText(profile?.agentNumber) || copy('Not assigned', 'Hakijatolewa')} />
      <Detail label={copy('Email', 'Barua pepe')} value={profileText(user?.email) || profileText(profile?.email)} />
      <Detail label={copy('Phone number', 'Namba ya simu')} value={profileText(profile?.phone)} />
      <Detail label={copy('Enterprise', 'Biashara')} value={profileText(profile?.businessName)} />
      <Detail label={copy('Business location', 'Eneo la biashara')} value={profileText(profile?.businessLocation)} />
    </>}
    {section === 'enterprise' && <>
      <Detail label={copy('Enterprise', 'Biashara')} value={profileText(profile?.businessName)} />
      <Detail label={copy('Account status', 'Hali ya akaunti')} value={accountStates[profile?.accountStatus] || copy('Unavailable', 'Haipatikani')} />
      <Detail label={copy('Application status', 'Hali ya maombi')} value={applicationStates[profile?.applicationStatus] || copy('Unavailable', 'Haipatikani')} />
      <Detail label={copy('Business location', 'Eneo la biashara')} value={profileText(profile?.businessLocation)} />
      <Text style={[s.note, { color: colors.secondary }]}>{copy('These are the current details on your account.', 'Hizi ni taarifa za sasa kwenye akaunti yako.')}</Text>
    </>}
    {upcoming && <>
      <View style={[s.featureIcon, { backgroundColor: colors.selected }]}><Ionicons name={section === 'credit' ? 'wallet-outline' : 'navigate-outline'} size={30} color={colors.text} /></View>
      <Text style={[s.title, { color: colors.text }]}>{copy('Coming soon', 'Inakuja hivi karibuni')}</Text>
      <Text style={[s.body, { color: colors.secondary }]}>{section === 'credit'
        ? copy('A dedicated space for agent credit. Eligibility, limits and application details will be available when this feature launches.', 'Sehemu maalumu ya mikopo ya mawakala. Vigezo, viwango na maelezo ya maombi yatapatikana huduma itakapoanza.')
        : copy('Track physical cash from dispatch to arrival. See what is en route and confirm when cash reaches its destination. This feature is not available yet.', 'Fuatilia fedha taslimu kuanzia kutumwa hadi kufika. Ona fedha zilizo njiani na thibitisha zinapofika zinakopelekwa. Huduma hii bado haijaanza.')}</Text>
      <AgentButton label={copy('Got it', 'Nimeelewa')} onPress={onClose} icon="checkmark-outline" />
    </>}
    {section === 'legal' && <>
      <View style={[s.legalCard, { backgroundColor: colors.bg }]}>
        <Text style={[s.documentTitle, { color: colors.text }]}>{copy('Terms of service', 'Masharti ya huduma')}</Text>
        <Text style={[s.body, { color: colors.secondary }]}>{copy('The published terms will be available here once added to the app.', 'Masharti yaliyochapishwa yatapatikana hapa yakiongezwa kwenye programu.')}</Text>
      </View>
      <View style={[s.legalCard, { backgroundColor: colors.bg }]}>
        <Text style={[s.documentTitle, { color: colors.text }]}>{copy('Privacy policy', 'Sera ya faragha')}</Text>
        <Text style={[s.body, { color: colors.secondary }]}>{copy('The published privacy policy will be available here once added to the app.', 'Sera ya faragha iliyochapishwa itapatikana hapa ikiongezwa kwenye programu.')}</Text>
      </View>
    </>}
  </AgentSheet>;
}
const s = StyleSheet.create({
  detail: { paddingVertical: 14, gap: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  label: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20 },
  value: { fontFamily: fonts.bodyMed, fontSize: 16, lineHeight: 24 },
  note: { fontFamily: fonts.body, fontSize: 13, lineHeight: 21, marginTop: 18 },
  featureIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 20 },
  title: { fontFamily: fonts.heading, fontSize: 25, lineHeight: 34, marginBottom: 10 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 24, marginBottom: 22 },
  legalCard: { padding: 18, borderRadius: 20, marginBottom: 12 },
  documentTitle: { fontFamily: fonts.bodySemi, fontSize: 17, lineHeight: 25, marginBottom: 8 },
});
