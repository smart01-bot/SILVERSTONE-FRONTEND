import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../config/api";
import { createExchangeOutbox } from "../api/offlineExchanges";
import { sendExchange, newExchangeKey } from "../api/exchanges";
const outbox = createExchangeOutbox({
  storage: AsyncStorage,
  send: sendExchange,
  currentOwner: api.currentOwner,
  newKey: newExchangeKey,
});
export function useOfflineQueue(owner) {
  const [isOnline, setOnline] = useState(false),
    [syncing, setSyncing] = useState(false),
    [syncedCount, setCount] = useState(0),
    [pendingCount, setPending] = useState(0),
    [queueError, setError] = useState("");
  const refresh = async () => {
    const rows = await outbox.list(owner);
    if (api.currentOwner() !== owner) return;
    setPending(rows.length);
    setError(rows.find((r) => r.lastError)?.lastError || "");
  };
  const syncQueue = async () => {
    if (!owner) return;
    setSyncing(true);
    try {
      const result = await outbox.sync(owner);
      if (api.currentOwner() !== owner) return result;
      setCount(result.submitted.length);
      await refresh();
      return result;
    } catch (e) {
      if (api.currentOwner() === owner) setError(e.message);
    } finally {
      if (api.currentOwner() === owner) setSyncing(false);
    }
  };
  useEffect(
    () =>
      NetInfo.addEventListener((s) =>
        setOnline(!!s.isConnected && s.isInternetReachable !== false),
      ),
    [],
  );
  useEffect(() => {
    setSyncing(false);
    setCount(0);
    setPending(0);
    setError("");
    if (owner) refresh().catch((e) => { if (api.currentOwner() === owner) setError(e.message); });
  }, [owner]);
  useEffect(() => {
    if (owner && isOnline) syncQueue();
  }, [owner, isOnline]);
  return {
    isOnline,
    syncing,
    syncedCount,
    pendingCount,
    queueError,
    syncQueue,
    enqueue: async (payload) => {
      const r = await outbox.enqueue(owner, payload);
      await refresh();
      return r;
    },
    getPendingCount: async () => (await outbox.list(owner)).length,
  };
}
