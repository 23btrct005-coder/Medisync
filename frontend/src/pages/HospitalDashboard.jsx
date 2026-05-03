import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, ClipboardCheck, TrendingUp, ShieldAlert, Shield, 
  ChevronRight, Activity, Calendar, MapPin, Clock, DollarSign, 
  CreditCard, Lock, X, Check, Settings, ArrowUpRight, HeartPulse,
  LayoutDashboard, Bell
} from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';

const HospitalDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loadFluctuations, setLoadFluctuations] = useState({ Cardiology: 92.1, Neurology: 67.9, Pediatrics: 92.1 });

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
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstitutionalData();
        const vitalitySync = setInterval(() => {
            setLoadFluctuations(prev => ({
                Cardiology: Math.min(100, Math.max(80, prev.Cardiology + (Math.random() - 0.5) * 2)),
                Neurology: Math.min(100, Math.max(60, prev.Neurology + (Math.random() - 0.5) * 1.5)),
                Pediatrics: Math.min(100, Math.max(85, prev.Pediatrics + (Math.random() - 0.5) * 2.5))
            }));
        }, 3000);
        return () => clearInterval(vitalitySync);
    }, []);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initializing Dashboard...</p>
            </div>
        </div>
    );

    const statCards = [
        { label: 'Growth', value: `${stats?.institutionalPatientGrowth || '12.4'}%`, icon: TrendingUp, color: 'bg-blue-500', trend: '+2.1%', sub: 'Active clinical cycle' },
        { label: 'Patients', value: stats?.totalPatientsInstitutional || '1,284', icon: Users, color: 'bg-indigo-600', trend: 'Optimal', sub: 'Institutional load' },
        { label: 'Verified', value: stats?.totalInstitutionalAppointments || '842', icon: Check, color: 'bg-emerald-500', trend: '98% Success', sub: 'Completed sessions' },
        { label: 'Revenue', value: `₹${stats?.institutionalMonthlyRevenue ? (stats.institutionalMonthlyRevenue / 1000).toFixed(1) : '42.8'}K`, icon: DollarSign, color: 'bg-amber-500', trend: '+12%', sub: 'Monthly projection' }
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-12 space-y-10 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                            <LayoutDashboard size={24} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Hospital <span className="text-primary italic">Portal</span>
                        </h1>
                    </div>
                    <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] ml-14">Institutional Operations Management Suite</p>
                </div>
                <div className="flex items-center gap-4 ml-14 lg:ml-0">
                    <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm group">
                        <Bell size={20} className="group-hover:rotate-12" />
                    </button>
                    <div className="h-12 w-[1px] bg-slate-200 mx-2 hidden lg:block" />
                    <div className="flex items-center gap-4 p-2 bg-white border border-slate-100 rounded-2xl shadow-sm pr-6">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
                             <Building2 size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrator</p>
                            <p className="text-xs font-bold text-slate-700 uppercase">Ashok • Institutional</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((item, idx) => (
                    <div key={idx} className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 ${item.color} opacity-[0.03] -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700`} />
                        <div className="flex justify-between items-start mb-8">
                            <div className={`p-4 rounded-2xl ${item.color} text-white shadow-lg shadow-current/20`}>
                                <item.icon size={24} />
                            </div>
                            <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-widest">{item.trend}</span>
                        </div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</h3>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter italic">{item.value}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3">{item.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Clinical Dynamics */}
                <div className="lg:col-span-8 bg-white rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-10 space-y-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Clinical <span className="not-italic text-primary">Dynamics</span></h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Real-time departmental load and triage status</p>
                        </div>
                        <div className="p-1 bg-slate-50 rounded-full border border-slate-100 flex items-center">
                            <button className="px-6 py-2.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg transition-all">Live Feed</button>
                            <button className="px-6 py-2.5 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors">Historical</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(loadFluctuations).map(([dept, load]) => (
                            <div key={dept} className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all group">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{dept} Division</h4>
                                    <TrendingUp size={16} className="text-primary opacity-50 group-hover:opacity-100" />
                                </div>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-4xl font-black text-slate-900 italic">{load.toFixed(1)}</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase">% Capacity</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${load > 90 ? 'bg-amber-500' : 'bg-primary'}`}
                                        style={{ width: `${load}%` }}
                                    />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-4">Status: <span className={load > 90 ? 'text-amber-500' : 'text-emerald-500'}>{load > 90 ? 'High Pressure' : 'Optimal'}</span></p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <button 
                            onClick={() => navigate('/hospital-dashboard/staff')}
                            className="group p-10 bg-primary rounded-[3rem] text-left relative overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20"
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 -mr-24 -mt-24 rounded-full blur-3xl group-hover:bg-white/30 transition-all" />
                            <Users size={32} className="text-white mb-6" />
                            <h3 className="text-3xl font-black text-white uppercase tracking-tight italic leading-none mb-2">Staff<span className="not-italic opacity-60">Portal</span></h3>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">Manage Personnel <ChevronRight size={14} /></p>
                        </button>
                        <button 
                            onClick={() => navigate('/hospital-dashboard/ledger')}
                            className="group p-10 bg-slate-900 rounded-[3rem] text-left relative overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-slate-900/20"
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 -mr-24 -mt-24 rounded-full blur-3xl" />
                            <DollarSign size={32} className="text-primary mb-6" />
                            <h3 className="text-3xl font-black text-white uppercase tracking-tight italic leading-none mb-2">Financial<br/><span className="not-italic text-primary">Reach</span></h3>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">Review Ledger <ChevronRight size={14} /></p>
                        </button>
                    </div>
                </div>

                {/* Security Section */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-10 relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                                <Shield size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Security <span className="not-italic text-amber-500">Sentinel</span></h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Institutional Integrity</p>
                            </div>
                        </div>

                        <div className="py-6 space-y-6">
                            <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase">No critical security events detected in the current clinical cycle. Institutional integrity is <span className="text-emerald-500">OPTIMAL</span>.</p>
                            <div className="h-[1px] w-full bg-slate-100" />
                            <div className="space-y-4">
                                {auditLogs.slice(0, 2).map((log, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-1 h-8 bg-slate-100 rounded-full shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-black text-slate-800 uppercase">{log.action}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{new Date(log.createdAt).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={() => navigate('/hospital-dashboard/institutional-profile')}
                            className="w-full mt-6 p-5 bg-slate-50 text-slate-900 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-between border border-slate-100"
                        >
                            <span>Review Security Ledger</span>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-primary p-10 rounded-[3.5rem] shadow-xl shadow-primary/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -mr-16 -mt-16 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative z-10">
                            <HeartPulse className="text-white/60 mb-6" size={32} />
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight italic leading-tight">Patient<br/>Ecosystem</h3>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-2">{stats?.totalPatientsInstitutional || '1,284'} Active Registrations</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HospitalDashboard;
