import { useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { submitRequest } from '../utils/firestore';

const QUEUE_KEY = 'silverstone_offline_queue';

export function useOfflineQueue(userId, agentName) {
  const [isOnline, setIsOnline]   = useState(true);
  const [syncing, setSyncing]     = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const prevOnline = useRef(true);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);

      // Just came back online — trigger sync
      if (online && !prevOnline.current) {
        syncQueue();
      }
      prevOnline.current = online;
    });
    return () => unsub();
  }, [userId, agentName]);

  const enqueue = async (requestData) => {
    try {
      const raw   = await AsyncStorage.getItem(QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      queue.push({ ...requestData, queuedAt: Date.now() });
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (_) {}
  };

  const syncQueue = async () => {
    if (!userId) return;
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      if (!raw) return;
      const queue = JSON.parse(raw);
      if (!queue.length) return;

      setSyncing(true);
      let uploaded = 0;
      for (const item of queue) {
        try {
          await submitRequest(userId, agentName ?? 'Agent', item);
          uploaded++;
        } catch (_) {}
      }
      await AsyncStorage.removeItem(QUEUE_KEY);
      setSyncedCount(uploaded);
      // Auto-clear toast after 4s
      setTimeout(() => setSyncedCount(0), 4000);
    } catch (_) {
    } finally {
      setSyncing(false);
    }
  };

  const getPendingCount = async () => {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw).length : 0;
    } catch {
      return 0;
    }
  };

  return { isOnline, syncing, syncedCount, enqueue, syncQueue, getPendingCount };
}
