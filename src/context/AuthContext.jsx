import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { api, onInvalidSession } from "../config/api";
import { agentView } from "../api/presentation";

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);
const pinKey = (id) => `silverstone_api_pin_${id}`;
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true),
    [sessionLocked, setSessionLocked] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const backgroundAt = useRef(null);
  const generation = useRef(0);
  const clear = () => {
    generation.current++;
    setUser(null);
    setProfile(null);
    setSessionLocked(false);
  };
  async function apply(agent, lock = false, expected = generation.current) {
    const pin = await SecureStore.getItemAsync(pinKey(agent.id));
    if (expected !== generation.current) return null;
    setUser({ id: agent.id, email: agent.email });
    setProfile({ ...agentView(agent), pinSet: !!pin });
    setConnectionError("");
    if (lock) setSessionLocked(true);
    return agent;
  }
  async function restore() {
    setAuthLoading(true);
    try {
      const expected = generation.current;
      const agent = await api.restore();
      if (agent) await apply(agent, true, expected);
      else clear();
    } catch (error) {
      setConnectionError(error.message);
    } finally {
      setAuthLoading(false);
    }
  }
  useEffect(() => {
    const unsubscribe = onInvalidSession(clear);
    restore();
    return unsubscribe;
  }, []);
  async function refreshProfile() {
    const expected = generation.current;
    const agent = await api.call("/me");
    await apply(agent, false, expected);
    return agent;
  }
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(
      () =>
        refreshProfile().catch((error) => setConnectionError(error.message)),
      15000,
    );
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        if (backgroundAt.current && Date.now() - backgroundAt.current >= 300000)
          setSessionLocked(true);
        refreshProfile().catch((error) => setConnectionError(error.message));
      } else {
        backgroundAt.current = Date.now();
      }
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [user?.id]);
  async function login(email, password) {
    const expected = ++generation.current;
    return apply(await api.login(email, password), true, expected);
  }
  async function register() {
    throw new Error(
      "Application submission is not available yet. Your details remain on this screen.",
    );
  }
  async function logout() {
    try {
      await api.logout();
      clear();
    } catch (error) {
      Alert.alert("Sign out failed", error.message);
    }
  }
  async function savePin(pin) {
    if (!user || !/^\d{4}$/.test(pin))
      throw new Error("Enter a four-digit PIN.");
    await SecureStore.setItemAsync(pinKey(user.id), pin);
    setProfile((previous) => ({ ...previous, pinSet: true }));
  }
  async function verifyPin(pin) {
    return !!user && (await SecureStore.getItemAsync(pinKey(user.id))) === pin;
  }
  async function checkPinExists() {
    return !!user && !!(await SecureStore.getItemAsync(pinKey(user.id)));
  }
  async function resetPin(password) {
    await api.call("/auth/reauthenticate", {
      method: "POST",
      body: { password },
    });
    await SecureStore.deleteItemAsync(pinKey(user.id));
    setProfile((previous) => ({ ...previous, pinSet: false }));
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        authLoading,
        sessionLocked,
        connectionError,
        login,
        register,
        logout,
        savePin,
        verifyPin,
        checkPinExists,
        resetPin,
        refreshProfile,
        retryConnection: restore,
        unlockSession: () => setSessionLocked(false),
        resetPassword: (email) => api.recovery(email),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
