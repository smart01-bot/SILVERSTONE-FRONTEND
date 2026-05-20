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
const LAST_ACTIVE_KEY = 'silverstone_last_active';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user,          setUser]          = useState(null);
  const [profile,       setProfile]       = useState(null);
  const [authLoading,   setAuthLoading]   = useState(true);
  const [sessionLocked, setSessionLocked] = useState(false);

  const profileUnsubRef       = useRef(null);
  const hasInitializedSession = useRef(false);
  const authInitialized       = useRef(false);

  // ── AppState: lock after >5 min background ────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        const saved   = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
        const elapsed = saved ? Date.now() - parseInt(saved, 10) : 0;
        if (elapsed > SESSION_TIMEOUT) {
          // Read current state via nested setState to avoid stale closure
          setUser(prev => {
            setProfile(prof => {
              if (prev && prof?.pinSet) setSessionLocked(true);
              return prof;
            });
            return prev;
          });
        }
        await AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      } else {
        await AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      }
    });
    return () => sub.remove();
  }, []);

  // ── Firebase auth state ───────────────────────────────────
  const nullTimeoutRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      // Clear any pending null-fallback timer
      if (nullTimeoutRef.current) {
        clearTimeout(nullTimeoutRef.current);
        nullTimeoutRef.current = null;
      }

      if (fbUser) {
        authInitialized.current       = true;
        hasInitializedSession.current = false;
        setUser(fbUser);

        if (profileUnsubRef.current) profileUnsubRef.current();

        profileUnsubRef.current = onSnapshot(
          doc(db, 'agents', fbUser.uid),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setProfile({ id: snap.id, ...data });

              // Lock session only on first profile load per auth session
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
        if (!authInitialized.current) {
          // Firebase JS SDK always emits null once on startup before checking
          // the AsyncStorage cache. Wait briefly — if a real user arrives
          // within 1.5s this timer gets cancelled above. If not (fresh
          // install / genuinely signed out), commit the null so the app
          // exits the loading state and shows the auth flow.
          authInitialized.current = true;
          nullTimeoutRef.current = setTimeout(() => {
            if (profileUnsubRef.current) profileUnsubRef.current();
            setUser(null);
            setProfile(null);
            setSessionLocked(false);
            hasInitializedSession.current = false;
            setAuthLoading(false);
          }, 1500);
          return;
        }
        if (profileUnsubRef.current) profileUnsubRef.current();
        setUser(null);
        setProfile(null);
        setSessionLocked(false);
        hasInitializedSession.current = false;
        setAuthLoading(false);
      }
    });
    return () => {
      unsub();
      if (nullTimeoutRef.current) clearTimeout(nullTimeoutRef.current);
    };
  }, []);

  // ── Registration ──────────────────────────────────────────
  const register = async ({ name, phone, email, password, businessName, businessLocation, regNo, tin, nida }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid  = cred.user.uid;
    const agentDoc = {
      uid, name, phone, email,
      businessName, businessLocation, regNo, tin, nida,
      role:              'sub-agent',
      status:            'pending',
      pinSet:            false,
      networks:          [],
      agentPhoneNumbers: {},
      createdAt:         serverTimestamp(),
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

  // Clears PIN without signing out
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

    // Unsubscribe from Firestore first to prevent snapshot callbacks
    // from firing during teardown
    if (profileUnsubRef.current) {
      profileUnsubRef.current();
      profileUnsubRef.current = null;
    }

    try {
      if (user?.uid) await SecureStore.deleteItemAsync(pinKey(user.uid));
      await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
    } catch {}

    // Sign out from Firebase FIRST — this triggers onAuthStateChanged(null),
    // which is what AppNavigator watches. Only then clear local state.
    // Previous order (setUser(null) → signOut) caused the auth navigator
    // to render before Firebase had fully torn down, leading to stale state.
    await signOut(auth);

    // onAuthStateChanged will handle setting user/profile/sessionLocked to null,
    // but set them here too for immediate UI response
    setUser(null);
    setProfile(null);
    setSessionLocked(false);
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