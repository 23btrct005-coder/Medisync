import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import {
  User, Stethoscope, BadgeCheck, GraduationCap, Building2,
  Clock, Activity, Save, ArrowLeft, Mail, Phone, Calendar,
  CheckCircle, AlertCircle, Video, Briefcase
} from 'lucide-react';

const EditDoctorProfile = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
    additionalCertifications: ''
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
        additionalCertifications: user.additionalCertifications || ''
      });
    }
  }, [user]);

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

    try {
      await api.post('doctor/profile/sync', formData);
      await refreshUser();
      setMessage({ type: 'success', text: 'Professional profile updated successfully!' });
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
              <label className={labelClass}>Primary Hospital / Clinic Name</label>
              <input type="text" name="hospital" value={formData.hospital} onChange={handleChange} className={inputClass} placeholder="e.g. Apollo Hospital, City Clinic" />
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
