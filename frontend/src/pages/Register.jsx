import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, UserPlus, FileText, ArrowLeft, HeartPulse, CheckCircle } from 'lucide-react';
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
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [otp, setOtp] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Call Spring Boot Backend for Registration
      const response = await api.post('/auth/register/patient', {
        username: formData.email, // Using email as username for consistency
        email: formData.email,
        name: formData.name,
        password: formData.password,
        age: formData.age,
        bloodGroup: formData.blood_group
      });

      setSuccess('Account created! Please check your email for the 6-digit verification code.');
      setIsVerificationStep(true);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Error occurred during registration';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/verify-otp', {
        email: formData.email,
        otp: otp
      });

      setSuccess('Email verified successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Invalid or expired verification code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-primary-600 rounded-b-[4rem] shadow-lg opacity-90 -z-10"></div>
      
      <div className="max-w-3xl mx-auto space-y-6 glass-panel p-8 bg-white rounded-2xl shadow-xl">
        
        {!isVerificationStep && (
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center text-sm font-medium text-slate-500 hover:text-primary-600 transition"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Login
          </button>
        )}

        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center shadow-inner mb-4">
            {isVerificationStep ? <CheckCircle size={36} /> : <UserPlus size={36} />}
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isVerificationStep ? 'Verify Your Email' : 'Create an Account'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isVerificationStep 
              ? `We've sent a 6-digit code to ${formData.email}` 
              : 'Register as a new patient on MEDISYNC'}
          </p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-center">
              <span className="mr-2">⚠️</span> {error}
            </div>
        )}
        
        {success && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm font-medium border border-green-100 flex items-center">
              <span className="mr-2">✅</span> {success}
            </div>
        )}

        {!isVerificationStep ? (
          <form className="mt-8 space-y-6" onSubmit={handleRegister}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="flex items-center font-semibold text-slate-700 pb-2 border-b">
                  <FileText size={18} className="mr-2" /> Personal Info
                </h3>
                <div>
                   <label className="block text-sm font-medium text-slate-700">Full Name</label>
                   <input type="text" name="name" required value={formData.name} onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border transition-all" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700">Email Address</label>
                   <input type="email" name="email" required value={formData.email} onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border transition-all" />
                </div>
              </div>

              {/* Medical Info */}
              <div className="space-y-4">
                <h3 className="flex items-center font-semibold text-slate-700 pb-2 border-b">
                  <HeartPulse size={18} className="mr-2 text-red-500" /> Medical Info
                </h3>
                <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700">Age</label>
                      <input type="number" name="age" required value={formData.age} onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border transition-all" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700">Blood Group</label>
                      <select name="blood_group" required value={formData.blood_group} onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border transition-all">
                          <option value="">Select</option>
                          <option value="A+">A+</option><option value="A-">A-</option>
                          <option value="B+">B+</option><option value="B-">B-</option>
                          <option value="O+">O+</option><option value="O-">O-</option>
                          <option value="AB+">AB+</option><option value="AB-">AB-</option>
                      </select>
                    </div>
                </div>
              </div>
              
              {/* Security */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="flex items-center font-semibold text-slate-700 pb-2 border-b">
                  Security
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <input type="password" name="password" required value={formData.password} onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
                    <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border transition-all" />
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg active:scale-[0.98]'}`}
              >
                {loading ? 'Processing...' : 'Register Account'}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
            <div className="max-w-xs mx-auto text-center space-y-4">
              <label className="block text-sm font-medium text-slate-700 uppercase tracking-wider">Enter 6-Digit Code</label>
              <input 
                type="text" 
                maxLength="6" 
                required 
                value={otp} 
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="block w-full text-center text-3xl font-bold tracking-[0.5em] rounded-xl border-slate-300 shadow-inner focus:border-primary-500 focus:ring-primary-500 px-3 py-4 border transition-all"
                placeholder="000000"
              />
              <p className="text-xs text-slate-500 italic">
                The code was sent to your email. It will expire in 5 minutes.
              </p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all ${loading || otp.length < 6 ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg active:scale-[0.98]'}`}
              >
                {loading ? 'Verifying...' : 'Verify & Activate'}
              </button>
              
              <button 
                type="button"
                onClick={() => setIsVerificationStep(false)}
                className="mt-4 w-full text-sm font-medium text-slate-500 hover:text-primary-600 transition"
              >
                Need to change your info? Go back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;
