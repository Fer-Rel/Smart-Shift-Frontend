import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ──────────────────────────────────────────────
// REQUEST INTERCEPTOR — inyecta Bearer Token
// ──────────────────────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smart_shift_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ──────────────────────────────────────────────
// RESPONSE INTERCEPTOR — manejo de 401
// ──────────────────────────────────────────────
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Limpia el token y redirige al login
      localStorage.removeItem('smart_shift_token');
      // Emite evento custom para que AuthContext reaccione
      window.dispatchEvent(new CustomEvent('smart_shift_unauthorized'));
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
