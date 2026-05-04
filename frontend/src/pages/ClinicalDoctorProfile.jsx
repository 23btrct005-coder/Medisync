import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
  Stethoscope, Mail, Phone, GraduationCap, BadgeCheck,
  Building2, Clock, Activity, AlertCircle, User, Users, Star,
  Calendar, CheckCircle, XCircle, Video, Edit3, MapPin, CreditCard, Wallet
} from 'lucide-react';
import ClinicMap from '../components/ClinicMap';
import toast from 'react-hot-toast';
import { ShieldCheck, Save, X, Heart } from 'lucide-react';
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

const PREDEFINED_INSTITUTIONAL_SERVICES = [
    "24/7 Emergency", "MRI Scan", "CT Scan", "X-Ray", "Blood Bank", 
    "ICU (Intensive Care Unit)", "NICU", "Dialysis", "Physiotherapy", 
    "Pathology Lab", "In-house Pharmacy", "Ambulance", "Operation Theater",
    "Telemedicine", "Vaccination Center", "Home Care Services"
];

const InfoRow = ({ icon: Icon, label, value, color = 'text-blue-600', isLocked = false }) => (
  <div className={`flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 ${isLocked ? 'opacity-40 grayscale-[0.5]' : ''}`}>
    <div className={`mt-0.5 shrink-0 ${isLocked ? 'text-slate-400' : color}`}><Icon size={18} /></div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
        {isLocked && <ShieldCheck size={10} className="text-slate-300" />}
      </div>
      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value || <span className="text-slate-300 font-normal">Not provided</span>}</p>
    </div>
  </div>
);

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
      <Icon size={18} className="text-blue-700" />
      <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{title}</h4>
    </div>
    <div className="px-6 divide-y divide-slate-50">{children}</div>
  </div>
);

