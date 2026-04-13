import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import {
  User, ShieldCheck, Heart, Activity, Save, ArrowLeft,
  Mail, Phone, MapPin, Droplet, Calendar, AlertCircle,
  CheckCircle, Pill, Stethoscope, Scissors, GraduationCap,
  Camera, Upload
} from 'lucide-react';

const EditProfile = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [photoPreview, setPhotoPreview] = useState(null);

  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    phone: '',
    alternatePhone: '',
    street: '',
    city: '',
    state: '',
    pinCode: '',
    bloodGroup: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',

    // Insurance
    insuranceProvider: '',
    policyNumber: '',
    insuranceValidity: '',

    // Lifestyle
    smokingStatus: '',
    alcoholStatus: '',
    exerciseFrequency: '',

    // Advanced Medical
    familyMedicalHistory: '',
    organDonorStatus: '',
    allergies: '',
    existingDiseases: '',
    currentMedications: '',
    pastSurgeries: '',
    medicalInfo: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        alternatePhone: user.alternatePhone || '',
        street: user.street || '',
        city: user.city || '',
        state: user.state || '',
        pinCode: user.pinCode || '',
        bloodGroup: user.bloodGroup || '',
        emergencyContactName: user.emergencyContactName || '',
        emergencyContactRelationship: user.emergencyContactRelationship || '',
        emergencyContactPhone: user.emergencyContactPhone || '',
        insuranceProvider: user.insuranceProvider || '',
        policyNumber: user.policyNumber || '',
        insuranceValidity: user.insuranceValidity || '',
        smokingStatus: user.smokingStatus || '',
        alcoholStatus: user.alcoholStatus || '',
        exerciseFrequency: user.exerciseFrequency || '',
        familyMedicalHistory: user.familyMedicalHistory || '',
        organDonorStatus: user.organDonorStatus || '',
        allergies: user.allergies || '',
        existingDiseases: user.existingDiseases || '',
        currentMedications: user.currentMedications || '',
        pastSurgeries: user.pastSurgeries || '',
        medicalInfo: user.medicalInfo || ''
      });
      setPhotoPreview(`${api.defaults.baseURL}/auth/patient/photo/${user.id}?t=${Date.now()}`);
    }
  }, [user]);

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
      await api.post('patient/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await refreshUser();
      setMessage({ type: 'success', text: 'Profile photo updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to upload photo.' });
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('patient/profile/sync', formData);
      await refreshUser();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      window.scrollTo(0, 0);
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const sectionClass = "bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase mb-2 ml-1 tracking-wide";
  const inputClass = "block w-full rounded-xl border-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm px-4 py-3 border transition-all bg-slate-50/50 hover:bg-white focus:bg-white";
  const sectionTitleClass = "flex items-center gap-2 text-md font-bold text-slate-800 border-b border-slate-100 pb-4 mb-2";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/profile')} className="flex items-center text-slate-500 hover:text-primary-600 transition-colors text-sm font-medium mb-2">
            <ArrowLeft size={16} className="mr-1" /> Back to Profile
          </button>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Complete Your Profile</h2>
          <p className="text-slate-500 text-sm">Enhance your clinical records for better healthcare delivery</p>
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
                            <Activity className="animate-spin text-primary-600" size={24} />
                        </div>
                    )}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-primary-600 text-white p-3 rounded-2xl shadow-lg cursor-pointer hover:bg-primary-700 transition-all hover:scale-110 active:scale-95">
                    <Camera size={20} />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={photoLoading} />
                </label>
            </div>
            <div className="mt-4 text-center">
                <p className="text-sm font-bold text-slate-700">Profile Photo</p>
                <p className="text-xs text-slate-500 mt-1">Click the camera icon to update your picture</p>
            </div>
        </div>
        
        {/* ── Section 1: Insurance Details ── */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}><ShieldCheck className="text-blue-600" size={20} /> Insurance Information ⚠️</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Insurance Provider</label>
              <input type="text" name="insuranceProvider" value={formData.insuranceProvider} onChange={handleChange} className={inputClass} placeholder="e.g. Star Health, LIC, etc." />
            </div>
            <div>
              <label className={labelClass}>Policy Number</label>
              <input type="text" name="policyNumber" value={formData.policyNumber} onChange={handleChange} className={inputClass} placeholder="e.g. POL-12345678" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Validity Date / Policy Type</label>
              <input type="text" name="insuranceValidity" value={formData.insuranceValidity} onChange={handleChange} className={inputClass} placeholder="e.g. Valid till Dec 2025" />
            </div>
          </div>
        </div>

        {/* ── Section 2: Lifestyle ── */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}><Activity className="text-emerald-600" size={20} /> Lifestyle & Habits ⚠️</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className={labelClass}>Smoking</label>
              <select name="smokingStatus" value={formData.smokingStatus} onChange={handleChange} className={inputClass}>
                <option value="">Select Option</option>
                <option value="Non-smoker">Non-smoker</option>
                <option value="Occasional">Occasional</option>
                <option value="Regular">Regular</option>
                <option value="Former Smoker">Former Smoker</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Alcohol</label>
              <select name="alcoholStatus" value={formData.alcoholStatus} onChange={handleChange} className={inputClass}>
                <option value="">Select Option</option>
                <option value="Non-drinker">Non-drinker</option>
                <option value="Social Drinker">Social Drinker</option>
                <option value="Regular">Regular</option>
                <option value="Occasional">Occasional</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Exercise</label>
              <select name="exerciseFrequency" value={formData.exerciseFrequency} onChange={handleChange} className={inputClass}>
                <option value="">Select Option</option>
                <option value="Daily">Daily</option>
                <option value="3-4 times/week">3-4 times/week</option>
                <option value="Occasionally">Occasionally</option>
                <option value="None">None / Sedentary</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Section 3: Advanced Health ── */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}><Stethoscope className="text-primary-600" size={20} /> Advanced Health Details ⚠️</h3>
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Family Medical History</label>
              <textarea name="familyMedicalHistory" rows="3" value={formData.familyMedicalHistory} onChange={handleChange} className={inputClass} placeholder="e.g. Father had hypertension, Mother has Type 2 Diabetes..." />
            </div>
            <div>
              <label className={labelClass}>Organ Donor Status</label>
              <select name="organDonorStatus" value={formData.organDonorStatus} onChange={handleChange} className={inputClass}>
                <option value="">Select Status</option>
                <option value="Yes - Registered">Yes - Registered</option>
                <option value="Interested - Not Registered">Interested - Not Registered</option>
                <option value="No">No</option>
                <option value="Undecided">Undecided</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Section 4: Clinical History ── */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}><AlertCircle className="text-red-600" size={20} /> Clinical Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}><Droplet size={14} className="inline mr-1" /> Allergies</label>
              <textarea name="allergies" rows="2" value={formData.allergies} onChange={handleChange} className={inputClass} placeholder="List any medicine or food allergies..." />
            </div>
            <div>
              <label className={labelClass}><Scissors size={14} className="inline mr-1" /> Past Surgeries</label>
              <textarea name="pastSurgeries" rows="2" value={formData.pastSurgeries} onChange={handleChange} className={inputClass} placeholder="List any major surgeries with dates..." />
            </div>
            <div>
              <label className={labelClass}><Pill size={14} className="inline mr-1" /> Current Medications</label>
              <textarea name="currentMedications" rows="2" value={formData.currentMedications} onChange={handleChange} className={inputClass} placeholder="Any daily medicines..." />
            </div>
            <div>
              <label className={labelClass}><Activity size={14} className="inline mr-1" /> Existing Diseases</label>
              <textarea name="existingDiseases" rows="2" value={formData.existingDiseases} onChange={handleChange} className={inputClass} placeholder="Chronic conditions like Diabetes, BP, etc." />
            </div>
          </div>
        </div>

        {/* ── Section 5: Basic Info (Sync/Update) ── */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}><User className="text-slate-600" size={20} /> General Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Blood Group</label>
              <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className={inputClass}>
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
              </select>
            </div>
            <div>
                <label className={labelClass}>Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} maxLength="10" />
            </div>
            <div>
                <label className={labelClass}>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="sticky bottom-8 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-extrabold px-10 py-5 rounded-3xl shadow-2xl transition-all active:scale-95 disabled:opacity-50 ${loading ? 'cursor-not-allowed' : 'hover:shadow-primary-300'}`}
          >
            {loading ? (
              <><Activity className="animate-spin" size={20} /> Saving Records...</>
            ) : (
              <><Save size={20} /> Save My Health Profile</>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default EditProfile;
