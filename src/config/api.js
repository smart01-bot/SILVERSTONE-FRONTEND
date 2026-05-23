// src/config/api.js
// Central API client. All backend calls go through here.
// JWT is stored in SecureStore and sent as a Bearer token.

import * as SecureStore from 'expo-secure-store';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8800';

const TOKEN_KEY = 'silverstone_access_token';

export const tokenStore = {
  get:    ()      => SecureStore.getItemAsync(TOKEN_KEY),
  set:    (token) => SecureStore.setItemAsync(TOKEN_KEY, token),
  delete: ()      => SecureStore.deleteItemAsync(TOKEN_KEY),
};

const api = async (path, options = {}) => {
  const token = await tokenStore.get();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.error ?? data?.errors?.[0]?.msg ?? `Request failed (${res.status})`;
    throw Object.assign(new Error(message), { status: res.status, data });
  }

  return data;
};

export const get    = (path, opts = {}) => api(path, { method: 'GET',    ...opts });
export const post   = (path, body, opts = {}) => api(path, { method: 'POST',   body: JSON.stringify(body), ...opts });
export const put    = (path, body, opts = {}) => api(path, { method: 'PUT',    body: JSON.stringify(body), ...opts });
export const del    = (path, opts = {}) => api(path, { method: 'DELETE', ...opts });

export default { get, post, put, del, tokenStore, API_URL };
