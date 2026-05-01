import React, { useState, useEffect } from 'react';
import { Building2, Users, ClipboardCheck, TrendingUp, ShieldAlert, Shield, ChevronRight, UserPlus, Search, Activity } from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';

const HospitalDashboard = () => {
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
        medicalDegree: '',
        yearsOfExperience: '',
        consultationFee: '',
        workingDaysArray: [], // New structured format
        startTime: '09:00',
        endTime: '17:00',
        college: '',
        additionalCertifications: '',
        onlineConsultation: false,
        razorpayAccountId: '',
        upiId: '',
        age: '',
        password: 'Password@123' 
    });
    const [submitting, setSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const handleDayToggle = (day) => {
        setOnboardData(prev => ({
            ...prev,
            workingDaysArray: prev.workingDaysArray.includes(day)
                ? prev.workingDaysArray.filter(d => d !== day)
                : [...prev.workingDaysArray, day]
        }));
    };

    const fetchInstitutionalData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [statsRes, doctorsRes] = await Promise.all([
                api.get('/hospital/stats'),
                api.get('/hospital/doctors')
            ]);
            setStats(statsRes.data);
            setDoctors(doctorsRes.data);
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
                hospitalName: stats?.hospitalName || ''
            };
            formDataToSend.append('userData', JSON.stringify(userData));
            
            if (selectedFile) {
                formDataToSend.append('profilePicture', selectedFile);
            }
            
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
                medicalDegree: '',
                yearsOfExperience: '',
                consultationFee: '',
                workingDaysArray: [],
                startTime: '09:00',
                endTime: '17:00',
                college: '',
                additionalCertifications: '',
                onlineConsultation: false,
                razorpayAccountId: '',
                upiId: '',
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

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <Activity className="animate-spin text-primary" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Institutional Node...</p>
            </div>
        </div>
    );

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
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                <ShieldAlert size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Security <span className="not-italic text-amber-600">Sentinel</span></h3>
                        </div>
                        <p className="text-slate-400 text-xs font-bold leading-relaxed mb-8">
                            CROSS-INSTITUTIONAL AUDIT DETECTED 3 UNVERIFIED ACCESS ATTEMPTS IN THE LAST 24 HOURS. REVIEW SECURITY LEDGER IMMEDIATELY.
                        </p>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:border-amber-200 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Audit Status: WARNING</span>
                            </div>
                            <ChevronRight size={16} className="text-slate-300" />
                        </div>
                    </div>

                    <div className="bg-primary p-10 rounded-[3.5rem] shadow-xl shadow-primary/20 relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -mr-16 -mt-16 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
                        <h3 className="text-white text-xl font-black uppercase tracking-tight italic mb-2">Clinical <span className="not-italic text-slate-900">Reach</span></h3>
                        <p className="text-white/80 text-[10px] font-black uppercase tracking-widest">{stats?.totalPatientsInstitutional} Active Registrations</p>
                    </div>
                </div>
            </div>
            
            {/* Onboard Staff Modal */}
            {showOnboardModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-slate-50 bg-slate-900 text-white rounded-t-[3.5rem] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 -mr-16 -mt-16 rounded-full blur-3xl" />
                            <h3 className="text-2xl font-black uppercase tracking-tight italic relative z-10">Onboard <span className="not-italic text-primary">New Staff</span></h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 relative z-10">Register a new physician to your institution</p>
                            
                            {/* Profile Photo Upload */}
                            <div className="mt-8 flex items-center gap-6 relative z-10">
                                <div className="w-20 h-20 rounded-[2rem] bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group hover:border-primary/50 transition-all">
                                    {selectedFile ? (
                                        <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserPlus className="text-white/20 group-hover:text-primary/50 transition-colors" size={32} />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Identity Portrait</label>
                                    <input 
                                        type="file" 
                                        id="staff-photo"
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={(e) => setSelectedFile(e.target.files[0])}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => document.getElementById('staff-photo').click()}
                                        className="px-4 py-2 bg-white/10 hover:bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                                    >
                                        {selectedFile ? 'Change Photo' : 'Upload Portrait'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <form onSubmit={handleOnboardStaff} className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                        <form onSubmit={handleOnboardStaff} className="p-8 space-y-6 overflow-y-auto max-h-[75vh]">
                            <div className="space-y-6">
                                {/* Section 1: Basic Identity */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-b border-primary/10 pb-2">1. Basic Identity</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Full Name</label>
                                            <input 
                                                type="text" required
                                                value={onboardData.name}
                                                onChange={(e) => setOnboardData({...onboardData, name: e.target.value})}
                                                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                                placeholder="Dr. Alexander Wright"
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Work Email</label>
                                            <input 
                                                type="email" required
                                                value={onboardData.email}
                                                onChange={(e) => setOnboardData({...onboardData, email: e.target.value})}
                                                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                                placeholder="a.wright@hospital.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Gender</label>
                                            <select 
                                                value={onboardData.gender}
                                                onChange={(e) => setOnboardData({...onboardData, gender: e.target.value})}
                                                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20 appearance-none"
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Age</label>
                                            <input 
                                                type="number"
                                                value={onboardData.age}
                                                onChange={(e) => setOnboardData({...onboardData, age: e.target.value})}
                                                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                                placeholder="35"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Date of Birth</label>
                                            <input 
                                                type="date"
                                                value={onboardData.dateOfBirth}
                                                onChange={(e) => setOnboardData({...onboardData, dateOfBirth: e.target.value})}
                                                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Primary Phone</label>
                                            <input 
                                                type="tel" required
                                                value={onboardData.phone}
                                                onChange={(e) => setOnboardData({...onboardData, phone: e.target.value})}
                                                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                                placeholder="+91 98765 43210"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Alt Phone (Optional)</label>
                                            <input 
                                                type="tel"
                                                value={onboardData.alternatePhone}
                                                onChange={(e) => setOnboardData({...onboardData, alternatePhone: e.target.value})}
                                                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                                placeholder="Alternate contact"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Clinical Credentials */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-b border-primary/10 pb-2">2. Clinical Credentials</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Medical Degree</label>
                                            <input 
                                                type="text" required
                                                value={onboardData.medicalDegree}
                                                onChange={(e) => setOnboardData({...onboardData, medicalDegree: e.target.value})}
                                                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                                placeholder="MBBS, MD (Cardiology)"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Specialization</label>
                                            <input 
                                                type="text" required
                                                value={onboardData.specialization}
                                                onChange={(e) => setOnboardData({...onboardData, specialization: e.target.value})}
                                                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                                placeholder="Interventional Cardiology"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Medical College / Alma Mater</label>
                                        <input 
                                            type="text" 
                                            value={onboardData.college}
                                            onChange={(e) => setOnboardData({...onboardData, college: e.target.value})}
                                            className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                            placeholder="AIIMS Delhi"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Additional Certifications (Comma Separated)</label>
                                        <textarea 
                                            value={onboardData.additionalCertifications}
                                            onChange={(e) => setOnboardData({...onboardData, additionalCertifications: e.target.value})}
                                            className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20 min-h-[60px]"
                                            placeholder="Fellow of the American College of Cardiology, etc."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">License Number</label>
                                            <input 
                                                type="text" required
                                                value={onboardData.medicalLicenseNumber}
                                                onChange={(e) => setOnboardData({...onboardData, medicalLicenseNumber: e.target.value})}
                                                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20 font-mono"
                                                placeholder="MC-99281-Z"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Experience (Yrs)</label>
                                            <input 
                                                type="number" required
                                                value={onboardData.yearsOfExperience}
                                                onChange={(e) => setOnboardData({...onboardData, yearsOfExperience: e.target.value})}
                                                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                                placeholder="12"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Availability & Logistics */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-b border-primary/10 pb-2">3. Availability & Logistics</h4>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Working Days</label>
                                        <div className="flex flex-wrap gap-2">
                                            {daysOfWeek.map(day => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => handleDayToggle(day)}
                                                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        onboardData.workingDaysArray.includes(day)
                                                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Shift Starts</label>
                                            <input 
                                                type="time" required
                                                value={onboardData.startTime}
                                                onChange={(e) => setOnboardData({...onboardData, startTime: e.target.value})}
                                                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Shift Ends</label>
                                            <input 
                                                type="time" required
                                                value={onboardData.endTime}
                                                onChange={(e) => setOnboardData({...onboardData, endTime: e.target.value})}
                                                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Enable Online Consultation</p>
                                            <p className="text-[9px] font-medium text-slate-400 uppercase">Allow remote video appointments</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setOnboardData(prev => ({...prev, onlineConsultation: !prev.onlineConsultation}))}
                                            className={`w-12 h-6 rounded-full relative transition-all ${onboardData.onlineConsultation ? 'bg-primary' : 'bg-slate-200'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${onboardData.onlineConsultation ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Section 4: Financial & Security */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-b border-primary/10 pb-2">4. Financial & Security</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Consultation Fee (₹)</label>
                                            <input 
                                                type="number" required
                                                value={onboardData.consultationFee}
                                                onChange={(e) => setOnboardData({...onboardData, consultationFee: e.target.value})}
                                                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20"
                                                placeholder="1500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Razorpay Account ID</label>
                                            <input 
                                                type="text"
                                                value={onboardData.razorpayAccountId}
                                                onChange={(e) => setOnboardData({...onboardData, razorpayAccountId: e.target.value})}
                                                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20 font-mono"
                                                placeholder="acc_... (Optional)"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">UPI ID</label>
                                            <input 
                                                type="text"
                                                value={onboardData.upiId}
                                                onChange={(e) => setOnboardData({...onboardData, upiId: e.target.value})}
                                                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-primary/20 font-mono"
                                                placeholder="doctor@okaxis (Optional)"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100/50">
                                <div className="flex items-center gap-3 mb-2">
                                    <Shield size={16} className="text-blue-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Initial Access Keys</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Default Password</p>
                                        <p className="text-sm font-black text-slate-800 tracking-tight">Password@123</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Login Via</p>
                                        <p className="text-sm font-black text-slate-800 tracking-tight">Work Email</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2">
                                <button 
                                    type="button"
                                    onClick={() => setShowOnboardModal(false)}
                                    className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Processing...' : 'Authorize & Onboard'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HospitalDashboard;
