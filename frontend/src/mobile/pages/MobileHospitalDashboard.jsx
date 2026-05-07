import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Activity, Users, Calendar, Grid, Wallet, 
  ChevronRight, TrendingUp, UserCheck, Bell,
  PlusCircle, Zap, ShieldCheck, MapPin, Search
} from 'lucide-react';
import api from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MobileHospitalDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHospitalStats = async () => {
            try {
                const res = await api.get('hospital/stats');
                setStats(res.data);
            } catch (err) {
                console.error("Hospital sync failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHospitalStats();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[70vh]">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="text-primary-600">
                <Activity size={40} />
            </motion.div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Institutional Data...</p>
        </div>
    );

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            
            {/* ── INSTITUTIONAL LOAD HUD ── */}
            <motion.div variants={item} className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400 mb-2">Live Institutional Load</p>
                    <div className="flex items-end gap-2">
                        <span className="text-5xl font-black tracking-tighter">{stats?.patientsCount || 0}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase mb-2">Total Patients</span>
                    </div>
                    <div className="mt-6 flex gap-6">
                        <div>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Appointments</p>
                            <p className="text-lg font-black text-white leading-none">{stats?.appointmentsCount || 0}</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Physicians</p>
                            <p className="text-lg font-black text-white leading-none">{stats?.doctorsCount || 0}</p>
                        </div>
                    </div>
                </div>
                <Activity size={180} className="absolute -right-10 -bottom-10 text-white/5 rotate-12" />
            </motion.div>

            {/* ── PRIMARY INSTITUTIONAL TRIGGER ── */}
            <motion.div variants={item}>
                <button 
                    onClick={() => navigate('/hospital-dashboard/services')}
                    className="w-full bg-primary-600 p-6 rounded-[2rem] text-white flex items-center justify-between shadow-xl shadow-primary-600/20 active:scale-[0.98] transition-transform"
                >
                    <div className="flex items-center gap-4 text-left">
                        <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Grid size={24} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Institutional</p>
                            <p className="text-base font-black uppercase leading-none">Service Management</p>
                        </div>
                    </div>
                    <ChevronRight size={20} />
                </button>
            </motion.div>

            {/* ── CORE OPERATIONS GRID ── */}
            <motion.div variants={item} className="grid grid-cols-2 gap-3">
                {[
                    { name: 'Staff Roster', path: '/hospital-dashboard/staff', icon: <UserCheck size={20} />, color: 'bg-emerald-50 text-emerald-600' },
                    { name: 'Financials', path: '/hospital-dashboard/ledger', icon: <Wallet size={20} />, color: 'bg-amber-50 text-amber-600' },
                    { name: 'Analytics', path: '/hospital-dashboard/analytics', icon: <TrendingUp size={20} />, color: 'bg-blue-50 text-blue-600' },
                    { name: 'Onboarding', path: '/hospital-dashboard/staff/onboard', icon: <PlusCircle size={20} />, color: 'bg-indigo-50 text-indigo-600' },
                ].map((s) => (
                    <button 
                        key={s.name}
                        onClick={() => navigate(s.path)}
                        className="bg-white p-5 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-4 active:bg-slate-50 transition-colors"
                    >
                        <div className={`h-12 w-12 ${s.color} rounded-2xl flex items-center justify-center`}>
                            {s.icon}
                        </div>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter leading-none">{s.name}</span>
                    </button>
                ))}
            </motion.div>

            {/* ── INSTITUTIONAL ALERT STREAM ── */}
            <motion.div variants={item} className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Facility Signals</h3>
                <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                    {[
                        { label: 'Security Node', value: 'Verified', icon: <ShieldCheck size={16} />, color: 'text-emerald-500' },
                        { label: 'Clinical Flow', value: 'Stable', icon: <Activity size={16} />, color: 'text-blue-500' },
                    ].map((sig, i) => (
                        <div key={i} className="flex items-center justify-between p-5 border-b border-slate-50 last:border-none">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                    {sig.icon}
                                </div>
                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{sig.label}</span>
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${sig.color}`}>{sig.value}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ── QUICK REPORT EXPORT ── */}
            <motion.button 
                variants={item}
                onClick={() => navigate('/hospital-dashboard/analytics')}
                className="w-full py-5 bg-slate-100 text-slate-600 rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-transform"
            >
                <TrendingUp size={16} />
                Export Institutional Summary
            </motion.button>
        </motion.div>
    );
};

export default MobileHospitalDashboard;
