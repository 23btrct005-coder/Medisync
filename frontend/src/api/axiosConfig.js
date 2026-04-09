import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const apiBaseURL = rawBaseURL.endsWith('/api') ? rawBaseURL : `${rawBaseURL}/api`;

const api = axios.create({
  baseURL: apiBaseURL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      const email = localStorage.getItem('userEmail');
      if (email) {
         config.headers['X-Supabase-User'] = email;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
