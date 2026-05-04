import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, X, Activity, Camera, Mail, Phone, GraduationCap, 
  Briefcase, Shield, ArrowLeft, Save, Check, Calendar, MapPin,
  Clock, DollarSign, Globe, Award, BookOpen, Stethoscope,
  Lock, UserCheck, ShieldCheck, FileText, Zap
} from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import DropZone from '../components/DropZone';
import PremiumDropdown from '../components/PremiumDropdown';

const PREDEFINED_DOCTOR_SERVICES = [
    "General Consultation", "Specialist Consultation", "Emergency Care",
    "Home Visit", "Telemedicine", "Vaccination", "Diagnostic Review",
    "Minor Procedures", "Second Opinion", "Health Screening"
];

const PREDEFINED_INSTITUTIONAL_SERVICES = [
    "24/7 Emergency", "MRI Scan", "CT Scan", "X-Ray", "Blood Bank", 
    "ICU (Intensive Care Unit)", "NICU", "Dialysis", "Physiotherapy", 
    "Pathology Lab", "In-house Pharmacy", "Ambulance", "Operation Theater",
    "Telemedicine", "Vaccination Center", "Home Care Services"
];

const StaffOnboarding = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [licenseFile, setLicenseFile] = useState(null);

    const [onboardData, setOnboardData] = useState({
        // 1. Personal Identity
        name: '', email: '', gender: 'Male', age: '', dateOfBirth: '',
        phone: '', alternatePhone: '', 
        
        // 2. Professional Credentials
        medicalDegree: 'MBBS', specialization: 'General Physician',
        college: '', additionalCertifications: '', medicalCouncil: '',
        licenseExpiryDate: '', medicalLicenseNumber: '', yearsOfExperience: '',
        
        // 3. Clinical Expertise
        subSpecialties: '', languagesSpoken: '', treatmentFocus: '',
        proceduresHandled: '', publications: '', 
        
        // 4. Institutional Logistics
        employeeId: '', opdRoomNumber: '', contractType: 'PERMANENT', 
        maxPatientsPerDay: '30', slotDuration: '15', slotBuffer: '0', workingDaysArray: [], 
        startTime: '09:00', endTime: '17:00', breakTimings: '13:00 - 14:00',
        onlineConsultationFee: '', offlineConsultationFee: '',
        onlineConsultation: true, appointmentsEnabled: true,
        
        canPrescribe: true, canEditPatientData: false, 
        canAccessReports: true, canManageAppointments: true,
        services: ''
    });

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1";
    const inputClass = "w-full px-8 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold focus:ring-4 ring-primary/5 transition-all placeholder:text-slate-300 shadow-sm outline-none focus:border-primary/20";
    const sectionClass = "bg-white rounded-[3.5rem] p-12 shadow-xl shadow-slate-200/40 border border-slate-100 space-y-12 relative overflow-hidden";

    const handleDayToggle = (day) => {
        const current = onboardData.workingDaysArray;
        const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
        setOnboardData({ ...onboardData, workingDaysArray: next });
    };

    const handleOnboardStaff = async (e) => {
        if (e) e.preventDefault();
        
        if (!onboardData.name || !onboardData.email || !onboardData.phone || !onboardData.medicalLicenseNumber) {
            toast.error("Please populate all critical identification and licensing fields");
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
                institutional: true // Hardcoded for institutional onboarding
            };
            
            formData.append('doctor', JSON.stringify(doctorData));
            if (selectedFile) formData.append('profilePicture', selectedFile);
            if (licenseFile) formData.append('licenseFile', licenseFile);

            await api.post('/hospital/onboard-doctor', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success("Physician initialized and authorized within the institution.");
            navigate('/hospital-dashboard/staff');
        } catch (err) {
            toast.error(err.response?.data?.message || "Onboarding failed. Please verify clinical registry.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-16 px-8 space-y-20 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            {/* Command Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div className="flex items-center gap-8">
                    <button 
                        onClick={() => navigate('/hospital-dashboard/staff')} 
                        className="p-6 bg-white rounded-3xl shadow-xl border border-slate-100 hover:bg-slate-50 transition-all hover:scale-110 active:scale-90"
                    >
                        <ArrowLeft size={28} className="text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase">Deep<span className="not-italic text-primary">Onboarding</span></h1>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.4em] mt-3 ml-1">Institutional Personnel Initialization Protocol</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/hospital-dashboard/staff')}
                        className="px-10 py-6 text-slate-400 text-[12px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
                    >
                        Abort Protocol
                    </button>
                    <button 
                        onClick={handleOnboardStaff}
                        disabled={submitting}
                        className="px-12 py-6 bg-slate-900 text-white text-[12px] font-black uppercase tracking-widest rounded-[2.5rem] shadow-2xl shadow-slate-900/30 hover:bg-slate-800 transition-all flex items-center gap-4 disabled:opacity-50 active:scale-95"
                    >
                        {submitting ? <Activity className="animate-spin" size={20} /> : <Zap size={20} className="text-primary" />}
                        Finalize & Authorize
                    </button>
                </div>
            </div>

            <form onSubmit={handleOnboardStaff} className="space-y-16">
                
                {/* 1. Professional Identity */}
                <div className={sectionClass}>
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-slate-900 pointer-events-none">
                        <UserPlus size={120} />
                    </div>
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-[0.5em]">1. Professional Identity</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-16 relative z-10">
                        <div className="lg:col-span-1">
                            <div className="p-10 bg-slate-50/50 rounded-[3.5rem] border border-slate-100 flex flex-col items-center">
                                <DropZone onFileSelect={setSelectedFile} label="Identity Portrait" type="portrait" accept="image/*" />
                                <p className="text-[9px] font-black text-slate-400 uppercase mt-8 tracking-widest text-center leading-relaxed">Official institutional identification portrait</p>
                            </div>
                        </div>
                        
                        <div className="lg:col-span-3 space-y-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div><label className={labelClass}>Full Legal Name</label><input type="text" required value={onboardData.name} onChange={(e) => setOnboardData({...onboardData, name: e.target.value})} className={inputClass} placeholder="e.g. Dr. Elena Rodriguez" /></div>
                                <div><label className={labelClass}>Institutional Email</label><input type="email" required value={onboardData.email} onChange={(e) => setOnboardData({...onboardData, email: e.target.value})} className={inputClass} placeholder="staff.id@hospital.app" /></div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                <div><label className={labelClass}>Mobile</label><input type="tel" required value={onboardData.phone} onChange={(e) => setOnboardData({...onboardData, phone: e.target.value})} className={inputClass} /></div>
                                <div><label className={labelClass}>Alt. Phone</label><input type="tel" value={onboardData.alternatePhone} onChange={(e) => setOnboardData({...onboardData, alternatePhone: e.target.value})} className={inputClass} /></div>
                                <div><label className={labelClass}>Age</label><input type="number" value={onboardData.age} onChange={(e) => setOnboardData({...onboardData, age: e.target.value})} className={inputClass} /></div>
                                <PremiumDropdown label="Gender" options={['Male', 'Female', 'Other']} value={onboardData.gender} onChange={(val) => setOnboardData({...onboardData, gender: val})} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div><label className={labelClass}>Date of Birth</label><input type="date" value={onboardData.dateOfBirth} onChange={(e) => setOnboardData({...onboardData, dateOfBirth: e.target.value})} className={inputClass} /></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Clinical Credentials */}
                <div className={sectionClass}>
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-blue-600 pointer-events-none">
                        <Award size={120} />
                    </div>
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-[0.5em]">2. Academic & Licensing</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                        <PremiumDropdown label="Primary Degree" options={['MBBS', 'MD', 'MS', 'DM', 'MCh', 'PhD']} value={onboardData.medicalDegree} onChange={(val) => setOnboardData({...onboardData, medicalDegree: val})} />
                        <PremiumDropdown label="Clinical Specialization" options={['Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Psychiatry', 'Radiology']} value={onboardData.specialization} onChange={(val) => setOnboardData({...onboardData, specialization: val})} searchable={true} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                        <div><label className={labelClass}>License Number</label><input type="text" required value={onboardData.medicalLicenseNumber} onChange={(e) => setOnboardData({...onboardData, medicalLicenseNumber: e.target.value})} className={inputClass} /></div>
                        <div><label className={labelClass}>Medical Council</label><input type="text" value={onboardData.medicalCouncil} onChange={(e) => setOnboardData({...onboardData, medicalCouncil: e.target.value})} className={inputClass} placeholder="e.g. Karnataka Medical Council" /></div>
                        <div><label className={labelClass}>License Expiry</label><input type="date" value={onboardData.licenseExpiryDate} onChange={(e) => setOnboardData({...onboardData, licenseExpiryDate: e.target.value})} className={inputClass} /></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                        <div><label className={labelClass}>Alma Mater (College/Univ)</label><input type="text" value={onboardData.college} onChange={(e) => setOnboardData({...onboardData, college: e.target.value})} className={inputClass} /></div>
                        <div><label className={labelClass}>Clinical Experience (Years)</label><input type="number" value={onboardData.yearsOfExperience} onChange={(e) => setOnboardData({...onboardData, yearsOfExperience: e.target.value})} className={inputClass} /></div>
                    </div>

                    <div className="p-12 bg-blue-50/30 rounded-[3.5rem] border border-blue-100/50 relative z-10">
                        <label className={labelClass}>Verification Credentials (PDF/Scan)</label>
                        <DropZone onFileSelect={setLicenseFile} label="Upload Medical Registry Documents" type="document" accept=".pdf,image/*" />
                    </div>
                </div>

                {/* 3. Clinical Expertise */}
                <div className={sectionClass}>
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-emerald-600 pointer-events-none">
                        <Stethoscope size={120} />
                    </div>
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-[0.5em]">3. Clinical Expertise</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                        <div><label className={labelClass}>Sub-Specialties</label><input type="text" value={onboardData.subSpecialties} onChange={(e) => setOnboardData({...onboardData, subSpecialties: e.target.value})} className={inputClass} placeholder="e.g. Interventional Cardiology" /></div>
                        <div><label className={labelClass}>Languages Spoken</label><input type="text" value={onboardData.languagesSpoken} onChange={(e) => setOnboardData({...onboardData, languagesSpoken: e.target.value})} className={inputClass} placeholder="e.g. English, Hindi, Spanish" /></div>
                    </div>

                    <div className="grid grid-cols-1 gap-10 relative z-10">
                        <div><label className={labelClass}>Treatment Focus</label><textarea rows={3} value={onboardData.treatmentFocus} onChange={(e) => setOnboardData({...onboardData, treatmentFocus: e.target.value})} className={`${inputClass} !rounded-[2.5rem] py-6`} placeholder="Describe clinical philosophy or focus areas..." /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div><label className={labelClass}>Major Procedures Handled</label><input type="text" value={onboardData.proceduresHandled} onChange={(e) => setOnboardData({...onboardData, proceduresHandled: e.target.value})} className={inputClass} /></div>
                            <div><label className={labelClass}>Key Publications/Research</label><input type="text" value={onboardData.publications} onChange={(e) => setOnboardData({...onboardData, publications: e.target.value})} className={inputClass} /></div>
                        </div>
                    </div>
                </div>

                {/* 4. Institutional Logistics */}
                <div className={`${sectionClass} border-primary/20 bg-primary/[0.01]`}>
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-primary pointer-events-none">
                        <MapPin size={120} />
                    </div>
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-[0.5em]">4. Operational Mapping</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                        <div><label className={labelClass}>Employee ID</label><input type="text" required value={onboardData.employeeId} onChange={(e) => setOnboardData({...onboardData, employeeId: e.target.value})} className={inputClass} placeholder="EMP-2026-X" /></div>
                        <div><label className={labelClass}>OPD Room Unit</label><input type="text" required value={onboardData.opdRoomNumber} onChange={(e) => setOnboardData({...onboardData, opdRoomNumber: e.target.value})} className={inputClass} placeholder="BLOCK-A-204" /></div>
                        <PremiumDropdown label="Contract Nature" options={['PERMANENT', 'VISITING', 'CONSULTANT', 'INTERN']} value={onboardData.contractType} onChange={(val) => setOnboardData({...onboardData, contractType: val})} />
                    </div>

                    <div className="space-y-8 relative z-10">
                        <label className={labelClass}>Institutional Availability</label>
                        <div className="flex flex-wrap gap-4">
                            {daysOfWeek.map(day => (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleDayToggle(day)}
                                    className={`px-10 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${
                                        onboardData.workingDaysArray.includes(day)
                                            ? 'bg-primary text-white shadow-[0_15px_40px_rgba(59,130,246,0.3)] scale-105'
                                            : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
                                    }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                        <div><label className={labelClass}>Shift Alpha</label><input type="time" required value={onboardData.startTime} onChange={(e) => setOnboardData({...onboardData, startTime: e.target.value})} className={inputClass} /></div>
                        <div><label className={labelClass}>Shift Omega</label><input type="time" required value={onboardData.endTime} onChange={(e) => setOnboardData({...onboardData, endTime: e.target.value})} className={inputClass} /></div>
                        <div><label className={labelClass}>Clinical Break</label><input type="text" required value={onboardData.breakTimings} onChange={(e) => setOnboardData({...onboardData, breakTimings: e.target.value})} className={inputClass} placeholder="13:00 - 14:00" /></div>
                        <div><label className={labelClass}>Slot (Min)</label><input type="number" required value={onboardData.slotDuration} onChange={(e) => setOnboardData({...onboardData, slotDuration: e.target.value})} className={inputClass} /></div>
                        <div>
                            <label className={labelClass}>Buffer (Gap)</label>
                            <select value={onboardData.slotBuffer} onChange={(e) => setOnboardData({...onboardData, slotBuffer: e.target.value})} className={inputClass}>
                                <option value="0">No Gap</option>
                                <option value="5">5 Mins</option>
                                <option value="10">10 Mins</option>
                                <option value="15">15 Mins</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-10 relative z-10">
                        <div><label className={labelClass}>Capacity (Daily)</label><input type="number" value={onboardData.maxPatientsPerDay} onChange={(e) => setOnboardData({...onboardData, maxPatientsPerDay: e.target.value})} className={inputClass} /></div>
                        <div><label className={labelClass}>Online Fee (₹)</label><input type="number" value={onboardData.onlineConsultationFee} onChange={(e) => setOnboardData({...onboardData, onlineConsultationFee: e.target.value})} className={inputClass} /></div>
                        <div><label className={labelClass}>Offline Fee (₹)</label><input type="number" value={onboardData.offlineConsultationFee} onChange={(e) => setOnboardData({...onboardData, offlineConsultationFee: e.target.value})} className={inputClass} /></div>
                    </div>
                </div>

                {/* 5. Governance & Permissions */}
                <div className={`${sectionClass} border-slate-200 bg-slate-50/50`}>
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-slate-900 pointer-events-none">
                        <Lock size={120} />
                    </div>
                    <div className="flex items-center gap-4 mb-10 relative z-10">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                        <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-[0.5em]">5. Administrative Governance</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                        {[
                            { id: 'canPrescribe', label: 'Prescription Authority', icon: FileText },
                            { id: 'canEditPatientData', label: 'Patient Data Logic', icon: Activity },
                            { id: 'canAccessReports', label: 'Diagnostic Intelligence', icon: ShieldCheck },
                            { id: 'canManageAppointments', label: 'Session Governance', icon: Clock }
                        ].map(perm => (
                            <div key={perm.id} className="p-8 bg-white rounded-[2.5rem] border border-slate-100 flex flex-col items-center gap-6 shadow-sm">
                                <div className={`p-4 rounded-2xl ${onboardData[perm.id] ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'} transition-colors`}>
                                    <perm.icon size={24} />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{perm.label}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Institutional Privilege</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={onboardData[perm.id]}
                                        onChange={(e) => setOnboardData({...onboardData, [perm.id]: e.target.checked})}
                                    />
                                    <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 6. Clinical Services */}
                <div className={`${sectionClass} border-emerald-200 bg-emerald-50/5`}>
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-emerald-600 pointer-events-none">
                        <Zap size={120} />
                    </div>
                    <div className="flex items-center gap-4 mb-10 relative z-10">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-[0.5em]">6. Clinical & Diagnostic Services</h3>
                    </div>

                    <div className="space-y-12 relative z-10">
                        <div className="space-y-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Clinical Consultations</p>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {PREDEFINED_DOCTOR_SERVICES.map(service => {
                                    const isSelected = onboardData.services?.split(', ').includes(service);
                                    return (
                                        <button
                                            key={service}
                                            type="button"
                                            onClick={() => {
                                                const current = onboardData.services ? onboardData.services.split(', ').filter(s => s) : [];
                                                const next = isSelected ? current.filter(s => s !== service) : [...current, service];
                                                setOnboardData({ ...onboardData, services: next.join(', ') });
                                            }}
                                            className={`px-6 py-4 rounded-[1.5rem] border text-[10px] font-black uppercase tracking-widest transition-all ${
                                                isSelected ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                                            }`}
                                        >
                                            {service}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Diagnostic Infrastructure</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {PREDEFINED_INSTITUTIONAL_SERVICES.map(service => {
                                    const isSelected = onboardData.services?.split(', ').includes(service);
                                    return (
                                        <button
                                            key={service}
                                            type="button"
                                            onClick={() => {
                                                const current = onboardData.services ? onboardData.services.split(', ').filter(s => s) : [];
                                                const next = isSelected ? current.filter(s => s !== service) : [...current, service];
                                                setOnboardData({ ...onboardData, services: next.join(', ') });
                                            }}
                                            className={`px-6 py-4 rounded-[1.5rem] border text-[10px] font-black uppercase tracking-widest transition-all ${
                                                isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/20 scale-105' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                                            }`}
                                        >
                                            {service}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-12 pb-24">
                    <button 
                        onClick={handleOnboardStaff}
                        disabled={submitting}
                        className="px-20 py-8 bg-primary text-white text-[15px] font-black uppercase tracking-[0.4em] rounded-[3rem] shadow-[0_30px_70px_rgba(59,130,246,0.4)] hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-6 disabled:opacity-50 group"
                    >
                        {submitting ? 'Initializing Node...' : 'Authorize Clinical Node'}
                        <Check size={24} className="group-hover:scale-125 transition-transform" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StaffOnboarding;
