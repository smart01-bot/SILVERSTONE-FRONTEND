import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);   // Firebase user
  const [profile, setProfile]   = useState(null);   // Firestore agent doc
  const [loading, setLoading]   = useState(true);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        await refreshProfile(fbUser.uid);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshProfile = async (uid) => {
    const snap = await getDoc(doc(db, 'agents', uid));
    if (snap.exists()) setProfile({ id: snap.id, ...snap.data() });
  };

  // ── Registration (creates Firebase user + Firestore agent doc) ──
  const register = async ({ name, phone, email, password, businessName, businessLocation, regNo, tin, nida }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid  = cred.user.uid;

    const agentDoc = {
      uid,
      name,
      phone,
      email,
      businessName,
      businessLocation,
      regNo,
      tin,
      nida,
      role:     'sub-agent',
      status:   'pending',    // admin must approve
      networks: [],
      agentPhoneNumbers: {},
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'agents', uid), agentDoc);
    setProfile(agentDoc);
    return agentDoc;
  };

  // ── Email / Password login ──────────────────────────────────
  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await refreshProfile(cred.user.uid);
  };

  // ── PIN management (stored in device SecureStore) ───────────
  const pinKey = (uid) => `silverstone_pin_${uid}`;

  const savePin = async (pin) => {
    if (!user) throw new Error('Not authenticated');
    await SecureStore.setItemAsync(pinKey(user.uid), pin);
    await updateDoc(doc(db, 'agents', user.uid), { pinSet: true });
  };

  const verifyPin = async (pin) => {
    if (!user) return false;
    const stored = await SecureStore.getItemAsync(pinKey(user.uid));
    return stored === pin;
  };

  const hasPinSet = async () => {
    if (!user) return false;
    const stored = await SecureStore.getItemAsync(pinKey(user.uid));
    return !!stored;
  };

  // ── Logout ─────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
  };

  // ── Password reset ─────────────────────────────────────────
  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      register, login, logout,
      savePin, verifyPin, hasPinSet,
      resetPassword, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}