import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, UserPlus, Building2, Mail, Lock, User, Phone, MapPin, Camera, AlertCircle, CheckCircle, GraduationCap, Briefcase, ShieldCheck, Heart, Eye, EyeOff } from 'lucide-react';
import api from '../api/axiosConfig';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import LegalFooter from '../components/LegalFooter';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const context = searchParams.get('context') || 'patient'; // patient or professional
  
  const [role, setRole] = useState(context === 'professional' ? 'ROLE_HOSPITAL_ADMIN' : 'ROLE_PATIENT');
  
  const [formData, setFormData] = useState({
    // Identity
    email: '',
    // Personal / Institutional
    name: '',
    hospitalName: '',
    licenseCode: '',
    hospitalType: '',
    website: '',
    position: 'Chief Administrator',
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
    // Emergency (Patient only)
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    // Security
    password: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [hospitalLogo, setHospitalLogo] = useState(null);

  // Verification states
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [aiDisclaimerAccepted, setAiDisclaimerAccepted] = useState(false);

  const [geographyData, setGeographyData] = useState({});
  const [availableCities, setAvailableCities] = useState([]);

  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const res = await api.get('auth/geography');
        setGeographyData(res.data);
      } catch (err) {
        console.error('Failed to load geography data');
      }
    };
    fetchGeo();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };

    if (name === 'state') {
      if (geographyData[value]) {
        setAvailableCities(geographyData[value]);
        updated.city = '';
      } else {
        setAvailableCities([]);
      }
    }

    if (name === 'dateOfBirth' && value && role === 'ROLE_PATIENT') {
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
    const sanitizedUsername = formData.email.trim();
    if(!sanitizedUsername) {
        setError('Please enter a valid clinical identifier.');
        return;
    }
    
    setVerifying(true);
    setError('');
    try {
      await api.post('auth/request-otp', { email: sanitizedUsername });
      setOtpSent(true);
      setSuccess('Verification code sent to your email.');
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
      await api.post('auth/verify-otp', { email: formData.email, otp: otpCode });
      setEmailVerified(true);
      setSuccess('Email verified successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code.');
    } finally {
      setVerifying(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!emailVerified) { setError('Please verify your email first.'); return; }
    if (role === 'ROLE_PATIENT' && !aiDisclaimerAccepted) { setError('Please accept the AI Clinical Disclaimer.'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setLoading(true);
    setError('');
    try {
      const formDataToSend = new FormData();
      const endpointMap = {
        'ROLE_PATIENT': 'auth/register/patient',
        'ROLE_HOSPITAL_ADMIN': 'auth/register/hospital-admin'
      };
      const endpoint = endpointMap[role];
      
      formDataToSend.append('userData', JSON.stringify({
        ...formData,
        username: formData.email,
        role: role
      }));
      
      if (profilePicture) {
        formDataToSend.append('profilePicture', profilePicture);
      }
      
      if (hospitalLogo && role === 'ROLE_HOSPITAL_ADMIN') {
        formDataToSend.append('hospitalLogo', hospitalLogo);
      }

      await api.post(endpoint, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "block w-full rounded-xl border-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-3 border transition-all bg-white";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase mb-1 ml-1 tracking-wide";
  const sectionHeadClass = "flex items-center gap-2 text-sm font-bold text-primary-700 uppercase tracking-widest mb-4 pb-2 border-b border-primary-100";

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden text-left">
      <div className="absolute top-0 left-0 w-full h-80 bg-primary-600 rounded-b-[3rem] shadow-lg -z-10" />

      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(context === 'professional' ? '/doctor-login' : '/login')} 
          className="mb-6 flex items-center text-sm font-medium text-white/80 hover:text-white transition"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to {context === 'professional' ? 'Professional Portal' : 'Login'}
        </button>

        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-primary-600 px-8 py-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    {role === 'ROLE_PATIENT' ? <UserPlus size={30} /> : <Building2 size={30} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">
                        {role === 'ROLE_PATIENT' ? 'Patient Registration' : 'Institutional Onboarding'}
                    </h2>
                    <p className="text-primary-100 text-sm mt-0.5">Securely join the MEDISYNC Healthcare Network</p>
                  </div>
                </div>
                <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-md">
                    {context === 'patient' ? (
                        <button 
                            className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white text-primary-600 shadow-lg"
                        >
                            Patient
                        </button>
                    ) : (
                        <button 
                            className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white text-primary-600 shadow-lg"
                        >
                            Institutional
                        </button>
                    )}
                </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium border border-red-200 flex items-start gap-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-medium border border-green-200 flex items-start gap-2">
                <CheckCircle size={18} className="shrink-0 mt-0.5" /> {success}
              </div>
            )}

            <form className="space-y-8" onSubmit={handleRegister}>

              {/* 1. Identity & Verification */}
              <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-200 shadow-sm">
                <h3 className={sectionHeadClass}><Mail size={16} />1. Identity Verification</h3>
                <div className="relative">
                  <label className={labelClass}>
                    {role === 'ROLE_HOSPITAL_ADMIN' ? 'Hospital Official Email' : 'Work / Personal Email'} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input type="email" name="email" required disabled={emailVerified}
                      value={formData.email} onChange={handleChange}
                      className={`${inputClass} ${emailVerified ? 'bg-green-50 border-green-300' : ''} flex-1`}
                      placeholder="e.g. admin@narayanahealth.com" />
                    {!emailVerified && (
                      <button type="button" onClick={handleSendOtp} disabled={verifying}
                        className="whitespace-nowrap bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50 transition-all">
                        {verifying ? '...' : otpSent ? 'Resend' : 'Verify'}
                      </button>
                    )}
                  </div>
                </div>

                {otpSent && !emailVerified && (
                  <div className="p-4 bg-white rounded-xl border border-primary-100 space-y-3 animate-in zoom-in-95 shadow-inner">
                    <label className={labelClass}>Verification Code</label>
                    <div className="flex gap-3">
                      <input type="text" maxLength="6" value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="block w-full text-center text-xl font-bold tracking-[0.3em] rounded-xl border-slate-200 px-3 py-3 border focus:ring-primary-500"
                        placeholder="000000" />
                      <button type="button" onClick={handleVerifyOtp} disabled={verifying || otpCode.length < 6}
                        className="bg-primary-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-primary-700 shadow-md">
                        Confirm
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* === HOSPITAL ADMIN SECTIONS === */}
              {role === 'ROLE_HOSPITAL_ADMIN' && (
                <>
                  {/* 2a. Hospital Identity */}
                  <div className="bg-slate-50 rounded-2xl p-6 space-y-5 border border-slate-200 shadow-sm">
                    <h3 className={sectionHeadClass}><Building2 size={16} />2. Hospital Identity</h3>

                    {/* Logo upload centred at top */}
                    <div className="flex flex-col items-center gap-2 pb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hospital Logo</p>
                      <ProfilePhotoUpload onFileSelect={setHospitalLogo} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className={labelClass}>Hospital / Institution Name <span className="text-red-500">*</span></label>
                        <input type="text" name="hospitalName" required value={formData.hospitalName} onChange={handleChange}
                          className={inputClass} placeholder="e.g. Narayana Health City" />
                      </div>
                      <div>
                        <label className={labelClass}>Hospital Type <span className="text-red-500">*</span></label>
                        <select name="hospitalType" required value={formData.hospitalType} onChange={handleChange} className={inputClass}>
                          <option value="">Select Type</option>
                          <option value="Government">Government</option>
                          <option value="Private">Private</option>
                          <option value="Trust / NGO">Trust / NGO</option>
                          <option value="Charitable">Charitable</option>
                          <option value="Multi-Specialty">Multi-Specialty</option>
                          <option value="Clinic">Clinic / Polyclinic</option>
                          <option value="Diagnostic Centre">Diagnostic Centre</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Institutional License Code <span className="text-red-500">*</span></label>
                        <input type="text" name="licenseCode" required value={formData.licenseCode} onChange={handleChange}
                          className={inputClass} placeholder="HL-XXXX-XXXX" />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Official Website</label>
                        <input type="url" name="website" value={formData.website} onChange={handleChange}
                          className={inputClass} placeholder="https://www.yourhospital.com" />
                      </div>
                    </div>
                  </div>

                  {/* 2b. Facility Location */}
                  <div className="bg-slate-50 rounded-2xl p-6 space-y-5 border border-slate-200 shadow-sm">
                    <h3 className={sectionHeadClass}><MapPin size={16} />3. Facility Location & Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>Institutional Phone <span className="text-red-500">*</span></label>
                        <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className={inputClass} maxLength="10" placeholder="10-digit number" />
                      </div>
                      <div>
                        <label className={labelClass}>State <span className="text-red-500">*</span></label>
                        <select name="state" required value={formData.state} onChange={handleChange} className={inputClass}>
                          <option value="">Select State</option>
                          {Object.keys(geographyData).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>City / District <span className="text-red-500">*</span></label>
                        <select name="city" required value={formData.city} onChange={handleChange} className={inputClass}>
                          <option value="">Select City / District</option>
                          {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>PIN Code <span className="text-red-500">*</span></label>
                        <input type="text" name="pinCode" required value={formData.pinCode} onChange={handleChange} className={inputClass} maxLength="6" placeholder="6-digit PIN" />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Street Address / Locality <span className="text-red-500">*</span></label>
                        <input type="text" name="street" required value={formData.street} onChange={handleChange}
                          className={inputClass} placeholder="e.g. 258/A, Hosur Road, Bommasandra" />
                      </div>
                    </div>
                  </div>

                  {/* 2c. Administrator Details */}
                  <div className="bg-slate-50 rounded-2xl p-6 space-y-5 border border-slate-200 shadow-sm">
                    <h3 className={sectionHeadClass}><User size={16} />4. Administrator Identity</h3>
                    <div className="flex flex-col items-center gap-2 pb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Photo</p>
                      <ProfilePhotoUpload onFileSelect={setProfilePicture} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className={labelClass}>Administrator Full Name <span className="text-red-500">*</span></label>
                        <input type="text" name="name" required value={formData.name} onChange={handleChange}
                          className={inputClass} placeholder="Your Legal Name" />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Your Position <span className="text-red-500">*</span></label>
                        <select name="position" required value={formData.position} onChange={handleChange} className={inputClass}>
                          <option value="Chief Administrator">Chief Administrator</option>
                          <option value="Medical Director">Medical Director</option>
                          <option value="CEO / Director">CEO / Director</option>
                          <option value="Department Head">Department Head</option>
                          <option value="IT Operations">IT Operations</option>
                          <option value="HR Manager">HR Manager</option>
                          <option value="Finance Head">Finance Head</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* === PATIENT SECTIONS === */}
              {role === 'ROLE_PATIENT' && (
                <>
                  {/* 2. Personal Details */}
                  <div className="bg-slate-50 rounded-2xl p-6 space-y-6 border border-slate-200 shadow-sm">
                    <h3 className={sectionHeadClass}><User size={16} />2. Personal Details</h3>
                    <div className="flex flex-col items-center gap-2 mb-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile Photo</p>
                      <ProfilePhotoUpload onFileSelect={setProfilePicture} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                        <input type="text" name="name" required value={formData.name} onChange={handleChange}
                          className={inputClass} placeholder="Full Name" />
                      </div>
                      <div>
                        <label className={labelClass}>Date of Birth <span className="text-red-500">*</span></label>
                        <input type="date" name="dateOfBirth" required value={formData.dateOfBirth} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Gender <span className="text-red-500">*</span></label>
                        <select name="gender" required value={formData.gender} onChange={handleChange} className={inputClass}>
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
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

                  {/* 3. Contact Information */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <h3 className={sectionHeadClass}><Phone size={16} />3. Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>Mobile Number <span className="text-red-500">*</span></label>
                        <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className={inputClass} maxLength="10" />
                      </div>
                      <div>
                        <label className={labelClass}>State <span className="text-red-500">*</span></label>
                        <select name="state" required value={formData.state} onChange={handleChange} className={inputClass}>
                          <option value="">Select State</option>
                          {Object.keys(geographyData).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>City / District <span className="text-red-500">*</span></label>
                        <select name="city" required value={formData.city} onChange={handleChange} className={inputClass}>
                          <option value="">Select City / District</option>
                          {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>PIN Code <span className="text-red-500">*</span></label>
                        <input type="text" name="pinCode" required value={formData.pinCode} onChange={handleChange} className={inputClass} maxLength="6" />
                      </div>
                    </div>
                  </div>

                  {/* 4. Emergency Contact */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <h3 className={sectionHeadClass}><Heart size={16} />4. Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>Contact Name <span className="text-red-500">*</span></label>
                        <input type="text" name="emergencyContactName" required value={formData.emergencyContactName} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Relationship <span className="text-red-500">*</span></label>
                        <select name="emergencyContactRelationship" required value={formData.emergencyContactRelationship} onChange={handleChange} className={inputClass}>
                          <option value="">Select Relationship</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Parent">Parent</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Emergency Phone</label>
                        <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} className={inputClass} maxLength="10" />
                      </div>
                    </div>
                  </div>
                </>
              )}


              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className={sectionHeadClass}>
                    <ShieldCheck size={16} /> 
                    {role === 'ROLE_PATIENT' ? '5. Account Security' : '4. Admin Security'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="relative">
                    <label className={labelClass}>Password <span className="text-red-500">*</span></label>
                    <input type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} className={inputClass} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-slate-400">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="relative">
                    <label className={labelClass}>Confirm Password <span className="text-red-500">*</span></label>
                    <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className={inputClass} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-9 text-slate-400">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 6. AI & Legal */}
              {role === 'ROLE_PATIENT' && (
                  <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl flex items-start gap-3">
                    <input type="checkbox" id="aiDisclaimer" checked={aiDisclaimerAccepted} onChange={(e) => setAiDisclaimerAccepted(e.target.checked)} className="mt-1 h-4 w-4 text-primary-600 rounded cursor-pointer" />
                    <label htmlFor="aiDisclaimer" className="text-xs text-slate-600 leading-relaxed cursor-pointer font-bold">
                        AI Clinical Disclaimer: I acknowledge that Medisync uses AI for clinical analysis.
                    </label>
                  </div>
              )}

              <div className="pt-2">
                <button type="submit" disabled={loading || !emailVerified || (role === 'ROLE_PATIENT' && !aiDisclaimerAccepted)}
                  className={`w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl shadow-xl text-md font-extrabold text-white bg-primary-600 hover:bg-primary-700 transition-all ${loading || !emailVerified ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}`}>
                  {loading ? 'Onboarding Institution...' : 'Complete Registration'}
                </button>
                <div className="mt-8 opacity-60">
                   <LegalFooter />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
