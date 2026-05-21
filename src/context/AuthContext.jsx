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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const LAST_ACTIVE_KEY = 'silverstone_last_active';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

// Uploads a local file URI to Firebase Storage and returns the download URL.
// path: e.g. 'agents/uid/tin-certificate.pdf'
const uploadFile = async (uri, path) => {
  const response = await fetch(uri);
  const blob     = await response.blob();
  const fileRef  = ref(storage, path);
  await uploadBytes(fileRef, blob);
  return getDownloadURL(fileRef);
};

export function AuthProvider({ children }) {
  const [user,          setUser]          = useState(null);
  const [profile,       setProfile]       = useState(null);
  const [authLoading,   setAuthLoading]   = useState(true);
  const [sessionLocked, setSessionLocked] = useState(false);

  const profileUnsubRef       = useRef(null);
  const hasInitializedSession = useRef(false);

  // ── AppState: lock after >5 min background ────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        const saved   = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
        const elapsed = saved ? Date.now() - parseInt(saved, 10) : 0;
        if (elapsed > SESSION_TIMEOUT) {
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
  // tinCertUri and licenceUri are local file URIs from expo-document-picker.
  // They are uploaded to Firebase Storage after the auth user is created,
  // so we have a UID to use as the storage path.
  const register = async ({
    name, phone, email, password,
    businessName, businessLocation, regNo,
    tin, nida,
    tinCertUri, licenceUri,
  }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid  = cred.user.uid;

    // Upload documents if provided — failures are non-fatal (URLs default to null)
    let tinCertificateUrl   = null;
    let licenceCertificateUrl = null;
    try {
      if (tinCertUri) {
        tinCertificateUrl = await uploadFile(
          tinCertUri,
          `agents/${uid}/tin-certificate`
        );
      }
    } catch (e) {
      console.warn('TIN cert upload failed:', e);
    }
    try {
      if (licenceUri) {
        licenceCertificateUrl = await uploadFile(
          licenceUri,
          `agents/${uid}/licence-certificate`
        );
      }
    } catch (e) {
      console.warn('Licence upload failed:', e);
    }

    const agentDoc = {
      uid, name, phone, email,
      businessName, businessLocation, regNo, tin, nida,
      tinCertificateUrl,
      licenceCertificateUrl,
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
      await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
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