import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Stethoscope, Lock, User, Mail, CheckCircle, Eye, EyeOff,
  Phone, GraduationCap, ShieldCheck, Building2, Clock, AlertCircle,
  ArrowLeft, BadgeCheck, HeartPulse, Bot
} from 'lucide-react';
import api from '../api/axiosConfig';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import LegalFooter from '../components/LegalFooter';

// ─── Doctor Registration Form ───────────────────────────────────────────────
const DoctorRegisterForm = ({ onBack }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Basic
    name: '', gender: '', dateOfBirth: '', age: '',
    // Contact
    email: '', phone: '', alternatePhone: '',
    // Professional
    specialization: '', medicalDegree: '', additionalCertifications: '', college: '',
    // License
    medicalLicenseNumber: '',
    // Work
    hospital: '', yearsOfExperience: '', consultationFee: '', upiId: '',
    // Availability
    workingDays: '', consultationTimings: '', onlineConsultation: 'false',
    // Account
    username: '', password: '', confirmPassword: '',
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [aiDisclaimerAccepted, setAiDisclaimerAccepted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    if (name === 'dateOfBirth' && value) {
      const today = new Date();
      const dob = new Date(value);
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      updated.age = age > 0 ? String(age) : '';
    }
    setFormData(updated);
  };

  const handleSendOtp = async () => {
    if (!formData.email) { setError('Please enter your professional email.'); return; }
    setVerifying(true); setError('');
    const tid = setTimeout(() => { setVerifying(false); setError('Server timeout. Please try again.'); }, 15000);
    try {
      await api.post('auth/request-otp', { email: formData.email });
      clearTimeout(tid); setOtpSent(true); setSuccess('Verification code sent to your email.');
    } catch (err) {
      clearTimeout(tid); setError(err.response?.data?.message || 'Failed to send code.');
    } finally { setVerifying(false); }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) return;
    setVerifying(true); setError('');
    try {
      await api.post('auth/verify-otp', { email: formData.email, otp: otpCode });
      setEmailVerified(true); setOtpSent(false);
      setSuccess('Email verified! Please complete the rest of the form.');
    } catch (err) { setError(err.response?.data?.message || 'Invalid code.'); }
    finally { setVerifying(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailVerified) { setError('Please verify your email first.'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    setLoading(true); setError('');
    try {
      const formDataToSend = new FormData();
      
      const userData = {
        username: formData.username || formData.email,
        password: formData.password,
        name: formData.name, email: formData.email,
        gender: formData.gender, dateOfBirth: formData.dateOfBirth, age: formData.age,
        phone: formData.phone, alternatePhone: formData.alternatePhone,
        specialization: formData.specialization, medicalDegree: formData.medicalDegree,
        additionalCertifications: formData.additionalCertifications, college: formData.college,
        medicalLicenseNumber: formData.medicalLicenseNumber,
        hospital: formData.hospital, yearsOfExperience: formData.yearsOfExperience,
        consultationFee: formData.consultationFee, workingDays: formData.workingDays,
        consultationTimings: formData.consultationTimings,
        onlineConsultation: formData.onlineConsultation,
        upiId: formData.upiId,
      };

      formDataToSend.append('userData', JSON.stringify(userData));
      if (profilePicture) {
        formDataToSend.append('profilePicture', profilePicture);
      }

      await api.post('auth/register/doctor', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Physician account created successfully! Redirecting to login...');
      setTimeout(() => onBack(), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const [hospitals, setHospitals] = useState([]);
  React.useEffect(() => {
    const fetchHospitals = async () => {
        try {
            const res = await api.get('/auth/hospitals');
            setHospitals(res.data);
        } catch (err) {
            console.error("Failed to fetch institutional directory");
        }
    };
    fetchHospitals();
  }, []);

  const inputCls = "block w-full rounded-xl border-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm px-4 py-3 border transition-all bg-white";
  const labelCls = "block text-xs font-bold text-slate-500 uppercase mb-1 ml-1 tracking-wide";
  const sectionCls = "flex items-center gap-2 text-sm font-bold text-primary-700 uppercase tracking-widest mb-4 pb-2 border-b border-primary-100";

  const [enrollmentRole, setEnrollmentRole] = useState('DOCTOR'); // DOCTOR or HOSPITAL

  return (
    <div className="min-h-screen py-10 px-4 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-br from-blue-800 to-blue-600 rounded-b-[3rem] -z-10" />
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="mb-6 flex items-center text-sm font-medium text-white/80 hover:text-white transition">
          <ArrowLeft size={16} className="mr-1" /> Back to Login
        </button>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-8 py-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    {enrollmentRole === 'DOCTOR' ? <Stethoscope size={30} /> : <Building2 size={30} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold">{enrollmentRole === 'DOCTOR' ? 'Physician Enrollment' : 'Institutional Onboarding'}</h2>
                    <p className="text-blue-200 text-sm mt-0.5">Join the MEDISYNC Healthcare Network</p>
                  </div>
                </div>
                <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-md self-start md:self-auto">
                    <button 
                        onClick={() => setEnrollmentRole('DOCTOR')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${enrollmentRole === 'DOCTOR' ? 'bg-white text-blue-700 shadow-lg' : 'text-white/60 hover:text-white'}`}
                    >
                        Physician
                    </button>
                    <button 
                        onClick={() => {
                            if (enrollmentRole !== 'HOSPITAL') {
                                navigate('/register?context=professional'); 
                            }
                        }}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${enrollmentRole === 'HOSPITAL' ? 'bg-white text-blue-700 shadow-lg' : 'text-white/60 hover:text-white'}`}
                    >
                        Institutional
                    </button>
                </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-200 flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={18} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm border border-green-200 flex items-start gap-2 animate-in fade-in">
                <CheckCircle size={18} className="shrink-0 mt-0.5" /> {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* 1. Email Verification */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
                <h3 className={sectionCls}><Mail size={16} />1. Identity Verification</h3>
                <div>
                  <label className={labelCls}>Professional Email <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input type="email" name="email" required disabled={emailVerified}
                      value={formData.email} onChange={handleChange}
                      className={`${inputCls} flex-1 ${emailVerified ? 'bg-green-50 border-green-300' : ''}`}
                      placeholder="doctor@hospital.com" />
                    {!emailVerified && !otpSent && (
                      <button type="button" onClick={handleSendOtp} disabled={verifying}
                        className="whitespace-nowrap bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition active:scale-95">
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
                  <div className="p-4 bg-white rounded-xl border border-blue-100 shadow-sm space-y-2 animate-in zoom-in-95">
                    <label className={labelCls + " text-blue-600"}>Verification Code</label>
                    <div className="flex gap-3">
                      <input type="text" maxLength="6" value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="block w-full text-center text-xl font-bold tracking-[0.3em] rounded-xl border-slate-200 px-3 py-3 border focus:ring-blue-500"
                        placeholder="000000" />
                      <button type="button" onClick={handleVerifyOtp} disabled={verifying || otpCode.length < 6}
                        className="bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition active:scale-95">
                        {verifying ? '...' : 'Verify'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Basic Details */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className={sectionCls}><User size={16} />2. Basic Details</h3>
                
                <div className="flex justify-center mb-8">
                  <ProfilePhotoUpload onFileSelect={setProfilePicture} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange}
                      className={inputCls} placeholder="Dr. John Smith" />
                  </div>
                  <div>
                    <label className={labelCls}>Gender <span className="text-red-500">*</span></label>
                    <select name="gender" required value={formData.gender} onChange={handleChange} className={inputCls}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Date of Birth</label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Age (Auto-calculated)</label>
                    <input type="number" name="age" readOnly value={formData.age}
                      className={inputCls + " bg-slate-100 cursor-not-allowed"} placeholder="From DOB" />
                  </div>
                </div>
              </div>

              {/* 3. Contact Information */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className={sectionCls}><Phone size={16} />3. Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Mobile Number <span className="text-red-500">*</span></label>
                    <input type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                      className={inputCls} placeholder="9876543210" maxLength="10" />
                  </div>
                  <div>
                    <label className={labelCls}>Alternate Mobile</label>
                    <input type="tel" name="alternatePhone" value={formData.alternatePhone} onChange={handleChange}
                      className={inputCls} placeholder="Optional" maxLength="10" />
                  </div>
                </div>
              </div>

              {/* 4. Professional Qualifications */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className={sectionCls}><GraduationCap size={16} />4. Professional Qualifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Medical Degree <span className="text-red-500">*</span></label>
                    <select name="medicalDegree" required value={formData.medicalDegree} onChange={handleChange} className={inputCls}>
                      <option value="">Select Degree</option>
                      <option value="MBBS">MBBS</option>
                      <option value="MD">MD</option>
                      <option value="MS">MS</option>
                      <option value="DNB">DNB</option>
                      <option value="DM">DM</option>
                      <option value="MCh">MCh</option>
                      <option value="BDS">BDS</option>
                      <option value="MDS">MDS</option>
                      <option value="BAMS">BAMS</option>
                      <option value="BHMS">BHMS</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Specialization <span className="text-red-500">*</span></label>
                    <select name="specialization" required value={formData.specialization} onChange={handleChange} className={inputCls}>
                      <option value="">Select Specialization</option>
                      <option value="General Physician">General Physician</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Gynecology">Gynecology</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Psychiatry">Psychiatry</option>
                      <option value="Oncology">Oncology</option>
                      <option value="Radiology">Radiology</option>
                      <option value="ENT">ENT</option>
                      <option value="Ophthalmology">Ophthalmology</option>
                      <option value="Urology">Urology</option>
                      <option value="Nephrology">Nephrology</option>
                      <option value="Pulmonology">Pulmonology</option>
                      <option value="Endocrinology">Endocrinology</option>
                      <option value="Gastroenterology">Gastroenterology</option>
                      <option value="Dentistry">Dentistry</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>College / University</label>
                    <input type="text" name="college" value={formData.college} onChange={handleChange}
                      className={inputCls} placeholder="e.g. AIIMS, New Delhi" />
                  </div>
                  <div>
                    <label className={labelCls}>Additional Certifications</label>
                    <input type="text" name="additionalCertifications" value={formData.additionalCertifications} onChange={handleChange}
                      className={inputCls} placeholder="e.g. FRCS, Fellowship in Cardiology" />
                  </div>
                </div>
              </div>

              {/* 5. License & Verification */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className={sectionCls}><BadgeCheck size={16} />5. License & Verification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className={labelCls}>Medical License Number <span className="text-red-500">*</span></label>
                    <input type="text" name="medicalLicenseNumber" required value={formData.medicalLicenseNumber} onChange={handleChange}
                      className={inputCls} placeholder="e.g. MCI-12345678" />
                    <p className="text-xs text-slate-400 mt-1 ml-1">Issued by MCI / State Medical Council</p>
                  </div>
                </div>
              </div>

              {/* 6. Work Details */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className={sectionCls}><Building2 size={16} />6. Work Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className={labelCls}>Affiliated Hospital / Clinic <span className="text-red-500">*</span></label>
                    <select name="hospital" required value={formData.hospital} onChange={handleChange} className={inputCls}>
                        <option value="">Select Institution</option>
                        {hospitals.map(h => (
                            <option key={h.id} value={h.id}>{h.name} ({h.location})</option>
                        ))}
                        <option value="other">Other / Private Clinic</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Years of Experience</label>
                    <input type="number" name="yearsOfExperience" min="0" max="60" value={formData.yearsOfExperience} onChange={handleChange}
                      className={inputCls} placeholder="e.g. 10" />
                  </div>
                  <div>
                    <label className={labelCls}>Consultation Fee (₹)</label>
                    <input type="text" name="consultationFee" value={formData.consultationFee} onChange={handleChange}
                      className={inputCls} placeholder="e.g. 500" />
                  </div>
                  <div>
                    <label className={labelCls}>UPI ID (for payments)</label>
                    <input type="text" name="upiId" value={formData.upiId} onChange={handleChange}
                      className={inputCls} placeholder="e.g. doctor@upi" />
                  </div>
                </div>
              </div>

              {/* 7. Availability */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className={sectionCls}><Clock size={16} />7. Availability</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Working Days</label>
                    <input type="text" name="workingDays" value={formData.workingDays} onChange={handleChange}
                      className={inputCls} placeholder="e.g. Mon–Fri, Mon-Sat" />
                  </div>
                  <div>
                    <label className={labelCls}>Consultation Timings</label>
                    <input type="text" name="consultationTimings" value={formData.consultationTimings} onChange={handleChange}
                      className={inputCls} placeholder="e.g. 9:00 AM – 6:00 PM" />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Online Consultation</label>
                    <select name="onlineConsultation" value={formData.onlineConsultation} onChange={handleChange} className={inputCls}>
                      <option value="false">Not Available</option>
                      <option value="true">Available</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 8. Account Security */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className={sectionCls}><ShieldCheck size={16} />8. Account Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className={labelCls}>Username / Doctor ID <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.email} disabled className={`${inputCls} bg-blue-50 border-blue-100 text-blue-900 font-bold`} />
                  </div>
                  <div className="relative">
                    <label className={labelCls}>Password <span className="text-red-500">*</span></label>
                    <input type={showPassword ? 'text' : 'password'} name="password" required
                      value={formData.password} onChange={handleChange}
                      className={inputCls + ' pr-10'} placeholder="Min. 8 characters" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-9 text-slate-400 hover:text-blue-600 transition">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="relative">
                    <label className={labelCls}>Confirm Password <span className="text-red-500">*</span></label>
                    <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required
                      value={formData.confirmPassword} onChange={handleChange}
                      className={inputCls + ' pr-10'} placeholder="Re-enter password" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-9 text-slate-400 hover:text-blue-600 transition">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Disclaimer Acknowledgement */}
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="doctorAiDisclaimer"
                  checked={aiDisclaimerAccepted}
                  onChange={(e) => setAiDisclaimerAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="doctorAiDisclaimer" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                  <span className="flex items-center gap-1 font-bold text-blue-700 uppercase tracking-tighter mb-0.5">
                    <Bot size={14} /> AI Clinical Acknowledgment
                  </span>
                  I acknowledge that Medisync uses AI (OpenAI/Groq/MONAI) for clinical data processing. I have read the <Link to="/ai-disclaimer" className="text-blue-600 font-bold hover:underline">AI Disclaimer</Link> and agree to verify all AI-generated insights before making clinical decisions.
                </label>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading || !emailVerified || !aiDisclaimerAccepted}
                className={`w-full flex justify-center items-center gap-2 py-4 rounded-2xl shadow-xl font-extrabold text-white bg-gradient-to-r from-blue-800 to-blue-600 transition-all ${loading || !emailVerified || !aiDisclaimerAccepted ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-[0.99]'}`}>
                <Stethoscope size={20} />
                {!emailVerified ? 'Please Verify Email First' : !aiDisclaimerAccepted ? 'Accept AI Disclaimer' : loading ? 'Submitting...' : 'Complete Physician Enrollment'}
              </button>
              <p className="text-center text-xs text-slate-400 uppercase tracking-wider">
                Fields marked <span className="text-red-500">*</span> are required &nbsp;·&nbsp; By enrolling, you agree to our <Link to="/terms-of-service" className="text-blue-600 hover:underline">Terms</Link> and <Link to="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Doctor Login Form ───────────────────────────────────────────────────────
const DoctorLogin = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); setError('');
    try {
      const result = await login(formData.username, formData.password);
      if (result.success) {
        if (result.role === 'ROLE_ADMIN') {
          navigate('/admin-dashboard');
        } else if (result.role === 'ROLE_DOCTOR') {
          const from = location.state?.from || '/doctor-dashboard';
          navigate(from);
        } else if (result.role === 'ROLE_HOSPITAL_ADMIN') {
          navigate('/hospital-dashboard');
        } else {
          setError('Unauthorized. Only registered clinical staff and institutional administrators can access this portal.');
        }
      } else {
        setError(result.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setIsLoading(false); }
  };

  if (isRegistering) return <DoctorRegisterForm onBack={() => setIsRegistering(false)} />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-blue-900 to-blue-700 rounded-b-[4rem] -z-10" />

      <div className="max-w-md w-full bg-white shadow-2xl rounded-3xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-8 text-white text-center">
          <div className="mx-auto h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <Stethoscope size={34} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Physician Portal</h2>
          <p className="text-blue-200 text-sm mt-1">Secure Provider Authentication</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-200 flex items-start gap-2 animate-in fade-in">
              <AlertCircle size={18} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1 tracking-wide">Doctor ID / Email</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-3.5 text-slate-400" />
              <input name="username" type="text" required value={formData.username} onChange={handleChange}
                className="pl-10 block w-full rounded-xl border-slate-200 px-4 py-3 border text-sm focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Email, Employee ID or License" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1 tracking-wide">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3.5 text-slate-400" />
              <input name="password" type={showPassword ? 'text' : 'password'} required
                value={formData.password} onChange={handleChange}
                className="pl-10 pr-10 block w-full rounded-xl border-slate-200 px-4 py-3 border text-sm focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Enter your password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-blue-600 transition">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
              Remember me
            </label>
            <Link to="/forgot-password" className="font-semibold text-blue-600 hover:text-blue-700">Forgot password?</Link>
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 py-3.5 rounded-2xl shadow-lg font-bold text-white bg-gradient-to-r from-blue-800 to-blue-600 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50">
            {isLoading ? 'Authenticating...' : 'Access Physician Dashboard'}
          </button>

          <div className="text-center border-t border-slate-100 pt-5 space-y-3">
            <button type="button" onClick={() => setIsRegistering(true)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition block w-full">
              New physician? Request Access →
            </button>
            <div className="pt-2 border-t border-slate-50 space-y-2">
                <button type="button" onClick={() => navigate('/register?context=professional')}
                  className="w-full flex justify-center items-center gap-2 py-2.5 rounded-xl border border-blue-200 text-[10px] font-black uppercase tracking-[0.1em] text-blue-700 bg-blue-50/50 hover:bg-blue-100 transition shadow-sm">
                  <Building2 size={14} /> Institutional Hospital Onboarding
                </button>
            </div>
            <button type="button" onClick={() => navigate('/login')}
              className="text-xs text-slate-400 hover:text-slate-600 underline">
              Return to Patient Portal
            </button>
          </div>
        </form>
        <LegalFooter className="pb-8" />
      </div>
    </div>
  );
};

export default DoctorLogin;
