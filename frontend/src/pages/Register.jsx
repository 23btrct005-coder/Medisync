// Last Updated: 2026-04-10 — Full patient registration form with all primary fields
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Activity, UserPlus, FileText, ArrowLeft, HeartPulse,
  CheckCircle, Mail, ShieldCheck, Eye, EyeOff, Phone,
  MapPin, AlertCircle, User, Heart
} from 'lucide-react';
import api from '../api/axiosConfig';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import LegalFooter from '../components/LegalFooter';
import { Bot, Info } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Identity
    email: '',
    // Personal
    name: '',
    dateOfBirth: '',
    age: '',
    gender: '',
    bloodGroup: '',
    // Contact
    phone: '',
    alternatePhone: '',
    // Address
    street: '',
    city: '',
    state: '',
    pinCode: '',
    // Emergency
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    // Security
    password: '',
    confirmPassword: '',
  });

  const [profilePicture, setProfilePicture] = useState(null);

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
  const [aiDisclaimerAccepted, setAiDisclaimerAccepted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };

    // Auto-calculate age from date of birth
    if (name === 'dateOfBirth' && value) {
      const today = new Date();
      const dob = new Date(value);
      let calculatedAge = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) calculatedAge--;
      updated.age = calculatedAge > 0 ? String(calculatedAge) : '';
    }

    setFormData(updated);
  };

  const handleSendOtp = async () => {
    // Robust validation
    const sanitizedUsername = formData.email.trim();
    if(!sanitizedUsername) {
        setError('Please enter a valid clinical identifier.');
        return;
    }
    
    setVerifying(true);
    setError('');
    const timeoutId = setTimeout(() => {
      if (!otpSent && !emailVerified) {
        setVerifying(false);
        setError('Server is taking too long to respond. Please try again later.');
      }
    }, 15000);
    try {
      await api.post('auth/request-otp', { email: sanitizedUsername });
      clearTimeout(timeoutId);
      setOtpSent(true);
      setSuccess('Verification code sent to your email.');
    } catch (err) {
      clearTimeout(timeoutId);
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
      await api.post('auth/verify-otp', { email: formData.email, otp: otpCode });
      setEmailVerified(true);
      setOtpSent(false);
      setSuccess('Email verified successfully! Please complete the form below.');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code.');
    } finally {
      setVerifying(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!emailVerified) { setError('Please verify your clinical email first.'); return; }
    
    // Comprehensive Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) { setError('Invalid clinical email format.'); return; }
    if (formData.password.length < 8) { setError('Secure password must be at least 8 characters.'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Clinical passwords do not match.'); return; }
    if (formData.phone.length < 10) { setError('Mobile number must be at least 10 digits.'); return; }

    setLoading(true);
    setError('');
    try {
      const formDataToSend = new FormData();
      
      const userData = {
        username: formData.email,
        email: formData.email,
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        age: formData.age,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        phone: formData.phone,
        alternatePhone: formData.alternatePhone,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        pinCode: formData.pinCode,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactRelationship: formData.emergencyContactRelationship,
        emergencyContactPhone: formData.emergencyContactPhone,
        password: formData.password,
      };

      formDataToSend.append('userData', JSON.stringify(userData));
      if (profilePicture) {
        formDataToSend.append('profilePicture', profilePicture);
      }

      await api.post('auth/register/patient', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Registration Error:', err);
      setError(err.response?.data?.message || 'Error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "block w-full rounded-xl border-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-3 border transition-all bg-white";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase mb-1 ml-1 tracking-wide";
  const sectionHeadClass = "flex items-center gap-2 text-sm font-bold text-primary-700 uppercase tracking-widest mb-4 pb-2 border-b border-primary-100";

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-br from-primary-700 to-primary-500 rounded-b-[3rem] shadow-lg -z-10" />

      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/login')} className="mb-6 flex items-center text-sm font-medium text-white/80 hover:text-white transition">
          <ArrowLeft size={16} className="mr-1" /> Back to Login
        </button>

        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <UserPlus size={30} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Create Patient Account</h2>
                <p className="text-primary-100 text-sm mt-0.5">Securely join the MEDISYNC healthcare portal</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Alerts */}
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium border border-red-200 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-medium border border-green-200 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                <CheckCircle size={18} className="shrink-0 mt-0.5" /> {success}
              </div>
            )}

            <form className="space-y-8" onSubmit={handleRegister}>

              {/* ── SECTION 1: Identity Verification ── */}
              <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-200">
                <h3 className={sectionHeadClass}><Mail size={16} />1. Identity Verification</h3>
                <div className="relative">
                  <label className={labelClass}>Email Address <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input type="email" name="email" required disabled={emailVerified}
                      value={formData.email} onChange={handleChange}
                      className={`${inputClass} ${emailVerified ? 'bg-green-50 border-green-300' : ''} flex-1`}
                      placeholder="e.g. john@example.com" />
                    {!emailVerified && !otpSent && (
                      <button type="button" onClick={handleSendOtp} disabled={verifying}
                        className="whitespace-nowrap bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50 transition-all shadow-sm active:scale-95">
                        {verifying ? 'Sending...' : 'Send Code'}
                      </button>
                    )}
                    {emailVerified && (
                      <span className="flex items-center gap-1.5 text-green-600 text-sm font-bold whitespace-nowrap">
                        <CheckCircle size={20} /> Verified
                      </span>
                    )}
                  </div>
                </div>

                {otpSent && !emailVerified && (
                  <div className="p-4 bg-white rounded-xl border border-primary-100 shadow-sm space-y-3 animate-in zoom-in-95">
                    <label className={labelClass + " text-primary-600"}>Verification Code</label>
                    <div className="flex gap-3">
                      <input type="text" maxLength="6" value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="block w-full text-center text-xl font-bold tracking-[0.3em] rounded-xl border-slate-200 px-3 py-3 border focus:ring-primary-500 focus:border-primary-500"
                        placeholder="000000" />
                      <button type="button" onClick={handleVerifyOtp} disabled={verifying || otpCode.length < 6}
                        className="bg-primary-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50 shadow-md transition-all active:scale-95">
                        {verifying ? '...' : 'Verify'}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center uppercase tracking-wide">Enter the 6-digit code sent to your inbox</p>
                  </div>
                )}
              </div>

              {/* ── SECTION 2: Personal Details ── */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className={sectionHeadClass}><User size={16} />2. Personal Details</h3>
                
                <div className="flex justify-center mb-8">
                  <ProfilePhotoUpload onFileSelect={setProfilePicture} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange}
                      className={inputClass} placeholder="e.g. John Michael Doe" />
                  </div>
                  <div>
                    <label className={labelClass}>Date of Birth <span className="text-red-500">*</span></label>
                    <input type="date" name="dateOfBirth" required value={formData.dateOfBirth} onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Age (Auto-calculated)</label>
                    <input type="number" name="age" readOnly value={formData.age}
                      className={inputClass + " bg-slate-100 cursor-not-allowed"} placeholder="Calculated from DOB" />
                  </div>
                  <div>
                    <label className={labelClass}>Gender <span className="text-red-500">*</span></label>
                    <select name="gender" required value={formData.gender} onChange={handleChange} className={inputClass}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Blood Group <span className="text-red-500">*</span></label>
                    <select name="bloodGroup" required value={formData.bloodGroup} onChange={handleChange} className={inputClass}>
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ── SECTION 3: Contact Information ── */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className={sectionHeadClass}><Phone size={16} />3. Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Mobile Number <span className="text-red-500">*</span></label>
                    <input type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                      className={inputClass} placeholder="e.g. 9876543210" maxLength="10" />
                  </div>
                  <div>
                    <label className={labelClass}>Alternate Mobile Number</label>
                    <input type="tel" name="alternatePhone" value={formData.alternatePhone} onChange={handleChange}
                      className={inputClass} placeholder="Optional" maxLength="10" />
                  </div>
                  <div>
                    <label className={labelClass}>City <span className="text-red-500">*</span></label>
                    <input type="text" name="city" required value={formData.city} onChange={handleChange}
                      className={inputClass} placeholder="e.g. Bangalore" />
                  </div>
                  <div>
                    <label className={labelClass}>State <span className="text-red-500">*</span></label>
                    <input type="text" name="state" required value={formData.state} onChange={handleChange}
                      className={inputClass} placeholder="e.g. Karnataka" />
                  </div>
                  <div>
                    <label className={labelClass}>PIN Code <span className="text-red-500">*</span></label>
                    <input type="text" name="pinCode" required value={formData.pinCode} onChange={handleChange}
                      className={inputClass} placeholder="e.g. 560001" maxLength="6" />
                  </div>
                  <div>
                    <label className={labelClass}>Street / Area</label>
                    <input type="text" name="street" value={formData.street} onChange={handleChange}
                      className={inputClass} placeholder="e.g. MG Road, Block 4" />
                  </div>
                </div>
              </div>

              {/* ── SECTION 4: Emergency Contact ── */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className={sectionHeadClass}><Heart size={16} />4. Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Contact Name <span className="text-red-500">*</span></label>
                    <input type="text" name="emergencyContactName" required value={formData.emergencyContactName} onChange={handleChange}
                      className={inputClass} placeholder="e.g. Jane Doe" />
                  </div>
                  <div>
                    <label className={labelClass}>Relationship <span className="text-red-500">*</span></label>
                    <select name="emergencyContactRelationship" required value={formData.emergencyContactRelationship} onChange={handleChange} className={inputClass}>
                      <option value="">Select Relationship</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Child">Child</option>
                      <option value="Friend">Friend</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Emergency Phone Number</label>
                    <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange}
                      className={inputClass} placeholder="e.g. 9876543210" maxLength="10" />
                  </div>
                </div>
              </div>

              {/* ── SECTION 5: Security ── */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className={sectionHeadClass}><ShieldCheck size={16} />5. Account Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="relative">
                    <label className={labelClass}>Password <span className="text-red-500">*</span></label>
                    <input type={showPassword ? 'text' : 'password'} name="password" required
                      value={formData.password} onChange={handleChange}
                      className={inputClass + ' pr-10'} placeholder="Min. 8 characters" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-9 text-slate-400 hover:text-primary-600 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="relative">
                    <label className={labelClass}>Confirm Password <span className="text-red-500">*</span></label>
                    <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required
                      value={formData.confirmPassword} onChange={handleChange}
                      className={inputClass + ' pr-10'} placeholder="Re-enter password" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-9 text-slate-400 hover:text-primary-600 transition-colors">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Disclaimer Acknowledgement */}
              <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="aiDisclaimer"
                  checked={aiDisclaimerAccepted}
                  onChange={(e) => setAiDisclaimerAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="aiDisclaimer" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                  <span className="flex items-center gap-1 font-bold text-indigo-700 uppercase tracking-tighter mb-0.5">
                    <Bot size={14} /> AI Clinical Disclaimer
                  </span>
                  I acknowledge that Medisync uses AI for clinical analysis. I have read the <Link to="/ai-disclaimer" className="text-indigo-600 font-bold hover:underline">AI Disclaimer</Link> and understand that all AI results must be verified by a physician.
                </label>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button type="submit" disabled={loading || !emailVerified || !aiDisclaimerAccepted}
                  className={`w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl shadow-xl text-md font-extrabold text-white bg-gradient-to-r from-primary-600 to-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all ${loading || !emailVerified || !aiDisclaimerAccepted ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-[0.99] hover:shadow-primary-200 hover:shadow-2xl'}`}>
                  <UserPlus size={20} />
                  {!emailVerified ? 'Please Verify Email First' : !aiDisclaimerAccepted ? 'Accept AI Disclaimer' : loading ? 'Creating Account...' : 'Complete Patient Registration'}
                </button>
                <p className="mt-4 text-center text-xs text-slate-400 uppercase tracking-wider font-medium">
                  Fields marked with <span className="text-red-500">*</span> are required &nbsp;·&nbsp; By registering, you agree to our <Link to="/terms-of-service" className="text-primary-600 hover:underline">terms of service</Link> and <Link to="/privacy-policy" className="text-primary-600 hover:underline">privacy policy</Link>
                </p>
                <LegalFooter />
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
