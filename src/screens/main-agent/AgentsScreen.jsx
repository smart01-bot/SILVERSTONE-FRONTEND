import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { listenAgents } from '../../utils/firestore';
import NetworkBadge from '../../components/NetworkBadge';
import StatusBadge from '../../components/StatusBadge';
import Avatar from '../../components/Avatar';

export default function AgentsScreen() {
  const { theme, tr } = useTheme();
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    return listenAgents(setAgents);
  }, []);

  const approved = agents.filter(a => a.status === 'approved');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{tr('agentRoster')}</Text>
        <Text style={[styles.count, { color: theme.textDim }]}>{approved.length} active</Text>
      </View>

      <FlatList
        data={approved}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, ...theme.shadow }]}>
            <View style={styles.top}>
              <Avatar name={item.name ?? 'A'} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.phone, { color: theme.textDim }]}>{item.phone}</Text>
                <Text style={[styles.loc, { color: theme.textDim }]}>{item.businessLocation}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            {item.networks?.length > 0 && (
              <View style={styles.nets}>
                {item.networks.map(n => <NetworkBadge key={n} network={n} showWallet />)}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={theme.muted ?? theme.textDim} />
            <Text style={[{ fontSize: 15, fontWeight: '700', color: theme.text }]}>No approved agents yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  header: { padding: 16, paddingBottom: 8 },
  title:  { fontSize: 22, fontWeight: '800' },
  count:  { fontSize: 13, marginTop: 2 },
  list:   { padding: 16, gap: 12, paddingBottom: 100 },
  card:   { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  top:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700' },
  name:   { fontSize: 16, fontWeight: '700' },
  phone:  { fontSize: 13 },
  loc:    { fontSize: 12 },
  nets:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  empty:  { alignItems: 'center', gap: 12, paddingTop: 60 },
});