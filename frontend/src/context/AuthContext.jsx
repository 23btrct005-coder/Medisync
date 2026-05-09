import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (role) => {
    try {
      const endpoint = role === 'ROLE_DOCTOR' ? '/doctor/profile' : '/patient/profile';
      const response = await api.get(endpoint);
      
      // Update user with full profile data
      setUser(prev => ({
        ...prev,
        ...response.data
      }));
      
      // Persist the full profile
      localStorage.setItem('user', JSON.stringify({
        ...user,
        ...response.data,
        role: role
      }));
    } catch (error) {
      console.error("Error fetching full profile:", error);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, role, emailVerified } = response.data;
      
      if (!token) throw new Error("No security token received");

      const baseUserData = {
        username: username,
        role: role,
        emailVerified: emailVerified
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(baseUserData));
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(baseUserData);
      
      // Immediately fetch full profile details
      await fetchUserProfile(role);
      
      return { success: true, role: role };
    } catch (error) {
      console.error("Login Error:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('ai_chat_history');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
          try {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            // Background refresh
            fetchUserProfile(userData.role);
          } catch (e) {
            console.error("Error parsing saved user", e);
            localStorage.removeItem('user');
          }
        } else {
          // Token exists but no user data - try to fetch from /auth/me or similar
          console.warn("Token exists but user data missing. Attempting recovery...");
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

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
