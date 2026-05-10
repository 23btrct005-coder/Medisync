import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Stethoscope, Lock, User, Mail, CheckCircle, Eye, EyeOff,
  Phone, GraduationCap, ShieldCheck, Building2, Clock, AlertCircle,
  ArrowLeft, BadgeCheck, HeartPulse, Bot, Activity, MapPin, ClipboardList,
  Mail as MailIcon, Briefcase, Stethoscope as StethoscopeIcon, User as UserIcon,
  Navigation, Eye as EyeIcon, EyeOff as EyeOffIcon, ChevronRight, Lock as LockIcon
} from 'lucide-react';
import api from '../api/axiosConfig';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import DocumentUpload from '../components/DocumentUpload';
import LegalFooter from '../components/LegalFooter';

const HospitalDepartments = [
  "Cardiology", "Neurology", "Pediatrics", "Orthopedics", "Oncology", 
  "Gynecology", "Dermatology", "Urology", "Ophthalmology", "ENT", 
  "Psychiatry", "Emergency Medicine", "Radiology", "General Surgery"
];

// ─── Doctor Registration Form ───────────────────────────────────────────────
const DoctorRegisterForm = ({ onBack }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Identity
    email: '',
    password: '',
    confirmPassword: '',
    // Basic Details
    name: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    // Contact
    phone: '',
    alternatePhone: '',
    // Clinical (Doctor)
    specialization: '',
    college: '',
    additionalCertifications: '',
    medicalDegree: '',
    // Clinical Depth
    subSpecialties: '',
    proceduresHandled: '',
    treatmentFocus: '',
    languagesSpoken: '',
    publications: '',
    // License
    medicalLicenseNumber: '',
    medicalCouncil: '',
    licenseExpiryDate: '',
    registrationYear: '',
    // Work Details
    hospital: '', // ID
    hospitalName: '', // For 'other'
    yearsOfExperience: '',
    onlineConsultationFee: '',
    clinicAddress: '',
    clinicStreet: '',
    clinicCity: '',
    clinicState: '',
    clinicPinCode: '',
    upiId: '',
    // Availability
    workingDays: [],
    startTime: '09:00',
    endTime: '18:00',
    slotDuration: '15',
    maxPatientsPerDay: '30',
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [licenseDocument, setLicenseDocument] = useState(null);
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
  const [geographyData, setGeographyData] = useState({});
  const [availableCities, setAvailableCities] = useState([]);
  const [locating, setLocating] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    
    // Cascaded logic for State -> City/District
    if (name === 'clinicState') {
      if (geographyData[value]) {
        setAvailableCities(geographyData[value]);
        updated.clinicCity = '';
      } else {
        setAvailableCities([]);
      }
    }

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

  const handleDateChange = (type, value) => {
    const dob = formData.dateOfBirth ? formData.dateOfBirth.split('-') : ['', '', ''];
    let year = dob[0];
    let month = dob[1];
    let day = dob[2];

    if (type === 'year') year = value;
    if (type === 'month') month = value;
    if (type === 'day') day = value;

    const newDob = `${year}-${month}-${day}`;
    const updated = { ...formData, dateOfBirth: newDob };

    if (year && month && day) {
        const today = new Date();
        const dobObj = new Date(year, month - 1, day);
        let calculatedAge = today.getFullYear() - dobObj.getFullYear();
        const m = today.getMonth() - dobObj.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dobObj.getDate())) calculatedAge--;
        updated.age = calculatedAge > 0 ? String(calculatedAge) : '';
    }
    setFormData(updated);
  };

  const handleExpiryDateChange = (type, value) => {
    const expiry = formData.licenseExpiryDate ? formData.licenseExpiryDate.split('-') : ['', '', ''];
    let year = expiry[0];
    let month = expiry[1];
    let day = expiry[2];

    if (type === 'year') year = value;
    if (type === 'month') month = value;
    if (type === 'day') day = value;

    const newExpiry = `${year}-${month}-${day}`;
    setFormData({ ...formData, licenseExpiryDate: newExpiry });
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
      
      formDataToSend.append('userData', JSON.stringify({
        ...formData,
        username: formData.email,
        clinicAddress: `${formData.clinicStreet}, ${formData.clinicCity}, ${formData.clinicState} - ${formData.clinicPinCode}`,
        workingDays: formData.workingDays.join(', '),
        consultationTimings: `${formData.startTime} - ${formData.endTime}`,
        role: 'ROLE_DOCTOR'
      }));
      if (profilePicture) {
        formDataToSend.append('profilePicture', profilePicture);
      }
      if (licenseDocument) {
        formDataToSend.append('licenseDocument', licenseDocument);
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

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Clinical GPS is restricted in this non-secure context. Please enter your clinic details manually.');
      return;
    }

    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await response.json();
          const addr = data.address;
          
          const street = [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(', ');
          const city = addr.city || addr.town || addr.village || addr.district || '';
          const state = addr.state || '';
          const pinCode = addr.postcode || '';

          setFormData(prev => ({
            ...prev,
            clinicStreet: street || prev.clinicStreet,
            clinicCity: city || prev.clinicCity,
            clinicState: state || prev.clinicState,
            clinicPinCode: pinCode || prev.clinicPinCode
          }));
          
          if (state && geographyData[state]) {
            setAvailableCities(geographyData[state]);
          }

          setSuccess('Clinical location detected successfully!');
        } catch (err) {
          setError('Failed to fetch clinical address details. Please proceed manually.');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setError('Clinical GPS access denied by browser. Please enter your clinic address manually.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const [hospitals, setHospitals] = useState([]);
  React.useEffect(() => {
    const fetchGeo = async () => {
      try {
        const res = await api.get('auth/geography');
        setGeographyData(res.data);
      } catch (err) {
        console.error('Failed to load geography data');
      }
    };
    fetchGeo();

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

  const inputCls = "block w-full rounded-xl border-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-3.5 border transition-all bg-white placeholder:text-slate-300";
  const labelCls = "block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-[0.15em]";
  const sectionCls = "flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100";

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

            <form onSubmit={handleSubmit} className="space-y-10">

              {/* 1. Email Verification */}
              <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-6">
                <h3 className={sectionCls}><MailIcon size={16} /> 1. Identity Verification</h3>
                <div className="relative">
                  <label className={labelCls}>Professional Email <span className="text-red-500">*</span></label>
                  <div className="flex gap-3">
                    <input type="email" name="email" required disabled={emailVerified}
                      value={formData.email} onChange={handleChange}
                      className={`${inputCls} ${emailVerified ? 'bg-green-50 border-green-300' : ''} flex-1`}
                      placeholder="doctor@hospital.com" />
                    {!emailVerified && (
                      <button type="button" onClick={handleSendOtp} disabled={verifying}
                        className="whitespace-nowrap bg-blue-600 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-100 active:scale-95">
                        {verifying ? '...' : otpSent ? 'Resend' : 'Send Code'}
                      </button>
                    )}
                  </div>
                </div>
                {otpSent && !emailVerified && (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-blue-100 space-y-4 animate-in zoom-in-95">
                    <label className={labelCls}>Verification Code</label>
                    <div className="flex gap-3">
                      <input type="text" maxLength="6" value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="block w-full text-center text-xl font-bold tracking-[0.3em] rounded-xl border-slate-200 px-3 py-3 border focus:ring-primary-500"
                        placeholder="000000" />
                      <button type="button" onClick={handleVerifyOtp} disabled={verifying || otpCode.length < 6}
                        className="bg-blue-600 text-white px-8 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-md">
                        Confirm
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Basic Details */}
              <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h3 className={sectionCls}><UserIcon size={16} /> 2. Basic Clinical Details</h3>
                
                <div className="flex flex-col items-center gap-4 py-4">
                  <ProfilePhotoUpload onFileSelect={setProfilePicture} />
                </div>

                <div className="space-y-6">
                  <div>
                    <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange}
                      className={inputCls} placeholder="Dr. John Smith" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div>
                      <label className={labelCls}>Gender <span className="text-red-500">*</span></label>
                      <select name="gender" required value={formData.gender} onChange={handleChange} className={inputCls}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                        <label className={labelCls}>Date of Birth <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-3 gap-2">
                            <select 
                                className={inputCls}
                                value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[2] : ''}
                                onChange={(e) => handleDateChange('day', e.target.value)}
                                required
                            >
                                <option value="">Day</option>
                                {Array.from({length: 31}, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            <select 
                                className={inputCls}
                                value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[1] : ''}
                                onChange={(e) => handleDateChange('month', e.target.value)}
                                required
                            >
                                <option value="">Month</option>
                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                    <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                                ))}
                            </select>
                            <select 
                                className={inputCls}
                                value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[0] : ''}
                                onChange={(e) => handleDateChange('year', e.target.value)}
                                required
                            >
                                <option value="">Year</option>
                                {Array.from({length: 100}, (_, i) => new Date().getFullYear() - i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Age (Auto-calculated)</label>
                    <input type="text" name="age" disabled value={formData.age ? `${formData.age} Years` : 'From DOB'}
                      className="block w-full rounded-xl border-slate-100 bg-slate-50 sm:text-sm px-4 py-3.5 border text-slate-400 font-medium" />
                  </div>
                </div>
              </div>

              {/* 3. Contact Information */}
              <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                <h3 className={sectionCls}><Phone size={16} /> 3. Contact & Connectivity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div>
                    <label className={labelCls}>Mobile Number <span className="text-red-500">*</span></label>
                    <input type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                      className={inputCls} placeholder="9876543210" />
                  </div>
                  <div>
                    <label className={labelCls}>Alternate Mobile</label>
                    <input type="tel" name="alternatePhone" value={formData.alternatePhone} onChange={handleChange}
                      className={inputCls} placeholder="Optional" />
                  </div>
                </div>
              </div>

              {/* 4. Professional Qualifications */}
              <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <h3 className={sectionCls}><GraduationCap size={16} /> 4. Professional Qualifications</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Specialization <span className="text-red-500">*</span></label>
                      <select name="specialization" required value={formData.specialization} onChange={handleChange} className={inputCls}>
                        <option value="">Select Specialization</option>
                        {HospitalDepartments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
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
              <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                <h3 className={sectionCls}><ShieldCheck size={16} /> 5. License & Verification</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <div>
                          <label className={labelCls}>Medical Council <span className="text-red-500">*</span></label>
                          <input type="text" name="medicalCouncil" required value={formData.medicalCouncil} onChange={handleChange}
                              className={inputCls} placeholder="e.g. Karnataka Medical Council" />
                      </div>
                      <div>
                          <label className={labelCls}>License Expiry Date <span className="text-red-500">*</span></label>
                          <div className="grid grid-cols-3 gap-2">
                              <select 
                                  className={inputCls}
                                  value={formData.licenseExpiryDate ? formData.licenseExpiryDate.split('-')[2] : ''}
                                  onChange={(e) => handleExpiryDateChange('day', e.target.value)}
                                  required
                              >
                                  <option value="">Day</option>
                                  {Array.from({length: 31}, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                                      <option key={d} value={d}>{d}</option>
                                  ))}
                              </select>
                              <select 
                                  className={inputCls}
                                  value={formData.licenseExpiryDate ? formData.licenseExpiryDate.split('-')[1] : ''}
                                  onChange={(e) => handleExpiryDateChange('month', e.target.value)}
                                  required
                              >
                                  <option value="">Month</option>
                                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                      <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                                  ))}
                              </select>
                              <select 
                                  className={inputCls}
                                  value={formData.licenseExpiryDate ? formData.licenseExpiryDate.split('-')[0] : ''}
                                  onChange={(e) => handleExpiryDateChange('year', e.target.value)}
                                  required
                              >
                                  <option value="">Year</option>
                                  {Array.from({length: 20}, (_, i) => new Date().getFullYear() + i).map(y => (
                                      <option key={y} value={y}>{y}</option>
                                  ))}
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className={labelCls}>Registration Year <span className="text-red-500">*</span></label>
                          <input type="number" name="registrationYear" required value={formData.registrationYear} onChange={handleChange}
                              className={inputCls} placeholder="e.g. 2015" />
                      </div>
                      <div>
                          <label className={labelCls}>License Number <span className="text-red-500">*</span></label>
                          <input type="text" name="medicalLicenseNumber" required value={formData.medicalLicenseNumber} onChange={handleChange}
                              className={inputCls} placeholder="e.g. MCI-12345678" />
                      </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-50">
                      <label className={labelCls}>Medical License / Degree Certificate <span className="text-red-500">*</span></label>
                      <DocumentUpload onFileSelect={setLicenseDocument} label="Upload License Certificate" />
                  </div>
                </div>
              </div>

              {/* 6. Clinical Expertise Depth [NEW] */}
              <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[350ms]">
                <h3 className={sectionCls}><Activity size={16} /> 6. Clinical Expertise Depth</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <div>
                          <label className={labelCls}>Sub-Specialties</label>
                          <input type="text" name="subSpecialties" value={formData.subSpecialties} onChange={handleChange}
                              className={inputCls} placeholder="e.g. Diabetes, Hypertension" />
                      </div>
                      <div>
                          <label className={labelCls}>Languages Spoken</label>
                          <input type="text" name="languagesSpoken" value={formData.languagesSpoken} onChange={handleChange}
                              className={inputCls} placeholder="e.g. English, Hindi, Kannada" />
                      </div>
                  </div>
                  <div>
                      <label className={labelCls}>Procedures Handled</label>
                      <textarea name="proceduresHandled" value={formData.proceduresHandled} onChange={handleChange}
                          className={`${inputCls} min-h-[80px]`} placeholder="List clinical procedures you are certified for..." />
                  </div>
                  <div>
                      <label className={labelCls}>Treatment Focus Areas</label>
                      <textarea name="treatmentFocus" value={formData.treatmentFocus} onChange={handleChange}
                          className={`${inputCls} min-h-[80px]`} placeholder="e.g. Preventive Cardiology, Robotic Surgery..." />
                  </div>
                  <div>
                      <label className={labelCls}>Research & Publications</label>
                      <textarea name="publications" value={formData.publications} onChange={handleChange}
                          className={`${inputCls} min-h-[80px]`} placeholder="List your medical research, papers, or publications..." />
                  </div>
                </div>
              </div>

              {/* 7. Work Details */}
              <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <h3 className={sectionCls}><Building2 size={16} /> 7. Work Details</h3>
                    <button type="button" onClick={handleGetCurrentLocation} disabled={locating} 
                        className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 disabled:opacity-50 transition-all">
                        <Navigation size={12} className={locating ? 'animate-pulse' : ''} /> {locating ? 'Locating...' : 'Auto-Locate'}
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="md:col-span-2">
                    <label className={labelCls}>Affiliated Hospital / Clinic <span className="text-red-500">*</span></label>
                    <select name="hospital" required value={formData.hospital} onChange={handleChange} className={inputCls}>
                        <option value="">Select Institution</option>
                        {hospitals.map(h => (
                            <option key={h.id} value={h.id}>{h.name} ({h.location})</option>
                        ))}
                        <option value="other">Other / Not Listed</option>
                    </select>
                    {formData.hospital === 'other' && (
                        <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                            <label className={labelCls}>Clinic / Hospital Name <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                name="hospitalName" 
                                required={formData.hospital === 'other'} 
                                value={formData.hospitalName} 
                                onChange={handleChange} 
                                className={inputCls} 
                                placeholder="e.g. Apollo Clinic, City Hospital" 
                            />
                        </div>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Years of Experience</label>
                    <input type="number" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange}
                      className={inputCls} placeholder="e.g. 10" />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Clinic Location Details</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className={labelCls}>Clinic / Office Address (Street/Area) <span className="text-red-500">*</span></label>
                            <input type="text" name="clinicStreet" required value={formData.clinicStreet} onChange={handleChange}
                                className={inputCls} placeholder="e.g. Room 204, Alpha Plaza, MG Road" />
                        </div>
                        <div>
                            <label className={labelCls}>State <span className="text-red-500">*</span></label>
                            <select name="clinicState" required value={formData.clinicState} onChange={handleChange} className={inputCls}>
                                <option value="">Select State</option>
                                {Object.keys(geographyData).sort().map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>City / District <span className="text-red-500">*</span></label>
                            <select name="clinicCity" required value={formData.clinicCity} onChange={handleChange} className={inputCls} disabled={!formData.clinicState}>
                                <option value="">Select City</option>
                                {availableCities.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>PIN Code <span className="text-red-500">*</span></label>
                            <input type="text" name="clinicPinCode" required value={formData.clinicPinCode} onChange={handleChange}
                                className={inputCls} placeholder="6 Digits" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div>
                    <label className={labelCls}>Consultation Fee (₹)</label>
                    <input type="number" name="onlineConsultationFee" value={formData.onlineConsultationFee} onChange={handleChange}
                      className={inputCls} placeholder="e.g. 500" />
                  </div>
                  <div>
                    <label className={labelCls}>UPI ID (for payments)</label>
                    <input type="text" name="upiId" value={formData.upiId} onChange={handleChange}
                      className={inputCls} placeholder="e.g. doctor@upi" />
                  </div>
                </div>
              </div>

              {/* 8. Availability */}
              <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                <h3 className={sectionCls}><Clock size={16} /> 8. Availability</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div>
                    <label className={labelCls}>Working Days</label>
                    <input type="text" name="workingDaysText" value={formData.workingDays.join(', ')} readOnly
                      className={`${inputCls} bg-slate-50 cursor-default`} placeholder="e.g. Mon-Fri, Mon-Sat" />
                  </div>
                  <div>
                    <label className={labelCls}>Consultation Timings</label>
                    <input type="text" name="timingsText" value={`${formData.startTime} - ${formData.endTime}`} readOnly
                      className={`${inputCls} bg-slate-50 cursor-default`} placeholder="e.g. 9:00 AM - 6:00 PM" />
                  </div>
                  <div className="md:col-span-2">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Adjust Working Schedule</p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const days = formData.workingDays.includes(day)
                                ? formData.workingDays.filter(d => d !== day)
                                : [...formData.workingDays, day];
                              setFormData({ ...formData, workingDays: days });
                            }}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                              formData.workingDays.includes(day)
                                ? 'bg-primary-600 border-primary-600 text-white shadow-lg'
                                : 'bg-white border-slate-100 text-slate-400 hover:border-primary-200'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Consultation Timings</label>
                    <div className="flex items-center gap-3">
                      <select name="startTime" value={formData.startTime} onChange={handleChange} className={inputCls}>
                        {Array.from({length: 24}, (_, i) => String(i).padStart(2, '0')).map(h => (
                          ['00', '30'].map(m => (
                            <option key={`${h}:${m}`} value={`${h}:${m}`}>{`${h}:${m}`}</option>
                          ))
                        ))}
                      </select>
                      <span className="text-slate-300 font-bold">to</span>
                      <select name="endTime" value={formData.endTime} onChange={handleChange} className={inputCls}>
                        {Array.from({length: 24}, (_, i) => String(i).padStart(2, '0')).map(h => (
                          ['00', '30'].map(m => (
                            <option key={`${h}:${m}`} value={`${h}:${m}`}>{`${h}:${m}`}</option>
                          ))
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Slot Duration</label>
                    <select name="slotDuration" value={formData.slotDuration} onChange={handleChange} className={inputCls}>
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="45">45 Minutes</option>
                      <option value="60">60 Minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Max Patients Per Day</label>
                    <input type="number" name="maxPatientsPerDay" value={formData.maxPatientsPerDay} onChange={handleChange}
                      className={inputCls} placeholder="e.g. 30" />
                  </div>
                </div>
              </div>

              {/* 9. Account Security */}
              <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
                <h3 className={sectionCls}><ShieldCheck size={16} /> 9. Account Security</h3>
                <div className="mb-6">
                    <label className={labelCls}>Doctor ID <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.email} disabled className={`${inputCls} bg-blue-50 border-blue-100 text-blue-900 font-bold`} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  <div className="relative">
                    <label className={labelCls}>Secure Password <span className="text-red-500">*</span></label>
                    <input type={showPassword ? 'text' : 'password'} name="password" required
                      value={formData.password} onChange={handleChange} className={inputCls} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-10 text-slate-400 hover:text-blue-600 transition">
                      {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                    </button>
                  </div>
                  <div className="relative">
                    <label className={labelCls}>Confirm Password <span className="text-red-500">*</span></label>
                    <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required
                      value={formData.confirmPassword} onChange={handleChange} className={inputCls} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-10 text-slate-400 hover:text-blue-600 transition">
                      {showConfirmPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Disclaimer Acknowledgement */}
              <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-3xl flex items-start gap-3 shadow-inner">
                <input 
                  type="checkbox" id="doctorAiDisclaimer"
                  checked={aiDisclaimerAccepted} onChange={(e) => setAiDisclaimerAccepted(e.target.checked)}
                  className="mt-1 h-5 w-5 text-blue-600 border-blue-300 rounded-lg focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="doctorAiDisclaimer" className="text-xs text-slate-600 leading-relaxed cursor-pointer font-medium">
                  <span className="flex items-center gap-1 font-black text-blue-700 uppercase tracking-tighter mb-1">
                    <Bot size={14} /> AI Clinical Acknowledgment
                  </span>
                  I acknowledge that Medisync uses AI (OpenAI/Groq/MONAI) for clinical data processing. I have read the <Link to="/ai-disclaimer" className="text-blue-600 font-bold hover:underline">AI Disclaimer</Link> and agree to verify all AI-generated insights before making clinical decisions.
                </label>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading || !emailVerified || !aiDisclaimerAccepted}
                className={`w-full flex justify-center items-center gap-2 py-5 rounded-2xl shadow-xl text-xs font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 transition-all ${loading || !emailVerified || !aiDisclaimerAccepted ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01] shadow-blue-200'}`}>
                {loading ? 'Finalizing Sync...' : !emailVerified ? 'Verify Email to Proceed' : !aiDisclaimerAccepted ? 'Accept AI Disclaimer' : 'Complete Physician Enrollment'}
              </button>
              
              <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                Secure Clinical Enrollment Portal
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
        if (result.pendingApproval) {
          navigate('/pending-approval');
        } else {
          setError(result.message || 'Login failed. Please try again.');
        }
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
                placeholder="email id / profile id" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1 tracking-wide">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3.5 text-slate-400" />
              <input name="password" type={showPassword ? 'text' : 'password'} required
                value={formData.password} onChange={handleChange}
                className="pl-10 pr-10 block w-full rounded-xl border-slate-200 px-4 py-3 border text-sm focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="password" />
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
