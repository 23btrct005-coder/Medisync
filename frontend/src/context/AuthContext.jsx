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
        const { data, error } = await supabase.from('patient').select('*').eq('email', email).single();
        if (error) throw error;
        setUser({ ...data, role });
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

  const login = async (username, password) => {
    try {
      // 1. Fetch user from Supabase assuming username provided is the registered email
      const { data: patient, error } = await supabase
        .from('patient')
        .select('*')
        .eq('email', username)
        .single();
        
      if (error || !patient) {
        // Fallback to legacy Spring boot Auth if not found in Supabase
        const response = await api.post('/auth/login', { username, password });
        const { token, role } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        setUserRole(role);
        await fallbackFetchUserProfile(role);
        return { success: true, role };
      }

      // 2. Verify password with bcryptjs
      const isMatch = await bcrypt.compare(password, patient.password);
      if (!isMatch) {
         return { success: false, message: 'Invalid credentials' };
      }

      // Simulate token
      const token = 'supabase_dummy_jwt_' + patient.id;
      const role = 'ROLE_PATIENT';
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('userEmail', patient.email);
      setUserRole(role);
      
      await fetchUserProfile(role, patient.email);
      return { success: true, role };
      
    } catch (error) {
      return { success: false, message: 'Invalid credentials' };
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
