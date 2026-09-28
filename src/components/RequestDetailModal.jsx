import { api } from '../config/api';
import { requestView } from '../api/presentation';
import { legLabel, nextActionLabel, workflowError } from '../api/workflowState';
import { exchangeAction, formatTzs } from '../api/exchanges';
import { providerChargeLabel, providerEvidenceLabel } from '../api/providerEvidence';
// src/components/RequestDetailModal.jsx
import React, { useRef, useEffect, useState } from 'react';
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

const fmt = (n) => `TZS ${formatTzs(n)}`;

function NetDot({ network, size = 10 }) {
  return (
    <View style={{
      width:           size,
      height:          size,
      borderRadius:    size / 2,
      backgroundColor: NETWORK_COLORS[network] ?? '#888',
    }} />
  );
}

export default function RequestDetailModal({
  request: initialRequest, visible, onClose, role = 'sub-agent', onRetry,
}) {
  const { theme, lang } = useTheme();
  const { showLoader, hideLoader } = useLoader();
  const [loading,setLoading]=useState(false);
  const [request, setRequest] = useState(initialRequest);
  const [error, setError] = useState('');
  useEffect(() => { setRequest(initialRequest); setError(''); }, [initialRequest, visible]);
  const refresh = async () => {
    if (loading || !request) return;
    setLoading(true);
    try { setRequest(requestView(await api.call(`/requests/${request.id}`))); setError(''); }
    catch(e) { setError(workflowError(e)); }
    finally { setLoading(false); }
  };
  const { user }        = useAuth();

  const translateY     = useRef(new Animated.Value(600)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0, tension: 65, friction: 11, useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1, duration: 220, useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 600, duration: 240, useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0, duration: 200, useNativeDriver: true,
        }),
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
          Animated.spring(translateY, {
            toValue: 0, useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!request) return null;

  const copyId = async () => {
    try {
      await Clipboard.setStringAsync(request.id);
      Alert.alert('Copied', 'Request ID copied to clipboard');
    } catch (e) {}
  };

  const handleApprove = async () => {
    setLoading(true);showLoader();
    try {
      await exchangeAction(request,'accept');
      onClose();
    } catch (e) {
      setError(workflowError(e));
    } finally {
      setLoading(false);hideLoader();
    }
  };

  const handleReject = () => {
    Alert.alert('Reject request','Select a reason',[
      ...['Insufficient capacity','Incorrect account details','Duplicate request'].map(reason=>({text:reason,onPress:async()=>{
        setLoading(true);showLoader();
        try {await exchangeAction(request,'reject',reason);onClose();}
        catch(e){setError(workflowError(e));}
        finally{setLoading(false);hideLoader();}
      }})),{text:'Keep request',style:'cancel'},
    ]);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Request',
      'Cancel this pending request?',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);showLoader();
            try {
              await exchangeAction(request,'cancel');
              onClose();
            } catch (e) {
              setError(workflowError(e));
            } finally {
              setLoading(false);hideLoader();
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View accessibilityViewIsModal style={[
        styles.sheet,
        { backgroundColor: theme.surface, transform: [{ translateY }] },
      ]}>
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={styles.handleArea}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              Request Details
            </Text>
            <TouchableOpacity
              accessibilityRole="button" accessibilityLabel="Close request details" hitSlop={8}
              onPress={onClose}
              style={[styles.closeBtn, {
                backgroundColor: theme.surfaceAlt,
                borderColor:     theme.border,
              }]}
            >
              <Ionicons name="close" size={16} color={theme.textDim} />
            </TouchableOpacity>
          </View>

          <StatusBadge status={request.status} />

          {/* Request ID */}
          <TouchableOpacity
            onPress={copyId}
            style={[styles.idRow, {
              backgroundColor: theme.surfaceAlt,
              borderColor:     theme.border,
            }]}
          >
            <Text style={[styles.idLabel, { color: theme.textDim }]}>
              Request ID
            </Text>
            <Text style={[styles.idValue, { color: theme.text }]}>
              #{request.id?.slice(-8).toUpperCase()}
            </Text>
            <Ionicons name="copy-outline" size={14} color={theme.primary} />
          </TouchableOpacity>

          {/* Route */}
          <View style={[styles.routeCard, {
            backgroundColor: theme.surfaceAlt,
            borderColor:     theme.border,
          }]}>
            <View style={styles.routeItem}>
              <NetDot network={request.sourceNetwork} size={12} />
              <View>
                <Text style={[styles.routeNet, { color: theme.text }]}>
                  {request.sourceNetwork}
                </Text>
                <Text style={[styles.routeWallet, { color: theme.textDim }]}>
                  {NETWORK_WALLETS?.[request.sourceNetwork] ?? ''}
                </Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={18} color={theme.textDim} />
            <View style={styles.routeItem}>
              <NetDot network={request.destNetwork} size={12} />
              <View>
                <Text style={[styles.routeNet, { color: theme.text }]}>
                  {request.destNetwork}
                </Text>
                <Text style={[styles.routeWallet, { color: theme.textDim }]}>
                  {NETWORK_WALLETS?.[request.destNetwork] ?? ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Amount */}
          <Text style={[styles.amount, { color: theme.primary }]}>
            {fmt(request.amount)}
          </Text>

          {request.urgent && (
            <View style={[styles.urgentBadge, { backgroundColor: '#FEF3C720' }]}>
              <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 13 }}>
                URGENT
              </Text>
            </View>
          )}

          {/* Detail rows */}
          <View style={[styles.detailCard, {
            backgroundColor: theme.surfaceAlt,
            borderColor:     theme.border,
          }]}>
            {[
              ['Source account', request.sourcePhone],
              ['Destination account',   request.destPhone],
              role === 'main-agent' && request.agentName
                ? ['Agent', request.agentName]
                : null,
              ['Submitted',    timeAgo(request.createdAt, lang)],
              request.processedAt
                ? ['Processed', timeAgo(request.processedAt, lang)]
                : null,
            ].filter(Boolean).map(([label, value]) => (
              <View
                key={label}
                style={[styles.detailRow, { borderBottomColor: theme.border }]}
              >
                <Text style={[styles.detailLabel, { color: theme.textDim }]}>
                  {label}
                </Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {value}
                </Text>
              </View>
            ))}
          </View>

          <Text style={{color:theme.textDim}}>{nextActionLabel(request)}</Text>
          <Text style={{color:theme.textDim}}>Silverstone fee: TZS 0 · {providerChargeLabel(request.provider)}</Text>
          <Text style={{color:theme.textDim}}>Provider unavailable. Do not send funds.</Text>
          {request.providerEvidence?.map(evidence => <Text key={evidence.id} style={{color:theme.textDim}}>{providerEvidenceLabel(evidence)}</Text>)}
          {request.legs?.map(leg=><Text key={leg.id} style={{color:theme.textDim}}>{legLabel(leg)}</Text>)}
          {request.history?.map((event,i)=><Text key={i} style={{color:theme.textDim}}>{event.event}: {event.reason}</Text>)}
          {request.reservation && <Text style={{color:theme.textDim}}>Reservation: {request.reservation.status}. A reservation is not a payment.</Text>}
          {error ? <Text accessibilityRole="alert" style={{color:theme.text}}>{error}</Text> : null}
          <TouchableOpacity accessibilityRole="button" accessibilityState={{disabled:loading,busy:loading}} disabled={loading} onPress={refresh} style={{minHeight:48,justifyContent:'center'}}><Text style={{color:theme.primary}}>{loading ? 'Please wait…' : 'Refresh request details'}</Text></TouchableOpacity>
          {/* Actions */}
          <View style={styles.actions}>
            {role === 'sub-agent' && request.status === 'rejected' && (
              <TouchableOpacity
                onPress={() => { onClose(); onRetry?.(request); }}
                style={[styles.actionBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.actionBtnText}>Prepare a new request</Text>
              </TouchableOpacity>
            )}
            {role === 'sub-agent' && request.status === 'awaiting_review' && (
              <TouchableOpacity
                onPress={handleCancel}
                disabled={loading}
                style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}
              >
                {<Text style={styles.actionBtnText}>Cancel Request</Text>
                }
              </TouchableOpacity>
            )}
            {role === 'main-agent' && request.status === 'awaiting_review' && (
              <TouchableOpacity
                onPress={handleApprove}
                disabled={loading}
                style={[styles.actionBtn, { backgroundColor: '#0891B2' }]}
              >
                {<Text style={styles.actionBtnText}>Accept and reserve</Text>
                }
              </TouchableOpacity>
            )}
            {role === 'main-agent' &&
              (request.status === 'awaiting_review' || request.status === 'awaiting_source') && (
              <TouchableOpacity
                onPress={handleReject}
                disabled={loading}
                style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}
              >
                <Text style={styles.actionBtnText}>Reject</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onClose}
              style={[styles.actionBtn, {
                backgroundColor: theme.surfaceAlt,
                borderColor:     theme.border,
                borderWidth:     1,
              }]}
            >
              <Text style={[styles.actionBtnText, { color: theme.textDim }]}>
                Dismiss
              </Text>
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
    position:            'absolute',
    bottom:              0,
    left:                0,
    right:               0,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    maxHeight:           '90%',
    shadowColor:         '#000',
    shadowOffset:        { width: 0, height: -4 },
    shadowOpacity:       0.15,
    shadowRadius:        16,
    elevation:           20,
  },
  handleArea: {
    paddingTop:    12,
    paddingBottom: 4,
    alignItems:    'center',
  },
  handle: {
    width:        40,
    height:       4,
    borderRadius: 2,
  },
  content: {
    padding:       20,
    gap:           14,
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  sheetTitle: {
    fontSize:   20,
    fontWeight: '800',
  },
  closeBtn: {
    borderWidth:    1,
    borderRadius:   20,
    width:          32,
    height:         32,
    alignItems:     'center',
    justifyContent: 'center',
  },
  idRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    borderWidth:   1,
    borderRadius:  10,
    padding:       10,
  },
  idLabel: { fontSize: 12, fontWeight: '500' },
  idValue: {
    flex:       1,
    fontSize:   13,
    fontWeight: '700',
  },
  routeCard: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-around',
    borderWidth:    1,
    borderRadius:   14,
    padding:        14,
  },
  routeItem:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeNet:    { fontSize: 15, fontWeight: '700' },
  routeWallet: { fontSize: 12 },
  amount: {
    fontSize:   32,
    fontWeight: '800',
    textAlign:  'center',
  },
  urgentBadge: {
    alignSelf:         'center',
    borderRadius:      12,
    paddingHorizontal: 14,
    paddingVertical:   5,
  },
  detailCard: {
    borderRadius: 14,
    borderWidth:  1,
    overflow:     'hidden',
  },
  detailRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    padding:        12,
    borderBottomWidth: 1,
  },
  detailLabel: { fontSize: 13 },
  detailValue: {
    fontSize:   13,
    fontWeight: '600',
    maxWidth:   '60%',
    textAlign:  'right',
  },
  actions:       { gap: 10 },
  actionBtn: {
    borderRadius:   14,
    paddingVertical: 14,
    alignItems:     'center',
  },
  actionBtnText: {
    color:      '#fff',
    fontWeight: '700',
    fontSize:   15,
  },
});