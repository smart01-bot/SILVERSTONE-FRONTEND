// src/context/AuthContext.jsx
// Auth via the Silverstone backend API. No Firebase.
// JWT stored in SecureStore, sent as Bearer token on every request.

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { tokenStore } from '../config/api';

const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 min background → lock
const LAST_ACTIVE_KEY = 'silverstone_last_active';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user,          setUser]          = useState(null); // agent object from API
  const [profile,       setProfile]       = useState(null); // same as user, kept for nav compat
  const [authLoading,   setAuthLoading]   = useState(true);
  const [sessionLocked, setSessionLocked] = useState(false);

  const hasInitializedSession = useRef(false);
  const profilePollRef        = useRef(null);

  // ── Helpers ───────────────────────────────────────────────
  const pinKey = (id) => `silverstone_pin_${id}`;

  const setAgent = useCallback((agent) => {
    setUser(agent);
    setProfile(agent);
  }, []);

  const clearAgent = useCallback(() => {
    setUser(null);
    setProfile(null);
    setSessionLocked(false);
    hasInitializedSession.current = false;
  }, []);

  // ── Poll profile every 30s (replaces Firestore onSnapshot) ─
  const startProfilePoll = useCallback((id) => {
    stopProfilePoll();
    profilePollRef.current = setInterval(async () => {
      try {
        const { agent } = await api.get('/api/auth/me');
        setAgent(agent);
      } catch {
        // token expired or network error — stop polling, clear session
        stopProfilePoll();
        await tokenStore.delete();
        clearAgent();
      }
    }, 30_000);
  }, [setAgent, clearAgent]);

  const stopProfilePoll = () => {
    if (profilePollRef.current) {
      clearInterval(profilePollRef.current);
      profilePollRef.current = null;
    }
  };

  // ── App startup: try to restore session from SecureStore ──
  useEffect(() => {
    const restore = async () => {
      try {
        const token = await tokenStore.get();
        if (!token) { setAuthLoading(false); return; }

        const { agent } = await api.get('/api/auth/me');
        setAgent(agent);

        if (!hasInitializedSession.current) {
          hasInitializedSession.current = true;
          if (agent.pin_set) setSessionLocked(true);
        }

        startProfilePoll(agent.id);
      } catch {
        await tokenStore.delete();
      } finally {
        setAuthLoading(false);
      }
    };
    restore();
    return () => stopProfilePoll();
  }, []);

  // ── AppState: lock after >5 min background ────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        const saved   = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
        const elapsed = saved ? Date.now() - parseInt(saved, 10) : 0;
        if (elapsed > SESSION_TIMEOUT && user && profile?.pin_set) {
          setSessionLocked(true);
        }
        await AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      } else {
        await AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      }
    });
    return () => sub.remove();
  }, [user, profile]);

  // ── Login ─────────────────────────────────────────────────
  const login = async (email, password) => {
    const { token, agent } = await api.post('/api/auth/login', { email, password });
    await tokenStore.set(token);
    setAgent(agent);
    hasInitializedSession.current = false;
    if (agent.pin_set) setSessionLocked(true);
    startProfilePoll(agent.id);
  };

  // ── Register ──────────────────────────────────────────────
  const register = async (payload) => {
    const { token, agent } = await api.post('/api/auth/register', payload);
    await tokenStore.set(token);
    setAgent(agent);
    startProfilePoll(agent.id);
    return agent;
  };

  // ── PIN management (device-side, SecureStore) ─────────────
  const savePin = async (pin) => {
    if (!user) throw new Error('Not authenticated');
    await SecureStore.setItemAsync(pinKey(user.id), pin);
    await api.post('/api/auth/set-pin', {});           // flip pin_set flag on backend
    setProfile(prev => prev ? { ...prev, pin_set: true } : prev);
    setUser(prev => prev ? { ...prev, pin_set: true } : prev);
  };

  const verifyPin = async (pin) => {
    if (!user) return false;
    try {
      const stored = await SecureStore.getItemAsync(pinKey(user.id));
      return stored === pin;
    } catch { return false; }
  };

  const checkPinExists = async () => {
    if (!user) return false;
    try {
      const stored = await SecureStore.getItemAsync(pinKey(user.id));
      return !!stored && profile?.pin_set === true;
    } catch { return false; }
  };

  const resetPin = async () => {
    if (!user) return;
    try {
      await SecureStore.deleteItemAsync(pinKey(user.id));
      await api.put(`/api/agents/${user.id}`, { pin_set: false });
      setProfile(prev => prev ? { ...prev, pin_set: false } : prev);
      setUser(prev => prev ? { ...prev, pin_set: false } : prev);
    } catch {}
  };

  const unlockSession = () => setSessionLocked(false);

  // ── Logout ────────────────────────────────────────────────
  const logout = async () => {
    stopProfilePoll();
    try {
      if (user?.id) await SecureStore.deleteItemAsync(pinKey(user.id));
      await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
      await api.post('/api/auth/logout', {}).catch(() => {}); // best-effort
    } catch {}
    await tokenStore.delete();
    clearAgent();
  };

  // ── Password reset ────────────────────────────────────────
  const requestPasswordReset = async (email) => {
    return api.post('/api/auth/forgot-password', { email });
  };

  const confirmPasswordReset = async (resetToken, newPassword) => {
    return api.post('/api/auth/reset-password', { resetToken, newPassword });
  };

  return (
    <AuthContext.Provider value={{
      user, profile, authLoading,
      sessionLocked, unlockSession,
      login, register, logout,
      savePin, verifyPin, checkPinExists, resetPin,
      requestPasswordReset, confirmPasswordReset,
    }}>
      {children}
    </AuthContext.Provider>
  );
}