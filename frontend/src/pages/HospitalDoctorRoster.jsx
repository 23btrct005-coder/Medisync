import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Activity, Search, ShieldAlert, ChevronRight, UserPlus, 
  Filter, Calendar, X, Trash2, Edit3, Settings, Check, 
  GraduationCap, Briefcase, Shield, Mail, Phone, Camera
} from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import DropZone from '../components/DropZone';
import PremiumDropdown from '../components/PremiumDropdown';

const HospitalDoctorRoster = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Modal States
    const [showOnboardModal, setShowOnboardModal] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [editData, setEditData] = useState({});

    // Onboarding Form State
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

    const [selectedFile, setSelectedFile] = useState(null);
    const [licenseFile, setLicenseFile] = useState(null);

    const fetchRoster = async () => {
        try {
            const res = await api.get('/hospital/doctors');
            setDoctors(res.data);
        } catch (err) {
            toast.error("Failed to sync physician roster");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoster();
    }, []);

    const approveDoctor = async (id) => {
        try {
            await api.post(`/hospital/approve-doctor/${id}`);
            toast.success("Physician credentials verified and approved");
            fetchRoster();
        } catch (err) {
            toast.error("Institutional approval failed");
        }
    };

    const handleDeleteDoctor = async (id) => {
        if (!window.confirm("Are you sure you want to decommission this personnel profile? This action is irreversible.")) return;
        try {
            await api.delete(`/hospital/delete-doctor/${id}`);
            toast.success("Personnel record purged from institution");
            fetchRoster();
        } catch (err) {
            toast.error("Decommissioning failed");
        }
    };

    const handleOnboardStaff = async (e) => {
        e.preventDefault();
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
            
            toast.success("New physician onboarded successfully");
            setShowOnboardModal(false);
            fetchRoster();
        } catch (err) {
            toast.error(err.response?.data?.message || "Onboarding failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateDoctor = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            const workingDays = editData.workingDaysArray?.join(', ') || '';
            const payload = { ...editData, workingDays };
            await api.post(`/hospital/update-doctor/${editingDoctor.id}`, payload);
            toast.success("Physician profile synchronized");
            setEditingDoctor(null);
            fetchRoster();
        } catch (err) {
            toast.error("Synchronization failed");
        } finally {
            setSubmitting(false);
        }
    };

    const startEditing = (doctor) => {
        const days = doctor.workingDays ? doctor.workingDays.split(',').map(d => d.trim()) : [];
        setEditingDoctor(doctor);
        setEditData({
            ...doctor,
            workingDaysArray: days,
            startTime: doctor.consultationTimings?.split(' - ')[0] || '09:00',
            endTime: doctor.consultationTimings?.split(' - ')[1] || '17:00'
        });
    };

    const handleDayToggle = (day, isEdit = false) => {
        if (isEdit) {
            const current = editData.workingDaysArray || [];
            const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
            setEditData({ ...editData, workingDaysArray: next });
        } else {
            const current = onboardData.workingDaysArray;
            const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
            setOnboardData({ ...onboardData, workingDaysArray: next });
        }
    };

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1";
    const inputClass = "w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:ring-2 ring-primary/10 transition-all placeholder:text-slate-300";

    const filteredDoctors = doctors.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <Activity className="animate-spin text-primary" size={48} />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto py-12 px-6 space-y-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Staff<span className="not-italic text-primary">Roster</span></h1>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mt-2">Institutional Physician Management & Verification</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Filter by name or specialty..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-14 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold focus:ring-4 ring-primary/5 w-80 shadow-sm transition-all outline-none"
                        />
                    </div>
                    <button 
                        onClick={() => setShowOnboardModal(true)}
                        className="px-8 py-5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-[2rem] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                    >
                        <UserPlus size={18} />
                        Onboard New Staff
                    </button>
                </div>
            </div>

            {/* Roster Table */}
            <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Physician Identity</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact & Verification</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Data</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorization</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredDoctors.map((doctor) => (
                                <tr key={doctor.id} className="hover:bg-slate-50/30 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/5 overflow-hidden border border-primary/10 flex items-center justify-center">
                                                {doctor.profilePictureUrl ? (
                                                    <img src={doctor.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Activity className="text-primary/30" size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-sm uppercase italic">{doctor.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{doctor.specialization}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-600 truncate max-w-[180px]">{doctor.email}</p>
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[8px] font-black uppercase tracking-widest border border-slate-200">
                                                Institutional Verified
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-600">{doctor.medicalDegree}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">License: {doctor.medicalLicenseNumber}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {doctor.approved ? (
                                            <span className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Authorized
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-amber-600 text-[10px] font-black uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Registry Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {!doctor.approved && (
                                                <button 
                                                    onClick={() => approveDoctor(doctor.id)}
                                                    className="px-4 py-2 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    Authorize
                                                </button>
                                            )}
                                            <button 
                                                 onClick={() => startEditing(doctor)}
                                                 className="p-2.5 bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm"
                                                 title="Configure Clinical Settings"
                                             >
                                                <Activity size={18} />
                                            </button>
                                            <button 
                                                 onClick={() => handleDeleteDoctor(doctor.id)}
                                                 className="p-2.5 bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                                                 title="Purge Personnel Record"
                                             >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Onboard Modal */}
            {showOnboardModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-100 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 flex flex-col max-h-[90vh]">
                        <div className="p-10 bg-slate-900 text-white relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 -mr-32 -mt-32 rounded-full blur-[80px]" />
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <h3 className="text-3xl font-black uppercase tracking-tight italic">Onboard <span className="not-italic text-primary">New Physician</span></h3>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Register a new medical professional</p>
                                </div>
                                <button onClick={() => setShowOnboardModal(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="mt-10">
                                <DropZone onFileSelect={setSelectedFile} label="Identity Portrait" type="portrait" accept="image/*" />
                            </div>
                        </div>

                        <form onSubmit={handleOnboardStaff} className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white">
                            <div className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">1. Basic Identity</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><label className={labelClass}>Full Name</label><input type="text" required value={onboardData.name} onChange={(e) => setOnboardData({...onboardData, name: e.target.value})} className={inputClass} /></div>
                                    <div><label className={labelClass}>Work Email</label><input type="email" required value={onboardData.email} onChange={(e) => setOnboardData({...onboardData, email: e.target.value})} className={inputClass} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div><label className={labelClass}>Phone</label><input type="tel" required value={onboardData.phone} onChange={(e) => setOnboardData({...onboardData, phone: e.target.value})} className={inputClass} /></div>
                                    <PremiumDropdown label="Gender" options={['Male', 'Female', 'Other']} value={onboardData.gender} onChange={(val) => setOnboardData({...onboardData, gender: val})} />
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">2. Clinical Credentials</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <PremiumDropdown label="Medical Degree" options={['MBBS', 'MD', 'MS', 'DM', 'MCh']} value={onboardData.medicalDegree} onChange={(val) => setOnboardData({...onboardData, medicalDegree: val})} />
                                    <PremiumDropdown label="Specialization" options={['Cardiology', 'Neurology', 'Oncology', 'Pediatrics']} value={onboardData.specialization} onChange={(val) => setOnboardData({...onboardData, specialization: val})} searchable={true} />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div><label className={labelClass}>License Number</label><input type="text" required value={onboardData.medicalLicenseNumber} onChange={(e) => setOnboardData({...onboardData, medicalLicenseNumber: e.target.value})} className={inputClass} /></div>
                                    <div><label className={labelClass}>Experience (Yrs)</label><input type="number" required value={onboardData.yearsOfExperience} onChange={(e) => setOnboardData({...onboardData, yearsOfExperience: e.target.value})} className={inputClass} /></div>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <label className={labelClass}>License Document</label>
                                    <DropZone onFileSelect={setLicenseFile} label="Upload Credentials" type="document" accept=".pdf,image/*" />
                                </div>
                            <div className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">3. Institutional Mapping</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div><label className={labelClass}>Employee ID</label><input type="text" required value={onboardData.employeeId} onChange={(e) => setOnboardData({...onboardData, employeeId: e.target.value})} className={inputClass} placeholder="EMP-2026-001" /></div>
                                    <div><label className={labelClass}>OPD Room No.</label><input type="text" required value={onboardData.opdRoomNumber} onChange={(e) => setOnboardData({...onboardData, opdRoomNumber: e.target.value})} className={inputClass} placeholder="OPD-204" /></div>
                                </div>
                                <div className="space-y-6">
                                    <label className={labelClass}>Working Days</label>
                                    <div className="flex flex-wrap gap-3">
                                        {daysOfWeek.map(day => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => handleDayToggle(day)}
                                                className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                                                    onboardData.workingDaysArray.includes(day)
                                                        ? 'bg-primary text-white shadow-lg'
                                                        : 'bg-slate-50 text-slate-400'
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div><label className={labelClass}>Shift Starts</label><input type="time" required value={onboardData.startTime} onChange={(e) => setOnboardData({...onboardData, startTime: e.target.value})} className={inputClass} /></div>
                                    <div><label className={labelClass}>Shift Ends</label><input type="time" required value={onboardData.endTime} onChange={(e) => setOnboardData({...onboardData, endTime: e.target.value})} className={inputClass} /></div>
                                    <div><label className={labelClass}>Break Time</label><input type="text" required value={onboardData.breakTimings} onChange={(e) => setOnboardData({...onboardData, breakTimings: e.target.value})} className={inputClass} placeholder="13:00 - 14:00" /></div>
                                    <div><label className={labelClass}>Slot (Min)</label><input type="number" required value={onboardData.slotDuration} onChange={(e) => setOnboardData({...onboardData, slotDuration: e.target.value})} className={inputClass} /></div>
                                </div>
                            </div>
                        </form>

                        <div className="p-10 border-t border-slate-50 bg-slate-50/30 shrink-0 flex gap-4">
                            <button onClick={() => setShowOnboardModal(false)} className="flex-1 py-5 bg-white border border-slate-200 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-slate-100 transition-all">Cancel</button>
                            <button onClick={handleOnboardStaff} disabled={submitting} className="flex-[2] py-5 bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-primary/90 transition-all shadow-xl disabled:opacity-50">
                                {submitting ? 'Authorizing...' : 'Authorize & Onboard'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Config Modal */}
            {editingDoctor && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-100 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 flex flex-col max-h-[90vh]">
                        <div className="p-10 bg-slate-900 text-white relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 -mr-32 -mt-32 rounded-full blur-[80px]" />
                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                                        {editingDoctor.profilePictureUrl ? (
                                            <img src={editingDoctor.profilePictureUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <Users size={32} className="text-white/20" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight italic">Configure <span className="not-italic text-primary">{editingDoctor.name}</span></h3>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{editingDoctor.specialization} • {editingDoctor.employeeId}</p>
                                    </div>
                                </div>
                                <button onClick={() => setEditingDoctor(null)} className="p-3 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateDoctor} className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white">
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Clinical Configuration</h4>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="flex items-center justify-between p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100/50">
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Appointments</p>
                                            <p className="text-[8px] font-bold text-emerald-600/60 uppercase mt-0.5">{editData.appointmentsEnabled ? 'Accepting' : 'Paused'}</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={editData.appointmentsEnabled !== false}
                                                onChange={(e) => setEditData({...editData, appointmentsEnabled: e.target.checked})}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </label>
                                    </div>
                                    <div>
                                        <label className={labelClass}>OPD Room Number</label>
                                        <input type="text" value={editData.opdRoomNumber || ''} onChange={(e) => setEditData({...editData, opdRoomNumber: e.target.value})} className={inputClass} placeholder="OPD-204" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div><label className={labelClass}>Online Fee (₹)</label><input type="number" value={editData.onlineConsultationFee || ''} onChange={(e) => setEditData({...editData, onlineConsultationFee: e.target.value})} className={inputClass} /></div>
                                    <div><label className={labelClass}>Offline Fee (₹)</label><input type="number" value={editData.offlineConsultationFee || ''} onChange={(e) => setEditData({...editData, offlineConsultationFee: e.target.value})} className={inputClass} /></div>
                                </div>

                                <div className="space-y-4">
                                    <label className={labelClass}>Shift Timing Slots</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div><label className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2 block">Starts</label><input type="time" value={editData.startTime} onChange={(e) => setEditData({...editData, startTime: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold" /></div>
                                        <div><label className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2 block">Ends</label><input type="time" value={editData.endTime} onChange={(e) => setEditData({...editData, endTime: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold" /></div>
                                        <div><label className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2 block">Break (e.g. 1-2PM)</label><input type="text" value={editData.breakTimings || ''} onChange={(e) => setEditData({...editData, breakTimings: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold" placeholder="13:00 - 14:00" /></div>
                                        <div><label className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2 block">Slot (Min)</label><input type="number" value={editData.slotDuration || '15'} onChange={(e) => setEditData({...editData, slotDuration: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold" /></div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className={labelClass}>Working Days</label>
                                    <div className="flex flex-wrap gap-3">
                                        {daysOfWeek.map(day => {
                                            const isActive = editData.workingDaysArray?.includes(day);
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => handleDayToggle(day, true)}
                                                    className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                                                        isActive ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 text-slate-400'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </form>

                        <div className="p-10 border-t border-slate-50 bg-slate-50/30 shrink-0 flex items-center gap-4">
                            <button type="button" onClick={() => { setEditingDoctor(null); navigate(`/hospital-dashboard/staff/edit/${editingDoctor.id}`); }} className="flex-1 py-5 bg-white border border-slate-200 text-primary text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
                                <Edit3 size={14} /> Edit Profile
                            </button>
                            <div className="flex-[2] flex gap-4">
                                <button type="button" onClick={() => setEditingDoctor(null)} className="flex-1 py-5 bg-white border border-slate-200 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-slate-100 transition-all">Cancel</button>
                                <button onClick={handleUpdateDoctor} disabled={submitting} className="flex-[2] py-5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50">
                                    {submitting ? 'Syncing...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HospitalDoctorRoster;
