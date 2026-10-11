import * as SecureStore from "expo-secure-store";
import { createApiClient } from "../api/client";
import { HOSTED_API_URL } from "../api/baseUrl";
const listeners = new Set();
export const onInvalidSession = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const api = createApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || HOSTED_API_URL,
  storage: {
    getItem: SecureStore.getItemAsync,
    setItem: SecureStore.setItemAsync,
    removeItem: SecureStore.deleteItemAsync,
  },
  onInvalidSession: () => listeners.forEach((listener) => listener()),
});
