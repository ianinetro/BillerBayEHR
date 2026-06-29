import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30_000,
});

client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ct_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

let _refreshing = null;

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('ct_refresh_token');
      if (refresh) {
        if (!_refreshing) {
          _refreshing = axios.post(
            `${original.baseURL || (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api')}/auth/token/refresh/`,
            { refresh }
          ).then(r => {
            localStorage.setItem('ct_access_token', r.data.access);
            if (r.data.refresh) localStorage.setItem('ct_refresh_token', r.data.refresh);
            _refreshing = null;
            return r.data.access;
          }).catch(() => {
            _refreshing = null;
            localStorage.removeItem('ct_access_token');
            localStorage.removeItem('ct_refresh_token');
            window.location.href = '/login';
          });
        }
        const newToken = await _refreshing;
        if (newToken) {
          original.headers.Authorization = `Bearer ${newToken}`;
          return client(original);
        }
      } else {
        localStorage.removeItem('ct_access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
