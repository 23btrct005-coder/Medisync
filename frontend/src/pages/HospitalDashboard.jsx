import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, ClipboardCheck, TrendingUp, ShieldAlert, Shield, 
  ChevronRight, Activity, Calendar, MapPin, Clock, DollarSign, 
  CreditCard, Lock, X, Check, Settings, ArrowUpRight, HeartPulse,
  LayoutDashboard, Bell, Megaphone, Send
} from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';

const HospitalDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [sendingBroadcast, setSendingBroadcast] = useState(false);
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

    const handleBroadcast = async () => {
        if (!broadcastMessage.trim()) return;
        setSendingBroadcast(true);
        try {
            await api.post('/hospital/broadcast', { message: broadcastMessage, title: 'Institutional Update' });
            toast.success("Institutional broadcast dispatched to all personnel");
            setBroadcastMessage('');
        } catch (err) {
            toast.error("Failed to transmit broadcast");
        } finally {
            setSendingBroadcast(false);
        }
    };

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



            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Institutional Broadcast Terminal */}
                <div className="lg:col-span-8">
                    <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden group h-full flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 -mr-48 -mt-48 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                        <div className="relative z-10 space-y-10">
                            <div className="flex items-center gap-6">
                                <div className="p-5 bg-white/10 rounded-[2rem] backdrop-blur-md">
                                    <Megaphone size={32} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black uppercase tracking-tight italic">Institutional <span className="text-primary">Broadcast</span></h3>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-1">High-Priority Personnel Notification Terminal</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <textarea
                                    value={broadcastMessage}
                                    onChange={(e) => setBroadcastMessage(e.target.value)}
                                    placeholder="Type high-priority announcement for all onboarded staff..."
                                    className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-lg focus:ring-2 ring-primary/50 outline-none transition-all placeholder:text-slate-500 resize-none min-h-[250px]"
                                />
                                <button
                                    onClick={handleBroadcast}
                                    disabled={sendingBroadcast || !broadcastMessage.trim()}
                                    className="w-full py-7 bg-primary hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-4 active:scale-[0.98]"
                                >
                                    {sendingBroadcast ? <Activity className="animate-spin" size={24} /> : <Send size={24} />}
                                    Dispatch Institutional Announcement
                                </button>
                            </div>
                        </div>

                        <div className="relative z-10 pt-10 border-t border-white/5 flex items-center gap-4 text-slate-500">
                            <ShieldAlert size={20} />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
                                Broadcasts are verified by the institutional security node and visible to all medical staff.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Action Hubs */}
                <div className="lg:col-span-4 space-y-8">
                    <button 
                        onClick={() => navigate('/hospital-dashboard/staff')}
                        className="w-full group bg-blue-600 p-12 rounded-[3.5rem] text-white shadow-xl shadow-blue-500/20 flex flex-col items-start gap-6 hover:scale-[1.02] transition-all relative overflow-hidden min-h-[280px] justify-end"
                    >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 -mr-24 -mt-24 rounded-full group-hover:scale-150 transition-transform duration-700 blur-2xl" />
                        <Users size={48} className="relative z-10" />
                        <div className="relative z-10 text-left">
                            <h3 className="text-4xl font-black uppercase tracking-tight italic">Staff <span className="opacity-60">Portal</span></h3>
                            <p className="text-xs font-black uppercase tracking-widest mt-4 flex items-center gap-2 opacity-80 bg-white/10 px-4 py-2 rounded-full">
                                Manage Personnel <ChevronRight size={16} />
                            </p>
                        </div>
                    </button>

                    <button 
                        className="w-full group bg-slate-900 p-12 rounded-[3.5rem] text-white shadow-xl shadow-slate-900/20 flex flex-col items-start gap-6 hover:scale-[1.02] transition-all relative overflow-hidden min-h-[280px] justify-end"
                    >
                        <div className="absolute bottom-0 right-0 w-48 h-48 bg-primary/10 -mr-24 -mb-24 rounded-full group-hover:scale-150 transition-transform duration-700 blur-2xl" />
                        <DollarSign size={48} className="relative z-10 text-primary" />
                        <div className="relative z-10 text-left">
                            <h3 className="text-4xl font-black uppercase tracking-tight italic">Financial <span className="text-primary opacity-60">Reach</span></h3>
                            <p className="text-xs font-black uppercase tracking-widest mt-4 flex items-center gap-2 opacity-80 bg-primary/10 px-4 py-2 rounded-full">
                                Review Ledger <ChevronRight size={16} />
                            </p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HospitalDashboard;
