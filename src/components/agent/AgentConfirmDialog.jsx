import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingModal as Modal } from '../../context/LoaderContext';
import { fonts } from '../../constants/theme';
import { useAgentUI } from './AgentUI';

// Shared, theme-aware confirmation dialog. Callers own the action and visibility.
export function AgentConfirmDialog({
  visible, icon = 'help-circle-outline', title, description,
  cancelLabel, confirmLabel, onCancel, onConfirm,
}) {
  const { colors, copy, reducedMotion } = useAgentUI();
  return (
    <Modal transparent visible={visible} animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={onCancel} statusBarTranslucent navigationBarTranslucent>
      <View style={[styles.overlay, { backgroundColor: colors.scrim }]}>
        <Pressable testID="agent-confirm-backdrop" accessible={false}
          style={StyleSheet.absoluteFillObject} onPress={onCancel} />
        <View testID="agent-confirm-dialog" accessibilityViewIsModal
          style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false} bounces={false}>
            <View style={[styles.iconCircle, { backgroundColor: colors.selected }]}>
              <Ionicons name={icon} size={24} color={colors.text} />
            </View>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
              {title}
            </Text>
            <Text style={[styles.description, { color: colors.secondary }]}>
              {description}
            </Text>
          </ScrollView>
          <View style={styles.actions}>
            <Pressable testID="agent-confirm-cancel" accessibilityRole="button"
              accessibilityLabel={cancelLabel || copy('Cancel', 'Ghairi')}
              onPress={onCancel} style={({ pressed }) => [
                styles.button, { borderColor: colors.border, backgroundColor: pressed ? colors.selected : 'transparent' },
              ]}>
              <Text style={[styles.buttonText, { color: colors.text }]}>
                {cancelLabel || copy('Cancel', 'Ghairi')}
              </Text>
            </Pressable>
            <Pressable testID="agent-confirm-accept" accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              onPress={onConfirm} style={({ pressed }) => [
                styles.button, styles.confirmButton,
                { backgroundColor: colors.action, opacity: pressed ? 0.82 : 1 },
              ]}>
              <Text style={[styles.buttonText, { color: colors.actionText }]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20 },
  panel: {
    width: '100%', maxWidth: 360, maxHeight: '90%', borderRadius: 24, borderWidth: 1,
    overflow: 'hidden', elevation: 14, shadowColor: '#000000', shadowOpacity: 0.24,
    shadowRadius: 30, shadowOffset: { width: 0, height: 14 },
  },
  bodyScroll: { flexGrow: 0 },
  body: { paddingTop: 24, paddingHorizontal: 24, paddingBottom: 22 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { fontFamily: fonts.heading, fontSize: 23, lineHeight: 30, marginBottom: 8 },
  description: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
  actions: { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 24, gap: 10 },
  button: {
    flex: 1, minWidth: 0, minHeight: 52, borderWidth: 1, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 9,
  },
  confirmButton: { borderWidth: 0 },
  buttonText: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
