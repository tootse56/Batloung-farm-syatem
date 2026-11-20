
import { useCallback, useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL || '/api';
let authToken = localStorage.getItem('batloung_token') || '';

export function setAuthToken(token, user) {
  authToken = token || '';
  if (authToken) {
    localStorage.setItem('batloung_token', authToken);
    if (user) localStorage.setItem('batloung_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('batloung_token');
    localStorage.removeItem('batloung_user');
  }
}
export function getStoredUser() {
  try {
    const token = localStorage.getItem('batloung_token') || '';
    const user = JSON.parse(localStorage.getItem('batloung_user') || 'null');
    const parts = token.split('.');
    if (!user || parts.length !== 3) throw new Error('No active login');
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) throw new Error('Login expired');
    return user;
  } catch {
    localStorage.removeItem('batloung_token');
    localStorage.removeItem('batloung_user');
    return null;
  }
}

async function request(path, method = 'GET', body) {
  let res;
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  try {
    res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw Object.assign(new Error('Cannot reach the server. Make sure the API is running.'), { status: 0 });
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.message || 'Request failed'), { status: res.status, details: json.details });
  return json;
}

export const api = {
  get: (p) => request(p),
  post: (p, b) => request(p, 'POST', b),
  put: (p, b) => request(p, 'PUT', b),
  del: (p) => request(p, 'DELETE'),
};

export function useData(path, fallback = []) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await api.get(path);
      setData(json.data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}
