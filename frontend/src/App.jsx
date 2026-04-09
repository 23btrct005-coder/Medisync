import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Sync push: 2026-04-10
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import DoctorLayout from './layouts/DoctorLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import DoctorLogin from './pages/DoctorLogin';
import Dashboard from './pages/Dashboard';
import MedicalHistory from './pages/MedicalHistory';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDirectory from './pages/PatientDirectory';
import PatientManager from './pages/PatientManager';
import DoctorProfile from './pages/DoctorProfile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, userRole, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center text-primary-600">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to={userRole === 'ROLE_DOCTOR' ? '/doctor-dashboard' : '/'} />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/doctor-login" element={<DoctorLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Patient Routes */}
          <Route path="/" element={
            <ProtectedRoute allowedRole="ROLE_PATIENT">
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="records" element={<MedicalHistory />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Doctor Routes */}
          <Route path="/doctor-dashboard" element={
            <ProtectedRoute allowedRole="ROLE_DOCTOR">
              <DoctorLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DoctorDashboard />} />
            <Route path="patients" element={<PatientDirectory />} />
            <Route path="patients/:id" element={<PatientManager />} />
            <Route path="profile" element={<DoctorProfile />} />
          </Route>

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
