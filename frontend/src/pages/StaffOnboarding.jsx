import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, X, Activity, Camera, Mail, Phone, GraduationCap, 
  Briefcase, Shield, ArrowLeft, Save, Check, Calendar, MapPin
} from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import DropZone from '../components/DropZone';
import PremiumDropdown from '../components/PremiumDropdown';

const StaffOnboarding = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [licenseFile, setLicenseFile] = useState(null);

    const [onboardData, setOnboardData] = useState({
        name: '', email: '', gender: 'Male', age: '', dateOfBirth: '',
        phone: '', alternatePhone: '', medicalDegree: '', specialization: '',
        college: '', additionalCertifications: '', medicalCouncil: '',
        licenseExpiryDate: '', medicalLicenseNumber: '', yearsOfExperience: '',
        subSpecialties: '', languagesSpoken: '', treatmentFocus: '',
        proceduresHandled: '', publications: '', employeeId: '',
        opdRoomNumber: '', contractType: 'PERMANENT', maxPatientsPerDay: '30',
        slotDuration: '15', workingDaysArray: [], startTime: '09:00',
        endTime: '17:00', breakTimings: '13:00 - 14:00',
        onlineConsultationFee: '', offlineConsultationFee: '',
        onlineConsultation: true, appointmentsEnabled: true,
        canPrescribe: true, canEditPatientData: false, 
        canAccessReports: true, canManageAppointments: true
    });

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1";
    const inputClass = "w-full px-8 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold focus:ring-4 ring-primary/5 transition-all placeholder:text-slate-300 shadow-sm outline-none focus:border-primary/20";
    const sectionClass = "bg-white rounded-[3.5rem] p-12 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-10";

    const handleDayToggle = (day) => {
        const current = onboardData.workingDaysArray;
        const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
        setOnboardData({ ...onboardData, workingDaysArray: next });
    };

    const handleOnboardStaff = async (e) => {
        if (e) e.preventDefault();
        
        // Basic Validation
        if (!onboardData.name || !onboardData.email || !onboardData.phone || !onboardData.specialization) {
            toast.error("Please populate all mandatory identity and clinical fields");
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            const workingDays = onboardData.workingDaysArray.join(', ');
            const consultationTimings = `${onboardData.startTime} - ${onboardData.endTime}`;
            
            const doctorData = { 
                ...onboardData, 
                workingDays, 
                consultationTimings,
                onlineConsultation: onboardData.onlineConsultation === 'BOTH' ? true : onboardData.onlineConsultation
            };
            
            formData.append('doctor', JSON.stringify(doctorData));
            if (selectedFile) formData.append('profilePicture', selectedFile);
            if (licenseFile) formData.append('licenseFile', licenseFile);

            await api.post('/hospital/onboard-doctor', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success("Physician onboarded successfully. Awaiting registry verification.");
            navigate('/hospital-dashboard/staff');
        } catch (err) {
            toast.error(err.response?.data?.message || "Onboarding failed. Please verify institutional credentials.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-16 px-8 space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Command Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div className="flex items-center gap-8">
                    <button 
                        onClick={() => navigate('/hospital-dashboard/staff')} 
                        className="p-5 bg-white rounded-3xl shadow-lg border border-slate-100 hover:bg-slate-50 transition-all hover:scale-110 active:scale-90"
                    >
                        <ArrowLeft size={24} className="text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Personnel<span className="not-italic text-primary">Onboarding</span></h1>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mt-2">Initialize Institutional Clinical Profile</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/hospital-dashboard/staff')}
                        className="px-8 py-5 text-slate-400 text-[11px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
                    >
                        Discard
                    </button>
                    <button 
                        onClick={handleOnboardStaff}
                        disabled={submitting}
                        className="px-10 py-5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95"
                    >
                        {submitting ? <Activity className="animate-spin" size={18} /> : <Save size={18} />}
                        Authorize & Initialize
                    </button>
                </div>
            </div>

            <form onSubmit={handleOnboardStaff} className="space-y-12">
                {/* Section 1: Professional Identity */}
                <div className={sectionClass}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <h3 className="text-[12px] font-black text-primary uppercase tracking-[0.4em]">1. Professional Identity</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-1 space-y-8">
                            <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100">
                                <DropZone onFileSelect={setSelectedFile} label="Identity Portrait" type="portrait" accept="image/*" />
                                <p className="text-[9px] font-black text-slate-400 text-center uppercase mt-6 tracking-widest">Recommended: Professional Attire</p>
                            </div>
                        </div>
                        
                        <div className="lg:col-span-2 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div><label className={labelClass}>Full Name (Registry)</label><input type="text" required value={onboardData.name} onChange={(e) => setOnboardData({...onboardData, name: e.target.value})} className={inputClass} placeholder="e.g. Dr. Alexander Pierce" /></div>
                                <div><label className={labelClass}>Work Email</label><input type="email" required value={onboardData.email} onChange={(e) => setOnboardData({...onboardData, email: e.target.value})} className={inputClass} placeholder="hospital.staff@medisync.app" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div><label className={labelClass}>Phone</label><input type="tel" required value={onboardData.phone} onChange={(e) => setOnboardData({...onboardData, phone: e.target.value})} className={inputClass} placeholder="+91 98765 43210" /></div>
                                <PremiumDropdown label="Gender" options={['Male', 'Female', 'Other']} value={onboardData.gender} onChange={(val) => setOnboardData({...onboardData, gender: val})} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Clinical Credentials */}
                <div className={sectionClass}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <h3 className="text-[12px] font-black text-blue-500 uppercase tracking-[0.4em]">2. Clinical Credentials</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <PremiumDropdown label="Medical Degree" options={['MBBS', 'MD', 'MS', 'DM', 'MCh']} value={onboardData.medicalDegree} onChange={(val) => setOnboardData({...onboardData, medicalDegree: val})} />
                        <PremiumDropdown label="Specialization" options={['Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Orthopedics', 'Dermatology']} value={onboardData.specialization} onChange={(val) => setOnboardData({...onboardData, specialization: val})} searchable={true} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div><label className={labelClass}>License Number</label><input type="text" required value={onboardData.medicalLicenseNumber} onChange={(e) => setOnboardData({...onboardData, medicalLicenseNumber: e.target.value})} className={inputClass} /></div>
                        <div><label className={labelClass}>Medical Council</label><input type="text" required value={onboardData.medicalCouncil} onChange={(e) => setOnboardData({...onboardData, medicalCouncil: e.target.value})} className={inputClass} placeholder="e.g. GMC" /></div>
                        <div><label className={labelClass}>Experience (Yrs)</label><input type="number" required value={onboardData.yearsOfExperience} onChange={(e) => setOnboardData({...onboardData, yearsOfExperience: e.target.value})} className={inputClass} /></div>
                    </div>

                    <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100">
                        <label className={labelClass}>License Verification Document</label>
                        <DropZone onFileSelect={setLicenseFile} label="Upload Credentials" type="document" accept=".pdf,image/*" />
                    </div>
                </div>

                {/* Section 3: Institutional Mapping */}
                <div className={`${sectionClass} border-primary/20 bg-primary/[0.02]`}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <h3 className="text-[12px] font-black text-primary uppercase tracking-[0.4em]">3. Institutional Mapping</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div><label className={labelClass}>Employee ID</label><input type="text" required value={onboardData.employeeId} onChange={(e) => setOnboardData({...onboardData, employeeId: e.target.value})} className={inputClass} placeholder="EMP-2026-001" /></div>
                        <div><label className={labelClass}>OPD Room Assignment</label><input type="text" required value={onboardData.opdRoomNumber} onChange={(e) => setOnboardData({...onboardData, opdRoomNumber: e.target.value})} className={inputClass} placeholder="OPD-204" /></div>
                    </div>

                    <div className="space-y-6">
                        <label className={labelClass}>Operational Days</label>
                        <div className="flex flex-wrap gap-4">
                            {daysOfWeek.map(day => (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleDayToggle(day)}
                                    className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                                        onboardData.workingDaysArray.includes(day)
                                            ? 'bg-primary text-white shadow-xl shadow-primary/25 scale-105'
                                            : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
                                    }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div><label className={labelClass}>Shift Start</label><input type="time" required value={onboardData.startTime} onChange={(e) => setOnboardData({...onboardData, startTime: e.target.value})} className={inputClass} /></div>
                        <div><label className={labelClass}>Shift End</label><input type="time" required value={onboardData.endTime} onChange={(e) => setOnboardData({...onboardData, endTime: e.target.value})} className={inputClass} /></div>
                        <div><label className={labelClass}>Break Period</label><input type="text" required value={onboardData.breakTimings} onChange={(e) => setOnboardData({...onboardData, breakTimings: e.target.value})} className={inputClass} placeholder="13:00 - 14:00" /></div>
                        <div><label className={labelClass}>Slot (Min)</label><input type="number" required value={onboardData.slotDuration} onChange={(e) => setOnboardData({...onboardData, slotDuration: e.target.value})} className={inputClass} /></div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div><label className={labelClass}>Online Fee (₹)</label><input type="number" value={onboardData.onlineConsultationFee} onChange={(e) => setOnboardData({...onboardData, onlineConsultationFee: e.target.value})} className={inputClass} /></div>
                        <div><label className={labelClass}>Offline Fee (₹)</label><input type="number" value={onboardData.offlineConsultationFee} onChange={(e) => setOnboardData({...onboardData, offlineConsultationFee: e.target.value})} className={inputClass} /></div>
                    </div>
                </div>

                <div className="flex justify-end pt-12">
                    <button 
                        onClick={handleOnboardStaff}
                        disabled={submitting}
                        className="px-16 py-7 bg-primary text-white text-[13px] font-black uppercase tracking-[0.3em] rounded-[2.5rem] shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50"
                    >
                        {submitting ? 'Initializing Node...' : 'Finalize & Authorize'}
                        <Check size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StaffOnboarding;
