import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import * as SecureStore from 'expo-secure-store';

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser]                       = useState(null);
  const [profile, setProfile]                 = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [sessionUnlocked, setSessionUnlocked] = useState(false);
  const bgTimestamp = useRef(null);

  // Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        await refreshProfile(fbUser.uid);
      } else {
        setUser(null);
        setProfile(null);
        setSessionUnlocked(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Lock screen when app returns from background after > 5 min
  useEffect(() => {
    const handleAppStateChange = (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        bgTimestamp.current = Date.now();
      } else if (nextState === 'active') {
        if (bgTimestamp.current !== null) {
          const elapsed = Date.now() - bgTimestamp.current;
          if (elapsed > LOCK_TIMEOUT_MS) {
            setSessionUnlocked(false);
          }
          bgTimestamp.current = null;
        }
      }
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, []);

  const refreshProfile = async (uid) => {
    const snap = await getDoc(doc(db, 'agents', uid));
    if (snap.exists()) setProfile({ id: snap.id, ...snap.data() });
  };

  // ── Registration ──────────────────────────────────────────
  const register = async ({ name, phone, email, password, businessName, businessLocation, regNo, tin, nida }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid  = cred.user.uid;

    const agentDoc = {
      uid, name, phone, email,
      businessName, businessLocation, regNo, tin, nida,
      role:             'sub-agent',
      status:           'pending',
      networks:         [],
      agentPhoneNumbers:{},
      createdAt:        serverTimestamp(),
    };

    await setDoc(doc(db, 'agents', uid), agentDoc);
    setProfile(agentDoc);
    return agentDoc;
  };

  // ── Email / Password login ────────────────────────────────
  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await refreshProfile(cred.user.uid);
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
    const stored = await SecureStore.getItemAsync(pinKey(user.uid));
    const ok = stored === pin;
    if (ok) setSessionUnlocked(true);
    return ok;
  };

  // Called after biometric success or PIN setup to unlock session
  const markSessionUnlocked = () => setSessionUnlocked(true);

  const hasPinSet = async () => {
    if (!user) return false;
    const stored = await SecureStore.getItemAsync(pinKey(user.uid));
    return !!stored && profile?.pinSet === true;
  };

  // Verify identity with password without signing out (Forgot PIN flow)
  const reauthenticate = async (password) => {
    if (!user?.email) throw new Error('No authenticated user');
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  };

  // Clear PIN only, stay signed in (used after reauthenticate succeeds)
  const resetPinOnly = async () => {
    if (!user) throw new Error('Not authenticated');
    await SecureStore.deleteItemAsync(pinKey(user.uid));
    await updateDoc(doc(db, 'agents', user.uid), { pinSet: false });
    setProfile(prev => prev ? { ...prev, pinSet: false } : prev);
  };

  // ── Logout ────────────────────────────────────────────────
  const logout = async () => {
    try {
      if (user?.uid) await SecureStore.deleteItemAsync(pinKey(user.uid));
    } catch {}
    setSessionUnlocked(false);
    await signOut(auth);
  };

  // Legacy reset: clears PIN + signs out
  const resetPin = async () => {
    try {
      if (user?.uid) await SecureStore.deleteItemAsync(pinKey(user.uid));
    } catch {}
    try {
      if (user?.uid) await updateDoc(doc(db, 'agents', user.uid), { pinSet: false });
    } catch {}
    setSessionUnlocked(false);
    await signOut(auth);
  };

  // ── Password reset email ──────────────────────────────────
  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading, sessionUnlocked,
      register, login, logout, resetPin,
      savePin, verifyPin, hasPinSet,
      markSessionUnlocked, reauthenticate, resetPinOnly,
      resetPassword, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
