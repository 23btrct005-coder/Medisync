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
    // Detailed Patient Profile
    nationalId: '',
    maritalStatus: '',
    bloodGroup: '',
    height: '',
    weight: '',
    hasDisability: 'false',
    emergencyContactName: '',
    emergencyContactPhone: '',
    allergies: '',
    existingDiseases: '',
    smokingStatus: '',
    alcoholStatus: '',
    organDonorStatus: 'Undecided',
    // Clinical (Doctor)
    specialization: '',
    college: '',
    additionalCertifications: '',
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
    consultationFee: '', // Combined/Legacy
    onlineConsultationFee: '',
    offlineConsultationFee: '',
    clinicAddress: '',
    upiId: '',
    // Availability
    workingDays: [],
    startTime: '09:00',
    endTime: '18:00',
    consultationTimings: '',
    slotDuration: '15',
    maxPatientsPerDay: '30',
    // Institutional (Shared/Legacy)
    licenseCode: '',
    hospitalType: '',
    website: '',
    position: 'Chief Administrator',
    gstNumber: '',
    panNumber: '',
    nabhId: '',
    isoId: '',
    totalBeds: '',
    icuBeds: '',
    operationTheatersCount: '',
    ambulanceCount: '',
    departments: [],
    street: '',
    city: '',
    state: '',
    pinCode: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [hospitalLogo, setHospitalLogo] = useState(null);
  const [registrationCertificate, setRegistrationCertificate] = useState(null);
  const [licenseDocument, setLicenseDocument] = useState(null);

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

    if (year && month && day && (role === 'ROLE_PATIENT' || role === 'ROLE_DOCTOR')) {
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
        workingDays: formData.workingDays.join(', '),
        consultationTimings: `${formData.startTime} - ${formData.endTime}`,
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

      if (licenseDocument && role === 'ROLE_DOCTOR') {
        formDataToSend.append('licenseDocument', licenseDocument);
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
              {/* Step 1: Identity Verification */}
              <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-6">
                  <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                    <Mail size={16} /> 1. Identity Verification
                  </h3>
                  <div className="relative">
                    <label className={labelClass}>Professional Email <span className="text-red-500">*</span></label>
                    <div className="flex gap-3">
                      <input type="email" name="email" required disabled={emailVerified}
                        value={formData.email} onChange={handleChange}
                        className={`${inputClass} ${emailVerified ? 'bg-green-50 border-green-300' : ''} flex-1`}
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
                      <label className={labelClass}>Verification Code</label>
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

              {/* Step 2: Basic Details (Doctor & Patient) */}
              {(role === 'ROLE_DOCTOR' || role === 'ROLE_PATIENT') && (
                <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                    <User size={16} /> 2. Basic Clinical Details
                  </h3>
                  
                  <div className="flex flex-col items-center gap-4 py-4">
                    <ProfilePhotoUpload onFileSelect={setProfilePicture} />
                  </div>

                  <div className="space-y-6">
                    <div>
                        <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                        <input type="text" name="name" required value={formData.name} onChange={handleChange}
                          className={inputClass} placeholder="Dr. John Smith" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <label className={labelClass}>Date of Birth <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-3 gap-2">
                                <select 
                                    className={inputClass}
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
                                    className={inputClass}
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
                                    className={inputClass}
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
                        <label className={labelClass}>Age (Auto-calculated)</label>
                        <input type="text" name="age" disabled value={formData.age ? `${formData.age} Years` : 'From DOB'}
                          className="block w-full rounded-xl border-slate-100 bg-slate-50 sm:text-sm px-4 py-3.5 border text-slate-400 font-medium" />
                    </div>
                    {role === 'ROLE_PATIENT' && (
                        <>
                            <div>
                                <label className={labelClass}>National ID Number <span className="text-red-500">*</span></label>
                                <input type="text" name="nationalId" required value={formData.nationalId} onChange={handleChange}
                                className={inputClass} placeholder="UIDAI / Passport / Voter ID" />
                            </div>
                            <div>
                                <label className={labelClass}>Marital Status</label>
                                <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className={inputClass}>
                                    <option value="">Select Status</option>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Divorced">Divorced</option>
                                    <option value="Widowed">Widowed</option>
                                </select>
                            </div>
                        </>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Contact Information (Doctor & Patient) */}
              {(role === 'ROLE_DOCTOR' || role === 'ROLE_PATIENT') && (
                <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                  <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                    <Phone size={16} /> 3. Contact & Connectivity
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Mobile Number <span className="text-red-500">*</span></label>
                        <input type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                          className={inputClass} placeholder="9876543210" />
                    </div>
                    <div>
                        <label className={labelClass}>Alternate Mobile</label>
                        <input type="tel" name="alternatePhone" value={formData.alternatePhone} onChange={handleChange}
                          className={inputClass} placeholder="Optional" />
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Detailed Profile Sections (Step 4-6) */}
              {role === 'ROLE_PATIENT' && (
                <div className="space-y-12">
                   {/* Medical Metrics */}
                   <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                      <Activity size={16} /> 4. Medical Metrics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <label className={labelClass}>Blood Group</label>
                            <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className={inputClass}>
                                <option value="">Select</option>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Height (cm)</label>
                            <input type="number" name="height" value={formData.height} onChange={handleChange} className={inputClass} placeholder="175" />
                        </div>
                        <div>
                            <label className={labelClass}>Weight (kg)</label>
                            <input type="number" name="weight" value={formData.weight} onChange={handleChange} className={inputClass} placeholder="70" />
                        </div>
                        <div>
                            <label className={labelClass}>Disability</label>
                            <select name="hasDisability" value={formData.hasDisability} onChange={handleChange} className={inputClass}>
                                <option value="false">None</option>
                                <option value="true">Yes</option>
                            </select>
                        </div>
                    </div>
                  </div>

                  {/* Residency & Emergency */}
                  <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                      <MapPin size={16} /> 5. Residency & Emergency
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Full Residential Address</label>
                            <input type="text" name="street" value={formData.street} onChange={handleChange} className={inputClass} placeholder="Street, Building, Area" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass} placeholder="City" />
                            <input type="text" name="pinCode" value={formData.pinCode} onChange={handleChange} className={inputClass} placeholder="PIN" />
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Emergency Contact</p>
                           <div className="space-y-3">
                               <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className={inputClass} placeholder="Contact Name" />
                               <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} className={inputClass} placeholder="Contact Phone" />
                           </div>
                        </div>
                    </div>
                  </div>

                  {/* Clinical History */}
                  <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                      <ClipboardList size={16} /> 6. Clinical History
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Known Allergies</label>
                            <textarea name="allergies" value={formData.allergies} onChange={handleChange} className={`${inputClass} h-20 resize-none`} placeholder="e.g. Penicillin, Peanuts" />
                        </div>
                        <div>
                            <label className={labelClass}>Chronic Diseases</label>
                            <textarea name="existingDiseases" value={formData.existingDiseases} onChange={handleChange} className={`${inputClass} h-20 resize-none`} placeholder="e.g. Diabetes, Hypertension" />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Lifestyle & Habits</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <select name="smokingStatus" value={formData.smokingStatus} onChange={handleChange} className={inputClass}>
                                    <option value="">Smoking</option>
                                    <option value="Non-Smoker">Non-Smoker</option>
                                    <option value="Regular">Regular</option>
                                </select>
                                <select name="alcoholStatus" value={formData.alcoholStatus} onChange={handleChange} className={inputClass}>
                                    <option value="">Alcohol</option>
                                    <option value="None">None</option>
                                    <option value="Social">Social</option>
                                </select>
                                <select name="organDonorStatus" value={formData.organDonorStatus} onChange={handleChange} className={inputClass}>
                                    <option value="Undecided">Organ Donor</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Professional Qualifications (Doctor Only) */}
              {role === 'ROLE_DOCTOR' && (
                <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                  <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                    <GraduationCap size={16} /> 4. Professional Qualifications
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Medical Degree <span className="text-red-500">*</span></label>
                            <select name="medicalDegree" required value={formData.medicalDegree} onChange={handleChange} className={inputClass}>
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
                            <label className={labelClass}>Specialization <span className="text-red-500">*</span></label>
                            <select name="specialization" required value={formData.specialization} onChange={handleChange} className={inputClass}>
                                <option value="">Select Specialization</option>
                                {HospitalDepartments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>College / University</label>
                        <input type="text" name="college" value={formData.college} onChange={handleChange}
                          className={inputClass} placeholder="e.g. AIIMS, New Delhi" />
                    </div>
                    <div>
                        <label className={labelClass}>Additional Certifications</label>
                        <input type="text" name="additionalCertifications" value={formData.additionalCertifications} onChange={handleChange}
                          className={inputClass} placeholder="e.g. FRCS, Fellowship in Cardiology" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: License & Verification (Doctor Only) */}
              {role === 'ROLE_DOCTOR' && (
                <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                  <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                    <ShieldCheck size={16} /> 5. License & Verification
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Medical Council <span className="text-red-500">*</span></label>
                            <input type="text" name="medicalCouncil" required value={formData.medicalCouncil} onChange={handleChange}
                                className={inputClass} placeholder="e.g. Karnataka Medical Council" />
                        </div>
                        <div>
                            <label className={labelClass}>License Expiry Date <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-3 gap-2">
                                <select 
                                    className={inputClass}
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
                                    className={inputClass}
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
                                    className={inputClass}
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
                            <label className={labelClass}>Registration Year <span className="text-red-500">*</span></label>
                            <input type="number" name="registrationYear" required value={formData.registrationYear} onChange={handleChange}
                                className={inputClass} placeholder="e.g. 2015" />
                        </div>
                        <div>
                            <label className={labelClass}>License Number <span className="text-red-500">*</span></label>
                            <input type="text" name="medicalLicenseNumber" required value={formData.medicalLicenseNumber} onChange={handleChange}
                                className={inputClass} placeholder="e.g. MCI-12345678" />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>License Document (PDF/JPG) <span className="text-red-500">*</span></label>
                        <input 
                            type="file" required
                            onChange={(e) => setLicenseDocument(e.target.files[0])}
                            className="text-[10px] block w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                            accept=".pdf,image/*"
                        />
                        <p className="text-[9px] text-slate-400 mt-2 ml-1 font-medium italic">Upload a clear scan of your medical license for institutional verification.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Clinical Expertise Depth (Doctor Only) [NEW] */}
              {role === 'ROLE_DOCTOR' && (
                <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[350ms]">
                  <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                    <Activity size={16} /> 6. Clinical Expertise Depth
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Sub-Specialties</label>
                            <input type="text" name="subSpecialties" value={formData.subSpecialties} onChange={handleChange}
                                className={inputClass} placeholder="e.g. Diabetes, Hypertension" />
                        </div>
                        <div>
                            <label className={labelClass}>Languages Spoken</label>
                            <input type="text" name="languagesSpoken" value={formData.languagesSpoken} onChange={handleChange}
                                className={inputClass} placeholder="e.g. English, Hindi, Kannada" />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Procedures Handled</label>
                        <textarea name="proceduresHandled" value={formData.proceduresHandled} onChange={handleChange}
                            className={`${inputClass} min-h-[80px]`} placeholder="List clinical procedures you are certified for..." />
                    </div>
                    <div>
                        <label className={labelClass}>Treatment Focus Areas</label>
                        <textarea name="treatmentFocus" value={formData.treatmentFocus} onChange={handleChange}
                            className={`${inputClass} min-h-[80px]`} placeholder="e.g. Preventive Cardiology, Robotic Surgery..." />
                    </div>
                    <div>
                        <label className={labelClass}>Research & Publications</label>
                        <textarea name="publications" value={formData.publications} onChange={handleChange}
                            className={`${inputClass} min-h-[80px]`} placeholder="List your medical research, papers, or publications..." />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 7: Work Details (Doctor Only) */}
              {role === 'ROLE_DOCTOR' && (
                <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
                  <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                    <Building2 size={16} /> 6. Work Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className={labelClass}>Affiliated Hospital / Clinic <span className="text-red-500">*</span></label>
                        <select name="hospital" required value={formData.hospital} onChange={handleChange} className={inputClass}>
                            <option value="">Select Institution</option>
                            {hospitals.map(h => (
                                <option key={h.id} value={h.id}>{h.name} ({h.location})</option>
                            ))}
                            <option value="other">Other / Not Listed</option>
                        </select>
                        {formData.hospital === 'other' && (
                            <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                <label className={labelClass}>Clinic / Hospital Name <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    name="hospitalName" 
                                    required={formData.hospital === 'other'} 
                                    value={formData.hospitalName} 
                                    onChange={handleChange} 
                                    className={inputClass} 
                                    placeholder="e.g. Apollo Clinic, City Hospital" 
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className={labelClass}>Years of Experience</label>
                        <input type="number" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange}
                          className={inputClass} placeholder="e.g. 10" />
                    </div>
                  </div>
                  <div>
                        <label className={labelClass}>Clinic / Office Address (For Offline)</label>
                        <input type="text" name="clinicAddress" value={formData.clinicAddress} onChange={handleChange}
                          className={inputClass} placeholder="e.g. Room 204, Alpha Plaza, MG Road" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Consultation Fee (₹)</label>
                        <input type="number" name="onlineConsultationFee" value={formData.onlineConsultationFee} onChange={handleChange}
                          className={inputClass} placeholder="e.g. 500" />
                    </div>
                    <div>
                        <label className={labelClass}>UPI ID (for payments)</label>
                        <input type="text" name="upiId" value={formData.upiId} onChange={handleChange}
                          className={inputClass} placeholder="e.g. doctor@upi" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 8: Availability (Doctor Only) */}
              {role === 'ROLE_DOCTOR' && (
                <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                  <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                    <Activity size={16} /> 7. Availability
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Working Days</label>
                        <input type="text" name="workingDaysText" value={formData.workingDays.join(', ')} readOnly
                          className={`${inputClass} bg-slate-50 cursor-default`} placeholder="e.g. Mon-Fri, Mon-Sat" />
                    </div>
                    <div>
                        <label className={labelClass}>Consultation Timings</label>
                        <input type="text" name="timingsText" value={`${formData.startTime} - ${formData.endTime}`} readOnly
                          className={`${inputClass} bg-slate-50 cursor-default`} placeholder="e.g. 9:00 AM - 6:00 PM" />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Online Consultation</label>
                        <select name="onlineConsultation" className={inputClass} value={formData.onlineConsultationFee > 0 ? 'Available' : 'Not Available'} onChange={(e) => {
                            if(e.target.value === 'Not Available') setFormData({...formData, onlineConsultationFee: ''});
                        }}>
                            <option value="Available">Available</option>
                            <option value="Not Available">Not Available</option>
                        </select>
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
                    <div>
                        <label className={labelClass}>Consultation Timings</label>
                        <div className="flex items-center gap-3">
                            <select 
                                name="startTime" 
                                value={formData.startTime} 
                                onChange={handleChange} 
                                className={inputClass}
                            >
                                {Array.from({length: 24}, (_, i) => String(i).padStart(2, '0')).map(h => (
                                    ['00', '30'].map(m => (
                                        <option key={`${h}:${m}`} value={`${h}:${m}`}>{`${h}:${m}`}</option>
                                    ))
                                ))}
                            </select>
                            <span className="text-slate-300 font-bold">to</span>
                            <select 
                                name="endTime" 
                                value={formData.endTime} 
                                onChange={handleChange} 
                                className={inputClass}
                            >
                                {Array.from({length: 24}, (_, i) => String(i).padStart(2, '0')).map(h => (
                                    ['00', '30'].map(m => (
                                        <option key={`${h}:${m}`} value={`${h}:${m}`}>{`${h}:${m}`}</option>
                                    ))
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Slot Duration (Minutes)</label>
                        <select name="slotDuration" value={formData.slotDuration} onChange={handleChange} className={inputClass}>
                            <option value="15">15 Minutes</option>
                            <option value="30">30 Minutes</option>
                            <option value="45">45 Minutes</option>
                            <option value="60">60 Minutes</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Max Patients Per Day</label>
                        <input type="number" name="maxPatientsPerDay" value={formData.maxPatientsPerDay} onChange={handleChange}
                          className={inputClass} placeholder="e.g. 30" />
                    </div>
                  </div>
                </div>
              </div>
            )}

              {/* Institutional Registration Path (Legacy Support) */}
              {role === 'ROLE_HOSPITAL_ADMIN' && (
                <div className="space-y-12">
                  <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                      <Building2 size={16} /> 2. Institutional & Legal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                           <div className="text-center">
                              <ProfilePhotoUpload onFileSelect={setHospitalLogo} />
                           </div>
                           <div className="text-center w-full">
                              <p className={labelClass}>Registration Certificate</p>
                              <input 
                                type="file" 
                                onChange={(e) => setRegistrationCertificate(e.target.files[0])}
                                className="text-[10px] block w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                              />
                           </div>
                        </div>
                        <div className="space-y-4">
                           <input type="text" name="hospitalName" required value={formData.hospitalName} onChange={handleChange} className={inputClass} placeholder="Institution Name" />
                           <div className="grid grid-cols-2 gap-3">
                              <select name="hospitalType" required value={formData.hospitalType} onChange={handleChange} className={inputClass}>
                                 <option value="">Type</option>
                                 <option value="Private">Private</option>
                                 <option value="Government">Govt</option>
                              </select>
                              <input type="text" name="licenseCode" required value={formData.licenseCode} onChange={handleChange} className={inputClass} placeholder="License Code" />
                           </div>
                        </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-75">
                    <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                      <ShieldCheck size={16} /> 3. Legal & Financial Compliance
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>GST Number</label>
                            <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className={inputClass} placeholder="e.g. 22AAAAA0000A1Z5" />
                        </div>
                        <div>
                            <label className={labelCls}>PAN Number</label>
                            <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className={inputClass} placeholder="e.g. ABCDE1234F" />
                        </div>
                        <div>
                            <label className={labelCls}>NABH ID (Optional)</label>
                            <input type="text" name="nabhId" value={formData.nabhId} onChange={handleChange} className={inputClass} placeholder="NABH Registration" />
                        </div>
                        <div>
                            <label className={labelCls}>ISO Certification</label>
                            <input type="text" name="isoId" value={formData.isoId} onChange={handleChange} className={inputClass} placeholder="ISO ID" />
                        </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                      <Building2 size={16} /> 4. Operational Infrastructure
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className={labelCls}>Total Beds</label>
                            <input type="number" name="totalBeds" value={formData.totalBeds} onChange={handleChange} className={inputClass} placeholder="0" />
                        </div>
                        <div>
                            <label className={labelCls}>ICU Beds</label>
                            <input type="number" name="icuBeds" value={formData.icuBeds} onChange={handleChange} className={inputClass} placeholder="0" />
                        </div>
                        <div>
                            <label className={labelCls}>OT Count</label>
                            <input type="number" name="operationTheatersCount" value={formData.operationTheatersCount} onChange={handleChange} className={inputClass} placeholder="0" />
                        </div>
                        <div>
                            <label className={labelCls}>Ambulances</label>
                            <input type="number" name="ambulanceCount" value={formData.ambulanceCount} onChange={handleChange} className={inputClass} placeholder="0" />
                        </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                      <Stethoscope size={16} /> 5. Clinical Scope & Departments
                    </h3>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Select all active departments</p>
                        <div className="flex flex-wrap gap-2">
                            {HospitalDepartments.map(dept => (
                                <button
                                    key={dept}
                                    type="button"
                                    onClick={() => handleDepartmentToggle(dept)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                                        formData.departments.includes(dept)
                                            ? 'bg-primary-600 border-primary-600 text-white shadow-lg'
                                            : 'bg-white border-slate-100 text-slate-400 hover:border-primary-200'
                                    }`}
                                >
                                    {dept}
                                </button>
                            ))}
                        </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                      <MapPin size={16} /> 6. Facility Location
                    </h3>
                    <div className="flex justify-between items-center mb-4">
                        <p className={labelCls}>Geographic Coordinates</p>
                        <button type="button" onClick={handleGetCurrentLocation} className="text-[10px] font-black text-primary-600 uppercase flex items-center gap-2">
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

              {/* Step 9/4: Account Security (Universal) */}
              <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
                <h3 className="flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                  <Lock size={16} /> {role === 'ROLE_DOCTOR' ? '8. Account Security' : (role === 'ROLE_PATIENT' ? '7. Account Security' : '4. Account Security')}
                </h3>
                <div className="mb-6">
                    <label className={labelClass}>Username / Doctor ID <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.email} disabled className={`${inputClass} bg-blue-50 border-blue-100 text-blue-900 font-bold`} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="relative">
                    <label className={labelClass}>Secure Password <span className="text-red-500">*</span></label>
                    <input type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} className={inputClass} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-10 text-slate-400">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="relative">
                    <label className={labelClass}>Confirm Password <span className="text-red-500">*</span></label>
                    <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className={inputClass} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-10 text-slate-400">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="pt-6">
                  <button type="submit" disabled={loading}
                    className={`w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl shadow-xl text-xs font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01] shadow-blue-200'}`}>
                    {loading ? 'Finalizing Sync...' : (role === 'ROLE_DOCTOR' ? 'Complete Physician Enrollment' : (role === 'ROLE_PATIENT' ? 'Complete Patient Registration' : 'Complete Institutional Onboarding'))}
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
