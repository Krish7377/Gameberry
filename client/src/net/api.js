// client/src/net/api.js — Fetch wrapper for backend REST API
let token = localStorage.getItem('ra_token') || null;

export function setToken(newToken) {
  token = newToken;
  if (newToken) {
    localStorage.setItem('ra_token', newToken);
  } else {
    localStorage.removeItem('ra_token');
  }
}

export function getToken() {
  return token;
}

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg = (isJson && data?.error) ? data.error : res.statusText;
    throw new Error(errorMsg || `Request failed with status ${res.status}`);
  }

  return data;
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export default api;
