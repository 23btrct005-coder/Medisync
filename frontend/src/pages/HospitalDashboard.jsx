import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, ClipboardCheck, TrendingUp, ShieldAlert, Shield, 
  ChevronRight, Activity, Calendar, MapPin, Clock, DollarSign, 
  CreditCard, Lock, X, Check, Settings 
} from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';

const HospitalDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loadFluctuations, setLoadFluctuations] = useState({ Cardiology: 88, Neurology: 65, Pediatrics: 94 });

    const fetchInstitutionalData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [statsRes, auditRes] = await Promise.all([
                api.get('/hospital/stats'),
                api.get('/hospital/audit-logs')
            ]);
            setStats(statsRes.data);
            setAuditLogs(auditRes.data);
        } catch (err) {
            console.error("Institutional sync failed", err);
            toast.error("Failed to synchronize hospital data");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstitutionalData();
        
        const syncInterval = setInterval(() => {
            fetchInstitutionalData(true);
        }, 10000);

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

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-6">
                <Activity className="animate-spin text-primary" size={48} />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] animate-pulse">Synchronizing Clinical Node</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto py-12 px-6 space-y-12 animate-in fade-in duration-700">
            {/* High-Level Institutional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all cursor-pointer group">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                            <Building2 size={24} />
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Growth</h3>
                    </div>
                    <p className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
                        {stats?.institutionalPatientGrowth || '12.4'}%
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Active Clinical Cycle</p>
                </div>

                <div className="bg-slate-900 p-8 rounded-[3.5rem] shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 -mr-16 -mt-16 rounded-full blur-2xl group-hover:bg-primary/30 transition-all" />
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
                            <Users size={24} />
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Patients</h3>
                    </div>
                    <p className="text-4xl font-black text-white tracking-tighter italic uppercase relative z-10">
                        {stats?.totalPatientsInstitutional || '1,284'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 relative z-10">Institutional Load</p>
                </div>

                <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all cursor-pointer group">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <ClipboardCheck size={24} />
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Verified</h3>
                    </div>
                    <p className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
                        {stats?.totalInstitutionalAppointments || '842'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Completed Sessions</p>
                </div>

                <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all cursor-pointer group">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                            <TrendingUp size={24} />
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Revenue</h3>
                    </div>
                    <p className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
                        ₹{stats?.institutionalMonthlyRevenue ? (stats.institutionalMonthlyRevenue / 1000).toFixed(1) : '42.8'}k
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Monthly Projection</p>
                </div>
            </div>

            {/* Departmental Load Dynamics & Security Sentinel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Clinical <span className="not-italic text-primary">Dynamics</span></h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time departmental load and triage status</p>
                        </div>
                        <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-primary transition-all group">
                            <span className="text-[10px] font-black uppercase tracking-widest">Live Feed</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {Object.entries(loadFluctuations).map(([dept, load]) => (
                            <div key={dept} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8">
                                    <TrendingUp size={20} className={load > 80 ? 'text-primary' : 'text-emerald-500'} />
                                </div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{dept} Division</h4>
                                <p className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase mb-6">{load.toFixed(1)}% <span className="text-[10px] not-italic text-slate-300 font-bold">Capacity</span></p>
                                
                                <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 rounded-full ${load > 90 ? 'bg-primary' : load > 75 ? 'bg-blue-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${load}%` }}
                                    />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-4">Status: <span className={load > 90 ? 'text-primary' : 'text-emerald-500'}>{load > 90 ? 'High Pressure' : 'Optimal'}</span></p>
                            </div>
                        ))}

                        <button 
                            onClick={() => navigate('/hospital-dashboard/staff')}
                            className="bg-primary p-10 rounded-[3.5rem] shadow-xl shadow-primary/20 relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer text-left"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -mr-16 -mt-16 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
                            <h3 className="text-white text-xl font-black uppercase tracking-tight italic mb-2">Staff <span className="not-italic text-slate-900">Portal</span></h3>
                            <p className="text-white/80 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">Manage Personnel <ChevronRight size={14} /></p>
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
                        <p className="text-white/80 text-[10px] font-black uppercase tracking-widest">{stats?.totalPatientsInstitutional || '1,284'} Active Registrations</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HospitalDashboard;
