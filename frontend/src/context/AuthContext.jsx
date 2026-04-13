import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axiosConfig';
import { supabase } from '../utils/supabaseClient';
import bcrypt from 'bcryptjs';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  const [profileStatus, setProfileStatus] = useState({ isComplete: true, missingFields: [] });

  const getProfileStatus = (profile, role) => {
    const missing = [];
    if (!profile) return { isComplete: true, missingFields: [] };

    if (role === 'ROLE_PATIENT') {
      if (!profile.bloodGroup || profile.bloodGroup === 'Unknown') missing.push('Blood Group');
      if (!profile.phone) missing.push('Phone Number');
      if (!profile.profilePicture) missing.push('Profile Photo');
    } else if (role === 'ROLE_DOCTOR') {
      if (!profile.specialization) missing.push('Specialization');
      if (!profile.medicalLicenseNumber) missing.push('Medical License');
      if (!profile.yearsOfExperience) missing.push('Years of Experience');
      if (!profile.profilePicture) missing.push('Profile Photo');
    }

    return {
      isComplete: missing.length === 0,
      missingFields: missing
    };
  };

  const refreshUser = async () => {
    if (!userRole) return;
    const email = localStorage.getItem('userEmail');
    await fetchUserProfile(userRole, email);
  };

  useEffect(() => {
    if (user && userRole) {
      setProfileStatus(getProfileStatus(user, userRole));
    }
  }, [user, userRole]);

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
      if (role === 'ROLE_ADMIN') {
        setUser({ username: email, email, role, name: 'Administrator' });
        setLoading(false);
        return;
      }
      const endpoint = role === 'ROLE_DOCTOR' ? 'doctor/profile' : 'patient/profile';
      const response = await api.get(endpoint);
      const profileData = { ...response.data, role };
      setUser(profileData);
    } catch (error) {
      console.error("Error fetching profile from backend", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (usernameInput, password) => {
    localStorage.clear();
    const username = usernameInput?.trim();
    
    try {
      const response = await api.post('auth/login', { username, password });
      const { token, role } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('userEmail', username);
      
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
    <AuthContext.Provider value={{ user, userRole, login, logout, loading, profileStatus, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
