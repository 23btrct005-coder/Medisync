import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, ClipboardCheck, TrendingUp, ShieldAlert, Shield, 
  ChevronRight, Activity, Calendar, MapPin, Clock, DollarSign, 
  CreditCard, Lock, X, Check, Settings, ArrowUpRight, HeartPulse,
  LayoutDashboard, Bell, Megaphone, Send, BrainCircuit, Search, BarChart3
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
    const [aiInsights, setAiInsights] = useState([]);
    const [loadFluctuations, setLoadFluctuations] = useState({ Cardiology: 92.1, Neurology: 67.9, Pediatrics: 92.1 });

    const fetchInstitutionalData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [statsRes, auditRes, aiRes] = await Promise.all([
                api.get('/hospital/stats'),
                api.get('/hospital/audit-logs'),
                api.get('/ai/analytics/current')
            ]);
            setStats(statsRes.data);
            setAuditLogs(auditRes.data);
            setAiInsights(aiRes.data);
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

    const topSpecialties = aiInsights.reduce((acc, log) => {
        const spec = log.detectedSpecialty || 'general';
        acc[spec] = (acc[spec] || 0) + 1;
        return acc;
    }, {});

    const sortedTrends = Object.entries(topSpecialties)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initializing Dashboard...</p>
            </div>
        </div>
    );

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

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sortedTrends.slice(0, 3).map(([name, count], i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Top Patient Demand</p>
                            <p className="text-xl font-black text-slate-900 uppercase italic">{name}</p>
                            <p className="text-xs text-primary font-bold mt-2 flex items-center gap-2">
                                <Activity size={14} /> {count} clinical queries this week
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-primary/10 transition-all">
                            <BrainCircuit size={24} className="text-slate-400 group-hover:text-primary transition-all" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Institutional Broadcast Terminal */}
                <div className="lg:col-span-7">
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
                                    className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-lg focus:ring-2 ring-primary/50 outline-none transition-all placeholder:text-slate-500 resize-none min-h-[200px]"
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
                    </div>
                </div>

                {/* AI SEARCH TRENDS SECTION */}
                <div className="lg:col-span-5">
                    <div className="bg-white border border-slate-100 rounded-[3.5rem] p-10 shadow-sm h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <BarChart3 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">AI Clinical <span className="text-indigo-600 italic">Insights</span></h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Query Dynamics</p>
                                </div>
                            </div>
                            <div className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase">Live Telemetry</div>
                        </div>

                        <div className="flex-1 space-y-6">
                            {sortedTrends.length > 0 ? sortedTrends.map(([spec, count], i) => (
                                <div key={i} className="relative">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{spec}</span>
                                        <span className="text-xs font-black text-indigo-600 italic">{count} Searches</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-1000 ease-out" 
                                            style={{ width: `${(count / aiInsights.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-40">
                                    <Search size={48} className="mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">No search data captured yet</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-10 p-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                             <p className="text-[10px] font-black text-slate-400 uppercase leading-relaxed text-center">
                                Pro Tip: High search volume for specialties you don't offer indicates a market expansion opportunity.
                             </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HospitalDashboard;
