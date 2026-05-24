// src/context/AuthContext.jsx
// Full rewrite — no Firebase. JWT in SecureStore, all calls via api.js.

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const SESSION_TIMEOUT  = 5 * 60 * 1000; // 5 min
const LAST_ACTIVE_KEY  = 'silverstone_last_active';
const pinKey = (id) => `silverstone_pin_${id}`;

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user,          setUser]          = useState(null); // decoded JWT payload {id, role}
  const [profile,       setProfile]       = useState(null); // full agent object from /api/auth/me
  const [authLoading,   setAuthLoading]   = useState(true);
  const [sessionLocked, setSessionLocked] = useState(false);

  const profilePollRef = useRef(null);

  // ── Poll /api/auth/me every 30s ───────────────────────────
  const startProfilePoll = (userId) => {
    stopProfilePoll();
    fetchProfile();
    profilePollRef.current = setInterval(fetchProfile, 30_000);
  };

  const stopProfilePoll = () => {
    if (profilePollRef.current) {
      clearInterval(profilePollRef.current);
      profilePollRef.current = null;
    }
  };

  const fetchProfile = async () => {
    try {
      const { agent } = await api.get('/api/auth/me');
      setProfile(agent);
    } catch (err) {
      // 401 means token expired — log out
      if (err.status === 401) {
        await _clearSession();
      }
    }
  };

  // ── AppState: lock session after >5 min background ────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        const saved   = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
        const elapsed = saved ? Date.now() - parseInt(saved, 10) : 0;
        if (elapsed > SESSION_TIMEOUT) {
          setProfile(prof => {
            if (prof?.pin_set) setSessionLocked(true);
            return prof;
          });
        }
        await AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      } else {
        await AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      }
    });
    return () => sub.remove();
  }, []);

  // ── Bootstrap: check for existing JWT on mount ────────────
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await api.getToken();
        if (!token) {
          setAuthLoading(false);
          return;
        }
        // Validate token by hitting /me
        const { agent } = await api.get('/api/auth/me');
        // Decode payload for user object (id + role)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.id, role: payload.role });
        setProfile(agent);
        startProfilePoll(payload.id);
      } catch {
        await api.clearToken();
      } finally {
        setAuthLoading(false);
      }
    };
    bootstrap();
    return stopProfilePoll;
  }, []);

  // ── Internal session clear ────────────────────────────────
  const _clearSession = async () => {
    stopProfilePoll();
    const uid = user?.id;
    if (uid) {
      try { await SecureStore.deleteItemAsync(pinKey(uid)); } catch {}
    }
    await api.clearToken();
    await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
    setUser(null);
    setProfile(null);
    setSessionLocked(false);
  };

  // ── Login ─────────────────────────────────────────────────
  const login = async (email, password) => {
    const { token, agent } = await api.post('/api/auth/login', { email, password });
    await api.setToken(token);
    const payload = JSON.parse(atob(token.split('.')[1]));
    setUser({ id: payload.id, role: payload.role });
    setProfile(agent);
    startProfilePoll(payload.id);
  };

  // ── Register ──────────────────────────────────────────────
  const register = async ({
    username, name, phone, email, password,
    networks = [], agentPhoneNumbers = [],
    businessName, businessLocation, coordinates,
    regNo, tin, nida, floatCapacity,
    tinCertUrl, licenceCertUrl, selfieVerified = false,
  }) => {
    const { token, agent } = await api.post('/api/auth/register', {
      username, name: name || username, phone, email, password,
      networks, agentPhoneNumbers,
      role: 'sub-agent',
      businessName, businessLocation, coordinates,
      regNo, tin, nida, floatCapacity,
      tinCertUrl, licenceCertUrl, selfieVerified,
    });
    await api.setToken(token);
    const payload = JSON.parse(atob(token.split('.')[1]));
    setUser({ id: payload.id, role: payload.role });
    setProfile(agent);
    startProfilePoll(payload.id);
    return agent;
  };

  // ── Logout ────────────────────────────────────────────────
  const logout = async () => {
    try { await api.post('/api/auth/logout', {}); } catch {}
    await _clearSession();
  };

  // ── PIN management ────────────────────────────────────────
  const savePin = async (pin) => {
    if (!user) throw new Error('Not authenticated');
    await SecureStore.setItemAsync(pinKey(user.id), pin);
    await api.post('/api/auth/set-pin', {});
    setProfile(prev => prev ? { ...prev, pin_set: true } : prev);
  };

  const verifyPin = async (pin) => {
    if (!user) return false;
    try {
      const stored = await SecureStore.getItemAsync(pinKey(user.id));
      return stored === pin;
    } catch {
      return false;
    }
  };

  const checkPinExists = async () => {
    if (!user) return false;
    try {
      const stored = await SecureStore.getItemAsync(pinKey(user.id));
      return !!stored && profile?.pin_set === true;
    } catch {
      return false;
    }
  };

  const resetPin = async () => {
    if (!user) return;
    try {
      await SecureStore.deleteItemAsync(pinKey(user.id));
      await api.put(`/api/agents/${user.id}`, { pin_set: false });
      setProfile(prev => prev ? { ...prev, pin_set: false } : prev);
    } catch {}
  };

  const unlockSession = () => setSessionLocked(false);

  // ── Password reset ────────────────────────────────────────
  const resetPassword = async (email) => {
    await api.post('/api/auth/forgot-password', { email });
  };

  return (
    <AuthContext.Provider value={{
      user, profile, authLoading,
      sessionLocked, unlockSession,
      register, login, logout,
      savePin, verifyPin, checkPinExists, resetPin,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
