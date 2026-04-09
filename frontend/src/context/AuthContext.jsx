import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axiosConfig';
import { supabase } from '../utils/supabaseClient';
import bcrypt from 'bcryptjs';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (token && role) {
      setUserRole(role);
      const email = localStorage.getItem('userEmail');
      if (email) fetchUserProfile(role, email);
      else fallbackFetchUserProfile(role);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (role, email) => {
    try {
      if (role === 'ROLE_PATIENT') {
        const { data, error } = await supabase.from('patient').select('*').eq('email', email).maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Patient not found in Supabase");
        setUser({ ...data, role });
        
        // Sync profile info to the backend (Explicit email for reliability)
        try {
          await api.post('/patient/profile/sync', {
            email: data.email,
            name: data.name,
            age: data.age,
            bloodGroup: data.blood_group
          });
          console.log("SUCCESS: Backend profile sync for " + email);
        } catch (syncErr) {
          console.error("ERROR: Backend profile sync failed for " + email, syncErr);
        }
      } else {
        // Fallback for Doctor or original logic if still needed for doctors
        const endpoint = '/doctor/profile';
        const response = await api.get(endpoint);
        setUser({ ...response.data, role });
      }
    } catch (error) {
      console.error("Error fetching profile from Supabase", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (usernameInput, password) => {
    localStorage.clear();
    const username = usernameInput?.trim();
    
    try {
      // Prioritize Spring Boot Backend for Auth
      const response = await api.post('/auth/login', { username, password });
      const { token, role } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('userEmail', username); // Store email for profile fetching
      
      setUserRole(role);
      await fetchUserProfile(role, username);
      return { success: true, role };
      
    } catch (error) {
      console.error("Login failed:", error);
      const message = error.response?.data?.message || 'Invalid credentials or account not verified';
      return { success: false, message };
    }
  };

  const fallbackFetchUserProfile = async (role) => {
    try {
      const endpoint = role === 'ROLE_DOCTOR' ? '/doctor/profile' : '/patient/profile';
      const response = await api.get(endpoint);
      setUser({ ...response.data, role });
    } catch (err) {
      console.error("Error fetching fallback profile", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userEmail');
    setUserRole(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
