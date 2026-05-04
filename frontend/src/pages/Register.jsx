import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, UserPlus, Building2, Mail, Lock, User, Phone, MapPin, 
  Camera, AlertCircle, CheckCircle, GraduationCap, Briefcase, Stethoscope,
  ShieldCheck, Heart, Eye, EyeOff, Navigation, ChevronRight, Activity,
  ClipboardList, Globe, CreditCard
} from 'lucide-react';
import api from '../api/axiosConfig';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import DocumentUpload from '../components/DocumentUpload';
import LegalFooter from '../components/LegalFooter';

const HospitalDepartments = [
  "Cardiology", "Neurology", "Pediatrics", "Orthopedics", "Oncology", 
  "Gynecology", "Dermatology", "Urology", "Ophthalmology", "ENT", 
  "Psychiatry", "Emergency Medicine", "Radiology", "General Surgery",
  "Dental Surgery", "Nephrology", "Pulmonology", "Gastroenterology"
];

const PREDEFINED_HOSPITAL_SERVICES = [
    "24/7 Emergency", "MRI Scan", "CT Scan", "X-Ray", "Blood Bank", 
    "ICU (Intensive Care Unit)", "NICU", "Dialysis", "Physiotherapy", 
    "Pathology Lab", "In-house Pharmacy", "Ambulance", "Operation Theater",
    "Telemedicine", "Vaccination Center", "Home Care Services"
];

