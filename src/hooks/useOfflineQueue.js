import { useEffect,useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
// Legacy queued records are deliberately neither read, replayed nor removed.
// Identity-bound idempotent offline exchanges are Phase 3 work.
export function useOfflineQueue() {
  const [isOnline,setIsOnline]=useState(true);
  useEffect(()=>NetInfo.addEventListener(state=>setIsOnline(!!state.isConnected && state.isInternetReachable!==false)),[]);
  const disabled=async()=>{throw new Error('Exchange submission is not available yet.');};
  return {isOnline,syncing:false,syncedCount:0,enqueue:disabled,syncQueue:disabled,getPendingCount:async()=>0};
}
