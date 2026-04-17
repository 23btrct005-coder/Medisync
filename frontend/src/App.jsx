/* DEPLOY_SYNC_STAMP: 2026-04-17-18:00 */
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './layouts/DashboardLayout';
import DoctorLayout from './layouts/DoctorLayout';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import DoctorLogin from './pages/DoctorLogin';
import Dashboard from './pages/Dashboard';
import DoctorsList from './pages/DoctorsList';
import MedicalHistory from './pages/MedicalHistory';
import Reports from './pages/Reports';
import Sessions from './pages/Sessions';
import Booking from './pages/Booking';
import Profile from './pages/Profile';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDirectory from './pages/PatientDirectory';
import PatientManager from './pages/PatientManager';
import DoctorProfile from './pages/DoctorProfile';
import DoctorAppointments from './pages/DoctorAppointments';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmergencyInfo from './pages/EmergencyInfo';
import EditProfile from './pages/EditProfile';
import EditDoctorProfile from './pages/EditDoctorProfile';
import AdminDashboard from './pages/AdminDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AIDisclaimer from './pages/AIDisclaimer';
import Settings from './pages/Settings';
import Support from './pages/Support';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, userRole, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center text-primary-600">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRole && userRole !== allowedRole) {
    if (userRole === 'ROLE_ADMIN') return <Navigate to="/admin-dashboard" />;
    return <Navigate to={userRole === 'ROLE_DOCTOR' ? '/doctor-dashboard' : '/'} />;
  }
  return children;
};

function App() {
  useEffect(() => {
    // Request Push Notification Permissions on load for PWA
    if ('Notification' in window && Notification.permission === 'default') {
      setTimeout(() => {
        Notification.requestPermission();
      }, 5000); // Ask after 5 seconds to not overwhelm initially
    }
  }, []);

  return (
    <Router>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#1e293b', color: '#fff' } }} />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/doctor-login" element={<DoctorLogin />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/emergency/:patientId" element={<EmergencyInfo />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/ai-disclaimer" element={<AIDisclaimer />} />
                
                <Route path="/" element={<Landing />} />
                
                {/* Patient Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRole="ROLE_PATIENT">
                    <DashboardLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="records" element={<MedicalHistory />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="sessions" element={<Sessions />} />
                  <Route path="booking" element={<Booking />} />
                  <Route path="doctors" element={<DoctorsList />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="profile/edit" element={<EditProfile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="support" element={<Support />} />
                </Route>

                {/* Doctor Routes */}
                <Route path="/doctor-dashboard" element={
                  <ProtectedRoute allowedRole="ROLE_DOCTOR">
                    <DoctorLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<DoctorDashboard />} />
                  <Route path="appointments" element={<DoctorAppointments />} />
                  <Route path="patients" element={<PatientDirectory />} />
                  <Route path="patients/:id" element={<PatientManager />} />
                  <Route path="profile" element={<DoctorProfile />} />
                  <Route path="profile/edit" element={<EditDoctorProfile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="support" element={<Support />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin-dashboard" element={
                  <ProtectedRoute allowedRole="ROLE_ADMIN">
                    <AdminLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<AdminDashboard />} />
                </Route>

                {/* Catch-all Not Found Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
