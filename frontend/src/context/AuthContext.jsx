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
      if (!profile.profilePictureUrl) missing.push('Profile Photo');
    } else if (role === 'ROLE_DOCTOR') {
      if (!profile.specialization) missing.push('Specialization');
      if (!profile.medicalLicenseNumber) missing.push('Medical License');
      if (!profile.yearsOfExperience) missing.push('Years of Experience');
      if (!profile.profilePictureUrl) missing.push('Profile Photo');
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
      let endpoint;
      if (role === 'ROLE_DOCTOR') endpoint = 'doctor/profile';
      else if (role === 'ROLE_HOSPITAL_ADMIN') endpoint = 'hospital/profile';
      else endpoint = 'patient/profile';

      const response = await api.get(endpoint);
      const profileData = { ...response.data, role };
      console.log(`DEBUG: fetchUserProfile (${role})`, profileData);
      
      // Extract emailVerified from nested user object if it exists (Doctor/HospitalAdmin)
      const verified = profileData.user ? profileData.user.emailVerified : profileData.emailVerified;
      profileData.emailVerified = verified;
      
      setUser(profileData);
    } catch (error) {
      console.error("Error fetching profile from backend", error);
      // Removed automatic logout to prevent redirect loops during diagnostic phase
      // logout(); 
    } finally {
      setLoading(false);
    }
  };

  const login = async (usernameInput, password) => {
    localStorage.clear();
    const username = usernameInput?.trim();
    
    try {
      const response = await api.post('auth/login', { username, password });
      console.log("DEBUG: login response", response.data);
      const { token, role, emailVerified } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('userEmail', username);
      localStorage.setItem('emailVerified', emailVerified);
      
      setUserRole(role);
      await fetchUserProfile(role, username);
      return { success: true, role };
      
    } catch (error) {
      console.error("Login Error Details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      let message = error.response?.data?.message;
      
      if (!message) {
        if (error.response?.status === 401) {
          message = 'Invalid credentials. Please check your password.';
        } else if (error.response?.status === 403) {
          message = 'Your account is pending institutional or administrative approval.';
        } else {
          message = 'Login service unavailable. Please verify your internet connection.';
        }
      }
      
      return { success: false, message };
    }
  };

  const fallbackFetchUserProfile = async (role) => {
    try {
      let endpoint;
      if (role === 'ROLE_DOCTOR') endpoint = 'doctor/profile';
      else if (role === 'ROLE_HOSPITAL_ADMIN') endpoint = 'hospital/profile';
      else endpoint = 'patient/profile';
      
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
    localStorage.removeItem('emailVerified');
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