const PREDEFINED_DOCTOR_SERVICES = [
    "General Consultation",
    "Specialist Consultation",
    "Emergency Care",
    "Home Visit",
    "Telemedicine",
    "Vaccination",
    "Diagnostic Review",
    "Minor Procedures",
    "Second Opinion",
    "Health Screening"
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
    username: '',
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
    location: '',
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
    offlineConsultationFee: '',
    onlineConsultation: true,
    appointmentsEnabled: true,
    clinicAddress: '',
    clinicStreet: '',
    clinicCity: '',
    clinicState: '',
    clinicPinCode: '',
    subSpecialties: '',
    proceduresHandled: '',
    treatmentFocus: '',
    languagesSpoken: '',
    publications: '',
    upiId: '',
    workingDays: [],
    startTime: '09:00',
    endTime: '18:00',
    slotDuration: '15',
    maxPatientsPerDay: '30',
    // Institutional
    licenseCode: '',
    hospitalType: '',
    ownershipType: '',
    registrationAuthority: '',
    registrationDate: '',
    hospitalLicenseExpiryDate: '',
    gstNumber: '',
    panNumber: '',
    officialPhone: '',
    officialAlternatePhone: '',
    emergencyPhone: '',
    adminName: '',
    adminRole: '',
    adminContact: '',
    totalBeds: '',
    icuAvailable: 'false',
    ambulanceAvailable: 'false',
    emergencyServices247: 'true',
    timezone: 'Asia/Kolkata',
    workingHours: '24/7',
    websiteUrl: '',
    googleMapsUrl: '',
    facilityId: '',
    govtRegistrationNumber: '',
    cinNumber: '',
    nabhId: '',
    isoId: '',
    insuranceProviders: '',
    icuBeds: '',
    operationTheatersCount: '',
    ambulanceCount: '',
    medicalDirectorName: '',
    medicalDirectorQualification: '',
    medicalDirectorRegNumber: '',
    medicalDirectorEmail: '',
    doctorCount: '',
    nurseCount: '',
    generalStaffCount: '',
    hasEhr: false,
    hasPacs: false,
    hasLabIntegration: false,
    telemedicineEnabled: false,
    razorpayAccountId: '',
    preferredPaymentMode: 'RAZORPAY',
    termsAccepted: false,
    privacyAccepted: false,
    consentAccepted: false,
    departments: "",
    services: "",
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
  const [nabhCertificate, setNabhCertificate] = useState(null);
  const [taxCertificate, setTaxCertificate] = useState(null);
  const [addressProof, setAddressProof] = useState(null);
  const [adminIdProof, setAdminIdProof] = useState(null);

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

  useEffect(() => {
    if (emailVerified && !formData.username) {
        setFormData(prev => ({ ...prev, username: prev.email }));
    }
  }, [emailVerified]);

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
    
    if (name === 'clinicState') {
      if (geographyData[value]) {
        setAvailableCities(geographyData[value]);
        updated.clinicCity = '';
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
          const detectedStreet = address.road || address.suburb || data.display_name || '';
          const detectedLocation = `${address.suburb || address.neighbourhood || ''} ${detectedCity}`.trim();

          const updated = { ...formData };
          
          if (role === 'ROLE_PATIENT' || role === 'ROLE_HOSPITAL_ADMIN') {
              updated.city = detectedCity;
              updated.pinCode = detectedPin;
              updated.street = detectedStreet;
              updated.location = detectedLocation;
          } else if (role === 'ROLE_DOCTOR') {
              updated.clinicCity = detectedCity;
              updated.clinicPinCode = detectedPin;
              updated.clinicStreet = detectedStreet;
          }

          updated.googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

          // Case-insensitive state matching for cascading dropdowns
          const matchingStateKey = Object.keys(geographyData).find(
            s => s.toLowerCase() === detectedState.toLowerCase()
          );

          if (matchingStateKey) {
            if (role === 'ROLE_PATIENT' || role === 'ROLE_HOSPITAL_ADMIN') updated.state = matchingStateKey;
            else updated.clinicState = matchingStateKey;
            
            setAvailableCities(geographyData[matchingStateKey]);
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
    if (formData.password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      const endpoint = role === 'ROLE_PATIENT' ? 'auth/register/patient' : 
                       (role === 'ROLE_DOCTOR' ? 'auth/register/doctor' : 'auth/register/hospital-admin');
      
      formDataToSend.append('userData', JSON.stringify({
        ...formData,
        username: formData.email,
        role: role,
        clinicAddress: role === 'ROLE_DOCTOR' ? `${formData.clinicStreet}, ${formData.clinicCity}, ${formData.clinicState} - ${formData.clinicPinCode}` : formData.clinicAddress,
        consultationTimings: `${formData.startTime} - ${formData.endTime}`,
        onlineConsultationFee: formData.onlineConsultationFee,
        offlineConsultationFee: formData.offlineConsultationFee,
        onlineConsultation: formData.onlineConsultation,
        appointmentsEnabled: formData.appointmentsEnabled
      }));
      
      if (profilePicture) formDataToSend.append('profilePicture', profilePicture);
      if (hospitalLogo) formDataToSend.append('hospitalLogo', hospitalLogo);
      if (registrationCertificate) formDataToSend.append('registrationCertificate', registrationCertificate);
      if (licenseDocument) formDataToSend.append('licenseDocument', licenseDocument);
      if (nabhCertificate) formDataToSend.append('nabhCertificate', nabhCertificate);
      if (taxCertificate) formDataToSend.append('taxCertificate', taxCertificate);
      if (addressProof) formDataToSend.append('addressProof', addressProof);
      if (adminIdProof) formDataToSend.append('adminIdProof', adminIdProof);

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
                          <div className="relative">
                            <label className={labelClass}>Create Password <span className="text-red-500">*</span></label>
                            <input type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} className={inputClass} placeholder="Minimum 6 characters" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-10 text-slate-400">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                          </div>
                          <div className="relative">
                            <label className={labelClass}>Confirm Password <span className="text-red-500">*</span></label>
                            <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className={inputClass} />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-10 text-slate-400">{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                          </div>
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

                  {role === 'ROLE_DOCTOR' && (
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
                  )}

                  {role === 'ROLE_DOCTOR' && (
                    <>
                      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                        <h3 className={sectionHeadClass}><GraduationCap size={16} /> 3. Qualifications</h3>
                        <div className="grid grid-cols-2 gap-6">
                          <select name="medicalDegree" required value={formData.medicalDegree} onChange={handleChange} className={inputClass}><option value="">Degree</option><option value="MBBS">MBBS</option><option value="MD">MD</option><option value="MS">MS</option></select>
                          <select name="specialization" required value={formData.specialization} onChange={handleChange} className={inputClass}><option value="">Specialization</option>{HospitalDepartments.map(d => <option key={d} value={d}>{d}</option>)}</select>
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                        <h3 className={sectionHeadClass}><ShieldCheck size={16} /> 4. License & Certification</h3>
                        <div className="grid grid-cols-2 gap-6">
                          <input type="text" name="medicalCouncil" required value={formData.medicalCouncil} onChange={handleChange} className={inputClass} placeholder="Council" />
                          <input type="text" name="medicalLicenseNumber" required value={formData.medicalLicenseNumber} onChange={handleChange} className={inputClass} placeholder="License No" />
                        </div>
                        <div>
                          <label className={labelClass}>Medical License Document <span className="text-red-500">*</span></label>
                          <DocumentUpload onFileSelect={setLicenseDocument} label="Upload Medical License" />
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                            <h3 className={sectionHeadClass}><Building2 size={16} /> 5. Work & Clinic Details</h3>
                            <button type="button" onClick={handleGetCurrentLocation} disabled={locating} 
                                className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 disabled:opacity-50 transition-all">
                                <Navigation size={12} className={locating ? 'animate-pulse' : ''} /> {locating ? 'Locating...' : 'Auto-Locate'}
                            </button>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div><label className={labelClass}>Years of Experience <span className="text-red-500">*</span></label><input type="number" name="yearsOfExperience" required value={formData.yearsOfExperience} onChange={handleChange} className={inputClass} placeholder="e.g. 10" /></div>
                                <div><label className={labelClass}>Base OPD Fee (₹) <span className="text-red-500">*</span></label><input type="number" name="onlineConsultationFee" required value={formData.onlineConsultationFee} onChange={handleChange} className={inputClass} placeholder="e.g. 500" /></div>
                            </div>

                            {/* Section 5.1: Consultation & Booking (New) */}
                            <div className="p-8 bg-indigo-50/30 rounded-[2rem] border border-indigo-100/50 space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em]">Consultation & Booking</h4>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Fees */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className={labelClass}>Online Consultation Fee (₹)</label>
                                            <input type="number" name="onlineConsultationFee" value={formData.onlineConsultationFee} onChange={handleChange} className={inputClass} placeholder="500" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Offline Consultation Fee (₹)</label>
                                            <input type="number" name="offlineConsultationFee" value={formData.offlineConsultationFee} onChange={handleChange} className={inputClass} placeholder="800" />
                                        </div>
                                    </div>

                                    {/* Mode & Toggle */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className={labelClass}>Consultation Mode</label>
                                            <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                                {[
                                                    { id: 'online', label: 'Online', val: true },
                                                    { id: 'offline', label: 'Offline', val: false },
                                                    { id: 'both', label: 'Both', val: 'BOTH' }
                                                ].map(mode => (
                                                    <button
                                                        key={mode.id}
                                                        type="button"
                                                        onClick={() => {
                                                            if (mode.id === 'online') {
                                                                setFormData({...formData, onlineConsultation: true, offlineConsultationFee: ''});
                                                            } else if (mode.id === 'offline') {
                                                                setFormData({...formData, onlineConsultation: false});
                                                            } else {
                                                                setFormData({...formData, onlineConsultation: true});
                                                            }
                                                        }}
                                                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                            (mode.id === 'both' && formData.onlineConsultation === true && formData.offlineConsultationFee) || 
                                                            (mode.id === 'online' && formData.onlineConsultation === true && !formData.offlineConsultationFee) ||
                                                            (mode.id === 'offline' && formData.onlineConsultation === false)
                                                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                                            : 'text-slate-400 hover:text-indigo-600'
                                                        }`}
                                                    >
                                                        {mode.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Accept Appointments</p>
                                                <p className="text-[8px] font-bold text-emerald-600/60 uppercase tracking-widest mt-0.5">Allow patients to book slots</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only peer"
                                                    checked={formData.appointmentsEnabled !== false}
                                                    onChange={(e) => setFormData({...formData, appointmentsEnabled: e.target.checked})}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <div className="md:col-span-2"><label className={labelClass}>Clinic Address (Street/Area) <span className="text-red-500">*</span></label><input type="text" name="clinicStreet" required value={formData.clinicStreet} onChange={handleChange} className={inputClass} placeholder="Street, Building" /></div>
                                <div><label className={labelClass}>State <span className="text-red-500">*</span></label><select name="clinicState" required value={formData.clinicState} onChange={handleChange} className={inputClass}><option value="">Select State</option>{Object.keys(geographyData).sort().map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                <div><label className={labelClass}>City <span className="text-red-500">*</span></label><select name="clinicCity" required value={formData.clinicCity} onChange={handleChange} className={inputClass} disabled={!formData.clinicState}><option value="">Select City</option>{availableCities.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                <div><label className={labelClass}>PIN Code <span className="text-red-500">*</span></label><input type="text" name="clinicPinCode" required value={formData.clinicPinCode} onChange={handleChange} className={inputClass} placeholder="6 Digits" /></div>
                            </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                        <h3 className={sectionHeadClass}><Activity size={16} /> 6. Clinical Depth & Expertise</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Procedures Handled */}
                            <div className="space-y-4">
                                <label className={labelClass}>Procedures Handled</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        id="regProcedureInput"
                                        placeholder="e.g. Angioplasty"
                                        className={inputClass}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = e.target.value.trim();
                                                if (val && !formData.proceduresHandled.includes(val)) {
                                                    const current = formData.proceduresHandled ? formData.proceduresHandled.split(', ').filter(s => s) : [];
                                                    setFormData({...formData, proceduresHandled: [...current, val].join(', ')});
                                                    e.target.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const input = document.getElementById('regProcedureInput');
                                            const val = input.value.trim();
                                            if (val && !formData.proceduresHandled.includes(val)) {
                                                const current = formData.proceduresHandled ? formData.proceduresHandled.split(', ').filter(s => s) : [];
                                                setFormData({...formData, proceduresHandled: [...current, val].join(', ')});
                                                input.value = '';
                                            }
                                        }}
                                        className="p-3 bg-indigo-600 text-white rounded-2xl hover:scale-105 transition-all"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.proceduresHandled.split(', ').filter(s => s).map(p => (
                                        <span key={p} className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                                            {p}
                                            <button type="button" onClick={() => {
                                                const current = formData.proceduresHandled.split(', ').filter(s => s !== p);
                                                setFormData({...formData, proceduresHandled: current.join(', ')});
                                            }}><X size={10} /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Treatment Focus */}
                            <div className="space-y-4">
                                <label className={labelClass}>Treatment Focus</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        id="regFocusInput"
                                        placeholder="e.g. Heart Failure"
                                        className={inputClass}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = e.target.value.trim();
                                                if (val && !formData.treatmentFocus.includes(val)) {
                                                    const current = formData.treatmentFocus ? formData.treatmentFocus.split(', ').filter(s => s) : [];
                                                    setFormData({...formData, treatmentFocus: [...current, val].join(', ')});
                                                    e.target.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const input = document.getElementById('regFocusInput');
                                            const val = input.value.trim();
                                            if (val && !formData.treatmentFocus.includes(val)) {
                                                const current = formData.treatmentFocus ? formData.treatmentFocus.split(', ').filter(s => s) : [];
                                                setFormData({...formData, treatmentFocus: [...current, val].join(', ')});
                                                input.value = '';
                                            }
                                        }}
                                        className="p-3 bg-blue-600 text-white rounded-2xl hover:scale-105 transition-all"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.treatmentFocus.split(', ').filter(s => s).map(f => (
                                        <span key={f} className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">
                                            {f}
                                            <button type="button" onClick={() => {
                                                const current = formData.treatmentFocus.split(', ').filter(s => s !== f);
                                                setFormData({...formData, treatmentFocus: current.join(', ')});
                                            }}><X size={10} /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Languages Spoken */}
                            <div className="space-y-4">
                                <label className={labelClass}>Languages Spoken</label>
                                <select 
                                    className={inputClass}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val && !formData.languagesSpoken.includes(val)) {
                                            const current = formData.languagesSpoken ? formData.languagesSpoken.split(', ').filter(s => s) : [];
                                            setFormData({...formData, languagesSpoken: [...current, val].join(', ')});
                                        }
                                        e.target.value = '';
                                    }}
                                >
                                    <option value="">Select Language</option>
                                    {["English", "Hindi", "Kannada", "Tamil", "Telugu", "Malayalam", "Marathi", "Bengali", "Gujarati", "Punjabi", "Spanish", "French", "German"].map(lang => (
                                        <option key={lang} value={lang}>{lang}</option>
                                    ))}
                                </select>
                                <div className="flex flex-wrap gap-2">
                                    {formData.languagesSpoken.split(', ').filter(s => s).map(l => (
                                        <span key={l} className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                            {l}
                                            <button type="button" onClick={() => {
                                                const current = formData.languagesSpoken.split(', ').filter(s => s !== l);
                                                setFormData({...formData, languagesSpoken: current.join(', ')});
                                            }}><X size={10} /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Sub-Specialties</label>
                                <input type="text" name="subSpecialties" value={formData.subSpecialties} onChange={handleChange} className={inputClass} placeholder="e.g. Diabetes, Hypertension" />
                            </div>

                            <div className="md:col-span-2 pt-6 border-t border-slate-50">
                                <label className={labelClass}>Clinical Services Provided</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                                    {PREDEFINED_DOCTOR_SERVICES.map(service => (
                                        <label key={service} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer group ${formData.services?.includes(service) ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                                            <input 
                                                type="checkbox" 
                                                className="hidden"
                                                checked={formData.services?.includes(service) || false}
                                                onChange={(e) => {
                                                    const current = formData.services ? formData.services.split(', ').filter(s => s) : [];
                                                    const next = e.target.checked ? [...current, service] : current.filter(s => s !== service);
                                                    setFormData({...formData, services: next.join(', ')});
                                                }}
                                            />
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 transition-all ${formData.services?.includes(service) ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 group-hover:text-slate-600'}`}>
                                                <Heart size={14} fill={formData.services?.includes(service) ? 'currentColor' : 'none'} />
                                            </div>
                                            <span className={`text-[9px] font-black uppercase text-center tracking-tighter leading-tight ${formData.services?.includes(service) ? 'text-blue-700' : 'text-slate-500'}`}>{service}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                  {role === 'ROLE_HOSPITAL_ADMIN' && (
                    <>
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      
                      {/* Section 1: Basic Identity */}
                      <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                        <h3 className={sectionHeadClass}><Building2 size={16} /> 2. Hospital Identity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div><label className={labelClass}>Hospital Name <span className="text-red-500">*</span></label><input type="text" name="hospitalName" required value={formData.hospitalName} onChange={handleChange} className={inputClass} placeholder="e.g. Apollo Hospital" /></div>
                          <div><label className={labelClass}>Ownership Type <span className="text-red-500">*</span></label>
                            <select name="ownershipType" required value={formData.ownershipType} onChange={handleChange} className={inputClass}>
                                <option value="">Select Ownership</option><option value="Private">Private</option><option value="Government">Government</option><option value="Trust">Trust</option><option value="NGO">NGO</option>
                            </select>
                          </div>
                          <div><label className={labelClass}>Hospital Type <span className="text-red-500">*</span></label>
                            <select name="hospitalType" required value={formData.hospitalType} onChange={handleChange} className={inputClass}>
                                <option value="">Select Type</option><option value="Clinic">Clinic</option><option value="Multi-speciality">Multi-speciality</option><option value="Super-speciality">Super-speciality</option>
                            </select>
                          </div>
                          <div><label className={labelClass}>Official Website</label><input type="url" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} className={inputClass} placeholder="https://www.hospital.com" /></div>
                          <div><label className={labelClass}>National Facility ID (ABDM) <span className="text-red-500">*</span></label><input type="text" name="facilityId" required value={formData.facilityId} onChange={handleChange} className={inputClass} placeholder="IN12345678" /></div>
                          <div><label className={labelClass}>Govt Registration No <span className="text-red-500">*</span></label><input type="text" name="govtRegistrationNumber" required value={formData.govtRegistrationNumber} onChange={handleChange} className={inputClass} placeholder="HOSP-REG-99" /></div>
                          <div><label className={labelClass}>TIN / CIN (Corporate)</label><input type="text" name="cinNumber" value={formData.cinNumber} onChange={handleChange} className={inputClass} placeholder="U12345DL2024PTC123456" /></div>
                        </div>
                        <div className="flex flex-col items-center gap-4 py-4"><label className={labelClass}>Hospital Logo</label><DocumentUpload onFileSelect={setHospitalLogo} label="Upload Logo" /></div>
                      </div>

                      {/* Section 2: Legal & Government Details */}
                      <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                        <h3 className={sectionHeadClass}><ShieldCheck size={16} /> 3. Legal & Compliance</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div><label className={labelClass}>Registration Authority <span className="text-red-500">*</span></label><input type="text" name="registrationAuthority" required value={formData.registrationAuthority} onChange={handleChange} className={inputClass} placeholder="State Medical Council" /></div>
                          <div><label className={labelClass}>License / Reg. Code <span className="text-red-500">*</span></label><input type="text" name="licenseCode" required value={formData.licenseCode} onChange={handleChange} className={inputClass} placeholder="Reg-123456" /></div>
                          <div><label className={labelClass}>Registration Date <span className="text-red-500">*</span></label><input type="date" name="registrationDate" required value={formData.registrationDate} onChange={handleChange} className={inputClass} /></div>
                          <div><label className={labelClass}>License Expiry Date <span className="text-red-500">*</span></label><input type="date" name="hospitalLicenseExpiryDate" required value={formData.hospitalLicenseExpiryDate} onChange={handleChange} className={inputClass} /></div>
                          <div><label className={labelClass}>GST Number</label><input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className={inputClass} placeholder="22AAAAA0000A1Z5" /></div>
                          <div><label className={labelClass}>PAN Number (India)</label><input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className={inputClass} placeholder="ABCDE1234F" /></div>
                          <div><label className={labelClass}>NABH ID</label><input type="text" name="nabhId" value={formData.nabhId} onChange={handleChange} className={inputClass} placeholder="NABH-2024-XXXX" /></div>
                          <div><label className={labelClass}>ISO Certification ID</label><input type="text" name="isoId" value={formData.isoId} onChange={handleChange} className={inputClass} placeholder="ISO 9001:2015" /></div>
                        </div>
                      </div>

                      {/* Section 3: Full Address & Contact */}
                      <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                            <h3 className={sectionHeadClass}><MapPin size={16} /> 4. Location & Official Contact</h3>
                            <button type="button" onClick={handleGetCurrentLocation} disabled={locating} className="flex items-center gap-2 text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 disabled:opacity-50 transition-all">
                                <Navigation size={12} className={locating ? 'animate-pulse' : ''} /> {locating ? 'Auto-Locate' : 'Detect Location'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2"><label className={labelClass}>Regional Location (Area/City) <span className="text-red-500">*</span></label><input type="text" name="location" required value={formData.location} onChange={handleChange} className={inputClass} placeholder="e.g. South Delhi, Saket" /></div>
                            <div className="md:col-span-2"><label className={labelClass}>Full Postal Address <span className="text-red-500">*</span></label><input type="text" name="street" required value={formData.street} onChange={handleChange} className={inputClass} placeholder="Street, Building, Area" /></div>
                            <div><label className={labelClass}>State <span className="text-red-500">*</span></label><select name="state" required value={formData.state} onChange={handleChange} className={inputClass}><option value="">Select State</option>{Object.keys(geographyData).sort().map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                            <div><label className={labelClass}>City / District <span className="text-red-500">*</span></label><select name="city" required value={formData.city} onChange={handleChange} className={inputClass} disabled={!formData.state}><option value="">Select District</option>{availableCities.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                             <div><label className={labelClass}>PIN Code <span className="text-red-500">*</span></label><input type="text" name="pinCode" required value={formData.pinCode} onChange={handleChange} className={inputClass} placeholder="6-digit PIN" /></div>
                             <div><label className={labelClass}>Google Maps URL</label><input type="url" name="googleMapsUrl" value={formData.googleMapsUrl} onChange={handleChange} className={inputClass} placeholder="Paste Maps link" /></div>
                             <div className="md:col-span-2"><label className={labelClass}>Insurance Providers</label><input type="text" name="insuranceProviders" value={formData.insuranceProviders} onChange={handleChange} className={inputClass} placeholder="Star, HDFC, etc. (Comma separated)" /></div>
                            
                            <div className="md:col-span-2 pt-4 border-t border-slate-100">
                                <label className={labelClass}>Official Contact Numbers</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div><label className={labelClass}>Official Phone <span className="text-red-500">*</span></label><input type="tel" name="officialPhone" required value={formData.officialPhone} onChange={handleChange} className={inputClass} placeholder="Primary" /></div>
                                    <div><label className={labelClass}>Alternate Phone</label><input type="tel" name="officialAlternatePhone" value={formData.officialAlternatePhone} onChange={handleChange} className={inputClass} placeholder="Optional" /></div>
                                    <div><label className={labelClass}>Emergency 24/7 <span className="text-red-500">*</span></label><input type="tel" name="emergencyPhone" required value={formData.emergencyPhone} onChange={handleChange} className={inputClass} placeholder="Critical Care" /></div>
                                </div>
                            </div>
                        </div>
                      </div>

                      {/* Section 4: Infrastructure & Authority */}
                      <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                      {/* Section 4: Clinical Departments & Services */}
                      <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                        <h3 className={sectionHeadClass}><Activity size={16} /> 5. Clinical Specialities & Services</h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className={labelClass}>Medical Departments <span className="text-red-500">*</span></label>
                                <p className="text-[9px] text-slate-400 mb-4 uppercase font-bold tracking-widest">Select all active departments in your facility</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {HospitalDepartments.map(dept => {
                                        const isSelected = formData.departments.split(', ').includes(dept);
                                        return (
                                            <button
                                                key={dept}
                                                type="button"
                                                onClick={() => {
                                                    const current = formData.departments ? formData.departments.split(', ').filter(s => s) : [];
                                                    const updated = isSelected 
                                                        ? current.filter(s => s !== dept)
                                                        : [...current, dept];
                                                    setFormData({...formData, departments: updated.join(', ')});
                                                }}
                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all text-left ${
                                                    isSelected 
                                                    ? 'bg-blue-50 border-blue-200 text-blue-600' 
                                                    : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                                                }`}
                                            >
                                                <div className={`w-3 h-3 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200'}`}>
                                                    {isSelected && <Check size={8} />}
                                                </div>
                                                {dept}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <label className={labelClass}>Clinical & Diagnostic Services</label>
                                <p className="text-[9px] text-slate-400 mb-4 uppercase font-bold tracking-widest">Select facilities available for patients</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {PREDEFINED_HOSPITAL_SERVICES.map(service => {
                                        const isSelected = formData.services.split(', ').includes(service);
                                        return (
                                            <button
                                                key={service}
                                                type="button"
                                                onClick={() => {
                                                    const current = formData.services ? formData.services.split(', ').filter(s => s) : [];
                                                    const updated = isSelected 
                                                        ? current.filter(s => s !== service)
                                                        : [...current, service];
                                                    setFormData({...formData, services: updated.join(', ')});
                                                }}
                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all text-left ${
                                                    isSelected 
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                                    : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                                                }`}
                                            >
                                                <div className={`w-3 h-3 rounded border flex items-center justify-center ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200'}`}>
                                                    {isSelected && <Check size={8} />}
                                                </div>
                                                {service}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Medical Director Details</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className={labelClass}>Director Full Name <span className="text-red-500">*</span></label><input type="text" name="medicalDirectorName" required value={formData.medicalDirectorName} onChange={handleChange} className={inputClass} placeholder="Chief Medical Officer" /></div>
                                <div><label className={labelClass}>Highest Qualification <span className="text-red-500">*</span></label><input type="text" name="medicalDirectorQualification" required value={formData.medicalDirectorQualification} onChange={handleChange} className={inputClass} placeholder="MD, FRCS, etc." /></div>
                                <div><label className={labelClass}>Medical Reg Number <span className="text-red-500">*</span></label><input type="text" name="medicalDirectorRegNumber" required value={formData.medicalDirectorRegNumber} onChange={handleChange} className={inputClass} placeholder="State Council Reg" /></div>
                                <div><label className={labelClass}>Authority Email <span className="text-red-500">*</span></label><input type="email" name="medicalDirectorEmail" required value={formData.medicalDirectorEmail} onChange={handleChange} className={inputClass} placeholder="director@hospital.com" /></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                            <div><label className={labelClass}>Total Beds <span className="text-red-500">*</span></label><input type="number" name="totalBeds" required value={formData.totalBeds} onChange={handleChange} className={inputClass} /></div>
                            <div><label className={labelClass}>Doctor Count <span className="text-red-500">*</span></label><input type="number" name="doctorCount" required value={formData.doctorCount} onChange={handleChange} className={inputClass} /></div>
                            <div><label className={labelClass}>Nurses <span className="text-red-500">*</span></label><input type="number" name="nurseCount" required value={formData.nurseCount} onChange={handleChange} className={inputClass} /></div>
                            <div><label className={labelClass}>Support Staff <span className="text-red-500">*</span></label><input type="number" name="generalStaffCount" required value={formData.generalStaffCount} onChange={handleChange} className={inputClass} /></div>
                            
                            <div><label className={labelClass}>ICU Beds</label><input type="number" name="icuBeds" value={formData.icuBeds} onChange={handleChange} className={inputClass} placeholder="0" /></div>
                            <div><label className={labelClass}>OT Count</label><input type="number" name="operationTheatersCount" value={formData.operationTheatersCount} onChange={handleChange} className={inputClass} placeholder="0" /></div>
                            <div><label className={labelClass}>Ambulances</label><input type="number" name="ambulanceCount" value={formData.ambulanceCount} onChange={handleChange} className={inputClass} placeholder="0" /></div>

                            <div className="pt-4"><label className={labelClass}>ICU Available</label><select name="icuAvailable" value={formData.icuAvailable} onChange={handleChange} className={inputClass}><option value="false">No</option><option value="true">Yes</option></select></div>
                            <div className="pt-4"><label className={labelClass}>Ambulance</label><select name="ambulanceAvailable" value={formData.ambulanceAvailable} onChange={handleChange} className={inputClass}><option value="false">No</option><option value="true">Yes</option></select></div>
                            <div className="md:col-span-2"><label className={labelClass}>Timezone</label><select name="timezone" value={formData.timezone} onChange={handleChange} className={inputClass}><option value="Asia/Kolkata">India (IST)</option><option value="UTC">UTC</option></select></div>
                            <div className="md:col-span-2"><label className={labelClass}>Working Hours</label><input type="text" name="workingHours" value={formData.workingHours} onChange={handleChange} className={inputClass} placeholder="e.g. 24/7" /></div>
                        </div>
                      </div>
                      </div>

                      {/* Section 5: Administrator Details */}
                      <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                        <h3 className={sectionHeadClass}><User size={16} /> 6. Institutional Administrator</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className={labelClass}>Admin Full Name <span className="text-red-500">*</span></label><input type="text" name="adminName" required value={formData.adminName} onChange={handleChange} className={inputClass} placeholder="John Doe" /></div>
                            <div><label className={labelClass}>Admin Role <span className="text-red-500">*</span></label>
                                <select name="adminRole" required value={formData.adminRole} onChange={handleChange} className={inputClass}>
                                    <option value="">Select Role</option><option value="Owner">Owner</option><option value="Manager">Manager</option><option value="IT Admin">IT Admin</option>
                                </select>
                            </div>
                            <div><label className={labelClass}>Admin Contact Number <span className="text-red-500">*</span></label><input type="tel" name="adminContact" required value={formData.adminContact} onChange={handleChange} className={inputClass} placeholder="Personal Phone" /></div>
                            <div><label className={labelClass}>Admin ID Proof (Aadhar/PAN)</label><DocumentUpload onFileSelect={setAdminIdProof} label="Upload ID Proof" /></div>
                        </div>
                        <div className="flex flex-col items-center gap-4 py-4"><label className={labelClass}>Admin Profile Photo</label><ProfilePhotoUpload onFileSelect={setProfilePicture} /></div>
                      </div>

                      {/* Section 6: Trust Factor & Verification */}
                      <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                        <h3 className={sectionHeadClass}><ClipboardList size={16} /> 7. Verification Documents</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4"><label className={labelClass}>Registration Certificate <span className="text-red-500">*</span></label><DocumentUpload onFileSelect={setRegistrationCertificate} label="Upload Certificate" /></div>
                            <div className="space-y-4"><label className={labelClass}>NABH / NABL (Optional)</label><DocumentUpload onFileSelect={setNabhCertificate} label="Upload NABH" /></div>
                            <div className="space-y-4"><label className={labelClass}>Tax / GST Certificate</label><DocumentUpload onFileSelect={setTaxCertificate} label="Upload Tax Doc" /></div>
                            <div className="space-y-4"><label className={labelClass}>Address Proof (Utility Bill)</label><DocumentUpload onFileSelect={setAddressProof} label="Upload Address Proof" /></div>
                        </div>
                      </div>

                      {/* Section 7: Digital Capabilities & Financials */}
                      <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                        <h3 className={sectionHeadClass}><Globe size={16} /> 8. Capabilities & Settlement</h3>
                        
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { name: 'hasEhr', label: 'EHR System' },
                                    { name: 'hasPacs', label: 'PACS (X-Ray)' },
                                    { name: 'hasLabIntegration', label: 'Lab Integration' },
                                    { name: 'telemedicineEnabled', label: 'Telemedicine' }
                                ].map(tech => (
                                    <label key={tech.name} className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-primary-50 transition-colors">
                                        <input type="checkbox" name={tech.name} checked={formData[tech.name]} onChange={(e) => setFormData({...formData, [tech.name]: e.target.checked})} className="h-5 w-5 rounded border-slate-200 text-primary-600" />
                                        <span className="text-[10px] font-black uppercase text-slate-500 text-center">{tech.label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-slate-100 space-y-6">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Banking & Automated Payouts</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-1">
                                        <label className={labelClass}>Razorpay Account ID</label>
                                        <input type="text" name="razorpayAccountId" value={formData.razorpayAccountId} onChange={handleChange} className={`${inputClass} font-mono`} placeholder="acc_XXXXXXXXXXXXXX" />
                                        <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Your institutional linked account ID for automated payouts</p>
                                    </div>
                                    <div className="md:col-span-2"><label className={labelClass}>Primary UPI ID</label><input type="text" name="upiId" value={formData.upiId} onChange={handleChange} className={inputClass} placeholder="hospital@upi" /></div>
                                    <div className="md:col-span-2 space-y-4">
                                        <label className={labelClass}>Preferred Institutional Payout Mode</label>
                                        <div className="grid grid-cols-3 gap-4">
                                            {[
                                                { id: 'RAZORPAY', label: 'Razorpay', icon: CreditCard },
                                                { id: 'UPI', label: 'Direct UPI', icon: Activity },
                                                { id: 'BOTH', label: 'Dual Mode', icon: CheckCircle }
                                            ].map(mode => (
                                                <button
                                                    key={mode.id}
                                                    type="button"
                                                    onClick={() => setFormData({...formData, preferredPaymentMode: mode.id})}
                                                    className={`flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all duration-300 ${
                                                        formData.preferredPaymentMode === mode.id
                                                            ? 'bg-primary-50/50 border-primary-500 text-primary-600 shadow-lg shadow-primary-500/10'
                                                            : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <mode.icon size={20} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{mode.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                      </div>

                      {/* Section 8: Final Compliance & Account Security */}
                      <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                        <h3 className={sectionHeadClass}><Lock size={16} /> 9. Compliance & Account Security</h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className={labelClass}>Username / Clinical ID <span className="text-red-500">*</span></label>
                                <input type="text" name="username" required value={formData.username} onChange={handleChange} className={`${inputClass} font-bold text-primary-600 bg-primary-50/30`} placeholder="Your unique access ID" />
                                <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-widest">This will be your primary identifier for portal access</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <label className={labelClass}>Set Administrator Password <span className="text-red-500">*</span></label>
                                    <input type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} className={inputClass} placeholder="Access credentials" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-10 text-slate-400">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                </div>
                                <div className="relative">
                                    <label className={labelClass}>Confirm Password <span className="text-red-500">*</span></label>
                                    <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className={inputClass} />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-10 text-slate-400">{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <input type="checkbox" required checked={formData.termsAccepted} onChange={(e) => setFormData({...formData, termsAccepted: e.target.checked})} className="mt-1 h-5 w-5 rounded border-blue-200 text-primary-600" />
                                <label className="text-xs text-slate-600 font-medium">I agree to the <span className="text-primary-600 underline">Terms & Conditions</span> and <span className="text-primary-600 underline">Privacy Policy</span>. <span className="text-red-500">*</span></label>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <input type="checkbox" required checked={formData.consentAccepted} onChange={(e) => setFormData({...formData, consentAccepted: e.target.checked})} className="mt-1 h-5 w-5 rounded border-blue-200 text-primary-600" />
                                <label className="text-xs text-slate-600 font-medium">I provide explicit consent for clinical data processing in accordance with digital health standards. <span className="text-red-500">*</span></label>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-primary-700 shadow-2xl shadow-primary-200 transition-all active:scale-95 disabled:opacity-50">
                            {loading ? 'Finalizing Enrollment...' : 'Complete Institutional Registration'}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                  {role === 'ROLE_DOCTOR' && (
                    <>
                      <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                      <h3 className={sectionHeadClass}><CreditCard size={16} /> 7. Banking & Settlement</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className={labelClass}>Bank Name <span className="text-red-500">*</span></label><input type="text" name="bankName" required value={formData.bankName} onChange={handleChange} className={inputClass} placeholder="e.g. HDFC Bank" /></div>
                        <div><label className={labelClass}>Account Number <span className="text-red-500">*</span></label><input type="text" name="bankAccountNumber" required value={formData.bankAccountNumber} onChange={handleChange} className={inputClass} placeholder="0000 0000 0000" /></div>
                        <div><label className={labelClass}>IFSC Code <span className="text-red-500">*</span></label><input type="text" name="ifscCode" required value={formData.ifscCode} onChange={handleChange} className={inputClass} placeholder="HDFC0001234" /></div>
                        <div><label className={labelClass}>Primary UPI ID</label><input type="text" name="upiId" value={formData.upiId} onChange={handleChange} className={inputClass} placeholder="doctor@upi" /></div>
                        <div className="md:col-span-2 space-y-4">
                          <label className={labelClass}>Preferred Payout Rail</label>
                          <div className="grid grid-cols-3 gap-4">
                            {[
                              { id: 'RAZORPAY', label: 'Razorpay', icon: CreditCard },
                              { id: 'UPI', label: 'Direct UPI', icon: Activity },
                              { id: 'BOTH', label: 'Dual Mode', icon: CheckCircle }
                            ].map(mode => (
                              <button
                                key={mode.id}
                                type="button"
                                onClick={() => setFormData({...formData, preferredPaymentMode: mode.id})}
                                className={`flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all duration-300 ${
                                  formData.preferredPaymentMode === mode.id
                                    ? 'bg-blue-50/50 border-blue-500 text-blue-600 shadow-lg shadow-blue-500/10'
                                    : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
                                }`}
                              >
                                <mode.icon size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{mode.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-blue-50 shadow-sm space-y-8">
                      <h3 className={sectionHeadClass}><Lock size={16} /> 8. Account Security & Finalization</h3>
                      <div className="space-y-6">
                        <div>
                          <label className={labelClass}>Username / Clinical Access ID <span className="text-red-500">*</span></label>
                          <input type="text" name="username" required value={formData.username} onChange={handleChange} className={`${inputClass} font-bold text-primary-600 bg-primary-50/30`} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="relative">
                            <label className={labelClass}>Create Password <span className="text-red-500">*</span></label>
                            <input type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} className={inputClass} placeholder="Secure your professional node" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-10 text-slate-400">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                          </div>
                          <div className="relative">
                            <label className={labelClass}>Confirm Password <span className="text-red-500">*</span></label>
                            <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className={inputClass} />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-10 text-slate-400">{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                          </div>
                        </div>
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-primary-700 shadow-2xl shadow-primary-200 transition-all active:scale-95 disabled:opacity-50">
                        {loading ? 'Completing Enrollment...' : 'Finalize Physician Registration'}
                      </button>
                      </div>
                    </>
                  )}
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
