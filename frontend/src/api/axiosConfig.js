import axios from 'axios';

export const rawBaseURL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '');
const apiBaseURL = `${rawBaseURL}/api`;

const api = axios.create({
  baseURL: apiBaseURL,
});

// Loading state bus
export const loadingState = {
  count: 0,
  onChange: null,
};

const updateLoading = (delta) => {
  loadingState.count = Math.max(0, loadingState.count + delta);
  if (loadingState.onChange) {
    loadingState.onChange(loadingState.count > 0);
  }
};

api.interceptors.request.use(
  (config) => {
    updateLoading(1);
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
    updateLoading(-1);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    updateLoading(-1);
    return response;
  },
  (error) => {
    updateLoading(-1);
    return Promise.reject(error);
  }
);

export default api;
