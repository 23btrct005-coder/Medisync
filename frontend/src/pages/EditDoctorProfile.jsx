import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { toast } from 'react-hot-toast';
import {
  User, Stethoscope, BadgeCheck, GraduationCap, Building2,
  Clock, Activity, Save, ArrowLeft, Mail, Phone, Calendar,
  CheckCircle, AlertCircle, Video, Briefcase, Camera, Upload, Target, Navigation
} from 'lucide-react';

const EditDoctorProfile = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [photoPreview, setPhotoPreview] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    specialization: '',
    medicalDegree: '',
    medicalLicenseNumber: '',
    hospital: '',
    yearsOfExperience: '',
    consultationFee: '',
    workingDays: '',
    consultationTimings: '',
    onlineConsultation: false,
    college: '',
    additionalCertifications: '',
    onlineConsultationFee: '',
    offlineConsultationFee: '',
    clinicAddress: '',
    razorpayAccountId: '',
    appointmentsEnabled: true
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        alternatePhone: user.alternatePhone || '',
        specialization: user.specialization || '',
        medicalDegree: user.medicalDegree || '',
        medicalLicenseNumber: user.medicalLicenseNumber || '',
        hospital: user.hospital || '',
        yearsOfExperience: user.yearsOfExperience || '',
        consultationFee: user.consultationFee || '',
        workingDays: user.workingDays || '',
        consultationTimings: user.consultationTimings || '',
        onlineConsultation: user.onlineConsultation || false,
        college: user.college || '',
        additionalCertifications: user.additionalCertifications || '',
        onlineConsultationFee: user.onlineConsultationFee || '',
        offlineConsultationFee: user.offlineConsultationFee || '',
        clinicAddress: user.clinicAddress || '',
        razorpayAccountId: user.razorpayAccountId || '',
        appointmentsEnabled: user.appointmentsEnabled !== false // default true
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
          // Fallback to Nominatim (OpenStreetMap) if Google Maps is not loaded
          try {
            const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const nomData = await nomRes.json();
            if (nomData && nomData.display_name) {
              setFormData(prev => ({ ...prev, clinicAddress: nomData.display_name }));
              toast.success("Location detected via OpenStreetMap Fallback.");
              setLoading(false);
              return;
            }
          } catch (nomErr) {
            console.error("Nominatim fallback failed", nomErr);
          }
          
          toast.error("Google Maps library not loaded and fallback failed.");
          setLoading(false);
          return;
        }

        const geocoder = new window.google.maps.Geocoder();
        const latlng = { lat: latitude, lng: longitude };

        try {
          const response = await geocoder.geocode({ location: latlng });
          if (response.results[0]) {
            setFormData(prev => ({ ...prev, clinicAddress: response.results[0].formatted_address }));
            setMessage({ type: 'success', text: 'Clinic location synchronized via GPS!' });
          } else {
            toast.error("No results found for your location.");
          }
        } catch (e) {
          toast.error("Geocoder failed due to: " + e);
        } finally {
          setLoading(false);
        }
      },
      () => {
        toast.error("Unable to retrieve your location. Check your permissions.");
        setLoading(false);
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    console.log("Submitting Profile Update Payload:", formData);
    
    // Safety timeout: stop loading state after 10 seconds if no response
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        toast.error("Update taking longer than expected. Please check your connection.");
      }
    }, 10000);

    try {
      await api.post('doctor/profile/sync', formData);
      clearTimeout(timeout);
      await refreshUser();
      setMessage({ type: 'success', text: 'Professional profile updated successfully!' });
      window.scrollTo(0, 0);
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err) {
      clearTimeout(timeout);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const sectionClass = "bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase mb-2 ml-1 tracking-wide";
  const inputClass = "block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-4 py-3 border transition-all bg-slate-50/50 hover:bg-white focus:bg-white";
  const sectionTitleClass = "flex items-center gap-2 text-md font-bold text-slate-800 border-b border-slate-100 pb-4 mb-2";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/profile')} className="flex items-center text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium mb-2">
            <ArrowLeft size={16} className="mr-1" /> Back to Profile
          </button>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Professional Profile Editor</h2>
          <p className="text-slate-500 text-sm">Keep your professional credentials up to date for patients</p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-semibold text-sm">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
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
        
        {/* ── Section 1: Professional Identity ── */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}><Stethoscope className="text-blue-600" size={20} /> Professional Identity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Medical Specialization</label>
              <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} className={inputClass} placeholder="e.g. Cardiologist, Neurologist" required />
            </div>
            <div>
              <label className={labelClass}>Medical Degree</label>
              <input type="text" name="medicalDegree" value={formData.medicalDegree} onChange={handleChange} className={inputClass} placeholder="e.g. MBBS, MD" required />
            </div>
            <div>
              <label className={labelClass}>Medical License Number</label>
              <input type="text" name="medicalLicenseNumber" value={formData.medicalLicenseNumber} onChange={handleChange} className={inputClass} placeholder="e.g. REG-552311" required />
            </div>
            <div>
              <label className={labelClass}>Years of Experience</label>
              <input type="number" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange} className={inputClass} placeholder="e.g. 12" required />
            </div>
          </div>
        </div>

        {/* ── Section 2: Clinical Practice ── */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}><Building2 className="text-indigo-600" size={20} /> Clinical Practice</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className={labelClass}>Primary Hospital / Clinic Name (Search for your facility)</label>
              <input 
                ref={hospitalInputRef}
                type="text" 
                name="hospital" 
                value={formData.hospital} 
                onChange={handleChange} 
                className={inputClass} 
                placeholder="e.g. Apollo Hospital, City Clinic" 
              />
            </div>
            <div>
              <label className={labelClass}>Consultation Fee (INR)</label>
              <input type="text" name="consultationFee" value={formData.consultationFee} onChange={handleChange} className={inputClass} placeholder="e.g. 500" />
            </div>
            <div>
              <label className={labelClass}>Working Days</label>
              <input type="text" name="workingDays" value={formData.workingDays} onChange={handleChange} className={inputClass} placeholder="e.g. Mon-Fri" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Consultation Timings</label>
              <input type="text" name="consultationTimings" value={formData.consultationTimings} onChange={handleChange} className={inputClass} placeholder="e.g. 10:00 AM - 04:00 PM" />
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
                {!user?.clinicAddress && (
                  <button 
                    onClick={() => navigate('/edit-profile')}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
                  >
                    Add Location
                  </button>
                )}
              </div>
              <ClinicMap address={user?.clinicAddress} />
            </div>

            {/* Payment & Specific Fees */}
            <div className="md:col-span-2">
              <p className="text-sm font-bold text-blue-600 mb-4 bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-2">
                <BadgeCheck size={18} /> Direct Payment Setup
              </p>
            </div>
            <div>
              <label className={labelClass}>Online Consultation Fee (INR)</label>
              <input type="number" name="onlineConsultationFee" value={formData.onlineConsultationFee} onChange={handleChange} className={inputClass} placeholder="e.g. 500" />
            </div>
            <div>
              <label className={labelClass}>Offline Consultation Fee (INR)</label>
              <input type="number" name="offlineConsultationFee" value={formData.offlineConsultationFee} onChange={handleChange} className={inputClass} placeholder="e.g. 800" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Clinic Address (Search or use current location)</label>
              <div className="relative group/addr">
                <input 
                  ref={addressInputRef}
                  type="text" 
                  name="clinicAddress" 
                  value={formData.clinicAddress} 
                  onChange={handleChange} 
                  className={`${inputClass} pr-14`} 
                  placeholder="Start typing your clinic address..." 
                />
                <button 
                  type="button"
                  onClick={handleGetLocation}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-90 flex items-center justify-center group/loc"
                  title="Detect my current location"
                >
                  <Target size={18} className="group-hover/loc:animate-pulse" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 ml-1 italic flex items-center gap-1">
                 <Navigation size={10} /> Use the target icon to automatically fetch your current clinic address via GPS.
              </p>
            </div>
            <div className="md:col-span-2">
                <label className={labelClass}>Razorpay Linked Account ID (for Direct Payments)</label>
                <input type="text" name="razorpayAccountId" value={formData.razorpayAccountId} onChange={handleChange} className={inputClass} placeholder="acc_XXXXX..." />
                <p className="text-[10px] text-slate-400 mt-1 ml-1">Payments will be routed directly to this account via Razorpay Route.</p>
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

        {/* ── Section 4: Contact (Sync) ── */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}><User className="text-slate-600" size={20} /> General Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email (Read-only)</label>
              <input type="text" value={user?.email || ''} readOnly className={`${inputClass} bg-slate-100 cursor-not-allowed`} />
            </div>
            <div>
                <label className={labelClass}>Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} maxLength="10" />
            </div>
            <div>
                <label className={labelClass}>Alternate Phone</label>
                <input type="tel" name="alternatePhone" value={formData.alternatePhone} onChange={handleChange} className={inputClass} maxLength="10" />
            </div>
          </div>
        </div>

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
    </div>
  );
};

export default EditDoctorProfile;
