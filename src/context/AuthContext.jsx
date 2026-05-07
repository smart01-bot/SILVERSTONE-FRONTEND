import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc, setDoc, updateDoc,
  onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const AuthContext = createContext({});
export const useAuth  = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user,           setUser]           = useState(null);
  const [profile,        setProfile]        = useState(null);
  const [authLoading,    setAuthLoading]    = useState(true);
  const [sessionLocked,  setSessionLocked]  = useState(false);

  const profileUnsubRef       = useRef(null);
  const hasInitializedSession = useRef(false);

  // ── AppState: lock after >5 min background ────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        const saved   = await AsyncStorage.getItem('silverstone_last_active');
        const elapsed = saved ? Date.now() - parseInt(saved, 10) : 0;
        if (elapsed > SESSION_TIMEOUT) {
          // Only lock if there is an authenticated user with a PIN
          setUser(prev => {
            setProfile(prof => {
              if (prev && prof?.pinSet) setSessionLocked(true);
              return prof;
            });
            return prev;
          });
        }
        await AsyncStorage.setItem('silverstone_last_active', Date.now().toString());
      } else {
        await AsyncStorage.setItem('silverstone_last_active', Date.now().toString());
      }
    });
    return () => sub.remove();
  }, []);

  // ── Firebase auth state ───────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        hasInitializedSession.current = false;
        setUser(fbUser);

        if (profileUnsubRef.current) profileUnsubRef.current();

        profileUnsubRef.current = onSnapshot(
          doc(db, 'agents', fbUser.uid),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setProfile({ id: snap.id, ...data });

              // Lock session on first profile load if PIN already configured
              if (!hasInitializedSession.current) {
                hasInitializedSession.current = true;
                if (data.pinSet === true) setSessionLocked(true);
              }
            }
            setAuthLoading(false);
          },
          () => setAuthLoading(false)
        );
      } else {
        if (profileUnsubRef.current) profileUnsubRef.current();
        setUser(null);
        setProfile(null);
        setSessionLocked(false);
        hasInitializedSession.current = false;
        setAuthLoading(false);
      }
    });
    return unsub;
  }, []);

  // ── Registration ──────────────────────────────────────────
  const register = async ({ name, phone, email, password, businessName, businessLocation, regNo, tin, nida }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid  = cred.user.uid;
    const agentDoc = {
      uid, name, phone, email,
      businessName, businessLocation, regNo, tin, nida,
      role:             'sub-agent',
      status:           'pending',
      pinSet:           false,
      networks:         [],
      agentPhoneNumbers:{},
      createdAt:        serverTimestamp(),
    };
    await setDoc(doc(db, 'agents', uid), agentDoc);
    return agentDoc;
  };

  // ── Login ─────────────────────────────────────────────────
  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // ── PIN management ────────────────────────────────────────
  const pinKey = (uid) => `silverstone_pin_${uid}`;

  const savePin = async (pin) => {
    if (!user) throw new Error('Not authenticated');
    await SecureStore.setItemAsync(pinKey(user.uid), pin);
    await updateDoc(doc(db, 'agents', user.uid), { pinSet: true });
    setProfile(prev => prev ? { ...prev, pinSet: true } : prev);
  };

  const verifyPin = async (pin) => {
    if (!user) return false;
    try {
      const stored = await SecureStore.getItemAsync(pinKey(user.uid));
      return stored === pin;
    } catch {
      return false;
    }
  };

  const checkPinExists = async () => {
    if (!user) return false;
    try {
      const stored = await SecureStore.getItemAsync(pinKey(user.uid));
      return !!stored && profile?.pinSet === true;
    } catch {
      return false;
    }
  };

  // Clears PIN without signing out (used by Forgot PIN flow)
  const resetPin = async () => {
    if (!user) return;
    try {
      await SecureStore.deleteItemAsync(pinKey(user.uid));
      await updateDoc(doc(db, 'agents', user.uid), { pinSet: false });
      setProfile(prev => prev ? { ...prev, pinSet: false } : prev);
    } catch {}
  };

  const unlockSession = () => setSessionLocked(false);

  // ── Logout ────────────────────────────────────────────────
  const logout = async () => {
    hasInitializedSession.current = false;
    try {
      if (user?.uid) await SecureStore.deleteItemAsync(pinKey(user.uid));
      await AsyncStorage.removeItem('silverstone_last_active');
    } catch {}
    if (profileUnsubRef.current) profileUnsubRef.current();
    setUser(null);
    setProfile(null);
    setSessionLocked(false);
    await signOut(auth);
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
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
