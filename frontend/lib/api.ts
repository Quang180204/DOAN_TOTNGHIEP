import axios from 'axios';
import { clearAuthSession } from '@/lib/auth';

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  // Production requests go through Vercel so cart cookies remain first-party.
  baseURL:
    typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
      ? '/backend-api'
      : configuredApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      clearAuthSession();

      if (!window.location.pathname.includes('/account/login')) {
        window.location.href = '/account/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
