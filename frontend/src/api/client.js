import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT interceptor — attach token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('healthid_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 (expired token)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('healthid_token');
      localStorage.removeItem('healthid_user');
      // Don't redirect from emergency pages
      if (!window.location.pathname.startsWith('/emergency')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
