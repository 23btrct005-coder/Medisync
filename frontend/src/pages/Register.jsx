// Last Updated: 2026-04-09T17:58:00Z
// Triggering redeploy
import { useState } from 'react';
// Updated at 2026-04-09: Unified theme and added password toggles
import { useNavigate, Link } from 'react-router-dom';
import { Activity, UserPlus, FileText, ArrowLeft, HeartPulse, CheckCircle, Mail, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import api from '../api/axiosConfig';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '', 
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    age: '',
    blood_group: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Verification states
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      setError('Please enter an email address first.');
      return;
    }
    setVerifying(true);
    setError('');
    
    // Safety timeout: If the server doesn't respond in 15s, release the UI
    const timeoutId = setTimeout(() => {
      if (!otpSent && !emailVerified) {
        setVerifying(false);
        setError('Server is taking too long to respond. Please check your internet or try again later.');
      }
    }, 15000);

    try {
      await api.post('/auth/request-otp', { email: formData.email });
      clearTimeout(timeoutId);
      setOtpSent(true);
      setSuccess('Verification code sent to your email.');
    } catch (err) {
      clearTimeout(timeoutId);
      setError(err.response?.data?.message || 'Failed to send verification code. Please check your email and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) return;
    setVerifying(true);
    setError('');
    try {
      await api.post('/auth/verify-otp', { email: formData.email, otp: otpCode });
      setEmailVerified(true);
      setOtpSent(false);
      setSuccess('Email verified successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code.');
    } finally {
      setVerifying(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!emailVerified) {
      setError('Please verify your email address first.');
      return;
    }

    setLoading(true);
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/register/patient', {
        username: formData.email,
        email: formData.email,
        name: formData.name,
        password: formData.password,
        age: formData.age,
        bloodGroup: formData.blood_group,
        // No OTP needed here — email was already verified via /verify-otp above
        // The backend enables the user via verifyOtp() before this call
      });

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error("Registration Error:", err);
      let msg = err.response?.data?.message || 'Error occurred during registration';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-80 bg-primary-600 rounded-b-[3rem] shadow-lg opacity-90 -z-10"></div>
      
      <div className="max-w-2xl mx-auto glass-panel p-8 bg-white rounded-3xl shadow-2xl border border-white/20">
        
        <button 
          onClick={() => navigate('/login')}
          className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-primary-600 transition"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Login
        </button>

        <div className="text-center mb-10">
          <div className="mx-auto h-16 w-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center shadow-sm mb-4 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer border border-primary-100">
            <UserPlus size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Create a Patient Account</h2>
          <p className="mt-2 text-slate-500">Securely join the MEDISYNC healthcare portal</p>
        </div>

        {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 animate-in fade-in slide-in-from-top-4">
              <span className="mr-2">⚠️</span> {error}
            </div>
        )}
        
        {success && (
            <div className="mb-6 bg-green-50 text-green-600 p-4 rounded-xl text-sm font-medium border border-green-100 animate-in fade-in slide-in-from-top-4">
              <span className="mr-2">✅</span> {success}
            </div>
        )}

        <form className="space-y-8" onSubmit={handleRegister}>
          
          {/* Email Verification Section */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="flex items-center text-sm font-bold text-slate-600 uppercase tracking-widest">
              <Mail size={16} className="mr-2" /> 1. Identity Verification
            </h3>
            
            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Email Address</label>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  name="email" 
                  required 
                  disabled={emailVerified}
                  value={formData.email} 
                  onChange={handleChange}
                  className={`block w-full rounded-xl border-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-3 border transition-all ${emailVerified ? 'bg-green-50 border-green-200 pr-10' : ''}`} 
                  placeholder="e.g. john@example.com"
                />
                {!emailVerified && !otpSent && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={verifying}
                    className="whitespace-nowrap bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50 transition-all shadow-sm active:scale-95"
                  >
                    {verifying ? 'Sending...' : 'Send Code'}
                  </button>
                )}
                {emailVerified && (
                  <div className="absolute right-3 top-8 text-green-600">
                    <CheckCircle size={24} />
                  </div>
                )}
              </div>
            </div>

            {otpSent && !emailVerified && (
              <div className="p-4 bg-white rounded-xl border border-primary-100 shadow-sm space-y-3 animate-in zoom-in-95">
                <label className="block text-xs font-bold text-primary-600 uppercase">Verification Code</label>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    maxLength="6" 
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="block w-full text-center text-xl font-bold tracking-[0.3em] rounded-xl border-slate-200 px-3 py-2 border focus:ring-primary-500 focus:border-primary-500"
                    placeholder="000000"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={verifying || otpCode.length < 6}
                    className="bg-primary-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50 shadow-md transition-all active:scale-95"
                  >
                    {verifying ? '...' : 'Verify'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 text-center uppercase tracking-wide">Enter the 6-digit code sent to your inbox</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-100 pointer-events-auto transition-opacity duration-300">
            {/* Personal Details */}
            <div className="space-y-4">
              <h3 className="flex items-center text-sm font-bold text-slate-600 uppercase tracking-widest">
                <FileText size={16} className="mr-2" /> 2. Personal Details
              </h3>
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Full Name</label>
                 <input type="text" name="name" required value={formData.name} onChange={handleChange}
                  className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-3 border transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Age</label>
                  <input type="number" name="age" required value={formData.age} onChange={handleChange}
                    className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-3 border transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Blood Group</label>
                  <select name="blood_group" required value={formData.blood_group} onChange={handleChange}
                    className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-3 border transition-all">
                      <option value="">Select</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-4">
              <h3 className="flex items-center text-sm font-bold text-slate-600 uppercase tracking-widest">
                <ShieldCheck size={16} className="mr-2" /> 3. Security
              </h3>
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Password</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  required 
                  value={formData.password} 
                  onChange={handleChange}
                  className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-3 border transition-all pr-10" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-primary-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Confirm Password</label>
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  name="confirmPassword" 
                  required 
                  value={formData.confirmPassword} 
                  onChange={handleChange}
                  className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-3 border transition-all pr-10" 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-primary-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t">
            <button
              type="submit"
              disabled={loading || !emailVerified}
              className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-md font-extrabold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all ${loading || !emailVerified ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              {!emailVerified ? 'Please Verify Email First' : loading ? 'Creating Account...' : 'Complete Patient Registration'}
            </button>
            <p className="mt-4 text-center text-xs text-slate-400 uppercase tracking-wider font-medium">
              By registering, you agree to our terms of service
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

