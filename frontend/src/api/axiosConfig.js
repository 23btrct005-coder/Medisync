import axios from 'axios';
import toast from 'react-hot-toast';

export const rawBaseURL = import.meta.env.VITE_API_URL || 'https://medisync-backend-api-bed497fa0d43.herokuapp.com';
const apiBaseURL = `${rawBaseURL}/api`;

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 75000, // 75s — handles Render free tier cold-start (can take up to 50s+)
  withCredentials: true,
});

// Set global axios default as well to catch direct axios calls
axios.defaults.baseURL = apiBaseURL;
axios.defaults.withCredentials = true;

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
    // Token is automatically sent via httpOnly cookie now.
    const email = localStorage.getItem('userEmail');
    if (email) {
       config.headers['X-Supabase-User'] = email;
    }
    // Fallback for mobile browsers (like iOS Safari) that block cross-origin cookies via ITP
    const token = localStorage.getItem('token');
    if (token) {
       config.headers['Authorization'] = `Bearer ${token}`;
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
    
    // Global Error Handling Logic
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Accessing clinical node failed';

    if (status === 401 || status === 403) {
       // Session expired or invalid
       localStorage.removeItem('token');
       localStorage.removeItem('userRole');
       localStorage.removeItem('userEmail');
       const isPublic = ['/login', '/register', '/doctor-login', '/forgot-password', '/reset-password', '/emergency/'].some(p => window.location.pathname.startsWith(p)) || window.location.pathname === '/';
       if (!isPublic) {
          toast.error('Clinical session invalid or expired. Please re-authenticate.');
          window.location.href = '/login';
       }
    } else if (status >= 500) {
       const errorMessage = error.response?.data?.message || 'A critical server exception occurred. Clinical sync paused.';
       toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

export default api;
