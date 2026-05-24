// src/components/RequestDetailModal.jsx
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, PanResponder, ScrollView, Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLoader } from '../context/LoaderContext';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';
import { NETWORK_COLORS, NETWORK_WALLETS } from '../constants/networks';
import { timeAgo } from '../utils/time';
import api from '../config/api';

const fmt = (n) => `TZS ${Number(n).toLocaleString()}`;

function NetDot({ network, size = 10 }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: NETWORK_COLORS[network] ?? '#888',
    }} />
  );
}

export default function RequestDetailModal({
  request, visible, onClose, role = 'sub-agent', onRetry,
}) {
  const { theme } = useTheme();
  const { showLoader, hideLoader } = useLoader();
  const { user } = useAuth();

  const translateY     = useRef(new Animated.Value(600)).current;
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
      onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80) { onClose(); }
        else { Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start(); }
      },
    })
  ).current;

  if (!request) return null;

  // Support both snake_case (API) and camelCase (legacy) field names
  const srcNet   = request.source_network ?? request.sourceNetwork;
  const dstNet   = request.dest_network   ?? request.destNetwork;
  const srcPhone = request.source_phone   ?? request.sourcePhone;
  const dstPhone = request.dest_phone     ?? request.destPhone;
  const createdAt = request.created_at    ?? request.createdAt;
  const processedAt = request.processed_at ?? request.processedAt;
  const agentName = request.agent_name    ?? request.agentName;

  const copyId = async () => {
    try {
      await Clipboard.setStringAsync(request.id);
      Alert.alert('Copied', 'Request ID copied to clipboard');
    } catch {}
  };

  const handleApprove = async () => {
    showLoader();
    try {
      await api.put(`/api/requests/${request.id}`, { status: 'approved' });
      onClose();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      hideLoader();
    }
  };

  const handleProcess = async () => {
    showLoader();
    try {
      await api.post('/api/transfers', { requestId: request.id });
      onClose();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      hideLoader();
    }
  };

  const handleReject = () => {
    Alert.alert('Reject Request', 'Are you sure you want to reject this request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive',
        onPress: async () => {
          showLoader();
          try {
            await api.put(`/api/requests/${request.id}`, { status: 'rejected' });
            onClose();
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            hideLoader();
          }
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
          showLoader();
          try {
            await api.put(`/api/requests/${request.id}`, { status: 'cancelled' });
            onClose();
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            hideLoader();
          }
        },
      },
    ]);
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { backgroundColor: theme.surface, transform: [{ translateY }] }]}>
        <View {...panResponder.panHandlers} style={styles.handleArea}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Request Details</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Ionicons name="close" size={16} color={theme.textDim} />
            </TouchableOpacity>
          </View>
          <StatusBadge status={request.status} />
          <TouchableOpacity onPress={copyId} style={[styles.idRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Text style={[styles.idLabel, { color: theme.textDim }]}>Request ID</Text>
            <Text style={[styles.idValue, { color: theme.text }]}>#{request.id?.slice(-8).toUpperCase()}</Text>
            <Ionicons name="copy-outline" size={14} color={theme.primary} />
          </TouchableOpacity>
          <View style={[styles.routeCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <View style={styles.routeItem}>
              <NetDot network={srcNet} size={12} />
              <View>
                <Text style={[styles.routeNet,    { color: theme.text }]}>{srcNet}</Text>
                <Text style={[styles.routeWallet, { color: theme.textDim }]}>{NETWORK_WALLETS?.[srcNet] ?? ''}</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={18} color={theme.textDim} />
            <View style={styles.routeItem}>
              <NetDot network={dstNet} size={12} />
              <View>
                <Text style={[styles.routeNet,    { color: theme.text }]}>{dstNet}</Text>
                <Text style={[styles.routeWallet, { color: theme.textDim }]}>{NETWORK_WALLETS?.[dstNet] ?? ''}</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.amount, { color: theme.primary }]}>{fmt(request.amount)}</Text>
          {request.urgent && (
            <View style={[styles.urgentBadge, { backgroundColor: '#FEF3C720' }]}>
              <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 13 }}>URGENT</Text>
            </View>
          )}
          <View style={[styles.detailCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            {[
              ['Source Phone', srcPhone],
              ['Dest Phone',   dstPhone],
              role === 'main-agent' && agentName ? ['Agent', agentName] : null,
              ['Submitted', timeAgo(createdAt)],
              processedAt ? ['Processed', timeAgo(processedAt)] : null,
            ].filter(Boolean).map(([label, value]) => (
              <View key={label} style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.textDim }]}>{label}</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
              </View>
            ))}
          </View>
          <View style={styles.actions}>
            {role === 'sub-agent' && request.status === 'rejected' && (
              <TouchableOpacity onPress={() => { onClose(); onRetry?.(request); }} style={[styles.actionBtn, { backgroundColor: theme.primary }]}>
                <Text style={styles.actionBtnText}>Retry Request</Text>
              </TouchableOpacity>
            )}
            {role === 'sub-agent' && request.status === 'pending' && (
              <TouchableOpacity onPress={handleCancel} style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}>
                <Text style={styles.actionBtnText}>Cancel Request</Text>
              </TouchableOpacity>
            )}
            {role === 'main-agent' && request.status === 'pending' && (
              <TouchableOpacity onPress={handleApprove} style={[styles.actionBtn, { backgroundColor: '#0891B2' }]}>
                <Text style={styles.actionBtnText}>Approve</Text>
              </TouchableOpacity>
            )}
            {role === 'main-agent' && (request.status === 'pending' || request.status === 'approved') && (
              <TouchableOpacity onPress={handleProcess} style={[styles.actionBtn, { backgroundColor: theme.primary }]}>
                <Text style={styles.actionBtnText}>Process Transfer</Text>
              </TouchableOpacity>
            )}
            {role === 'main-agent' && (request.status === 'pending' || request.status === 'approved') && (
              <TouchableOpacity onPress={handleReject} style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}>
                <Text style={styles.actionBtnText}>Reject</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={[styles.actionBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, borderWidth: 1 }]}>
              <Text style={[styles.actionBtnText, { color: theme.textDim }]}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet:       { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 20 },
  handleArea:  { paddingTop: 12, paddingBottom: 4, alignItems: 'center' },
  handle:      { width: 40, height: 4, borderRadius: 2 },
  content:     { padding: 20, gap: 14, paddingBottom: 40 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle:  { fontSize: 20, fontWeight: '800' },
  closeBtn:    { borderWidth: 1, borderRadius: 20, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  idRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  idLabel:     { fontSize: 12, fontWeight: '500' },
  idValue:     { flex: 1, fontSize: 13, fontWeight: '700' },
  routeCard:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, borderRadius: 14, padding: 14 },
  routeItem:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeNet:    { fontSize: 15, fontWeight: '700' },
  routeWallet: { fontSize: 12 },
  amount:      { fontSize: 32, fontWeight: '800', textAlign: 'center' },
  urgentBadge: { alignSelf: 'center', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 5 },
  detailCard:  { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  detailRow:   { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1 },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  actions:     { gap: 10 },
  actionBtn:   { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
