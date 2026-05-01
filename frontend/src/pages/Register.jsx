import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, UserPlus, Building2, Mail, Lock, User, Phone, MapPin, 
  Camera, AlertCircle, CheckCircle, GraduationCap, Briefcase, Stethoscope,
  ShieldCheck, Heart, Eye, EyeOff, Navigation, ChevronRight, Activity 
} from 'lucide-react';
import api from '../api/axiosConfig';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import LegalFooter from '../components/LegalFooter';

const HospitalDepartments = [
  "Cardiology", "Neurology", "Pediatrics", "Orthopedics", "Oncology", 
  "Gynecology", "Dermatology", "Urology", "Ophthalmology", "ENT", 
  "Psychiatry", "Emergency Medicine", "Radiology", "General Surgery"
];

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
    // Doctor Specific
    specialization: '',
    medicalDegree: '',
    medicalLicenseNumber: '',
    yearsOfExperience: '',
    college: '',
    hospital: '', // Selected hospital ID
    consultationFee: '',
    // Legal & Compliance
    gstNumber: '',
    panNumber: '',
    nabhId: '',
    isoId: '',
    // Infrastructure
    totalBeds: '',
    icuBeds: '',
    operationTheatersCount: '',
    ambulanceCount: '',
    departments: [], // Array for multi-select
    emergencyServicesAvailable: true,
    // Appointment & Billing
    consultationTimings: '9:00 AM - 9:00 PM',
    walkInAllowed: true,
    avgWaitingTime: '15',
    consultationFees: '', // JSON mapping or simple string
    insuranceProviders: '',
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
  const [registrationCertificate, setRegistrationCertificate] = useState(null);

  // Verification states
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [aiDisclaimerAccepted, setAiDisclaimerAccepted] = useState(false);
  const [locating, setLocating] = useState(false);

  const [geographyData, setGeographyData] = useState({});
  const [availableCities, setAvailableCities] = useState([]);

  const [hospitals, setHospitals] = useState([]);
  const [fetchingHospitals, setFetchingHospitals] = useState(false);

  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const res = await api.get('auth/geography');
        setGeographyData(res.data);
      } catch (err) {
        console.error('Failed to load geography data');
      }
    };

    const fetchHospitals = async () => {
        setFetchingHospitals(true);
        try {
            const res = await api.get('auth/hospitals');
            setHospitals(res.data);
        } catch (err) {
            console.error('Failed to load hospitals');
        } finally {
            setFetchingHospitals(false);
        }
    };

    fetchGeo();
    fetchHospitals();
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

  const handleDepartmentToggle = (dept) => {
    setFormData(prev => {
      const depts = prev.departments.includes(dept)
        ? prev.departments.filter(d => d !== dept)
        : [...prev.departments, dept];
      return { ...prev, departments: depts };
    });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          const address = data.address;

          // Attempt to match state
          let detectedState = address.state || '';
          // Simple normalization: if "Telangana" comes as "Telangana", it matches. 
          // If Nominatim returns "State of Telangana", we might need more logic, but Nominatim usually returns the name.
          
          const detectedCity = address.city || address.town || address.village || address.district || '';
          const detectedPin = address.postcode || '';
          const detectedStreet = data.display_name || '';

          const updated = {
            ...formData,
            state: detectedState,
            city: detectedCity,
            pinCode: detectedPin,
            street: detectedStreet,
          };

          if (detectedState && geographyData[detectedState]) {
            setAvailableCities(geographyData[detectedState]);
          }

          setFormData(updated);
          setSuccess("Location detected successfully!");
          setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
          setError("Failed to fetch address details");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setError("Unable to retrieve your location. Please ensure location access is granted.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
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
        'ROLE_HOSPITAL_ADMIN': 'auth/register/hospital-admin',
        'ROLE_DOCTOR': 'auth/register/doctor'
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

      if (registrationCertificate && role === 'ROLE_HOSPITAL_ADMIN') {
        formDataToSend.append('registrationCertificate', registrationCertificate);
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

  const inputClass = "block w-full rounded-xl border-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-3.5 border transition-all bg-white placeholder:text-slate-300";
  const labelClass = "block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-[0.15em]";
  const sectionHeadClass = "flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100";

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
                <div className="flex bg-white/10 p-1 rounded-2xl backdrop-blur-md">
                    {context === 'patient' ? (
                        <button 
                            className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white text-primary-600 shadow-lg"
                        >
                            Patient
                        </button>
                    ) : (
                        <div className="flex gap-1">
                            <button 
                                type="button"
                                onClick={() => setRole('ROLE_DOCTOR')}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === 'ROLE_DOCTOR' ? 'bg-white text-primary-600 shadow-lg' : 'text-white hover:bg-white/10'}`}
                            >
                                Physician
                            </button>
                            <button 
                                type="button"
                                onClick={() => setRole('ROLE_HOSPITAL_ADMIN')}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === 'ROLE_HOSPITAL_ADMIN' ? 'bg-white text-primary-600 shadow-lg' : 'text-white hover:bg-white/10'}`}
                            >
                                Institutional
                            </button>
                        </div>
                    )}
                </div>
            </div>
          </div>

          <div className="p-8 space-y-10">
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-medium border border-red-100 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={18} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-sm font-medium border border-green-100 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                <CheckCircle size={18} className="shrink-0 mt-0.5" /> {success}
              </div>
            )}

            <form className="space-y-10" onSubmit={handleRegister}>
              {/* Step 1: Identity (Universal) */}
              <div className="space-y-6">
                  <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                    <Mail size={16} /> 1. Identity Verification
                  </h3>
                  <div className="relative">
                    <label className={labelClass}>
                      {role === 'ROLE_HOSPITAL_ADMIN' ? 'Institutional Email' : 'Professional Email'} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                      <input type="email" name="email" required disabled={emailVerified}
                        value={formData.email} onChange={handleChange}
                        className={`${inputClass} ${emailVerified ? 'bg-green-50 border-green-300' : ''} flex-1`}
                        placeholder={role === 'ROLE_DOCTOR' ? "doctor@hospital.com" : "admin@hospital.com"} />
                      {!emailVerified && (
                        <button type="button" onClick={handleSendOtp} disabled={verifying}
                          className="whitespace-nowrap bg-blue-600 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-100 active:scale-95">
                          {verifying ? '...' : otpSent ? 'Resend' : 'Send Code'}
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

                  {/* Continue button removed */}
                </div>

              {/* Step 2: Basic Details (Doctor Only) */}
              {role === 'ROLE_DOCTOR' && (
                <div className="space-y-8 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                    <User size={16} /> 2. Basic Details
                  </h3>
                  
                  <div className="flex flex-col items-center gap-4 py-4">
                    <ProfilePhotoUpload onFileSelect={setProfilePicture} />
                    <div className="text-center">
                        <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.15em]">Upload Profile Photo</p>
                        <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-wider">JPG, PNG or WEBP · Max 2MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                        <input type="text" name="name" required value={formData.name} onChange={handleChange}
                          className={inputClass} placeholder="Dr. John Smith" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Professional Credentials (Doctor Only) */}
              {role === 'ROLE_DOCTOR' && (
                <div className="space-y-8 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                  <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                    <Stethoscope size={16} /> 3. Professional Credentials
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className={labelClass}>Medical Specialization <span className="text-red-500">*</span></label>
                        <input type="text" name="specialization" required value={formData.specialization} onChange={handleChange}
                          className={inputClass} placeholder="e.g. Cardiologist" />
                    </div>
                    <div>
                        <label className={labelClass}>Medical Degree <span className="text-red-500">*</span></label>
                        <input type="text" name="medicalDegree" required value={formData.medicalDegree} onChange={handleChange}
                          className={inputClass} placeholder="e.g. MBBS, MD" />
                    </div>
                    <div>
                        <label className={labelClass}>Medical License Number <span className="text-red-500">*</span></label>
                        <input type="text" name="medicalLicenseNumber" required value={formData.medicalLicenseNumber} onChange={handleChange}
                          className={inputClass} placeholder="REG-XXXXXXXX" />
                    </div>
                    <div>
                        <label className={labelClass}>Years of Experience <span className="text-red-500">*</span></label>
                        <input type="number" name="yearsOfExperience" required value={formData.yearsOfExperience} onChange={handleChange}
                          className={inputClass} placeholder="e.g. 10" />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Medical College / University</label>
                        <input type="text" name="college" value={formData.college} onChange={handleChange}
                          className={inputClass} placeholder="e.g. AIIMS, Delhi" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Clinical Affiliation (Doctor Only) */}
              {role === 'ROLE_DOCTOR' && (
                <div className="space-y-8 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                  <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                    <Briefcase size={16} /> 4. Clinical Affiliation
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                        <label className={labelClass}>Primary Hospital / Clinic <span className="text-red-500">*</span></label>
                        <select name="hospital" required value={formData.hospital} onChange={handleChange} className={inputClass}>
                            <option value="">Select Facility</option>
                            {hospitals.map(h => (
                                <option key={h.id} value={h.id}>{h.name} ({h.location})</option>
                            ))}
                            <option value="other">Other / Not Listed</option>
                        </select>
                        {fetchingHospitals && <p className="text-[10px] text-primary-600 mt-1 animate-pulse italic">Synchronizing facility database...</p>}
                    </div>

                    {formData.hospital === 'other' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className={labelClass}>Facility Name <span className="text-red-500">*</span></label>
                            <input type="text" name="hospitalName" required value={formData.hospitalName} onChange={handleChange}
                              className={inputClass} placeholder="Enter your clinic/hospital name" />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>Standard Consultation Fee (INR)</label>
                            <input type="number" name="consultationFee" value={formData.consultationFee} onChange={handleChange}
                              className={inputClass} placeholder="e.g. 500" />
                        </div>
                        <div>
                            <label className={labelClass}>Consultation Timings</label>
                            <input type="text" name="consultationTimings" value={formData.consultationTimings} onChange={handleChange}
                              className={inputClass} placeholder="e.g. 10 AM - 4 PM" />
                        </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Institution & Legal (Hospital Only) */}
              {role === 'ROLE_HOSPITAL_ADMIN' && (
                <div className="space-y-8 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                    <Building2 size={16} /> 2. Institutional & Legal
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Logo & Cert */}
                    <div className="flex flex-col items-center gap-6 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                       <div className="text-center">
                          <p className={labelClass}>Hospital Logo</p>
                          <ProfilePhotoUpload onFileSelect={setHospitalLogo} />
                       </div>
                       <div className="w-full h-[1px] bg-slate-100" />
                       <div className="text-center w-full">
                          <p className={labelClass}>Registration Certificate (PDF/JPG)</p>
                          <input 
                            type="file" 
                            accept=".pdf,.jpg,.png"
                            onChange={(e) => setRegistrationCertificate(e.target.files[0])}
                            className="text-[10px] block w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                          />
                       </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Hospital Name <span className="text-red-500">*</span></label>
                        <input type="text" name="hospitalName" required value={formData.hospitalName} onChange={handleChange}
                          className={inputClass} placeholder="Narayana Health City" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Type <span className="text-red-500">*</span></label>
                          <select name="hospitalType" required value={formData.hospitalType} onChange={handleChange} className={inputClass}>
                            <option value="">Select</option>
                            <option value="Private">Private</option>
                            <option value="Government">Govt</option>
                            <option value="NGO">NGO</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>License <span className="text-red-500">*</span></label>
                          <input type="text" name="licenseCode" required value={formData.licenseCode} onChange={handleChange}
                            className={inputClass} placeholder="HL-XX-XX" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <label className={labelClass}>GST Number</label>
                      <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className={inputClass} placeholder="GSTIN" />
                    </div>
                    <div>
                      <label className={labelClass}>PAN Number</label>
                      <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className={inputClass} placeholder="PAN" />
                    </div>
                    <div>
                      <label className={labelClass}>NABH ID</label>
                      <input type="text" name="nabhId" value={formData.nabhId} onChange={handleChange} className={inputClass} placeholder="NABH-01" />
                    </div>
                    <div>
                      <label className={labelClass}>ISO ID</label>
                      <input type="text" name="isoId" value={formData.isoId} onChange={handleChange} className={inputClass} placeholder="ISO-01" />
                    </div>
                  </div>

                  {/* Buttons removed */}
                </div>
              )}

              {/* Step 3: Infrastructure & Services (Hospital Only) */}
              {role === 'ROLE_HOSPITAL_ADMIN' && (
                <div className="space-y-8 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                  <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                    <Activity size={16} /> 3. Medical Infrastructure
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                      <label className={labelClass}>Total Beds</label>
                      <input type="number" name="totalBeds" value={formData.totalBeds} onChange={handleChange} className="w-full bg-transparent border-none outline-none font-bold text-lg" placeholder="0" />
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                      <label className={labelClass}>ICU Beds</label>
                      <input type="number" name="icuBeds" value={formData.icuBeds} onChange={handleChange} className="w-full bg-transparent border-none outline-none font-bold text-lg" placeholder="0" />
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                      <label className={labelClass}>OT Count</label>
                      <input type="number" name="operationTheatersCount" value={formData.operationTheatersCount} onChange={handleChange} className="w-full bg-transparent border-none outline-none font-bold text-lg" placeholder="0" />
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                      <label className={labelClass}>Ambulances</label>
                      <input type="number" name="ambulanceCount" value={formData.ambulanceCount} onChange={handleChange} className="w-full bg-transparent border-none outline-none font-bold text-lg" placeholder="0" />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Clinical Departments <span className="text-slate-400 font-medium">(Select all that apply)</span></label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {HospitalDepartments.map(dept => (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => handleDepartmentToggle(dept)}
                          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                            formData.departments.includes(dept)
                              ? 'bg-primary border-primary text-white shadow-lg'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-primary'
                          }`}
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                     <div>
                        <label className={labelClass}>Consultation Timings</label>
                        <input type="text" name="consultationTimings" value={formData.consultationTimings} onChange={handleChange} className={inputClass} placeholder="9 AM - 9 PM" />
                     </div>
                     <div>
                        <label className={labelClass}>Average Waiting Time (Mins)</label>
                        <input type="number" name="avgWaitingTime" value={formData.avgWaitingTime} onChange={handleChange} className={inputClass} />
                     </div>
                  </div>

                  {/* Buttons removed */}
                </div>
              )}

              {/* Step 4: Finalize & Security (Hospital Only) / Step 2 (Patient) */}
              <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 mt-8">
                  
                  {/* Leadership & Location (Professional Only) */}
                  {(role === 'ROLE_HOSPITAL_ADMIN' || role === 'ROLE_DOCTOR') && (
                    <div className="space-y-8 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                      <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                        <MapPin size={16} /> 5. Location Details
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {role === 'ROLE_DOCTOR' && (
                            <div>
                                <label className={labelClass}>Gender <span className="text-red-500">*</span></label>
                                <select name="gender" required value={formData.gender} onChange={handleChange} className={inputClass}>
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        )}
                        {role === 'ROLE_HOSPITAL_ADMIN' && (
                            <div>
                                <label className={labelClass}>Position</label>
                                <select name="position" value={formData.position} onChange={handleChange} className={inputClass}>
                                    <option value="Chief Administrator">Chief Administrator</option>
                                    <option value="CEO">CEO</option>
                                    <option value="Director">Director</option>
                                </select>
                            </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                         <div className="flex justify-between items-center mb-4">
                            <p className={labelClass}>Facility Address</p>
                            <button type="button" onClick={handleGetCurrentLocation} className="text-[10px] font-black text-primary uppercase flex items-center gap-2">
                               <Navigation size={12} className={locating ? 'animate-pulse' : ''} /> {locating ? 'Locating...' : 'Auto-Locate'}
                            </button>
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <input type="text" name="state" required value={formData.state} onChange={handleChange} className={inputClass} placeholder="State" />
                            <input type="text" name="city" required value={formData.city} onChange={handleChange} className={inputClass} placeholder="City" />
                            <input type="text" name="pinCode" required value={formData.pinCode} onChange={handleChange} className={inputClass} placeholder="PIN" />
                            <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className={inputClass} placeholder="Phone" />
                         </div>
                      </div>
                    </div>
                  )}

                  {/* Account Security (Universal) */}
                  <div className="space-y-8 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                    <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                      <Lock size={16} /> 6. Account Security
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="relative">
                        <label className={labelClass}>Secure Password <span className="text-red-500">*</span></label>
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

                  <div className="pt-2">
                    <button type="submit" disabled={loading}
                      className={`w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl shadow-xl text-md font-extrabold text-white bg-primary-600 hover:bg-primary-700 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}`}>
                      {loading ? 'Finalizing Sync...' : (role === 'ROLE_HOSPITAL_ADMIN' ? 'Complete Institutional Onboarding' : 'Complete Professional Registration')}
                    </button>
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
