import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { toast } from 'react-hot-toast';
import {
  User, Stethoscope, BadgeCheck, GraduationCap, Building2,
  Clock, Activity, Save, ArrowLeft, Mail, Phone, Calendar,
  CheckCircle, AlertCircle, Video, Briefcase, Camera, Upload, Target, Navigation, MapPin,
  Wallet, CreditCard
} from 'lucide-react';
import ClinicMap from '../components/ClinicMap';

const EditDoctorProfile = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionStep, setDeletionStep] = useState(1);
  const [deletionOtp, setDeletionOtp] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [photoPreview, setPhotoPreview] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    specialization: '',
    medicalDegree: '',
    medicalLicenseNumber: '',
    medicalCouncil: '',
    licenseExpiryDate: '',
    registrationYear: '',
    subSpecialties: '',
    proceduresHandled: '',
    treatmentFocus: '',
    languagesSpoken: '',
    publications: '',
    hospital: '',
    yearsOfExperience: '',
    workingDays: '',
    consultationTimings: '',
    slotDuration: 15,
    maxPatientsPerDay: '',
    breakTimings: '',
    onlineConsultation: false,
    college: '',
    additionalCertifications: '',
    onlineConsultationFee: '',
    offlineConsultationFee: '',
    clinicAddress: '',
    razorpayAccountId: '',
    upiId: '',
    preferredPaymentMode: 'RAZORPAY',
    appointmentsEnabled: true,
    startTime: '09:00',
    endTime: '17:00'
  });

  const convertTo24Hour = (timeStr) => {
    if (!timeStr) return "09:00";
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    
    try {
      const cleaned = timeStr.replace('.', ':').trim();
      const [time, modifier] = cleaned.split(' ');
      let [hours, minutes] = time.split(':');
      if (hours === '12') hours = modifier === 'PM' ? '12' : '00';
      else if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } catch (e) {
      return "09:00";
    }
  };

  useEffect(() => {
    if (user) {
      const [rawStart, rawEnd] = (user.consultationTimings?.split(' - ')) || ['09:00', '17:00'];
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        alternatePhone: user.alternatePhone || '',
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth || '',
        age: user.age || '',
        specialization: user.specialization || '',
        medicalDegree: user.medicalDegree || '',
        medicalLicenseNumber: user.medicalLicenseNumber || '',
        medicalCouncil: user.medicalCouncil || '',
        licenseExpiryDate: user.licenseExpiryDate || '',
        registrationYear: user.registrationYear || '',
        subSpecialties: user.subSpecialties || '',
        proceduresHandled: user.proceduresHandled || '',
        treatmentFocus: user.treatmentFocus || '',
        languagesSpoken: user.languagesSpoken || '',
        publications: user.publications || '',
        hospital: user.hospital || '',
        yearsOfExperience: user.yearsOfExperience || '',
        workingDays: user.workingDays || '',
        consultationTimings: user.consultationTimings || '',
        slotDuration: user.slotDuration || 15,
        maxPatientsPerDay: user.maxPatientsPerDay || '',
        breakTimings: user.breakTimings || '',
        onlineConsultation: user.onlineConsultation || false,
        college: user.college || '',
        additionalCertifications: user.additionalCertifications || '',
        onlineConsultationFee: user.onlineConsultationFee || '',
        offlineConsultationFee: user.offlineConsultationFee || '',
        clinicAddress: user.clinicAddress || '',
        razorpayAccountId: user.razorpayAccountId || '',
        upiId: user.upiId || '',
        preferredPaymentMode: user.preferredPaymentMode || 'RAZORPAY',
        appointmentsEnabled: user.appointmentsEnabled !== false,
        startTime: convertTo24Hour(rawStart),
        endTime: convertTo24Hour(rawEnd),
      });
      setPhotoPreview(`${api.defaults.baseURL}/auth/doctor/photo/${user.id}?t=${Date.now()}`);
    }
  }, [user]);

  // ── Google Maps Autocomplete ──
  const addressInputRef = useRef(null);
  const hospitalInputRef = useRef(null);
  const addressAutocompleteRef = useRef(null);
  const hospitalAutocompleteRef = useRef(null);

  useEffect(() => {
    // Load Google Maps script dynamically
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initAutocomplete();
      document.head.appendChild(script);
    } else {
      initAutocomplete();
    }

    function initAutocomplete() {
      if (addressInputRef.current) {
        addressAutocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'IN' }
        });

        addressAutocompleteRef.current.addListener('place_changed', () => {
          const place = addressAutocompleteRef.current.getPlace();
          if (place.formatted_address) {
            setFormData(prev => ({ ...prev, clinicAddress: place.formatted_address }));
          }
        });
      }

      if (hospitalInputRef.current) {
        hospitalAutocompleteRef.current = new window.google.maps.places.Autocomplete(hospitalInputRef.current, {
          types: ['establishment'],
          componentRestrictions: { country: 'IN' }
        });

        hospitalAutocompleteRef.current.addListener('place_changed', () => {
          const place = hospitalAutocompleteRef.current.getPlace();
          if (place.name) {
            setFormData(prev => ({ 
              ...prev, 
              hospital: place.name,
              clinicAddress: place.formatted_address || prev.clinicAddress 
            }));
          }
        });
      }
    }
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    
    // Safety check: ensure Google Maps is loaded
    if (!window.google) {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.onload = () => actualGetLocation();
        document.head.appendChild(script);
        return;
      }
    }
    
    actualGetLocation();
  };

  const actualGetLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        if (!window.google) {
          try {
            const nomRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              { headers: { 'Accept-Language': 'en' } }
            );
            const nomData = await nomRes.json();
            if (nomData && nomData.display_name) {
              // Extract facility name if available (hospital, clinic, etc.)
              const address = nomData.address;
              const facility = address.hospital || address.clinic || address.doctors || address.amenity || address.building;
              const fullAddress = facility ? `${facility}, ${nomData.display_name}` : nomData.display_name;
              
              setFormData(prev => ({ 
                ...prev, 
                clinicAddress: fullAddress,
                hospital: facility || prev.hospital // Auto-fill hospital name too
              }));
              toast.success("Full clinical location synchronized.");
              setLoading(false);
              return;
            }
          } catch (nomErr) {
            console.error("Nominatim fallback failed", nomErr);
          }
          
          toast.error("Location resolution failed. Please enter manually.");
          setLoading(false);
          return;
        }

        const geocoder = new window.google.maps.Geocoder();
        const latlng = { lat: latitude, lng: longitude };

        try {
          const response = await geocoder.geocode({ location: latlng });
          if (response.results[0]) {
            const result = response.results[0];
            // Look for a 'point_of_interest' or 'establishment' type to get the name
            let facilityName = "";
            const poiResult = response.results.find(res => res.types.includes('point_of_interest') || res.types.includes('establishment'));
            if (poiResult && poiResult.name && !result.formatted_address.includes(poiResult.name)) {
                facilityName = poiResult.name;
            }

            const finalAddress = facilityName ? `${facilityName}, ${result.formatted_address}` : result.formatted_address;
            
            setFormData(prev => ({ 
                ...prev, 
                clinicAddress: finalAddress,
                hospital: facilityName || prev.hospital
            }));
            toast.success("Digital address synchronized via GPS!");
          } else {
            toast.error("No address found for these coordinates.");
          }
        } catch (e) {
          console.error("Google Geocoder failed", e);
          toast.error("Mapping failed. Please enter manually.");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        let errorMsg = "Unable to retrieve location.";
        if (error.code === 1) errorMsg = "Location permission denied by browser.";
        else if (error.code === 2) errorMsg = "GPS signal lost or unavailable.";
        else if (error.code === 3) errorMsg = "Location request timed out.";
        
        toast.error(errorMsg);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);

    setPhotoLoading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      await api.post('doctor/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await refreshUser();
      setMessage({ type: 'success', text: 'Professional photo updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to upload photo.' });
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleDayToggle = (day) => {
    const currentDays = formData.workingDays ? formData.workingDays.split(', ').filter(d => d) : [];
    const newDays = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day];
    
    // Sort days to keep them in order
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const sortedDays = newDays.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    
    setFormData(prev => ({ ...prev, workingDays: sortedDays.join(', ') }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Format timings for backend
    const submissionData = {
        ...formData,
        consultationTimings: `${formData.startTime} - ${formData.endTime}`
    };
    
    // VALIDATION: Required Fields for Active Consultations
    const isActive = formData.appointmentsEnabled || formData.onlineConsultation;
    if (isActive) {
      if (!formData.hospital) {
        toast.error("Facility Name is required.");
        setLoading(false);
        return;
      }
      if (!formData.workingDays) {
        toast.error("Working Days are required.");
        setLoading(false);
        return;
      }
      if (formData.appointmentsEnabled && !formData.clinicAddress) {
        toast.error("Clinic Address is required for offline appointments.");
        setLoading(false);
        return;
      }
    }

    // Safety timeout: stop loading state after 10 seconds if no response
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        toast.error("Update taking longer than expected. Please check your connection.");
      }
    }, 10000);

    try {
      await api.post('doctor/profile/sync', submissionData);
      clearTimeout(timeout);
      await refreshUser();
      setMessage({ type: 'success', text: 'Professional profile updated successfully!' });
      window.scrollTo(0, 0);
      setTimeout(() => navigate('/doctor-dashboard/profile'), 1500);
    } catch (err) {
      clearTimeout(timeout);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    try {
      await api.post('/auth/request-deletion-otp', { email: user?.email });
      toast.success("Security code sent to your professional email");
      setDeletionStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate deletion");
    }
  };

  const handleConfirmDeletion = async () => {
    if (!deletionOtp) return toast.error("Please enter the verification code");
    setIsDeleting(true);
    try {
      await api.post('/auth/confirm-account-deletion', { 
        email: user?.email, 
        otp: deletionOtp 
      });
      toast.success("Account permanently removed. Redirecting...");
      setTimeout(() => {
        logout();
        navigate('/');
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const sectionClass = "bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase mb-2 ml-1 tracking-wide";
  const inputClass = "block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-4 py-3 border transition-all bg-slate-50/50 hover:bg-white focus:bg-white";
  const readOnlyInputClass = "block w-full rounded-xl border-slate-100 shadow-none text-sm px-4 py-3 border transition-all bg-slate-100/50 text-slate-500 cursor-not-allowed font-medium";
  const sectionTitleClass = "flex items-center gap-2 text-md font-bold text-slate-800 border-b border-slate-100 pb-4 mb-2";

  const isAffiliated = !!user?.institutional;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/doctor-dashboard/profile')} className="flex items-center text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium mb-2">
            <ArrowLeft size={16} className="mr-1" /> Back to Profile
          </button>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Professional Profile Editor</h2>
          <p className="text-slate-500 text-sm">Keep your professional credentials up to date for patients</p>
        </div>
      </div>

      {isAffiliated && (
        <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-3xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                <AlertCircle size={24} />
            </div>
            <div>
                <h4 className="font-black text-amber-900 uppercase tracking-tight italic">Institutional Governance Active</h4>
                <p className="text-sm text-amber-700 font-medium mt-1">
                    Your core credentials (ID, Phone, Degree) are managed by <span className="font-bold underline">{user.hospital}</span>. 
                    However, you retain full sovereignty over your <span className="font-bold">Clinical Depth</span> and <span className="font-bold">Research Publications</span>.
                </p>
            </div>
        </div>
      )}

      {message.text && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-semibold text-sm">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`space-y-8`}>
        
        {/* ── Photo Section ── */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center">
            <div className="relative group">
                <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100 flex items-center justify-center">
                    {photoPreview ? (
                        <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
                    ) : (
                        <User size={48} className="text-slate-300" />
                    )}
                    {photoLoading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                            <Activity className="animate-spin text-blue-600" size={24} />
                        </div>
                    )}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-3 rounded-2xl shadow-lg cursor-pointer hover:bg-blue-700 transition-all hover:scale-110 active:scale-95">
                    <Camera size={20} />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={photoLoading} />
                </label>
            </div>
            <div className="mt-4 text-center">
                <p className="text-sm font-bold text-slate-700">Medical Professional Photo</p>
                <p className="text-xs text-slate-500 mt-1">Upload a clear professional picture for your profile</p>
            </div>
        </div>
        
        {/* ── Section 1: Professional Identity & Expertise ── */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}><Stethoscope className="text-blue-600" size={20} /> Professional Identity & Expertise</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Medical Specialization</label>
              <input type="text" name="specialization" value={formData.specialization} readOnly className={readOnlyInputClass} placeholder="e.g. Cardiologist" />
            </div>
            <div>
              <label className={labelClass}>Sub-Specialties</label>
              <input type="text" name="subSpecialties" value={formData.subSpecialties} onChange={handleChange} className={inputClass} placeholder="e.g. Diabetes, Hypertension" />
            </div>
            <div>
              <label className={labelClass}>Medical Degree</label>
              <input type="text" name="medicalDegree" value={formData.medicalDegree} readOnly className={readOnlyInputClass} placeholder="e.g. MBBS, MD" />
            </div>
            <div>
              <label className={labelClass}>Years of Experience</label>
              <input type="number" name="yearsOfExperience" value={formData.yearsOfExperience} readOnly className={readOnlyInputClass} placeholder="e.g. 12" />
            </div>
            
            <div className="md:col-span-2 pt-4 border-t border-slate-50">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Regulatory Credentials</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className={labelClass}>Medical Council</label>
                        <input type="text" name="medicalCouncil" value={formData.medicalCouncil} readOnly className={readOnlyInputClass} placeholder="e.g. KMC" />
                    </div>
                    <div>
                        <label className={labelClass}>License Number</label>
                        <input type="text" name="medicalLicenseNumber" value={formData.medicalLicenseNumber} readOnly className={readOnlyInputClass} placeholder="e.g. REG-552311" />
                    </div>
                    <div>
                        <label className={labelClass}>License Expiry</label>
                        <input type="date" name="licenseExpiryDate" value={formData.licenseExpiryDate} readOnly className={readOnlyInputClass} />
                    </div>
                </div>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-50">
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-4">Clinical Depth</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Procedures Handled</label>
                        <textarea name="proceduresHandled" rows="2" value={formData.proceduresHandled} onChange={handleChange} className={inputClass} placeholder="e.g. Angioplasty, Stent Placement" />
                    </div>
                    <div>
                        <label className={labelClass}>Treatment Focus</label>
                        <textarea name="treatmentFocus" rows="2" value={formData.treatmentFocus} onChange={handleChange} className={inputClass} placeholder="e.g. Chronic Heart Failure" />
                    </div>
                    <div>
                        <label className={labelClass}>Languages Spoken</label>
                        <input type="text" name="languagesSpoken" value={formData.languagesSpoken} onChange={handleChange} className={inputClass} placeholder="e.g. English, Hindi, Kannada" />
                    </div>
                    <div>
                        <label className={labelClass}>Scientific Publications</label>
                        <input type="text" name="publications" value={formData.publications} onChange={handleChange} className={inputClass} placeholder="Link to research or journal" />
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Clinical Practice ── */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}><Building2 className="text-indigo-600" size={20} /> Clinical Practice & Scheduling</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className={labelClass}>
                Primary Hospital / Clinic Name
              </label>
              <input 
                type="text" 
                name="hospital" 
                value={formData.hospital} 
                readOnly
                className={readOnlyInputClass} 
                placeholder="e.g. Apollo Hospital, City Clinic" 
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className={labelClass}>Slot Size (Minutes)</label>
                    <select name="slotDuration" value={formData.slotDuration} onChange={handleChange} className={inputClass}>
                        <option value={10}>10 Minutes</option>
                        <option value={15}>15 Minutes</option>
                        <option value={30}>30 Minutes</option>
                        <option value={60}>60 Minutes</option>
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Max Daily Patients</label>
                    <input type="number" name="maxPatientsPerDay" value={formData.maxPatientsPerDay} onChange={handleChange} className={inputClass} placeholder="e.g. 40" min="0" />
                </div>
                <div>
                    <label className={labelClass}>Break Timings</label>
                    <input type="text" name="breakTimings" value={formData.breakTimings} onChange={handleChange} className={inputClass} placeholder="e.g. 13:00 - 14:00" />
                </div>
            </div>
            <div>
              <label className={labelClass}>
                Working Days
                {(formData.appointmentsEnabled || formData.onlineConsultation) && <span className="text-red-500 ml-1 font-bold">*</span>}
              </label>
              <div className="flex flex-wrap gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        formData.workingDays?.includes(day)
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>
                Consultation Timings
                {(formData.appointmentsEnabled || formData.onlineConsultation) && <span className="text-red-500 ml-1 font-bold">*</span>}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">Start</span>
                  <input 
                    type="time" 
                    name="startTime" 
                    value={formData.startTime} 
                    onChange={handleChange} 
                    className={`${inputClass} pl-14`} 
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">End</span>
                  <input 
                    type="time" 
                    name="endTime" 
                    value={formData.endTime} 
                    onChange={handleChange} 
                    className={`${inputClass} pl-14`} 
                  />
                </div>
              </div>
            </div>

            {/* Clinic Map Terminal */}
            <div className="md:col-span-2 mt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Clinic Location Hub</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 leading-none">Global Navigation Node</p>
                  </div>
                </div>
              </div>
              <ClinicMap address={formData.clinicAddress} hospitalName={formData.hospital} />
            </div>

            {/* Payment & Specific Fees */}
            <div className="md:col-span-2">
              <p className="text-sm font-bold text-blue-600 mb-4 bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-2">
                <Wallet size={18} /> Direct Payment & UPI Integration
              </p>
            </div>
            <div className="md:col-span-2">
                <label className={labelClass}>Preferred Payment Channel</label>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'RAZORPAY', label: 'Razorpay', icon: CreditCard },
                        { id: 'UPI', label: 'Direct UPI', icon: Activity },
                        { id: 'BOTH', label: 'Both / Dual', icon: CheckCircle }
                    ].map(mode => (
                        <button
                            key={mode.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, preferredPaymentMode: mode.id }))}
                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                                formData.preferredPaymentMode === mode.id
                                    ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-sm'
                                    : 'bg-white border-slate-100 text-slate-400 grayscale'
                            }`}
                        >
                            <mode.icon size={20} />
                            <span className="text-[9px] font-black uppercase tracking-widest">{mode.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div>
              <label className={labelClass}>Online Consultation Fee (INR)</label>
              <input type="number" name="onlineConsultationFee" value={formData.onlineConsultationFee} readOnly={isAffiliated} onChange={handleChange} className={isAffiliated ? readOnlyInputClass : inputClass} placeholder="e.g. 500" min="0" />
            </div>
            <div>
              <label className={labelClass}>Offline Consultation Fee (INR)</label>
              <input type="number" name="offlineConsultationFee" value={formData.offlineConsultationFee} readOnly={isAffiliated} onChange={handleChange} className={isAffiliated ? readOnlyInputClass : inputClass} placeholder="e.g. 800" min="0" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>
                Clinic Address
              </label>
              <div className="relative group/addr">
                <input 
                  type="text" 
                  name="clinicAddress" 
                  value={formData.clinicAddress} 
                  readOnly 
                  className={readOnlyInputClass} 
                  placeholder="Clinical address not set" 
                />
              </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Razorpay Linked Account ID</label>
                    <input type="text" name="razorpayAccountId" value={formData.razorpayAccountId} onChange={handleChange} className={inputClass} placeholder="acc_XXXXX..." />
                </div>
                <div>
                    <label className={labelClass}>Personal UPI ID (VPA)</label>
                    <input type="text" name="upiId" value={formData.upiId} onChange={handleChange} className={isAffiliated ? readOnlyInputClass : inputClass} readOnly={isAffiliated} placeholder="doctor@okaxis" />
                </div>
                <p className="md:col-span-2 text-[10px] text-slate-400 mt-1 ml-1 flex items-center gap-2">
                    <AlertCircle size={12} />
                    Payments will be routed based on your preferred channel. Razorpay requires account verification.
                </p>
            </div>
            <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-blue-50/50 rounded-2xl border border-blue-100 hover:bg-blue-100/50 transition-colors shadow-sm">
                    <input 
                        type="checkbox" 
                        name="appointmentsEnabled" 
                        checked={formData.appointmentsEnabled} 
                        onChange={handleChange}
                        className="w-5 h-5 text-blue-600 rounded-lg focus:ring-blue-500" 
                    />
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className={formData.appointmentsEnabled ? "text-emerald-500" : "text-slate-400"} />
                        <div>
                            <span className="block text-sm font-bold text-slate-700">Accepting New Appointments</span>
                            <span className="block text-[10px] text-slate-500">Uncheck to temporarily pause all bookings on your profile.</span>
                        </div>
                    </div>
                </label>
            </div>
            <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors">
                    <input 
                        type="checkbox" 
                        name="onlineConsultation" 
                        checked={formData.onlineConsultation} 
                        onChange={handleChange}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" 
                    />
                    <div className="flex items-center gap-2">
                        <Video size={18} className="text-blue-500" />
                        <span className="text-sm font-bold text-slate-700">Available for Online / Video Consultations</span>
                    </div>
                </label>
            </div>
          </div>
        </div>

        {/* ── Section 3: Background & Certs ── */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}><GraduationCap className="text-purple-600" size={20} /> Background & Certifications</h3>
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Medical College / University</label>
              <input type="text" name="college" value={formData.college} onChange={handleChange} className={inputClass} placeholder="e.g. AIIMS Delhi" />
            </div>
            <div>
              <label className={labelClass}>Additional Certifications</label>
              <textarea name="additionalCertifications" rows="3" value={formData.additionalCertifications} onChange={handleChange} className={inputClass} placeholder="List any fellowships or specific certifications..." />
            </div>
          </div>
        </div>

        {/* ── Section 4: Clinical Identity (Read-only) ── */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}><User className="text-slate-600" size={20} /> Clinical Identity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Legal Name</label>
              <input type="text" name="name" value={formData.name} readOnly className={readOnlyInputClass} />
            </div>
            <div>
              <label className={labelClass}>Gender Representation</label>
              <input type="text" name="gender" value={formData.gender} readOnly className={readOnlyInputClass} />
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} readOnly className={readOnlyInputClass} />
            </div>
            <div>
              <label className={labelClass}>Biological Age</label>
              <input type="text" value={formData.age ? `${formData.age} Years` : 'Not Specified'} readOnly className={readOnlyInputClass} />
            </div>
          </div>
        </div>

        {/* ── Section 5: Communication Node (Read-only) ── */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}><Mail className="text-slate-600" size={20} /> Communication Node</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Primary Interface (Email)</label>
              <input type="text" value={user?.email || ''} readOnly className={readOnlyInputClass} />
            </div>
            <div>
                <label className={labelClass}>Emergency Contact (Phone)</label>
                <input type="tel" name="phone" value={formData.phone} readOnly className={readOnlyInputClass} />
            </div>
            <div>
                <label className={labelClass}>Secondary Terminal (Alt. Phone)</label>
                <input type="tel" name="alternatePhone" value={formData.alternatePhone} readOnly className={readOnlyInputClass} />
            </div>
          </div>
        </div>

        {/* ── Section 5: Institutional Human Resources (Read Only) ── */}
        {isAffiliated && (
          <div className={`${sectionClass} border-amber-100 bg-amber-50/20`}>
            <h3 className={sectionTitleClass}><Briefcase className="text-amber-600" size={20} /> Institutional Human Resources</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Staff Identification ID</label>
                <input type="text" value={user.staffId || 'Not Assigned'} readOnly className={`${inputClass} bg-amber-50 border-amber-100 font-mono text-amber-900`} />
              </div>
              <div>
                <label className={labelClass}>Joining Date</label>
                <input type="text" value={user.joiningDate || 'Pending Records'} readOnly className={`${inputClass} bg-amber-50 border-amber-100 font-bold text-amber-900`} />
              </div>
              <div>
                <label className={labelClass}>Contract Status</label>
                <input type="text" value={user.contractType || 'NOT_DEFINED'} readOnly className={`${inputClass} bg-amber-50 border-amber-100 font-black text-amber-900 uppercase tracking-widest`} />
              </div>
              <div>
                <label className={labelClass}>Institutional Compensation</label>
                <input type="text" value={user.salary ? `₹ ${user.salary}` : 'Confidential'} readOnly className={`${inputClass} bg-amber-50 border-amber-100 font-bold text-amber-900`} />
              </div>
            </div>
            <p className="text-[10px] text-amber-600 font-medium italic mt-2">
              Note: The above parameters are managed exclusively by your Hospital Administrator.
            </p>
          </div>
        )}

        <div className="sticky bottom-8 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-10 py-5 rounded-3xl shadow-2xl transition-all active:scale-95 disabled:opacity-50 ${loading ? 'cursor-not-allowed' : 'hover:shadow-blue-300'}`}
          >
            {loading ? (
              <><Activity className="animate-spin" size={20} /> Saving Credentials...</>
            ) : (
              <><Save size={20} /> Update Professional Profile</>
            )}
          </button>
        </div>

      </form>

      {/* Danger Zone */}
      {!isAffiliated && (
        <div className="mt-16 pt-12 border-t border-slate-200">
            <div className="bg-red-50 rounded-[2.5rem] p-10 border border-red-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 -mr-32 -mt-32 rounded-full blur-3xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="text-left">
                        <h3 className="text-2xl font-black text-red-900 uppercase tracking-tight italic">Permanent <span className="not-italic">Deletion Zone</span></h3>
                        <p className="text-sm text-red-700/70 font-medium mt-2 max-w-xl">
                            Deleting your account will permanently remove your medical profile, clinical archives, schedule data, and patient records. This action is irreversible.
                        </p>
                    </div>
                    <button 
                        onClick={() => setShowDeleteModal(true)}
                        className="px-10 py-5 bg-red-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all hover:scale-105 active:scale-95"
                    >
                        Delete My Professional Account
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Deletion Modal */}
      {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden border border-red-100 animate-in zoom-in-95 duration-300">
                  <div className="p-10 text-center">
                      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                          <AlertCircle size={40} />
                      </div>
                      
                      {deletionStep === 1 ? (
                          <>
                              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic mb-4">Security <span className="not-italic text-red-600">Verification</span></h3>
                              <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                                  To protect your professional identity, we must send a high-security verification code to: <br/>
                                  <span className="font-bold text-slate-900">{user?.email}</span>
                              </p>
                              <div className="flex gap-4">
                                  <button 
                                      onClick={() => setShowDeleteModal(false)}
                                      className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                  >
                                      Cancel
                                  </button>
                                  <button 
                                      onClick={handleRequestDeletion}
                                      className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
                                  >
                                      Send Code
                                  </button>
                              </div>
                          </>
                      ) : (
                          <>
                              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic mb-4">Confirm <span className="not-italic text-red-600">Identity</span></h3>
                              <p className="text-sm text-slate-500 font-medium mb-8">Enter the 6-digit verification code sent to your email.</p>
                              
                              <input 
                                  type="text"
                                  maxLength="6"
                                  value={deletionOtp}
                                  onChange={(e) => setDeletionOtp(e.target.value)}
                                  className="w-full text-center text-4xl font-black tracking-[0.5em] py-5 bg-slate-50 border-none rounded-3xl mb-8 focus:ring-2 ring-red-100"
                                  placeholder="000000"
                              />

                              <div className="flex gap-4">
                                  <button 
                                      onClick={() => { setDeletionStep(1); setShowDeleteModal(false); }}
                                      className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                  >
                                      Back
                                  </button>
                                  <button 
                                      onClick={handleConfirmDeletion}
                                      disabled={isDeleting}
                                      className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50"
                                  >
                                      {isDeleting ? 'Wiping Node...' : 'Delete Permanently'}
                                  </button>
                              </div>
                              <button 
                                  onClick={handleRequestDeletion}
                                  className="mt-6 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
                              >
                                  Resend Code
                              </button>
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default EditDoctorProfile;
