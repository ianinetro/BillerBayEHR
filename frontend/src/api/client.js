import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30_000,
});

/* ---- Request interceptor: attach auth token if present --- */
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ct_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ---- Response interceptor: unwrap data, handle 401 ------- */
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ct_access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
