// src/components/RequestDetailModal.jsx
import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Animated, PanResponder, Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import StatusBadge from './StatusBadge';
import NetworkBadge from './NetworkBadge';
import * as Clipboard from 'expo-clipboard';

const NETWORK_COLORS = {
  Voda:    '#E40000',
  Yas:     '#0070B8',
  Airtel:  '#FF0000',
  Halotel: '#D4A017',
};

export default function RequestDetailModal({
  visible,
  request,
  onClose,
  isMainAgent = false,
  onRetry,
}) {
  const { theme, isDark } = useTheme();

  const translateY = useRef(new Animated.Value(600)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0, tension: 60, friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1, duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 600, duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0, duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 10,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100) {
          onClose?.();
        } else {
          Animated.spring(translateY, {
            toValue: 0, useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const fmt = (n) => {
    if (!n) return 'TZS 0';
    const num = Number(n);
    if (num >= 1_000_000) return `TZS ${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000)     return `TZS ${(num / 1_000).toFixed(0)}k`;
    return `TZS ${num}`;
  };

  const timeAgo = (ts) => {
    if (!ts?.toDate) return '';
    const secs = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
    if (secs < 60)    return 'Just now';
    if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  };

  const copyId = async () => {
    if (request?.id) {
      await Clipboard.setStringAsync(request.id.slice(-8).toUpperCase());
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'requests', request.id), {
                status: 'cancelled',
              });
              onClose?.();
            } catch (e) {
              Alert.alert('Error', 'Failed to cancel.');
            }
          },
        },
      ]
    );
  };

  if (!request) return null;

  const shortId = request.id?.slice(-8)?.toUpperCase() ?? '—';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.surface,
            transform: [{ translateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: theme.border }]} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Request ID */}
          <TouchableOpacity
            onPress={copyId}
            style={styles.idRow}
            activeOpacity={0.7}
          >
            <Text style={[styles.idText, { color: theme.textDim }]}>
              #{shortId}
            </Text>
            <Ionicons name="copy-outline" size={14} color={theme.textDim} />
          </TouchableOpacity>

          {/* Status */}
          <View style={styles.statusRow}>
            <StatusBadge status={request.status} />
            {request.urgent && (
              <View style={styles.urgentTag}>
                <Text style={styles.urgentText}>URGENT</Text>
              </View>
            )}
          </View>

          {/* Route */}
          <View style={styles.routeRow}>
            <NetworkBadge network={request.sourceNetwork} />
            <Ionicons name="arrow-forward" size={16} color={theme.textDim} />
            <NetworkBadge network={request.destNetwork} />
          </View>

          {/* Amount */}
          <Text style={[styles.amount, { color: theme.primary }]}>
            {fmt(request.amount)}
          </Text>

          {/* Details */}
          <View style={[styles.detailsCard, {
            backgroundColor: theme.surfaceAlt,
            borderColor:     theme.border,
          }]}>
            {[
              { label: 'From Phone',   value: request.sourcePhone },
              { label: 'To Phone',     value: request.destPhone },
              { label: 'Submitted',    value: timeAgo(request.createdAt) },
              { label: 'Agent',        value: request.agentName },
              request.processedAt
                ? { label: 'Processed', value: timeAgo(request.processedAt) }
                : null,
              request.rejectionReason
                ? { label: 'Reason', value: request.rejectionReason }
                : null,
            ].filter(Boolean).map((row, i, arr) => (
              <View key={row.label}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textDim }]}>
                    {row.label}
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {row.value ?? '—'}
                  </Text>
                </View>
                {i < arr.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                )}
              </View>
            ))}
          </View>

          {/* Sub-agent actions */}
          {!isMainAgent && (
            <View style={styles.actions}>
              {request.status === 'pending' && (
                <TouchableOpacity
                  onPress={handleCancel}
                  style={[styles.actionBtn, { borderColor: '#C8102E' }]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.actionText, { color: '#C8102E' }]}>
                    Cancel Request
                  </Text>
                </TouchableOpacity>
              )}
              {request.status === 'rejected' && (
                <TouchableOpacity
                  onPress={() => { onClose?.(); onRetry?.(request); }}
                  style={[styles.actionBtn, { borderColor: theme.primary }]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.actionText, { color: theme.primary }]}>
                    Retry Request
                  </Text>
                </TouchableOpacity>
              )}
              {request.status === 'completed' && (
                <TouchableOpacity
                  onPress={async () => {
                    const text = `SILVERSTONE RECEIPT\n${'-'.repeat(20)}\nRoute: ${request.sourceNetwork} → ${request.destNetwork}\nAmount: ${fmt(request.amount)}\nFrom: ${request.sourcePhone}\nTo: ${request.destPhone}\nStatus: Completed\nID: #${shortId}`;
                    await Clipboard.setStringAsync(text);
                    Alert.alert('Copied', 'Receipt copied — paste in WhatsApp');
                  }}
                  style={[styles.actionBtn, { borderColor: '#16A34A' }]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.actionText, { color: '#16A34A' }]}>
                    Share Receipt
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: theme.surfaceAlt }]}
            activeOpacity={0.75}
          >
            <Text style={[styles.closeBtnText, { color: theme.text }]}>
              Close
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position:           'absolute',
    bottom:             0,
    left:               0,
    right:              0,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    maxHeight:          '85%',
    paddingBottom:      32,
  },
  handle: {
    width:        40,
    height:       4,
    borderRadius: 2,
    alignSelf:    'center',
    marginTop:    12,
    marginBottom: 4,
  },
  content: {
    padding:    20,
    gap:        12,
  },
  idRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  idText: {
    fontSize:      12,
    fontWeight:    '600',
    letterSpacing: 0.4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  urgentTag: {
    backgroundColor:   '#F59E0B20',
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      6,
  },
  urgentText: {
    color:         '#F59E0B',
    fontSize:      10,
    fontWeight:    '700',
    letterSpacing: 0.6,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  amount: {
    fontSize:      28,
    fontWeight:    '800',
    letterSpacing: -0.5,
  },
  detailsCard: {
    borderRadius: 14,
    borderWidth:  1,
    overflow:     'hidden',
  },
  detailRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        12,
  },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: '600' },
  divider:     { height: 1 },
  actions: {
    gap: 8,
  },
  actionBtn: {
    height:         48,
    borderRadius:   12,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
  },
  actionText: { fontSize: 14, fontWeight: '600' },
  closeBtn: {
    height:         48,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      4,
  },
  closeBtnText: { fontSize: 14, fontWeight: '600' },
});