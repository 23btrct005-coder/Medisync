import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig'; // Import our specialized API config
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
      } catch (e) {
        console.error("Error parsing saved user", e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      // Use the 'api' instance which is pre-configured with the Render baseURL
      const response = await api.post('/auth/login', { username, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      
      return { success: true, role: userData.role };
    } catch (error) {
      console.error("Login Error:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Connection failed. Please check if backend is awake.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userRole: user?.role || user?.user?.role, 
      login, 
      logout, 
      loading, 
      authenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
