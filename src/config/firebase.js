import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

const firebaseConfig = {
  apiKey:            extra.firebaseApiKey,
  authDomain:        extra.firebaseAuthDomain,
  projectId:         extra.firebaseProjectId,
  storageBucket:     extra.firebaseStorageBucket,
  messagingSenderId: extra.firebaseMessagingSenderId,
  appId:             extra.firebaseAppId,
};

if (!firebaseConfig.apiKey) {
  throw new Error('Firebase config missing. Check app.json extra field.');
}

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);