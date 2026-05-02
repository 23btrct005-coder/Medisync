import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, UserPlus, Building2, Mail, Lock, User, Phone, MapPin, 
  Camera, AlertCircle, CheckCircle, GraduationCap, Briefcase, Stethoscope,
  ShieldCheck, Heart, Eye, EyeOff, Navigation, ChevronRight, Activity,
  ClipboardList
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

const StepIndicator = ({ currentStep, totalSteps }) => (
  <div className="flex items-center justify-between mb-8 max-w-sm mx-auto">
    {[...Array(totalSteps)].map((_, i) => (
      <React.Fragment key={i}>
        <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500 ${i + 1 <= currentStep ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
          {i + 1 < currentStep ? <CheckCircle size={20} /> : <span className="font-black text-sm">{i + 1}</span>}
          {i + 1 === currentStep && <div className="absolute inset-0 bg-primary-600/30 blur-lg rounded-full animate-pulse" />}
        </div>
        {i < totalSteps - 1 && (
          <div className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${i + 1 < currentStep ? 'bg-primary-600' : 'bg-slate-100'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const context = searchParams.get('context') || 'patient'; // patient or professional
  
  const [role, setRole] = useState(context === 'professional' ? 'ROLE_HOSPITAL_ADMIN' : 'ROLE_PATIENT');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  
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
    // Detailed Patient Profile
    bloodGroup: '',
    height: '',
    weight: '',
    hasDisability: 'false',
    // Contact & Residency
    phone: '',
    alternatePhone: '',
    street: '',
    city: '',
    state: '',
    pinCode: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    // Clinical History
    allergies: '',
    existingDiseases: '',
    // Lifestyle
    smokingStatus: '',
    alcoholStatus: '',
    organDonorStatus: 'Undecided',
    // Professional Clinical
    specialization: '',
    medicalDegree: '',
    medicalLicenseNumber: '',
    medicalCouncil: '',
    licenseExpiryDate: '',
    registrationYear: '',
    hospital: '', 
    hospitalName: '', 
    yearsOfExperience: '',
    onlineConsultationFee: '',
    clinicAddress: '',
    upiId: '',
    workingDays: [],
    startTime: '09:00',
    endTime: '18:00',
    slotDuration: '15',
    maxPatientsPerDay: '30',
    // Institutional
    licenseCode: '',
    hospitalType: '',
    departments: [],
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [aiDisclaimerAccepted, setAiDisclaimerAccepted] = useState(false);
  const [locating, setLocating] = useState(false);
  
  // Media
  const [profilePicture, setProfilePicture] = useState(null);
  const [hospitalLogo, setHospitalLogo] = useState(null);
  const [registrationCertificate, setRegistrationCertificate] = useState(null);
  const [licenseDocument, setLicenseDocument] = useState(null);

  // Data
  const [hospitals, setHospitals] = useState([]);
  const [geographyData, setGeographyData] = useState({});
  const [availableCities, setAvailableCities] = useState([]);

  // Verification
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

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
        try {
            const res = await api.get('auth/hospitals');
            setHospitals(res.data);
        } catch (err) {
            console.error('Failed to load hospitals');
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
    let year = dob[0], month = dob[1], day = dob[2];

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
    let year = expiry[0], month = expiry[1], day = expiry[2];
    if (type === 'year') year = value;
    if (type === 'month') month = value;
    if (type === 'day') day = value;
    setFormData({ ...formData, licenseExpiryDate: `${year}-${month}-${day}` });
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
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await response.json();
          const address = data.address;
          
          const detectedState = address.state || '';
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
        setError("Location access denied. Please enable location services.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleSendOtp = async () => {
    if(!formData.email.trim()) { setError('Enter a valid email.'); return; }
    setVerifying(true);
    try {
      await api.post('auth/request-otp', { email: formData.email.trim() });
      setOtpSent(true);
      setSuccess('Verification code sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) return;
    setVerifying(true);
    try {
      await api.post('auth/verify-otp', { email: formData.email, otp: otpCode });
      setEmailVerified(true);
      setSuccess('Email verified!');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code.');
    } finally {
      setVerifying(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!emailVerified) { setError('Verify your email first.'); return; }
    if (role === 'ROLE_PATIENT' && !aiDisclaimerAccepted) { setError('Accept the AI Clinical Disclaimer.'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      const endpoint = role === 'ROLE_PATIENT' ? 'auth/register/patient' : 
                       (role === 'ROLE_DOCTOR' ? 'auth/register/doctor' : 'auth/register/hospital-admin');
      
      formDataToSend.append('userData', JSON.stringify({
        ...formData,
        username: formData.email,
        role: role,
        consultationTimings: `${formData.startTime} - ${formData.endTime}`
      }));
      
      if (profilePicture) formDataToSend.append('profilePicture', profilePicture);
      if (hospitalLogo) formDataToSend.append('hospitalLogo', hospitalLogo);
      if (registrationCertificate) formDataToSend.append('registrationCertificate', registrationCertificate);
      if (licenseDocument) formDataToSend.append('licenseDocument', licenseDocument);

      await api.post(endpoint, formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Registration successful!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "block w-full rounded-xl border-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-3.5 border transition-all bg-white placeholder:text-slate-300";
  const labelClass = "block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-[0.15em]";
  const sectionHeadClass = "flex items-center gap-2 text-xs font-black text-primary-700 uppercase tracking-[0.2em] pb-3 border-b border-slate-100";

  const isAddressComplete = formData.street && formData.city && formData.state && formData.pinCode;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden text-left">
      <div className="absolute top-0 left-0 w-full h-80 bg-primary-600 rounded-b-[3rem] shadow-lg -z-10" />

      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-sm font-medium text-white/80 hover:text-white transition">
          <ArrowLeft size={16} className="mr-1" /> Back
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
                      {role === 'ROLE_PATIENT' ? 'Patient Registration' : 
                       (role === 'ROLE_DOCTOR' ? 'Physician Enrollment' : 'Institutional Onboarding')}
                    </h2>
                    <p className="text-primary-100 text-sm mt-0.5">
                      {role === 'ROLE_PATIENT' ? 'Securely join the MEDISYNC Healthcare Network' : 'Professional credentials verification for MediSync Access'}
                    </p>
                  </div>
                </div>
                <div className="flex bg-white/10 p-1 rounded-2xl backdrop-blur-md">
                    {context === 'patient' ? (
                        <button className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white text-primary-600 shadow-lg">Patient</button>
                    ) : (
                        <div className="flex gap-1">
                            <button type="button" onClick={() => setRole('ROLE_DOCTOR')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === 'ROLE_DOCTOR' ? 'bg-white text-primary-600 shadow-lg' : 'text-white hover:bg-white/10'}`}>Physician</button>
                            <button type="button" onClick={() => setRole('ROLE_HOSPITAL_ADMIN')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === 'ROLE_HOSPITAL_ADMIN' ? 'bg-white text-primary-600 shadow-lg' : 'text-white hover:bg-white/10'}`}>Hospital</button>
                        </div>
                    )}
                </div>
            </div>
          </div>

          <div className="p-8 space-y-10">
            {error && <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-medium border border-red-100 flex items-start gap-2 animate-in fade-in slide-in-from-top-1"><AlertCircle size={18} className="shrink-0 mt-0.5" /> {error}</div>}
            {success && <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-sm font-medium border border-green-100 flex items-start gap-2 animate-in fade-in slide-in-from-top-1"><CheckCircle size={18} className="shrink-0 mt-0.5" /> {success}</div>}

            <form className="space-y-10" onSubmit={handleRegister}>
              {role === 'ROLE_PATIENT' ? (
                <div className="space-y-10">
                  <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
                  
                  {currentStep === 1 && (
                    <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-6">
                      <h3 className={sectionHeadClass}><Mail size={16} /> 1. Identity Verification</h3>
                      <div className="flex gap-3">
                        <input type="email" name="email" required disabled={emailVerified} value={formData.email} onChange={handleChange} className={`${inputClass} ${emailVerified ? 'bg-green-50 border-green-300' : ''} flex-1`} placeholder="yourname@email.com" />
                        {!emailVerified && <button type="button" onClick={handleSendOtp} disabled={verifying} className="whitespace-nowrap bg-blue-600 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-100">{verifying ? '...' : 'Verify'}</button>}
                      </div>
                      {otpSent && !emailVerified && (
                        <div className="p-6 bg-slate-50 rounded-2xl border border-blue-100 space-y-4 animate-in zoom-in-95">
                          <label className={labelClass}>Verification Code</label>
                          <div className="flex gap-3">
                            <input type="text" maxLength="6" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} className="block w-full text-center text-xl font-bold tracking-[0.3em] rounded-xl border-slate-200 px-3 py-3 border focus:ring-primary-500" placeholder="000000" />
                            <button type="button" onClick={handleVerifyOtp} disabled={verifying} className="bg-blue-600 text-white px-8 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700">Confirm</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <h3 className={sectionHeadClass}><User size={16} /> 2. Personal Profile</h3>
                      <div className="flex flex-col items-center gap-4 py-4"><ProfilePhotoUpload onFileSelect={setProfilePicture} /></div>
                      <div className="space-y-6">
                        <div><label className={labelClass}>Full Name <span className="text-red-500">*</span></label><input type="text" name="name" required value={formData.name} onChange={handleChange} className={inputClass} placeholder="Enter your full name" /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                          <div><label className={labelClass}>Gender <span className="text-red-500">*</span></label>
                            <select name="gender" required value={formData.gender} onChange={handleChange} className={inputClass}>
                              <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                            </select>
                          </div>
                          <div><label className={labelClass}>Date of Birth <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-3 gap-2">
                              <select className={inputClass} value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[2] : ''} onChange={(e) => handleDateChange('day', e.target.value)} required>
                                <option value="">Day</option>{Array.from({length: 31}, (_, i) => String(i + 1).padStart(2, '0')).map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                              <select className={inputClass} value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[1] : ''} onChange={(e) => handleDateChange('month', e.target.value)} required>
                                <option value="">Month</option>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
                              </select>
                              <select className={inputClass} value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[0] : ''} onChange={(e) => handleDateChange('year', e.target.value)} required>
                                <option value="">Year</option>{Array.from({length: 100}, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <h3 className={sectionHeadClass}><Activity size={16} /> 3. Medical Metrics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div><label className={labelClass}>Blood Group</label>
                          <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className={inputClass}>
                            <option value="">Select</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                          </select>
                        </div>
                        <div><label className={labelClass}>Height (cm)</label><input type="number" name="height" value={formData.height} onChange={handleChange} className={inputClass} placeholder="175" /></div>
                        <div><label className={labelClass}>Weight (kg)</label><input type="number" name="weight" value={formData.weight} onChange={handleChange} className={inputClass} placeholder="70" /></div>
                        <div><label className={labelClass}>Disability</label><select name="hasDisability" value={formData.hasDisability} onChange={handleChange} className={inputClass}><option value="false">None</option><option value="true">Yes</option></select></div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <h3 className={sectionHeadClass}><MapPin size={16} /> 4. Residency & Contact</h3>
                        <button type="button" onClick={handleGetCurrentLocation} disabled={locating} className="flex items-center gap-2 text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 disabled:opacity-50 transition-all">
                          <Navigation size={12} className={locating ? 'animate-pulse' : ''} /> {locating ? 'Locating...' : 'Auto-Locate'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div><label className={labelClass}>Primary Phone <span className="text-red-500">*</span></label><input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className={inputClass} placeholder="9876543210" /></div>
                        <div><label className={labelClass}>Alternate Phone</label><input type="tel" name="alternatePhone" value={formData.alternatePhone} onChange={handleChange} className={inputClass} placeholder="Optional" /></div>
                        <div className="md:col-span-2"><label className={labelClass}>Full Residential Address <span className="text-red-500">*</span></label><input type="text" name="street" required value={formData.street} onChange={handleChange} className={inputClass} placeholder="Street, Building, Area" /></div>
                        <div><label className={labelClass}>State <span className="text-red-500">*</span></label>
                          <select name="state" required value={formData.state} onChange={handleChange} className={inputClass}>
                            <option value="">Select State</option>{Object.keys(geographyData).sort().map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div><label className={labelClass}>District / City <span className="text-red-500">*</span></label>
                          <select name="city" required value={formData.city} onChange={handleChange} className={inputClass} disabled={!formData.state}>
                            <option value="">Select District</option>{availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div><label className={labelClass}>PIN Code <span className="text-red-500">*</span></label><input type="text" name="pinCode" required value={formData.pinCode} onChange={handleChange} className={inputClass} placeholder="6-digit PIN" /></div>
                      </div>
                    </div>
                  )}

                  {currentStep === 5 && (
                    <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <h3 className={sectionHeadClass}><ClipboardList size={16} /> 5. Clinical History</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className={labelClass}>Known Allergies</label><textarea name="allergies" value={formData.allergies} onChange={handleChange} className={`${inputClass} h-32 resize-none`} placeholder="e.g. Penicillin" /></div>
                        <div><label className={labelClass}>Chronic Diseases</label><textarea name="existingDiseases" value={formData.existingDiseases} onChange={handleChange} className={`${inputClass} h-32 resize-none`} placeholder="e.g. Diabetes" /></div>
                      </div>
                    </div>
                  )}

                  {currentStep === 6 && (
                    <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <h3 className={sectionHeadClass}><Activity size={16} /> 6. Lifestyle & Final Steps</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                           <label className={labelClass}>Lifestyle & Habits</label>
                           <div className="grid grid-cols-3 gap-3">
                              <select name="smokingStatus" value={formData.smokingStatus} onChange={handleChange} className={inputClass}><option value="">Smoking</option><option value="Non-Smoker">No</option><option value="Regular">Yes</option></select>
                              <select name="alcoholStatus" value={formData.alcoholStatus} onChange={handleChange} className={inputClass}><option value="">Alcohol</option><option value="None">No</option><option value="Social">Social</option></select>
                              <select name="organDonorStatus" value={formData.organDonorStatus} onChange={handleChange} className={inputClass}><option value="Undecided">Donor</option><option value="Yes">Yes</option><option value="No">No</option></select>
                           </div>
                        </div>
                      </div>
                      <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-6">
                        <div className="flex items-center gap-3 pb-3 border-b border-blue-100"><Lock size={18} className="text-blue-600" /><h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Account Security</h4></div>
                        <div><label className={labelClass}>Generated Patient ID</label><input type="text" disabled value={isAddressComplete ? formData.email : 'Complete Step 4 for ID generation'} className={`${inputClass} font-bold ${!isAddressComplete ? 'italic text-slate-400' : 'text-blue-900 bg-white'}`} /></div>
                        <div className="grid grid-cols-2 gap-5">
                          <div className="relative"><label className={labelClass}>Password <span className="text-red-500">*</span></label><input type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} className={inputClass} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-10 text-slate-400">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
                          <div className="relative"><label className={labelClass}>Confirm <span className="text-red-500">*</span></label><input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className={inputClass} /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-10 text-slate-400">{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
                        </div>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                        <input type="checkbox" id="aiDisclaimer" checked={aiDisclaimerAccepted} onChange={(e) => setAiDisclaimerAccepted(e.target.checked)} className="mt-1 h-5 w-5 rounded border-blue-200 text-primary-600 focus:ring-primary-500" />
                        <label htmlFor="aiDisclaimer" className="text-xs text-slate-600 leading-relaxed font-medium">I understand that MEDISYNC uses Advanced AI for clinical analysis. I agree to share my health data and acknowledge that AI recommendations should be verified by a medical professional. <span className="text-red-500 font-bold">* Required</span></label>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-6">
                    {currentStep > 1 && <button type="button" onClick={prevStep} className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"><ArrowLeft size={18} /> Previous</button>}
                    <div className="flex-1" />
                    {currentStep < totalSteps ? (
                      <button type="button" onClick={nextStep} className="flex items-center gap-2 bg-primary-600 text-white px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-100 active:scale-95">Continue <ChevronRight size={18} /></button>
                    ) : (
                      <button type="submit" disabled={loading} className="flex items-center gap-2 bg-green-600 text-white px-12 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-xl shadow-green-100 active:scale-95 disabled:opacity-50">{loading ? 'Processing...' : 'Complete Registration'} <CheckCircle size={18} /></button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-10">
                  {/* Physician / Hospital Scrolling Flow */}
                  <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-6">
                      <h3 className={sectionHeadClass}><Mail size={16} /> 1. Identity Verification</h3>
                      <div className="flex gap-3">
                        <input type="email" name="email" required disabled={emailVerified} value={formData.email} onChange={handleChange} className={`${inputClass} ${emailVerified ? 'bg-green-50 border-green-300' : ''} flex-1`} placeholder="doctor@hospital.com" />
                        {!emailVerified && <button type="button" onClick={handleSendOtp} disabled={verifying} className="whitespace-nowrap bg-blue-600 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 shadow-lg">{verifying ? '...' : 'Send OTP'}</button>}
                      </div>
                      {otpSent && !emailVerified && (
                        <div className="p-6 bg-slate-50 rounded-2xl border border-blue-100 space-y-4">
                          <label className={labelClass}>Verification Code</label>
                          <div className="flex gap-3">
                            <input type="text" maxLength="6" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} className="block w-full text-center text-xl font-bold tracking-[0.3em] rounded-xl border-slate-200 px-3 py-3 border" placeholder="000000" />
                            <button type="button" onClick={handleVerifyOtp} disabled={verifying} className="bg-blue-600 text-white px-8 py-2 rounded-xl text-xs font-black uppercase tracking-widest">Confirm</button>
                          </div>
                        </div>
                      )}
                  </div>

                  <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h3 className={sectionHeadClass}><User size={16} /> 2. Personal Details</h3>
                    <div className="flex flex-col items-center gap-4 py-4"><ProfilePhotoUpload onFileSelect={setProfilePicture} /></div>
                    <div className="space-y-6">
                        <div><label className={labelClass}>Full Name <span className="text-red-500">*</span></label><input type="text" name="name" required value={formData.name} onChange={handleChange} className={inputClass} placeholder="Dr. John Smith" /></div>
                        <div className="grid grid-cols-2 gap-6">
                            <div><label className={labelClass}>Gender <span className="text-red-500">*</span></label>
                              <select name="gender" required value={formData.gender} onChange={handleChange} className={inputClass}>
                                <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                              </select>
                            </div>
                            <div><label className={labelClass}>Date of Birth <span className="text-red-500">*</span></label>
                              <div className="grid grid-cols-3 gap-2">
                                <select className={inputClass} value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[2] : ''} onChange={(e) => handleDateChange('day', e.target.value)} required><option value="">Day</option>{Array.from({length: 31}, (_, i) => String(i+1).padStart(2, '0')).map(d => <option key={d} value={d}>{d}</option>)}</select>
                                <select className={inputClass} value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[1] : ''} onChange={(e) => handleDateChange('month', e.target.value)} required><option value="">Month</option>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => <option key={m} value={String(i+1).padStart(2, '0')}>{m}</option>)}</select>
                                <select className={inputClass} value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[0] : ''} onChange={(e) => handleDateChange('year', e.target.value)} required><option value="">Year</option>{Array.from({length: 100}, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}</select>
                              </div>
                            </div>
                        </div>
                    </div>
                  </div>

                  {role === 'ROLE_DOCTOR' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                        <h3 className={sectionHeadClass}><GraduationCap size={16} /> 3. Qualifications</h3>
                        <div className="grid grid-cols-2 gap-6">
                          <select name="medicalDegree" required value={formData.medicalDegree} onChange={handleChange} className={inputClass}><option value="">Degree</option><option value="MBBS">MBBS</option><option value="MD">MD</option><option value="MS">MS</option></select>
                          <select name="specialization" required value={formData.specialization} onChange={handleChange} className={inputClass}><option value="">Specialization</option>{HospitalDepartments.map(d => <option key={d} value={d}>{d}</option>)}</select>
                        </div>
                      </div>
                      <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                        <h3 className={sectionHeadClass}><ShieldCheck size={16} /> 4. License</h3>
                        <div className="grid grid-cols-2 gap-6">
                          <input type="text" name="medicalCouncil" required value={formData.medicalCouncil} onChange={handleChange} className={inputClass} placeholder="Council" />
                          <input type="text" name="medicalLicenseNumber" required value={formData.medicalLicenseNumber} onChange={handleChange} className={inputClass} placeholder="License No" />
                        </div>
                        <div>
                          <label className={labelClass}>Medical License Document <span className="text-red-500">*</span></label>
                          <DocumentUpload onFileSelect={setLicenseDocument} label="Upload Medical License" />
                        </div>
                      </div>
                    </div>
                  )}

                  {role === 'ROLE_HOSPITAL_ADMIN' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                        <h3 className={sectionHeadClass}><Building2 size={16} /> 3. Institutional Details</h3>
                        <div className="grid grid-cols-2 gap-6">
                          <div><label className={labelClass}>Hospital Name <span className="text-red-500">*</span></label><input type="text" name="hospitalName" required value={formData.hospitalName} onChange={handleChange} className={inputClass} placeholder="e.g. City Hospital" /></div>
                          <div><label className={labelClass}>License Code <span className="text-red-500">*</span></label><input type="text" name="licenseCode" required value={formData.licenseCode} onChange={handleChange} className={inputClass} placeholder="Registration No" /></div>
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                        <h3 className={sectionHeadClass}><ShieldCheck size={16} /> 4. Verification Documents</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className={labelClass}>Hospital Logo</label>
                                <DocumentUpload onFileSelect={setHospitalLogo} label="Upload Logo" />
                            </div>
                            <div className="space-y-4">
                                <label className={labelClass}>Registration Certificate <span className="text-red-500">*</span></label>
                                <DocumentUpload onFileSelect={setRegistrationCertificate} label="Upload Certificate" />
                            </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                    <h3 className={sectionHeadClass}><Lock size={16} /> Account Security</h3>
                    <div className="mb-4">
                        <label className={labelClass}>Clinical User ID</label>
                        <input type="text" disabled value={formData.email || 'Email required'} className={`${inputClass} font-bold text-primary-600 bg-primary-50/30`} />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="relative"><label className={labelClass}>Password</label><input type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} className={inputClass} /></div>
                      <div className="relative"><label className={labelClass}>Confirm</label><input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className={inputClass} /></div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-primary-700 shadow-xl transition-all">{loading ? 'Processing...' : 'Complete Enrollment'}</button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
      <LegalFooter />
    </div>
  );
};

export default Register;
