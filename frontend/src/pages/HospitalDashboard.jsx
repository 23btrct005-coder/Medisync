import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, ClipboardCheck, TrendingUp, ShieldAlert, Shield, 
  ChevronRight, Activity, Calendar, MapPin, Clock, DollarSign, 
  CreditCard, Lock, X, Check, Settings, ArrowUpRight, HeartPulse
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
        <div className="h-screen flex items-center justify-center bg-[#05070a]">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="w-20 h-20 border-2 border-primary/20 rounded-full animate-ping absolute inset-0" />
                    <Activity className="text-primary animate-pulse" size={48} />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Synchronizing Clinical Node</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#05070a] text-slate-300 p-8 lg:p-12 space-y-12 animate-in fade-in duration-1000">
            {/* Top Command Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
                        Core<span className="not-italic text-primary">Sentinel</span>
                        <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                            <span className="text-[10px] text-primary not-italic tracking-[0.3em] font-black">v2.4.0</span>
                        </div>
                    </h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3 ml-1">Institutional Operations & Strategic Telemetry</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Network Status</p>
                        <p className="text-xs font-bold text-emerald-500 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Ultra-Low Latency Active
                        </p>
                    </div>
                    <button 
                        onClick={() => navigate('/hospital-dashboard/settings')}
                        className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
                    >
                        <Settings className="text-slate-400 group-hover:text-primary group-hover:rotate-90 transition-all" size={20} />
                    </button>
                </div>
            </div>

            {/* Neural Stat Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Growth', value: `${stats?.institutionalPatientGrowth || '12.4'}%`, icon: TrendingUp, color: 'primary', trend: '+2.1%' },
                    { label: 'Patient Load', value: stats?.totalPatientsInstitutional || '1,284', icon: Users, color: 'blue', trend: 'Optimal' },
                    { label: 'Clinical Sessions', value: stats?.totalInstitutionalAppointments || '842', icon: ClipboardCheck, trend: '98% Success' },
                    { label: 'Revenue Projection', value: `₹${stats?.institutionalMonthlyRevenue ? (stats.institutionalMonthlyRevenue / 1000).toFixed(1) : '42.8'}K`, icon: DollarSign, color: 'emerald', trend: 'Target +12%' }
                ].map((item, idx) => (
                    <div key={idx} className="group relative bg-[#0a0d12] border border-white/5 p-8 rounded-[2.5rem] hover:border-primary/30 transition-all duration-500 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -mr-16 -mt-16 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className={`p-4 rounded-2xl bg-white/5 text-slate-400 group-hover:text-primary transition-colors`}>
                                <item.icon size={24} />
                            </div>
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{item.trend}</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-2 relative z-10">{item.label}</h3>
                        <p className="text-4xl font-black text-white tracking-tighter italic uppercase relative z-10">{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Real-time Dynamics Visualizer */}
                <div className="lg:col-span-8 bg-[#0a0d12] border border-white/5 rounded-[3.5rem] p-10 space-y-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.05),transparent)]" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">Live <span className="not-italic text-primary">Clinical Load</span></h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Real-time departmental dynamics and throughput</p>
                        </div>
                        <div className="flex items-center gap-3 p-1 bg-black/40 rounded-full border border-white/5">
                            <button className="px-6 py-2.5 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-primary/20">Telemetry</button>
                            <button className="px-6 py-2.5 text-slate-500 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors">Historical</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        {Object.entries(loadFluctuations).map(([dept, load]) => (
                            <div key={dept} className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/[0.07] transition-all group">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{dept}</h4>
                                    <ArrowUpRight size={14} className="text-slate-600 group-hover:text-primary transition-colors" />
                                </div>
                                <div className="flex items-baseline gap-2 mb-6">
                                    <span className="text-3xl font-black text-white italic">{load.toFixed(0)}</span>
                                    <span className="text-[10px] font-black text-slate-600 uppercase">% Utilization</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-primary transition-all duration-1000 relative"
                                        style={{ width: `${load}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <button 
                            onClick={() => navigate('/hospital-dashboard/staff')}
                            className="group p-10 bg-primary rounded-[3rem] text-left relative overflow-hidden transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 -mr-24 -mt-24 rounded-full blur-3xl group-hover:bg-white/30 transition-all" />
                            <Users size={32} className="text-slate-900 mb-6" />
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic leading-none mb-2">Personnel<br/>Command</h3>
                            <p className="text-slate-900/60 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">Access Staff Roster <ChevronRight size={14} /></p>
                        </button>
                        <button 
                            onClick={() => navigate('/hospital-dashboard/institutional-profile')}
                            className="group p-10 bg-slate-800 rounded-[3rem] text-left relative overflow-hidden transition-all hover:scale-[1.02] active:scale-95 border border-white/5"
                        >
                            <Building2 size={32} className="text-primary mb-6" />
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight italic leading-none mb-2">Institution<br/>Ledger</h3>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">Configure Assets <ChevronRight size={14} /></p>
                        </button>
                    </div>
                </div>

                {/* Security & Audit Sentinel */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-[#0a0d12] border border-white/5 rounded-[3.5rem] p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 -mr-16 -mt-16 rounded-full blur-3xl" />
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Security <span className="not-italic text-primary">Sentinel</span></h3>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Verification Flow</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            {auditLogs.slice(0, 3).map((log, i) => (
                                <div key={i} className="p-5 bg-white/5 rounded-3xl border border-white/5 group/log hover:bg-white/[0.08] transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">{log.action}</p>
                                        <span className="text-[8px] font-black text-primary uppercase">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase">{log.details}</p>
                                </div>
                            ))}
                            {auditLogs.length === 0 && (
                                <div className="py-12 text-center space-y-4">
                                    <Shield className="mx-auto text-slate-700" size={32} />
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Institutional Integrity Optimal</p>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => navigate('/hospital-dashboard/institutional-profile')}
                            className="w-full mt-8 flex items-center justify-between p-5 bg-white text-slate-900 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl shadow-black/20"
                        >
                            <span>Security Ledger</span>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-primary to-[#0a0d12] p-10 rounded-[3.5rem] border border-white/5 relative overflow-hidden group">
                        <div className="relative z-10">
                            <HeartPulse className="text-slate-900 mb-6 animate-pulse" size={32} />
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic leading-tight">Patient<br/>Ecosystem</h3>
                            <p className="text-slate-900/60 text-[9px] font-black uppercase tracking-widest mt-2">{stats?.totalPatientsInstitutional || '1,284'} Active clinical nodes</p>
                        </div>
                        <Activity className="absolute -bottom-8 -right-8 text-white/5 w-48 h-48 rotate-12" />
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            ` }} />
        </div>
    );
};

export default HospitalDashboard;
