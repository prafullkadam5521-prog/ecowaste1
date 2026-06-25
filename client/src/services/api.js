import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;

    // 401 → session expired, force re-login
    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(err);
    }

    // 403 → not authorized for this resource, swallow silently
    // (prevents "Uncaught in promise" console errors)
    if (status === 403) {
      return Promise.reject(err);
    }

    // 429 → rate limited, let the caller handle it
    if (status === 429) {
      return Promise.reject(err);
    }

    // 502 → bad gateway (upstream API error)
    if (status === 502) {
      return Promise.reject(err);
    }

    return Promise.reject(err);
  }
);

export default api;