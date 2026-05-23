// src/hooks/useOfflineQueue.js
// Offline-first request queue. Stores to AsyncStorage when offline,
// drains to the backend API on reconnect.

import { useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const QUEUE_KEY = 'silverstone_offline_queue';

export function useOfflineQueue(agentId, agentName) {
  const [isOnline,    setIsOnline]    = useState(true);
  const [syncing,     setSyncing]     = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const prevOnline = useRef(true);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      if (online && !prevOnline.current) syncQueue();
      prevOnline.current = online;
    });
    return () => unsub();
  }, [agentId, agentName]);

  const enqueue = async (requestData) => {
    try {
      const raw   = await AsyncStorage.getItem(QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      queue.push({ ...requestData, queuedAt: Date.now() });
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch {}
  };

  const syncQueue = async () => {
    if (!agentId) return;
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      if (!raw) return;
      const queue = JSON.parse(raw);
      if (!queue.length) return;

      setSyncing(true);
      let uploaded = 0;
      for (const item of queue) {
        try {
          await api.post('/api/requests/submit', {
            subAgentId:           agentId,
            subagent_name:        agentName ?? 'Agent',
            requested_network:    item.destNetwork,
            source_network:       item.sourceNetwork,
            requested_phoneNumber: item.destPhone,
            source_phoneNumber:   item.sourcePhone,
            amount:               item.amount,
            urgency:              item.urgent ?? false,
          });
          uploaded++;
        } catch {}
      }
      await AsyncStorage.removeItem(QUEUE_KEY);
      setSyncedCount(uploaded);
      setTimeout(() => setSyncedCount(0), 4000);
    } catch {
    } finally {
      setSyncing(false);
    }
  };

  const getPendingCount = async () => {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw).length : 0;
    } catch { return 0; }
  };

  return { isOnline, syncing, syncedCount, enqueue, syncQueue, getPendingCount };
}