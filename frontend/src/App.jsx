/* DEPLOY_SYNC_STAMP: 2026-04-27-13:46 */
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './layouts/DashboardLayout';
import ClinicalInfrastructureLayout from './layouts/ClinicalInfrastructureLayout';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import ClinicalDoctorLogin from './pages/ClinicalDoctorLogin';
import Dashboard from './pages/Dashboard';
import DoctorsList from './pages/DoctorsList';
import MedicalHistory from './pages/MedicalHistory';
import Reports from './pages/Reports';
import Sessions from './pages/Sessions';
import Booking from './pages/Booking';
import Profile from './pages/Profile';
import ClinicalVitals from './pages/ClinicalVitals';
import MedicationAdherence from './pages/MedicationAdherence';
import SecurityLogs from './pages/SecurityLogs';
import HealthWallet from './pages/HealthWallet';
import ClinicalExecutiveConsul from './pages/ClinicalExecutiveConsul';
import ClinicalCensusRegistry from './pages/ClinicalCensusRegistry';
import ClinicalPatientDossier from './pages/ClinicalPatientDossier';
import ClinicalDoctorProfile from './pages/ClinicalDoctorProfile';
import ClinicalScheduleManager from './pages/ClinicalScheduleManager';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmergencyInfo from './pages/EmergencyInfo';
import EditProfile from './pages/EditProfile';
import ClinicalProfileEditor from './pages/ClinicalProfileEditor';
import AdminDashboard from './pages/AdminDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AIDisclaimer from './pages/AIDisclaimer';
import Settings from './pages/Settings';
import Support from './pages/Support';
import HospitalDashboard from './pages/HospitalDashboard';
import HospitalDoctorRoster from './pages/HospitalDoctorRoster';
import HospitalAppointments from './pages/HospitalAppointments';
import HospitalPatients from './pages/HospitalPatients';
import HospitalProfile from './pages/HospitalProfile';
import HospitalAnalytics from './pages/HospitalAnalytics';
import VerifyEmail from './pages/VerifyEmail';
import ClinicalError404 from './pages/ClinicalError404';
import ErrorBoundary from './components/ErrorBoundary';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, userRole, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center text-primary-600">Loading...</div>;
  if (!user) {
    if (allowedRole === 'ROLE_DOCTOR') return <Navigate to="/doctor-login" />;
    return <Navigate to="/login" />;
  }
  if (allowedRole && userRole !== allowedRole) {
    if (userRole === 'ROLE_ADMIN') return <Navigate to="/admin-dashboard" />;
    if (userRole === 'ROLE_HOSPITAL_ADMIN') return <Navigate to="/hospital-dashboard" />;
    return <Navigate to={userRole === 'ROLE_DOCTOR' ? '/doctor-dashboard' : '/'} />;
  }

  // Mandatory Email Verification Gate for Professionals
  const isProfessional = userRole === 'ROLE_DOCTOR' || userRole === 'ROLE_HOSPITAL_ADMIN';
  const emailVerified = user?.user ? user.user.emailVerified : user?.emailVerified;
  
  if (isProfessional && !emailVerified) {
    return <Navigate to="/verify-email" />;
  }

  return children;
};

const SmartProfileRedirect = ({ type = 'view' }) => {
  const { userRole } = useAuth();
  if (userRole === 'ROLE_DOCTOR') {
    return <Navigate to={type === 'edit' ? '/doctor-dashboard/profile/edit' : '/doctor-dashboard/profile'} replace />;
  }
  return <Navigate to={type === 'edit' ? '/dashboard/profile/edit' : '/dashboard/profile'} replace />;
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
                <Route path="/doctor-login" element={<ClinicalDoctorLogin />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/emergency/:patientId" element={<EmergencyInfo />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/ai-disclaimer" element={<AIDisclaimer />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                
                {/* Legacy Redirects */}
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <SmartProfileRedirect type="view" />
                  </ProtectedRoute>
                } />
                <Route path="/edit-profile" element={
                  <ProtectedRoute>
                    <SmartProfileRedirect type="edit" />
                  </ProtectedRoute>
                } />
                <Route path="/profile/edit" element={
                  <ProtectedRoute>
                    <SmartProfileRedirect type="edit" />
                  </ProtectedRoute>
                } />

                <Route path="/" element={<Landing />} />
                
                {/* Patient Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRole="ROLE_PATIENT">
                    <DashboardLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="wallet" element={<HealthWallet />} />
                  <Route path="records" element={<MedicalHistory />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="vitals" element={<ClinicalVitals />} />
                  <Route path="medications" element={<MedicationAdherence />} />
                  <Route path="security" element={<SecurityLogs />} />
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
                    <ClinicalInfrastructureLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<ClinicalExecutiveConsul />} />
                  <Route path="appointments" element={<ClinicalScheduleManager />} />
                  <Route path="patients/:id" element={<ClinicalPatientDossier />} />
                  <Route path="patients" element={<ClinicalCensusRegistry />} />
                  <Route path="profile" element={<ClinicalDoctorProfile />} />
                  <Route path="profile/edit" element={<ClinicalProfileEditor />} />
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
                  <Route path="pending" element={<AdminDashboard />} />
                  <Route path="settings" element={<Settings />} />
                </Route>

                {/* Hospital Admin Routes */}
                <Route path="/hospital-dashboard" element={
                  <ProtectedRoute allowedRole="ROLE_HOSPITAL_ADMIN">
                    <ClinicalInfrastructureLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<HospitalDashboard />} />
                  <Route path="appointments" element={<HospitalAppointments />} />
                  <Route path="patients" element={<HospitalPatients />} />
                  <Route path="profile" element={<HospitalProfile />} />
                  <Route path="institutional-profile" element={<HospitalProfile />} />
                  <Route path="analytics" element={<HospitalAnalytics />} />
                  <Route path="staff" element={<HospitalDoctorRoster />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="support" element={<Support />} />
                </Route>

                {/* Catch-all Not Found Route */}
                <Route path="*" element={<ClinicalError404 />} />
              </Routes>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
