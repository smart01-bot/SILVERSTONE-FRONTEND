import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Animated,
  PanResponder, ScrollView, Alert, ActivityIndicator, Clipboard,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';
import { NETWORK_COLORS, NETWORK_WALLETS } from '../constants/networks';
import { timeAgo } from '../utils/time';
import { updateRequestStatus, createTransaction } from '../utils/firestore';

const fmt = (n) => `TZS ${Number(n).toLocaleString()}`;

function NetDot({ network, size = 10 }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: NETWORK_COLORS[network] ?? '#888',
    }} />
  );
}

export default function RequestDetailModal({ request, visible, onClose, role = 'sub-agent', onRetry }) {
  const { theme, lang } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const translateY = useRef(new Animated.Value(600)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 600, duration: 240, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80) {
          onClose();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  if (!request) return null;

  const copyId = () => {
    Clipboard.setString(request.id);
  };

  const handleApprove = async () => {
    setLoading(true);
    try { await updateRequestStatus(request.id, 'approved', user.uid); onClose(); }
    catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const handleProcess = async () => {
    setLoading(true);
    try { await createTransaction(request, user.uid); onClose(); }
    catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const handleReject = () => {
    Alert.alert('Reject Request', 'Are you sure you want to reject this request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try { await updateRequestStatus(request.id, 'rejected', user.uid); onClose(); }
          catch (e) { Alert.alert('Error', e.message); }
          finally { setLoading(false); }
        },
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Request', 'Cancel this pending request?', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel Request', style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try { await updateRequestStatus(request.id, 'rejected', user.uid); onClose(); }
          catch (e) { Alert.alert('Error', e.message); }
          finally { setLoading(false); }
        },
      },
    ]);
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[styles.sheet, { backgroundColor: theme.surface, transform: [{ translateY }] }]}
      >
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={styles.handleArea}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Request Details</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Text style={{ color: theme.textDim, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <StatusBadge status={request.status} />

          {/* Request ID */}
          <TouchableOpacity onPress={copyId} style={[styles.idRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Text style={[styles.idLabel, { color: theme.textDim }]}>Request ID</Text>
            <Text style={[styles.idValue, { color: theme.text }]}>{request.id}</Text>
            <Text style={{ color: theme.primary, fontSize: 12 }}>copy</Text>
          </TouchableOpacity>

          {/* Route */}
          <View style={[styles.routeCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <View style={styles.routeItem}>
              <NetDot network={request.sourceNetwork} size={12} />
              <View>
                <Text style={[styles.routeNet, { color: theme.text }]}>{request.sourceNetwork}</Text>
                <Text style={[styles.routeWallet, { color: theme.textDim }]}>{NETWORK_WALLETS[request.sourceNetwork]}</Text>
              </View>
            </View>
            <Text style={[styles.routeArrow, { color: theme.textDim }]}>→</Text>
            <View style={styles.routeItem}>
              <NetDot network={request.destNetwork} size={12} />
              <View>
                <Text style={[styles.routeNet, { color: theme.text }]}>{request.destNetwork}</Text>
                <Text style={[styles.routeWallet, { color: theme.textDim }]}>{NETWORK_WALLETS[request.destNetwork]}</Text>
              </View>
            </View>
          </View>

          {/* Amount */}
          <Text style={[styles.amount, { color: theme.primary }]}>{fmt(request.amount)}</Text>
          {request.urgent && (
            <View style={[styles.urgentBadge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 13 }}>⚡ URGENT</Text>
            </View>
          )}

          {/* Detail rows */}
          <View style={[styles.detailCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            {[
              ['Source Phone', request.sourcePhone],
              ['Dest Phone',   request.destPhone],
              request.agentName && role === 'main-agent' ? ['Agent', request.agentName] : null,
              ['Submitted',    timeAgo(request.createdAt, lang)],
              request.processedAt ? ['Processed', timeAgo(request.processedAt, lang)] : null,
              request.processedBy ? ['Processed by', request.processedBy.slice(0, 8) + '…'] : null,
            ].filter(Boolean).map(([label, value]) => (
              <View key={label} style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.textDim }]}>{label}</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {/* Sub-agent actions */}
            {role === 'sub-agent' && request.status === 'rejected' && (
              <TouchableOpacity
                onPress={() => { onClose(); onRetry?.(request); }}
                style={[styles.actionBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.actionBtnText}>↻ Retry Request</Text>
              </TouchableOpacity>
            )}
            {role === 'sub-agent' && request.status === 'pending' && (
              <TouchableOpacity onPress={handleCancel} disabled={loading}
                style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>✕ Cancel Request</Text>}
              </TouchableOpacity>
            )}

            {/* Main-agent actions */}
            {role === 'main-agent' && request.status === 'pending' && (
              <TouchableOpacity onPress={handleApprove} disabled={loading}
                style={[styles.actionBtn, { backgroundColor: theme.teal ?? '#0891B2' }]}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>✓ Approve</Text>}
              </TouchableOpacity>
            )}
            {role === 'main-agent' && (request.status === 'pending' || request.status === 'approved') && (
              <TouchableOpacity onPress={handleProcess} disabled={loading}
                style={[styles.actionBtn, { backgroundColor: theme.primary }]}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>⇄ Process Transfer</Text>}
              </TouchableOpacity>
            )}
            {role === 'main-agent' && (request.status === 'pending' || request.status === 'approved') && (
              <TouchableOpacity onPress={handleReject} disabled={loading}
                style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}>
                <Text style={styles.actionBtnText}>✕ Reject</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onClose}
              style={[styles.actionBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, borderWidth: 1 }]}>
              <Text style={[styles.actionBtnText, { color: theme.textDim }]}>Dismiss</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handleArea: { paddingTop: 12, paddingBottom: 4, alignItems: 'center' },
  handle:     { width: 40, height: 4, borderRadius: 2 },
  content:    { padding: 20, gap: 14, paddingBottom: 40 },

  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle:   { fontSize: 20, fontWeight: '800' },
  closeBtn:     { borderWidth: 1, borderRadius: 20, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

  idRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  idLabel: { fontSize: 12, fontWeight: '500' },
  idValue: { flex: 1, fontSize: 12, fontFamily: 'Courier New', fontWeight: '700' },

  routeCard:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, borderRadius: 14, padding: 14 },
  routeItem:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeNet:   { fontSize: 15, fontWeight: '700' },
  routeWallet:{ fontSize: 12 },
  routeArrow: { fontSize: 20, fontWeight: '300' },

  amount:      { fontSize: 32, fontWeight: '800', fontFamily: 'Courier New', textAlign: 'center' },
  urgentBadge: { alignSelf: 'center', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 5 },

  detailCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  detailRow:  { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1 },
  detailLabel:{ fontSize: 13 },
  detailValue:{ fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  actions:       { gap: 10 },
  actionBtn:     { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
