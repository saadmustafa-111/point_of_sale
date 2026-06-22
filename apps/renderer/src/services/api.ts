import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const DEFAULT_DEV_API_URL = '/api/v1';

let currentApiUrl = DEFAULT_DEV_API_URL;

export function setApiBaseUrl(apiUrl: string) {
  currentApiUrl = apiUrl || DEFAULT_DEV_API_URL;
  api.defaults.baseURL = currentApiUrl;
}

export function getApiBaseUrl() {
  return currentApiUrl;
}

const api = axios.create({
  baseURL: currentApiUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Request interceptor — attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor — handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isLoginRequest) {
      useAuthStore.getState().logout();
      window.location.href = window.electron ? '#/login' : '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
