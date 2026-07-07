import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (role) => {
    try {
      let endpoint;
      if (role === 'ROLE_DOCTOR') endpoint = '/doctor/profile';
      else if (role === 'ROLE_HOSPITAL_ADMIN') endpoint = '/hospital/profile';
      else endpoint = '/patient/profile';
      
      const response = await api.get(endpoint);
      
      // Update user with full profile data
      setUser(prev => {
        const updated = {
          ...prev,
          ...response.data,
          role: role // Explicitly preserve role
        };
        // Persist the full profile
        localStorage.setItem('user', JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error("Error fetching full profile:", error);
    }
  };

  // Refreshes the user profile from the server and updates context + localStorage.
  // Called after photo upload or profile edits to ensure UI reflects latest data.
  const refreshUser = async () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed?.role) {
        await fetchUserProfile(parsed.role);
      }
    } catch (e) {
      console.error('refreshUser failed:', e);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { role, emailVerified } = response.data;
      
      const baseUserData = {
        username: username,
        role: role,
        emailVerified: emailVerified
      };

      localStorage.setItem('user', JSON.stringify(baseUserData));
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

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error("Logout error", e);
    }
    localStorage.removeItem('user');
    localStorage.removeItem('ai_chat_history');
    setUser(null);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // The token is now in a secure httpOnly cookie, so we rely on user data existing in localStorage 
      // or attempting to fetch it from the backend if a session is alive.
      const savedUser = localStorage.getItem('user');
      
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
      fetchUserProfile,
      refreshUser,
      loading, 
      authenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
