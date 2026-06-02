import axios from 'axios';

// Produção (Caddy): VITE_API_URL vazio → /api na mesma origem
// Desenvolvimento: fallback para localhost:3001
const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:3001' : '');
const baseURL = API_URL ? `${API_URL.replace(/\/$/, '')}/api` : '/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginAttempt = error.config?.url?.includes('login');

    if (error.response?.status === 401 && !isLoginAttempt) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
