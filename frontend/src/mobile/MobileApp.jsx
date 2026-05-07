import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MobileLayout from './layouts/MobileLayout';
import Dashboard from '../pages/Dashboard';
import MobileDashboard from './pages/MobileDashboard';
import MobileDoctorDashboard from './pages/MobileDoctorDashboard';
import MobileHospitalDashboard from './pages/MobileHospitalDashboard';
import ClinicalExecutiveConsul from '../pages/ClinicalExecutiveConsul';
import HospitalDashboard from '../pages/HospitalDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import { useAuth } from '../context/AuthContext';

// Auth & Public Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import ClinicalDoctorLogin from '../pages/ClinicalDoctorLogin';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import EmergencyInfo from '../pages/EmergencyInfo';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsOfService from '../pages/TermsOfService';
import AIDisclaimer from '../pages/AIDisclaimer';
import VerifyEmail from '../pages/VerifyEmail';
import PendingApproval from '../pages/PendingApproval';
import Landing from '../pages/Landing';

// Patient Pages
import HealthWallet from '../pages/HealthWallet';
import MedicalHistory from '../pages/MedicalHistory';
import Reports from '../pages/Reports';
import PatientMessages from '../pages/PatientMessages';
import MedicationAdherence from '../pages/MedicationAdherence';
import SecurityLogs from '../pages/SecurityLogs';
import Sessions from '../pages/Sessions';
import Booking from '../pages/Booking';
import DoctorsList from '../pages/DoctorsList';
import Profile from '../pages/Profile';
import EditProfile from '../pages/EditProfile';
import Settings from '../pages/Settings';
import Support from '../pages/Support';

// Professional Pages
import ClinicalScheduleManager from '../pages/ClinicalScheduleManager';
import ClinicalFinancials from '../pages/ClinicalFinancials';
import ClinicalCensusRegistry from '../pages/ClinicalCensusRegistry';
import ClinicalPatientDossier from '../pages/ClinicalPatientDossier';
import ClinicalMessages from '../pages/ClinicalMessages';
import ClinicalDoctorProfile from '../pages/ClinicalDoctorProfile';
import ClinicalProfileEditor from '../pages/ClinicalProfileEditor';

// Hospital Pages
import HospitalAppointments from '../pages/HospitalAppointments';
import HospitalAnalytics from '../pages/HospitalAnalytics';
import HospitalDoctorRoster from '../pages/HospitalDoctorRoster';
import HospitalLedger from '../pages/HospitalLedger';
import HospitalServiceBookings from '../pages/HospitalServiceBookings';
import HospitalPatients from '../pages/HospitalPatients';
import HospitalAdminProfile from '../pages/HospitalAdminProfile';
import HospitalProfile from '../pages/HospitalProfile';
import StaffOnboarding from '../pages/StaffOnboarding';
import StaffProfileEditor from '../pages/StaffProfileEditor';

// Admin Pages

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, userRole, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (allowedRole && userRole !== allowedRole) return <Navigate to="/" />;
  return children;
};

const MobileApp = () => {
    return (
        <Routes>
            {/* Public Routes */}
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
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/" element={<Landing />} />

            {/* Patient Routes */}
            <Route path="/dashboard" element={
                <ProtectedRoute allowedRole="ROLE_PATIENT">
                    <MobileLayout />
                </ProtectedRoute>
            }>
                <Route index element={<MobileDashboard />} />
                <Route path="wallet" element={<HealthWallet />} />
                <Route path="records" element={<MedicalHistory />} />
                <Route path="reports" element={<Reports />} />
                <Route path="messages" element={<PatientMessages />} />
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
                    <MobileLayout />
                </ProtectedRoute>
            }>
                <Route index element={<MobileDoctorDashboard />} />
                <Route path="appointments" element={<ClinicalScheduleManager />} />
                <Route path="financials" element={<ClinicalFinancials />} />
                <Route path="patients" element={<ClinicalCensusRegistry />} />
                <Route path="patients/:id" element={<ClinicalPatientDossier />} />
                <Route path="messages" element={<ClinicalMessages />} />
                <Route path="profile" element={<ClinicalDoctorProfile />} />
                <Route path="profile/edit" element={<ClinicalProfileEditor />} />
                <Route path="settings" element={<Settings />} />
                <Route path="support" element={<Support />} />
            </Route>

            {/* Hospital Admin Routes */}
            <Route path="/hospital-dashboard" element={
                <ProtectedRoute allowedRole="ROLE_HOSPITAL_ADMIN">
                    <MobileLayout />
                </ProtectedRoute>
            }>
                <Route index element={<MobileHospitalDashboard />} />
                <Route path="appointments" element={<HospitalAppointments />} />
                <Route path="ledger" element={<HospitalLedger />} />
                <Route path="services" element={<HospitalServiceBookings />} />
                <Route path="patients" element={<HospitalPatients />} />
                <Route path="profile" element={<HospitalAdminProfile />} />
                <Route path="institutional-profile" element={<HospitalProfile />} />
                <Route path="analytics" element={<HospitalAnalytics />} />
                <Route path="staff" element={<HospitalDoctorRoster />} />
                <Route path="staff/onboard" element={<StaffOnboarding />} />
                <Route path="staff/edit/:id" element={<StaffProfileEditor />} />
                <Route path="messages" element={<ClinicalMessages />} />
                <Route path="settings" element={<Settings />} />
                <Route path="support" element={<Support />} />
            </Route>

            {/* Super Admin Routes */}
            <Route path="/admin-dashboard" element={
                <ProtectedRoute allowedRole="ROLE_ADMIN">
                    <MobileLayout />
                </ProtectedRoute>
            }>
                <Route index element={<AdminDashboard />} />
                <Route path="pending" element={<AdminDashboard />} />
                <Route path="registry" element={<AdminDashboard />} />
                <Route path="settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default MobileApp;
