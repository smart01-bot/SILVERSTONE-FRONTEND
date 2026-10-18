import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { fonts } from '../constants/theme';
import { useAgentUI } from './agent/AgentUI';
import { AgentConfirmDialog } from './agent/AgentConfirmDialog';
import MainAgentWorkspaceSheet, { profileText } from './agent/MainAgentWorkspaceSheet';
import PressFeedback from './PressFeedback';
import SwiftWakalaMark from './SwiftWakalaMark';

export default function DrawerContent({ navigation }) {
  const { colors, copy } = useAgentUI();
  const { profile, lockSession } = useAuth();
  const insets = useSafeAreaInsets();
  const { height, width, fontScale } = useWindowDimensions();
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [section, setSection] = useState(null);
  const name = profileText(profile?.name) || copy('Main Agent', 'Wakala Mkuu');
  const agentId = profileText(profile?.agentNumber) || copy('Not assigned', 'Hakijatolewa');
  const initials = name.split(/\s+/).slice(0, 2).map(word => word[0]?.toUpperCase()).join('');
  // The normal portrait menu fits without scrolling. Keep an overflow fallback for
  // landscape and accessibility text sizes, with the ID outside the scroll area.
  const needsOverflow = height - insets.top - insets.bottom < 560 || fontScale > 1.25;
  const Body = needsOverflow ? ScrollView : View;
  const bodyProps = needsOverflow ? { contentContainerStyle: s.content, showsVerticalScrollIndicator: false } : {};
  const open = key => setSection(key);
  const row = (key, icon, title, soon = false) => <PressFeedback key={key} testID={`main-workspace-${key}`}
    accessibilityRole="button" accessibilityLabel={`${title}${soon ? `, ${copy('Coming soon', 'Inakuja hivi karibuni')}` : ''}`}
    onPress={() => open(key)} style={({ pressed }) => [s.row, { backgroundColor: pressed ? colors.selected : 'transparent' }]}>
    <Ionicons name={icon} size={21} color={colors.text} />
    <View style={s.rowCopy}>
      <Text style={[s.rowTitle, { color: colors.text }]}>{title}</Text>
    </View>
    {soon && width >= 350 && <Ionicons name="time-outline" size={15} color={colors.secondary} />}
  </PressFeedback>;

  return <View style={[s.container, { backgroundColor: colors.bg, paddingTop: insets.top + 6, paddingBottom: Math.max(insets.bottom, 8) }]}>
    <View style={s.header}>
      <View accessible accessibilityLabel="Swift Wakala by Silverstone" style={s.brand}>
        <SwiftWakalaMark size={27} color={colors.text} />
        <View style={s.brandCopy}>
          <Text style={[s.brandName, { color: colors.text }]}>Swift Wakala</Text>
        </View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={copy('Close menu', 'Funga menyu')}
        onPress={() => navigation.closeDrawer()} style={({ pressed }) => [s.close, { backgroundColor: pressed ? colors.selected : 'transparent' }]}>
        <Ionicons name="close-outline" size={22} color={colors.text} />
      </Pressable>
    </View>
    <Body {...bodyProps} style={[s.body, !needsOverflow && s.content]}>
      <PressFeedback testID="main-workspace-profile" accessibilityRole="button" accessibilityLabel={copy('Main agent profile', 'Wasifu wa wakala mkuu')}
        onPress={() => open('profile')} style={({ pressed }) => [s.account, { backgroundColor: pressed ? colors.selected : 'transparent' }]}>
        <View style={[s.avatar, { backgroundColor: colors.selected }]}><Text style={[s.initials, { color: colors.text }]}>{initials}</Text></View>
        <View style={s.rowCopy}>
          <Text numberOfLines={1} style={[s.name, { color: colors.text }]}>{name}</Text>
          <Text style={[s.profileLabel, { color: colors.secondary }]}>{copy('Main agent profile', 'Wasifu wa wakala mkuu')}</Text>
        </View>
      </PressFeedback>

      <View style={s.menu}>
        {row('enterprise', 'business-outline', copy('My enterprise status', 'Hali ya biashara yangu'))}
        {row('credit', 'wallet-outline', copy('Agent credit engine', 'Mikopo ya mawakala'), true)}
        {row('cash', 'navigate-outline', copy('Cash movement monitor', 'Ufuatiliaji wa fedha'), true)}
        {row('legal', 'document-text-outline', copy('Terms & privacy', 'Masharti na faragha'))}
      </View>

      <PressFeedback accessibilityRole="button" testID="drawer-sign-out" onPress={() => setSignOutVisible(true)} style={({ pressed }) => [s.signOut, { backgroundColor: pressed ? colors.selected : 'transparent' }]}>
        <Ionicons name="log-out-outline" size={21} color={colors.text} />
        <Text style={[s.rowTitle, { flex: 1, color: colors.text }]}>{copy('Sign out', 'Ondoka')}</Text>
      </PressFeedback>
    </Body>

    <View testID="main-agent-id" style={s.footer}>
      <Text style={[s.idLabel, { color: colors.secondary }]}>{copy('MAIN AGENT ID', 'KITAMBULISHO CHA WAKALA MKUU')}</Text>
      <Text selectable style={[s.idValue, { color: colors.text }]}>{agentId}</Text>
    </View>
    <MainAgentWorkspaceSheet section={section} onClose={() => setSection(null)} />
    <AgentConfirmDialog visible={signOutVisible} icon="log-out-outline"
      title={copy('Sign out?', 'Ondoka?')}
      description={copy('You’ll return to the PIN screen. Your account stays linked to this device.', 'Utarudi kwenye skrini ya PIN. Akaunti yako itaendelea kuunganishwa na kifaa hiki.')}
      cancelLabel={copy('Cancel', 'Ghairi')} confirmLabel={copy('Sign out', 'Ondoka')}
      onCancel={() => setSignOutVisible(false)}
      onConfirm={() => { setSignOutVisible(false); navigation.closeDrawer(); lockSession(); }} />
  </View>;
}
const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }, brandCopy: { flex: 1 },
  brandName: { fontFamily: fonts.heading, fontSize: 16, letterSpacing: -0.5 },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 }, content: { paddingHorizontal: 16 },
  account: { minHeight: 68, borderRadius: 16, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: fonts.heading, fontSize: 17 }, name: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 23 },
  profileLabel: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, marginTop: 2 },
  rowCopy: { flex: 1, minWidth: 0 }, menu: { marginTop: 20, gap: 2 },
  row: { minHeight: 50, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowTitle: { fontFamily: fonts.bodyMed, fontSize: 15, lineHeight: 22 },
  signOut: { minHeight: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 10, paddingVertical: 10, marginTop: 18 },
  footer: { marginHorizontal: 26, paddingTop: 10, marginTop: 8, gap: 3 },
  idLabel: { fontFamily: fonts.bodyMed, fontSize: 9, lineHeight: 14, letterSpacing: 1.2 },
  idValue: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 20 },
});
