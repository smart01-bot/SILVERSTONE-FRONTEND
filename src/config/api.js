// src/config/api.js
// Central API client — all screens use this, never raw fetch.
// JWT is stored under a fixed key in SecureStore.

import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8800';
const JWT_KEY  = 'silverstone_jwt';

const getToken = () => SecureStore.getItemAsync(JWT_KEY);

const request = async (method, path, body) => {
  const token   = await getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content — nothing to parse
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({ error: res.statusText }));

  if (!res.ok) {
    const err = new Error(data?.error || data?.message || 'Request failed');
    err.status = res.status;
    err.data   = data;
    throw err;
  }

  return data;
};

const api = {
  get:  (path)        => request('GET',    path),
  post: (path, body)  => request('POST',   path, body),
  put:  (path, body)  => request('PUT',    path, body),
  del:  (path)        => request('DELETE', path),

  // Token lifecycle — called by AuthContext only
  setToken:   (token) => SecureStore.setItemAsync(JWT_KEY, token),
  clearToken: ()      => SecureStore.deleteItemAsync(JWT_KEY),
  getToken,
};

export default api;