const DoctorProfile = () => {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('identity');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setFormData({
      subSpecialties: user.subSpecialties || '',
      proceduresHandled: user.proceduresHandled || '',
      treatmentFocus: user.treatmentFocus || '',
      publications: user.publications || '',
      languagesSpoken: user.languagesSpoken || '',
      onlineConsultation: user.onlineConsultation || false,
      appointmentsEnabled: user.appointmentsEnabled || false,
      services: user.services || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/doctor/profile/sync', formData);
      toast.success("Profile synchronized successfully");
      await refreshUser();
      setIsEditing(false);
    } catch (err) {
      toast.error("Synchronization failure: Protocol interrupted");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-20">
      <div className="animate-spin text-blue-600"><Activity size={36} /></div>
    </div>
  );

  if (!user) return (
    <div className="text-center p-12 text-slate-400">
      <AlertCircle size={40} className="mx-auto mb-3" />
      <p>Could not load profile. Please log in again.</p>
    </div>
  );

  const initials = user.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'DR';
  const photoUrl = user.profilePictureUrl || `${api.defaults.baseURL}/auth/doctor/photo/${user.id}?t=${Date.now()}`;

  const tabs = [
    { id: 'identity', label: 'Identity', icon: User },
    { id: 'professional', label: 'Professional', icon: GraduationCap },
    { id: 'expertise', label: 'Expertise', icon: Stethoscope },
    { id: 'practice', label: 'Practice', icon: Clock },
    { id: 'transactional', label: 'Settlements', icon: Wallet },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 shrink-0 overflow-hidden border-4 border-white">
                <img 
                    src={photoUrl} 
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
                <div className="hidden items-center justify-center w-full h-full text-2xl font-black uppercase">
                    {initials}
                </div>
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Pers. <span className="not-italic text-blue-600">Profile</span></h2>
                    {user.approved && <BadgeCheck className="text-blue-600" size={24} />}
                </div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">
                    Personal Clinical Identity & Credentials
                </p>
                <p className="text-slate-500 font-bold flex items-center gap-2 mt-1">
                    <span className="uppercase tracking-widest text-[10px] bg-slate-100 px-2 py-1 rounded-lg text-slate-400 font-black">Physician Node</span>
                    {user.specialization} • {user.medicalDegree}
                </p>
            </div>
        </div>
        
        <div className="flex items-center gap-3">
            {isEditing ? (
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="flex items-center justify-center gap-3 bg-slate-100 text-slate-500 font-black uppercase tracking-widest text-[10px] px-6 py-4 rounded-[2rem] hover:bg-slate-200 transition-all active:scale-95"
                    >
                        <X size={16} /> Discard
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center justify-center gap-3 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] px-8 py-4 rounded-[2rem] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                    >
                        <Save size={16} /> {saving ? 'Syncing...' : 'Save Changes'}
                    </button>
                </div>
            ) : !user.institutional ? (
                <button 
                    onClick={() => navigate('/doctor-dashboard/profile/edit')}
                    className="flex items-center justify-center gap-3 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] px-8 py-4 rounded-[2rem] hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/20 active:scale-95 group"
                >
                    <Edit3 size={16} className="group-hover:rotate-12 transition-transform" />
                    Modify Clinical Profile
                </button>
            ) : (
                <div className="flex items-center gap-3">
                    <button 
                        onClick={startEditing}
                        className="flex items-center justify-center gap-3 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] px-8 py-4 rounded-[2rem] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 group"
                    >
                        <Edit3 size={16} /> Manage Expertise
                    </button>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-blue-100">
                            <Building2 size={16} /> Institutional Profile
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">Controlled by {user.hospital || 'Institution'}</p>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-[2.5rem] border border-slate-200/60 backdrop-blur-md sticky top-6 z-10 shadow-sm overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                    ? 'bg-white text-blue-600 shadow-xl shadow-blue-500/5 border border-slate-200' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                }`}
            >
                <tab.icon size={16} />
                {tab.label}
            </button>
        ))}
      </div>

      {/* Tab Content Rendering */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {activeTab === 'identity' && (
                <div className="space-y-6">
                    <Section title="Clinical Identity" icon={User}>
                        <InfoRow icon={User} label="Legal Name" value={user.name} isLocked={user.institutional} />
                        <InfoRow icon={Users} label="Gender Representation" value={user.gender} color="text-purple-500" isLocked={user.institutional} />
                        <InfoRow icon={Calendar} label="Date of Birth" value={user.dateOfBirth} color="text-blue-500" isLocked={user.institutional} />
                        <InfoRow icon={Calendar} label="Biological Age" value={user.age ? `${user.age} Years` : null} color="text-blue-500" isLocked={user.institutional} />
                    </Section>

                    <Section title="Communication Node" icon={Phone}>
                        <InfoRow icon={Mail} label="Primary Interface" value={user.email} color="text-blue-500" isLocked={user.institutional} />
                        <InfoRow icon={Phone} label="Emergency Contact" value={user.phone} color="text-green-500" isLocked={user.institutional} />
                        <InfoRow icon={Phone} label="Secondary Terminal" value={user.alternatePhone} color="text-green-400" isLocked={user.institutional} />
                    </Section>
                </div>
            )}

            {activeTab === 'professional' && (
                <div className="space-y-6">
                    <Section title="Medical Credentials" icon={GraduationCap}>
                        <InfoRow icon={GraduationCap} label="Academic Degree" value={user.medicalDegree} color="text-indigo-500" isLocked={user.institutional} />
                        <InfoRow icon={Stethoscope} label="Core Specialization" value={user.specialization} color="text-blue-600" isLocked={user.institutional} />
                        <InfoRow icon={GraduationCap} label="Training Institute" value={user.college} color="text-indigo-400" isLocked={user.institutional} />
                        <InfoRow icon={BadgeCheck} label="Clinical Certifications" value={user.additionalCertifications} color="text-amber-500" isLocked={user.institutional} />
                    </Section>

                    <Section title="Regulatory Verification" icon={BadgeCheck}>
                        <InfoRow icon={BadgeCheck} label="Medical Council" value={user.medicalCouncil} color="text-emerald-600" isLocked={user.institutional} />
                        <InfoRow icon={BadgeCheck} label="License ID" value={user.medicalLicenseNumber} color="text-emerald-600" isLocked={user.institutional} />
                        <InfoRow icon={Calendar} label="License Expiry" value={user.licenseExpiryDate} color="text-red-500" isLocked={user.institutional} />
                        <InfoRow icon={Calendar} label="Registration Year" value={user.registrationYear} color="text-slate-500" isLocked={user.institutional} />
                    </Section>

                    {user.institutional && (
                        <Section title="Institutional Mapping" icon={Building2}>
                            <InfoRow icon={Building2} label="Parent Organization" value={user.hospital} color="text-blue-700" isLocked />
                            <InfoRow icon={User} label="Employee / Staff ID" value={user.employeeId || user.staffId} color="text-slate-600" isLocked />
                            <InfoRow icon={MapPin} label="OPD Station Number" value={user.opdRoomNumber} color="text-emerald-600" isLocked />
                            <InfoRow icon={Calendar} label="Date of Induction" value={user.joiningDate} color="text-slate-500" isLocked />
                        </Section>
                    )}
                </div>
            )}

            {activeTab === 'expertise' && (
                <div className="space-y-6">
                    <Section title="Clinical Specialization" icon={Stethoscope}>
                        <div className="py-4 border-b border-slate-50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Sub-Specialty Focus</p>
                            {isEditing ? (
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                                    placeholder="e.g. Cardiology, Diabetology (comma separated)"
                                    value={formData.subSpecialties}
                                    onChange={(e) => setFormData({ ...formData, subSpecialties: e.target.value })}
                                />
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {user.subSpecialties ? user.subSpecialties.split(', ').map(s => (
                                        <span key={s} className="px-4 py-2 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-blue-100 shadow-sm">
                                            {s}
                                        </span>
                                    )) : <span className="text-slate-300 italic text-sm">No sub-specialties listed</span>}
                                </div>
                            )}
                        </div>
                        {isEditing ? (
                            <div className="space-y-4 py-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Procedures Managed</p>
                                    <textarea 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                                        rows={3}
                                        value={formData.proceduresHandled}
                                        onChange={(e) => setFormData({ ...formData, proceduresHandled: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Treatment Focus</p>
                                    <textarea 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                                        rows={3}
                                        value={formData.treatmentFocus}
                                        onChange={(e) => setFormData({ ...formData, treatmentFocus: e.target.value })}
                                    />
                                </div>
                                <div className="pt-4 border-t border-slate-50">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Clinical Services Provided</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {PREDEFINED_DOCTOR_SERVICES.map(service => (
                                            <label key={service} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${formData.services?.includes(service) ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    checked={formData.services?.includes(service) || false}
                                                    onChange={(e) => {
                                                        const current = formData.services ? formData.services.split(', ').filter(s => s) : [];
                                                        const next = e.target.checked ? [...current, service] : current.filter(s => s !== service);
                                                        setFormData({...formData, services: next.join(', ')});
                                                    }}
                                                />
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${formData.services?.includes(service) ? 'text-blue-700' : 'text-slate-500'}`}>{service}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-slate-50 mt-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Diagnostic & Infrastructure (Clinic/Hospital)</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {PREDEFINED_INSTITUTIONAL_SERVICES.map(service => (
                                            <label key={service} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${formData.services?.includes(service) ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                    checked={formData.services?.includes(service) || false}
                                                    onChange={(e) => {
                                                        const current = formData.services ? formData.services.split(', ').filter(s => s) : [];
                                                        const next = e.target.checked ? [...current, service] : current.filter(s => s !== service);
                                                        setFormData({...formData, services: next.join(', ')});
                                                    }}
                                                />
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${formData.services?.includes(service) ? 'text-emerald-700' : 'text-slate-500'}`}>{service}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <InfoRow icon={Activity} label="Procedures Managed" value={user.proceduresHandled} color="text-indigo-600" />
                                 <InfoRow icon={Activity} label="Treatment Focus" value={user.treatmentFocus} color="text-rose-600" />
                                 <div className="py-4 border-t border-slate-50 mt-4">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Medical Services Offered</p>
                                     <div className="flex flex-wrap gap-2">
                                         {user.services ? user.services.split(', ').map(s => (
                                             <span key={s} className="px-4 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-100 shadow-sm">
                                                 {s}
                                             </span>
                                         )) : <span className="text-slate-300 italic text-sm">No specific services listed</span>}
                                     </div>
                                 </div>
                            </>
                        )}
                    </Section>
                                    
                    <Section title="Professional Assets" icon={Star}>
                        {isEditing ? (
                            <div className="space-y-4 py-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Languages Spoken</p>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                                        value={formData.languagesSpoken}
                                        onChange={(e) => setFormData({ ...formData, languagesSpoken: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Scientific Publications</p>
                                    <textarea 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                                        rows={3}
                                        value={formData.publications}
                                        onChange={(e) => setFormData({ ...formData, publications: e.target.value })}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <InfoRow icon={Activity} label="Languages Spoken" value={user.languagesSpoken} color="text-emerald-600" />
                                <InfoRow icon={Activity} label="Scientific Publications" value={user.publications} color="text-blue-600" />
                            </>
                        )}
                    </Section>
                </div>
            )}

            {activeTab === 'practice' && (
                <div className="space-y-6">
                    <Section title="Operational Availability" icon={Clock}>
                        <div className="py-4 border-b border-slate-50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Active Roster Days</p>
                            <div className="flex flex-wrap gap-2">
                                {user.workingDays ? user.workingDays.split(', ').map(day => (
                                    <span key={day} className="px-4 py-2 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-indigo-100 shadow-sm">
                                        {day}
                                    </span>
                                )) : <span className="text-slate-300 italic text-sm">No active roster</span>}
                            </div>
                        </div>
                        <InfoRow icon={Clock} label="Daily Timings" value={user.consultationTimings} color="text-blue-500" isLocked={user.institutional} />
                        <InfoRow icon={Clock} label="Break Intervals" value={user.breakTimings} color="text-slate-400" isLocked={user.institutional} />
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <InfoRow icon={Activity} label="Slot Duration" value={`${user.slotDuration || 15} Min`} color="text-blue-600" isLocked={user.institutional} />
                            <InfoRow icon={Activity} label="Clinical Gap" value={`${user.slotBuffer || 0} Min`} color="text-indigo-600" isLocked={user.institutional} />
                            <InfoRow icon={Users} label="Max Daily Load" value={`${user.maxPatientsPerDay || 0} Patients`} color="text-emerald-600" isLocked={user.institutional} />
                        </div>
                    </Section>

                    <Section title="Practice Economics" icon={Wallet}>
                        <div className="grid grid-cols-2 gap-4">
                            <InfoRow icon={CreditCard} label="Online Fee" value={user.onlineConsultationFee ? `₹ ${user.onlineConsultationFee}` : null} color="text-emerald-600" isLocked={user.institutional} />
                            <InfoRow icon={MapPin} label="In-Person Fee" value={user.offlineConsultationFee ? `₹ ${user.offlineConsultationFee}` : null} color="text-blue-600" isLocked={user.institutional} />
                        </div>
                        <div className="py-4 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Care Status</p>
                                    <p className="text-sm font-bold text-slate-700 mt-1">Telemedicine Availability</p>
                                </div>
                                {isEditing ? (
                                    <button 
                                        onClick={() => setFormData({ ...formData, onlineConsultation: !formData.onlineConsultation })}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.onlineConsultation ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}
                                    >
                                        {formData.onlineConsultation ? 'Enabled' : 'Disabled'}
                                    </button>
                                ) : (
                                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${user.onlineConsultation ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                                        {user.onlineConsultation ? 'Enabled' : 'Disabled'}
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking Protocol</p>
                                    <p className="text-sm font-bold text-slate-700 mt-1">Accept New Appointments</p>
                                </div>
                                {isEditing ? (
                                    <button 
                                        onClick={() => setFormData({ ...formData, appointmentsEnabled: !formData.appointmentsEnabled })}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.appointmentsEnabled ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}
                                    >
                                        {formData.appointmentsEnabled ? 'Accepting' : 'Paused'}
                                    </button>
                                ) : (
                                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${user.appointmentsEnabled ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-100 text-slate-400'}`}>
                                        {user.appointmentsEnabled ? 'Accepting' : 'Paused'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Section>
                </div>
            )}

            {activeTab === 'transactional' && (
                <Section title="Transactional Identity" icon={Wallet}>
                    <div className="py-6 border-b border-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Preferred Payout Channel</p>
                        <div className="flex items-center gap-3">
                        {user.preferredPaymentMode === 'RAZORPAY' && <span className="px-6 py-3 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-indigo-100 flex items-center gap-3 shadow-sm"><CreditCard size={18} /> Razorpay Standard</span>}
                        {user.preferredPaymentMode === 'UPI' && <span className="px-6 py-3 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-emerald-100 flex items-center gap-3 shadow-sm"><Activity size={18} /> Direct Peer-to-Peer</span>}
                        {user.preferredPaymentMode === 'BOTH' && <span className="px-6 py-3 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-blue-100 flex items-center gap-3 shadow-sm"><CheckCircle size={18} /> Dual Hybrid Model</span>}
                        {!user.preferredPaymentMode && <span className="text-slate-300 italic font-bold">Channel Not Configured</span>}
                        </div>
                    </div>
                    <InfoRow icon={CreditCard} label="Razorpay Gateway ID" value={user.razorpayAccountId} color="text-indigo-500" isLocked={user.institutional} />
                    <InfoRow icon={Activity} label="Verified UPI VPA" value={user.upiId} color="text-emerald-500" isLocked={user.institutional} />
                    <div className="py-6 bg-slate-50/50 rounded-2xl px-6 border border-slate-100 mt-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Node Integrity Warning</p>
                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                            { (user.razorpayAccountId || user.upiId) 
                                ? "Your clinical node is currently active and authorized for automated settlements. Any changes to payment IDs may trigger a security re-verification of your professional credentials."
                                : "Your clinical node is currently in OFFLINE mode. Patients will not be able to process digital prepayments for bookings until a valid UPI or Razorpay ID is bound to this profile."
                            }
                        </p>
                    </div>
                </Section>
            )}

        </div>

        {/* Sidebar Cards */}
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
            
            {/* Reputation Card */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center text-amber-500 mx-auto mb-6 shadow-lg shadow-amber-500/10">
                    <Star size={36} fill="currentColor" />
                </div>
                <h4 className="text-4xl font-black text-slate-900">{user.rating || '0.0'}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 italic">Clinical Reputation</p>
                <div className="mt-8 flex items-center justify-center gap-12 border-t border-slate-50 pt-8">
                    <div>
                        <p className="text-xl font-black text-slate-800">{user.reviewCount || 0}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Dossiers</p>
                    </div>
                    <div>
                        <p className="text-xl font-black text-slate-800">{user.yearsOfExperience || 0}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Yrs Exp</p>
                    </div>
                </div>
            </div>

            {/* Practice Location Card */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                        <MapPin className="text-rose-600" size={20} />
                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Practice Hub</h4>
                    </div>
                </div>
                <div className="p-6">
                    <ClinicMap address={user.clinicAddress || user.hospitalEntity?.location} hospitalName={user.hospital} height="250px" />
                    <div className="mt-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Primary Address</p>
                        <p className="text-xs font-bold text-slate-700 leading-relaxed">{user.clinicAddress || user.hospitalEntity?.location || 'Location Not Bound'}</p>
                    </div>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
};
export default DoctorProfile;
