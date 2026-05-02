import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, ClipboardCheck, TrendingUp, ShieldAlert, Shield, ChevronRight, UserPlus, Search, Activity, Calendar, GraduationCap, Briefcase, Mail, Phone, MapPin, Clock, DollarSign, CreditCard, Lock, X, Check } from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import DropZone from '../components/DropZone';
import PremiumDropdown from '../components/PremiumDropdown';

const HospitalDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showOnboardModal, setShowOnboardModal] = useState(false);
    const [onboardData, setOnboardData] = useState({ 
        name: '', 
        email: '', 
        gender: 'Male',
        dateOfBirth: '',
        phone: '',
        alternatePhone: '',
        specialization: '', 
        medicalLicenseNumber: '', 
        medicalCouncil: '',
        licenseExpiryDate: '',
        medicalDegree: '',
        yearsOfExperience: '',
        consultationFee: '',
        workingDaysArray: [],
        startTime: '09:00',
        endTime: '17:00',
        breakTimings: '13:00 - 14:00',
        maxPatientsPerDay: '30',
        college: '',
        additionalCertifications: '',
        employeeId: '',
        opdRoomNumber: '',
        salary: '',
        contractType: 'PERMANENT',
        revenueSharePercentage: '',
        canPrescribe: true,
        canEditPatientData: false,
        canAccessReports: true,
        canManageAppointments: true,
        age: '',
        password: 'Password@123',
        // Advanced Professional Fields
        subSpecialties: '',
        languagesSpoken: '',
        proceduresHandled: '',
        publications: '',
        treatmentFocus: '',
        slotDuration: '15'
    });
    const [submitting, setSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [licenseFile, setLicenseFile] = useState(null);

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const handleDayToggle = (day) => {
        setOnboardData(prev => ({
            ...prev,
            workingDaysArray: prev.workingDaysArray.includes(day)
                ? prev.workingDaysArray.filter(d => d !== day)
                : [...prev.workingDaysArray, day]
        }));
    };

    const [auditLogs, setAuditLogs] = useState([]);

    const fetchInstitutionalData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [statsRes, doctorsRes, auditRes] = await Promise.all([
                api.get('/hospital/stats'),
                api.get('/hospital/doctors'),
                api.get('/hospital/audit-logs')
            ]);
            setStats(statsRes.data);
            setDoctors(doctorsRes.data);
            setAuditLogs(auditRes.data);
        } catch (err) {
            console.error("Institutional sync failed", err);
            if (!silent) toast.error("Failed to synchronize hospital data");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const [loadFluctuations, setLoadFluctuations] = useState({ Cardiology: 88, Neurology: 65, Pediatrics: 94 });

    useEffect(() => {
        fetchInstitutionalData();
        
        const syncInterval = setInterval(() => {
            fetchInstitutionalData(true);
        }, 10000);

        // Institutional Vitality Engine: Simulates real-time clinical micro-movements
        const vitalitySync = setInterval(() => {
            setLoadFluctuations(prev => ({
                Cardiology: Math.min(100, Math.max(80, prev.Cardiology + (Math.random() - 0.5) * 4)),
                Neurology: Math.min(100, Math.max(60, prev.Neurology + (Math.random() - 0.5) * 3)),
                Pediatrics: Math.min(100, Math.max(85, prev.Pediatrics + (Math.random() - 0.5) * 5))
            }));
        }, 3000);

        return () => {
            clearInterval(syncInterval);
            clearInterval(vitalitySync);
        };
    }, []);

    useEffect(() => {
        if (onboardData.dateOfBirth) {
            const birthDate = new Date(onboardData.dateOfBirth);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (!isNaN(age) && age >= 0) {
                setOnboardData(prev => ({ ...prev, age: String(age) }));
            }
        }
    }, [onboardData.dateOfBirth]);

    const approveDoctor = async (id) => {
        try {
            await api.post(`/hospital/approve-doctor/${id}`);
            toast.success("Physician credentials verified and approved");
            setDoctors(prev => prev.map(d => d.id === id ? { ...d, approved: true } : d));
        } catch (err) {
            toast.error("Institutional approval failed");
        }
    };

    const formatTime = (time24) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${String(h12).padStart(2, '0')}:${minutes} ${ampm}`;
    };

    const handleOnboardStaff = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const formDataToSend = new FormData();
            
            // Format days and timings for backend compatibility
            const workingDays = onboardData.workingDaysArray.join(', ');
            const consultationTimings = `${formatTime(onboardData.startTime)} - ${formatTime(onboardData.endTime)}`;

            const userData = {
                ...onboardData,
                workingDays,
                consultationTimings,
                username: onboardData.email,
                hospital: stats?.hospitalId != null ? String(stats.hospitalId) : '',
                hospitalName: stats?.hospitalName || '',
                razorpayAccountId: stats?.razorpayKeyId || '',
                upiId: stats?.upiId || '',
                // Advanced Professional Mapping
                subSpecialties: onboardData.subSpecialties,
                languagesSpoken: onboardData.languagesSpoken,
                proceduresHandled: onboardData.proceduresHandled,
                publications: onboardData.publications,
                treatmentFocus: onboardData.treatmentFocus,
                slotDuration: onboardData.slotDuration
            };
            formDataToSend.append('userData', JSON.stringify(userData));
            
            if (selectedFile) formDataToSend.append('profilePicture', selectedFile);
            if (licenseFile) formDataToSend.append('licenseDocument', licenseFile);
            
            await api.post('/auth/register/doctor', formDataToSend);
            toast.success("Staff member onboarded and is now active for booking!");
            fetchInstitutionalData(); // Refresh the list
            setShowOnboardModal(false);
            setOnboardData({ 
                name: '', 
                email: '', 
                gender: 'Male',
                dateOfBirth: '',
                phone: '',
                alternatePhone: '',
                specialization: '', 
                medicalLicenseNumber: '', 
                medicalCouncil: '',
                licenseExpiryDate: '',
                medicalDegree: '',
                yearsOfExperience: '',
                consultationFee: '',
                workingDaysArray: [],
                startTime: '09:00',
                endTime: '17:00',
                breakTimings: '13:00 - 14:00',
                maxPatientsPerDay: '30',
                college: '',
                additionalCertifications: '',
                employeeId: '',
                opdRoomNumber: '',
                salary: '',
                contractType: 'PERMANENT',
                revenueSharePercentage: '',
                canPrescribe: true,
                canEditPatientData: false,
                canAccessReports: true,
                canManageAppointments: true,
                age: '',
                password: 'Password@123' 
            });
            setSelectedFile(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to onboard staff");
        } finally {
            setSubmitting(false);
        }
    };

    const onboardInputClass = "w-full px-6 py-4 bg-slate-50 border-none rounded-3xl text-xs font-bold focus:ring-2 ring-primary/20 transition-all placeholder:text-slate-300";
    const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-2 block";

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase italic">
                        Hospital <span className="not-italic text-primary">Portal</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-2 ml-1">
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Live Sync Active</span>
                        </div>
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
                            Hospital Management Suite • {stats?.hospitalName} 
                            {stats?.location && <span className="ml-2 text-primary/50">({stats.location})</span>}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowOnboardModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <UserPlus size={16} /> Onboard Staff
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Total Staff', value: stats?.totalDoctors, icon: <Users />, color: 'bg-blue-500' },
                    { label: 'Active Depts', value: stats?.activeDepts, icon: <Building2 />, color: 'bg-indigo-500' },
                    { label: 'Patient Reach', value: stats?.totalPatientsInstitutional, icon: <TrendingUp />, color: 'bg-emerald-500' },
                    { label: 'Inst. Revenue', value: `${stats?.currency || '₹'}${stats?.totalRevenue?.toLocaleString() || '0'}`, icon: <Activity />, color: 'bg-amber-500' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-24 h-24 ${stat.color} opacity-5 -mr-8 -mt-8 rounded-full group-hover:scale-110 transition-transform`} />
                        <div className="relative z-10">
                            <div className={`w-12 h-12 ${stat.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/10`}>
                                {stat.icon}
                            </div>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">{stat.value}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Institutional High-Fidelity Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 text-left">
                <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 -mr-32 -mt-32 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
                    <div className="relative z-10">
                        <h3 className="text-white text-xl font-black uppercase tracking-tight italic mb-8">Departmental <span className="text-primary not-italic">Load Dynamics</span></h3>
                        <div className="space-y-8">
                            {[
                                { name: 'Cardiology', value: Math.round(loadFluctuations.Cardiology), color: 'bg-blue-500' },
                                { name: 'Neurology', value: Math.round(loadFluctuations.Neurology), color: 'bg-indigo-500' },
                                { name: 'Pediatrics', value: Math.round(loadFluctuations.Pediatrics), color: 'bg-rose-500' },
                            ].map((dept, idx) => (
                                <div key={idx} className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <span>{dept.name}</span>
                                        <span className="text-white font-bold">{dept.value}% Clinical Load</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${dept.color} rounded-full transition-all duration-1000 ease-in-out`} 
                                            style={{ width: `${dept.value}%` }} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="mt-10 w-full py-4 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center gap-2">
                            Manage Departments <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl relative overflow-hidden group">
                        <div className="flex items-center gap-4 mb-6 text-left">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                <ShieldAlert size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Security <span className="not-italic text-amber-600">Sentinel</span></h3>
                        </div>
                        <div className="space-y-4 mb-8 text-left">
                            {auditLogs.length > 0 ? (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">{auditLogs[0].action}</p>
                                    <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase">{auditLogs[0].details}</p>
                                    <p className="text-[8px] font-black text-primary uppercase mt-2">{new Date(auditLogs[0].createdAt).toLocaleString()}</p>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-xs font-bold leading-relaxed">
                                    No critical security events detected in the current clinical cycle. Institutional integrity is OPTIMAL.
                                </p>
                            )}
                        </div>
                        <button 
                            onClick={() => navigate('/hospital-dashboard/institutional-profile')}
                            className="w-full flex items-center justify-between p-4 bg-slate-900 rounded-2xl text-white group-hover:bg-primary transition-all"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">Review Security Ledger</span>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="bg-primary p-10 rounded-[3.5rem] shadow-xl shadow-primary/20 relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -mr-16 -mt-16 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
                        <h3 className="text-white text-xl font-black uppercase tracking-tight italic mb-2">Clinical <span className="not-italic text-slate-900">Reach</span></h3>
                        <p className="text-white/80 text-[10px] font-black uppercase tracking-widest">{stats?.totalPatientsInstitutional} Active Registrations</p>
                    </div>
                </div>
            </div>

            {/* Institutional Staff Roster */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden mb-12">
                <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Institutional <span className="not-italic text-primary">Staff Roster</span></h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Personnel management and clinical authorization</p>
                    </div>
                    <div className="flex bg-white border border-slate-200 rounded-2xl px-4 py-2 focus-within:ring-2 ring-primary/20 transition-all">
                        <Search size={16} className="text-slate-400 mt-1 mr-2" />
                        <input 
                            type="text" 
                            placeholder="Search personnel..."
                            className="border-none text-xs p-0 focus:ring-0 placeholder:text-slate-300 w-48"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Specialization</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee ID</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">OPD Room</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Permissions</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {doctors.length > 0 ? doctors.map((doctor) => (
                                <tr key={doctor.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform overflow-hidden">
                                                {doctor.profilePictureUrl ? (
                                                    <img src={doctor.profilePictureUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Users size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800 tracking-tight italic">{doctor.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{doctor.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="px-3 py-1 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest rounded-lg">
                                            {doctor.specialization}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <span className="font-mono text-xs font-bold text-slate-600">{doctor.employeeId || 'ST-999'}</span>
                                    </td>
                                    <td className="p-6 text-xs font-bold text-slate-600">{doctor.opdRoomNumber || 'N/A'}</td>
                                    <td className="p-6">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{doctor.contractType || 'PERMANENT'}</span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex gap-1.5">
                                            {doctor.canPrescribe && <div title="Prescribe" className="w-2 h-2 rounded-full bg-emerald-500" />}
                                            {doctor.canEditPatientData && <div title="Edit Data" className="w-2 h-2 rounded-full bg-blue-500" />}
                                            {doctor.canAccessReports && <div title="Reports" className="w-2 h-2 rounded-full bg-indigo-500" />}
                                            {doctor.canManageAppointments && <div title="Appointments" className="w-2 h-2 rounded-full bg-amber-500" />}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            {doctor.approved ? (
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                    <ClipboardCheck size={12} /> Active
                                                </span>
                                            ) : (
                                                <button 
                                                    onClick={() => approveDoctor(doctor.id)}
                                                    className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all"
                                                >
                                                    Verify Now
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No personnel onboarded to this institutional node.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Onboard Staff Modal */}
            {showOnboardModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-100 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 flex flex-col max-h-[90vh]">
                        
                        {/* Modal Header & Portrait DropZone */}
                        <div className="p-10 bg-slate-900 text-white relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 -mr-32 -mt-32 rounded-full blur-[80px]" />
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <h3 className="text-3xl font-black uppercase tracking-tight italic">Onboard <span className="not-italic text-primary">New Physician</span></h3>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Register a new medical professional to your institution</p>
                                </div>
                                <button onClick={() => setShowOnboardModal(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div className="mt-10">
                                <DropZone 
                                    onFileSelect={setSelectedFile}
                                    label="Identity Portrait"
                                    type="portrait"
                                    accept="image/*"
                                />
                            </div>
                        </div>

                        {/* Form Content */}
                        <form onSubmit={handleOnboardStaff} className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white">
                            
                            {/* Section 1: Basic Identity */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">1. Basic Identity</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><label className={labelClass}>Full Name</label><input type="text" required value={onboardData.name} onChange={(e) => setOnboardData({...onboardData, name: e.target.value})} className={onboardInputClass} placeholder="Dr. Alexander Wright" /></div>
                                    <div><label className={labelClass}>Work Email</label><input type="email" required value={onboardData.email} onChange={(e) => setOnboardData({...onboardData, email: e.target.value})} className={onboardInputClass} placeholder="a.wright@hospital.com" /></div>
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <PremiumDropdown 
                                        label="Gender"
                                        options={['Male', 'Female', 'Other']}
                                        value={onboardData.gender}
                                        onChange={(val) => setOnboardData({...onboardData, gender: val})}
                                    />
                                    <div><label className={labelClass}>Age</label><input type="number" value={onboardData.age} onChange={(e) => setOnboardData({...onboardData, age: e.target.value})} className={onboardInputClass} placeholder="35" /></div>
                                    <div><label className={labelClass}>Date of Birth</label><input type="date" value={onboardData.dateOfBirth} onChange={(e) => setOnboardData({...onboardData, dateOfBirth: e.target.value})} className={onboardInputClass} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div><label className={labelClass}>Primary Phone</label><input type="tel" required value={onboardData.phone} onChange={(e) => setOnboardData({...onboardData, phone: e.target.value})} className={onboardInputClass} placeholder="+91 98765 43210" /></div>
                                    <div><label className={labelClass}>Alt Phone (Optional)</label><input type="tel" value={onboardData.alternatePhone} onChange={(e) => setOnboardData({...onboardData, alternatePhone: e.target.value})} className={onboardInputClass} placeholder="Alternate contact" /></div>
                                </div>
                            </div>

                            {/* Section 2: Clinical Credentials */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">2. Clinical Credentials</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <PremiumDropdown 
                                        label="Medical Degree"
                                        options={['MBBS', 'MD', 'MS', 'DM', 'MCh', 'DNB', 'PhD']}
                                        value={onboardData.medicalDegree}
                                        onChange={(val) => setOnboardData({...onboardData, medicalDegree: val})}
                                        placeholder="Select Degree"
                                        icon={<GraduationCap size={16} />}
                                    />
                                    <PremiumDropdown 
                                        label="Specialization"
                                        options={['Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Orthopedics', 'Psychiatry', 'Gastroenterology']}
                                        value={onboardData.specialization}
                                        onChange={(val) => setOnboardData({...onboardData, specialization: val})}
                                        placeholder="Select Specialization"
                                        searchable={true}
                                        icon={<Activity size={16} />}
                                    />
                                </div>
                                <div><label className={labelClass}>Medical College / Alma Mater</label><input type="text" value={onboardData.college} onChange={(e) => setOnboardData({...onboardData, college: e.target.value})} className={onboardInputClass} placeholder="AIIMS Delhi" /></div>
                                <div><label className={labelClass}>Additional Certifications (Comma Separated)</label><textarea value={onboardData.additionalCertifications} onChange={(e) => setOnboardData({...onboardData, additionalCertifications: e.target.value})} className={`${onboardInputClass} min-h-[80px] resize-none`} placeholder="Fellow of the American College of Cardiology, etc." /></div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div><label className={labelClass}>Medical Council</label><input type="text" required value={onboardData.medicalCouncil} onChange={(e) => setOnboardData({...onboardData, medicalCouncil: e.target.value})} className={onboardInputClass} placeholder="National Medical Commission" /></div>
                                    <div><label className={labelClass}>License Expiry</label><input type="date" required value={onboardData.licenseExpiryDate} onChange={(e) => setOnboardData({...onboardData, licenseExpiryDate: e.target.value})} className={onboardInputClass} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div><label className={labelClass}>Medical License Number</label><input type="text" required value={onboardData.medicalLicenseNumber} onChange={(e) => setOnboardData({...onboardData, medicalLicenseNumber: e.target.value})} className={`${onboardInputClass} font-mono`} placeholder="MC-99281-Z" /></div>
                                    <div><label className={labelClass}>Experience (Yrs)</label><input type="number" required value={onboardData.yearsOfExperience} onChange={(e) => setOnboardData({...onboardData, yearsOfExperience: e.target.value})} className={onboardInputClass} placeholder="12" /></div>
                                </div>
                                
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <label className={labelClass}>Medical License Document (PDF/Image)</label>
                                    <DropZone 
                                        onFileSelect={setLicenseFile}
                                        label="Upload Credentials"
                                        type="document"
                                        accept=".pdf,image/*"
                                    />
                                </div>
                            </div>

                            {/* Section 3: Professional Depth */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">3. Professional Depth</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div><label className={labelClass}>Sub-Specialties</label><input type="text" value={onboardData.subSpecialties} onChange={(e) => setOnboardData({...onboardData, subSpecialties: e.target.value})} className={onboardInputClass} placeholder="Diabetology, Hypertension" /></div>
                                    <div><label className={labelClass}>Languages Spoken</label><input type="text" value={onboardData.languagesSpoken} onChange={(e) => setOnboardData({...onboardData, languagesSpoken: e.target.value})} className={onboardInputClass} placeholder="English, Hindi, Spanish" /></div>
                                </div>
                                <div className="grid grid-cols-1 gap-6">
                                    <div><label className={labelClass}>Treatment Focus</label><input type="text" value={onboardData.treatmentFocus} onChange={(e) => setOnboardData({...onboardData, treatmentFocus: e.target.value})} className={onboardInputClass} placeholder="Evidence-based Cardiology" /></div>
                                </div>
                                <div><label className={labelClass}>Procedures Handled</label><textarea value={onboardData.proceduresHandled} onChange={(e) => setOnboardData({...onboardData, proceduresHandled: e.target.value})} className={`${onboardInputClass} min-h-[80px] resize-none`} placeholder="Angioplasty, Echo, Stress Test" /></div>
                                <div><label className={labelClass}>Scientific Publications</label><textarea value={onboardData.publications} onChange={(e) => setOnboardData({...onboardData, publications: e.target.value})} className={`${onboardInputClass} min-h-[80px] resize-none`} placeholder="Journal articles, Research papers..." /></div>
                            </div>

                            {/* Section 3: Institutional Mapping */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">3. Institutional Mapping</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div><label className={labelClass}>Employee ID</label><input type="text" required value={onboardData.employeeId} onChange={(e) => setOnboardData({...onboardData, employeeId: e.target.value})} className="w-full px-6 py-4 bg-blue-50/50 border-none rounded-3xl text-xs font-bold focus:ring-2 ring-blue-100 transition-all text-blue-700 placeholder:text-blue-200" placeholder="ST-2026-001" /></div>
                                    <div><label className={labelClass}>OPD Room No.</label><input type="text" required value={onboardData.opdRoomNumber} onChange={(e) => setOnboardData({...onboardData, opdRoomNumber: e.target.value})} className="w-full px-6 py-4 bg-emerald-50/50 border-none rounded-3xl text-xs font-bold focus:ring-2 ring-emerald-100 transition-all text-emerald-700 placeholder:text-emerald-200" placeholder="OPD-204" /></div>
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <PremiumDropdown 
                                        label="Role Type"
                                        options={['Full-time Employee', 'Visiting Consultant', 'Resident Physician', 'Medical Intern']}
                                        value={onboardData.contractType === 'PERMANENT' ? 'Full-time Employee' : onboardData.contractType}
                                        onChange={(val) => setOnboardData({...onboardData, contractType: val === 'Full-time Employee' ? 'PERMANENT' : val})}
                                        icon={<Briefcase size={16} />}
                                    />
                                    <div><label className={labelClass}>Max Patients/Day</label><input type="number" required value={onboardData.maxPatientsPerDay} onChange={(e) => setOnboardData({...onboardData, maxPatientsPerDay: e.target.value})} className={onboardInputClass} placeholder="30" /></div>
                                    <div><label className={labelClass}>Slot Duration (Min)</label><input type="number" required value={onboardData.slotDuration} onChange={(e) => setOnboardData({...onboardData, slotDuration: e.target.value})} className={onboardInputClass} placeholder="15" /></div>
                                </div>
                                <div>
                                    <label className={labelClass}>Working Days</label>
                                    <div className="flex flex-wrap gap-3">
                                        {daysOfWeek.map(day => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => handleDayToggle(day)}
                                                className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                                                    onboardData.workingDaysArray.includes(day)
                                                        ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105'
                                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <div><label className={labelClass}>Shift Starts</label><input type="time" required value={onboardData.startTime} onChange={(e) => setOnboardData({...onboardData, startTime: e.target.value})} className={onboardInputClass} /></div>
                                    <div><label className={labelClass}>Shift Ends</label><input type="time" required value={onboardData.endTime} onChange={(e) => setOnboardData({...onboardData, endTime: e.target.value})} className={onboardInputClass} /></div>
                                    <div><label className={labelClass}>Break Timings</label><input type="text" required value={onboardData.breakTimings} onChange={(e) => setOnboardData({...onboardData, breakTimings: e.target.value})} className={onboardInputClass} placeholder="13:00 - 14:00" /></div>
                                </div>
                            </div>

                            {/* Section 4: Financial Governance */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">4. Financial Governance</h4>
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <div><label className={labelClass}>Monthly Salary (₹)</label><input type="number" required value={onboardData.salary} onChange={(e) => setOnboardData({...onboardData, salary: e.target.value})} className="w-full px-6 py-4 bg-blue-50/50 border-none rounded-3xl text-xs font-bold focus:ring-2 ring-blue-100 transition-all text-blue-700 placeholder:text-blue-200" placeholder="150000" /></div>
                                    <div><label className={labelClass}>Revenue Share (%)</label><input type="number" value={onboardData.revenueSharePercentage} onChange={(e) => setOnboardData({...onboardData, revenueSharePercentage: e.target.value})} className="w-full px-6 py-4 bg-blue-50/50 border-none rounded-3xl text-xs font-bold focus:ring-2 ring-blue-100 transition-all text-blue-700 placeholder:text-blue-200" placeholder="0" /></div>
                                    <div><label className={labelClass}>OPD Fee (₹)</label><input type="number" required value={onboardData.consultationFee} onChange={(e) => setOnboardData({...onboardData, consultationFee: e.target.value})} className="w-full px-6 py-4 bg-emerald-50/50 border-none rounded-3xl text-xs font-bold focus:ring-2 ring-emerald-100 transition-all text-emerald-700 placeholder:text-emerald-200" placeholder="500" /></div>
                                </div>
                                
                                {/* Institutional Financial Sync */}
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <CreditCard size={14} className="text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Payment Gateway Enforcement</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Institutional Razorpay ID</label>
                                            <div className="px-4 py-3 bg-white rounded-xl text-[10px] font-mono font-bold text-slate-600 border border-slate-100">
                                                {stats?.razorpayKeyId || 'NOT_CONFIGURED'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Institutional UPI ID</label>
                                            <div className="px-4 py-3 bg-white rounded-xl text-[10px] font-mono font-bold text-slate-600 border border-slate-100">
                                                {stats?.upiId || 'NOT_CONFIGURED'}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[8px] font-bold text-primary uppercase leading-tight">
                                        Locked: This physician will use institutional payment nodes for all clinical transactions.
                                    </p>
                                </div>
                            </div>

                            {/* Section 5: Permissions Matrix */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">5. Permissions Matrix</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { key: 'canPrescribe', label: 'Prescribe Medication' },
                                        { key: 'canEditPatientData', label: 'Edit Patient Data' },
                                        { key: 'canAccessReports', label: 'Access Medical Reports' },
                                        { key: 'canManageAppointments', label: 'Modify Schedule' },
                                    ].map(perm => (
                                        <label key={perm.key} className={`flex items-center gap-4 p-5 rounded-[2rem] cursor-pointer transition-all duration-300 border-2
                                            ${onboardData[perm.key] 
                                                ? 'bg-primary/5 border-primary/10' 
                                                : 'bg-slate-50 border-transparent hover:bg-slate-100'}
                                        `}>
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300
                                                ${onboardData[perm.key] ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200'}
                                            `}>
                                                {onboardData[perm.key] && <Check size={14} strokeWidth={4} />}
                                            </div>
                                            <input 
                                                type="checkbox"
                                                className="hidden"
                                                checked={onboardData[perm.key]}
                                                onChange={(e) => setOnboardData({...onboardData, [perm.key]: e.target.checked})}
                                            />
                                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{perm.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Final Footer Details */}
                            <div className="p-10 bg-blue-50/50 rounded-[3rem] border border-blue-100/50 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <h5 className="text-[11px] font-black uppercase tracking-widest text-primary">Initial Access Keys</h5>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">System-generated credentials for first login</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Default Password</p>
                                        <p className="text-xl font-black text-slate-900 tracking-tight">Password@123</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Login Via</p>
                                        <p className="text-xl font-black text-slate-900 tracking-tight italic">Work Email</p>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Modal Actions */}
                        <div className="p-10 border-t border-slate-50 bg-slate-50/30 shrink-0 flex gap-4">
                            <button 
                                type="button"
                                onClick={() => setShowOnboardModal(false)}
                                className="flex-1 py-5 bg-white border border-slate-200 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-slate-100 transition-all active:scale-95 shadow-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleOnboardStaff}
                                disabled={submitting}
                                className="flex-[2] py-5 bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-primary/90 transition-all active:scale-95 shadow-xl shadow-primary/20 disabled:opacity-50"
                            >
                                {submitting ? 'Authorizing...' : 'Authorize & Onboard'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HospitalDashboard;
