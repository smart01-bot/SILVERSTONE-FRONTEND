// src/screens/main-agent/QueueScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import {
  collection, query, orderBy,
  onSnapshot, doc, updateDoc, Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';

const REJECTION_REASONS = [
  'Insufficient float',
  'Invalid phone number',
  'Duplicate request',
  'Other',
];

export default function QueueScreen() {
  const { theme, isDark } = useTheme();

  const [requests,   setRequests]   = useState([]);
  const [filter,     setFilter]     = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [loading,    setLoading]    = useState(null);

  const FILTERS = ['All', 'Urgent', 'Pending', 'Approved'];

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'requests'), orderBy('createdAt', 'desc')),
      snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort: urgent pending first, then normal pending, then approved
        docs.sort((a, b) => {
          if (a.urgent && !b.urgent) return -1;
          if (!a.urgent && b.urgent) return 1;
          return 0;
        });
        setRequests(docs);
      }
    );
    return unsub;
  }, []);

  const filtered = requests.filter(r => {
    if (filter === 'All')     return r.status === 'pending' || r.status === 'approved';
    if (filter === 'Urgent')  return r.status === 'pending' && r.urgent;
    if (filter === 'Pending') return r.status === 'pending';
    if (filter === 'Approved')return r.status === 'approved';
    return true;
  });

  const pendingCount  = requests.filter(r => r.status === 'pending').length;
  const urgentCount   = requests.filter(r => r.status === 'pending' && r.urgent).length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;

  const waitMins = (createdAt) => {
    if (!createdAt?.toDate) return 0;
    return Math.floor((Date.now() - createdAt.toDate().getTime()) / 60000);
  };

  const waitColor = (mins) => {
    if (mins < 5)  return '#16A34A';
    if (mins < 15) return '#F59E0B';
    return '#C8102E';
  };

  const handleApprove = async (req) => {
    setLoading(req.id + '_approve');
    try {
      await updateDoc(doc(db, 'requests', req.id), {
        status:     'approved',
        approvedAt: Timestamp.now(),
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to approve request.');
    } finally {
      setLoading(null);
    }
  };

  const handleProcess = async (req) => {
    Alert.alert(
      'Process Transfer',
      `Confirm transfer of TZS ${Number(req.amount).toLocaleString()} from ${req.sourceNetwork} to ${req.destNetwork}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            setLoading(req.id + '_process');
            try {
              await updateDoc(doc(db, 'requests', req.id), {
                status:      'completed',
                processedAt: Timestamp.now(),
              });
            } catch (e) {
              Alert.alert('Error', 'Failed to process transfer.');
            } finally {
              setLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = (req) => {
    Alert.alert(
      'Reject Request',
      'Select a reason:',
      [
        ...REJECTION_REASONS.map(reason => ({
          text: reason,
          onPress: async () => {
            setLoading(req.id + '_reject');
            try {
              await updateDoc(doc(db, 'requests', req.id), {
                status:          'rejected',
                rejectionReason: reason,
                rejectedAt:      Timestamp.now(),
              });
            } catch (e) {
              Alert.alert('Error', 'Failed to reject request.');
            } finally {
              setLoading(null);
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#C8102E"
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Queue</Text>
          <Text style={styles.headerSub}>
            {pendingCount} pending · {urgentCount} urgent · {approvedCount} approved
          </Text>
        </View>
        <View style={styles.iconBtn}>
          <Ionicons name="options-outline" size={20} color="#fff" />
        </View>
      </View>

      {/* Filter pills */}
      <View style={[styles.filters, { backgroundColor: theme.bg }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: filter === f ? theme.primary : theme.surfaceAlt,
                    borderColor:     filter === f ? theme.primary : theme.border,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text style={[
                  styles.pillText,
                  { color: filter === f ? '#fff' : theme.textDim },
                ]}>
                  {f}
                  {f === 'Urgent' && urgentCount > 0 ? ` ${urgentCount}` : ''}
                  {f === 'Pending' && pendingCount > 0 ? ` ${pendingCount}` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#C8102E']}
            tintColor="#C8102E"
          />
        }
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={56} color={theme.muted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Queue is clear
            </Text>
            <Text style={[styles.emptyText, { color: theme.textDim }]}>
              All requests have been processed
            </Text>
          </View>
        ) : (
          filtered.map(req => {
            const mins = waitMins(req.createdAt);
            return (
              <View
                key={req.id}
                style={[styles.card, {
                  backgroundColor: theme.surfaceAlt,
                  borderColor:     theme.border,
                  borderLeftColor: req.urgent ? '#F59E0B' : theme.border,
                }]}
              >
                {/* Agent + urgent tag */}
                <View style={styles.cardTop}>
                  <View style={styles.agentRow}>
                    <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
                      <Text style={[styles.avatarText, { color: theme.primary }]}>
                        {req.agentName?.charAt(0)?.toUpperCase() ?? 'A'}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.agentName, { color: theme.text }]}>
                        {req.agentName ?? 'Agent'}
                      </Text>
                      <Text style={[styles.agentSub, { color: theme.textDim }]}>
                        Waiting {mins} min
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardTopRight}>
                    {req.urgent && (
                      <View style={styles.urgentTag}>
                        <Text style={styles.urgentText}>URGENT</Text>
                      </View>
                    )}
                    <View style={[
                      styles.waitBadge,
                      { backgroundColor: waitColor(mins) + '20' },
                    ]}>
                      <Text style={[styles.waitText, { color: waitColor(mins) }]}>
                        {mins}m
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Route + amount */}
                <View style={styles.routeRow}>
                  <Text style={[styles.route, { color: theme.text }]}>
                    {req.sourceNetwork}
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={theme.textDim} />
                  <Text style={[styles.route, { color: theme.text }]}>
                    {req.destNetwork}
                  </Text>
                  <Text style={[styles.amount, { color: theme.primary }]}>
                    TZS {Number(req.amount).toLocaleString()}
                  </Text>
                </View>

                {/* Phones */}
                <View style={styles.phonesRow}>
                  <Text style={[styles.phone, { color: theme.textDim }]}>
                    From: {req.sourcePhone}
                  </Text>
                  <Text style={[styles.phone, { color: theme.textDim }]}>
                    To: {req.destPhone}
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  {req.status === 'pending' && (
                    <TouchableOpacity
                      onPress={() => handleApprove(req)}
                      style={[styles.btnOutline, { borderColor: '#0891B2' }]}
                      activeOpacity={0.75}
                    >
                      {loading === req.id + '_approve'
                        ? <ActivityIndicator size="small" color="#0891B2" />
                        : <Text style={[styles.btnOutlineText, { color: '#0891B2' }]}>
                            Approve
                          </Text>
                      }
                    </TouchableOpacity>
                  )}
                  {(req.status === 'pending' || req.status === 'approved') && (
                    <TouchableOpacity
                      onPress={() => handleProcess(req)}
                      style={[styles.btnFilled, { backgroundColor: '#C8102E' }]}
                      activeOpacity={0.85}
                    >
                      {loading === req.id + '_process'
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.btnFilledText}>Process</Text>
                      }
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleReject(req)}
                    style={[styles.btnOutline, { borderColor: theme.border }]}
                    activeOpacity={0.75}
                  >
                    {loading === req.id + '_reject'
                      ? <ActivityIndicator size="small" color={theme.textDim} />
                      : <Text style={[styles.btnOutlineText, { color: theme.textDim }]}>
                          Reject
                        </Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: 16, paddingBottom: 100 },

  header: {
    backgroundColor:       '#C8102E',
    paddingHorizontal:     18,
    paddingTop:            10,
    paddingBottom:         14,
    flexDirection:         'row',
    alignItems:            'center',
    justifyContent:        'space-between',
    borderBottomLeftRadius:  24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize:   20,
    fontWeight: '800',
    color:      '#fff',
  },
  headerSub: {
    fontSize:  12,
    color:     'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  iconBtn: {
    width:          34,
    height:         34,
    borderRadius:   10,
    backgroundColor:'rgba(255,255,255,0.15)',
    alignItems:     'center',
    justifyContent: 'center',
  },

  filters: {
    paddingVertical:   10,
    paddingHorizontal: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap:           8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical:   7,
    borderRadius:      9999,
    borderWidth:       1,
  },
  pillText: {
    fontSize:   13,
    fontWeight: '600',
  },

  empty: {
    alignItems:  'center',
    paddingTop:  80,
    gap:         12,
  },
  emptyTitle: {
    fontSize:   18,
    fontWeight: '700',
  },
  emptyText: { fontSize: 14 },

  card: {
    borderRadius:   16,
    borderWidth:    1,
    borderLeftWidth: 4,
    padding:        16,
    marginBottom:   12,
    gap:            12,
  },
  cardTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  agentRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  avatar: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize:   15,
    fontWeight: '700',
  },
  agentName: {
    fontSize:   14,
    fontWeight: '600',
  },
  agentSub: {
    fontSize:  12,
    marginTop: 1,
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  urgentTag: {
    backgroundColor:  '#F59E0B20',
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
  waitBadge: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      6,
  },
  waitText: {
    fontSize:   11,
    fontWeight: '700',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  route: {
    fontSize:   14,
    fontWeight: '600',
  },
  amount: {
    fontSize:   16,
    fontWeight: '800',
    marginLeft: 'auto',
  },
  phonesRow: {
    flexDirection: 'row',
    gap:           16,
  },
  phone: { fontSize: 12 },

  actions: {
    flexDirection: 'row',
    gap:           8,
    marginTop:     4,
  },
  btnOutline: {
    flex:           1,
    height:         38,
    borderRadius:   10,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    fontSize:   13,
    fontWeight: '600',
  },
  btnFilled: {
    flex:           1,
    height:         38,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
  },
  btnFilledText: {
    color:      '#fff',
    fontSize:   13,
    fontWeight: '700',
  },
});