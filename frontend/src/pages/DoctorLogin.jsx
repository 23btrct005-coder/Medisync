import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Lock, User, PlusCircle, Mail, CheckCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import api from '../api/axiosConfig';

const DoctorLogin = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    username: '', password: '', 
    name: '', email: '', specialization: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Verification states for registration
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  // UI States
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSendOtp = async () => {
    if (!formData.email) {
      setError('Please enter your professional email first.');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      await api.post('/auth/request-otp', { email: formData.email });
      setOtpSent(true);
      setError(''); // Clear any previous errors
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code.');
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
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (isRegistering) {
        if (!emailVerified) {
          setError('Please verify your email address before submitting.');
          setIsLoading(false);
          return;
        }

        await api.post('/auth/register/doctor', {
          username: formData.username,
          password: formData.password,
          name: formData.name,
          email: formData.email,
          specialization: formData.specialization,
          otp: otpCode // Pass OTP to enable account immediately
        });
        
        setError('');
        alert('Physician account created successfully! You may now sign in.');
        setIsRegistering(false);
        setEmailVerified(false);
        setOtpCode('');
      } else {
        const result = await login(formData.username, formData.password);
        if (result.success && result.role === 'ROLE_DOCTOR') {
          navigate('/doctor-dashboard');
        } else {
          setError(result.message || 'Unauthorized access. Only doctors permitted.');
        }
      }
    } catch (err) {
      console.error("Doctor Auth Error:", err);
      let msg = err.response?.data?.message || err.message || 'Server connection failed.';
      if (err.code === 'ERR_NETWORK') {
        msg = 'Network Error: Cannot connect to our server. Please check your internet or Vercel configuration.';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-blue-800 rounded-b-[4rem] shadow-lg opacity-90 -z-10"></div>
      
      <div className="max-w-md w-full space-y-8 glass-panel p-10 bg-white shadow-2xl rounded-2xl border-t-4 border-blue-500">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-inner mb-4 border border-blue-200">
            <Stethoscope size={36} />
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">
            Physician Portal
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isRegistering ? 'Enroll in the Medisync Network' : 'Secure Provider Authentication'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-center animate-in fade-in slide-in-from-top-2">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}
          
          <div className="space-y-4 rounded-md shadow-sm">
            {isRegistering && (
              <div className="space-y-4 pb-4 border-b border-slate-100">
                <div>
                  <input name="name" required placeholder="Full Name" value={formData.name} onChange={handleChange}
                    className="block w-full px-3 py-3 rounded-xl border border-slate-300 focus:ring-blue-500" />
                </div>
                
                {/* Inline Email Verification */}
                <div className="space-y-2">
                  <div className="relative flex gap-2">
                    <input 
                      name="email" 
                      type="email" 
                      required 
                      disabled={emailVerified}
                      placeholder="Professional Email" 
                      value={formData.email} 
                      onChange={handleChange}
                      className={`block w-full px-3 py-3 rounded-xl border border-slate-300 focus:ring-blue-500 ${emailVerified ? 'bg-green-50 border-green-200 pr-10' : ''}`} 
                    />
                    {!emailVerified && !otpSent && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={verifying}
                        className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                      >
                        {verifying ? '...' : 'Verify'}
                      </button>
                    )}
                    {emailVerified && (
                      <div className="absolute right-3 top-3 text-green-600">
                        <CheckCircle size={20} />
                      </div>
                    )}
                  </div>

                  {otpSent && !emailVerified && (
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-2 animate-in slide-in-from-top-2">
                      <div className="flex gap-2">
                        <input 
                          type="text" maxLength="6" placeholder="OTP Code"
                          value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="block w-full text-center text-lg font-bold tracking-widest rounded-lg border-slate-300 px-2 py-1"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={verifying || otpCode.length < 6}
                          className="bg-blue-600 text-white px-4 py-1 rounded-lg text-xs font-bold hover:bg-blue-700"
                        >
                          {verifying ? '...' : 'Verify'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <input name="specialization" required placeholder="Specialization (e.g. Cardiology)" value={formData.specialization} onChange={handleChange}
                    className="block w-full px-3 py-3 rounded-xl border border-slate-300 focus:ring-blue-500" />
                </div>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input name="username" type="text" required placeholder="Doctor ID / Username" value={formData.username} onChange={handleChange}
                className="pl-10 block w-full px-3 py-3 rounded-xl border border-slate-300 focus:ring-blue-500" />
            </div>

            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                required 
                placeholder="Security Passphrase" 
                value={formData.password} 
                onChange={handleChange}
                className="pl-10 pr-10 block w-full px-3 py-3 rounded-xl border border-slate-300 focus:ring-blue-500" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isRegistering && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember" type="checkbox" className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                <label htmlFor="remember" className="ml-2 block text-sm text-slate-600">Remember me</label>
              </div>
              <Link to="/forgot-password" size={12} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                  Forgot password?
              </Link>
            </div>
          )}

          <div>
            <button
              type="submit" disabled={isLoading || (isRegistering && !emailVerified)}
              className={`w-full flex justify-center py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition ${isLoading || (isRegistering && !emailVerified) ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            >
              {isLoading ? 'Processing...' : (isRegistering ? (emailVerified ? 'Complete Enrollment' : 'Verify Email to Continue') : 'Access Dashboard')}
            </button>
          </div>
          
          <div className="mt-4 text-center border-t border-slate-200 pt-6">
            <button type="button" onClick={() => { setIsRegistering(!isRegistering); setOtpSent(false); setEmailVerified(false); }}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 transition"
            >
              {isRegistering ? 'Already enrolled? Log in' : 'New physician? Request Access'}
            </button>
            <br />
            <button type="button" onClick={() => navigate('/login')}
              className="text-xs text-slate-400 mt-4 underline hover:text-slate-600"
            >
              Return to Patient Portal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorLogin;
gin;
