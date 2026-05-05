import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Users, Calendar, ArrowUpRight, ArrowDownRight, Activity as Pulse, Zap, Brain, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../api/axiosConfig';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

const HospitalAnalytics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const inflowData = [
        { day: 'Mon', count: 120 },
        { day: 'Tue', count: 150 },
        { day: 'Wed', count: 180 },
        { day: 'Thu', count: 140 },
        { day: 'Fri', count: 210 },
        { day: 'Sat', count: 160 },
        { day: 'Sun', count: 90 },
    ];

    const deptPerformance = [
        { name: 'Cardiology', count: 45, color: '#3b82f6' },
        { name: 'Neurology', count: 32, color: '#6366f1' },
        { name: 'Pediatrics', count: 58, color: '#f43f5e' },
        { name: 'Orthopedics', count: 28, color: '#f59e0b' },
    ];

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await api.get('/hospital/stats');
            setStats(res.data);
        } catch (err) {
            console.error("Failed to fetch institutional analytics", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aggregating Institutional Telemetry...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-12 animate-in fade-in duration-700 text-left">
            <div className="mb-12">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase italic">
                    Inst. <span className="not-italic text-primary">Analytics</span>
                </h1>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2 ml-1">
                    Real-time Institutional Telemetry & Performance Dynamics
                </p>
            </div>

            {/* Top KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Patient Inflow', value: '+12%', icon: <Users />, color: 'bg-blue-500', trend: 'up' },
                    { label: 'Bed Occupancy', value: '84%', icon: <Activity />, color: 'bg-emerald-500', trend: 'up' },
                    { label: 'Avg Wait Time', value: '18m', icon: <Pulse />, color: 'bg-amber-500', trend: 'down' },
                    { label: 'AI Diagnosis', value: '2.4k', icon: <Brain />, color: 'bg-indigo-500', trend: 'up' },
                ].map((kpi, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`w-12 h-12 ${kpi.color} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
                                {kpi.icon}
                            </div>
                            <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${kpi.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {kpi.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {kpi.value}
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">Institutional High</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Area */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Patient <span className="not-italic text-blue-600">Dynamics</span></h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Weekly registration velocity</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-widest rounded-xl text-slate-400">7 Days</button>
                                <button className="px-4 py-2 bg-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl text-white shadow-lg">30 Days</button>
                            </div>
                        </div>
                        <div className="h-[300px] w-full min-h-[300px] relative">
                            <ResponsiveContainer width="100%" height="100%" debounce={100} minWidth={0}>
                                <AreaChart data={inflowData}>
                                    <defs>
                                        <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} dy={10} />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '1rem' }}
                                        labelStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', color: '#64748b', marginBottom: '4px' }}
                                    />
                                    <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorInflow)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 -mr-24 -mt-24 rounded-full blur-3xl" />
                            <div className="relative z-10">
                                <h3 className="text-white text-lg font-black uppercase tracking-tight italic mb-8">AI <span className="text-primary not-italic">Synthesis</span></h3>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-primary">
                                                <Zap size={16} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-slate-300">Accuracy Rate</span>
                                        </div>
                                        <span className="text-sm font-black text-white italic">99.4%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-primary">
                                                <Brain size={16} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-slate-300">Predictive Load</span>
                                        </div>
                                        <span className="text-sm font-black text-white italic">OPTIMAL</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic mb-8">Dept. <span className="not-italic text-rose-500">Pulse</span></h3>
                            <div className="h-[180px] w-full min-h-[180px]">
                                <ResponsiveContainer width="100%" height="100%" debounce={100} minWidth={0}>
                                    <BarChart data={deptPerformance}>
                                        <Bar dataKey="count" radius={[8, 8, 8, 8]}>
                                            {deptPerformance.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                        <XAxis dataKey="name" hide />
                                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap gap-4 mt-6">
                                {deptPerformance.map((dept, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.color }} />
                                        <span className="text-[9px] font-black uppercase text-slate-400">{dept.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats Area */}
                <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic mb-8">Live <span className="not-italic text-amber-500">Availability</span></h3>
                        <div className="space-y-8">
                            {[
                                { label: 'General Ward', value: 85, total: 120, color: 'bg-emerald-500' },
                                { label: 'ICU Beds', value: 42, total: 50, color: 'bg-rose-500' },
                                { label: 'Emergency OT', value: 2, total: 4, color: 'bg-amber-500' },
                            ].map((item, idx) => (
                                <div key={idx} className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <span>{item.label}</span>
                                        <span className="text-slate-800">{item.value}/{item.total} Occupied</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                        <div 
                                            className={`h-full ${item.color} rounded-full transition-all duration-1000`} 
                                            style={{ width: `${(item.value / item.total) * 100}%` }} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-primary p-10 rounded-[3.5rem] shadow-xl shadow-primary/20 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -mr-16 -mt-16 rounded-full blur-2xl group-hover:scale-110 transition-all" />
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <ShieldCheck size={48} className="text-white mb-6 animate-bounce" />
                            <h4 className="text-white text-lg font-black uppercase tracking-tight italic">Audit <span className="text-slate-900 not-italic">Integrity</span></h4>
                            <p className="text-white/80 text-[10px] font-black uppercase tracking-widest mt-2 leading-relaxed">
                                Institutional Ledger is fully synchronized and compliant with HIPAA and DPDP 2024.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HospitalAnalytics;
