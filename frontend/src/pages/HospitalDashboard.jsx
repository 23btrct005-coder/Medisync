import React, { useState, useEffect } from 'react';
import { Building2, Users, ClipboardCheck, TrendingUp, ShieldAlert, ChevronRight, UserPlus, Search, Activity } from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';

const HospitalDashboard = () => {
    const [stats, setStats] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstitutionalData = async () => {
            try {
                const [statsRes, doctorsRes] = await Promise.all([
                    api.get('/hospital/stats'),
                    api.get('/hospital/doctors')
                ]);
                setStats(statsRes.data);
                setDoctors(doctorsRes.data);
            } catch (err) {
                console.error("Institutional sync failed", err);
                toast.error("Failed to synchronize hospital data");
            } finally {
                setLoading(false);
            }
        };
        fetchInstitutionalData();
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

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <Activity className="animate-spin text-primary" size={48} />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            {/* Header Section */}
            <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase italic">
                        Institutional <span className="not-italic text-primary">Command</span>
                    </h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-1">Hospital Management Suite • {stats?.hospitalName}</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-primary/20 transition-all">
                        <UserPlus size={16} /> Onboard Staff
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Total Staff', value: stats?.totalDoctors, icon: <Users />, color: 'bg-blue-500' },
                    { label: 'Active Depts', value: '12', icon: <Building2 />, color: 'bg-indigo-500' },
                    { label: 'Clinical Reach', value: stats?.totalPatientsInstitutional, icon: <TrendingUp />, color: 'bg-emerald-500' },
                    { label: 'Pending Auth', value: stats?.pendingDoctors, icon: <ShieldAlert />, color: 'bg-rose-500' },
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

            {/* Main Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                {/* Staff Roster */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                                <ClipboardCheck className="text-primary" /> Staff Physician Roster
                            </h2>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search staff..." 
                                    className="pl-12 pr-6 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold w-64 focus:ring-2 ring-primary/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {doctors.map(doctor => (
                                <div key={doctor.id} className="flex items-center gap-6 p-6 bg-slate-50 border border-slate-100 rounded-3xl group hover:border-primary/20 transition-all">
                                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0">
                                        <img 
                                            src={doctor.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.id}`} 
                                            alt={doctor.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">Dr. {doctor.name}</h4>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">{doctor.specialization}</p>
                                        <div className="flex items-center gap-3 mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                            <div className="bg-emerald-500 h-full w-[85%]" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {doctor.approved ? (
                                            <span className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-xl">Verified Access</span>
                                        ) : (
                                            <button 
                                                onClick={() => approveDoctor(doctor.id)}
                                                className="px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-all"
                                            >
                                                Approve Staff
                                            </button>
                                        )}
                                        <button className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-primary transition-all">
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Side Panel: Departments */}
                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white">
                        <h3 className="text-xl font-black mb-8 uppercase tracking-tight italic">Dept <span className="not-italic text-primary">Velocity</span></h3>
                        <div className="space-y-6">
                            {[
                                { name: 'Cardiology', load: '88%', trend: 'up' },
                                { name: 'Neurology', load: '65%', trend: 'stable' },
                                { name: 'Pediatrics', load: '94%', trend: 'up' },
                            ].map((dept, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{dept.name}</span>
                                        <span className="text-[10px] font-black text-white">{dept.load}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className={`h-full ${idx === 2 ? 'bg-rose-500' : 'bg-primary'} rounded-full`} style={{ width: dept.load }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                            <ShieldAlert size={14} /> Security Alert
                        </h4>
                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight">
                            Institutional audit detected 3 unverified access attempts in the Orthopedics department. Review Security Ledger immediately.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HospitalDashboard;
